'use client';

import React from 'react';
import { Wand2, Scissors, Copy, Clipboard, Film } from 'lucide-react';

export interface RewriteSuggestion {
    id: string;
    label: string;
    prompt: string;
    icon?: React.ReactNode;
    category: 'tone' | 'length' | 'style' | 'custom';
}

interface SelectionContextMenuProps {
    selectedText: string;
    position: { x: number; y: number };
    onOpenChat: (initialPrompt?: string) => void;
    onSelectSuggestion: (suggestion: RewriteSuggestion) => void;
    onOpenSceneVisualizer?: (selectedText: string) => void;
    onClose: () => void;
    suggestions?: RewriteSuggestion[];
}

/**
 * SelectionContextMenu - Right-click/long-press menu for selected text
 * Theme-aware styling with DaisyUI classes
 */
export default function SelectionContextMenu({
    selectedText,
    position,
    onOpenChat,
    onOpenSceneVisualizer,
    onClose
}: SelectionContextMenuProps) {
    
    // Prevent menu from going off-screen
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 280),
        y: Math.min(position.y, window.innerHeight - 400)
    };

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: Math.max(10, adjustedPosition.y),
        left: Math.max(10, adjustedPosition.x),
        zIndex: 1000,
        maxWidth: '300px',
        minWidth: '260px'
    };

    const handleClick = () => {
        onOpenChat();
        onClose();
    };

    const handleSceneVisualizer = () => {
        if (onOpenSceneVisualizer) {
            onOpenSceneVisualizer(selectedText);
        }
        onClose();
    };

    const handleCut = async () => {
        try {
            await navigator.clipboard.writeText(selectedText);
            document.execCommand('cut');
            onClose();
        } catch (err) {
            console.error('Failed to cut:', err);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(selectedText);
            onClose();
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            document.execCommand('insertText', false, text);
            onClose();
        } catch (err) {
            console.error('Failed to paste:', err);
        }
    };

    return (
        <>
            {/* Backdrop to close menu */}
            <div 
                className="fixed inset-0 z-[999] bg-black/30"
                onClick={onClose}
            />
            
            {/* Context Menu */}
            <div 
                className="rounded-xl border-2 border-primary shadow-2xl overflow-hidden bg-base-100"
                style={{
                    ...menuStyle,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(220, 20, 60, 0.3)'
                }}
            >
                {/* AI Rewrite Button */}
                <button
                    onClick={handleClick}
                    className="w-full px-5 py-4 flex items-center gap-3 transition-all text-left group border-b border-base-300 hover:bg-primary hover:scale-[1.02]"
                >
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 transition-all shadow-lg">
                        <Wand2 className="w-6 h-6 text-primary-content" />
                    </div>
                    <div className="flex-1">
                        <div className="text-base font-bold mb-1 text-base-content group-hover:text-primary-content">
                            ✨ Rewrite with AI
                        </div>
                        <div className="text-xs leading-relaxed text-base-content/60 group-hover:text-primary-content/80">
                            {selectedText.length > 45 
                                ? `"${selectedText.substring(0, 45)}..."` 
                                : `"${selectedText}"`}
                        </div>
                    </div>
                </button>

                {/* Scene Visualizer Button */}
                {onOpenSceneVisualizer && (
                    <button
                        onClick={handleSceneVisualizer}
                        className="w-full px-5 py-4 flex items-center gap-3 transition-all text-left group border-b border-base-300 hover:bg-secondary hover:scale-[1.02]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 transition-all shadow-lg">
                            <Film className="w-6 h-6 text-secondary-content" />
                        </div>
                        <div className="flex-1">
                            <div className="text-base font-bold mb-1 text-base-content group-hover:text-secondary-content">
                                🎬 Generate Scene Video
                            </div>
                            <div className="text-xs leading-relaxed text-base-content/60 group-hover:text-secondary-content/80">
                                Create video from selected scene
                            </div>
                        </div>
                    </button>
                )}

                {/* Standard Clipboard Operations */}
                <div className="grid grid-cols-3 gap-0 border-b border-base-300">
                    {/* Cut */}
                    <button
                        onClick={handleCut}
                        className="px-4 py-3 flex flex-col items-center gap-2 transition-all border-r border-base-300 hover:bg-base-200 text-base-content/60 hover:text-base-content"
                    >
                        <Scissors className="w-5 h-5" />
                        <span className="text-xs font-medium">Cut</span>
                    </button>

                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        className="px-4 py-3 flex flex-col items-center gap-2 transition-all border-r border-base-300 hover:bg-base-200 text-base-content/60 hover:text-base-content"
                    >
                        <Copy className="w-5 h-5" />
                        <span className="text-xs font-medium">Copy</span>
                    </button>

                    {/* Paste */}
                    <button
                        onClick={handlePaste}
                        className="px-4 py-3 flex flex-col items-center gap-2 transition-all hover:bg-base-200 text-base-content/60 hover:text-base-content"
                    >
                        <Clipboard className="w-5 h-5" />
                        <span className="text-xs font-medium">Paste</span>
                    </button>
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 text-xs text-center bg-base-200 text-base-content/50">
                    Standard clipboard or AI-powered rewrite
                </div>
            </div>
        </>
    );
}

