'use client';

/**
 * Production Tab Bar Component
 * 
 * Horizontal tab navigation with expandable sub-tabs
 * - Top level: References | AI Studio | Jobs | Media | Playground
 * - References expands to: Characters | Locations | Props
 * - AI Studio expands to: Scene Manifest | Scenes | Images | Video | Audio
 * - Playground is a standalone top-level tab (not under AI Studio)
 * 
 * Feature: Production Hub Redesign - Sub-navigation Groups
 */

import React from 'react';
import { Film, Clapperboard, BriefcaseBusiness, Users, MapPin, Package, FolderOpen, Library, Video, Volume2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductionTab = 'characters' | 'locations' | 'assets' | 'scene-builder' | 'scenes' | 'images' | 'video' | 'audio' | 'jobs' | 'media' | 'playground';

type TabGroup = 'assets' | 'studio';

interface ProductionTabBarProps {
  activeTab: ProductionTab;
  onTabChange: (tab: ProductionTab) => void;
  jobCount?: number; // Badge for active jobs
}

// Sub-tabs for Assets group (matching Create section colors)
const ASSETS_SUBTABS = [
  {
    id: 'characters' as ProductionTab,
    label: 'Characters',
    icon: Users,
    description: 'Character bank & references',
    color: 'text-green-500',
    activeColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'locations' as ProductionTab,
    label: 'Locations',
    icon: MapPin,
    description: 'Location bank & references',
    color: 'text-pink-500',
    activeColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'assets' as ProductionTab,
    label: 'Props',
    icon: Package,
    description: 'Props, vehicles & furniture',
    color: 'text-orange-500',
    activeColor: 'text-orange-600 dark:text-orange-400',
  },
] as const;

// Sub-tabs for Studio group
const STUDIO_SUBTABS = [
  {
    id: 'scene-builder' as ProductionTab,
    label: 'Scene Manifest',
    icon: Clapperboard,
    description: 'Script-based scene generation',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'scenes' as ProductionTab,
    label: 'Scenes',
    icon: Film,
    description: 'Stitched scene videos & storyboard',
    color: 'text-purple-500',
    activeColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'images' as ProductionTab,
    label: 'Images',
    icon: ImageIcon,
    description: 'Generated images & references',
    color: 'text-cyan-500',
    activeColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'video' as ProductionTab,
    label: 'Video',
    icon: Video,
    description: 'Playground videos & manual uploads',
    color: 'text-yellow-500',
    activeColor: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'audio' as ProductionTab,
    label: 'Audio',
    icon: Volume2,
    description: 'Audio files & recordings',
    color: 'text-green-500',
    activeColor: 'text-green-600 dark:text-green-400',
  },
] as const;

// Top-level tabs
const TOP_LEVEL_TABS = [
  {
    id: 'assets' as TabGroup,
    label: 'References',
    icon: Library,
    description: 'Character, location & prop reference banks',
    subTabs: ASSETS_SUBTABS,
  },
  {
    id: 'studio' as TabGroup,
    label: 'AI Studio',
    icon: Video,
    description: 'AI scene generation & videos',
    subTabs: STUDIO_SUBTABS,
  },
  {
    id: 'jobs' as ProductionTab,
    label: 'Jobs',
    icon: BriefcaseBusiness,
    description: 'Workflow history',
  },
  {
    id: 'media' as ProductionTab,
    label: 'Media',
    icon: FolderOpen,
    description: 'Media Library & uploads',
  },
  {
    id: 'playground' as ProductionTab,
    label: 'Playground',
    icon: undefined,
    description: 'Creative possibilities & workflows',
  },
] as const;

export function ProductionTabBar({
  activeTab,
  onTabChange,
  jobCount = 0
}: ProductionTabBarProps) {
  // Determine which group is active (if any)
  const isAssetsActive = ['characters', 'locations', 'assets'].includes(activeTab);
  const isStudioActive = ['scene-builder', 'scenes', 'images', 'video', 'audio'].includes(activeTab);
  
  // Get active sub-tab for each group
  const activeAssetsSubTab = isAssetsActive ? activeTab : null;
  const activeStudioSubTab = isStudioActive ? activeTab : null;

  return (
    <div className="border-b border-white/10 bg-[#0A0A0A] w-full">
      <div className="w-full">
        {/* Top-level tabs */}
        <div className="flex flex-wrap gap-1 px-4">
          {TOP_LEVEL_TABS.map((tab) => {
            // Handle group tabs (assets, studio)
            if ('subTabs' in tab) {
              const isGroupActive = tab.id === 'assets' ? isAssetsActive : isStudioActive;
              const Icon = tab.icon;

  return (
                <button
                  key={tab.id}
                  onClick={() => {
                    // If group is not active, activate first sub-tab
                    // If group is active, do nothing (sub-tabs handle navigation)
                    if (!isGroupActive && tab.subTabs.length > 0) {
                      onTabChange(tab.subTabs[0].id);
                    }
                  }}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
                    "transition-colors duration-200",
                    "border-b-2 -mb-[2px]",
                    "whitespace-nowrap",
                    isGroupActive
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
                  aria-current={isGroupActive ? 'page' : undefined}
                  title={tab.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            }
            
            // Handle regular tabs (jobs, media, playground)
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'jobs' && jobCount > 0;

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
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>

                {/* Badge for Jobs count */}
                {showBadge && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full",
                    "text-xs font-bold",
                    "bg-cinema-red text-white",
                    "min-w-[18px] text-center"
                  )}>
                    {jobCount > 99 ? '99+' : jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-tabs for Assets group */}
        {isAssetsActive && (
          <div className="border-t border-white/10 bg-[#0A0A0A]">
            <div className="flex flex-wrap gap-1 px-4">
              {ASSETS_SUBTABS.map((subTab) => {
                const Icon = subTab.icon;
                const isActive = activeTab === subTab.id;

                return (
                  <button
                    key={subTab.id}
                    onClick={() => onTabChange(subTab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
                      "transition-colors duration-200",
                      "border-b-2 -mb-[2px]",
                      "whitespace-nowrap",
                      isActive
                        ? cn(
                            "border-transparent",
                            subTab.activeColor
                          )
                        : cn(
                            "border-transparent",
                            "text-base-content/60",
                            "hover:text-base-content"
                          )
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={subTab.description}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? subTab.activeColor : subTab.color
                    )} />
                    <span>{subTab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
        )}

        {/* Sub-tabs for Studio group */}
        {isStudioActive && (
          <div className="border-t border-white/10 bg-[#0A0A0A]">
            <div className="flex flex-wrap gap-1 px-4">
              {STUDIO_SUBTABS.map((subTab) => {
                const Icon = subTab.icon;
                const isActive = activeTab === subTab.id;

                  return (
                      <button
                    key={subTab.id}
                    onClick={() => onTabChange(subTab.id)}
                        className={cn(
                      "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
                      "transition-colors duration-200",
                      "border-b-2 -mb-[2px]",
                      "whitespace-nowrap",
                      isActive
                        ? cn(
                            "border-transparent",
                            subTab.activeColor
                          )
                        : cn(
                            "border-transparent",
                            "text-base-content/60",
                            "hover:text-base-content"
                          )
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={subTab.description}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? subTab.activeColor : subTab.color
                    )} />
                    <span>{subTab.label}</span>
                      </button>
                  );
                })}
            </div>
          </div>
            )}
          </div>
        </div>
  );
}

