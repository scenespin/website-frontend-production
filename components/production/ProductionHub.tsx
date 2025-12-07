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

import React, { useState, useEffect } from 'react';
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
import { CharacterBankPanel } from './CharacterBankPanel';
import { LocationBankPanel } from './LocationBankPanel';
import AssetBankPanel from './AssetBankPanel';
import { ProductionJobsPanel } from './ProductionJobsPanel';
import { ScreenplayStatusBanner } from './ScreenplayStatusBanner';
import { QuickActions } from './QuickActions';

// ============================================================================
// TYPES
// ============================================================================

type ProductionTab = 
  | 'overview'      // Dashboard + Creative Gallery
  | 'scene-builder' // Screenplay-driven scene generation
  | 'media'         // Media Library + Style Analyzer
  | 'characters'    // Character Bank
  | 'locations'     // Location Bank
  | 'assets'        // Asset Bank
  | 'jobs';         // Job Monitoring
  // Note: AI Chat is now a drawer (not a tab) - triggered from various buttons

interface ProductionHubProps {
  projectId: string;
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

export function ProductionHub({ projectId }: ProductionHubProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const screenplay = useScreenplay();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State - sync with URL params
  const [activeTab, setActiveTab] = useState<ProductionTab>(() => {
    const tabFromUrl = searchParams.get('tab') as ProductionTab | null;
    return (tabFromUrl && ['overview', 'scene-builder', 'media', 'characters', 'locations', 'assets', 'jobs'].includes(tabFromUrl)) 
      ? tabFromUrl 
      : 'overview';
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showStyleAnalyzer, setShowStyleAnalyzer] = useState(false);
  const [activeJobs, setActiveJobs] = useState<number>(0);
  const [showJobsBanner, setShowJobsBanner] = useState(true);
  
  // Location bank state - REMOVED: Now using screenplay.locations from context like characters

  // Sync activeTab with URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as ProductionTab | null;
    if (tabFromUrl && ['overview', 'scene-builder', 'media', 'characters', 'locations', 'assets', 'jobs'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when activeTab changes
  const handleTabChange = (tab: ProductionTab) => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    if (tab === 'overview') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', tab);
    }
    window.history.pushState({}, '', newUrl.toString());
  };

  // ============================================================================
  // RESPONSIVE DETECTION
  // ============================================================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================================================
  // LOCATIONS - Now using screenplay.locations from context (like characters)
  // Feature 0142: Location Bank Unification - Locations persist via ScreenplayContext
  // ============================================================================

  // ============================================================================
  // POLL FOR ACTIVE JOBS
  // ============================================================================

  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          console.log('[ProductionHub] No auth token, skipping job fetch');
          return;
        }
        
        const response = await fetch(`/api/workflows/list?projectId=${projectId}&status=running&limit=100`, {
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
  }, [projectId, getToken]);

  // ============================================================================
  // TAB CONFIGURATION
  // ============================================================================

  const tabs: TabConfig[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Project dashboard & creative possibilities'
    },
    {
      id: 'scene-builder',
      label: 'Scene Builder',
      icon: <Video className="w-5 h-5" />,
      description: 'Generate scenes from screenplay'
    },
    {
      id: 'media',
      label: 'Media',
      icon: <FolderOpen className="w-5 h-5" />,
      description: 'Uploads & style matching'
    },
    {
      id: 'characters',
      label: 'Characters',
      icon: <Users className="w-5 h-5" />,
      description: 'Character bank & references'
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Location bank & references'
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: <Box className="w-5 h-5" />,
      description: '3D models & props'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: <Clock className="w-5 h-5" />,
      description: 'Monitor generation status'
    }
  ];

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

