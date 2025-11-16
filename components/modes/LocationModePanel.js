'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { Building2, Sparkles, Bot, MessageSquare, Copy, Check } from 'lucide-react';
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
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'location'), state.streamingText, state.isStreaming]);
  
  // Copy message to clipboard
  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  };
  
  // Auto-start workflow on mount if not already active
  useEffect(() => {
    if (!activeWorkflow && state.activeMode === 'location') {
      const workflowMessages = state.messages.filter(m => m.mode === 'location');
      if (workflowMessages.length === 0) {
        console.log('[LocationModePanel] Auto-starting location interview');
        
        // Check if there's existing data from the modal
        const existingData = state.entityContextBanner?.existingData;
        if (existingData && (existingData.name || existingData.description)) {
          console.log('[LocationModePanel] Found existing form data:', existingData);
        }
        
        startWorkflow('location');
      }
    }
  }, [activeWorkflow, state.activeMode, state.messages, state.entityContextBanner, startWorkflow]);
  
  // Handle sending messages during interview (WIZARD MODE - no AI until final step)
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    if (!activeWorkflow) {
      console.warn('[LocationModePanel] handleSend called but no active workflow');
      return;
    }
    
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
      
      // WIZARD MODE: For questions 1-3, just show next question (NO AI CALL)
      if (currentQuestionIndex < totalQuestions - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = workflow.questions[nextIndex];
        
        // Update workflow state
        setWorkflow({
          type: 'location',
          questionIndex: nextIndex
        });
        setPlaceholder(nextQuestion.placeholder);
        
        // Show next question immediately (pure wizard, no AI)
        addMessage({
          role: 'assistant',
          content: nextQuestion.question,
          mode: 'location'
        });
        
        setIsSending(false);
        setInput(''); // Clear input
        return; // Exit - no AI call for intermediate questions
        
      } else {
        // FINAL STEP: Question 4 answered - NOW call AI to generate profile
        // Last question answered - NOW call AI to generate final profile
        // Build system prompt for final profile generation
        const finalSystemPrompt = `${workflow.systemPrompt}

CRITICAL INSTRUCTIONS FOR THIS RESPONSE:
- The user has completed all 4 interview questions
- Generate a comprehensive location profile based on their answers
- Use the conversation history to extract all their answers
- Format the profile ready for screenplay use
- DO NOT ask any more questions
- DO NOT acknowledge - just generate the profile

REQUIRED OUTPUT FORMAT:
**Name:** [Location Name]
**Type:** [INT/EXT/INT/EXT]
**Description:** [Full location description - this will fill the modal form - 2-3 sentences about what it looks like, atmosphere, mood]
**Atmosphere Notes:** [Optional - mood and feel]
**Set Requirements:** [Optional - production notes]`;

        // Call AI to generate final profile
        setStreaming(true, '');
        let finalResponse = '';
        let finalStreamingComplete = false;
        let finalAccumulatedText = '';
        
        await api.chat.generateStream(
          {
            userPrompt: 'Generate the location profile based on all the answers provided.',
            systemPrompt: finalSystemPrompt,
            desiredModelId: selectedModel,
            conversationHistory,
            sceneContext: null
          },
          (chunk) => {
            finalAccumulatedText += chunk;
            setStreaming(true, finalAccumulatedText);
          },
          (fullContent) => {
            finalResponse = fullContent;
            finalStreamingComplete = true;
            setStreaming(false, '');
          },
          (error) => {
            console.error('Error generating final profile:', error);
            toast.error(error.message || 'Failed to generate profile');
            setStreaming(false, '');
            setIsSending(false);
            finalStreamingComplete = true;
          }
        );
        
        // Wait for final response
        let waitCount = 0;
        while (!finalStreamingComplete && waitCount < 300) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        
        if (!finalResponse) {
          finalResponse = finalAccumulatedText || 'Sorry, I couldn\'t generate a response.';
        }
        
        setStreaming(false, '');
        
        // Parse the final AI response FIRST
        const parsedData = parseAIResponse(finalResponse, 'location');
        
        // Store completion data BEFORE adding message (so UI updates immediately)
        setWorkflowCompletion({
          type: 'location',
          parsedData: parsedData || { name: 'Location', description: finalResponse, type: 'INT' },
          aiResponse: finalResponse
        });
        
        // Add final profile message
        addMessage({
          role: 'assistant',
          content: finalResponse,
          mode: 'location'
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
      <div className="flex-1 chat-scroll-container">
        {state.messages
          .filter(m => m.mode === 'location')
          .map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={index}
                className={`group px-4 py-3 ${isUser ? 'bg-base-200' : 'bg-base-100'} hover:bg-base-200/50 transition-colors relative`}
              >
                <div className="flex items-start gap-3">
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 chat-message-content">
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
                  
                  {/* Copy Button - appears on hover */}
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-base-300/50 text-base-content/60 hover:text-base-content shrink-0"
                    title="Copy message"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
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
              <div className="flex-1 min-w-0 chat-message-content">
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

