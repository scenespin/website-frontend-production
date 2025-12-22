'use client';

/**
 * Production Tab Bar Component
 * 
 * Horizontal tab navigation matching Creation area styling
 * - Overview, Scene Builder, Scenes, Media, Banks (dropdown), Jobs
 * 
 * Feature: Production Hub Redesign - Option 1
 */

import React from 'react';
import { Film, Clapperboard, BriefcaseBusiness, Sparkles, Users, MapPin, Package, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductionTab = 'characters' | 'locations' | 'assets' | 'scene-builder' | 'scenes' | 'jobs' | 'media' | 'playground';

interface ProductionTabBarProps {
  activeTab: ProductionTab;
  onTabChange: (tab: ProductionTab) => void;
  jobCount?: number; // Badge for active jobs
}

const TABS = [
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
  }
] as const;

export function ProductionTabBar({
  activeTab,
  onTabChange,
  jobCount = 0
}: ProductionTabBarProps) {
  return (
    <div className="border-b border-white/10 bg-[#141414]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
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
                  "whitespace-nowrap", // Prevent text wrapping
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
      </div>
    </div>
  );
}

