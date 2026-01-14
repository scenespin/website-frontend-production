'use client';

/**
 * Video Soundscape Panel - Feature 0194
 * 
 * AI-powered video-to-audio generation:
 * - Upload video
 * - Analyze frames for audio cues
 * - Generate sound effects and background music
 * - Merge audio into video
 * - Download options
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Upload,
  Play,
  Pause,
  Download,
  Music,
  Volume2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Coins,
  FileVideo,
  Zap,
  Clock,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

interface VideoSoundscapePanelProps {
  projectId: string;
  className?: string;
}

interface CreditBreakdown {
  videoDuration: number;
  analysis: number;
  sfx: number;
  music: number;
  sfxAndMusic: number;
  total: number;
  userBalance: number;
  balanceAfterAnalysis: number;
  balanceAfterFull: number;
}

interface AudioCue {
  timestamp: number;
  type: string;
  description: string;
  confidence: number;
}

interface AnalysisResult {
  analysisId: string;
  videoUrl: string;
  videoDuration: number;
  detectedCues: AudioCue[];
  moodProfile: {
    primaryMood: string;
    intensity: number;
    tempo: string;
  };
}

interface GeneratedAudio {
  sfxTracks?: Array<{
    timestamp: number;
    duration: number;
    audioUrl: string;
    description: string;
  }>;
  musicTrack?: {
    audioUrl: string;
    duration: number;
    style: string;
  };
}

type Step = 'upload' | 'choose-method' | 'estimate' | 'analyze' | 'manual-prompt' | 'generate' | 'merge' | 'complete';

export function VideoSoundscapePanel({ projectId, className }: VideoSoundscapePanelProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null); // S3 URL for merging
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [creditBreakdown, setCreditBreakdown] = useState<CreditBreakdown | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [generateSFX, setGenerateSFX] = useState(true);
  const [generateMusic, setGenerateMusic] = useState(true);
  const [musicStyle, setMusicStyle] = useState('cinematic');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [sfxPrompt, setSfxPrompt] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get video duration when file is selected
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        setVideoDuration(duration);
        // Don't revoke URL here - keep it for video preview
        estimateCredits(duration);
      };
      video.src = url;
      
      // Cleanup: revoke blob URL when component unmounts or new file selected
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // Cleanup when videoFile is cleared
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
  }, [videoFile]);

  // Estimate credits
  const estimateCredits = async (duration: number) => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${BACKEND_API_URL}/api/video-soundscape/estimate?videoDuration=${duration}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to estimate credits');

      const breakdown = await response.json();
      setCreditBreakdown(breakdown);
      setStep('choose-method');
    } catch (error: any) {
      toast.error(error.message || 'Failed to estimate credits');
    }
  };

  // Upload video to S3 and get URL
  const uploadVideoToS3 = async (file: File): Promise<string> => {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) throw new Error('Not authenticated');

    // Get presigned upload URL
    const uploadUrlResponse = await fetch(
      `${BACKEND_API_URL}/api/s3/upload-url?fileName=${encodeURIComponent(file.name)}&entityType=scene&entityId=video-soundscape-${Date.now()}&contentType=${file.type}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!uploadUrlResponse.ok) {
      const error = await uploadUrlResponse.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }

    const { url, fields, s3Key } = await uploadUrlResponse.json();

    // Upload file to S3 using presigned POST
    // Note: File must be appended LAST after all fields
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    // Append file last (required for presigned POST)
    formData.append('file', file);

    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload video to S3');
    }

    // Get download URL for the uploaded file
    const downloadUrlResponse = await fetch(
      `${BACKEND_API_URL}/api/s3/download-url`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ s3Key }),
      }
    );

    if (!downloadUrlResponse.ok) {
      throw new Error('Failed to get video URL');
    }

    const { downloadUrl } = await downloadUrlResponse.json();
    return downloadUrl;
  };

  // Poll job status (following useVideoGeneration pattern)
  const pollJobStatus = React.useCallback(async (jobId: string) => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${BACKEND_API_URL}/api/video-soundscape/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Job not found - might have been cleared or server restarted
          console.warn('[VideoSoundscape] Job not found, stopping polling');
          setAnalysisJobId(null);
          setIsLoading(false);
          setLoadingMessage('');
          toast.error('Analysis job was lost. Please try again.');
          return true; // Stop polling
        }
        throw new Error(`Failed to get job status: ${response.statusText}`);
      }

      const data = await response.json();
      const job = data.job;

      // Update progress
      setAnalysisProgress(job.progress || 0);
      setLoadingMessage(job.message || 'Analyzing...');

      // Check if job is complete
      if (job.status === 'completed') {
        setAnalysis(job.result);
        setStep('generate');
        setAnalysisJobId(null);
        setIsLoading(false);
        setLoadingMessage('');
        toast.success('Video analyzed successfully!');
        return true; // Stop polling
      } else if (job.status === 'failed') {
        setAnalysisJobId(null);
        setIsLoading(false);
        setLoadingMessage('');
        toast.error(job.error || 'Analysis failed');
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (error: any) {
      console.error('[VideoSoundscape] Poll error:', error);
      // Don't stop polling on network errors, only on 404
      return false; // Continue polling on error
    }
  }, [getToken]);

  // Polling effect
  useEffect(() => {
    if (!analysisJobId) return;

    let interval: NodeJS.Timeout | null = null;

    const startPolling = async () => {
      // Initial poll
      const shouldStop = await pollJobStatus(analysisJobId!);
      if (shouldStop) return;

      // Continue polling
      interval = setInterval(async () => {
        const stop = await pollJobStatus(analysisJobId!);
        if (stop && interval) {
          clearInterval(interval);
        }
      }, 2000); // Poll every 2 seconds
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analysisJobId, pollJobStatus]);

  // Check for stored analysisId from JobsDrawer navigation
  useEffect(() => {
    const storedAnalysisId = sessionStorage.getItem('videoSoundscape_analysisId');
    if (storedAnalysisId && !analysis) {
      // Load analysis from job
      const loadAnalysisFromJob = async () => {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) return;

          // Find the job with this analysisId
          const jobsResponse = await fetch(`${BACKEND_API_URL}/api/video-soundscape/jobs`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const completedJob = jobsData.jobs?.find((job: any) => 
              job.result?.analysisId === storedAnalysisId && job.status === 'completed'
            );

            if (completedJob?.result) {
              setAnalysis(completedJob.result);
              setUploadedVideoUrl(completedJob.result.videoUrl);
              setVideoDuration(completedJob.result.videoDuration);
              setStep('generate');
              sessionStorage.removeItem('videoSoundscape_analysisId');
              toast.success('Analysis loaded from previous job');
            }
          }
        } catch (error) {
          console.error('[VideoSoundscape] Failed to load analysis from job:', error);
          sessionStorage.removeItem('videoSoundscape_analysisId');
        }
      };

      loadAnalysisFromJob();
    }
  }, [analysis, getToken]);

  // Analyze video (async job pattern)
  const analyzeVideo = async () => {
    if (!videoFile || !videoDuration) return;

    setIsLoading(true);
    setLoadingMessage('Uploading video...');
    setAnalysisProgress(0);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Upload video to S3
      const uploadedVideoUrl = await uploadVideoToS3(videoFile);
      setUploadedVideoUrl(uploadedVideoUrl); // Store for merge step

      setLoadingMessage('Starting analysis...');

      // Start analysis job (returns jobId immediately)
      const analyzeResponse = await fetch(`${BACKEND_API_URL}/api/video-soundscape/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: uploadedVideoUrl,
          videoDuration, // Send duration to avoid backend download
        }),
      });

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        throw new Error(error.message || 'Analysis failed');
      }

      const result = await analyzeResponse.json();
      setAnalysisJobId(result.jobId);
      // Polling will be handled by useEffect
      toast.success('Analysis started. You can navigate away.');
    } catch (error: any) {
      setIsLoading(false);
      setLoadingMessage('');
      setAnalysisProgress(0);
      toast.error(error.message || 'Failed to start analysis');
    }
  };

  // Generate audio directly without analysis (manual prompt path)
  const generateAudioDirect = async () => {
    if (!videoFile || !videoDuration) return;

    setIsLoading(true);
    setLoadingMessage('Uploading video...');

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Upload video to S3
      const uploadedVideoUrl = await uploadVideoToS3(videoFile);
      setUploadedVideoUrl(uploadedVideoUrl); // Store for merge step

      setLoadingMessage('Generating audio...');

      // Generate audio directly without analysis
      const response = await fetch(`${BACKEND_API_URL}/api/video-soundscape/generate-direct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: uploadedVideoUrl,
          videoDuration,
          generateSFX,
          generateMusic,
          musicStyle,
          musicPrompt: musicPrompt.trim() || undefined,
          sfxPrompt: sfxPrompt.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }

      const result = await response.json();
      setGeneratedAudio(result);
      
      // Create minimal analysis for merge step compatibility
      if (result.analysisId) {
        setAnalysis({
          analysisId: result.analysisId,
          videoUrl: uploadedVideoUrl,
          videoDuration,
          detectedCues: [],
          moodProfile: {
            primaryMood: musicStyle,
            intensity: 5,
            tempo: 'moderate'
          }
        });
      }
      
      setStep('merge');
      toast.success('Audio generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate audio');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Generate audio (with analysis path)
  const generateAudio = async () => {
    if (!analysis) return;

    setIsLoading(true);
    setLoadingMessage('Generating audio...');

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${BACKEND_API_URL}/api/video-soundscape/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: analysis.analysisId,
          generateSFX,
          generateMusic,
          musicStyle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }

      const result = await response.json();
      setGeneratedAudio(result);
      setStep('merge');
      toast.success('Audio generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate audio');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Merge audio into video
  const mergeAudio = async () => {
    if (!analysis || !generatedAudio) return;

    setIsLoading(true);
    setLoadingMessage('Merging audio into video...');

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${BACKEND_API_URL}/api/video-soundscape/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: analysis.analysisId,
          sfxTracks: generatedAudio.sfxTracks || [],
          musicTrack: generatedAudio.musicTrack,
          screenplayId: projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Merge failed');
      }

      const result = await response.json();
      setMergedVideoUrl(result.mergedVideoUrl);
      setStep('complete');
      toast.success('Video with audio ready!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to merge audio');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Download handler
  const handleDownload = (type: 'video' | 'audio' | 'both') => {
    if (type === 'video' && mergedVideoUrl) {
      // Create download link for video
      const link = document.createElement('a');
      link.href = mergedVideoUrl;
      link.download = `soundscape-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === 'audio' && generatedAudio) {
      // Download individual audio files
      if (generatedAudio.sfxTracks) {
        generatedAudio.sfxTracks.forEach((sfx, idx) => {
          const link = document.createElement('a');
          link.href = sfx.audioUrl;
          link.download = `sfx-${idx + 1}-${sfx.timestamp.toFixed(1)}s.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }
      if (generatedAudio.musicTrack) {
        const link = document.createElement('a');
        link.href = generatedAudio.musicTrack.audioUrl;
        link.download = `music-${generatedAudio.musicTrack.style}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (type === 'both') {
      // Download both video and audio
      if (mergedVideoUrl) {
        const link = document.createElement('a');
        link.href = mergedVideoUrl;
        link.download = `soundscape-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      if (generatedAudio) {
        setTimeout(() => {
          if (generatedAudio.sfxTracks) {
            generatedAudio.sfxTracks.forEach((sfx, idx) => {
              const link = document.createElement('a');
              link.href = sfx.audioUrl;
              link.download = `sfx-${idx + 1}-${sfx.timestamp.toFixed(1)}s.mp3`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            });
          }
          if (generatedAudio.musicTrack) {
            const link = document.createElement('a');
            link.href = generatedAudio.musicTrack.audioUrl;
            link.download = `music-${generatedAudio.musicTrack.style}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }, 500);
      }
    }
  };

  // Reset
  const handleReset = () => {
    setStep('upload');
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(null);
    setCreditBreakdown(null);
    setAnalysis(null);
    setGeneratedAudio(null);
    setMergedVideoUrl(null);
    setMusicPrompt('');
    setSfxPrompt('');
    setGenerateSFX(true);
    setGenerateMusic(true);
    setMusicStyle('cinematic');
    setAnalysisJobId(null);
    setAnalysisProgress(0);
    setIsLoading(false);
    setLoadingMessage('');
  };

  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header - Compact */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-white">Video Soundscape</h1>
        <p className="text-gray-400 text-sm">
          AI-powered sound effects and music generation
        </p>
      </div>

      {/* Video Preview - Always at Top, Centered */}
      {(videoUrl || uploadedVideoUrl) && (
        <div className="mb-4 flex justify-center">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '300px', maxWidth: '100%' }}>
            <video
              ref={videoRef}
              src={uploadedVideoUrl || videoUrl || undefined}
              controls
              className="w-full h-full object-contain"
              key={uploadedVideoUrl || videoUrl} // Force re-render when URL changes
            />
            {videoDuration && (
              <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                {videoDuration.toFixed(1)}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar - Below Video, Above Buttons */}
      {isLoading && analysisProgress > 0 && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cinema-red animate-spin" />
              <p className="text-white font-medium text-sm">{loadingMessage}</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Progress</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a video (3 seconds - 5 minutes)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 500 * 1024 * 1024) {
                      toast.error('Video must be under 500MB');
                      return;
                    }
                    setVideoFile(file);
                  }
                }}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <FileVideo className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="text-white font-medium text-sm">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-xs mt-1">MP4, MOV, AVI (max 500MB)</p>
                </div>
              </label>
            </div>
            {videoFile && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-white font-medium text-sm">{videoFile.name}</p>
                    <p className="text-gray-400 text-xs">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setVideoFile(null)} className="h-7 w-7 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose Method - Compact Tabs */}
      {step === 'choose-method' && creditBreakdown && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Choose Method</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-9 text-xs",
                  "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cinema-red/50"
                )}
                onClick={() => setStep('estimate')}
              >
                AI Analysis
                <span className="ml-1 text-gray-400">({creditBreakdown.analysis} cr)</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 h-9 text-xs",
                  "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cinema-red/50"
                )}
                onClick={() => setStep('manual-prompt')}
              >
                Manual Prompts
                <span className="ml-1 text-gray-400">(0 cr)</span>
              </Button>
            </div>
            <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
              <p className="text-yellow-500">Save {creditBreakdown.analysis} credits with manual prompts</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2b: Estimate & Confirm (AI Analysis Path) - Compact */}
      {step === 'estimate' && creditBreakdown && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Credit Estimate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white/5 rounded">
                <p className="text-gray-400 text-xs">Duration</p>
                <p className="text-white text-lg font-bold">
                  {creditBreakdown.videoDuration.toFixed(1)}s
                </p>
              </div>
              <div className="p-2 bg-white/5 rounded">
                <p className="text-gray-400 text-xs">Balance</p>
                <p className="text-white text-lg font-bold">
                  {creditBreakdown.userBalance} cr
                </p>
              </div>
              <div className="p-2 bg-cinema-red/10 rounded border border-cinema-red/50">
                <p className="text-gray-400 text-xs">Total</p>
                <p className="text-cinema-red text-lg font-bold">
                  {creditBreakdown.total} cr
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-gray-300 text-xs">Analysis (2 cr/sec)</span>
                <span className="text-white font-medium text-xs">{creditBreakdown.analysis} cr</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-gray-300 text-xs">SFX (3 cr/sec)</span>
                <span className="text-white font-medium text-xs">{creditBreakdown.sfx} cr</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-gray-300 text-xs">Music (4 cr/sec)</span>
                <span className="text-white font-medium text-xs">{creditBreakdown.music} cr</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-cinema-red/10 rounded border border-cinema-red/50">
                <span className="text-white font-medium text-xs">Full (SFX + Music)</span>
                <span className="text-cinema-red font-bold text-xs">{creditBreakdown.sfxAndMusic} cr</span>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-500 font-medium text-xs">After Analysis: {creditBreakdown.balanceAfterAnalysis} cr</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Need {creditBreakdown.sfxAndMusic} more for full generation
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button - Prominent */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleReset} size="sm" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="flex-1 bg-cinema-red hover:bg-cinema-red/90"
                disabled={creditBreakdown.userBalance < creditBreakdown.analysis}
                size="sm"
              >
                Analyze Video ({creditBreakdown.analysis} cr)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog - Compact */}
      {showConfirmDialog && creditBreakdown && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="bg-[#1A1A1A] border-white/10 max-w-sm w-full mx-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Confirm Analysis</CardTitle>
              <CardDescription className="text-xs">
                Charge {creditBreakdown.analysis} credits
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white/5 rounded">
                  <p className="text-gray-400 text-xs mb-1">Current</p>
                  <p className="text-white text-lg font-bold">{creditBreakdown.userBalance} cr</p>
                </div>
                <div className="p-3 bg-white/5 rounded">
                  <p className="text-gray-400 text-xs mb-1">After</p>
                  <p className="text-white text-lg font-bold">
                    {creditBreakdown.balanceAfterAnalysis} cr
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    analyzeVideo();
                  }}
                  className="flex-1 bg-cinema-red hover:bg-cinema-red/90"
                  size="sm"
                >
                  Confirm & Analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State - Only show if progress bar not already shown above */}
      {isLoading && analysisProgress === 0 && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardContent className="p-4">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-cinema-red animate-spin mx-auto mb-2" />
              <p className="text-white font-medium text-sm">{loadingMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2c: Manual Prompt Entry */}
      {step === 'manual-prompt' && creditBreakdown && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Enter Audio Prompts
            </CardTitle>
            <CardDescription>
              Describe the music and sound effects you want (no analysis needed)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-blue-500 font-medium text-sm">Saving {creditBreakdown.analysis} credits</p>
                  <p className="text-gray-400 text-xs mt-1">
                    You're skipping analysis and going straight to generation. Only pay for audio generation ({creditBreakdown.sfxAndMusic} cr).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateSFX}
                    onChange={(e) => setGenerateSFX(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Generate Sound Effects</span>
                </label>
                {generateSFX && creditBreakdown && (
                  <Badge>{creditBreakdown.sfx} cr</Badge>
                )}
              </div>

              {generateSFX && (
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    <span className="flex items-center gap-2">
                      Sound Effects Description
                      <span className="text-gray-500 text-xs" title="Describe sound effects you want (e.g., 'distant siren', 'footsteps on gravel', 'door slam at 3 seconds')">
                        <Info className="w-3 h-3" />
                      </span>
                    </span>
                  </label>
                  <textarea
                    value={sfxPrompt}
                    onChange={(e) => setSfxPrompt(e.target.value)}
                    placeholder="e.g., 'distant police siren', 'ambient city traffic', 'footsteps on gravel', 'door slam at 3 seconds'..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 resize-none"
                    rows={3}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Separate multiple sounds with commas. Include timestamps like "at 5 seconds" if needed.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateMusic}
                    onChange={(e) => setGenerateMusic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Generate Background Music</span>
                </label>
                {generateMusic && creditBreakdown && (
                  <Badge>{creditBreakdown.music} cr</Badge>
                )}
              </div>

              {generateMusic && (
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Music Style</label>
                    <select
                      value={musicStyle}
                      onChange={(e) => setMusicStyle(e.target.value)}
                      className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                    >
                      <option value="cinematic">Cinematic</option>
                      <option value="upbeat">Upbeat</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="ambient">Ambient</option>
                      <option value="energetic">Energetic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      <span className="flex items-center gap-2">
                        Music Description
                        <span className="text-gray-500 text-xs" title="Describe the music you want (e.g., 'epic orchestral theme', 'suspenseful strings', 'upbeat electronic')">
                          <Info className="w-3 h-3" />
                        </span>
                      </span>
                    </label>
                    <textarea
                      value={musicPrompt}
                      onChange={(e) => setMusicPrompt(e.target.value)}
                      placeholder="e.g., 'epic orchestral theme', 'distant police siren in background', 'suspenseful strings', 'upbeat electronic'..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 resize-none"
                      rows={3}
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Describe the mood, genre, or specific sounds you want in the background music.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('choose-method')} 
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={generateAudioDirect}
                className="flex-1 bg-cinema-red hover:bg-cinema-red/90"
                disabled={(!generateSFX && !generateMusic) || (generateSFX && !sfxPrompt.trim()) || (generateMusic && !musicPrompt.trim())}
              >
                Generate Audio
                {creditBreakdown && (
                  <span className="ml-2">
                    ({generateSFX && generateMusic
                      ? creditBreakdown.sfxAndMusic
                      : generateSFX
                      ? creditBreakdown.sfx
                      : creditBreakdown.music}{' '}
                    cr)
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Analysis Results - Compact */}
      {step === 'generate' && analysis && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Analysis Complete
            </CardTitle>
            <CardDescription className="text-xs">
              {analysis.detectedCues.length} audio cues detected
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xs mb-2">Mood Profile</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{analysis.moodProfile.primaryMood}</Badge>
                <Badge variant="outline" className="text-xs">{analysis.moodProfile.tempo}</Badge>
                <Badge variant="outline" className="text-xs">Intensity: {analysis.moodProfile.intensity}/10</Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-white font-medium text-sm">Detected Audio Cues</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {analysis.detectedCues.slice(0, 5).map((cue, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white/5 rounded text-xs"
                  >
                    <p className="text-white font-medium text-xs">{cue.description}</p>
                    <p className="text-gray-400 text-xs">
                      {cue.timestamp.toFixed(1)}s • {(cue.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
                {analysis.detectedCues.length > 5 && (
                  <p className="text-gray-400 text-xs text-center">+ {analysis.detectedCues.length - 5} more</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={generateSFX}
                    onChange={(e) => setGenerateSFX(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-white text-sm">Sound Effects</span>
                </label>
                {generateSFX && creditBreakdown && (
                  <Badge className="text-xs">{creditBreakdown.sfx} cr</Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={generateMusic}
                    onChange={(e) => setGenerateMusic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-white text-sm">Background Music</span>
                </label>
                {generateMusic && creditBreakdown && (
                  <Badge className="text-xs">{creditBreakdown.music} cr</Badge>
                )}
              </div>

              {generateMusic && (
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Music Style</label>
                  <select
                    value={musicStyle}
                    onChange={(e) => setMusicStyle(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="upbeat">Upbeat</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="ambient">Ambient</option>
                    <option value="energetic">Energetic</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              onClick={generateAudio}
              className="w-full bg-cinema-red hover:bg-cinema-red/90"
              disabled={!generateSFX && !generateMusic}
              size="sm"
            >
              Generate Audio
              {creditBreakdown && (
                <span className="ml-2">
                  ({generateSFX && generateMusic
                    ? creditBreakdown.sfxAndMusic
                    : generateSFX
                    ? creditBreakdown.sfx
                    : creditBreakdown.music}{' '}
                  cr)
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Merge */}
      {step === 'merge' && generatedAudio && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <CardTitle>Audio Generated</CardTitle>
            <CardDescription>Ready to merge with video</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedAudio.sfxTracks && generatedAudio.sfxTracks.length > 0 && (
                <div>
                  <p className="text-white font-medium mb-2">
                    Sound Effects ({generatedAudio.sfxTracks.length})
                  </p>
                  <div className="space-y-2">
                    {generatedAudio.sfxTracks.map((sfx, idx) => (
                      <div key={idx} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white text-sm">{sfx.description}</p>
                        <p className="text-gray-400 text-xs">
                          {sfx.timestamp.toFixed(1)}s • {sfx.duration.toFixed(1)}s
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedAudio.musicTrack && (
                <div>
                  <p className="text-white font-medium mb-2">Background Music</p>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-white text-sm">{generatedAudio.musicTrack.style}</p>
                    <p className="text-gray-400 text-xs">
                      {generatedAudio.musicTrack.duration.toFixed(1)}s
                    </p>
                  </div>
                </div>
              )}

              <Button onClick={mergeAudio} className="w-full bg-cinema-red hover:bg-cinema-red/90">
                Merge Audio into Video (FREE)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Complete */}
      {step === 'complete' && mergedVideoUrl && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Complete!
            </CardTitle>
            <CardDescription>Your video with audio is ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoUrl && (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={mergedVideoUrl}
                  controls
                  className="w-full rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleDownload('video')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Video
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownload('audio')}
                className="flex items-center gap-2"
              >
                <Music className="w-4 h-4" />
                Audio
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownload('both')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Both
              </Button>
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Start Over
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
