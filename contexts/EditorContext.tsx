'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { FountainElementType } from '@/utils/fountain';
import { useScreenplay } from './ScreenplayContext';
import { parseContentForImport } from '@/utils/fountainAutoImport';
import { saveToGitHub } from '@/utils/github';
import { useAuth, useUser } from '@clerk/nextjs';
import { createScreenplay, updateScreenplay, getScreenplay } from '@/utils/screenplayStorage';
import { getCurrentScreenplayId, setCurrentScreenplayId, migrateFromLocalStorage } from '@/utils/clerkMetadata';
import { toast } from 'sonner';
import { broadcastCursorPosition, clearCursorPosition, getCursorPositions } from '@/utils/cursorPositionStorage';
import { CursorPosition } from '@/types/collaboration';
import { useEditorLock } from '@/hooks/useEditorLock';
// ConflictResolutionModal removed - using "last write wins" strategy instead

interface EditorState {
    // Current document content
    content: string;
    
    // Current cursor position
    cursorPosition: number;
    
    // Current selection (for text operations)
    selectionStart: number;
    selectionEnd: number;
    
    // Current line and element type
    currentLine: number;
    currentElementType: FountainElementType;
    lastNavigationTime?: number; // Timestamp to force re-navigation to same line
    
    // Document metadata
    title: string;
    author: string;
    lastSaved: Date | null;
    isDirty: boolean; // Has unsaved changes
    
    // Editor settings
    isFocusMode: boolean;
    showLineNumbers: boolean;
    fontSize: number; // in px
    
    // Undo/Redo history
    undoStack: Array<{ content: string; cursorPosition: number; timestamp: number }>;
    redoStack: Array<{ content: string; cursorPosition: number; timestamp: number }>;
    canUndo: boolean;
    canRedo: boolean;
    
    // Highlight for inserted text
    highlightRange: { start: number; end: number } | null;
}

interface EditorContextType {
    state: EditorState;
    
    // Content operations
    setContent: (content: string, markDirty?: boolean) => void;
    insertText: (text: string, position?: number) => void;
    replaceSelection: (text: string, start: number, end: number) => void;
    
    // Undo operations
    undo: () => void;
    redo: () => void;
    pushToUndoStack: (snapshot?: { content: string; cursorPosition: number }) => void;
    
    // Cursor and selection operations
    setCursorPosition: (position: number) => void;
    setSelection: (start: number, end: number) => void;
    setCurrentLine: (line: number, programmatic?: boolean) => void;
    setCurrentElementType: (type: FountainElementType) => void;
    
    // Document operations
    setTitle: (title: string) => void;
    setAuthor: (author: string) => void;
    markSaved: () => void;
    markDirty: () => void;
    saveNow: () => Promise<boolean>;
    
    // Editor settings
    toggleFocusMode: () => void;
    toggleLineNumbers: () => void;
    setFontSize: (size: number) => void;
    
    // Highlight operations
    setHighlightRange: (range: { start: number; end: number } | null) => void;
    clearHighlight: () => void;
    
    // Utility
    reset: () => void;
    
    // Feature 0132: Check if there are unsaved changes (for logout/tab close warnings)
    hasUnsavedChanges: () => boolean;
    
    // Feature 0134: Other users' cursor positions (for collaborative editing)
    otherUsersCursors: CursorPosition[];
    
    // Feature 0134: Last synced content from server (for cursor position calculations)
    // This is separate from state.content which includes unsaved local changes
    lastSyncedContent: string;
    
    // Editor fullscreen mode (hides navigation)
    isEditorFullscreen: boolean;
    setIsEditorFullscreen: (value: boolean) => void;
    
    // Feature 0187: Editor Lock for Multi-Device Conflict Prevention
    isEditorLocked: boolean; // True if locked by same user on different device
    isCollaboratorEditing: boolean; // True if different user has lock
    lockedBy: string | null; // Display name of user who has lock
}

