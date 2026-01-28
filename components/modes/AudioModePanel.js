'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Music, Loader2, Sparkles, Volume2, Disc3, Film } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import AudioResultActions from '@/components/shared/AudioResultActions';
import { CloudSavePrompt } from '@/components/CloudSavePrompt';

export function AudioModePanel({ onInsert, projectId }) {
  const { state, addMessage } = useChatContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioType, setAudioType] = useState('music'); // 'soundtrack', 'music', 'sfx'
  const [selectedQuality, setSelectedQuality] = useState('premium');
  
  // Cloud save prompt state
  const [cloudSavePrompt, setCloudSavePrompt] = useState({
    isOpen: false,
    fileUrl: null,
    fileType: 'audio',
    fileName: null,
    metadata: {}
  });
  
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
    { 
      id: 'separate', 
      icon: Sparkles, 
      label: 'Separate Audio', 
      description: 'Split vocals & instrumentals',
      examples: ['Extract vocals from song', 'Isolate background music', 'Remove voice for karaoke']
    },
    { 
      id: 'extend', 
      icon: Music, 
      label: 'Extend Music', 
      description: 'Make songs longer',
      examples: ['Extend outro from 2min to 4min', 'Add new verse to song', 'Continue music theme']
    },
    { 
      id: 'video-audio', 
      icon: Film, 
      label: 'Add Audio to Video', 
      description: 'AI-generated sound for video',
      examples: ['Add footsteps to walking scene', 'Generate ambient city sounds', 'Create fitting soundtrack']
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
      
      // Call audio generation API (projectId for Jobs Panel when in screenplay context)
      const payload = { 
        prompt: prompt.trim(), 
        type: audioType, 
        quality: selectedQuality 
      };
      if (projectId) payload.projectId = projectId;
      const response = await api.audio.generate(payload);
      
      // Calculate expiration (7 days)
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
      
      let typeInfo;
      if (audioType === 'sfx') typeInfo = 'Sound effect';
      else if (audioType === 'soundtrack') typeInfo = 'Soundtrack';
      else if (audioType === 'music') typeInfo = 'Background music';
      else if (audioType === 'separate') typeInfo = 'Audio separation';
      else if (audioType === 'extend') typeInfo = 'Music extension';
      else if (audioType === 'video-audio') typeInfo = 'Video audio';
      else typeInfo = 'Audio';
      
      addMessage({
        role: 'assistant',
        content: `🎵 ${typeInfo} generated successfully!\n\n⚠️ **Save to Keep**: Files expire in 7 days. Save to your Dropbox or Google Drive to keep permanently. We don't store your files.`,
        mode: 'audio',
        audioUrl: response.data.audioUrl,
        audioType: typeInfo,
        expiresAt
      });
      
      toast.success(`${typeInfo} generated! Remember to save it.`);
      
      // PROMPT TO SAVE TO CLOUD STORAGE
      setCloudSavePrompt({
        isOpen: true,
        fileUrl: response.data.audioUrl,
        fileType: 'audio',
        fileName: `${audioType}-${Date.now()}.mp3`,
        metadata: {
          audioType,
          quality: selectedQuality,
          prompt: prompt.trim(),
          generatedAt: new Date().toISOString()
        }
      });
      
      if (onInsert) {
        onInsert({ type: 'audio', url: response.data.audioUrl });
      }
      
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(error.response?.data?.message || 'Failed to generate audio');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, audio generation failed. Please try again.',
        mode: 'audio'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header removed - drawer already shows "Audio" label */}
      
      {/* Audio Type Selection */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 space-y-3">
        <label className="text-xs font-semibold text-base-content/70 mb-2 block">AUDIO TYPE</label>
        
        {/* Generate Tab */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {audioTypes.filter(t => ['soundtrack', 'music', 'sfx'].includes(t.id)).map((type) => {
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
        
        {/* Modify Tab */}
        <div className="border-t border-base-300 pt-3">
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">🔧 AUDIO TOOLS</label>
          <div className="grid grid-cols-3 gap-2">
            {audioTypes.filter(t => ['separate', 'extend', 'video-audio'].includes(t.id)).map((type) => {
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
                    ? 'bg-cinema-red text-base-content' 
                    : 'bg-base-200 text-base-content'
                }`}>
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  
                  {/* Show generated audio with download/save actions */}
                  {message.audioUrl && (
                    <div className="mt-3 space-y-2">
                      {/* Audio Result Actions */}
                      <AudioResultActions
                        audioUrl={message.audioUrl}
                        filename={`wryda-${message.audioType?.toLowerCase().replace(/\s+/g, '-') || 'audio'}`}
                        expiresAt={message.expiresAt}
                        showExpirationWarning={true}
                        size="small"
                        showPreview={true}
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
      
      {/* Cloud Save Prompt */}
      <CloudSavePrompt
        isOpen={cloudSavePrompt.isOpen}
        fileUrl={cloudSavePrompt.fileUrl}
        fileType={cloudSavePrompt.fileType}
        fileName={cloudSavePrompt.fileName}
        metadata={cloudSavePrompt.metadata}
        onClose={(result) => {
          setCloudSavePrompt(prev => ({ ...prev, isOpen: false }));
          if (result?.saved) {
            console.log('[AudioModePanel] Audio saved to cloud:', result.cloudUrl);
            toast.success('Audio saved to cloud storage!');
          }
        }}
      />
    </div>
  );
}
