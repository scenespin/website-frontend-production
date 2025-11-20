'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WelcomeModal from '@/components/WelcomeModal';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
import ScreenplaySettingsModal from '@/components/editor/ScreenplaySettingsModal';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';
import { toast } from 'sonner';
// ResponsiveHeader removed - Navigation.js comes from dashboard/layout.js
import { 
  Film, 
  Clapperboard, 
  FileText, 
  Video, 
  Clock, 
  Plus,
  Zap,
  TrendingUp,
  Trash2,
  Settings,
  MoreVertical
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentScreenplayId, setCurrentScreenplayId] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);

  useEffect(() => {
    // Auth guaranteed by wrapper, fetch data immediately
    if (user) {
      fetchDashboardData();
      // Get current screenplay ID
      const screenplayId = getCurrentScreenplayId(user);
      setCurrentScreenplayId(screenplayId);
    }
  }, [user]);

  // Check first visit ONCE on mount (not every time user changes)
  useEffect(() => {
    if (user) {
      checkFirstVisit();
    }
  }, []); // Empty dependency array = run once on mount

  const checkFirstVisit = async () => {
    try {
      // Check if user has seen welcome modal (local storage fallback)
      const localHasSeenWelcome = typeof window !== 'undefined' && localStorage.getItem('hasSeenWelcome');
      const hasSeenWelcome = user?.publicMetadata?.hasSeenWelcome || localHasSeenWelcome === 'true';
      
      if (!hasSeenWelcome && user) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
  };

  const handleCloseWelcome = async () => {
    // Close modal immediately for better UX
    setShowWelcomeModal(false);
    
    // Save to localStorage first (instant, works offline)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
    
    // Update Clerk metadata via backend API (syncs across devices)
    // Falls back gracefully if API fails - localStorage already saved
    try {
      const response = await fetch('/api/user/metadata', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicMetadata: {
            hasSeenWelcome: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update metadata');
      }
    } catch (error) {
      // Silent failure - localStorage already saved, so UX is not affected
      console.log('[Dashboard] Metadata update failed, using localStorage fallback');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Set the auth token getter for API calls
      // Use JWT template if configured, otherwise use default
      const { setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      
      // Fetch data independently so one failure doesn't break everything
      // Fetch both screenplays AND projects, then merge them
      // Note: Next.js API routes handle auth server-side, so we don't need to send token
      const [creditsRes, screenplaysRes, projectsRes, videosRes] = await Promise.allSettled([
        api.user.getCredits(),
        fetch('/api/screenplays/list?status=active&limit=100')
          .then(async r => {
            if (!r.ok) {
              const errorText = await r.text().catch(() => 'Unknown error');
              throw new Error(`Failed to fetch screenplays: ${r.status} ${errorText}`);
            }
            return r.json();
          }),
        fetch('/api/projects/list')
          .then(async r => {
            if (!r.ok) {
              const errorText = await r.text().catch(() => 'Unknown error');
              throw new Error(`Failed to fetch projects: ${r.status} ${errorText}`);
            }
            return r.json();
          }),
        api.video.getJobs()
      ]);
      
      // Handle credits (critical)
      if (creditsRes.status === 'fulfilled') {
        console.log('[Dashboard] Credits API response:', creditsRes.value);
        console.log('[Dashboard] Credits data:', creditsRes.value.data);
        console.log('[Dashboard] Credits balance:', creditsRes.value.data?.data);
        console.log('[Dashboard] Current user ID:', user?.id);
        // creditsRes.value is axios response, .data is API response, .data.data is actual data
        const creditsData = creditsRes.value.data.data;
        console.log('[Dashboard] Credits data balance value:', creditsData?.balance);
        setCredits(creditsData);
        
        // If balance is 0, try refreshing cache (might be stale)
        if (creditsData?.balance === 0) {
          console.log('[Dashboard] Balance is 0, refreshing cache...');
          console.log('[Dashboard] User ID for refresh:', user?.id);
          try {
            const refreshRes = await apiClient.get('/api/credits/balance?refresh=true');
            const refreshedData = refreshRes.data.data;
            console.log('[Dashboard] Refreshed balance:', refreshedData);
            console.log('[Dashboard] Refreshed balance value:', refreshedData?.balance);
            if (refreshedData?.balance > 0) {
              setCredits(refreshedData);
            }
          } catch (refreshError) {
            console.error('[Dashboard] Error refreshing credits:', refreshError);
          }
        }
      } else {
        console.error('Error fetching credits:', creditsRes.reason);
        setCredits({ balance: 0 }); // Fallback
      }
      
      // UNIFIED: screenplay_id is primary, project_id is fallback
      // Screenplays are the source of truth - projects are legacy/fallback
      const allScreenplays = [];
      const screenplayIdSet = new Set(); // Track IDs to avoid duplicates
      
      // PRIMARY: Add screenplays (source of truth)
      if (screenplaysRes.status === 'fulfilled') {
        const screenplaysData = screenplaysRes.value;
        console.log('[Dashboard] Screenplays API response:', screenplaysData);
        // API returns { success: true, data: { screenplays: [...], count: number } }
        const screenplays = screenplaysData?.data?.screenplays || screenplaysData?.screenplays || [];
        console.log('[Dashboard] Parsed screenplays:', screenplays.length);
        screenplays.forEach(s => {
          // Only include active screenplays (filter out deleted/archived)
          if (s.status && s.status !== 'active') {
            return;
          }
          const screenplayId = s.screenplay_id;
          screenplayIdSet.add(screenplayId);
          allScreenplays.push({
            id: screenplayId, // Primary identifier
            screenplay_id: screenplayId, // Primary identifier
            project_id: screenplayId, // Fallback compatibility (project_id = screenplay_id)
            name: s.title,
            created_at: s.created_at,
            updated_at: s.updated_at,
            description: s.description,
            genre: s.metadata?.genre,
            storage_provider: s.storage_provider,
            status: s.status || 'active' // Include status from API
          });
        });
      } else {
        console.error('[Dashboard] Error fetching screenplays:', screenplaysRes.reason);
        console.error('[Dashboard] Screenplay fetch error details:', {
          message: screenplaysRes.reason?.message,
          stack: screenplaysRes.reason?.stack,
          status: screenplaysRes.reason?.response?.status,
          statusText: screenplaysRes.reason?.response?.statusText
        });
      }
      
      // FALLBACK: Add projects that don't have screenplays yet (legacy data)
      if (projectsRes.status === 'fulfilled') {
        const projectsData = projectsRes.value;
        // API returns { success: true, data: { projects: [...], count: number } }
        const projects = projectsData?.data?.projects || projectsData?.projects || [];
        projects.forEach(p => {
          // Only include active projects (filter out deleted/archived)
          if (p.status && p.status !== 'active') {
            return;
          }
          // Treat project_id as screenplay_id (unified system)
          const screenplayId = p.project_id;
          // Only add if it doesn't already exist as a screenplay
          if (!screenplayIdSet.has(screenplayId)) {
            screenplayIdSet.add(screenplayId);
            allScreenplays.push({
              id: screenplayId, // Primary identifier
              screenplay_id: screenplayId, // Primary identifier
              project_id: screenplayId, // Fallback compatibility (project_id = screenplay_id)
              name: p.project_name,
              created_at: p.created_at,
              updated_at: p.updated_at,
              description: p.description,
              genre: p.metadata?.genre,
              storage_provider: p.storage_provider,
              status: p.status || 'active' // Include status from API
            });
          }
        });
      } else {
        console.error('Error fetching projects:', projectsRes.reason);
      }
      
      // Sort by updated_at (most recent first)
      allScreenplays.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
      
      setProjects(allScreenplays);
      console.log('[Dashboard] Unified screenplays (screenplay_id primary, project_id fallback):', allScreenplays.length, 'total');
      
      // Handle videos (non-critical)
      if (videosRes.status === 'fulfilled') {
        // api.video.getJobs() returns axios response
        // Backend returns: { success: true, jobs: [...], total: number }
        const videosData = videosRes.value.data;
        const jobs = videosData?.jobs || videosData?.data?.jobs || [];
        setRecentVideos(jobs.slice(0, 5));
      } else {
        console.error('Error fetching videos:', videosRes.reason);
        setRecentVideos([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = async (project) => {
    if (!project) {
      console.error('[Dashboard] handleProjectCreated called with undefined project');
      toast.error('Failed to create project - invalid response');
      return;
    }
    
    console.log('[Dashboard] Project received:', project);
    
    // UNIFIED: screenplay_id is primary, project_id is fallback
    // Treat project_id as screenplay_id (they're the same in unified system)
    const screenplayId = project.project_id || project.screenplay_id || project.id;
    const transformedProject = {
      id: screenplayId, // Primary identifier
      screenplay_id: screenplayId, // Primary identifier
      project_id: screenplayId, // Fallback compatibility (project_id = screenplay_id)
      name: project.project_name || project.name,
      created_at: project.created_at,
      updated_at: project.updated_at,
      description: project.description,
      genre: project.metadata?.genre,
      storage_provider: project.storage_provider
    };
    
    console.log('[Dashboard] Transformed project:', transformedProject);
    
    // Add new project to list immediately for instant UI feedback
    setProjects([transformedProject, ...projects]);
    
    // Also refresh the projects list from the backend to ensure consistency
    // This ensures the project appears even if user navigates back
    try {
      const screenplaysRes = await fetch('/api/screenplays/list?status=active&limit=50');
      
      if (screenplaysRes.ok) {
        const screenplaysData = await screenplaysRes.json();
        const screenplays = screenplaysData?.data?.screenplays || screenplaysData?.screenplays || [];
        // Transform screenplays to match the projects format
        const refreshedProjects = screenplays.map(s => ({
          id: s.screenplay_id,
          name: s.title,
          created_at: s.created_at,
          updated_at: s.updated_at,
          screenplay_id: s.screenplay_id,
          description: s.description,
          genre: s.metadata?.genre,
          storage_provider: s.storage_provider
        })).filter(Boolean);
        
        // Update projects list with fresh data from backend
        setProjects(refreshedProjects);
        console.log('[Dashboard] Refreshed projects list from backend:', refreshedProjects.length, 'projects');
      }
    } catch (error) {
      console.error('[Dashboard] Error refreshing projects after creation:', error);
      // Don't fail the whole flow if refresh fails - we already added it to state
    }
    
    // Navigate to the editor with the new project
    const projectId = transformedProject.id || transformedProject.project_id;
    if (projectId) {
      router.push(`/write?project=${projectId}`);
    } else {
      console.error('[Dashboard] No project ID found in transformed project');
      toast.error('Failed to navigate to project - missing ID');
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!showDeleteConfirm || showDeleteConfirm !== projectId) {
      // First click - show confirmation
      setShowDeleteConfirm(projectId);
      return;
    }

    // Second click - actually delete
    setDeletingProjectId(projectId);
    try {
      // Try screenplays API first (most common case)
      // Note: Next.js API route handles auth server-side
      let response = await fetch(`/api/screenplays/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // If screenplay deletion returns 404, try projects API (for legacy projects)
      if (response.status === 404) {
        console.log('[Dashboard] Screenplay not found, trying projects API for:', projectId);
        response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = 'Failed to delete';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      // Get response data to check if deletion was successful
      const responseData = await response.json().catch(() => ({}));
      console.log('[Dashboard] Delete response:', responseData);
      
      // Refresh the dashboard to get updated list from server
      await fetchDashboardData();
      setShowDeleteConfirm(null);
      toast.success('Deleted successfully');
      
      // If this was the current screenplay, clear it
      if (currentScreenplayId === projectId) {
        setCurrentScreenplayId(null);
      }
    } catch (error) {
      console.error('Error deleting screenplay:', error);
      toast.error(error.message || 'Failed to delete screenplay');
    } finally {
      setDeletingProjectId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-cinema-red"></div>
      </main>
    );
  }

  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js comes from dashboard/layout.js (was causing double header) */}
      <main className="min-h-screen bg-[#0A0A0A]">
      
      {/* Welcome Modal for First-Time Users */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        userCredits={credits?.balance || 50}
      />
      
      {/* Settings Modal */}
      {editingProjectId && (
        <ScreenplaySettingsModal
          isOpen={!!editingProjectId}
          onClose={() => {
            setEditingProjectId(null);
            fetchDashboardData(); // Refresh to show updated data
          }}
          screenplayId={editingProjectId}
        />
      )}

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Minimal Header with Greeting */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-base-content mb-1">
            Welcome back, {user?.firstName || 'Creator'}
          </h1>
          <p className="text-sm md:text-base text-base-content/60">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {/* Quick Stats - Minimal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Credits */}
          <div className="group relative overflow-hidden rounded-2xl bg-base-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-base-300/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cinema-red/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cinema-red/10 rounded-lg">
                  <Zap className="w-5 h-5 text-cinema-red" />
                </div>
                <p className="text-sm font-medium text-base-content/60">Credits</p>
              </div>
              <p className="text-3xl font-semibold text-base-content mb-1">
                {credits?.balance?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-base-content/50">Available balance</p>
            </div>
          </div>

          {/* Projects */}
          <div className="group relative overflow-hidden rounded-2xl bg-base-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-base-300/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-base-content/60">Projects</p>
              </div>
              <p className="text-3xl font-semibold text-base-content mb-1">
                {projects.length}
              </p>
              <p className="text-xs text-base-content/50">Active screenplays</p>
            </div>
          </div>

          {/* Videos */}
          <div className="group relative overflow-hidden rounded-2xl bg-base-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-base-300/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Video className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-medium text-base-content/60">Videos</p>
              </div>
              <p className="text-3xl font-semibold text-base-content mb-1">
                {recentVideos.length}
              </p>
              <p className="text-xs text-base-content/50">Total created</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Modern Minimal */}
        <div>
          <h2 className="text-lg font-semibold text-base-content mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Link 
              href="/editor" 
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cinema-red to-cinema-red/90 p-6 text-base-content hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <FileText className="w-6 h-6 mb-3 relative z-10" />
              <h3 className="font-semibold text-base mb-1 relative z-10">Write Screenplay</h3>
              <p className="text-xs text-base-content/80 relative z-10">Create a new script</p>
            </Link>
            
            <Link 
              href="/production" 
              className="group relative overflow-hidden rounded-xl bg-base-200 p-6 hover:shadow-lg transition-all duration-300 border border-base-300/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cinema-red/5 rounded-full -mr-12 -mt-12"></div>
              <Video className="w-6 h-6 mb-3 text-cinema-red relative z-10" />
              <h3 className="font-semibold text-base mb-1 text-base-content relative z-10">Generate Video</h3>
              <p className="text-xs text-base-content/60 relative z-10">AI-powered creation</p>
            </Link>
            
            <Link 
              href="/composition" 
              className="group relative overflow-hidden rounded-xl bg-base-200 p-6 hover:shadow-lg transition-all duration-300 border border-base-300/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
              <Clapperboard className="w-6 h-6 mb-3 text-primary relative z-10" />
              <h3 className="font-semibold text-base mb-1 text-base-content relative z-10">Compose Clips</h3>
              <p className="text-xs text-base-content/60 relative z-10">Edit and combine</p>
            </Link>
            
            <Link 
              href="/timeline" 
              className="group relative overflow-hidden rounded-xl bg-base-200 p-6 hover:shadow-lg transition-all duration-300 border border-base-300/50"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12"></div>
              <Clock className="w-6 h-6 mb-3 text-accent relative z-10" />
              <h3 className="font-semibold text-base mb-1 text-base-content relative z-10">Edit Timeline</h3>
              <p className="text-xs text-base-content/60 relative z-10">Fine-tune edits</p>
            </Link>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-base-content">My Screenplays</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-base-content rounded-lg transition-all duration-300 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
          
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.filter(project => project != null).map((project) => {
                // Check if this project's screenplay_id matches the current screenplay
                // Screenplays are now the primary entity
                const projectId = project?.id || project?.screenplay_id; // Use id (which is screenplay_id)
                const projectScreenplayId = project?.screenplay_id || project?.id;
                const isCurrent = currentScreenplayId === projectScreenplayId || 
                                 (typeof window !== 'undefined' && localStorage.getItem('current_screenplay_id') === projectScreenplayId);
                const isDeleting = deletingProjectId === projectId;
                const showConfirm = showDeleteConfirm === projectId;
                
                return (
                  <div
                    key={projectId}
                    className="flex items-center justify-between p-5 bg-base-200 rounded-xl hover:shadow-md transition-all duration-300 border border-base-300/50 group"
                  >
                    <Link
                      href={`/write?project=${projectId}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="p-3 bg-cinema-red/10 rounded-lg group-hover:bg-cinema-red/20 transition-colors flex-shrink-0">
                        <FileText className="w-5 h-5 text-cinema-red" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base text-base-content group-hover:text-cinema-red transition-colors truncate">
                            {project.name || project.title || 'Untitled Project'}
                          </h3>
                          {isCurrent && (
                            <span className="badge badge-sm badge-primary">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/60">
                          {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!showConfirm ? (
                        <>
                          {project.status && project.status !== 'active' && (
                            <span className={`badge badge-sm ${
                              project.status === 'archived' ? 'badge-warning' : 
                              project.status === 'deleted' ? 'badge-error' : 
                              'badge-ghost'
                            }`}>
                              {project.status}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjectId(projectId);
                            }}
                            className="p-2 rounded-lg hover:bg-primary/20 text-base-content/60 hover:text-primary transition-colors"
                            title="Edit screenplay settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(projectId, project.name || project.title || 'Untitled Project');
                            }}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-base-content/60 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete screenplay"
                          >
                            {isDeleting ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500">Delete?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(projectId, project.name || project.title || 'Untitled Project');
                            }}
                            disabled={isDeleting}
                            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(null);
                            }}
                            className="px-3 py-1 text-xs bg-base-300 hover:bg-base-100 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <p className="mb-4">No screenplays yet. Create your first screenplay to get started.</p>
            </div>
          )}
        </div>

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-base-content mb-4">Recent Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="group relative overflow-hidden bg-base-200 rounded-xl p-5 border border-base-300/50 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Video className="w-5 h-5 text-accent" />
                    </div>
                    <span className={`badge badge-sm ${
                      video.status === 'completed' ? 'badge-success' :
                      video.status === 'processing' ? 'badge-warning' :
                      'badge-ghost'
                    }`}>
                      {video.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-base-content line-clamp-2 mb-2">
                    {video.prompt || 'Video'}
                  </h3>
                  {video.status === 'completed' && (
                    <button className="w-full mt-3 py-2 text-sm font-medium text-cinema-red hover:bg-cinema-red/10 rounded-lg transition-colors">
                      View Video
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Modern Minimal */}
        {projects.length === 0 && (
          <div className="relative overflow-hidden bg-base-200 rounded-2xl p-12 text-center border border-base-300/50">
            <div className="absolute top-0 left-0 w-64 h-64 bg-cinema-red/5 rounded-full -ml-32 -mt-32"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mb-32"></div>
            <div className="relative z-10">
              <div className="inline-flex p-6 bg-cinema-red/10 rounded-2xl mb-6">
                <Film className="w-12 h-12 text-cinema-red" />
              </div>
              <h2 className="text-2xl font-semibold text-base-content mb-3">
                Start Your First Project
              </h2>
              <p className="text-base-content/60 mb-8 max-w-md mx-auto">
                Write a screenplay, generate videos, or compose clips. Your creative journey begins here.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cinema-red to-cinema-red/90 text-base-content rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
