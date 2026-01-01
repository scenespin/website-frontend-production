'use client';

import { useState, useCallback, KeyboardEvent, RefObject } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import {
    detectElementType,
    getNextElementType,
    formatElement,
    FountainElementType,
    getVisibleLineNumber,
    stripTagsForDisplay,
    mapDisplayPositionToFullContent
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
    const { state, setContent, setCursorPosition, setCurrentElementType, replaceSelection } = useEditor();
    
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
        
        // Ctrl/Cmd + Enter - New scene heading
        else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            
            // Insert new line with "INT. " or "EXT. " prefix
            const newLinePrefix = 'INT. ';
            const newContent = textBeforeCursor + '\n' + newLinePrefix + textAfterCursor;
            setContent(newContent);
            
            // Move cursor to after the prefix
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = cursorPos + 1 + newLinePrefix.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            
            setCurrentType('scene_heading');
            setCurrentElementType('scene_heading');
        }
        
        // Ctrl/Cmd + I - Toggle italics
        else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
            e.preventDefault();
            
            const displayContent = stripTagsForDisplay(state.content);
            const displaySelectionStart = textarea.selectionStart; // Position in displayContent
            const displaySelectionEnd = textarea.selectionEnd; // Position in displayContent
            const hasSelection = displaySelectionStart !== displaySelectionEnd;
            
            if (!hasSelection) {
                // No selection - just insert italic markers at cursor
                const fullCursorPos = mapDisplayPositionToFullContent(displayContent, state.content, cursorPos);
                const newContent = state.content.substring(0, fullCursorPos) + '*|*' + state.content.substring(fullCursorPos);
                setContent(newContent);
                
                setTimeout(() => {
                    if (textareaRef.current) {
                        const newPos = cursorPos + 1;
                        textareaRef.current.selectionStart = newPos;
                        textareaRef.current.selectionEnd = newPos;
                        setCursorPosition(newPos);
                    }
                }, 0);
                return;
            }
            
            // Map display positions to full content positions
            const fullSelectionStart = mapDisplayPositionToFullContent(displayContent, state.content, displaySelectionStart);
            const fullSelectionEnd = mapDisplayPositionToFullContent(displayContent, state.content, displaySelectionEnd);
            
            // Get selected text from full content
            const selectedText = state.content.substring(fullSelectionStart, fullSelectionEnd);
            
            // Check if already italic (wrapped in *text*)
            const italicRegex = /^\*([^*]+)\*$/;
            const isAlreadyItalic = italicRegex.test(selectedText);
            
            let newText: string;
            
            if (isAlreadyItalic) {
                // Remove italics
                newText = selectedText.replace(/^\*(.+)\*$/, '$1');
            } else {
                // Add italics
                newText = `*${selectedText}*`;
            }
            
            // Replace selection using replaceSelection function
            replaceSelection(newText, fullSelectionStart, fullSelectionEnd);
            
            // Update cursor position - new text length in display content
            const newDisplayLength = stripTagsForDisplay(newText).length;
            setTimeout(() => {
                if (textareaRef.current) {
                    const newEnd = displaySelectionStart + newDisplayLength;
                    textareaRef.current.selectionStart = newEnd;
                    textareaRef.current.selectionEnd = newEnd;
                    setCursorPosition(newEnd);
                }
            }, 0);
        }
    }, [textareaRef, state.content, setContent, setCursorPosition, setCurrentElementType, replaceSelection]);
    
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

