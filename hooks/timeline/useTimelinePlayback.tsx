/**
 * useTimelinePlayback.tsx
 * Playback controls for timeline editor
 * Extracted from useTimeline.tsx for better modularity
 */

import { useCallback, useEffect } from 'react';

export interface TimelinePlaybackReturn {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
}

export function useTimelinePlayback(
  isPlaying: boolean,
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>,
  playheadPosition: number,
  setPlayheadPosition: React.Dispatch<React.SetStateAction<number>>,
  playbackIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  totalDuration: number,
  frameRate: number = 30
): TimelinePlaybackReturn {
  
  const frameDuration = 1 / frameRate;

  /**
   * Start playback
   */
  const play = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    playbackIntervalRef.current = setInterval(() => {
      setPlayheadPosition(prev => {
        const next = prev + frameDuration;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, frameDuration * 1000);
  }, [isPlaying, setIsPlaying, setPlayheadPosition, playbackIntervalRef, frameDuration, totalDuration]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, [setIsPlaying, playbackIntervalRef]);

  /**
   * Stop playback and reset to beginning
   */
  const stop = useCallback(() => {
    pause();
    setPlayheadPosition(0);
  }, [pause, setPlayheadPosition]);

  /**
   * Seek to specific time
   */
  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, totalDuration));
    setPlayheadPosition(clampedTime);
  }, [setPlayheadPosition, totalDuration]);

  /**
   * Skip forward by N seconds
   */
  const skipForward = useCallback((seconds: number) => {
    setPlayheadPosition(prev => {
      const next = prev + seconds;
      return Math.min(next, totalDuration);
    });
  }, [setPlayheadPosition, totalDuration]);

  /**
   * Skip backward by N seconds
   */
  const skipBackward = useCallback((seconds: number) => {
    setPlayheadPosition(prev => {
      const next = prev - seconds;
      return Math.max(0, next);
    });
  }, [setPlayheadPosition]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [playbackIntervalRef]);

  /**
   * Auto-pause when reaching end
   */
  useEffect(() => {
    if (isPlaying && playheadPosition >= totalDuration) {
      pause();
    }
  }, [isPlaying, playheadPosition, totalDuration, pause]);

  return {
    play,
    pause,
    stop,
    seekTo,
    skipForward,
    skipBackward
  };
}

