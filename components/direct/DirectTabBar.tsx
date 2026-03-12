'use client';

/**
 * Direct Tab Bar Component
 *
 * Scene Builder | Shots | Videos | Video Gen | Image Gen
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type DirectTab = 'scene-builder' | 'shots' | 'videos' | 'video-gen' | 'image-gen';

interface DirectTabBarProps {
  activeTab: DirectTab;
  onTabChange: (tab: DirectTab) => void;
}

const DIRECT_TABS = [
  {
    id: 'scene-builder' as DirectTab,
    label: 'Scene Builder',
    description: 'Script-based scene generation',
  },
  {
    id: 'shots' as DirectTab,
    label: 'Shots',
    description: 'First frames per scene and shot',
  },
  {
    id: 'videos' as DirectTab,
    label: 'Videos',
    description: 'Browse and play all generated videos',
  },
  {
    id: 'video-gen' as DirectTab,
    label: 'Video Gen',
    description: 'Generate video from image or prompt',
  },
  {
    id: 'image-gen' as DirectTab,
    label: 'Image Gen',
    description: 'Generate images from prompt or references',
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
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

