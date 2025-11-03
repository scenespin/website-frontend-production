'use client';

/**
 * Library Sub-Navigation Component
 * 
 * Horizontal tab bar for Library section (Desktop)
 * Dropdown menu for Library section (Mobile)
 * - Projects
 * - Videos
 * - Music
 * - Assets
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileText, Video, Music, Image, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LibraryTab = 'projects' | 'videos' | 'music' | 'assets';

interface LibrarySubNavProps {
  activeTab?: LibraryTab;
  className?: string;
}

const TABS = [
  {
    id: 'projects' as LibraryTab,
    label: 'Projects',
    href: '/dashboard',
    icon: FileText,
    description: 'Your screenplays',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'videos' as LibraryTab,
    label: 'Videos',
    href: '/assets?type=video',
    icon: Video,
    description: 'Generated clips',
    color: 'text-purple-500',
    activeColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'music' as LibraryTab,
    label: 'Music',
    href: '/assets?type=audio',
    icon: Music,
    description: 'Audio library',
    color: 'text-green-500',
    activeColor: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'assets' as LibraryTab,
    label: 'All Assets',
    href: '/assets',
    icon: Image,
    description: 'All media files',
    color: 'text-cyan-500',
    activeColor: 'text-cyan-600 dark:text-cyan-400'
  }
] as const;

export function LibrarySubNav({ activeTab, className }: LibrarySubNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  
  // Auto-determine active tab from pathname/query if not provided
  const determineActiveTab = (): LibraryTab => {
    if (activeTab) return activeTab;
    if (pathname?.includes('/dashboard')) return 'projects';
    
    const typeParam = searchParams?.get('type');
    if (typeParam === 'video') return 'videos';
    if (typeParam === 'audio') return 'music';
    if (pathname?.includes('/assets')) return 'assets';
    
    return 'assets';
  };

  const currentTab = determineActiveTab();
  const activeTabData = TABS.find(tab => tab.id === currentTab);

  return (
    <>
      {/* Desktop Tabs */}
      <div className={cn(
        "hidden md:block border-b border-base-300 bg-base-200",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
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
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? tab.activeColor : tab.color
                  )} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div className={cn(
        "md:hidden border-b border-base-300 bg-base-200",
        className
      )}>
        <div className="px-4 py-2">
          <div className="dropdown w-full">
            <button
              tabIndex={0}
              onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
              className="btn btn-ghost w-full justify-between normal-case text-base"
            >
              <div className="flex items-center gap-2">
                {activeTabData && <activeTabData.icon className="w-5 h-5" />}
                <span className="font-semibold">{activeTabData?.label || 'Library'}</span>
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
                  const isActive = currentTab === tab.id;

                  return (
                    <li key={tab.id}>
                      <Link
                        href={tab.href}
                        className={cn(
                          "flex items-center gap-3",
                          isActive && "active bg-cinema-red/10 text-cinema-red font-semibold"
                        )}
                        onClick={() => setIsMobileDropdownOpen(false)}
                      >
                        <Icon className={cn("w-5 h-5", tab.color)} />
                        <div>
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs opacity-60">{tab.description}</div>
                        </div>
                      </Link>
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

