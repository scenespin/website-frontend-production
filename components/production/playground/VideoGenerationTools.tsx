'use client';

/**
 * Video Generation Tools
 *
 * Generate video with model selection, aspect ratio, and quality. Uses GET /api/video/models.
 * Only models that generate from scratch are shown (Runway Aleph is excluded – it needs a
 * source video and is used in "modify video" flows). Sends preferredProvider for the chosen model.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Video, Image as ImageIcon, Loader2, Upload, X, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getEstimatedDuration } from '@/utils/jobTimeEstimates';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { GenerationPreview } from './GenerationPreview';
import { ExamplesSection } from './ExamplesSection';

interface VideoModel {
  id: string;
  label: string;
  description?: string;
  provider: string;
  durations: number[];
  creditsMap: Record<number, number>;
  aspectRatios?: string[];
  resolutions?: string[];
  requiresSourceVideo?: boolean;
  recommended?: boolean;
}

interface VideoGenerationToolsProps {
  className?: string;
  screenplayId?: string;
}

type VideoMode = 'starting-frame' | 'frame-to-frame';

const DEFAULT_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '21:9', '9:21', '4:3', '3:4'];

export function VideoGenerationTools({ className = '', screenplayId: propScreenplayId }: VideoGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = propScreenplayId || screenplay.screenplayId;
  const { getToken } = useAuth();

  const [activeMode, setActiveMode] = useState<VideoMode>('starting-frame');
  const [prompt, setPrompt] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [selectedResolution, setSelectedResolution] = useState<string>('1080p');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<VideoModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');

  // Starting Frame mode
  const [startImage, setStartImage] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const startImageInputRef = useRef<HTMLInputElement>(null);

  // Frame to Frame mode
  const [frame1, setFrame1] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const [frame2, setFrame2] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const frame1InputRef = useRef<HTMLInputElement>(null);
  const frame2InputRef = useRef<HTMLInputElement>(null);

  // Generated video state
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);

  // Fetch video models (exclude requiresSourceVideo for "generate from scratch")
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        const response = await apiModule.video.getModels();
        const list = response?.data?.models ?? response?.data?.data?.models ?? [];
        // Only models that generate from scratch (no Runway Aleph – that one needs a source video and is used in "modify video" flows)
        const filtered = (Array.isArray(list) ? list : []).filter(
          (m: VideoModel) => !m.requiresSourceVideo
        );
        const sorted = [...filtered].sort((a: VideoModel, b: VideoModel) =>
          (a.label || a.id).localeCompare(b.label || b.id)
        );
        setModels(sorted);
        if (sorted.length > 0) {
          setSelectedModel((prev) => {
            const stillValid = prev && sorted.some((m: VideoModel) => m.id === prev);
            return stillValid ? prev : sorted[0].id;
          });
        } else {
          setSelectedModel('');
        }
      } catch (e) {
        console.error('Failed to load video models', e);
        toast.error('Failed to load video models');
        setModels([]);
        setSelectedModel('');
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [getToken]);

  const selectedModelInfo = selectedModel ? models.find((m) => m.id === selectedModel) : null;
  const aspectRatioOptions = selectedModelInfo?.aspectRatios?.length
    ? selectedModelInfo.aspectRatios
    : DEFAULT_ASPECT_RATIOS;
  const durationOptions = selectedModelInfo?.durations?.length
    ? selectedModelInfo.durations
    : [5, 10];
  const resolutionOptions = selectedModelInfo?.resolutions?.length
    ? selectedModelInfo.resolutions
    : ['1080p'];

  // When model changes, clamp duration, aspect ratio, and resolution to model's supported values
  useEffect(() => {
    if (!selectedModel) return;
    const info = models.find((m) => m.id === selectedModel);
    if (info?.durations?.length && !info.durations.includes(selectedDuration)) {
      setSelectedDuration(info.durations[0]);
    }
    if (info?.aspectRatios?.length && !info.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(info.aspectRatios[0]);
    }
    if (info?.resolutions?.length && !info.resolutions.includes(selectedResolution)) {
      setSelectedResolution(info.resolutions[0]);
    }
  }, [selectedModel]);

  // Credits: use selected model's creditsMap when available, else fallback by duration
  const getTotalCredits = (): number => {
    if (selectedModelInfo?.creditsMap && typeof selectedModelInfo.creditsMap[selectedDuration] === 'number') {
      return selectedModelInfo.creditsMap[selectedDuration];
    }
    return selectedDuration === 5 ? 50 : 100;
  };

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

  // Format camera angle for video prompts
  const formatCameraAngleForVideo = (angleId: string): string => {
    if (!angleId) return '';
    const angle = cameraAngles.find(a => a.id === angleId);
    if (!angle) return '';
    // Simple, direct formatting (backend handles model-specific optimization)
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
    if (!prompt.trim() || isGenerating) {
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
    setGeneratedVideoUrl(null);
    setGenerationTime(undefined);
    const startTime = Date.now();

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Build final prompt with camera angle
      let finalPrompt = prompt.trim();
      if (selectedCameraAngle) {
        const angleText = formatCameraAngleForVideo(selectedCameraAngle);
        finalPrompt = angleText + finalPrompt;
      }

      // Build request body
      const requestBody: any = {
        prompt: finalPrompt,
        videoMode: activeMode === 'starting-frame' ? 'image-start' : 'image-interpolation',
        resolution: selectedResolution,
        duration: `${selectedDuration}s`,
        aspectRatio: aspectRatio,
        cameraMotion: selectedCameraAngle ? cameraAngles.find(a => a.id === selectedCameraAngle)?.promptText || 'none' : 'none',
        sceneId: `playground_${Date.now()}`,
        sceneName: `Playground ${activeMode === 'starting-frame' ? 'Starting Frame' : 'Frame to Frame'}`,
      };
      if (selectedModel) requestBody.preferredProvider = selectedModel;

      // Add image URLs based on mode
      if (activeMode === 'starting-frame' && startImage?.s3Key) {
        requestBody.startImageUrl = startImage.s3Key;
      }

      if (activeMode === 'frame-to-frame' && frame1?.s3Key && frame2?.s3Key) {
        requestBody.startImageUrl = frame1.s3Key;
        requestBody.endImageUrl = frame2.s3Key;
        requestBody.prompt = `Transition from first frame to second frame: ${finalPrompt}`;
      }

      const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      const response = await apiModule.video.generateAsync(requestBody);
      const result = response?.data ?? response;
      
      // Calculate generation time
      const elapsed = (Date.now() - startTime) / 1000;
      setGenerationTime(elapsed);

      // Extract video URL from response (if available immediately)
      const videoUrl = result.data?.videoUrl || result.data?.url || result.data?.s3Url;
      if (videoUrl) {
        setGeneratedVideoUrl(videoUrl);
      } else {
        // For async jobs, we might get a job ID - show message
        const jobId = result.data?.jobId || result.jobId;
        if (jobId) {
          toast.success('Video generation started!', {
            description: `Estimated time: ${getEstimatedDuration('complete-scene')}. Check Jobs panel for progress.`
          });
        } else {
          // Try to construct from S3 key if available
          const s3Key = result.data?.s3Key || result.data?.key;
          if (s3Key) {
            const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
            const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
            setGeneratedVideoUrl(`https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`);
          }
        }
      }
      
      // Show toast if no immediate video URL
      if (!videoUrl && !result.data?.jobId && !result.jobId) {
        toast.success(`Video generation started (${selectedResolution})! Check your Media Library.`);
      }
      
      // Reset form (but keep generated video visible if available)
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
      setGeneratedVideoUrl(null);
    } finally {
      setIsGenerating(false);
    }
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

  const handleSelectExample = (example: any) => {
    setPrompt(example.prompt);
    // Scroll to prompt input
    setTimeout(() => {
      const promptElement = document.querySelector('textarea[placeholder*="Describe"]');
      promptElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className={cn("h-full flex bg-[#0A0A0A]", className)}>
      {/* Left Panel - Form Controls */}
      <div className="w-1/2 flex flex-col">
        {/* Examples Section */}
        <ExamplesSection type="video" onSelectExample={handleSelectExample} />
        
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

        {/* Resolution Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Resolution
          </label>
          <select
            value={resolutionOptions.includes(selectedResolution) ? selectedResolution : resolutionOptions[0] ?? '1080p'}
            onChange={(e) => setSelectedResolution(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {resolutionOptions.map((res) => (
              <option key={res} value={res}>{res === '4k' ? '4K' : res}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[#808080]">
            Total cost: <strong className="text-white">{getTotalCredits()} credits</strong>
          </p>
          <p className="mt-1.5 text-xs text-[#4A4A4A]">
            💡 For video modification (remove objects, transform scenes), use <strong>Post-Production Workflows</strong> tab
          </p>
        </div>

        {/* Model Selection – generate-from-scratch only (Runway Aleph is in "modify video" flows) */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Video Model
          </label>
          {isLoadingModels ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : models.length === 0 ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080]">
              No video models available. Check your connection and try again.
            </div>
          ) : (
            <>
              <select
                value={selectedModel || (models[0]?.id ?? '')}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
                disabled={isGenerating}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              {selectedModel && selectedModelInfo && (
                <p className="mt-1.5 text-xs text-[#808080]">
                  {selectedModelInfo.description || selectedModelInfo.provider} • {getTotalCredits()} credits
                </p>
              )}
            </>
          )}
        </div>

        {/* Aspect Ratio */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Aspect Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {aspectRatioOptions.map((ar) => (
              <option key={ar} value={ar}>{ar}</option>
            ))}
          </select>
        </div>

        {/* Duration Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Duration (seconds)
          </label>
          <select
            value={durationOptions.includes(selectedDuration) ? selectedDuration : durationOptions[0] ?? 5}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {durationOptions.map((d) => (
              <option key={d} value={d}>{d} seconds</option>
            ))}
          </select>
        </div>
        </div>
        </div>
        
        {/* Generate Button */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-[#0A0A0A]">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || models.length === 0 || !selectedModel ||
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

