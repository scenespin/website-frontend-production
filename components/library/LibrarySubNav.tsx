'use client';

/**
 * Library Sub-Navigation Component
 * 
 * Horizontal tab bar for Library section:
 * - Projects
 * - Videos
 * - Music
 * - Assets
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileText, Video, Music, Image } from 'lucide-react';
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
    label: 'Assets',
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

  return (
    <div className={cn(
      "border-b border-base-300 bg-base-200",
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
  );
}

