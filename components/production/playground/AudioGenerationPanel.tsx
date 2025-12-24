'use client';

/**
 * Audio Generation Panel
 * 
 * Reuses AudioModePanel logic for Playground audio generation.
 * Supports: Background Music, Sound Effects, Soundtracks
 */

import React from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioModePanel } from '@/components/modes/AudioModePanel';

interface AudioGenerationPanelProps {
  className?: string;
}

export function AudioGenerationPanel({ className = '' }: AudioGenerationPanelProps) {
  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A] p-4 md:p-6", className)}>
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Music className="w-6 h-6 text-cinema-red" />
          <h2 className="text-xl font-semibold text-white">Audio Generation</h2>
        </div>
        <p className="text-sm text-[#808080]">
          Generate background music, sound effects, and soundtracks using AI.
        </p>
      </div>

      <div className="flex-1">
        <AudioModePanel onInsert={null} />
      </div>
    </div>
  );
}


