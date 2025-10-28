'use client';

import { useChatContext } from '@/contexts/ChatContext';
import { useChatMode } from '@/hooks/useChatMode';
import { FileText, Sparkles, User, Bot } from 'lucide-react';

export function ChatModePanel({ onInsert, onWorkflowComplete }) {
  const { state } = useChatContext();
  const {
    activeWorkflow,
    workflowCompletionData,
    clearWorkflowCompletion,
    isScreenplayContent
  } = useChatMode();
  
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

