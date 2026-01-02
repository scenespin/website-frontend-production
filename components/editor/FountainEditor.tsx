'use client';

import React, { useRef, useEffect, useLayoutEffect, useMemo, ChangeEvent } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { stripTagsForDisplay, getVisibleLineNumber, mapDisplayPositionToFullContent, mapFullContentPositionToDisplay } from '@/utils/fountain';
import { AutoSaveManager } from '@/utils/AutoSaveManager';

// Custom hooks
import { useEditorSelection } from '@/hooks/useEditorSelection';
import { useEditorNavigation } from '@/hooks/useEditorNavigation';
import { useEntityAutocomplete } from '@/hooks/useEntityAutocomplete';
import { useFountainFormatting } from '@/hooks/useFountainFormatting';

// Contextual Navigation Integration
import { useContextStore } from '@/lib/contextStore';
import { extractEditorContext } from '@/utils/editorContext';

// UI components
import EditorHeader from './EditorHeader';
import EditorFooter from './EditorFooter';
import EntityAutocomplete from './EntityAutocomplete';
import TextComparisonModal from './TextComparisonModal';
import CursorOverlay from './CursorOverlay';

interface FountainEditorProps {
    className?: string;
    placeholder?: string;
    readonly?: boolean;
    onOpenChatWithContext?: (selectedText: string, initialPrompt?: string, selectionRange?: { start: number; end: number }) => void;
    onOpenSceneVisualizer?: (selectedText: string) => void;
    comparisonTexts?: { original: string; rewritten: string } | null;
    onKeepOriginal?: () => void;
    onUseRewrite?: () => void;
    onSelectionChangeProp?: (start: number, end: number) => void;
    onSelectionStateChange?: (hasSelection: boolean, selectedText: string | null, selectionRange: { start: number; end: number } | null) => void;
}

