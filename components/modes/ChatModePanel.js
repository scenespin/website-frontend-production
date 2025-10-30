'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { FileText, Sparkles, User, Bot } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt } from '@/utils/sceneDetection';
import toast from 'react-hot-toast';

export function ChatModePanel({ onInsert, onWorkflowComplete, editorContent, cursorPosition }) {
  const { state, addMessage, setInput } = useChatContext();
  const {
    activeWorkflow,
    workflowCompletionData,
    clearWorkflowCompletion,
    isScreenplayContent
  } = useChatMode();
  
  // Model selection for AI chat
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  
  // Handle sending messages to AI
  const handleSend = async (prompt) => {
    if (!prompt || !prompt.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Detect current scene for context
      const sceneContext = detectCurrentScene(editorContent, cursorPosition);
      const contextPrompt = sceneContext ? buildContextPrompt(sceneContext) : '';
      
      // Add user message
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
      
      // Call AI API
      const response = await api.chat.generate({
        userPrompt: prompt + contextPrompt,
        desiredModelId: selectedModel,
        conversationHistory,
        sceneContext: sceneContext ? {
          heading: sceneContext.heading,
          act: sceneContext.act,
          characters: sceneContext.characters,
          pageNumber: sceneContext.pageNumber
        } : null
      });
      
      // Add AI response
      addMessage({
        role: 'assistant',
        content: response.data.response || response.data.text || 'Sorry, I couldn\'t generate a response.',
        mode: 'chat'
      });
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to get AI response');
      
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
      {/* Header with Model Selector */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cinema-red" />
            <h3 className="font-bold text-base-content">General Screenwriting</h3>
          </div>
        </div>
        <ModelSelector 
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        <p className="text-xs text-base-content/60 mt-2">Brainstorming, world-building, character development, and general Q&A</p>
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
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  isUser 
                    ? 'bg-cinema-red text-white' 
                    : 'bg-base-200 text-base-content'
                }`}>
                  <div className="flex items-start gap-2">
                    {!isUser && <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                    <div className="whitespace-pre-wrap break-words flex-1">
                      {message.content}
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
              <div className="whitespace-pre-wrap break-words">
                {state.streamingText}
                <span className="animate-pulse">▊</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Placeholder Info */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        {activeWorkflow ? (
          <span>Answer the question to continue the interview...</span>
        ) : (
          <span>Ask me anything about your screenplay or request AI workflows</span>
        )}
      </div>
    </div>
  );
}

