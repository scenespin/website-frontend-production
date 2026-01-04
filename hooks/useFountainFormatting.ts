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
     * - Tab: Format current line as CHARACTER (unless Wryda Tab Navigation is enabled)
     * - Shift+Tab: Format current line as SCENE HEADING
     */
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!textareaRef.current) return;
        
        // Check if Wryda Tab Navigation is enabled - if so, Tab is handled elsewhere
        const WRYDA_TAB_ENABLED = process.env.NEXT_PUBLIC_WRYDA_TAB === 'true';
        if (WRYDA_TAB_ENABLED && e.key === 'Tab' && !e.shiftKey) {
            // Tab is handled by WrydaTabNavigation hook, but if it returns false,
            // we'll fall through to default behavior (this shouldn't happen, but safety check)
            return;
        }
        
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
            // Note: 'Enter' is not affected by Caps Lock, so no need to lowercase
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
        
        // Ctrl/Cmd + I - Toggle italics (case-insensitive for Caps Lock)
        else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
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
            let selectedText = state.content.substring(fullSelectionStart, fullSelectionEnd);
            
            // Debug: Log selection to help diagnose issues
            console.log('[Italics] Selection debug:', {
                displayStart: displaySelectionStart,
                displayEnd: displaySelectionEnd,
                fullStart: fullSelectionStart,
                fullEnd: fullSelectionEnd,
                selectedText: JSON.stringify(selectedText),
                selectedTextLength: selectedText.length,
                includesNewline: selectedText.includes('\n'),
                lines: selectedText.split('\n').length,
                textareaSelection: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
            });
            
            // Handle whitespace: trim trailing spaces from word selections
            // When selecting a word, browsers often include the trailing space
            // e.g., "slides " should become "*slides* " not "*slides *"
            const isSingleLine = !selectedText.includes('\n');
            const isShortSelection = selectedText.length < 50; // Likely a word/phrase, not a paragraph
            const trimmedText = selectedText.trim();
            const hasTrailingSpace = selectedText.endsWith(' ') && !selectedText.endsWith('\n');
            const hasLeadingSpace = selectedText.startsWith(' ') && !selectedText.startsWith('\n');
            
            let trailingSpaceToRestore = '';
            if (isSingleLine && isShortSelection && hasTrailingSpace && !hasLeadingSpace) {
                // Single word with trailing space - trim it and restore after closing asterisk
                trailingSpaceToRestore = ' ';
                selectedText = selectedText.slice(0, -1);
                console.log('[Italics] Trimmed trailing space from word selection');
            } else if (isSingleLine && isShortSelection && hasTrailingSpace && hasLeadingSpace) {
                // Both leading and trailing spaces - preserve leading, trim trailing
                const leadingSpace = selectedText.match(/^ +/)?.[0] || '';
                selectedText = leadingSpace + trimmedText;
                trailingSpaceToRestore = ' ';
                console.log('[Italics] Trimmed trailing space, preserved leading space');
            }
            
            // Handle trailing newline: if selection is a single line that ends with newline,
            // we need to preserve the line break structure
            const hasTrailingNewline = selectedText.endsWith('\n');
            const lines = selectedText.split('\n');
            const lastLineIsEmpty = lines.length > 1 && lines[lines.length - 1] === '';
            let shouldAddNewlineAfterWrap = false;
            
            if (hasTrailingNewline && lines.length === 2 && lastLineIsEmpty) {
                // Single line with trailing newline - remove newline from selection
                // but we'll add it back AFTER the closing asterisk to preserve line structure
                selectedText = selectedText.slice(0, -1);
                shouldAddNewlineAfterWrap = true;
                console.log('[Italics] Single line with trailing newline - will add newline after wrap');
            }
            
            // Check if already italic (wrapped in *text*)
            // For multi-line selections, check if the entire block is wrapped (not per-line)
            const trimmed = selectedText.trim();
            const startsWithAsterisk = trimmed.startsWith('*');
            const endsWithAsterisk = trimmed.endsWith('*');
            
            // Check if the entire selection is wrapped (not individual lines)
            // Look for pattern: *text* where text can include newlines
            // We need to check if the FIRST character after leading whitespace is * 
            // and the LAST character before trailing whitespace is *
            const leadingWhitespace = selectedText.match(/^\s*/)?.[0] || '';
            const trailingWhitespace = selectedText.match(/\s*$/)?.[0] || '';
            const contentWithoutWhitespace = selectedText.slice(leadingWhitespace.length, selectedText.length - trailingWhitespace.length);
            
            const isAlreadyItalic = contentWithoutWhitespace.startsWith('*') && 
                                   contentWithoutWhitespace.endsWith('*') &&
                                   contentWithoutWhitespace.length > 1; // At least *something*
            
            let newText: string;
            
            if (isAlreadyItalic) {
                // Remove italics - remove outer asterisks while preserving whitespace
                const unwrappedContent = contentWithoutWhitespace.slice(1, -1); // Remove first and last *
                newText = leadingWhitespace + unwrappedContent + trailingWhitespace;
            } else {
                // Add italics - wrap entire selection as one block
                // If we removed trailing whitespace, add it back after the closing asterisk
                // This preserves spacing: *word* instead of *word *
                if (shouldAddNewlineAfterWrap) {
                    newText = `*${selectedText}*\n${trailingSpaceToRestore}`;
                } else if (trailingSpaceToRestore) {
                    // Word selection with trailing space - restore space after closing asterisk
                    newText = `*${selectedText}*${trailingSpaceToRestore}`;
                } else {
                    // Multi-line or no trailing whitespace: wrap as-is
                    newText = `*${selectedText}*`;
                }
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

