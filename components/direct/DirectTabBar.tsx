'use client';

/**
 * Direct Tab Bar Component
 * 
 * Sub-navigation for Direct Hub:
 * - Scene Builder (renamed from Scene Manifest)
 * - Storyboard (renamed from Scenes)
 */

import React from 'react';
import { Clapperboard, Film, Palette, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DirectTab = 'scene-builder' | 'storyboard' | 'style-profiles' | 'soundscape';

interface DirectTabBarProps {
  activeTab: DirectTab;
  onTabChange: (tab: DirectTab) => void;
}

const DIRECT_TABS = [
  {
    id: 'style-profiles' as DirectTab,
    label: 'Style Profiles',
    icon: Palette,
    description: 'Analyze video styles for consistent generation',
  },
  {
    id: 'scene-builder' as DirectTab,
    label: 'Scene Builder',
    icon: Clapperboard,
    description: 'Script-based scene generation',
  },
  {
    id: 'storyboard' as DirectTab,
    label: 'Storyboard',
    icon: Film,
    description: 'Stitched scene videos & storyboard',
  },
  {
    id: 'soundscape' as DirectTab,
    label: 'Soundscape',
    icon: Music,
    description: 'AI-generated sound effects and music for videos',
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

