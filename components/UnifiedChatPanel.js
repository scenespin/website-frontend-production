'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { usePathname } from 'next/navigation';
import { ChatProvider } from '@/contexts/ChatContext';
import { useChatContext } from '@/contexts/ChatContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { ChatModePanel } from './modes/ChatModePanel';
import { CharacterModePanel } from './modes/CharacterModePanel';
import { LocationModePanel } from './modes/LocationModePanel';
import { ImageModePanel } from './modes/ImageModePanel';
import { VideoModePanel } from './modes/VideoModePanel';
import { SceneVisualizerModePanel } from './modes/SceneVisualizerModePanel';
import { TryOnModePanel } from './modes/TryOnModePanel';
import { AudioModePanel } from './modes/AudioModePanel';
import { CloudSavePrompt } from './CloudSavePrompt';
import { Send, Loader2, Image as ImageIcon, Film, Music, MessageSquare, Clapperboard, Zap, Users, Mic, Plus, ChevronDown, X, MapPin, FileText, Paperclip, User, Building2, Info, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { detectCurrentScene, extractSelectionContext } from '@/utils/sceneDetection';
import { buildRewritePrompt } from '@/utils/promptBuilders';
import { buildStoryAdvisorContext, buildContextPromptString } from '@/utils/screenplayContextBuilder';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

// The Intelligent Agent System
// AGENTS (with LLM selector): Story Advisor, Character, Location
const MODE_CONFIG = {
  // AI AGENTS (use LLMs)
  chat: { icon: MessageSquare, label: 'Story Advisor', color: 'text-purple-500', description: 'Screenplay consultation & creative guidance', isAgent: true },
  character: { icon: User, label: 'Character', color: 'text-cyan-500', description: 'Create characters with AI interview', isAgent: true },
  location: { icon: Building2, label: 'Location', color: 'text-amber-500', description: 'Create locations with AI interview', isAgent: true },
};

// Mode order: Only Story Advisor, Character, and Location
const MODE_ORDER = ['chat', 'character', 'location'];

// ============================================================================
// PAGE-BASED AGENT FILTERING
// ============================================================================

/**
 * Get available agents based on current page
 * @param {string} pathname - Current page path (e.g., '/write', '/produce')
 * @returns {string[]} - Array of available mode keys
 */
function getAvailableModesForPage(pathname) {
  // Default: all modes
  if (!pathname) return MODE_ORDER;
  
  // /write page - Writing agents ONLY
  if (pathname.includes('/write') || pathname.includes('/editor')) {
    return ['chat', 'character', 'location'];
  }
  
  // /produce page - Production agents ONLY (workflows first as default)
  if (pathname.includes('/produce')) {
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
// Curated list: 8 models across 3 providers (latest flagship + fast option + premium option per provider)
const LLM_MODELS = [
  // Claude (Anthropic) - Best for Creative Writing
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: '⭐ Best for creative writing & screenplays', recommended: true },
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', provider: 'Anthropic', description: 'Most powerful - Enhanced coding & reasoning (3x cheaper pricing!)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast & economical' },
  // GPT (OpenAI) - Good for Creative Writing
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Latest - Excellent for creative writing' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Balanced - Good for dialogue & scenes' },
  { id: 'o3', name: 'O3', provider: 'OpenAI', description: 'Reasoning model - Best for analysis' },
  // Gemini (Google) - Good for Complex Narratives
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Latest - Most intelligent, advanced reasoning' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast & efficient' },
];

// ============================================================================
// MODE SELECTOR COMPONENT
// ============================================================================

