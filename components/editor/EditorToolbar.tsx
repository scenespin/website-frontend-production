'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { FountainElementType, formatElement, detectElementType } from '@/utils/fountain';
import { saveToGitHub } from '@/utils/github';
import { toast } from 'sonner';
import ScriptImportModal from './ScriptImportModal';

interface EditorToolbarProps {
    className?: string;
    onExportPDF?: () => void;
    onOpenCollaboration?: () => void;
    onSave?: () => void;
    isEditorFullscreen?: boolean;
    onToggleEditorFullscreen?: () => void;
    isPreviewMode?: boolean;
    onTogglePreview?: () => void;
    onOpenFindReplace?: () => void;
    onToggleItalics?: () => void;
    onOpenVersionHistory?: () => void;
    onToggleSceneNav?: () => void;
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
export default function EditorToolbar({ className = '', onExportPDF, onOpenCollaboration, onSave, isEditorFullscreen = false, onToggleEditorFullscreen, isPreviewMode = false, onTogglePreview, onOpenFindReplace, onToggleItalics, onOpenVersionHistory, onToggleSceneNav }: EditorToolbarProps) {
    const { state, setContent, setCursorPosition, toggleFocusMode, setFontSize, undo, redo, saveNow, isEditorLocked, isPreviewMode: contextPreviewMode, setIsPreviewMode } = useEditor();
    
    // Use prop if provided, otherwise use context
    const effectivePreviewMode = isPreviewMode !== undefined ? isPreviewMode : contextPreviewMode;
    const handleTogglePreview = onTogglePreview || (() => setIsPreviewMode(!contextPreviewMode));
    const { canEditScript, rescanScript, currentUserRole, permissionsLoading, isOwner, isLoading, hasInitializedFromDynamoDB } = useScreenplay();
    
    // Feature 0133: Fix writer role save buttons - ensure canEditScript is true for writer role
    // Logic:
    // 1. If permissions are loaded and canEditScript is true → show buttons
    // 2. If we know the role is writer/director → show buttons
    // 3. If we know the role is viewer/producer (non-editing roles) → hide buttons immediately
    // 4. If permissions are loading AND we don't know the role yet AND user is not owner → show buttons optimistically
    // This prevents buttons from flashing for viewers - once role is known, we use it immediately
    const isNonEditingRole = currentUserRole === 'viewer' || 
                             currentUserRole === 'producer';
    
    const effectiveCanEditScript = !isNonEditingRole && (
        canEditScript || 
        currentUserRole === 'writer' || 
        currentUserRole === 'director' ||
        (permissionsLoading && !isOwner && !currentUserRole) // Only show optimistically if role is unknown (null)
    );
    const [isSaving, setIsSaving] = useState(false);
    const [showSceneTypePicker, setShowSceneTypePicker] = useState(false);
    const [sceneTypePickerPosition, setSceneTypePickerPosition] = useState<{ top: number; left: number } | null>(null);
    const sceneTypeButtonRef = useRef<HTMLButtonElement>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isRescanning, setIsRescanning] = useState(false); // 🔥 NEW: Re-scan state
    const [rescanCooldown, setRescanCooldown] = useState(false); // Cooldown to prevent rapid re-clicks
    
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
        // Prevent multiple clicks
        if (isRescanning || rescanCooldown) {
            return;
        }
        
        // 🔥 FIX: Prevent rescan during initialization to avoid race condition with empty state
        const isInitializing = isLoading || !hasInitializedFromDynamoDB;
        if (isInitializing) {
            toast.info('Please wait for scenes to load before rescanning');
            return;
        }
        
        setIsRescanning(true);
        
        try {
            console.log('[EditorToolbar] 🔍 Re-scanning script...');
            
            // Get current editor content
            const content = state.content;
            
            if (!content.trim()) {
                toast.error('No script to scan');
                setIsRescanning(false);
                return;
            }
            
            // Call rescanScript from ScreenplayContext
            const result = await rescanScript(content);
            
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
            
            // Add 3-second cooldown to prevent rapid re-clicks
            setRescanCooldown(true);
            setTimeout(() => {
                setRescanCooldown(false);
            }, 3000);
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

    // Wryda Smart Tab button handler
    const handleWrydaTabButton = (e: React.MouseEvent<HTMLButtonElement>) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1] || '';
        
