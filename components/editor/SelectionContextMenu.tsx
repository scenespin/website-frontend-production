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
    // Menu height is approximately 350px
    const menuHeight = 350;
    const menuWidth = 280;
    
    // Calculate if menu should appear above or below the cursor
    const spaceBelow = window.innerHeight - position.y;
    const spaceAbove = position.y;
    const showBelow = spaceBelow >= menuHeight || spaceBelow > spaceAbove;
    
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - menuWidth),
        y: showBelow 
            ? Math.min(position.y + 20, window.innerHeight - menuHeight - 10) // Show below with offset
            : Math.max(position.y - menuHeight - 20, 10) // Show above with offset
    };

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: adjustedPosition.y,
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
                className="fixed inset-0 z-[999] bg-transparent"
                onClick={onClose}
            />
            
            {/* Context Menu - Standard browser style */}
            <div 
                className="bg-base-200 border border-base-300 rounded shadow-lg py-1 min-w-[180px]"
                style={menuStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Standard Clipboard Operations - Browser style */}
                <button
                    onClick={handleCut}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-base-300 text-base-content flex items-center gap-2"
                >
                    <Scissors className="w-4 h-4" />
                    Cut
                </button>

                <button
                    onClick={handleCopy}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-base-300 text-base-content flex items-center gap-2"
                >
                    <Copy className="w-4 h-4" />
                    Copy
                </button>

                <button
                    onClick={handlePaste}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-base-300 text-base-content flex items-center gap-2"
                >
                    <Clipboard className="w-4 h-4" />
                    Paste
                </button>

                {/* Divider */}
                <div className="border-t border-base-300 my-1"></div>

                {/* AI Rewrite - Simple text style */}
                <button
                    onClick={handleClick}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-primary/20 text-primary flex items-center gap-2"
                >
                    <Wand2 className="w-4 h-4" />
                    Rewrite with AI
                </button>

                {/* Scene Visualizer */}
                {onOpenSceneVisualizer && (
                    <>
                        <div className="border-t border-base-300 my-1"></div>
                        <button
                            onClick={handleSceneVisualizer}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-base-300 text-base-content flex items-center gap-2"
                        >
                            <Film className="w-4 h-4" />
                            Generate Scene Video
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