        {/* Mobile Tab Selector (Dropdown) */}
        <div className="bg-gray-900 border-b border-gray-800 p-3">
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value as ProductionTab)}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label} - {tab.description}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="h-full overflow-y-auto p-4">
              <OverviewTab 
                projectId={projectId}
                onStartExample={handleStartExample}
                onNavigate={setActiveTab}
                onOpenChat={() => openDrawer('workflows')}
                isMobile={true}
              />
            </div>
          )}

          {activeTab === 'scene-builder' && (
            <div className="h-full overflow-y-auto">
              <SceneBuilderPanel
                projectId={projectId}
                isMobile={true}
                simplified={true}
              />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="h-full overflow-y-auto p-4">
              <MediaLibrary
                projectId={projectId}
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
                    projectId={projectId}
                    onAnalysisComplete={handleStyleAnalysisComplete}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="h-full overflow-y-auto">
              <CharacterBankPanel
                characters={(screenplay.characters || []).map(char => {
                  // Separate user-uploaded references from generated poses
                  const allImages = char.images || [];
                  // Production Hub images: source='pose-generation'
                  // Creation images: source='user-upload' OR no source
                  const poseReferences = allImages.filter((img: any) => 
                    (img.metadata as any)?.source === 'pose-generation'
                  );
                  const userReferences = allImages.filter((img: any) => 
                    (img.metadata as any)?.source !== 'pose-generation'
                  );
                  
                  return {
                    id: char.id,
                    name: char.name,
                    type: char.type,
                    baseReference: userReferences[0] ? {
                      imageUrl: userReferences[0].imageUrl,
                      s3Key: (userReferences[0] as any).s3Key
                    } : undefined,
                    references: userReferences.slice(1).map((img, idx) => ({
                      id: (img as any).id || `ref-${idx}`,
                      imageUrl: img.imageUrl,
                      s3Key: (img as any).s3Key || '',
                      label: (img.metadata as any)?.uploadedFileName || `Reference ${idx + 1}`,
                      referenceType: 'base' as const
                    })),
                    poseReferences: poseReferences.map((img, idx) => ({
                      id: (img as any).id || `pose-${idx}`,
                      imageUrl: img.imageUrl,
                      s3Key: (img as any).s3Key || '',
                      label: (img.metadata as any)?.poseName || `Pose ${idx + 1}`,
                      referenceType: 'pose' as const
                    })),
                    referenceCount: (userReferences.length + poseReferences.length) || 0
                  };
                })}
                isLoading={screenplay.isLoading}
                projectId={projectId}
                onCharactersUpdate={() => {
                  // CharacterBankPanel uses useScreenplay() internally and will update context automatically
                  // No refresh needed - context updates when CRUD operations happen
                }}
              />
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="h-full overflow-y-auto">
              <LocationBankPanel
                projectId={projectId}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="h-full overflow-y-auto">
              <AssetBankPanel
                projectId={projectId}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="h-full overflow-y-auto p-4">
              <ProductionJobsPanel projectId={projectId} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: DESKTOP LAYOUT
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col relative z-10">
        {/* Project Header */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white mb-1">Production Hub</h2>
          <p className="text-sm text-gray-400 truncate">
            {screenplay.screenplayId ? `${screenplay.scenes?.length || 0} scenes` : 'No screenplay'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <span className={isActive ? 'text-white' : 'text-gray-500'}>
                  {tab.icon}
                </span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tab.label}</span>
                    {tab.badge && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  {!isActive && (
                    <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
                  )}
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            );
          })}
        </nav>

        {/* Help Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
            <p className="text-sm text-purple-300 font-medium mb-1">💡 Quick Tip</p>
            <p className="text-xs text-purple-200">
              Start with the AI Chat for guided workflows, or use Scene Builder for screenplay-driven generation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Active Jobs Banner */}
        {activeJobs > 0 && showJobsBanner && (
          <div className="bg-blue-950 border-b border-blue-800 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-100">
                  {activeJobs} {activeJobs === 1 ? 'job' : 'jobs'} running
                </p>
                <p className="text-xs text-blue-300">
                  Videos generating in background • Auto-refreshing every 10s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('jobs')}
                className="text-sm px-4 py-2 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <Clock className="w-4 h-4" />
                View Jobs
              </button>
              <button
                onClick={() => setShowJobsBanner(false)}
                className="p-2 hover:bg-blue-800 rounded-lg text-blue-300 hover:text-blue-100 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-sm text-gray-400">
                {tabs.find(t => t.id === activeTab)?.description}
              </p>
            </div>

            {/* Quick Actions */}
            {activeTab === 'media' && (
              <button
                onClick={() => setShowStyleAnalyzer(!showStyleAnalyzer)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {showStyleAnalyzer ? 'Hide' : 'Show'} Style Analyzer
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden bg-gray-950">
          {activeTab === 'overview' && (
            <div className="h-full overflow-y-auto">
            <OverviewTab 
              projectId={projectId}
              onStartExample={handleStartExample}
              onNavigate={setActiveTab}
              onOpenChat={() => openDrawer('workflows')}
              isMobile={false}
            />
            </div>
          )}

          {activeTab === 'scene-builder' && (
            <div className="h-full overflow-y-auto">
              <SceneBuilderPanel
                projectId={projectId}
                isMobile={false}
                simplified={false}
              />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <MediaLibrary
                  projectId={projectId}
                  onSelectFile={handleMediaSelect}
                  className="mb-6"
                />

                {showStyleAnalyzer && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Style Analyzer</h3>
                      <button
                        onClick={() => setShowStyleAnalyzer(false)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <StyleAnalyzer
                      projectId={projectId}
                      onAnalysisComplete={handleStyleAnalysisComplete}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="h-full overflow-y-auto">
              <CharacterBankPanel
                characters={(screenplay.characters || []).map(char => {
                  // Separate user-uploaded references from generated poses
                  const allImages = char.images || [];
                  // Production Hub images: source='pose-generation'
                  // Creation images: source='user-upload' OR no source
                  const poseReferences = allImages.filter((img: any) => 
                    (img.metadata as any)?.source === 'pose-generation'
                  );
                  const userReferences = allImages.filter((img: any) => 
                    (img.metadata as any)?.source !== 'pose-generation'
                  );
                  
                  return {
                    id: char.id,
                    name: char.name,
                    type: char.type,
                    baseReference: userReferences[0] ? {
                      imageUrl: userReferences[0].imageUrl,
                      s3Key: (userReferences[0] as any).s3Key
                    } : undefined,
                    references: userReferences.slice(1).map((img, idx) => ({
                      id: (img as any).id || `ref-${idx}`,
                      imageUrl: img.imageUrl,
                      s3Key: (img as any).s3Key || '',
                      label: (img.metadata as any)?.uploadedFileName || `Reference ${idx + 1}`,
                      referenceType: 'base' as const
                    })),
                    poseReferences: poseReferences.map((img, idx) => ({
                      id: (img as any).id || `pose-${idx}`,
                      imageUrl: img.imageUrl,
                      s3Key: (img as any).s3Key || '',
                      label: (img.metadata as any)?.poseName || `Pose ${idx + 1}`,
                      referenceType: 'pose' as const
                    })),
                    referenceCount: (userReferences.length + poseReferences.length) || 0
                  };
                })}
                isLoading={screenplay.isLoading}
                projectId={projectId}
                onCharactersUpdate={() => {
                  // CharacterBankPanel uses useScreenplay() internally and will update context automatically
                  // No refresh needed - context updates when CRUD operations happen
                }}
              />
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="h-full overflow-y-auto">
              <LocationBankPanel
                projectId={projectId}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="h-full overflow-y-auto">
              <AssetBankPanel
                projectId={projectId}
                className="h-full"
              />
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <ProductionJobsPanel projectId={projectId} />
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
        <h2 className="text-xl md:text-2xl font-bold text-[#FFFFFF] mb-2 md:mb-3">
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
            <p className="text-xl md:text-2xl font-bold text-[#FFFFFF]">
              {screenplay.scenes?.length || 0}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Characters</p>
            <p className="text-xl md:text-2xl font-bold text-[#FFFFFF]">
              {screenplay.characters?.length || 0}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Locations</p>
            <p className="text-xl md:text-2xl font-bold text-[#FFFFFF]">
              {screenplay.locations?.length || 0}
            </p>
          </div>
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-[#808080] mb-1">Jobs Running</p>
            <p className="text-xl md:text-2xl font-bold text-[#DC143C]">0</p>
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

