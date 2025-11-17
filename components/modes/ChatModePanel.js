'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { FileText, Sparkles, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt } from '@/utils/sceneDetection';
import { buildChatContentPrompt, buildChatAdvicePrompt, detectContentRequest } from '@/utils/promptBuilders';
import toast from 'react-hot-toast';

export function ChatModePanel({ onInsert, onWorkflowComplete, editorContent, cursorPosition }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext } = useChatContext();
  const {
    activeWorkflow,
    workflowCompletionData,
    clearWorkflowCompletion,
    isScreenplayContent
  } = useChatMode();
  
  // Model selection for AI chat
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'chat'), state.streamingText, state.isStreaming]);
  
  // Detect scene context when drawer opens or editor content/cursor changes
  useEffect(() => {
    if (editorContent && cursorPosition !== undefined) {
      const sceneContext = detectCurrentScene(editorContent, cursorPosition);
      if (sceneContext) {
        setSceneContext({
          heading: sceneContext.heading,
          act: sceneContext.act,
          characters: sceneContext.characters,
          pageNumber: sceneContext.pageNumber
        });
      }
    }
  }, [editorContent, cursorPosition, setSceneContext]);
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // ALWAYS detect current scene for context (re-detect on each message)
      const sceneContext = detectCurrentScene(editorContent, cursorPosition);
      
      // Update global scene context state (for banner display)
      if (sceneContext) {
        setSceneContext({
          heading: sceneContext.heading,
          act: sceneContext.act,
          characters: sceneContext.characters,
          pageNumber: sceneContext.pageNumber
        });
      }
      
      // Detect if this is content generation vs advice request
      const isContentRequest = detectContentRequest(prompt);
      
      // Build appropriate prompt using prompt builders
      const builtPrompt = isContentRequest 
        ? buildChatContentPrompt(prompt, sceneContext)
        : buildChatAdvicePrompt(prompt, sceneContext);
      
      // Build system prompt with scene context
      let systemPrompt = `You are a professional screenwriting assistant helping a screenwriter with their screenplay.`;
      
      if (sceneContext) {
        systemPrompt += `\n\n[SCENE CONTEXT - Use this to provide contextual responses]\n`;
        systemPrompt += `Current Scene: ${sceneContext.heading}\n`;
        systemPrompt += `Act: ${sceneContext.act}\n`;
        systemPrompt += `Page: ${sceneContext.pageNumber} of ${sceneContext.totalPages}\n`;
        if (sceneContext.characters && sceneContext.characters.length > 0) {
          systemPrompt += `Characters in scene: ${sceneContext.characters.join(', ')}\n`;
        }
        systemPrompt += `\nScene Content:\n${sceneContext.content.substring(0, 1000)}${sceneContext.content.length > 1000 ? '...' : ''}\n`;
        systemPrompt += `\nIMPORTANT: Use this scene context to provide relevant, contextual responses. Reference the scene, characters, and content when appropriate.`;
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'chat'
      });
      
      // Build conversation history (last 10 messages)
      const chatMessages = state.messages.filter(m => m.mode === 'chat').slice(-10);
      const conversationHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Call streaming AI API
      setStreaming(true, '');
      let accumulatedText = '';
      
      await api.chat.generateStream(
        {
          userPrompt: builtPrompt, // Use built prompt instead of raw prompt
          systemPrompt: systemPrompt,
          desiredModelId: selectedModel,
          conversationHistory,
          sceneContext: sceneContext ? {
            heading: sceneContext.heading,
            act: sceneContext.act,
            characters: sceneContext.characters,
            pageNumber: sceneContext.pageNumber
          } : null
        },
        // onChunk
        (chunk) => {
          accumulatedText += chunk;
          setStreaming(true, accumulatedText);
        },
        // onComplete
        (fullContent) => {
          setStreaming(false, '');
          addMessage({
            role: 'assistant',
            content: fullContent,
            mode: 'chat'
          });
        },
        // onError
        (error) => {
          console.error('Error in streaming:', error);
          setStreaming(false, '');
          toast.error(error.message || 'Failed to get AI response');
          addMessage({
            role: 'assistant',
            content: '❌ Sorry, I encountered an error. Please try again.',
            mode: 'chat'
          });
        }
      );
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setStreaming(false, '');
      toast.error(error.response?.data?.message || error.message || 'Failed to get AI response');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
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
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cinema-red" />
            <h3 className="font-bold text-base-content">General Screenwriting</h3>
          </div>
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
      
      {/* Chat Messages Area - ChatGPT/Claude Style */}
      <div className="flex-1 chat-scroll-container">
        {state.messages
          .filter(m => m.mode === 'chat')
          .map((message, index) => {
            const isUser = message.role === 'user';
            const isLastAssistantMessage = 
              !isUser && 
              index === state.messages.filter(m => m.mode === 'chat').length - 1;
            
            // Show insert button for screenplay content
            const showInsertButton = 
              !isUser && 
              isLastAssistantMessage && 
              !activeWorkflow && 
              !workflowCompletionData &&
              isScreenplayContent(message.content);
            
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
                      <div className="prose prose-sm md:prose-base max-w-none chat-message-content">
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words text-base-content">
                            {message.content}
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.content} />
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      {showInsertButton && onInsert && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => onInsert(message.content)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-base-200 hover:bg-base-300 text-base-content transition-colors duration-200"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Insert into script
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Streaming text */}
        {state.isStreaming && state.streamingText && (
          <div className="group w-full bg-base-200/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <div className="flex gap-4 md:gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-base-content">
                  <Bot className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                
                {/* Streaming Content */}
                <div className="flex-1 min-w-0">
                  <div className="prose prose-sm md:prose-base max-w-none chat-message-content">
                    <MarkdownRenderer content={state.streamingText} />
                    <span className="inline-block w-0.5 h-5 ml-1 bg-purple-500 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Placeholder Info */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        {activeWorkflow ? (
          <span>Answer the question to continue the interview...</span>
        ) : (
          <span>Ask me anything about your screenplay</span>
        )}
      </div>
    </div>
  );
}

