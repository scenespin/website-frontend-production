'use client';

/**
 * RegenerateAngleModal - Cinema-themed modal for regenerating a single angle with model selection
 * 
 * Part of Phase 0.5: Pose/Angle Regeneration with Model Selection
 * Used for locations and assets (no clothing upload needed)
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface Model {
  id: string;
  name: string;
  referenceLimit: number;
  quality: '1080p' | '4K';
  credits: number;
  enabled: boolean;
}

interface RegenerateAngleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (providerId: string, quality: 'standard' | 'high-quality') => Promise<void>;
  angleName?: string;
  qualityTier?: 'standard' | 'high-quality';
  entityType: 'location' | 'asset';
}

export function RegenerateAngleModal({
  isOpen,
  onClose,
  onRegenerate,
  angleName = 'this angle',
  qualityTier = 'standard',
  entityType
}: RegenerateAngleModalProps) {
  const { getToken } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'high-quality'>(qualityTier);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load available models
  useEffect(() => {
    if (!isOpen) return;
    
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const useCase = entityType === 'location' ? 'locations' : 'assets';
        const response = await fetch(`/api/model-selection/${useCase}/${selectedQuality}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load models');
        }

        const data = await response.json();
        const availableModels = data.data?.models || data.models || [];
        setModels(availableModels.filter((m: Model) => m.enabled));
        
        // Auto-select first model
        if (availableModels.length > 0 && !selectedModelId) {
          setSelectedModelId(availableModels[0].id);
        }
      } catch (error: any) {
        console.error('[RegenerateAngleModal] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModels();
  }, [isOpen, selectedQuality, entityType, getToken]);

  // Update models when quality changes
  useEffect(() => {
    if (isOpen) {
      setSelectedModelId(''); // Reset selection
    }
  }, [selectedQuality, isOpen]);

  const selectedModel = models.find(m => m.id === selectedModelId);

  const handleRegenerate = async () => {
    if (!selectedModelId) {
      toast.error('Please select a model');
      return;
    }

    setIsLoading(true);
    try {
      await onRegenerate(selectedModelId, selectedQuality);
      toast.success('Angle regeneration started');
      onClose();
    } catch (error: any) {
      console.error('[RegenerateAngleModal] Failed to regenerate:', error);
      toast.error(error.message || 'Failed to regenerate angle');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3F3F46]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#DC143C]" />
            <h2 className="text-lg font-semibold text-white">Regenerate {angleName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1F1F1F] rounded transition-colors"
          >
            <X className="w-5 h-5 text-[#808080]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Quality Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-[#B3B3B3] mb-2">
              Quality Tier
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedQuality('standard')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedQuality === 'standard'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#141414] text-[#B3B3B3] border border-[#3F3F46] hover:border-[#DC143C]/50'
                }`}
              >
                1080p (Standard)
              </button>
              <button
                onClick={() => setSelectedQuality('high-quality')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedQuality === 'high-quality'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#141414] text-[#B3B3B3] border border-[#3F3F46] hover:border-[#DC143C]/50'
                }`}
              >
                4K (High Quality)
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-[#B3B3B3] mb-2">
              Select Model
            </label>
            {isLoadingModels ? (
              <div className="px-4 py-3 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#808080] text-sm">
                Loading models...
              </div>
            ) : models.length === 0 ? (
              <div className="px-4 py-3 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#808080] text-sm">
                No models available for this quality tier
              </div>
            ) : (
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC143C]/50 focus:border-[#DC143C]"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.credits} credits)
                  </option>
                ))}
              </select>
            )}
            {selectedModel && (
              <p className="mt-2 text-xs text-[#808080]">
                {selectedModel.credits} credits per image
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#141414] border border-[#3F3F46] text-[#B3B3B3] rounded-lg hover:bg-[#1F1F1F] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isLoading || !selectedModelId || isLoadingModels}
              className="flex-1 px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Regenerate {selectedModel ? `(${selectedModel.credits} credits)` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

