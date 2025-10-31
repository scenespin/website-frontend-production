'use client';

import React, { useRef, useEffect, useState } from 'react';
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
import { CloudSavePrompt } from './CloudSavePrompt';
import { Send, Loader2, Image as ImageIcon, Film, Music, MessageSquare, Clapperboard, Zap, Users, Mic, Plus, ChevronDown, X, MapPin, FileText, Sparkles, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDrawer } from '@/contexts/DrawerContext';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

// The Intelligent Agent System + Generation Features
// AGENTS (with LLM selector): Screenwriter, Director, Audio, Workflows, Try-On
// FEATURES (with their own selectors): Image (model selector), Video (wrapped)
const MODE_CONFIG = {
  // AI AGENTS (use LLMs)
  chat: { icon: MessageSquare, label: 'Screenwriter', color: 'text-purple-500', description: 'AI interviews & brainstorming', isAgent: true },
  director: { icon: Clapperboard, label: 'Director', color: 'text-pink-500', description: 'Shot planning, dialogue & blocking', isAgent: true },
  audio: { icon: Music, label: 'Audio Agent', color: 'text-green-500', description: 'Music & SFX with AI interview', isAgent: true },
  workflows: { icon: Zap, label: 'Workflows', color: 'text-orange-500', description: '42 pre-built AI workflows', isAgent: true },
  'try-on': { icon: Users, label: 'Try-On', color: 'text-teal-500', description: 'Virtual character try-on', isAgent: true },
  
  // GENERATION FEATURES (separate selectors)
  image: { icon: ImageIcon, label: 'Image Generation', color: 'text-blue-500', description: 'Character & location images', isAgent: false },
  'quick-video': { icon: Film, label: 'Video Generation', color: 'text-cinema-red', description: 'Scene visualization', isAgent: false },
};

// Mode order: Agents first, then generation features
const MODE_ORDER = ['chat', 'director', 'audio', 'workflows', 'try-on', 'image', 'quick-video'];

// LLM Models (Text Generation) - User Choice Strategy
const LLM_MODELS = [
  // Claude (Anthropic)
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: 'Best for creative writing', recommended: true },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic', description: 'Most powerful analysis' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast & economical' },
  // GPT (OpenAI)
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', description: 'Most advanced GPT' },
  { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI', description: 'Fast and capable' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Optimized GPT-4' },
  // Gemini (Google)
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Advanced reasoning' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient' },
];

// ============================================================================
// MODE SELECTOR COMPONENT
// ============================================================================

