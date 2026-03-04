'use client';

/**
 * Direct Hub - Scene Builder | Shots | Videos | Video Gen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { SceneBuilderPanel } from '@/components/production/SceneBuilderPanel';
import { ShotBoardPanel } from '@/components/production/ShotBoardPanel';
import { VideoBrowserPanel } from '@/components/production/VideoBrowserPanel';
import { VideoGenerationTools } from '@/components/production/playground/VideoGenerationTools';
import { WorkflowCompletionPoller } from '@/components/production/WorkflowCompletionPoller';
import { useInFlightWorkflowJobsStore } from '@/lib/inFlightWorkflowJobsStore';
import { DirectTabBar, DirectTab } from './DirectTabBar';
import type { GenerateVideoContext } from '@/components/production/ShotBoardPanel';

const VALID_TABS: DirectTab[] = ['scene-builder', 'shots', 'videos', 'video-gen'];

export function DirectHub() {
  const screenplay = useScreenplay();
  const router = useRouter();
  const searchParams = useSearchParams();
  const screenplayId = screenplay.screenplayId;

  const [activeTab, setActiveTab] = useState<DirectTab>('scene-builder');
  const [videoGenPreFill, setVideoGenPreFill] = useState<GenerateVideoContext | null>(null);

  // Stable key for WorkflowCompletionPoller (parent subscribes; poller does not - avoids #185)
  const jobIdsKey = useInFlightWorkflowJobsStore((s) =>
    [...s.jobIds].sort().join(',')
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as DirectTab)) {
      setActiveTab(tabFromUrl as DirectTab);
    } else if (tabFromUrl === 'storyboard') {
      setActiveTab('shots');
    } else {
      setActiveTab('scene-builder');
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: DirectTab) => {
      setActiveTab(tab);
      if (tab !== 'video-gen') {
        setVideoGenPreFill(null);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', tab);
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    },
    [router]
  );

  const handleGenerateVideoFromShots = useCallback(
    (context: GenerateVideoContext) => {
      setVideoGenPreFill(context);
      setActiveTab('video-gen');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', 'video-gen');
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    },
    [router]
  );

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
      <WorkflowCompletionPoller jobIdsKey={jobIdsKey} />
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

        {activeTab === 'shots' && (
          <div className="h-full overflow-y-auto">
            <ShotBoardPanel
              className="h-full"
              onNavigateToSceneBuilder={() => handleTabChange('scene-builder')}
              onGenerateVideo={handleGenerateVideoFromShots}
            />
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="h-full overflow-y-auto">
            <VideoBrowserPanel className="h-full" />
          </div>
        )}

        {activeTab === 'video-gen' && (
          <div className="h-full overflow-y-auto">
            <VideoGenerationTools
              className="min-h-full"
              screenplayId={screenplayId ?? undefined}
              initialStartImageUrl={videoGenPreFill?.firstFrameUrl}
              initialLineText={videoGenPreFill?.lineText}
              initialLineType={videoGenPreFill?.lineType}
              sceneId={videoGenPreFill?.sceneId}
              sceneNumber={videoGenPreFill?.sceneNumber}
              sceneName={videoGenPreFill?.sceneHeading}
              shotNumber={videoGenPreFill?.shotNumber}
            />
          </div>
        )}
      </div>
    </div>
  );
}

