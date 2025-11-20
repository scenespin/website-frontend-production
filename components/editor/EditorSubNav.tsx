'use client';

/**
 * Editor Sub-Navigation Component
 * 
 * Horizontal tab bar for Editor section (Desktop)
 * Dropdown menu for Editor section (Mobile)
 * - Write (Screenplay Editor)
 * - Characters
 * - Locations
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileText, Users, MapPin, ChevronDown, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditableScreenplayTitle from './EditableScreenplayTitle';
import ScreenplaySettingsModal from './ScreenplaySettingsModal';
import ScreenplaySwitcher from './ScreenplaySwitcher';

export type EditorTab = 'write' | 'characters' | 'locations';

interface EditorSubNavProps {
  activeTab?: EditorTab;
  className?: string;
  projectId?: string; // For context navigation
}

const TABS = [
  {
    id: 'write' as EditorTab,
    label: 'Write',
    href: '/write',
    icon: FileText,
    description: 'Screenplay editor',
    color: 'text-blue-500',
    activeColor: 'text-blue-600 dark:text-blue-400'
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
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Auto-determine active tab from pathname if not provided
  const determineActiveTab = (): EditorTab => {
    if (activeTab) return activeTab;
    if (pathname?.includes('/characters')) return 'characters';
    if (pathname?.includes('/locations')) return 'locations';
    return 'write';
  };

  const currentTab = determineActiveTab();
  const currentProjectId = projectId || searchParams?.get('project') || searchParams?.get('projectId');
  const activeTabData = TABS.find(tab => tab.id === currentTab);

  return (
    <>
      {/* Desktop Tabs */}
      <div className={cn(
        "hidden md:block border-b border-base-300 bg-base-200",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3 py-2 border-b border-base-300">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <EditableScreenplayTitle />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ScreenplaySwitcher />
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-base-300 rounded transition-colors flex-shrink-0"
                title="Screenplay settings"
              >
                <Settings className="w-4 h-4 text-base-content/60 hover:text-base-content" />
              </button>
            </div>
          </div>
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              // Build href with projectId context
              const href = currentProjectId 
                ? `${tab.href}?project=${currentProjectId}`
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

      {/* Mobile Dropdown */}
      <div className={cn(
        "md:hidden border-b border-base-300 bg-base-200",
        className
      )}>
        <div className="px-4 py-2 border-b border-base-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <EditableScreenplayTitle />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ScreenplaySwitcher />
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 hover:bg-base-300 rounded transition-colors flex-shrink-0"
              title="Screenplay settings"
            >
              <Settings className="w-4 h-4 text-base-content/60 hover:text-base-content" />
            </button>
          </div>
        </div>
        <div className="px-4 py-2">
          <div className="dropdown w-full">
            <button
              tabIndex={0}
              onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
              className="btn btn-ghost w-full justify-between normal-case text-base"
            >
              <div className="flex items-center gap-2">
                {activeTabData && <activeTabData.icon className="w-5 h-5" />}
                <span className="font-semibold">{activeTabData?.label || 'Editor'}</span>
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
                  const href = currentProjectId 
                    ? `${tab.href}?project=${currentProjectId}`
                    : tab.href;

                  return (
                    <li key={tab.id}>
                      <Link
                        href={href}
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

      {/* Settings Modal */}
      <ScreenplaySettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}

