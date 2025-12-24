'use client';

/**
 * Annotation-to-Video Panel
 * 
 * Convert annotated first frames to video with direct model selection (unwrapped).
 * Uses existing VisualAnnotationPanel and VisualAnnotationCanvas components.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Video, Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { VisualAnnotationPanel } from '../VisualAnnotationPanel';
import { GenerationPreview } from './GenerationPreview';

interface AnnotationToVideoPanelProps {
  className?: string;
}

export function AnnotationToVideoPanel({ className = '' }: AnnotationToVideoPanelProps) {
  const { getToken } = useAuth();
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageS3Key, setImageS3Key] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<any>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video models (fetched from API)
  interface VideoModel {
    id: string;
    label: string;
    provider: string;
    durations: number[];
    creditsMap: Record<number, number>;
    recommended?: boolean;
  }

  const [videoModels, setVideoModels] = useState<VideoModel[]>([]);

  // Fetch video models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          console.error('Authentication required');
          return;
        }

        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));

        const response = await apiModule.video.getModels();
        console.log('[AnnotationToVideoPanel] API Response:', response);
        
        // Handle different response structures
        let modelsData = [];
        if (response?.data?.models) {
          modelsData = response.data.models;
        } else if (response?.data?.data?.models) {
          modelsData = response.data.data.models;
        } else if (Array.isArray(response?.data)) {
          modelsData = response.data;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          modelsData = response.data.data;
        }
        
        console.log('[AnnotationToVideoPanel] Parsed models:', modelsData);
        setVideoModels(modelsData);
        
        // Set default model (first recommended or first in list)
        if (modelsData.length > 0 && !selectedModel) {
          const defaultModel = modelsData.find((m: VideoModel) => m.recommended) || modelsData[0];
          setSelectedModel(defaultModel.id);
        }
      } catch (error) {
        console.error('Failed to fetch video models:', error);
        toast.error('Failed to load video models');
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [getToken]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Get presigned URL
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

      // Generate preview URL
      const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
      const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
      const previewUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

      setImageUrl(previewUrl);
      setImageS3Key(s3Key);
      toast.success('Image uploaded! Add annotations to control camera motion.');
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnnotationsComplete = (annotationData: any) => {
    setAnnotations(annotationData);
  };

  const handleGenerate = async () => {
    if (!imageS3Key) {
      toast.error('Please upload an image first');
      return;
    }

    if (!screenplayId || screenplayId === 'default') {
      toast.error('Please select a screenplay first');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setGenerationTime(undefined);
    const startTime = Date.now();

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const selectedModelInfo = videoModels.find(m => m.id === selectedModel);
      
      // Build request body
      const requestBody: any = {
        prompts: [{
          segmentIndex: 0,
          startTime: 0,
          endTime: 5,
          duration: 5,
          prompt: 'Animated scene with camera motion',
          continuityNote: 'Generated from annotated first frame'
        }],
        provider: selectedModelInfo?.provider || selectedModel,
        resolution: '1080p',
        sceneId: `playground_${Date.now()}`,
        sceneName: 'Playground Annotation-to-Video',
        startImageS3Key: imageS3Key,
        useVideoExtension: false
      };

      // Add annotations if present
      if (annotations && annotations.annotations && annotations.annotations.length > 0) {
        requestBody.visualAnnotations = annotations;
        console.log('[AnnotationToVideoPanel] Including visual annotations');
      }

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();
      
      // Calculate generation time
      const elapsed = (Date.now() - startTime) / 1000;
      setGenerationTime(elapsed);

      // Extract video URL from response (if available immediately)
      const videoUrl = data.data?.videoUrl || data.data?.url || data.data?.s3Url;
      if (videoUrl) {
        setGeneratedVideoUrl(videoUrl);
        toast.success('Video generated!');
      } else {
        // For async jobs, we might get a job ID - show message
        const jobId = data.data?.jobId || data.jobId;
        if (jobId) {
          toast.success('Video generation started! Check Jobs panel for progress.');
        } else {
          // Try to construct from S3 key if available
          const s3Key = data.data?.s3Key || data.data?.key;
          if (s3Key) {
            const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
            const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
            setGeneratedVideoUrl(`https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`);
            toast.success('Video generated!');
          } else {
            toast.success('Video generation started! Check Jobs panel for progress.');
          }
        }
      }
      
      // Reset form (but keep generated video visible if available)
      if (!videoUrl && !data.data?.jobId) {
        setImageUrl(null);
        setImageS3Key(null);
        setAnnotations(null);
      }
    } catch (error: any) {
      console.error('Video generation failed:', error);
      toast.error(error.message || 'Failed to generate video');
      setGeneratedVideoUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageS3Key(null);
    setAnnotations(null);
  };

  const handleDownload = () => {
    if (generatedVideoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideoUrl;
      link.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={cn("h-full flex bg-[#0A0A0A] overflow-y-auto", className)}>
      {/* Left Panel - Form Controls */}
      <div className="w-1/2 flex flex-col">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-6 h-6 text-cinema-red" />
              <h2 className="text-xl font-semibold text-white">Annotation-to-Video</h2>
            </div>
            <p className="text-sm text-[#808080]">
              Upload a first frame image, add annotations for camera motion, and generate video with your chosen model.
            </p>
          </div>
        {/* Model Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Video Model (Direct Selection)
          </label>
          {modelsLoading ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
              disabled={isGenerating || isUploading}
            >
              {videoModels.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                <>
                  <option value="">Select a video model...</option>
                  {videoModels.map((model) => {
                    const defaultDuration = model.durations?.[0] || 5;
                    const defaultCredits = model.creditsMap?.[defaultDuration] || 50;
                    return (
                      <option key={model.id} value={model.id}>
                        {model.label} ({defaultCredits} credits)
                      </option>
                    );
                  })}
                </>
              )}
            </select>
          )}
          <p className="mt-1.5 text-xs text-[#808080]">
            💡 In Playground, you can choose specific models. Workflows use wrapped quality tiers.
          </p>
        </div>

        {/* Image Upload/Display */}
        {!imageUrl ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#3F3F46] rounded-lg bg-[#141414]">
            <div className="text-center p-8">
              <Upload className="w-12 h-12 text-[#808080] mx-auto mb-4" />
              <p className="text-white font-medium mb-1">Upload First Frame Image</p>
              <p className="text-sm text-[#808080] mb-4">
                Or generate one in the Image Generation section
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="image-upload"
                className={cn(
                  "inline-block px-4 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white text-sm hover:bg-[#2A2A2A] transition-colors cursor-pointer",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Choose Image'
                )}
              </label>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            {/* Image Preview with Remove Button */}
            <div className="relative">
              <img
                src={imageUrl}
                alt="First frame"
                className="w-full rounded-lg border border-[#3F3F46]"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white hover:bg-[#2A2A2A] transition-colors"
                disabled={isGenerating}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Annotation Panel */}
            <VisualAnnotationPanel
              imageUrl={imageUrl}
              onAnnotationsComplete={handleAnnotationsComplete}
              defaultExpanded={true}
              className="bg-[#1F1F1F] border-[#3F3F46]"
            />
          </div>
        )}

        </div>
        
        {/* Generate Button */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-[#0A0A0A]">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !imageS3Key || isUploading}
            className={cn(
              "w-full px-6 py-3 rounded-lg font-medium text-white transition-colors",
              "bg-cinema-red hover:bg-red-700 disabled:bg-[#3F3F46] disabled:text-[#808080] disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Video...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Generate Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/10 flex-shrink-0"></div>

      {/* Right Panel - Preview */}
      <div className="w-1/2 flex flex-col">
        <GenerationPreview
          isGenerating={isGenerating}
          generatedVideoUrl={generatedVideoUrl}
          generationTime={generationTime}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}


