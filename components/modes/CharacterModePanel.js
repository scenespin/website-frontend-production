'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useEditor } from '@/contexts/EditorContext';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { User, Sparkles, Bot, MessageSquare, Loader2, Send, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { getWorkflow } from '@/utils/aiWorkflows';
import { parseAIResponse } from '@/utils/aiResponseParser';
import toast from 'react-hot-toast';

export function CharacterModePanel({ onInsert, editorContent, cursorPosition }) {
  const { state, addMessage, setInput, setMode, setWorkflow, setWorkflowCompletion, setPlaceholder, setStreaming } = useChatContext();
  const { state: editorState, insertText, saveNow } = useEditor();
  const { createCharacter } = useScreenplay();
  const { closeDrawer } = useDrawer();
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
  // Use model from ChatContext (set by UnifiedChatPanel's LLMModelSelector)
  const selectedModel = state.selectedModel || 'claude-sonnet-4-5-20250929';
  const [isSending, setIsSending] = useState(false);
  const [showPostInsertPrompt, setShowPostInsertPrompt] = useState(false);
  const [insertedCharacterName, setInsertedCharacterName] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'character'), state.streamingText, state.isStreaming]);
  
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
  
  // Auto-start workflow on mount if not already active (with guard to prevent duplicates)
  const hasStartedWorkflowRef = useRef(false);
  useEffect(() => {
    // Ensure mode is set to 'character' when this panel is active
    if (state.activeMode !== 'character') {
      setMode('character');
      hasStartedWorkflowRef.current = false; // Reset when mode changes
      return;
    }
    
    // Only start workflow once - guard against React StrictMode double-rendering
    if (hasStartedWorkflowRef.current) {
      return;
    }
    
    // Only start workflow if mode is 'character' and no workflow is active
    if (!activeWorkflow && state.activeMode === 'character') {
      const workflowMessages = state.messages.filter(m => m.mode === 'character');
      if (workflowMessages.length === 0) {
        console.log('[CharacterModePanel] Auto-starting character interview');
        hasStartedWorkflowRef.current = true; // Mark as started
        
        // Check if there's existing data from the modal
        const existingData = state.entityContextBanner?.existingData;
        if (existingData && (existingData.name || existingData.description)) {
          console.log('[CharacterModePanel] Found existing form data:', existingData);
        }
        
        startWorkflow('character');
      }
    }
  }, [activeWorkflow, state.activeMode, state.messages, state.entityContextBanner, startWorkflow, setMode]);
  
  // Reset guard when workflow completes
  useEffect(() => {
    if (!activeWorkflow && hasStartedWorkflowRef.current) {
      hasStartedWorkflowRef.current = false;
    }
  }, [activeWorkflow]);
  
  // Handle sending messages during interview (WIZARD MODE - no AI until final step)
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    if (!activeWorkflow) {
      console.warn('[CharacterModePanel] handleSend called but no active workflow');
      return;
    }
    
    setIsSending(true);
    
    try {
      const workflow = getWorkflow('character');
      const currentQuestionIndex = activeWorkflow.questionIndex;
      const totalQuestions = workflow.questions.length;
      
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'character'
      });
      
      // WIZARD MODE: For questions 1-3, just show next question (NO AI CALL)
      if (currentQuestionIndex < totalQuestions - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = workflow.questions[nextIndex];
        
        // Update workflow state
        setWorkflow({
          type: 'character',
          questionIndex: nextIndex
        });
        setPlaceholder(nextQuestion.placeholder);
        
        // Show next question immediately (pure wizard, no AI)
        addMessage({
          role: 'assistant',
          content: nextQuestion.question,
          mode: 'character'
        });
        
        setIsSending(false);
        setInput(''); // Clear input
        return; // Exit - no AI call for intermediate questions
        
      } else {
        // FINAL STEP: Question 4 answered - NOW call AI to generate profile
        // Last question answered - NOW call AI to generate final profile
        // Build system prompt for final profile generation
        let finalSystemPrompt = workflow.systemPrompt;
        
        // If we have existing data from the modal, include it
        if (state.entityContextBanner?.existingData) {
          const existing = state.entityContextBanner.existingData;
          const existingInfo = [];
          if (existing.name) existingInfo.push(`Name: ${existing.name}`);
          if (existing.description) existingInfo.push(`Description: ${existing.description}`);
          if (existing.type) existingInfo.push(`Type: ${existing.type}`);
          if (existing.arcStatus) existingInfo.push(`Arc Status: ${existing.arcStatus}`);
          
          if (existingInfo.length > 0) {
            finalSystemPrompt += `\n\n📝 EXISTING CHARACTER INFORMATION (user has already entered this):\n${existingInfo.join('\n')}\n\nNote: The user has already provided this information. Incorporate it into the final profile.`;
          }
        }
        
        finalSystemPrompt += `

CRITICAL INSTRUCTIONS FOR THIS RESPONSE:
- The user has completed all 4 interview questions
- Generate a comprehensive character profile based on their answers
- Use the conversation history to extract all their answers
- Format the profile ready for screenplay use
- DO NOT ask any more questions
- DO NOT acknowledge - just generate the profile
- This is a FICTIONAL CHARACTER for a SCREENPLAY, NOT a real person
- DO NOT generate health assessments or medical information

REQUIRED OUTPUT FORMAT:
**Name:** [Character Name]
**Physical Introduction:** [2-3 sentences in screenplay format, e.g., "JON (23) is a college student with..." - what the camera sees]
**Description:** [Full character description including personality, goals, flaws - this will fill the modal form]
**Type:** [lead/supporting/minor]
**Arc Status:** [introduced/developing/resolved]`;

        // Build conversation history from messages
        const conversationHistory = state.messages
          .filter(m => m.mode === 'character')
          .map(m => ({
            role: m.role,
            content: m.content
          }));
        
        // Call AI to generate final profile
        setStreaming(true, '');
        let finalResponse = '';
        let finalStreamingComplete = false;
        let finalAccumulatedText = '';
        
        await api.chat.generateStream(
          {
            userPrompt: 'Generate the character profile based on all the answers provided.',
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
        const parsedData = parseAIResponse(finalResponse, 'character');
        
        // Store completion data BEFORE adding message (so UI updates immediately)
        setWorkflowCompletion({
          type: 'character',
          parsedData: parsedData || { name: 'Character', description: finalResponse },
          aiResponse: finalResponse
        });
        
        // Add final profile message
        addMessage({
          role: 'assistant',
          content: finalResponse,
          mode: 'character'
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
        mode: 'character'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle "Insert & Create" button
  const handleInsertAndCreate = async () => {
    if (!workflowCompletionData || workflowCompletionData.type !== 'character' || !workflowCompletionData.parsedData) {
      toast.error('No character data to insert');
      return;
    }
    
    const parsed = workflowCompletionData.parsedData;
    const characterName = parsed.name || 'CHARACTER';
    const description = parsed.description || '';
    
    // Format for Fountain: @CHARACTER_NAME\n[description]\n\n
    const fountainText = `@${characterName.toUpperCase()}\n${description}\n\n`;
    
    try {
      // Insert into script at cursor
      if (isEditorPage && onInsert) {
        onInsert(fountainText);
      } else if (isEditorPage && insertText) {
        const pos = cursorPosition ?? editorState.cursorPosition ?? editorState.content.length;
        insertText(fountainText, pos);
      }
      
      // Create entity in database
      const characterData = {
        name: characterName,
        type: parsed.type || 'lead',
        arcStatus: parsed.arcStatus || 'introduced',
        description: description,
        arcNotes: parsed.arcNotes || ''
      };
      
      await createCharacter(characterData);
      
      // Auto-save screenplay after insertion
      if (isEditorPage && saveNow) {
        try {
          await saveNow();
          console.log('[CharacterModePanel] ✅ Auto-saved screenplay after character insertion');
        } catch (saveError) {
          console.error('[CharacterModePanel] Auto-save failed:', saveError);
          // Don't block the flow if save fails
        }
      }
      
      // Clear completion data
      clearWorkflowCompletion();
      
      // Close drawer after successful insertion (user can continue via post-insert prompt if needed)
      // But for now, let's close it and they can reopen if needed
      // Actually, let's show the post-insert prompt first, then close on Done
      setInsertedCharacterName(characterName);
      setShowPostInsertPrompt(true);
      
      // Add success message
      addMessage({
        role: 'assistant',
        content: `✅ Character "${characterName}" inserted into script and created!`,
        mode: 'character'
      });
      
      toast.success(`Character "${characterName}" created and inserted!`);
      
    } catch (error) {
      console.error('[CharacterModePanel] Error inserting character:', error);
      toast.error('Failed to insert character');
    }
  };
  
  // Handle "Create Only" button
  const handleCreateOnly = async () => {
    if (!workflowCompletionData || workflowCompletionData.type !== 'character' || !workflowCompletionData.parsedData) {
      toast.error('No character data to create');
      return;
    }
    
    const parsed = workflowCompletionData.parsedData;
    const characterName = parsed.name || 'CHARACTER';
    const description = parsed.description || '';
    
    try {
      // Create entity in database only (no script insertion)
      const characterData = {
        name: characterName,
        type: parsed.type || 'lead',
        arcStatus: parsed.arcStatus || 'introduced',
        description: description,
        arcNotes: parsed.arcNotes || ''
      };
      
      await createCharacter(characterData);
      
      // Clear completion data
      clearWorkflowCompletion();
      
      // Close drawer after creation
      closeDrawer();
      
      // Add success message
      addMessage({
        role: 'assistant',
        content: `✅ Character "${characterName}" created! (Reference card - not in script yet)`,
        mode: 'character'
      });
      
      toast.success(`Character "${characterName}" created!`);
      
    } catch (error) {
      console.error('[CharacterModePanel] Error creating character:', error);
      toast.error('Failed to create character');
    }
  };
  
  // Handle "Continue with Dialogue" button
  const handleContinueWithDialogue = () => {
    setShowPostInsertPrompt(false);
    setMode('director');
    addMessage({
      role: 'assistant',
      content: `Let's add dialogue for ${insertedCharacterName}. What should they say?`,
      mode: 'director'
    });
  };
  
  // Handle "Create Another Character" button
  const handleCreateAnother = () => {
    setShowPostInsertPrompt(false);
    setInsertedCharacterName(null);
    clearWorkflowCompletion();
    startWorkflow('character');
  };
  
  // Format preview text (formatted, not raw Fountain)
  const formatPreview = (parsed) => {
    if (!parsed) return '';
    const name = parsed.name || 'CHARACTER';
    const description = parsed.description || '';
    return `@${name.toUpperCase()}\n\n${description}`;
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-base-content">Character Creation</h3>
        </div>
      </div>
      
      {/* Workflow Completion Banner */}
      {workflowCompletionData && workflowCompletionData.type === 'character' && !showPostInsertPrompt && (
        <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cinema-gold" />
              <span className="text-base-content font-medium">
                Character profile complete!
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
                  startWorkflow('character');
                }}
                className="btn btn-sm btn-ghost"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Post-Insertion Prompt */}
      {showPostInsertPrompt && (
        <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cinema-blue" />
              <span className="text-base-content font-medium">
                Character inserted! What would you like to do next?
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleContinueWithDialogue}
                className="btn btn-sm btn-primary"
              >
                Continue with Dialogue
              </button>
              <button
                onClick={handleCreateAnother}
                className="btn btn-sm btn-outline"
              >
                Create Another Character
              </button>
              <button
                onClick={() => {
                  setShowPostInsertPrompt(false);
                  closeDrawer();
                }}
                className="btn btn-sm btn-ghost"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Active Workflow Indicator */}
      {activeWorkflow && !workflowCompletionData && (
        <div className="px-4 py-2 border-b border-base-300 flex items-center gap-2 bg-base-200">
          <div className="w-2 h-2 rounded-full animate-pulse bg-cyan-500" />
          <span className="text-sm text-base-content/80">
            AI Interview in progress: Character creation
          </span>
        </div>
      )}
      
      {/* Chat Messages Area */}
      <div className="flex-1 chat-scroll-container">
        {useMemo(() => {
          const characterMessages = state.messages.filter(m => m.mode === 'character');
          return characterMessages.map((message, index) => {
            const isUser = message.role === 'user';
            // Use content + index as key to prevent duplicates
            const messageKey = `${message.role}-${message.content.substring(0, 20)}-${index}`;
            return (
              <div
                key={messageKey}
                className={`group px-4 py-3 ${isUser ? 'bg-base-200' : 'bg-base-100'} hover:bg-base-200/50 transition-colors relative`}
              >
                <div className="flex items-start gap-3">
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-cyan-500" />
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
                </div>
                
                {/* Copy Button - appears on hover at bottom of message */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleCopy(message.content, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs text-base-content/60 hover:text-base-content hover:bg-base-300"
                    title="Copy message"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          });
        }, [state.messages.filter(m => m.mode === 'character'), copiedIndex])}
        
        {/* Streaming text display */}
        {state.isStreaming && state.streamingText && (
          <div className="px-4 py-3 bg-base-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="flex-1 min-w-0 chat-message-content">
                <div className="text-sm text-base-content">
                  <MarkdownRenderer content={state.streamingText} />
                </div>
                <span className="inline-block w-0.5 h-4 ml-1 bg-cyan-500 animate-pulse"></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Loading indicator while waiting for response (if not streaming) */}
        {isSending && !state.isStreaming && (
          <div className="px-4 py-3 bg-base-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
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
        </div>
      )}
    </div>
  );
}

