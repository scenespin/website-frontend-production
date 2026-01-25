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
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, GripVertical } from 'lucide-react';
import { prefetchVideo, canPlayVideoFormat, revokeBlobUrl } from '@/utils/videoPrefetch';

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
  onTrimChange,
  enableTrimHandles = false,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchProgress, setPrefetchProgress] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [codecSupported, setCodecSupported] = useState<boolean | null>(null);
  const [draggingTrim, setDraggingTrim] = useState<'start' | 'end' | null>(null);
  const [useOriginalUrl, setUseOriginalUrl] = useState(false); // Fallback flag if Blob URL fails

  // Get effective duration (trimmed or full)
  const effectiveDuration = trimEnd && trimEnd > 0 ? trimEnd - trimStart : duration;
  const effectiveCurrentTime = Math.max(0, currentTime - trimStart);

  // Check codec support before loading
  useEffect(() => {
    if (!src) return;
    
    const { supported, format, codecSupport } = canPlayVideoFormat(src);
    setCodecSupported(supported);
    
    console.log('[VideoPlayer] Codec detection:', {
      url: src.substring(0, 100),
      format,
      supported,
      codecSupport
    });
    
    if (!supported) {
      console.warn('[VideoPlayer] Codec may not be supported:', format, codecSupport);
      // Don't call onError here - let the video element try to load first
      // The actual error will come from the video element if it truly can't play
    }
  }, [src]);

  // Prefetch video to Blob URL (fixes CORS/format issues)
  useEffect(() => {
    if (!src || src.startsWith('blob:')) {
      // Already a blob URL or no src
      return;
    }

    // Check if we should prefetch (only for presigned URLs or remote URLs)
    const shouldPrefetch = src.includes('amazonaws.com') || src.includes('?') || src.startsWith('http');
    
    if (!shouldPrefetch) {
      return;
    }

    let currentBlobUrl: string | null = null;
    setIsPrefetching(true);
    setPrefetchProgress(0);

    prefetchVideo(src, {
      onProgress: (progress) => setPrefetchProgress(progress),
      timeout: 30000,
    })
      .then((blob) => {
        console.log('[VideoPlayer] Prefetch successful, using Blob URL:', blob.substring(0, 50));
        currentBlobUrl = blob;
        setBlobUrl(blob);
        setIsPrefetching(false);
      })
      .catch((error) => {
        console.warn('[VideoPlayer] Prefetch failed, falling back to original URL:', error.message);
        setIsPrefetching(false);
        setBlobUrl(null); // Fallback to original URL
        // Don't call onError here - let the video element try the original URL
        // The error will come from the video element if it truly can't play
      });

    // Cleanup on unmount or src change
    return () => {
      if (currentBlobUrl) {
        revokeBlobUrl(currentBlobUrl);
      }
    };
  }, [src, onError]);

  // Reset fallback flag when src changes
  useEffect(() => {
    setUseOriginalUrl(false);
  }, [src]);

  // Reload video when videoSrc changes (e.g., when falling back to original URL)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    // Only reload if src actually changed
    if (video.src !== videoSrc) {
      video.src = videoSrc;
      video.load();
    }
  }, [videoSrc]);

  // Use original URL if Blob URL failed, otherwise use Blob URL if available, otherwise use original src
  const videoSrc = useOriginalUrl ? src : (blobUrl || src);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        revokeBlobUrl(blobUrl);
      }
    };
  }, [blobUrl]);

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
  }, [videoSrc]);

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
      
      // 🔥 FALLBACK: If Blob URL fails, try original URL
      const isBlobUrl = videoSrc.startsWith('blob:');
      if (isBlobUrl && !useOriginalUrl && src && src !== videoSrc) {
        console.warn('[VideoPlayer] Blob URL failed, falling back to original URL');
        setUseOriginalUrl(true);
        setBlobUrl(null); // Clear blob URL
        // Revoke the failed blob URL to free memory
        if (blobUrl) {
          revokeBlobUrl(blobUrl);
        }
        // Reset video and try again with original URL
        video.load();
        return; // Don't show error yet, try original URL first
      }
      
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
            const urlLower = videoSrc.toLowerCase();
            const fileExtension = urlLower.match(/\.(mp4|mov|webm|mkv|avi|m4v)(\?|$)/)?.[1] || 'unknown';
            const isBlobUrlError = videoSrc.startsWith('blob:');
            errorDetails = `Your browser does not support this video format. File extension: ${fileExtension}. ${isBlobUrlError ? 'Tried prefetched Blob URL and original URL - both failed.' : 'Using original presigned URL.'} The file may use an unsupported codec (e.g., H.265/HEVC). Supported: MP4 (H.264), WebM, MOV.`;
            break;
        }
      }
      
      // Extract file info from URL for better diagnostics
      const urlMatch = videoSrc.match(/([^\/\?]+\.(mp4|mov|webm|mkv|avi|m4v))(\?|$)/i);
      const fileName = urlMatch ? urlMatch[1] : 'unknown';
      const detectedExtension = urlMatch ? urlMatch[2] : 'unknown';
      
      // Check codec support (use original src, not videoSrc, for detection)
      const { supported, format, codecSupport } = canPlayVideoFormat(src);
      
      // Log detailed error information for debugging
      console.warn('[VideoPlayer] Video error details:', {
        errorCode: video.error?.code,
        errorMessage,
        errorDetails,
        videoSrc: videoSrc.substring(0, 150),
        originalSrc: src.substring(0, 150),
        isBlobUrl: videoSrc.startsWith('blob:'),
        fileName,
        detectedExtension,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState,
        codecDetection: {
          format,
          supported,
          codecSupport
        },
        canPlayType: {
          'video/mp4': video.canPlayType('video/mp4'),
          'video/webm': video.canPlayType('video/webm'),
          'video/quicktime': video.canPlayType('video/quicktime'),
          'H.264': video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
          'H.265': video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"'),
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
  }, [trimStart, trimEnd, onTimeUpdate, onEnded, onError, videoSrc, src, useOriginalUrl, blobUrl]);

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
        src={videoSrc}
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
        {/* Progress Bar with Trim Handles */}
        <div className="mb-3">
          <div 
            ref={progressBarRef}
            className="relative h-2 bg-white/20 rounded-full cursor-pointer"
            onClick={(e) => {
              if (draggingTrim) return; // Don't seek while dragging trim
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const seekTime = trimStart + (percent * effectiveDuration);
              seekTo(seekTime);
            }}
            onMouseMove={(e) => {
              if (!draggingTrim || !progressBarRef.current || !duration) return;
              
              const rect = progressBarRef.current.getBoundingClientRect();
              const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const newTime = percent * duration;
              
              if (draggingTrim === 'start') {
                const currentEnd = trimEnd || duration;
                const newStart = Math.max(0, Math.min(newTime, currentEnd - 0.1));
                if (onTrimChange && Math.abs(newStart - (trimStart || 0)) > 0.05) {
                  onTrimChange(newStart, currentEnd);
                }
              } else if (draggingTrim === 'end') {
                const currentStart = trimStart || 0;
                const newEnd = Math.max(currentStart + 0.1, Math.min(newTime, duration));
                if (onTrimChange && Math.abs(newEnd - (trimEnd || duration)) > 0.05) {
                  onTrimChange(currentStart, newEnd);
                }
              }
            }}
            onMouseUp={() => setDraggingTrim(null)}
            onMouseLeave={() => setDraggingTrim(null)}
          >
            {/* Progress fill - shows current playback position within trimmed area */}
            {duration > 0 && (
              <div 
                className="absolute top-0 left-0 h-full bg-[#DC143C] rounded-full transition-all"
                style={{ 
                  left: `${(trimStart / duration) * 100}%`,
                  width: trimEnd 
                    ? `${Math.min(((currentTime - trimStart) / (trimEnd - trimStart)) * 100, 100)}%`
                    : `${(currentTime / duration) * 100}%`,
                  maxWidth: trimEnd ? `${((trimEnd - trimStart) / duration) * 100}%` : '100%'
                }}
              />
            )}
            
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
            {enableTrimHandles && trimStart > 0 && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${
                  draggingTrim === 'start' ? 'scale-110 ring-2 ring-green-300' : ''
                }`}
                style={{ left: `calc(${(trimStart / duration) * 100}% - 8px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingTrim('start');
                }}
                title={`Trim start: ${trimStart.toFixed(2)}s`}
              >
                <GripVertical className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            )}
            
            {/* Trim End Handle */}
            {enableTrimHandles && trimEnd && trimEnd < duration && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${
                  draggingTrim === 'end' ? 'scale-110 ring-2 ring-red-300' : ''
                }`}
                style={{ left: `calc(${(trimEnd / duration) * 100}% - 8px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingTrim('end');
                }}
                title={`Trim end: ${trimEnd.toFixed(2)}s`}
              >
                <GripVertical className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            )}
            
            {/* Trim markers (non-draggable fallback) */}
            {!enableTrimHandles && trimStart > 0 && (
              <div 
                className="absolute top-0 h-full w-0.5 bg-green-500"
                style={{ left: `${(trimStart / duration) * 100}%` }}
              />
            )}
            {!enableTrimHandles && trimEnd && trimEnd < duration && (
              <div 
                className="absolute top-0 h-full w-0.5 bg-red-500"
                style={{ left: `${(trimEnd / duration) * 100}%` }}
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
      {(isLoading || isPrefetching) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
          {isPrefetching && (
            <div className="w-48 bg-white/20 rounded-full h-1">
              <div 
                className="bg-[#DC143C] h-1 rounded-full transition-all"
                style={{ width: `${prefetchProgress * 100}%` }}
              />
            </div>
          )}
          {isPrefetching && (
            <p className="text-white text-xs mt-2">Loading video... {Math.round(prefetchProgress * 100)}%</p>
          )}
        </div>
      )}
      
      {/* Codec warning */}
      {codecSupported === false && !isLoading && (
        <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-xs px-2 py-1 rounded">
          Format may not be supported
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

