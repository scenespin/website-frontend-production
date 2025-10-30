'use client';

import React, { useRef, useEffect } from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { ChatModePanel } from './modes/ChatModePanel';
import { DirectorModePanel } from './modes/DirectorModePanel';
import { ImageModePanel } from './modes/ImageModePanel';
import { VideoModePanel } from './modes/VideoModePanel';
import { SceneVisualizerModePanel } from './modes/SceneVisualizerModePanel';
import { TryOnModePanel } from './modes/TryOnModePanel';
import { AudioModePanel } from './modes/AudioModePanel';
import { Send, Loader2, Image as ImageIcon, Film, Music, MessageSquare, Clapperboard, Zap, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDrawer } from '@/contexts/DrawerContext';

// Mode configurations (in display order)
const MODE_CONFIG = {
  image: { icon: ImageIcon, label: 'Image', color: 'text-purple-500' },
  'quick-video': { icon: Film, label: 'Video', color: 'text-blue-500' },
  audio: { icon: Music, label: 'Audio', color: 'text-green-500' },
  'try-on': { icon: Users, label: 'Try-On', color: 'text-pink-500' },
  chat: { icon: MessageSquare, label: 'Chat', color: 'text-cinema-red' },
  director: { icon: Clapperboard, label: 'Director', color: 'text-cinema-gold' },
  workflows: { icon: Zap, label: 'Workflows', color: 'text-orange-500' },
};

// Mode order for selector
const MODE_ORDER = ['image', 'quick-video', 'audio', 'try-on', 'chat', 'director', 'workflows'];

// ============================================================================
// MODE SELECTOR COMPONENT
// ============================================================================

function ModeSelector() {
  const { state, setMode } = useChatContext();
  
  return (
    <div className="dropdown dropdown-top">
      <label tabIndex={0} className="btn btn-sm btn-ghost">
        {React.createElement(MODE_CONFIG[state.activeMode]?.icon || MessageSquare, { className: 'w-4 h-4' })}
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-52 mb-2 border border-base-300">
        {MODE_ORDER.map((mode) => {
          const config = MODE_CONFIG[mode];
          const Icon = config.icon;
          return (
            <li key={mode}>
              <button
                onClick={() => setMode(mode)}
                className={`flex items-center gap-2 ${state.activeMode === mode ? 'active' : ''}`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span>{config.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
}) {
  const { state, setMode, setInput, setSelectedTextContext, setEntityContextBanner, addMessage, closeMenus } = useChatContext();
  const { startWorkflow } = useChatMode();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { closeDrawer } = useDrawer();

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
          startWorkflow(imageEntityContext.type);
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
      cursorPosition,
      onWorkflowComplete: (type, parsedData) => {
        onWorkflowComplete?.(type, parsedData);
        closeDrawer(); // Close drawer after workflow completion
      }
    };

    switch (state.activeMode) {
      case 'image':
        return (
          <ImageModePanel
            {...commonProps}
            imageEntityContext={imageEntityContext || undefined}
          />
        );

      case 'quick-video':
        return <VideoModePanel {...commonProps} />;

      case 'audio':
        return <AudioModePanel {...commonProps} />;

      case 'try-on':
        return <TryOnModePanel {...commonProps} />;

      case 'chat':
        return (
          <ChatModePanel
            {...commonProps}
            selectedTextContext={selectedTextContext || null}
            sceneContext={sceneContext || null}
            onClearContext={onClearContext}
          />
        );

      case 'director':
        return <DirectorModePanel {...commonProps} />;

      case 'workflows':
        return (
          <SceneVisualizerModePanel
            {...commonProps}
            initialPrompt={initialPrompt || undefined}
          />
        );

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
  const handleSend = async (message) => {
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
    <div className="flex flex-col h-full bg-base-100" onClick={closeMenus}>
      {/* Mode Panel (renders based on active mode) */}
      {renderModePanel()}

      {/* Anchor for auto-scrolling */}
      <div ref={messagesEndRef} />

      {/* Chat Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-base-300 bg-base-100">
        <div className="flex gap-2 items-end">
          <ModeSelector />
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
            className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-base-300 text-base-content border border-base-content/20 focus:border-cinema-red rounded-lg px-3 py-2 text-sm"
            rows={1}
          />
          <button
            onClick={() => handleSend(state.input)}
            disabled={!state.input.trim() || state.isStreaming}
            className="btn btn-primary h-[44px] w-[44px] p-0 flex-shrink-0 bg-cinema-red hover:bg-cinema-red/90 border-none"
          >
            {state.isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT WITH CONTEXT PROVIDER
// ============================================================================

export default function UnifiedChatPanel(props) {
  return (
    <ChatProvider initialContext={props.sceneContext}>
      <UnifiedChatPanelInner {...props} />
    </ChatProvider>
  );
}
