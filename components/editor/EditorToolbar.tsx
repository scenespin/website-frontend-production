'use client';

import React, { useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { FountainElementType, formatElement } from '@/utils/fountain';
import { saveToGitHub } from '@/utils/github';
import { toast } from 'sonner';

interface EditorToolbarProps {
    className?: string;
    onExportPDF?: () => void;
    onOpenCollaboration?: () => void;
    onSave?: () => void;
}

/**
 * Feature 0111: Export to GitHub Button
 * Optional manual export since auto-sync is removed
 */
function ExportToGitHubButton() {
    const { state } = useEditor();
    const [exporting, setExporting] = useState(false);
    const [showSetup, setShowSetup] = useState(false);

    const handleExport = async () => {
        const githubConfigStr = localStorage.getItem('screenplay_github_config');
        
        if (!githubConfigStr) {
            setShowSetup(true);
            return;
        }

        try {
            setExporting(true);
            const config = JSON.parse(githubConfigStr);

            await saveToGitHub(config, {
                path: 'screenplay.fountain',
                content: state.content,
                message: `Manual export: ${state.title}`,
                branch: 'main'
            });

            alert('✅ Exported to GitHub successfully!');
        } catch (error: any) {
            console.error('[GitHub Export] Failed:', error);
            alert('❌ Export failed: ' + (error.message || 'Unknown error'));
        } finally {
            setExporting(false);
        }
    };

    const handleConnectGitHub = () => {
        // Validate configuration
        const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        
        if (!GITHUB_CLIENT_ID) {
            alert('GitHub OAuth is not configured. Please contact support.');
            console.error('[OAuth] Missing NEXT_PUBLIC_GITHUB_CLIENT_ID environment variable');
            return;
        }
        
        // Redirect to GitHub OAuth (same flow as GitHubRequiredGate)
        const scope = 'repo,user';
        const state = 'github_oauth_wryda';
        const redirectUri = `${window.location.origin}/write`;
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
        
        console.log('[OAuth] Redirecting to GitHub authorization');
        window.location.href = authUrl;
    };

    return (
        <>
            <div className="tooltip tooltip-bottom" data-tip="Export to GitHub (Optional)">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-colors font-medium text-sm text-purple-400"
                >
                    {exporting ? (
                        <>
                            <span className="loading loading-spinner loading-xs"></span>
                            <span className="hidden sm:inline">Exporting...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="hidden sm:inline">GitHub</span>
                        </>
                    )}
                </button>
            </div>

            {/* Setup Modal */}
            {showSetup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-base-200 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-bold mb-3">Connect GitHub</h3>
                        <p className="text-sm text-base-content/70 mb-4">
                            GitHub connection is optional. Your screenplay auto-saves to secure cloud storage.
                            Connect GitHub for version control and backup.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleConnectGitHub}
                                className="btn btn-primary flex-1"
                            >
                                Connect GitHub
                            </button>
                            <button
                                onClick={() => setShowSetup(false)}
                                className="btn btn-ghost flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * EditorToolbar - Formatting toolbar with screenplay element buttons
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorToolbar({ className = '', onExportPDF, onOpenCollaboration, onSave }: EditorToolbarProps) {
    const { state, setContent, toggleFocusMode, setFontSize, undo, redo, saveNow } = useEditor();
    const screenplay = useScreenplay();
    const [isSaving, setIsSaving] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    
    // Handle immediate save to DynamoDB
    const handleSave = async () => {
        if (isSaving || !state.isDirty) return;
        
        setIsSaving(true);
        try {
            await saveNow();
            toast.success('💾 Saved to database', {
                description: 'Your screenplay is safe!'
            });
        } catch (error) {
            console.error('[EditorToolbar] Save failed:', error);
            toast.error('⚠️ Save failed', {
                description: 'Will retry automatically'
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Handle Clear All with double confirmation
    const handleClearAll = async () => {
        setIsClearing(true);
        try {
            // Clear all structural data (characters, locations, beats, scenes)
            await screenplay?.clearAllData();
            
            // Also clear the screenplay text from the editor
            setContent('');
            
            toast.success('🗑️ Complete reset', {
                description: 'All screenplay data deleted (text, structure, characters, locations)'
            });
            setShowClearConfirm(false);
        } catch (error) {
            console.error('[EditorToolbar] Clear failed:', error);
            toast.error('⚠️ Clear failed', {
                description: 'Please try again'
            });
        } finally {
            setIsClearing(false);
        }
    };
    
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
            {/* Mobile-friendly toolbar - wraps instead of scrolling */}
            <div className="flex flex-wrap items-center gap-2 p-2">
                
                {/* Undo/Redo */}
                <div className="flex space-x-1">
                    <div className="tooltip tooltip-bottom" data-tip="Undo • Ctrl+Z">
                        <button
                            onClick={undo}
                            disabled={state.undoStack.length === 0}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="text-base">↶</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Redo • Ctrl+Y">
                        <button
                            onClick={redo}
                            disabled={state.redoStack.length === 0}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="text-base">↷</span>
                        </button>
                    </div>
                </div>

                {/* Divider - only visible on larger screens */}
                <div className="hidden sm:block h-8 w-px bg-base-300"></div>
                
                {/* Quick Formatting buttons */}
                <div className="flex space-x-1">
                    <div className="tooltip tooltip-bottom" data-tip="Scene Heading • Shift+Tab • Ex: INT. COFFEE SHOP - DAY">
                        <button
                            onClick={() => formatCurrentLine('scene_heading')}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">🎬</span>
                            <span className="text-[9px] hidden sm:inline">SCENE</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Character Name • Tab • Ex: SARAH">
                        <button
                            onClick={() => formatCurrentLine('character')}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">👤</span>
                            <span className="text-[9px] hidden sm:inline">CHAR</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Dialogue • Ex: I need to finish this script.">
                        <button
                            onClick={() => formatCurrentLine('dialogue')}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">💬</span>
                            <span className="text-[9px] hidden sm:inline">TALK</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Action/Description • Enter • Ex: Sarah enters the room.">
                        <button
                            onClick={() => formatCurrentLine('action')}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">⚡</span>
                            <span className="text-[9px] hidden sm:inline">ACT</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Parenthetical/Wryly • Ex: (nervous)">
                        <button
                            onClick={() => formatCurrentLine('parenthetical')}
                            className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">( )</span>
                            <span className="text-[9px] hidden sm:inline">PAREN</span>
                        </button>
                    </div>
                    
                    {/* More formats toggle */}
                    <div className="tooltip tooltip-bottom" data-tip="More Formats • Notes, Transitions, Centered, etc.">
                        <button
                            onClick={() => setShowMoreFormats(!showMoreFormats)}
                            className={`px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
                                showMoreFormats ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-300'
                            }`}
                        >
                            <span className="text-base">⋯</span>
                        </button>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* View controls */}
                <div className="flex space-x-1">
                    <div className="tooltip tooltip-bottom" data-tip="Decrease Font Size">
                        <button
                            onClick={decreaseFontSize}
                            className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                            <span className="text-base">−</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Current Font Size">
                        <div className="flex items-center px-2 bg-base-100 rounded min-w-[44px] min-h-[40px] justify-center">
                            <span className="text-xs font-mono font-semibold">{state.fontSize}</span>
                        </div>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Increase Font Size">
                        <button
                            onClick={increaseFontSize}
                            className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                            <span className="text-base">+</span>
                        </button>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Save Button */}
                {onSave && (
                    <div className="tooltip tooltip-bottom" data-tip={isSaving ? 'Saving...' : (state.isDirty ? 'Save to database immediately' : 'All changes saved!')}>
                        <button
                            onClick={handleSave}
                            disabled={!state.isDirty || isSaving}
                            className={`px-3 py-2 rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-all font-medium text-sm ${
                                state.isDirty && !isSaving
                                    ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white shadow-lg shadow-[#DC143C]/20'
                                    : isSaving
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-wait'
                                    : 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Saving...</span>
                                </>
                            ) : state.isDirty ? (
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
                
                {/* Clear All Structure Button */}
                <div className="tooltip tooltip-bottom" data-tip="Clear all characters, locations, and scenes (screenplay text stays)">
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        disabled={isClearing || (!screenplay?.characters.length && !screenplay?.locations.length)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-colors font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Clear Structure</span>
                    </button>
                </div>
                
                {                /* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Feature 0111: Optional Export to GitHub */}
                <ExportToGitHubButton />
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Download .fountain button */}
                <div className="tooltip tooltip-bottom" data-tip="Download .fountain file • Plain text screenplay format">
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
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        <span className="hidden sm:inline">.fountain</span>
                    </button>
                </div>
                
                {/* Export PDF button */}
                {onExportPDF && (
                    <div className="tooltip tooltip-bottom" data-tip="Export PDF • Industry-standard format • Cmd+P">
                        <button
                            onClick={onExportPDF}
                            className="px-3 py-2 bg-primary text-primary-content hover:bg-primary-focus rounded min-w-[40px] min-h-[40px] flex items-center justify-center gap-2 transition-colors font-medium text-sm"
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
                <div className="tooltip tooltip-bottom" data-tip={state.isFocusMode ? 'Exit Focus Mode' : 'Focus Mode • Hide distractions'}>
                    <button
                        onClick={toggleFocusMode}
                        className={`px-3 py-2 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
                            state.isFocusMode
                                ? 'bg-primary text-primary-content hover:bg-primary-focus'
                                : 'bg-base-100 hover:bg-base-300'
                        }`}
                    >
                        <span className="text-base">{state.isFocusMode ? '👁️' : '🔍'}</span>
                    </button>
                </div>
            </div>
            
            {/* Extended format menu */}
            {showMoreFormats && (
                <div className="border-t border-base-300 p-2 bg-base-100">
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                        <div className="tooltip tooltip-top" data-tip="CUT TO: • FADE IN: • etc.">
                            <button
                                onClick={() => {
                                    formatCurrentLine('transition');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full"
                            >
                                ➔ TRANSITION
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="> THE END <">
                            <button
                                onClick={() => {
                                    formatCurrentLine('centered');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full"
                            >
                                ≡ CENTERED
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="~ Happy birthday ~">
                            <button
                                onClick={() => {
                                    formatCurrentLine('lyrics');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full"
                            >
                                ♪ LYRICS
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="# Act I">
                            <button
                                onClick={() => {
                                    formatCurrentLine('section');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full"
                            >
                                # SECTION
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="= Scene summary">
                            <button
                                onClick={() => {
                                    formatCurrentLine('synopsis');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full"
                            >
                                = SYNOPSIS
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="[[ Hidden note ]] • Not in PDF">
                            <button
                                onClick={() => {
                                    formatCurrentLine('note');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full"
                            >
                                [[NOTE]]
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Clear All Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-base-200 rounded-lg p-6 max-w-md mx-4 shadow-2xl border-2 border-red-500/30">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-red-500 mb-2">⚠️ Complete Reset - Delete Everything?</h3>
                                <p className="text-sm text-base-content/90 mb-3">
                                    This will <strong>permanently delete</strong>:
                                </p>
                                <ul className="list-disc list-inside text-sm text-base-content/70 space-y-1 mb-3">
                                    <li><strong>Your entire screenplay text</strong></li>
                                    <li>All characters ({screenplay?.characters.length || 0})</li>
                                    <li>All locations ({screenplay?.locations.length || 0})</li>
                                    <li>All story beats and scenes</li>
                                </ul>
                                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2 mb-4">
                                    <strong>⚠️ This is a COMPLETE RESET.</strong> Everything will be deleted from the database. This action cannot be undone!
                                </p>
                                <p className="text-sm text-base-content/80 font-semibold">
                                    Are you absolutely sure?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                disabled={isClearing}
                                className="flex-1 px-4 py-2 bg-base-300 hover:bg-base-100 rounded font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={isClearing}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                            >
                                {isClearing ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Clearing...</span>
                                    </>
                                ) : (
                                    <>Yes, Clear All</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

