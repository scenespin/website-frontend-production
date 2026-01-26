'use client';

/**
 * Scene Playlist Player Component
 * 
 * Streamlined video player with playlist functionality for scene shots.
 * Features:
 * - Clean, modern UI matching Scene Builder aesthetics
 * - Direct video control via refs (no autoPlay dependency)
 * - Error handling for missing presigned URLs
 * - Loading states
 * - Trim controls for each shot
 * - Generate stitched video
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, ChevronUp, ChevronDown, Scissors, Film, Loader2, AlertCircle, Edit, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { VideoPlayer, type VideoPlayerRef } from './VideoPlayer';
import { PlaylistBuilderModal } from './PlaylistBuilderModal';
import type { SceneVideo } from '@/hooks/useScenes';
import type { PlaylistShot as PlaylistShotType } from '@/types/playlist';

// Internal PlaylistShot format used by the player (includes presigned URLs and loading states)
interface PlaylistShot {
  shotNumber: number;
  video: {
    id: string;
    s3Key?: string;
    fileName: string;
    fileType: string;
  };
  presignedUrl?: string;
  trimStart: number;
  trimEnd: number;
  duration: number;
  timestamp?: string;
  isLoading?: boolean;
  hasError?: boolean;
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
  initialPlaylist?: PlaylistShotType[]; // Accept external PlaylistShot type from @/types/playlist
}

export function ScenePlaylistPlayer({
  scene,
  presignedUrls,
  onClose,
  screenplayId: propScreenplayId,
  initialPlaylist,
}: ScenePlaylistPlayerProps) {
  const { getToken } = useAuth();
  const isMobile = useIsMobile();
  const screenplay = useScreenplay();
  const screenplayId = propScreenplayId || screenplay?.screenplayId;
  const sceneId = scene.id || `scene-${scene.number}`;
  
  // 🔥 FIX: Add auto-play toggle state
  const [autoPlayNext, setAutoPlayNext] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`playlist-autoplay-${sceneId}`);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });
  
  const [playlist, setPlaylist] = useState<PlaylistShot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDurations, setVideoDurations] = useState<Map<number, number>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const videoPlayerRef = useRef<VideoPlayerRef | null>(null);
  const isInitializedRef = useRef(false); // 🔥 FIX: Track if playlist has been initialized

  // 🔥 FIX: Load persisted playlist state from localStorage
  const loadPersistedState = useCallback(() => {
    if (typeof window === 'undefined' || !sceneId) return null;
    
    try {
      const stored = localStorage.getItem(`playlist-state-${sceneId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          playlist: parsed.playlist || [],
          currentIndex: parsed.currentIndex || 0,
        };
      }
    } catch (error) {
      console.warn('[ScenePlaylistPlayer] Failed to load persisted state:', error);
    }
    return null;
  }, [sceneId]);

  // 🔥 FIX: Save playlist state to localStorage (debounced)
  const savePersistedStateRef = useRef<NodeJS.Timeout | null>(null);
  const savePersistedState = useCallback((playlistToSave: PlaylistShot[], index: number) => {
    if (typeof window === 'undefined' || !sceneId) return;
    
    // Debounce saves to avoid excessive writes
    if (savePersistedStateRef.current) {
      clearTimeout(savePersistedStateRef.current);
    }
    
    savePersistedStateRef.current = setTimeout(() => {
      try {
        // Only save essential data (not presigned URLs which expire)
        const stateToSave = {
          playlist: playlistToSave.map(shot => ({
            shotNumber: shot.shotNumber,
            video: {
              s3Key: shot.video.s3Key,
              fileName: shot.video.fileName,
              fileType: shot.video.fileType,
            },
            trimStart: shot.trimStart,
            trimEnd: shot.trimEnd,
            duration: shot.duration,
            timestamp: shot.timestamp,
          })),
          currentIndex: index,
        };
        localStorage.setItem(`playlist-state-${sceneId}`, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('[ScenePlaylistPlayer] Failed to save persisted state:', error);
      }
    }, 500); // 500ms debounce
  }, [sceneId]);

  // 🔥 FIX: Save auto-play preference
  useEffect(() => {
    if (typeof window !== 'undefined' && sceneId) {
      localStorage.setItem(`playlist-autoplay-${sceneId}`, JSON.stringify(autoPlayNext));
    }
  }, [autoPlayNext, sceneId]);

  // 🔥 FIX: Initialize playlist from initialPlaylist, persisted state, or scene shots
  useEffect(() => {
    if (!scene.videos?.shots) return;

    // Priority 1: Use initialPlaylist if provided (from PlaylistBuilderModal)
    if (initialPlaylist && initialPlaylist.length > 0 && !isInitializedRef.current) {
      setIsLoadingUrls(true);
      const shots: PlaylistShot[] = initialPlaylist.map((shot) => {
        const presignedUrl = shot.s3Key ? presignedUrls.get(shot.s3Key) : undefined;
        const hasError = shot.s3Key && !presignedUrl;
        
        return {
          shotNumber: shot.shotNumber,
          video: {
            id: shot.fileId,
            s3Key: shot.s3Key || '',
            fileName: shot.fileName || `Shot ${shot.shotNumber}`,
            fileType: 'video/mp4',
          },
          presignedUrl,
          trimStart: shot.trimStart || 0,
          trimEnd: shot.trimEnd || shot.duration || 5,
          duration: shot.duration || 5,
          timestamp: shot.timestamp,
          isLoading: !!presignedUrl,
          hasError,
        };
      });
      
      setPlaylist(shots);
      setCurrentIndex(0);
      setIsLoadingUrls(false);
      isInitializedRef.current = true;
      return;
    }

    // Priority 2: Check if we have persisted state for this scene
    const persistedState = loadPersistedState();
    
    // If we have persisted state and this is the same scene, restore it
    if (persistedState && persistedState.playlist.length > 0 && !isInitializedRef.current) {
      // Restore playlist with current presigned URLs
      const restoredPlaylist = persistedState.playlist.map((savedShot: any) => {
        const presignedUrl = savedShot.video.s3Key ? presignedUrls.get(savedShot.video.s3Key) : undefined;
        const hasError = savedShot.video.s3Key && !presignedUrl;
        
        return {
          ...savedShot,
          presignedUrl,
          hasError,
          isLoading: !!presignedUrl && !hasError,
        };
      });
      
      setPlaylist(restoredPlaylist);
      setCurrentIndex(persistedState.currentIndex);
      isInitializedRef.current = true;
      setIsLoadingUrls(false);
      return;
    }

    // Priority 3: Initialize from scene shots (first time or scene changed)
    if (!isInitializedRef.current) {
      setIsLoadingUrls(true);

      const shots: PlaylistShot[] = scene.videos.shots.map((shot) => {
        const presignedUrl = shot.video.s3Key ? presignedUrls.get(shot.video.s3Key) : undefined;
        const hasError = shot.video.s3Key && !presignedUrl;
        
        return {
          shotNumber: shot.shotNumber,
          video: shot.video,
          presignedUrl,
          trimStart: 0,
          trimEnd: 5, // Default to 5 seconds (will be updated when video loads) - allows immediate playback
          duration: 0, // Will be set when video loads
          timestamp: shot.timestamp,
          isLoading: !!presignedUrl, // Will load if URL exists
          hasError,
        };
      });

      setPlaylist(shots);
      setIsLoadingUrls(false);
      isInitializedRef.current = true;

      // Show warning if any URLs are missing
      const missingUrls = shots.filter(s => s.hasError);
      if (missingUrls.length > 0) {
        toast.warning(`${missingUrls.length} video${missingUrls.length > 1 ? 's' : ''} missing URLs`, {
          description: 'Some videos may not be available. Try refreshing the storyboard.',
        });
      }
    } else {
      // 🔥 FIX: Merge new videos into existing playlist instead of replacing
      // Update presigned URLs for existing videos and add new ones
      setPlaylist(prev => {
        const existingByS3Key = new Map(prev.map(s => [s.video.s3Key, s]));
        const newShots: PlaylistShot[] = [];
        
        scene.videos.shots.forEach((shot) => {
          const presignedUrl = shot.video.s3Key ? presignedUrls.get(shot.video.s3Key) : undefined;
          const hasError = shot.video.s3Key && !presignedUrl;
          const existing = existingByS3Key.get(shot.video.s3Key);
          
          if (existing) {
            // Update existing shot with new presigned URL, preserve trim values
            newShots.push({
              ...existing,
              presignedUrl,
              hasError,
              isLoading: !!presignedUrl && !hasError,
            });
          } else {
            // Add new shot
            newShots.push({
              shotNumber: shot.shotNumber,
              video: shot.video,
              presignedUrl,
              trimStart: 0,
              trimEnd: 0,
              duration: 0,
              timestamp: shot.timestamp,
              isLoading: !!presignedUrl,
              hasError,
            });
          }
        });
        
        return newShots;
      });
    }
  }, [scene.videos, presignedUrls, loadPersistedState, initialPlaylist]);

  // Reset initialization when initialPlaylist changes
  useEffect(() => {
    if (initialPlaylist) {
      isInitializedRef.current = false;
    }
  }, [initialPlaylist]);

  const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);

  // 🔥 FIX: Save playlist state whenever it changes
  useEffect(() => {
    if (playlist.length > 0) {
      savePersistedState(playlist, currentIndex);
    }
    
    // Cleanup: clear timeout on unmount
    return () => {
      if (savePersistedStateRef.current) {
        clearTimeout(savePersistedStateRef.current);
      }
    };
  }, [playlist, currentIndex, savePersistedState]);

  // Load video durations
  const loadVideoDuration = useCallback((shot: PlaylistShot, index: number) => {
    if (!shot.presignedUrl || shot.hasError) {
      setPlaylist(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isLoading: false, hasError: true };
        return updated;
      });
      return;
    }

    const video = document.createElement('video');
    video.src = shot.presignedUrl;
    video.preload = 'metadata';

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      setVideoDurations(prev => {
        const newMap = new Map(prev);
        newMap.set(index, duration);
        return newMap;
      });

      // Update trimEnd to full duration if not set or if it's the default 5 seconds
      // Also clamp trimEnd to duration if it exceeds it (handles videos shorter than 5s)
      setPlaylist(prev => {
        const updated = [...prev];
        const shot = updated[index];
        
        // If trimEnd is 0 or the default 5 seconds, set it to full duration
        // This handles both cases: videos longer than 5s (set to full duration) 
        // and videos shorter than 5s (clamp to actual duration)
        if (shot.trimEnd === 0 || shot.trimEnd === 5) {
          updated[index] = {
            ...shot,
            trimEnd: duration, // Always use actual duration, regardless of video length
            duration: duration,
            isLoading: false,
          };
        } else {
          // Ensure trimEnd doesn't exceed duration (safety check for any edge cases)
          updated[index] = {
            ...shot,
            trimEnd: Math.min(shot.trimEnd, duration),
            duration: duration,
            isLoading: false,
          };
        }
        return updated;
      });
    };

    const handleError = () => {
      setPlaylist(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isLoading: false, hasError: true };
        return updated;
      });
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Load durations for all videos
  useEffect(() => {
    playlist.forEach((shot, index) => {
      if (shot.presignedUrl && shot.duration === 0 && !shot.hasError && shot.isLoading) {
        loadVideoDuration(shot, index);
      }
    });
  }, [playlist, loadVideoDuration]);

  const currentShot = playlist[currentIndex];
  const currentVideoUrl = currentShot?.presignedUrl;

  // 🔥 FIX: Auto-play when switching to next shot (only if autoPlayNext is enabled)
  useEffect(() => {
    if (autoPlayNext && isPlaying && currentVideoUrl && videoPlayerRef.current && !currentShot?.hasError) {
      // Small delay to ensure video element is ready
      const timer = setTimeout(() => {
        videoPlayerRef.current?.play().catch((error) => {
          if (error.name !== 'NotAllowedError') {
            console.warn('[ScenePlaylistPlayer] Auto-play failed:', error);
          }
          setIsPlaying(false);
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentVideoUrl, isPlaying, currentShot?.hasError, autoPlayNext]);

  // 🔥 FIX: Handle video end - play next only if autoPlayNext is enabled
  const handleVideoEnd = useCallback(() => {
    if (autoPlayNext && currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
      // VideoPlayer will auto-play when src changes (if autoPlayNext is true)
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, playlist.length, autoPlayNext]);

  // Note: Play/pause is handled by VideoPlayer's built-in controls
  // This function is kept for potential programmatic control if needed
  const togglePlayPause = useCallback(async () => {
    if (!currentVideoUrl || currentShot?.hasError) {
      toast.error('Video not available');
      return;
    }

    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.pause();
        setIsPlaying(false);
        // Disable auto-play when user manually pauses
        setAutoPlayNext(false);
      } else {
        // Seek to trim start if trim is set, otherwise start from beginning
        const startTime = currentShot?.trimStart || 0;
        videoPlayerRef.current.seekTo(startTime);
        try {
          await videoPlayerRef.current.play();
          setIsPlaying(true);
        } catch (error: any) {
          console.error('[ScenePlaylistPlayer] Play error:', error);
          setIsPlaying(false);
          if (error.name !== 'NotAllowedError') {
            toast.error('Unable to play video', {
              description: error.message || 'Video playback failed'
            });
          }
        }
      }
    }
  }, [isPlaying, currentVideoUrl, currentShot]);

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
      const missingKeys = shots.filter(s => !s.s3Key);
      if (missingKeys.length > 0) {
        toast.error(`${missingKeys.length} shot${missingKeys.length > 1 ? 's' : ''} missing S3 keys`);
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
    <div className={`fixed ${isMobile ? 'inset-4' : 'inset-0'} z-50 bg-black/95 flex items-center justify-center ${isMobile ? 'p-0' : 'p-4'}`}>
      <div className={`w-full ${isMobile ? 'h-full' : 'max-w-7xl h-full'} flex flex-col bg-[#0A0A0A] rounded-lg overflow-hidden border border-[#3F3F46]`}>
        {/* Header - Streamlined */}
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} ${isMobile ? 'p-3' : 'p-4'} border-b border-[#3F3F46] bg-[#1A1A1A]`}>
          <div className={isMobile ? 'w-full' : ''}>
            <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white`}>
              Scene {scene.number}: {scene.heading}
            </h2>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-[#808080] mt-0.5`}>
              {playlist.length} shot{playlist.length !== 1 ? 's' : ''} in playlist
            </p>
          </div>
          <div className={`flex items-center ${isMobile ? 'gap-1.5 w-full' : 'gap-2'}`}>
            <button
              onClick={() => setShowPlaylistBuilder(true)}
              className={`${isMobile ? 'flex-1 px-3 py-2.5 min-h-[44px]' : 'px-3 py-1.5'} bg-[#1A1A1A] border border-[#3F3F46] hover:border-[#DC143C] rounded ${isMobile ? 'text-base' : 'text-sm'} text-[#FFFFFF] transition-colors flex items-center justify-center gap-2`}
            >
              <Edit className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
              <span>Edit Playlist</span>
            </button>
            <button
              onClick={onClose}
              className={`${isMobile ? 'p-2.5 min-w-[44px] min-h-[44px]' : 'p-2'} hover:bg-[#3F3F46] rounded transition-colors flex items-center justify-center`}
              aria-label="Close"
            >
              <X className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'} text-[#B3B3B3]`} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'gap-3 p-3' : 'gap-4 p-4'} overflow-hidden`}>
          {/* Video Player - Larger, cleaner */}
          <div className="flex-1 flex flex-col min-w-0">
            {isLoadingUrls ? (
              <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
                <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
              </div>
            ) : currentVideoUrl && !currentShot?.hasError ? (
              <div className="flex-1 bg-[#0A0A0A] rounded-lg border border-[#3F3F46] overflow-hidden">
              <VideoPlayer
                  ref={videoPlayerRef}
                src={currentVideoUrl}
                  className="w-full h-full"
                  autoPlay={false}
                trimStart={currentShot?.trimStart || 0}
                trimEnd={currentShot?.trimEnd}
                  enableTrimHandles={true}
                  onTrimChange={(start, end) => {
                    // Update trim points in playlist
                    updateTrim(currentIndex, start, end);
                  }}
                onEnded={handleVideoEnd}
                onTimeUpdate={(time) => {
                  // Handle trim end automatically
                  if (currentShot && currentShot.trimEnd && time >= currentShot.trimEnd) {
                    handleVideoEnd();
                  }
                }}
                  onError={(error) => {
                    console.error('[ScenePlaylistPlayer] Video error:', error);
                    setPlaylist(prev => {
                      const updated = [...prev];
                      updated[currentIndex] = { ...updated[currentIndex], hasError: true };
                      return updated;
                    });
                    
                    // More helpful error message based on error type
                    const errorMessage = error.message || 'Unable to play this video';
                    const isFormatError = errorMessage.includes('format not supported');
                    
                    toast.error('Video playback error', {
                      description: isFormatError 
                        ? 'This video format may not be supported by your browser. Try downloading the file or contact support.'
                        : errorMessage,
                      duration: 6000
                    });
                  }}
              />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
                <AlertCircle className="w-12 h-12 text-[#808080] mb-3" />
                <p className="text-[#B3B3B3] text-sm font-medium mb-1">Video not available</p>
                <p className="text-[#808080] text-xs">
                  {currentShot?.hasError 
                    ? 'This video could not be loaded. It may have been deleted or the URL expired.'
                    : 'No video URL available for this shot.'}
                </p>
              </div>
            )}

            {/* Controls - Streamlined */}
            <div className={`mt-4 flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
              <div className={`flex items-center ${isMobile ? 'gap-2 w-full' : 'gap-2'}`}>
                <button
                  onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className={`${isMobile ? 'flex-1 px-4 py-2.5 min-h-[44px]' : 'px-4 py-2'} bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:bg-[#0A0A0A] disabled:text-[#808080] text-white rounded-lg ${isMobile ? 'text-base' : 'text-sm'} font-medium transition-colors border border-[#3F3F46]`}
                >
                  Previous
                </button>

                <button
                  onClick={() => currentIndex < playlist.length - 1 && setCurrentIndex(currentIndex + 1)}
                  disabled={currentIndex === playlist.length - 1}
                  className={`${isMobile ? 'flex-1 px-4 py-2.5 min-h-[44px]' : 'px-4 py-2'} bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:bg-[#0A0A0A] disabled:text-[#808080] text-white rounded-lg ${isMobile ? 'text-base' : 'text-sm'} font-medium transition-colors border border-[#3F3F46]`}
                >
                  Next
                </button>

                {/* Auto-play toggle - Only control needed since VideoPlayer has its own play/pause */}
                <button
                  onClick={() => setAutoPlayNext(!autoPlayNext)}
                  className={`${isMobile ? 'px-3 py-2.5 min-w-[44px] min-h-[44px]' : 'px-4 py-2'} rounded-lg ${isMobile ? 'text-base' : 'text-sm'} font-medium transition-colors border flex items-center justify-center gap-2 ${
                    autoPlayNext
                      ? 'bg-[#DC143C]/20 border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C]/30'
                      : 'bg-[#1A1A1A] border-[#3F3F46] text-[#B3B3B3] hover:bg-[#2A2A2A]'
                  }`}
                  title={autoPlayNext ? 'Auto-play next video is enabled' : 'Click to enable auto-play next video'}
                >
                  <Play className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
                  {!isMobile && <span>Auto-play</span>}
                </button>
              </div>

              {!isMobile && <div className="flex-1" />}

              <button
                onClick={handleGenerateStitched}
                disabled={isGenerating || playlist.length === 0}
                className={`${isMobile ? 'w-full px-4 py-2.5 min-h-[44px]' : 'px-4 py-2'} bg-[#DC143C] hover:bg-[#B0111E] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg ${isMobile ? 'text-base' : 'text-sm'} font-medium transition-colors flex items-center justify-center gap-2`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} animate-spin />
                    Generating...
                  </>
                ) : (
                  <>
                    <Film className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
                    <span>Generate Stitched Video ({cost} credits)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Playlist Sidebar - Cleaner */}
          <div className={`${isMobile ? 'w-full' : 'w-80'} bg-[#0A0A0A] rounded-lg border border-[#3F3F46] ${isMobile ? 'p-3' : 'p-4'} overflow-y-auto`}>
            <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
              <Film className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-[#DC143C]`} />
              <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-semibold text-white uppercase tracking-wide`}>
                Playlist
              </h3>
            </div>

            <div className={`${isMobile ? 'space-y-2' : 'space-y-2'}`}>
              {playlist.map((shot, index) => (
                <div
                  key={`${shot.shotNumber}-${shot.timestamp || index}`}
                  className={`${isMobile ? 'p-2.5' : 'p-3'} rounded-lg border-2 transition-all min-w-0 ${
                    index === currentIndex
                      ? 'border-[#DC143C] bg-[#DC143C]/10'
                      : 'border-[#3F3F46] bg-[#1A1A1A] hover:border-[#4F4F56]'
                  } ${shot.hasError ? 'opacity-60' : ''}`}
                >
                  {/* Shot Header */}
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-[#DC143C]`}>
                        Shot {shot.shotNumber}
                      </span>
                      {index === currentIndex && (
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-[#808080]`}>(Playing)</span>
                      )}
                      {shot.hasError && (
                        <AlertCircle className={`${isMobile ? 'w-3.5 h-3.5' : 'w-3 h-3'} text-[#DC143C]`} />
                      )}
                      {shot.isLoading && (
                        <Loader2 className={`${isMobile ? 'w-3.5 h-3.5' : 'w-3 h-3'} animate-spin text-[#808080]`} />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveShot(index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className={`${isMobile ? 'p-1.5 min-w-[44px] min-h-[44px]' : 'p-1'} hover:bg-[#3F3F46] rounded disabled:opacity-50 flex items-center justify-center`}
                        aria-label="Move up"
                      >
                        <ChevronUp className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} text-[#808080]`} />
                      </button>
                      <button
                        onClick={() => moveShot(index, Math.min(playlist.length - 1, index + 1))}
                        disabled={index === playlist.length - 1}
                        className={`${isMobile ? 'p-1.5 min-w-[44px] min-h-[44px]' : 'p-1'} hover:bg-[#3F3F46] rounded disabled:opacity-50 flex items-center justify-center`}
                        aria-label="Move down"
                      >
                        <ChevronDown className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} text-[#808080]`} />
                      </button>
                    </div>
                  </div>

                  {/* Trim Controls - Compact with +/- buttons */}
                  {!shot.hasError && shot.duration > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-[#3F3F46] min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Scissors className="w-3 h-3 text-[#808080] flex-shrink-0" />
                      <span className="text-xs text-[#808080] font-medium">Trim</span>
                    </div>
                    
                    {/* Start Time */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-[#808080] w-10 flex-shrink-0">Start:</label>
                      <button
                        onClick={() => {
                          const newStart = Math.max(0, shot.trimStart - 0.1);
                          updateTrim(index, newStart, shot.trimEnd);
                        }}
                        disabled={shot.trimStart <= 0}
                        className="p-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#3F3F46] hover:border-[#DC143C] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        aria-label="Decrease start time"
                      >
                        <Minus className="w-3 h-3 text-[#B3B3B3]" />
                      </button>
                      <input
                        type="text"
                        value={shot.trimStart.toFixed(1)}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow typing decimals (e.g., "1.5", "2.3")
                          if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                            const value = parseFloat(inputValue);
                            if (!isNaN(value) && value >= 0 && value <= shot.duration) {
                              updateTrim(index, value, shot.trimEnd);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure valid value on blur
                          const value = parseFloat(e.target.value) || 0;
                          const validValue = Math.max(0, Math.min(value, shot.trimEnd - 0.1));
                          updateTrim(index, validValue, shot.trimEnd);
                        }}
                        className="w-12 px-1 py-0.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-white text-xs focus:border-[#DC143C] focus:outline-none text-center"
                        placeholder="0.0"
                      />
                      <button
                        onClick={() => {
                          const newStart = Math.min(shot.trimEnd - 0.1, shot.trimStart + 0.1);
                          updateTrim(index, newStart, shot.trimEnd);
                        }}
                        disabled={shot.trimStart >= shot.trimEnd - 0.1}
                        className="p-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#3F3F46] hover:border-[#DC143C] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        aria-label="Increase start time"
                      >
                        <Plus className="w-3 h-3 text-[#B3B3B3]" />
                      </button>
                      <span className="text-xs text-[#808080] w-4 flex-shrink-0">s</span>
                    </div>
                    
                    {/* End Time */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-[#808080] w-10 flex-shrink-0">End:</label>
                      <button
                        onClick={() => {
                          const newEnd = Math.max(shot.trimStart + 0.1, shot.trimEnd - 0.1);
                          updateTrim(index, shot.trimStart, newEnd);
                        }}
                        disabled={shot.trimEnd <= shot.trimStart + 0.1}
                        className="p-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#3F3F46] hover:border-[#DC143C] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        aria-label="Decrease end time"
                      >
                        <Minus className="w-3 h-3 text-[#B3B3B3]" />
                      </button>
                      <input
                        type="text"
                        value={shot.trimEnd.toFixed(1)}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow typing decimals (e.g., "1.5", "2.3")
                          if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
                            const value = parseFloat(inputValue);
                            if (!isNaN(value) && value >= shot.trimStart + 0.1 && value <= shot.duration) {
                              updateTrim(index, shot.trimStart, value);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure valid value on blur
                          const value = parseFloat(e.target.value) || shot.duration;
                          const validValue = Math.max(shot.trimStart + 0.1, Math.min(value, shot.duration));
                          updateTrim(index, shot.trimStart, validValue);
                        }}
                        className="w-12 px-1 py-0.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-white text-xs focus:border-[#DC143C] focus:outline-none text-center"
                        placeholder="0.0"
                      />
                      <button
                        onClick={() => {
                          const newEnd = Math.min(shot.duration, shot.trimEnd + 0.1);
                          updateTrim(index, shot.trimStart, newEnd);
                        }}
                        disabled={shot.trimEnd >= shot.duration}
                        className="p-1 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#3F3F46] hover:border-[#DC143C] rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        aria-label="Increase end time"
                      >
                        <Plus className="w-3 h-3 text-[#B3B3B3]" />
                      </button>
                      <span className="text-xs text-[#808080] w-4 flex-shrink-0">s</span>
                    </div>
                    
                    <div className="text-xs text-[#808080] text-center pt-0.5">
                      Duration: {(shot.trimEnd - shot.trimStart).toFixed(1)}s
                    </div>
                  </div>
                  )}
                  
                  {shot.hasError && (
                    <div className="text-xs text-[#DC143C] mt-2">
                      Video unavailable
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Builder Modal */}
      {showPlaylistBuilder && (
        <PlaylistBuilderModal
          isOpen={showPlaylistBuilder}
          onClose={() => setShowPlaylistBuilder(false)}
          scene={{
            id: scene.id,
            number: scene.number,
            heading: scene.heading,
            videos: scene.videos,
          }}
          presignedUrls={presignedUrls}
          onPlay={(playlist) => {
            // Convert PlaylistShot[] to internal format
            const convertedPlaylist = playlist.map(shot => ({
              shotNumber: shot.shotNumber,
              video: {
                id: shot.fileId,
                s3Key: shot.s3Key,
                fileName: shot.fileName,
                fileType: 'video/mp4',
              },
              presignedUrl: shot.s3Key ? presignedUrls.get(shot.s3Key) : undefined,
              trimStart: shot.trimStart,
              trimEnd: shot.trimEnd,
              duration: shot.duration || 5,
              timestamp: shot.timestamp,
              isLoading: false,
              hasError: false,
            }));
            setPlaylist(convertedPlaylist);
            setCurrentIndex(0);
            setShowPlaylistBuilder(false);
            isInitializedRef.current = false; // Reset to allow re-initialization
          }}
          screenplayId={screenplayId || ''}
          initialPlaylist={playlist.map(shot => ({
            fileId: shot.video.id,
            s3Key: shot.video.s3Key || '',
            shotNumber: shot.shotNumber,
            trimStart: shot.trimStart,
            trimEnd: shot.trimEnd,
            order: 0,
            fileName: shot.video.fileName,
            duration: shot.duration,
            timestamp: shot.timestamp,
          }))}
        />
      )}
    </div>
  );
}