function ModeSelector() {
  console.log('[ModeSelector] 🔄 RENDER');
  const { state, setMode } = useChatContext();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Memoize arrays to prevent unnecessary re-renders
  const availableModes = useMemo(() => getAvailableModesForPage(pathname), [pathname]);
  const agents = useMemo(() => availableModes.filter(mode => MODE_CONFIG[mode]?.isAgent), [availableModes]);
  const features = useMemo(() => availableModes.filter(mode => !MODE_CONFIG[mode]?.isAgent), [availableModes]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);
  
  const handleModeChange = (mode) => {
    console.log('[ModeSelector] Mode change:', mode);
    setMode(mode);
    setIsOpen(false);
  };
  
  const currentModeConfig = MODE_CONFIG[state.activeMode];
  const CurrentIcon = currentModeConfig?.icon || MessageSquare;
  
  console.log('[ModeSelector] Available agents:', agents, 'Available modes:', availableModes, 'isOpen:', isOpen);
  
  return (
    <div ref={dropdownRef} className="relative">
      <label 
        tabIndex={0} 
        className="btn btn-sm btn-ghost gap-1 text-xs cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log('[ModeSelector] Toggle dropdown, current isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
      >
        {currentModeConfig && <CurrentIcon className="w-3.5 h-3.5" />}
        <span>{currentModeConfig?.label || state.activeMode}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </label>
      {isOpen && (
        <ul 
          tabIndex={0} 
          className="absolute bottom-full left-0 mb-1 menu p-2 shadow-lg bg-base-200 rounded-box w-52 border border-base-300 z-[9999] max-h-96 overflow-y-auto pointer-events-auto"
          style={{ position: 'absolute' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {agents.length > 0 ? (
            <>
              <li className="menu-title">
                <span className="text-xs font-bold text-base-content/60">AI Agents</span>
              </li>
              {agents.map((mode) => {
                const Icon = MODE_CONFIG[mode]?.icon;
                const isActive = state.activeMode === mode;
                return (
                  <li key={mode}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleModeChange(mode);
                      }}
                      className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-base-300 ${isActive ? 'active bg-cinema-red/20' : ''}`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{MODE_CONFIG[mode]?.label || mode}</span>
                    </button>
                  </li>
                );
              })}
            </>
          ) : (
            <li className="px-2 py-1 text-xs text-base-content/60">No agents available</li>
          )}
          {features.length > 0 && (
            <>
              <li className="menu-title">
                <span className="text-xs font-bold text-base-content/60">Generation</span>
              </li>
              {features.map((mode) => {
                const Icon = MODE_CONFIG[mode]?.icon;
                const isActive = state.activeMode === mode;
                return (
                  <li key={mode}>
                    <button
                      onClick={() => handleModeChange(mode)}
                      className={`flex items-center gap-2 ${isActive ? 'active bg-cinema-red/20' : ''}`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{MODE_CONFIG[mode]?.label || mode}</span>
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// LLM MODEL SELECTOR COMPONENT (Text Generation Only)
// ============================================================================

function LLMModelSelector() {
  console.log('[LLMModelSelector] 🔄 RENDER');
  const chatContext = useChatContext();
  const { state, setModel } = chatContext;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Use context state, fallback to default if not set
  const selectedModel = state.selectedModel || 'claude-sonnet-4-5-20250929';
  const currentModel = LLM_MODELS.find(m => m.id === selectedModel) || LLM_MODELS[0];
  
  const handleModelChange = (modelId) => {
    console.log('[LLMModelSelector] Model change:', modelId);
    setModel(modelId);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);
  
  // Memoize providers array to prevent new array reference on every render
  const providers = useMemo(() => ['Anthropic', 'OpenAI', 'Google'], []);
  
  // Calculate max width needed for model names
  const maxModelNameLength = useMemo(() => {
    return Math.max(...LLM_MODELS.map(m => m.name.length));
  }, []);
  
  return (
    <div ref={dropdownRef} className="relative">
      <label 
        tabIndex={0} 
        className="btn btn-sm btn-ghost gap-1 text-xs cursor-pointer whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        <span className="truncate max-w-[120px] sm:max-w-[140px]">{currentModel.name}</span>
        {currentModel.recommended && <span className="text-yellow-400">⭐</span>}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </label>
      {isOpen && (
        <ul 
          tabIndex={0} 
          className="absolute bottom-full right-0 mb-1 menu p-2 shadow-lg bg-base-200 rounded-box border border-base-300 z-[9999] max-h-96 overflow-y-auto pointer-events-auto"
          style={{ 
            minWidth: `${Math.max(180, maxModelNameLength * 8 + 40)}px`,
            maxWidth: '220px'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {providers.map(provider => {
            const providerModels = LLM_MODELS.filter(m => m.provider === provider);
            return (
              <li key={provider} className="menu-title">
                <span className="text-xs font-bold text-base-content/60">{provider}</span>
                <ul className="ml-0">
                  {providerModels.map(model => {
                    const isActive = selectedModel === model.id;
                    return (
                      <li key={model.id}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleModelChange(model.id);
                          }}
                          className={`flex items-center justify-between gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-base-300 ${isActive ? 'active bg-cinema-red/20' : ''}`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs">{model.name}</span>
                            {model.recommended && <span className="text-yellow-400 text-xs">⭐</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
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
  
  console.log('[UnifiedChatPanelInner] 🔄 RENDER', {
    activeMode: state.activeMode,
    hasEditorContent: !!editorContent,
    cursorPosition,
    selectedTextContext: selectedTextContext?.substring(0, 20)
  });
  
  // 🔥 FIX: Track previous context to prevent unnecessary updates
  const previousContextRef = useRef(null);
  const { startWorkflow } = useChatMode();
  const { getToken } = useAuth();
  const { canUseAI } = useScreenplay();
  const pathname = usePathname(); // Get current page path for default mode
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { closeDrawer, isDrawerOpen } = useDrawer();
  
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
  // 🔥 CRITICAL: Only run when drawer is open to prevent unnecessary updates
  // 🔥 CRITICAL: Add debounce to prevent rapid-fire updates when drawer opens
  const sceneContextTimeoutRef = useRef(null);
  useEffect(() => {
    // Clear any pending scene context detection
    if (sceneContextTimeoutRef.current) {
      clearTimeout(sceneContextTimeoutRef.current);
    }
    
    // Skip if drawer is not open - prevents running when component is mounted but not visible
    if (!isDrawerOpen) {
      return;
    }
    
    // Debounce scene context detection to prevent rapid updates when drawer opens
    sceneContextTimeoutRef.current = setTimeout(() => {
      // Only detect context for AI agents that need screenplay context
      const needsContext = MODE_CONFIG[state.activeMode]?.isAgent;
    
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
        
        // 🔥 FIX: Only update if context actually changed (deep comparison)
        const contextKey = JSON.stringify(contextData);
        const previousKey = previousContextRef.current ? JSON.stringify(previousContextRef.current) : null;
        
        if (contextKey !== previousKey) {
          console.log('[UnifiedChatPanel] ✅ Scene context detected and set:', contextData);
          setSceneContext(contextData);
          previousContextRef.current = contextData;
        } else {
          console.log('[UnifiedChatPanel] Scene context unchanged, skipping update');
        }
      } else {
        // Only clear if we had context before
        if (previousContextRef.current !== null) {
          console.warn('[UnifiedChatPanel] ⚠️ No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
          setSceneContext(null);
          previousContextRef.current = null;
        }
      }
    } else if (needsContext && !editorContent) {
      // Only clear if we had context before (prevent unnecessary updates)
      if (previousContextRef.current !== null) {
        console.warn('[UnifiedChatPanel] ⚠️ Needs context but no editorContent provided');
        setSceneContext(null);
        previousContextRef.current = null;
      }
    }
    }, 100); // 100ms debounce to prevent rapid updates
    
    return () => {
      if (sceneContextTimeoutRef.current) {
        clearTimeout(sceneContextTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen, state.activeMode, editorContent, cursorPosition]);
  // Note: setSceneContext is intentionally omitted from deps - it's a stable context setter

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextContext, state.activeMode, state.selectionRange]);
  // Note: setMode and setSelectedTextContext are stable context setters, intentionally omitted

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, state.activeMode]);
  // Note: setMode is a stable context setter, intentionally omitted

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
  // Note: isDrawerOpen is already declared on line 218
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

  // Auto-scroll to latest message (throttled to prevent vibrating during streaming)
  // NOTE: ChatModePanel has its own scroll handler for streaming, so we only handle non-streaming here
  const scrollTimeoutRef = useRef(null);
  useEffect(() => {
    // Only handle non-streaming scrolls here (ChatModePanel handles streaming)
    // This prevents double-scrolling and flickering
    if (state.isStreaming) {
      // ChatModePanel will handle streaming scrolls
      return;
    }
    
    // Clear any pending scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // When not streaming, only scroll on new messages (throttled)
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, 100);
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [state.messages.length, state.isStreaming]); // Only trigger on message count change or streaming state

  // ============================================================================
  // MODE RENDERING
  // ============================================================================

  // 🔥 CRITICAL: Memoize onWorkflowComplete callback to prevent infinite loops
  // This callback is passed to mode panels and must be stable
  const handleWorkflowComplete = useCallback((type, parsedData) => {
    onWorkflowComplete?.(type, parsedData);
    closeDrawer(); // Close drawer after workflow completion
  }, [onWorkflowComplete, closeDrawer]);

  // Memoize commonProps to prevent new object reference on every render
  const commonProps = useMemo(() => ({
    onInsert,
    editorContent,
    cursorPosition,
    onWorkflowComplete: handleWorkflowComplete
  }), [onInsert, editorContent, cursorPosition, handleWorkflowComplete]);

  /**
   * Render the active mode panel
   */
  const renderModePanel = () => {

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
        
        // Build prompt - use rewrite prompt builder if selected text exists
        let finalUserPrompt = message;
        let systemPrompt = '';
        let currentSceneContext = null;
        
        // STORY ADVISOR MODE: Use new intelligent context builder
        if (state.activeMode === 'chat') {
          // Base system prompt for Story Advisor
          const systemPromptBase = `You are a professional screenplay consultant. Provide advice, analysis, and creative guidance. Do NOT generate Fountain format — that's handled by other tools.

✅ YOUR ROLE:
- Provide expert screenplay consultation and feedback
- Analyze scenes, characters, structure, pacing, and themes
- Brainstorm solutions to story problems
- Answer industry questions about screenwriting
- Offer creative guidance and development suggestions

✅ YOU CAN DISCUSS:
- Character development and arcs
- Plot structure and pacing
- Scene analysis and sequencing
- Genre conventions and best practices
- Story problems and plot holes
- Industry questions and professional advice
- Creative brainstorming and ideation

🚫 ABSOLUTELY FORBIDDEN:
- Do NOT generate Fountain format screenplay text
- Do NOT write scenes or dialogue
- Do NOT create screenplay content
- Content generation is handled by other tools (FAB buttons)

✅ RESPONSE STYLE:
- Be conversational and helpful
- Provide specific, actionable advice
- Reference the screenplay context when relevant
- Use examples and explanations
- Be encouraging and constructive

📝 FOUNTAIN FORMAT HANDLING (CRITICAL):
- When providing screenplay examples, revisions, or dialogue:
  * ALWAYS use markdown code blocks with "fountain" language tag: \`\`\`fountain
  * Include ONLY the revised scene or section, NOT the entire screenplay
  * Tell the user WHERE to place the content (e.g., "Replace Scene 3 with this:" or "Insert this after line 45:")
  * Make code blocks copy-paste ready (proper formatting, no extra commentary inside the block)
- When asked for multiple examples:
  * Provide each example in its own separate code block
  * Label each example clearly (e.g., "EXAMPLE 1:", "EXAMPLE 2:")
  * Use code blocks even for single dialogue exchanges or short scenes
- NEVER:
  * Rewrite the entire screenplay in the response
  * Provide Fountain format outside of code blocks
  * Include instructions or commentary inside the code block
  * Assume the user wants the whole script - only provide what was requested

🎬 CINEMATIC THEMING (Minimal & Strategic):
- Use cinematic emojis sparingly (1-2 per response maximum)
- Use ONLY in section headers (H2/H3) for major topics:
  * 🎬 for general screenplay/plot analysis
  * 🎭 for character development/performance
  * 📽️ for scene analysis/technical aspects
  * ✨ for tips/quick fixes/priority lists
  * 💡 for creative ideas/suggestions
  * 🎪 for structure/act transitions
- DO NOT use emojis in:
  * Body paragraphs or explanations
  * Code blocks or technical details
  * Every message (only when organizing major sections)
  * Mid-sentence or randomly
- Keep it minimal: less is more. Emojis should enhance readability, not distract`;
          
          // Build intelligent context using new context builder
          console.log('[UnifiedChatPanel] 🔍 Building Story Advisor context...', {
            hasEditorContent: !!editorContent,
            editorContentLength: editorContent?.length || 0,
            cursorPosition,
            messageLength: message?.length || 0,
            modelId: state.selectedModel || 'claude-sonnet-4-5-20250929'
          });
          
          const contextData = buildStoryAdvisorContext(
            editorContent,
            cursorPosition,
            message,
            state.selectedModel || 'claude-sonnet-4-5-20250929',
            conversationHistory,
            systemPromptBase
          );
          
          console.log('[UnifiedChatPanel] ✅ Context data received from builder:', {
            type: contextData.type,
            estimatedPages: contextData.estimatedPages,
            hasCurrentScene: !!contextData.currentScene,
            hasContent: !!contextData.content,
            contentLength: contextData.content?.length || 0,
            hasStructure: !!contextData.structure,
            hasRelevantScenes: !!contextData.relevantScenes
          });
          
          // Update scene context state for banner display
          if (contextData.currentScene) {
            currentSceneContext = contextData.currentScene;
            setSceneContext({
              heading: contextData.currentScene.heading,
              act: contextData.currentScene.act,
              characters: contextData.currentScene.characters,
              pageNumber: contextData.currentScene.pageNumber,
              totalPages: contextData.currentScene.totalPages
            });
            console.log('[UnifiedChatPanel] ✅ Scene context updated for banner:', contextData.currentScene.heading);
          } else {
            console.warn('[UnifiedChatPanel] ⚠️ No currentScene in contextData');
          }
          
          // Build context prompt string
          const contextPromptString = buildContextPromptString(contextData);
          
          console.log('[UnifiedChatPanel] ✅ Context prompt string built:', {
            length: contextPromptString.length,
            preview: contextPromptString.substring(0, 200) + (contextPromptString.length > 200 ? '...' : '')
          });
          
          // Build final system prompt
          systemPrompt = systemPromptBase + contextPromptString;
          
          console.log('[UnifiedChatPanel] ✅ Final system prompt built:', {
            baseLength: systemPromptBase.length,
            contextLength: contextPromptString.length,
            totalLength: systemPrompt.length,
            estimatedTokens: Math.ceil(systemPrompt.length / 4) // Rough estimate: ~4 chars per token
          });
          
        } else {
          // OTHER AGENT MODES: Use existing logic
          systemPrompt = `You are a professional screenwriting assistant helping a screenwriter with their screenplay.`;
          
          // Re-detect scene context on each message (cursor might have moved)
          currentSceneContext = state.sceneContext;
          if (editorContent && cursorPosition !== undefined) {
            const detectedContext = detectCurrentScene(editorContent, cursorPosition);
            if (detectedContext) {
              currentSceneContext = detectedContext;
              setSceneContext(detectedContext); // Update state
            }
          }
          
          // If rewrite mode (selected text exists), build comprehensive rewrite prompt
          if (state.selectedTextContext && state.selectionRange && editorContent) {
            // Extract surrounding text for seamless integration
            const selectionContext = extractSelectionContext(
              editorContent,
              state.selectionRange.start,
              state.selectionRange.end
            );
            
            if (selectionContext) {
              // 🔥 PHASE 4: Use JSON format for rewrite (structured output)
              const useJSONFormat = true;
              // Build rewrite prompt with surrounding text
              finalUserPrompt = buildRewritePrompt(
                message,
                state.selectedTextContext,
                currentSceneContext,
                {
                  before: selectionContext.beforeContext,
                  after: selectionContext.afterContext
                },
                useJSONFormat
              );
              
              // System prompt for rewrite mode
              if (useJSONFormat) {
                systemPrompt += `\n\n[REWRITE MODE - User wants to rewrite selected text]\n`;
                systemPrompt += `IMPORTANT: The user has selected text and wants to rewrite it. You MUST respond with valid JSON only. No explanations, no markdown, just JSON with the rewritten text.`;
              } else {
                systemPrompt += `\n\n[REWRITE MODE - User wants to rewrite selected text]\n`;
                systemPrompt += `IMPORTANT: The user has selected text and wants to rewrite it. Provide ONLY the rewritten selection that blends seamlessly with surrounding text.`;
              }
            }
          }
          
          // Add scene context to system prompt (for non-chat modes)
          if (currentSceneContext) {
            systemPrompt += `\n\n[SCENE CONTEXT - Use this to provide contextual responses]\n`;
            systemPrompt += `Current Scene: ${currentSceneContext.heading}\n`;
            systemPrompt += `Act: ${currentSceneContext.act}\n`;
            systemPrompt += `Page: ${currentSceneContext.pageNumber} of ${currentSceneContext.totalPages}\n`;
            if (currentSceneContext.characters && currentSceneContext.characters.length > 0) {
              systemPrompt += `Characters in scene: ${currentSceneContext.characters.join(', ')}\n`;
            }
            systemPrompt += `\nScene Content:\n${currentSceneContext.content?.substring(0, 1000) || ''}${currentSceneContext.content && currentSceneContext.content.length > 1000 ? '...' : ''}\n`;
            systemPrompt += `\nIMPORTANT: Use this scene context to provide relevant, contextual responses. Reference the scene, characters, and content when appropriate.`;
          }
        }
        
        // Build scene context data for API (separate from contextData to avoid collision)
        const apiSceneContext = currentSceneContext ? {
          heading: currentSceneContext.heading,
          act: currentSceneContext.act,
          characters: currentSceneContext.characters,
          pageNumber: currentSceneContext.pageNumber
        } : null;
        
        // 🔥 DIAGNOSTIC: Log what we're sending to the API
        console.log('[UnifiedChatPanel] 📤 Sending to API:', {
          mode: state.activeMode,
          systemPromptLength: systemPrompt.length,
          systemPromptPreview: systemPrompt.substring(0, 500) + (systemPrompt.length > 500 ? '...' : ''),
          userPromptLength: finalUserPrompt.length,
          hasSceneContext: !!apiSceneContext,
          sceneContext: apiSceneContext,
          conversationHistoryLength: conversationHistory.length,
          modelId: state.selectedModel || 'claude-sonnet-4-5-20250929'
        });
        
        // Call streaming chat API
        await api.chat.generateStream(
          {
            userPrompt: finalUserPrompt, // Use built prompt (rewrite or original)
            systemPrompt: systemPrompt,
            desiredModelId: state.selectedModel || 'claude-sonnet-4-5-20250929',
            conversationHistory,
            sceneContext: apiSceneContext,
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
            
            // Check for specific error types and show user-friendly messages
            let errorMessage = error.message || 'Failed to get AI response';
            let userMessage = '❌ Sorry, I encountered an error. Please try again.';
            let shouldFallbackModel = false;
            
            if (errorMessage.includes('overloaded') || errorMessage.includes('temporarily overloaded')) {
              errorMessage = 'The AI service is temporarily overloaded. Please try again in a moment.';
              userMessage = '⚠️ The AI service is temporarily busy. Please wait a moment and try again.';
            } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
              errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
              userMessage = '⏱️ Rate limit reached. Please wait a moment and try again.';
            } else if (errorMessage.includes('not_found') || errorMessage.includes('404') || errorMessage.includes('model:')) {
              // Model not found - fallback to default
              errorMessage = 'The selected AI model is not available. Switching to default model.';
              userMessage = '⚠️ The selected model is unavailable. I\'ve switched to Claude Sonnet 4.5. Please try again.';
              shouldFallbackModel = true;
            }
            
            // Fallback to default model if model not found
            if (shouldFallbackModel) {
              const defaultModel = 'claude-sonnet-4-5-20250929';
              if (state.selectedModel !== defaultModel) {
                setModel(defaultModel);
                toast.info('Switched to Claude Sonnet 4.5');
              }
            }
            
            toast.error(errorMessage);
            
            addMessage({
              role: 'assistant',
              content: userMessage,
              mode: state.activeMode
            });
          }
        );
        
      } catch (error) {
        console.error('Chat error:', error);
        setStreaming(false, '');
        
        // Check for specific error types and show user-friendly messages
        let errorMessage = error.response?.data?.message || error.message || 'Failed to get AI response';
        let userMessage = '❌ Sorry, I encountered an error. Please try again.';
        let shouldFallbackModel = false;
        
        if (errorMessage.includes('overloaded') || errorMessage.includes('temporarily overloaded')) {
          errorMessage = 'The AI service is temporarily overloaded. Please try again in a moment.';
          userMessage = '⚠️ The AI service is temporarily busy. Please wait a moment and try again.';
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
          userMessage = '⏱️ Rate limit reached. Please wait a moment and try again.';
        } else if (errorMessage.includes('not_found') || errorMessage.includes('404') || errorMessage.includes('model:')) {
          // Model not found - fallback to default
          errorMessage = 'The selected AI model is not available. Switching to default model.';
          userMessage = '⚠️ The selected model is unavailable. I\'ve switched to Claude Sonnet 4.5. Please try again.';
          shouldFallbackModel = true;
        }
        
        // Fallback to default model if model not found
        if (shouldFallbackModel) {
          const defaultModel = 'claude-sonnet-4-5-20250929';
          if (state.selectedModel !== defaultModel) {
            setModel(defaultModel);
            toast.info('Switched to Claude Sonnet 4.5');
          }
        }
        
        toast.error(errorMessage);
        
        addMessage({
          role: 'assistant',
          content: userMessage,
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

  // Check if user has AI access (for script work - Writer/Director only)
  // Note: Asset generation (canGenerateAssets) is separate and handled in production pages
  if (!canUseAI && MODE_CONFIG[state.activeMode]?.isAgent) {
    return (
      <div className="flex flex-col h-full bg-base-100 items-center justify-center p-6">
        <div className="text-center max-w-md">
          <MessageSquare className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-[#E5E7EB]">AI Access Required</h3>
          <p className="text-[#9CA3AF] mb-4">
            You need Writer or Director role to use AI chat for script work.
          </p>
          <p className="text-sm text-[#6B7280]">
            Contact the screenplay owner to request access.
          </p>
        </div>
      </div>
    );
  }

  // Handle clicks to close menus, but COMPLETELY allow text selection
  // Don't interfere with text selection at all - only close menus on empty space
  const handleContainerClick = (e) => {
    const target = e.target;
    
    // NEVER interfere with text content areas - allow full text selection
    if (target.closest('.markdown-chat-content') ||
        target.closest('.chat-message-content') ||
        target.closest('pre') ||
        target.closest('code') ||
        target.closest('p') ||
        target.closest('div') && target.closest('.chat-message-content') ||
        target.closest('span') ||
        target.closest('strong') ||
        target.closest('em') ||
        target.closest('ul') ||
        target.closest('ol') ||
        target.closest('li')) {
      // This is text content - don't interfere at all
      return;
    }
    
    // Check if user has text selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // User has text selected - don't interfere
      return;
    }
    
    // Don't close menus if clicking on interactive elements
    if (target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('a') ||
        target.closest('.code-block-copy-btn')) {
      return;
    }
    
    // Only close menus when clicking on truly empty space (background)
    closeMenus();
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#0A0A0A]" 
      onClick={handleContainerClick}
    >

      {/* Selected Text Context Banner - Shows rewrite context */}
      {state.selectedTextContext && (
        <div className="px-4 py-2.5 bg-[#0A0A0A] border-b border-[#3F3F46] flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-[#9333EA] flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-[#E5E7EB]">
                  Rewrite Mode
                </span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-[#9333EA]/70 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-md shadow-lg text-xs text-[#E5E7EB]/80">
                    Selected text will be rewritten. Use quick action buttons below or type custom instructions like "make this more dramatic" or "polish the dialogue".
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#9CA3AF] truncate mt-0.5">
                {state.selectedTextContext.substring(0, 60)}...
              </div>
            </div>
          </div>
          <button
            onClick={() => clearContext()}
            className="p-1 rounded hover:bg-[#1F1F1F] text-[#9CA3AF] hover:text-[#E5E7EB] flex-shrink-0"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Entity Context Banner - Shows what entity you're creating for */}
      {state.entityContextBanner && (
        <div className="px-4 py-2 bg-[#0A0A0A] border-b border-[#3F3F46] flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm text-[#E5E7EB]">
              {state.entityContextBanner.workflow === 'interview' ? 'AI Interview: ' : 'Creating for: '}
              <strong>{state.entityContextBanner.name}</strong> ({state.entityContextBanner.type})
            </span>
          </div>
          <button
            onClick={() => setEntityContextBanner(null)}
            className="p-1 rounded hover:bg-[#1F1F1F] text-[#9CA3AF] hover:text-[#E5E7EB] flex-shrink-0"
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
      {/* Always show input - Character/Location panels use this input but handle sending themselves */}
      <div className="flex-shrink-0 border-t border-[#3F3F46] bg-[#0A0A0A]">
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1F1F1F] rounded-lg text-sm">
                  <Paperclip className="w-3 h-3 text-[#9CA3AF]" />
                  <span className="text-xs font-medium text-[#E5E7EB]">{file.name}</span>
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
          
          {/* Main Input Area - Compact ChatGPT/Claude Style */}
          <div className="w-full px-2 sm:px-3 md:px-4 py-2">
            <div className="relative bg-[#1F1F1F] rounded-lg sm:rounded-xl border border-[#3F3F46] focus-within:border-[#DC143C]/50 focus-within:ring-1 focus-within:ring-[#DC143C]/20 transition-all">
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
                className="w-full min-h-[44px] sm:min-h-[48px] max-h-[160px] sm:max-h-[200px] resize-none bg-transparent text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 text-xs sm:text-sm leading-relaxed tracking-normal pr-20 sm:pr-24"
                rows={1}
                style={{ 
                  border: 'none',
                  boxShadow: 'none'
                }}
              />
              {/* Action Buttons - Compact, vertically centered */}
              <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={handleAttachment}
                  className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#2A2A2A] text-[#9CA3AF] hover:text-[#E5E7EB] transition-all duration-200 ${isUploading ? 'opacity-50' : ''}`}
                  disabled={state.isStreaming || isUploading}
                  title="Attach files"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                {/* Hide microphone on mobile - phones already have built-in voice input */}
                <button
                  onClick={handleVoiceInput}
                  className={`hidden md:flex p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#2A2A2A] text-[#9CA3AF] hover:text-[#E5E7EB] transition-all duration-200 ${isRecording ? 'bg-[#DC143C]/20 text-[#DC143C] animate-pulse' : ''}`}
                  disabled={state.isStreaming || isUploading}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  <Mic className={`w-4 h-4 sm:w-5 sm:h-5 ${isRecording ? 'text-[#DC143C]' : ''}`} />
                </button>
                <button
                  onClick={() => handleSend(state.input)}
                  disabled={!state.input.trim() || state.isStreaming || isUploading}
                  className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-200 ${
                    state.input.trim() && !state.isStreaming && !isUploading
                      ? 'bg-[#DC143C] hover:bg-[#DC143C]/90 text-white shadow-sm'
                      : 'bg-[#1F1F1F] text-[#6B7280] cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  {state.isStreaming ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Bottom Controls - Mode & Model Selector - Compact */}
      <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 flex items-center gap-2 sm:gap-3 text-xs">
        <ModeSelector />
        {/* Only show LLM selector for AI Agents */}
        {MODE_CONFIG[state.activeMode]?.isAgent && <LLMModelSelector />}
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

// 🔥 CRITICAL: Memoize UnifiedChatPanelInner to prevent unnecessary re-renders
// This prevents library components from seeing "changed" props and triggering infinite loops
const UnifiedChatPanelInnerMemo = memo(UnifiedChatPanelInner, (prevProps, nextProps) => {
  // Only re-render if these specific props actually change
  return (
    prevProps.editorContent === nextProps.editorContent &&
    prevProps.cursorPosition === nextProps.cursorPosition &&
    prevProps.onInsert === nextProps.onInsert &&
    prevProps.onWorkflowComplete === nextProps.onWorkflowComplete &&
    prevProps.selectedTextContext === nextProps.selectedTextContext &&
    prevProps.initialPrompt === nextProps.initialPrompt &&
    prevProps.initialMode === nextProps.initialMode
  );
});

export default function UnifiedChatPanel(props) {
  return (
    <ChatProvider initialContext={props.sceneContext}>
      <UnifiedChatPanelInnerMemo {...props} />
    </ChatProvider>
  );
}
