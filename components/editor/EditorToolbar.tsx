'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { FountainElementType, formatElement, detectElementType } from '@/utils/fountain';
import { saveToGitHub, getScreenplayFilePath } from '@/utils/github';
import { toast } from 'sonner';
import ScriptImportModal from './ScriptImportModal';
import SceneTypeDropdown from './SceneTypeDropdown';

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
    onLaunchDirector?: () => void;
    onLaunchDialogue?: () => void;
}

/**
 * Feature 0111: GitHub Save Button
 * Saves screenplay to GitHub with a user-friendly commit message prompt
 * Writers can describe their backup (e.g., "Finished Act 1", "Before major changes")
 */
function GitHubSaveButton() {
    const { state } = useEditor();
    const { screenplayId } = useScreenplay();
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');

    const handleSaveClick = () => {
        const githubConfigStr = localStorage.getItem('screenplay_github_config');
        
        if (!githubConfigStr) {
            setShowSetup(true);
            return;
        }

        // Show the commit message modal
        setCommitMessage('');
        setShowModal(true);
    };

    const handleSave = async () => {
        const githubConfigStr = localStorage.getItem('screenplay_github_config');
        if (!githubConfigStr) return;

        try {
            setSaving(true);
            const rawConfig = JSON.parse(githubConfigStr);
            
            // Normalize config - OAuth handler saves as 'accessToken', github.ts expects 'token'
            const config = {
                token: rawConfig.accessToken || rawConfig.token,
                owner: rawConfig.owner,
                repo: rawConfig.repo
            };
            
            // Use the user's message or a default
            const message = commitMessage.trim() || `Backup: ${state.title || 'Untitled Screenplay'}`;

            await saveToGitHub(config, {
                path: getScreenplayFilePath(screenplayId),
                content: state.content,
                message: message,
                branch: 'main'
            });

            toast.success(
                `Backup saved! "${message}"\n\nYou can restore this version anytime from Version History.`,
                { duration: 5000 }
            );
            setShowModal(false);
        } catch (error: any) {
            console.error('[GitHub Save] Failed:', error);
            
            // Check if this is an authentication error (expired/revoked token)
            const errorMessage = error.message || '';
            if (errorMessage.includes('Bad credentials') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                // Clear the invalid token
                localStorage.removeItem('screenplay_github_config');
                
                toast.error(
                    'Your GitHub connection has expired. Please reconnect to save backups.',
                    { duration: 8000 }
                );
                
                // Show the setup modal to reconnect
                setShowModal(false);
                setShowSetup(true);
            } else {
                toast.error('Backup failed: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleConnectGitHub = () => {
        const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        
        if (!GITHUB_CLIENT_ID) {
            toast.error('GitHub connection is not configured. Please contact support.');
            return;
        }
        
        const scope = 'repo,user';
        const oauthState = 'github_oauth_wryda';
        const redirectUri = `${window.location.origin}/write`;
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${oauthState}`;
        
        window.location.href = authUrl;
    };

    // Check if GitHub is connected
    const isConnected = typeof window !== 'undefined' && !!localStorage.getItem('screenplay_github_config');

    return (
        <>
            {/* GitHub Save Button */}
            <div className="hidden md:block tooltip tooltip-bottom" data-tip={isConnected ? "Save a backup • Creates a new version you can restore later" : "Connect GitHub to save backups"}>
                <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="px-2 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                >
                    {saving ? (
                        <>
                            <span className="loading loading-spinner loading-xs"></span>
                            <span className="text-[9px] hidden sm:inline">SAVING...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-base">😈</span>
                            <span className="text-[9px] hidden sm:inline">BACKUP</span>
                        </>
                    )}
                </button>
            </div>

            {/* Commit Message Modal - User-friendly for writers */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
                    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-2xl p-6 max-w-md mx-4 shadow-xl w-full">
                        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save a Backup
                        </h3>
                        
                        <p className="text-base text-gray-300 mb-4">
                            This saves your current screenplay so you can come back to it later. 
                            Give it a short description to help you remember what changed.
                        </p>
                        
                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text font-medium text-gray-200">What did you work on?</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Finished Act 1, Fixed dialogue, Before big changes..."
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                className="w-full h-12 px-4 bg-[#141414] border border-[#3F3F46] rounded-lg text-base text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !saving) {
                                        handleSave();
                                    }
                                }}
                            />
                            <label className="label">
                                <span className="label-text-alt text-gray-500">
                                    Leave blank for a default description
                                </span>
                            </label>
                        </div>
                        
                        <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 mb-4 text-sm text-gray-300">
                            <p className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 text-cinema-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    <strong>Tip:</strong> You can view all your saved backups in <strong>Version History</strong> 
                                    and restore any previous version whenever you want!
                                </span>
                            </p>
                        </div>

                        <p className="text-xs text-gray-400 mb-4">
                            When GitHub is connected, background session backups can also save automatically. Manual backups still work the same.
                        </p>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary flex-1 gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Backup
                        </>
                    )}
                </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={saving}
                                className="btn bg-[#141414] text-gray-200 border border-[#3F3F46] hover:bg-[#1F1F1F]"
                            >
                                Cancel
                </button>
            </div>
                    </div>
                </div>
            )}

            {/* GitHub Setup Modal - For first-time connection */}
            {showSetup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
                    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-2xl p-6 max-w-md mx-4 shadow-xl w-full">
                        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Connect GitHub
                        </h3>
                        
                        <div className="space-y-3 text-sm text-gray-300 mb-4">
                            <p>
                                <strong>What is GitHub?</strong> Think of it as a super-powered "save" feature. 
                                It keeps every version of your screenplay safe in the cloud.
                            </p>
                            <p>
                                <strong>Why use it?</strong> You can go back to any saved version at any time. 
                                Made a mistake? Just restore an older backup!
                            </p>
                            <p className="text-gray-400">
                                Your screenplay also auto-saves locally, so GitHub is optional but recommended for extra safety.
                            </p>
                            <p className="text-gray-400">
                                When connected, background session backups can save automatically in addition to manual backups.
                            </p>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleConnectGitHub}
                                className="btn btn-primary flex-1"
                            >
                                Connect GitHub
                            </button>
                            <button
                                onClick={() => setShowSetup(false)}
                                className="btn bg-[#141414] text-gray-200 border border-[#3F3F46] hover:bg-[#1F1F1F]"
                            >
                                Maybe Later
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
export default function EditorToolbar({ className = '', onExportPDF, onOpenCollaboration, onSave, isEditorFullscreen = false, onToggleEditorFullscreen, isPreviewMode = false, onTogglePreview, onOpenFindReplace, onToggleItalics, onOpenVersionHistory, onToggleSceneNav, onLaunchDirector, onLaunchDialogue }: EditorToolbarProps) {
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
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSceneTypeDropdown, setShowSceneTypeDropdown] = useState(false);
    const [sceneTypeDropdownPosition, setSceneTypeDropdownPosition] = useState<{ top: number; left: number; above?: boolean } | null>(null);
    const savedCursorPositionRef = useRef<number | null>(null);
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

    // Insert scene type and trigger smart tab navigation
    const insertSceneTypeAndTab = (sceneType: { id: string; label: string }) => {
        console.log('[NAV-DIAG] EditorToolbar: Closing scene type dropdown, inserting:', sceneType.label);
        setShowSceneTypeDropdown(false);
        setSceneTypeDropdownPosition(null);
        
        const textarea = textareaRef.current || document.querySelector('textarea.fountain-editor-textarea') as HTMLTextAreaElement ||
                        document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        // Use saved cursor position (from when button was clicked) instead of current position
        const cursorPos = savedCursorPositionRef.current ?? textarea.selectionStart;
        savedCursorPositionRef.current = null; // Clear after use
        
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const textAfterCursor = state.content.substring(cursorPos);
        
        // Insert selected type with space
        const newTextBefore = textBeforeCursor + sceneType.label + ' ';
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
                console.log('[NAV-DIAG] EditorToolbar: Dispatching synthetic Tab event');
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

    // Store textarea ref for reliable access
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Update textarea ref when component mounts or content changes
    useEffect(() => {
        const updateTextareaRef = () => {
            // Try to find the textarea - look for the one in the editor
            const textarea = document.querySelector('textarea.fountain-editor-textarea') as HTMLTextAreaElement ||
                           document.querySelector('textarea[data-fountain-editor]') as HTMLTextAreaElement ||
                           document.querySelector('textarea') as HTMLTextAreaElement;
            if (textarea) {
                textareaRef.current = textarea;
            }
        };
        updateTextareaRef();
        // Re-check periodically in case textarea is added dynamically
        const interval = setInterval(updateTextareaRef, 100);
        return () => clearInterval(interval);
    }, [state.content]);

    // Calculate dropdown position near cursor (exact same logic as SmartTypeDropdown)
    const getCursorDropdownPosition = (): { top: number; left: number; above?: boolean } | null => {
        const textarea = textareaRef.current || document.querySelector('textarea.fountain-editor-textarea') as HTMLTextAreaElement ||
                        document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return null;

        const cursorPos = textarea.selectionStart;
        
        // Get textarea position
        const textareaRect = textarea.getBoundingClientRect();
        const lines = state.content.substring(0, cursorPos).split('\n');
        const lineNumber = lines.length - 1;
        const currentLineText = lines[lines.length - 1] || '';
        const cursorInLine = currentLineText.length;
        
        // Get actual line height from computed style
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
        const fontSize = parseFloat(computedStyle.fontSize) || 16;
        const charWidth = fontSize * 0.6; // More accurate character width estimate (monospace)
        
        // Account for padding
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        
        // Calculate cursor position
        const lineTop = textareaRect.top + paddingTop + (lineNumber * lineHeight);
        const cursorLeft = textareaRect.left + paddingLeft + (cursorInLine * charWidth);
        
        // Use visualViewport on mobile to account for keyboard
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const viewportTop = window.visualViewport?.offsetTop || 0;
        
        const dropdownHeight = 256; // max-h-64 = 256px (matching SmartTypeDropdown)
        const spaceBelow = viewportHeight - (lineTop - viewportTop) - lineHeight;
        const spaceAbove = lineTop - viewportTop;
        
        // On mobile, prefer showing above to avoid keyboard
        const isMobileCheck = window.innerWidth < 768;
        const showAbove = isMobileCheck 
            ? (spaceBelow < dropdownHeight + 50 || spaceAbove > spaceBelow) // Prefer above on mobile
            : (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight);
        
        const baseTop = lineTop + lineHeight;
        
        // Calculate position - align with text line, slightly below
        // Use smaller offset to position closer to the text line
        let top = showAbove 
            ? baseTop - dropdownHeight - 2  // Show above with 2px gap
            : lineTop + 2;                    // Show below, aligned with line start (2px below line)
        // On mobile, align with cursor position; on desktop, align with text start
        let left = isMobileCheck ? cursorLeft : textareaRect.left + paddingLeft;
        
        // Ensure dropdown stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const dropdownWidth = 288; // w-72 = 288px
        
        // Clamp left position to viewport
        if (left + dropdownWidth > viewportWidth - 20) {
            left = viewportWidth - dropdownWidth - 20;
        }
        if (left < 10) {
            left = 10;
        }
        
        // Clamp top position to viewport
        if (top < 10) {
            top = 10;
        }
        if (top + dropdownHeight > viewportHeight - 10) {
            top = viewportHeight - dropdownHeight - 10;
        }
        
        return { top, left, above: showAbove };
    };

    // Wryda Smart Tab button handler
    const handleWrydaTabButton = (e: React.MouseEvent) => {
        const textarea = textareaRef.current || document.querySelector('textarea.fountain-editor-textarea') as HTMLTextAreaElement ||
                        document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        // Save cursor position BEFORE showing dropdown (before textarea potentially loses focus)
        const cursorPos = textarea.selectionStart;
        savedCursorPositionRef.current = cursorPos;
        
        const textBeforeCursor = state.content.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLineText = lines[lines.length - 1] || '';
        
        // Check if current line is already a scene heading
        const elementType = detectElementType(currentLineText);
        
        if (elementType === 'scene_heading') {
            // Already a scene heading, just trigger Tab (don't show dropdown)
            e.preventDefault();
            const tabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                code: 'Tab',
                bubbles: true,
                cancelable: true
            });
            textarea.dispatchEvent(tabEvent);
        } else {
            // Not a scene heading, calculate position and show dropdown
            const position = getCursorDropdownPosition();
            if (position) {
                console.log('[NAV-DIAG] EditorToolbar: Opening scene type dropdown');
                setSceneTypeDropdownPosition(position);
                setShowSceneTypeDropdown(true);
            }
        }
    };

    // Scene type items
    const sceneTypeItems = [
        { id: 'int', label: 'INT.' },
        { id: 'ext', label: 'EXT.' },
        { id: 'int-ext', label: 'INT./EXT.' }
    ];
    
    const increaseFontSize = () => {
        if (state.fontSize < 24) {
            setFontSize(state.fontSize + 2);
        }
    };
    
    // Mobile detection for font size minimum
    const [isMobile, setIsMobile] = React.useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < 768;
    });
    
    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const decreaseFontSize = () => {
        // On mobile, minimum is 16px to prevent auto-zoom; on desktop, minimum is 12px
        const minFontSize = isMobile ? 16 : 12;
        if (state.fontSize > minFontSize) {
            setFontSize(state.fontSize - 2);
        }
    };
    
    // Check if decrease button should be disabled (at minimum)
    const minFontSize = isMobile ? 16 : 12;
    const canDecreaseFontSize = state.fontSize > minFontSize;
    
    const [showMoreFormats, setShowMoreFormats] = React.useState(false);
    
    return (
        <div className={`bg-[#0A0A0A] border-t border-white/10 shadow-sm ${className}`}>
            {/* Desktop toolbar - flex wrap layout */}
            <div className="hidden md:flex flex-wrap items-center gap-2 p-2">
                
                {/* Undo/Redo */}
                <div className="flex space-x-2">
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
                            className="px-2 py-2 bg-base-300 hover:bg-[#DC143C]/10 hover:text-[#DC143C] rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-[9px] hidden sm:inline">FIND</span>
                        </button>
                    </div>
                )}

                {/* Divider - only visible on larger screens */}
                <div className="hidden sm:block h-8 w-px bg-base-300"></div>
                
                {/* Quick Formatting buttons */}
                <div className="flex space-x-2">
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
                    
                    {/* Dialogue Agent - Subtle gradient + hover glow */}
                    {onLaunchDialogue && (
                        <div className="tooltip tooltip-bottom" data-tip="Dialogue Agent • Generate dialogue">
                            <button
                                onClick={onLaunchDialogue}
                                className="px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-all duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
                                    border: '1px solid rgba(147, 51, 234, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 12px rgba(147, 51, 234, 0.4)';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147, 51, 234, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)';
                                }}
                            >
                                <span className="text-base">💬</span>
                                <span className="text-[9px] hidden sm:inline">DIALOG</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Director Agent - Subtle gradient + hover glow */}
                    {onLaunchDirector && (
                        <div className="tooltip tooltip-bottom" data-tip="Director Agent • Generate complete scenes">
                            <button
                                onClick={onLaunchDirector}
                                className="px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-all duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)',
                                    border: '1px solid rgba(249, 115, 22, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.4)';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(234, 88, 12, 0.25) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)';
                                }}
                            >
                                <span className="text-base">🎬</span>
                                <span className="text-[9px] hidden sm:inline">DIRECT</span>
                            </button>
                        </div>
                    )}
                    
                    {/* More formats toggle */}
                    <div className="tooltip tooltip-bottom" data-tip="More Formats • Notes, Transitions, Centered, etc.">
                        <button
                            onClick={() => setShowMoreFormats(!showMoreFormats)}
                            className={`px-2 py-2 rounded text-xs font-semibold min-w-[40px] min-h-[40px] flex flex-col items-center justify-center transition-colors ${
                                showMoreFormats ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-300'
                            }`}
                        >
                            <span className="text-base">⋯</span>
                            <span className="text-[9px] hidden sm:inline">MORE</span>
                        </button>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="h-8 w-px bg-base-300 mx-2"></div>
                
                {/* View controls */}
                <div className="flex space-x-2">
                    <div className="tooltip tooltip-bottom" data-tip="Decrease Font Size">
                        <button
                            onClick={decreaseFontSize}
                            disabled={!canDecreaseFontSize}
                            className="px-2 py-2 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                    <div className="tooltip tooltip-bottom" data-tip={isEditorLocked ? 'Editor is locked by another tab' : isRescanning ? 'Scanning... Please wait' : rescanCooldown ? 'Please wait a moment before scanning again' : (isLoading || !hasInitializedFromDynamoDB) ? 'Please wait for scenes to load' : 'Scan script for new characters/locations (keeps existing data)'}>
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
                                <span className="text-[9px] hidden sm:inline">HIST</span>
                            </button>
                        </div>
                    );
                })()}
                
                {/* Feature 0111: Save Backup to GitHub - Actually commits to GitHub */}
                <GitHubSaveButton />
                
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
                        <span className="text-[9px] hidden sm:inline">FOUNT</span>
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
            
            {/* Mobile toolbar - 2 rows */}
            <div className="md:hidden flex flex-col gap-1.5 p-1.5">
                {/* ROW 1: Undo, Redo, Paren, Dialogue, Director, Scenes, Full, View (8 buttons) */}
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
                    
                    {/* Dialogue Agent - Mobile */}
                    {onLaunchDialogue && (
                        <div className="tooltip tooltip-bottom" data-tip="Dialogue Agent">
                            <button
                                onClick={onLaunchDialogue}
                                className="w-full px-1 py-1.5 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-all duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
                                    border: '1px solid rgba(147, 51, 234, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 8px rgba(147, 51, 234, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span className="text-sm">💬</span>
                                <span className="text-[8px] leading-tight">Dialogue</span>
                            </button>
                        </div>
                    )}
                    
                    {/* Director Agent - Mobile */}
                    {onLaunchDirector && (
                        <div className="tooltip tooltip-bottom" data-tip="Director Agent">
                            <button
                                onClick={onLaunchDirector}
                                className="w-full px-1 py-1.5 rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-all duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)',
                                    border: '1px solid rgba(249, 115, 22, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 8px rgba(249, 115, 22, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span className="text-sm">🎬</span>
                                <span className="text-[8px] leading-tight">Director</span>
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
                                <span className="text-sm">🗺️</span>
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
                
                {/* ROW 2: -, +, Italic, Save, Rescan, Import, Download, More (8 buttons) - Hidden in fullscreen */}
                {!isEditorFullscreen && (
                <div className="grid grid-cols-8 gap-1">
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
                    {/* Decrease Font Size */}
                    <div className="tooltip tooltip-bottom" data-tip="Decrease Font Size">
                        <button
                            onClick={decreaseFontSize}
                            disabled={!canDecreaseFontSize}
                            className="w-full px-1 py-1.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] rounded text-xs font-semibold min-h-[36px] flex flex-col items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                        <div className="tooltip tooltip-bottom" data-tip={isEditorLocked ? 'Editor is locked by another tab' : isRescanning ? 'Scanning... Please wait' : rescanCooldown ? 'Please wait a moment' : (isLoading || !hasInitializedFromDynamoDB) ? 'Please wait for scenes to load' : 'Scan script for new characters/locations'}>
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
                    
                    {/* Download (PDF) */}
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
                </div>
                )}
            </div>
            
            {/* Extended format menu */}
            {showMoreFormats && (
                <div className="border-t border-white/10 p-2 bg-[#0A0A0A]">
                    <div className="grid grid-cols-6 gap-1">
                        <div className="tooltip tooltip-top" data-tip="CUT TO: • FADE IN: • etc.">
                            <button
                                onClick={() => {
                                    formatCurrentLine('transition');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full min-h-[40px] flex flex-col items-center justify-center"
                            >
                                <span className="text-base">➔</span>
                                <span className="text-[9px]">TRANS</span>
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="> THE END <">
                            <button
                                onClick={() => {
                                    formatCurrentLine('centered');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full min-h-[40px] flex flex-col items-center justify-center"
                            >
                                <span className="text-base">≡</span>
                                <span className="text-[9px]">CENTER</span>
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="~ Happy birthday ~">
                            <button
                                onClick={() => {
                                    formatCurrentLine('lyrics');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full min-h-[40px] flex flex-col items-center justify-center"
                            >
                                <span className="text-base">♪</span>
                                <span className="text-[9px]">LYRICS</span>
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="# Act I">
                            <button
                                onClick={() => {
                                    formatCurrentLine('section');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full min-h-[40px] flex flex-col items-center justify-center"
                            >
                                <span className="text-base">#</span>
                                <span className="text-[9px]">SECT</span>
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="= Scene summary">
                            <button
                                onClick={() => {
                                    formatCurrentLine('synopsis');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full min-h-[40px] flex flex-col items-center justify-center"
                            >
                                <span className="text-base">=</span>
                                <span className="text-[9px]">SYNO</span>
                            </button>
                        </div>
                        <div className="tooltip tooltip-top" data-tip="[[ Hidden note ]] • Not in PDF">
                            <button
                                onClick={() => {
                                    formatCurrentLine('note');
                                    setShowMoreFormats(false);
                                }}
                                className="px-2 py-2 bg-base-200 hover:bg-base-300 rounded text-xs font-medium border border-base-300 w-full min-h-[40px] flex flex-col items-center justify-center"
                            >
                                <span className="text-base">[[</span>
                                <span className="text-[9px]">NOTE</span>
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

