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
// Note: URL parameter is 'project' for backward compatibility, but value is always a screenplay_id
function EditorProviderInner({ children, screenplayId: screenplayIdFromUrl }: { children: ReactNode; screenplayId: string | null }) {
    const [state, setState] = useState<EditorState>(defaultState);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const githubSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true); // Prevent auto-clear during initial import
    const hasRunAutoImportRef = useRef(false); // Prevent infinite import loop
    
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
    
    // Content operations
    const setContent = useCallback((content: string, markDirty: boolean = true) => {
        setState(prev => ({
            ...prev,
            content,
            isDirty: markDirty ? true : prev.isDirty
        }));
    }, []);
    
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
    
    // Manual save function - for save button and paste trigger
    const saveNow = useCallback(async () => {
        const currentState = stateRef.current;
        const contentLength = currentState.content.length;
        const contentTrimmed = currentState.content.trim();
        
        console.log('[EditorContext] 💾 Manual save triggered (content length:', contentLength, 'chars)');
        
        try {
            // Feature 0130: Use screenplayId from URL as source of truth (must be screenplay_ ID)
            // Priority: screenplayId from URL > screenplayIdRef.current
            // This ensures we always save to the correct screenplay when switching
            let activeScreenplayId: string | null = null;
            
            // Always prefer screenplayId from URL (most reliable)
            if (screenplayIdFromUrl && screenplayIdFromUrl.startsWith('screenplay_')) {
                activeScreenplayId = screenplayIdFromUrl;
                console.log('[EditorContext] Using screenplay_id from URL:', activeScreenplayId);
            } else if (screenplayIdRef.current) {
                activeScreenplayId = screenplayIdRef.current;
                console.log('[EditorContext] Using screenplay_id from ref:', activeScreenplayId);
            } else if (screenplayIdFromUrl) {
                // Invalid format in URL - log warning
                if (screenplayIdFromUrl.startsWith('proj_')) {
                    console.warn('[EditorContext] ⚠️ Rejected proj_ ID in saveNow (legacy format):', screenplayIdFromUrl);
                } else {
                    console.warn('[EditorContext] ⚠️ Invalid ID format in URL:', screenplayIdFromUrl);
                }
                // Will create new screenplay below
            } else {
                // No screenplayId available - will create new screenplay below
                console.log('[EditorContext] No screenplayId available - will create new screenplay');
            }
            
            // Save to localStorage immediately
            localStorage.setItem('screenplay_draft', currentState.content);
            localStorage.setItem('screenplay_title', currentState.title);
            localStorage.setItem('screenplay_author', currentState.author);
            console.log('[EditorContext] ✅ Saved to localStorage');
            
            // Save to DynamoDB immediately
            if (!activeScreenplayId) {
                // Only create new if we truly have no ID
                // But log warning - this shouldn't happen in normal flow
                console.warn('[EditorContext] ⚠️ No screenplay ID available - creating new screenplay');
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
                
                // Sync ScreenplayContext via storage event
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'current_screenplay_id',
                    newValue: activeScreenplayId,
                    oldValue: null,
                    storageArea: localStorage,
                    url: window.location.href
                }));
                // Also update localStorage directly
                localStorage.setItem('current_screenplay_id', activeScreenplayId);
                
                console.log('[EditorContext] ✅ Created NEW screenplay:', activeScreenplayId, '| Content:', contentLength, 'chars');
                
                // 🔥 FIX 1: Add delay for DynamoDB consistency (like Media Library pattern)
                // This ensures the screenplay is fully created before we try to update it
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 🔥 FIX 1: Now save the content to the newly created screenplay
                // This ensures content is saved even if the screenplay was just created
                console.log('[EditorContext] Saving content to newly created screenplay...');
                await updateScreenplay({
                    screenplay_id: activeScreenplayId,
                    title: currentState.title,
                    author: currentState.author,
                    content: currentState.content
                }, getToken);
                console.log('[EditorContext] ✅ Content saved to newly created screenplay');
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
            
            // Reset the auto-save counter since we just saved manually
            localSaveCounterRef.current = 0;
            
            return true;
        } catch (error: any) {
            console.error('[EditorContext] Manual save failed:', error);
            throw error; // Let the caller handle the error
        }
    }, [getToken, screenplay, screenplayIdFromUrl, user]);
    
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
            
            // Ensure we have a screenplay ID before attempting save
            const activeId = screenplayIdFromUrl || screenplayIdRef.current;
            if (!activeId) {
                console.warn('[EditorContext] ⚠️ Auto-save skipped - no screenplay ID available');
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
    }, [state.isDirty, saveNow, screenplayIdFromUrl]);
    
    // Save on unmount/navigation - ensure content is saved before leaving
    useEffect(() => {
        return () => {
            // Cleanup: save on unmount if there are unsaved changes
            const currentState = stateRef.current;
            if (currentState.isDirty && currentState.content.trim().length > 0) {
                const activeId = screenplayIdFromUrl || screenplayIdRef.current;
                if (activeId) {
                    console.log('[EditorContext] 💾 Saving on unmount (navigation/close)...');
                    // Use a synchronous approach - saveNow is async but we can't await in cleanup
                    // Save to localStorage as backup
                    localStorage.setItem('screenplay_draft', currentState.content);
                    localStorage.setItem('screenplay_title', currentState.title);
                    localStorage.setItem('screenplay_author', currentState.author);
                    // Attempt async save (fire and forget)
                    saveNow().catch(err => {
                        console.error('[EditorContext] ⚠️ Save on unmount failed:', err);
                    });
                }
            }
        };
    }, [saveNow, screenplayIdFromUrl]);
    
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
    
    // Reset hasRunAutoImportRef when screenplayId changes to re-trigger loadContent
    useEffect(() => {
        console.log('[EditorContext] screenplayId changed:', screenplayIdFromUrl, 'Resetting hasRunAutoImportRef.');
        hasRunAutoImportRef.current = false;
        // If screenplayId is valid, set it immediately so saveNow() can use it
        if (screenplayIdFromUrl && screenplayIdFromUrl.startsWith('screenplay_')) {
            screenplayIdRef.current = screenplayIdFromUrl; // Set it immediately
        } else {
            screenplayIdRef.current = null;
        }
        // Don't reset state here - let the load effect handle it
        // Only show loading indicator if needed
    }, [screenplayIdFromUrl]);
    
    // Feature 0111: Load screenplay from DynamoDB (or localStorage as fallback) on mount
    useEffect(() => {
        // Only run once per screenplayId change (controlled by hasRunAutoImportRef)
        if (hasRunAutoImportRef.current) {
            return;
        }
        
        // Wait for screenplay context and user to be ready
        if (!screenplay || !user) {
            return;
        }
        
        hasRunAutoImportRef.current = true; // Mark as run
        
        async function loadContent() {
            try {
                // Feature 0130: If a screenplay ID is specified in URL, load it directly
                if (screenplayIdFromUrl) {
                    try {
                        console.log('[EditorContext] 🎬 Screenplay specified in URL:', screenplayIdFromUrl);
                        
                        // Feature 0130: Only accept screenplay_ IDs - reject proj_ IDs
                        if (screenplayIdFromUrl.startsWith('proj_')) {
                            console.warn('[EditorContext] ⚠️ Rejected proj_ ID (legacy format):', screenplayIdFromUrl);
                            console.warn('[EditorContext] ⚠️ Please use screenplay_ ID instead. Legacy project IDs are no longer supported.');
                            // Continue with normal load flow (don't throw - let user see empty editor)
                        } else if (screenplayIdFromUrl.startsWith('screenplay_')) {
                            // It's a screenplay ID - load it directly
                            console.log('[EditorContext] Loading screenplay directly from URL...', screenplayIdFromUrl);
                            const screenplay = await getScreenplay(screenplayIdFromUrl, getToken);
                            
                            if (screenplay) {
                                console.log('[EditorContext] ✅ Loaded screenplay from URL:', screenplay.title);
                                screenplayIdRef.current = screenplayIdFromUrl;
                                
                                // Save to Clerk metadata
                                try {
                                    await setCurrentScreenplayId(user, screenplayIdFromUrl);
                                } catch (error) {
                                    console.error('[EditorContext] ⚠️ Failed to save screenplay_id to Clerk metadata:', error);
                                }
                                
                                // Sync ScreenplayContext via storage event
                                window.dispatchEvent(new StorageEvent('storage', {
                                    key: 'current_screenplay_id',
                                    newValue: screenplayIdFromUrl,
                                    oldValue: screenplayIdRef.current,
                                    storageArea: localStorage,
                                    url: window.location.href
                                }));
                                // Also update localStorage directly
                                localStorage.setItem('current_screenplay_id', screenplayIdFromUrl);
                                
                                // Update state with screenplay data
                                setState(prev => ({
                                    ...prev,
                                    title: screenplay.title || prev.title,
                                    content: screenplay.content || prev.content,
                                    author: screenplay.author || prev.author,
                                    isDirty: false
                                }));
                                
                                console.log('[EditorContext] ✅ Loaded screenplay from URL:', screenplayIdFromUrl);
                                isInitialLoadRef.current = false;
                                return; // Success - screenplay loaded!
                            } else {
                                console.warn('[EditorContext] ⚠️ Screenplay not found:', screenplayIdFromUrl);
                            }
                        } else {
                            console.warn('[EditorContext] ⚠️ Invalid ID format in URL:', screenplayIdFromUrl);
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
                            
                            screenplayIdRef.current = savedScreenplayId;
                            setState(prev => ({
                                ...prev,
                                content: savedScreenplay.content || '',
                                title: savedScreenplay.title || prev.title,
                                author: savedScreenplay.author || prev.author,
                                isDirty: false
                            }));
                            isInitialLoadRef.current = false;
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
            } catch (err) {
                console.error('[EditorContext] Failed to load content:', err);
                isInitialLoadRef.current = false;
            }
        }
        
        loadContent();
    }, [screenplay, getToken, user, screenplayIdFromUrl]); // Depend on screenplay, getToken, user, and screenplayId
    
    // Listen for screenplay updates from dashboard/modal and reload the screenplay
    useEffect(() => {
        const handleScreenplayUpdated = async () => {
            const activeId = screenplayIdFromUrl || screenplayIdRef.current;
            if (!activeId) {
                console.log('[EditorContext] Screenplay updated event received but no screenplay ID available');
                return;
            }
            
            console.log('[EditorContext] Screenplay updated event received, reloading screenplay:', activeId);
            try {
                const updatedScreenplay = await getScreenplay(activeId, getToken);
                if (updatedScreenplay) {
                    console.log('[EditorContext] ✅ Reloaded screenplay after update:', updatedScreenplay.title);
                    setState(prev => ({
                        ...prev,
                        title: updatedScreenplay.title || prev.title,
                        author: updatedScreenplay.author || prev.author,
                        // Don't update content - preserve current editor content
                        // Only update title and author which are metadata
                    }));
                }
            } catch (error) {
                console.error('[EditorContext] Failed to reload screenplay after update:', error);
            }
        };
        
        window.addEventListener('screenplayUpdated', handleScreenplayUpdated);
        return () => {
            window.removeEventListener('screenplayUpdated', handleScreenplayUpdated);
        };
    }, [screenplayIdFromUrl, getToken]);
    
    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
}

// Wrapper component that handles useSearchParams with Suspense
// Note: URL parameter is 'project' for backward compatibility, but value is always a screenplay_id
function ProjectIdReader({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const screenplayId = searchParams?.get('project'); // URL param is 'project' but contains screenplay_id
    return <EditorProviderInner screenplayId={screenplayId}>{children}</EditorProviderInner>;
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

