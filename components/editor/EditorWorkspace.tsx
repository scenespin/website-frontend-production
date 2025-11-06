'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useDrawer } from '@/contexts/DrawerContext';
import FountainEditor from './FountainEditor';
import EditorHeader from './EditorHeader';
import EditorFooter from './EditorFooter';
import EditorToolbar from './EditorToolbar';
import SceneNavigator from './SceneNavigator';
import { ExportPDFModal } from '../screenplay/ExportPDFModal';
import { CollaborationPanel } from '../CollaborationPanel';
import { saveToGitHub } from '@/utils/github';
import { toast } from 'sonner';
import type { Scene } from '../../types/screenplay';

/**
 * EditorWorkspace - Complete screenplay editor with all features
 * Responsive layout with scene navigator and toolbar
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorWorkspace() {
    const router = useRouter();
    const { state, setContent, setCurrentLine } = useEditor();
    const screenplay = useScreenplay();
    const { isDrawerOpen } = useDrawer();
    const [showExportModal, setShowExportModal] = useState(false);
    const [showCollaborationModal, setShowCollaborationModal] = useState(false);
    const [isSceneNavVisible, setIsSceneNavVisible] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Get projectId from URL params (for collaboration)
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const projectId = searchParams?.get('project') || 'default';
    
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
    }, [screenplay.isConnected]);
    
    /**
     * Manual Save Handler
     * Saves to GitHub if connected, otherwise saves to localStorage
     */
    const handleManualSave = async () => {
        if (isSaving) return;
        
        setIsSaving(true);
        try {
            // Check if GitHub is connected
            const githubConfigStr = localStorage.getItem('screenplay_github_config');
            
            if (githubConfigStr && screenplay.isConnected) {
                const githubConfig = JSON.parse(githubConfigStr);
                
                if (githubConfig.token && githubConfig.owner && githubConfig.repo) {
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
                // No GitHub - save to localStorage only
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
- Type @ to mention characters or locations"
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
                                    <h3 className="card-title text-lg">GitHub Repository</h3>
                                    {screenplay.isConnected ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-success">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Connected to GitHub</span>
                                            </div>
                                            <div className="text-sm text-base-content/60 space-y-1">
                                                <p><strong>Repository:</strong> {githubConfig?.repo || 'Unknown'}</p>
                                                <p><strong>Owner:</strong> {githubConfig?.owner || 'Unknown'}</p>
                                                <p className="text-xs text-success">✓ Auto-syncing every 30 seconds</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    screenplay.disconnect();
                                                    setGithubConfig(null);
                                                }}
                                                className="btn btn-error btn-sm"
                                            >
                                                Disconnect GitHub
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-sm text-base-content/60">
                                                Connect your screenplay to a GitHub repository for version control and collaboration.
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    // This would open GitHub connect flow
                                                    const token = prompt('Enter your GitHub Personal Access Token:');
                                                    const owner = prompt('Enter repository owner (username):');
                                                    const repo = prompt('Enter repository name:');
                                                    if (token && owner && repo) {
                                                        screenplay.connect(token, owner, repo);
                                                        setGithubConfig({ token, owner, repo });
                                                    }
                                                }}
                                                className="btn btn-primary"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                </svg>
                                                Connect GitHub
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Collaboration Management */}
                            {projectId && projectId !== 'default' && (
                                <CollaborationPanel 
                                    projectId={projectId}
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
        </div>
    );
}

