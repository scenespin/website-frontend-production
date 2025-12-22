'use client';

/**
 * Production Hub - Feature 0109 Complete Redesign
 * 
 * Mobile-first, screenplay-centric production interface with:
 * - AI Chat (conversational workflows) - NOW VIA DRAWER (right-side desktop, bottom mobile)
 * - Scene Builder (from screenplay)
 * - Media Library (upload management)
 * - Style Analyzer (match existing footage)
 * - Character/Location/Asset Banks
 * - Jobs (monitoring)
 * - Creative Gallery (inspiration)
 * 
 * Three Clear Paths:
 * 1. One-Off Creation → AI Chat Drawer
 * 2. Screenplay-Driven → Scene Builder
 * 3. Hybrid Workflow → Media Library + Style Analyzer + Scene Builder
 * 
 * Build: 2024-11-09-10:30 UTC (cache bust)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useDrawer } from '@/contexts/DrawerContext'; // NEW: For AI Interview drawer
import { 
  MessageSquare, 
  Video, 
  FolderOpen, 
  Users, 
  MapPin, 
  Box,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Phase 2 Components (Feature 0109)
// Note: AIInterviewChat is now rendered in layout drawer, not as a tab
import StyleAnalyzer from './StyleAnalyzer';
import MediaLibrary from './MediaLibrary';
import CreativePossibilitiesGallery from './CreativePossibilitiesGallery';

// Existing components
import { SceneBuilderPanel } from './SceneBuilderPanel';
import { ScenesPanel } from './ScenesPanel';
import { CharacterBankPanel } from './CharacterBankPanel';
import { LocationBankPanel } from './LocationBankPanel';
import AssetBankPanel from './AssetBankPanel';
import { ProductionJobsPanel } from './ProductionJobsPanel';
import { ProductionErrorBoundary } from './ProductionErrorBoundary';
import { ProductionTabBar } from './ProductionTabBar';

// ============================================================================
// TYPES
// ============================================================================

type ProductionTab = 
  | 'characters'    // Character Bank
  | 'locations'     // Location Bank
  | 'assets'        // Asset Bank
  | 'scene-builder' // Screenplay-driven scene generation
  | 'scenes'        // Scene videos & storyboard (Feature 0170)
  | 'jobs'          // Job Monitoring
  | 'media'         // Media Library + Style Analyzer
  | 'playground';   // Playground (Creative Possibilities)
  // Note: AI Chat is now a drawer (not a tab) - triggered from various buttons

interface ProductionHubProps {
  // Removed projectId prop - screenplayId comes from ScreenplayContext
}

interface TabConfig {
  id: ProductionTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductionHub({}: ProductionHubProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const screenplay = useScreenplay();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🔥 FIX: Get screenplayId from context only - no fallbacks, no props
  const screenplayId = screenplay.screenplayId;
  
  // State - sync with URL params (ALL HOOKS MUST BE CALLED BEFORE EARLY RETURN)
  // 🔥 FIX: Initialize with default, then sync from URL in useEffect to prevent React error #300
  const [activeTab, setActiveTab] = useState<ProductionTab>('characters');
  const [isMobile, setIsMobile] = useState(false);
  const [showStyleAnalyzer, setShowStyleAnalyzer] = useState(false);
  const [activeJobs, setActiveJobs] = useState<number>(0);
  const [showJobsBanner, setShowJobsBanner] = useState(true);
  
  // 🔥 FIX: Use ref to prevent circular updates when we programmatically change the tab
  const isUpdatingTabRef = useRef(false);
  
  // ✅ FIX: All hooks must be called BEFORE early return
  // Sync activeTab with URL params (prevent circular updates and React error #300)
  useEffect(() => {
    // Skip if we're in the middle of programmatically updating the tab
    if (isUpdatingTabRef.current) {
      isUpdatingTabRef.current = false;
      return;
    }
    
    const tabFromUrl = searchParams.get('tab') as ProductionTab | null;
    
    if (tabFromUrl && ['characters', 'locations', 'assets', 'scene-builder', 'scenes', 'jobs', 'media', 'playground'].includes(tabFromUrl)) {
      // Only update if different to prevent React error #300 (circular updates)
      setActiveTab(prevTab => prevTab !== tabFromUrl ? tabFromUrl : prevTab);
    } else {
      // If no tab in URL, set to 'characters' (but only if not already 'characters' to prevent unnecessary updates)
      setActiveTab(prevTab => prevTab !== 'characters' ? 'characters' : prevTab);
    }
  }, [searchParams]);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Poll for active jobs
  useEffect(() => {
    if (!screenplayId) return; // Early return inside hook is OK
    
    const fetchActiveJobs = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          console.log('[ProductionHub] No auth token, skipping job fetch');
          return;
        }
        
        const response = await fetch(`/api/workflows/executions?screenplayId=${screenplayId}&status=running&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.jobs) {
          const runningCount = data.jobs.filter((job: any) => 
            job.status === 'running' || job.status === 'queued'
          ).length;
          setActiveJobs(runningCount);
        }
      } catch (error) {
        console.error('[ProductionHub] Failed to fetch active jobs:', error);
      }
    };

    // Initial fetch
    fetchActiveJobs();

    // Poll every 10 seconds if there are active jobs
    const interval = setInterval(fetchActiveJobs, 10000);
    
    return () => clearInterval(interval);
  }, [screenplayId, getToken]);
  
  // 🔥 CRITICAL: Early return AFTER all hooks are called
  if (!screenplayId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading screenplay...</p>
        </div>
      </div>
    );
  }
  
  // Location bank state - REMOVED: Now using screenplay.locations from context like characters

  // Update URL when activeTab changes (use Next.js router to prevent React error #300)
  const handleTabChange = (tab: ProductionTab) => {
    // 🔥 FIX: Set flag to prevent useEffect from running when we update the tab programmatically
    isUpdatingTabRef.current = true;
    setActiveTab(tab);
    // Use Next.js router to update URL (prevents React error #300 from synchronous URL updates)
    // Use setTimeout to ensure router.push happens after state update, preventing render conflicts
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      if (tab === 'characters') {
        newUrl.searchParams.delete('tab');
      } else {
        newUrl.searchParams.set('tab', tab);
      }
      // Use router.push instead of window.history.pushState to let Next.js handle it properly
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    }, 0);
  };

  // ============================================================================
  // TAB CONFIGURATION
  // ============================================================================

  // Tab configuration removed - now using ProductionTabBar component

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartExample = (example: any) => {
    // Store the example prompt to pass to AI Chat Drawer
    localStorage.setItem('pending-workflow-prompt', JSON.stringify({
      workflowId: example.id,
      workflowName: example.title,
      prompt: example.conversationPrompt
    }));
    
    // Open AI drawer with workflows mode (Production page default)
    openDrawer('workflows');
    console.log('[ProductionHub] Opening AI drawer with Workflows agent for example:', example);
  };

  const handleStyleAnalysisComplete = (profile: any) => {
    console.log('[ProductionHub] Style analysis complete:', profile);
    setShowStyleAnalyzer(false);
    // Could auto-navigate to scene builder or chat with style profile context
  };

  const handleMediaSelect = (file: any) => {
    console.log('[ProductionHub] Media selected:', file);
    // Could open in composition or timeline
  };

  // ============================================================================
  // RENDER: MOBILE LAYOUT
  // ============================================================================

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        {/* Mobile Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <h1 className="text-xl font-bold text-white">Production Hub</h1>
          <p className="text-sm text-gray-400">
            {screenplay.screenplayId ? `${screenplay.scenes?.length || 0} scenes • ${screenplay.characters?.length || 0} characters` : 'No screenplay loaded'}
          </p>
        </div>

        {/* Active Jobs Banner */}
        {activeJobs > 0 && showJobsBanner && (
          <div className="bg-blue-950 border-b border-blue-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-100">
                  {activeJobs} {activeJobs === 1 ? 'job' : 'jobs'} running
                </p>
                <p className="text-xs text-blue-300">
                  Generating videos in background
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('jobs')}
                className="text-xs px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-md transition-colors flex items-center gap-1"
              >
                View
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowJobsBanner(false)}
                className="p-1 hover:bg-blue-800 rounded text-blue-300 hover:text-blue-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Tab Navigation */}
        <ProductionTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          jobCount={activeJobs}
        />

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'characters' && (
            <div className="h-full overflow-y-auto">
              <ProductionErrorBoundary componentName="Character Bank">
                <CharacterBankPanel className="h-full" />
              </ProductionErrorBoundary>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="h-full overflow-y-auto">
              <ProductionErrorBoundary componentName="Location Bank">
                <LocationBankPanel className="h-full" />
              </ProductionErrorBoundary>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="h-full overflow-y-auto">
              <ProductionErrorBoundary componentName="Asset Bank">
                <AssetBankPanel className="h-full" />
              </ProductionErrorBoundary>
            </div>
          )}

          {activeTab === 'scene-builder' && (
            <div className="h-full overflow-y-auto">
              <SceneBuilderPanel
                projectId={screenplayId}
                isMobile={true}
                simplified={true}
              />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="h-full overflow-y-auto p-4">
              <MediaLibrary
                projectId={screenplayId}
                onSelectFile={handleMediaSelect}
                className="mb-4"
              />
              
              <button
                onClick={() => setShowStyleAnalyzer(!showStyleAnalyzer)}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-4"
              >
                {showStyleAnalyzer ? 'Hide' : 'Show'} Style Analyzer
              </button>

              {showStyleAnalyzer && (
                <div className="mt-4">
                  <StyleAnalyzer
                    projectId={screenplayId}
                    onAnalysisComplete={handleStyleAnalysisComplete}
                  />
                </div>
              )}
            </div>
          )}


          {activeTab === 'jobs' && (
            <div className="h-full overflow-y-auto p-4">
              <ProductionErrorBoundary componentName="Production Jobs">
                <ProductionJobsPanel />
              </ProductionErrorBoundary>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="h-full overflow-y-auto p-4">
              <CreativePossibilitiesGallery
                onStartExample={handleStartExample}
                className="rounded-xl overflow-hidden"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: DESKTOP LAYOUT (Horizontal Tabs - Matching Creation Area)
  // ============================================================================

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      {/* Horizontal Tab Navigation */}
      <ProductionTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        jobCount={activeJobs}
      />

      {/* Active Jobs Banner */}
      {activeJobs > 0 && showJobsBanner && (
        <div className="bg-blue-950 border-b border-blue-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-100">
                {activeJobs} {activeJobs === 1 ? 'job' : 'jobs'} running
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('jobs')}
              className="text-xs px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded transition-colors flex items-center gap-1"
            >
              View
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowJobsBanner(false)}
              className="p-1 hover:bg-blue-800 rounded text-blue-300 hover:text-blue-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden bg-[#0A0A0A]">
        {activeTab === 'characters' && (
          <div className="h-full overflow-y-auto">
            <ProductionErrorBoundary componentName="Character Bank">
              <CharacterBankPanel className="h-full" />
            </ProductionErrorBoundary>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="h-full overflow-y-auto">
            <ProductionErrorBoundary componentName="Location Bank">
              <LocationBankPanel className="h-full" />
            </ProductionErrorBoundary>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="h-full overflow-y-auto">
            <ProductionErrorBoundary componentName="Asset Bank">
              <AssetBankPanel className="h-full" />
            </ProductionErrorBoundary>
          </div>
        )}

          {activeTab === 'scene-builder' && (
            <div className="h-full overflow-y-auto">
              <SceneBuilderPanel
                projectId={screenplayId}
                isMobile={false}
                simplified={false}
              />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="h-full overflow-y-auto">
              <div className="p-4 md:p-5">
                <MediaLibrary
                  projectId={screenplayId}
                  onSelectFile={handleMediaSelect}
                  className="mb-4 md:mb-5"
                />

                {showStyleAnalyzer && (
                  <div className="mt-4 md:mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg md:text-xl font-semibold text-white">Style Analyzer</h3>
                      <button
                        onClick={() => setShowStyleAnalyzer(false)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <StyleAnalyzer
                      projectId={screenplayId}
                      onAnalysisComplete={handleStyleAnalysisComplete}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scenes' && (
            <div className="h-full overflow-y-auto">
              <ScenesPanel
                className="h-full"
              />
            </div>
          )}


          {activeTab === 'jobs' && (
            <div className="h-full overflow-y-auto">
              <div className="p-4 md:p-5">
                <ProductionJobsPanel />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

// OverviewTab component removed - Playground tab now shows only Creative Possibilities Gallery

