'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Music, Loader2, Sparkles, Volume2, Disc3 } from 'lucide-react';
import toast from 'react-hot-toast';

export function AudioModePanel({ onInsert }) {
  const { state, addMessage } = useChatContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioType, setAudioType] = useState('music'); // 'soundtrack', 'music', 'sfx'
  const [selectedQuality, setSelectedQuality] = useState('premium');
  
  const qualityLevels = [
    { id: 'fast', name: 'Fast', description: 'Quick generation', credits: 80 },
    { id: 'standard', name: 'Standard', description: 'High quality', credits: 100 },
    { id: 'premium', name: 'Premium', description: 'Best quality', credits: 120 },
    { id: 'ultra', name: 'Ultra', description: 'Maximum fidelity', credits: 150 },
  ];
  
  const audioTypes = [
    { 
      id: 'soundtrack', 
      icon: Disc3, 
      label: 'Soundtrack', 
      description: 'Full song with vocals/instruments',
      examples: ['Epic theme song', 'Character theme with vocals', 'Opening credits music']
    },
    { 
      id: 'music', 
      icon: Music, 
      label: 'Background Music', 
      description: 'Instrumental themes & scores',
      examples: ['Tense investigation music', 'Romantic piano theme', 'Action sequence score']
    },
    { 
      id: 'sfx', 
      icon: Volume2, 
      label: 'Sound Effect', 
      description: 'SFX & ambient sounds',
      examples: ['Door creaking open', 'City street ambience', 'Explosion sound']
    },
  ];
  
  const currentType = audioTypes.find(t => t.id === audioType) || audioTypes[1];
  
  const handleGenerate = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      addMessage({
        role: 'user',
        content: `[${currentType.label}] ${prompt}`,
        mode: 'audio'
      });
      
      // TODO: Call audio generation API
      // const response = await api.audio.generate({ prompt, type: audioType, quality: selectedQuality });
      
      // Simulated success
      setTimeout(() => {
        const typeInfo = audioType === 'sfx' ? 'Sound effect' : audioType === 'soundtrack' ? 'Soundtrack' : 'Background music';
        addMessage({
          role: 'assistant',
          content: `🎵 ${typeInfo} generation started!\n\nYour audio is being generated with ${qualityLevels.find(q => q.id === selectedQuality)?.name} quality.\n\nThis will take 1-2 minutes. We'll notify you when it's ready!`,
          mode: 'audio'
        });
        
        toast.success(`${typeInfo} generation started!`);
        setIsGenerating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, audio generation failed. Please try again.',
        mode: 'audio'
      });
      
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">Audio & Music Generation</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">Soundtracks, background music & sound effects</p>
      </div>
      
      {/* Audio Type Selection */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 space-y-3">
        <label className="text-xs font-semibold text-base-content/70 mb-2 block">AUDIO TYPE</label>
        <div className="grid grid-cols-3 gap-2">
          {audioTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setAudioType(type.id)}
                disabled={isGenerating}
                className={`btn btn-sm ${
                  audioType === type.id 
                    ? 'btn-primary' 
                    : 'btn-outline'
                } flex-col h-auto py-3`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="font-semibold text-xs">{type.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Quality Selection */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">QUALITY</label>
          <div className="grid grid-cols-4 gap-2">
            {qualityLevels.map((quality) => (
              <button
                key={quality.id}
                onClick={() => setSelectedQuality(quality.id)}
                disabled={isGenerating}
                className={`btn btn-xs ${
                  selectedQuality === quality.id 
                    ? 'btn-primary' 
                    : 'btn-outline'
                } flex-col h-auto py-2`}
              >
                <span className="font-semibold text-[10px]">{quality.name}</span>
                <span className="badge badge-xs mt-1">{quality.credits}cr</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'audio')
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
                  
                  {/* Audio player if available */}
                  {message.audioUrl && (
                    <div className="mt-2">
                      <audio 
                        controls 
                        src={message.audioUrl} 
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        
        {/* Loading state */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-base-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cinema-blue" />
              <span className="text-sm">Generating audio...</span>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'audio').length === 0 && !isGenerating && (
          <div className="text-center text-base-content/60 py-10">
            <currentType.icon className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">{currentType.label}</p>
            <p className="text-sm mb-6">{currentType.description}</p>
            
            {/* Quick actions */}
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs font-semibold text-base-content/60 mb-2">EXAMPLES:</p>
              {currentType.examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerate(example)}
                  className="btn btn-sm btn-outline w-full"
                  disabled={isGenerating}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer - WRAPPER SAFE! */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>🎵 AI-powered audio generation • Takes 1-2 minutes • {currentType.description}</p>
      </div>
    </div>
  );
}
