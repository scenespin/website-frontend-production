'use client';

/**
 * RegeneratePoseModal - Cinema-themed modal for regenerating a single pose with model selection
 * 
 * ⚠️ DEPRECATED: Individual pose regeneration has been removed.
 * Users must now create pose packages (minimum 3 poses) to regenerate poses.
 * 
 * This file is preserved for reference only - it contains the working pattern for:
 * - Clothing image upload with correct endpoints (/api/video/upload/get-presigned-url and POST /api/s3/download-url)
 * - Model selection and quality tier handling
 * - Presigned URL generation pattern
 * 
 * DO NOT DELETE - Used as reference for PoseGenerationModal.tsx clothing upload implementation.
 * 
 * Part of Phase 0.5: Pose/Angle Regeneration with Model Selection (DEPRECATED)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface Model {
  id: string;
  name: string;
  referenceLimit: number;
  quality: '1080p' | '4K';
  credits: number;
  enabled: boolean;
  supportsClothingImages?: boolean;
}

interface RegeneratePoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (providerId: string, quality: 'standard' | 'high-quality') => Promise<void>;
  poseName?: string;
  qualityTier?: 'standard' | 'high-quality';
  screenplayId?: string;
  characterId?: string;
}

export function RegeneratePoseModal({
  isOpen,
  onClose,
  onRegenerate,
  poseName = 'this pose',
  qualityTier = 'standard',
  screenplayId,
  characterId
}: RegeneratePoseModalProps) {
  const { getToken } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'high-quality'>(qualityTier);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  // 🔥 REMOVED: Clothing images and outfit override from individual regeneration
  // Virtual try-on and outfit changes are only available in pose packages for organization
  // Individual regeneration preserves original outfit and appearance

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

        const response = await fetch(`/api/model-selection/characters/${selectedQuality}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load models');
        }

        const data = await response.json();
        const availableModels = data.data?.models || data.models || [];
        const enabledModels = availableModels.filter((m: Model) => m.enabled);
        setModels(enabledModels);
        
        // Auto-select first model if no model is selected (always set on first load or after quality change)
        if (enabledModels.length > 0) {
          // Always auto-select when models load (handles quality change case)
          setSelectedModelId(prev => prev || enabledModels[0].id);
        }
      } catch (error: any) {
        console.error('[RegeneratePoseModal] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModels();
  }, [isOpen, selectedQuality, getToken]);

  // Update models when quality changes - reset selection so auto-select happens
  useEffect(() => {
    if (isOpen) {
      setSelectedModelId(''); // Reset selection - will be auto-selected when models load
      setClothingImages([]); // Clear clothing images when quality changes
    }
  }, [selectedQuality, isOpen]);

  // Use useMemo to ensure selectedModel updates reactively
  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId);
  }, [models, selectedModelId]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset any state if needed
    }
  }, [isOpen]);

  const handleRegenerate = async () => {
    if (!selectedModelId) {
      toast.error('Please select a model');
      return;
    }

    setIsLoading(true);
    try {
      // 🔥 REMOVED: Clothing images and outfit override from individual regeneration
      // Individual regeneration preserves original outfit and appearance
      // Only pass model and quality - backend will use original pose metadata
      await onRegenerate(selectedModelId, selectedQuality);
      toast.success('Pose regeneration started');
      onClose();
    } catch (error: any) {
      console.error('[RegeneratePoseModal] Failed to regenerate:', error);
      toast.error(error.message || 'Failed to regenerate pose');
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
            <h2 className="text-lg font-semibold text-white">Regenerate {poseName}</h2>
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
                    {model.name} ({model.referenceLimit} refs, {model.quality}, {model.credits} credits)
                  </option>
                ))}
              </select>
            )}
            {selectedModel && (
              <p className="mt-2 text-xs text-[#808080]">
                {selectedModel.referenceLimit} reference images • {selectedModel.quality} • {selectedModel.credits} credits per image
              </p>
            )}
          </div>

          {/* Note: Clothing/appearance changes removed from individual regeneration */}
          {/* Virtual try-on and outfit changes are only available in pose packages for organization */}
          <div className="p-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg">
            <p className="text-xs text-[#808080]">
              <span className="text-[#DC143C] font-medium">Note:</span> Individual pose regeneration preserves the original outfit and appearance. 
              To change clothing or character appearance, use the "Generate Pose Package" feature which maintains outfit organization.
            </p>
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

