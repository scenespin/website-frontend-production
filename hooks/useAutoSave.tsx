'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';

interface AutoSaveOptions {
    enabled?: boolean;
    debounceMs?: number;
    onSave?: (content: string) => Promise<void>;
    onError?: (error: Error) => void;
}

/**
 * Custom hook for auto-saving editor content with debouncing
 * 
 * Automatically saves content after a period of inactivity
 * 
 * @param options Configuration options for auto-save behavior
 * 
 * @example
 * useAutoSave({
 *   enabled: true,
 *   debounceMs: 2000,
 *   onSave: async (content) => {
 *     await saveToCloud(content);
 *   }
 * });
 */
export function useAutoSave({
    enabled = true,
    debounceMs = 2000,
    onSave,
    onError
}: AutoSaveOptions = {}) {
    const { state, markSaved, markDirty } = useEditor();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedContent = useRef<string>(state.content);
    const isSavingRef = useRef(false);
    
    const save = useCallback(async (content: string) => {
        if (!onSave) return;
        if (isSavingRef.current) return;
        if (content === lastSavedContent.current) return;
        
        isSavingRef.current = true;
        markDirty();
        
        try {
            await onSave(content);
            lastSavedContent.current = content;
            markSaved();
        } catch (error) {
            console.error('[AutoSave] Save failed:', error);
            if (onError && error instanceof Error) {
                onError(error);
            }
        } finally {
            isSavingRef.current = false;
        }
    }, [onSave, onError, markSaved, markDirty]);
    
    useEffect(() => {
        if (!enabled) return;
        if (!onSave) return;
        
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Set new timeout for debounced save
        saveTimeoutRef.current = setTimeout(() => {
            save(state.content);
        }, debounceMs);
        
        // Cleanup
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [state.content, enabled, debounceMs, save, onSave]);
    
    // Save on unmount (when user navigates away)
    useEffect(() => {
        return () => {
            if (state.isDirty && onSave) {
                // Attempt synchronous save on unmount
                onSave(state.content).catch((error) => {
                    console.error('[AutoSave] Final save failed:', error);
                });
            }
        };
    }, [state.isDirty, state.content, onSave]);
    
    return {
        save: () => save(state.content),
        isSaving: isSavingRef.current
    };
}

