'use client';

/**
 * Direct Tab Bar Component
 *
 * Scene Builder | Shots | Videos | Video Gen
 */

import React from 'react';
import { Clapperboard, Film, Video, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DirectTab = 'scene-builder' | 'shots' | 'videos' | 'video-gen';

interface DirectTabBarProps {
  activeTab: DirectTab;
  onTabChange: (tab: DirectTab) => void;
}

const DIRECT_TABS = [
  {
    id: 'scene-builder' as DirectTab,
    label: 'Scene Builder',
    icon: Clapperboard,
    description: 'Script-based scene generation',
  },
  {
    id: 'shots' as DirectTab,
    label: 'Shots',
    icon: Film,
    description: 'First frames per scene and shot',
  },
  {
    id: 'videos' as DirectTab,
    label: 'Videos',
    icon: Video,
    description: 'Browse and play all generated videos',
  },
  {
    id: 'video-gen' as DirectTab,
    label: 'Video Gen',
    icon: Wand2,
    description: 'Generate video from image or prompt',
  },
] as const;

export function DirectTabBar({
  activeTab,
  onTabChange,
}: DirectTabBarProps) {
  return (
    <div className="border-b border-white/10 bg-[#0A0A0A] w-full pb-2">
      <div className="flex gap-1 px-4">
        {DIRECT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
                "transition-colors duration-200",
                "border-b-2 -mb-[2px]",
                "whitespace-nowrap",
                isActive
                  ? cn(
                      "border-cinema-red",
                      "bg-base-100",
                      "text-base-content"
                    )
                  : cn(
                      "border-transparent",
                      "text-base-content/60",
                      "hover:text-base-content",
                      "hover:bg-base-100/50"
                    )
              )}
              aria-current={isActive ? 'page' : undefined}
              title={tab.description}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

