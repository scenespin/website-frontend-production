'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FountainElementType } from '@/utils/fountain';
import { useScreenplay } from './ScreenplayContext';
import { saveToGitHub } from '@/utils/github';
import { useAuth, useUser } from '@clerk/nextjs';
import { createScreenplay, updateScreenplay, getScreenplay } from '@/utils/screenplayStorage';
import { getCurrentScreenplayId, setCurrentScreenplayId, migrateFromLocalStorage } from '@/utils/clerkMetadata';

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
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const githubSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true); // Prevent auto-clear during initial import
    
    // 🔥 FIX 1: Guard pattern - track which screenplay_id we've loaded (like ScreenplayContext)
    // Stores the last screenplay_id (or 'no-id') that we initialized for
    const hasInitializedRef = useRef<string | false>(false);
    
    // 🔥 FIX 2: Track previous projectId to only reset when it actually changes
    const previousProjectIdRef = useRef<string | null>(null);
    
    // Feature 0111: DynamoDB Storage
    const { getToken } = useAuth();
    const { user } = useUser(); // Feature 0119: Get user for Clerk metadata
    const screenplayIdRef = useRef<string | null>(null);
    const localSaveCounterRef = useRef(0);
    
    // Create refs to hold latest state values without causing interval restart
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);
    
    // Get GitHub config from localStorage (optional export feature)
    const screenplay = useScreenplay();
    const githubConfigStr = typeof window !== 'undefined' ? localStorage.getItem('screenplay_github_config') : null;
    const githubConfig = githubConfigStr ? JSON.parse(githubConfigStr) : null;
    
    // Manual save function - defined before setContent so it can be used in dependencies
    const saveNow = useCallback(async () => {
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
            
            // Save to localStorage immediately
            localStorage.setItem('screenplay_draft', currentState.content);
            localStorage.setItem('screenplay_title', currentState.title);
            localStorage.setItem('screenplay_author', currentState.author);
            console.log('[EditorContext] ✅ Saved to localStorage');
            
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
                
                // Feature 0117: No setTimeout or structure save needed - caller will handle it with explicit ID
            } else {
                // Update existing screenplay - use the activeScreenplayId we determined above
                console.log('[EditorContext] Updating EXISTING screenplay:', activeScreenplayId, '| Content:', contentLength, 'chars');
                await updateScreenplay({
                    screenplay_id: activeScreenplayId,
                    title: currentState.title,
                    author: currentState.author,
                    content: currentState.content
                }, getToken);
                
                // Update ref to keep in sync (in case it was different)
                screenplayIdRef.current = activeScreenplayId;
                
                console.log('[EditorContext] ✅ Updated screenplay content:', activeScreenplayId, '| Saved', contentLength, 'chars');
                
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
    
    const setContent = useCallback((content: string, markDirty: boolean = true) => {
        setState(prev => ({
            ...prev,
            content,
            isDirty: markDirty ? true : prev.isDirty
        }));
        
        // 🔥 FIX 1: Save immediately after content change (like characters/locations pattern)
        // Debounce to avoid too many API calls (3 seconds)
        if (markDirty && content.trim().length > 0) {
            // Clear existing debounce timer
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current);
            }
            
            // Set new debounce timer
            saveDebounceRef.current = setTimeout(async () => {
                const activeId = projectId || screenplayIdRef.current;
                if (activeId && activeId.startsWith('screenplay_')) {
                    console.log('[EditorContext] 💾 Immediate save triggered (content changed)');
                    try {
                        await saveNow();
                        console.log('[EditorContext] ✅ Immediate save complete');
                    } catch (err) {
                        console.error('[EditorContext] ⚠️ Immediate save failed:', err);
                        // Don't show error toast - autosave will retry
                    }
                } else {
                    console.log('[EditorContext] ⏸️ Immediate save skipped - no screenplay ID yet');
                }
            }, 3000); // 3-second debounce (balance between responsiveness and API calls)
        }
    }, [projectId, saveNow]);
    
    const insertText = useCallback((text: string, position?: number) => {
        setState(prev => {
            // CRITICAL: Push current state to undo stack BEFORE making changes
            const currentSnapshot = {
                content: prev.content,
                cursorPosition: prev.cursorPosition ?? 0,
                timestamp: Date.now()
            };
            
            // Push to undo stack (this will clear redo stack)
            const newUndoStack = [...prev.undoStack, currentSnapshot].slice(-10);
            
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
        setState(prev => {
            // CRITICAL: Push current state to undo stack BEFORE making changes
            const currentSnapshot = {
                content: prev.content,
                cursorPosition: prev.cursorPosition ?? 0,
                timestamp: Date.now()
            };
            
            // Push to undo stack (this will clear redo stack)
            const newUndoStack = [...prev.undoStack, currentSnapshot].slice(-10);
            
            const before = prev.content.substring(0, start);
            const after = prev.content.substring(end);
            const newContent = before + text + after;
            
            console.log('[EditorContext] replaceSelection - pushed to undo stack, setting highlightRange:', { start, end: start + text.length });
            
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
        setState(prev => {
            const snapshotToSave = snapshot || {
                content: prev.content,
                cursorPosition: prev.cursorPosition
            };
            
            // Keep only last 10 undo states to prevent memory issues
            const newUndoStack = [...prev.undoStack, { ...snapshotToSave, timestamp: Date.now() }].slice(-10);
            
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
            const newRedoStack = [...prev.redoStack, currentState].slice(-10);
            
            console.log('[EditorContext] Undoing. Undo stack:', newUndoStack.length, 'Redo stack:', newRedoStack.length);
            
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
    }, []);
    
    const redo = useCallback(() => {
        setState(prev => {
            if (prev.redoStack.length === 0) {
                console.warn('[EditorContext] No redo history available');
                return prev;
            }
            
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
            const newUndoStack = [...prev.undoStack, currentState].slice(-10);
            
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
        setState(prev => ({ ...prev, cursorPosition: position }));
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
        clearHighlight,
        reset
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
    
    // Tier 1: Draft recovery - Save content to localStorage with 2-second debounce
    useEffect(() => {
        if (state.content.length === 0) return; // Don't save empty content
        
        const debounceTimer = setTimeout(() => {
            try {
                localStorage.setItem('screenplay_draft', state.content);
                localStorage.setItem('screenplay_title', state.title);
                localStorage.setItem('screenplay_author', state.author);
                console.log('[EditorContext] 💾 Draft saved to localStorage (crash protection)');
            } catch (err) {
                console.error('[EditorContext] localStorage draft save failed:', err);
            }
        }, 2000); // 2-second debounce (crash protection only)
        
        return () => clearTimeout(debounceTimer);
    }, [state.content, state.title, state.author]);
    
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
            // If screenplayIdRef is null (e.g., after refresh), check localStorage/Clerk metadata
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
                const hasLocalStorageContent = typeof window !== 'undefined' && 
                                               localStorage.getItem('screenplay_draft')?.trim().length > 0;
                
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
                // Ref is set - compare IDs
                isActuallyDifferentScreenplay = currentProjectId !== lastLoadedScreenplayId;
            }
            
            if (isActuallyDifferentScreenplay) {
                console.log('[EditorContext] 🔄 Switching to different screenplay - clearing state and resetting guard');
                // Reset initialization guard to allow loading new screenplay
                hasInitializedRef.current = false;
                screenplayIdRef.current = null;
                setState(defaultState);
            } else {
                // Same screenplay (or preserving existing content) - preserve state
                console.log('[EditorContext] 🔙 Same screenplay or preserving content - preserving state, will reload from DB if needed');
                // Reset guard to allow reload, but don't clear state
                // The load effect will merge with existing state/localStorage
                hasInitializedRef.current = false;
            }
            
            // Update previous ref
            previousProjectIdRef.current = currentProjectId;
        }
    }, [projectId]);
    
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
                            const screenplay = await getScreenplay(projectId, getToken);
                            
                            if (screenplay) {
                                console.log('[EditorContext] ✅ Loaded screenplay from URL:', screenplay.title);
                                screenplayIdRef.current = projectId;
                                
                                // Save to Clerk metadata
                                try {
                                    await setCurrentScreenplayId(user, projectId);
                                } catch (error) {
                                    console.error('[EditorContext] ⚠️ Failed to save screenplay_id to Clerk metadata:', error);
                                }
                                
                                // 🔥 FIX: Check localStorage for newer content (handles DynamoDB eventual consistency)
                                // If localStorage has content for this screenplay and it's newer, prefer it
                                const localStorageContent = typeof window !== 'undefined' ? localStorage.getItem('screenplay_draft') : null;
                                const localStorageTitle = typeof window !== 'undefined' ? localStorage.getItem('screenplay_title') : null;
                                const hasLocalStorageContent = localStorageContent && localStorageContent.trim().length > 0;
                                
                                // Use localStorage content if it exists and is different from DB (might be newer)
                                // This handles the case where we just saved but DB hasn't propagated yet
                                const contentToUse = hasLocalStorageContent ? localStorageContent : (screenplay.content || '');
                                const titleToUse = localStorageTitle || screenplay.title || 'Untitled Screenplay';
                                
                                if (hasLocalStorageContent && localStorageContent !== screenplay.content) {
                                    console.log('[EditorContext] 🔄 Using localStorage content (may be newer than DB due to eventual consistency)');
                                }
                                
                                // Update state with screenplay data (preferring localStorage if available)
                                setState(prev => ({
                                    ...prev,
                                    title: titleToUse,
                                    content: contentToUse,
                                    author: screenplay.author || prev.author,
                                    isDirty: hasLocalStorageContent && localStorageContent !== screenplay.content // Mark dirty if using localStorage
                                }));
                                
                                console.log('[EditorContext] ✅ Loaded screenplay from URL:', projectId);
                                isInitialLoadRef.current = false;
                                // 🔥 FIX 3: Mark as initialized after successful load
                                hasInitializedRef.current = initKey;
                                return; // Success - screenplay loaded!
                            } else {
                                console.warn('[EditorContext] ⚠️ Screenplay not found:', projectId);
                            }
                        } else {
                            console.warn('[EditorContext] ⚠️ Invalid ID format in URL:', projectId);
                            console.warn('[EditorContext] ⚠️ Expected screenplay_* format');
                        }
                    } catch (error) {
                        console.error('[EditorContext] ⚠️ Error loading screenplay from URL:', error);
                        // Continue with normal load flow
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
                            console.log('[EditorContext] ✅ Loaded screenplay from DynamoDB:', {
                                screenplayId: savedScreenplay.screenplay_id,
                                title: savedScreenplay.title,
                                contentLength: savedScreenplay.content?.length || 0,
                                hasContent: !!savedScreenplay.content
                            });
                            
                            if (!savedScreenplay.content || savedScreenplay.content.trim().length === 0) {
                                console.warn('[EditorContext] ⚠️ Screenplay loaded but content is empty!');
                            }
                            
                            // 🔥 FIX: Check localStorage for newer content (handles DynamoDB eventual consistency)
                            const localStorageContent = typeof window !== 'undefined' ? localStorage.getItem('screenplay_draft') : null;
                            const localStorageTitle = typeof window !== 'undefined' ? localStorage.getItem('screenplay_title') : null;
                            const hasLocalStorageContent = localStorageContent && localStorageContent.trim().length > 0;
                            
                            // Use localStorage content if it exists and is different from DB (might be newer)
                            const contentToUse = hasLocalStorageContent ? localStorageContent : (savedScreenplay.content || '');
                            const titleToUse = localStorageTitle || savedScreenplay.title || 'Untitled Screenplay';
                            
                            if (hasLocalStorageContent && localStorageContent !== savedScreenplay.content) {
                                console.log('[EditorContext] 🔄 Using localStorage content (may be newer than DB due to eventual consistency)');
                            }
                            
                            screenplayIdRef.current = savedScreenplayId;
                            setState(prev => ({
                                ...prev,
                                content: contentToUse,
                                title: titleToUse,
                                author: savedScreenplay.author || prev.author,
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
                const savedContent = localStorage.getItem('screenplay_draft');
                const savedTitle = localStorage.getItem('screenplay_title');
                const savedAuthor = localStorage.getItem('screenplay_author');
                
                if (savedContent && savedContent.trim().length > 0) {
                    console.log('[EditorContext] Recovered draft from localStorage');
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
                    console.log('[EditorContext] No saved content found - user will start with empty editor');
                    // DON'T automatically create a screenplay here!
                    // Wait for user to type something, then auto-save will create it
                    // This prevents creating empty orphaned screenplays
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
    }, [screenplay, getToken, user, projectId]); // Depend on screenplay, getToken, user, and projectId
    
    return (
        <EditorContext.Provider value={value}>
            {children}
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
    toggleLineNumbers: () => {},
    setFontSize: () => {},
    setHighlightRange: () => {},
    clearHighlight: () => {},
    reset: () => {},
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

