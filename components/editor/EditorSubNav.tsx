'use client';

/**
 * Editor Sub-Navigation Component
 * 
 * Horizontal tab bar for Editor section:
 * - Write (Screenplay Editor)
 * - Story Beats
 * - Characters
 * - Locations
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileText, BookOpen, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditorTab = 'write' | 'beats' | 'characters' | 'locations';

interface EditorSubNavProps {
  activeTab?: EditorTab;
  className?: string;
  projectId?: string; // For context navigation
}

const TABS = [
  {
    id: 'write' as EditorTab,
    label: 'Write',
    href: '/editor',
    icon: FileText,
    description: 'Screenplay editor',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'beats' as EditorTab,
    label: 'Story Beats',
    href: '/beats',
    icon: BookOpen,
    description: 'Narrative structure',
    color: 'text-purple-500',
    activeColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'characters' as EditorTab,
    label: 'Characters',
    href: '/characters',
    icon: Users,
    description: 'Cast management',
    color: 'text-green-500',
    activeColor: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'locations' as EditorTab,
    label: 'Locations',
    href: '/locations',
    icon: MapPin,
    description: 'Scene settings',
    color: 'text-pink-500',
    activeColor: 'text-pink-600 dark:text-pink-400'
  }
] as const;

export function EditorSubNav({ activeTab, className, projectId }: EditorSubNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Auto-determine active tab from pathname if not provided
  const determineActiveTab = (): EditorTab => {
    if (activeTab) return activeTab;
    if (pathname?.includes('/beats')) return 'beats';
    if (pathname?.includes('/characters')) return 'characters';
    if (pathname?.includes('/locations')) return 'locations';
    return 'write';
  };

  const currentTab = determineActiveTab();
  const currentProjectId = projectId || searchParams?.get('projectId');

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
            
            // Build href with projectId context
            const href = currentProjectId 
              ? `${tab.href}?projectId=${currentProjectId}`
              : tab.href;

            return (
              <Link
                key={tab.id}
                href={href}
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

