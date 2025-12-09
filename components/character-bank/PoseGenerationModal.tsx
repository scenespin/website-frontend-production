'use client';
/**
 * Pose Generation Modal
 * 
 * Complete workflow for generating character pose packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Wand2, Loader2, CheckCircle2, AlertCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import PosePackageSelector from './PosePackageSelector';
import { OutfitSelector } from '../production/OutfitSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface PoseGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  projectId: string;
  baseReferenceS3Key?: string; // Character's existing base reference S3 key (not presigned URL)
  onComplete?: (result: any) => void;
}

type GenerationStep = 'package' | 'input' | 'generating' | 'complete' | 'error';

export default function PoseGenerationModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  projectId,
  baseReferenceS3Key,
  onComplete
}: PoseGenerationModalProps) {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<GenerationStep>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [quality, setQuality] = useState<'standard' | 'high-quality'>('standard'); // 🔥 NEW: Quality tier
  const [providerId, setProviderId] = useState<string>(''); // 🔥 NEW: Model selection
  const [typicalClothing, setTypicalClothing] = useState<string | undefined>(undefined);
  const [characterDefaultOutfit, setCharacterDefaultOutfit] = useState<string | undefined>(undefined);
  const [clothingImages, setClothingImages] = useState<Array<{ file: File; preview: string; s3Key?: string; presignedUrl?: string }>>([]);
  const [isUploadingClothing, setIsUploadingClothing] = useState(false);
  const [models, setModels] = useState<Array<{ id: string; name: string; referenceLimit: number; quality: '1080p' | '4K'; credits: number; enabled: boolean; supportsClothingImages?: boolean }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const clothingFileInputRef = useRef<HTMLInputElement>(null);
  
  // Input data
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>('');
  const [screenplayContent, setScreenplayContent] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  
  // Fetch character's default outfit and load models on mount
  useEffect(() => {
    if (isOpen && characterId && projectId) {
      const fetchCharacterOutfit = async () => {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          // Get character from screenplay characters API
          const response = await fetch(`/api/screenplays/${projectId}/characters/${characterId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const outfit = data.data?.physicalAttributes?.typicalClothing;
            if (outfit) {
              setCharacterDefaultOutfit(outfit);
            }
          }
        } catch (error) {
          console.error('[PoseGenerationModal] Failed to fetch character outfit:', error);
          // Non-fatal - continue without default
        }
      };
      fetchCharacterOutfit();
    }
  }, [isOpen, characterId, projectId, getToken]);

  // Load available models when quality changes
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
        
        // Debug logging
        console.log('[PoseGenerationModal] Loaded models:', enabledModels.map(m => ({
          id: m.id,
          name: m.name,
          supportsClothing: m.supportsClothingImages
        })));
        
        // Auto-select first model if providerId is empty (always set on first load or after quality change)
        if (enabledModels.length > 0) {
          // Always auto-select when models load (handles quality change case)
          // Use functional update to ensure we get the latest state
          setProviderId(prev => {
            if (!prev) {
              console.log('[PoseGenerationModal] Auto-selecting model:', enabledModels[0].id, 'supportsClothing:', enabledModels[0].supportsClothingImages);
              return enabledModels[0].id;
            }
            return prev;
          });
        }
      } catch (error: any) {
        console.error('[PoseGenerationModal] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModels();
  }, [isOpen, quality, getToken]);

  // Reset providerId when quality changes (but NOT when modal first opens - let auto-select handle that)
  useEffect(() => {
    if (isOpen) {
      setProviderId(''); // Reset so auto-select will pick first model
      setClothingImages([]);
    }
  }, [quality]); // Only reset when quality changes, not when modal opens

  // Get selected model for easier access (useMemo to ensure it updates when models/providerId changes)
  const selectedModel = useMemo(() => {
    const model = models.find(m => m.id === providerId);
    console.log('[PoseGenerationModal] Selected model:', {
      providerId,
      model: model ? { id: model.id, name: model.name, supportsClothing: model.supportsClothingImages } : null,
      modelsCount: models.length
    });
    return model;
  }, [models, providerId]);
  const supportsClothing = selectedModel?.supportsClothingImages ?? false;
  
  // Debug logging for clothing support
  useEffect(() => {
    if (isOpen && selectedModel) {
      console.log('[PoseGenerationModal] Clothing support check:', {
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        supportsClothingImages: selectedModel.supportsClothingImages,
        supportsClothing: supportsClothing
      });
    }
  }, [isOpen, selectedModel, supportsClothing]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  
  const handleHeadshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeadshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClothingImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxClothingRefs = selectedModel ? Math.min(selectedModel.referenceLimit - 1, 3) : 0;
    
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
    const newImages: Array<{ file: File; preview: string; s3Key?: string; presignedUrl?: string }> = [];

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      for (const file of fileArray) {
        // Create preview
        const preview = URL.createObjectURL(file);
        
        // Upload to S3
        let s3Key: string | undefined;
        let presignedUrl: string | undefined;

        // Use same endpoint as annotation area (SceneBuilderPanel) - it's a general upload endpoint
        const presignedResponse = await fetch(
          `/api/video/upload/get-presigned-url?` +
          `fileName=${encodeURIComponent(file.name)}` +
          `&fileType=${encodeURIComponent(file.type)}` +
          `&fileSize=${file.size}` +
          `&projectId=${encodeURIComponent(projectId)}`,
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
            console.log(`[PoseGenerationModal] ✅ Successfully uploaded clothing image to S3: ${s3Key}`);
            
            // Get presigned download URL immediately (same pattern as SceneBuilderPanel)
            // Use POST /api/s3/download-url endpoint (not GET /api/s3/get-download-url)
            const downloadUrlResponse = await fetch('/api/s3/download-url', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key,
                expiresIn: 3600 // 1 hour
              }),
            });
            
            if (!downloadUrlResponse.ok) {
              const errorText = await downloadUrlResponse.text().catch(() => 'Unknown error');
              console.error('[PoseGenerationModal] Failed to generate download URL:', {
                status: downloadUrlResponse.status,
                statusText: downloadUrlResponse.statusText,
                error: errorText,
                s3Key
              });
              throw new Error(
                downloadUrlResponse.status === 401 
                  ? 'Authentication failed. Please refresh and try again.'
                  : downloadUrlResponse.status === 403
                  ? 'Access denied. Please contact support if this persists.'
                  : `Failed to generate image URL (${downloadUrlResponse.status}). Please try again.`
              );
            }
            
            const downloadUrlData = await downloadUrlResponse.json();
            
            if (downloadUrlData.downloadUrl) {
              presignedUrl = downloadUrlData.downloadUrl;
              console.log(`[PoseGenerationModal] ✅ Got presigned URL for clothing image`);
            } else {
              console.error(`[PoseGenerationModal] ❌ No download URL returned from API`);
            }
          } else {
            const errorText = await s3Response.text();
            console.error(`[PoseGenerationModal] ❌ Failed to upload clothing image to S3: ${s3Response.status} - ${errorText}`);
          }
        }

        newImages.push({ file, preview, s3Key, presignedUrl });
      }

      setClothingImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${fileArray.length} clothing/outfit image${fileArray.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error('[PoseGenerationModal] Failed to upload clothing images:', error);
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
  
  const handleGenerateWithPackage = async (packageId: string) => {
    setIsGenerating(true);
    setError('');
    setJobId(null);
    
    try {
      // Show initial toast notification
      toast.info('Starting pose generation...', {
        id: 'pose-gen-start',
        duration: Infinity,
        icon: <Loader2 className="w-4 h-4 animate-spin" />
      });
      
      // Call backend API to generate pose package
      // Backend will create a job automatically
      const token = await getToken({ template: 'wryda-backend' });
      const apiUrl = `/api/projects/${projectId}/characters/${characterId}/generate-poses`;
      
      // Upload clothing images and get presigned URLs
      const clothingReferences: string[] = [];
      
      if (clothingImages.length > 0 && projectId && characterId) {
        for (const clothingImage of clothingImages) {
          if (clothingImage.presignedUrl) {
            clothingReferences.push(clothingImage.presignedUrl);
          } else if (clothingImage.s3Key) {
            // Get presigned URL for existing S3 key (use POST endpoint)
            const downloadResponse = await fetch('/api/s3/download-url', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key: clothingImage.s3Key,
                expiresIn: 3600 // 1 hour
              }),
            });
            if (downloadResponse.ok) {
              const { downloadUrl } = await downloadResponse.json();
              clothingReferences.push(downloadUrl);
            }
          }
        }
      }

      const requestBody = {
        characterName,
        packageId: packageId,
        quality: quality, // 🔥 NEW: Quality tier
        providerId: providerId || undefined, // 🔥 NEW: Model selection
        headshotS3Key: baseReferenceS3Key || undefined,
        headshotUrl: headshotFile ? headshotPreview : undefined,
        screenplayContent: screenplayContent || undefined,
        manualDescription: manualDescription || undefined,
        typicalClothing: typicalClothing,
        clothingReferences: clothingReferences.length > 0 ? clothingReferences : undefined, // 🔥 NEW: Clothing references
      };
      
      console.log('[PoseGeneration] 🔥 Calling API:', apiUrl);
      console.log('[PoseGeneration] Request body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[PoseGeneration] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Failed to generate pose package';
        
        // Sanitize error message - remove internal model names and technical details
        errorMessage = errorMessage
          .replace(/MODEL_NOT_FOUND:\s*\w+(-\w+)*/gi, 'Model not available')
          .replace(/luma-photon-\w+/gi, 'image generation model')
          .replace(/photon-\w+/gi, 'image generation model')
          .replace(/Failed to generate pose \w+:\s*/gi, 'Failed to generate pose: ');
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Store jobId for reference
      if (result.jobId) {
        setJobId(result.jobId);
        console.log('[PoseGeneration] Job created:', result.jobId);
      }
      
      // Reset state first to ensure clean state for next use
      handleReset();
      
      // Close modal after reset - jobs area will handle tracking
      onClose();
      
      // Dismiss initial toast and show success toast
      toast.dismiss('pose-gen-start');
      toast.success('Pose generation started!', {
        description: 'View in Jobs tab to track progress and save your poses.',
        action: {
          label: 'View Jobs',
          onClick: () => {
            // Navigate to jobs tab
            window.location.href = `/production?tab=jobs&projectId=${projectId}`;
          }
        },
        duration: 5000
      });
      
      // Call onComplete with jobId (result no longer contains poses - they're in the job)
      if (onComplete) {
        onComplete({ jobId: result.jobId, message: result.message });
      }
      
    } catch (err: any) {
      console.error('[PoseGeneration] Error:', err);
      setError(err.message || 'An error occurred during generation');
      
      // Dismiss initial toast and show error toast
      toast.dismiss('pose-gen-start');
      toast.error('Pose generation failed!', {
        description: err.message || 'Please try again.',
        duration: Infinity // Keep error toast visible
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    await handleGenerateWithPackage(selectedPackageId);
  };
  
  const handleReset = () => {
    setStep('package');
    setSelectedPackageId('standard');
    setTypicalClothing(undefined);
    setHeadshotFile(null);
    setHeadshotPreview('');
    setScreenplayContent('');
    setManualDescription('');
    setGenerationResult(null);
    setError('');
    setIsGenerating(false); // Reset generating state
    setJobId(null); // Reset job ID
  };
  
  const handleClose = () => {
    handleReset();
    onClose();
  };
  
  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-base-200 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-base-content/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-base-200 border-b border-base-content/20 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-base-content">Generate Pose Package</h2>
                <p className="text-base-content/60 mt-1">Create consistent character references for {characterName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                disabled={isGenerating}
              >
                <X className="w-6 h-6 text-base-content/60" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              
              {/* Step 1: Outfit Selection & Package Selection */}
              {step === 'package' && (
                <div className="space-y-6">
                  {/* Outfit Selection - NEW */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 1: Select Outfit
                    </h3>
                    <OutfitSelector
                      value={typicalClothing}
                      defaultValue={characterDefaultOutfit}
                      onChange={(outfit) => setTypicalClothing(outfit)}
                      label="Character Outfit"
                      showDefaultOption={true}
                    />
                    <p className="text-xs text-base-content/50 mt-2">
                      All poses in the package will be generated wearing the selected outfit. If you choose "Custom...", you can provide a detailed description that will guide the character's appearance, style, and outfit.
                    </p>
                  </div>
                  
                  {/* Quality Selection - NEW */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 2: Select Quality
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setQuality('standard')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          quality === 'standard'
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                            : 'border-base-content/20 hover:border-base-content/40'
                        }`}
                      >
                        <div className="font-semibold text-base-content mb-1">Standard (1080p)</div>
                        <div className="text-xs text-base-content/60 mb-2">
                          20 credits per image
                        </div>
                        <div className="text-xs text-base-content/50">
                          Fewer safety restrictions, more creative freedom. Perfect for most projects.
                        </div>
                      </button>
                      <button
                        onClick={() => setQuality('high-quality')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          quality === 'high-quality'
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                            : 'border-base-content/20 hover:border-base-content/40'
                        }`}
                      >
                        <div className="font-semibold text-base-content mb-1">High Quality (4K)</div>
                        <div className="text-xs text-base-content/60 mb-2">
                          40 credits per image
                        </div>
                        <div className="text-xs text-base-content/50">
                          Maximum resolution and quality. Best for final production.
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Model Selection - NEW */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 3: Select Model
                    </h3>
                    {isLoadingModels ? (
                      <div className="px-4 py-3 bg-base-200 border border-base-content/20 rounded-lg text-base-content/60 text-sm">
                        Loading models...
                      </div>
                    ) : models.length === 0 ? (
                      <div className="px-4 py-3 bg-base-200 border border-base-content/20 rounded-lg text-base-content/60 text-sm">
                        No models available for this quality tier
                      </div>
                    ) : (
                      <select
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6]"
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.referenceLimit} refs, {model.quality}, {model.credits} credits)
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedModel && (
                      <p className="mt-2 text-xs text-base-content/50">
                        {selectedModel.referenceLimit} reference images • {selectedModel.quality} • {selectedModel.credits} credits per image
                        {supportsClothing && ` • Supports clothing/outfit images`}
                      </p>
                    )}
                  </div>

                  {/* Clothing/Outfit Image Upload (only for models that support it) */}
                  {supportsClothing && selectedModel && (
                    <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                      <h3 className="text-sm font-semibold text-base-content mb-4">
                        Step 4: Clothing/Outfit Images (Optional)
                        <span className="ml-2 text-xs font-normal text-base-content/50">
                          ({clothingImages.length}/{Math.min((selectedModel?.referenceLimit || 3) - 1, 3)} - for hats, canes, accessories, etc.)
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {/* Upload Button */}
                        <button
                          onClick={() => clothingFileInputRef.current?.click()}
                          disabled={isUploadingClothing || clothingImages.length >= Math.min((selectedModel?.referenceLimit || 3) - 1, 3)}
                          className="w-full px-4 py-2.5 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm hover:border-[#8B5CF6]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        
                        {/* Image Previews */}
                        {clothingImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {clothingImages.map((img, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={img.preview}
                                  alt={`Clothing ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-base-content/20"
                                />
                                <button
                                  onClick={() => handleRemoveClothingImage(index)}
                                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-base-content/50">
                        Upload images of clothing, accessories, or props to maintain consistency across poses
                      </p>
                    </div>
                  )}

                  {/* Package Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      {supportsClothing ? 'Step 5' : 'Step 4'}: Select Package
                    </h3>
                    <PosePackageSelector
                      characterName={characterName}
                      onSelectPackage={(packageId) => {
                        setSelectedPackageId(packageId);
                      }}
                      selectedPackageId={selectedPackageId}
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedPackageId}
                      className="px-6 py-3 bg-primary text-primary-content rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Pose Package'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Input Data */}
              {step === 'input' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-gray-100 mb-2">
                      Provide Character Information
                    </h3>
                    <p className="text-base-content/60">
                      Upload a headshot, paste screenplay text, or write a description. The more info, the better!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Headshot Upload */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-base-content/70">
                        <Upload className="w-4 h-4 inline mr-2" />
                        Headshot (Optional)
                      </label>
                      
                      <div className="border-2 border-dashed border-base-content/20 rounded-lg p-6 hover:border-base-content/30 transition-colors">
                        {headshotPreview ? (
                          <div className="relative">
                            <img
                              src={headshotPreview}
                              alt="Headshot preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => {
                                setHeadshotFile(null);
                                setHeadshotPreview('');
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full"
                            >
                              <X className="w-4 h-4 text-base-content" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block text-center">
                            <Upload className="w-12 h-12 text-base-content/50 mx-auto mb-2" />
                            <div className="text-sm text-base-content/60">
                              Click to upload headshot
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHeadshotUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      
                      <p className="text-xs text-base-content/50">
                        AI will analyze the headshot to extract physical attributes
                      </p>
                    </div>
                    
                    {/* Screenplay Content */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-base-content/70">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Screenplay Description (Optional)
                      </label>
                      
                      <textarea
                        value={screenplayContent}
                        onChange={(e) => setScreenplayContent(e.target.value)}
                        placeholder="Paste character introduction from screenplay..."
                        className="w-full h-32 bg-base-300 border border-base-content/20 rounded-lg p-3 text-gray-100 placeholder-base-content/50 focus:outline-none focus:border-blue-500"
                      />
                      
                      <p className="text-xs text-base-content/50">
                        Include the character's first appearance or description
                      </p>
                    </div>
                  </div>
                  
                  {/* Manual Description */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-base-content/70">
                      <Wand2 className="w-4 h-4 inline mr-2" />
                      Additional Description (Optional)
                    </label>
                    
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Add any additional details about the character..."
                      className="w-full h-24 bg-base-300 border border-base-content/20 rounded-lg p-3 text-gray-100 placeholder-base-content/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep('package')}
                      className="px-6 py-3 bg-base-300 hover:bg-base-content/20 text-base-content rounded-lg font-semibold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-6 py-3 bg-[#DC143C] hover:bg-blue-700 text-base-content rounded-lg font-semibold transition-colors flex items-center"
                    >
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Poses
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Generating - Removed since jobs handle this now */}
              
              {/* Step 4: Complete */}
              {step === 'complete' && generationResult && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Pose Package Generated!
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    Created {generationResult.result?.poses?.length || 0} poses for {characterName}
                  </p>
                  <div className="bg-base-300 rounded-lg p-6 max-w-md mx-auto mb-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-base-content/60 text-sm">Package</div>
                        <div className="text-base-content font-semibold capitalize">{selectedPackageId}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Credits Used</div>
                        <div className="text-base-content font-semibold">{generationResult.result?.totalCredits || 0}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Poses</div>
                        <div className="text-base-content font-semibold">{generationResult.result?.poses?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Consistency</div>
                        <div className="text-base-content font-semibold">{generationResult.result?.consistencyRating || 0}%</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-[#DC143C] hover:bg-blue-700 text-base-content rounded-lg font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
              
              {/* Step 5: Error */}
              {step === 'error' && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    {error}
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-base-300 hover:bg-base-content/20 text-base-content rounded-lg font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
  </>
  );
}

