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

// Existing components
import { CharacterBankPanel } from './CharacterBankPanel';
import { LocationBankPanel } from './LocationBankPanel';
import AssetBankPanel from './AssetBankPanel';
// ProductionJobsPanel removed - functionality moved to JobsDrawer (Phase 2)
import { ProductionErrorBoundary } from './ProductionErrorBoundary';
import { ProductionTabBar } from './ProductionTabBar';
import { JobsDrawer } from './JobsDrawer';

// ============================================================================
// TYPES
// ============================================================================

type ProductionTab = 
  | 'characters'    // Character Bank
  | 'locations'     // Location Bank
  | 'assets';       // Asset Bank (Props)
  // Note: Scene Builder and Storyboard moved to /direct
  // Note: Images, Video, Audio removed (use Media Library in /storage)
  // Note: Storage moved to /storage route
  // Note: AI Chat is now a drawer (not a tab) - triggered from various buttons
  // Note: Jobs tab removed - functionality moved to JobsDrawer component

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
  const [activeJobs, setActiveJobs] = useState<number>(0);
  const [showJobsBanner, setShowJobsBanner] = useState(true);
  const [isJobsDrawerOpen, setIsJobsDrawerOpen] = useState(false);
  
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
    
    if (tabFromUrl && ['characters', 'locations', 'assets'].includes(tabFromUrl)) {
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
        
        // Backend uses sendSuccess which wraps in { success: true, data: { jobs: [...] } }
        // But also check for direct jobs property for backwards compatibility
        const jobList = data.data?.jobs || data.jobs || [];
        
        if (data.success) {
          const runningCount = jobList.filter((job: any) => 
            job.status === 'running' || job.status === 'queued'
          ).length;
          setActiveJobs(runningCount);
          
          // Auto-open drawer when jobs are running (if not already open)
          if (runningCount > 0 && !isJobsDrawerOpen) {
            console.log('[ProductionHub] Auto-opening JobsDrawer -', runningCount, 'job(s) running');
            setIsJobsDrawerOpen(true);
          }
        } else {
          setActiveJobs(0);
        }
      } catch (error) {
        console.error('[ProductionHub] Failed to fetch active jobs:', error);
      }
    };

    // Initial fetch
    fetchActiveJobs();

    // Poll every 10 seconds - good balance between responsiveness and resource usage
    // When jobs are running, JobsDrawer will handle more frequent polling (3 seconds)
    const interval = setInterval(fetchActiveJobs, 10000);
    
    return () => clearInterval(interval);
  }, [screenplayId, getToken, isJobsDrawerOpen]);
  
  // 🔥 CRITICAL: Early return AFTER all hooks are called
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

  // ============================================================================
  // RENDER: MOBILE LAYOUT
  // ============================================================================

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A]">
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
                onClick={() => setIsJobsDrawerOpen(true)}
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




        </div>

        {/* Jobs Drawer */}
        <JobsDrawer
          isOpen={isJobsDrawerOpen}
          onClose={() => setIsJobsDrawerOpen(false)}
          onOpen={() => setIsJobsDrawerOpen(true)}
          autoOpen={true}
          compact={isMobile}
          jobCount={activeJobs}
        />
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
                onClick={() => setIsJobsDrawerOpen(true)}
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


      </div>

      {/* Jobs Drawer */}
      <JobsDrawer
        isOpen={isJobsDrawerOpen}
        onClose={() => setIsJobsDrawerOpen(false)}
        onOpen={() => setIsJobsDrawerOpen(true)}
        autoOpen={true}
        compact={isMobile}
        jobCount={activeJobs}
      />
    </div>
  );
}

