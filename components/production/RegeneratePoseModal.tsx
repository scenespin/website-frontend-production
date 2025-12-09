'use client';

/**
 * RegeneratePoseModal - Cinema-themed modal for regenerating a single pose with model selection
 * 
 * Part of Phase 0.5: Pose/Angle Regeneration with Model Selection
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

interface ClothingImage {
  file: File;
  preview: string;
  s3Key?: string;
  presignedUrl?: string;
}

interface RegeneratePoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (providerId: string, quality: 'standard' | 'high-quality', clothingReferences: string[], typicalClothing?: string, outfitName?: string) => Promise<void>;
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
  const [clothingImages, setClothingImages] = useState<ClothingImage[]>([]);
  const [isUploadingClothing, setIsUploadingClothing] = useState(false);
  const clothingFileInputRef = useRef<HTMLInputElement>(null);
  
  // Outfit selection state - simple text input only
  const [customOutfitText, setCustomOutfitText] = useState<string>('');

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
  
  // Only show clothing upload for Gen-4 and Nano Banana Pro (not Photon)
  const supportsClothing = selectedModel?.supportsClothingImages ?? false;
  const maxClothingRefs = selectedModel && supportsClothing ? Math.min(selectedModel.referenceLimit - 1, 3) : 0; // Reserve 1 for character, max 3 for clothing

  // Reset clothing images and outfit selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClothingImages([]);
      setCustomOutfitText('');
    }
  }, [isOpen]);

  const handleClothingImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file count
    if (clothingImages.length + fileArray.length > maxClothingRefs) {
      toast.error(`Maximum ${maxClothingRefs} clothing/outfit images allowed for this model`);
      return;
    }

    // Validate files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB.`);
        return;
      }
    }

    setIsUploadingClothing(true);
    const newImages: ClothingImage[] = [];

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      for (const file of fileArray) {
        // Create preview
        const preview = URL.createObjectURL(file);
        
        // Upload to S3 if we have screenplayId and characterId
        let s3Key: string | undefined;
        let presignedUrl: string | undefined;

        if (screenplayId && characterId) {
          const presignedResponse = await fetch(
            `/api/characters/upload/get-presigned-url?` +
            `fileName=${encodeURIComponent(file.name)}` +
            `&fileType=${encodeURIComponent(file.type)}` +
            `&fileSize=${file.size}` +
            `&screenplayId=${encodeURIComponent(screenplayId)}` +
            `&characterId=${encodeURIComponent(characterId)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (presignedResponse.ok) {
            const { url, fields, s3Key: uploadedS3Key } = await presignedResponse.json();
            s3Key = uploadedS3Key;

            // Upload to S3
            const s3FormData = new FormData();
            Object.entries(fields).forEach(([key, value]) => {
              if (key.toLowerCase() !== 'bucket') {
                s3FormData.append(key, value as string);
              }
            });
            s3FormData.append('file', file);

            const s3Response = await fetch(url, { method: 'POST', body: s3FormData });
            if (s3Response.ok) {
              // Get presigned download URL
              const downloadResponse = await fetch(
                `/api/s3/get-download-url?s3Key=${encodeURIComponent(s3Key)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              if (downloadResponse.ok) {
                const { downloadUrl } = await downloadResponse.json();
                presignedUrl = downloadUrl;
              }
            }
          }
        }

        newImages.push({ file, preview, s3Key, presignedUrl });
      }

      setClothingImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${fileArray.length} clothing/outfit image${fileArray.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error('[RegeneratePoseModal] Failed to upload clothing images:', error);
      toast.error(error.message || 'Failed to upload clothing images');
    } finally {
      setIsUploadingClothing(false);
      if (clothingFileInputRef.current) {
        clothingFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveClothingImage = (index: number) => {
    const image = clothingImages[index];
    if (image.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setClothingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegenerate = async () => {
    if (!selectedModelId) {
      toast.error('Please select a model');
      return;
    }

    setIsLoading(true);
    try {
      // Upload clothing images and get presigned URLs
      const clothingReferences: string[] = [];
      
      if (clothingImages.length > 0 && screenplayId && characterId) {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Not authenticated');

        console.log(`[RegeneratePoseModal] Processing ${clothingImages.length} clothing image(s)`);
        for (const clothingImage of clothingImages) {
          if (clothingImage.presignedUrl) {
            console.log(`[RegeneratePoseModal] Using existing presigned URL for clothing image`);
            clothingReferences.push(clothingImage.presignedUrl);
          } else if (clothingImage.s3Key) {
            // Get presigned URL for existing S3 key
            console.log(`[RegeneratePoseModal] Getting presigned URL for S3 key: ${clothingImage.s3Key}`);
            const response = await fetch(
              `/api/s3/get-download-url?s3Key=${encodeURIComponent(clothingImage.s3Key)}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.ok) {
              const { downloadUrl } = await response.json();
              console.log(`[RegeneratePoseModal] Got presigned URL: ${downloadUrl.substring(0, 100)}...`);
              clothingReferences.push(downloadUrl);
            } else {
              console.error(`[RegeneratePoseModal] Failed to get presigned URL for S3 key: ${clothingImage.s3Key}`);
            }
          } else {
            console.warn(`[RegeneratePoseModal] Clothing image missing both presignedUrl and s3Key`);
          }
        }
        console.log(`[RegeneratePoseModal] Prepared ${clothingReferences.length} clothing reference(s) for backend`);
      } else {
        console.log(`[RegeneratePoseModal] No clothing images to process (clothingImages: ${clothingImages.length}, screenplayId: ${screenplayId}, characterId: ${characterId})`);
      }

      // Only pass outfit if user explicitly entered text (empty string means use original)
      const finalTypicalClothing = customOutfitText.trim() || undefined;
      const finalOutfitName = undefined; // Let backend use original outfit from pose metadata
      
      await onRegenerate(selectedModelId, selectedQuality, clothingReferences, finalTypicalClothing, finalOutfitName);
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
                {supportsClothing && ` • Supports clothing/outfit images`}
              </p>
            )}
          </div>

          {/* Outfit Selection - Simple text input (regeneration preserves original outfit unless changed) */}
          <div>
            <label className="block text-sm font-medium text-[#B3B3B3] mb-2">
              Outfit Override (Optional)
              <span className="ml-2 text-xs font-normal text-[#808080]">
                - Leave empty to keep original outfit, or enter new description
              </span>
            </label>
            <input
              type="text"
              value={customOutfitText}
              onChange={(e) => setCustomOutfitText(e.target.value)}
              placeholder="Leave empty to regenerate with original outfit, or enter new outfit description..."
              className="w-full px-4 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC143C]/50 focus:border-[#DC143C] placeholder:text-[#808080]"
            />
            <p className="mt-2 text-xs text-[#808080]">
              By default, regeneration uses the same outfit as the original pose. Enter text here only if you want to change it.
            </p>
          </div>

          {/* Clothing/Outfit Image Upload (only for models that support it) */}
          {supportsClothing && selectedModel && (
            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">
                Clothing/Outfit Images (Optional)
                <span className="ml-2 text-xs font-normal text-[#808080]">
                  ({clothingImages.length}/{maxClothingRefs} - for hats, canes, accessories, etc.)
                </span>
              </label>
              <div className="space-y-2">
                {/* Upload Button */}
                <button
                  onClick={() => clothingFileInputRef.current?.click()}
                  disabled={isUploadingClothing || clothingImages.length >= maxClothingRefs}
                  className="w-full px-4 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#B3B3B3] text-sm hover:border-[#DC143C]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingClothing ? 'Uploading...' : clothingImages.length >= maxClothingRefs ? `Max Images (${maxClothingRefs}/${maxClothingRefs})` : `Upload Clothing/Outfit Images`}
                </button>
                <input
                  ref={clothingFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleClothingImageSelect}
                  className="hidden"
                />
                
                {/* Image Previews */}
                {clothingImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {clothingImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Clothing ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-[#3F3F46]"
                        />
                        <button
                          onClick={() => handleRemoveClothingImage(index)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-[#DC143C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-[#808080]">
                Upload images of clothing, accessories, or props to maintain consistency across poses
              </p>
            </div>
          )}

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

