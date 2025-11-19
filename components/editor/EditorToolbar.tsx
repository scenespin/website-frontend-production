'use client';

import React, { useState, useEffect } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { FountainElementType, formatElement } from '@/utils/fountain';
import { saveToGitHub } from '@/utils/github';
import { toast } from 'sonner';
import ScriptImportModal from './ScriptImportModal';

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
    const [showImportModal, setShowImportModal] = useState(false);
    const [isRescanning, setIsRescanning] = useState(false); // 🔥 NEW: Re-scan state
    
    // 🔥 NEW: Sync fullscreen state with browser fullscreen events
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;
            if (isFullscreen !== state.isFocusMode) {
                // Browser fullscreen state changed, sync our state
                if (isFullscreen && !state.isFocusMode) {
                    toggleFocusMode();
                } else if (!isFullscreen && state.isFocusMode) {
                    toggleFocusMode();
                }
            }
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [state.isFocusMode, toggleFocusMode]);
    
    // ========================================================================
    // 🔥 FEATURE 0116: SCRIPT IMPORT MODAL (Clean & Simple)
    // ========================================================================
    const handleOpenImport = () => {
        setShowImportModal(true);
    };
    
    const handleCloseImport = () => {
        setShowImportModal(false);
    };
    
    // ========================================================================
    // 🔥 FEATURE 0117: RE-SCAN SCRIPT (Additive - Smart Merge)
    // ========================================================================
    const handleRescan = async () => {
        setIsRescanning(true);
        
        try {
            console.log('[EditorToolbar] 🔍 Re-scanning script...');
            
            // Get current editor content
            const content = state.content;
            
            if (!content.trim()) {
                toast.error('No script to scan');
                return;
            }
            
            // Call rescanScript from ScreenplayContext
            const result = await screenplay.rescanScript(content);
            
            const parts: string[] = [];
            if (result.newCharacters > 0) {
                parts.push(`${result.newCharacters} new character${result.newCharacters !== 1 ? 's' : ''}`);
            }
            if (result.newLocations > 0) {
                parts.push(`${result.newLocations} new location${result.newLocations !== 1 ? 's' : ''}`);
            }
            if (result.updatedScenes > 0) {
                parts.push(`${result.updatedScenes} scene${result.updatedScenes !== 1 ? 's' : ''} updated`);
            }
            if (result.preservedMetadata !== undefined && result.preservedMetadata > 0) {
                parts.push(`${result.preservedMetadata} with preserved metadata`);
            }
            
            if (parts.length === 0) {
                toast.info('✅ Re-scan complete', {
                    description: 'No changes found'
                });
            } else {
                toast.success('✅ Re-scan complete', {
                    description: parts.join(', ')
                });
            }
            
            // Save the new data
            await saveNow();
            
        } catch (error) {
            console.error('[EditorToolbar] Re-scan failed:', error);
            toast.error('❌ Re-scan failed', {
                description: error instanceof Error ? error.message : 'Please try again'
            });
        } finally {
            setIsRescanning(false);
        }
    };
    
    // ========================================================================
    // 🔥 FEATURE 0111 PHASE 4: MANUAL SAVE (Simple & Reliable)
    // ========================================================================
    // Handle immediate save to DynamoDB
    const handleSave = async () => {
        if (isSaving) return; // Prevent double-clicks
        
        setIsSaving(true);
        try {
            console.log('[EditorToolbar] 💾 Saving screenplay...');
            
            // Save screenplay content (and structure if needed)
            // saveNow() handles:
            // 1. Creating screenplay in DynamoDB if new (gets ID)
            // 2. Saving content (title, author, script text)
            // 3. Saving structure data (characters, locations, beats)
            await saveNow();
            
            console.log('[EditorToolbar] ✅ Save complete');
            
            toast.success('💾 Saved to database', {
                description: 'Your screenplay is safe!'
            });
        } catch (error) {
            console.error('[EditorToolbar] Save failed:', error);
            toast.error('❌ Save failed', {
                description: 'Please try again or check your connection'
            });
        } finally {
            setIsSaving(false);
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
                
                {/* Import Script Button - Icon only */}
                <div className="tooltip tooltip-bottom" data-tip="Import screenplay from paste">
                    <button
                        onClick={handleOpenImport}
                        className="px-2 py-2 bg-cinema-red/10 hover:bg-cinema-red/20 border border-cinema-red/30 text-cinema-red rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                </div>
                
                {/* 🔥 FEATURE 0117: Re-Scan Script Button - Icon only */}
                <div className="tooltip tooltip-bottom" data-tip="Scan script for new characters/locations (keeps existing data)">
                    <button
                        onClick={handleRescan}
                        disabled={isRescanning || !state.content.trim()}
                        className="px-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isRescanning ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                    </button>
                </div>
                
                {/* Save Button - Icon only */}
                {onSave && (
                    <div className="tooltip tooltip-bottom" data-tip={isSaving ? 'Saving...' : 'Save to database'}>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-2 py-2 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-all ${
                                isSaving
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-wait'
                                    : 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white shadow-lg shadow-[#DC143C]/20'
                            }`}
                        >
                            {isSaving ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
                
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Feature 0111: Optional Export to GitHub - Icon only */}
                <div className="tooltip tooltip-bottom" data-tip="Export to GitHub (Optional)">
                    <button
                        onClick={async () => {
                            const githubConfigStr = localStorage.getItem('screenplay_github_config');
                            if (!githubConfigStr) {
                                // Show modal to connect GitHub directly
                                const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
                                
                                if (!GITHUB_CLIENT_ID) {
                                    toast.error('GitHub OAuth is not configured. Please contact support.');
                                    return;
                                }
                                
                                // Ask user if they want to connect
                                if (confirm('GitHub is not connected. Would you like to connect now?')) {
                                    const scope = 'repo,user';
                                    const state = 'github_oauth_wryda';
                                    const redirectUri = `${window.location.origin}/write`;
                                    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
                                    window.location.href = authUrl;
                                }
                                return;
                            }
                            try {
                                const config = JSON.parse(githubConfigStr);
                                await saveToGitHub(config, {
                                    path: 'screenplay.fountain',
                                    content: state.content,
                                    message: `Manual export: ${state.title}`,
                                    branch: 'main'
                                });
                                toast.success('✅ Exported to GitHub!');
                            } catch (error: any) {
                                toast.error('Export failed: ' + (error.message || 'Unknown error'));
                            }
                        }}
                        className="px-2 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors text-purple-400"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                    </button>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Download .fountain button - Icon only */}
                <div className="tooltip tooltip-bottom" data-tip="Download .fountain file • Plain text screenplay format">
                    <button
                        onClick={() => {
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
                        className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                    </button>
                </div>
                
                {/* Export PDF button - Icon only */}
                {onExportPDF && (
                    <div className="tooltip tooltip-bottom" data-tip="Export PDF • Industry-standard format • Cmd+P">
                        <button
                            onClick={onExportPDF}
                            className="px-2 py-2 bg-primary text-primary-content hover:bg-primary-focus rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                    </div>
                )}
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Focus mode / Fullscreen toggle */}
                <div className="tooltip tooltip-bottom" data-tip={state.isFocusMode ? 'Exit Fullscreen' : 'Fullscreen Mode • Hide all distractions'}>
                    <button
                        onClick={() => {
                            if (!state.isFocusMode) {
                                // Enter fullscreen
                                if (document.documentElement.requestFullscreen) {
                                    document.documentElement.requestFullscreen().then(() => {
                                        toggleFocusMode();
                                    }).catch(() => {
                                        toggleFocusMode(); // Still toggle focus mode even if fullscreen fails
                                    });
                                } else {
                                    toggleFocusMode(); // Fallback to just focus mode
                                }
                            } else {
                                // Exit fullscreen
                                if (document.fullscreenElement) {
                                    document.exitFullscreen().then(() => {
                                        toggleFocusMode();
                                    }).catch(() => {
                                        toggleFocusMode();
                                    });
                                } else {
                                    toggleFocusMode();
                                }
                            }
                        }}
                        className={`px-2 py-2 rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
                            state.isFocusMode
                                ? 'bg-primary text-primary-content hover:bg-primary-focus'
                                : 'bg-base-100 hover:bg-base-300'
                        }`}
                    >
                        {state.isFocusMode ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
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
            
            {/* Import Script Modal */}
            <ScriptImportModal
                isOpen={showImportModal}
                onClose={handleCloseImport}
            />
        </div>
    );
}

