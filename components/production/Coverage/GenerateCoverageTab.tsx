'use client';

/**
 * GenerateCoverageTab - Generate Coverage tab for Character Detail Modal
 * 
 * Converted from PoseGenerationModal - reorganized steps:
 * Step 1: Create/Select Outfit (REQUIRED)
 * Step 2: Quality/Model Selection
 * Step 3: Style Template + Custom Prompt (Optional)
 * Step 4: Pose Package Selection
 * Step 5: Clothing Images (Virtual Try-On)
 * 
 * Removed: Input step (headshot, screenplay, description - all backend-handled)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Loader2, X, Plus, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import PosePackageSelector from '../../character-bank/PosePackageSelector';

interface GenerateCoverageTabProps {
  characterId: string;
  characterName: string;
  screenplayId: string;
  baseReferenceS3Key?: string;
  existingReferences?: Array<{ metadata?: { outfitName?: string } }>;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

// Default outfit style templates (for prompt generation)
const DEFAULT_OUTFIT_STYLES = [
  { value: 'business-casual', label: 'Business Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'athletic', label: 'Athletic/Sportswear' },
  { value: 'formal-evening', label: 'Formal Evening' },
];

export function GenerateCoverageTab({
  characterId,
  characterName,
  screenplayId,
  baseReferenceS3Key,
  existingReferences = [],
  onClose,
  onComplete
}: GenerateCoverageTabProps) {
  const { getToken } = useAuth();
  
  // Step 1: Outfit
  const [outfitMode, setOutfitMode] = useState<'create' | 'existing'>('create');
  const [newOutfitName, setNewOutfitName] = useState<string>('');
  const [selectedExistingOutfit, setSelectedExistingOutfit] = useState<string>('');
  
  // Step 2: Quality/Model
  const [quality, setQuality] = useState<'standard' | 'high-quality'>('standard');
  const [providerId, setProviderId] = useState<string>('');
  const [models, setModels] = useState<Array<{ id: string; name: string; referenceLimit: number; quality: '1080p' | '4K'; credits: number; enabled: boolean; supportsClothingImages?: boolean }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Step 3: Style Template + Custom Prompt
  const [selectedStyleTemplate, setSelectedStyleTemplate] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Step 4: Pose Package
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  
  // Step 5: Clothing Images (Virtual Try-On)
  const [clothingImages, setClothingImages] = useState<Array<{ file: File; preview: string; s3Key?: string; presignedUrl?: string }>>([]);
  const [isUploadingClothing, setIsUploadingClothing] = useState(false);
  const clothingFileInputRef = useRef<HTMLInputElement>(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPosePackageDetails, setShowPosePackageDetails] = useState(false);

  // Auto-generate outfit name helper
  const generateOutfitName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `Outfit_${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // Extract existing outfit names
  const existingOutfits = useMemo(() => {
    const outfits = new Set<string>();
    existingReferences.forEach(ref => {
      const outfit = ref.metadata?.outfitName || 'default';
      if (outfit !== 'default') {
        outfits.add(outfit);
      }
    });
    return Array.from(outfits).sort();
  }, [existingReferences]);

  // Get final outfit name
  const finalOutfitName = useMemo(() => {
    if (outfitMode === 'create') {
      return newOutfitName.trim() || generateOutfitName();
    } else {
      return selectedExistingOutfit || generateOutfitName();
    }
  }, [outfitMode, newOutfitName, selectedExistingOutfit]);

  // Get selected model
  const selectedModel = useMemo(() => {
    return models.find(m => m.id === providerId);
  }, [models, providerId]);
  
  const supportsClothing = selectedModel?.supportsClothingImages ?? false;

  // Load models when quality changes
  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const response = await fetch(`/api/model-selection/characters/${quality}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load models');
        }

        const data = await response.json();
        const availableModels = data.data?.models || data.models || [];
        const enabledModels = availableModels.filter((m: any) => m.enabled);
        setModels(enabledModels);
        
        // Auto-select first model
        if (enabledModels.length > 0 && !providerId) {
          setProviderId(enabledModels[0].id);
        }
      } catch (error: any) {
        console.error('[GenerateCoverageTab] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModels();
  }, [quality, getToken]);

  // Reset providerId when quality changes
  useEffect(() => {
    setProviderId('');
    setClothingImages([]);
  }, [quality]);

  // Handle clothing image upload (Virtual Try-On)
  const handleClothingImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxClothingRefs = selectedModel ? Math.min(selectedModel.referenceLimit - 1, 3) : 0;
    
    if (clothingImages.length + fileArray.length > maxClothingRefs) {
      toast.error(`Maximum ${maxClothingRefs} clothing/outfit images allowed for this model`);
      return;
    }

    setIsUploadingClothing(true);
    const newImages: Array<{ file: File; preview: string; s3Key?: string; presignedUrl?: string }> = [];

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      for (const file of fileArray) {
        const preview = URL.createObjectURL(file);
        
        // Upload to S3
        const presignedResponse = await fetch(
          `/api/video/upload/get-presigned-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}&fileSize=${file.size}&projectId=${encodeURIComponent(screenplayId)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (presignedResponse.ok) {
          const { url, fields, s3Key } = await presignedResponse.json();
          
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            if (key.toLowerCase() !== 'bucket') {
              formData.append(key, value as string);
            }
          });
          formData.append('file', file);

          const uploadResponse = await fetch(url, { method: 'POST', body: formData });
          
          if (uploadResponse.ok) {
            // Get presigned download URL
            const downloadUrlResponse = await fetch('/api/s3/download-url', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key,
                expiresIn: 3600
              }),
            });
            
            if (downloadUrlResponse.ok) {
              const { downloadUrl } = await downloadUrlResponse.json();
              newImages.push({ file, preview, s3Key, presignedUrl: downloadUrl });
            }
          }
        }
      }

      setClothingImages(prev => [...prev, ...newImages]);
      toast.success(`Uploaded ${newImages.length} clothing image(s)`);
    } catch (error: any) {
      console.error('[GenerateCoverageTab] Failed to upload clothing images:', error);
      toast.error('Failed to upload clothing images');
    } finally {
      setIsUploadingClothing(false);
      if (clothingFileInputRef.current) {
        clothingFileInputRef.current.value = '';
      }
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!finalOutfitName || finalOutfitName.trim() === '') {
      toast.error('Please create or select an outfit');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      toast.loading('Starting coverage generation...', { id: 'coverage-gen-start' });

      // Prepare clothing references
      const clothingReferences: string[] = [];
      for (const clothingImage of clothingImages) {
        if (clothingImage.presignedUrl) {
          clothingReferences.push(clothingImage.presignedUrl);
        }
      }

      // Build prompt from style template + custom prompt
      let finalPrompt = customPrompt.trim();
      if (selectedStyleTemplate && selectedStyleTemplate !== 'none') {
        const styleLabel = DEFAULT_OUTFIT_STYLES.find(s => s.value === selectedStyleTemplate)?.label || selectedStyleTemplate;
        if (finalPrompt) {
          finalPrompt = `${styleLabel} style. ${finalPrompt}`;
        } else {
          finalPrompt = styleLabel;
        }
      }

      const apiUrl = `/api/projects/${screenplayId}/characters/${characterId}/generate-poses`;
      const requestBody = {
        characterName, // Match original modal exactly (even if backend doesn't use it)
        packageId: selectedPackageId,
        quality: quality,
        providerId: providerId || undefined,
        headshotS3Key: baseReferenceS3Key || undefined,
        typicalClothing: finalOutfitName,
        clothingReferences: clothingReferences.length > 0 ? clothingReferences : undefined,
        additionalPrompt: finalPrompt || undefined,
        // Note: headshotUrl, screenplayContent, manualDescription are auto-handled by backend
        // (removed from UI per user request - backend populates automatically)
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate coverage');
      }

      const result = await response.json();
      
      toast.dismiss('coverage-gen-start');
      toast.success('Coverage generation started!', {
        description: 'View in Jobs tab to track progress.',
        duration: 5000
      });

      if (onComplete) {
        onComplete({ jobId: result.jobId, message: result.message });
      }
      
      onClose();

    } catch (err: any) {
      console.error('[GenerateCoverageTab] Generation error:', err);
      setError(err.message || 'An error occurred during generation');
      toast.dismiss('coverage-gen-start');
      toast.error('Coverage generation failed!', {
        description: err.message || 'Please try again.',
        duration: Infinity
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Step 1: Create or Select Outfit */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 1: Create or Select Outfit (Required)</h3>
        
        <div className="space-y-3">
          {/* Radio Buttons */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outfitMode"
                checked={outfitMode === 'create'}
                onChange={() => setOutfitMode('create')}
                className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
              />
              <span className="text-sm text-white">Create New Outfit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outfitMode"
                checked={outfitMode === 'existing'}
                onChange={() => setOutfitMode('existing')}
                className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
              />
              <span className="text-sm text-white">Add to Existing Outfit</span>
            </label>
          </div>

          {outfitMode === 'create' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newOutfitName}
                onChange={(e) => setNewOutfitName(e.target.value)}
                placeholder="Enter outfit name (e.g., Casual, Formal)"
                className="flex-1 px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
              />
              <button
                onClick={() => {
                  if (!newOutfitName.trim()) {
                    const autoName = generateOutfitName();
                    setNewOutfitName(autoName);
                  }
                }}
                className="px-3 py-1.5 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white rounded text-sm transition-colors"
              >
                Create
              </button>
            </div>
          )}

          {outfitMode === 'existing' && (
            <div>
              {existingOutfits.length > 0 ? (
                <select
                  value={selectedExistingOutfit}
                  onChange={(e) => setSelectedExistingOutfit(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
                >
                  <option value="">Select an outfit...</option>
                  {existingOutfits.map(outfit => (
                    <option key={outfit} value={outfit}>{outfit}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#808080]">
                  No existing outfits. Create a new one instead.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Quality/Model Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 2: Quality & Model Selection</h3>
        
        <div className="space-y-3">
          {/* Quality Selection - Radio Buttons */}
          <div>
            <label className="block text-xs text-[#808080] mb-2">Quality</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={quality === 'standard'}
                  onChange={() => setQuality('standard')}
                  className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <span className="text-sm text-white">Standard (1080p) - 20 credits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={quality === 'high-quality'}
                  onChange={() => setQuality('high-quality')}
                  className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <span className="text-sm text-white">High Quality (4K) - 40 credits</span>
              </label>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs text-[#808080] mb-2">Model</label>
            {isLoadingModels ? (
              <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080] text-sm">
                Loading models...
              </div>
            ) : models.length === 0 ? (
              <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080] text-sm">
                No models available for this quality tier
              </div>
            ) : (
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.credits} credits)
                  </option>
                ))}
              </select>
            )}
            {selectedModel && (
              <p className="mt-1 text-xs text-[#808080]">
                {selectedModel.credits} credits per image
                {supportsClothing && ` • Supports clothing/outfit images`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Style Template + Custom Prompt */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 3: Style Template & Custom Prompt (Optional)</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#808080] mb-1.5">Style Template</label>
            <select
              value={selectedStyleTemplate}
              onChange={(e) => setSelectedStyleTemplate(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
            >
              <option value="none">None - Custom Prompt Only</option>
              {DEFAULT_OUTFIT_STYLES.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#808080] mb-1.5">
              Custom Prompt (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific styling details, color codes (#FF0000)..."
              className="w-full h-20 bg-[#0A0A0A] border border-[#3F3F46] rounded p-2 text-sm text-white placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
            />
          </div>
        </div>
      </div>

      {/* Step 4: Pose Package Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Step 4: Pose Package Selection</h3>
          <button
            onClick={() => setShowPosePackageDetails(!showPosePackageDetails)}
            className="text-xs text-[#808080] hover:text-white flex items-center gap-1"
          >
            {showPosePackageDetails ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show Details
              </>
            )}
          </button>
        </div>
        {showPosePackageDetails ? (
          <PosePackageSelector
            characterName={characterName}
            selectedPackageId={selectedPackageId}
            onSelectPackage={setSelectedPackageId}
            creditsPerImage={selectedModel?.credits}
          />
        ) : (
          <div className="text-xs text-[#808080]">
            Selected: {selectedPackageId.charAt(0).toUpperCase() + selectedPackageId.slice(1)} Package
          </div>
        )}
      </div>

      {/* Step 5: Clothing Images (Virtual Try-On) */}
      {supportsClothing && selectedModel && (
        <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Step 5: Clothing Images (Virtual Try-On)
            <span className="ml-2 text-xs font-normal text-[#808080]">
              ({clothingImages.length}/{Math.min((selectedModel?.referenceLimit || 3) - 1, 3)})
            </span>
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={() => clothingFileInputRef.current?.click()}
              disabled={isUploadingClothing || clothingImages.length >= Math.min((selectedModel?.referenceLimit || 3) - 1, 3)}
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white hover:border-[#DC143C]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploadingClothing ? 'Uploading...' : clothingImages.length >= Math.min((selectedModel?.referenceLimit || 3) - 1, 3) ? `Max Images` : `Upload Clothing/Outfit Images`}
            </button>
            <input
              ref={clothingFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleClothingImageSelect}
              className="hidden"
            />

            {/* Preview Grid */}
            {clothingImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {clothingImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img.presignedUrl || img.preview}
                      alt={`Clothing ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      onClick={() => setClothingImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 hover:bg-red-600 rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white rounded text-sm font-medium transition-colors"
          disabled={isGenerating}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !finalOutfitName}
          className="px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Coverage'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

