'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { Film, Camera, Clapperboard, FileText, User, Bot, Copy, Check, RotateCcw } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt } from '@/utils/sceneDetection';
import toast from 'react-hot-toast';

export function DirectorModePanel({ editorContent, cursorPosition, onInsert }) {
  const { state, addMessage, setInput, setStreaming, clearMessagesForMode, setSceneContext } = useChatContext();
  const { isScreenplayContent } = useChatMode();
  
  // Use model from ChatContext (set by UnifiedChatPanel's LLMModelSelector)
  const selectedModel = state.selectedModel || 'claude-sonnet-4-5-20250929';
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [state.messages.filter(m => m.mode === 'director'), state.streamingText, state.isStreaming]);
  
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
  
  const quickActions = [
    // Cinematic Direction
    { label: 'Shot List', prompt: 'Create a detailed shot list for this scene with camera angles, movements, and framing', category: 'direction' },
    { label: 'Camera Blocking', prompt: 'Suggest camera blocking and character positions for this scene', category: 'direction' },
    { label: 'Visual Composition', prompt: 'Describe the visual composition and framing for this shot', category: 'direction' },
    // Dialogue Writing
    { label: 'Write Dialogue', prompt: 'Write compelling dialogue for this scene with subtext and character voice', category: 'dialogue' },
    { label: 'Improve Dialogue', prompt: 'Rewrite this dialogue to add more subtext, conflict, and natural rhythm', category: 'dialogue' },
    { label: 'Character Voice', prompt: 'Help me develop a unique voice for this character based on their background and personality', category: 'dialogue' }
  ];
  
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
      
      // Build system prompt with scene context
      let systemPrompt = `You are a professional film director assistant helping a screenwriter with shot planning, camera work, blocking, and dialogue direction.`;
      
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
      
      // Add user message
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
          userPrompt: prompt,
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
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-cinema-red" />
            <h3 className="font-bold text-base-content">Director Agent</h3>
          </div>
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
                  
                  {/* Copy Button - appears on hover at bottom of message */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleCopy(message.content, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs text-base-content/60 hover:text-base-content hover:bg-base-300/50"
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
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'director').length === 0 && (
          <div className="text-center text-base-content/60 py-10">
            <Camera className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Director Agent</p>
            <p className="text-sm mb-6">Get professional direction for shots, camera work, and dialogue</p>
            
            {/* Quick actions - grouped by category */}
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2">🎬 CINEMATIC DIRECTION:</p>
                <div className="space-y-2">
                  {quickActions.filter(a => a.category === 'direction').map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.prompt)}
                      disabled={isSending}
                      className="btn btn-sm btn-outline w-full"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-base-content/60 mb-2">💬 DIALOGUE WRITING:</p>
                <div className="space-y-2">
                  {quickActions.filter(a => a.category === 'dialogue').map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.prompt)}
                      disabled={isSending}
                      className="btn btn-sm btn-outline w-full"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>🎬 Professional direction for camera, blocking, visual storytelling, and dialogue</p>
      </div>
    </div>
  );
}

