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
  AlertCircle,
  Building2
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
import { ScreenplayStatusBanner } from './ScreenplayStatusBanner';
import { QuickActions } from './QuickActions';
import { ProductionErrorBoundary } from './ProductionErrorBoundary';
import { ProductionTabBar } from './ProductionTabBar';

// ============================================================================
// TYPES
// ============================================================================

type ProductionTab = 
  | 'overview'      // Dashboard + Creative Gallery
  | 'scene-builder' // Screenplay-driven scene generation
  | 'scenes'        // Scene videos & storyboard (Feature 0170)
  | 'media'         // Media Library + Style Analyzer
  | 'banks'         // Banks (Characters, Locations, Assets via dropdown)
  | 'jobs';         // Job Monitoring
  // Note: AI Chat is now a drawer (not a tab) - triggered from various buttons

type BankTab = 'characters' | 'locations' | 'assets';

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
  const [activeTab, setActiveTab] = useState<ProductionTab>('overview');
  const [activeBankId, setActiveBankId] = useState<BankTab | null>(null);
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
    const bankFromUrl = searchParams.get('bank') as BankTab | null;
    
    if (tabFromUrl && ['overview', 'scene-builder', 'scenes', 'media', 'banks', 'jobs'].includes(tabFromUrl)) {
      // Only update if different to prevent React error #300 (circular updates)
      setActiveTab(prevTab => prevTab !== tabFromUrl ? tabFromUrl : prevTab);
      
      // Handle bank selection from URL
      if (tabFromUrl === 'banks' && bankFromUrl && ['characters', 'locations', 'assets'].includes(bankFromUrl)) {
        setActiveBankId(bankFromUrl);
      }
    } else {
      // If no tab in URL, set to 'overview' (but only if not already 'overview' to prevent unnecessary updates)
      setActiveTab(prevTab => prevTab !== 'overview' ? 'overview' : prevTab);
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
      if (tab === 'overview') {
        newUrl.searchParams.delete('tab');
        newUrl.searchParams.delete('bank');
      } else {
        newUrl.searchParams.set('tab', tab);
        if (tab === 'banks' && activeBankId) {
          newUrl.searchParams.set('bank', activeBankId);
        } else if (tab !== 'banks') {
          newUrl.searchParams.delete('bank');
        }
      }
      // Use router.push instead of window.history.pushState to let Next.js handle it properly
      router.push(newUrl.pathname + newUrl.search, { scroll: false });
    }, 0);
  };

  // Handle bank selection from dropdown
  const handleBankChange = (bankId: BankTab) => {
    setActiveBankId(bankId);
    setActiveTab('banks');
    isUpdatingTabRef.current = true;
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', 'banks');
      newUrl.searchParams.set('bank', bankId);
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
          activeBankId={activeBankId}
          onBankChange={handleBankChange}
          jobCount={activeJobs}
        />

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="h-full overflow-y-auto p-4">
              <OverviewTab 
                projectId={screenplayId}
                onStartExample={handleStartExample}
                onNavigate={handleTabChange}
                onOpenChat={() => openDrawer('workflows')}
                isMobile={true}
              />
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

          {activeTab === 'banks' && (
            <div className="h-full overflow-y-auto">
              {activeBankId === 'characters' && (
                <ProductionErrorBoundary componentName="Character Bank">
                  <CharacterBankPanel className="h-full" />
                </ProductionErrorBoundary>
              )}
              {activeBankId === 'locations' && (
                <ProductionErrorBoundary componentName="Location Bank">
                  <LocationBankPanel className="h-full" />
                </ProductionErrorBoundary>
              )}
              {activeBankId === 'assets' && (
                <ProductionErrorBoundary componentName="Asset Bank">
                  <AssetBankPanel className="h-full" />
                </ProductionErrorBoundary>
              )}
              {!activeBankId && (
                <div className="flex items-center justify-center h-full p-4">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Select a bank from the dropdown</p>
                  </div>
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
        activeBankId={activeBankId}
        onBankChange={handleBankChange}
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
        <div className="flex-1 overflow-hidden bg-gray-950">
          {activeTab === 'overview' && (
            <div className="h-full overflow-y-auto">
            <OverviewTab 
              projectId={screenplayId}
              onStartExample={handleStartExample}
              onNavigate={handleTabChange}
              onOpenChat={() => openDrawer('workflows')}
              isMobile={false}
            />
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

          {activeTab === 'banks' && (
            <div className="h-full overflow-y-auto">
              {activeBankId === 'characters' && (
                <ProductionErrorBoundary componentName="Character Bank">
                  <CharacterBankPanel className="h-full" />
                </ProductionErrorBoundary>
              )}
              {activeBankId === 'locations' && (
                <ProductionErrorBoundary componentName="Location Bank">
                  <LocationBankPanel className="h-full" />
                </ProductionErrorBoundary>
              )}
              {activeBankId === 'assets' && (
                <ProductionErrorBoundary componentName="Asset Bank">
                  <AssetBankPanel className="h-full" />
                </ProductionErrorBoundary>
              )}
              {!activeBankId && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Select a bank from the dropdown</p>
                  </div>
                </div>
              )}
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
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB COMPONENT
// ============================================================================

interface OverviewTabProps {
  projectId: string;
  onStartExample: (example: any) => void;
  onNavigate: (tab: ProductionTab) => void;
  onOpenChat?: () => void; // NEW: For opening AI Interview drawer
  isMobile: boolean;
}

function OverviewTab({ projectId, onStartExample, onNavigate, onOpenChat, isMobile }: OverviewTabProps) {
  const screenplay = useScreenplay();

  const handleViewEditor = () => {
    // Navigate to editor page
    window.location.href = '/write';
  };

  return (
    <div className="p-4 md:p-5 space-y-4 md:space-y-5 bg-[#0A0A0A]">
      {/* Screenplay Connection Status Banner */}
      <ScreenplayStatusBanner
        onViewEditor={handleViewEditor}
      />

      {/* Welcome Section with Quick Actions */}
      <div className="bg-gradient-to-br from-[#DC143C]/20 to-[#1F1F1F] border border-[#DC143C]/30 rounded-xl p-4 md:p-5">
        <h2 className="text-lg md:text-xl font-semibold text-[#FFFFFF] mb-2">
          Welcome to Production Hub
        </h2>
        <p className="text-sm md:text-base text-[#B3B3B3] mb-3 md:mb-4">
          Three powerful ways to create your video content:
        </p>

        <QuickActions
          onOneOffClick={() => {
            if (onOpenChat) {
              onOpenChat(); // Open AI Interview drawer
            }
          }}
          onScreenplayClick={() => onNavigate('scene-builder')}
          onHybridClick={() => onNavigate('media')}
          isMobile={isMobile}
        />
      </div>

      {/* Project Stats */}
      {!isMobile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Scenes</p>
            <p className="text-lg md:text-xl font-bold text-[#FFFFFF]">
              {screenplay.scenes?.length || 0}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Characters</p>
            <p className="text-lg md:text-xl font-bold text-[#FFFFFF]">
              {screenplay.characters?.length || 0}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Locations</p>
            <p className="text-lg md:text-xl font-bold text-[#FFFFFF]">
              {screenplay.locations?.length || 0}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Jobs Running</p>
            <p className="text-lg md:text-xl font-bold text-[#DC143C]">0</p>
          </div>
        </div>
      )}

      {/* Creative Possibilities Gallery */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-[#FFFFFF] mb-3 md:mb-4">
          Creative Possibilities
        </h3>
        <CreativePossibilitiesGallery
          onStartExample={onStartExample}
          className="rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
}

