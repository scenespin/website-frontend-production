'use client';

import { useChatContext } from '@/contexts/ChatContext';
import { MessageSquare, Mic, Sparkles } from 'lucide-react';

export function DialogueModePanel({ onInsert }) {
  const { state } = useChatContext();
  
  const quickActions = [
    { label: 'Write Scene Dialogue', prompt: 'Write compelling dialogue for this scene with subtext' },
    { label: 'Improve Dialogue', prompt: 'Rewrite this dialogue to add more subtext and character voice' },
    { label: 'Character Voice', prompt: 'Help me develop a unique voice for this character' }
  ];
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cinema-red to-cinema-blue text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-bold">Dialogue Writing</h3>
        </div>
        <p className="text-xs text-white/80 mt-1">Craft compelling dialogue with subtext and character voice</p>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'dialogue')
          .map((message, index) => {
            const isUser = message.role === 'user';
            
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  isUser 
                    ? 'bg-cinema-red text-white' 
                    : 'bg-base-200 text-base-content'
                }`}>
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'dialogue').length === 0 && (
          <div className="text-center text-base-content/60 py-10">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Dialogue Writing Mode</p>
            <p className="text-sm mb-6">Get help writing compelling dialogue with subtext</p>
            
            {/* Quick actions */}
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs font-semibold text-base-content/60 mb-2">QUICK ACTIONS:</p>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className="btn btn-sm btn-outline w-full"
                >
                  {action.label}
                </button>
              ))}
            </div>
            
            {/* Tips */}
            <div className="mt-6 text-xs text-left bg-base-200 p-3 rounded-lg max-w-sm mx-auto">
              <p className="font-semibold mb-1">💡 Dialogue Writing Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-base-content/70">
                <li>Subtext is king - what&apos;s NOT said matters</li>
                <li>Each character speaks differently</li>
                <li>Avoid &quot;on the nose&quot; dialogue</li>
                <li>Use interruptions and pauses</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>💬 Master screenwriting dialogue with subtext, character voice, and natural rhythm</p>
      </div>
    </div>
  );
}

