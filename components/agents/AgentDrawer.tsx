'use client';

import React, { useState, useRef, useEffect } from 'react';
import UnifiedChatPanel from '../UnifiedChatPanel';
import { Z_INDEX } from '@/config/z-index';
import type { AgentMode, SceneContext } from '../shared/types';

interface AgentDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onOpen?: () => void;
    onInsertText?: (text: string) => void;
    halfHeight?: boolean; // NEW: For timeline image generation (show timeline behind)
    // NEW: Quick launch trigger from FABs
    launchTrigger?: {
        mode: AgentMode;
        selectedText?: string;
        initialPrompt?: string;
        sceneContext?: SceneContext;
    } | null;
}

export default function AgentDrawer({ isOpen, onClose, onOpen, onInsertText, halfHeight = false, launchTrigger }: AgentDrawerProps) {
    const [height, setHeight] = useState(500); // Default height in pixels
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);
    
    // Calculate target height based on mode
    const targetHeight = halfHeight ? Math.min(400, window.innerHeight * 0.5) : height;
    
    // Always render - just change height based on isOpen
    const currentHeight = isOpen ? targetHeight : 70; // 70px collapsed, variable when open
    
    // Handle drag/swipe gestures
    useEffect(() => {
        if (!isDragging) return;
        
        const handleMove = (clientY: number) => {
            const deltaY = dragStartY.current - clientY;
            const newHeight = Math.max(300, Math.min(800, dragStartHeight.current + deltaY));
            
            // If swiping down significantly, close the drawer
            if (deltaY < -100 && clientY > dragStartY.current) {
                onClose();
                setIsDragging(false);
                return;
            }
            
            // Don't resize in half-height mode
            if (!halfHeight) {
                setHeight(newHeight);
            }
        };
        
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            handleMove(e.clientY);
        };
        
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientY);
        };
        
        const handleEnd = () => {
            setIsDragging(false);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, halfHeight, onClose]);
    
    return (
        <>
            {/* Backdrop overlay when drawer is open */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 transition-opacity duration-300"
                    style={{ zIndex: 59 }}
                    onClick={onClose}
                />
            )}
            
            <div 
                className="fixed bottom-0 left-0 right-0 border-t border-white/10 shadow-2xl transition-all duration-300 ease-in-out bg-[#141414] rounded-t-2xl"
                style={{ 
                    height: `${currentHeight}px`,
                    zIndex: 60,
                }}
            >
            {/* Resize Handle - only show when open and not in half-height mode */}
            {isOpen && !halfHeight && (
                <div 
                    className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-[#00D9FF] transition-colors bg-[#DC143C]/50 rounded-t-2xl"
                    onMouseDown={(e) => {
                        setIsDragging(true);
                        dragStartY.current = e.clientY;
                        dragStartHeight.current = height;
                    }}
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        setIsDragging(true);
                        dragStartY.current = touch.clientY;
                        dragStartHeight.current = height;
                    }}
                />
            )}
            
            {/* Swipe Down Indicator - only show when open */}
            {isOpen && (
                <div 
                    className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full cursor-pointer hover:bg-white/40 transition-colors"
                    onClick={onClose}
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        setIsDragging(true);
                        dragStartY.current = touch.clientY;
                        dragStartHeight.current = currentHeight;
                    }}
                />
            )}
            
            {/* Header */}
            <div className="relative px-4 py-3 border-b border-white/10 bg-[#1F1F1F] rounded-t-2xl">
                {!isOpen ? (
                    // Collapsed state - clickable header
                    <button 
                        onClick={onOpen}
                        className="flex items-center gap-3 text-sm text-base-content hover:text-[#00D9FF] w-full transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DC143C] to-[#8B0000] flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-[#DC143C]/50 group-hover:scale-105 transition-all">
                            <svg className="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-sm">AI Assistant</span>
                            <span className="text-xs text-[#B3B3B3]">Tap to open</span>
                        </div>
                        <svg className="w-4 h-4 text-[#808080] ml-auto group-hover:text-[#00D9FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                ) : (
                    // Expanded state - header with close button
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DC143C] to-[#8B0000] flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm text-base-content">AI Assistant</span>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-white/5 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Close"
                            type="button"
                        >
                            <svg className="w-5 h-5 text-[#B3B3B3] hover:text-base-content" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Agent Content - only show when open */}
            {isOpen && (
                <div 
                    className="bg-[#0A0A0A] overflow-hidden"
                    style={{
                        height: `${currentHeight - 63}px` // Subtract header height
                    }}
                >
                    <UnifiedChatPanel 
                        onInsert={onInsertText}
                        initialMode={launchTrigger?.mode}
                        selectedTextContext={launchTrigger?.selectedText || null}
                        initialPrompt={launchTrigger?.initialPrompt || null}
                        sceneContext={launchTrigger?.sceneContext || null}
                    />
                </div>
            )}
        </div>
        </>
    );
}
