'use client';

/**
 * Image Generation Tools
 * 
 * Pre-Production image generation with model selection.
 * Categories: Character, Location, Asset, First Frame
 */

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { GenerationPreview } from './GenerationPreview';

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
  file: File;
  preview: string;
  s3Key?: string;
}

interface CameraAngle {
  id: string;
  label: string;
  description: string;
  promptText: string; // Model-agnostic text
}

export function ImageGenerationTools({ className = '' }: ImageGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [models, setModels] = useState<ImageModel[]>([]);
  const [transparency, setTransparency] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);
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
        
        // Filter out Luma Photon models from Playground
        modelsData = modelsData.filter((model: ImageModel) => 
          !model.id.includes('luma-photon') && !model.id.includes('photon')
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
        
        // Set default model (first in sorted list - newest/most expensive)
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
        promptHint: 'FLUX.2: Use structured prompts: Subject + Action + Style + Context. Supports color hex codes (e.g., "color #FF0000"). Supports up to 10 reference images. Best for high-quality, detailed images.',
        referenceHint: 'Best practices: Upload 1-10 reference images. First image is most important. Use high-quality, well-composed images. FLUX.2 excels at maintaining fine details and textures from references.'
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
  const supportsReferenceImages = selectedModelInfo && (
    selectedModelInfo.id.includes('nano-banana-pro') ||
    selectedModelInfo.id.includes('runway-gen4') ||
    selectedModelInfo.id.includes('flux2') ||
    selectedModelInfo.id.includes('gpt-image-1')
  );
  
  // Get reference limit based on model
  const getReferenceLimit = (): number => {
    if (!selectedModelInfo) return 0;
    if (selectedModelInfo.id.includes('nano-banana-pro')) return 14;
    if (selectedModelInfo.id.includes('runway-gen4')) return 3;
    if (selectedModelInfo.id.includes('flux2')) return 10;
    if (selectedModelInfo.id.includes('gpt-image-1')) return 5;
    return 0;
  };

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

        // Upload to S3
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'bucket') {
            formData.append(key, value as string);
          }
        });
        formData.append('file', file);

        const s3Response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!s3Response.ok) {
          throw new Error('S3 upload failed');
        }

        newImages.push({ file, preview, s3Key });
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
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
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

      // Prepare reference image URLs
      const referenceImageUrls = referenceImages
        .map(img => {
          if (img.s3Key) {
            const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
            const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
            return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${img.s3Key}`;
          }
          return null;
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
      };

      // Add reference images if available
      if (referenceImageUrls.length > 0) {
        requestBody.characterReference = referenceImageUrls.length === 1 
          ? referenceImageUrls[0] 
          : referenceImageUrls;
      }

      const response = await apiModule.image.generate(requestBody);
      
      // Calculate generation time
      const elapsed = (Date.now() - startTime) / 1000;
      setGenerationTime(elapsed);

      // Extract image URL from response
      const imageUrl = response.data?.imageUrl || response.data?.url || response.data?.s3Url;
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
      } else {
        // Try to construct from S3 key if available
        const s3Key = response.data?.s3Key || response.data?.key;
        if (s3Key) {
          const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
          const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
          setGeneratedImageUrl(`https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`);
        }
      }

      toast.success('Image generated!');
      
      // Reset form (but keep generated image visible)
      setPrompt('');
      setReferenceImages([]);
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
    <div className={cn("h-full flex bg-[#0A0A0A] overflow-hidden", className)}>
      {/* Left Panel - Form Controls */}
      <div className="w-1/2 flex flex-col border-r border-white/10 overflow-y-auto">
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isGenerating || referenceImages.length >= getReferenceLimit()}
                  className={cn(
                    "w-full px-4 py-3 border-2 border-dashed rounded-lg",
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
                      <span>Upload Reference Images</span>
                    </>
                  )}
                </button>

                {/* Reference Image Previews */}
                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {referenceImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-[#3F3F46]"
                        />
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
                  Upload reference images to guide generation. Supported by: {selectedModelInfo?.label || selectedModelInfo?.id}
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
        
        {/* Generate Button - Fixed at bottom */}
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

      {/* Right Panel - Preview */}
      <div className="w-1/2">
        <GenerationPreview
          isGenerating={isGenerating}
          generatedImageUrl={generatedImageUrl}
          generationTime={generationTime}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}

