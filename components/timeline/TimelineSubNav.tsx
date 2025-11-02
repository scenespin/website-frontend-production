'use client';

/**
 * Timeline Sub-Navigation Component
 * 
 * Horizontal tab bar for Timeline section:
 * - Editor (Multi-track editor)
 * - Audio Sync
 * - Export
 */

import React from 'react';
import { Film, Music, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimelineTab = 'editor' | 'audio' | 'export';

interface TimelineSubNavProps {
  activeTab: TimelineTab;
  onTabChange: (tab: TimelineTab) => void;
  className?: string;
}

const TABS = [
  {
    id: 'editor' as TimelineTab,
    label: 'Editor',
    icon: Film,
    description: 'Multi-track editor',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'audio' as TimelineTab,
    label: 'Audio Sync',
    icon: Music,
    description: 'Audio synchronization',
    color: 'text-purple-500',
    activeColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'export' as TimelineTab,
    label: 'Export',
    icon: Download,
    description: 'Export & render',
    color: 'text-green-500',
    activeColor: 'text-green-600 dark:text-green-400'
  }
] as const;

export function TimelineSubNav({ activeTab, onTabChange, className }: TimelineSubNavProps) {
  return (
    <div className={cn(
      "border-b border-base-300 bg-base-200",
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
                        "border-cinema-red",
                        tab.activeColor,
                        "bg-base-100"
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
    </div>
  );
}

