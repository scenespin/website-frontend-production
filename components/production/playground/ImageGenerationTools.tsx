'use client';

/**
 * Image Generation Tools
 * 
 * Pre-Production image generation with model selection.
 * Categories: Character, Location, Asset, First Frame
 */

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Package, Film, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';

interface ImageGenerationToolsProps {
  className?: string;
}

type ImageCategory = 'character' | 'location' | 'asset' | 'first-frame';

interface ImageModel {
  id: string;
  provider: string;
  costPerImage: number;
  creditsPerImage: number;
}

export function ImageGenerationTools({ className = '' }: ImageGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState<ImageCategory>('character');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [models, setModels] = useState<ImageModel[]>([]);
  const [transparency, setTransparency] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        // Use API proxy route
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        
        const response = await apiModule.image.getModels();
        const modelsData = response.data?.models || response.data?.data?.models || [];
        setModels(modelsData);
        
        // Set default model (cheapest)
        if (modelsData.length > 0 && !selectedModel) {
          setSelectedModel(modelsData[0].id);
        }
      } catch (error: any) {
        console.error('Failed to load image models:', error);
        toast.error('Failed to load image models');
      } finally {
        setIsLoadingModels(false);
      }
    };

    if (getToken) {
      fetchModels();
    }
  }, [getToken, selectedModel]);

  const categories = [
    { id: 'character' as ImageCategory, label: 'Character', icon: Users, description: 'Generate character reference images' },
    { id: 'location' as ImageCategory, label: 'Location', icon: MapPin, description: 'Generate location reference images' },
    { id: 'asset' as ImageCategory, label: 'Asset', icon: Package, description: 'Generate prop/asset reference images' },
    { id: 'first-frame' as ImageCategory, label: 'First Frame', icon: Film, description: 'Generate first frame for video' },
  ];

  const aspectRatios = [
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Classic)' },
    { value: '21:9', label: '21:9 (Cinema)' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || !selectedModel) return;

    setIsGenerating(true);
    try {
      const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));

      const response = await apiModule.image.generate({
        prompt: prompt.trim(),
        desiredModelId: selectedModel,
        aspectRatio,
        quality: transparency ? 'high-quality' : 'standard',
        // Save to Playground folder
        projectId: screenplayId,
        entityType: 'playground',
      });

      toast.success('Image generated! Saving to Playground...');
      
      // Reset form
      setPrompt('');
      
      // TODO: Refresh media library to show new image
    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A] p-4 md:p-6", className)}>
      {/* Category Tabs */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cinema-red text-white"
                    : "bg-[#1F1F1F] text-[#808080] hover:text-white hover:bg-[#2A2A2A]"
                )}
                title={category.description}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generation Form */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Prompt Input */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe the ${categories.find(c => c.id === activeCategory)?.label.toLowerCase()} you want to generate...`}
            className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent resize-none"
            rows={4}
            disabled={isGenerating}
          />
        </div>

        {/* Model Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Image Model
          </label>
          {isLoadingModels ? (
            <div className="flex items-center gap-2 text-[#808080]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
              disabled={isGenerating}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} ({model.creditsPerImage} credits) - {model.provider}
                </option>
              ))}
            </select>
          )}
          {selectedModelInfo && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Cost: {selectedModelInfo.creditsPerImage} credits • Provider: {selectedModelInfo.provider}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
              disabled={isGenerating}
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transparency */}
          <div className="flex items-center gap-3 pt-8">
            <input
              type="checkbox"
              id="transparency"
              checked={transparency}
              onChange={(e) => setTransparency(e.target.checked)}
              className="w-4 h-4 rounded border-[#3F3F46] bg-[#1F1F1F] text-cinema-red focus:ring-2 focus:ring-cinema-red"
              disabled={isGenerating}
            />
            <label htmlFor="transparency" className="text-sm text-white cursor-pointer">
              Generate with transparency (PNG alpha channel)
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !selectedModel}
            className={cn(
              "w-full px-6 py-3 rounded-lg font-medium text-white transition-colors",
              "bg-cinema-red hover:bg-red-700 disabled:bg-[#3F3F46] disabled:text-[#808080] disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Image</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

