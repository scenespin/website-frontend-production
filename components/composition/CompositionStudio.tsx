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
  Music,
  Info,
  AlertTriangle,
  Users,
  Smartphone
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
import { useEditorContext, useContextStore } from '@/lib/contextStore';  // Contextual navigation

// Video file validation
const MAX_VIDEO_SIZE_GB = 50;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_GB * 1024 * 1024 * 1024;
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
  // Contextual navigation - Get current scene context from editor
  const editorContext = useEditorContext();
  
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [selectedPacing, setSelectedPacing] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [compositionType, setCompositionType] = useState<'static' | 'animated' | 'paced' | 'music-video' | 'podcast' | 'social-media'>('static');
  const [musicVideoStyle, setMusicVideoStyle] = useState<'on-beat' | 'every-2-beats' | 'every-4-beats' | 'on-bars'>('on-beat');
  const [socialMediaFormat, setSocialMediaFormat] = useState<'vertical-9-16' | 'square-1-1' | 'vertical-4-5'>('vertical-9-16');
  const [beatAnalysis, setBeatAnalysis] = useState<any>(null);
  const [isAnalyzingBeats, setIsAnalyzingBeats] = useState(false);
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
      const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
      return `Video too large. Max: ${MAX_VIDEO_SIZE_GB}GB. Your file: ${fileSizeGB}GB`;
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
        // PROFESSIONAL UPLOAD: Direct to S3 using pre-signed URL
        const uploadToastId = Date.now();
        const { toast } = await import('sonner');
        toast.info(`Uploading ${file.name}...`, { id: uploadToastId.toString() });
        
        // Step 1: Get pre-signed URL from backend
        const presignedResponse = await fetch(
          `/api/video/upload/get-presigned-url?` + 
          `fileName=${encodeURIComponent(file.name)}` +
          `&fileType=${encodeURIComponent(file.type)}` +
          `&fileSize=${file.size}` +
          `&projectId=${encodeURIComponent(userId || 'default')}`
        );
        
        if (!presignedResponse.ok) {
          if (presignedResponse.status === 413) {
            throw new Error('File too large. Maximum size is 50GB.');
          } else if (presignedResponse.status === 401) {
            throw new Error('Please sign in to upload videos.');
          } else {
            const errorData = await presignedResponse.json();
            throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
          }
        }
        
        const { uploadUrl, s3Key } = await presignedResponse.json();
        
        if (!uploadUrl || !s3Key) {
          throw new Error('Invalid response from server');
        }
        
        toast.info(`Uploading ${file.name} to S3...`, { id: uploadToastId.toString() });
        
        // Step 2: Upload directly to S3 (bypasses Next.js entirely!)
        const s3Response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });
        
        if (!s3Response.ok) {
          throw new Error(`S3 upload failed: ${s3Response.statusText}`);
        }
        
        console.log('[CompositionStudio] File uploaded to S3:', s3Key);
        
        // Step 3: Generate S3 URL
        const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
        const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
        const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
        
        // Step 4: Add to clips and show storage modal
          const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const preview = URL.createObjectURL(file);

          newClips.push({
            id: clipId,
            file,
            preview,
          s3Url: s3Url,
          s3Key: s3Key,
            size: file.size,
            name: file.name,
          });
          
        // Show storage decision modal
          setSelectedAsset({
          url: s3Url,
          s3Key: s3Key,
            name: file.name,
            type: 'video'
          });
          setShowStorageModal(true);
          
          toast.success(`✅ ${file.name} uploaded! Choose where to save it.`, { id: uploadToastId.toString() });
        
      } catch (error: any) {
        console.error('[CompositionStudio] Upload failed:', error);
        const { toast } = await import('sonner');
        const errorMessage = error?.message || `Failed to upload ${file.name}`;
        toast.error(errorMessage);
        setUploadError(errorMessage);
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
      let compType: 'static-layout' | 'animated' | 'paced-sequence' | 'music-video' | 'podcast' | 'social-media';
      if (compositionType === 'static') compType = 'static-layout';
      else if (compositionType === 'animated') compType = 'animated';
      else if (compositionType === 'music-video') compType = 'music-video';
      else if (compositionType === 'podcast') compType = 'podcast';
      else if (compositionType === 'social-media') compType = 'social-media';
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
      // NEW: Music video beat analysis data
      if (compositionType === 'music-video' && beatAnalysis) {
        requestBody.beat_analysis = beatAnalysis;
        requestBody.music_video_style = musicVideoStyle;
      }
      // NEW: Social media format
      if (compositionType === 'social-media') {
        requestBody.social_media_format = socialMediaFormat;
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
    if (compositionType === 'music-video' && backgroundMusic && beatAnalysis) return true;
    if (compositionType === 'podcast') return true; // No selection needed, simple side-by-side
    if (compositionType === 'social-media') return true; // Format selected, ready to go
    return false;
  };

  /**
   * Calculate render cost based on composition type and video count
   * Matches backend pricing in provider-costs.ts
   */
  const calculateRenderCost = (): number => {
    const numVideos = videoClips.length;
    
    // Podcast/Interview compositions - Side-by-side
    if (compositionType === 'podcast') {
      if (numVideos === 2) return 10;
      if (numVideos === 3) return 15;
      if (numVideos <= 6) return 20;
      if (numVideos <= 12) return 30;
      return 30 + Math.ceil((numVideos - 12) / 6) * 15;
    }
    
    // Social Media compositions - Vertical/square
    if (compositionType === 'social-media') {
      if (numVideos <= 3) return 10;
      if (numVideos <= 6) return 15;
      if (numVideos <= 12) return 25;
      if (numVideos <= 25) return 40;
      if (numVideos <= 50) return 65;
      return 65 + Math.ceil((numVideos - 50) / 25) * 20;
    }
    
    // Music video compositions - Beat-synced (includes beat analysis cost)
    if (compositionType === 'music-video') {
      if (numVideos <= 4) return 20;
      if (numVideos <= 10) return 30;
      if (numVideos <= 20) return 45;
      if (numVideos <= 50) return 80;
      if (numVideos <= 100) return 130;
      if (numVideos <= 200) return 230;
      return 230 + Math.ceil((numVideos - 200) / 50) * 40;
    }
    
    // Animated compositions - Most complex
    if (compositionType === 'animated') {
      if (numVideos <= 4) return 30;
      if (numVideos <= 10) return 50;
      if (numVideos <= 20) return 75;
      if (numVideos <= 50) return 125;
      if (numVideos <= 100) return 200;
      if (numVideos <= 200) return 350;
      return 350 + Math.ceil((numVideos - 200) / 50) * 50;
    }
    
    // Paced sequences - Medium complexity
    if (compositionType === 'paced') {
      if (numVideos <= 4) return 15;
      if (numVideos <= 10) return 25;
      if (numVideos <= 20) return 40;
      if (numVideos <= 50) return 75;
      if (numVideos <= 100) return 125;
      if (numVideos <= 200) return 225;
      return 225 + Math.ceil((numVideos - 200) / 50) * 40;
    }
    
    // Static layouts - Simplest
    if (compositionType === 'static') {
      if (numVideos === 2) return 10;
      if (numVideos === 3) return 15;
      if (numVideos <= 6) return 20;
      if (numVideos <= 12) return 30;
      if (numVideos <= 25) return 50;
      if (numVideos <= 50) return 75;
      if (numVideos <= 100) return 125;
      if (numVideos <= 200) return 200;
      return 200 + Math.ceil((numVideos - 200) / 50) * 25;
    }
    
    // Default fallback
    return 15;
  };

  /**
   * Estimate processing time based on video count and composition type
   * More videos = longer processing time (linear scaling)
   */
  const estimateProcessingTime = (): string => {
    const numVideos = videoClips.length;
    
    // Podcast compositions - fast (simple side-by-side)
    if (compositionType === 'podcast') {
      if (numVideos <= 3) return '20-40 seconds';
      if (numVideos <= 6) return '40-60 seconds';
      if (numVideos <= 12) return '1-2 minutes';
      return `${Math.ceil(numVideos / 8)}-${Math.ceil(numVideos / 6)} minutes`;
    }
    
    // Social Media compositions - fast (vertical/square cuts)
    if (compositionType === 'social-media') {
      if (numVideos <= 6) return '30-60 seconds';
      if (numVideos <= 12) return '1-2 minutes';
      if (numVideos <= 25) return '2-4 minutes';
      if (numVideos <= 50) return '4-8 minutes';
      return `${Math.ceil(numVideos / 10)}-${Math.ceil(numVideos / 7)} minutes`;
    }
    
    // Music video compositions - medium processing time (+ beat analysis)
    if (compositionType === 'music-video') {
      if (numVideos <= 4) return '1-2 minutes';
      if (numVideos <= 10) return '2-3 minutes';
      if (numVideos <= 25) return '4-7 minutes';
      if (numVideos <= 50) return '7-13 minutes';
      if (numVideos <= 100) return '13-26 minutes';
      if (numVideos <= 200) return '26-46 minutes';
      return `${Math.ceil(numVideos / 6)}-${Math.ceil(numVideos / 4)} minutes`;
    }
    
    // Animated compositions take longer (keyframes, effects, transitions)
    if (compositionType === 'animated') {
      if (numVideos <= 4) return '1-2 minutes';
      if (numVideos <= 10) return '2-4 minutes';
      if (numVideos <= 25) return '5-10 minutes';
      if (numVideos <= 50) return '10-20 minutes';
      if (numVideos <= 100) return '20-35 minutes';
      if (numVideos <= 200) return '35-60 minutes';
      return `${Math.ceil(numVideos / 5)}-${Math.ceil(numVideos / 3)} minutes`;
    }
    
    // Paced sequences - medium processing time
    if (compositionType === 'paced') {
      if (numVideos <= 4) return '30s-1 minute';
      if (numVideos <= 10) return '1-2 minutes';
      if (numVideos <= 25) return '3-6 minutes';
      if (numVideos <= 50) return '6-12 minutes';
      if (numVideos <= 100) return '12-25 minutes';
      if (numVideos <= 200) return '25-45 minutes';
      return `${Math.ceil(numVideos / 6)}-${Math.ceil(numVideos / 4)} minutes`;
    }
    
    // Static layouts - fastest (just concatenation)
    if (numVideos <= 4) return '20-40 seconds';
    if (numVideos <= 10) return '40s-1.5 minutes';
    if (numVideos <= 25) return '2-4 minutes';
    if (numVideos <= 50) return '4-8 minutes';
    if (numVideos <= 100) return '8-15 minutes';
    if (numVideos <= 200) return '15-30 minutes';
    return `${Math.ceil(numVideos / 8)}-${Math.ceil(numVideos / 5)} minutes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#141414] p-3">
      {/* Context Indicator Banner */}
      {editorContext.currentSceneName && (
        <div className="max-w-7xl mx-auto mb-3 bg-[#DC143C]/10 border border-[#DC143C]/20 rounded px-3 py-1.5">
          <div className="text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Film className="w-3 h-3 text-[#DC143C] flex-shrink-0" />
              <span className="opacity-70">Composing scene:</span>
              <span className="font-semibold text-[#DC143C] truncate">{editorContext.currentSceneName}</span>
              {editorContext.currentBeatName && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="opacity-70">Beat:</span>
                  <span className="font-semibold truncate">{editorContext.currentBeatName}</span>
                </>
              )}
            </div>
            <button
              onClick={() => {
                const { clearContext } = useContextStore.getState();
                clearContext();
              }}
              className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0 transition-colors"
              title="Clear context"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      
      {/* Compact Breadcrumb Header */}
      <div className="max-w-7xl mx-auto mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
          <Film className="w-3 h-3 text-[#DC143C]" />
          <span className="text-white font-semibold text-sm">Composition Studio</span>
          <span className="text-gray-600">•</span>
          <span>Multi-Video</span>
          <span className="text-gray-600">•</span>
          <span>Take #{recentCompositions + 1}</span>
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
              
              <div className="flex items-center gap-2 p-3 bg-[#DC143C]/10 border border-[#DC143C]/20 rounded-lg text-sm">
                <span className="text-2xl">💡</span>
                <div className="flex-1 text-[#DC143C]">
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
              className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Production
            </TabsTrigger>
            <TabsTrigger 
              value="music" 
              className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all"
            >
              <Music className="w-4 h-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all"
            >
              <History className="w-4 h-4 mr-2" />
              Dailies
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="mt-3">
            {/* Mobile Banner - Feature 0068 */}
            {isMobileView && (
              <div className="mb-4">
                <MobileCompositionBanner />
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
              {/* Left: Configuration */}
              <div className="lg:col-span-2 space-y-2">
                {/* Composition Type Selector - Refined */}
                <Card className="bg-[#141414] border border-white/10 shadow-lg">
                  <CardHeader className="border-b border-white/10 bg-[#1F1F1F] p-2 pb-2">
                    <CardTitle className="flex items-center gap-2 text-slate-200 text-xs">
                      <div className="p-0.5 bg-[#DC143C] rounded">
                        <Settings className="w-3 h-3 text-white" />
                      </div>
                      Shot Type
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Choose your composition style
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-1.5 pb-1.5">
                    {/* Mobile: Dropdown Select */}
                    {isMobileView ? (
                      <select
                        value={compositionType}
                        onChange={(e) => setCompositionType(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-800 text-slate-200 border-2 border-slate-700 rounded-lg focus:border-[#DC143C] focus:outline-none transition-colors"
                      >
                        <option value="static">🎬 Static - Multi-panel layout</option>
                        <option value="podcast">🎙️ Podcast - Interview format</option>
                        <option value="social-media">📱 Social - Vertical video</option>
                        <option value="animated">⚡ Animated - Motion effects</option>
                        <option value="paced">⏱ Paced - Emotional timing</option>
                        <option value="music-video">🎵 Music Video - Beat-synced</option>
                      </select>
                    ) : (
                      /* Desktop: Button Grid */
                      <div className="grid gap-1.5 grid-cols-3">
                        <Button
                          variant="outline"
                          className={`h-12 flex flex-col gap-0.5 border-2 transition-all ${
                            compositionType === 'static' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030] shadow-lg' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-[#DC143C] hover:bg-slate-700'
                          }`}
                          onClick={() => setCompositionType('static')}
                        >
                          <Film className="w-4 h-4" />
                          <div className="text-center">
                            <div className="font-bold text-[10px]">Static</div>
                            <div className="text-[9px] opacity-70">Multi-panel</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className={`h-12 flex flex-col gap-0.5 border-2 transition-all ${
                            compositionType === 'podcast' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030] shadow-lg' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-[#DC143C] hover:bg-slate-700'
                          }`}
                          onClick={() => setCompositionType('podcast')}
                        >
                          <Users className="w-4 h-4" />
                          <div className="text-center">
                            <div className="font-bold text-[10px]">🎙️ Podcast</div>
                            <div className="text-[9px] opacity-70">Interview</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className={`h-12 flex flex-col gap-0.5 border-2 transition-all ${
                            compositionType === 'social-media' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030] shadow-lg' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-[#DC143C] hover:bg-slate-700'
                          }`}
                          onClick={() => setCompositionType('social-media')}
                        >
                          <Smartphone className="w-4 h-4" />
                          <div className="text-center">
                            <div className="font-bold text-[10px]">📱 Social</div>
                            <div className="text-[9px] opacity-70">Vertical</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className={`h-12 flex flex-col gap-0.5 border-2 transition-all ${
                            compositionType === 'animated' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030] shadow-lg' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-[#DC143C] hover:bg-slate-700'
                          }`}
                          onClick={() => setCompositionType('animated')}
                        >
                          <Sparkles className="w-4 h-4" />
                          <div className="text-center">
                            <div className="font-bold text-[10px]">⚡ Animated</div>
                            <div className="text-[9px] opacity-70">Motion</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className={`h-12 flex flex-col gap-0.5 border-2 transition-all ${
                            compositionType === 'paced' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030] shadow-lg' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-[#DC143C] hover:bg-slate-700'
                          }`}
                          onClick={() => setCompositionType('paced')}
                        >
                          <Clock className="w-4 h-4" />
                          <div className="text-center">
                            <div className="font-bold text-[10px]">⏱ Paced</div>
                            <div className="text-[9px] opacity-70">Timing</div>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className={`h-12 flex flex-col gap-0.5 border-2 transition-all ${
                            compositionType === 'music-video' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B01030] shadow-lg' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-[#DC143C] hover:bg-slate-700'
                          }`}
                          onClick={() => setCompositionType('music-video')}
                        >
                          <Music className="w-4 h-4" />
                          <div className="text-center">
                            <div className="font-bold text-[10px]">🎵 Music</div>
                            <div className="text-[9px] opacity-70">Beat-sync</div>
                          </div>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* NEW: Video Upload Zone */}
                <Card className="bg-[#141414] border border-white/10 shadow-lg">
                  <CardHeader className="border-b border-white/10 bg-[#1F1F1F] p-2 pb-2">
                    <CardTitle className="flex items-center gap-2 text-slate-200 text-xs">
                      <div className="p-1.5 bg-[#DC143C] rounded">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                      Video Clips
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Upload videos to compose ({videoClips.length} clip{videoClips.length !== 1 ? 's' : ''} added)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 pb-2 space-y-2">
                    {/* Drag & Drop Zone - COMPACT */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                        ${isDragging
                          ? 'border-[#DC143C] bg-[#DC143C]/10'
                          : 'border-slate-600 bg-slate-800/50'
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
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-medium text-slate-300 mb-0.5">
                        Drag & drop videos here
                      </p>
                      <p className="text-xs text-slate-500">
                        or click to browse · MP4, MOV, WEBM · Max {MAX_VIDEO_SIZE_GB}GB each
                      </p>
                    </div>

                    {/* Upload Error */}
                    {uploadError && (
                      <div className="p-2 bg-red-900/20 border border-red-800 rounded-lg">
                        <p className="text-sm text-red-400">{uploadError}</p>
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
                                <p className="text-xs font-medium text-base-content truncate">
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
                    isMobile={isMobileView}
                  />
                )}

                {compositionType === 'paced' && (
                  <PacingSelector
                    selectedPacing={selectedPacing}
                    onSelectPacing={setSelectedPacing}
                    isMobile={isMobileView}
                  />
                )}

                {/* Music Video Selector */}
                {compositionType === 'music-video' && (
                  <Card className="bg-[#141414] border border-white/10 shadow-lg">
                    <CardHeader className="border-b border-white/10 bg-[#1F1F1F] p-2 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base-content text-xs">
                        <div className="p-1.5 bg-[#DC143C] rounded">
                          <Music className="w-4 h-4 text-black" />
                        </div>
                        Music Video Style
                      </CardTitle>
                      <CardDescription>
                        Choose how videos sync to music beats
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {/* Beat Analysis Section */}
                      {backgroundMusic ? (
                        beatAnalysis ? (
                          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Music className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                  ✅ Beat Analysis Complete
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  BPM: {beatAnalysis.bpm.toFixed(1)} • {beatAnalysis.beats.length} beats detected • Duration: {beatAnalysis.duration_seconds.toFixed(1)}s
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 p-4 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Info className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
                              <div className="space-y-2">
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                  Analyze Music First
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Music video mode requires beat analysis (5 credits). This detects BPM, beats, and onsets to sync your videos perfectly with the music.
                                </p>
                                <Button
                                  onClick={async () => {
                                    if (!backgroundMusic) return;
                                    setIsAnalyzingBeats(true);
                                    try {
                                      const { getAuthToken } = await import('@/utils/api');
                                      const token = await getAuthToken();
                                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                                      
                                      const response = await fetch(`${apiUrl}/api/audio/analyze-beats`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ audioUrl: backgroundMusic })
                                      });

                                      if (!response.ok) {
                                        throw new Error('Beat analysis failed');
                                      }

                                      const analysis = await response.json();
                                      setBeatAnalysis(analysis);
                                    } catch (error) {
                                      console.error('Beat analysis error:', error);
                                      alert('Failed to analyze beats. Please try again.');
                                    } finally {
                                      setIsAnalyzingBeats(false);
                                    }
                                  }}
                                  disabled={isAnalyzingBeats}
                                  className="mt-2 bg-[#DC143C] hover:bg-[#B01030] text-white"
                                  size="sm"
                                >
                                  {isAnalyzingBeats ? 'Analyzing...' : '🎵 Analyze Beats (5 credits)'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                                Add Background Music
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Music video mode requires background music. Add music above to enable beat-syncing.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Beat Sync Style Selector */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            musicVideoStyle === 'on-beat' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setMusicVideoStyle('on-beat')}
                          disabled={!beatAnalysis}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">On Every Beat</div>
                            <div className="text-xs opacity-70">Fast cuts (music video style)</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            musicVideoStyle === 'every-2-beats' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setMusicVideoStyle('every-2-beats')}
                          disabled={!beatAnalysis}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">Every 2 Beats</div>
                            <div className="text-xs opacity-70">Medium pace</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            musicVideoStyle === 'every-4-beats' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setMusicVideoStyle('every-4-beats')}
                          disabled={!beatAnalysis}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">Every 4 Beats (Bar)</div>
                            <div className="text-xs opacity-70">Slow, cinematic</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            musicVideoStyle === 'on-bars' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setMusicVideoStyle('on-bars')}
                          disabled={!beatAnalysis}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">On Measures</div>
                            <div className="text-xs opacity-70">Dramatic pacing</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Social Media Format Selector */}
                {compositionType === 'social-media' && (
                  <Card className="bg-[#141414] border border-white/10 shadow-lg">
                    <CardHeader className="border-b border-white/10 bg-[#1F1F1F] p-2 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base-content text-xs">
                        <div className="p-1.5 bg-[#DC143C] rounded">
                          <Smartphone className="w-4 h-4 text-black" />
                        </div>
                        Social Media Format
                      </CardTitle>
                      <CardDescription>
                        Choose aspect ratio for your platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 pb-2">
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            socialMediaFormat === 'vertical-9-16' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setSocialMediaFormat('vertical-9-16')}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">9:16 Vertical</div>
                            <div className="text-xs opacity-70">TikTok, Reels, Shorts</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            socialMediaFormat === 'square-1-1' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setSocialMediaFormat('square-1-1')}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">1:1 Square</div>
                            <div className="text-xs opacity-70">Instagram feed</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className={`h-16 flex flex-col gap-1 border-2 transition-all ${
                            socialMediaFormat === 'vertical-4-5' 
                              ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          onClick={() => setSocialMediaFormat('vertical-4-5')}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm">4:5 Vertical</div>
                            <div className="text-xs opacity-70">Instagram portrait</div>
                          </div>
                        </Button>
                      </div>
                      
                      <div className="mt-3 p-3 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg">
                        <p className="text-xs text-slate-400">
                          💡 <strong>Tip:</strong> Vertical formats work best for mobile-first platforms. Your videos will be automatically formatted and optimized for quick consumption.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Button - Refined Clapboard */}
                <Card className="bg-gradient-to-br from-[#DC143C] to-[#B01030] border-2 border-[#A01020] shadow-2xl">
                  <CardContent className="pt-6">
                    {/* Render Cost Warning */}
                    <div className="bg-white/90 rounded-lg p-3 mb-4 border-2 border-yellow-400">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-slate-800">
                            This render: {calculateRenderCost()} credits (${(calculateRenderCost() / 100).toFixed(2)}) • Est. time: {estimateProcessingTime()}
                          </p>
                          <p className="text-slate-600">
                            Processing runs in background—you can close this tab and check back later. Cost scales with video count. All renders saved for 7 days.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className={`w-full h-20 text-xl font-bold shadow-lg transition-all ${
                        canCompose() && !isComposing
                          ? 'bg-white text-[#DC143C] hover:bg-slate-100 border-2 border-white'
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
                  <CardHeader className="border-b border-white/10 bg-[#1F1F1F] p-2 pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <span className="text-red-600">📋</span>
                      Production Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ol className="text-sm text-base-content space-y-2.5">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#DC143C] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Select your shot type above</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#DC143C] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Choose layout or pacing style</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#DC143C] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>Preview your composition</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#DC143C] text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span>Hit &quot;Action!&quot; to render</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>

                {/* Director's Tips - Yellow Accent */}
                <Card className="bg-[#141414] border border-[#DC143C]/30 shadow-md">
                  <CardHeader className="border-b-2 border-[#DC143C]/20 p-2 pb-2">
                    <CardTitle className="text-xs flex items-center gap-2 text-[#DC143C]">
                      <span>🎬</span>
                      Director&apos;s Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">•</span>
                        <span>Use 9:16 aspect ratio for phone call layouts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">•</span>
                        <span>Fast pacing (3s) creates urgency and tension</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">•</span>
                        <span>Slow holds (8s) allow emotional depth</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">•</span>
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
                    <CardContent className="space-y-2">
                      {/* Audio Composition Flow Info */}
                      <div className="bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-blue-400">
                              Audio Composition Options:
                            </p>
                            <div className="text-xs space-y-1.5 text-slate-400">
                              <p>
                                <strong className="text-blue-400">Add Now (Permanent Merge):</strong> Music baked into video – best for music videos with beat-matching (15 credits)
                              </p>
                              <p>
                                <strong className="text-blue-400">Add Later in Timeline:</strong> Keep audio/video separate – better for standard scenes where you want to adjust volume or swap tracks
                              </p>
                              <p className="mt-2 italic text-slate-500">
                                💡 For Music Videos: Permanent merge is recommended for precise beat-syncing. For regular scenes: Timeline gives you more flexibility.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
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
                    <CardContent className="space-y-2 text-sm">
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
