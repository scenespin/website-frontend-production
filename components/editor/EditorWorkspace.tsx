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
    const { state, setContent, setCurrentLine, replaceSelection } = useEditor();
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
    
    // Calculate word count
    const wordCount = state.content.split(/\s+/).filter(Boolean).length;
    
    // Calculate duration (1 page ≈ 1 minute of screen time, roughly 250 words per page)
    const duration = `${Math.ceil(wordCount / 250)} min`;
    
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
        const cursorPos = state.cursorPosition || 0;
        const context = extractEditorContext(state.content, cursorPos);
        
        // Set scene context
        if (context.sceneContext) {
            setSceneContext(context.sceneContext);
        }
        
        // Clear selected text context (not needed for screenwriter)
        setSelectedTextContext(null, null);
        setInput('');
        
        // Open drawer in chat mode
        openDrawer('chat', {
            mode: 'chat',
            initialPrompt: null // Show instruction message
        });
    };
    
    const handleLaunchDialogue = () => {
        const cursorPos = state.cursorPosition || 0;
        const context = extractEditorContext(state.content, cursorPos);
        
        // Set scene context
        if (context.sceneContext) {
            setSceneContext(context.sceneContext);
        }
        
        // Clear selected text context (not needed for director/dialogue)
        setSelectedTextContext(null, null);
        setInput('');
        
        // Open drawer in director mode (director handles dialogue & scene generation)
        openDrawer('director', {
            mode: 'director',
            initialPrompt: null // Show instruction message
        });
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
        
        // Clean the text (should already be cleaned by modal, but double-check)
        // Don't trim end - we'll add newline if needed
        let cleaned = rewrittenText.trimStart();
        
        // Smart newline detection: Add newlines when rewrite generates more content than original
        if (selectedText) {
            const originalLength = selectedText.length;
            const originalWasSingleLine = !selectedText.includes('\n');
            const rewriteIsMultiLine = cleaned.includes('\n');
            const rewriteLength = cleaned.length;
            const textAfter = state.content.substring(selectionRange.end);
            const hasTextAfter = textAfter.trim().length > 0;
            const textAfterStartsWithNewline = textAfter.startsWith('\n') || textAfter.startsWith('\r\n');
            
            // Determine if we need a newline at the end
            let needsNewlineAtEnd = false;
            
            // Case 1: Original was single line, rewrite is multi-line, and there's text after without newline
            if (originalWasSingleLine && rewriteIsMultiLine && hasTextAfter && !textAfterStartsWithNewline) {
                needsNewlineAtEnd = true;
            }
            
            // Case 2: Rewrite is longer than original (even if still single line)
            // If rewrite is longer, it likely needs a newline after it to separate from following content
            // Lower threshold: if rewrite is 20% longer than original, add newline
            const lengthIncrease = rewriteLength / originalLength;
            if (lengthIncrease > 1.2 && hasTextAfter && !textAfterStartsWithNewline) {
                needsNewlineAtEnd = true;
            }
            
            // Add newline at end if needed (ensure it's not already there)
            if (needsNewlineAtEnd && !cleaned.endsWith('\n') && !cleaned.endsWith('\r\n')) {
                cleaned = cleaned + '\n';
            }
            
            // Case 3: If rewrite contains multiple lines and original was single line,
            // ensure proper spacing before the rewrite (if there's text before)
            const textBefore = state.content.substring(0, selectionRange.start);
            const hasTextBefore = textBefore.trim().length > 0;
            const textBeforeEndsWithNewline = textBefore.endsWith('\n') || textBefore.endsWith('\r\n');
            
            if (originalWasSingleLine && rewriteIsMultiLine && hasTextBefore && !textBeforeEndsWithNewline) {
                // Add a newline before the rewritten text to separate it from preceding content
                cleaned = '\n' + cleaned;
            }
        }
        
        // Replace the selected text
        replaceSelection(cleaned, selectionRange.start, selectionRange.end);
        
        // Close modal
        setIsRewriteModalOpen(false);
        
        // Show success toast (modal also shows one, but this ensures it)
        toast.success('Text rewritten successfully');
    };
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + E = Toggle scene navigator
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                setIsSceneNavVisible(prev => !prev);
            }
            // Cmd/Ctrl + P = Export PDF
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setShowExportModal(true);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    return (
        <div className="h-screen flex flex-col bg-base-100">
            {/* Header */}
            <EditorHeader
                currentLine={state.currentLine}
                isDirty={state.isDirty}
                wordCount={wordCount}
                duration={duration}
            />
            
            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Scene Navigator Sidebar */}
                {isSceneNavVisible && (
                    <div className="w-72 border-r border-base-300 flex-shrink-0 hidden lg:block">
                        <div className="h-full flex flex-col">
                            <div className="p-3 border-b border-base-300 bg-base-200">
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
        </div>
    );
}

