'use client';

import { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { api } from '@/lib/api';
import { Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export function ImageModePanel({ onInsert, imageEntityContext }) {
  const { state, addMessage } = useChatContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('photon');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const imageModels = [
    { id: 'photon', name: 'Luma Photon', description: 'Photorealistic', credits: 10 },
    { id: 'imagen-nano', name: 'Imagen Nano', description: 'Fast Edits & Variations', credits: 5 },
    { id: 'imagen', name: 'Google Imagen', description: 'Versatile & Fast', credits: 8 },
    { id: 'dalle', name: 'DALL-E 3', description: 'Creative & Artistic', credits: 12 }
  ];
  
  const aspectRatios = [
    { value: '1:1', label: 'Square', icon: '⬛' },
    { value: '16:9', label: 'Wide', icon: '🎥' },
    { value: '9:16', label: 'Portrait', icon: '📱' },
    { value: '4:3', label: 'Standard', icon: '📺' },
    { value: '21:9', label: 'Cinema', icon: '🎬' }
  ];
  
  const handleGenerate = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Add user message
      addMessage({
        role: 'user',
        content: prompt,
        mode: 'image'
      });
      
      // Call API
      const response = await api.image.generate({
        prompt: prompt.trim(),
        model: selectedModel,
        aspectRatio
      });
      
      // Add success message with image
      addMessage({
        role: 'assistant',
        content: '✅ Image generated!',
        mode: 'image',
        imageUrl: response.data.imageUrl
      });
      
      toast.success('Image generated!');
      
      if (onInsert) {
        onInsert({ type: 'image', url: response.data.imageUrl, s3Key: response.data.s3Key });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error.response?.data?.message || 'Failed to generate image');
      
      addMessage({
        role: 'assistant',
        content: '❌ Sorry, image generation failed. Please try again.',
        mode: 'image'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">Image Generation</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">Create character portraits, location concepts, and more</p>
      </div>
      
      {/* Entity Context Banner */}
      {imageEntityContext && (
        <div className="px-4 py-2 bg-base-300 border-b border-cinema-gold/20 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cinema-gold" />
          <span className="text-sm">
            Generating for: <strong>{imageEntityContext.name}</strong> ({imageEntityContext.type})
          </span>
        </div>
      )}
      
      {/* Model & Aspect Ratio Selection */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300 space-y-3">
        {/* Image Model */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">IMAGE MODEL</label>
          <div className="grid grid-cols-2 gap-2">
            {imageModels.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`btn btn-sm ${
                  selectedModel === model.id 
                    ? 'btn-primary' 
                    : 'btn-outline'
                } flex-col h-auto py-2`}
              >
                <span className="font-semibold text-xs">{model.name}</span>
                <span className="text-[10px] opacity-70">{model.description}</span>
                <span className="badge badge-xs mt-1">{model.credits} cr</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Screen Size (Aspect Ratio) */}
        <div>
          <label className="text-xs font-semibold text-base-content/70 mb-2 block">SCREEN SIZE</label>
          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                className={`btn btn-xs ${
                  aspectRatio === ratio.value 
                    ? 'btn-primary' 
                    : 'btn-outline'
                }`}
              >
                <span className="mr-1">{ratio.icon}</span>
                {ratio.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {state.messages
          .filter(m => m.mode === 'image')
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
                  
                  {/* Show generated image */}
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Generated" 
                      className="mt-2 rounded-lg max-w-full border border-cinema-gold/20"
                    />
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
              <span className="text-sm">Generating image...</span>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {state.messages.filter(m => m.mode === 'image').length === 0 && !isGenerating && (
          <div className="text-center text-base-content/60 py-10">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-cinema-gold" />
            <p className="text-lg font-semibold mb-2">Generate Images</p>
            <p className="text-sm mb-6">Describe the image you want to create</p>
            
            {/* Quick actions */}
            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs font-semibold text-base-content/60 mb-2">QUICK ACTIONS:</p>
              <button
                onClick={() => handleGenerate('Professional headshot of a detective, 35mm portrait photography')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Character Portrait
              </button>
              <button
                onClick={() => handleGenerate('Abandoned warehouse interior, cinematic lighting, wide angle')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Location Concept
              </button>
              <button
                onClick={() => handleGenerate('Futuristic city skyline at night, neon lights, cyberpunk aesthetic')}
                className="btn btn-sm btn-outline w-full"
                disabled={isGenerating}
              >
                Environment Art
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>💡 Tip: Include details about lighting, angle, and mood for better results</p>
      </div>
    </div>
  );
}