const defaultState: EditorState = {
    content: '',
    cursorPosition: 0,
    selectionStart: 0,
    selectionEnd: 0,
    currentLine: 1,
    currentElementType: 'action',
    title: 'Untitled Screenplay',
    author: 'Anonymous', // Backend requires author field
    lastSaved: null,
    isDirty: false,
    isFocusMode: false,
    showLineNumbers: false,
    fontSize: 16,
    undoStack: [],
    redoStack: [],
    canUndo: false,
    canRedo: false,
    highlightRange: null,
};

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function EditorProviderInner({ children, projectId }: { children: ReactNode; projectId: string | null }) {
    const [state, setState] = useState<EditorState>(defaultState);
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const githubSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true); // Prevent auto-clear during initial import
    
    // Feature 0187: Editor Lock for Multi-Device Conflict Prevention
    // Lock is per screenplayId - each screenplay has its own independent lock
    const {
        isLocked,
        isCollaboratorEditing,
        lockedBy,
        acquireLock,
        releaseLock,
        sendHeartbeat
    } = useEditorLock(projectId);
    
    // 🔥 FIX 1: Guard pattern - track which screenplay_id we've loaded (like ScreenplayContext)
    // Stores the last screenplay_id (or 'no-id') that we initialized for
    const hasInitializedRef = useRef<string | false>(false);
    
    // 🔥 FIX 2: Track previous projectId to only reset when it actually changes
    const previousProjectIdRef = useRef<string | null>(null);
    
    // Feature 0111: DynamoDB Storage
    const { getToken } = useAuth();
    const { user } = useUser(); // Feature 0119: Get user for Clerk metadata
    const pathname = usePathname(); // Check if we're on the editor page
    const screenplayIdRef = useRef<string | null>(null);
    const localSaveCounterRef = useRef(0);
    // Feature 0133: Track screenplay version for optimistic locking
    // Using a ref (not state) because:
    // 1. Version doesn't need to trigger re-renders (performance optimization)
    // 2. It's metadata tied to the screenplay, not UI state
    // 3. Follows the same pattern as screenplayIdRef and other metadata refs
    // 4. Must be reset when switching screenplays (each screenplay has its own version)
    const screenplayVersionRef = useRef<number | null>(null);
    
    // Conflict state removed - using "last write wins" strategy
    // Feature 0134: Cursor position broadcasting for collaborative editing
    const lastBroadcastedCursorRef = useRef<{ position: number; selectionStart?: number; selectionEnd?: number; timestamp: number } | null>(null);
    const cursorBroadcastTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cursorIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cursorHeartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isBroadcastingRef = useRef(false);
    
    // Feature 0134: Store other users' cursor positions (for rendering)
    const [otherUsersCursors, setOtherUsersCursors] = useState<CursorPosition[]>([]);
    const previousOtherUsersCursorsRef = useRef<CursorPosition[]>([]); // Track previous cursors for deep comparison
    
    // Feature 0134: Track last synced content from server (for cursor position calculations)
    // This is separate from state.content which includes unsaved local changes
    // When calculating collaborator cursor positions, we use this instead of state.content
    // to prevent cursors from moving incorrectly when the current user types
    const [lastSyncedContent, setLastSyncedContent] = useState<string>('');
    
    // Create refs to hold latest state values without causing interval restart
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);
    
    // Feature 0132: Per-screenplay localStorage helper functions
    // Generate per-screenplay localStorage key (e.g., 'screenplay_draft_${screenplayId}')
    // Falls back to global key if screenplayId is null (backward compatibility)
    const getScreenplayStorageKey = useCallback((key: string, screenplayId: string | null): string => {
        if (!screenplayId) {
            return key; // Backward compatibility for legacy data
        }
        return `${key}_${screenplayId}`;
    }, []);
    
    // Clear all localStorage keys for a specific screenplay
    const clearScreenplayStorage = useCallback((screenplayId: string | null): void => {
        if (!screenplayId || typeof window === 'undefined') {
            return;
        }
        
        // Clear per-screenplay keys
        localStorage.removeItem(getScreenplayStorageKey('screenplay_draft', screenplayId));
        localStorage.removeItem(getScreenplayStorageKey('screenplay_title', screenplayId));
        localStorage.removeItem(getScreenplayStorageKey('screenplay_author', screenplayId));
        
        console.log('[EditorContext] 🗑️ Cleared localStorage for screenplay:', screenplayId);
    }, [getScreenplayStorageKey]);
    
    // Get GitHub config from localStorage (optional export feature)
    const screenplay = useScreenplay();
    const githubConfigStr = typeof window !== 'undefined' ? localStorage.getItem('screenplay_github_config') : null;
    const githubConfig = githubConfigStr ? JSON.parse(githubConfigStr) : null;
    
    // Manual save function - defined before setContent so it can be used in dependencies
    const saveNow = useCallback(async () => {
        // Feature 0187: Check if editor is locked before saving
        if (isLocked) {
            console.warn('[EditorContext] ⚠️ Save blocked - editor is locked by another device');
            toast.error('Editor is locked by another device. Cannot save.');
            return false;
        }
        
        const currentState = stateRef.current;
        const contentLength = currentState.content.length;
        const contentTrimmed = currentState.content.trim();
        
        console.log('[EditorContext] 💾 Manual save triggered (content length:', contentLength, 'chars)');
        
        try {
            // Feature 0130: Use projectId from URL as source of truth (must be screenplay_ ID)
            // Priority: projectId from URL > screenplayIdRef.current
            // This ensures we always save to the correct screenplay when switching
            let activeScreenplayId: string | null = null;
            
            if (projectId) {
                // Feature 0130: Only accept screenplay_ IDs - reject proj_ IDs
                if (projectId.startsWith('screenplay_')) {
                    activeScreenplayId = projectId;
                    console.log('[EditorContext] Using screenplay_id from URL:', activeScreenplayId);
                } else if (projectId.startsWith('proj_')) {
                    console.warn('[EditorContext] ⚠️ Rejected proj_ ID in saveNow (legacy format):', projectId);
                    // Use ref as fallback, but log warning
                    activeScreenplayId = screenplayIdRef.current;
                    console.warn('[EditorContext] ⚠️ Using screenplay_id from ref instead:', activeScreenplayId);
                } else {
                    console.warn('[EditorContext] ⚠️ Invalid ID format in URL:', projectId);
                    activeScreenplayId = screenplayIdRef.current;
                }
            } else {
                // No projectId in URL - use ref (fallback for when no URL param)
                activeScreenplayId = screenplayIdRef.current;
                console.log('[EditorContext] No projectId in URL, using screenplay_id from ref:', activeScreenplayId);
            }
            
            // Feature 0132: Save to per-screenplay localStorage
            // Use activeScreenplayId if available, otherwise use null (backward compatibility)
            const storageId = activeScreenplayId || screenplayIdRef.current;
            const draftKey = getScreenplayStorageKey('screenplay_draft', storageId);
            const titleKey = getScreenplayStorageKey('screenplay_title', storageId);
            const authorKey = getScreenplayStorageKey('screenplay_author', storageId);
            
            localStorage.setItem(draftKey, currentState.content);
            localStorage.setItem(titleKey, currentState.title);
            localStorage.setItem(authorKey, currentState.author);
            console.log('[EditorContext] ✅ Saved to localStorage (key:', draftKey, ')');
            
            // Save to DynamoDB immediately
            if (!activeScreenplayId) {
                // Create new screenplay in DynamoDB
                console.log('[EditorContext] Creating NEW screenplay in DynamoDB...');
                const newScreenplay = await createScreenplay({
                    title: currentState.title,
                    author: currentState.author,
                    content: currentState.content
                }, getToken);
                
                activeScreenplayId = newScreenplay.screenplay_id;
                screenplayIdRef.current = activeScreenplayId; // Update ref to keep in sync
                
                // Feature 0119: Save to Clerk metadata (also saves to localStorage for backward compatibility)
                try {
                    await setCurrentScreenplayId(user, activeScreenplayId);
                } catch (error) {
                    console.error('[EditorContext] ⚠️ Failed to save screenplay_id to Clerk metadata, using localStorage fallback:', error);
                    // setCurrentScreenplayId already saved to localStorage as fallback
                }
                
                // Trigger storage event manually for ScreenplayContext to pick it up
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'current_screenplay_id',
                    newValue: activeScreenplayId,
                    oldValue: null,
                    storageArea: localStorage,
                    url: window.location.href
                }));
                
                console.log('[EditorContext] ✅ Created NEW screenplay:', activeScreenplayId, '| Content:', contentLength, 'chars');
                
                // 🔥 FIX: Update lastSyncedContent when creating new screenplay
                setLastSyncedContent(currentState.content);
                
                // Feature 0117: No setTimeout or structure save needed - caller will handle it with explicit ID
            } else {
                // Update existing screenplay - use the activeScreenplayId we determined above
                console.log('[EditorContext] Updating EXISTING screenplay:', activeScreenplayId, '| Content:', contentLength, 'chars');
                
                // 🔥 CRITICAL FIX: Validate version ref matches current screenplay before using it
                // If screenplayIdRef doesn't match activeScreenplayId, the version ref is stale (from different screenplay)
                // In this case, don't send expectedVersion - let the backend handle it (will auto-increment)
                const versionRefIsValid = screenplayIdRef.current === activeScreenplayId;
                
                if (!versionRefIsValid) {
                    console.warn('[EditorContext] ⚠️ Version ref is stale (different screenplay)!');
                    console.warn('[EditorContext] ⚠️ screenplayIdRef.current:', screenplayIdRef.current, '| activeScreenplayId:', activeScreenplayId);
                    console.warn('[EditorContext] ⚠️ Resetting version ref and not sending expectedVersion to prevent false conflicts');
                    screenplayVersionRef.current = null; // Reset stale version ref
                }
                
                // 🔥 SIMPLIFIED: "Last write wins" strategy - no conflict modal
                // Always use force=true to bypass version checking
                // Future: Will implement cursor position sharing to prevent conflicts naturally
                const updateParams: any = {
                    screenplay_id: activeScreenplayId,
                    title: currentState.title,
                    author: currentState.author,
                    content: currentState.content,
                    force: true // Always force save - last write wins
                };
                
                // Keep version tracking for future cursor position sharing feature
                // But don't use it for conflict detection (we use force=true instead)
                if (screenplayVersionRef.current !== null && versionRefIsValid) {
                    // Log version for debugging, but don't send expectedVersion
                    console.log('[EditorContext] Current version:', screenplayVersionRef.current, '(not used for conflict detection - using last write wins)');
                }
                
                try {
                    const updated = await updateScreenplay(updateParams, getToken);
                    
                    // Feature 0133: Update version ref after successful save
                    if (updated && updated.version !== undefined) {
                        let newVersion: number;
                        if (typeof updated.version === 'string') {
                            newVersion = parseFloat(updated.version) || 1;
                        } else {
                            newVersion = updated.version || 1;
                        }
                        screenplayVersionRef.current = newVersion;
                        console.log('[EditorContext] ✅ Version updated to:', newVersion);
                    }
                    
                    // Update ref to keep in sync (in case it was different)
                    screenplayIdRef.current = activeScreenplayId;
                    
                    // 🔥 FIX: Update lastSyncedContent after successful save
                    setLastSyncedContent(currentState.content);
                    
                    // Feature 0187: Send heartbeat after successful save to keep lock alive
                    if (activeScreenplayId) {
                        sendHeartbeat().catch(err => {
                            console.debug('[EditorContext] Heartbeat failed after save (non-critical):', err);
                        });
                    }
                    
                    console.log('[EditorContext] ✅ Updated screenplay content:', activeScreenplayId, '| Saved', contentLength, 'chars');
                } catch (error: any) {
                    // 🔥 SIMPLIFIED: "Last write wins" - if save fails, just log and retry with force
                    // No conflict modal - conflicts are rare and will be prevented by cursor position sharing (future)
                    console.warn('[EditorContext] ⚠️ Save failed, retrying with force (last write wins):', error);
                    
                    // Retry with force=true (bypasses any version checks)
                    try {
                        const forceUpdateParams: any = {
                            screenplay_id: activeScreenplayId,
                            title: currentState.title,
                            author: currentState.author,
                            content: currentState.content,
                            force: true // Always force - last write wins
                        };
                        
                        const updated = await updateScreenplay(forceUpdateParams, getToken);
                        if (updated && updated.version !== undefined) {
                            let newVersion: number;
                            if (typeof updated.version === 'string') {
                                newVersion = parseFloat(updated.version) || 1;
                            } else {
                                newVersion = updated.version || 1;
                            }
                            screenplayVersionRef.current = newVersion;
                            screenplayIdRef.current = activeScreenplayId;
                        }
                        
                        // 🔥 FIX: Update lastSyncedContent after successful retry save
                        setLastSyncedContent(currentState.content);
                        
                        console.log('[EditorContext] ✅ Successfully saved with force (last write wins)');
                    } catch (retryError) {
                        console.error('[EditorContext] ❌ Retry save failed:', retryError);
                        throw retryError;
                    }
                }
                
                // Feature 0117: No structure save needed here - handled separately by callers
            }
            
            // Mark as saved
            setState(prev => ({
                ...prev,
                lastSaved: new Date(),
                isDirty: false
            }));
            
            // 🔥 FIX: No sync-after-save needed - guard pattern prevents unnecessary reloads
            // Immediate save pattern ensures data is saved, and guard pattern prevents
            // overwriting recent edits with stale DB data (like characters/locations pattern)
            
            // Reset the auto-save counter since we just saved manually
            localSaveCounterRef.current = 0;
            
            return true;
        } catch (error: any) {
            console.error('[EditorContext] Manual save failed:', error);
            throw error; // Let the caller handle the error
        }
    }, [getToken, screenplay, projectId, user]);
    
    // Content operations
    // 🔥 FIX: Save immediately after content change (like characters/locations pattern)
    // Debounce to avoid too many API calls (3 seconds)
    const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);
    
    // 🔥 FIX: Store saveNow in a ref so it doesn't trigger useEffect re-runs
    // This prevents the debounce timer from being cleared when saveNow is recreated
    const saveNowRef = useRef<typeof saveNow | null>(null);
    
    // 🔥 FIX: Update ref whenever saveNow changes (so debounce can use latest version)
    useEffect(() => {
        saveNowRef.current = saveNow;
    }, [saveNow]);
    
    // 🔥 UNDO/REDO TRACKING: Industry-standard debounced undo tracking (500ms)
    // Groups continuous typing into single undo steps, breaks on cursor movement
    // Separate from save logic - does not interfere with saving
    const undoDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const previousContentForUndoRef = useRef<string>('');
    const previousCursorForUndoRef = useRef<number>(0);
    const pendingUndoSnapshotRef = useRef<{ content: string; cursorPosition: number; timestamp: number } | null>(null);
    
    const setContent = useCallback((content: string, markDirty: boolean = true) => {
        // Feature 0187: Check if editor is locked before allowing edits
        if (isLocked && markDirty) {
            console.warn('[EditorContext] ⚠️ Edit blocked - editor is locked by another device');
            return; // Don't allow edits if locked
        }
        
        setState(prev => {
            const currentCursor = prev.cursorPosition ?? 0;
            const previousContent = previousContentForUndoRef.current;
            const previousCursor = previousCursorForUndoRef.current;
            
            // 🔥 UNDO/REDO TRACKING: Track changes for undo stack (industry standard: 500ms debounce)
            // Only track if content actually changed and it's a user-initiated change (markDirty=true)
            if (markDirty && content !== previousContent) {
                // Check if cursor moved significantly (breaks undo group)
                // Industry standard: cursor movement > 1 character away breaks the group
                const cursorMoved = Math.abs(currentCursor - previousCursor) > 1;
                
                // If cursor moved significantly, push previous state immediately and start new group
                if (cursorMoved && previousContent !== '' && pendingUndoSnapshotRef.current) {
                    // Push the pending snapshot (from previous typing session)
                    const snapshotToPush = pendingUndoSnapshotRef.current;
                    const newUndoStack = [...prev.undoStack, snapshotToPush].slice(-50); // Keep last 50 states
                    
                    console.log('[EditorContext] 🔄 Cursor moved - breaking undo group, pushing snapshot');
                    
                    // Clear pending snapshot and start new group
                    pendingUndoSnapshotRef.current = {
                        content: previousContent,
                        cursorPosition: previousCursor,
                        timestamp: Date.now()
                    };
                    
                    // Clear redo stack when new action is performed
                    return {
                        ...prev,
                        content,
                        isDirty: markDirty ? true : prev.isDirty,
                        undoStack: newUndoStack,
                        redoStack: [],
                        canUndo: true,
                        canRedo: false
                    };
                }
                
                // If this is the first change in a typing session, save current state as checkpoint
                if (!pendingUndoSnapshotRef.current) {
                    pendingUndoSnapshotRef.current = {
                        content: previousContent || prev.content,
                        cursorPosition: (previousCursor ?? prev.cursorPosition) ?? 0,
                        timestamp: Date.now()
                    };
                }
                
                // Clear existing undo debounce timer
                if (undoDebounceRef.current) {
                    clearTimeout(undoDebounceRef.current);
                    undoDebounceRef.current = null;
                }
                
                // Debounce undo tracking (500ms - industry standard for grouping keystrokes)
                // This groups continuous typing into single undo steps
                undoDebounceRef.current = setTimeout(() => {
                    if (pendingUndoSnapshotRef.current) {
                        setState(currentState => {
                            // Only push if content is different from snapshot (user kept typing)
                            if (currentState.content !== pendingUndoSnapshotRef.current!.content) {
                                const newUndoStack = [...currentState.undoStack, pendingUndoSnapshotRef.current!].slice(-50);
                                
                                console.log('[EditorContext] 📝 Pushed to undo stack (debounced, grouped typing). Stack size:', newUndoStack.length);
                                
                                // Clear pending snapshot
                                pendingUndoSnapshotRef.current = null;
                                
                                // Update previous refs for next typing session
                                previousContentForUndoRef.current = currentState.content;
                                previousCursorForUndoRef.current = currentState.cursorPosition ?? 0;
                                
                                return {
                                    ...currentState,
                                    undoStack: newUndoStack,
                                    redoStack: [], // Clear redo stack when new action is performed
                                    canUndo: true,
                                    canRedo: false
                                };
                            }
                            return currentState;
                        });
                    }
                    undoDebounceRef.current = null;
                }, 500); // 500ms debounce - industry standard
            }
            
            // Update previous refs for next comparison
            previousContentForUndoRef.current = content;
            previousCursorForUndoRef.current = currentCursor;
            
            return {
                ...prev,
                content,
                isDirty: markDirty ? true : prev.isDirty
            };
        });
        
        // 🔥 BEST PRACTICE: Save to localStorage immediately, debounce database saves (3 seconds)
        // This matches Google Docs/VS Code pattern: immediate local cache, debounced cloud save
        if (markDirty && content.trim().length > 0) {
            const activeId = projectId || screenplayIdRef.current;
            if (activeId && activeId.startsWith('screenplay_')) {
                // Save to localStorage immediately (synchronous, guaranteed - like Google Docs local cache)
                const draftKey = getScreenplayStorageKey('screenplay_draft', activeId);
                const titleKey = getScreenplayStorageKey('screenplay_title', activeId);
                const authorKey = getScreenplayStorageKey('screenplay_author', activeId);
                try {
                    localStorage.setItem(draftKey, content);
                    localStorage.setItem(titleKey, stateRef.current.title);
                    localStorage.setItem(authorKey, stateRef.current.author);
                } catch (err) {
                    console.error('[EditorContext] localStorage save failed:', err);
                }
                
                // Clear existing debounce timer
                if (saveDebounceRef.current) {
                    console.log('[EditorContext] 🧹 Clearing existing debounce timer');
                    clearTimeout(saveDebounceRef.current);
                    saveDebounceRef.current = null;
                }
                
                // Debounce database save (3 seconds - best practice, balances API calls vs responsiveness)
                // This matches Google Docs/VS Code: debounce cloud saves, immediate local cache
                // Use saveNow() for normal saves (has proper error handling and state updates)
                console.log('[EditorContext] ⏱️ Setting debounce timer (3 seconds) for screenplay:', activeId);
                // 🔥 FIX: Capture content and timestamp when timer is set, not when it fires
                // This ensures we save the content that triggered the debounce, even if isDirty is cleared
                const contentToSave = content;
                const titleToSave = stateRef.current.title;
                const authorToSave = stateRef.current.author;
                
                saveDebounceRef.current = setTimeout(async () => {
                    console.log('[EditorContext] ⏰ Debounce timer fired! Checking if save is needed...');
                    const currentState = stateRef.current;
                    const activeId = projectId || screenplayIdRef.current;
                    
                    // 🔥 FIX: Check if content has changed since timer was set
                    // If content is different, user kept typing - don't save old content
                    // If content matches, save it (even if isDirty was cleared by something else)
                    const contentChanged = currentState.content !== contentToSave;
                    
                    console.log('[EditorContext] 🔍 Debounce check:', {
                        activeId,
                        isDirty: currentState.isDirty,
                        contentLength: currentState.content.trim().length,
                        capturedContentLength: contentToSave.trim().length,
                        contentChanged,
                        isValidId: activeId && activeId.startsWith('screenplay_'),
                        saveNowRefExists: !!saveNowRef.current
                    });
                    
                    // Save if:
                    // 1. Valid screenplay ID
                    // 2. Content hasn't changed (user stopped typing)
                    // 3. Content is not empty
                    if (activeId && activeId.startsWith('screenplay_') && !contentChanged && contentToSave.trim().length > 0) {
                        console.log('[EditorContext] 💾 Debounced save triggered (3-second interval)');
                        try {
                            // 🔥 FIX: Use saveNowRef.current instead of saveNow directly
                            // This ensures we use the latest version without triggering useEffect re-runs
                            if (saveNowRef.current) {
                                await saveNowRef.current();
                                console.log('[EditorContext] ✅ Debounced save complete');
                            } else {
                                console.error('[EditorContext] ⚠️ saveNowRef.current is null - cannot save');
                            }
                        } catch (err) {
                            console.error('[EditorContext] ⚠️ Debounced save failed:', err);
                            // localStorage already saved, so data is preserved
                            // Unmount handler will retry with fetch keepalive if needed
                        }
                    } else {
                        console.log('[EditorContext] ⏭️ Debounce save skipped:', {
                            reason: !activeId ? 'no activeId' : 
                                   !activeId.startsWith('screenplay_') ? 'invalid ID format' :
                                   contentChanged ? 'content changed (user kept typing)' :
                                   contentToSave.trim().length === 0 ? 'empty content' : 'unknown'
                        });
                    }
                    saveDebounceRef.current = null; // Clear ref after timer fires
                }, 3000); // 3-second debounce (best practice: balances API calls vs responsiveness)
                console.log('[EditorContext] ✅ Debounce timer set, ID:', saveDebounceRef.current);
            } else {
                console.log('[EditorContext] ⏸️ Save skipped - no screenplay ID yet');
            }
        }
    }, [projectId, getScreenplayStorageKey]); // 🔥 FIX: Removed saveNow from dependencies - using saveNowRef instead
    
    const insertText = useCallback((text: string, position?: number) => {
        // 🔥 UNDO/REDO TRACKING: Clear pending undo snapshot when explicitly inserting
        // This prevents double-pushing when AI or programmatic insertions happen
        if (undoDebounceRef.current) {
            clearTimeout(undoDebounceRef.current);
            undoDebounceRef.current = null;
        }
        pendingUndoSnapshotRef.current = null;
        
        setState(prev => {
            // CRITICAL: Push current state to undo stack BEFORE making changes
            const currentSnapshot = {
                content: prev.content,
                cursorPosition: prev.cursorPosition ?? 0,
                timestamp: Date.now()
            };
            
            // Push to undo stack (this will clear redo stack)
            const newUndoStack = [...prev.undoStack, currentSnapshot].slice(-50);
            
            // Update refs
            previousContentForUndoRef.current = prev.content;
            previousCursorForUndoRef.current = prev.cursorPosition ?? 0;
            
            const pos = position ?? prev.cursorPosition;
            const before = prev.content.substring(0, pos);
            const after = prev.content.substring(pos);
            const newContent = before + text + after;
            
            console.log('[EditorContext] insertText - pushed to undo stack, setting highlightRange:', { start: pos, end: pos + text.length });
            
            return {
                ...prev,
                content: newContent,
                cursorPosition: pos + text.length,
                isDirty: true,
                highlightRange: { start: pos, end: pos + text.length },
                undoStack: newUndoStack,
                redoStack: [], // Clear redo stack when new action is performed
                canUndo: true,
                canRedo: false
            };
        });
    }, []);
    
    const replaceSelection = useCallback((text: string, start: number, end: number) => {
        console.log('[EditorContext] 📝 replaceSelection called - text length:', text.length, 'endsWith newline:', text.endsWith('\n'));
        console.log('[EditorContext] 📝 Text preview (last 20 chars):', JSON.stringify(text.slice(-20)));
        
        // 🔥 UNDO/REDO TRACKING: Clear pending undo snapshot when explicitly replacing
        // This prevents double-pushing when AI or programmatic replacements happen
        if (undoDebounceRef.current) {
            clearTimeout(undoDebounceRef.current);
            undoDebounceRef.current = null;
        }
        pendingUndoSnapshotRef.current = null;
        
        setState(prev => {
            // CRITICAL: Push current state to undo stack BEFORE making changes
            const currentSnapshot = {
                content: prev.content,
                cursorPosition: prev.cursorPosition ?? 0,
                timestamp: Date.now()
            };
            
            // Push to undo stack (this will clear redo stack)
            const newUndoStack = [...prev.undoStack, currentSnapshot].slice(-50);
            
            // Update refs
            previousContentForUndoRef.current = prev.content;
            previousCursorForUndoRef.current = prev.cursorPosition ?? 0;
            
            const before = prev.content.substring(0, start);
            const after = prev.content.substring(end);
            const newContent = before + text + after;
            
            console.log('[EditorContext] 📝 New content length:', newContent.length);
            console.log('[EditorContext] 📝 New content preview (around insertion):', JSON.stringify(newContent.substring(Math.max(0, start - 10), start + text.length + 10)));
            console.log('[EditorContext] ✅ replaceSelection - pushed to undo stack, setting highlightRange:', { start, end: start + text.length });
            
            return {
                ...prev,
                content: newContent,
                cursorPosition: start + text.length,
                isDirty: true,
                highlightRange: { start, end: start + text.length },
                undoStack: newUndoStack,
                redoStack: [], // Clear redo stack when new action is performed
                canUndo: true,
                canRedo: false
            };
        });
    }, []);
    
    // Undo operations
    const pushToUndoStack = useCallback((snapshot?: { content: string; cursorPosition: number }) => {
        // 🔥 UNDO/REDO TRACKING: Clear pending undo snapshot when explicitly pushing
        if (undoDebounceRef.current) {
            clearTimeout(undoDebounceRef.current);
            undoDebounceRef.current = null;
        }
        pendingUndoSnapshotRef.current = null;
        
        setState(prev => {
            const snapshotToSave = snapshot || {
                content: prev.content,
                cursorPosition: prev.cursorPosition
            };
            
            // Keep only last 50 undo states to prevent memory issues (increased from 10 for better UX)
            const newUndoStack = [...prev.undoStack, { ...snapshotToSave, timestamp: Date.now() }].slice(-50);
            
            // Update refs
            previousContentForUndoRef.current = snapshotToSave.content;
            previousCursorForUndoRef.current = snapshotToSave.cursorPosition ?? 0;
            
            console.log('[EditorContext] Pushed to undo stack. Stack size:', newUndoStack.length);
            
            return {
                ...prev,
                undoStack: newUndoStack,
                redoStack: [], // Clear redo stack when new action is performed
                canUndo: true,
                canRedo: false
            };
        });
    }, []);
    
    const undo = useCallback(() => {
        setState(prev => {
            if (prev.undoStack.length === 0) {
                console.warn('[EditorContext] No undo history available');
                return prev;
            }
            
            // 🔥 UNDO/REDO TRACKING: Clear any pending undo snapshot when explicitly undoing
            // This prevents double-pushing when user clicks undo button
            if (undoDebounceRef.current) {
                clearTimeout(undoDebounceRef.current);
                undoDebounceRef.current = null;
            }
            pendingUndoSnapshotRef.current = null;
            
            // Save current state to redo stack before undoing
            const currentState = {
                content: prev.content,
                cursorPosition: prev.cursorPosition,
                timestamp: Date.now()
            };
            
            // Pop the last state from the undo stack
            const newUndoStack = [...prev.undoStack];
            const previousState = newUndoStack.pop();
            
            if (!previousState) return prev;
            
            // Push current state to redo stack
            const newRedoStack = [...prev.redoStack, currentState].slice(-50);
            
            // Update refs to match new state
            previousContentForUndoRef.current = previousState.content;
            previousCursorForUndoRef.current = previousState.cursorPosition ?? 0;
            
            console.log('[EditorContext] Undoing. Undo stack:', newUndoStack.length, 'Redo stack:', newRedoStack.length);
            
            // 🔥 FIX: Check if content after undo has no scenes, and delete scenes if so
            // This ensures scenes are removed when user undoes an import
            const contentAfterUndo = previousState.content;
            if (contentAfterUndo && screenplay) {
                try {
                    const parseResult = parseContentForImport(contentAfterUndo);
                    if (!parseResult || parseResult.scenes.length === 0) {
                        // Content has no scenes - delete all scenes from ScreenplayContext
                        console.log('[EditorContext] Content after undo has no scenes - deleting all scenes');
                        const currentScenes = screenplay.scenes || [];
                        if (currentScenes.length > 0 && screenplay.screenplayId) {
                            // Delete all scenes asynchronously (don't block undo)
                            (async () => {
                                try {
                                    const { deleteAllScenes } = await import('@/utils/screenplayStorage');
                                    await deleteAllScenes(screenplay.screenplayId!, getToken);
                                    console.log('[EditorContext] ✅ Deleted all scenes after undo');
                                    
                                    // Clear scenes from state
                                    screenplay.setScenes?.([]);
                                    
                                    // Rebuild relationships with empty scenes
                                    if (screenplay.updateRelationships) {
                                        await screenplay.updateRelationships();
                                    }
                                } catch (error) {
                                    console.error('[EditorContext] Failed to delete scenes after undo:', error);
                                }
                            })();
                        }
                    }
                } catch (error) {
                    // If parsing fails, don't block undo - just log the error
                    console.warn('[EditorContext] Failed to parse content after undo:', error);
                }
            }
            
            return {
                ...prev,
                content: previousState.content,
                cursorPosition: previousState.cursorPosition,
                undoStack: newUndoStack,
                redoStack: newRedoStack,
                canUndo: newUndoStack.length > 0,
                canRedo: true,
                isDirty: true
            };
        });
    }, [screenplay, getToken]);
    
    const redo = useCallback(() => {
        setState(prev => {
            if (prev.redoStack.length === 0) {
                console.warn('[EditorContext] No redo history available');
                return prev;
            }
            
            // 🔥 UNDO/REDO TRACKING: Clear any pending undo snapshot when explicitly redoing
            if (undoDebounceRef.current) {
                clearTimeout(undoDebounceRef.current);
                undoDebounceRef.current = null;
            }
            pendingUndoSnapshotRef.current = null;
            
            // Save current state to undo stack before redoing
            const currentState = {
                content: prev.content,
                cursorPosition: prev.cursorPosition,
                timestamp: Date.now()
            };
            
            // Pop the last state from the redo stack
            const newRedoStack = [...prev.redoStack];
            const nextState = newRedoStack.pop();
            
            if (!nextState) return prev;
            
            // Push current state to undo stack
            const newUndoStack = [...prev.undoStack, currentState].slice(-50);
            
            // Update refs to match new state
            previousContentForUndoRef.current = nextState.content;
            previousCursorForUndoRef.current = nextState.cursorPosition ?? 0;
            
            console.log('[EditorContext] Redoing. Undo stack:', newUndoStack.length, 'Redo stack:', newRedoStack.length);
            
            return {
                ...prev,
                content: nextState.content,
                cursorPosition: nextState.cursorPosition,
                undoStack: newUndoStack,
                redoStack: newRedoStack,
                canUndo: true,
                canRedo: newRedoStack.length > 0,
                isDirty: true
            };
        });
    }, []);
    
    // Cursor and selection operations
    const setCursorPosition = useCallback((position: number) => {
        setState(prev => {
            const previousCursor = previousCursorForUndoRef.current;
            const currentCursor = prev.cursorPosition ?? 0;
            
            // 🔥 UNDO/REDO TRACKING: Break undo group if cursor moved significantly
            // Industry standard: cursor movement breaks typing groups
            if (Math.abs(position - previousCursor) > 1 && pendingUndoSnapshotRef.current) {
                // Push pending snapshot before cursor move
                const snapshotToPush = pendingUndoSnapshotRef.current;
                const newUndoStack = [...prev.undoStack, snapshotToPush].slice(-50);
                
                console.log('[EditorContext] 🔄 Cursor position changed - breaking undo group');
                
                // Clear pending snapshot and update refs
                pendingUndoSnapshotRef.current = null;
                previousContentForUndoRef.current = prev.content;
                previousCursorForUndoRef.current = position;
                
                // Clear redo stack when new action is performed
                return {
                    ...prev,
                    cursorPosition: position,
                    undoStack: newUndoStack,
                    redoStack: [],
                    canUndo: true,
                    canRedo: false
                };
            }
            
            // Update previous cursor ref
            previousCursorForUndoRef.current = position;
            
            return { ...prev, cursorPosition: position };
        });
    }, []);
    
    const setSelection = useCallback((start: number, end: number) => {
        setState(prev => ({ 
            ...prev, 
            selectionStart: start, 
            selectionEnd: end,
            cursorPosition: start // Update cursor to match selection start
        }));
    }, []);
    
    const setCurrentLine = useCallback((line: number, programmatic: boolean = false) => {
        setState(prev => ({ 
            ...prev, 
            currentLine: line,
            // Only set lastNavigationTime for programmatic navigation (sidebar clicks)
            lastNavigationTime: programmatic ? Date.now() : prev.lastNavigationTime
        }));
    }, []);
    
    const setCurrentElementType = useCallback((type: FountainElementType) => {
        setState(prev => ({ ...prev, currentElementType: type }));
    }, []);
    
    // Document operations
    const setTitle = useCallback((title: string) => {
        setState(prev => ({ ...prev, title, isDirty: true }));
    }, []);
    
    const setAuthor = useCallback((author: string) => {
        setState(prev => ({ ...prev, author, isDirty: true }));
    }, []);
    
    const markSaved = useCallback(() => {
        setState(prev => ({
            ...prev,
            lastSaved: new Date(),
            isDirty: false
        }));
    }, []);
    
    const markDirty = useCallback(() => {
        setState(prev => ({ ...prev, isDirty: true }));
    }, []);
    
    // Editor settings
    const toggleFocusMode = useCallback(() => {
        setState(prev => ({ ...prev, isFocusMode: !prev.isFocusMode }));
    }, []);
    
    const toggleLineNumbers = useCallback(() => {
        setState(prev => ({ ...prev, showLineNumbers: !prev.showLineNumbers }));
    }, []);
    
    const setFontSize = useCallback((size: number) => {
        setState(prev => ({ ...prev, fontSize: size }));
    }, []);
    
    // Highlight operations
    const setHighlightRange = useCallback((range: { start: number; end: number } | null) => {
        setState(prev => ({ ...prev, highlightRange: range }));
    }, []);
    
    const clearHighlight = useCallback(() => {
        setState(prev => ({ ...prev, highlightRange: null }));
    }, []);
    
    // Utility
    const reset = useCallback(() => {
        setState(defaultState);
    }, []);
    
    // Feature 0132: Check if there are unsaved changes (for logout/tab close warnings)
    const hasUnsavedChanges = useCallback(() => {
        const currentState = stateRef.current;
        return currentState.isDirty && currentState.content.trim().length > 0;
    }, []);
    
    const value: EditorContextType = {
        state,
        setContent,
        insertText,
        replaceSelection,
        undo,
        redo,
        pushToUndoStack,
        setCursorPosition,
        setSelection,
        setCurrentLine,
        setCurrentElementType,
        setTitle,
        setAuthor,
        markSaved,
        markDirty,
        saveNow,
        toggleFocusMode,
        toggleLineNumbers,
        setFontSize,
        setHighlightRange,
        isEditorFullscreen,
        setIsEditorFullscreen,
        clearHighlight,
        reset,
        hasUnsavedChanges,
        otherUsersCursors, // Feature 0134: Expose other users' cursor positions
        lastSyncedContent, // Feature 0134: Last synced content from server (for cursor position calculations)
        // Feature 0187: Editor Lock state
        isEditorLocked: isLocked,
        isCollaboratorEditing,
        lockedBy
    };
    
    // ========================================================================
    // 🔥 FEATURE 0116: AUTO-SAVE STRATEGY
    // ========================================================================
    // 
    // **Two-tier save strategy:**
    // 1. localStorage (2-second debounce) - Crash protection, saves text only
    // 2. DynamoDB (60-second interval) - Full persistence, saves text + structure
    //
    // **Manual Save Button:**
    // - Always available for immediate save
    // - Saves content + structure in one atomic operation
    // - Clear feedback: "Saving..." → "Saved!" or "Error"
    //
    // ========================================================================
    
    // Tier 1: Draft recovery - Save content to per-screenplay localStorage with 2-second debounce
    useEffect(() => {
        if (state.content.length === 0) return; // Don't save empty content
        
        const debounceTimer = setTimeout(() => {
            try {
                // Feature 0132: Use per-screenplay localStorage keys
                const storageId = screenplayIdRef.current || projectId;
                const draftKey = getScreenplayStorageKey('screenplay_draft', storageId);
                const titleKey = getScreenplayStorageKey('screenplay_title', storageId);
                const authorKey = getScreenplayStorageKey('screenplay_author', storageId);
                
                localStorage.setItem(draftKey, state.content);
                localStorage.setItem(titleKey, state.title);
                localStorage.setItem(authorKey, state.author);
                console.log('[EditorContext] 💾 Draft saved to localStorage (crash protection, key:', draftKey, ')');
            } catch (err) {
                console.error('[EditorContext] localStorage draft save failed:', err);
            }
        }, 2000); // 2-second debounce (crash protection only)
        
        return () => clearTimeout(debounceTimer);
    }, [state.content, state.title, state.author, getScreenplayStorageKey, projectId]);
    
    // Tier 2: Auto-save to DynamoDB every 60 seconds
    useEffect(() => {
        if (!state.isDirty) return; // Only save if there are changes
        
        const autoSaveInterval = setInterval(async () => {
            const currentState = stateRef.current;
            
            // Skip if empty or not dirty
            if (currentState.content.trim().length === 0 || !currentState.isDirty) {
                return;
            }
            
            console.log('[EditorContext] 🤖 Auto-save triggered (60-second interval)');
            
            try {
                await saveNow();
                console.log('[EditorContext] ✅ Auto-save complete');
            } catch (err) {
                console.error('[EditorContext] ⚠️ Auto-save failed (will retry in 60s):', err);
                // Don't show error toast for auto-save failures
                // User can manually save if needed
            }
        }, 60000); // Every 60 seconds
        
        return () => clearInterval(autoSaveInterval);
    }, [state.isDirty, saveNow]);
    
    // Feature 0132: Save on unmount/navigation to ensure changes persist before logout
    // Uses localStorage (guaranteed) + async save (best effort) + beforeunload warning
    useEffect(() => {
        // Helper: Save to localStorage (synchronous, guaranteed)
        const saveToLocalStorage = (activeId: string, content: string, title: string, author: string) => {
            const draftKey = getScreenplayStorageKey('screenplay_draft', activeId);
            const titleKey = getScreenplayStorageKey('screenplay_title', activeId);
            const authorKey = getScreenplayStorageKey('screenplay_author', activeId);
            localStorage.setItem(draftKey, content);
            localStorage.setItem(titleKey, title);
            localStorage.setItem(authorKey, author);
            console.log('[EditorContext] 💾 Saved to localStorage (key:', draftKey, ')');
        };

        // Helper: Attempt async save to DynamoDB (best effort)
        // Uses direct fetch with keepalive (same pattern as handleBeforeUnload)
        // This ensures the request continues even after page unloads
        const attemptAsyncSave = (activeId: string, currentState: EditorState) => {
            if (activeId && activeId.startsWith('screenplay_')) {
                console.log('[EditorContext] 💾 Attempting async save to DynamoDB via /api/screenplays/autosave...', {
                    screenplay_id: activeId,
                    contentLength: currentState.content.length,
                    title: currentState.title
                });
                const saveData = {
                    screenplay_id: activeId,
                    title: currentState.title,
                    author: currentState.author,
                    content: currentState.content
                };
                
                // Use fetch with keepalive for guaranteed delivery
                // This will continue even after the page unloads
                // Note: keepalive has a 64KB limit, but screenplay content should be fine
                fetch('/api/screenplays/autosave', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(saveData),
                    keepalive: true // Critical: ensures request continues after page unloads
                }).then(() => {
                    console.log('[EditorContext] ✅ Async save request sent (keepalive)');
                }).catch((err) => {
                    console.error('[EditorContext] ⚠️ Async save failed (localStorage backup preserved):', err);
                    // Silent fail - localStorage already saved, so data is preserved
                });
            } else {
                console.warn('[EditorContext] ⚠️ Cannot save - invalid or missing screenplay ID:', activeId);
            }
        };

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            const currentState = stateRef.current;
            const activeId = projectId || screenplayIdRef.current;
            
            // Check if there are unsaved changes
            if (currentState.isDirty && currentState.content.trim().length > 0 && activeId) {
                // Save to localStorage immediately (synchronous, guaranteed)
                saveToLocalStorage(activeId, currentState.content, currentState.title, currentState.author);
                
                // Show browser warning (user can choose to stay and save)
                // Modern browsers ignore custom messages, but still show a warning
                event.preventDefault();
                event.returnValue = ''; // Chrome requires returnValue to be set
                
                // Attempt async save with keepalive (continues after page unloads)
                // Use fetch with keepalive flag for guaranteed delivery
                // This is best-effort - localStorage already saved above
                if (activeId.startsWith('screenplay_')) {
                    const saveData = {
                        screenplay_id: activeId,
                        title: currentState.title,
                        author: currentState.author,
                        content: currentState.content
                    };
                    
                    // Use fetch with keepalive for guaranteed delivery
                    // This will continue even after the page unloads
                    // Note: keepalive has a 64KB limit, but screenplay content should be fine
                    fetch('/api/screenplays/autosave', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(saveData),
                        keepalive: true // Critical: ensures request continues after page unloads
                    }).catch(() => {
                        // Silent fail - localStorage already saved, so data is preserved
                    });
                }
            }
        };

        const handleVisibilityChange = () => {
            // Save when page becomes hidden (user switching tabs, closing, etc.)
            // This gives us more time than beforeunload
            if (document.visibilityState === 'hidden') {
                const currentState = stateRef.current;
                const activeId = projectId || screenplayIdRef.current;
                
                if (currentState.isDirty && currentState.content.trim().length > 0 && activeId) {
                    // Save to localStorage (guaranteed)
                    saveToLocalStorage(activeId, currentState.content, currentState.title, currentState.author);
                    
                    // Attempt async save (best effort - has more time than beforeunload)
                    attemptAsyncSave(activeId, currentState);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            console.log('[EditorContext] 🧹 useEffect cleanup running - removing event listeners');
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            
            // 🔥 BEST PRACTICE (per Stack Overflow articles): Always check for unsaved changes on unmount
            // Don't just check if debounce is pending - check if there are actual unsaved changes
            // The debounce might have fired but not completed, or might not have fired yet
            const currentState = stateRef.current;
            const activeId = projectId || screenplayIdRef.current;
            
            // Clear any pending debounce (we're saving now if needed)
            if (saveDebounceRef.current) {
                console.log('[EditorContext] ⚠️ Clearing debounce timer in useEffect cleanup (timer ID:', saveDebounceRef.current, ')');
                clearTimeout(saveDebounceRef.current);
                saveDebounceRef.current = null;
            }
            
            // 🔥 UNDO/REDO TRACKING: Clear undo debounce timer on cleanup (prevents memory leaks)
            if (undoDebounceRef.current) {
                console.log('[EditorContext] 🧹 Clearing undo debounce timer in cleanup');
                clearTimeout(undoDebounceRef.current);
                undoDebounceRef.current = null;
            }
            // Clear pending snapshot
            pendingUndoSnapshotRef.current = null;
            
            // Always save if there are unsaved changes (matches best practices from articles)
            if (activeId && activeId.startsWith('screenplay_') && currentState.isDirty && currentState.content.trim().length > 0) {
                console.log('[EditorContext] 🚨 Unmount: Saving unsaved changes (flushing debounce if pending)');
                // Save to localStorage (guaranteed - synchronous)
                saveToLocalStorage(activeId, currentState.content, currentState.title, currentState.author);
                // Save to database using fetch keepalive (ensures completion even after page unloads)
                // This matches best practices: use fetch keepalive for beforeunload/unmount saves
                attemptAsyncSave(activeId, currentState);
            }
        };
    }, [projectId, getScreenplayStorageKey]); // 🔥 FIX: Removed saveNow from dependencies - using saveNowRef instead
    
    // Monitor editor content and clear data if editor is cleared (EDITOR = SOURCE OF TRUTH)
    // DISABLED: This logic is too aggressive and causes data loss
    // If user accidentally deletes content or page loads slowly, entire screenplay gets deleted
    // useEffect(() => {
    //     // Skip auto-clear during initial load/import
    //     if (isInitialLoadRef.current) {
    //         return;
    //     }
    //     
    //     const trimmedContent = state.content.trim();
    //     const lineCount = state.content.split('\n').filter(line => line.trim()).length;
    //     
    //     // If editor is essentially empty (< 3 non-empty lines OR < 20 characters total)
    //     const isEffectivelyEmpty = lineCount < 3 || trimmedContent.length < 20;
    //     
    //     if (isEffectivelyEmpty) {
    //         // Debounce: Wait 1 second before clearing to avoid clearing right after paste
    //         const clearTimer = setTimeout(() => {
    //             // Check if we actually have data to clear
    //             const hasScenes = screenplay?.beats?.some(beat => beat.scenes && beat.scenes.length > 0);
    //             const hasCharacters = screenplay?.characters && screenplay.characters.length > 0;
    //             const hasLocations = screenplay?.locations && screenplay.locations.length > 0;
    //             
    //             if (hasScenes || hasCharacters || hasLocations) {
    //                 console.log('[EditorContext] 🗑️ Editor cleared - clearing all screenplay data');
    //                 screenplay?.clearAllData();
    //             }
    //         }, 1000); // 1 second delay
    //         
    //         return () => clearTimeout(clearTimer);
    //     }
    // }, [state.content, screenplay]);
    
    // 🔥 FIX 2: Only reset when projectId actually changes to a DIFFERENT screenplay
    // Don't reset when returning to the same screenplay (preserves state during navigation)
    useEffect(() => {
        const previousProjectId = previousProjectIdRef.current;
        const currentProjectId = projectId;
        const lastLoadedScreenplayId = screenplayIdRef.current;
        
        // Only reset if projectId actually changed
        if (previousProjectId !== currentProjectId) {
            console.log('[EditorContext] projectId changed:', previousProjectId, '→', currentProjectId, '| lastLoaded:', lastLoadedScreenplayId);
            
            // 🔥 CRITICAL FIX: Check if we're actually switching to a DIFFERENT screenplay
            // If screenplayIdRef is null (e.g., after refresh), check if we have content
            // to see if this is the same screenplay we were working on
            let isActuallyDifferentScreenplay = false;
            
            if (currentProjectId === null) {
                // Navigating away - preserve state
                console.log('[EditorContext] 🚪 Navigating away - preserving state and guard');
                previousProjectIdRef.current = currentProjectId;
                return; // Don't clear anything
            }
            
            if (lastLoadedScreenplayId === null) {
                // Ref is null (e.g., after refresh) - check if we have content in state or localStorage
                // If we have content, assume it's for the current screenplay and don't clear
                const hasExistingContent = stateRef.current.content.trim().length > 0;
                // Feature 0132: Check per-screenplay localStorage for current projectId
                const currentDraftKey = getScreenplayStorageKey('screenplay_draft', currentProjectId);
                const hasLocalStorageContent = typeof window !== 'undefined' && 
                                               localStorage.getItem(currentDraftKey)?.trim().length > 0;
                
                if (hasExistingContent || hasLocalStorageContent) {
                    // We have existing content - assume it's for the current screenplay
                    // Don't clear, let the load effect handle it (it will merge with localStorage if newer)
                    console.log('[EditorContext] 🔄 Ref is null but have existing content - preserving state, will reload from DB');
                    isActuallyDifferentScreenplay = false; // Don't clear
                } else {
                    // No existing content - this is a fresh load, allow it
                    console.log('[EditorContext] 🔄 Ref is null and no existing content - allowing fresh load');
                    isActuallyDifferentScreenplay = true; // Allow clear (fresh load)
                }
            } else {
                // Ref is set - compare IDs directly
                isActuallyDifferentScreenplay = currentProjectId !== lastLoadedScreenplayId;
            }
            
            if (isActuallyDifferentScreenplay) {
                console.log('[EditorContext] 🔄 Switching to different screenplay - clearing state and resetting guard');
                // Feature 0132: DON'T clear old screenplay's localStorage when switching away
                // localStorage preserves unsaved changes - only clear on delete or when loading new screenplay
                // The old screenplay's localStorage will be preserved for when user returns
                
                // Reset initialization guard to allow loading new screenplay
                hasInitializedRef.current = false;
                screenplayIdRef.current = null;
                // Feature 0133: Reset version ref when switching screenplays (each screenplay has its own version)
                screenplayVersionRef.current = null;
                // Feature 0134: Reset lastSyncedContent when switching screenplays
                setLastSyncedContent('');
                setState(defaultState);
            } else {
                // Same screenplay (or preserving existing content) - preserve state
                console.log('[EditorContext] 🔙 Same screenplay or preserving content - preserving state, will reload from DB if needed');
                // Reset guard to allow reload, but don't clear state
                // The load effect will merge with existing state/localStorage
                hasInitializedRef.current = false;
                // Feature 0133: Reset version ref to ensure it gets re-initialized from DB (handles stale version refs)
                screenplayVersionRef.current = null;
            }
            
            // Update previous ref
            previousProjectIdRef.current = currentProjectId;
        }
    }, [projectId, getScreenplayStorageKey, clearScreenplayStorage]);
    
    // Feature 0111: Load screenplay from DynamoDB (or localStorage as fallback) on mount
    useEffect(() => {
        // 🔥 FIX 1: Guard pattern - check if already initialized for this screenplay (like ScreenplayContext)
        const initKey = projectId || screenplayIdRef.current || 'no-id';
        
        // If we previously initialized with 'no-id' but now have a real ID, reset the guard
        if (hasInitializedRef.current === 'no-id' && (projectId || screenplayIdRef.current)) {
            console.log('[EditorContext] 🔄 Screenplay ID became available - resetting initialization guard');
            hasInitializedRef.current = false; // Reset to allow initialization
        }
        
        // 🔥 FIX 1: Check guard BEFORE any async operations to prevent duplicate loads
        // Guard pattern prevents unnecessary reloads that would overwrite recent edits
        // (Same pattern as characters/locations - no sync-after-save needed)
        if (hasInitializedRef.current === initKey) {
            console.log('[EditorContext] ⏭️ Already initialized for:', initKey, '- skipping load');
            return; // Already loaded for this screenplay - don't reload!
        }
        
        // Wait for screenplay context and user to be ready
        if (!screenplay || !user) {
            return;
        }
        
        // 🔥 FIX 1: Set guard IMMEDIATELY to prevent re-entry during async operations
        console.log('[EditorContext] 🚀 Starting initialization for:', initKey);
        hasInitializedRef.current = initKey;
        
        async function loadContent() {
            try {
                // Feature 0130: If a screenplay ID is specified in URL, load it directly
                if (projectId) {
                    try {
                        console.log('[EditorContext] 🎬 Screenplay specified in URL:', projectId);
                        
                        // Feature 0130: Only accept screenplay_ IDs - reject proj_ IDs
                        if (projectId.startsWith('proj_')) {
                            console.warn('[EditorContext] ⚠️ Rejected proj_ ID (legacy format):', projectId);
                            console.warn('[EditorContext] ⚠️ Please use screenplay_ ID instead. Legacy project IDs are no longer supported.');
                            // Continue with normal load flow (don't throw - let user see empty editor)
                        } else if (projectId.startsWith('screenplay_')) {
                            // It's a screenplay ID - load it directly
                            console.log('[EditorContext] Loading screenplay directly from URL...', projectId);
                            
                            // 🔥 FIX 1: Set screenplayIdRef IMMEDIATELY (before async load)
                            // This ensures saveNow() can find the ID even if load is still in progress
                            screenplayIdRef.current = projectId;
                            console.log('[EditorContext] ✅ Set screenplayIdRef immediately:', projectId);
                            
                            const screenplay = await getScreenplay(projectId, getToken);
                            
                            // 🔥 FIX: Check if screenplay is deleted before loading
                            if (screenplay && screenplay.status === 'deleted') {
                                console.error('[EditorContext] ⚠️ Attempted to load deleted screenplay:', projectId);
                                // Redirect to dashboard
                                if (typeof window !== 'undefined') {
                                    window.location.href = '/dashboard';
                                }
                                return;
                            }
                            
                            if (screenplay) {
                                const dbContentLength = screenplay.content?.length || 0;
                                // Feature 0133: Store version for optimistic locking (same pattern as Clerk metadata path)
                                // Handle backward compatibility: convert string version to number if needed
                                let version: number;
                                if (typeof screenplay.version === 'string') {
                                    version = parseFloat(screenplay.version) || 1;
                                    console.log(`[EditorContext] ⚠️ Converting legacy string version '${screenplay.version}' to number ${version}`);
                                } else {
                                    version = screenplay.version || 1;
                                }
                                screenplayVersionRef.current = version;
                                
                                console.log('[EditorContext] ✅ Loaded screenplay from URL:', {
                                    screenplayId: screenplay.screenplay_id,
                                    title: screenplay.title,
                                    contentLength: dbContentLength,
                                    version: version,
                                    hasContent: !!screenplay.content,
                                    contentPreview: screenplay.content?.substring(0, 100) || '(empty)'
                                });
                                
                                if (!screenplay.content || screenplay.content.trim().length === 0) {
                                    console.warn('[EditorContext] ⚠️ Screenplay loaded but content is empty! This might indicate a save issue.');
                                } else {
                                    console.log('[EditorContext] 📄 Database content loaded successfully:', dbContentLength, 'characters');
                                }
                                
                                // screenplayIdRef already set above
                                
                                // Feature 0187: Acquire editor lock when screenplay loads
                                if (projectId) {
                                    acquireLock().catch(err => {
                                        console.warn('[EditorContext] Failed to acquire lock on load (non-critical):', err);
                                        // Don't block loading if lock acquisition fails
                                    });
                                }
                                
                                // Save to Clerk metadata
                                try {
                                    await setCurrentScreenplayId(user, projectId);
                                } catch (error) {
                                    console.error('[EditorContext] ⚠️ Failed to save screenplay_id to Clerk metadata:', error);
                                }
                                
                                // Feature 0132: Check per-screenplay localStorage for newer content (handles DynamoDB eventual consistency)
                                const draftKey = getScreenplayStorageKey('screenplay_draft', projectId);
                                const titleKey = getScreenplayStorageKey('screenplay_title', projectId);
                                const localStorageContent = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
                                const localStorageTitle = typeof window !== 'undefined' ? localStorage.getItem(titleKey) : null;
                                const hasLocalStorageContent = localStorageContent && localStorageContent.trim().length > 0;
                                
                                // 🔥 FIX: Prefer database content on fresh load (when localStorage is empty)
                                // Only use localStorage if it exists AND is different from DB (for eventual consistency)
                                const dbContent = screenplay.content || '';
                                const dbTitle = screenplay.title || 'Untitled Screenplay';
                                
                                let contentToUse: string;
                                let titleToUse: string;
                                
                                // 🔥 SIMPLE PATTERN (like characters/locations): Database is source of truth
                                // localStorage is only for crash recovery, not preference
                                if (hasLocalStorageContent && localStorageContent !== dbContent) {
                                    // localStorage has unsaved changes - use it (will be saved on next save)
                                    console.log('[EditorContext] 🔄 Using localStorage (has unsaved changes, key:', draftKey, ')');
                                    contentToUse = localStorageContent;
                                    titleToUse = localStorageTitle || dbTitle;
                                } else {
                                    // Use database (source of truth) - matches characters/locations pattern
                                    console.log('[EditorContext] ✅ Using database content (source of truth)');
                                    contentToUse = dbContent;
                                    titleToUse = dbTitle;
                                }
                                
                                // Update state with screenplay data (preferring localStorage if available)
                                setState(prev => ({
                                    ...prev,
                                    title: titleToUse,
                                    content: contentToUse,
                                    author: screenplay.author || prev.author,
                                    isDirty: hasLocalStorageContent && localStorageContent !== screenplay.content // Mark dirty if using localStorage
                                }));
                                
                                // 🔥 FIX: Update lastSyncedContent with the database content (source of truth)
                                // This is what we use for cursor position calculations, not the local state.content
                                // Always use dbContent (synced from server), not contentToUse (which may include unsaved changes)
                                setLastSyncedContent(dbContent);
                                
                                console.log('[EditorContext] ✅ Loaded screenplay from URL:', projectId);
                                isInitialLoadRef.current = false;
                                // 🔥 FIX 3: Mark as initialized after successful load
                                hasInitializedRef.current = initKey;
                                return; // Success - screenplay loaded!
                            } else {
                                // 🔥 FIX: getScreenplay returned null (404) - treat as error and prevent fallback
                                console.error('[EditorContext] ❌ Screenplay not found (404):', projectId);
                                toast.error('Screenplay not found. It may have been deleted.');
                                // Don't load anything - show empty editor
                                hasInitializedRef.current = initKey;
                                return; // Exit early - don't fall back to Clerk metadata
                            }
                        } else {
                            console.warn('[EditorContext] ⚠️ Invalid ID format in URL:', projectId);
                            console.warn('[EditorContext] ⚠️ Expected screenplay_* format');
                        }
                    } catch (error) {
                        console.error('[EditorContext] ❌ Error loading screenplay from URL:', error);
                        
                        // 🔥 FIX: If URL parameter is present, don't fall back to Clerk metadata
                        // Show error instead - user explicitly requested this screenplay
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        const errorResponse = (error as any)?.response;
                        const statusCode = errorResponse?.status;
                        
                        const isPermissionError = statusCode === 403 || 
                                                  errorMessage.includes('403') || 
                                                  errorMessage.includes('Forbidden') || 
                                                  errorMessage.includes('access') ||
                                                  errorMessage.includes('permission');
                        
                        if (isPermissionError) {
                            toast.error('You don\'t have access to this screenplay. Please contact the owner.');
                            console.error('[EditorContext] ❌ Permission denied for screenplay:', projectId);
                            // Don't load anything - show empty editor with error
                            hasInitializedRef.current = initKey;
                            return; // Exit early - don't fall back to Clerk metadata
                        }
                        
                        // For other errors (network, 404, etc.), show error but allow fallback
                        const isNotFoundError = statusCode === 404 || 
                                                errorMessage.includes('404') || 
                                                errorMessage.includes('not found');
                        
                        if (isNotFoundError) {
                            toast.error('Screenplay not found. It may have been deleted.');
                            console.error('[EditorContext] ❌ Screenplay not found:', projectId);
                            // Don't load anything - show empty editor
                            hasInitializedRef.current = initKey;
                            return; // Exit early - don't fall back to Clerk metadata
                        }
                        
                        // For network errors, show warning but allow fallback
                        toast.error('Failed to load screenplay from URL. Loading your default screenplay instead.');
                        console.error('[EditorContext] ⚠️ Network/other error loading from URL, will fall back to Clerk metadata');
                        // Continue with normal load flow (fallback to Clerk metadata)
                    }
                }
                
                // Feature 0119: Priority 1 - Load from Clerk metadata (persists across sessions)
                // Falls back to localStorage for backward compatibility
                let savedScreenplayId = getCurrentScreenplayId(user);
                
                // Feature 0119: One-time migration from localStorage to Clerk metadata
                if (user && savedScreenplayId && !user.unsafeMetadata?.current_screenplay_id) {
                    try {
                        await migrateFromLocalStorage(user);
                    } catch (error) {
                        console.error('[EditorContext] Migration failed (non-critical):', error);
                    }
                }
                
                if (savedScreenplayId) {
                    try {
                        console.log('[EditorContext] Loading screenplay from DynamoDB...', savedScreenplayId);
                        const savedScreenplay = await getScreenplay(savedScreenplayId, getToken);
                        
                        if (savedScreenplay) {
                            const dbContentLength = savedScreenplay.content?.length || 0;
                            // Feature 0133: Store version for optimistic locking
                            // Handle backward compatibility: convert string version to number if needed
                            let version: number;
                            if (typeof savedScreenplay.version === 'string') {
                                version = parseFloat(savedScreenplay.version) || 1;
                                console.log(`[EditorContext] ⚠️ Converting legacy string version '${savedScreenplay.version}' to number ${version}`);
                            } else {
                                version = savedScreenplay.version || 1;
                            }
                            screenplayVersionRef.current = version;
                            
                            console.log('[EditorContext] ✅ Loaded screenplay from DynamoDB:', {
                                screenplayId: savedScreenplay.screenplay_id,
                                title: savedScreenplay.title,
                                contentLength: dbContentLength,
                                version: version,
                                hasContent: !!savedScreenplay.content,
                                contentPreview: savedScreenplay.content?.substring(0, 100) || '(empty)'
                            });
                            
                            if (!savedScreenplay.content || savedScreenplay.content.trim().length === 0) {
                                console.warn('[EditorContext] ⚠️ Screenplay loaded but content is empty! This might indicate a save issue.');
                            } else {
                                console.log('[EditorContext] 📄 Database content loaded successfully:', dbContentLength, 'characters');
                            }
                            
                            // Feature 0132: Check per-screenplay localStorage for newer content (handles DynamoDB eventual consistency)
                            const draftKey = getScreenplayStorageKey('screenplay_draft', savedScreenplayId);
                            const titleKey = getScreenplayStorageKey('screenplay_title', savedScreenplayId);
                            const authorKey = getScreenplayStorageKey('screenplay_author', savedScreenplayId);
                            const localStorageContent = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
                            const localStorageTitle = typeof window !== 'undefined' ? localStorage.getItem(titleKey) : null;
                            const localStorageAuthor = typeof window !== 'undefined' ? localStorage.getItem(authorKey) : null;
                            const hasLocalStorageContent = localStorageContent && localStorageContent.trim().length > 0;
                            
                            // 🔥 FIX: Prefer database content on fresh load (when localStorage is empty)
                            // Only use localStorage if it exists AND is different from DB (for eventual consistency)
                            // This ensures fresh logins always get the latest database content
                            const dbContent = savedScreenplay.content || '';
                            const dbTitle = savedScreenplay.title || 'Untitled Screenplay';
                            const dbAuthor = savedScreenplay.author || '';
                            
                            let contentToUse: string;
                            let titleToUse: string;
                            let authorToUse: string;
                            
                            // 🔥 SIMPLE PATTERN (like characters/locations): Database is source of truth
                            // localStorage is only for crash recovery, not preference
                            // If localStorage differs, it means we have unsaved changes - use localStorage
                            // Otherwise, use database (source of truth)
                            if (hasLocalStorageContent && localStorageContent !== dbContent) {
                                // localStorage has unsaved changes - use it (will be saved on next save)
                                console.log('[EditorContext] 🔄 Using localStorage (has unsaved changes, key:', draftKey, ')');
                                contentToUse = localStorageContent;
                                titleToUse = localStorageTitle || dbTitle;
                                authorToUse = localStorageAuthor || dbAuthor;
                            } else {
                                // Use database (source of truth) - matches characters/locations pattern
                                console.log('[EditorContext] ✅ Using database content (source of truth)');
                                contentToUse = dbContent;
                                titleToUse = dbTitle;
                                authorToUse = dbAuthor;
                            }
                            
                            screenplayIdRef.current = savedScreenplayId;
                            setState(prev => ({
                                ...prev,
                                content: contentToUse,
                                title: titleToUse,
                                author: authorToUse || prev.author,
                                isDirty: hasLocalStorageContent && localStorageContent !== savedScreenplay.content // Mark dirty if using localStorage
                            }));
                            isInitialLoadRef.current = false;
                            // 🔥 FIX 3: Mark as initialized after successful load
                            hasInitializedRef.current = initKey;
                            return; // Success!
                        } else {
                            console.warn('[EditorContext] ⚠️ getScreenplay returned null for:', savedScreenplayId);
                        }
                    } catch (err) {
                        console.error('[EditorContext] ❌ Error loading from DynamoDB:', err);
                        // Don't throw - fall through to localStorage fallback
                    }
                }
                
                // Priority 2: Fallback to localStorage (crash recovery)
                // Feature 0132: Try per-screenplay localStorage first, then fall back to global keys (backward compatibility)
                const fallbackScreenplayId = savedScreenplayId || screenplayIdRef.current;
                const fallbackDraftKey = getScreenplayStorageKey('screenplay_draft', fallbackScreenplayId);
                const fallbackTitleKey = getScreenplayStorageKey('screenplay_title', fallbackScreenplayId);
                const fallbackAuthorKey = getScreenplayStorageKey('screenplay_author', fallbackScreenplayId);
                
                // Try per-screenplay keys first
                let savedContent = typeof window !== 'undefined' ? localStorage.getItem(fallbackDraftKey) : null;
                let savedTitle = typeof window !== 'undefined' ? localStorage.getItem(fallbackTitleKey) : null;
                let savedAuthor = typeof window !== 'undefined' ? localStorage.getItem(fallbackAuthorKey) : null;
                
                // Fallback to global keys for backward compatibility (legacy data)
                if (!savedContent && typeof window !== 'undefined') {
                    savedContent = localStorage.getItem('screenplay_draft');
                    savedTitle = localStorage.getItem('screenplay_title');
                    savedAuthor = localStorage.getItem('screenplay_author');
                }
                
                if (savedContent && savedContent.trim().length > 0) {
                    console.log('[EditorContext] Recovered draft from localStorage (key:', fallbackDraftKey || 'screenplay_draft', ')');
                    setState(prev => ({
                        ...prev,
                        content: savedContent,
                        title: savedTitle || prev.title,
                        author: savedAuthor || prev.author,
                        isDirty: true // Mark dirty to trigger DynamoDB save
                    }));
                    
                    // Don't create a new screenplay yet - wait for auto-save to create it
                    // This prevents orphaning screenplays when localStorage is cleared
                } else {
                    console.log('[EditorContext] No saved content found - checking if user has screenplays to load');
                    
                    // Feature 0136: Auto-load first screenplay if user has screenplays but no saved current_screenplay_id
                    // This fixes the issue where users with screenplays see empty editor when Clerk metadata is missing
                    // Only check if we don't have a projectId in URL (user is starting fresh)
                    if (!projectId && user) {
                        try {
                            // Check if user has any owned screenplays
                            const screenplaysResponse = await fetch('/api/screenplays/list?status=active&limit=1', {
                                cache: 'no-store',
                                headers: {
                                    'Cache-Control': 'no-cache'
                                }
                            });
                            
                            if (screenplaysResponse.ok) {
                                const screenplaysData = await screenplaysResponse.json();
                                const ownedScreenplays = screenplaysData.screenplays || [];
                                
                                if (ownedScreenplays.length > 0) {
                                    // User has screenplays - load the first one
                                    const firstScreenplay = ownedScreenplays[0];
                                    const firstScreenplayId = firstScreenplay.screenplay_id;
                                    
                                    console.log('[EditorContext] User has screenplays but no saved ID - loading first screenplay:', firstScreenplayId);
                                    
                                    // Load the screenplay
                                    const screenplay = await getScreenplay(firstScreenplayId, getToken);
                                    
                                    if (screenplay) {
                                        // Save to Clerk metadata so it loads automatically next time
                                        await setCurrentScreenplayId(user, firstScreenplayId);
                                        screenplayIdRef.current = firstScreenplayId;
                                        
                                        // Update URL to include the screenplay ID
                                        if (typeof window !== 'undefined') {
                                            const newUrl = `/write?project=${firstScreenplayId}`;
                                            window.history.replaceState({}, '', newUrl);
                                        }
                                        
                                        // Load the screenplay content
                                        const dbContent = screenplay.content || '';
                                        const dbTitle = screenplay.title || 'Untitled Screenplay';
                                        const dbAuthor = screenplay.author || '';
                                        
                                        setState(prev => ({
                                            ...prev,
                                            content: dbContent,
                                            title: dbTitle,
                                            author: dbAuthor || prev.author,
                                            isDirty: false
                                        }));
                                        
                                        // Store version for optimistic locking
                                        if (typeof screenplay.version === 'string') {
                                            screenplayVersionRef.current = parseFloat(screenplay.version) || 1;
                                        } else {
                                            screenplayVersionRef.current = screenplay.version || 1;
                                        }
                                        
                                        console.log('[EditorContext] ✅ Auto-loaded first screenplay:', firstScreenplayId);
                                        
                                        isInitialLoadRef.current = false;
                                        hasInitializedRef.current = initKey;
                                        return; // Exit early - screenplay loaded
                                    }
                                } else {
                                    // User has no owned screenplays - run one-time default project migration
                                    const migrationCompleted = user.unsafeMetadata?.default_project_migration_completed === true;
                                    
                                    if (!migrationCompleted) {
                                        console.log('[EditorContext] Running one-time default project migration for user with no owned screenplays');
                                        // Create default project for user
                                        const defaultProject = await createScreenplay({
                                            title: 'My First Project',
                                            author: user.firstName || user.fullName || 'Anonymous',
                                            content: ''
                                        }, getToken);
                                        
                                        // Save to Clerk metadata
                                        await setCurrentScreenplayId(user, defaultProject.screenplay_id);
                                        
                                        // Mark migration as completed in Clerk metadata (one-time only)
                                        const userWithUpdate = user as any;
                                        await userWithUpdate.update({
                                            unsafeMetadata: {
                                                ...user.unsafeMetadata,
                                                default_project_migration_completed: true
                                            }
                                        });
                                        
                                        screenplayIdRef.current = defaultProject.screenplay_id;
                                        
                                        console.log('[EditorContext] ✅ One-time default project migration completed:', defaultProject.screenplay_id);
                                        
                                        // Update URL to include the new project ID
                                        if (typeof window !== 'undefined') {
                                            const newUrl = `/write?project=${defaultProject.screenplay_id}`;
                                            window.history.replaceState({}, '', newUrl);
                                        }
                                        
                                        // Set empty state (project is created but empty)
                                        setState(prev => ({
                                            ...prev,
                                            title: defaultProject.title,
                                            author: defaultProject.author || prev.author,
                                            content: '',
                                            isDirty: false
                                        }));
                                        
                                        isInitialLoadRef.current = false;
                                        hasInitializedRef.current = initKey;
                                        return; // Exit early - project created
                                    }
                                }
                            }
                        } catch (error) {
                            // Log error but don't fail - user can still use the editor
                            console.error('[EditorContext] ⚠️ Failed to check/load user screenplays (non-critical):', error);
                        }
                    }
                    
                    // If we get here, either user has no screenplays, or loading failed
                    // User will start with empty editor and can type to create a new screenplay
                    console.log('[EditorContext] User will start with empty editor');
                }
                
                isInitialLoadRef.current = false;
                // 🔥 FIX 3: Mark as initialized after load completes (even if empty)
                hasInitializedRef.current = initKey;
            } catch (err) {
                console.error('[EditorContext] Failed to load content:', err);
                isInitialLoadRef.current = false;
                // 🔥 FIX 1: On error, reset guard so we can retry
                hasInitializedRef.current = false;
            }
        }
        
        loadContent();
    }, [screenplay, getToken, user, projectId, getScreenplayStorageKey]); // Depend on screenplay, getToken, user, projectId, and getScreenplayStorageKey
    
    // 🔥 FIX 2: Listen for screenplay deleted event and clear editor if current screenplay is deleted
    useEffect(() => {
        const handleScreenplayDeleted = (event: CustomEvent) => {
            const deletedId = event.detail?.screenplayId;
            const activeId = projectId || screenplayIdRef.current;
            
            // Only clear if the deleted screenplay is the one currently loaded
            if (deletedId && activeId && deletedId === activeId) {
                console.log('[EditorContext] Screenplay deleted event received, clearing editor:', deletedId);
                // Feature 0132: Clear per-screenplay localStorage
                clearScreenplayStorage(deletedId);
                setState(defaultState);
                screenplayIdRef.current = null;
                hasInitializedRef.current = false;
                toast.error('This screenplay has been deleted');
            } else if (deletedId) {
                // Feature 0132: Clear localStorage for deleted screenplay even if not currently loaded
                clearScreenplayStorage(deletedId);
            }
        };
        
        window.addEventListener('screenplayDeleted', handleScreenplayDeleted as EventListener);
        return () => {
            window.removeEventListener('screenplayDeleted', handleScreenplayDeleted as EventListener);
        };
    }, [projectId, clearScreenplayStorage]);
    
    // 🔥 FIX 3: Listen for screenplay updated event (rename/edit) and update title/author only
    // CRITICAL: Never reload content from DB - it would overwrite recent edits due to eventual consistency
    useEffect(() => {
        const handleScreenplayUpdated = (event?: CustomEvent) => {
            const eventDetail = (event as CustomEvent)?.detail;
            const activeId = projectId || screenplayIdRef.current;
            
            // Check if this update is for the current screenplay
            if (eventDetail?.screenplayId && eventDetail.screenplayId !== activeId) {
                console.log('[EditorContext] Update event is for different screenplay, ignoring');
                return;
            }
            
            console.log('[EditorContext] Screenplay updated event received, updating title/author from event detail');
            
            // 🔥 CRITICAL: Only update title/author from event detail - NEVER reload content from DB
            // Reloading content would overwrite recent edits due to DynamoDB eventual consistency
            // Content should only be loaded on initial load, not on updates
            if (eventDetail) {
                setState(prev => ({
                    ...prev,
                    // Update title/author from event detail if available
                    title: eventDetail.title || prev.title,
                    author: eventDetail.author || prev.author,
                    // NEVER update content - preserve user's current edits
                    // Content is only loaded on initial load, not on updates
                }));
                console.log('[EditorContext] ✅ Updated title/author from event detail (content preserved)');
            }
        };
        
        window.addEventListener('screenplayUpdated', handleScreenplayUpdated as EventListener);
        return () => {
            window.removeEventListener('screenplayUpdated', handleScreenplayUpdated as EventListener);
        };
    }, [projectId]);
    
    // Feature 0133: Polling for real-time updates (check for version changes)
    // Optimization: Only poll if screenplay has collaborators (saves 50-80% on polling costs)
    useEffect(() => {
        const activeScreenplayId = projectId || screenplayIdRef.current;
        if (!activeScreenplayId || !activeScreenplayId.startsWith('screenplay_')) {
            return; // Don't poll if no screenplay loaded
        }
        
        // Check if screenplay has collaborators before starting polling
        // This optimization reduces costs for single-user screenplays (no conflict detection needed)
        let hasCollaborators = false;
        let pollInterval: NodeJS.Timeout | null = null;
        
        // Initial check: fetch screenplay to see if it has collaborators
        const checkAndStartPolling = async () => {
            try {
                const screenplay = await getScreenplay(activeScreenplayId, getToken);
                if (!screenplay) {
                    return; // Screenplay not found, don't poll
                }
                
                hasCollaborators = screenplay.collaborators && screenplay.collaborators.length > 0;
                
                if (!hasCollaborators) {
                    console.log('[EditorContext] No collaborators - skipping version polling (cost optimization)');
                    return; // No collaborators, don't poll (single-user screenplay)
                }
                
                console.log(`[EditorContext] Found ${screenplay.collaborators.length} collaborator(s) - starting version polling`);
                
                // Start polling only if collaborators exist
                // Poll every 15 seconds (optimized for faster content sync - reduces cursor position delay)
                pollInterval = setInterval(async () => {
                    try {
                        const currentVersion = screenplayVersionRef.current;
                        if (currentVersion === null) {
                            return; // No version tracked yet
                        }
                        
                        // Fetch current screenplay to check version
                        const latestScreenplay = await getScreenplay(activeScreenplayId, getToken);
                        if (!latestScreenplay) {
                            return;
                        }
                        
                        // Handle backward compatibility
                        let latestVersion: number;
                        if (typeof latestScreenplay.version === 'string') {
                            latestVersion = parseFloat(latestScreenplay.version) || 1;
                        } else {
                            latestVersion = latestScreenplay.version || 1;
                        }
                        
                        // Check if version changed
                        if (latestVersion !== currentVersion) {
                            console.log(`[EditorContext] 🔔 Version changed: ${currentVersion} → ${latestVersion}`);
                            
                            // 🔥 FIX: Only show notifications if there are actually collaborators
                            // Also check if the change was from the current user (their own save)
                            // Use latestScreenplay (the fetched screenplay) not the stale 'screenplay' variable
                            const hasCollaborators = latestScreenplay.collaborators && latestScreenplay.collaborators.length > 0;
                            const lastEditedBy = latestScreenplay.last_edited_by; // Optional - may not exist on older screenplays
                            const isOwnChange = lastEditedBy !== undefined && lastEditedBy === user?.id;
                            
                            // Only show notification if:
                            // 1. There are collaborators (someone else could have edited)
                            // 2. The change was NOT from the current user (it's actually from another user)
                            if (!hasCollaborators) {
                                // No collaborators - this is a single-user screenplay
                                // Version change is from user's own save - just update version ref silently
                                console.log('[EditorContext] Version changed but no collaborators - updating version silently (own save)');
                                screenplayVersionRef.current = latestVersion;
                                return; // Don't show notification or reload
                            }
                            
                            if (isOwnChange) {
                                // Change was from current user's own save - just update version ref silently
                                console.log('[EditorContext] Version changed from own save - updating version silently');
                                screenplayVersionRef.current = latestVersion;
                                return; // Don't show notification or reload
                            }
                            
                            // Version changed from another user - show notification
                            console.log('[EditorContext] Version changed from another user - showing notification');
                            
                            // Update version ref
                            screenplayVersionRef.current = latestVersion;
                            
                            // Show notification if user has unsaved changes
                            const hasUnsavedChanges = stateRef.current.isDirty && stateRef.current.content.trim().length > 0;
                            
                            if (hasUnsavedChanges) {
                                // Don't auto-reload if user has unsaved changes - show notification instead
                                toast.info('New changes available from another user. Save your changes first, then reload.', {
                                    duration: 5000,
                                    action: {
                                        label: 'Reload',
                                        onClick: async () => {
                                            // Reload screenplay
                                            const reloaded = await getScreenplay(activeScreenplayId, getToken);
                                            if (reloaded) {
                                                let version: number;
                                                if (typeof reloaded.version === 'string') {
                                                    version = parseFloat(reloaded.version) || 1;
                                                } else {
                                                    version = reloaded.version || 1;
                                                }
                                                screenplayVersionRef.current = version;
                                                
                                                const syncedContent = reloaded.content || stateRef.current.content;
                                                setState(prev => ({
                                                    ...prev,
                                                    content: syncedContent,
                                                    title: reloaded.title || prev.title,
                                                    author: reloaded.author || prev.author
                                                }));
                                                
                                                // 🔥 FIX: Update lastSyncedContent when manually reloading
                                                setLastSyncedContent(syncedContent);
                                                
                                                toast.success('Reloaded latest version');
                                            }
                                        }
                                    }
                                });
                            } else {
                                // Auto-reload if no unsaved changes
                                let version: number;
                                if (typeof latestScreenplay.version === 'string') {
                                    version = parseFloat(latestScreenplay.version) || 1;
                                } else {
                                    version = latestScreenplay.version || 1;
                                }
                                screenplayVersionRef.current = version;
                                
                                const syncedContent = latestScreenplay.content || stateRef.current.content;
                                setState(prev => ({
                                    ...prev,
                                    content: syncedContent,
                                    title: latestScreenplay.title || prev.title,
                                    author: latestScreenplay.author || prev.author
                                }));
                                
                                // 🔥 FIX: Update lastSyncedContent when auto-reloading
                                setLastSyncedContent(syncedContent);
                                
                                toast.success('Screenplay updated with latest changes');
                            }
                        }
                    } catch (error) {
                        console.error('[EditorContext] Error polling for updates:', error);
                        // Silent fail - don't spam user with errors
                    }
                }, 15000); // Poll every 15 seconds (optimized for faster content sync)
            } catch (error) {
                console.error('[EditorContext] Error checking collaborators or starting polling:', error);
                // Silent fail - don't spam user with errors
            }
        };
        
        // Start checking and polling
        checkAndStartPolling();
        
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [projectId, getToken]);
    
    // Conflict resolution handler removed - using "last write wins" strategy
    
    // Feature 0134: Cursor Position Broadcasting
    // Broadcast cursor position when user is actively editing (debounced to avoid spam)
    useEffect(() => {
        const activeScreenplayId = projectId || screenplayIdRef.current;
        
        // Only broadcast if:
        // 1. Screenplay is loaded (has screenplay ID)
        // 2. User is authenticated (has getToken)
        // 3. Screenplay ID is valid (starts with 'screenplay_')
        if (!activeScreenplayId || !activeScreenplayId.startsWith('screenplay_') || !getToken) {
            // Clear any pending broadcasts
            if (cursorBroadcastTimerRef.current) {
                clearTimeout(cursorBroadcastTimerRef.current);
                cursorBroadcastTimerRef.current = null;
            }
            if (cursorIdleTimerRef.current) {
                clearTimeout(cursorIdleTimerRef.current);
                cursorIdleTimerRef.current = null;
            }
            isBroadcastingRef.current = false;
            return;
        }
        
        const currentPosition = state.cursorPosition;
        const currentSelectionStart = state.selectionStart;
        const currentSelectionEnd = state.selectionEnd;
        
        // Check if cursor position actually changed
        const lastBroadcasted = lastBroadcastedCursorRef.current;
        const positionChanged = !lastBroadcasted || 
            lastBroadcasted.position !== currentPosition ||
            lastBroadcasted.selectionStart !== currentSelectionStart ||
            lastBroadcasted.selectionEnd !== currentSelectionEnd;
        
        if (!positionChanged) {
            return; // No change, don't broadcast
        }
        
        // Clear existing debounce timer
        if (cursorBroadcastTimerRef.current) {
            clearTimeout(cursorBroadcastTimerRef.current);
        }
        
        // Clear idle timer (user is active)
        if (cursorIdleTimerRef.current) {
            clearTimeout(cursorIdleTimerRef.current);
            cursorIdleTimerRef.current = null;
        }
        
        // Mark as broadcasting
        isBroadcastingRef.current = true;
        
        // Debounce cursor broadcast (500ms) to avoid excessive API calls
        cursorBroadcastTimerRef.current = setTimeout(async () => {
            try {
                console.log(`[EditorContext] Broadcasting cursor position: screenplayId=${activeScreenplayId}, userId=${user?.id}, position=${currentPosition}`);
                const success = await broadcastCursorPosition(
                    activeScreenplayId,
                    currentPosition,
                    currentSelectionStart !== currentPosition ? currentSelectionStart : undefined,
                    currentSelectionEnd !== currentPosition ? currentSelectionEnd : undefined,
                    getToken
                );
                
                if (success) {
                    // Update last broadcasted position
                    lastBroadcastedCursorRef.current = {
                        position: currentPosition,
                        selectionStart: currentSelectionStart !== currentPosition ? currentSelectionStart : undefined,
                        selectionEnd: currentSelectionEnd !== currentPosition ? currentSelectionEnd : undefined,
                        timestamp: Date.now()
                    };
                    
                    // Start heartbeat interval to keep cursor alive even when idle
                    // This ensures cursors remain visible for 30+ seconds even if user stops typing
                    if (!cursorHeartbeatIntervalRef.current) {
                        cursorHeartbeatIntervalRef.current = setInterval(async () => {
                            // Only broadcast if we have a valid position and screenplay
                            if (activeScreenplayId && activeScreenplayId.startsWith('screenplay_') && getToken && lastBroadcastedCursorRef.current) {
                                try {
                                    await broadcastCursorPosition(
                                        activeScreenplayId,
                                        lastBroadcastedCursorRef.current.position,
                                        lastBroadcastedCursorRef.current.selectionStart,
                                        lastBroadcastedCursorRef.current.selectionEnd,
                                        getToken
                                    );
                                    // Update timestamp to keep it fresh
                                    lastBroadcastedCursorRef.current.timestamp = Date.now();
                                } catch (error) {
                                    console.error('[EditorContext] Error in cursor heartbeat:', error);
                                }
                            }
                        }, 5000); // Heartbeat every 5 seconds to keep cursor alive
                        console.log('[EditorContext] Started cursor heartbeat interval');
                    }
                }
            } catch (error) {
                console.error('[EditorContext] Error broadcasting cursor position:', error);
            }
        }, 500); // 500ms debounce
        
        // Note: Removed idle timer - cursors now stay visible via heartbeat until user leaves the screenplay
        
        // Cleanup on unmount or screenplay change
        return () => {
            if (cursorBroadcastTimerRef.current) {
                clearTimeout(cursorBroadcastTimerRef.current);
                cursorBroadcastTimerRef.current = null;
            }
            if (cursorIdleTimerRef.current) {
                clearTimeout(cursorIdleTimerRef.current);
                cursorIdleTimerRef.current = null;
            }
            if (cursorHeartbeatIntervalRef.current) {
                clearInterval(cursorHeartbeatIntervalRef.current);
                cursorHeartbeatIntervalRef.current = null;
                console.log('[EditorContext] Stopped cursor heartbeat interval');
            }
        };
    }, [state.cursorPosition, state.selectionStart, state.selectionEnd, projectId, getToken]);
    
    // Feature 0134: Clear cursor position on unmount or screenplay change
    useEffect(() => {
        const activeScreenplayId = projectId || screenplayIdRef.current;
        
        return () => {
            // Clear cursor position when component unmounts or screenplay changes
            if (activeScreenplayId && activeScreenplayId.startsWith('screenplay_') && getToken) {
                clearCursorPosition(activeScreenplayId, getToken).catch(error => {
                    console.error('[EditorContext] Error clearing cursor position on cleanup:', error);
                });
            }
            
            // Clear timers
            if (cursorBroadcastTimerRef.current) {
                clearTimeout(cursorBroadcastTimerRef.current);
                cursorBroadcastTimerRef.current = null;
            }
            if (cursorIdleTimerRef.current) {
                clearTimeout(cursorIdleTimerRef.current);
                cursorIdleTimerRef.current = null;
            }
            if (cursorHeartbeatIntervalRef.current) {
                clearInterval(cursorHeartbeatIntervalRef.current);
                cursorHeartbeatIntervalRef.current = null;
            }
            
            // Reset state
            lastBroadcastedCursorRef.current = null;
            isBroadcastingRef.current = false;
            setOtherUsersCursors([]); // Clear other users' cursors when switching screenplays
        };
    }, [projectId, getToken]);
    
    // Feature 0134: Poll for other users' cursor positions (every 2 seconds)
    // 🔥 FIX: Only poll on the /write page (editor), not on other pages like /props, /characters, /locations
    useEffect(() => {
        const activeScreenplayId = projectId || screenplayIdRef.current;
        const isOnEditorPage = pathname === '/write';
        
        if (!isOnEditorPage) {
            // Not on editor page - disable cursor polling
            console.log('[EditorContext] Cursor polling disabled: not on /write page', { pathname });
            setOtherUsersCursors([]);
            return;
        }
        
        if (!activeScreenplayId || !activeScreenplayId.startsWith('screenplay_') || !getToken || !user) {
            // Clear cursors if no screenplay loaded
            console.log('[EditorContext] Cursor polling disabled:', {
                activeScreenplayId,
                hasToken: !!getToken,
                hasUser: !!user,
                startsWithScreenplay: activeScreenplayId?.startsWith('screenplay_')
            });
            setOtherUsersCursors([]);
            return;
        }
        
        const currentUserId = user.id;
        console.log('[EditorContext] Starting cursor polling', { activeScreenplayId, currentUserId });
        
        // Poll immediately on mount, then every 2 seconds
        const pollCursors = async () => {
            try {
                // Fetch all active cursor positions
                const cursors = await getCursorPositions(activeScreenplayId, getToken);
                
                // Filter out:
                // 1. Own cursor (userId matches current user)
                // 2. Stale cursors (older than 30 seconds - backend already filters, but double-check)
                const now = Date.now();
                const activeOtherCursors = cursors.filter(cursor => {
                    // Filter out own cursor
                    // 🔥 FIX: Use string comparison to handle potential type mismatches
                    const isOwnCursor = String(cursor.userId) === String(currentUserId);
                    if (isOwnCursor) {
                        console.warn(`[EditorContext] ⚠️ Filtering out own cursor: currentUserId=${currentUserId} (${typeof currentUserId}), cursor.userId=${cursor.userId} (${typeof cursor.userId}), match=${String(cursor.userId) === String(currentUserId)}`);
                    }
                    
                    // Filter out stale cursors (older than 30 seconds - matches backend timeout)
                    const isStale = now - cursor.lastSeen > 30000;
                    if (isStale) {
                        console.log(`[EditorContext] Filtering out stale cursor: userId=${cursor.userId}, age=${now - cursor.lastSeen}ms`);
                    }
                    
                    // 🔥 DEBUG: Log all cursor filtering decisions
                    if (!isOwnCursor && !isStale) {
                        console.log(`[EditorContext] ✅ Keeping cursor: userId=${cursor.userId}, position=${cursor.position}, lastSeen=${cursor.lastSeen}ms ago`);
                    } else {
                        console.log(`[EditorContext] ❌ Filtering cursor: userId=${cursor.userId}, isOwnCursor=${isOwnCursor}, isStale=${isStale}`);
                    }
                    
                    return !isOwnCursor && !isStale;
                });
                
                // Only update state if cursors actually changed (deep comparison)
                // This prevents infinite loops from array reference changes
                const previousCursorsKey = JSON.stringify(previousOtherUsersCursorsRef.current.map(c => ({ userId: c.userId, position: c.position })));
                const newCursorsKey = JSON.stringify(activeOtherCursors.map(c => ({ userId: c.userId, position: c.position })));
                const cursorsChanged = previousCursorsKey !== newCursorsKey;
                
                if (cursorsChanged) {
                    setOtherUsersCursors(activeOtherCursors);
                    previousOtherUsersCursorsRef.current = activeOtherCursors;
                    
                    // Debug logging
                    console.log(`[EditorContext] Cursor polling: received ${cursors.length} cursor(s), filtered to ${activeOtherCursors.length} other user(s)`, {
                        totalCursors: cursors.length,
                        otherUsers: activeOtherCursors.length,
                        currentUserId,
                        currentUserIdType: typeof currentUserId,
                        cursorUserIds: cursors.map(c => ({ userId: c.userId, userIdType: typeof c.userId, position: c.position, lastSeen: c.lastSeen })),
                        activeOtherUserIds: activeOtherCursors.map(c => ({ userId: c.userId, userIdType: typeof c.userId, position: c.position }))
                    });
                } else {
                    // Cursors unchanged - skip state update to prevent unnecessary re-renders
                    console.log(`[EditorContext] Cursor polling: cursors unchanged, skipping state update`);
                }
                
                if (activeOtherCursors.length > 0) {
                    console.log(`[EditorContext] Found ${activeOtherCursors.length} other user(s) with active cursors`);
                }
            } catch (error) {
                console.error('[EditorContext] Error polling for cursor positions:', error);
                // Silent fail - don't spam user with errors
            }
        };
        
        // Poll immediately
        pollCursors();
        
        // Then poll every 2 seconds
        const pollInterval = setInterval(pollCursors, 2000);
        
        return () => {
            clearInterval(pollInterval);
        };
    }, [projectId, getToken, user, pathname]);
    
    return (
        <EditorContext.Provider value={value}>
            {children}
            {/* Conflict Resolution Modal removed - using "last write wins" strategy */}
        </EditorContext.Provider>
    );
}

