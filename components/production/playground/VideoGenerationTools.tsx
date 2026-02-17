'use client';

/**
 * Video Generation Tools
 *
 * Generate video with model selection, aspect ratio, and quality. Uses GET /api/video/models.
 * Only models that generate from scratch are shown (Runway Aleph is excluded – it needs a
 * source video and is used in "modify video" flows). Sends preferredProvider for the chosen model.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Video, Image as ImageIcon, Loader2, Upload, X, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getEstimatedDuration } from '@/utils/jobTimeEstimates';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { GenerationPreview } from './GenerationPreview';

/** Capabilities from GET /api/video/models (used for mode-based model filtering). */
interface VideoModelCapabilities {
  imageInterpolation?: boolean;
  imageStart?: boolean;
  textOnly?: boolean;
  [key: string]: unknown;
}

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
  capabilities?: VideoModelCapabilities;
}

interface VideoGenerationToolsProps {
  className?: string;
  screenplayId?: string;
  /** Pre-fill starting frame from Shot Board (presigned URL) */
  initialStartImageUrl?: string;
  /** Optional: scene/shot context for job placement and labeling */
  sceneId?: string;
  sceneNumber?: number;  // Feature 0241: Scene number for Media Library folder structure
  sceneName?: string;
  shotNumber?: number;
}

type VideoMode = 'starting-frame' | 'frame-to-frame';

const DEFAULT_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '21:9', '9:21', '4:3', '3:4'];

/** Single camera option: id is Luma concept key (or '' for None). Same dropdown for all providers; Luma gets concept, others get promptText. */
interface CameraOption {
  id: string;
  label: string;
  promptText: string;
}

/** Luma API concepts as baseline (Plan 0257). Order: None, then alphabetical by label. */
const LUMA_CAMERA_OPTIONS: CameraOption[] = [
  { id: '', label: 'None', promptText: '' },
  { id: 'aerial', label: 'Aerial', promptText: 'aerial shot, bird\'s eye view from above' },
  { id: 'aerial_drone', label: 'Aerial Drone', promptText: 'aerial drone shot, flying camera' },
  { id: 'bolt_cam', label: 'Bolt Cam', promptText: 'fast bolt cam style movement' },
  { id: 'crane_down', label: 'Crane Down', promptText: 'crane shot descending from high to low' },
  { id: 'crane_up', label: 'Crane Up', promptText: 'crane shot rising from low to high' },
  { id: 'dolly_zoom', label: 'Dolly Zoom', promptText: 'dolly zoom, vertigo effect' },
  { id: 'elevator_doors', label: 'Elevator Doors', promptText: 'elevator doors style opening' },
  { id: 'eye_level', label: 'Eye Level', promptText: 'eye level shot, neutral height' },
  { id: 'ground_level', label: 'Ground Level', promptText: 'ground level shot, low to the ground' },
  { id: 'handheld', label: 'Handheld', promptText: 'handheld camera, documentary style' },
  { id: 'high_angle', label: 'High Angle', promptText: 'high angle shot, camera looking down' },
  { id: 'low_angle', label: 'Low Angle', promptText: 'low angle shot, camera looking up' },
  { id: 'orbit_left', label: 'Orbit Left', promptText: 'camera orbits left around subject' },
  { id: 'orbit_right', label: 'Orbit Right', promptText: 'camera orbits right around subject' },
  { id: 'over_the_shoulder', label: 'Over the Shoulder', promptText: 'over the shoulder shot' },
  { id: 'overhead', label: 'Overhead', promptText: 'overhead shot, directly above' },
  { id: 'pan_left', label: 'Pan Left', promptText: 'camera pans left' },
  { id: 'pan_right', label: 'Pan Right', promptText: 'camera pans right' },
  { id: 'pedestal_down', label: 'Pedestal Down', promptText: 'pedestal down, camera lowers vertically' },
  { id: 'pedestal_up', label: 'Pedestal Up', promptText: 'pedestal up, camera raises vertically' },
  { id: 'pov', label: 'Point of View', promptText: 'point of view, first-person perspective' },
  { id: 'pull_out', label: 'Pull Out', promptText: 'camera pulls out, dolly back' },
  { id: 'push_in', label: 'Push In', promptText: 'camera pushes in, dolly forward' },
  { id: 'roll_left', label: 'Roll Left', promptText: 'camera rolls left' },
  { id: 'roll_right', label: 'Roll Right', promptText: 'camera rolls right' },
  { id: 'selfie', label: 'Selfie', promptText: 'selfie style, camera facing subject' },
  { id: 'static', label: 'Static', promptText: 'static shot, no camera movement' },
  { id: 'tilt_down', label: 'Tilt Down', promptText: 'camera tilts down' },
  { id: 'tilt_up', label: 'Tilt Up', promptText: 'camera tilts up' },
  { id: 'tiny_planet', label: 'Tiny Planet', promptText: 'tiny planet effect, 360 wrap' },
  { id: 'truck_left', label: 'Truck Left', promptText: 'camera trucks left, lateral move' },
  { id: 'truck_right', label: 'Truck Right', promptText: 'camera trucks right, lateral move' },
  { id: 'zoom_in', label: 'Zoom In', promptText: 'zoom in toward subject' },
  { id: 'zoom_out', label: 'Zoom Out', promptText: 'zoom out from subject' },
];

