/**
 * Chat Context - Shared state management for UnifiedChatPanel
 * 
 * This context provides shared state across all chat modes including:
 * - Messages and streaming
 * - Active mode selection
 * - Input and attachments
 * - Context awareness (selected text, scene context)
 * - Workflow state (AI interviews)
 */

'use client';

import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import type {
    AgentMode,
    Message,
    SceneContext,
    AutoContext,
    EntityContext,
    WorkflowState
} from '../shared/types';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ChatContextState {
    // Messages
    messages: Message[];
    streamingText: string;
    isStreaming: boolean;
    
    // Mode
    activeMode: AgentMode;
    selectedModel: string;
    
    // Input
    input: string;
    attachedFiles: File[];
    inputPlaceholder: string;
    
    // Context
    selectedTextContext: string | null;
    selectionRange: { start: number; end: number } | null;
    sceneContext: SceneContext | null;
    autoContext: AutoContext | null;
    contextEnabled: boolean;
    wasInRewriteMode: boolean;
    
    // Workflow (AI interviews)
    activeWorkflow: WorkflowState['activeWorkflow'];
    workflowCompletionData: WorkflowState['workflowCompletionData'];
    
    // Entity context
    entityContextBanner: EntityContext | null;
    
    // UI State
    showModeMenu: boolean;
    showSettingsMenu: boolean;
}

// ============================================================================
// ACTIONS
// ============================================================================

type ChatAction =
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'SET_MESSAGES'; payload: Message[] }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'SET_STREAMING'; payload: { isStreaming: boolean; streamingText: string } }
    | { type: 'SET_MODE'; payload: AgentMode }
    | { type: 'SET_MODEL'; payload: string }
    | { type: 'SET_INPUT'; payload: string }
    | { type: 'SET_PLACEHOLDER'; payload: string }
    | { type: 'SET_ATTACHED_FILES'; payload: File[] }
    | { type: 'ADD_ATTACHED_FILE'; payload: File }
    | { type: 'REMOVE_ATTACHED_FILE'; payload: number }
    | { type: 'SET_SELECTED_TEXT_CONTEXT'; payload: { text: string | null; range: { start: number; end: number } | null } }
    | { type: 'SET_SCENE_CONTEXT'; payload: SceneContext | null }
    | { type: 'SET_AUTO_CONTEXT'; payload: AutoContext | null }
    | { type: 'SET_CONTEXT_ENABLED'; payload: boolean }
    | { type: 'SET_WAS_IN_REWRITE_MODE'; payload: boolean }
    | { type: 'CLEAR_CONTEXT' }
    | { type: 'SET_WORKFLOW'; payload: WorkflowState['activeWorkflow'] }
    | { type: 'SET_WORKFLOW_COMPLETION'; payload: WorkflowState['workflowCompletionData'] }
    | { type: 'CLEAR_WORKFLOW' }
    | { type: 'SET_ENTITY_CONTEXT_BANNER'; payload: EntityContext | null }
    | { type: 'TOGGLE_MODE_MENU' }
    | { type: 'TOGGLE_SETTINGS_MENU' }
    | { type: 'CLOSE_MENUS' };

// ============================================================================
// REDUCER
// ============================================================================

const initialState: ChatContextState = {
    messages: [],
    streamingText: '',
    isStreaming: false,
    activeMode: 'chat',
    selectedModel: 'claude-sonnet-4-5-20250929',
    input: '',
    attachedFiles: [],
    inputPlaceholder: 'Type your message...',
    selectedTextContext: null,
    selectionRange: null,
    sceneContext: null,
    autoContext: null,
    contextEnabled: true,
    wasInRewriteMode: false,
    activeWorkflow: null,
    workflowCompletionData: null,
    entityContextBanner: null,
    showModeMenu: false,
    showSettingsMenu: false,
};

