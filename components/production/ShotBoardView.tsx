'use client';

/**
 * Shot Board View
 *
 * Wrapper for the Shot Board tab with sub-tabs: First frames | Videos.
 * - First frames: strip of first frames per scene/shot with variation cycling and Generate video.
 * - Videos: link-style browser of all videos (scene/shot/date), click to play.
 */

import React, { useState } from 'react';
import { Film, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShotBoardPanel } from './ShotBoardPanel';
import { VideoBrowserPanel } from './VideoBrowserPanel';

export type ShotBoardSubTab = 'first-frames' | 'videos';

interface ShotBoardViewProps {
  className?: string;
  onNavigateToSceneBuilder?: () => void;
}

const SUB_TABS: { id: ShotBoardSubTab; label: string; icon: typeof Film }[] = [
  { id: 'first-frames', label: 'First frames', icon: Film },
  { id: 'videos', label: 'Videos', icon: Video },
];

export function ShotBoardView({ className = '', onNavigateToSceneBuilder }: ShotBoardViewProps) {
  const [subTab, setSubTab] = useState<ShotBoardSubTab>('first-frames');

  return (
    <div className={cn('h-full flex flex-col bg-[#0A0A0A]', className)}>
      {/* Sub-tab bar */}
      <div className="flex-shrink-0 border-b border-[#3F3F46] px-4">
        <div className="flex gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px]',
                  isActive
                    ? 'border-[#DC143C] text-white'
                    : 'border-transparent text-[#808080] hover:text-white hover:bg-[#1A1A1A]'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${tab.label} sub-tab`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {subTab === 'first-frames' && (
          <ShotBoardPanel
            className="h-full"
            onNavigateToSceneBuilder={onNavigateToSceneBuilder}
          />
        )}
        {subTab === 'videos' && (
          <VideoBrowserPanel className="h-full" />
        )}
      </div>
    </div>
  );
}
