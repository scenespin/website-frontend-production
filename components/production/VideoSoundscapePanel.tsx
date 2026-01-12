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

type Step = 'upload' | 'estimate' | 'analyze' | 'generate' | 'merge' | 'complete';

export function VideoSoundscapePanel({ projectId, className }: VideoSoundscapePanelProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [creditBreakdown, setCreditBreakdown] = useState<CreditBreakdown | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [generateSFX, setGenerateSFX] = useState(true);
  const [generateMusic, setGenerateMusic] = useState(true);
  const [musicStyle, setMusicStyle] = useState('cinematic');
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
        URL.revokeObjectURL(url);
        estimateCredits(duration);
      };
      video.src = url;
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
      setStep('estimate');
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

  // Analyze video
  const analyzeVideo = async () => {
    if (!videoFile || !videoDuration) return;

    setIsLoading(true);
    setLoadingMessage('Uploading video...');

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Upload video to S3
      const uploadedVideoUrl = await uploadVideoToS3(videoFile);

      setLoadingMessage('Analyzing video frames...');

      // Analyze video
      const analyzeResponse = await fetch(`${BACKEND_API_URL}/api/video-soundscape/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: uploadedVideoUrl,
        }),
      });

      if (!analyzeResponse.ok) {
        const error = await analyzeResponse.json();
        throw new Error(error.message || 'Analysis failed');
      }

      const result = await analyzeResponse.json();
      setAnalysis(result);
      setStep('generate');
      toast.success('Video analyzed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze video');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Generate audio
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
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Video Soundscape</h1>
        <p className="text-gray-400">
          AI-powered sound effects and music generation for your videos
        </p>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Video
            </CardTitle>
            <CardDescription>
              Upload a video (3 seconds - 5 minutes) to generate audio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
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
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <FileVideo className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-sm mt-1">MP4, MOV, AVI (max 500MB)</p>
                </div>
              </label>
            </div>
            {videoFile && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileVideo className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{videoFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setVideoFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Estimate & Confirm */}
      {step === 'estimate' && creditBreakdown && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Credit Estimate
            </CardTitle>
            <CardDescription>
              Review costs before analyzing your video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-sm">Video Duration</p>
                <p className="text-white text-2xl font-bold">
                  {creditBreakdown.videoDuration.toFixed(1)}s
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-sm">Your Balance</p>
                <p className="text-white text-2xl font-bold">
                  {creditBreakdown.userBalance} cr
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                <span className="text-gray-300">Analysis (2 cr/sec)</span>
                <span className="text-white font-medium">{creditBreakdown.analysis} cr</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                <span className="text-gray-300">SFX Only (3 cr/sec)</span>
                <span className="text-white font-medium">{creditBreakdown.sfx} cr</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                <span className="text-gray-300">Music Only (4 cr/sec)</span>
                <span className="text-white font-medium">{creditBreakdown.music} cr</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-cinema-red/50">
                <span className="text-white font-medium">Full (SFX + Music)</span>
                <span className="text-cinema-red font-bold">{creditBreakdown.sfxAndMusic} cr</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-cinema-red/10 rounded border border-cinema-red">
                <span className="text-white font-bold">Total (Analysis + Full)</span>
                <span className="text-cinema-red font-bold">{creditBreakdown.total} cr</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-yellow-500 font-medium">Balance After Analysis</p>
                  <p className="text-white text-lg font-bold">
                    {creditBreakdown.balanceAfterAnalysis} cr
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    You'll need {creditBreakdown.sfxAndMusic} more credits for full generation
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="flex-1 bg-cinema-red hover:bg-cinema-red/90"
                disabled={creditBreakdown.userBalance < creditBreakdown.analysis}
              >
                Analyze Video ({creditBreakdown.analysis} cr)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && creditBreakdown && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="bg-[#1A1A1A] border-white/10 max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Confirm Analysis</CardTitle>
              <CardDescription>
                This will charge {creditBreakdown.analysis} credits for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Current Balance</p>
                <p className="text-white text-2xl font-bold">{creditBreakdown.userBalance} cr</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">After Analysis</p>
                <p className="text-white text-2xl font-bold">
                  {creditBreakdown.balanceAfterAnalysis} cr
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    analyzeVideo();
                  }}
                  className="flex-1 bg-cinema-red hover:bg-cinema-red/90"
                >
                  Confirm & Analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-cinema-red animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">{loadingMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Analysis Results */}
      {step === 'generate' && analysis && (
        <Card className="bg-[#1A1A1A] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Analysis Complete
            </CardTitle>
            <CardDescription>
              {analysis.detectedCues.length} audio cues detected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Mood Profile</p>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{analysis.moodProfile.primaryMood}</Badge>
                <Badge variant="outline">{analysis.moodProfile.tempo}</Badge>
                <Badge variant="outline">Intensity: {analysis.moodProfile.intensity}/10</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-white font-medium">Detected Audio Cues</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {analysis.detectedCues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white/5 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{cue.description}</p>
                      <p className="text-gray-400 text-sm">
                        {cue.timestamp.toFixed(1)}s • {cue.type} • {(cue.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
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
              )}
            </div>

            <Button
              onClick={generateAudio}
              className="w-full bg-cinema-red hover:bg-cinema-red/90"
              disabled={!generateSFX && !generateMusic}
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
