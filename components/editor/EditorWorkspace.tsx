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
    const [isSceneNavVisible, setIsSceneNavVisible] = useState(true);
    
    // Calculate word count
    const wordCount = state.content.split(/\s+/).filter(Boolean).length;
    
    // Calculate duration (1 page ≈ 1 minute of screen time, roughly 250 words per page)
    const duration = `${Math.ceil(wordCount / 250)} min`;
    
    // Handle scene navigation
    const handleSceneClick = (scene: Scene) => {
        if (scene.fountain?.startLine) {
            setCurrentLine(scene.fountain.startLine);
            // Scroll to the scene in the editor
            // This would require a ref to the editor textarea
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

