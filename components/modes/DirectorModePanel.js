'use client';

import { useChatContext } from '@/contexts/ChatContext';
import { Film, Camera, Clapperboard } from 'lucide-react';

export function DirectorModePanel() {
  const { state } = useChatContext();
  
  const quickActions = [
    { label: 'Shot List', prompt: 'Create a shot list for this scene with camera angles and movements' },
    { label: 'Camera Blocking', prompt: 'Suggest camera blocking and character positions for this scene' },
    { label: 'Visual Composition', prompt: 'Describe the visual composition and framing for this shot' }
  ];
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">Director Mode</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">Cinematic direction, shot planning, and visual storytelling</p>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'director')
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
        {state.messages.filter(m => m.mode === 'director').length === 0 && (
          <div className="text-center text-base-content/60 py-10">
            <Camera className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Director Mode</p>
            <p className="text-sm mb-6">Get cinematic direction and shot planning advice</p>
            
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
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>🎬 Get professional direction for camera angles, blocking, and visual storytelling</p>
      </div>
    </div>
  );
}

