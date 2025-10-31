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

interface ContextMenuState {
    show: boolean;
    position: { x: number; y: number };
    close: () => void;
}

interface SelectionHandlers {
    onMouseUp: () => void;
    onContextMenu: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
    onTouchStart: (e: React.TouchEvent<HTMLTextAreaElement>) => void;
    onTouchEnd: () => void;
    onTouchMove: () => void;
}

interface UseEditorSelectionReturn {
    selection: SelectionState;
    toolbar: ToolbarState;
    contextMenu: ContextMenuState;
    handlers: SelectionHandlers;
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
    
    // Context menu state
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    
    // Touch handling state
    const [isLongPressing, setIsLongPressing] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    
    /**
     * Cleanup timers on unmount
     */
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);
    
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
     * Handle right-click on selected text (desktop)
     */
    const handleContextMenu = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
        // Only show context menu if text is selected
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        if (end - start > 0) {
            e.preventDefault();
            const selected = content.substring(start, end);
            
            setSelectedText(selected);
            setSelectionStart(start);
            setSelectionEnd(end);
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
            
            // Hide the old toolbar if it's showing
            setShowSelectionToolbar(false);
        }
    }, [textareaRef, content]);
    
    /**
     * Handle long-press start (mobile)
     */
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        
        // Only start long-press timer if text is selected
        if (end - start > 0) {
            setIsLongPressing(true);
            
            longPressTimer.current = setTimeout(() => {
                const selected = content.substring(start, end);
                const touch = e.touches[0];
                
                setSelectedText(selected);
                setSelectionStart(start);
                setSelectionEnd(end);
                setContextMenuPosition({ 
                    x: touch.clientX, 
                    y: touch.clientY 
                });
                setShowContextMenu(true);
                setIsLongPressing(false);
                
                // Hide the old toolbar
                setShowSelectionToolbar(false);
            }, 500); // 500ms long press
        }
    }, [textareaRef, content]);
    
    /**
     * Handle long-press cancel (mobile)
     */
    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setIsLongPressing(false);
    }, []);
    
    /**
     * Handle touch move - cancel long press if user moves finger
     */
    const handleTouchMove = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setIsLongPressing(false);
    }, []);
    
    /**
     * Close selection toolbar
     */
    const closeToolbar = useCallback(() => {
        setShowSelectionToolbar(false);
    }, []);
    
    /**
     * Close context menu
     */
    const closeContextMenu = useCallback(() => {
        setShowContextMenu(false);
    }, []);
    
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
        contextMenu: {
            show: showContextMenu,
            position: contextMenuPosition,
            close: closeContextMenu
        },
        handlers: {
            onMouseUp: handleMouseUp,
            onContextMenu: handleContextMenu,
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd,
            onTouchMove: handleTouchMove
        }
    };
}

