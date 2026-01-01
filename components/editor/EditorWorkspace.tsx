'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';
import FountainEditor from './FountainEditor';
import EditorHeader from './EditorHeader';
import EditorFooter from './EditorFooter';
import EditorToolbar from './EditorToolbar';
import SceneNavigator from './SceneNavigator';
import AgentFABGroup from './AgentFABGroup';
import { ExportPDFModal } from '../screenplay/ExportPDFModal';
import { CollaborationPanel } from '../CollaborationPanel';
import RewriteModal from '../modals/RewriteModal';
import ScreenwriterModal from '../modals/ScreenwriterModal';
import DirectorModal from '../modals/DirectorModal';
import DialogueModal from '../modals/DialogueModal';
import FindReplaceModal from './FindReplaceModal';
import VersionHistoryModal from './VersionHistoryModal';
import { saveToGitHub } from '@/utils/github';
import { extractEditorContext } from '@/utils/editorContext';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { toast } from 'sonner';
import type { Scene } from '../../types/screenplay';

/**
 * EditorWorkspace - Complete screenplay editor with all features
 * Responsive layout with scene navigator and toolbar
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorWorkspace() {
    const router = useRouter();
    const { state, setContent, setCurrentLine, replaceSelection, insertText, isEditorFullscreen, setIsEditorFullscreen, undo, redo } = useEditor();
    const screenplay = useScreenplay();
    const { isDrawerOpen, openDrawer } = useDrawer();
    const { setSelectedTextContext, setInput, setSceneContext, clearMessagesForMode, setMode } = useChatContext();
    const [showExportModal, setShowExportModal] = useState(false);
    const [showCollaborationModal, setShowCollaborationModal] = useState(false);
    const [isSceneNavVisible, setIsSceneNavVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Mobile detection and selection state for FABs
    const [isMobile, setIsMobile] = useState(false);
    const [hasSelection, setHasSelection] = useState(false);
    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
    
    // Rewrite modal state
    const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false);
    
    // Screenwriter modal state
    const [isScreenwriterModalOpen, setIsScreenwriterModalOpen] = useState(false);
    
    // Director modal state
    const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
    
    // Dialogue modal state
    const [isDialogueModalOpen, setIsDialogueModalOpen] = useState(false);
    
    // Find/Replace modal state
    const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = useState(false);
    
    // Version History modal state
    const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
    
    // Get screenplayId and sceneId from URL params (for collaboration and scene navigation)
    // Feature 0130: Use useSearchParams() for reactive URL parameter reading
    // Remove 'default' fallback - EditorContext handles loading from Clerk metadata if no URL param
    // URL param name stays as 'project' for compatibility, but we use screenplayId internally
    const searchParams = useSearchParams();
    const screenplayId = searchParams?.get('project'); // No fallback - let EditorContext handle it
    const sceneIdFromUrl = searchParams?.get('sceneId');
    
    // Get GitHub config from localStorage
    const [githubConfig, setGithubConfig] = useState<{ owner: string; repo: string; token: string } | null>(null);
    
    useEffect(() => {
        try {
            const configStr = localStorage.getItem('screenplay_github_config');
            if (configStr) {
                setGithubConfig(JSON.parse(configStr));
            }
        } catch (err) {
            console.error('[EditorWorkspace] Failed to load GitHub config:', err);
        }
    }, []);  // Feature 0111: No longer depend on screenplay.isConnected
    
    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Handle selection state changes from FountainEditor
    const handleSelectionStateChange = (
        hasSelection: boolean,
        selectedText: string | null,
        selectionRange: { start: number; end: number } | null
    ) => {
        setHasSelection(hasSelection);
        setSelectedText(selectedText);
        setSelectionRange(selectionRange);
    };
    
    /**
     * Manual Save Handler
     * Saves to GitHub if connected, otherwise saves to localStorage
     */
    const handleManualSave = async () => {
        if (isSaving) return;
        
        setIsSaving(true);
        try {
            // Feature 0111: Check if GitHub is configured in localStorage
            const githubConfigStr = localStorage.getItem('screenplay_github_config');
            
            if (githubConfigStr) {
                const githubConfig = JSON.parse(githubConfigStr);
                
                if (githubConfig.accessToken && githubConfig.owner && githubConfig.repo) {
                    toast.info('Saving to GitHub...');
                    
                    await saveToGitHub(githubConfig, {
                        path: 'screenplay.fountain',
                        content: state.content,
                        message: `Manual save: ${state.title}`,
                        branch: 'main'
                    });
                    
                    toast.success('✅ Saved to GitHub!');
                } else {
                    throw new Error('GitHub configuration incomplete');
                }
            } else {
                // No GitHub - save to localStorage only (also auto-saves to DynamoDB every 30s)
                localStorage.setItem('screenplay_draft', JSON.stringify({
                    content: state.content,
                    title: state.title,
                    author: state.author,
                    lastSaved: new Date().toISOString()
                }));
                
                toast.success('✅ Saved locally!');
            }
        } catch (error: any) {
            console.error('[EditorWorkspace] Manual save failed:', error);
            toast.error(`Save failed: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    
    // Calculate word count and duration (using accurate screenplay calculation)
    const displayContent = state.content; // Could strip tags if needed, but for now use raw content
    const lines = displayContent.split('\n').filter(l => l.trim().length > 0);
    const approximatePages = lines.length / 55; // Industry standard: ~55 lines per page
    const minutes = Math.round(approximatePages);
    const duration = minutes < 1 ? '<1 min' : minutes < 60 ? `~${minutes} min` : `~${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const wordCount = state.content.split(/\s+/).filter(Boolean).length;
    
    // Keyboard shortcut: Ctrl+S / Cmd+S to save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S / Cmd+S - Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleManualSave();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleManualSave]);
    
    // Listen for editor fullscreen toggle event
    useEffect(() => {
        const handleToggleEditorFullscreen = () => {
            setIsEditorFullscreen(!isEditorFullscreen);
        };
        
        window.addEventListener('toggleEditorFullscreen', handleToggleEditorFullscreen as EventListener);
        return () => window.removeEventListener('toggleEditorFullscreen', handleToggleEditorFullscreen as EventListener);
    }, [isEditorFullscreen, setIsEditorFullscreen]);
    
    // Handle scene navigation
    const handleSceneClick = (scene: Scene) => {
        if (scene.fountain?.startLine) {
            // Pass 'true' as second param to trigger programmatic navigation
            setCurrentLine(scene.fountain.startLine, true);
        }
    };
    
    // Handle sceneId from URL param - jump to scene when editor loads
    useEffect(() => {
        if (sceneIdFromUrl && screenplay.scenes && state.content) {
            const targetScene = screenplay.scenes.find(s => s.id === sceneIdFromUrl);
            if (targetScene && targetScene.fountain?.startLine) {
                console.log('[EditorWorkspace] Jumping to scene from URL:', {
                    sceneId: sceneIdFromUrl,
                    sceneName: targetScene.heading,
                    startLine: targetScene.fountain.startLine
                });
                // Use a small delay to ensure editor is fully initialized
                setTimeout(() => {
                    setCurrentLine(targetScene.fountain.startLine, true);
                    // Clear URL param after navigation
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('sceneId');
                    window.history.replaceState({}, '', newUrl.toString());
                }, 100);
            }
        }
    }, [sceneIdFromUrl, screenplay.scenes, state.content, setCurrentLine]);
    
    // Handle opening chat drawer with rewrite context
    const handleOpenChatWithContext = (
        selectedText: string, 
        initialPrompt?: string, 
        selectionRange?: { start: number; end: number }
    ) => {
        // Set selected text context in ChatContext
        setSelectedTextContext(selectedText, selectionRange || null);
        
        // Build rewrite prompt if no initial prompt provided
        const rewritePrompt = initialPrompt || `Rewrite this: "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`;
        
        // Set the prompt in the input field
        setInput(rewritePrompt);
        
        // Open drawer in chat mode (rewrite mode is automatically detected by UnifiedChatPanel)
        openDrawer('chat', { 
            mode: 'chat',
            selectedText,
            initialPrompt: rewritePrompt
        });
        
        // Auto-send the rewrite request after a short delay to ensure drawer is open
        setTimeout(() => {
            // The ChatModePanel will detect selectedTextContext and handle it
            // We'll trigger the send from UnifiedChatPanel when it detects the context
        }, 300);
    };
    
    // FAB Launch Handlers
    const handleLaunchScreenwriter = () => {
        // Open screenwriter modal instead of drawer
        setIsScreenwriterModalOpen(true);
    };
    
    // Handle screenwriter insertion (called from ScreenwriterModal)
    const handleScreenwriterInsert = (content: string) => {
        // Insert at cursor position using insertText
        insertText(content, state.cursorPosition);
        
        // Close modal
        setIsScreenwriterModalOpen(false);
    };
    
    // FAB Launch Handlers - Director
    const handleLaunchDirector = () => {
        // Open director modal instead of drawer
        setIsDirectorModalOpen(true);
    };
    
    // Handle director insertion (called from DirectorModal)
    const handleDirectorInsert = (content: string) => {
        // Insert at cursor position using insertText
        insertText(content, state.cursorPosition);
        
        // Close modal
        setIsDirectorModalOpen(false);
    };
    
    // FAB Launch Handlers - Dialogue
    const handleLaunchDialogue = () => {
        // Open dialogue modal instead of drawer
        setIsDialogueModalOpen(true);
    };
    
    // Handle dialogue insertion (called from DialogueModal)
    const handleDialogueInsert = (content: string) => {
        // Insert at cursor position using insertText
        insertText(content, state.cursorPosition);
        
        // Close modal
        setIsDialogueModalOpen(false);
    };
    
    // Legacy handler - removed since director mode no longer exists in chat window
    // Dialogue is now handled via DialogueModal (opened by handleLaunchDialogue)
    const handleLaunchDialogueLegacy = () => {
        // Fallback: open DialogueModal instead
        setIsDialogueModalOpen(true);
    };
    
    const handleLaunchRewrite = () => {
        // 🔥 CRITICAL: Only allow rewrite if text is actually selected (not just cursor position)
        if (!selectedText || !selectionRange) {
            toast.error('Please select text to rewrite');
            return;
        }
        
        // Check if selection has actual content (not just whitespace)
        const trimmedText = selectedText.trim();
        if (!trimmedText || trimmedText.length === 0) {
            toast.error('Please select text to rewrite');
            return;
        }
        
        // Check if selection range has meaningful length (not just cursor position)
        if (selectionRange.start === selectionRange.end) {
            toast.error('Please select text to rewrite');
            return;
        }
        
        // Open rewrite modal instead of drawer
        setIsRewriteModalOpen(true);
    };
    
    // Handle rewrite replacement (called from RewriteModal)
    const handleRewriteReplace = (rewrittenText: string) => {
        if (!selectionRange) return;
        
        console.log('[EditorWorkspace] 📝 handleRewriteReplace called - text length:', rewrittenText.length, 'endsWith newline:', rewrittenText.endsWith('\n'));
        
        // 🔥 CRITICAL: Don't trim the end - preserve any newline that was added
        // The modal already adds newline if needed, so preserve it
        let cleaned = rewrittenText.trimStart();
        
        console.log('[EditorWorkspace] 📝 After trimStart - length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
        
        // 🔥 SIMPLIFIED: The modal already handles all newline logic
        // We just preserve what the modal sends us - no additional newline logic needed
        // This prevents double newlines when highlighting portions of paragraphs
        console.log('[EditorWorkspace] ℹ️ Using text as-is from modal (newline already handled)');
        
        console.log('[EditorWorkspace] 📝 Final text before replaceSelection - length:', cleaned.length, 'endsWith newline:', cleaned.endsWith('\n'));
        console.log('[EditorWorkspace] 📝 Text preview (last 20 chars):', JSON.stringify(cleaned.slice(-20)));
        
        // Replace the selected text (newline will be preserved)
        replaceSelection(cleaned, selectionRange.start, selectionRange.end);
        
        console.log('[EditorWorkspace] ✅ replaceSelection called with newline preserved');
        
        // Close modal
        setIsRewriteModalOpen(false);
        
        // Show success toast (modal also shows one, but this ensures it)
        toast.success('Text rewritten successfully');
    };
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Handle undo/redo even when textarea is focused (prevent browser default)
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                // Ctrl/Cmd + Z = Undo
                if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                    undo();
                }
                return;
            }
            
            if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
                if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                    redo();
                }
                return;
            }
            
            // Don't intercept if user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                // Allow Ctrl+F in inputs/textareas (browser default)
                if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                    return; // Let browser handle it
                }
            }
            
            // Cmd/Ctrl + F = Find/Replace
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                setIsFindReplaceModalOpen(true);
            }
            // Cmd/Ctrl + E = Toggle scene navigator
            else if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                setIsSceneNavVisible(prev => !prev);
            }
            // Cmd/Ctrl + P = Export PDF
            else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setShowExportModal(true);
            }
            // Cmd/Ctrl + H = Version History
            else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
                e.preventDefault();
                setIsVersionHistoryModalOpen(true);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);
    
    return (
        <div className="h-screen flex flex-col bg-base-100">
            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Scene Navigator Sidebar - Hidden in editor fullscreen */}
                {isSceneNavVisible && !isEditorFullscreen && (
                    <div className="w-72 border-r border-[#3F3F46] flex-shrink-0 hidden lg:block">
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-white/10 bg-[#0A0A0A]">
                                <h2 className="text-sm font-semibold text-base-content flex items-center justify-between">
                                    <span>Scenes</span>
                                    <button
                                        onClick={() => setIsSceneNavVisible(false)}
                                        className="btn btn-ghost btn-xs"
                                        title="Hide scene navigator (Cmd+E)"
                                    >
                                        ✕
                                    </button>
                                </h2>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <SceneNavigator
                                    currentLine={state.currentLine}
                                    onSceneClick={handleSceneClick}
                                    className="h-full border-none rounded-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Editor Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <EditorToolbar 
                        className="border-b border-base-300"
                        onExportPDF={() => setShowExportModal(true)}
                        onOpenCollaboration={() => setShowCollaborationModal(true)}
                        onSave={handleManualSave}
                        isEditorFullscreen={isEditorFullscreen}
                        onToggleEditorFullscreen={() => setIsEditorFullscreen(!isEditorFullscreen)}
                        onOpenFindReplace={() => setIsFindReplaceModalOpen(true)}
                        onToggleItalics={() => {
                            // Trigger Ctrl+I programmatically
                            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                            if (textarea) {
                                const event = new KeyboardEvent('keydown', {
                                    key: 'i',
                                    ctrlKey: true,
                                    bubbles: true,
                                    cancelable: true
                                });
                                textarea.dispatchEvent(event);
                            }
                        }}
                        onOpenVersionHistory={() => setIsVersionHistoryModalOpen(true)}
                    />
                    
                    {/* Word Count & Duration - Below Toolbar */}
                    <EditorHeader
                        currentLine={state.currentLine}
                        isDirty={state.isDirty}
                        wordCount={wordCount}
                        duration={duration}
                    />
                    
                    {/* Editor */}
                    <div className="flex-1 overflow-hidden">
                        <FountainEditor
                            className="h-full w-full"
                            placeholder="Start writing your screenplay...

Tip: 
- Press Tab to format as CHARACTER
- Press Shift+Tab to format as SCENE HEADING
- Press Enter for smart line breaks
- Type @ to mention characters or locations
- Select text and tap FAB button for 'Rewrite with AI'"
                            onOpenChatWithContext={handleOpenChatWithContext}
                            onSelectionStateChange={handleSelectionStateChange}
                        />
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <EditorFooter />
            
            {/* PDF Export Modal */}
            {showExportModal && (
                <ExportPDFModal
                    screenplay={state.content}
                    onClose={() => setShowExportModal(false)}
                />
            )}
            
            {/* GitHub & Collaboration Modal */}
            {showCollaborationModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold">GitHub & Collaboration Settings</h2>
                            <button
                                onClick={() => setShowCollaborationModal(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* GitHub Connection Status */}
                            <div className="card bg-base-200 border border-base-300">
                                <div className="card-body">
                                    <h3 className="card-title text-lg">GitHub Export (Optional)</h3>
                                    {githubConfig ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-success">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>GitHub Configured</span>
                                            </div>
                                            <div className="text-sm text-base-content/60 space-y-1">
                                                <p><strong>Repository:</strong> {githubConfig.repo || 'Unknown'}</p>
                                                <p><strong>Owner:</strong> {githubConfig.owner || 'Unknown'}</p>
                                                <p className="text-xs text-info">Use "Export to GitHub" button in toolbar to sync</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    localStorage.removeItem('screenplay_github_config');
                                                    setGithubConfig(null);
                                                }}
                                                className="btn btn-error btn-sm"
                                            >
                                                Remove GitHub Connection
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm text-base-content/60">
                                                GitHub export is optional. Your screenplay auto-saves to secure cloud storage every 30 seconds.
                                            </p>
                                            <p className="text-xs text-base-content/40">
                                                Connect GitHub for version control and backup exports using the "Export to GitHub" button in the toolbar.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Collaboration Management */}
                            {screenplayId && screenplayId.startsWith('screenplay_') && (
                                <CollaborationPanel
                                    projectId={screenplayId}
                                    isOwner={true}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Show scene navigator button when hidden */}
            {!isSceneNavVisible && (
                <button
                    onClick={() => setIsSceneNavVisible(true)}
                    className="btn btn-primary btn-sm fixed bottom-20 left-4 z-10 shadow-lg hidden lg:flex"
                    title="Show scene navigator (Cmd+E)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Scenes</span>
                </button>
            )}
            
            {/* FAB Group - Mobile & Desktop */}
            <AgentFABGroup
                onLaunchScreenwriter={handleLaunchScreenwriter}
                onLaunchDirector={handleLaunchDirector}
                onLaunchDialogue={handleLaunchDialogue}
                onLaunchRewrite={handleLaunchRewrite}
                hasSelection={hasSelection}
                selectedText={selectedText}
                isDrawerOpen={isDrawerOpen}
                isMobile={isMobile}
            />
            
            {/* Rewrite Modal */}
            <RewriteModal
                isOpen={isRewriteModalOpen}
                onClose={() => setIsRewriteModalOpen(false)}
                selectedText={selectedText || ''}
                selectionRange={selectionRange || { start: 0, end: 0 }}
                editorContent={state.content}
                onReplace={handleRewriteReplace}
            />
            
            {/* Screenwriter Modal */}
            <ScreenwriterModal
                isOpen={isScreenwriterModalOpen}
                onClose={() => setIsScreenwriterModalOpen(false)}
                editorContent={state.content}
                cursorPosition={state.cursorPosition || 0}
                selectionRange={selectionRange}
                onInsert={handleScreenwriterInsert}
            />
            
            {/* Director Modal */}
            <DirectorModal
                isOpen={isDirectorModalOpen}
                onClose={() => setIsDirectorModalOpen(false)}
                editorContent={state.content}
                cursorPosition={state.cursorPosition || 0}
                selectionRange={selectionRange}
                onInsert={handleDirectorInsert}
            />
            
            {/* Dialogue Modal */}
            <DialogueModal
                isOpen={isDialogueModalOpen}
                onClose={() => setIsDialogueModalOpen(false)}
                editorContent={state.content}
                cursorPosition={state.cursorPosition || 0}
                selectionRange={selectionRange}
                onInsert={handleDialogueInsert}
            />
            
            {/* Find/Replace Modal */}
            <FindReplaceModal
                isOpen={isFindReplaceModalOpen}
                onClose={() => setIsFindReplaceModalOpen(false)}
            />
            
            {/* Version History Modal */}
            <VersionHistoryModal
                isOpen={isVersionHistoryModalOpen}
                onClose={() => setIsVersionHistoryModalOpen(false)}
            />
            
        </div>
    );
}

