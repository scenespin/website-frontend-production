/**
 * Track Header Component
 * 
 * Header for timeline tracks with controls and visual indicators
 * Supports both video and audio tracks
 */

'use client';

import React from 'react';
import { Film, Music, Volume2, VolumeX, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { TrackType } from '@/hooks/useTimeline';

interface TrackHeaderProps {
  trackNumber: number;
  trackType: TrackType;
  isVisible?: boolean;
  isLocked?: boolean;
  isMuted?: boolean;
  volume?: number;
  onToggleVisible?: () => void;
  onToggleLock?: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number) => void;
}

export function TrackHeader({
  trackNumber,
  trackType,
  isVisible = true,
  isLocked = false,
  isMuted = false,
  volume = 1,
  onToggleVisible,
  onToggleLock,
  onToggleMute,
  onVolumeChange
}: TrackHeaderProps) {
  const isVideo = trackType === 'video';
  const displayTrackNum = trackNumber + 1; // Display as 1-indexed

  return (
    <div className={`
      h-full flex items-center justify-between px-3 border-r border-slate-200 dark:border-slate-700
      ${isVideo ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'}
    `}>
      {/* Track Icon & Number */}
      <div className="flex items-center gap-2">
        {isVideo ? (
          <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
        )}
        <span className={`text-xs font-mono font-bold ${
          isVideo ? 'text-blue-800 dark:text-blue-300' : 'text-green-800 dark:text-green-300'
        }`}>
          {isVideo ? 'V' : 'A'}{displayTrackNum}
        </span>
      </div>

      {/* Track Controls */}
      <div className="flex items-center gap-1">
        {/* Visibility Toggle (Video only) */}
        {isVideo && onToggleVisible && (
          <button
            onClick={onToggleVisible}
            className={`p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors ${
              !isVisible ? 'opacity-40' : ''
            }`}
            title={isVisible ? 'Hide track' : 'Show track'}
          >
            {isVisible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Mute Toggle (Audio only) */}
        {!isVideo && onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors ${
              isMuted ? 'opacity-40' : ''
            }`}
            title={isMuted ? 'Unmute track' : 'Mute track'}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Lock Toggle */}
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors ${
              isLocked ? 'opacity-40' : ''
            }`}
            title={isLocked ? 'Unlock track' : 'Lock track'}
          >
            {isLocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Volume Slider (Audio only, compact) */}
      {!isVideo && onVolumeChange && (
        <div className="flex items-center gap-1 ml-2">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      )}
    </div>
  );
}

