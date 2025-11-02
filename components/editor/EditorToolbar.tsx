'use client';

import React from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { FountainElementType, formatElement } from '@/utils/fountain';

interface EditorToolbarProps {
    className?: string;
    onExportPDF?: () => void;
}

/**
 * EditorToolbar - Formatting toolbar with screenplay element buttons
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorToolbar({ className = '', onExportPDF }: EditorToolbarProps) {
    const { state, setContent, toggleFocusMode, setFontSize } = useEditor();
    
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
                        title="Parenthetical"
                    >
                        <span className="text-base">( )</span>
                        <span className="text-[9px] hidden sm:inline">NOTE</span>
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

