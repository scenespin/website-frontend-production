/**
 * Composition Studio - Professional Video Composition Interface
 * 
 * Clean, focused interface for creating video compositions with:
 * - Visual layout selector
 * - Emotional pacing controls
 * - Real-time preview
 * - Composition gallery
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Film, 
  Clock, 
  Play,
  Sparkles,
  History,
  Settings,
  Upload,
  X,
  Plus,
  Video,
  Download,
  Music
} from 'lucide-react';
import { LayoutSelector } from './LayoutSelector';
import { PacingSelector } from './PacingSelector';
import { AnimationSelector } from './AnimationSelector';
import { CompositionPreview } from './CompositionPreview';
import { CompositionGallery } from './CompositionGallery';
import { MusicGenerator } from '../music/MusicGenerator';
import { MusicLibrary, MusicTrack } from '../music/MusicLibrary';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { extractS3Key } from '@/utils/s3';
import { MobileCompositionBanner } from './MobileCompositionBanner';
import { shouldSimplifyComposition } from '@/utils/deviceDetection';

// Video file validation
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

interface VideoClip {
  id: string;
  file: File;
  preview: string;
  s3Url?: string;       // NEW (Feature 0070): S3 URL for uploaded file
  s3Key?: string;       // NEW (Feature 0070): S3 key for uploaded file
  duration?: number;
  size: number;
  name: string;
}

interface CompositionResult {
  job_id: string;
  status: string;
  output_video_url?: string;
}

interface CompositionStudioProps {
  userId: string;
  preloadedClip?: { url: string; type: string; name: string } | null;
  preloadedClips?: Array<{ url: string; type: string; name: string }> | null;
  recomposeData?: any | null; // NEW: For re-compose mode from Timeline
}

export function CompositionStudio({ userId, preloadedClip, preloadedClips, recomposeData }: CompositionStudioProps) {
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [selectedPacing, setSelectedPacing] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [compositionType, setCompositionType] = useState<'static' | 'animated' | 'paced'>('static');
  const [isComposing, setIsComposing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recentCompositions, setRecentCompositions] = useState<number>(0);
  
  // NEW: Video clips management
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // NEW: Background music state
  const [backgroundMusic, setBackgroundMusic] = useState<MusicTrack | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [showMusicGenerator, setShowMusicGenerator] = useState(false);
  
  // Storage modal state (Feature 0066)
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    s3Key: string;
    name: string;
    type: 'video' | 'image' | 'composition';
  } | null>(null);
  
  // Device detection (Feature 0068)
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    // Check if should simplify on mount
    setIsMobileView(shouldSimplifyComposition());
    
    // Re-check on window resize
    const handleResize = () => {
      setIsMobileView(shouldSimplifyComposition());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // NEW: Handle preloaded clip from gallery (single clip)
  useEffect(() => {
    if (preloadedClip && videoClips.length === 0) {
      // Create a virtual clip from the URL
      const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For preloaded clips, we create a clip object with the URL directly
      const virtualClip: VideoClip = {
        id: clipId,
        file: null as any, // We don't have the actual File object
        preview: preloadedClip.url, // Use the URL directly as preview
        name: preloadedClip.name,
        size: 0 // Unknown size for URL-based clips
      };
      
      setVideoClips([virtualClip]);
    }
  }, [preloadedClip, videoClips.length]);

  // NEW: Handle multiple preloaded clips from Production page
  useEffect(() => {
    if (preloadedClips && preloadedClips.length > 0 && videoClips.length === 0) {
      // Create virtual clips from URLs
      const virtualClips: VideoClip[] = preloadedClips.map((clip, index) => ({
        id: `clip_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        file: null as any,
        preview: clip.url,
        name: clip.name,
        size: 0
      }));
      
      setVideoClips(virtualClips);
    }
  }, [preloadedClips, videoClips.length]);
  
  // NEW: Handle recompose mode from Timeline
  useEffect(() => {
    if (recomposeData && recomposeData.clips && videoClips.length === 0) {
      // Load clips from recompose data
      const virtualClips: VideoClip[] = recomposeData.clips.map((clip: any, index: number) => ({
        id: `clip_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        file: null as any,
        preview: clip.url,
        name: clip.name,
        size: 0
      }));
      
      setVideoClips(virtualClips);
    }
  }, [recomposeData, videoClips.length]);

  // Video file validation
  const validateVideoFile = (file: File): string | null => {
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      return `Invalid video format. Supported: MP4, MOV, WEBM. Your file: ${file.type}`;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `Video too large. Max: ${MAX_VIDEO_SIZE_MB}MB. Your file: ${fileSizeMB}MB`;
    }
    return null;
  };

  // Add video clips
  const handleAddVideos = async (files: FileList | null) => {
    if (!files) return;

    setUploadError(null);
    const newClips: VideoClip[] = [];

    for (const file of Array.from(files)) {
      const error = validateVideoFile(file);
      if (error) {
        setUploadError(error);
        continue;
      }

      try {
        // NEW (Feature 0070): Upload to S3 immediately
        const formData = new FormData();
        formData.append('video', file);
        formData.append('projectId', userId || 'default');
        
        // Show uploading toast
        const uploadToastId = Date.now();
        const { toast } = await import('sonner');
        toast.info(`Uploading ${file.name}...`, { id: uploadToastId.toString() });
        
        const response = await fetch('/api/video/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const preview = URL.createObjectURL(file);

          newClips.push({
            id: clipId,
            file,
            preview,
            s3Url: data.url,       // NEW: Store S3 URL
            s3Key: data.s3Key || extractS3Key(data.url), // NEW: Store S3 key
            size: file.size,
            name: file.name,
          });
          
          // NEW (Feature 0070): Show storage decision modal
          setSelectedAsset({
            url: data.url,
            s3Key: data.s3Key || extractS3Key(data.url),
            name: file.name,
            type: 'video'
          });
          setShowStorageModal(true);
          
          toast.success(`✅ ${file.name} uploaded! Choose where to save it.`, { id: uploadToastId.toString() });
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } catch (error) {
        console.error('[CompositionStudio] Upload failed:', error);
        const { toast } = await import('sonner');
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setVideoClips((prev) => [...prev, ...newClips]);
  };

  // Remove video clip
  const handleRemoveClip = (clipId: string) => {
    const clip = videoClips.find((c) => c.id === clipId);
    if (clip && clip.preview.startsWith('blob:')) {
      URL.revokeObjectURL(clip.preview);
    }
    setVideoClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleAddVideos(e.dataTransfer.files);
  };

  const handleCompose = async () => {
    if (videoClips.length === 0) {
      setUploadError('Please add at least one video clip');
      return;
    }

    setIsComposing(true);
    setProgress(0);
    setCompositionResult(null);

    try {
      // Get auth token from Amplify (proper method)
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      // Determine composition type
      let compType: 'static-layout' | 'animated' | 'paced-sequence';
      if (compositionType === 'static') compType = 'static-layout';
      else if (compositionType === 'animated') compType = 'animated';
      else compType = 'paced-sequence';

      // NEW (Feature 0070): Use S3 URLs instead of uploading files
      const videoUrls: string[] = videoClips.map(clip => clip.s3Url || clip.preview);
      
      // Create request body with URLs
      const requestBody: any = {
        composition_type: compType,
        video_urls: videoUrls,
      };
      
      if (selectedLayout) requestBody.layout_id = selectedLayout;
      if (selectedPacing) requestBody.pacing_id = selectedPacing;
      if (selectedAnimation) requestBody.animation_id = selectedAnimation;
      if (backgroundMusic) {
        requestBody.background_music_url = backgroundMusic.audioUrl;
        requestBody.music_volume = musicVolume;
      }

      const response = await fetch(`${apiUrl}/api/composition/compose`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Composition failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setCompositionResult({
        job_id: data.job_id,
        status: data.status,
        output_video_url: data.output_video_url,
      });

      // Poll for status
      if (data.job_id && token) {
        pollCompositionStatus(data.job_id, token, apiUrl);
      }

      setRecentCompositions((prev) => prev + 1);

    } catch (error: any) {
      console.error('[Composition] Error:', error);
      setUploadError(error.message || 'Failed to compose video');
      setIsComposing(false);
    }
  };

  // Poll composition status
  const pollCompositionStatus = async (jobId: string, token: string, apiUrl: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/api/composition/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();
        
        // Update progress
        if (data.progress) {
          setProgress(data.progress);
        }

        if (data.status === 'completed') {
          clearInterval(interval);
          setIsComposing(false);
          setProgress(100);
          
          // NEW: Handle recompose mode - return to timeline
          if (recomposeData && data.output_video_url) {
            const replacementData = {
              composedUrl: data.output_video_url,
              originalClips: recomposeData.clips,
              action: 'replace',
              projectId: recomposeData.projectId
            };
            
            const encoded = encodeURIComponent(JSON.stringify(replacementData));
            window.location.href = `/app/timeline?replaceClips=${encoded}`;
            return;
          }
          
          // NEW (Feature 0066): Show storage modal for completed composition
          if (data.output_video_url) {
            setSelectedAsset({
              url: data.output_video_url,
              s3Key: extractS3Key(data.output_video_url),
              name: `composition_${Date.now()}.mp4`,
              type: 'composition'
            });
            setShowStorageModal(true);
          }
          
          setCompositionResult((prev) => prev ? {
            ...prev,
            status: 'completed',
            output_video_url: data.output_video_url,
          } : null);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsComposing(false);
          setUploadError(data.error_message || 'Composition failed');
        }

      } catch (error) {
        console.error('[Composition] Status poll error:', error);
        clearInterval(interval);
        setIsComposing(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const canCompose = () => {
    if (videoClips.length === 0) return false;
    if (compositionType === 'static' && selectedLayout) return true;
    if (compositionType === 'animated' && selectedAnimation) return true;
    if (compositionType === 'paced' && selectedPacing) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#141414] p-6">
      {/* Refined Clapboard Header */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* Film Slate Style Header */}
        <div className="relative bg-[#141414] rounded-xl shadow-2xl overflow-hidden border-2 border-white/10">
          {/* Clapboard Stripes - More refined */}
          <div className="h-12 flex shadow-inner">
            <div className="flex-1 bg-[#DC143C]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#DC143C]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#DC143C]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#DC143C]"></div>
            <div className="flex-1 bg-white"></div>
          </div>
          
          {/* Main Slate Content - Cleaner spacing */}
          <div className="p-8 bg-gradient-to-b from-[#1F1F1F] to-[#141414]">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-400 rounded-lg">
                    <Film className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-base-content tracking-tight">
                      Composition Studio
                    </h1>
                    <p className="text-sm text-[#B3B3B3]">
                      Professional video compositing
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#1F1F1F] rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-[#B3B3B3] mb-1">Director</div>
                    <div className="font-semibold text-base-content text-sm">AI Director</div>
                  </div>
                  <div className="bg-[#1F1F1F] rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-[#B3B3B3] mb-1">Scene</div>
                    <div className="font-semibold text-base-content text-sm">Multi-Video</div>
                  </div>
                  <div className="bg-[#1F1F1F] rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-[#B3B3B3] mb-1">Take</div>
                    <div className="font-semibold text-base-content text-sm">#{recentCompositions + 1}</div>
                  </div>
                  <div className="bg-[#1F1F1F] rounded-lg p-3 border border-white/10">
                    <div className="text-xs text-[#B3B3B3] mb-1">Date</div>
                    <div className="font-semibold text-base-content text-sm">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              
              {recentCompositions > 0 && (
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-lg shadow-lg border-2 border-yellow-600">
                  <div className="text-xs opacity-70 mb-1">Current</div>
                  <div>TAKE {recentCompositions}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* NEW: Recompose Mode Card */}
      {recomposeData && (
        <div className="max-w-7xl mx-auto mb-6">
          <Card className="bg-[#00D9FF]/10 border-2 border-[#00D9FF]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-[#00D9FF]" />
                  <div>
                    <CardTitle className="text-base-content">
                      Re-compose Mode
                    </CardTitle>
                    <CardDescription>
                      Apply new composition to {recomposeData.clips.length} clips from Timeline
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[#00D9FF] border-[#00D9FF]">
                  Timeline Project
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {recomposeData.clips.map((clip: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 bg-[#141414] rounded">
                    <Film className="w-4 h-4 text-[#00D9FF]" />
                    <span className="flex-1">{clip.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Track {clip.trackIndex + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      @{clip.position.toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm border border-blue-200 dark:border-blue-900">
                <span className="text-2xl">💡</span>
                <div className="flex-1 text-blue-700 dark:text-blue-400">
                  <strong>Workflow:</strong> Select layout → Apply effects → Compose
                  → Original clips will be replaced automatically in Timeline
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#141414] p-1 rounded-lg shadow-md border border-white/10">
            <TabsTrigger 
              value="create" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-lg font-semibold transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Production
            </TabsTrigger>
            <TabsTrigger 
              value="music" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-lg font-semibold transition-all"
            >
              <Music className="w-4 h-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-lg font-semibold transition-all"
            >
              <History className="w-4 h-4 mr-2" />
              Dailies
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="mt-6">
            {/* Mobile Banner - Feature 0068 */}
            {isMobileView && (
              <div className="mb-6">
                <MobileCompositionBanner />
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Configuration */}
              <div className="lg:col-span-2 space-y-6">
                {/* Composition Type Selector - Refined */}
                <Card className="bg-[#141414] border border-white/10 shadow-lg">
                  <CardHeader className="border-b border-white/10 bg-[#1F1F1F]">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <div className="p-1.5 bg-yellow-400 rounded">
                        <Settings className="w-4 h-4 text-black" />
                      </div>
                      Shot Type
                    </CardTitle>
                    <CardDescription>
                      Choose your composition style
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      <Button
                        variant="outline"
                        className={`h-28 flex flex-col gap-2 border-2 transition-all ${
                          compositionType === 'static' 
                            ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500 shadow-lg' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-yellow-400'
                        }`}
                        onClick={() => setCompositionType('static')}
                      >
                        <Film className="w-7 h-7" />
                        <div className="text-center">
                          <div className="font-bold text-base">Static</div>
                          <div className="text-xs opacity-70">Multi-panel layouts</div>
                        </div>
                      </Button>
                      {/* Hide Animated & Paced on mobile - Feature 0068 */}
                      {!isMobileView && (
                        <>
                          <Button
                            variant="outline"
                            className={`h-28 flex flex-col gap-2 border-2 transition-all ${
                              compositionType === 'animated' 
                                ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500 shadow-lg' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-yellow-400'
                            }`}
                            onClick={() => setCompositionType('animated')}
                          >
                            <Sparkles className="w-7 h-7" />
                            <div className="text-center">
                              <div className="font-bold text-base">Animated</div>
                              <div className="text-xs opacity-70">Motion graphics</div>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className={`h-28 flex flex-col gap-2 border-2 transition-all ${
                              compositionType === 'paced' 
                                ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500 shadow-lg' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-yellow-400'
                            }`}
                            onClick={() => setCompositionType('paced')}
                          >
                            <Clock className="w-7 h-7" />
                            <div className="text-center">
                              <div className="font-bold text-base">Paced</div>
                              <div className="text-xs opacity-70">Emotional timing</div>
                            </div>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* NEW: Video Upload Zone */}
                <Card className="bg-[#141414] border border-white/10 shadow-lg">
                  <CardHeader className="border-b border-white/10 bg-[#1F1F1F]">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <div className="p-1.5 bg-yellow-400 rounded">
                        <Video className="w-4 h-4 text-black" />
                      </div>
                      Video Clips
                    </CardTitle>
                    <CardDescription>
                      Upload videos to compose ({videoClips.length} clip{videoClips.length !== 1 ? 's' : ''} added)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                        ${isDragging
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-yellow-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        multiple
                        onChange={(e) => handleAddVideos(e.target.files)}
                        className="hidden"
                      />
                      <Upload className="w-12 h-12 mx-auto mb-4 text-[#B3B3B3]" />
                      <p className="text-sm font-medium text-base-content mb-1">
                        Drag & drop videos here
                      </p>
                      <p className="text-xs text-[#B3B3B3]">
                        or click to browse · MP4, MOV, WEBM · Max {MAX_VIDEO_SIZE_MB}MB each
                      </p>
                    </div>

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                      </div>
                    )}

                    {/* Video Clips List */}
                    {videoClips.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-[#B3B3B3]">
                            Timeline ({videoClips.length} clips)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVideoClips([])}
                            className="text-xs h-7"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {videoClips.map((clip, index) => (
                            <div
                              key={clip.id}
                              className="relative group bg-[#1F1F1F] rounded-lg overflow-hidden border border-white/10"
                            >
                              {/* Video Preview */}
                              <video
                                src={clip.preview}
                                className="w-full h-24 object-cover"
                              />
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveClip(clip.id)}
                                  className="gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Remove
                                </Button>
                              </div>

                              {/* Clip Info */}
                              <div className="absolute top-2 left-2 bg-base-300/90 px-2 py-1 rounded text-xs text-base-content font-medium">
                                #{index + 1}
                              </div>
                              <div className="p-2 bg-[#0A0A0A]">
                                <p className="text-xs font-medium text-white truncate">
                                  {clip.name}
                                </p>
                                <p className="text-xs text-[#B3B3B3]">
                                  {(clip.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dynamic Selector based on type */}
                {compositionType === 'static' && (
                  <LayoutSelector
                    selectedLayout={selectedLayout}
                    onSelectLayout={setSelectedLayout}
                    isMobile={isMobileView}
                  />
                )}

                {compositionType === 'animated' && (
                  <AnimationSelector
                    selectedAnimation={selectedAnimation}
                    onSelectAnimation={setSelectedAnimation}
                  />
                )}

                {compositionType === 'paced' && (
                  <PacingSelector
                    selectedPacing={selectedPacing}
                    onSelectPacing={setSelectedPacing}
                  />
                )}

                {/* Action Button - Refined Clapboard */}
                <Card className="bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-2xl">
                  <CardContent className="pt-6">
                    <Button
                      size="lg"
                      className={`w-full h-20 text-xl font-bold shadow-lg transition-all ${
                        canCompose() && !isComposing
                          ? 'bg-black text-yellow-400 hover:bg-slate-900 border-2 border-yellow-400'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed border-2 border-slate-400'
                      }`}
                      disabled={isComposing || !canCompose()}
                      onClick={handleCompose}
                    >
                      {isComposing ? (
                        <>
                          <Clock className="w-6 h-6 mr-3 animate-spin" />
                          Rendering... {progress}%
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Play className="w-6 h-6" />
                            <span>{recomposeData ? '🔄 Return to Timeline' : '🎬 ACTION!'}</span>
                          </div>
                        </>
                      )}
                    </Button>

                    {isComposing && (
                      <div className="mt-4 space-y-2 bg-black/20 rounded-lg p-3">
                        <Progress value={progress} className="h-2" />
                        <p className="text-center text-sm text-black font-medium">
                          Processing Take {recentCompositions + 1}...
                        </p>
                      </div>
                    )}

                    {!canCompose() && !isComposing && (
                      <p className="text-center text-sm text-black/70 mt-3 font-medium">
                        {videoClips.length === 0
                          ? 'Upload videos to begin'
                          : `Select a ${compositionType} option above to continue`
                        }
                      </p>
                    )}

                    {/* Composition Result */}
                    {compositionResult && compositionResult.status === 'completed' && compositionResult.output_video_url && (
                      <div className="mt-4 space-y-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-green-700 dark:text-green-300">
                              Composition Complete!
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => window.open(compositionResult.output_video_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                        <video
                          src={compositionResult.output_video_url}
                          controls
                          className="w-full rounded-lg border-2 border-green-500"
                          style={{ maxHeight: '200px' }}
                        />
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Job ID: {compositionResult.job_id}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Preview & Info */}
              <div className="space-y-6">
                <CompositionPreview
                  layout={selectedLayout}
                  animation={selectedAnimation}
                  pacing={selectedPacing}
                  type={compositionType}
                />

                {/* Production Guide - Clean & Readable */}
                <Card className="bg-[#141414] border border-white/10 shadow-md">
                  <CardHeader className="border-b border-white/10 bg-[#1F1F1F]">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="text-yellow-600">📋</span>
                      Production Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ol className="text-sm text-white space-y-2.5">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Select your shot type above</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Choose layout or pacing style</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Preview your composition</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Hit &quot;Action!&quot; to render</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Director's Tips - Yellow Accent */}
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-300 dark:border-yellow-700 shadow-md">
                  <CardHeader className="border-b-2 border-yellow-300 dark:border-yellow-700">
                    <CardTitle className="text-sm flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                      <span>🎬</span>
                      Director&apos;s Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="text-sm text-yellow-900 dark:text-yellow-100 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400">•</span>
                        <span>Use 9:16 aspect ratio for phone call layouts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400">•</span>
                        <span>Fast pacing (3s) creates urgency and tension</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400">•</span>
                        <span>Slow holds (8s) allow emotional depth</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400">•</span>
                        <span>Motion effects add dynamic visual impact</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Music Generator */}
              {showMusicGenerator ? (
                <div className="lg:col-span-2">
                  <MusicGenerator
                    onMusicGenerated={(audioUrl, metadata) => {
                      // Add to background music selection
                      const musicTrack: MusicTrack = {
                        audioUrl,
                        s3Key: metadata.s3Key || '',
                        taskId: metadata.taskId,
                        title: metadata.title,
                        tags: metadata.tags,
                        duration_seconds: metadata.duration,
                        model: metadata.model,
                        creditsUsed: metadata.creditsUsed,
                        has_vocals: metadata.has_vocals !== false,
                        generatedAt: new Date().toISOString(),
                      };
                      
                      setBackgroundMusic(musicTrack);
                      setShowMusicGenerator(false);
                    }}
                    showLibraryButton={false}
                  />
                </div>
              ) : (
                <>
                  {/* Music Library or Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Background Music
                      </CardTitle>
                      <CardDescription>
                        Add AI-generated music to your video composition
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {backgroundMusic ? (
                        <>
                          <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold mb-2">
                              {backgroundMusic.title || 'Selected Track'}
                            </h3>
                            <audio
                              controls
                              src={backgroundMusic.audioUrl}
                              className="w-full"
                            />
                            <div className="mt-2 text-sm text-muted-foreground">
                              {backgroundMusic.tags && <p>{backgroundMusic.tags}</p>}
                              <p>Model: {backgroundMusic.model}</p>
                            </div>
                          </div>
                          
                          {/* Volume Control */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Music Volume</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={musicVolume}
                              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Volume: {Math.round(musicVolume * 100)}%
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setBackgroundMusic(null)}
                          >
                            Remove Music
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground mb-4">
                            No music selected
                          </p>
                          <Button onClick={() => setShowMusicGenerator(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Music
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💡 Music Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium mb-1">Match the Mood</p>
                        <p className="text-muted-foreground">
                          Generate music that matches your video&apos;s emotional tone
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Instrumental Works Best</p>
                        <p className="text-muted-foreground">
                          Instrumental tracks won&apos;t compete with dialogue
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Adjust Volume</p>
                        <p className="text-muted-foreground">
                          Keep music at 30-50% for background ambience
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Royalty-Free</p>
                        <p className="text-muted-foreground">
                          All generated music is watermark-free and commercial-ready
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-6">
            <CompositionGallery userId={userId} />
          </TabsContent>
        </Tabs>
        
        {/* Storage Decision Modal (Feature 0066) */}
        {showStorageModal && selectedAsset && (
          <StorageDecisionModal
            isOpen={showStorageModal}
            onClose={() => {
              setShowStorageModal(false);
              setSelectedAsset(null);
            }}
            assetType={selectedAsset.type}
            assetName={selectedAsset.name}
            s3TempUrl={selectedAsset.url}
            s3Key={selectedAsset.s3Key}
            fileSize={undefined}
            metadata={{}}
          />
        )}
      </div>
    </div>
  );
}
