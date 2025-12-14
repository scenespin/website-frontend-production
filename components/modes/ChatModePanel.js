'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useDrawer } from '@/contexts/DrawerContext';
import { Sparkles, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { calculateMaxContentChars, includeContentUpToLimit } from '@/utils/tokenCalculator';
import { buildStoryAdvisorContext, buildContextPromptString } from '@/utils/screenplayContextBuilder';
import toast from 'react-hot-toast';

// Story Advisor: No Fountain parsing needed (consultation only, no content generation)

export function ChatModePanel({ onInsert, onWorkflowComplete, editorContent, cursorPosition }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext, setSelectedTextContext } = useChatContext();
  const { closeDrawer } = useDrawer();
  const {
    activeWorkflow,
    workflowCompletionData,
    clearWorkflowCompletion
  } = useChatMode();
  
  // Model selection for AI chat
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom ONLY while streaming (so user can see new content)
  // Once streaming stops, don't auto-scroll (allows copy/paste without chat jumping)
  useEffect(() => {
    if (state.isStreaming) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.isStreaming, state.streamingText]); // Only trigger when streaming state or streaming text changes
  
  // Story Advisor: No auto-send for selected text (consultation only)
  
  // Detect scene context when drawer opens or editor content/cursor changes
  // If cursorPosition is undefined, try to detect from editor content (find last scene heading)
  useEffect(() => {
    if (editorContent) {
      // If cursor position is available, use it; otherwise, try to detect from content
      let detectedContext = null;
      
      if (cursorPosition !== undefined) {
        detectedContext = detectCurrentScene(editorContent, cursorPosition);
      } else {
        // Fallback: find the last scene heading in the content
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
          // Calculate approximate cursor position at the last scene heading
          const approximateCursor = editorContent.split('\n').slice(0, lastSceneLine + 1).join('\n').length;
          detectedContext = detectCurrentScene(editorContent, approximateCursor);
        }
      }
      
      if (detectedContext) {
        setSceneContext({
          heading: detectedContext.heading,
          act: detectedContext.act,
          characters: detectedContext.characters,
          pageNumber: detectedContext.pageNumber,
          totalPages: detectedContext.totalPages
        });
        console.log('[ChatModePanel] Scene context detected:', detectedContext.heading, 'cursorPosition:', cursorPosition);
      } else {
        console.warn('[ChatModePanel] No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
      }
    }
  }, [editorContent, cursorPosition, setSceneContext]);
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    if (isSending) return;
    if (!prompt || !prompt.trim()) {
      return; // Don't send empty prompts
    }
    
    setIsSending(true);
    
    try {
      // Story Advisor: Clear selected text context if present (not used for consultation)
      if (state.selectedTextContext) {
        console.log('[ChatModePanel] Clearing selectedTextContext - Story Advisor focuses on consultation, not rewriting');
        setSelectedTextContext(null, null);
      }
      
      // Get conversation history for token calculation
      const conversationHistory = state.messages
        .filter(m => m.mode === 'chat')
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // Base system prompt (without screenplay content)
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
- Be encouraging and constructive`;
      
      // Build intelligent context using new context builder
      const contextData = buildStoryAdvisorContext(
        editorContent,
        cursorPosition,
        prompt,
        selectedModel,
        conversationHistory,
        systemPromptBase
      );
      
      // Update global scene context state (for banner display) if we have current scene
      if (contextData.currentScene) {
        setSceneContext({
          heading: contextData.currentScene.heading,
          act: contextData.currentScene.act,
          characters: contextData.currentScene.characters,
          pageNumber: contextData.currentScene.pageNumber,
          totalPages: contextData.currentScene.totalPages
        });
        console.log('[ChatModePanel] Scene context:', contextData.currentScene.heading, 'Act:', contextData.currentScene.act, 'Characters:', contextData.currentScene.characters?.length || 0);
      } else {
        console.warn('[ChatModePanel] No scene context detected. editorContent:', !!editorContent, 'cursorPosition:', cursorPosition);
      }
      
      // Build context prompt string from context data
      const contextPromptString = buildContextPromptString(contextData);
      
      console.log('[ChatModePanel] Context strategy:', {
        type: contextData.type,
        estimatedPages: contextData.estimatedPages,
        editorContentLength: editorContent?.length || 0,
        hasCurrentScene: !!contextData.currentScene,
        hasRelevantScenes: contextData.relevantScenes?.length || 0
      });
      
      // Build final system prompt with context
      const systemPrompt = systemPromptBase + contextPromptString;
      
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'chat'
      });
      
      // Conversation history already calculated above for token calculation
      
      // Use user's prompt directly (no special building needed for consultation)
      const builtPrompt = prompt;
      
      console.log('[ChatModePanel] Story Advisor API call params:', {
        conversationHistoryLength: conversationHistory.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: builtPrompt.length
      });
      
      // Prepare API request for Story Advisor consultation
      const apiRequestData = {
          userPrompt: builtPrompt,
          systemPrompt: systemPrompt,
          desiredModelId: selectedModel,
          conversationHistory,
          sceneContext: contextData.currentScene ? {
            heading: contextData.currentScene.heading,
            act: contextData.currentScene.act,
            characters: contextData.currentScene.characters,
            pageNumber: contextData.currentScene.pageNumber
          } : null
      };
      
      // Call streaming AI API
      setStreaming(true, '');
      let accumulatedText = '';
      const maxRetries = 1; // Only retry once
      
      // Story Advisor: Simple streaming API call (no JSON, no content parsing)
      await api.chat.generateStream(
        apiRequestData,
        // onChunk
        (chunk) => {
          accumulatedText += chunk;
          setStreaming(true, accumulatedText);
        },
        // onComplete
        async (fullContent) => {
          // Story Advisor: Add response as-is (markdown will be rendered)
          addMessage({
            role: 'assistant',
            content: fullContent.trim(),
            mode: 'chat'
          });
          setTimeout(() => {
            setStreaming(false, '');
          }, 100);
        },
        // onError
        (error) => {
          console.error('Error in streaming:', error);
          setStreaming(false, '');
          
          // 🔥 PHASE 4: Better error handling for API overload/rate limits
          let errorMessage = 'Failed to get AI response';
          let userFriendlyMessage = '❌ Sorry, I encountered an error. Please try again.';
          
          // Check for specific error types
          const errorString = error.message || error.toString() || '';
          const isOverloaded = errorString.includes('overloaded') || 
                               errorString.includes('overloaded_error') ||
                               (error.error && error.error.type === 'overloaded_error');
          const isRateLimit = errorString.includes('rate_limit') || 
                             errorString.includes('429') ||
                             errorString.includes('too_many_requests');
          const isParameterError = errorString.includes('max_tokens') && 
                                  errorString.includes('max_completion_tokens') ||
                                  errorString.includes('Unsupported parameter');
          
          if (isOverloaded || isRateLimit) {
            errorMessage = 'AI service is temporarily overloaded. Please try again in a moment.';
            userFriendlyMessage = '⚠️ The AI service is temporarily busy. Please wait a moment and try again.';
            toast.error(errorMessage, { duration: 5000 });
          } else if (isParameterError) {
            errorMessage = 'API configuration error. Please try a different model or contact support.';
            userFriendlyMessage = '⚠️ There was a configuration issue with this model. Please try selecting a different model.';
            toast.error(errorMessage, { duration: 5000 });
          } else {
            toast.error(error.message || errorMessage);
          }
          
          addMessage({
            role: 'assistant',
            content: userFriendlyMessage,
            mode: 'chat'
          });
        }
      );
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setStreaming(false, '');
      
      // 🔥 PHASE 4: Better error handling for API overload/rate limits
      const errorString = error.message || error.toString() || '';
      const isOverloaded = errorString.includes('overloaded') || 
                           errorString.includes('overloaded_error') ||
                           (error.error && error.error.type === 'overloaded_error');
      const isRateLimit = errorString.includes('rate_limit') || 
                         errorString.includes('429') ||
                         errorString.includes('too_many_requests');
      const isParameterError = errorString.includes('max_tokens') && 
                               errorString.includes('max_completion_tokens') ||
                               errorString.includes('Unsupported parameter');
      
      let errorMessage = error.response?.data?.message || error.message || 'Failed to get AI response';
      let userFriendlyMessage = '❌ Sorry, I encountered an error. Please try again.';
      
      if (isOverloaded || isRateLimit) {
        errorMessage = 'AI service is temporarily overloaded. Please try again in a moment.';
        userFriendlyMessage = '⚠️ The AI service is temporarily busy. Please wait a moment and try again.';
        toast.error(errorMessage, { duration: 5000 });
      } else if (isParameterError) {
        errorMessage = 'API configuration error. Please try a different model or contact support.';
        userFriendlyMessage = '⚠️ There was a configuration issue with this model. Please try selecting a different model.';
        toast.error(errorMessage, { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
      
      addMessage({
        role: 'assistant',
        content: userFriendlyMessage,
        mode: 'chat'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleInsertAndCreate = () => {
    if (!workflowCompletionData || !onWorkflowComplete) return;
    
    console.log('[ChatModePanel] Insert & Create clicked:', workflowCompletionData);
    
    // Trigger parent callback
    onWorkflowComplete(workflowCompletionData.type, workflowCompletionData.parsedData);
    
    // Clear completion data
    clearWorkflowCompletion();
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workflow Completion Banner */}
      {workflowCompletionData && (
        <div className="flex items-center justify-between px-4 py-3 bg-base-300 border-b border-cinema-red/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cinema-gold" />
            <span className="text-base-content">
              {workflowCompletionData.type.charAt(0).toUpperCase() + workflowCompletionData.type.slice(1)} profile complete!
            </span>
          </div>
          <button
            onClick={handleInsertAndCreate}
            className="btn btn-sm btn-primary"
          >
            Insert & Create
          </button>
        </div>
      )}
      
      {/* Active Workflow Indicator */}
      {activeWorkflow && (
        <div className="px-4 py-2 border-b border-base-300 flex items-center gap-2 bg-base-200">
          <div className="w-2 h-2 rounded-full animate-pulse bg-cinema-blue" />
          <span className="text-sm text-base-content/80">
            AI Interview in progress: {activeWorkflow.type.charAt(0).toUpperCase() + activeWorkflow.type.slice(1)} creation
          </span>
        </div>
      )}
      
      {/* Instruction Messages */}
      {state.messages.filter(m => m.mode === 'chat').length === 0 && !state.input && (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-base-content mb-2">Story Advisor</h3>
              <p className="text-sm text-base-content/70 mb-4">
                Your professional screenplay consultant. Get advice, analysis, and creative guidance for your story. I don't generate Fountain format — that's handled by other tools.
              </p>
              <div className="text-xs text-base-content/50 space-y-1 mb-3">
                <p>Try: "I'm stuck on Act 2. What should happen next?"</p>
                <p>or "Is Sarah's motivation clear enough?"</p>
                <p>or "Should I cut the warehouse scene?"</p>
                <p>or "How can I make this character more compelling?"</p>
              </div>
              <div className="text-xs text-base-content/40 pt-3 border-t border-base-300">
                <p>💡 <strong>Tip:</strong> I can analyze scenes, characters, structure, pacing, and themes. Ask me anything about your screenplay!</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Messages Area - ChatGPT/Claude Style */}
      <div className="flex-1 chat-scroll-container">
        {state.messages
          .filter(m => m.mode === 'chat')
          .map((message, index) => {
            const isUser = message.role === 'user';
            const isLastAssistantMessage = 
              !isUser && 
              index === state.messages.filter(m => m.mode === 'chat').length - 1;
            
            // Story Advisor: No insert buttons (consultation only, no Fountain generation)
            
            return (
              <div
                key={index}
                className={`group w-full ${isUser ? 'bg-transparent' : 'bg-base-200/30'} hover:bg-base-200/50 transition-colors`}
              >
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 relative">
                  <div className="flex gap-4 md:gap-6">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'bg-gradient-to-br from-cinema-red to-cinema-red/80 text-base-content' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600 text-base-content'
                    }`}>
                      {isUser ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Story Advisor: Render markdown content (no insert buttons) */}
                      <div className="chat-message-content">
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words text-base-content text-sm leading-relaxed">
                            {message.content}
                          </div>
                        ) : (
                          <div className="text-base-content text-sm leading-relaxed whitespace-pre-wrap">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Streaming text - show insert button while streaming AND after streaming completes if it's screenplay content */}
        {state.streamingText && state.streamingText.trim().length > 0 && (
          <div className="group w-full bg-base-200/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <div className="flex gap-4 md:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-base-content">
                  <Bot className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                
                {/* Streaming Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="text-base-content text-sm leading-relaxed whitespace-pre-wrap">
                    <MarkdownRenderer content={state.streamingText} />
                    {state.isStreaming && (
                      <span className="inline-block w-0.5 h-5 ml-1 bg-purple-500 animate-pulse"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor - only scrolls while streaming */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Placeholder Info with New Chat button */}
      <div className="px-4 py-2 border-t border-base-300 flex items-center justify-between">
        <span className="text-xs text-base-content/60">
          {activeWorkflow ? (
            'Answer the question to continue the interview...'
          ) : (
            'Ask for advice, analysis, or creative guidance about your screenplay'
          )}
        </span>
        {state.messages.filter(m => m.mode === 'chat').length > 0 && (
          <button
            onClick={() => clearMessagesForMode('chat')}
            className="btn btn-xs btn-ghost gap-1.5 text-base-content/60 hover:text-base-content"
            title="Start new chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs">New Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}

