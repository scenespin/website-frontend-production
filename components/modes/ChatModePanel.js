'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { useDrawer } from '@/contexts/DrawerContext';
import { RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene } from '@/utils/sceneDetection';
import { calculateMaxContentChars, includeContentUpToLimit } from '@/utils/tokenCalculator';
import { buildStoryAdvisorContext, buildContextPromptString } from '@/utils/screenplayContextBuilder';
import toast from 'react-hot-toast';

// Story Advisor: No Fountain parsing needed (consultation only, no content generation)

export function ChatModePanel({ onInsert, onWorkflowComplete, editorContent, cursorPosition }) {
  console.log('[ChatModePanel] 🔄 RENDER', { hasEditorContent: !!editorContent, cursorPosition });
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
  // Use throttling to prevent "vibrating" effect during rapid text updates
  const scrollTimeoutRef = useRef(null);
  useEffect(() => {
    if (state.isStreaming) {
      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Throttle scroll to every 200ms to prevent vibrating
      scrollTimeoutRef.current = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [state.isStreaming]); // Only trigger when streaming state changes, not on every text update
  
  // Story Advisor: No auto-send for selected text (consultation only)
  
  // Detect scene context when drawer opens or editor content/cursor changes
  // If cursorPosition is undefined, try to detect from editor content (find last scene heading)
  const previousContextRef = useRef(null);
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
        const contextData = {
          heading: detectedContext.heading,
          act: detectedContext.act,
          characters: detectedContext.characters,
          pageNumber: detectedContext.pageNumber,
          totalPages: detectedContext.totalPages
        };
        
        // 🔥 FIX: Only update if context actually changed (deep comparison)
        const contextKey = JSON.stringify(contextData);
        const previousKey = previousContextRef.current ? JSON.stringify(previousContextRef.current) : null;
        
        if (contextKey !== previousKey) {
          setSceneContext(contextData);
          previousContextRef.current = contextData;
          console.log('[ChatModePanel] Scene context detected:', detectedContext.heading, 'cursorPosition:', cursorPosition);
        } else {
          console.log('[ChatModePanel] Scene context unchanged, skipping update');
        }
      } else {
        // Only clear if we had context before (prevent unnecessary updates)
        if (previousContextRef.current !== null) {
          console.warn('[ChatModePanel] No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
          setSceneContext(null);
          previousContextRef.current = null;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent, cursorPosition]);
  // Note: setSceneContext is intentionally omitted from deps - it's a stable context setter
  
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
      // Memoize filtered messages to prevent unnecessary recalculations
      const chatMessages = state.messages.filter(m => m.mode === 'chat');
      const conversationHistory = chatMessages.map(m => ({
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
- Be encouraging and constructive

📝 FOUNTAIN FORMAT HANDLING (CRITICAL):
- When providing screenplay examples, revisions, or dialogue:
  * ALWAYS use markdown code blocks with "fountain" language tag: \`\`\`fountain
  * Include ONLY the revised scene or section, NOT the entire screenplay
  * Tell the user WHERE to place the content (e.g., "Replace Scene 3 with this:" or "Insert this after line 45:")
  * Make code blocks copy-paste ready (proper formatting, no extra commentary inside the block)
- When asked for multiple examples:
  * Provide each example in its own separate code block
  * Label each example clearly (e.g., "EXAMPLE 1:", "EXAMPLE 2:")
  * Use code blocks even for single dialogue exchanges or short scenes
- NEVER:
  * Rewrite the entire screenplay in the response
  * Provide Fountain format outside of code blocks
  * Include instructions or commentary inside the code block
  * Assume the user wants the whole script - only provide what was requested

🎬 CINEMATIC THEMING (Minimal & Strategic):
- Use cinematic emojis sparingly (1-2 per response maximum)
- Use ONLY in section headers (H2/H3) for major topics:
  * 🎬 for general screenplay/plot analysis
  * 🎭 for character development/performance
  * 📽️ for scene analysis/technical aspects
  * ✨ for tips/quick fixes/priority lists
  * 💡 for creative ideas/suggestions
  * 🎪 for structure/act transitions
- DO NOT use emojis in:
  * Body paragraphs or explanations
  * Code blocks or technical details
  * Every message (only when organizing major sections)
  * Mid-sentence or randomly
- Keep it minimal: less is more. Emojis should enhance readability, not distract`;
      
      // Debug: Log editorContent status
      console.log('[ChatModePanel] Editor content status:', {
        hasEditorContent: !!editorContent,
        editorContentLength: editorContent?.length || 0,
        editorContentPreview: editorContent?.substring(0, 200) || 'EMPTY',
        cursorPosition: cursorPosition
      });
      
      // Build intelligent context using new context builder
      const contextData = buildStoryAdvisorContext(
        editorContent,
        cursorPosition,
        prompt,
        selectedModel,
        conversationHistory,
        systemPromptBase
      );
      
      console.log('[ChatModePanel] Context builder result:', {
        type: contextData.type,
        estimatedPages: contextData.estimatedPages,
        hasCurrentScene: !!contextData.currentScene,
        currentSceneHeading: contextData.currentScene?.heading,
        hasRelevantScenes: contextData.relevantScenes?.length || 0,
        hasContent: !!contextData.content
      });
      
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
      
      console.log('[ChatModePanel] Context prompt string:', {
        contextStringLength: contextPromptString.length,
        contextStringPreview: contextPromptString.substring(0, 500)
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
        <div className="flex items-center justify-between px-4 py-3 bg-[#1F1F1F] border-b border-[#DC143C]/20">
          <div className="flex items-center gap-2">
            <span className="text-[#E5E7EB]">
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
        <div className="px-4 py-2 border-b border-[#3F3F46] flex items-center gap-2 bg-[#0A0A0A]">
          <div className="w-2 h-2 rounded-full animate-pulse bg-[#00D9FF]" />
          <span className="text-sm text-[#E5E7EB]">
            AI Interview in progress: {activeWorkflow.type.charAt(0).toUpperCase() + activeWorkflow.type.slice(1)} creation
          </span>
        </div>
      )}
      
      {/* Instruction Messages */}
      {state.messages.filter(m => m.mode === 'chat').length === 0 && !state.input && (
        <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
          <div className="max-w-md w-full text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0A0A0A] border border-[#3F3F46] flex items-center justify-center mx-auto">
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-1.5 sm:mb-2">Story Advisor</h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] mb-3 sm:mb-4 px-2">
                Your professional screenplay consultant. Get advice, analysis, and creative guidance for your story. I don't generate Fountain format — that's handled by other tools.
              </p>
              <div className="text-xs text-[#6B7280] space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 px-2">
                <p>Try: "I'm stuck on Act 2. What should happen next?"</p>
                <p>or "Is Sarah's motivation clear enough?"</p>
                <p>or "Should I cut the warehouse scene?"</p>
                <p>or "How can I make this character more compelling?"</p>
              </div>
              <div className="text-xs text-[#6B7280] pt-2 sm:pt-3 border-t border-[#3F3F46] px-2">
                <p>💡 <strong>Tip:</strong> I can analyze scenes, characters, structure, pacing, and themes. Ask me anything about your screenplay!</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Messages Area - ChatGPT/Claude Style */}
      <div className="flex-1 chat-scroll-container">
        {(() => {
          // Memoize filtered messages to prevent recalculating on every render
          const chatMessages = state.messages.filter(m => m.mode === 'chat');
          return chatMessages.map((message, index) => {
            const isUser = message.role === 'user';
            const isLastAssistantMessage = 
              !isUser && 
              index === chatMessages.length - 1;
            
            // Story Advisor: No insert buttons (consultation only, no Fountain generation)
            
            return (
              <div
                key={index}
                className={`group w-full ${isUser ? 'bg-[#0A0A0A]/50' : 'bg-transparent'} border-b border-[#3F3F46]/30 transition-colors`}
              >
                <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 relative">
                  {/* Message Content - Full Width */}
                  <div className="w-full space-y-2">
                      {/* Story Advisor: Render markdown content (no insert buttons) */}
                    <div className="chat-message-content select-text">
                        {isUser ? (
                        <div className="whitespace-pre-wrap break-words text-[#E5E7EB] text-xs sm:text-sm leading-relaxed select-text">
                            {message.content}
                          </div>
                        ) : (
                        <div className="text-[#E5E7EB] text-xs sm:text-sm leading-relaxed select-text">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}
        
        {/* Streaming text - show insert button while streaming AND after streaming completes if it's screenplay content */}
        {state.streamingText && state.streamingText.trim().length > 0 && (
          <div className="group w-full bg-transparent border-b border-[#3F3F46]/30">
            <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
                {/* Streaming Content */}
              <div className="w-full space-y-2">
                <div className="text-[#E5E7EB] text-xs sm:text-sm leading-relaxed">
                    <MarkdownRenderer content={state.streamingText} />
                    {state.isStreaming && (
                    <span className="inline-block w-0.5 h-3 sm:h-4 ml-1 bg-purple-500 animate-pulse"></span>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor - only scrolls while streaming */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Placeholder Info with New Chat button - Compact */}
      <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border-t border-[#3F3F46] flex items-center justify-between">
        <span className="text-xs text-[#9CA3AF] truncate pr-2">
          {activeWorkflow ? (
            'Answer the question to continue the interview...'
          ) : (
            'Ask for advice, analysis, or creative guidance about your screenplay'
          )}
        </span>
        {(() => {
          const chatMessages = state.messages.filter(m => m.mode === 'chat');
          return chatMessages.length > 0;
        })() && (
          <button
            onClick={() => clearMessagesForMode('chat')}
            className="btn btn-xs btn-ghost gap-1 sm:gap-1.5 text-[#9CA3AF] hover:text-[#E5E7EB] flex-shrink-0"
            title="Start new chat"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-xs hidden sm:inline">New Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}

