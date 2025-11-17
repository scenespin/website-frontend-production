'use client';

import React, { useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatProvider } from '@/contexts/ChatContext';
import { useChatContext } from '@/contexts/ChatContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatMode } from '@/hooks/useChatMode';
import { ChatModePanel } from './modes/ChatModePanel';
import { DirectorModePanel } from './modes/DirectorModePanel';
import { CharacterModePanel } from './modes/CharacterModePanel';
import { LocationModePanel } from './modes/LocationModePanel';
import { ImageModePanel } from './modes/ImageModePanel';
import { VideoModePanel } from './modes/VideoModePanel';
import { SceneVisualizerModePanel } from './modes/SceneVisualizerModePanel';
import { TryOnModePanel } from './modes/TryOnModePanel';
import { AudioModePanel } from './modes/AudioModePanel';
import { CloudSavePrompt } from './CloudSavePrompt';
import { Send, Loader2, Image as ImageIcon, Film, Music, MessageSquare, Clapperboard, Zap, Users, Mic, Plus, ChevronDown, X, MapPin, FileText, Sparkles, Paperclip, User, Building2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { detectCurrentScene, extractSelectionContext } from '@/utils/sceneDetection';
import { buildRewritePrompt } from '@/utils/promptBuilders';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

// The Intelligent Agent System + Generation Features
// AGENTS (with LLM selector): Screenwriter, Director, Audio, Workflows, Try-On
// FEATURES (with their own selectors): Image (model selector), Video (wrapped)
const MODE_CONFIG = {
  // AI AGENTS (use LLMs)
  chat: { icon: MessageSquare, label: 'Screenwriter', color: 'text-purple-500', description: 'AI interviews & brainstorming', isAgent: true },
  director: { icon: Clapperboard, label: 'Director', color: 'text-pink-500', description: 'Shot planning, dialogue & blocking', isAgent: true },
  character: { icon: User, label: 'Character', color: 'text-cyan-500', description: 'Create characters with AI interview', isAgent: true },
  location: { icon: Building2, label: 'Location', color: 'text-amber-500', description: 'Create locations with AI interview', isAgent: true },
  audio: { icon: Music, label: 'Audio', color: 'text-green-500', description: 'Music, sound effects & dialogue', isAgent: true },
  workflows: { icon: Zap, label: 'Workflows', color: 'text-orange-500', description: '58 pre-built AI workflows', isAgent: true },
  'try-on': { icon: Users, label: 'Try-On', color: 'text-teal-500', description: 'Virtual character try-on', isAgent: true },
  
  // GENERATION FEATURES (separate selectors)
  image: { icon: ImageIcon, label: 'Image Generation', color: 'text-blue-500', description: 'Character & location images', isAgent: false },
  'quick-video': { icon: Film, label: 'Video Generation', color: 'text-cinema-red', description: 'Scene visualization', isAgent: false },
};

// Mode order: Agents first, then generation features
const MODE_ORDER = ['chat', 'director', 'character', 'location', 'audio', 'workflows', 'try-on', 'image', 'quick-video'];

// ============================================================================
// PAGE-BASED AGENT FILTERING
// ============================================================================

/**
 * Get available agents based on current page
 * @param {string} pathname - Current page path (e.g., '/write', '/production')
 * @returns {string[]} - Array of available mode keys
 */
function getAvailableModesForPage(pathname) {
  // Default: all modes
  if (!pathname) return MODE_ORDER;
  
  // /write page - Writing agents ONLY
  if (pathname.includes('/write') || pathname.includes('/editor')) {
    return ['chat', 'director', 'character', 'location'];
  }
  
  // /production page - Production agents ONLY (workflows first as default)
  if (pathname.includes('/production')) {
    return ['workflows', 'image', 'quick-video', 'audio', 'try-on', 'character', 'location'];
  }
  
  // /composition and /timeline pages - Audio agent ONLY
  if (pathname.includes('/composition') || pathname.includes('/timeline')) {
    return ['audio'];
  }
  
  // Default: all modes
  return MODE_ORDER;
}


// LLM Models (Text Generation) - User Choice for Creative Style
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
  const pathname = usePathname(); // Get current page path
  
  // Filter modes based on current page
  const availableModes = getAvailableModesForPage(pathname);
  
  // Separate agents from features (only from available modes)
  const agents = availableModes.filter(mode => MODE_CONFIG[mode]?.isAgent);
  const features = availableModes.filter(mode => !MODE_CONFIG[mode]?.isAgent);
  
  const handleModeChange = (mode) => {
    setMode(mode);
    // Auto-close dropdown after selection
    document.activeElement?.blur();
  };
  
  return (
    <div className="dropdown dropdown-top">
      <label tabIndex={0} className="btn btn-sm btn-ghost gap-1">
        {React.createElement(MODE_CONFIG[state.activeMode]?.icon || MessageSquare, { className: 'w-4 h-4' })}
        <span className="text-xs font-medium hidden sm:inline">{MODE_CONFIG[state.activeMode]?.label || 'Screenwriter'}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-64 mb-2 border border-base-300 max-h-[80vh] overflow-y-auto">
        {/* AI AGENTS Section */}
        {agents.length > 0 && (
          <>
            <li className="menu-title">
              <span className="text-xs font-bold text-base-content/70">AI Agents</span>
            </li>
            {agents.map((mode) => {
              const config = MODE_CONFIG[mode];
              const Icon = config.icon;
              return (
                <li key={mode}>
                  <button
                    onClick={() => handleModeChange(mode)}
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
          </>
        )}
        
        {/* GENERATION FEATURES Section */}
        {features.length > 0 && (
          <>
            <li className="menu-title mt-2">
              <span className="text-xs font-bold text-base-content/70">Generation</span>
            </li>
            {features.map((mode) => {
              const config = MODE_CONFIG[mode];
              const Icon = config.icon;
              return (
                <li key={mode}>
                  <button
                    onClick={() => handleModeChange(mode)}
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
          </>
        )}
      </ul>
    </div>
  );
}

// ============================================================================
// LLM MODEL SELECTOR COMPONENT (Text Generation Only)
// ============================================================================

function LLMModelSelector() {
  const chatContext = useChatContext();
  const { state, setModel } = chatContext;
  
  // Use context state, fallback to default if not set
  const selectedModel = state.selectedModel || 'claude-sonnet-4-5-20250929';
  const currentModel = LLM_MODELS.find(m => m.id === selectedModel) || LLM_MODELS[0];
  
  const handleModelChange = (modelId) => {
    // Update both local state (for UI) and context (for API calls)
    setModel(modelId);
    // Auto-close dropdown after selection
    document.activeElement?.blur();
  };
  
  return (
    <div className="dropdown dropdown-top">
      <label tabIndex={0} className="btn btn-sm btn-ghost gap-1 text-base-content/80 hover:text-base-content">
        <span className="text-xs font-medium">{currentModel.name}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-1 shadow-lg bg-base-200 rounded-box w-56 mb-2 border border-base-300 max-h-80 overflow-y-auto overflow-x-hidden">
        {/* Group by provider - Users choose their preferred AI style */}
        {['Anthropic', 'OpenAI', 'Google'].map(provider => {
          const providerModels = LLM_MODELS.filter(m => m.provider === provider);
          return (
            <li key={provider} className="w-full">
              <div className="px-2 py-1">
                <span className="text-[10px] font-semibold text-base-content/60 uppercase tracking-wide">{provider}</span>
              </div>
              {providerModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`flex items-center justify-between gap-1.5 py-1 px-2 w-full hover:bg-base-300 rounded text-left ${
                    selectedModel === model.id ? 'bg-cinema-red/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[11px] font-medium truncate">{model.name}</span>
                    {model.recommended && (
                      <span className="text-[10px]">✨</span>
                    )}
                  </div>
                  {model.description && (
                    <span className="text-[9px] opacity-50 truncate max-w-[120px]">{model.description}</span>
                  )}
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
  const pathname = usePathname(); // Get current page path for default mode
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
    
    console.log('[UnifiedChatPanel] Context detection check:', {
      needsContext,
      hasEditorContent: !!editorContent,
      editorContentLength: editorContent?.length,
      cursorPosition,
      activeMode: state.activeMode
    });
    
    if (needsContext && editorContent) {
      // Try to detect context - use cursor position if available, otherwise find last scene
      let sceneCtx = null;
      
      if (cursorPosition !== undefined && cursorPosition !== null) {
        console.log('[UnifiedChatPanel] Detecting scene context with cursor position:', cursorPosition);
        sceneCtx = detectCurrentScene(editorContent, cursorPosition);
      } else {
        // Fallback: find the last scene heading in the content
        console.log('[UnifiedChatPanel] No cursor position, finding last scene heading...');
        const lines = editorContent.split('\n');
        let lastSceneLine = -1;
        const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s+/i;
        
        for (let i = lines.length - 1; i >= 0; i--) {
          if (sceneHeadingRegex.test(lines[i])) {
            lastSceneLine = i;
            break;
          }
        }
        
        if (lastSceneLine >= 0) {
          const approximateCursor = editorContent.split('\n').slice(0, lastSceneLine + 1).join('\n').length;
          console.log('[UnifiedChatPanel] Found last scene at line', lastSceneLine, 'approximate cursor:', approximateCursor);
          sceneCtx = detectCurrentScene(editorContent, approximateCursor);
        } else {
          console.warn('[UnifiedChatPanel] No scene headings found in content');
        }
      }
      
      if (sceneCtx) {
        const contextData = {
          heading: sceneCtx.heading,
          act: sceneCtx.act,
          characters: sceneCtx.characters,
          pageNumber: sceneCtx.pageNumber,
          totalPages: sceneCtx.totalPages
        };
        console.log('[UnifiedChatPanel] ✅ Scene context detected and set:', contextData);
        setSceneContext(contextData);
      } else {
        console.warn('[UnifiedChatPanel] ⚠️ No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
        // Clear context if we can't detect it
        setSceneContext(null);
      }
    } else if (needsContext && !editorContent) {
      console.warn('[UnifiedChatPanel] ⚠️ Needs context but no editorContent provided');
      setSceneContext(null);
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
          
          // Set mode to the workflow type (character/location/scene) so drawer shows correct title
          setMode(imageEntityContext.type);

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
  // Sync prop to state and ensure chat mode is active
  useEffect(() => {
    if (selectedTextContext) {
      console.log('[UnifiedChatPanel] Setting selectedTextContext from prop:', selectedTextContext.substring(0, 50));
      // Set the context in ChatContext state (range will be set by EditorWorkspace)
      // If range is not provided, we'll use the state's existing range
      setSelectedTextContext(selectedTextContext, state.selectionRange);
      // Always switch to chat mode for rewrite workflow
      if (state.activeMode !== 'chat') {
        console.log('[UnifiedChatPanel] Switching to chat mode for rewrite workflow');
        setMode('chat');
      }
    }
  }, [selectedTextContext, state.activeMode, state.selectionRange, setMode, setSelectedTextContext]);

  // ============================================================================
  // SMART DEFAULT MODE (Issue #1 Fix)
  // ============================================================================
  
  // Set intelligent default mode based on available modes for current page
  useEffect(() => {
    const availableModes = getAvailableModesForPage(pathname);
    
    // If current mode is not available on this page, switch to first available mode
    if (!availableModes.includes(state.activeMode)) {
      const defaultMode = availableModes[0] || 'chat';
      console.log('[UnifiedChatPanel] Current mode not available on this page, switching to:', defaultMode);
      setMode(defaultMode);
    }
  }, [pathname, state.activeMode, setMode]);

  // ============================================================================
  // WORKFLOW AUTO-START (Issue #2 Fix)
  // ============================================================================
  
  // Check for pending workflow prompt from localStorage and auto-start
  useEffect(() => {
    const pendingWorkflow = localStorage.getItem('pending-workflow-prompt');
    
    if (pendingWorkflow) {
      try {
        const workflowData = JSON.parse(pendingWorkflow);
        console.log('[UnifiedChatPanel] Found pending workflow, auto-starting:', workflowData);
        
        // Clear the pending workflow from localStorage
        localStorage.removeItem('pending-workflow-prompt');
        
        // Switch to workflows mode
        setMode('workflows');
        
        // Set the initial prompt if provided, then clear it after a short delay
        // This prevents the prompt from persisting across sessions
        if (workflowData.prompt) {
          setInput(workflowData.prompt);
          
          // Clear the input after 3 seconds to prevent it from staying
          setTimeout(() => {
            setInput('');
          }, 3000);
        }
        
        // TODO: Start the specific workflow if workflowId is provided
        // This would require integration with the workflow system
        
      } catch (error) {
        console.error('[UnifiedChatPanel] Failed to parse pending workflow:', error);
        localStorage.removeItem('pending-workflow-prompt');
      }
    }
  }, []); // Run once on mount

  // ============================================================================
  // DRAWER AGENT MODE (Fix: Correct default agent per page)
  // ============================================================================
  
  // Check for pending agent mode from openDrawer() calls
  useEffect(() => {
    const pendingAgentMode = localStorage.getItem('pending-agent-mode');
    
    if (pendingAgentMode) {
      console.log('[UnifiedChatPanel] Setting agent mode from drawer open:', pendingAgentMode);
      
      // Clear from localStorage
      localStorage.removeItem('pending-agent-mode');
      
      // Set the mode
      setMode(pendingAgentMode);
    }
  }, []); // Run once on mount
  
  // Set correct default agent when drawer opens (based on page)
  const { isDrawerOpen } = useDrawer();
  useEffect(() => {
    if (isDrawerOpen) {
      // If selectedTextContext exists, we're in rewrite mode - don't override mode
      if (state.selectedTextContext) {
        console.log('[UnifiedChatPanel] Drawer opened with rewrite context, keeping chat mode');
        setMode('chat');
        return;
      }
      
      // Check if there's a pending agent mode first
      const pendingAgentMode = localStorage.getItem('pending-agent-mode');
      
      if (pendingAgentMode) {
        console.log('[UnifiedChatPanel] Drawer opened with specific agent:', pendingAgentMode);
        localStorage.removeItem('pending-agent-mode');
        setMode(pendingAgentMode);
      } else {
        // No pending mode, use smart default based on page
        const availableModes = getAvailableModesForPage(pathname);
        const firstAvailableMode = availableModes[0] || 'chat';
        
        // Only switch if current mode is not available on this page
        if (!availableModes.includes(state.activeMode)) {
          console.log('[UnifiedChatPanel] Drawer opened, setting default agent for page:', firstAvailableMode);
          setMode(firstAvailableMode);
        }
      }
    }
  }, [isDrawerOpen, pathname, state.selectedTextContext, setMode]); // Trigger when drawer opens or page changes

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

      case 'character':
        return <CharacterModePanel {...commonProps} />;

      case 'location':
        return <LocationModePanel {...commonProps} />;

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

    // WIZARD MODE: Completely skip AI calls during character/location workflows
    // The mode panels handle all workflow logic - we never call AI here during workflows
    // Also skip if we're in character/location mode (even if workflow not set yet - mode panel will handle it)
    if ((state.activeWorkflow && (state.activeMode === 'location' || state.activeMode === 'character')) ||
        (state.activeMode === 'character' || state.activeMode === 'location')) {
      console.log('[UnifiedChatPanel] ⚠️ Character/Location mode detected - skipping. Mode panel will handle this message.');
      return; // Mode panel handles everything - don't add message, don't call AI, nothing
    }

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
      let accumulatedText = '';
      
      try {
        // Build conversation history (last 10 messages for this mode)
        const modeMessages = state.messages.filter(m => m.mode === state.activeMode).slice(-10);
        const conversationHistory = modeMessages.map(m => ({
          role: m.role,
          content: m.content
        }));
        
        // Re-detect scene context on each message (cursor might have moved)
        let currentSceneContext = state.sceneContext;
        if (editorContent && cursorPosition !== undefined) {
          const detectedContext = detectCurrentScene(editorContent, cursorPosition);
          if (detectedContext) {
            currentSceneContext = detectedContext;
            setSceneContext(detectedContext); // Update state
          }
        }
        
        // Build prompt - use rewrite prompt builder if selected text exists
        let finalUserPrompt = message;
        let systemPrompt = `You are a professional screenwriting assistant helping a screenwriter with their screenplay.`;
        
        // If rewrite mode (selected text exists), build comprehensive rewrite prompt
        if (state.selectedTextContext && state.selectionRange && editorContent) {
          // Extract surrounding text for seamless integration
          const selectionContext = extractSelectionContext(
            editorContent,
            state.selectionRange.start,
            state.selectionRange.end
          );
          
          if (selectionContext) {
            // Build rewrite prompt with surrounding text
            finalUserPrompt = buildRewritePrompt(
              message,
              state.selectedTextContext,
              currentSceneContext,
              {
                before: selectionContext.beforeContext,
                after: selectionContext.afterContext
              }
            );
            
            // System prompt for rewrite mode
            systemPrompt += `\n\n[REWRITE MODE - User wants to rewrite selected text]\n`;
            systemPrompt += `IMPORTANT: The user has selected text and wants to rewrite it. Provide ONLY the rewritten selection that blends seamlessly with surrounding text.`;
          }
        }
        
        // Add scene context to system prompt
        if (currentSceneContext) {
          systemPrompt += `\n\n[SCENE CONTEXT - Use this to provide contextual responses]\n`;
          systemPrompt += `Current Scene: ${currentSceneContext.heading}\n`;
          systemPrompt += `Act: ${currentSceneContext.act}\n`;
          systemPrompt += `Page: ${currentSceneContext.pageNumber} of ${currentSceneContext.totalPages}\n`;
          if (currentSceneContext.characters && currentSceneContext.characters.length > 0) {
            systemPrompt += `Characters in scene: ${currentSceneContext.characters.join(', ')}\n`;
          }
          systemPrompt += `\nScene Content:\n${currentSceneContext.content.substring(0, 1000)}${currentSceneContext.content.length > 1000 ? '...' : ''}\n`;
          systemPrompt += `\nIMPORTANT: Use this scene context to provide relevant, contextual responses. Reference the scene, characters, and content when appropriate.`;
        }
        
        // Build context data for API
        const contextData = currentSceneContext ? {
          heading: currentSceneContext.heading,
          act: currentSceneContext.act,
          characters: currentSceneContext.characters,
          pageNumber: currentSceneContext.pageNumber
        } : null;
        
        // Call streaming chat API
        await api.chat.generateStream(
          {
            userPrompt: finalUserPrompt, // Use built prompt (rewrite or original)
            systemPrompt: systemPrompt,
            desiredModelId: state.selectedModel || 'claude-sonnet-4-5-20250929',
            conversationHistory,
            sceneContext: contextData,
            attachments: attachedFiles.length > 0 ? attachedFiles : undefined
          },
          // onChunk - update streaming text
          (chunk) => {
            accumulatedText += chunk;
            setStreaming(true, accumulatedText);
          },
          // onComplete - add final message
          (fullContent) => {
            setStreaming(false, '');
            addMessage({
              role: 'assistant',
              content: fullContent,
              mode: state.activeMode
            });
          },
          // onError - handle error
          (error) => {
            console.error('Chat streaming error:', error);
            setStreaming(false, '');
            toast.error(error.message || 'Failed to get AI response');
            
            addMessage({
              role: 'assistant',
              content: '❌ Sorry, I encountered an error. Please try again.',
              mode: state.activeMode
            });
          }
        );
        
      } catch (error) {
        console.error('Chat error:', error);
        setStreaming(false, '');
        toast.error(error.response?.data?.message || error.message || 'Failed to get AI response');
        
        addMessage({
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please try again.',
          mode: state.activeMode
        });
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
      {(() => {
        const isAgent = MODE_CONFIG[state.activeMode]?.isAgent;
        const hasContext = !!state.sceneContext;
        console.log('[UnifiedChatPanel] Banner render check:', {
          activeMode: state.activeMode,
          isAgent,
          hasContext,
          sceneContext: state.sceneContext
        });
        return isAgent && hasContext;
      })() && (
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
        <div className="px-4 py-2.5 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-base-content">
                  Rewrite Mode
                </span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-purple-500/70 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 bg-base-200 border border-base-300 rounded-md shadow-lg text-xs text-base-content/80">
                    Selected text will be rewritten. Use quick action buttons below or type custom instructions like "make this more dramatic" or "polish the dialogue".
                  </div>
                </div>
              </div>
              <div className="text-xs text-base-content/60 truncate mt-0.5">
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
        <div className="px-4 py-2 bg-cinema-gold/10 border-b border-cinema-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-4 h-4 text-cinema-gold flex-shrink-0" />
            <span className="text-sm text-base-content">
              {state.entityContextBanner.workflow === 'interview' ? 'AI Interview: ' : 'Creating for: '}
              <strong>{state.entityContextBanner.name}</strong> ({state.entityContextBanner.type})
            </span>
          </div>
          <button
            onClick={() => setEntityContextBanner(null)}
            className="p-1 rounded hover:bg-base-300 text-base-content/60 hover:text-base-content flex-shrink-0"
            title="Clear entity context"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Mode Panel (renders based on active mode) */}
      {renderModePanel()}

      {/* Anchor for auto-scrolling */}
      <div ref={messagesEndRef} />

      {/* Chat Input - Modern AI Chat Style */}
      {/* Hide input if mode panel has its own input (workflow modes) */}
      {!(state.activeWorkflow && (state.activeMode === 'character' || state.activeMode === 'location')) && (
        <div className="flex-shrink-0 border-t border-base-300/50 bg-base-100">
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-lg text-sm">
                  <Paperclip className="w-3 h-3 text-base-content/60" />
                  <span className="text-xs font-medium text-base-content">{file.name}</span>
                  <button
                    onClick={() => removeAttachedFile(index)}
                    className="hover:text-error transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Main Input Area - ChatGPT/Claude Style */}
          <div className="max-w-3xl mx-auto px-3 md:px-4 py-2">
            <div className="relative bg-base-200 rounded-2xl shadow-sm border border-base-300/50 focus-within:border-cinema-red/30 focus-within:shadow-md transition-all duration-200">
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
                className="w-full min-h-[52px] max-h-[200px] resize-none bg-transparent text-base-content placeholder:text-base-content/40 focus:outline-none px-3 md:px-4 py-3 text-base pr-28"
                rows={1}
                style={{ 
                  border: 'none',
                  boxShadow: 'none'
                }}
              />
              {/* Action Buttons - Bottom Right */}
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                <button
                  onClick={handleAttachment}
                  className={`p-2.5 rounded-lg hover:bg-base-300 text-base-content/50 hover:text-base-content transition-all duration-200 ${isUploading ? 'opacity-50' : ''}`}
                  disabled={state.isStreaming || isUploading}
                  title="Attach files"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleVoiceInput}
                  className={`p-2.5 rounded-lg hover:bg-base-300 text-base-content/50 hover:text-base-content transition-all duration-200 ${isRecording ? 'bg-cinema-red/20 text-cinema-red animate-pulse' : ''}`}
                  disabled={state.isStreaming || isUploading}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'text-cinema-red' : ''}`} />
                </button>
                <button
                  onClick={() => handleSend(state.input)}
                  disabled={!state.input.trim() || state.isStreaming || isUploading}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    state.input.trim() && !state.isStreaming && !isUploading
                      ? 'bg-cinema-red hover:bg-cinema-red/90 text-base-content shadow-sm'
                      : 'bg-base-300 text-base-content/30 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  {state.isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls - Mode & Model Selector */}
      <div className="max-w-3xl mx-auto px-3 md:px-4 pb-2 flex items-center gap-3 text-xs">
          <ModeSelector />
          {/* Only show LLM selector for AI Agents */}
          {MODE_CONFIG[state.activeMode]?.isAgent && <LLMModelSelector />}
          <div className="flex-1"></div>
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
