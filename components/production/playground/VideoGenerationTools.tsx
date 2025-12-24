'use client';

/**
 * Video Generation Tools
 * 
 * Basic video generation options that don't interfere with workflows:
 * - Starting Frame: Generate video from a single image
 * - Frame to Frame: Generate video from two images
 * - Basic video workflows
 */

import React, { useState, useRef, useEffect } from 'react';
import { Video, Image as ImageIcon, Loader2, Upload, X, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';

interface VideoGenerationToolsProps {
  className?: string;
  screenplayId?: string;
}

type VideoMode = 'starting-frame' | 'frame-to-frame';

export function VideoGenerationTools({ className = '', screenplayId: propScreenplayId }: VideoGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = propScreenplayId || screenplay.screenplayId;
  const { getToken } = useAuth();
  
  const [activeMode, setActiveMode] = useState<VideoMode>('starting-frame');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [qualityTier, setQualityTier] = useState<'full-hd' | '4k'>('full-hd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [modelsLoading, setModelsLoading] = useState(true);

  // Starting Frame mode
  const [startImage, setStartImage] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const startImageInputRef = useRef<HTMLInputElement>(null);

  // Frame to Frame mode
  const [frame1, setFrame1] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const [frame2, setFrame2] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const frame1InputRef = useRef<HTMLInputElement>(null);
  const frame2InputRef = useRef<HTMLInputElement>(null);

  // Video models with duration options (fetched from API)
  interface VideoModel {
    id: string;
    label: string;
    provider: string;
    durations: number[]; // Available durations in seconds
    creditsMap: Record<number, number>; // Duration -> credits mapping
    speed?: string;
    quality?: string;
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
        console.log('[VideoGenerationTools] API Response:', response);
        
        // Handle different response structures
        let modelsData = [];
        if (response?.data?.models) {
          modelsData = response.data.models;
        } else if (response?.data?.data?.models) {
          modelsData = response.data.data.models;
        } else if (Array.isArray(response?.data)) {
          modelsData = response.data;
        } else if (response?.models) {
          modelsData = response.models;
        }
        
        console.log('[VideoGenerationTools] Parsed models:', modelsData);
        setVideoModels(modelsData);
        
        // Set default model (first recommended or first in list)
        if (modelsData.length > 0 && !selectedModel) {
          const defaultModel = modelsData.find((m: VideoModel) => m.recommended) || modelsData[0];
          setSelectedModel(defaultModel.id);
          if (defaultModel.durations && defaultModel.durations.length > 0) {
            setSelectedDuration(defaultModel.durations[0]);
          }
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

  // Modify Models removed - use Post-Production Workflows instead
  // Workflows handle video modification with wrapped pricing:
  // - Element Eraser (Runway Gen-4 Aleph)
  // - Scene Transformer (Runway Gen-4)
  // - Other post-production workflows

  // Get available durations for selected model
  const getAvailableDurations = (modelId: string): number[] => {
    const model = videoModels.find(m => m.id === modelId);
    return model?.durations || [5];
  };

  // Get credits for selected model and duration
  const getCreditsForModel = (modelId: string, duration: number): number => {
    const model = videoModels.find(m => m.id === modelId);
    if (!model || !model.creditsMap) return 50;
    
    // Use creditsMap for duration-based pricing
    return model.creditsMap[duration] || model.creditsMap[Object.keys(model.creditsMap)[0] as unknown as number] || 50;
  };

  // Get upscale cost (Runway upscaler: 25 credits for 5s, 50 credits for 10s+)
  const getUpscaleCost = (): number => {
    return selectedDuration <= 5 ? 25 : 50;
  };

  // Get total credits (base generation + upscale if 4K)
  const getTotalCredits = (): number => {
    const baseCredits = getCreditsForModel(selectedModel, selectedDuration);
    const upscaleCredits = qualityTier === '4k' ? getUpscaleCost() : 0;
    return baseCredits + upscaleCredits;
  };

  // Update duration when model changes
  useEffect(() => {
    const availableDurations = getAvailableDurations(selectedModel);
    if (availableDurations.length > 0 && !availableDurations.includes(selectedDuration)) {
      setSelectedDuration(availableDurations[0]);
    }
  }, [selectedModel, selectedDuration]);

  // Camera angles for video generation (with motion descriptions)
  const cameraAngles = [
    { id: '', label: 'None', description: 'No specific camera angle', promptText: '' },
    { id: 'wide-shot', label: 'Wide Shot', description: 'Establishing shot, shows full scene', promptText: 'wide shot, establishing shot, full scene visible' },
    { id: 'medium-shot', label: 'Medium Shot', description: 'Medium framing, shows subject and surroundings', promptText: 'medium shot, shows subject and surroundings' },
    { id: 'close-up', label: 'Close-Up', description: 'Tight framing on subject', promptText: 'close-up shot, tight framing on subject' },
    { id: 'dolly-in', label: 'Dolly In', description: 'Camera moves forward toward subject', promptText: 'dolly shot, camera slowly pushes in toward subject' },
    { id: 'dolly-out', label: 'Dolly Out', description: 'Camera moves backward away from subject', promptText: 'dolly shot, camera slowly pulls back from subject' },
    { id: 'tracking', label: 'Tracking Shot', description: 'Camera follows subject horizontally', promptText: 'tracking shot, camera follows subject horizontally' },
    { id: 'crane-up', label: 'Crane Up', description: 'Camera rises up from low to high', promptText: 'crane shot, camera rises up from low to high angle' },
    { id: 'crane-down', label: 'Crane Down', description: 'Camera descends from high to low', promptText: 'crane shot, camera descends from high to low angle' },
    { id: 'pan-left', label: 'Pan Left', description: 'Camera rotates left', promptText: 'pan shot, camera slowly rotates left' },
    { id: 'pan-right', label: 'Pan Right', description: 'Camera rotates right', promptText: 'pan shot, camera slowly rotates right' },
    { id: 'tilt-up', label: 'Tilt Up', description: 'Camera tilts upward', promptText: 'tilt shot, camera tilts upward' },
    { id: 'tilt-down', label: 'Tilt Down', description: 'Camera tilts downward', promptText: 'tilt shot, camera tilts downward' },
    { id: 'low-angle', label: 'Low Angle', description: 'Camera looking up at subject', promptText: 'low angle shot, camera looking up at subject' },
    { id: 'high-angle', label: 'High Angle', description: 'Camera looking down at subject', promptText: 'high angle shot, camera looking down at subject' },
    { id: 'bird-eye', label: 'Bird\'s Eye View', description: 'Aerial view from above', promptText: 'bird\'s eye view, aerial shot from above' },
    { id: 'point-of-view', label: 'Point of View', description: 'First-person perspective', promptText: 'point of view shot, first-person perspective' },
    { id: 'handheld', label: 'Handheld', description: 'Handheld camera movement', promptText: 'handheld camera, documentary style movement' },
  ];

  // Format camera angle for model-specific video prompts
  const formatCameraAngleForVideo = (angleId: string, modelId: string): string => {
    if (!angleId) return '';
    const angle = cameraAngles.find(a => a.id === angleId);
    if (!angle) return '';

    // Model-specific formatting for video
    if (modelId.includes('veo-3.1')) {
      // Veo 3.1: Front-load cinematography (best practice)
      return `[Cinematography] ${angle.promptText}. `;
    }
    if (modelId.includes('runway')) {
      // Runway: Simple, direct, motion-focused
      return `${angle.promptText}, `;
    }
    if (modelId.includes('luma')) {
      // Luma: Descriptive, cinematic
      return `${angle.promptText}, cinematic movement, `;
    }
    // Default
    return `${angle.promptText}, `;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) throw new Error('Authentication required');

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

    return s3Key;
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: { file: File; preview: string; s3Key?: string } | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const preview = URL.createObjectURL(file);
      const s3Key = await uploadImage(file);
      setter({ file, preview, s3Key });
      toast.success('Image uploaded!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || !selectedModel) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (activeMode === 'starting-frame' && !startImage?.s3Key) {
      toast.error('Please upload a starting frame image');
      return;
    }

    if (activeMode === 'frame-to-frame' && (!frame1?.s3Key || !frame2?.s3Key)) {
      toast.error('Please upload both frame images');
      return;
    }

    if (!screenplayId || screenplayId === 'default') {
      toast.error('Please select a screenplay first');
      return;
    }

    setIsGenerating(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const selectedModelInfo = videoModels.find(m => m.id === selectedModel);
      
      // Build final prompt with camera angle
      let finalPrompt = prompt.trim();
      if (selectedCameraAngle) {
        const angleText = formatCameraAngleForVideo(selectedCameraAngle, selectedModel);
        finalPrompt = angleText + finalPrompt;
      }

      const requestBody: any = {
        prompts: [{
          segmentIndex: 0,
          startTime: 0,
          endTime: selectedDuration,
          duration: selectedDuration,
          prompt: finalPrompt,
        }],
        provider: selectedModelInfo?.provider || selectedModel,
        duration: `${selectedDuration}s`,
        sceneId: `playground_${Date.now()}`,
        sceneName: `Playground ${activeMode === 'starting-frame' ? 'Starting Frame' : 'Frame to Frame'}`,
        useVideoExtension: false,
        // Quality tier for 4K upscaling (will be handled after generation)
        qualityTier: qualityTier === '4k' ? 'premium' : 'professional',
      };

      if (activeMode === 'starting-frame' && startImage?.s3Key) {
        requestBody.startImageS3Key = startImage.s3Key;
      }

      if (activeMode === 'frame-to-frame' && frame1?.s3Key && frame2?.s3Key) {
        requestBody.startImageS3Key = frame1.s3Key;
        requestBody.endImageS3Key = frame2.s3Key;
        requestBody.prompts[0].prompt = `Transition from first frame to second frame: ${prompt.trim()}`;
      }

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to generate video' }));
        throw new Error(error.message || 'Failed to generate video');
      }

      const result = await response.json();
      
      // If 4K quality selected, backend should handle upscaling automatically
      // The qualityTier parameter in requestBody will trigger upscaling
      if (qualityTier === '4k') {
        toast.success('Video generation started! 4K upscaling will be applied automatically.');
      } else {
        toast.success('Video generation started! Check your Media Library.');
      }
      
      // Reset form
      setPrompt('');
      setSelectedCameraAngle('');
      if (activeMode === 'starting-frame') {
        if (startImage?.preview) URL.revokeObjectURL(startImage.preview);
        setStartImage(null);
      } else {
        if (frame1?.preview) URL.revokeObjectURL(frame1.preview);
        if (frame2?.preview) URL.revokeObjectURL(frame2.preview);
        setFrame1(null);
        setFrame2(null);
      }
    } catch (error: any) {
      console.error('Video generation failed:', error);
      toast.error(error.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A] overflow-y-auto", className)}>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Mode Tabs */}
        <div className="flex-shrink-0 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveMode('starting-frame')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeMode === 'starting-frame'
                ? "bg-cinema-red text-white"
                : "bg-[#1F1F1F] text-[#808080] hover:text-white hover:bg-[#2A2A2A]"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Starting Frame</span>
          </button>

          <button
            onClick={() => setActiveMode('frame-to-frame')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeMode === 'frame-to-frame'
                ? "bg-cinema-red text-white"
                : "bg-[#1F1F1F] text-[#808080] hover:text-white hover:bg-[#2A2A2A]"
            )}
          >
            <Film className="w-4 h-4" />
            <span>Frame to Frame</span>
          </button>
        </div>
        </div>

        {/* Generation Form */}
        <div className="flex-1 flex flex-col gap-6">
        {/* Image Upload Section */}
        {activeMode === 'starting-frame' ? (
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-white mb-2">
              Starting Frame Image
            </label>
            <input
              ref={startImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, setStartImage)}
              className="hidden"
              disabled={isUploading || isGenerating}
            />
            {!startImage ? (
              <button
                type="button"
                onClick={() => startImageInputRef.current?.click()}
                disabled={isUploading || isGenerating}
                className={cn(
                  "w-full px-4 py-12 border-2 border-dashed rounded-lg",
                  "flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                  isUploading || isGenerating
                    ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                    : "border-[#3F3F46] text-[#808080] hover:border-cinema-red hover:text-cinema-red"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span>Upload Starting Frame</span>
                  </>
                )}
              </button>
            ) : (
              <div className="relative">
                <img
                  src={startImage.preview}
                  alt="Starting frame"
                  className="w-full h-48 object-cover rounded-lg border border-[#3F3F46]"
                />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(startImage.preview);
                    setStartImage(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-cinema-red rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Frame 1 (Start)
              </label>
              <input
                ref={frame1InputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, setFrame1)}
                className="hidden"
                disabled={isUploading || isGenerating}
              />
              {!frame1 ? (
                <button
                  type="button"
                  onClick={() => frame1InputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className={cn(
                    "w-full px-4 py-8 border-2 border-dashed rounded-lg",
                    "flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isUploading || isGenerating
                      ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                      : "border-[#3F3F46] text-[#808080] hover:border-cinema-red hover:text-cinema-red"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Frame 1</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={frame1.preview}
                    alt="Frame 1"
                    className="w-full h-32 object-cover rounded-lg border border-[#3F3F46]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(frame1.preview);
                      setFrame1(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Frame 2 (End)
              </label>
              <input
                ref={frame2InputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e, setFrame2)}
                className="hidden"
                disabled={isUploading || isGenerating}
              />
              {!frame2 ? (
                <button
                  type="button"
                  onClick={() => frame2InputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className={cn(
                    "w-full px-4 py-8 border-2 border-dashed rounded-lg",
                    "flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isUploading || isGenerating
                      ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                      : "border-[#3F3F46] text-[#808080] hover:border-cinema-red hover:text-cinema-red"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Frame 2</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={frame2.preview}
                    alt="Frame 2"
                    className="w-full h-32 object-cover rounded-lg border border-[#3F3F46]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(frame2.preview);
                      setFrame2(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Angle Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Camera Angle & Movement (Optional)
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

        {/* Prompt Input */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={activeMode === 'starting-frame' 
              ? "Describe the motion, camera movement, and action you want in the video..."
              : "Describe the transition and motion between the two frames..."
            }
            className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent resize-none"
            rows={4}
            disabled={isGenerating}
          />
        </div>

        {/* Model Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Video Model
          </label>
          {modelsLoading ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : (
            <>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
                disabled={isGenerating}
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
              {selectedModel && (
                <p className="mt-1.5 text-xs text-[#808080]">
                  Cost: {getTotalCredits()} credits • Provider: {videoModels.find(m => m.id === selectedModel)?.provider || 'Unknown'}
                </p>
              )}
              <p className="mt-1.5 text-xs text-[#4A4A4A]">
                💡 For video modification (remove objects, transform scenes), use <strong>Post-Production Workflows</strong> tab
              </p>
            </>
          )}
        </div>

        {/* Duration Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Duration (seconds)
          </label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating || modelsLoading}
          >
            {getAvailableDurations(selectedModel).map((duration) => (
              <option key={duration} value={duration}>
                {duration} seconds
              </option>
            ))}
          </select>
        </div>

        {/* Quality Tier Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Quality
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setQualityTier('full-hd')}
              disabled={isGenerating}
              className={cn(
                "px-4 py-3 rounded-lg border-2 font-medium text-sm transition-colors",
                qualityTier === 'full-hd'
                  ? "border-cinema-red bg-cinema-red/10 text-white"
                  : "border-[#3F3F46] bg-[#1F1F1F] text-[#808080] hover:border-[#4A4A4A] hover:text-white"
              )}
            >
              Full HD
            </button>
            <button
              type="button"
              onClick={() => setQualityTier('4k')}
              disabled={isGenerating}
              className={cn(
                "px-4 py-3 rounded-lg border-2 font-medium text-sm transition-colors",
                qualityTier === '4k'
                  ? "border-cinema-red bg-cinema-red/10 text-white"
                  : "border-[#3F3F46] bg-[#1F1F1F] text-[#808080] hover:border-[#4A4A4A] hover:text-white"
              )}
            >
              4K
              {qualityTier === '4k' && (
                <span className="ml-1 text-xs text-[#808080]">
                  (+{getUpscaleCost()} credits)
                </span>
              )}
            </button>
          </div>
          {qualityTier === '4k' && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Video will be upscaled to 4K using Runway upscaler after generation
            </p>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !selectedModel || 
              (activeMode === 'starting-frame' && !startImage) ||
              (activeMode === 'frame-to-frame' && (!frame1 || !frame2))}
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
                <Video className="w-5 h-5" />
                <span>Generate Video</span>
              </>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

