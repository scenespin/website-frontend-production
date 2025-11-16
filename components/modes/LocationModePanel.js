'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { Building2, Sparkles, Bot, MessageSquare } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { getWorkflow } from '@/utils/aiWorkflows';
import { parseAIResponse } from '@/utils/aiResponseParser';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';

export function LocationModePanel({ onInsert, editorContent, cursorPosition }) {
  const { state, addMessage, setInput, setMode, setWorkflow, setWorkflowCompletion, setPlaceholder, setStreaming } = useChatContext();
  const { state: editorState, insertText } = useEditor();
  const { createLocation } = useScreenplay();
  const pathname = usePathname();
  const isEditorPage = pathname?.includes('/write') || pathname?.includes('/editor');
  
  const {
    activeWorkflow,
    workflowCompletionData,
    inputPlaceholder,
    startWorkflow,
    clearWorkflowCompletion,
    isScreenplayContent
  } = useChatMode();
  
  // Model selection for AI chat
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  
  // Auto-start workflow on mount if not already active
  useEffect(() => {
    if (!activeWorkflow && state.activeMode === 'location') {
      const workflowMessages = state.messages.filter(m => m.mode === 'location');
      if (workflowMessages.length === 0) {
        console.log('[LocationModePanel] Auto-starting location interview');
        startWorkflow('location');
      }
    }
  }, [activeWorkflow, state.activeMode, state.messages, startWorkflow]);
  
  // Handle sending messages to AI during interview
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    if (!activeWorkflow) return;
    
    setIsSending(true);
    
    try {
      const workflow = getWorkflow('location');
      const currentQuestionIndex = activeWorkflow.questionIndex;
      const totalQuestions = workflow.questions.length;
      
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'location'
      });
      
      // Build conversation history (last 10 messages)
      const chatMessages = state.messages.filter(m => m.mode === 'location').slice(-10);
      const conversationHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Get system prompt from workflow
      const systemPrompt = workflow.systemPrompt;
      
      // Build enhanced system prompt - AI should ONLY acknowledge briefly, we'll add next question manually
      const enhancedSystemPrompt = `${systemPrompt}

CRITICAL INSTRUCTIONS FOR THIS RESPONSE (Question ${currentQuestionIndex + 1} of ${totalQuestions}):
- The user just answered a question about their SCREENPLAY LOCATION
- Your ONLY job: Acknowledge their answer in 3-5 words maximum (e.g., "Got it.", "Understood.", "Noted.")
- DO NOT write sentences, paragraphs, or explanations
- DO NOT ask any questions - the next question will be added automatically by the system
- DO NOT generate follow-up questions or conversation
- Keep it SHORT - just acknowledge and stop

GOOD responses (3-5 words max):
- "Got it."
- "Understood."
- "Noted."
- "Okay."

BAD responses (TOO LONG):
- "Got it. The warehouse is abandoned and dangerous." (TOO LONG - just say "Got it.")
- "That's interesting! Can you tell me more about..." (NO - don't ask questions)`;
      
      // Call streaming AI API
      let aiResponse = '';
      let streamingComplete = false;
      let accumulatedStreamingText = '';
      
      // Start streaming
      setStreaming(true, '');
      
      await api.chat.generateStream(
        {
          userPrompt: prompt,
          systemPrompt: enhancedSystemPrompt,
          desiredModelId: selectedModel,
          conversationHistory,
          sceneContext: null
        },
        // onChunk - update streaming text in real-time
        (chunk) => {
          accumulatedStreamingText += chunk;
          setStreaming(true, accumulatedStreamingText);
        },
        // onComplete - process the full response
        (fullContent) => {
          aiResponse = fullContent;
          streamingComplete = true;
          setStreaming(false, ''); // Stop streaming
        },
        // onError - handle error
        (error) => {
          console.error('Error in streaming:', error);
          toast.error(error.message || 'Failed to get AI response');
          setStreaming(false, '');
          setIsSending(false);
          streamingComplete = true; // Break the wait loop
        }
      );
      
      // Wait for streaming to complete (with timeout)
      let waitCount = 0;
      while (!streamingComplete && waitCount < 300) { // 30 second timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      // Use accumulated streaming text or fallback
      if (!aiResponse) {
        aiResponse = accumulatedStreamingText || 'Sorry, I couldn\'t generate a response.';
      }
      
      // Ensure streaming is stopped
      setStreaming(false, '');
      
      // Check if this is the last question
      if (currentQuestionIndex < totalQuestions - 1) {
        // More questions - skip AI acknowledgment (keep it short), just ask next question
        // Only add AI response if it's more than just "Got it" or similar (in case AI didn't follow instructions)
        if (aiResponse && aiResponse.trim().length > 10) {
          addMessage({
            role: 'assistant',
            content: aiResponse,
            mode: 'location'
          });
        }
        
        // Progress to next question immediately
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = workflow.questions[nextIndex];
        
        // Update workflow state via ChatContext
        setWorkflow({
          type: 'location',
          questionIndex: nextIndex
        });
        setPlaceholder(nextQuestion.placeholder);
        
        // Add next question immediately (no delay)
        addMessage({
          role: 'assistant',
          content: nextQuestion.question,
          mode: 'location'
        });
        
      } else {
        // Last question answered - workflow complete
        addMessage({
          role: 'assistant',
          content: aiResponse,
          mode: 'location'
        });
        
        // Parse the final AI response
        const parsedData = parseAIResponse(aiResponse, 'location');
        
        // Store completion data
        setWorkflowCompletion({
          type: 'location',
          parsedData,
          aiResponse
        });
        setWorkflow(null);
        setPlaceholder('Type your message...');
      }
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to get AI response');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        mode: 'location'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle "Insert & Create" button
  const handleInsertAndCreate = async () => {
    if (!workflowCompletionData || workflowCompletionData.type !== 'location' || !workflowCompletionData.parsedData) {
      toast.error('No location data to insert');
      return;
    }
    
    const parsed = workflowCompletionData.parsedData;
    const locationName = parsed.name || 'LOCATION';
    const description = parsed.description || '';
    const locationType = parsed.type || 'INT';
    
    // Format for Fountain: INT./EXT. LOCATION_NAME - DAY/NIGHT\n\n[description]
    // Default to DAY if not specified
    const fountainText = `${locationType}. ${locationName.toUpperCase()} - DAY\n\n${description}\n\n`;
    
    try {
      // Insert into script at cursor
      if (isEditorPage && onInsert) {
        onInsert(fountainText);
      } else if (isEditorPage && insertText) {
        const pos = cursorPosition ?? editorState.cursorPosition ?? editorState.content.length;
        insertText(fountainText, pos);
      }
      
      // Create entity in database
      const locationData = {
        name: locationName,
        type: locationType.toLowerCase() === 'int/ext' ? 'mixed' : locationType.toLowerCase(),
        description: description,
        atmosphereNotes: parsed.atmosphereNotes || '',
        setRequirements: parsed.setRequirements || '',
        productionNotes: parsed.productionNotes || ''
      };
      
      await createLocation(locationData);
      
      // Clear completion data
      clearWorkflowCompletion();
      
      // Add success message
      addMessage({
        role: 'assistant',
        content: `✅ Location "${locationName}" inserted into script and created!`,
        mode: 'location'
      });
      
      toast.success(`Location "${locationName}" created and inserted!`);
      
    } catch (error) {
      console.error('[LocationModePanel] Error inserting location:', error);
      toast.error('Failed to insert location');
    }
  };
  
  // Handle "Create Only" button
  const handleCreateOnly = async () => {
    if (!workflowCompletionData || workflowCompletionData.type !== 'location' || !workflowCompletionData.parsedData) {
      toast.error('No location data to create');
      return;
    }
    
    const parsed = workflowCompletionData.parsedData;
    const locationName = parsed.name || 'LOCATION';
    const description = parsed.description || '';
    const locationType = parsed.type || 'INT';
    
    try {
      // Create entity in database only (no script insertion)
      const locationData = {
        name: locationName,
        type: locationType.toLowerCase() === 'int/ext' ? 'mixed' : locationType.toLowerCase(),
        description: description,
        atmosphereNotes: parsed.atmosphereNotes || '',
        setRequirements: parsed.setRequirements || '',
        productionNotes: parsed.productionNotes || ''
      };
      
      await createLocation(locationData);
      
      // Clear completion data
      clearWorkflowCompletion();
      
      // Add success message
      addMessage({
        role: 'assistant',
        content: `✅ Location "${locationName}" created! (Reference card - not in script yet)`,
        mode: 'location'
      });
      
      toast.success(`Location "${locationName}" created!`);
      
    } catch (error) {
      console.error('[LocationModePanel] Error creating location:', error);
      toast.error('Failed to create location');
    }
  };
  
  // Format preview text (formatted, not raw Fountain)
  const formatPreview = (parsed) => {
    if (!parsed) return '';
    const name = parsed.name || 'LOCATION';
    const type = parsed.type || 'INT';
    const description = parsed.description || '';
    return `${type}. ${name.toUpperCase()} - DAY\n\n${description}`;
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-base-content">Location Creation</h3>
        </div>
      </div>
      
      {/* Workflow Completion Banner */}
      {workflowCompletionData && workflowCompletionData.type === 'location' && (
        <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cinema-gold" />
              <span className="text-base-content font-medium">
                Location profile complete!
              </span>
            </div>
            
            {/* Formatted Preview */}
            <div className="bg-base-200 p-3 rounded-lg border border-base-300">
              <pre className="text-sm text-base-content whitespace-pre-wrap font-mono">
                {formatPreview(workflowCompletionData.parsedData)}
              </pre>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {isEditorPage ? (
                <>
                  <button
                    onClick={handleInsertAndCreate}
                    className="btn btn-sm btn-primary"
                  >
                    Insert & Create
                  </button>
                  <button
                    onClick={handleCreateOnly}
                    className="btn btn-sm btn-outline"
                  >
                    Create Only
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateOnly}
                  className="btn btn-sm btn-primary"
                >
                  Create
                </button>
              )}
              <button
                onClick={() => {
                  clearWorkflowCompletion();
                  startWorkflow('location');
                }}
                className="btn btn-sm btn-ghost"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Workflow Indicator */}
      {activeWorkflow && !workflowCompletionData && (
        <div className="px-4 py-2 border-b border-base-300 flex items-center gap-2 bg-base-200">
          <div className="w-2 h-2 rounded-full animate-pulse bg-amber-500" />
          <span className="text-sm text-base-content/80">
            AI Interview in progress: Location creation
          </span>
        </div>
      )}
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {state.messages
          .filter(m => m.mode === 'location')
          .map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={index}
                className={`px-4 py-3 ${isUser ? 'bg-base-200' : 'bg-base-100'}`}
              >
                <div className="flex items-start gap-3">
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {isUser ? (
                      <p className="text-sm text-base-content whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    ) : (
                      <div className="text-sm text-base-content">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Streaming text display */}
        {state.isStreaming && state.streamingText && (
          <div className="px-4 py-3 bg-base-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-base-content">
                  <MarkdownRenderer content={state.streamingText} />
                </div>
                <span className="inline-block w-0.5 h-4 ml-1 bg-amber-500 animate-pulse"></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator while waiting for response (if not streaming) */}
        {isSending && !state.isStreaming && (
          <div className="px-4 py-3 bg-base-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-base-content/60">Thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input Area */}
      {activeWorkflow && !workflowCompletionData && (
        <div className="px-4 py-3 border-t border-base-300 bg-base-200">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={state.input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(state.input);
                  }
                }}
                placeholder={inputPlaceholder || 'Type your answer...'}
                className="input input-sm w-full bg-base-100"
                disabled={isSending}
              />
            </div>
            <button
              onClick={() => handleSend(state.input)}
              disabled={isSending || !state.input.trim()}
              className="btn btn-sm btn-primary"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Model Selector */}
          <div className="mt-2 flex justify-end">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              models={[
                { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
                { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', provider: 'Anthropic' },
                { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
                { id: 'gpt-4.5-turbo', name: 'GPT-4.5 Turbo', provider: 'OpenAI' },
                { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

