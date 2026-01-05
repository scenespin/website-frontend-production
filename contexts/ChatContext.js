'use client';

import { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

// ============================================================================
// TYPES
// ============================================================================

const AGENT_MODES = ['image', 'quick-video', 'audio', 'try-on', 'chat', 'workflows'];

// ============================================================================
// STATE INTERFACE
// ============================================================================

const initialState = {
  // Messages
  messages: [],
  streamingText: '',
  isStreaming: false,
  
  // Mode
  activeMode: 'chat',
  selectedModel: 'claude-sonnet-4-5-20250929',
  
  // Input
  input: '',
  attachedFiles: [],
  inputPlaceholder: 'Type your message...',
  
  // Context
  selectedTextContext: null,
  selectionRange: null,
  sceneContext: null,
  autoContext: null,
  contextEnabled: true,
  wasInRewriteMode: false,
  
  // Workflow (AI interviews)
  activeWorkflow: null, // { type: 'character' | 'location' | 'scene', questionIndex: number }
  workflowCompletionData: null, // { type, parsedData, aiResponse }
  
  // Entity context
  entityContextBanner: null, // { type, id, name, workflow }
  
  // UI State
  showModeMenu: false,
  showSettingsMenu: false,
};

// ============================================================================
// REDUCER
// ============================================================================

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
      
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };
      
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: []
      };
      
    case 'CLEAR_MESSAGES_FOR_MODE':
      return {
        ...state,
        messages: state.messages.filter(m => m.mode !== action.payload)
      };
      
    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload.isStreaming,
        streamingText: action.payload.streamingText
      };
      
    case 'SET_MODE':
      return {
        ...state,
        activeMode: action.payload,
        showModeMenu: false
      };
      
    case 'SET_MODEL':
      return {
        ...state,
        selectedModel: action.payload
      };
      
    case 'SET_INPUT':
      return {
        ...state,
        input: action.payload
      };
      
    case 'SET_PLACEHOLDER':
      return {
        ...state,
        inputPlaceholder: action.payload
      };
      
    case 'SET_ATTACHED_FILES':
      return {
        ...state,
        attachedFiles: action.payload
      };
      
    case 'ADD_ATTACHED_FILE':
      return {
        ...state,
        attachedFiles: [...state.attachedFiles, action.payload]
      };
      
    case 'REMOVE_ATTACHED_FILE':
      return {
        ...state,
        attachedFiles: state.attachedFiles.filter((_, i) => i !== action.payload)
      };
      
    case 'SET_SELECTED_TEXT_CONTEXT':
      return {
        ...state,
        selectedTextContext: action.payload.text,
        selectionRange: action.payload.range
      };
      
    case 'SET_SCENE_CONTEXT':
      return {
        ...state,
        sceneContext: action.payload
      };
      
    case 'SET_AUTO_CONTEXT':
      return {
        ...state,
        autoContext: action.payload
      };
      
    case 'SET_CONTEXT_ENABLED':
      return {
        ...state,
        contextEnabled: action.payload
      };
      
    case 'SET_WAS_IN_REWRITE_MODE':
      return {
        ...state,
        wasInRewriteMode: action.payload
      };
      
    case 'CLEAR_CONTEXT':
      return {
        ...state,
        selectedTextContext: null,
        selectionRange: null,
        sceneContext: null,
        wasInRewriteMode: false
      };
      
    case 'SET_WORKFLOW':
      return {
        ...state,
        activeWorkflow: action.payload
      };
      
    case 'SET_WORKFLOW_COMPLETION':
      return {
        ...state,
        workflowCompletionData: action.payload
      };
      
    case 'CLEAR_WORKFLOW':
      return {
        ...state,
        activeWorkflow: null,
        workflowCompletionData: null,
        inputPlaceholder: 'Type your message...'
      };
      
    case 'SET_ENTITY_CONTEXT_BANNER':
      return {
        ...state,
        entityContextBanner: action.payload
      };
      
    case 'TOGGLE_MODE_MENU':
      return {
        ...state,
        showModeMenu: !state.showModeMenu,
        showSettingsMenu: false
      };
      
    case 'TOGGLE_SETTINGS_MENU':
      return {
        ...state,
        showSettingsMenu: !state.showSettingsMenu,
        showModeMenu: false
      };
      
    case 'CLOSE_MENUS':
      return {
        ...state,
        showModeMenu: false,
        showSettingsMenu: false
      };
      
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const ChatContext = createContext(undefined);

