'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Film, Camera, Clapperboard } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { api } from '@/lib/api';
import { detectCurrentScene, buildContextPrompt } from '@/utils/sceneDetection';
import toast from 'react-hot-toast';

export function DirectorModePanel({ editorContent, cursorPosition }) {
  const { state, addMessage, setInput } = useChatContext();
  
  // Model selection for Director agent
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929');
  const [isSending, setIsSending] = useState(false);
  
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
      // Detect current scene for context
      const sceneContext = detectCurrentScene(editorContent, cursorPosition);
      const contextPrompt = sceneContext ? buildContextPrompt(sceneContext) : '';
      
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
        mode: 'director'
      });
      
      // Clear input
      setInput('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to get AI response');
      
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
      {/* Header with Model Selector */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2 mb-3">
          <Clapperboard className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">Director Agent</h3>
        </div>
        <ModelSelector 
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        <p className="text-xs text-base-content/60 mt-2">Cinematic direction, shot planning, dialogue writing, and visual storytelling</p>
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

