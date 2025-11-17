'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { Film, Camera, Clapperboard, FileText, User, Bot, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt } from '@/utils/sceneDetection';
import { buildDirectorPrompt } from '@/utils/promptBuilders';
import toast from 'react-hot-toast';

export function DirectorModePanel({ editorContent, cursorPosition, onInsert }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext } = useChatContext();
  const { isScreenplayContent } = useChatMode();
  
  // Use model from ChatContext (set by UnifiedChatPanel's LLMModelSelector)
  const selectedModel = state.selectedModel || 'claude-sonnet-4-5-20250929';
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'director'), state.streamingText, state.isStreaming]);
  
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
        console.log('[DirectorModePanel] Scene context detected:', detectedContext.heading, 'cursorPosition:', cursorPosition);
      } else {
        console.warn('[DirectorModePanel] No scene context detected. editorContent length:', editorContent?.length, 'cursorPosition:', cursorPosition);
      }
    }
  }, [editorContent, cursorPosition, setSceneContext]);
  
  // Director agent focuses on scene generation - no quick actions needed
  // User provides prompts and agent creates scenes/parts of scenes
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // ALWAYS detect current scene for context (re-detect on each message)
      let sceneContext = detectCurrentScene(editorContent, cursorPosition);
      
      // Fallback to state scene context if detection fails
      if (!sceneContext && state.sceneContext) {
        console.log('[DirectorModePanel] Using state scene context as fallback');
        // Reconstruct full scene context from state (we need content for the prompt)
        sceneContext = {
          heading: state.sceneContext.heading,
          act: state.sceneContext.act,
          characters: state.sceneContext.characters || [],
          pageNumber: state.sceneContext.pageNumber,
          totalPages: state.sceneContext.totalPages || 100,
          content: editorContent ? editorContent.substring(0, 1000) : ''
        };
      }
      
      // Update global scene context state (for banner display)
      if (sceneContext) {
        setSceneContext({
          heading: sceneContext.heading,
          act: sceneContext.act,
          characters: sceneContext.characters,
          pageNumber: sceneContext.pageNumber,
          totalPages: sceneContext.totalPages
        });
        console.log('[DirectorModePanel] Scene context:', sceneContext.heading, 'Act:', sceneContext.act, 'Characters:', sceneContext.characters?.length || 0);
      } else {
        console.warn('[DirectorModePanel] No scene context detected. editorContent:', !!editorContent, 'cursorPosition:', cursorPosition);
      }
      
      // Build Director prompt using prompt builder (includes context and full scene instructions)
      const builtPrompt = buildDirectorPrompt(prompt, sceneContext);
      
      // Build system prompt with Director Mode instructions - focused on scene generation
      let systemPrompt = `You are a professional film director assistant helping a screenwriter create scenes.

DIRECTOR MODE - SCENE GENERATION:
- Generate FULL SCENES (5-15+ lines) or parts of scenes as requested
- User provides basic info, you write complete screenplay content
- Include: action lines, dialogue (when appropriate), parentheticals, atmosphere
- Write in Fountain screenplay format
- Be direct and concise - no explanations, just the scene content
- Context-aware: Use current scene, characters, and story context when available`;
      
      if (sceneContext) {
        systemPrompt += `\n\n[SCENE CONTEXT - Use this to provide contextual responses]\n`;
        systemPrompt += `Current Scene: ${sceneContext.heading}\n`;
        systemPrompt += `Act: ${sceneContext.act}\n`;
        systemPrompt += `Page: ${sceneContext.pageNumber} of ${sceneContext.totalPages}\n`;
        if (sceneContext.characters && sceneContext.characters.length > 0) {
          systemPrompt += `Characters in scene: ${sceneContext.characters.join(', ')}\n`;
        }
        systemPrompt += `\nScene Content:\n${sceneContext.content.substring(0, 1000)}${sceneContext.content.length > 1000 ? '...' : ''}\n`;
        systemPrompt += `\nIMPORTANT: Use this scene context to provide relevant, contextual direction. Reference the scene, characters, and content when appropriate.`;
      }
      
      // Add user message (show original prompt, not built prompt)
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'director'
      });
      
      // Build conversation history (last 10 messages)
      const directorMessages = state.messages.filter(m => m.mode === 'director').slice(-10);
      const conversationHistory = directorMessages.map(m => ({
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
            mode: 'director'
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
            mode: 'director'
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
        mode: 'director'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 chat-scroll-container px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'director')
          .map((message, index) => {
            const isUser = message.role === 'user';
            const directorMessages = state.messages.filter(m => m.mode === 'director');
            const isLastAssistantMessage = 
              !isUser && 
              index === directorMessages.length - 1;
            
            // Show insert button for screenplay content (dialogue, directions, etc.)
            const showInsertButton = 
              !isUser && 
              isLastAssistantMessage && 
              isScreenplayContent(message.content);
            
            return (
              <div
                key={index}
                className={`group flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <div className={`max-w-[85%] rounded-lg px-4 py-3 relative ${
                  isUser 
                    ? 'bg-cinema-red text-base-content' 
                    : 'bg-base-200 text-base-content'
                }`}>
                  <div className="flex items-start gap-2">
                    {!isUser && <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0 chat-message-content">
                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                    </div>
                    {isUser && <User className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                  </div>
                  
                </div>
                
                {/* Insert Button */}
                {showInsertButton && onInsert && (
                  <button
                    onClick={() => onInsert(message.content)}
                    className="btn btn-xs btn-outline gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Insert into script
                  </button>
                )}
              </div>
            );
          })}
        
        {/* Streaming text */}
        {state.isStreaming && state.streamingText && (
          <div className="flex flex-col gap-2">
            <div className="max-w-[85%] rounded-lg px-4 py-3 bg-base-200 text-base-content">
              <div className="flex items-start gap-2">
                <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 chat-message-content">
                  <MarkdownRenderer content={state.streamingText} />
                  <span className="inline-block w-0.5 h-5 ml-1 bg-purple-500 animate-pulse"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Empty state - Simple prompt for scene generation */}
        {state.messages.filter(m => m.mode === 'director').length === 0 && (
          <div className="text-center text-base-content/60 py-10">
            <Camera className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Director Agent</p>
            <p className="text-sm mb-2">Create full scenes or parts of scenes from your prompts.</p>
            <p className="text-xs text-base-content/40">Provide basic info and I'll write a draft scene with action, dialogue, and direction.</p>
          </div>
        )}
      </div>
      
      {/* Info footer with New Chat button */}
      <div className="px-4 py-2 border-t border-base-300 flex items-center justify-between">
        <p className="text-xs text-base-content/60">🎬 Professional direction for camera, blocking, visual storytelling, and dialogue</p>
        {state.messages.filter(m => m.mode === 'director').length > 0 && (
          <button
            onClick={() => clearMessagesForMode('director')}
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

