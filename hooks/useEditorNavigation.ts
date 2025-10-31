'use client';

import { useCallback, useRef, useEffect, RefObject } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { LinePositionCache } from '@/utils/LinePositionCache';

interface UseEditorNavigationReturn {
    scrollToLine: (lineNumber: number, timestamp?: number) => void;
    clearCache: () => void;
}

/**
 * Custom hook to handle editor navigation and scrolling to specific lines
 * Extracts scene navigation logic from FountainEditor with performance optimizations
 * 
 * Uses LinePositionCache for O(1) line-to-position lookups instead of O(n) iteration
 * 
 * @param textareaRef - Reference to the textarea element
 * @param content - Current editor content (stripped display content)
 */
export function useEditorNavigation(
    textareaRef: RefObject<HTMLTextAreaElement>,
    content: string
): UseEditorNavigationReturn {
    const { markSaved } = useEditor();
    
    // Track last processed navigation timestamp to prevent duplicates
    const lastProcessedNavigationTime = useRef<number | undefined>(undefined);
    
    // Initialize line position cache
    const linePositionCache = useRef(new LinePositionCache());
    
    /**
     * Clean up cache on unmount
     */
    useEffect(() => {
        return () => {
            linePositionCache.current.clear();
        };
    }, []);
    
    /**
     * Scroll to a specific line number in the editor
     * 
     * @param lineNumber - Line number to scroll to (1-based)
     * @param timestamp - Optional timestamp to deduplicate navigation events
     */
    const scrollToLine = useCallback((lineNumber: number, timestamp?: number) => {
        if (!textareaRef.current) {
            console.warn('[useEditorNavigation] Textarea ref not available');
            return;
        }
        
        // Skip if we've already processed this specific navigation
        if (timestamp && lastProcessedNavigationTime.current === timestamp) {
            console.log('[useEditorNavigation] Skipping duplicate navigation:', lineNumber);
            return;
        }
        
        // Validate line number
        if (lineNumber <= 0) {
            console.warn('[useEditorNavigation] Invalid line number:', lineNumber);
            return;
        }
        
        const textarea = textareaRef.current;
        
        // Use cached line position calculation for O(1) lookup
        const charPosition = linePositionCache.current.getCharPosition(content, lineNumber);
        
        console.log('[useEditorNavigation] Scrolling to line:', {
            lineNumber,
            charPosition,
            contentLength: content.length,
            cacheStats: linePositionCache.current.getStats()
        });
        
        // Set cursor position at the start of the target line
        textarea.selectionStart = charPosition;
        textarea.selectionEnd = charPosition;
        
        // Focus and let browser handle scrolling automatically
        // preventScroll: false allows browser's native smooth scrolling
        textarea.focus({ preventScroll: false });
        
        // Mark as saved since navigation doesn't change content
        markSaved();
        
        // Mark this navigation as processed
        if (timestamp) {
            lastProcessedNavigationTime.current = timestamp;
        }
    }, [textareaRef, content, markSaved]);
    
    /**
     * Clear the line position cache
     * Useful if memory management is needed or content is replaced entirely
     */
    const clearCache = useCallback(() => {
        linePositionCache.current.clear();
        console.log('[useEditorNavigation] Cache cleared');
    }, []);
    
    return {
        scrollToLine,
        clearCache
    };
}

