'use client';

/**
 * Production Tab Bar Component
 * 
 * Horizontal tab navigation with expandable sub-tabs
 * - Top level: References | AI Studio | Storage
 * - References expands to: Characters | Locations | Props
 * - AI Studio expands to: Scene Manifest | Scenes | Images | Video | Audio
 * - Playground is accessible via primary navigation (not in Production Hub tabs)
 * 
 * Feature: Production Hub Redesign - Sub-navigation Groups
 */

import React from 'react';
import { Users, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductionTab = 'characters' | 'locations' | 'assets';

interface ProductionTabBarProps {
  activeTab: ProductionTab;
  onTabChange: (tab: ProductionTab) => void;
}

// Produce tabs: Characters | Locations | Props
const PRODUCE_TABS = [
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

export function ProductionTabBar({
  activeTab,
  onTabChange
}: ProductionTabBarProps) {
  return (
    <div className="border-b border-white/10 bg-[#0A0A0A] w-full">
      <div className="flex gap-1 px-4">
        {PRODUCE_TABS.map((tab) => {
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
              <Icon className={cn(
                "w-4 h-4",
                isActive ? tab.activeColor : tab.color
              )} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