function chatReducer(state: ChatContextState, action: ChatAction): ChatContextState {
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

interface ChatContextValue {
    state: ChatContextState;
    
    // Message actions
    addMessage: (message: Message) => void;
    setMessages: (messages: Message[]) => void;
    clearMessages: () => void;
    
    // Streaming actions
    setStreaming: (isStreaming: boolean, streamingText: string) => void;
    
    // Mode actions
    setMode: (mode: AgentMode) => void;
    setModel: (model: string) => void;
    
    // Input actions
    setInput: (input: string) => void;
    setPlaceholder: (placeholder: string) => void;
    setAttachedFiles: (files: File[]) => void;
    addAttachedFile: (file: File) => void;
    removeAttachedFile: (index: number) => void;
    
    // Context actions
    setSelectedTextContext: (text: string | null, range: { start: number; end: number } | null) => void;
    setSceneContext: (context: SceneContext | null) => void;
    setAutoContext: (context: AutoContext | null) => void;
    setContextEnabled: (enabled: boolean) => void;
    setWasInRewriteMode: (was: boolean) => void;
    clearContext: () => void;
    
    // Workflow actions
    setWorkflow: (workflow: WorkflowState['activeWorkflow']) => void;
    setWorkflowCompletion: (data: WorkflowState['workflowCompletionData']) => void;
    clearWorkflow: () => void;
    
    // Entity context actions
    setEntityContextBanner: (entity: EntityContext | null) => void;
    
    // UI actions
    toggleModeMenu: () => void;
    toggleSettingsMenu: () => void;
    closeMenus: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface ChatProviderProps {
    children: ReactNode;
    initialContext?: SceneContext | null;
}

export function ChatProvider({ children, initialContext }: ChatProviderProps) {
    const [state, dispatch] = useReducer(chatReducer, {
        ...initialState,
        sceneContext: initialContext || null
    });
    
    // Message actions
    const addMessage = useCallback((message: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
    }, []);
    
    const setMessages = useCallback((messages: Message[]) => {
        dispatch({ type: 'SET_MESSAGES', payload: messages });
    }, []);
    
    const clearMessages = useCallback(() => {
        dispatch({ type: 'CLEAR_MESSAGES' });
    }, []);
    
    // Streaming actions
    const setStreaming = useCallback((isStreaming: boolean, streamingText: string) => {
        dispatch({ type: 'SET_STREAMING', payload: { isStreaming, streamingText } });
    }, []);
    
    // Mode actions
    const setMode = useCallback((mode: AgentMode) => {
        dispatch({ type: 'SET_MODE', payload: mode });
    }, []);
    
    const setModel = useCallback((model: string) => {
        dispatch({ type: 'SET_MODEL', payload: model });
    }, []);
    
    // Input actions
    const setInput = useCallback((input: string) => {
        dispatch({ type: 'SET_INPUT', payload: input });
    }, []);
    
    const setPlaceholder = useCallback((placeholder: string) => {
        dispatch({ type: 'SET_PLACEHOLDER', payload: placeholder });
    }, []);
    
    const setAttachedFiles = useCallback((files: File[]) => {
        dispatch({ type: 'SET_ATTACHED_FILES', payload: files });
    }, []);
    
    const addAttachedFile = useCallback((file: File) => {
        dispatch({ type: 'ADD_ATTACHED_FILE', payload: file });
    }, []);
    
    const removeAttachedFile = useCallback((index: number) => {
        dispatch({ type: 'REMOVE_ATTACHED_FILE', payload: index });
    }, []);
    
    // Context actions
    const setSelectedTextContext = useCallback((text: string | null, range: { start: number; end: number } | null) => {
        dispatch({ type: 'SET_SELECTED_TEXT_CONTEXT', payload: { text, range } });
    }, []);
    
    const setSceneContext = useCallback((context: SceneContext | null) => {
        dispatch({ type: 'SET_SCENE_CONTEXT', payload: context });
    }, []);
    
    const setAutoContext = useCallback((context: AutoContext | null) => {
        dispatch({ type: 'SET_AUTO_CONTEXT', payload: context });
    }, []);
    
    const setContextEnabled = useCallback((enabled: boolean) => {
        dispatch({ type: 'SET_CONTEXT_ENABLED', payload: enabled });
    }, []);
    
    const setWasInRewriteMode = useCallback((was: boolean) => {
        dispatch({ type: 'SET_WAS_IN_REWRITE_MODE', payload: was });
    }, []);
    
    const clearContext = useCallback(() => {
        dispatch({ type: 'CLEAR_CONTEXT' });
    }, []);
    
    // Workflow actions
    const setWorkflow = useCallback((workflow: WorkflowState['activeWorkflow']) => {
        dispatch({ type: 'SET_WORKFLOW', payload: workflow });
    }, []);
    
    const setWorkflowCompletion = useCallback((data: WorkflowState['workflowCompletionData']) => {
        dispatch({ type: 'SET_WORKFLOW_COMPLETION', payload: data });
    }, []);
    
    const clearWorkflow = useCallback(() => {
        dispatch({ type: 'CLEAR_WORKFLOW' });
    }, []);
    
    // Entity context actions
    const setEntityContextBanner = useCallback((entity: EntityContext | null) => {
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
    
    const value: ChatContextValue = {
        state,
        addMessage,
        setMessages,
        clearMessages,
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
    };
    
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

export { ChatContext };
export type { ChatContextValue, ChatContextState };