export function VideoGenerationTools({
  className = '',
  screenplayId: propScreenplayId,
  initialStartImageUrl,
  sceneId: propSceneId,
  sceneNumber: propSceneNumber,
  sceneName: propSceneName,
  shotNumber: propShotNumber,
}: VideoGenerationToolsProps) {
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
  const [videoModelDropdownOpen, setVideoModelDropdownOpen] = useState(false);
  const videoModelDropdownRef = useRef<HTMLDivElement>(null);

  // Close Video Model dropdown when clicking outside
  useEffect(() => {
    if (!videoModelDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (videoModelDropdownRef.current && !videoModelDropdownRef.current.contains(e.target as Node)) {
        setVideoModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [videoModelDropdownOpen]);

  // Starting Frame mode: either uploaded (file + s3Key) or from prop (URL only)
  const [startImage, setStartImage] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const [startImageUrlFromProp, setStartImageUrlFromProp] = useState<string | null>(null);
  const startImageInputRef = useRef<HTMLInputElement>(null);

  // When initialStartImageUrl is provided (e.g. from Shot Board), pre-fill starting frame
  useEffect(() => {
    if (initialStartImageUrl?.trim()) {
      setStartImageUrlFromProp(initialStartImageUrl);
      setStartImage(null);
    }
  }, [initialStartImageUrl]);

  // When switching to Frame to Frame, carry over the current starting frame into Frame 1 so it persists
  const handleSwitchToFrameToFrame = () => {
    setActiveMode('frame-to-frame');
    if (startImage) {
      setFrame1({ file: startImage.file, preview: startImage.preview, s3Key: startImage.s3Key });
    } else if (startImageUrlFromProp) {
      setFrame1({ preview: startImageUrlFromProp });
    }
  };

  // Frame to Frame mode (frame1 can be URL-only when carried over from Starting Frame)
  const [frame1, setFrame1] = useState<{ file?: File; preview: string; s3Key?: string } | null>(null);
  const [frame2, setFrame2] = useState<{ file?: File; preview: string; s3Key?: string } | null>(null);
  const frame1InputRef = useRef<HTMLInputElement>(null);
  const frame2InputRef = useRef<HTMLInputElement>(null);

  // Generated video state
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);

  // Load latest completed video on mount so "Latest generated" shows the previous one
  useEffect(() => {
    let cancelled = false;
    const loadLatestCompleted = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token || cancelled) return;
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        const response = await apiModule.video.getJobs({ limit: 1, status: 'completed' });
        const data = response?.data ?? response;
        if (cancelled || !data?.success || !Array.isArray(data.jobs) || data.jobs.length === 0) return;
        const job = data.jobs[0];
        const videoUrl = job.videos?.[0]?.videoUrl;
        if (videoUrl) {
          setGeneratedVideoUrl(videoUrl);
          // Optional: set generation time from metadata if available
          const meta = job.videos?.[0]?.assetMetadata;
          if (meta?.generationTime != null) setGenerationTime(meta.generationTime);
        }
      } catch (e) {
        if (!cancelled) console.warn('[VideoGen] Load latest completed job:', e);
      }
    };
    loadLatestCompleted();
    return () => { cancelled = true; };
  }, []);

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
        // Use "Grok Video (xAI)" so it sorts A–Z right under Google (no custom order)
        const withLabels = filtered.map((m: VideoModel) =>
          m.id === 'grok-imagine-video' ? { ...m, label: 'Grok Video (xAI)' } : m
        );
        const sorted = [...withLabels].sort((a: VideoModel, b: VideoModel) =>
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

  // When Frame to Frame is selected, show only models that support image-interpolation (Plan 0257).
  const displayModels = useMemo(() => {
    const list = models;
    if (activeMode === 'frame-to-frame') {
      return list.filter((m) => m.capabilities?.imageInterpolation === true);
    }
    return list;
  }, [models, activeMode]);

  // Keep selection valid: if current model is not in the displayed list (e.g. switched to Frame to Frame with Grok selected), reset to first valid.
  useEffect(() => {
    if (displayModels.length === 0) return;
    const isCurrentInList = selectedModel && displayModels.some((m) => m.id === selectedModel);
    if (!isCurrentInList) {
      setSelectedModel(displayModels[0].id);
    }
  }, [activeMode, displayModels, selectedModel]);

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

  // Credits: use selected model's creditsMap from API (same source as backend charge). Fallback only when map missing or duration not in map.
  const getTotalCredits = (): number => {
    const map = selectedModelInfo?.creditsMap;
    if (map && typeof map[selectedDuration] === 'number') {
      return map[selectedDuration];
    }
    if (map && Object.keys(map).length > 0) {
      const durations = Object.keys(map).map(Number).sort((a, b) => a - b);
      const nearest = durations.reduce((prev, d) => (Math.abs(d - selectedDuration) < Math.abs(prev - selectedDuration) ? d : prev));
      return map[nearest] ?? 50;
    }
    return selectedDuration === 5 ? 50 : 100;
  };

  // Luma-baseline camera options (Plan 0257): one list for all providers. id = Luma concept key; Luma gets native concept, others get promptText.
  const cameraAngles = LUMA_CAMERA_OPTIONS;

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
    setStartImageUrlFromProp(null); // Clear any pre-filled URL when user uploads
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

    if (activeMode === 'starting-frame' && !startImage?.s3Key && !startImageUrlFromProp) {
      toast.error('Please upload a starting frame image');
      return;
    }

    if (activeMode === 'frame-to-frame') {
      const frame1Valid = frame1 && (frame1.s3Key || (frame1.preview && frame1.preview.startsWith('http')));
      if (!frame1Valid || !frame2?.s3Key) {
        toast.error('Please upload both frame images');
        return;
      }
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

      const selectedCameraOption = cameraAngles.find((a) => a.id === selectedCameraAngle);
      const requestBody: any = {
        prompt: finalPrompt,
        videoMode: activeMode === 'starting-frame' ? 'image-start' : 'image-interpolation',
        resolution: selectedResolution,
        duration: `${selectedDuration}s`,
        aspectRatio: aspectRatio,
        cameraMotion: selectedCameraOption?.promptText || 'none',
        sceneId: propSceneId ?? `playground_${Date.now()}`,
        sceneNumber: propSceneNumber,
        sceneName: propSceneName ?? `Playground ${activeMode === 'starting-frame' ? 'Starting Frame' : 'Frame to Frame'}`,
      };
      if (selectedModel) requestBody.preferredProvider = selectedModel;
      // Luma baseline: id is the Luma concept key; send it when Luma is selected and an angle is chosen (Plan 0257).
      if (selectedModel && selectedModel.startsWith('luma-') && selectedCameraAngle) {
        requestBody.lumaConcepts = selectedCameraAngle;
      }
      if (propShotNumber != null) requestBody.shotNumber = propShotNumber;
      if (propScreenplayId) requestBody.screenplayId = propScreenplayId;

      if (activeMode === 'starting-frame') {
        if (startImage?.s3Key) {
          requestBody.startImageS3Key = startImage.s3Key;
          requestBody.startImageUrl = startImage.s3Key; // Backend accepts key here and presigns for job
        } else if (startImageUrlFromProp) {
          requestBody.startImageUrl = startImageUrlFromProp;
        }
      }

      if (activeMode === 'frame-to-frame' && frame1 && frame2?.s3Key) {
        requestBody.startImageUrl = frame1.s3Key ?? (frame1.preview?.startsWith('http') ? frame1.preview : undefined);
        requestBody.endImageUrl = frame2.s3Key;
        requestBody.prompt = `Transition from first frame to second frame: ${finalPrompt}`;
      }

      const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      const response = await apiModule.video.generateAsync(requestBody);
      const result = response?.data ?? response;

      // Keep global credits UI synchronized immediately after generation starts.
      if (typeof window !== 'undefined' && window.refreshCredits) {
        window.refreshCredits();
      }
      
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
        setStartImageUrlFromProp(null);
      } else {
        if (frame1?.preview?.startsWith('blob:')) URL.revokeObjectURL(frame1.preview);
        if (frame2?.preview?.startsWith('blob:')) URL.revokeObjectURL(frame2.preview);
        setFrame1(null);
        setFrame2(null);
      }
    } catch (error: any) {
      console.error('Video generation failed:', error);
      toast.error(error.message || 'Failed to generate video');
      if (typeof window !== 'undefined' && window.refreshCredits) {
        window.refreshCredits();
      }
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

  return (
    <div className={cn("min-h-full flex bg-[#0A0A0A]", className)}>
      {/* Left Panel - Form Controls (no inner scroll; whole page scrolls) */}
      <div className="w-1/2 flex flex-col">
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
            onClick={handleSwitchToFrameToFrame}
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

        {/* Generation Form - controls only; frame preview/upload is on the right */}
        <div className="flex-1 flex flex-col gap-6">
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
              <option key={angle.id || 'none'} value={angle.id}>
                {angle.label}
              </option>
            ))}
          </select>
          {selectedCameraAngle && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Will add: &quot;{cameraAngles.find((a) => a.id === selectedCameraAngle)?.promptText}&quot;
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

        {/* Model Selection – custom dropdown so opening it doesn't freeze parent scroll */}
        <div className="flex-shrink-0 relative" ref={videoModelDropdownRef}>
          <label className="block text-sm font-medium text-white mb-2">
            Video Model
          </label>
          {isLoadingModels ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : displayModels.length === 0 ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080]">
              No video models available. Check your connection and try again.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => !isGenerating && setVideoModelDropdownOpen((o) => !o)}
                disabled={isGenerating}
                className={cn(
                  "w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-left text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent flex items-center justify-between",
                  videoModelDropdownOpen && "ring-2 ring-cinema-red border-transparent"
                )}
              >
                <span>{selectedModelInfo?.label ?? displayModels.find((m) => m.id === selectedModel)?.label ?? (selectedModel || 'Select model')}</span>
                <span className={cn("text-[#808080] transition-transform", videoModelDropdownOpen && "rotate-180")}>▼</span>
              </button>
              {videoModelDropdownOpen && (
                <div
                  className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-[#3F3F46] bg-[#1F1F1F] shadow-lg"
                  style={{ minWidth: videoModelDropdownRef.current?.offsetWidth }}
                >
                  {displayModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setVideoModelDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors",
                        m.id === selectedModel ? "bg-cinema-red/20 text-white" : "text-white hover:bg-[#2A2A2A]"
                      )}
                    >
                      {m.id === selectedModel && <span className="mr-2">✓</span>}
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
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

        {/* Generate Button */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-[#0A0A0A]">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || displayModels.length === 0 || !selectedModel ||
              (activeMode === 'starting-frame' && !startImage && !startImageUrlFromProp) ||
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

      {/* Divider */}
      <div className="w-px bg-white/10 flex-shrink-0"></div>

      {/* Right Panel - Frame preview (top) + Latest generated (bottom) */}
      <div className="w-1/2 flex flex-col min-h-full bg-[#141414]">
        {/* Hidden file inputs (triggered from preview area) */}
        <input
          ref={startImageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageSelect(e, setStartImage)}
          className="hidden"
          disabled={isUploading || isGenerating}
          aria-hidden
        />
        <input
          ref={frame1InputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageSelect(e, setFrame1)}
          className="hidden"
          disabled={isUploading || isGenerating}
          aria-hidden
        />
        <input
          ref={frame2InputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageSelect(e, setFrame2)}
          className="hidden"
          disabled={isUploading || isGenerating}
          aria-hidden
        />

        {/* Top: Input frame(s) preview / upload */}
        <div className="flex-shrink-0 border-b border-white/10 p-4">
          <h3 className="text-sm font-medium text-white mb-3">
            {activeMode === 'starting-frame' ? 'Starting Frame' : 'Frame to Frame'}
          </h3>
          {activeMode === 'starting-frame' ? (
            <div className="rounded-lg border-2 border-dashed border-[#3F3F46] overflow-hidden bg-[#0A0A0A] min-h-[200px] flex items-center justify-center">
              {!startImage && !startImageUrlFromProp ? (
                <button
                  type="button"
                  onClick={() => startImageInputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className={cn(
                    "w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isUploading || isGenerating
                      ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                      : "text-[#808080] hover:border-cinema-red hover:text-cinema-red"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8" />
                      <span>Upload Starting Frame</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative w-full h-full min-h-[200px]">
                  <img
                    src={startImage ? startImage.preview : startImageUrlFromProp ?? ''}
                    alt="Starting frame"
                    className="w-full h-full min-h-[200px] object-contain bg-[#0A0A0A]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (startImage?.preview) URL.revokeObjectURL(startImage.preview);
                      setStartImage(null);
                      setStartImageUrlFromProp(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-cinema-red rounded-full flex items-center justify-center"
                    aria-label="Clear starting frame"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-[#808080] mb-1.5">Frame 1 (Start)</p>
                <div className="rounded-lg border-2 border-dashed border-[#3F3F46] overflow-hidden bg-[#0A0A0A] min-h-[160px] flex items-center justify-center">
                  {!frame1 ? (
                    <button
                      type="button"
                      onClick={() => frame1InputRef.current?.click()}
                      disabled={isUploading || isGenerating}
                      className={cn(
                        "w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                        isUploading || isGenerating
                          ? "text-[#808080] cursor-not-allowed"
                          : "text-[#808080] hover:text-cinema-red"
                      )}
                    >
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      <span>Upload Frame 1</span>
                    </button>
                  ) : (
                    <div className="relative w-full h-full min-h-[160px]">
                      <img src={frame1.preview} alt="Frame 1" className="w-full h-full min-h-[160px] object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          if (frame1.preview?.startsWith('blob:')) URL.revokeObjectURL(frame1.preview);
                          setFrame1(null);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center"
                        aria-label="Clear frame 1"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-[#808080] mb-1.5">Frame 2 (End)</p>
                <div className="rounded-lg border-2 border-dashed border-[#3F3F46] overflow-hidden bg-[#0A0A0A] min-h-[160px] flex items-center justify-center">
                  {!frame2 ? (
                    <button
                      type="button"
                      onClick={() => frame2InputRef.current?.click()}
                      disabled={isUploading || isGenerating}
                      className={cn(
                        "w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                        isUploading || isGenerating
                          ? "text-[#808080] cursor-not-allowed"
                          : "text-[#808080] hover:text-cinema-red"
                      )}
                    >
                      {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      <span>Upload Frame 2</span>
                    </button>
                  ) : (
                    <div className="relative w-full h-full min-h-[160px]">
                      <img src={frame2.preview} alt="Frame 2" className="w-full h-full min-h-[160px] object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          if (frame2.preview?.startsWith('blob:')) URL.revokeObjectURL(frame2.preview);
                          setFrame2(null);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center"
                        aria-label="Clear frame 2"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Latest generated video (loaded from last completed job on mount; also updated when a video is generated this session). Temp files expire after 1 day — on load error we clear the URL so we show placeholder instead of empty player. */}
        <div className="flex-1 flex flex-col min-h-0">
          <GenerationPreview
            isGenerating={isGenerating}
            generatedVideoUrl={generatedVideoUrl}
            generationTime={generationTime}
            onDownload={handleDownload}
            onVideoError={() => setGeneratedVideoUrl(null)}
            className="flex-1 min-h-0"
            title="Latest generated"
          />
        </div>
      </div>
    </div>
  );
}

