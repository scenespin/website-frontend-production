/**
 * useChatMode Hook
 * 
 * Manages AI interview workflows for character, location, and scene creation.
 * Handles question progression, completion detection, and data parsing.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { getWorkflow } from '@/utils/aiWorkflows';
import { parseAIResponse } from '@/utils/aiResponseParser';

export function useChatMode() {
  const chatContext = useChatContext();
  const { state } = chatContext;
  
  // Local state synced with context
  const [activeWorkflow, setActiveWorkflow] = useState(state.activeWorkflow);
  const [workflowCompletionData, setWorkflowCompletionData] = useState(state.workflowCompletionData);
  const [inputPlaceholder, setInputPlaceholder] = useState(state.inputPlaceholder);
  
  /**
   * Start an AI interview workflow
   */
  const startWorkflow = useCallback(async (type) => {
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
      
      // Fallback
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
  const progressWorkflow = useCallback(async (aiResponse, workflowConfig) => {
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
      
      // Update placeholder
      setInputPlaceholder(nextQuestion.placeholder);
      chatContext.setPlaceholder(nextQuestion.placeholder);
      
      // Add next question
      chatContext.addMessage({
        role: 'assistant',
        content: nextQuestion.question,
        mode: 'chat'
      });
    } else {
      // Workflow complete!
      console.log('[useChatMode] Workflow complete! All questions answered.');
      
      // Parse the final AI response
      const workflowType = activeWorkflow.type;
      const parsedData = parseAIResponse(aiResponse, workflowType);
      
      console.log('[useChatMode] Parsed workflow data:', parsedData);
      
      // Store completion data
      const completionData = {
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
      
      // Add completion message
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
    
    // Clear after insertion
    clearWorkflowCompletion();
  }, [workflowCompletionData, clearWorkflowCompletion]);
  
  /**
   * Detect if content is screenplay (not advice)
   * INVERTED LOGIC: Assume screenplay UNLESS clearly advice
   */
  const isScreenplayContent = useCallback((content) => {
    const trimmed = content.trim();
    
    // Empty or very short
    if (trimmed.length < 20) return false;
    
    // Check for advice indicators
    const hasQuestions = /\?/g.test(trimmed) && (trimmed.match(/\?/g) || []).length >= 2;
    const startsWithQuestion = /^(How|What|Where|When|Why|Should|Would|Could|Can|Do you|Are you|Is this)/i.test(trimmed);
    const hasAdviceLanguage = /\b(you should|you could|you might|try to|consider|think about|let me know|if you want|would you like|feel free|here to help|happy to help)\b/i.test(trimmed);
    const hasNumberedList = /^\d+\./m.test(trimmed);
    const hasBulletPoints = /^[-•*]\s/m.test(trimmed);
    const hasExplanationIntro = /^(To |Here's |This |If you|Sure,|Okay,|Alright,|Let me|I can|I'll|I've|I think|I would)/i.test(trimmed);
    const hasMetaCommentary = /\b(this could|this would|this might|the scene could|the character should|you can have|to make this|to add|for this scene)\b/i.test(trimmed);
    
    // If ANY advice indicator, it's NOT screenplay
    if (hasQuestions || startsWithQuestion || hasAdviceLanguage || hasNumberedList || hasBulletPoints || hasExplanationIntro || hasMetaCommentary) {
      return false;
    }
    
    // Everything else is screenplay
    return true;
  }, []);
  
  // Sync with context state
  useEffect(() => {
    if (state.activeWorkflow !== activeWorkflow) {
      setActiveWorkflow(state.activeWorkflow);
    }
  }, [state.activeWorkflow, activeWorkflow]);
  
  useEffect(() => {
    if (state.workflowCompletionData !== workflowCompletionData) {
      setWorkflowCompletionData(state.workflowCompletionData);
    }
  }, [state.workflowCompletionData, workflowCompletionData]);
  
  useEffect(() => {
    if (state.inputPlaceholder !== inputPlaceholder) {
      setInputPlaceholder(state.inputPlaceholder);
    }
  }, [state.inputPlaceholder, inputPlaceholder]);
  
  // Reset placeholder when workflow ends
  useEffect(() => {
    if (!activeWorkflow && inputPlaceholder !== 'Type your message...') {
      console.log('[useChatMode] Resetting placeholder (workflow ended)');
      setInputPlaceholder('Type your message...');
      chatContext.setPlaceholder('Type your message...');
    }
  }, [activeWorkflow, inputPlaceholder, chatContext]);
  
  // Clear workflow when mode changes
  useEffect(() => {
    if (state.activeMode !== 'chat' && activeWorkflow) {
      console.log('[useChatMode] Clearing workflow (mode changed)');
      setActiveWorkflow(null);
      chatContext.setWorkflow(null);
      setInputPlaceholder('Type your message...');
      chatContext.setPlaceholder('Type your message...');
    }
  }, [state.activeMode, activeWorkflow, chatContext]);
  
  return {
    // State
    activeWorkflow,
    workflowCompletionData,
    inputPlaceholder,
    
    // Actions
    startWorkflow,
    progressWorkflow,
    clearWorkflowCompletion,
    handleWorkflowInsertion,
    
    // Helpers
    isScreenplayContent
  };
}

