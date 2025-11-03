'use client';

/**
 * Production Tab Bar Component
 * 
 * Tabbed navigation for Production page (Desktop)
 * Dropdown navigation for Production page (Mobile)
 * - Workflows (guided, workflow-based)
 * - Scene Builder (advanced, script-based)
 * - Characters (character management)
 * - Locations (location references)
 * - Assets (props, vehicles & furniture)
 * - Jobs (workflow history)
 */

import React, { useState } from 'react';
import { Film, Clapperboard, Users, BriefcaseBusiness, Sparkles, MapPin, Package, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductionTab = 'workflows' | 'scene-builder' | 'characters' | 'locations' | 'assets' | 'jobs';

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
    id: 'locations' as ProductionTab,
    label: 'Locations',
    icon: MapPin,
    description: 'Location references',
    color: 'text-pink-500',
    activeColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'assets' as ProductionTab,
    label: 'Assets',
    icon: Package,
    description: 'Props, vehicles & furniture',
    color: 'text-cyan-500',
    activeColor: 'text-cyan-600 dark:text-cyan-400',
    badge: 'NEW!'
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
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const activeTabData = TABS.find(tab => tab.id === activeTab);

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:block border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex flex-row space-x-1 px-6">
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

                {/* NEW Badge */}
                {'badge' in tab && tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">
                    {tab.badge}
                  </span>
                )}

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
                {isActive && (
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
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="px-4 py-2">
          <div className="dropdown w-full">
            <button
              tabIndex={0}
              onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
              className="btn btn-ghost w-full justify-between normal-case text-base"
            >
              <div className="flex items-center gap-2">
                {activeTabData && <activeTabData.icon className="w-5 h-5" />}
                <span className="font-semibold">{activeTabData?.label || 'Production'}</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                isMobileDropdownOpen && "rotate-180"
              )} />
            </button>
            {isMobileDropdownOpen && (
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-full mt-2 z-50"
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const showBadge = tab.id === 'jobs' && jobCount > 0;

                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => {
                          onTabChange(tab.id);
                          setIsMobileDropdownOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3",
                          isActive && "active bg-cinema-red/10 text-cinema-red font-semibold"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", tab.color)} />
                        <div className="flex-grow">
                          <div className="font-medium flex items-center gap-2">
                            {tab.label}
                            {'badge' in tab && tab.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">
                                {tab.badge}
                              </span>
                            )}
                            {showBadge && (
                              <span className="badge badge-primary badge-sm">{jobCount}</span>
                            )}
                          </div>
                          <div className="text-xs opacity-60">{tab.description}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

