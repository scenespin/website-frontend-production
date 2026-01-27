'use client';

/**
 * Video Player Component (Plyr-based)
 * 
 * Professional video player using Plyr library for smooth playback.
 * Features:
 * - Smooth autoplay and transitions
 * - Trim support (seek to start, stop at end)
 * - Custom trim handles
 * - Loading and error states
 * - Keyboard shortcuts
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { GripVertical } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  trimStart?: number; // Start time in seconds
  trimEnd?: number; // End time in seconds
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onTrimChange?: (start: number, end: number) => void; // Callback for trim changes
  enableTrimHandles?: boolean; // Enable draggable trim handles
}

export interface VideoPlayerRef {
  play: (isAutoplay?: boolean) => Promise<void>;
  pause: () => void;
  seekTo: (time: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  src,
  className = '',
  autoPlay = false,
  loop = false,
  muted = false,
  trimStart = 0,
  trimEnd,
  onTimeUpdate,
  onEnded,
  onError,
  onTrimChange,
  enableTrimHandles = false,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [draggingTrim, setDraggingTrim] = useState<'start' | 'end' | null>(null);
  const trimEndTriggeredRef = useRef(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Track if we're autoplaying to hide controls

  // Initialize Plyr player
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    // Set initial source if provided
    if (src && videoRef.current) {
      videoRef.current.src = src;
    }

    // Set loop on video element directly (Plyr types are stricter)
    if (videoRef.current) {
      videoRef.current.loop = loop;
    }

    const player = new Plyr(videoRef.current, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'],
      autoplay: false, // We'll handle autoplay manually for better control
      clickToPlay: true,
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      volume: muted ? 0 : 1,
      muted: muted,
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
    });

    playerRef.current = player;

    // 🔥 PRODUCTION: Apply autoplay class to Plyr container when needed
    const updateAutoplayClass = () => {
      if (containerRef.current) {
        const plyrContainer = containerRef.current.querySelector('.plyr');
        if (plyrContainer) {
          if (isAutoPlaying) {
            plyrContainer.classList.add('plyr-autoplaying');
          } else {
            plyrContainer.classList.remove('plyr-autoplaying');
          }
        }
      }
    };

    // Event handlers
    player.on('ready', () => {
      setIsLoading(false);
      if (videoRef.current) {
        const actualDuration = videoRef.current.duration || 0;
        setDuration(actualDuration);
        // Seek to trim start if specified
        if (trimStart > 0) {
          player.currentTime = trimStart;
        }
      }
      updateAutoplayClass();
    });

    // 🔥 FIX: Intercept play event to ensure trim is respected
    player.on('play', () => {
      setIsPlaying(true);
      setIsAutoPlaying(false); // Clear autoplay flag when user manually plays
      
      // When play is triggered (including from Plyr's play button), ensure we're at trimStart
      if (playerRef.current && videoRef.current) {
        const currentTime = playerRef.current.currentTime;
        const startTime = trimStart || 0;
        
        // If we're before trimStart or after trimEnd, seek to trimStart
        if (currentTime < startTime || (trimEnd && currentTime >= trimEnd)) {
          playerRef.current.currentTime = startTime;
        }
      }
    });

    player.on('pause', () => {
      setIsPlaying(false);
    });

    player.on('timeupdate', () => {
      const time = player.currentTime;
      setCurrentTime(time);

      // 🔥 FIX: Ensure we don't go before trimStart or after trimEnd
      const startTime = trimStart || 0;
      if (time < startTime) {
        player.currentTime = startTime;
        return;
      }

      // Check if we've reached trim end
      if (trimEnd && time >= trimEnd && !trimEndTriggeredRef.current) {
        trimEndTriggeredRef.current = true;
        player.pause();
        player.currentTime = trimEnd;
        setIsPlaying(false);
        if (onEnded) {
          onEnded();
        }
        setTimeout(() => {
          trimEndTriggeredRef.current = false;
        }, 200);
      } else if (trimEnd && time < trimEnd - 0.1) {
        trimEndTriggeredRef.current = false;
      }

      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    });

    player.on('loadedmetadata', () => {
      if (videoRef.current) {
        // 🔥 FIX: Use actual video duration from metadata
        const actualDuration = videoRef.current.duration || 0;
        setDuration(actualDuration);
      setIsLoading(false);
        trimEndTriggeredRef.current = false;
      if (trimStart > 0) {
          player.currentTime = trimStart;
      }
      }
    });

    player.on('ended', () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    });

    player.on('error', (event) => {
      setIsLoading(false);
      const error = new Error('Video playback error');
      if (onError) {
        onError(error);
      }
    });

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []); // Only run once on mount - Plyr handles source updates via video element

  // Update source when it changes
  useEffect(() => {
    if (playerRef.current && videoRef.current && src) {
      // Update video source directly
      videoRef.current.src = src;
      videoRef.current.load(); // Reload video with new source
      setIsLoading(true);
      trimEndTriggeredRef.current = false;
    }
  }, [src]);

  // Update loop property when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = loop;
    }
  }, [loop]);

  // Update trim start when it changes
  useEffect(() => {
    if (playerRef.current && trimStart > 0) {
      playerRef.current.currentTime = trimStart;
    }
  }, [trimStart]);

  // 🔥 FIX: Update trim end when it changes - ensure video doesn't play past it
  useEffect(() => {
    if (playerRef.current && trimEnd && videoRef.current) {
      const currentTime = playerRef.current.currentTime;
      // If we're past trimEnd, seek back to trimEnd
      if (currentTime > trimEnd) {
        playerRef.current.currentTime = trimEnd;
        if (isPlaying) {
          playerRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  }, [trimEnd, isPlaying]);

  // 🔥 PRODUCTION: Update Plyr container class when autoplay state changes
  useEffect(() => {
    if (containerRef.current && playerRef.current) {
      const plyrContainer = containerRef.current.querySelector('.plyr');
      if (plyrContainer) {
        if (isAutoPlaying) {
          plyrContainer.classList.add('plyr-autoplaying');
        } else {
          plyrContainer.classList.remove('plyr-autoplaying');
        }
      }
    }
  }, [isAutoPlaying]);

  // Global mouse event handlers for trim dragging
  useEffect(() => {
    if (!draggingTrim || !progressBarRef.current || !duration) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarRef.current) return;
      
      e.preventDefault();
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      
      if (draggingTrim === 'start') {
        const currentEnd = trimEnd || duration;
        const newStart = Math.max(0, Math.min(newTime, currentEnd - 0.1));
        if (onTrimChange) {
          onTrimChange(newStart, currentEnd);
        }
      } else if (draggingTrim === 'end') {
        const currentStart = trimStart || 0;
        const newEnd = Math.max(currentStart + 0.1, Math.min(newTime, duration));
        if (onTrimChange) {
          onTrimChange(currentStart, newEnd);
            }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setDraggingTrim(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTrim, duration, trimStart, trimEnd, onTrimChange]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    play: async (isAutoplay: boolean = false) => {
      if (!playerRef.current) return;
      
      // Set autoplay flag to hide controls
      setIsAutoPlaying(isAutoplay);
      
      // Always seek to trimStart before playing
      if (trimStart > 0) {
        playerRef.current.currentTime = trimStart;
      } else if (trimEnd && playerRef.current.currentTime >= trimEnd) {
        playerRef.current.currentTime = trimStart || 0;
      }
      
      // Wait for video to be ready
      if (videoRef.current && videoRef.current.readyState < 2) {
        await new Promise<void>((resolve) => {
          const handleCanPlay = () => {
            videoRef.current?.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          videoRef.current?.addEventListener('canplay', handleCanPlay);
        });
      }
      
      try {
        await playerRef.current.play();
        setIsPlaying(true);
        
        // Clear autoplay flag after a short delay to show controls on user interaction
        if (isAutoplay) {
          setTimeout(() => {
            setIsAutoPlaying(false);
          }, 1000);
        }
      } catch (error: any) {
        setIsAutoPlaying(false);
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.warn('[VideoPlayer] Play error:', error);
          }
          setIsPlaying(false);
        throw error;
    }
    },
    pause: () => {
      if (playerRef.current) {
        playerRef.current.pause();
        setIsPlaying(false);
      }
    },
    seekTo: (time: number) => {
      if (playerRef.current) {
    const seekTime = Math.max(trimStart, Math.min(trimEnd || duration, time));
        playerRef.current.currentTime = seekTime;
      }
    },
  }), [trimStart, trimEnd, duration]);

  // Get effective duration (trimmed or full)
  const effectiveDuration = trimEnd && trimEnd > 0 ? trimEnd - trimStart : duration;
  const effectiveCurrentTime = Math.max(0, currentTime - trimStart);

  return (
    <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className} ${isAutoPlaying ? 'plyr-autoplaying' : ''}`}>
      <video
        ref={videoRef}
        src={src}
        className="plyr__video"
        playsInline
        preload="metadata"
      />

      {/* Custom Trim Handles Overlay */}
      {enableTrimHandles && duration > 0 && (
        <div className="absolute bottom-16 left-0 right-0 px-4 pointer-events-none">
          <div 
            ref={progressBarRef}
            className="relative h-2 bg-white/20 rounded-full pointer-events-auto"
          >
            {/* Trimmed area highlight */}
            {trimStart > 0 && trimEnd && (
              <div 
                className="absolute top-0 h-full bg-green-500/30 rounded-full"
                style={{ 
                  left: `${(trimStart / duration) * 100}%`,
                  width: `${((trimEnd - trimStart) / duration) * 100}%`
                }}
              />
            )}
            
            {/* Trim Start Handle */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto ${
                draggingTrim === 'start' ? 'scale-110 ring-2 ring-green-300' : ''
              }`}
              style={{ left: `calc(${((trimStart || 0) / duration) * 100}% - 8px)` }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDraggingTrim('start');
              }}
              title={`Trim start: ${(trimStart || 0).toFixed(2)}s`}
            >
              <GripVertical className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            {/* Trim End Handle */}
            {trimEnd && trimEnd > 0 && (
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto ${
                  draggingTrim === 'end' ? 'scale-110 ring-2 ring-red-300' : ''
                }`}
                style={{ left: `calc(${(Math.min(trimEnd, duration) / duration) * 100}% - 8px)` }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingTrim('end');
                }}
                title={`Trim end: ${trimEnd.toFixed(2)}s`}
              >
                <GripVertical className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