// Wrapper component that handles useSearchParams with Suspense
function ProjectIdReader({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const projectId = searchParams?.get('project');
    return <EditorProviderInner projectId={projectId}>{children}</EditorProviderInner>;
}

// Create a minimal context value for Suspense fallback
const createMinimalContextValue = (): EditorContextType => ({
    state: defaultState,
    setContent: () => {},
    insertText: () => {},
    replaceSelection: () => {},
    undo: () => {},
    redo: () => {},
    pushToUndoStack: () => {},
    setCursorPosition: () => {},
    setSelection: () => {},
    setCurrentLine: () => {},
    setCurrentElementType: () => {},
    setTitle: () => {},
    setAuthor: () => {},
    markSaved: () => {},
    markDirty: () => {},
    saveNow: async () => false,
    toggleFocusMode: () => {},
    hasUnsavedChanges: () => false,
    toggleLineNumbers: () => {},
    setFontSize: () => {},
    setHighlightRange: () => {},
    clearHighlight: () => {},
    reset: () => {},
    otherUsersCursors: [], // Feature 0134: Empty array for minimal context
    lastSyncedContent: '', // Feature 0134: Empty string for minimal context
    isEditorFullscreen: false,
    setIsEditorFullscreen: () => {},
    // Feature 0187: Editor Lock state (defaults for minimal context)
    isEditorLocked: false,
    isCollaboratorEditing: false,
    lockedBy: null,
});

// Public EditorProvider that wraps the search params logic in Suspense
export function EditorProvider({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={
            <EditorContext.Provider value={createMinimalContextValue()}>
                {children}
            </EditorContext.Provider>
        }>
            <ProjectIdReader>{children}</ProjectIdReader>
        </Suspense>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
}

