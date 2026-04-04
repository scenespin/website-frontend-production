'use client';

/**
 * Direct Hub - Scene Builder | Shots | Videos | Video Gen | Image Gen
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { toast } from 'sonner';
import { SceneBuilderPanel } from '@/components/production/SceneBuilderPanel';
import { ShotBoardPanel } from '@/components/production/ShotBoardPanel';
import { VideoBrowserPanel } from '@/components/production/VideoBrowserPanel';
import { VideoGenerationTools } from '@/components/production/playground/VideoGenerationTools';
import { ImageGenerationTools } from '@/components/production/playground/ImageGenerationTools';
import { WorkflowCompletionPoller } from '@/components/production/WorkflowCompletionPoller';
import { JobsDrawer } from '@/components/production/JobsDrawer';
import { useInFlightWorkflowJobsStore } from '@/lib/inFlightWorkflowJobsStore';
import { DirectTabBar, DirectTab } from './DirectTabBar';
import type { GenerateVideoContext } from '@/components/production/ShotBoardPanel';

const VALID_TABS: DirectTab[] = ['scene-builder', 'shots', 'videos', 'video-gen', 'image-gen'];

export function DirectHub() {
  const screenplay = useScreenplay();
  const { canAccessProductionHub, canGenerateAssets, permissionsLoading } = screenplay;
  const router = useRouter();
  const searchParams = useSearchParams();
  const screenplayId = screenplay.screenplayId;
  const disabledTabs = useMemo<Partial<Record<DirectTab, string>>>(() => {
    const tabs: Partial<Record<DirectTab, string>> = {};
    const productionHubDeniedReason = 'Production Hub access is limited to Director/Producer collaborators.';
    const generationDeniedReason = 'Asset generation is limited to Director/Producer collaborators.';

    if (permissionsLoading) {
      tabs['scene-builder'] = 'Loading screenplay permissions...';
      tabs['shots'] = 'Loading screenplay permissions...';
      tabs['video-gen'] = 'Loading screenplay permissions...';
      tabs['image-gen'] = 'Loading screenplay permissions...';
      return tabs;
    }

    if (!canAccessProductionHub) {
      tabs['scene-builder'] = productionHubDeniedReason;
      tabs['shots'] = productionHubDeniedReason;
      tabs['video-gen'] = productionHubDeniedReason;
      tabs['image-gen'] = productionHubDeniedReason;
      return tabs;
    }

    if (!canGenerateAssets) {
      tabs['video-gen'] = generationDeniedReason;
      tabs['image-gen'] = generationDeniedReason;
    }

    return tabs;
  }, [permissionsLoading, canAccessProductionHub, canGenerateAssets]);

  const [activeTab, setActiveTab] = useState<DirectTab>('scene-builder');
  const [videoGenPreFill, setVideoGenPreFill] = useState<GenerateVideoContext | null>(null);
  const [isJobsDrawerOpen, setIsJobsDrawerOpen] = useState(false);
  const hasInitializedInFlightJobsRef = useRef(false);
  const previousInFlightJobIdsRef = useRef<Set<string>>(new Set());

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
      const disabledReason = disabledTabs[tab];
      if (disabledReason) {
        toast.error(disabledReason);
        return;
      }
      setActiveTab(tab);
      if (tab !== 'video-gen') {
        setVideoGenPreFill(null);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', tab);
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    },
    [router, disabledTabs]
  );

  useEffect(() => {
    const activeTabDeniedReason = disabledTabs[activeTab];
    if (!activeTabDeniedReason) return;
    setActiveTab('videos');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', 'videos');
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  }, [activeTab, disabledTabs, router]);

  const handleGenerateVideoFromShots = useCallback(
    (context: GenerateVideoContext) => {
      const disabledReason = disabledTabs['video-gen'];
      if (disabledReason) {
        toast.error(disabledReason);
        return;
      }
      setVideoGenPreFill(context);
      setActiveTab('video-gen');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', 'video-gen');
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    },
    [router, disabledTabs]
  );

  // Jobs drawer is intentionally hidden on Scene Builder.
  // Keep the open state across Direct tabs where jobs monitoring is relevant.
  const shouldShowJobsUi =
    activeTab === 'shots' ||
    activeTab === 'videos' ||
    activeTab === 'image-gen';

  useEffect(() => {
    if (!shouldShowJobsUi && isJobsDrawerOpen) {
      setIsJobsDrawerOpen(false);
    }
  }, [shouldShowJobsUi, isJobsDrawerOpen]);

  // Auto-open Jobs drawer on Image Gen when a newly tracked job appears,
  // so users get immediate confirmation their generation is running.
  useEffect(() => {
    const currentJobIds = new Set(
      jobIdsKey
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    );

    if (!hasInitializedInFlightJobsRef.current) {
      previousInFlightJobIdsRef.current = currentJobIds;
      hasInitializedInFlightJobsRef.current = true;
      return;
    }

    const hasNewTrackedJob = Array.from(currentJobIds).some(
      (jobId) => !previousInFlightJobIdsRef.current.has(jobId)
    );
    previousInFlightJobIdsRef.current = currentJobIds;

    if (activeTab === 'image-gen' && hasNewTrackedJob) {
      setIsJobsDrawerOpen(true);
    }
  }, [jobIdsKey, activeTab]);

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
          disabledTabs={disabledTabs}
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

        {activeTab === 'image-gen' && (
          <div className="h-full overflow-y-auto">
            <ImageGenerationTools
              className="min-h-full"
            />
          </div>
        )}
      </div>

      {shouldShowJobsUi && (
        <JobsDrawer
          isOpen={isJobsDrawerOpen}
          onClose={() => setIsJobsDrawerOpen(false)}
          onOpen={() => setIsJobsDrawerOpen(true)}
          autoOpen={false}
          compact={false}
          screenplayIdFromHub={screenplayId}
          jobCount={0}
          showCountBadge={false}
          onNavigateToEntity={(entityType, entityId) => {
            const targetTab = entityType === 'character' ? 'characters' : entityType === 'location' ? 'locations' : 'assets';
            const newUrl = new URL(window.location.origin + '/produce');
            newUrl.searchParams.set('tab', targetTab);
            newUrl.searchParams.set('openEntityType', entityType);
            newUrl.searchParams.set('openEntityId', entityId);
            router.push(newUrl.pathname + newUrl.search, { scroll: false });
          }}
        />
      )}
    </div>
  );
}

