'use client';

/**
 * Composition Sub-Navigation Component
 * 
 * Horizontal tab bar for Composition section:
 * - Production (Layout Studio)
 * - Music
 * - Dailies (Gallery)
 */

import React from 'react';
import { Sparkles, Music, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CompositionTab = 'create' | 'music' | 'gallery';

interface CompositionSubNavProps {
  activeTab: CompositionTab;
  onTabChange: (tab: CompositionTab) => void;
  className?: string;
}

const TABS = [
  {
    id: 'create' as CompositionTab,
    label: 'Production',
    icon: Sparkles,
    description: 'Layout studio & effects',
    color: 'text-red-500',
    activeColor: 'text-red-600 dark:text-red-400'
  },
  {
    id: 'music' as CompositionTab,
    label: 'Music',
    icon: Music,
    description: 'Audio library',
    color: 'text-purple-500',
    activeColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'gallery' as CompositionTab,
    label: 'Dailies',
    icon: History,
    description: 'Composition gallery',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400'
  }
] as const;

export function CompositionSubNav({ activeTab, onTabChange, className }: CompositionSubNavProps) {
  return (
    <div className={cn(
      "border-b border-white/10 bg-[#141414]",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1">
          {TABS.map((tab) => {
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