function ModeSelector() {
  const { state, setMode } = useChatContext();
  
  // Separate agents from features
  const agents = MODE_ORDER.filter(mode => MODE_CONFIG[mode].isAgent);
  const features = MODE_ORDER.filter(mode => !MODE_CONFIG[mode].isAgent);
  
  return (
    <div className="dropdown dropdown-top">
      <label tabIndex={0} className="btn btn-sm btn-ghost gap-1">
        {React.createElement(MODE_CONFIG[state.activeMode]?.icon || MessageSquare, { className: 'w-4 h-4' })}
        <span className="text-xs font-medium hidden sm:inline">{MODE_CONFIG[state.activeMode]?.label || 'Screenwriter'}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-64 mb-2 border border-base-300 max-h-[80vh] overflow-y-auto">
        {/* AI AGENTS Section */}
        <li className="menu-title">
          <span className="text-xs font-bold text-base-content/70">AI Agents</span>
        </li>
        {agents.map((mode) => {
          const config = MODE_CONFIG[mode];
          const Icon = config.icon;
          return (
            <li key={mode}>
              <button
                onClick={() => setMode(mode)}
                className={`flex flex-col items-start gap-0.5 py-2 ${state.activeMode === mode ? 'active bg-cinema-red/10' : ''}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <span className="text-[10px] opacity-60 text-left ml-6">{config.description}</span>
              </button>
            </li>
          );
        })}
        
        {/* GENERATION FEATURES Section */}
        <li className="menu-title mt-2">
          <span className="text-xs font-bold text-base-content/70">Generation</span>
        </li>
        {features.map((mode) => {
          const config = MODE_CONFIG[mode];
          const Icon = config.icon;
          return (
            <li key={mode}>
              <button
                onClick={() => setMode(mode)}
                className={`flex flex-col items-start gap-0.5 py-2 ${state.activeMode === mode ? 'active bg-cinema-red/10' : ''}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
                <span className="text-[10px] opacity-60 text-left ml-6">{config.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================================================
// LLM MODEL SELECTOR COMPONENT (Text Generation Only)
// ============================================================================

function LLMModelSelector() {
  const [selectedModel, setSelectedModel] = React.useState('claude-sonnet-4-5-20250929');
  
  const currentModel = LLM_MODELS.find(m => m.id === selectedModel) || LLM_MODELS[0];
  
  return (
    <div className="dropdown dropdown-top">
      <label tabIndex={0} className="btn btn-sm btn-ghost gap-1 text-base-content/80 hover:text-base-content">
        <span className="text-xs font-medium">{currentModel.name}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-64 mb-2 border border-base-300 max-h-96 overflow-y-auto">
        {/* Group by provider */}
        {['Anthropic', 'OpenAI', 'Google'].map(provider => {
          const providerModels = LLM_MODELS.filter(m => m.provider === provider);
          return (
            <li key={provider}>
              <div className="menu-title">
                <span className="text-xs font-bold text-base-content/70">{provider}</span>
              </div>
              {providerModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`flex flex-col items-start gap-0.5 py-2 ${
                    selectedModel === model.id ? 'active bg-cinema-red/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-xs">{model.name}</span>
                    {model.recommended && (
                      <span className="badge badge-xs badge-primary">✨</span>
                    )}
                  </div>
                  <span className="text-[10px] opacity-60 text-left">{model.description}</span>
                </button>
              ))}
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
  const { state, setMode, setInput, setSelectedTextContext, setEntityContextBanner, setSceneContext, clearContext, addMessage, closeMenus, setStreaming } = useChatContext();
  const { startWorkflow } = useChatMode();
  const { getToken } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { closeDrawer } = useDrawer();
  
  // State for attachments and voice input
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recognitionRef = useRef(null);
  
  // Cloud save prompt state
  const [cloudSavePrompt, setCloudSavePrompt] = useState({
    isOpen: false,
    fileUrl: null,
    fileType: 'attachment',
    fileName: null,
    metadata: {}
  });

  // ============================================================================
  // VOICE INPUT SETUP (Web Speech API)
  // ============================================================================
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(state.input + (state.input ? ' ' : '') + transcript);
        setIsRecording(false);
        toast.success('Voice input captured!');
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          toast.error('Voice input failed: ' + event.error);
        }
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // ============================================================================
  // CONTEXT DETECTION (for AI Agents)
  // ============================================================================

  // Detect current scene context from editor (for AI agents only)
  useEffect(() => {
    // Only detect context for AI agents that need screenplay context
    const needsContext = MODE_CONFIG[state.activeMode]?.isAgent;
    
    if (needsContext && editorContent && cursorPosition !== undefined) {
      const sceneCtx = detectCurrentScene(editorContent, cursorPosition);
      if (sceneCtx) {
        setSceneContext(sceneCtx);
      }
    }
  }, [state.activeMode, editorContent, cursorPosition, setSceneContext]);

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
   * Handle voice input
   */
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast('🎤 Listening...', { icon: '👂' });
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Failed to start voice input');
        setIsRecording(false);
      }
    }
  };
  
  /**
   * Handle file attachment
   */
  const handleAttachment = () => {
    fileInputRef.current?.click();
  };
  
  /**
   * Handle file selection
   */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    setShowAttachmentMenu(false);
    
    try {
      toast.loading(`Uploading ${files.length} file(s)...`);
      
      // Set auth token for API calls
      const { setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      
      // Upload files
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.upload.file(formData);
          return {
            name: file.name,
            type: file.type,
            url: response.data.url,
            s3Key: response.data.s3Key
          };
        })
      );
      
      setAttachedFiles(prev => [...prev, ...uploaded]);
      toast.dismiss();
      toast.success(`${files.length} file(s) attached!`);
      
      // PROMPT TO SAVE TO CLOUD STORAGE
      if (uploaded.length > 0) {
        // Show prompt for first file (can be enhanced to handle multiple)
        const firstFile = uploaded[0];
        setCloudSavePrompt({
          isOpen: true,
          fileUrl: firstFile.url,
          fileType: 'attachment',
          fileName: firstFile.name,
          metadata: {
            originalName: firstFile.name,
            uploadedAt: new Date().toISOString(),
            mode: state.activeMode
          }
        });
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.dismiss();
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  /**
   * Remove attached file
   */
  const removeAttachedFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  /**
   * Handle sending a message
   */
  const handleSend = async (message) => {
    if (!message.trim() || state.isStreaming) return;

    // Add user message
    addMessage({
      role: 'user',
      content: message,
      mode: state.activeMode,
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined
    });

    // Clear input and attachments
    setInput('');
    setAttachedFiles([]);

    // Set auth token for API calls
    try {
      const { setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
    } catch (error) {
      console.error('Error setting auth token:', error);
    }

    // Check if this is an agent mode (needs AI response) or generation feature (handled by panel)
    if (MODE_CONFIG[state.activeMode]?.isAgent) {
      // AI Agents use chat API with streaming
      setStreaming(true, '');
      
      try {
        // Build conversation history (last 10 messages for this mode)
        const modeMessages = state.messages.filter(m => m.mode === state.activeMode).slice(-10);
        const conversationHistory = modeMessages.map(m => ({
          role: m.role,
          content: m.content
        }));
        
        // Build context prompt if scene context exists
        const contextData = state.sceneContext ? {
          heading: state.sceneContext.heading,
          act: state.sceneContext.act,
          characters: state.sceneContext.characters,
          pageNumber: state.sceneContext.pageNumber
        } : null;
        
        // Call chat API
        const response = await api.chat.generate({
          userPrompt: message,
          desiredModelId: state.selectedModel || 'claude-sonnet-4-5-20250929',
          conversationHistory,
          sceneContext: contextData,
          attachments: attachedFiles.length > 0 ? attachedFiles : undefined
        });
        
        // Add AI response
        addMessage({
          role: 'assistant',
          content: response.data.response || response.data.text || 'Sorry, I couldn\'t generate a response.',
          mode: state.activeMode
        });
        
      } catch (error) {
        console.error('Chat error:', error);
        toast.error(error.response?.data?.message || 'Failed to get AI response');
        
        addMessage({
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please try again.',
          mode: state.activeMode
        });
      } finally {
        setStreaming(false, '');
      }
    } else {
      // Generation features should be handled by their own panels
      addMessage({
        role: 'assistant',
        content: '💡 Please use the controls above to generate content.',
        mode: state.activeMode
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-full bg-base-100" onClick={closeMenus}>
      {/* Context Banner - Shows screenplay position for AI agents */}
      {MODE_CONFIG[state.activeMode]?.isAgent && state.sceneContext && (
        <div className="px-4 py-2 bg-base-200 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <MapPin className="w-4 h-4 text-cinema-gold flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium text-sm text-base-content truncate">
                {state.sceneContext.heading}
              </div>
              <div className="text-xs text-base-content/60">
                Act {state.sceneContext.act} • Page {state.sceneContext.pageNumber}
                {state.sceneContext.characters?.length > 0 && (
                  <span> • {state.sceneContext.characters.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => clearContext()}
            className="p-1 rounded hover:bg-base-300 text-base-content/60 hover:text-base-content flex-shrink-0"
            title="Clear context"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Text Context Banner - Shows rewrite context */}
      {state.selectedTextContext && (
        <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-medium text-sm text-base-content">
                Rewrite Mode
              </div>
              <div className="text-xs text-base-content/60 truncate">
                {state.selectedTextContext.substring(0, 60)}...
              </div>
            </div>
          </div>
          <button
            onClick={() => clearContext()}
            className="p-1 rounded hover:bg-base-300 text-base-content/60 hover:text-base-content flex-shrink-0"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Entity Context Banner - Shows what entity you're creating for */}
      {state.entityContextBanner && (
        <div className="px-4 py-2 bg-cinema-gold/10 border-b border-cinema-gold/20 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cinema-gold flex-shrink-0" />
          <span className="text-sm text-base-content">
            {state.entityContextBanner.workflow === 'interview' ? 'AI Interview: ' : 'Creating for: '}
            <strong>{state.entityContextBanner.name}</strong> ({state.entityContextBanner.type})
          </span>
        </div>
      )}
      
      {/* Mode Panel (renders based on active mode) */}
      {renderModePanel()}

      {/* Anchor for auto-scrolling */}
      <div ref={messagesEndRef} />

      {/* Chat Input - Two-Tiered Design */}
      <div className="flex-shrink-0 border-t border-base-300 bg-base-100">
        {/* Attached Files Display */}
        {attachedFiles.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="badge badge-lg gap-2 py-3">
                <Paperclip className="w-3 h-3" />
                <span className="text-xs">{file.name}</span>
                <button
                  onClick={() => removeAttachedFile(index)}
                  className="hover:text-error"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Main Input Area */}
        <div className="px-4 py-3">
          <div className="relative">
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
              disabled={state.isStreaming || isUploading}
              className="w-full min-h-[52px] max-h-[120px] resize-none bg-transparent text-base-content placeholder:text-base-content/40 focus:outline-none pr-24 py-3 text-base"
              rows={1}
              style={{ 
                border: 'none',
                boxShadow: 'none'
              }}
            />
            {/* Icons on the right */}
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <button
                onClick={handleVoiceInput}
                className={`p-2 rounded-lg hover:bg-base-200 text-base-content/60 hover:text-base-content transition-colors ${isRecording ? 'bg-cinema-red/20 animate-pulse' : ''}`}
                disabled={state.isStreaming || isUploading}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'text-cinema-red' : ''}`} />
              </button>
              <button
                onClick={() => handleSend(state.input)}
                disabled={!state.input.trim() || state.isStreaming || isUploading}
                className="p-2 rounded-lg bg-base-200 hover:bg-base-300 text-base-content disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                {state.isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Tier - Mode Selector & LLM Model Selector (agents only) */}
        <div className="px-4 py-2 flex items-center gap-2 border-t border-base-300/50">
          <button 
            onClick={handleAttachment}
            className="p-2 rounded-lg hover:bg-base-200 transition-colors"
            disabled={state.isStreaming || isUploading}
            title="Attach files or images"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-base-content/60 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 text-base-content/60" />
            )}
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <ModeSelector />
            {/* Only show LLM selector for AI Agents */}
            {MODE_CONFIG[state.activeMode]?.isAgent && <LLMModelSelector />}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.doc,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Cloud Save Prompt */}
        <CloudSavePrompt
          isOpen={cloudSavePrompt.isOpen}
          fileUrl={cloudSavePrompt.fileUrl}
          fileType={cloudSavePrompt.fileType}
          fileName={cloudSavePrompt.fileName}
          metadata={cloudSavePrompt.metadata}
          onClose={(result) => {
            setCloudSavePrompt(prev => ({ ...prev, isOpen: false }));
            if (result?.saved) {
              console.log('[UnifiedChatPanel] File saved to cloud:', result.cloudUrl);
            }
          }}
        />
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
