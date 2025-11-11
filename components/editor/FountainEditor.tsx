'use client';

import React, { useRef, useEffect, useMemo, ChangeEvent } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { stripTagsForDisplay, getVisibleLineNumber } from '@/utils/fountain';
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
import SelectionToolbar from './SelectionToolbar';
import EntityAutocomplete from './EntityAutocomplete';
import SelectionContextMenu, { RewriteSuggestion } from './SelectionContextMenu';
import TextComparisonModal from './TextComparisonModal';

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
    onSelectionChangeProp
}: FountainEditorProps) {
    // Context hooks
    const { state, setContent, setCursorPosition, setCurrentLine, replaceSelection, markSaved, clearHighlight } = useEditor();
    const screenplay = useScreenplay();
    
    // Contextual Navigation - Update global context as user moves cursor
    const { setCurrentScene, setCursorPosition: setGlobalCursor, setProject } = useContextStore();
    
    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null!);
    const isMountedRef = useRef(true);
    
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
    useEffect(() => {
        if (state.highlightRange && textareaRef.current) {
            console.log('[FountainEditor] Highlight range set:', state.highlightRange);
            
            // Set cursor to end of inserted text
            setTimeout(() => {
                if (textareaRef.current && state.highlightRange) {
                    textareaRef.current.selectionStart = state.highlightRange.end;
                    textareaRef.current.selectionEnd = state.highlightRange.end;
                    textareaRef.current.focus({ preventScroll: false });
                }
            }, 50);
            
            // Clear highlight after 3 seconds
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
    
    // Handle text changes
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        const cursorPos = e.target.selectionStart;
        
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
        if (!textareaRef.current) return;
        
        const cursorPos = textareaRef.current.selectionStart;
        setCursorPosition(cursorPos);
        
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const lineNumber = textBeforeCursor.split('\n').length;
        setCurrentLine(lineNumber);
    };
    
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
    
    // Handle suggestion selection from context menu
    const handleSelectSuggestion = (suggestion: RewriteSuggestion) => {
        if (onOpenChatWithContext) {
            if (selection.selection.start !== null && selection.selection.end !== null) {
                console.log('[FountainEditor] Suggestion selected:', {
                    suggestion: suggestion.label,
                    range: { start: selection.selection.start, end: selection.selection.end }
                });
                onOpenChatWithContext(
                    selection.selection.text, 
                    suggestion.prompt, 
                    { start: selection.selection.start, end: selection.selection.end }
                );
            } else {
                console.warn('[FountainEditor] No selection range available for suggestion');
                onOpenChatWithContext(selection.selection.text, suggestion.prompt);
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
            
            {/* Editor Header */}
            <EditorHeader
                currentLine={state.currentLine}
                isDirty={state.isDirty}
                wordCount={wordCount}
                duration={duration}
            />
            
            {/* Main Textarea Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
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
                    onKeyDown={formatting.handleKeyDown}
                    onSelect={handleSelectionChange}
                    onClick={handleSelectionChange}
                    onMouseUp={selection.handlers.onMouseUp}
                    onContextMenu={selection.handlers.onContextMenu}
                    onTouchStart={selection.handlers.onTouchStart}
                    onTouchEnd={selection.handlers.onTouchEnd}
                    onTouchMove={selection.handlers.onTouchMove}
                    placeholder={placeholder}
                    readOnly={readonly}
                    spellCheck={true}
                />
            </div>
            
            {/* Selection Toolbar - Quick rewrite actions */}
            {selection.toolbar.show && !selection.contextMenu.show && (
                <SelectionToolbar
                    selectedText={selection.selection.text}
                    onReplace={(newText) => {
                        replaceSelection(newText, selection.selection.start, selection.selection.end);
                        // Update cursor position after replacement
                        const newCursorPos = selection.selection.start + newText.length;
                        setTimeout(() => {
                            if (textareaRef.current) {
                                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                                textareaRef.current.focus();
                            }
                        }, 0);
                    }}
                    onClose={selection.toolbar.close}
                    position={selection.toolbar.position}
                />
            )}
            
            {/* Context Menu - Right-click/long-press menu */}
            {selection.contextMenu.show && (
                <SelectionContextMenu
                    selectedText={selection.selection.text}
                    position={selection.contextMenu.position}
                    onOpenChat={handleOpenChatWithContext}
                    onOpenSceneVisualizer={onOpenSceneVisualizer}
                    onSelectSuggestion={handleSelectSuggestion}
                    onClose={selection.contextMenu.close}
                />
            )}
            
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

