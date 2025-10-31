'use client';

/**
 * Production Tab Bar Component
 * 
 * Tabbed navigation for Production page with 4 tabs:
 * - Workflows (guided, workflow-based)
 * - Scene Builder (advanced, script-based)
 * - Characters (character management)
 * - Jobs (workflow history)
 */

import React from 'react';
import { Film, Clapperboard, Users, BriefcaseBusiness, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductionTab = 'workflows' | 'scene-builder' | 'characters' | 'jobs';

interface ProductionTabBarProps {
  activeTab: ProductionTab;
  onTabChange: (tab: ProductionTab) => void;
  isMobile?: boolean;
  jobCount?: number; // Badge for active jobs
}

const TABS = [
  {
    id: 'workflows' as ProductionTab,
    label: 'Workflows',
    icon: Sparkles,
    description: 'Guided video production',
    color: 'text-purple-500',
    activeColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'scene-builder' as ProductionTab,
    label: 'Scene Builder',
    icon: Clapperboard,
    description: 'Script-based production',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'characters' as ProductionTab,
    label: 'Characters',
    icon: Users,
    description: 'Character management',
    color: 'text-green-500',
    activeColor: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'jobs' as ProductionTab,
    label: 'Jobs',
    icon: BriefcaseBusiness,
    description: 'Workflow history',
    color: 'text-orange-500',
    activeColor: 'text-orange-600 dark:text-orange-400'
  }
] as const;

export function ProductionTabBar({
  activeTab,
  onTabChange,
  isMobile = false,
  jobCount = 0
}: ProductionTabBarProps) {
  
  // Mobile: Show only Workflows and Scene Builder (Advanced)
  const visibleTabs = isMobile 
    ? TABS.filter(t => t.id === 'workflows' || t.id === 'scene-builder')
    : TABS;

  return (
    <div className={cn(
      "border-b border-slate-200 dark:border-slate-700",
      "bg-white dark:bg-slate-900"
    )}>
      <div className={cn(
        "flex",
        isMobile ? "flex-row" : "flex-row space-x-1 px-6"
      )}>
        {visibleTabs.map((tab) => {
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
                isActive
                  ? cn(
                      "border-primary",
                      tab.activeColor,
                      "bg-slate-50 dark:bg-slate-800/50"
                    )
                  : cn(
                      "border-transparent",
                      "text-slate-600 dark:text-slate-400",
                      "hover:text-slate-900 dark:hover:text-slate-200",
                      "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    ),
                isMobile ? "flex-1 justify-center" : ""
              )}
              aria-current={isActive ? 'page' : undefined}
              title={tab.description}
            >
              <Icon className={cn(
                "w-4 h-4",
                isActive ? tab.activeColor : tab.color
              )} />
              
              <span className={cn(
                isMobile && "sr-only sm:not-sr-only"
              )}>
                {isMobile && tab.id === 'scene-builder' ? 'Advanced' : tab.label}
              </span>

              {/* Badge for Jobs count */}
              {showBadge && (
                <span className={cn(
                  "absolute -top-1 -right-1",
                  "px-1.5 py-0.5 rounded-full",
                  "text-xs font-bold",
                  "bg-primary text-white",
                  "min-w-[18px] text-center"
                )}>
                  {jobCount > 99 ? '99+' : jobCount}
                </span>
              )}

              {/* Active indicator */}
              {isActive && !isMobile && (
                <div className={cn(
                  "absolute left-0 right-0 bottom-0 h-0.5",
                  "bg-gradient-to-r from-transparent via-primary to-transparent",
                  "opacity-50"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile: Show description for active tab */}
      {isMobile && (
        <div className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
          {TABS.find(t => t.id === activeTab)?.description}
        </div>
      )}
    </div>
  );
}

