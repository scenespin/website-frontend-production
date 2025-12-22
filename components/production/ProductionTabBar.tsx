'use client';

/**
 * Production Tab Bar Component
 * 
 * Horizontal tab navigation with expandable sub-tabs
 * - Top level: Library | Studio | Jobs | Media | Playground
 * - Library expands to: Characters | Locations | Assets
 * - Studio expands to: Action | Scenes
 * 
 * Feature: Production Hub Redesign - Sub-navigation Groups
 */

import React from 'react';
import { Film, Clapperboard, BriefcaseBusiness, Sparkles, Users, MapPin, Package, FolderOpen, Library, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductionTab = 'characters' | 'locations' | 'assets' | 'scene-builder' | 'scenes' | 'jobs' | 'media' | 'playground';

type TabGroup = 'library' | 'studio';

interface ProductionTabBarProps {
  activeTab: ProductionTab;
  onTabChange: (tab: ProductionTab) => void;
  jobCount?: number; // Badge for active jobs
}

// Sub-tabs for Library group
const LIBRARY_SUBTABS = [
  {
    id: 'characters' as ProductionTab,
    label: 'Characters',
    icon: Users,
    description: 'Character bank & references',
  },
  {
    id: 'locations' as ProductionTab,
    label: 'Locations',
    icon: MapPin,
    description: 'Location bank & references',
  },
  {
    id: 'assets' as ProductionTab,
    label: 'Assets',
    icon: Package,
    description: 'Props, vehicles & furniture',
  },
] as const;

// Sub-tabs for Studio group
const STUDIO_SUBTABS = [
  {
    id: 'scene-builder' as ProductionTab,
    label: 'Action',
    icon: Clapperboard,
    description: 'Script-based scene generation',
  },
  {
    id: 'scenes' as ProductionTab,
    label: 'Scenes',
    icon: Film,
    description: 'Scene videos & storyboard',
  },
] as const;

// Top-level tabs
const TOP_LEVEL_TABS = [
  {
    id: 'library' as TabGroup,
    label: 'Library',
    icon: Library,
    description: 'Character, location & asset banks',
    subTabs: LIBRARY_SUBTABS,
  },
  {
    id: 'studio' as TabGroup,
    label: 'Studio',
    icon: Video,
    description: 'Scene generation & videos',
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
    icon: Sparkles,
    description: 'Creative possibilities & workflows',
  },
] as const;

export function ProductionTabBar({
  activeTab,
  onTabChange,
  jobCount = 0
}: ProductionTabBarProps) {
  // Determine which group is active (if any)
  const isLibraryActive = ['characters', 'locations', 'assets'].includes(activeTab);
  const isStudioActive = ['scene-builder', 'scenes'].includes(activeTab);
  
  // Get active sub-tab for each group
  const activeLibrarySubTab = isLibraryActive ? activeTab : null;
  const activeStudioSubTab = isStudioActive ? activeTab : null;

  return (
    <div className="border-b border-white/10 bg-[#141414]">
      <div className="max-w-7xl mx-auto">
        {/* Top-level tabs */}
        <div className="flex gap-1 overflow-x-auto px-4">
          {TOP_LEVEL_TABS.map((tab) => {
            // Handle group tabs (library, studio)
            if ('subTabs' in tab) {
              const isGroupActive = tab.id === 'library' ? isLibraryActive : isStudioActive;
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
                          "border-[#DC143C]",
                          "bg-[#DC143C]/10",
                          "text-[#DC143C]"
                        )
                      : cn(
                          "border-transparent",
                          "text-white/60",
                          "hover:text-white/90",
                          "hover:bg-white/5"
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
                        "border-[#DC143C]",
                        "bg-[#DC143C]/10",
                        "text-[#DC143C]"
                      )
                    : cn(
                        "border-transparent",
                        "text-white/60",
                        "hover:text-white/90",
                        "hover:bg-white/5"
                      )
                )}
                aria-current={isActive ? 'page' : undefined}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>

                {/* Badge for Jobs count */}
                {showBadge && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full",
                    "text-xs font-bold",
                    "bg-[#DC143C] text-white",
                    "min-w-[18px] text-center"
                  )}>
                    {jobCount > 99 ? '99+' : jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-tabs for Library group */}
        {isLibraryActive && (
          <div className="border-t border-white/5 bg-[#0F0F0F]">
            <div className="flex gap-1 overflow-x-auto px-4">
              {LIBRARY_SUBTABS.map((subTab) => {
                const Icon = subTab.icon;
                const isActive = activeTab === subTab.id;

                return (
                  <button
                    key={subTab.id}
                    onClick={() => onTabChange(subTab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 font-medium text-xs",
                      "transition-colors duration-200",
                      "border-b-2 -mb-[2px]",
                      "whitespace-nowrap",
                      isActive
                        ? cn(
                            "border-[#DC143C]",
                            "bg-[#DC143C]/10",
                            "text-[#DC143C]"
                          )
                        : cn(
                            "border-transparent",
                            "text-white/50",
                            "hover:text-white/80",
                            "hover:bg-white/5"
                          )
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={subTab.description}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{subTab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub-tabs for Studio group */}
        {isStudioActive && (
          <div className="border-t border-white/5 bg-[#0F0F0F]">
            <div className="flex gap-1 overflow-x-auto px-4">
              {STUDIO_SUBTABS.map((subTab) => {
                const Icon = subTab.icon;
                const isActive = activeTab === subTab.id;

                return (
                  <button
                    key={subTab.id}
                    onClick={() => onTabChange(subTab.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 font-medium text-xs",
                      "transition-colors duration-200",
                      "border-b-2 -mb-[2px]",
                      "whitespace-nowrap",
                      isActive
                        ? cn(
                            "border-[#DC143C]",
                            "bg-[#DC143C]/10",
                            "text-[#DC143C]"
                          )
                        : cn(
                            "border-transparent",
                            "text-white/50",
                            "hover:text-white/80",
                            "hover:bg-white/5"
                          )
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={subTab.description}
                  >
                    <Icon className="w-3.5 h-3.5" />
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

