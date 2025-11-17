'use client';

import { useState, useCallback, useRef, useEffect, RefObject } from 'react';
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
}

interface UseEditorSelectionReturn {
    selection: SelectionState;
    toolbar: ToolbarState;
    handlers: SelectionHandlers;
    hasSelection: boolean;
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
    
    // Toolbar state
    const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    
    /**
     * Handle mouse up event - check for text selection
     */
    const handleMouseUp = useCallback(() => {
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        console.log('[useEditorSelection] Mouse up - selection:', { start, end, length: end - start });
        
        // Update EditorContext with current selection
        setSelection(start, end);
        
        // Notify parent of selection changes (even for small selections)
        if (onSelectionChange) {
            onSelectionChange(start, end);
        }
        
        // Only show toolbar if text is actually selected (more than 5 characters to avoid accidental selections)
        if (end - start > 5) {
            const selected = content.substring(start, end);
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
            // Hide toolbar if selection is cleared
            setShowSelectionToolbar(false);
        }
    }, [textareaRef, content, setSelection, onSelectionChange]);
    
    /**
     * Close selection toolbar
     */
    const closeToolbar = useCallback(() => {
        setShowSelectionToolbar(false);
    }, []);
    
    /**
     * Check if text is currently selected
     */
    const hasSelection = selectionEnd - selectionStart > 0;
    
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
            onMouseUp: handleMouseUp
        },
        hasSelection
    };
}