        // Check if current line is already a scene heading
        const elementType = detectElementType(currentLineText);
        
        // If not a scene heading, show type picker dropdown
        if (elementType !== 'scene_heading') {
            // Get button position for dropdown
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();
            setSceneTypePickerPosition({
                top: rect.bottom + 4,
                left: rect.left
            });
            setShowSceneTypePicker(true);
        } else {
            // Already a scene heading, just trigger Tab
            const tabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                code: 'Tab',
                bubbles: true,
                cancelable: true
            });
            textarea.dispatchEvent(tabEvent);
        }
    };

    // Handle scene type selection
    const handleSceneTypeSelect = (type: string) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        setShowSceneTypePicker(false);
        setSceneTypePickerPosition(null);

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        
        // Insert selected type
        const newTextBefore = textBeforeCursor + type + ' ';
        const newContent = newTextBefore + textAfterCursor;
        setContent(newContent);
        
        // Wait for content update, then trigger Tab
        setTimeout(() => {
            if (textarea) {
                const newPos = newTextBefore.length;
                textarea.selectionStart = newPos;
                textarea.selectionEnd = newPos;
                setCursorPosition(newPos);
                // Trigger Tab key event
                const tabEvent = new KeyboardEvent('keydown', {
                    key: 'Tab',
                    code: 'Tab',
                    bubbles: true,
                    cancelable: true
                });
                textarea.dispatchEvent(tabEvent);
            }
        }, 0);
    };

    // Close picker when clicking outside
    useEffect(() => {
        if (!showSceneTypePicker) return;
        
        const handleClickOutside = (e: MouseEvent) => {
            if (sceneTypeButtonRef.current && !sceneTypeButtonRef.current.contains(e.target as Node)) {
                setShowSceneTypePicker(false);
                setSceneTypePickerPosition(null);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSceneTypePicker]);
    
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
        <div className={`bg-[#0A0A0A] border-t border-white/10 shadow-sm ${className}`}>
            {/* Desktop toolbar - flex wrap layout */}
            <div className="hidden md:flex flex-wrap items-center gap-2 p-2">
                
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
                
                {/* Find/Replace */}
                {onOpenFindReplace && (
                    <div className="tooltip tooltip-bottom" data-tip="Find & Replace • Ctrl+F">
                        <button
                            onClick={onOpenFindReplace}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Divider - only visible on larger screens */}
                <div className="hidden sm:block h-8 w-px bg-base-300"></div>
                
                {/* Quick Formatting buttons */}
                <div className="flex space-x-1">
                    <div className="tooltip tooltip-bottom" data-tip="Wryda Smart Tab • Tab or $ • Scene heading navigation">
                        <div className="relative">
                            <button
                                ref={sceneTypeButtonRef}
                                onClick={handleWrydaTabButton}
                                className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-base font-bold">AW</span>
                                <span className="text-[9px] hidden sm:inline">TAB</span>
                            </button>
                            {/* Scene Type Picker Dropdown */}
                            {showSceneTypePicker && sceneTypePickerPosition && (
                                <div
                                    className="fixed z-[10000] bg-base-100 border border-base-300 rounded-lg shadow-2xl py-1 min-w-[120px]"
                                    style={{
                                        top: `${sceneTypePickerPosition.top}px`,
                                        left: `${sceneTypePickerPosition.left}px`
                                    }}
                                >
                                    <button
                                        onClick={() => handleSceneTypeSelect('INT.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        INT.
                                    </button>
                                    <button
                                        onClick={() => handleSceneTypeSelect('EXT.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        EXT.
                                    </button>
                                    <button
                                        onClick={() => handleSceneTypeSelect('INT./EXT.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        INT./EXT.
                                    </button>
                                    <button
                                        onClick={() => handleSceneTypeSelect('I./E.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        I./E.
                                    </button>
                                </div>
                            )}
                        </div>
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
                    
                    {/* Italics */}
                    {onToggleItalics && (
                        <div className="tooltip tooltip-bottom" data-tip="Italics • Ctrl+I • *text*">
                            <button
                                onClick={onToggleItalics}
                                className="px-2 py-2 bg-base-100 hover:bg-base-300 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-base italic font-semibold">I</span>
                                <span className="text-[9px] hidden sm:inline">ITALIC</span>
                            </button>
                        </div>
                    )}
                    
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
                            className="px-2 py-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                            <span className="text-base">−</span>
                        </button>
                    </div>
                    
                    <div className="tooltip tooltip-bottom" data-tip="Increase Font Size">
                        <button
                            onClick={increaseFontSize}
                            className="px-2 py-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                        >
                            <span className="text-base">+</span>
                        </button>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Import Script Button - Emoji */}
                {effectiveCanEditScript && (
                    <div className="tooltip tooltip-bottom" data-tip="Import screenplay from paste">
                        <button
                            onClick={handleOpenImport}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">📄</span>
                            <span className="text-[9px] hidden sm:inline">IMPORT</span>
                        </button>
                    </div>
                )}
                
                {/* 🔥 FEATURE 0117: Re-Scan Script Button - Emoji */}
                {/* Feature 0187: Disable rescan button when editor is locked */}
                {effectiveCanEditScript && (
                    <div className="tooltip tooltip-bottom" data-tip={isEditorLocked ? 'Editor is locked by another device' : isRescanning ? 'Scanning... Please wait' : rescanCooldown ? 'Please wait a moment before scanning again' : (isLoading || !hasInitializedFromDynamoDB) ? 'Please wait for scenes to load' : 'Scan script for new characters/locations (keeps existing data)'}>
                        <button
                            onClick={handleRescan}
                            disabled={isEditorLocked || isRescanning || rescanCooldown || !state.content.trim() || isLoading || !hasInitializedFromDynamoDB}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isRescanning ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span className="text-[9px] hidden sm:inline">SCANNING</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-base">🔄</span>
                                    <span className="text-[9px] hidden sm:inline">SCAN</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                {/* Save Button - Emoji */}
                {onSave && canEditScript && (
                    <div className="tooltip tooltip-bottom" data-tip={isSaving ? 'Saving...' : 'Save to database'}>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-all ${
                                isSaving
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-wait'
                                    : 'bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C]'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <span className="text-base animate-spin">💾</span>
                                    <span className="text-[9px] hidden sm:inline">SAVE</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-base">💾</span>
                                    <span className="text-[9px] hidden sm:inline">SAVE</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Version History */}
                {onOpenVersionHistory && (() => {
                    const githubConfigStr = typeof window !== 'undefined' ? localStorage.getItem('screenplay_github_config') : null;
                    const hasGitHub = !!githubConfigStr;
                    
                    if (!hasGitHub) return null;
                    
                    return (
                        <div className="tooltip tooltip-bottom" data-tip="Version History • View commit history">
                            <button
                                onClick={onOpenVersionHistory}
                                className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[9px] hidden sm:inline">HISTORY</span>
                            </button>
                        </div>
                    );
                })()}
                
                {/* Feature 0111: Optional Export to GitHub - Emoji (opens in new window) - Hidden on mobile */}
                <div className="hidden md:block tooltip tooltip-bottom" data-tip="Export to GitHub (Optional) • Opens in new window">
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
                                    window.open(authUrl, '_blank');
                                }
                                return;
                            }
                            try {
                                const config = JSON.parse(githubConfigStr);
                                // Open GitHub repo in new window
                                const repoUrl = `https://github.com/${config.owner}/${config.repo}`;
                                window.open(repoUrl, '_blank');
                                toast.success('✅ Opening GitHub repository in new window!');
                            } catch (error: any) {
                                toast.error('Export failed: ' + (error.message || 'Unknown error'));
                            }
                        }}
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                    >
                        <span className="text-base">😈</span>
                        <span className="text-[9px] hidden sm:inline">GITHUB</span>
                    </button>
                </div>
                
                {/* Divider */}
                <div className="hidden md:block h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Download .fountain button - Emoji - Hidden on mobile */}
                <div className="hidden md:block tooltip tooltip-bottom" data-tip="Download .fountain file • Plain text screenplay format">
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
                        className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                    >
                        <span className="text-base">⛲</span>
                        <span className="text-[9px] hidden sm:inline">FOUNTAIN</span>
                    </button>
                </div>
                
                {/* Export PDF button - Emoji */}
                {onExportPDF && (
                    <div className="tooltip tooltip-bottom" data-tip="Export PDF • Industry-standard format • Cmd+P">
                        <button
                            onClick={onExportPDF}
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-base">⬇️</span>
                            <span className="text-[9px] hidden sm:inline">PDF</span>
                        </button>
                    </div>
                )}
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* Editor Fullscreen toggle - Hides sidebar, shows only toolbar and editor */}
                <div className="tooltip tooltip-bottom" data-tip={isEditorFullscreen ? 'Exit Editor Fullscreen' : 'Editor Fullscreen • Hide sidebar, focus on writing'}>
                    <button
                        onClick={() => {
                            if (onToggleEditorFullscreen) {
                                onToggleEditorFullscreen();
                            } else {
                                // Fallback: Toggle editor fullscreen via custom event
                                window.dispatchEvent(new CustomEvent('toggleEditorFullscreen'));
                            }
                        }}
                        className={`px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors ${
                            isEditorFullscreen
                                ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white'
                                : 'bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C]'
                        }`}
                    >
                        {isEditorFullscreen ? (
                            <>
                                <span className="text-base">✕</span>
                                <span className="text-[9px] hidden sm:inline">EXIT</span>
                            </>
                        ) : (
                            <>
                                <span className="text-base">⛶</span>
                                <span className="text-[9px] hidden sm:inline">FULL</span>
                            </>
                        )}
                    </button>
                </div>
                
                {/* Preview Mode toggle - Shows formatted read-only view */}
                <div className="tooltip tooltip-bottom" data-tip={effectivePreviewMode ? 'Exit Preview Mode' : 'Preview Mode • View formatted screenplay'}>
                    <button
                        onClick={handleTogglePreview}
                        className={`px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors ${
                            effectivePreviewMode
                                ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white'
                                : 'bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C]'
                        }`}
                    >
                        {effectivePreviewMode ? (
                            <>
                                <span className="text-base">👁️</span>
                                <span className="text-[9px] hidden sm:inline">EXIT</span>
                            </>
                        ) : (
                            <>
                                <span className="text-base">👁️</span>
                                <span className="text-[9px] hidden sm:inline">VIEW</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Mobile toolbar - 2 rows of 8 buttons each */}
            <div className="md:hidden flex flex-col gap-1.5 p-1.5">
                {/* ROW 1: Top Actions (8 buttons) */}
                <div className="grid grid-cols-8 gap-1">
                    {/* Undo */}
                    <div className="tooltip tooltip-bottom" data-tip="Undo • Ctrl+Z">
                        <button
                            onClick={undo}
                            disabled={state.undoStack.length === 0}
                            className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="text-sm">↶</span>
                            <span className="text-[8px] leading-tight">Undo</span>
                        </button>
                    </div>
                    
                    {/* Redo */}
                    <div className="tooltip tooltip-bottom" data-tip="Redo • Ctrl+Y">
                        <button
                            onClick={redo}
                            disabled={state.redoStack.length === 0}
                            className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <span className="text-sm">↷</span>
                            <span className="text-[8px] leading-tight">Redo</span>
                        </button>
                    </div>
                    
                    {/* Save */}
                    {onSave && canEditScript && (
                        <div className="tooltip tooltip-bottom" data-tip={isSaving ? 'Saving...' : 'Save to database'}>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`w-full px-1 py-1.5 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-all ${
                                    isSaving
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 cursor-wait'
                                        : 'bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C]'
                                }`}
                            >
                                {isSaving ? (
                                    <span className="text-sm animate-spin">💾</span>
                                ) : (
                                    <>
                                        <span className="text-sm">💾</span>
                                        <span className="text-[8px] leading-tight">Save</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {/* Rescan */}
                    {/* Feature 0187: Disable rescan button when editor is locked */}
                    {effectiveCanEditScript && (
                        <div className="tooltip tooltip-bottom" data-tip={isEditorLocked ? 'Editor is locked by another device' : isRescanning ? 'Scanning... Please wait' : rescanCooldown ? 'Please wait a moment' : (isLoading || !hasInitializedFromDynamoDB) ? 'Please wait for scenes to load' : 'Scan script for new characters/locations'}>
                            <button
                                onClick={handleRescan}
                                disabled={isEditorLocked || isRescanning || rescanCooldown || !state.content.trim() || isLoading || !hasInitializedFromDynamoDB}
                                className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {isRescanning ? (
                                    <>
                                        <span className="text-sm loading loading-spinner loading-xs"></span>
                                        <span className="text-[8px] leading-tight">Scanning</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm">🔄</span>
                                        <span className="text-[8px] leading-tight">Rescan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {/* Import */}
                    {effectiveCanEditScript && (
                        <div className="tooltip tooltip-bottom" data-tip="Import screenplay from paste">
                            <button
                                onClick={handleOpenImport}
                                className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-sm">📄</span>
                                <span className="text-[8px] leading-tight">Import</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Scene Navigator toggle - Mobile only */}
                    {onToggleSceneNav && (
                        <div className="tooltip tooltip-bottom md:hidden" data-tip="Toggle Scene Navigator">
                            <button
                                onClick={onToggleSceneNav}
                                className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-sm">🎬</span>
                                <span className="text-[8px] leading-tight">Scenes</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Fullscreen */}
                    <div className="tooltip tooltip-bottom" data-tip={isEditorFullscreen ? 'Exit Editor Fullscreen' : 'Editor Fullscreen'}>
                        <button
                            onClick={() => {
                                if (onToggleEditorFullscreen) {
                                    onToggleEditorFullscreen();
                                } else {
                                    window.dispatchEvent(new CustomEvent('toggleEditorFullscreen'));
                                }
                            }}
                            className={`w-full px-1 py-1.5 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors ${
                                isEditorFullscreen
                                    ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white'
                                    : 'bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C]'
                            }`}
                        >
                            {isEditorFullscreen ? (
                                <>
                                    <span className="text-sm">✕</span>
                                    <span className="text-[8px] leading-tight">Exit</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">⛶</span>
                                    <span className="text-[8px] leading-tight">Full</span>
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Preview Mode toggle - Mobile */}
                    <div className="tooltip tooltip-bottom" data-tip={effectivePreviewMode ? 'Exit Preview Mode' : 'Preview Mode'}>
                        <button
                            onClick={handleTogglePreview}
                            className={`w-full px-1 py-1.5 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors ${
                                effectivePreviewMode
                                    ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white'
                                    : 'bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C]'
                            }`}
                        >
                            {effectivePreviewMode ? (
                                <>
                                    <span className="text-sm">👁️</span>
                                    <span className="text-[8px] leading-tight">Exit</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">👁️</span>
                                    <span className="text-[8px] leading-tight">View</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* ROW 2: Formatting Controls (8 buttons) - Hidden in fullscreen */}
                {!isEditorFullscreen && (
                <div className="grid grid-cols-8 gap-1">
                    {/* Decrease Font Size */}
                    <div className="tooltip tooltip-bottom" data-tip="Decrease Font Size">
                        <button
                            onClick={decreaseFontSize}
                            className="w-full px-1 py-1.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-sm">−</span>
                            <span className="text-[8px] leading-tight">-</span>
                        </button>
                    </div>
                    
                    {/* Increase Font Size */}
                    <div className="tooltip tooltip-bottom" data-tip="Increase Font Size">
                        <button
                            onClick={increaseFontSize}
                            className="w-full px-1 py-1.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-sm">+</span>
                            <span className="text-[8px] leading-tight">+</span>
                        </button>
                    </div>
                    
                    {/* Wryda Smart Tab */}
                    <div className="tooltip tooltip-bottom" data-tip="Wryda Smart Tab • Tab or $ • Scene heading navigation">
                        <div className="relative">
                            <button
                                ref={sceneTypeButtonRef}
                                onClick={handleWrydaTabButton}
                                className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-sm font-bold">AW</span>
                                <span className="text-[8px] leading-tight">TAB</span>
                            </button>
                            {/* Scene Type Picker Dropdown */}
                            {showSceneTypePicker && sceneTypePickerPosition && (
                                <div
                                    className="fixed z-[10000] bg-base-100 border border-base-300 rounded-lg shadow-2xl py-1 min-w-[120px]"
                                    style={{
                                        top: `${sceneTypePickerPosition.top}px`,
                                        left: `${sceneTypePickerPosition.left}px`
                                    }}
                                >
                                    <button
                                        onClick={() => handleSceneTypeSelect('INT.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        INT.
                                    </button>
                                    <button
                                        onClick={() => handleSceneTypeSelect('EXT.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        EXT.
                                    </button>
                                    <button
                                        onClick={() => handleSceneTypeSelect('INT./EXT.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        INT./EXT.
                                    </button>
                                    <button
                                        onClick={() => handleSceneTypeSelect('I./E.')}
                                        className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors text-sm"
                                    >
                                        I./E.
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Parenthetical */}
                    <div className="tooltip tooltip-bottom" data-tip="Parenthetical/Wryly">
                        <button
                            onClick={() => formatCurrentLine('parenthetical')}
                            className="w-full px-1 py-1.5 bg-base-100 hover:bg-base-300 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                        >
                            <span className="text-sm">( )</span>
                            <span className="text-[8px] leading-tight">Paren</span>
                        </button>
                    </div>
                    
                    {/* Italics */}
                    {onToggleItalics && (
                        <div className="tooltip tooltip-bottom" data-tip="Italics • Ctrl+I">
                            <button
                                onClick={onToggleItalics}
                                className="w-full px-1 py-1.5 bg-base-100 hover:bg-base-300 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-sm italic font-semibold">I</span>
                                <span className="text-[8px] leading-tight">Italic</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Download (PDF) - Moved to bottom row */}
                    {onExportPDF && (
                        <div className="tooltip tooltip-bottom" data-tip="Export PDF • Industry-standard format">
                            <button
                                onClick={onExportPDF}
                                className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                            >
                                <span className="text-sm">⬇️</span>
                                <span className="text-[8px] leading-tight">Download</span>
                            </button>
                        </div>
                    )}
                    
                    {/* More Formats */}
                    <div className="tooltip tooltip-bottom" data-tip="More Formats">
                        <button
                            onClick={() => setShowMoreFormats(!showMoreFormats)}
                            className={`w-full px-1 py-1.5 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors ${
                                showMoreFormats ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-300'
                            }`}
                        >
                            <span className="text-sm">⋯</span>
                            <span className="text-[8px] leading-tight">More</span>
                        </button>
                    </div>
                    
                    {/* Find/Replace - Desktop only (hidden on mobile) */}
                    {onOpenFindReplace && (
                        <div className="tooltip tooltip-bottom hidden md:block" data-tip="Find & Replace • Ctrl+F">
                            <button
                                onClick={onOpenFindReplace}
                                className="w-full px-1 py-1.5 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-[8px] leading-tight">Find</span>
                            </button>
                        </div>
                    )}
                </div>
                )}
            </div>
            
            {/* Extended format menu */}
            {showMoreFormats && (
                <div className="border-t border-white/10 p-2 bg-[#0A0A0A]">
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

