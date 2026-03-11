'use client';

/**
 * Image Generation Tools
 * 
 * Pre-Production image generation with model selection.
 * Categories: Character, Location, Asset, First Frame
 */

import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { GenerationPreview } from './GenerationPreview';
import { uploadToObjectStorage } from '@/lib/objectStorageUpload';
import { MediaLibraryBrowser } from '@/components/production/CharacterStudio/MediaLibraryBrowser';
import type { MediaFile } from '@/types/media';
import { useInFlightWorkflowJobsStore } from '@/lib/inFlightWorkflowJobsStore';

interface ImageGenerationToolsProps {
  className?: string;
}

interface ImageModel {
  id: string;
  provider: string;
  costPerImage: number;
  creditsPerImage: number;
  label?: string;
  description?: string;
}

interface ReferenceImage {
  id: string;
  preview: string;
  s3Key?: string;
  file?: File;
  source: 'upload' | 'library';
  label?: string;
}

interface CameraAngle {
  id: string;
  label: string;
  description: string;
  promptText: string; // Model-agnostic text
}

interface RecentGeneratedImage {
  jobId: string;
  imageUrl: string;
  createdAt: string;
  label?: string;
}

const DIRECT_HUB_ALLOWED_PROMPT_MODELS = new Set([
  'flux2-pro-2k',
  'flux2-pro-4k',
  'flux2-max-2k',
  'flux2-max-4k-16:9',
  'nano-banana-pro',
  'nano-banana-pro-2k',
]);

const DIRECT_HUB_ALLOWED_REFERENCE_MODELS = new Set([
  'flux2-pro-2k',
  'flux2-pro-4k',
  'flux2-max-2k',
  'flux2-max-4k-16:9',
  'nano-banana-pro',
  'nano-banana-pro-2k',
]);

