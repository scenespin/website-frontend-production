'use client';

/**
 * Editor Sub-Navigation Component
 * 
 * Horizontal tab bar for Editor section (Desktop)
 * Dropdown menu for Editor section (Mobile)
 * - Write (Screenplay Editor - Fountain format)
 * - Characters
 * - Locations
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileText, Users, MapPin, Package, ChevronDown, UserPlus, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditableScreenplayTitle from './EditableScreenplayTitle';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import CollaborationPanel from '@/components/collaboration/CollaborationPanel';
import RoleBadge from '@/components/collaboration/RoleBadge';
import ChangeHistoryPanel from '@/components/screenplay/ChangeHistoryPanel';

export type EditorTab = 'write' | 'characters' | 'locations' | 'props';

interface EditorSubNavProps {
  activeTab?: EditorTab;
  className?: string;
  screenplayId?: string; // Feature 0130: Use screenplayId (not projectId)
}

const TABS = [
  {
    id: 'write' as EditorTab,
    label: 'Write',
    href: '/write',
    icon: FileText,
    description: 'Screenplay editor (Fountain format)',
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
  },
  {
    id: 'props' as EditorTab,
    label: 'Props',
    href: '/props',
    icon: Package,
    description: 'Props & assets',
    color: 'text-orange-500',
    activeColor: 'text-orange-600 dark:text-orange-400'
  }
] as const;

export function EditorSubNav({ activeTab, className, screenplayId }: EditorSubNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isCollaborationPanelOpen, setIsCollaborationPanelOpen] = useState(false);
  const [isChangeHistoryPanelOpen, setIsChangeHistoryPanelOpen] = useState(false);
  const { screenplayId: contextScreenplayId, isOwner, currentUserRole, collaborators, permissionsLoading } = useScreenplay();
  
  // Auto-determine active tab from pathname if not provided
  const determineActiveTab = (): EditorTab => {
    if (activeTab) return activeTab;
    if (pathname?.includes('/characters')) return 'characters';
    if (pathname?.includes('/locations')) return 'locations';
    if (pathname?.includes('/props')) return 'props';
    return 'write';
  };

  const currentTab = determineActiveTab();
  
  // Feature 0130: Get screenplayId with fallback priority:
  // 1. Explicit prop (from parent component)
  // 2. URL parameter 'project' (primary URL param - query param name stays as 'project')
  // 3. URL parameter 'projectId' (legacy fallback - will be removed)
  // 4. ScreenplayContext screenplayId (persistent state)
  // Reject 'default' and 'proj_' IDs - only accept 'screenplay_' IDs
  const urlScreenplayId = searchParams?.get('project') || searchParams?.get('projectId');
  let currentScreenplayId = screenplayId || urlScreenplayId || contextScreenplayId;
  
  // Feature 0130: Validate and reject invalid IDs
  if (currentScreenplayId === 'default' || (currentScreenplayId && currentScreenplayId.startsWith('proj_'))) {
    console.warn('[EditorSubNav] ⚠️ Rejected invalid screenplayId:', currentScreenplayId);
    currentScreenplayId = contextScreenplayId; // Fall back to context if URL has invalid ID
  }
  
  // Only use screenplay_ IDs
  if (currentScreenplayId && !currentScreenplayId.startsWith('screenplay_')) {
    console.warn('[EditorSubNav] ⚠️ Invalid ID format, using context fallback:', currentScreenplayId);
    currentScreenplayId = contextScreenplayId;
  }
  
  const activeTabData = TABS.find(tab => tab.id === currentTab);

  return (
    <>
      {/* Desktop Tabs */}
      <div className={cn(
        "hidden md:block border-b border-white/10 bg-[#0A0A0A]",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3 py-2 border-b border-base-300">
            <EditableScreenplayTitle />
            <div className="flex items-center gap-2">
              {/* Show role badge if we have a role, or show loading indicator while permissions load */}
              {currentUserRole ? (
                <RoleBadge role={currentUserRole} size="sm" />
              ) : permissionsLoading ? (
                <div className="px-2 py-1 rounded border border-base-300 text-xs text-base-content/60">
                  Loading...
                </div>
              ) : null}
              {/* Show collaboration button if user is owner (permissions are loaded) */}
              {/* Only hide if we're certain user is NOT owner (permissions loaded and isOwner is false) */}
              {currentScreenplayId && (isOwner || currentUserRole === 'director') && (
                <button
                  onClick={() => setIsCollaborationPanelOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-300 rounded transition-colors"
                  title="Manage collaborators"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Collaborate</span>
                  {collaborators.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-content rounded-full">
                      {collaborators.length}
                    </span>
                  )}
                </button>
              )}
              {/* Show change history button for all users with access */}
              {currentScreenplayId && currentUserRole && (
                <button
                  onClick={() => setIsChangeHistoryPanelOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-300 rounded transition-colors"
                  title="View change history"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              // Build href with screenplayId context (URL param name stays as 'project' for compatibility)
              const href = currentScreenplayId 
                ? `${tab.href}?project=${currentScreenplayId}`
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
        <div className="px-4 py-2 border-b border-base-300">
          <EditableScreenplayTitle />
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
                  const href = currentScreenplayId 
                    ? `${tab.href}?project=${currentScreenplayId}`
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

      {/* Collaboration Panel */}
      <CollaborationPanel
        isOpen={isCollaborationPanelOpen}
        onClose={() => setIsCollaborationPanelOpen(false)}
      />

      {/* Change History Panel */}
      <ChangeHistoryPanel
        isOpen={isChangeHistoryPanelOpen}
        onClose={() => setIsChangeHistoryPanelOpen(false)}
      />
    </>
  );
}

