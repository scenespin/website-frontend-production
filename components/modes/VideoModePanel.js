'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { Film, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function VideoModePanel({ onInsert }) {
  const { state, addMessage } = useChatContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  
  // Video settings
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [qualityTier, setQualityTier] = useState('professional');
  
  const aspectRatios = [
    { value: '16:9', label: 'YouTube (16:9)', icon: '🎥' },
    { value: '9:16', label: 'TikTok (9:16)', icon: '📱' },
    { value: '1:1', label: 'Instagram (1:1)', icon: '⬛' },
    { value: '4:3', label: 'Facebook (4:3)', icon: '📺' },
    { value: '21:9', label: 'Cinema (21:9)', icon: '🎬', premium: true }
  ];
  
  const qualityTiers = [
    { value: 'professional', label: 'Professional (1080p)', credits: 50 },
    { value: 'premium', label: 'Premium 4K', credits: 75 },
    { value: 'ultra', label: 'Ultra Native 4K', credits: 100 }
  ];
  
  const handleGenerate = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'video'
      });
      
      // Call API
      const response = await api.video.generateAsync({
        prompt: prompt.trim(),
        aspectRatio,
        qualityTier
      });
      
      // Add success message
      addMessage({
        role: 'assistant',
        content: `✅ Video generation started! Job ID: ${response.data.jobId}\n\nYour video is being generated. You can check the status in the Jobs tab or continue working - we'll notify you when it's ready!`,
        mode: 'video'
      });
      
      setGeneratedVideo(response.data);
      toast.success('Video generation started!');
      
      if (onInsert) {
        onInsert({ type: 'video_job', jobId: response.data.jobId });
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error(error.response?.data?.message || 'Failed to generate video');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, video generation failed. Please try again or contact support if the issue persists.',
        mode: 'video'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cinema-red to-cinema-blue text-white">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          <h3 className="font-bold">Quick Video Generation</h3>
        </div>
        <p className="text-xs text-white/80 mt-1">Generate professional video clips from text prompts</p>
      </div>
      
      {/* Settings */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 space-y-3">
        {/* Aspect Ratio */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">ASPECT RATIO</label>
          <div className="grid grid-cols-2 gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                className={`btn btn-sm ${
                  aspectRatio === ratio.value 
                    ? 'btn-primary' 
                    : 'btn-outline'
                } ${ratio.premium ? 'border-cinema-gold/50' : ''}`}
              >
                <span className="mr-1">{ratio.icon}</span>
                {ratio.label}
                {ratio.premium && <span className="badge badge-xs ml-1">+15cr</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quality Tier */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">QUALITY</label>
          <div className="space-y-1">
            {qualityTiers.map((tier) => (
              <button
                key={tier.value}
                onClick={() => setQualityTier(tier.value)}
                className={`btn btn-sm w-full justify-between ${
                  qualityTier === tier.value 
                    ? 'btn-primary' 
                    : 'btn-ghost'
                }`}
              >
                <span>{tier.label}</span>
                <span className="badge badge-sm">{tier.credits} cr</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'video')
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
        
        {/* Loading state */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-base-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cinema-blue" />
              <span className="text-sm">Generating video...</span>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'video').length === 0 && !isGenerating && (
          <div className="text-center text-base-content/60 py-10">
            <Film className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Generate Quick Videos</p>
            <p className="text-sm mb-6">Describe the video you want to create</p>
            
            {/* Quick actions */}
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs font-semibold text-base-content/60 mb-2">QUICK ACTIONS:</p>
              <button
                onClick={() => handleGenerate('A cinematic sunset over the ocean, golden hour lighting')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Cinematic Sunset
              </button>
              <button
                onClick={() => handleGenerate('A character walking through a busy city street, tracking shot')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Urban Tracking Shot
              </button>
              <button
                onClick={() => handleGenerate('Dramatic establishing shot of a modern office building')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Establishing Shot
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>💡 Tip: Be specific about camera movements, lighting, and mood for best results</p>
      </div>
    </div>
  );
}

