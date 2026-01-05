'use client';

import { useState, useCallback, useRef, useEffect, RefObject, MutableRefObject } from 'react';
import { useEditor } from '@/contexts/EditorContext';

interface SelectionState {
    start: number;
    end: number;
    text: string;
}

interface ToolbarState {
    show: boolean;
    position: { top: number; left: number };
    close: () => void;
}

interface SelectionHandlers {
    onMouseUp: () => void;
    onPointerUp: () => void;
}

interface UseEditorSelectionReturn {
    selection: SelectionState;
    toolbar: ToolbarState;
    handlers: SelectionHandlers;
    hasSelection: boolean;
    // Expose ref for immediate access (Solution 6)
    selectionRef: MutableRefObject<{ start: number; end: number; text: string } | null>;
}

/**
 * Custom hook to handle text selection, toolbar, and context menu functionality
 * Extracts selection management logic from FountainEditor
 * 
 * @param textareaRef - Reference to the textarea element
 * @param content - Current editor content (for extracting selected text)
 * @param onSelectionChange - Optional callback when selection changes
 */
export function useEditorSelection(
    textareaRef: RefObject<HTMLTextAreaElement>,
    content: string,
    onSelectionChange?: (start: number, end: number) => void
): UseEditorSelectionReturn {
    const { setSelection } = useEditor();
    
    // Selection state
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);
    const [selectedText, setSelectedText] = useState('');
    
    // Solution 6: Ref storage for immediate access (no React state delay)
    const selectionRef = useRef<{ start: number; end: number; text: string } | null>(null);
    
    // Toolbar state
    const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    
    /**
     * Shared selection capture logic (used by both mouse and pointer events)
     * Solution 6: Updates both state and ref for immediate access
     */
    const captureSelection = useCallback(() => {
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        console.log('[useEditorSelection] Selection captured - selection:', { start, end, length: end - start });
        
        // Update EditorContext with current selection
        setSelection(start, end);
        
        // Notify parent of selection changes (even for small selections)
        if (onSelectionChange) {
            onSelectionChange(start, end);
        }
        
        // 🔥 CRITICAL: Check if there's actual text selection (not just cursor position)
        // Only show toolbar if text is actually selected (more than 5 characters to avoid accidental selections)
        if (end - start > 5) {
            const selected = content.substring(start, end);
            
            // Solution 6: Update ref immediately (synchronous, no React state delay)
            selectionRef.current = { start, end, text: selected };
            
            // Update state (for React reactivity)
            setSelectedText(selected);
            setSelectionStart(start);
            setSelectionEnd(end);
            
            console.log('[useEditorSelection] Text selected:', selected.substring(0, 50) + '...');
            
            // Calculate toolbar position based on selection
            const rect = textareaRef.current.getBoundingClientRect();
            setToolbarPosition({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
            
            setShowSelectionToolbar(true);
        } else {
            // 🔥 FIX: Clear selection state when there's no actual selection (cursor position only)
            // This ensures hasSelection is false when there's just a cursor, not a text selection
            
            // Solution 6: Clear ref immediately
            selectionRef.current = null;
            
            setSelectedText('');
            setSelectionStart(start); // Set to current cursor position
            setSelectionEnd(start);   // Set to current cursor position (start === end = no selection)
            
            // Hide toolbar if selection is cleared
            setShowSelectionToolbar(false);
        }
    }, [textareaRef, content, setSelection, onSelectionChange]);
    
    /**
     * Handle mouse up event - check for text selection
     * Kept for backward compatibility with desktop
     */
    const handleMouseUp = useCallback(() => {
        captureSelection();
    }, [captureSelection]);
    
    /**
     * Solution 8: Handle pointer up event - works with mouse, touch, and stylus
     * More reliable on mobile than mouse events
     */
    const handlePointerUp = useCallback(() => {
        captureSelection();
    }, [captureSelection]);
    
    /**
     * Close selection toolbar
     */
    const closeToolbar = useCallback(() => {
        setShowSelectionToolbar(false);
    }, []);
    
    /**
     * Check if text is currently selected
     * 🔥 CRITICAL: Only return true if there's actual text selected (not just cursor position)
     * Require at least 1 character difference to ensure it's a real selection
     */
    const hasSelection = selectionEnd - selectionStart > 0 && selectedText.trim().length > 0;
    
    return {
        selection: {
            start: selectionStart,
            end: selectionEnd,
            text: selectedText
        },
        toolbar: {
            show: showSelectionToolbar,
            position: toolbarPosition,
            close: closeToolbar
        },
        handlers: {
            onMouseUp: handleMouseUp,
            onPointerUp: handlePointerUp
        },
        hasSelection,
        // Solution 6: Expose ref for immediate access (no React state delay)
        selectionRef
    };
}

