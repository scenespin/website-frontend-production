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
    const handleInlineStyleToggle = useCallback((
        textarea: HTMLTextAreaElement,
        marker: string,
        logPrefix: string
    ) => {
        const cursorPos = textarea.selectionStart;
        const displayContent = stripTagsForDisplay(state.content);
        const displaySelectionStart = textarea.selectionStart; // Position in displayContent
        const displaySelectionEnd = textarea.selectionEnd; // Position in displayContent
        const hasSelection = displaySelectionStart !== displaySelectionEnd;
        
        if (!hasSelection) {
            // No selection - insert paired markers and place cursor between them
            const fullCursorPos = mapDisplayPositionToFullContent(displayContent, state.content, cursorPos);
            const pair = `${marker}${marker}`;
            const newContent = state.content.substring(0, fullCursorPos) + pair + state.content.substring(fullCursorPos);
            setContent(newContent);
            
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = cursorPos + marker.length;
                    textareaRef.current.selectionStart = newPos;
                    textareaRef.current.selectionEnd = newPos;
                    setCursorPosition(newPos);
                }
            }, 0);
            return;
        }
        
        // Map display positions to full content positions
        const originalFullSelectionStart = mapDisplayPositionToFullContent(displayContent, state.content, displaySelectionStart);
        const originalFullSelectionEnd = mapDisplayPositionToFullContent(displayContent, state.content, displaySelectionEnd);
        let fullSelectionStart = originalFullSelectionStart;
        let fullSelectionEnd = originalFullSelectionEnd;

        // If user selected inner text only, absorb surrounding style wrappers so toggle-off works naturally.
        const expandSelectionToStyleWrappers = (start: number, end: number): { start: number; end: number } => {
            let expandedStart = start;
            let expandedEnd = end;
            let changed = true;

            const tryExpand = (token: string): boolean => {
                if (expandedStart < token.length || expandedEnd + token.length > state.content.length) {
                    return false;
                }
                const before = state.content.slice(expandedStart - token.length, expandedStart);
                const after = state.content.slice(expandedEnd, expandedEnd + token.length);
                if (before === token && after === token) {
                    expandedStart -= token.length;
                    expandedEnd += token.length;
                    return true;
                }
                return false;
            };

            while (changed) {
                changed = false;
                // Longest tokens first to avoid splitting combined wrappers incorrectly.
                if (tryExpand('***')) { changed = true; continue; }
                if (tryExpand('~~')) { changed = true; continue; }
                if (tryExpand('**')) { changed = true; continue; }
                if (tryExpand('_')) { changed = true; continue; }
                if (tryExpand('*')) { changed = true; continue; }
            }

            return { start: expandedStart, end: expandedEnd };
        };

        const expandedRange = expandSelectionToStyleWrappers(fullSelectionStart, fullSelectionEnd);
        fullSelectionStart = expandedRange.start;
        fullSelectionEnd = expandedRange.end;
        
        // Get selected text from full content (after expansion)
        let selectedText = state.content.substring(fullSelectionStart, fullSelectionEnd);
        
        console.log(`[${logPrefix}] Selection debug:`, {
            displayStart: displaySelectionStart,
            displayEnd: displaySelectionEnd,
            originalFullStart: originalFullSelectionStart,
            originalFullEnd: originalFullSelectionEnd,
            fullStart: fullSelectionStart,
            fullEnd: fullSelectionEnd,
            selectedText: JSON.stringify(selectedText),
            selectedTextLength: selectedText.length,
            includesNewline: selectedText.includes('\n'),
            lines: selectedText.split('\n').length,
            textareaSelection: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
        });
        
        // Handle whitespace: trim trailing spaces from word selections
        const isSingleLine = !selectedText.includes('\n');
        const isShortSelection = selectedText.length < 50; // Likely a word/phrase, not a paragraph
        const trimmedText = selectedText.trim();
        const hasTrailingSpace = selectedText.endsWith(' ') && !selectedText.endsWith('\n');
        const hasLeadingSpace = selectedText.startsWith(' ') && !selectedText.startsWith('\n');
        
        let trailingSpaceToRestore = '';
        if (isSingleLine && isShortSelection && hasTrailingSpace && !hasLeadingSpace) {
            trailingSpaceToRestore = ' ';
            selectedText = selectedText.slice(0, -1);
        } else if (isSingleLine && isShortSelection && hasTrailingSpace && hasLeadingSpace) {
            const leadingSpace = selectedText.match(/^ +/)?.[0] || '';
            selectedText = leadingSpace + trimmedText;
            trailingSpaceToRestore = ' ';
        }
        
        // Handle trailing newline for single-line selection
        const hasTrailingNewline = selectedText.endsWith('\n');
        const lines = selectedText.split('\n');
        const lastLineIsEmpty = lines.length > 1 && lines[lines.length - 1] === '';
        let shouldAddNewlineAfterWrap = false;
        
        if (hasTrailingNewline && lines.length === 2 && lastLineIsEmpty) {
            selectedText = selectedText.slice(0, -1);
            shouldAddNewlineAfterWrap = true;
        }
        
        const leadingWhitespace = selectedText.match(/^\s*/)?.[0] || '';
        const trailingWhitespace = selectedText.match(/\s*$/)?.[0] || '';
        const contentWithoutWhitespace = selectedText.slice(leadingWhitespace.length, selectedText.length - trailingWhitespace.length);
        
        type StyleFlags = {
            bold: boolean;
            italic: boolean;
            underline: boolean;
            strike: boolean;
        };

        const parseWrappedStyles = (input: string): { content: string; flags: StyleFlags } => {
            const flags: StyleFlags = {
                bold: false,
                italic: false,
                underline: false,
                strike: false
            };

            let content = input;
            let changed = true;

            // Peel repeated outer wrappers so prior malformed output re-normalizes to one layer.
            while (changed) {
                changed = false;

                while (content.startsWith('~~') && content.endsWith('~~') && content.length > 4) {
                    content = content.slice(2, -2);
                    flags.strike = true;
                    changed = true;
                }

                while (content.startsWith('_') && content.endsWith('_') && content.length > 2) {
                    content = content.slice(1, -1);
                    flags.underline = true;
                    changed = true;
                }

                let starChanged = true;
                while (starChanged) {
                    starChanged = false;

                    if (content.startsWith('***') && content.endsWith('***') && content.length > 6) {
                        content = content.slice(3, -3);
                        flags.bold = true;
                        flags.italic = true;
                        changed = true;
                        starChanged = true;
                        continue;
                    }

                    if (content.startsWith('**') && content.endsWith('**') && content.length > 4) {
                        content = content.slice(2, -2);
                        flags.bold = true;
                        changed = true;
                        starChanged = true;
                        continue;
                    }

                    if (content.startsWith('*') && content.endsWith('*') && content.length > 2) {
                        content = content.slice(1, -1);
                        flags.italic = true;
                        changed = true;
                        starChanged = true;
                    }
                }
            }

            return { content, flags };
        };

        const rebuildWithStyles = (content: string, flags: StyleFlags): string => {
            let wrapped = content;

            if (flags.bold && flags.italic) {
                wrapped = `***${wrapped}***`;
            } else if (flags.bold) {
                wrapped = `**${wrapped}**`;
            } else if (flags.italic) {
                wrapped = `*${wrapped}*`;
            }

            if (flags.underline) {
                wrapped = `_${wrapped}_`;
            }

            if (flags.strike) {
                wrapped = `~~${wrapped}~~`;
            }

            return wrapped;
        };

        const targetStyle: keyof StyleFlags =
            marker === '**' ? 'bold' :
            marker === '*' ? 'italic' :
            marker === '_' ? 'underline' :
            'strike';

        const parsed = parseWrappedStyles(contentWithoutWhitespace);
        const nextFlags: StyleFlags = {
            ...parsed.flags,
            [targetStyle]: !parsed.flags[targetStyle]
        };

        const styledCore = rebuildWithStyles(parsed.content, nextFlags);
        const rebuiltSelection = leadingWhitespace + styledCore + trailingWhitespace;

        let newText: string;
        if (shouldAddNewlineAfterWrap) {
            newText = `${rebuiltSelection}\n${trailingSpaceToRestore}`;
        } else if (trailingSpaceToRestore) {
            newText = `${rebuiltSelection}${trailingSpaceToRestore}`;
        } else {
            newText = rebuiltSelection;
        }
        
        // Replace selection using replaceSelection function
        replaceSelection(newText, fullSelectionStart, fullSelectionEnd);
        
        // Update cursor position - new text length in display content
        const expandedDisplayStart = displaySelectionStart + (fullSelectionStart - originalFullSelectionStart);
        const newDisplayLength = stripTagsForDisplay(newText).length;
        setTimeout(() => {
            if (textareaRef.current) {
                const newStart = expandedDisplayStart;
                const newEnd = expandedDisplayStart + newDisplayLength;
                const shouldPreserveSelectionDesktop =
                    typeof window !== 'undefined' && window.innerWidth >= 768;

                if (shouldPreserveSelectionDesktop) {
                    // One-shot signal for FountainEditor to avoid collapsing highlightRange immediately.
                    if (typeof window !== 'undefined') {
                        (window as any).__editorPreserveHighlightSelectionOnce = true;
                        window.dispatchEvent(new CustomEvent('editor-preserve-highlight-selection-once'));
                    }
                    // Desktop polish: keep transformed text selected so users can stack styles quickly.
                    textareaRef.current.selectionStart = newStart;
                    textareaRef.current.selectionEnd = newEnd;
                    setCursorPosition(newEnd);

                    // Some first-interaction paths still collapse selection after mount/hard refresh.
                    // Re-assert once after the highlight collapse window to keep desktop behavior stable.
                    setTimeout(() => {
                        if (!textareaRef.current) return;
                        textareaRef.current.selectionStart = newStart;
                        textareaRef.current.selectionEnd = newEnd;
                        setCursorPosition(newEnd);
                    }, 160);
                } else {
                    textareaRef.current.selectionStart = newEnd;
                    textareaRef.current.selectionEnd = newEnd;
                    setCursorPosition(newEnd);
                }

                // Force selection-state sync for toolbar active BIUS buttons after programmatic range updates.
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('editor-sync-selection-state'));
                }
            }
        }, 0);
    }, [replaceSelection, setContent, setCursorPosition, state.content, textareaRef]);

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
        
        // DISABLED: Ctrl/Cmd + Enter - New scene heading
        // This feature is currently disabled due to event handler conflicts.
        // The handler may be blocked by Wryda Tab navigation or other event handlers.
        // TODO: Re-enable after fixing event handler conflicts in FountainEditor.tsx
        // else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        //     // Note: 'Enter' is not affected by Caps Lock, so no need to lowercase
        //     e.preventDefault();
        //     
        //     // Insert new line with "INT. " or "EXT. " prefix
        //     const newLinePrefix = 'INT. ';
        //     const newContent = textBeforeCursor + '\n' + newLinePrefix + textAfterCursor;
        //     setContent(newContent);
        //     
        //     // Move cursor to after the prefix
        //     setTimeout(() => {
        //         if (textareaRef.current) {
        //             const newPos = cursorPos + 1 + newLinePrefix.length;
        //             textareaRef.current.selectionStart = newPos;
        //             textareaRef.current.selectionEnd = newPos;
        //             setCursorPosition(newPos);
        //         }
        //     }, 0);
        //     
        //     setCurrentType('scene_heading');
        //     setCurrentElementType('scene_heading');
        // }
        
        // Ctrl/Cmd + I - Toggle italics (case-insensitive for Caps Lock)
        else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            handleInlineStyleToggle(textarea, '*', 'Italics');
        }
        // Ctrl/Cmd + B - Toggle bold
        else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            handleInlineStyleToggle(textarea, '**', 'Bold');
        }
        // Ctrl/Cmd + U - Toggle underline
        else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
            e.preventDefault();
            handleInlineStyleToggle(textarea, '_', 'Underline');
        }
        // Ctrl/Cmd + Shift + X - Toggle strikethrough
        else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            handleInlineStyleToggle(textarea, '~~', 'Strike');
        }
    }, [textareaRef, setCurrentElementType, handleInlineStyleToggle]);
    
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

