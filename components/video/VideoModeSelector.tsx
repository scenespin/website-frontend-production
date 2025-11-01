/**
 * VideoModeSelector.tsx
 * Extracted from QuickVideoCard.tsx for better modularity
 * Handles selection of video generation mode (text-only, image-start, etc.)
 */

'use client';

import React from 'react';
import { Image as ImageIcon, Video, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type VideoMode = 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images';

interface VideoModeSelectorProps {
  selectedMode: VideoMode;
  onModeChange: (mode: VideoMode) => void;
  disabled?: boolean;
}

const VIDEO_MODES = [
  {
    value: 'text-only' as VideoMode,
    label: 'Text to Video',
    icon: Video,
    description: 'Generate video from prompt only'
  },
  {
    value: 'image-start' as VideoMode,
    label: 'Image to Video',
    icon: ImageIcon,
    description: 'Animate from starting image'
  },
  {
    value: 'image-interpolation' as VideoMode,
    label: 'Interpolation',
    icon: ArrowRight,
    description: 'Transition between two images'
  }
];

export function VideoModeSelector({ 
  selectedMode, 
  onModeChange,
  disabled = false 
}: VideoModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Video Mode
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {VIDEO_MODES.map(mode => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.value;
          
          return (
            <button
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              disabled={disabled}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/10 shadow-sm' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                    {mode.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {mode.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

