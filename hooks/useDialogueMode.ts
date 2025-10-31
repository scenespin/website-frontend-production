/**
 * useDialogueMode Hook
 * 
 * Manages dialogue generation state and logic.
 * Provides quick generation and guided interview workflows.
 */

'use client';

import { useState, useCallback } from 'react';
import { useChatAgent } from '@/hooks/useAgentCall';
import { generateQuickDialoguePrompt, generateGuidedDialoguePrompt } from '@/utils/dialoguePrompts';

// ============================================================================
// TYPES
// ============================================================================

export interface DialogueContext {
    sceneHeading: string;
    act: number;
    characters: Array<{
        id: string;
        name: string;
    }>;
    conflict: string;
    tone: string;
}

export interface DialogueModeState {
    context: DialogueContext;
    isGenerating: boolean;
    error: string | null;
}

export interface DialogueModeActions {
    // Context management
    updateContext: (field: keyof DialogueContext, value: any) => void;
    setContext: (context: DialogueContext) => void;
    
    // Generation
    generateQuick: (context: DialogueContext, chatHistory: any[], model: string) => Promise<string>;
    generateGuided: (chatHistory: any[], model: string) => Promise<string>;
    
    // Reset
    reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDialogueMode(): DialogueModeState & DialogueModeActions {
    const [context, setContextState] = useState<DialogueContext>({
        sceneHeading: '',
        act: 1,
        characters: [],
        conflict: '',
        tone: 'tense'
    });
    
    const [error, setError] = useState<string | null>(null);
    
    const { sendMessage, isLoading } = useChatAgent();
    
    // Update a specific field in the context
    const updateContext = useCallback((field: keyof DialogueContext, value: any) => {
        setContextState(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);
    
    // Set entire context
    const setContext = useCallback((newContext: DialogueContext) => {
        setContextState(newContext);
    }, []);
    
    // Generate quick dialogue (with pre-filled context)
    const generateQuick = useCallback(async (
        dialogueContext: DialogueContext,
        chatHistory: any[],
        model: string
    ): Promise<string> => {
        setError(null);
        
        try {
            console.log('[useDialogueMode] Quick generate:', dialogueContext);
            
            // Build the prompt using utility function
            const prompt = generateQuickDialoguePrompt(dialogueContext);
            
            // Send to AI
            const response = await sendMessage(prompt, chatHistory, model);
            
            if (typeof response === 'object' && response !== null) {
                const data = response as any;
                return data.content || data.text || String(response);
            }
            
            return String(response);
        } catch (err: any) {
            console.error('[useDialogueMode] Quick generate failed:', err);
            setError(err.message || 'Dialogue generation failed');
            throw err;
        }
    }, [sendMessage]);
    
    // Generate guided dialogue (AI interview)
    const generateGuided = useCallback(async (
        chatHistory: any[],
        model: string
    ): Promise<string> => {
        setError(null);
        
        try {
            console.log('[useDialogueMode] Guided interview');
            
            // Build the guided interview prompt
            const prompt = generateGuidedDialoguePrompt();
            
            // Send to AI
            const response = await sendMessage(prompt, chatHistory, model);
            
            if (typeof response === 'object' && response !== null) {
                const data = response as any;
                return data.content || data.text || String(response);
            }
            
            return String(response);
        } catch (err: any) {
            console.error('[useDialogueMode] Guided interview failed:', err);
            setError(err.message || 'Dialogue generation failed');
            throw err;
        }
    }, [sendMessage]);
    
    // Reset all state
    const reset = useCallback(() => {
        setContextState({
            sceneHeading: '',
            act: 1,
            characters: [],
            conflict: '',
            tone: 'tense'
        });
        setError(null);
    }, []);
    
    return {
        // State
        context,
        isGenerating: isLoading,
        error,
        
        // Actions
        updateContext,
        setContext,
        generateQuick,
        generateGuided,
        reset,
    };
}

