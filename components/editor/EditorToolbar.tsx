'use client';

import React from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { FountainElementType, formatElement } from '@/utils/fountain';

interface EditorToolbarProps {
    className?: string;
    onExportPDF?: () => void;
    onOpenCollaboration?: () => void;
    onSave?: () => void;
}

/**
 * EditorToolbar - Formatting toolbar with screenplay element buttons
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorToolbar({ className = '', onExportPDF, onOpenCollaboration, onSave }: EditorToolbarProps) {
    const { state, setContent, toggleFocusMode, setFontSize, undo, redo } = useEditor();
    
    const formatCurrentLine = (type: FountainElementType) => {
        const lines = state.content.split('\n');
        const currentLineIndex = state.currentLine - 1;
        
        if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
            const currentLineText = lines[currentLineIndex];
            const formattedText = formatElement(currentLineText, type);
            
            lines[currentLineIndex] = formattedText;
            const newContent = lines.join('\n');
            setContent(newContent);
        }
    };
    
    const increaseFontSize = () => {
        if (state.fontSize < 24) {
            setFontSize(state.fontSize + 2);
        }
    };
    
    const decreaseFontSize = () => {
        if (state.fontSize > 12) {
            setFontSize(state.fontSize - 2);
        }
    };
    
    const [showMoreFormats, setShowMoreFormats] = React.useState(false);
    
    return (
        <div className={`bg-base-200 border-t border-base-300 shadow-sm ${className}`}>
            {/* Mobile-friendly toolbar with large touch targets */}
            <div className="flex items-center justify-between p-2 overflow-x-auto">
                
                {/* Undo/Redo */}
                <div className="flex space-x-1 mr-2">
                    <button
                        onClick={undo}
                        disabled={state.undoStack.length === 0}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                    >
                        <span className="text-base">↶</span>
                    </button>
                    
                    <button
                        onClick={redo}
                        disabled={state.redoStack.length === 0}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Y)"
                    >
                        <span className="text-base">↷</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Quick Formatting buttons */}
                <div className="flex space-x-1">
                    <button
                        onClick={() => formatCurrentLine('scene_heading')}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        title="Scene Heading (Shift+Tab)"
                    >
                        <span className="text-base">🎬</span>
                        <span className="text-[9px] hidden sm:inline">SCENE</span>
                    </button>
                    
                    <button
                        onClick={() => formatCurrentLine('character')}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        title="Character (Tab)"
                    >
                        <span className="text-base">👤</span>
                        <span className="text-[9px] hidden sm:inline">CHAR</span>
                    </button>
                    
                    <button
                        onClick={() => formatCurrentLine('dialogue')}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        title="Dialogue"
                    >
                        <span className="text-base">💬</span>
                        <span className="text-[9px] hidden sm:inline">TALK</span>
                    </button>
                    
                    <button
                        onClick={() => formatCurrentLine('action')}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        title="Action (Enter)"
                    >
                        <span className="text-base">⚡</span>
                        <span className="text-[9px] hidden sm:inline">ACT</span>
                    </button>
                    
                    <button
                        onClick={() => formatCurrentLine('parenthetical')}
                        className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        title="Parenthetical (Wryly)"
                    >
                        <span className="text-base">( )</span>
                        <span className="text-[9px] hidden sm:inline">PAREN</span>
                    </button>
                    
                    {/* More formats toggle */}
                    <button
                        onClick={() => setShowMoreFormats(!showMoreFormats)}
                        className={`px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
                            showMoreFormats ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-300'
                        }`}
                        title="More formats"
                    >
                        <span className="text-base">⋯</span>
                    </button>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* View controls */}
                <div className="flex space-x-1">
                    <button
                        onClick={decreaseFontSize}
                        className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        title="Decrease font size"
                    >
                        <span className="text-base">−</span>
                    </button>
                    
                    <div className="flex items-center px-2 bg-base-100 rounded min-w-[44px] min-h-[40px] justify-center">
                        <span className="text-xs font-mono font-semibold">{state.fontSize}</span>
                    </div>
                    
                    <button
                        onClick={increaseFontSize}
                        className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        title="Increase font size"
                    >
                        <span className="text-base">+</span>
                    </button>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Save Button */}
                {onSave && (
                    <div>
                        <button
                            onClick={onSave}
                            disabled={!state.isDirty}
                            className={`px-3 py-2 rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-all font-medium text-sm ${
                                state.isDirty
                                    ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white shadow-lg shadow-[#DC143C]/20'
                                    : 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                            }`}
                            title={state.isDirty ? 'Save changes' : 'All changes saved'}
                        >
                            {state.isDirty ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    <span>Save</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="hidden sm:inline">Saved</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* GitHub & Collaboration */}
                {onOpenCollaboration && (
                    <div>
                        <button
                            onClick={onOpenCollaboration}
                            className="px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-colors font-medium text-sm text-purple-400"
                            title="GitHub & Collaboration Settings"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="hidden sm:inline">GitHub</span>
                        </button>
                    </div>
                )}
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Download .fountain button */}
                <div>
                    <button
                        onClick={() => {
                            // Export current screenplay to .fountain file
                            const blob = new Blob([state.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${state.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'screenplay'}.fountain`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-2 bg-base-200 hover:bg-base-300 rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                        title="Download .fountain file"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span className="hidden sm:inline">.fountain</span>
                    </button>
                </div>
                
                {/* Export PDF button */}
                {onExportPDF && (
                    <div>
                        <button
                            onClick={onExportPDF}
                            className="px-3 py-2 bg-primary text-primary-content hover:bg-primary-focus rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                            title="Export to PDF (Cmd+P)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden sm:inline">Export PDF</span>
                        </button>
                    </div>
                )}
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Focus mode toggle */}
                <div>
                    <button
                        onClick={toggleFocusMode}
                        className={`px-3 py-2 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
                            state.isFocusMode
                                ? 'bg-primary text-primary-content hover:bg-primary-focus'
                                : 'bg-base-100 hover:bg-base-300'
                        }`}
                        title="Toggle focus mode"
                    >
                        <span className="text-base">{state.isFocusMode ? '👁️' : '🔍'}</span>
                    </button>
                </div>
            </div>
            
            {/* Extended format menu */}
            {showMoreFormats && (
                <div className="border-t border-base-300 p-2 bg-base-100">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                        <button
                            onClick={() => {
                                formatCurrentLine('transition');
                                setShowMoreFormats(false);
                            }}
                            className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300"
                        >
                            ➔ TRANSITION
                        </button>
                        <button
                            onClick={() => {
                                formatCurrentLine('centered');
                                setShowMoreFormats(false);
                            }}
                            className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300"
                        >
                            ≡ CENTERED
                        </button>
                        <button
                            onClick={() => {
                                formatCurrentLine('lyrics');
                                setShowMoreFormats(false);
                            }}
                            className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300"
                        >
                            ♪ LYRICS
                        </button>
                        <button
                            onClick={() => {
                                formatCurrentLine('section');
                                setShowMoreFormats(false);
                            }}
                            className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300"
                        >
                            # SECTION
                        </button>
                        <button
                            onClick={() => {
                                formatCurrentLine('synopsis');
                                setShowMoreFormats(false);
                            }}
                            className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300"
                        >
                            = SYNOPSIS
                        </button>
                        <button
                            onClick={() => {
                                formatCurrentLine('note');
                                setShowMoreFormats(false);
                            }}
                            className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300"
                        >
                            [[NOTE]]
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-base-content/50 text-center">
                        Keyboard shortcuts: Tab (Character) • Shift+Tab (Scene) • Enter (New line/Action)
                    </div>
                </div>
            )}
        </div>
    );
}

