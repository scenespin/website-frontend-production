'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { FountainElementType } from '@/utils/fountain';
import { useScreenplay } from './ScreenplayContext';
import { saveToGitHub } from '@/utils/github';

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
    author: '',
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

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<EditorState>(defaultState);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const githubSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true); // Prevent auto-clear during initial import
    const hasRunAutoImportRef = useRef(false); // Prevent infinite import loop
    
    // Get GitHub config from ScreenplayContext
    const screenplay = useScreenplay();
    const githubConfig = screenplay?.isConnected ? {
        token: localStorage.getItem('screenplay_github_config') ? JSON.parse(localStorage.getItem('screenplay_github_config')!).token : null,
        owner: localStorage.getItem('screenplay_github_config') ? JSON.parse(localStorage.getItem('screenplay_github_config')!).owner : null,
        repo: localStorage.getItem('screenplay_github_config') ? JSON.parse(localStorage.getItem('screenplay_github_config')!).repo : null,
    } : null;
    
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
            const pos = position ?? prev.cursorPosition;
            const before = prev.content.substring(0, pos);
            const after = prev.content.substring(pos);
            const newContent = before + text + after;
            
            console.log('[EditorContext] insertText - setting highlightRange:', { start: pos, end: pos + text.length });
            
            return {
                ...prev,
                content: newContent,
                cursorPosition: pos + text.length,
                isDirty: true,
                highlightRange: { start: pos, end: pos + text.length }
            };
        });
    }, []);
    
    const replaceSelection = useCallback((text: string, start: number, end: number) => {
        setState(prev => {
            const before = prev.content.substring(0, start);
            const after = prev.content.substring(end);
            const newContent = before + text + after;
            
            console.log('[EditorContext] replaceSelection - setting highlightRange:', { start, end: start + text.length });
            
            return {
                ...prev,
                content: newContent,
                cursorPosition: start + text.length,
                isDirty: true,
                highlightRange: { start, end: start + text.length }
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
        toggleFocusMode,
        toggleLineNumbers,
        setFontSize,
        setHighlightRange,
        clearHighlight,
        reset
    };
    
    // Auto-save to localStorage with debounce
    useEffect(() => {
        if (!state.isDirty) return;
        
        // Clear any existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        
        // Set new timer for auto-save
        autoSaveTimerRef.current = setTimeout(() => {
            try {
                // Save to localStorage
                localStorage.setItem('screenplay_draft', state.content);
                localStorage.setItem('screenplay_title', state.title);
                localStorage.setItem('screenplay_author', state.author);
                
                console.log('[EditorContext] Auto-saved to localStorage');
                
                // Mark as saved
                setState(prev => ({
                    ...prev,
                    isDirty: false,
                    lastSaved: new Date()
                }));
            } catch (err) {
                console.error('[EditorContext] Auto-save to localStorage failed:', err);
            }
        }, 2000); // 2 second debounce
        
        // Cleanup
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [state.content, state.title, state.author, state.isDirty]);
    
    // Auto-sync to GitHub with longer debounce (20 seconds)
    useEffect(() => {
        if (!state.isDirty || !githubConfig || !githubConfig.token) return;
        
        // Clear any existing timer
        if (githubSyncTimerRef.current) {
            clearTimeout(githubSyncTimerRef.current);
        }
        
        // Set new timer for GitHub sync
            githubSyncTimerRef.current = setTimeout(async () => {
                try {
                    console.log('[EditorContext] Syncing to GitHub...');

                    await saveToGitHub(githubConfig, {
                        path: 'screenplay.fountain',
                        content: state.content,
                        message: `Auto-save: ${state.title}`,
                        branch: 'main'
                    });

                    console.log('[EditorContext] ✅ Synced to GitHub');
                } catch (err) {
                    console.error('[EditorContext] GitHub sync failed:', err);
                    // Don't throw - localStorage backup is already saved
                }
            }, 30000); // 30 second debounce for GitHub (industry standard)
        
        // Cleanup
        return () => {
            if (githubSyncTimerRef.current) {
                clearTimeout(githubSyncTimerRef.current);
            }
        };
    }, [state.content, state.title, state.isDirty, githubConfig]);
    
    // Monitor editor content and clear data if editor is cleared (EDITOR = SOURCE OF TRUTH)
    // Use a debounced check to avoid clearing immediately after import
    useEffect(() => {
        // Skip auto-clear during initial load/import
        if (isInitialLoadRef.current) {
            return;
        }
        
        const trimmedContent = state.content.trim();
        const lineCount = state.content.split('\n').filter(line => line.trim()).length;
        
        // If editor is essentially empty (< 3 non-empty lines OR < 20 characters total)
        const isEffectivelyEmpty = lineCount < 3 || trimmedContent.length < 20;
        
        if (isEffectivelyEmpty) {
            // Debounce: Wait 1 second before clearing to avoid clearing right after paste
            const clearTimer = setTimeout(() => {
                // Check if we actually have data to clear
                const hasScenes = screenplay?.beats?.some(beat => beat.scenes && beat.scenes.length > 0);
                const hasCharacters = screenplay?.characters && screenplay.characters.length > 0;
                const hasLocations = screenplay?.locations && screenplay.locations.length > 0;
                
                if (hasScenes || hasCharacters || hasLocations) {
                    console.log('[EditorContext] 🗑️ Editor cleared - clearing all screenplay data');
                    screenplay?.clearAllData();
                }
            }, 1000); // 1 second delay
            
            return () => clearTimeout(clearTimer);
        }
    }, [state.content, screenplay]);
    
    // Load screenplay from GitHub (or localStorage as fallback) on mount
    useEffect(() => {
        // Only run once on mount
        if (hasRunAutoImportRef.current) {
            return;
        }
        
        hasRunAutoImportRef.current = true; // Mark as run
        
        // Wait for screenplay context to be ready
        if (!screenplay) {
            return;
        }
        
        async function loadContent() {
            try {
                // Priority 1: Load from GitHub if connected
                if (githubConfig && githubConfig.token) {
                    try {
                        console.log('[EditorContext] Loading screenplay from GitHub...');
                        const response = await fetch(
                            `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/screenplay.fountain`,
                            {
                                headers: {
                                    'Authorization': `token ${githubConfig.token}`,
                                    'Accept': 'application/vnd.github.v3.raw'
                                }
                            }
                        );
                        
                        if (response.ok) {
                            const content = await response.text();
                            console.log('[EditorContext] ✅ Loaded screenplay from GitHub');
                            setState(prev => ({
                                ...prev,
                                content,
                                isDirty: false
                            }));
                            isInitialLoadRef.current = false;
                            return; // Success!
                        } else if (response.status === 404) {
                            console.log('[EditorContext] No screenplay in GitHub yet (404), using localStorage fallback');
                        } else {
                            console.warn('[EditorContext] GitHub load failed:', response.status);
                        }
                    } catch (err) {
                        console.error('[EditorContext] Error loading from GitHub:', err);
                    }
                }
                
                // Priority 2: Fallback to localStorage (for first-time users or offline)
                const savedContent = localStorage.getItem('screenplay_draft');
                const savedTitle = localStorage.getItem('screenplay_title');
                const savedAuthor = localStorage.getItem('screenplay_author');
                
                if (savedContent) {
                    console.log('[EditorContext] Loaded draft from localStorage (fallback)');
                    setState(prev => ({
                        ...prev,
                        content: savedContent,
                        title: savedTitle || prev.title,
                        author: savedAuthor || prev.author,
                        isDirty: false
                    }));
                } else {
                    console.log('[EditorContext] No saved content found (new user)');
                }
                
                isInitialLoadRef.current = false;
            } catch (err) {
                console.error('[EditorContext] Failed to load content:', err);
                isInitialLoadRef.current = false;
            }
        }
        
        loadContent();
    }, [screenplay, githubConfig]); // Depend on both
    
    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
}

