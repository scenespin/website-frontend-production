/**
 * UnifiedChatPanel - REFACTORED & MODULAR
 * 
 * This is the main orchestrator that:
 * - Manages ChatContext for shared state
 * - Routes between mode-specific panels
 * - Keeps the core shell clean and simple (~300 lines!)
 * 
 * All complex logic has been extracted to:
 * - Custom hooks (useQuickVideo, useImageGeneration, useDialogueMode, useChatMode, useDirectorMode)
 * - Mode panels (ChatModePanel, DirectorModePanel, ImageModePanel, etc.)
 * - Shared utilities (prompt builders, context extractors)
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { ChatProvider } from './ChatContext';
import { useChatContext } from './ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { ChatModePanel } from './modes/ChatMode/ChatModePanel';
import { DirectorModePanel } from './modes/DirectorMode/DirectorModePanel';
import { ImageModePanel } from './modes/ImageMode/ImageModePanel';
import { VideoModePanel } from './modes/VideoMode/VideoModePanel';
import { SceneVisualizerModePanel } from './modes/SceneVisualizerMode/SceneVisualizerModePanel';
import { DialogueModePanel } from './modes/DialogueMode/DialogueModePanel';
import type { UnifiedChatPanelProps } from './shared/types';

// ============================================================================
// INTERNAL PANEL COMPONENT
// ============================================================================

function UnifiedChatPanelInner({
    onInsert,
    externalImageModelTrigger,
    onImageModelActivated,
    selectedTextContext,
    initialPrompt,
    initialMode,
    imageEntityContext,
    onClearContext,
    sceneContext,
    editorContent,
    cursorPosition,
    onWorkflowComplete
}: UnifiedChatPanelProps) {
    const { state, setMode, setInput, setSelectedTextContext, setEntityContextBanner, addMessage } = useChatContext();
    const { startWorkflow } = useChatMode();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // ============================================================================
    // INITIALIZATION EFFECTS
    // ============================================================================
    
    // Handle external image model trigger (from sidebars)
    useEffect(() => {
        if (externalImageModelTrigger) {
            setMode('image');
            
            // Set entity context banner if provided
            if (imageEntityContext) {
                setEntityContextBanner(imageEntityContext);
                
                // Handle AI interview workflow
                if (imageEntityContext.workflow === 'interview') {
                    console.log('[UnifiedChatPanel] Starting AI interview for:', imageEntityContext.type);
                    setMode('chat'); // AI interviews happen in chat mode
                    
                    // Start the workflow!
                    startWorkflow(imageEntityContext.type as 'character' | 'location' | 'scene');
                }
            }
            
            // Notify parent that activation is complete
            onImageModelActivated?.();
        }
    }, [externalImageModelTrigger, imageEntityContext, onImageModelActivated, setMode, setEntityContextBanner, startWorkflow]);
    
    // Handle initial mode (e.g., from right-click Scene Visualizer)
    useEffect(() => {
        if (initialMode) {
            setMode(initialMode);
        }
    }, [initialMode, setMode]);
    
    // Handle initial prompt from external source (e.g., right-click menu)
    useEffect(() => {
        if (initialPrompt) {
            console.log('[UnifiedChatPanel] Setting initial prompt, length:', initialPrompt.length);
            setInput(initialPrompt);
            // Auto-scroll to input
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }, 100);
        }
    }, [initialPrompt, setInput]);
    
    // Handle selected text context (rewrite workflow)
    useEffect(() => {
        if (selectedTextContext) {
            setSelectedTextContext(selectedTextContext, null);
            if (state.activeMode !== 'chat' && !initialMode) {
                console.log('[UnifiedChatPanel] Switching to chat mode for rewrite workflow');
                setMode('chat');
            }
        }
    }, [selectedTextContext, state.activeMode, initialMode, setMode, setSelectedTextContext]);
    
    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, [state.messages, state.streamingText]);
    
    // ============================================================================
    // MODE RENDERING
    // ============================================================================
    
    /**
     * Render the active mode panel
     */
    const renderModePanel = () => {
        const commonProps = {
            onInsert,
            editorContent,
            cursorPosition
        };
        
        switch (state.activeMode) {
            case 'chat':
                return (
                    <ChatModePanel
                        {...commonProps}
                        selectedTextContext={selectedTextContext || null}
                        sceneContext={sceneContext || null}
                        onClearContext={onClearContext}
                        onWorkflowComplete={onWorkflowComplete}
                    />
                );
            
            case 'director':
                return <DirectorModePanel {...commonProps} />;
            
            case 'image':
                return (
                    <ImageModePanel
                        {...commonProps}
                        imageEntityContext={imageEntityContext || undefined}
                    />
                );
            
            case 'quick-video':
                return <VideoModePanel {...commonProps} />;
            
            case 'scene-visualizer':
                return (
                    <SceneVisualizerModePanel
                        {...commonProps}
                        initialPrompt={initialPrompt || undefined}
                    />
                );
            
            case 'dialogue':
                return <DialogueModePanel {...commonProps} />;
            
            default:
                return <ChatModePanel {...commonProps} />;
        }
    };
    
    // ============================================================================
    // MESSAGE HANDLING
    // ============================================================================
    
    /**
     * Handle sending a message
     */
    const handleSend = async (message: string) => {
        if (!message.trim() || state.isStreaming) return;
        
        // Add user message
        addMessage({
            role: 'user',
            content: message,
            mode: state.activeMode
        });
        
        // Clear input
        setInput('');
        
        // TODO: Implement actual API call based on active mode
        // For now, just show a placeholder response
        setTimeout(() => {
            addMessage({
                role: 'assistant',
                content: 'Chat integration in progress. This will connect to the AI agent API.',
                mode: state.activeMode
            });
        }, 500);
    };
    
    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            {/* Mode Panel (renders based on active mode) */}
            {renderModePanel()}
            
            {/* Anchor for auto-scrolling */}
            <div ref={messagesEndRef} />
            
            {/* Chat Input */}
            <div 
                className="flex-shrink-0 px-4 py-3 border-t"
                style={{
                    borderColor: 'var(--color-border-primary)',
                    backgroundColor: 'var(--color-bg-primary)'
                }}
            >
                <div className="flex gap-2">
                    <textarea
                        value={state.input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(state.input);
                            }
                        }}
                        placeholder={state.inputPlaceholder}
                        disabled={state.isStreaming}
                        className="flex-1 px-3 py-2 rounded-lg resize-none"
                        style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-primary)',
                            minHeight: '44px',
                            maxHeight: '120px'
                        }}
                        rows={1}
                    />
                    <button
                        onClick={() => handleSend(state.input)}
                        disabled={!state.input.trim() || state.isStreaming}
                        className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: 'var(--color-brand-teal)',
                            color: 'white'
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN EXPORT WITH CONTEXT PROVIDER
// ============================================================================

export default function UnifiedChatPanel(props: UnifiedChatPanelProps) {
    return (
        <ChatProvider>
            <UnifiedChatPanelInner {...props} />
        </ChatProvider>
    );
}