export function ImageGenerationTools({ className = '' }: ImageGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  const addInFlightJob = useInFlightWorkflowJobsStore((state) => state.addJob);
  
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [models, setModels] = useState<ImageModel[]>([]);
  const [transparency, setTransparency] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibraryBrowser, setShowMediaLibraryBrowser] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);
  const [recentImages, setRecentImages] = useState<RecentGeneratedImage[]>([]);
  const [isLoadingRecentImages, setIsLoadingRecentImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        // Use API proxy route
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        
        const response = await apiModule.image.getModels();
        let modelsData = response.data?.models || response.data?.data?.models || [];
        
        // Keep Direct Hub image gen to the curated production-tested model set.
        modelsData = modelsData.filter((model: ImageModel) =>
          DIRECT_HUB_ALLOWED_PROMPT_MODELS.has(model.id)
        );
        
        // Sort by newest first (model release date), then most expensive second
        // Model release order (newest to oldest): gpt-image-1.5 > imagen-4-ultra > nano-banana-pro > flux2-max > flux2-pro > imagen-4 > gpt-image-1 > imagen-3 > runway-gen4-image
        const modelOrder: Record<string, number> = {
          'gpt-image-1.5': 1,
          'gpt-image-1-high': 1, // maps to 1.5
          'imagen-4-ultra': 2,
          'nano-banana-pro': 3,
          'nano-banana-pro-2k': 3,
          'flux2-max-4k-16:9': 4,
          'flux2-flex': 4,
          'flux2-pro-4k': 5,
          'flux2-pro-2k': 5,
          'imagen-4': 6,
          'imagen-4-fast': 6,
          'gpt-image-1': 7,
          'gpt-image-1-medium': 7,
          'gpt-image-1-mini': 8,
          'gpt-image-1-low': 8,
          'imagen-3': 9,
          'imagen-3-fast': 9,
          'runway-gen4-image': 10,
          'nano-banana': 11, // editing tool, oldest
        };
        
        modelsData.sort((a: ImageModel, b: ImageModel) => {
          const orderA = modelOrder[a.id] || 999;
          const orderB = modelOrder[b.id] || 999;
          if (orderA !== orderB) {
            return orderA - orderB; // Lower number = newer
          }
          // If same order, sort by credits (most expensive first)
          return (b.creditsPerImage || 0) - (a.creditsPerImage || 0);
        });
        
        setModels(modelsData);
        
        // Keep current model if still valid, otherwise select default prompt model.
        setSelectedModel((current) => {
          const currentValid = current && modelsData.some((model: ImageModel) => model.id === current);
          if (currentValid) return current;
          const preferred =
            modelsData.find((model: ImageModel) => model.id === 'flux2-pro-2k') ||
            modelsData.find((model: ImageModel) => model.id === 'nano-banana-pro-2k') ||
            modelsData[0];
          return preferred?.id || '';
        });
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
  }, [getToken]);

  // Model-specific prompt hints and reference image instructions
  const getModelHints = (modelId: string): { promptHint: string; referenceHint: string } => {
    if (modelId.includes('nano-banana-pro')) {
      return {
        promptHint: 'Nano Banana Pro: Use detailed descriptions with specific details. Best for photorealistic characters and locations. Supports up to 14 reference images for maximum consistency.',
        referenceHint: 'Best practices: Upload 1-3 character reference images showing face and body. For locations, upload 1-2 reference images of similar settings. All images should be clear, well-lit, and show the subject prominently.'
      };
    }
    if (modelId.includes('runway-gen4')) {
      return {
        promptHint: 'Runway Gen-4: Use simple, direct prompts. Focus on subject + action + style. Best for cinematic first frames. Supports up to 3 reference images.',
        referenceHint: 'Best practices: Upload 1-3 reference images. First image gets highest priority. Use clear, front-facing images for best results. Combine character + clothing in one image when possible to maximize reference slots.'
      };
    }
    if (modelId.includes('flux2')) {
      return {
        promptHint: 'FLUX.2: Use structured prompts: Subject + Action + Style + Context. Supports color hex codes (e.g., "color #FF0000"). Supports up to 8 reference images. Best for high-quality, detailed images.',
        referenceHint: 'Best practices: Upload 1-8 reference images. First image is most important. Use high-quality, well-composed images. FLUX.2 excels at maintaining fine details and textures from references.'
      };
    }
    if (modelId.includes('gpt-image-1')) {
      return {
        promptHint: 'GPT Image: Use natural language descriptions. Best for creative and artistic images. Supports up to 5 reference images. Excellent text understanding.',
        referenceHint: 'Best practices: Upload 1-5 reference images. Use clear, well-lit images. GPT Image models excel at understanding context and maintaining style consistency.'
      };
    }
    if (modelId.includes('imagen')) {
      return {
        promptHint: 'Imagen: Use detailed, specific prompts. Best for photorealistic images. Focus on subject, setting, lighting, and style.',
        referenceHint: 'Imagen models do not support reference images. Use detailed text descriptions instead.'
      };
    }
    return {
      promptHint: 'Use clear, descriptive prompts with specific details about subject, style, lighting, and composition.',
      referenceHint: 'This model may not support reference images. Check model documentation for details.'
    };
  };

  // Check if selected model supports reference images
  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const supportsReferenceImages = !!selectedModelInfo && DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(selectedModelInfo.id);
  
  // Get reference limit based on model
  const getReferenceLimit = (): number => {
    if (!selectedModelInfo) return 0;
    if (selectedModelInfo.id.includes('nano-banana-pro')) return 14;
    if (selectedModelInfo.id.includes('flux2')) return 8;
    return 0;
  };

  useEffect(() => {
    const limit = getReferenceLimit();
    if (limit <= 0 || referenceImages.length <= limit) return;
    setReferenceImages((prev) => {
      const toRemove = prev.slice(limit);
      toRemove.forEach((img) => {
        if (img.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      return prev.slice(0, limit);
    });
    toast.warning(`Reference list trimmed to ${limit} for selected model`);
  }, [selectedModelInfo?.id, referenceImages.length]);

  useEffect(() => {
    if (!selectedModel || models.length === 0 || referenceImages.length === 0) return;
    if (DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(selectedModel)) return;
    const fallbackModel =
      models.find((model) => model.id === 'nano-banana-pro-2k' && DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(model.id)) ||
      models.find((model) => DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(model.id));
    if (fallbackModel?.id) {
      setSelectedModel(fallbackModel.id);
      toast.info(`Switched model to ${fallbackModel.id} for reference-based generation`);
    }
  }, [selectedModel, models, referenceImages.length]);

  // Camera angles for image generation
  const cameraAngles: CameraAngle[] = [
    { id: '', label: 'None', description: 'No specific camera angle', promptText: '' },
    { id: 'wide-shot', label: 'Wide Shot', description: 'Establishing shot, shows full scene', promptText: 'wide shot, establishing shot, full scene visible' },
    { id: 'medium-shot', label: 'Medium Shot', description: 'Medium framing, shows subject and surroundings', promptText: 'medium shot, shows subject and surroundings' },
    { id: 'close-up', label: 'Close-Up', description: 'Tight framing on subject', promptText: 'close-up shot, tight framing on subject' },
    { id: 'extreme-close-up', label: 'Extreme Close-Up', description: 'Very tight framing, detail focus', promptText: 'extreme close-up, very tight framing, detail focus' },
    { id: 'low-angle', label: 'Low Angle', description: 'Camera looking up at subject', promptText: 'low angle shot, camera looking up at subject' },
    { id: 'high-angle', label: 'High Angle', description: 'Camera looking down at subject', promptText: 'high angle shot, camera looking down at subject' },
    { id: 'bird-eye', label: 'Bird\'s Eye View', description: 'Aerial view from above', promptText: 'bird\'s eye view, aerial shot from above' },
    { id: 'dutch-angle', label: 'Dutch Angle', description: 'Tilted camera, dynamic composition', promptText: 'dutch angle, tilted camera, dynamic composition' },
    { id: 'over-the-shoulder', label: 'Over-the-Shoulder', description: 'Shot from behind subject', promptText: 'over-the-shoulder shot, camera positioned behind subject' },
    { id: 'two-shot', label: 'Two-Shot', description: 'Frames two subjects together', promptText: 'two-shot, frames two subjects together' },
    { id: 'point-of-view', label: 'Point of View', description: 'First-person perspective', promptText: 'point of view shot, first-person perspective' },
  ];

  // Format camera angle for model-specific prompts
  const formatCameraAngleForModel = (angleId: string, modelId: string): string => {
    if (!angleId) return '';
    const angle = cameraAngles.find(a => a.id === angleId);
    if (!angle) return '';

    // Model-specific formatting
    if (modelId.includes('flux2')) {
      // FLUX.2: Use structured format
      return `, ${angle.promptText}, cinematic composition`;
    }
    if (modelId.includes('runway-gen4')) {
      // Runway: Simple, direct
      return `, ${angle.promptText}`;
    }
    if (modelId.includes('gpt-image-1')) {
      // GPT Image: Natural language
      return `, ${angle.promptText}`;
    }
    // Default: Just add the prompt text
    return `, ${angle.promptText}`;
  };

  const aspectRatios = [
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Classic)' },
    { value: '21:9', label: '21:9 (Cinema)' },
  ];

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const limit = getReferenceLimit();
    if (limit <= 0) {
      toast.error('Selected model does not support reference images');
      return;
    }
    if (referenceImages.length + files.length > limit) {
      toast.error(`Maximum ${limit} reference images allowed for this model`);
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const newImages: ReferenceImage[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload image files only');
          continue;
        }

        // Create preview
        const preview = URL.createObjectURL(file);

        // Upload to S3
        const presignedResponse = await fetch(
          `/api/video/upload/get-presigned-url?` +
          `fileName=${encodeURIComponent(file.name)}` +
          `&fileType=${encodeURIComponent(file.type)}` +
          `&fileSize=${file.size}` +
          `&projectId=${encodeURIComponent(screenplayId || 'default')}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { url, fields, s3Key } = await presignedResponse.json();

        // Upload to object storage (S3 POST or R2 PUT)
        const s3Response = await uploadToObjectStorage(url, fields, file, {
          fileName: file.name,
          contentType: file.type,
        });

        if (!s3Response.ok) {
          throw new Error('S3 upload failed');
        }

        // Register uploaded reference in Media Library under System/Images/Uploads.
        try {
          await fetch('/api/media/register', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              screenplayId: screenplayId || 'default',
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              s3Key,
              metadata: {
                source: 'direct-image-reference-upload',
                uploadedFrom: 'direct-image-gen',
              },
            }),
          });
        } catch (registerError) {
          // Non-fatal: generation can still proceed with S3 key.
          console.warn('[ImageGenerationTools] Failed to register uploaded reference', registerError);
        }

        newImages.push({
          id: `upload-${s3Key || file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          file,
          preview,
          s3Key,
          source: 'upload',
          label: file.name,
        });
      }

      setReferenceImages(prev => [...prev, ...newImages]);
      toast.success(`${newImages.length} reference image(s) uploaded`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload reference images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => {
      const removed = prev[index];
      if (removed?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearReferenceImages = () => {
    setReferenceImages((prev) => {
      prev.forEach((img) => {
        if (img.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      return [];
    });
  };

  const loadRecentGeneratedImages = async () => {
    if (!screenplayId || screenplayId === 'default') {
      setRecentImages([]);
      return;
    }
    try {
      setIsLoadingRecentImages(true);
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;

      const response = await fetch(
        `/api/workflows/executions?screenplayId=${encodeURIComponent(screenplayId)}&limit=30`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) return;

      const data = await response.json();
      const jobs = data?.data?.jobs || data?.jobs || [];
      const imageJobs = (Array.isArray(jobs) ? jobs : [])
        .filter((job: any) => job?.jobType === 'image-generation' && job?.status === 'completed')
        .flatMap((job: any) => {
          const createdAt = job?.createdAt || new Date().toISOString();
          const images = Array.isArray(job?.results?.images) ? job.results.images : [];
          return images.map((item: any, index: number) => {
            const s3Key = typeof item?.s3Key === 'string' ? item.s3Key : '';
            const directUrl = typeof item?.imageUrl === 'string' ? item.imageUrl : '';
            const resolvedUrl = directUrl || (s3Key ? `/api/media/file?key=${encodeURIComponent(s3Key)}` : '');
            if (!resolvedUrl) return null;
            return {
              jobId: `${job.jobId || job.executionId || 'job'}-${index}`,
              imageUrl: resolvedUrl,
              createdAt,
              label: typeof item?.label === 'string' ? item.label : 'Generated image',
            } as RecentGeneratedImage;
          });
        })
        .filter(Boolean) as RecentGeneratedImage[];

      setRecentImages(imageJobs.slice(0, 12));
    } catch (error) {
      console.warn('[ImageGenerationTools] Failed to load recent generated images', error);
    } finally {
      setIsLoadingRecentImages(false);
    }
  };

  useEffect(() => {
    void loadRecentGeneratedImages();
  }, [screenplayId, getToken]);

  const handleSelectReferenceImagesFromLibrary = (images: MediaFile[]) => {
    const limit = getReferenceLimit();
    if (limit <= 0) {
      toast.error('Selected model does not support reference images');
      return;
    }

    setReferenceImages((prev) => {
      const existingKeys = new Set(prev.map((img) => img.s3Key).filter(Boolean));
      const dedupedIncoming = images.filter((img) => img.s3Key && !existingKeys.has(img.s3Key));
      const remainingSlots = Math.max(0, limit - prev.length);
      const accepted = dedupedIncoming.slice(0, remainingSlots);

      if (dedupedIncoming.length === 0) {
        toast.error('All selected images are already in references');
        return prev;
      }
      if (accepted.length < dedupedIncoming.length) {
        toast.warning(`Added ${accepted.length} image(s). Reached model limit of ${limit}.`);
      } else {
        toast.success(`Added ${accepted.length} reference image(s) from library`);
      }

      const mapped: ReferenceImage[] = accepted.map((img) => ({
        id: `library-${img.id}`,
        preview: img.s3Key ? `/api/media/file?key=${encodeURIComponent(img.s3Key)}` : (img.fileUrl || ''),
        s3Key: img.s3Key,
        source: 'library' as const,
        label: img.fileName,
      })).filter((img) => !!img.s3Key && !!img.preview);

      return [...prev, ...mapped];
    });

    setShowMediaLibraryBrowser(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || !selectedModel) return;

    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setGenerationTime(undefined);
    const startTime = Date.now();

    try {
      const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));

      // Prepare reference image identifiers without constructing provider-specific bucket URLs.
      const referenceImageUrls = referenceImages
        .map(img => {
          return img.s3Key || null;
        })
        .filter(Boolean) as string[];

      // Build final prompt with camera angle
      let finalPrompt = prompt.trim();
      if (selectedCameraAngle) {
        const angleText = formatCameraAngleForModel(selectedCameraAngle, selectedModel);
        finalPrompt = finalPrompt + angleText;
      }

      const requestBody: any = {
        prompt: finalPrompt,
        desiredModelId: selectedModel,
        aspectRatio,
        quality: transparency ? 'high-quality' : 'standard',
        projectId: screenplayId,
        entityType: 'playground',
        entityId: screenplayId, // Jobs Panel: backend requires entityId to create job
      };

      // Add reference images if available
      if (referenceImageUrls.length > 0) {
        requestBody.characterReference = referenceImageUrls.length === 1 
          ? referenceImageUrls[0] 
          : referenceImageUrls;
      }

      const response = await apiModule.image.generate(requestBody);
      const returnedJobId = response.data?.jobId || response.data?.data?.jobId;
      if (returnedJobId && screenplayId) {
        addInFlightJob(returnedJobId);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('wryda:optimistic-job', {
              detail: {
                jobId: returnedJobId,
                screenplayId,
                jobType: 'image-generation',
                assetName: 'Direct Image Gen',
              },
            })
          );
        }
      }
      
      // Calculate generation time
      const elapsed = (Date.now() - startTime) / 1000;
      setGenerationTime(elapsed);

      // Extract image URL from response
      const imageUrl = response.data?.imageUrl || response.data?.url || response.data?.s3Url;
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
      } else {
        // Build proxy URL from key if backend returned only key.
        const s3Key = response.data?.s3Key || response.data?.key;
        if (s3Key) {
          setGeneratedImageUrl(`/api/media/file?key=${encodeURIComponent(s3Key)}`);
        }
      }

      toast.success('Image generated!');
      void loadRecentGeneratedImages();
      
      // Reset form (but keep generated image visible)
      setPrompt('');
      clearReferenceImages();
      setShowMediaLibraryBrowser(false);
      setSelectedCameraAngle('');
      
    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to generate image');
      setGeneratedImageUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={cn("min-h-full flex flex-col md:flex-row bg-[#0A0A0A]", className)}>
      {/* Left Panel - Form Controls */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          {/* Prompt Input */}
          <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Prompt
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedModel ? getModelHints(selectedModel).promptHint : 'Describe what you want to generate...'}
              className={cn(
                "w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white",
                "focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent resize-none",
                "placeholder:text-[#4A4A4A]"
              )}
              rows={4}
              disabled={isGenerating}
            />
          </div>
          {selectedModel && (
            <p className="mt-1.5 text-xs text-[#808080]">
              💡 Model-specific hint: {getModelHints(selectedModel).promptHint}
            </p>
          )}
          </div>

          {/* Reference Image Upload */}
          {supportsReferenceImages && (
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-white mb-2">
                Reference Images (Optional)
                <span className="ml-2 text-xs text-[#808080]">
                  {referenceImages.length}/{getReferenceLimit()} images
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleReferenceImageUpload}
                className="hidden"
                disabled={isUploading || isGenerating || referenceImages.length >= getReferenceLimit()}
              />
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isGenerating || referenceImages.length >= getReferenceLimit()}
                    className={cn(
                      "px-4 py-3 border-2 border-dashed rounded-lg",
                      "flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                      isUploading || isGenerating || referenceImages.length >= getReferenceLimit()
                        ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                        : "border-[#3F3F46] text-[#808080] hover:border-cinema-red hover:text-cinema-red"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMediaLibraryBrowser(true)}
                    disabled={!screenplayId || isGenerating}
                    className={cn(
                      "px-4 py-3 border rounded-lg",
                      "flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                      !screenplayId || isGenerating
                        ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                        : "border-[#3F3F46] text-[#B3B3B3] hover:border-cinema-red hover:text-cinema-red"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Add from Library</span>
                  </button>
                </div>

                {/* Reference Image Previews */}
                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {referenceImages.map((img, index) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.preview}
                          alt={img.label || `Reference ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-[#3F3F46]"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 rounded bg-[#DC143C]/90 px-1.5 py-0.5 text-[10px] text-white">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeReferenceImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-1.5 space-y-1">
                <p className="text-xs text-[#808080]">
                  Add references from upload or library. Supported by: {selectedModelInfo?.label || selectedModelInfo?.id}
                </p>
                {selectedModel && (
                  <div className="text-xs text-[#4A4A4A] bg-[#1A1A1A] p-2 rounded border border-[#2A2A2A]">
                    <p className="font-medium text-[#808080] mb-1">📋 Best Practices:</p>
                    <p className="text-[#4A4A4A]">{getModelHints(selectedModel).referenceHint}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Camera Angle Selection */}
          <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Camera Angle (Optional)
          </label>
          <select
            value={selectedCameraAngle}
            onChange={(e) => setSelectedCameraAngle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {cameraAngles.map((angle) => (
              <option key={angle.id} value={angle.id}>
                {angle.label} {angle.description ? `- ${angle.description}` : ''}
              </option>
            ))}
          </select>
          {selectedCameraAngle && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Will add: "{cameraAngles.find(a => a.id === selectedCameraAngle)?.promptText}"
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

        </div>
        
        {/* Generate Button */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-[#0A0A0A]">
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

      {/* Divider */}
      <div className="hidden md:block w-px bg-white/10 flex-shrink-0"></div>

      {/* Right Panel - Preview */}
      <div className="w-full md:w-1/2 flex flex-col">
        <GenerationPreview
          isGenerating={isGenerating}
          generatedImageUrl={generatedImageUrl}
          generationTime={generationTime}
          onDownload={handleDownload}
        />
        <div className="border-t border-white/10 p-4 md:p-5 bg-[#141414]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">Recent generated images</p>
            <button
              type="button"
              onClick={() => void loadRecentGeneratedImages()}
              className="text-xs text-[#B3B3B3] hover:text-white"
              disabled={isLoadingRecentImages}
            >
              {isLoadingRecentImages ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {isLoadingRecentImages && recentImages.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-[#808080]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading recent generated images...</span>
            </div>
          ) : recentImages.length === 0 ? (
            <p className="text-xs text-[#808080]">No generated images yet.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
              {recentImages.map((item) => (
                <button
                  key={item.jobId}
                  type="button"
                  onClick={() => setGeneratedImageUrl(item.imageUrl)}
                  className="relative rounded overflow-hidden border border-[#3F3F46] hover:border-cinema-red transition-colors"
                  title={item.label || 'Generated image'}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.label || 'Generated image'}
                    className="h-16 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showMediaLibraryBrowser && screenplayId && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-[1px] p-3 md:p-6">
          <div className="h-full w-full md:mx-auto md:max-w-6xl rounded-xl border border-[#3F3F46] bg-[#0A0A0A] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div>
                <p className="text-sm font-semibold text-white">Select references from Library</p>
                <p className="text-xs text-[#808080]">
                  Choose up to {Math.max(1, getReferenceLimit() - referenceImages.length)} image(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaLibraryBrowser(false)}
                className="px-3 py-1.5 rounded border border-[#3F3F46] text-sm text-[#B3B3B3] hover:text-white hover:border-cinema-red"
              >
                Close
              </button>
            </div>
            <div className="flex-1 p-3 md:p-4 overflow-hidden">
              <MediaLibraryBrowser
                screenplayId={screenplayId}
                onSelectImages={handleSelectReferenceImagesFromLibrary}
                filterTypes={['image']}
                allowMultiSelect={true}
                maxSelections={Math.max(1, getReferenceLimit() - referenceImages.length)}
                onCancel={() => setShowMediaLibraryBrowser(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

