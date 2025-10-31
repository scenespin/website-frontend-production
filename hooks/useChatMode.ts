/**
 * useChatMode Hook
 * 
 * Manages state and logic for Chat Mode, including:
 * - AI interviews/workflows (character, location, scene)
 * - Regular chat with context-awareness
 * - Content vs advice detection
 * - Workflow completion handling
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChatContext } from '@/components/agents/context/useChatContext';
import type { Message, WorkflowCompletionData } from '@/components/agents/shared/types';
import { getWorkflow, type WorkflowConfig } from '@/utils/aiWorkflows';
import { parseAIResponse } from '@/utils/aiResponseParser';
import { streamText } from '@/components/agents/shared/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface UseChatModeReturn {
    // Workflow state
    activeWorkflow: { type: 'character' | 'location' | 'scene'; questionIndex: number } | null;
    workflowCompletionData: WorkflowCompletionData | null;
    inputPlaceholder: string;
    
    // Actions
    startWorkflow: (type: 'character' | 'location' | 'scene') => void;
    clearWorkflowCompletion: () => void;
    handleWorkflowInsertion: () => void;
    
    // Helpers
    isScreenplayContent: (content: string) => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useChatMode(): UseChatModeReturn {
    const chatContext = useChatContext();
    const state = chatContext.state;
    
    // Workflow state
    const [activeWorkflow, setActiveWorkflow] = useState<{ 
        type: 'character' | 'location' | 'scene'; 
        questionIndex: number 
    } | null>(state.activeWorkflow);
    
    const [workflowCompletionData, setWorkflowCompletionData] = useState<WorkflowCompletionData | null>(
        state.workflowCompletionData
    );
    
    const [inputPlaceholder, setInputPlaceholder] = useState<string>(state.inputPlaceholder);
    
    // ============================================================================
    // WORKFLOW MANAGEMENT
    // ============================================================================
    
    /**
     * Start an AI interview workflow
     */
    const startWorkflow = useCallback(async (type: 'character' | 'location' | 'scene') => {
        console.log('[useChatMode] Starting workflow:', type);
        
        try {
            const workflow = getWorkflow(type);
            
            // Add first AI question to messages
            const firstQuestion = workflow.questions[0];
            chatContext.addMessage({
                role: 'assistant',
                content: firstQuestion.question,
                mode: 'chat'
            });
            
            // Set placeholder to example answer
            setInputPlaceholder(firstQuestion.placeholder);
            chatContext.setPlaceholder(firstQuestion.placeholder);
            
            // Set active workflow
            const workflowState = {
                type,
                questionIndex: 0
            };
            setActiveWorkflow(workflowState);
            chatContext.setWorkflow(workflowState);
            
            // Switch to chat mode
            chatContext.setMode('chat');
            
            console.log('[useChatMode] Workflow started successfully');
        } catch (error) {
            console.error('[useChatMode] Failed to start workflow:', error);
            
            // Fallback: switch to regular chat mode
            chatContext.setMode('chat');
            chatContext.addMessage({
                role: 'assistant',
                content: `I'm ready to help you create a ${type}. What would you like to know?`,
                mode: 'chat'
            });
        }
    }, [chatContext]);
    
    /**
     * Progress to next workflow question or complete workflow
     */
    const progressWorkflow = useCallback(async (
        aiResponse: string,
        workflowConfig: WorkflowConfig
    ) => {
        if (!activeWorkflow) return;
        
        const currentQuestionIndex = activeWorkflow.questionIndex;
        const totalQuestions = workflowConfig.questions.length;
        
        console.log('[useChatMode] Workflow progress:', currentQuestionIndex + 1, 'of', totalQuestions);
        
        if (currentQuestionIndex < totalQuestions - 1) {
            // More questions to ask
            const nextIndex = currentQuestionIndex + 1;
            const nextQuestion = workflowConfig.questions[nextIndex];
            
            console.log('[useChatMode] Asking next question:', nextQuestion.question);
            
            // Update workflow state
            const newWorkflowState = {
                ...activeWorkflow,
                questionIndex: nextIndex
            };
            setActiveWorkflow(newWorkflowState);
            chatContext.setWorkflow(newWorkflowState);
            
            // Update placeholder to next example
            setInputPlaceholder(nextQuestion.placeholder);
            chatContext.setPlaceholder(nextQuestion.placeholder);
            
            // Add next question as AI message
            chatContext.addMessage({
                role: 'assistant',
                content: nextQuestion.question,
                mode: 'chat'
            });
        } else {
            // All questions answered - workflow complete
            console.log('[useChatMode] Workflow complete! All questions answered.');
            
            // Parse the final AI response
            const workflowType = activeWorkflow.type;
            const parsedData = parseAIResponse(aiResponse, workflowType);
            
            console.log('[useChatMode] Parsed workflow data:', parsedData);
            
            // Store completion data
            const completionData: WorkflowCompletionData = {
                type: workflowType,
                parsedData,
                aiResponse
            };
            setWorkflowCompletionData(completionData);
            chatContext.setWorkflowCompletion(completionData);
            
            // Clean up workflow state
            setActiveWorkflow(null);
            chatContext.setWorkflow(null);
            setInputPlaceholder('Type your message...');
            chatContext.setPlaceholder('Type your message...');
            
            // Add a completion message with action button
            setTimeout(() => {
                chatContext.addMessage({
                    role: 'assistant',
                    content: `✅ ${workflowType.charAt(0).toUpperCase() + workflowType.slice(1)} profile complete! ${
                        parsedData 
                            ? 'Click "Insert & Create" below to fill out the form automatically.' 
                            : 'You can now use this content to fill out your form, or ask me to make any adjustments.'
                    }`,
                    mode: 'chat'
                });
            }, 1000);
        }
    }, [activeWorkflow, chatContext]);
    
    /**
     * Clear workflow completion data
     */
    const clearWorkflowCompletion = useCallback(() => {
        setWorkflowCompletionData(null);
        chatContext.setWorkflowCompletion(null);
    }, [chatContext]);
    
    /**
     * Handle "Insert & Create" button click
     */
    const handleWorkflowInsertion = useCallback(() => {
        if (!workflowCompletionData) return;
        
        console.log('[useChatMode] Inserting workflow data:', workflowCompletionData);
        
        // Trigger the parent callback with completion data
        // The parent (DesktopWritingLayout) will handle opening the appropriate sidebar
        // NOTE: This will be connected via props in the ChatModePanel
        
        // Clear the completion data after insertion
        clearWorkflowCompletion();
    }, [workflowCompletionData, clearWorkflowCompletion]);
    
    // ============================================================================
    // CONTENT DETECTION
    // ============================================================================
    
    /**
     * Helper function to detect if content is screenplay text (not discussion/advice)
     * INVERTED LOGIC: Assume it's screenplay UNLESS it's clearly advice/discussion
     */
    const isScreenplayContent = useCallback((content: string): boolean => {
        // Trim for accurate detection
        const trimmed = content.trim();
        
        // Empty or very short responses are probably not useful
        if (trimmed.length < 20) {
            return false;
        }
        
        // Check for CLEAR non-screenplay indicators (advice, discussion, questions)
        
        // 1. Questions (asking user for input)
        const hasQuestions = /\?/g.test(trimmed) && (trimmed.match(/\?/g) || []).length >= 2;
        const startsWithQuestion = /^(How|What|Where|When|Why|Should|Would|Could|Can|Do you|Are you|Is this)/i.test(trimmed);
        
        // 2. Advice/instruction language
        const hasAdviceLanguage = /\b(you should|you could|you might|try to|consider|think about|let me know|if you want|would you like|feel free|here to help|happy to help)\b/i.test(trimmed);
        
        // 3. Lists (numbered or bulleted)
        const hasNumberedList = /^\d+\./m.test(trimmed);
        const hasBulletPoints = /^[-•*]\s/m.test(trimmed);
        
        // 4. Explanation/meta-commentary starters
        const hasExplanationIntro = /^(To |Here's |This |If you|Sure,|Okay,|Alright,|Let me|I can|I'll|I've|I think|I would)/i.test(trimmed);
        
        // 5. Meta-commentary about writing/story
        const hasMetaCommentary = /\b(this could|this would|this might|the scene could|the character should|you can have|to make this|to add|for this scene)\b/i.test(trimmed);
        
        // If ANY of these are true, it's NOT screenplay
        if (hasQuestions || startsWithQuestion || hasAdviceLanguage || hasNumberedList || hasBulletPoints || hasExplanationIntro || hasMetaCommentary) {
            return false;
        }
        
        // Everything else is screenplay! 
        // (Descriptive prose, action lines, dialogue, scene descriptions, etc.)
        return true;
    }, []);
    
    // ============================================================================
    // SYNC WITH CONTEXT
    // ============================================================================
    
    // Sync workflow state with context
    useEffect(() => {
        if (state.activeWorkflow !== activeWorkflow) {
            setActiveWorkflow(state.activeWorkflow);
        }
    }, [state.activeWorkflow]);
    
    useEffect(() => {
        if (state.workflowCompletionData !== workflowCompletionData) {
            setWorkflowCompletionData(state.workflowCompletionData);
        }
    }, [state.workflowCompletionData]);
    
    useEffect(() => {
        if (state.inputPlaceholder !== inputPlaceholder) {
            setInputPlaceholder(state.inputPlaceholder);
        }
    }, [state.inputPlaceholder]);
    
    // Reset placeholder when workflow ends or mode changes
    useEffect(() => {
        if (!activeWorkflow && inputPlaceholder !== 'Type your message...') {
            console.log('[useChatMode] Resetting placeholder (workflow ended)');
            setInputPlaceholder('Type your message...');
            chatContext.setPlaceholder('Type your message...');
        }
    }, [activeWorkflow, inputPlaceholder, chatContext]);
    
    // Clear workflow when mode changes away from chat
    useEffect(() => {
        if (state.activeMode !== 'chat' && activeWorkflow) {
            console.log('[useChatMode] Clearing workflow (mode changed to:', state.activeMode, ')');
            setActiveWorkflow(null);
            chatContext.setWorkflow(null);
            setInputPlaceholder('Type your message...');
            chatContext.setPlaceholder('Type your message...');
        }
    }, [state.activeMode, activeWorkflow, chatContext]);
    
    // ============================================================================
    // RETURN
    // ============================================================================
    
    return {
        // State
        activeWorkflow,
        workflowCompletionData,
        inputPlaceholder,
        
        // Actions
        startWorkflow,
        clearWorkflowCompletion,
        handleWorkflowInsertion,
        
        // Helpers
        isScreenplayContent
    };
}