export function ChatProvider({ children, initialContext = null }) {
  const { user, isSignedIn } = useUser();
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    sceneContext: initialContext || null
  });
  const hasLoadedFromStorage = useRef(false);
  
  // Session storage key for Story Advisor chat history
  const getStorageKey = () => {
    if (!user?.id) return null;
    return `story-advisor-chat-history-${user.id}`;
  };
  
  // Load chat history from sessionStorage on mount (only for logged-in users)
  useEffect(() => {
    if (!isSignedIn || !user?.id || hasLoadedFromStorage.current) return;
    
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    try {
      const savedHistory = sessionStorage.getItem(storageKey);
      if (savedHistory) {
        const parsedMessages = JSON.parse(savedHistory);
        // Only load messages for 'chat' mode (Story Advisor)
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          console.log('[ChatContext] Loading chat history from sessionStorage:', parsedMessages.length, 'messages');
          dispatch({ type: 'SET_MESSAGES', payload: parsedMessages });
        }
      }
      // Mark as loaded even if no history exists, so new messages can be saved
      hasLoadedFromStorage.current = true;
    } catch (error) {
      console.error('[ChatContext] Error loading chat history from sessionStorage:', error);
      // Clear corrupted data
      sessionStorage.removeItem(storageKey);
      // Still mark as loaded so new messages can be saved
      hasLoadedFromStorage.current = true;
    }
  }, [isSignedIn, user?.id]);
  
  // Save chat history to sessionStorage whenever messages change (only for logged-in users)
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    
    // If we haven't loaded from storage yet, mark as loaded so we can start saving
    // This handles the case where user sends a message before history loads
    if (!hasLoadedFromStorage.current) {
      hasLoadedFromStorage.current = true;
    }
    
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    try {
      // Only save messages for 'chat' mode (Story Advisor)
      const chatMessages = state.messages.filter(m => m.mode === 'chat');
      
      if (chatMessages.length > 0) {
        sessionStorage.setItem(storageKey, JSON.stringify(chatMessages));
        console.log('[ChatContext] Saved chat history to sessionStorage:', chatMessages.length, 'messages');
      } else {
        // Clear storage if no messages
        sessionStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('[ChatContext] Error saving chat history to sessionStorage:', error);
      // Handle quota exceeded error gracefully
      if (error.name === 'QuotaExceededError') {
        console.warn('[ChatContext] SessionStorage quota exceeded, clearing old history');
        try {
          // Try to clear and save only the last 20 messages
          const chatMessages = state.messages.filter(m => m.mode === 'chat');
          const recentMessages = chatMessages.slice(-20);
          sessionStorage.setItem(storageKey, JSON.stringify(recentMessages));
        } catch (retryError) {
          console.error('[ChatContext] Failed to save even reduced history:', retryError);
        }
      }
    }
  }, [state.messages, isSignedIn, user?.id]);
  
  // Clear storage when user signs out
  useEffect(() => {
    if (!isSignedIn && hasLoadedFromStorage.current) {
      // User signed out - clear the loaded flag so history can be loaded again if they sign back in
      hasLoadedFromStorage.current = false;
    }
  }, [isSignedIn]);
  
  // Message actions
  const addMessage = useCallback((message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);
  
  const setMessages = useCallback((messages) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);
  
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);
  
  const clearMessagesForMode = useCallback((mode) => {
    dispatch({ type: 'CLEAR_MESSAGES_FOR_MODE', payload: mode });
  }, []);
  
  // Streaming actions
  const setStreaming = useCallback((isStreaming, streamingText) => {
    dispatch({ type: 'SET_STREAMING', payload: { isStreaming, streamingText } });
  }, []);
  
  // Mode actions
  const setMode = useCallback((mode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);
  
  const setModel = useCallback((model) => {
    dispatch({ type: 'SET_MODEL', payload: model });
  }, []);
  
  // Input actions
  const setInput = useCallback((input) => {
    dispatch({ type: 'SET_INPUT', payload: input });
  }, []);
  
  const setPlaceholder = useCallback((placeholder) => {
    dispatch({ type: 'SET_PLACEHOLDER', payload: placeholder });
  }, []);
  
  const setAttachedFiles = useCallback((files) => {
    dispatch({ type: 'SET_ATTACHED_FILES', payload: files });
  }, []);
  
  const addAttachedFile = useCallback((file) => {
    dispatch({ type: 'ADD_ATTACHED_FILE', payload: file });
  }, []);
  
  const removeAttachedFile = useCallback((index) => {
    dispatch({ type: 'REMOVE_ATTACHED_FILE', payload: index });
  }, []);
  
  // Context actions
  const setSelectedTextContext = useCallback((text, range) => {
    dispatch({ type: 'SET_SELECTED_TEXT_CONTEXT', payload: { text, range } });
  }, []);
  
  const setSceneContext = useCallback((context) => {
    dispatch({ type: 'SET_SCENE_CONTEXT', payload: context });
  }, []);
  
  const setAutoContext = useCallback((context) => {
    dispatch({ type: 'SET_AUTO_CONTEXT', payload: context });
  }, []);
  
  const setContextEnabled = useCallback((enabled) => {
    dispatch({ type: 'SET_CONTEXT_ENABLED', payload: enabled });
  }, []);
  
  const setWasInRewriteMode = useCallback((was) => {
    dispatch({ type: 'SET_WAS_IN_REWRITE_MODE', payload: was });
  }, []);
  
  const clearContext = useCallback(() => {
    dispatch({ type: 'CLEAR_CONTEXT' });
  }, []);
  
  // Workflow actions
  const setWorkflow = useCallback((workflow) => {
    dispatch({ type: 'SET_WORKFLOW', payload: workflow });
  }, []);
  
  const setWorkflowCompletion = useCallback((data) => {
    dispatch({ type: 'SET_WORKFLOW_COMPLETION', payload: data });
  }, []);
  
  const clearWorkflow = useCallback(() => {
    dispatch({ type: 'CLEAR_WORKFLOW' });
  }, []);
  
  // Entity context actions
  const setEntityContextBanner = useCallback((entity) => {
    dispatch({ type: 'SET_ENTITY_CONTEXT_BANNER', payload: entity });
  }, []);
  
  // UI actions
  const toggleModeMenu = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODE_MENU' });
  }, []);
  
  const toggleSettingsMenu = useCallback(() => {
    dispatch({ type: 'TOGGLE_SETTINGS_MENU' });
  }, []);
  
  const closeMenus = useCallback(() => {
    dispatch({ type: 'CLOSE_MENUS' });
  }, []);
  
  // 🔥 CRITICAL FIX: Memoize the context value to prevent infinite re-renders
  // The value object was being recreated on every render, causing all consumers to re-render
  // Only include 'state' in dependencies - all functions are already memoized with useCallback
  const value = useMemo(() => ({
    state,
    addMessage,
    setMessages,
    clearMessages,
    clearMessagesForMode,
    setStreaming,
    setMode,
    setModel,
    setInput,
    setPlaceholder,
    setAttachedFiles,
    addAttachedFile,
    removeAttachedFile,
    setSelectedTextContext,
    setSceneContext,
    setAutoContext,
    setContextEnabled,
    setWasInRewriteMode,
    clearContext,
    setWorkflow,
    setWorkflowCompletion,
    clearWorkflow,
    setEntityContextBanner,
    toggleModeMenu,
    toggleSettingsMenu,
    closeMenus,
  }), [state]); // Only state changes - all functions are stable (useCallback with empty deps)
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

export { ChatContext };

