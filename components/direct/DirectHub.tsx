'use client';

/**
 * Direct Hub - Scene Builder & Storyboard
 * 
 * Contains:
 * - Scene Builder (renamed from Scene Manifest)
 * - Storyboard (renamed from Scenes)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { SceneBuilderPanel } from '@/components/production/SceneBuilderPanel';
import { ScenesPanel } from '@/components/production/ScenesPanel';
import { StyleProfilesPanel } from '@/components/production/StyleProfilesPanel';
import { ProductionErrorBoundary } from '@/components/production/ProductionErrorBoundary';
import { DirectTabBar, DirectTab } from './DirectTabBar';

export function DirectHub() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const screenplay = useScreenplay();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const screenplayId = screenplay.screenplayId;
  
  // State - sync with URL params
  const [activeTab, setActiveTab] = useState<DirectTab>('style-profiles');
  
  // Sync activeTab with URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as DirectTab | null;
    
    if (tabFromUrl && ['style-profiles', 'scene-builder', 'storyboard'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('style-profiles');
    }
  }, [searchParams]);

  // Update URL when activeTab changes
  const handleTabChange = (tab: DirectTab) => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    if (tab === 'style-profiles') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', tab);
    }
    router.push(newUrl.pathname + newUrl.search, { scroll: false });
  };

  // Early return if no screenplay
  if (!screenplayId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading screenplay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      {/* Tab Navigation - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <DirectTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-[#0A0A0A]">
        {activeTab === 'scene-builder' && (
          <div className="h-full overflow-y-auto">
            <SceneBuilderPanel
              projectId={screenplayId}
              isMobile={false}
              simplified={false}
            />
          </div>
        )}

        {activeTab === 'storyboard' && (
          <div className="h-full overflow-y-auto">
            <ScenesPanel
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'style-profiles' && (
          <div className="h-full overflow-y-auto">
            <StyleProfilesPanel
              projectId={screenplayId}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