export default function FountainEditor({
    className = '',
    placeholder = 'Start writing your screenplay...',
    readonly = false,
    onOpenChatWithContext,
    onOpenSceneVisualizer,
    comparisonTexts,
    onKeepOriginal,
    onUseRewrite,
    onSelectionChangeProp,
    onSelectionStateChange
}: FountainEditorProps) {
    // Context hooks
    const { state, setContent, setCursorPosition, setCurrentLine, insertText, replaceSelection, markSaved, clearHighlight, otherUsersCursors, lastSyncedContent } = useEditor();
    const screenplay = useScreenplay();
    
    // Contextual Navigation - Update global context as user moves cursor
    const { setCurrentScene, setCursorPosition: setGlobalCursor, setProject } = useContextStore();
    
    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null!);
    const isMountedRef = useRef(true);
    const isSettingHighlightRef = useRef(false);
    
    // Auto-save manager
    const autoSaveManager = useRef<AutoSaveManager>(
        new AutoSaveManager({
            debounceMs: 2000,
            onSave: () => {
                // Optional: Show success notification
            },
            onError: (error) => {
                console.error('Auto-save failed:', error);
            }
        })
    );
    
    // Memoized display content (strips tags for clean display)
    const displayContent = useMemo(
        () => stripTagsForDisplay(state.content),
        [state.content]
    );
    
    // 🔥 FIX: Preserve cursor position when content is updated from version polling
    // When React updates the textarea's value prop, the browser resets cursor to the end.
    // We need to preserve and restore the cursor position after programmatic content updates.
    const previousContentRef = useRef<string>(displayContent);
    const savedCursorPositionRef = useRef<number | null>(null); // Save cursor position before content changes
    const isUserTypingRef = useRef(false);
    const lastTypingTimeRef = useRef<number>(0);
    
    // Track when user is typing (to distinguish from programmatic updates)
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const handleInput = () => {
            isUserTypingRef.current = true;
            lastTypingTimeRef.current = Date.now();
            // Reset flag after a longer delay to avoid false positives
            setTimeout(() => {
                isUserTypingRef.current = false;
            }, 500);
        };
        
        textarea.addEventListener('input', handleInput);
        return () => textarea.removeEventListener('input', handleInput);
    }, []);
    
    // Save cursor position on every selection change (so we have it before content updates)
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const handleSelectionChange = () => {
            // 🔥 FIX: Skip if we're currently setting highlight (prevents infinite loop)
            // This matches the guard in the props version of handleSelectionChange
            if (isSettingHighlightRef.current) {
                return;
            }
            
            if (textarea) {
                savedCursorPositionRef.current = textarea.selectionStart;
            }
        };
        
        textarea.addEventListener('select', handleSelectionChange);
        textarea.addEventListener('click', handleSelectionChange);
        textarea.addEventListener('keyup', handleSelectionChange);
        
        return () => {
            textarea.removeEventListener('select', handleSelectionChange);
            textarea.removeEventListener('click', handleSelectionChange);
            textarea.removeEventListener('keyup', handleSelectionChange);
        };
    }, []);
    
    // Use useLayoutEffect to restore cursor synchronously BEFORE browser paints
    // This runs after DOM updates but before the browser paints, so we can restore cursor before user sees it reset
    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const previousContent = previousContentRef.current;
        const currentContent = displayContent;
        
        // Skip if content hasn't changed
        if (previousContent === currentContent) {
            previousContentRef.current = currentContent;
            return;
        }
        
        // Check if user was typing recently (within last 500ms)
        const timeSinceLastTyping = Date.now() - lastTypingTimeRef.current;
        const wasRecentlyTyping = isUserTypingRef.current || timeSinceLastTyping < 500;
        
        // Only preserve cursor if content changed programmatically (not from user typing)
        if (!wasRecentlyTyping && savedCursorPositionRef.current !== null) {
            const savedCursorPos = savedCursorPositionRef.current;
            
            // Always preserve cursor position (not just if not at end)
            // The adjustment logic will handle edge cases
            if (savedCursorPos >= 0 && savedCursorPos <= previousContent.length) {
                // Find where content differs to adjust cursor position correctly
                let commonPrefix = 0;
                const minLength = Math.min(previousContent.length, currentContent.length);
                while (commonPrefix < minLength && 
                       previousContent[commonPrefix] === currentContent[commonPrefix]) {
                    commonPrefix++;
                }
                
                // Adjust cursor position based on where content changed
                let adjustedCursorPos = savedCursorPos;
                if (savedCursorPos <= commonPrefix) {
                    // Cursor is before or at where content differs - keep same position
                    adjustedCursorPos = Math.min(savedCursorPos, currentContent.length);
                } else {
                    // Cursor is after where content differs - adjust by length difference
                    const lengthDiff = currentContent.length - previousContent.length;
                    adjustedCursorPos = Math.max(0, Math.min(
                        savedCursorPos + lengthDiff,
                        currentContent.length
                    ));
                }
                
                // Restore cursor position synchronously (useLayoutEffect runs before paint)
                if (textarea.value === currentContent) {
                    textarea.selectionStart = adjustedCursorPos;
                    textarea.selectionEnd = adjustedCursorPos;
                    
                    // Update state to reflect restored cursor position
                    setCursorPosition(adjustedCursorPos);
                    
                    console.log('[FountainEditor] Preserved cursor position after programmatic content update', {
                        previousLength: previousContent.length,
                        currentLength: currentContent.length,
                        savedCursorPos,
                        adjustedCursorPos,
                        commonPrefix,
                        wasRecentlyTyping,
                        textareaValueLength: textarea.value.length
                    });
                } else {
                    console.warn('[FountainEditor] Textarea value mismatch during cursor restoration', {
                        expectedLength: currentContent.length,
                        actualLength: textarea.value.length
                    });
                }
            }
        }
        
        previousContentRef.current = currentContent;
    }, [displayContent, setCursorPosition]);
    
    // Memoized duration calculation
    const duration = useMemo(() => {
        const lines = displayContent.split('\n').filter(l => l.trim().length > 0);
        const approximatePages = lines.length / 55; // Industry standard: ~55 lines per page
        const minutes = Math.round(approximatePages);
        
        if (minutes < 1) return '<1 min';
        if (minutes < 60) return `~${minutes} min`;
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `~${hours}h ${remainingMinutes}m`;
    }, [displayContent]);
    
    // Memoized word count
    const wordCount = useMemo(
        () => displayContent.split(/\s+/).filter(w => w.length > 0).length,
        [displayContent]
    );
    
    // Custom hooks - All editor functionality extracted
    const selection = useEditorSelection(textareaRef, displayContent, onSelectionChangeProp);
    const navigation = useEditorNavigation(textareaRef, displayContent);
    const autocomplete = useEntityAutocomplete(textareaRef);
    const formatting = useFountainFormatting(textareaRef);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            autoSaveManager.current.reset();
        };
    }, []);
    
    // Auto-clear highlight after 3 seconds
    // Use useLayoutEffect for DOM-only operations that shouldn't trigger React updates
    // This prevents infinite loops by running synchronously after DOM mutations but before paint
    useLayoutEffect(() => {
        if (state.highlightRange && textareaRef.current) {
            console.log('[FountainEditor] Highlight range set:', state.highlightRange);
            
            // Convert highlight range from full content positions to display content positions
            // highlightRange is stored in fullContent coordinates (with tags)
            // but textarea displays displayContent (without tags), so we need to convert
            const displayHighlightStart = mapFullContentPositionToDisplay(
                displayContent,
                state.content,
                state.highlightRange.start
            );
            const displayHighlightEnd = mapFullContentPositionToDisplay(
                displayContent,
                state.content,
                state.highlightRange.end
            );
            
            console.log('[FountainEditor] Converted highlight range:', {
                full: state.highlightRange,
                display: { start: displayHighlightStart, end: displayHighlightEnd }
            });
            
            // Validate positions are within bounds
            const validStart = Math.max(0, Math.min(displayHighlightStart, displayContent.length));
            const validEnd = Math.max(validStart, Math.min(displayHighlightEnd, displayContent.length));
            
            // Set flag to prevent handleSelectionChange from processing this programmatic selection
            isSettingHighlightRef.current = true;
            
            try {
                // Select the highlighted text in the textarea (for visual feedback)
                // This is a DOM-only operation that shouldn't trigger React state updates
                textareaRef.current.selectionStart = validStart;
                textareaRef.current.selectionEnd = validEnd;
                
                // Position cursor at end of highlight (not selecting)
                // This gives visual feedback without keeping selection active
                setTimeout(() => {
                    if (textareaRef.current && state.highlightRange) {
                        textareaRef.current.selectionStart = validEnd;
                        textareaRef.current.selectionEnd = validEnd;
                        textareaRef.current.focus({ preventScroll: false });
                        isSettingHighlightRef.current = false;
                    }
                }, 100);
            } catch (error) {
                console.error('[FountainEditor] Error setting highlight selection:', error);
                isSettingHighlightRef.current = false;
            }
        }
    }, [state.highlightRange, displayContent, state.content]);
    
    // Separate effect for auto-clearing highlight (doesn't manipulate DOM)
    useEffect(() => {
        if (state.highlightRange) {
            const timer = setTimeout(() => {
                if (isMountedRef.current) {
                    clearHighlight();
                }
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [state.highlightRange, clearHighlight]);
    
    // Scene navigation effect - uses navigation hook
    useEffect(() => {
        if (state.currentLine !== undefined && 
            state.currentLine > 0 && 
            state.lastNavigationTime) {
            navigation.scrollToLine(state.currentLine, state.lastNavigationTime);
        }
    }, [state.currentLine, state.lastNavigationTime, navigation]);
    
    // Contextual Navigation - Update global context when cursor moves
    useEffect(() => {
        if (!state.content || state.cursorPosition === undefined) return;
        
        // Extract scene context at current cursor position
        const context = extractEditorContext(state.content, state.cursorPosition);
        
        // Update global cursor position
        setGlobalCursor(state.cursorPosition, context.currentLine);
        
        // Update current scene if we found one
        if (context.sceneContext && context.sceneContext.sceneHeading) {
            setCurrentScene(
                context.sceneContext.sceneHeading, // Use scene heading as ID for now
                context.sceneContext.sceneHeading
            );
        }
    }, [state.content, state.cursorPosition, setGlobalCursor, setCurrentScene]);
    
    // Handle paste events - ensures paste operations are tracked in undo stack
    // Uses insertText/replaceSelection (same as AI agents) for consistent undo/redo behavior
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const displaySelectionStart = textarea.selectionStart; // Position in displayContent
        const displaySelectionEnd = textarea.selectionEnd; // Position in displayContent
        const hasSelection = displaySelectionStart !== displaySelectionEnd;
        
        // Get pasted text from clipboard
        const pastedText = e.clipboardData.getData('text/plain');
        
        if (!pastedText) {
            // If no text, allow default paste behavior
            return;
        }
        
        // Prevent default paste to handle it ourselves
        e.preventDefault();
        
        // Clear highlight when user pastes
        if (state.highlightRange) {
            clearHighlight();
        }
        
        // Map positions from displayContent (what user sees) to state.content (with tags)
        // This is necessary because tags are entire lines that are filtered out for display
        const fullSelectionStart = mapDisplayPositionToFullContent(displayContent, state.content, displaySelectionStart);
        const fullSelectionEnd = hasSelection 
            ? mapDisplayPositionToFullContent(displayContent, state.content, displaySelectionEnd)
            : fullSelectionStart;
        
        // Calculate new content (with tags) for auto-save - matches what insertText/replaceSelection will do
        const newContent = hasSelection
            ? state.content.substring(0, fullSelectionStart) + pastedText + state.content.substring(fullSelectionEnd)
            : state.content.substring(0, fullSelectionStart) + pastedText + state.content.substring(fullSelectionStart);
        
        // Use replaceSelection if there's a selection, otherwise use insertText
        // Both functions properly push to undo stack immediately (not debounced)
        // This ensures paste operations are undoable just like AI agent insertions
        if (hasSelection) {
            replaceSelection(pastedText, fullSelectionStart, fullSelectionEnd);
        } else {
            insertText(pastedText, fullSelectionStart);
        }
        
        // Schedule auto-save (same pattern as handleChange)
        // Use the calculated newContent which includes tags
        autoSaveManager.current.scheduleSave(
            newContent,
            true, // isDirty
            screenplay.beats,
            screenplay.characters,
            screenplay.locations,
            screenplay.relationships,
            (content, markDirty) => {
                setContent(content, markDirty);
            },
            markSaved
        );
        
        // Calculate new cursor position in displayContent for immediate textarea update
        const newDisplayCursorPos = displaySelectionStart + pastedText.length;
        
        // Calculate line number for immediate update
        const newDisplayContent = hasSelection
            ? displayContent.substring(0, displaySelectionStart) + pastedText + displayContent.substring(displaySelectionEnd)
            : displayContent.substring(0, displaySelectionStart) + pastedText + displayContent.substring(displaySelectionStart);
        const visibleLineNumber = getVisibleLineNumber(newDisplayContent, newDisplayCursorPos);
        setCurrentLine(visibleLineNumber);
        
        // Update textarea cursor position immediately (before React re-render)
        // This provides immediate visual feedback
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = newDisplayCursorPos;
                textareaRef.current.selectionEnd = newDisplayCursorPos;
            }
        }, 0);
    };
    
    // Handle text changes
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Save cursor position to ref for cursor preservation
        savedCursorPositionRef.current = cursorPos;
        
        // Clear highlight when user starts typing
        if (state.highlightRange) {
            clearHighlight();
        }
        
        // Update content and cursor
        setContent(newContent);
        setCursorPosition(cursorPos);
        
        // Schedule auto-save
        autoSaveManager.current.scheduleSave(
            newContent,
            true, // isDirty
            screenplay.beats,
            screenplay.characters,
            screenplay.locations,
            screenplay.relationships,
            (content, markDirty) => {
                setContent(content, markDirty);
            },
            markSaved
        );
        
        // Calculate current line number
        const visibleLineNumber = getVisibleLineNumber(newContent, cursorPos);
        setCurrentLine(visibleLineNumber);
        
        // Check for @ mention trigger
        autocomplete.checkForMention(newContent, cursorPos, e.target);
        
        // Detect current element type
        formatting.detectCurrentType(newContent, cursorPos);
    };
    
    // Handle cursor position changes
    const handleSelectionChange = () => {
        // Skip if we're currently setting highlight (prevents infinite loop)
        if (isSettingHighlightRef.current || !textareaRef.current) return;
        
        const cursorPos = textareaRef.current.selectionStart;
        
        // Save cursor position to ref for cursor preservation
        savedCursorPositionRef.current = cursorPos;
        
        setCursorPosition(cursorPos);
        
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const lineNumber = textBeforeCursor.split('\n').length;
        setCurrentLine(lineNumber);
    };
    
    // Notify parent of selection state changes (for FAB visibility)
    useEffect(() => {
        if (onSelectionStateChange) {
            const hasSelection = selection.hasSelection;
            const selectedText = hasSelection ? selection.selection.text : null;
            const selectionRange = hasSelection && selection.selection.start !== null && selection.selection.end !== null
                ? { start: selection.selection.start, end: selection.selection.end }
                : null;
            onSelectionStateChange(hasSelection, selectedText, selectionRange);
        }
    }, [selection.hasSelection, selection.selection.text, selection.selection.start, selection.selection.end, onSelectionStateChange]);
    
    // Open chat with selected text context
    const handleOpenChatWithContext = (initialPrompt?: string) => {
        if (onOpenChatWithContext && selection.selection.text) {
            if (selection.selection.start !== null && selection.selection.end !== null) {
                console.log('[FountainEditor] Opening chat with context:', {
                    text: selection.selection.text.substring(0, 50) + '...',
                    range: { start: selection.selection.start, end: selection.selection.end }
                });
                onOpenChatWithContext(
                    selection.selection.text, 
                    initialPrompt, 
                    { start: selection.selection.start, end: selection.selection.end }
                );
            } else {
                console.warn('[FountainEditor] No selection range available');
                onOpenChatWithContext(selection.selection.text, initialPrompt);
            }
        }
    };
    
    
    return (
        <div 
            className={`fountain-editor-container ${className}`} 
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                backgroundColor: 'var(--color-bg-secondary)' 
            }}
        >
            {/* Hide scrollbar for editor */}
            <style jsx>{`
                .fountain-editor-textarea::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            
            {/* Main Textarea Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                <textarea
                    ref={textareaRef}
                    className="fountain-editor-textarea editor-textarea-clean min-h-[calc(100vh-10rem)] sm:min-h-[70vh]"
                    style={{
                        flex: 1,
                        width: '100%',
                        margin: 0,
                        padding: 'var(--space-6)',
                        fontSize: `${state.fontSize}px`,
                        fontFamily: 'var(--font-mono)',
                        lineHeight: '1.625',
                        resize: 'none',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        caretColor: '#60a5fa',
                        overflow: 'auto',
                        boxSizing: 'border-box',
                    }}
                    value={displayContent}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    onKeyDown={formatting.handleKeyDown}
                    onSelect={handleSelectionChange}
                    onClick={handleSelectionChange}
                    onMouseUp={selection.handlers.onMouseUp}
                    placeholder={placeholder}
                    readOnly={readonly}
                    spellCheck={true}
                />
                {/* Feature 0134: Cursor Overlay - Shows other users' cursor positions */}
                {/* 🔥 FIX: Temporarily disable cursor overlay when highlighting to prevent infinite loops */}
                {otherUsersCursors && otherUsersCursors.length > 0 && !state.highlightRange && (
                    <CursorOverlay
                        textareaRef={textareaRef}
                        content={stripTagsForDisplay(lastSyncedContent)}
                        cursors={otherUsersCursors}
                    />
                )}
            </div>
            
            {/* Entity Autocomplete - @ mentions */}
            {autocomplete.autocomplete.show && (
                <EntityAutocomplete
                    query={autocomplete.autocomplete.query}
                    position={autocomplete.autocomplete.position}
                    onSelect={autocomplete.autocomplete.onSelect}
                    onClose={autocomplete.autocomplete.onClose}
                />
            )}
            
            {/* Text Comparison Modal - AI rewrite comparison */}
            {comparisonTexts && onKeepOriginal && onUseRewrite && (
                <TextComparisonModal
                    originalText={comparisonTexts.original}
                    rewrittenText={comparisonTexts.rewritten}
                    onKeepOriginal={onKeepOriginal}
                    onUseRewrite={onUseRewrite}
                    onClose={onKeepOriginal}
                />
            )}
            
            {/* Editor Footer - Keyboard shortcuts */}
            <EditorFooter />
        </div>
    );
}

