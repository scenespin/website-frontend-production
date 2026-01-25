'use client';

/**
 * Video Player Component
 * 
 * Reusable video player with custom controls and keyboard shortcuts.
 * Features:
 * - Play/pause controls
 * - Volume control
 * - Fullscreen toggle
 * - Keyboard shortcuts (space, arrows, f, m)
 * - Loading and error states
 * - Trim support (seek to start, stop at end)
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';

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
}

export interface VideoPlayerRef {
  play: () => Promise<void>;
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
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get effective duration (trimmed or full)
  const effectiveDuration = trimEnd && trimEnd > 0 ? trimEnd - trimStart : duration;
  const effectiveCurrentTime = Math.max(0, currentTime - trimStart);

  // Cleanup video when src changes to prevent memory leaks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset video state when src changes
    const previousSrc = video.src;
    
    return () => {
      // Cleanup: pause and reset video when src changes or component unmounts
      if (video && video.src !== previousSrc) {
        // Pause first to prevent AbortError (pause() returns void, not a Promise)
        try {
          video.pause();
        } catch (error) {
          // Ignore pause errors during cleanup
        }
        // Clear src and load to free memory
        video.src = '';
        video.load();
      }
    };
  }, [src]);

  // Update video time when trim points change
  useEffect(() => {
    if (videoRef.current && trimStart > 0) {
      videoRef.current.currentTime = trimStart;
    }
  }, [trimStart]);

  // Handle time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Check if we've reached trim end
      if (trimEnd && time >= trimEnd) {
        try {
          video.pause();
        } catch (error) {
          // Ignore pause errors (e.g., if already paused)
        }
        setIsPlaying(false);
        if (onEnded) {
          onEnded();
        }
      }

      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      
      // Seek to trim start if specified
      if (trimStart > 0) {
        video.currentTime = trimStart;
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      const video = videoRef.current;
      if (!video) return;
      
      // Get more detailed error information
      let errorMessage = 'Video failed to load';
      let errorDetails = '';
      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted';
            errorDetails = 'The video loading was interrupted. Please try again.';
            break;
          case video.error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading video';
            errorDetails = 'Unable to download the video. Check your internet connection.';
            break;
          case video.error.MEDIA_ERR_DECODE:
            errorMessage = 'Video decoding error';
            errorDetails = 'The video file may be corrupted or use an unsupported codec. Try downloading the file or contact support if the issue persists.';
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            // Try to detect file type from URL
            const urlLower = src.toLowerCase();
            const fileExtension = urlLower.match(/\.(mp4|mov|webm|mkv|avi|m4v)(\?|$)/)?.[1] || 'unknown';
            errorDetails = `Your browser does not support this video format. File extension: ${fileExtension}. Supported formats: MP4 (H.264), WebM, MOV. The file may be corrupted or use an unsupported codec.`;
            break;
        }
      }
      
      // Extract file info from URL for better diagnostics
      const urlMatch = src.match(/([^\/\?]+\.(mp4|mov|webm|mkv|avi|m4v))(\?|$)/i);
      const fileName = urlMatch ? urlMatch[1] : 'unknown';
      const detectedExtension = urlMatch ? urlMatch[2] : 'unknown';
      
      // Log detailed error information for debugging
      console.warn('[VideoPlayer] Video error details:', {
        errorCode: video.error?.code,
        errorMessage,
        errorDetails,
        videoSrc: src.substring(0, 150),
        fileName,
        detectedExtension,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState,
        canPlayType: {
          'video/mp4': video.canPlayType('video/mp4'),
          'video/webm': video.canPlayType('video/webm'),
          'video/quicktime': video.canPlayType('video/quicktime'),
        }
      });
      
      // Only call onError if it exists, and handle it safely
      if (onError) {
        try {
          onError(new Error(errorMessage));
        } catch (err) {
          // Silently handle errors in error handler to prevent unhandled rejections
          console.warn('[VideoPlayer] Error in onError callback:', err);
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [trimStart, trimEnd, onTimeUpdate, onEnded, onError]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [volume]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Volume sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted]);

  // Handle autoPlay errors (browser autoplay policies)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const handleCanPlay = () => {
      if (autoPlay && video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Autoplay was prevented by browser policy - this is expected
            if (error.name !== 'NotAllowedError') {
              console.warn('[VideoPlayer] Autoplay error:', error);
            }
            setIsPlaying(false);
          });
        }
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoPlay]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // If at trim end, seek to trim start
      if (trimEnd && video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      // Handle play() promise to prevent unhandled rejections
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // AbortError is expected when video is removed/paused during play
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.warn('[VideoPlayer] Play error:', error);
          }
          setIsPlaying(false);
        });
      }
    } else {
      video.pause();
    }
  }, [trimStart, trimEnd]);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(trimStart, Math.min(trimEnd || duration, video.currentTime + seconds));
    video.currentTime = newTime;
  }, [trimStart, trimEnd, duration]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;

    const seekTime = Math.max(trimStart, Math.min(trimEnd || duration, time));
    video.currentTime = seekTime;
  }, [trimStart, trimEnd, duration]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      const video = videoRef.current;
      if (!video) return;
      
      // If at trim end, seek to trim start
      if (trimEnd && video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise.catch((error) => {
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.warn('[VideoPlayer] Play error:', error);
          }
          setIsPlaying(false);
          throw error;
        });
      }
      setIsPlaying(true);
    },
    pause: () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      setIsPlaying(false);
    },
    seekTo: (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const seekTime = Math.max(trimStart, Math.min(trimEnd || duration, time));
      video.currentTime = seekTime;
    },
  }), [trimStart, trimEnd, duration]);

  return (
    <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto"
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="relative h-1 bg-white/20 rounded-full cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const seekTime = trimStart + (percent * effectiveDuration);
            seekTo(seekTime);
          }}>
            <div 
              className="absolute top-0 left-0 h-full bg-[#DC143C] rounded-full transition-all"
              style={{ width: `${(effectiveCurrentTime / effectiveDuration) * 100}%` }}
            />
            {/* Trim markers */}
            {trimStart > 0 && (
              <div 
                className="absolute top-0 h-full w-0.5 bg-green-500"
                style={{ left: '0%' }}
              />
            )}
            {trimEnd && trimEnd < duration && (
              <div 
                className="absolute top-0 h-full w-0.5 bg-red-500"
                style={{ left: `${((trimEnd - trimStart) / effectiveDuration) * 100}%` }}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={() => seek(-5)}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label="Rewind 5 seconds"
          >
            <SkipBack className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={() => seek(5)}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label="Forward 5 seconds"
          >
            <SkipForward className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-white text-sm">
              {formatTime(effectiveCurrentTime)} / {formatTime(effectiveDuration)}
            </span>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20"
          />

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

