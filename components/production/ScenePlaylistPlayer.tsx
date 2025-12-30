'use client';

/**
 * Scene Playlist Player Component
 * 
 * Video player with playlist functionality for scene shots.
 * Features:
 * - Playlist of shots with reordering (drag & drop or buttons)
 * - Trim controls for each shot (start/end time)
 * - Visual trim indicators on timeline
 * - Quick cuts (no delay between videos)
 * - Preload next video
 * - Generate stitched video button
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, ChevronUp, ChevronDown, Scissors, Film, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { VideoPlayer } from './VideoPlayer';
import type { SceneVideo } from '@/hooks/useScenes';

interface PlaylistShot {
  shotNumber: number;
  video: {
    s3Key?: string;
    fileName: string;
    fileType: string;
  };
  presignedUrl?: string;
  trimStart: number;
  trimEnd: number;
  duration: number;
  timestamp?: string;
}

interface ScenePlaylistPlayerProps {
  scene: {
    id?: string;
    number: number;
    heading: string;
    videos: SceneVideo['videos'];
  };
  presignedUrls: Map<string, string>;
  onClose: () => void;
  screenplayId?: string;
}

export function ScenePlaylistPlayer({
  scene,
  presignedUrls,
  onClose,
  screenplayId: propScreenplayId,
}: ScenePlaylistPlayerProps) {
  const { getToken } = useAuth();
  const screenplay = useScreenplay();
  const screenplayId = propScreenplayId || screenplay?.screenplayId;
  const [playlist, setPlaylist] = useState<PlaylistShot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDurations, setVideoDurations] = useState<Map<number, number>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Initialize playlist from scene shots
  useEffect(() => {
    if (!scene.videos?.shots) return;

    const shots: PlaylistShot[] = scene.videos.shots.map((shot) => {
      const presignedUrl = shot.video.s3Key ? presignedUrls.get(shot.video.s3Key) : undefined;
      return {
        shotNumber: shot.shotNumber,
        video: shot.video,
        presignedUrl,
        trimStart: 0,
        trimEnd: 0, // Will be set when video loads
        duration: 0, // Will be set when video loads
        timestamp: shot.timestamp,
      };
    });

    setPlaylist(shots);
  }, [scene.videos, presignedUrls]);

  // Load video durations
  const loadVideoDuration = useCallback((shot: PlaylistShot, index: number) => {
    if (!shot.presignedUrl) return;

    const video = document.createElement('video');
    video.src = shot.presignedUrl;
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      setVideoDurations(prev => {
        const newMap = new Map(prev);
        newMap.set(index, duration);
        return newMap;
      });

      // Update trimEnd to full duration if not set
      setPlaylist(prev => {
        const updated = [...prev];
        if (updated[index].trimEnd === 0) {
          updated[index].trimEnd = duration;
          updated[index].duration = duration;
        }
        return updated;
      });
    });
  }, []);

  // Load durations for all videos
  useEffect(() => {
    playlist.forEach((shot, index) => {
      if (shot.presignedUrl && shot.duration === 0) {
        loadVideoDuration(shot, index);
      }
    });
  }, [playlist, loadVideoDuration]);

  const currentShot = playlist[currentIndex];
  const currentVideoUrl = currentShot?.presignedUrl;

  // Handle video end - play next
  const handleVideoEnd = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, playlist.length]);

  // Reorder playlist
  const moveShot = useCallback((fromIndex: number, toIndex: number) => {
    setPlaylist(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });

    // Update current index if needed
    if (fromIndex === currentIndex) {
      setCurrentIndex(toIndex);
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex]);

  // Update trim points
  const updateTrim = useCallback((index: number, trimStart: number, trimEnd: number) => {
    setPlaylist(prev => {
      const updated = [...prev];
      const shot = updated[index];
      const duration = shot.duration || videoDurations.get(index) || 0;
      
      // Validate trim points
      const validStart = Math.max(0, Math.min(trimStart, duration - 0.1));
      const validEnd = Math.max(validStart + 0.1, Math.min(trimEnd, duration));
      
      updated[index] = {
        ...shot,
        trimStart: validStart,
        trimEnd: validEnd,
      };
      return updated;
    });
  }, [videoDurations]);

  // Calculate stitching cost
  const calculateCost = useCallback(() => {
    const baseCost = 10;
    const perShotCost = 2;
    const shotCount = playlist.length;
    return baseCost + (shotCount - 1) * perShotCost;
  }, [playlist.length]);

  const cost = calculateCost();

  // Generate stitched video
  const handleGenerateStitched = useCallback(async () => {
    if (playlist.length === 0) {
      toast.error('No shots in playlist');
      return;
    }

    if (!screenplayId) {
      toast.error('Screenplay ID is required');
      return;
    }

    if (!scene.id) {
      toast.error('Scene ID is required');
      return;
    }

    setIsGenerating(true);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        setIsGenerating(false);
        return;
      }

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      // Prepare shots data with trim points
      const shots = playlist.map(shot => ({
        s3Key: shot.video.s3Key,
        startTime: shot.trimStart,
        endTime: shot.trimEnd,
      }));

      // Validate all shots have s3Key
      if (shots.some(s => !s.s3Key)) {
        toast.error('Some shots are missing S3 keys');
        setIsGenerating(false);
        return;
      }

      const response = await fetch(`${BACKEND_API_URL}/api/screenplays/${screenplayId}/scenes/${scene.id}/stitch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shots,
          sceneNumber: scene.number,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits
          toast.error('Insufficient Credits', {
            description: data.message || `You need ${data.requiredCredits || cost} credits to stitch this scene.`
          });
        } else {
          toast.error(`Failed to generate stitched video: ${data.message || data.error || 'Unknown error'}`);
        }
        setIsGenerating(false);
        return;
      }

      if (data.success) {
        toast.success('Stitched video generated successfully!', {
          description: `Used ${data.creditsUsed} credits. The video will appear in your Media Library.`
        });
        // Optionally close the player or refresh the media library
        // onClose();
      } else {
        toast.error(`Failed to generate stitched video: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error: any) {
      console.error('[ScenePlaylistPlayer] Stitch error:', error);
      toast.error(`Failed to generate stitched video: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [playlist, screenplayId, scene.id, scene.number, getToken, cost]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-full flex flex-col bg-[#1A1A1A] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3F3F46]">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Scene {scene.number}: {scene.heading}
            </h2>
            <p className="text-sm text-[#808080]">
              {playlist.length} shot{playlist.length !== 1 ? 's' : ''} in playlist
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3F3F46] rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 flex flex-col">
            {currentVideoUrl ? (
              <VideoPlayer
                src={currentVideoUrl}
                className="flex-1"
                autoPlay={isPlaying}
                trimStart={currentShot?.trimStart || 0}
                trimEnd={currentShot?.trimEnd}
                onEnded={handleVideoEnd}
                onTimeUpdate={(time) => {
                  // Handle trim end automatically
                  if (currentShot && currentShot.trimEnd && time >= currentShot.trimEnd) {
                    handleVideoEnd();
                  }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] rounded-lg">
                <p className="text-[#808080]">No video available</p>
              </div>
            )}

            {/* Playlist Controls */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-[#DC143C] hover:bg-[#B0111E] text-white rounded-lg font-medium transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 inline mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-2" />
                    Play
                  </>
                )}
              </button>

              <button
                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-[#3F3F46] hover:bg-[#4F4F56] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                onClick={() => currentIndex < playlist.length - 1 && setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex === playlist.length - 1}
                className="px-4 py-2 bg-[#3F3F46] hover:bg-[#4F4F56] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>

              <div className="flex-1" />

              <button
                onClick={handleGenerateStitched}
                disabled={isGenerating || playlist.length === 0}
                className="px-4 py-2 bg-[#DC143C] hover:bg-[#B0111E] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    Generate Stitched Video ({cost} credits - ${(cost / 100).toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Playlist Sidebar */}
          <div className="w-80 bg-[#0A0A0A] rounded-lg p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-4 h-4 text-[#808080]" />
              <h3 className="text-sm font-semibold text-[#B3B3B3] uppercase tracking-wide">
                Playlist
              </h3>
            </div>

            <div className="space-y-2">
              {playlist.map((shot, index) => (
                <div
                  key={`${shot.shotNumber}-${shot.timestamp || index}`}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    index === currentIndex
                      ? 'border-[#DC143C] bg-[#DC143C]/10'
                      : 'border-[#3F3F46] bg-[#1A1A1A] hover:border-[#4F4F56]'
                  }`}
                >
                  {/* Shot Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#DC143C]">
                        Shot {shot.shotNumber}
                      </span>
                      {index === currentIndex && (
                        <span className="text-xs text-[#808080]">(Playing)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveShot(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="p-1 hover:bg-[#3F3F46] rounded disabled:opacity-50"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-3 h-3 text-[#808080]" />
                      </button>
                      <button
                        onClick={() => moveShot(index, Math.min(playlist.length - 1, index + 1))}
                        disabled={index === playlist.length - 1}
                        className="p-1 hover:bg-[#3F3F46] rounded disabled:opacity-50"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-3 h-3 text-[#808080]" />
                      </button>
                    </div>
                  </div>

                  {/* Trim Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3 h-3 text-[#808080]" />
                      <span className="text-xs text-[#808080]">Trim</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[#808080] mb-1 block">Start (s)</label>
                        <input
                          type="number"
                          min="0"
                          max={shot.duration}
                          step="0.1"
                          value={shot.trimStart.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateTrim(index, value, shot.trimEnd);
                          }}
                          className="w-full px-2 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] mb-1 block">End (s)</label>
                        <input
                          type="number"
                          min={shot.trimStart + 0.1}
                          max={shot.duration}
                          step="0.1"
                          value={shot.trimEnd.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || shot.duration;
                            updateTrim(index, shot.trimStart, value);
                          }}
                          className="w-full px-2 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded text-white text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[#808080]">
                      Duration: {(shot.trimEnd - shot.trimStart).toFixed(1)}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

