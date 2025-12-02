'use client';

import { useState, useCallback } from 'react';
import { secureFetch } from '@/utils/api';

export interface AgentCallOptions {
    endpoint: string;
    body: Record<string, unknown>;
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
}

export interface AgentCallState {
    isLoading: boolean;
    error: string | null;
    data: unknown | null;
}

/**
 * Custom hook for calling AI agent endpoints
 * 
 * Provides loading state, error handling, and automatic credit balance updates
 * 
 * @example
 * const { callAgent, isLoading, error, data } = useAgentCall();
 * 
 * const handleGenerate = () => {
 *   callAgent({
 *     endpoint: '/api/dialogue/generate',
 *     body: { prompt: 'Two characters meet', desiredModelId: 'gemini-2.0-flash-001' },
 *     onSuccess: (response) => console.log('Generated:', response)
 *   });
 * };
 */
export function useAgentCall() {
    const [state, setState] = useState<AgentCallState>({
        isLoading: false,
        error: null,
        data: null
    });
    
    const callAgent = useCallback(async ({
        endpoint,
        body,
        onSuccess,
        onError
    }: AgentCallOptions) => {
        setState({ isLoading: true, error: null, data: null });
        
        try {
            const response = await secureFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            setState({
                isLoading: false,
                error: null,
                data: response
            });
            
            if (onSuccess) {
                onSuccess(response);
            }
            
            return response;
            
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error occurred');
            
            setState({
                isLoading: false,
                error: error.message,
                data: null
            });
            
            if (onError) {
                onError(error);
            }
            
            throw error;
        }
    }, []);
    
    const reset = useCallback(() => {
        setState({ isLoading: false, error: null, data: null });
    }, []);
    
    return {
        ...state,
        callAgent,
        reset
    };
}

/**
 * Hook specifically for Director Agent (dialogue/scene generation)
 */
export function useDirectorAgent() {
    const { callAgent, ...state } = useAgentCall();
    
    const generateScene = useCallback(async (
        prompt: string,
        modelId: string,
        options?: { systemPrompt?: string; temperature?: number }
    ) => {
        return callAgent({
            endpoint: '/api/dialogue/generate',
            body: {
                userPrompt: prompt,
                desiredModelId: modelId,
                scriptContext: options?.systemPrompt
            }
        });
    }, [callAgent]);
    
    return {
        ...state,
        generateScene
    };
}

/**
 * Hook specifically for Screenwriting Agent (multi-turn chat)
 */
export function useChatAgent() {
    const { callAgent, ...state } = useAgentCall();
    
    const sendMessage = useCallback(async (
        userMessage: string,
        chatHistory: Array<{ role: string; content: string }>,
        modelId: string,
        options?: { systemPrompt?: string; temperature?: number }
    ) => {
        return callAgent({
            endpoint: '/api/chat/generate',
            body: {
                userPrompt: userMessage,
                conversationHistory: chatHistory,
                desiredModelId: modelId,
                ...(options?.systemPrompt && { systemPrompt: options.systemPrompt }),
                ...(options?.temperature && { temperature: options.temperature })
            }
        });
    }, [callAgent]);
    
    return {
        ...state,
        sendMessage
    };
}

/**
 * Hook specifically for Precision Editor (rewrite)
 */
export function useEditorAgent() {
    const { callAgent, ...state } = useAgentCall();
    
    const rewrite = useCallback(async (
        originalText: string,
        instructions: string,
        modelId: string,
        options?: { temperature?: number }
    ) => {
        return callAgent({
            endpoint: '/api/rewrite',
            body: {
                selectedText: originalText,
                instruction: instructions,
                desiredModelId: modelId
            }
        });
    }, [callAgent]);
    
    return {
        ...state,
        rewrite
    };
}

/**
 * Hook specifically for Image Generation
 */
export function useImageGenerator() {
    const { callAgent, ...state } = useAgentCall();
    
    const generateImage = useCallback(async (
        prompt: string,
        modelId: string,  // This is actually the providerId now (e.g., 'photon-1', 'imagen-3')
        options?: { 
            style?: string; 
            size?: string; 
            quality?: string;
            entityType?: 'character' | 'location' | 'asset';
            entityId?: string;
            projectId?: string;
        }
    ) => {
        return callAgent({
            endpoint: '/api/image/generate',
            body: {
                prompt,
                providerId: modelId,        // NEW: Use providerId (Feature 0058)
                desiredModelId: modelId,    // LEGACY: Keep for backwards compatibility
                style: options?.style,
                size: options?.size,
                quality: options?.quality,
                // NEW: Optional entity context for job tracking
                entityType: options?.entityType,
                entityId: options?.entityId,
                projectId: options?.projectId
            }
        });
    }, [callAgent]);
    
    return {
        ...state,
        generateImage
    };
}

/**
 * Hook specifically for Image Editing
 */
export function useImageEditor() {
    const { callAgent, ...state } = useAgentCall();
    
    const editImage = useCallback(async (
        sourceImageUrl: string,
        editPrompt: string,
        modelId?: string
    ) => {
        return callAgent({
            endpoint: '/api/image/edit',
            body: {
                sourceImageUrl,
                editPrompt,
                desiredModelId: modelId || 'nano-banana'
            }
        });
    }, [callAgent]);
    
    return {
        ...state,
        editImage
    };
}

/**
 * Hook for Image-Entity Association operations
 */
export function useImageAssociation() {
    const { callAgent, ...state } = useAgentCall();
    
    const associateImage = useCallback(async (
        imageUrl: string,
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string,
        metadata?: { prompt?: string; modelUsed?: string }
    ) => {
        return callAgent({
            endpoint: '/api/image/associate',
            body: {
                imageUrl,
                entityType,
                entityId,
                metadata
            }
        });
    }, [callAgent]);
    
    const getEntityImages = useCallback(async (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string
    ) => {
        return callAgent({
            endpoint: `/api/image/entity/${entityType}/${entityId}`,
            body: {}
        });
    }, [callAgent]);
    
    const dissociateImage = useCallback(async (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string,
        imageIndex: number
    ) => {
        return callAgent({
            endpoint: `/api/image/entity/${entityType}/${entityId}/${imageIndex}`,
            body: {}
        });
    }, [callAgent]);
    
    return {
        ...state,
        associateImage,
        getEntityImages,
        dissociateImage
    };
}

