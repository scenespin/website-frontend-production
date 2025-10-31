'use client';

import { useState, useCallback, KeyboardEvent, RefObject } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import {
    detectElementType,
    getNextElementType,
    formatElement,
    FountainElementType,
    getVisibleLineNumber
} from '@/utils/fountain';

interface UseFountainFormattingReturn {
    currentType: FountainElementType;
    handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
    detectCurrentType: (content: string, cursorPos: number) => void;
}

/**
 * Custom hook to handle Fountain formatting and keyboard shortcuts
 * Extracts formatting logic from FountainEditor
 * 
 * @param textareaRef - Reference to the textarea element
 */
export function useFountainFormatting(
    textareaRef: RefObject<HTMLTextAreaElement>
): UseFountainFormattingReturn {
    const { state, setContent, setCursorPosition, setCurrentElementType } = useEditor();
    
    // Current element type
    const [currentType, setCurrentType] = useState<FountainElementType>('action');
    
    /**
     * Handle keyboard shortcuts for Fountain formatting
     * - Enter: Smart line breaks with auto-transition
     * - Tab: Format current line as CHARACTER
     * - Shift+Tab: Format current line as SCENE HEADING
     */
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1] || '';
        
        // Enter key - auto-transition to next element type
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            const previousType = detectElementType(currentLineText);
            const nextType = getNextElementType(previousType);
            
            // Insert new line
            const newContent = textBeforeCursor + '\n' + textAfterCursor;
            setContent(newContent);
            
            // Move cursor to new line
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = cursorPos + 1;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            setCurrentType(nextType);
            setCurrentElementType(nextType);
        }
        
        // Tab key - quick format current line as CHARACTER
        else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            
            const formattedLine = formatElement(currentLineText, 'character');
            const newTextBefore = lines.slice(0, -1).concat(formattedLine).join('\n');
            const newContent = newTextBefore + textAfterCursor;
            
            setContent(newContent);
            
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = newTextBefore.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            setCurrentType('character');
            setCurrentElementType('character');
        }
        
        // Shift + Tab - quick format current line as SCENE HEADING
        else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            
            const formattedLine = formatElement(currentLineText, 'scene_heading');
            const newTextBefore = lines.slice(0, -1).concat(formattedLine).join('\n');
            const newContent = newTextBefore + textAfterCursor;
            
            setContent(newContent);
            
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = newTextBefore.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            setCurrentType('scene_heading');
            setCurrentElementType('scene_heading');
        }
    }, [textareaRef, state.content, setContent, setCursorPosition, setCurrentElementType]);
    
    /**
     * Detect the current element type at cursor position
     * Called on content changes to update the element type indicator
     */
    const detectCurrentType = useCallback((content: string, cursorPos: number) => {
        // Calculate current line number (visible lines only)
        const visibleLineNumber = getVisibleLineNumber(content, cursorPos);
        
        // Detect current element type (from visible content)
        const lines = content.split('\n');
        const currentLineText = lines[visibleLineNumber - 1] || '';
        const previousLineText = visibleLineNumber > 1 ? lines[visibleLineNumber - 2] : '';
        const previousType = detectElementType(previousLineText);
        const detectedType = detectElementType(currentLineText, previousType);
        
        setCurrentType(detectedType);
        setCurrentElementType(detectedType);
    }, [setCurrentElementType]);
    
    return {
        currentType,
        handleKeyDown,
        detectCurrentType
    };
}

