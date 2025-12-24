'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import WelcomeModal from '@/components/WelcomeModal';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
import ScreenplaySettingsModal from '@/components/editor/ScreenplaySettingsModal';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';
import { toast } from 'sonner';
import RoleBadge from '@/components/collaboration/RoleBadge';
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
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [projects, setProjects] = useState([]);
  // Phase 4.5: Separate owned and collaborated screenplays
  const [ownedScreenplays, setOwnedScreenplays] = useState([]);
  const [collaboratedScreenplays, setCollaboratedScreenplays] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentScreenplayId, setCurrentScreenplayId] = useState(null);
  // Feature 0130: Use screenplayId (not projectId) for consistency
  const [deletingScreenplayId, setDeletingScreenplayId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingScreenplayId, setEditingScreenplayId] = useState(null);
  // 🔥 FIX: Removed sessionStorage tracking for deleted screenplays
  // Backend filters by status='active', so deleted items won't appear on next page load
  // No need for client-side tracking - database is source of truth
  
  // Track optimistically created screenplays to preserve them across remounts
  // Load from sessionStorage on mount to persist across remounts
  const [optimisticScreenplays, setOptimisticScreenplays] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('optimistic_screenplays');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return new Map(Object.entries(parsed));
        } catch (e) {
          console.error('[Dashboard] Failed to parse optimistic screenplays from sessionStorage:', e);
        }
      }
    }
    return new Map();
  });
  
  // Use ref to track optimistic screenplays so fetchDashboardData always has latest values
  const optimisticScreenplaysRef = useRef(optimisticScreenplays);
  useEffect(() => {
    optimisticScreenplaysRef.current = optimisticScreenplays;
    // 🔥 FIX 2: Persist optimisticScreenplays to sessionStorage whenever it changes
    // This ensures newly created screenplays are tracked even after refresh
    if (typeof window !== 'undefined') {
      const serialized = Object.fromEntries(optimisticScreenplays);
      sessionStorage.setItem('optimistic_screenplays', JSON.stringify(serialized));
    }
  }, [optimisticScreenplays]);
  
  // 🔥 FIX: Removed sessionStorage tracking for optimistic edits
  // Database is source of truth - always load from backend on refresh
  // Optimistic updates are fine for immediate UI feedback, but we don't persist them
  
  // Persist optimistic screenplays to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const serialized = Object.fromEntries(optimisticScreenplays);
      sessionStorage.setItem('optimistic_screenplays', JSON.stringify(serialized));
    }
  }, [optimisticScreenplays]);

  useEffect(() => {
    // Auth guaranteed by wrapper, fetch data immediately
    if (user) {
      fetchDashboardData();
      // Get current screenplay ID
      const screenplayId = getCurrentScreenplayId(user);
      setCurrentScreenplayId(screenplayId);
    }
  }, [user]);

  // Refresh dashboard when user navigates back to it (e.g., from editor)
  // This ensures newly created screenplays appear even if they weren't in the list when user left
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      // Refresh when window regains focus (user came back to tab)
      if (document.visibilityState === 'visible') {
        console.log('[Dashboard] Window focused, refreshing data');
        fetchDashboardData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Dashboard] Page became visible, refreshing data');
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔥 FIX: Listen for screenplayUpdated events and update state directly (don't refresh)
  useEffect(() => {
    const handleScreenplayUpdated = (event) => {
      const eventDetail = event.detail;
      if (eventDetail?.screenplayId) {
        console.log('[Dashboard] Screenplay updated event received, updating state directly:', eventDetail.screenplayId);
        
        // Update state directly instead of refreshing (avoids overwriting optimistic updates)
        setProjects(prev => prev.map(p => {
          const screenplayId = p.id || p.screenplay_id;
          if (screenplayId === eventDetail.screenplayId) {
            const updated = {
              ...p,
              ...(eventDetail.title && { name: eventDetail.title }),
              ...(eventDetail.description !== undefined && { description: eventDetail.description }),
              ...(eventDetail.genre !== undefined && { genre: eventDetail.genre })
            };
            console.log('[Dashboard] Updated screenplay in state:', updated.name);
            return updated;
          }
          return p;
        }));
      }
    };
    
    window.addEventListener('screenplayUpdated', handleScreenplayUpdated);
    return () => {
      window.removeEventListener('screenplayUpdated', handleScreenplayUpdated);
    };
  }, []); // Empty deps - event handler doesn't need to recreate
  
  // Refresh dashboard when pathname changes to /dashboard (user navigated back)
  // This catches navigation from other pages even if component doesn't remount
  useEffect(() => {
    if (!user || pathname !== '/dashboard') return;
    
    // Small delay to ensure navigation is complete
    const timeoutId = setTimeout(() => {
      console.log('[Dashboard] Pathname changed to /dashboard, refreshing data');
      fetchDashboardData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pathname, user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      
      // Feature 0130: Fetch data independently so one failure doesn't break everything
      // Only fetch screenplays - no project API fallback
      // Note: Next.js API routes handle auth server-side, so we don't need to send token
      const [creditsRes, screenplaysRes, videosRes] = await Promise.allSettled([
        api.user.getCredits(),
        fetch('/api/screenplays/list?status=active&limit=100', {
          cache: 'no-store', // 🔥 FIX: Prevent browser caching
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
          .then(async r => {
            if (!r.ok) {
              const errorText = await r.text().catch(() => 'Unknown error');
              throw new Error(`Failed to fetch screenplays: ${r.status} ${errorText}`);
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
      
      // Feature 0130: Only use screenplays - no project API fallback
      const allScreenplays = [];
      
      if (screenplaysRes.status === 'fulfilled') {
        const screenplaysData = screenplaysRes.value;
        console.log('[Dashboard] Screenplays API response:', screenplaysData);
        // API returns { success: true, data: { screenplays: [...], count: number } }
        const screenplays = screenplaysData?.data?.screenplays || screenplaysData?.screenplays || [];
        console.log('[Dashboard] Parsed screenplays from API:', screenplays.length);
        console.log('[Dashboard] Screenplay statuses:', screenplays.map(s => ({ 
          id: s.screenplay_id, 
          status: s.status || 'undefined', 
          title: s.title,
          is_archived: s.is_archived 
        })));
        
        // Phase 4.5: Parse new response format with isOwner and userRole
        screenplays.forEach(s => {
          const screenplayId = s.screenplay_id;
          
          // 🔥 FIX: Backend filters by status='active', but add client-side filter as backup
          // This handles DynamoDB eventual consistency where deleted items might still appear
          // Check status explicitly - if it exists and is not 'active', filter it out
          if (s.status && s.status !== 'active') {
            console.log('[Dashboard] ⚠️ Filtering out screenplay with non-active status (eventual consistency catch):', screenplayId, 'status:', s.status, 'title:', s.title);
            return;
          }
          
          // Filter out archived screenplays
          if (s.is_archived) {
            console.log('[Dashboard] Filtering out archived screenplay:', screenplayId, 'title:', s.title);
            return;
          }
          
          // 🔥 FIX: Explicit check for deleted status (defensive programming)
          // Even if status is 'deleted', filter it out (shouldn't happen if backend filter works)
          if (s.status === 'deleted') {
            console.log('[Dashboard] ⚠️ Filtering out deleted screenplay (explicit check):', screenplayId, 'title:', s.title);
            return;
          }
          
          const screenplayData = {
            id: screenplayId, // Primary identifier
            screenplay_id: screenplayId, // Primary identifier
            name: s.title,
            created_at: s.created_at,
            updated_at: s.updated_at,
            description: s.description,
            genre: s.metadata?.genre,
            storage_provider: s.storage_provider,
            status: s.status || 'active', // Include status from API
            // Phase 4.5: Include collaboration metadata
            isOwner: s.isOwner !== undefined ? s.isOwner : true, // Default to true for backward compatibility
            userRole: s.userRole || null
          };
          
          allScreenplays.push(screenplayData);
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
      
      // Merge with optimistic screenplays (preserve optimistically created items)
      // Use ref to get latest optimistic screenplays (state might be stale in closure)
      const currentOptimisticScreenplays = optimisticScreenplaysRef.current;
      const mergedScreenplays = [...allScreenplays];
      const confirmedIds = new Set(allScreenplays.map(p => p.id || p.screenplay_id));
      const toRemove = new Set();
      
      // 🔥 FIX: Removed optimistic edits - database is source of truth
      // Always use backend data on refresh (no sessionStorage persistence)
      
      // Add optimistic screenplays (newly created items not yet in backend)
      currentOptimisticScreenplays.forEach((optimisticProject, id) => {
        // Only add if not already in the list (avoid duplicates)
        // If it's now in the backend, we can remove it from optimistic storage
        if (confirmedIds.has(id)) {
          console.log('[Dashboard] Optimistic screenplay confirmed in backend, removing from optimistic storage:', id);
          toRemove.add(id);
        } else {
          console.log('[Dashboard] Adding optimistic screenplay to list:', id);
          mergedScreenplays.push(optimisticProject);
        }
      });
      
      // Batch remove confirmed optimistic screenplays
      if (toRemove.size > 0) {
        setOptimisticScreenplays(prev => {
          const newMap = new Map(prev);
          toRemove.forEach(id => newMap.delete(id));
          return newMap;
        });
      }
      
      // Sort by updated_at (most recent first)
      mergedScreenplays.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
      
      // Phase 4.5: Separate owned and collaborated screenplays
      const owned = mergedScreenplays.filter(p => p.isOwner !== false); // Default to owned if not specified
      const collaborated = mergedScreenplays.filter(p => p.isOwner === false);
      
      setProjects(mergedScreenplays); // Keep for backward compatibility
      setOwnedScreenplays(owned);
      setCollaboratedScreenplays(collaborated);
      
      console.log('[Dashboard] Screenplays:', {
        total: mergedScreenplays.length,
        owned: owned.length,
        collaborated: collaborated.length,
        fromAPI: allScreenplays.length,
        optimistic: optimisticScreenplays.size
      });
      
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
    console.log('[Dashboard] Project keys:', Object.keys(project));
    console.log('[Dashboard] Project.screenplay_id:', project.screenplay_id);
    console.log('[Dashboard] Project.id:', project.id);
    
    // Feature 0130: Only use screenplay_id - no project_id fallback
    const screenplayId = project.screenplay_id || project.id;
    console.log('[Dashboard] Extracted screenplayId:', screenplayId);
    
    if (!screenplayId) {
      console.error('[Dashboard] ❌ No screenplay_id found in project:', project);
      toast.error('Failed to create project - missing screenplay ID');
      return;
    }
    
    // Feature 0130: Validate ID format - reject proj_ IDs
    if (screenplayId.startsWith('proj_')) {
      console.warn('[Dashboard] ⚠️ Rejected proj_ ID (legacy format):', screenplayId);
      toast.error('Invalid screenplay ID format. Legacy project IDs are no longer supported.');
      return;
    }
    
    // Validate screenplay_ prefix
    if (!screenplayId.startsWith('screenplay_')) {
      console.error('[Dashboard] ❌ Invalid screenplay ID format:', screenplayId);
      console.error('[Dashboard] Expected screenplay_* but got:', screenplayId);
      toast.error(`Invalid screenplay ID format: ${screenplayId}`);
      return;
    }
    
    const transformedProject = {
      id: screenplayId, // Primary identifier
      screenplay_id: screenplayId, // Primary identifier
      name: project.project_name || project.name || project.title,
      created_at: project.created_at,
      updated_at: project.updated_at,
      description: project.description,
      genre: project.metadata?.genre,
      storage_provider: project.storage_provider,
      status: project.status || 'active' // Ensure status is included for filtering
    };
    
    console.log('[Dashboard] Transformed project:', transformedProject);
    console.log('[Dashboard] Will navigate to:', `/write?project=${screenplayId}`);
    
    // Following the pattern from characters/locations: update local state immediately
    // Add new project to list immediately for instant UI feedback
    // Also store in optimisticScreenplays Map to preserve across remounts
    setOptimisticScreenplays(prev => {
      const newMap = new Map(prev);
      newMap.set(screenplayId, transformedProject);
      return newMap;
    });
    
    setProjects(prev => {
      // Check if it already exists (avoid duplicates)
      const exists = prev.some(p => p.id === screenplayId || p.screenplay_id === screenplayId);
      if (exists) {
        console.log('[Dashboard] Screenplay already in list, skipping duplicate');
        return prev;
      }
      return [transformedProject, ...prev];
    });
    
    // Navigate to the editor with the new screenplay
    // CRITICAL: Ensure screenplayId is valid before navigation
    if (screenplayId && screenplayId.startsWith('screenplay_')) {
      console.log('[Dashboard] ✅ Navigating to editor with screenplay:', screenplayId);
      
      // Explicit refresh after create to ensure persistence
      // Longer delay to allow backend to fully process the creation
      setTimeout(() => {
        console.log('[Dashboard] Refreshing after create to ensure persistence');
        fetchDashboardData();
      }, 1500);
      
      router.push(`/write?project=${screenplayId}`);
    } else {
      console.error('[Dashboard] ❌ Cannot navigate - invalid screenplay ID:', screenplayId);
      toast.error(`Failed to navigate to screenplay - invalid ID: ${screenplayId}`);
    }
  };

  const handleDeleteProject = async (screenplayId, projectName) => {
    // Feature 0130: Parameter is actually screenplayId (not projectId)
    if (!showDeleteConfirm || showDeleteConfirm !== screenplayId) {
      // First click - show confirmation
      setShowDeleteConfirm(screenplayId);
      return;
    }

    // Second click - actually delete
    setDeletingScreenplayId(screenplayId);
    try {
      // Feature 0130: Only use screenplays API - no project API fallback
      // Validate ID format - reject proj_ IDs
      if (screenplayId.startsWith('proj_')) {
        console.warn('[Dashboard] ⚠️ Rejected proj_ ID (legacy format):', screenplayId);
        throw new Error(`Invalid screenplay ID format. Legacy project IDs (proj_*) are no longer supported.`);
      }
      
      if (!screenplayId.startsWith('screenplay_')) {
        console.warn('[Dashboard] ⚠️ Invalid ID format:', screenplayId);
        throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplayId}`);
      }
      
      // Note: Next.js API route handles auth server-side
      const response = await fetch(`/api/screenplays/${screenplayId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage = `Failed to delete (${response.status})`;
        let errorDetails = null;
        
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || error.error || error.details || errorMessage;
          errorDetails = error;
        } catch {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`;
          errorDetails = { raw: errorText };
        }
        
        console.error('[Dashboard] Delete error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
          screenplayId: screenplayId,
          errorMessage: errorMessage
        });
        
        throw new Error(errorMessage);
      }

      // Get response data to check if deletion was successful
      const responseData = await response.json().catch(() => ({}));
      console.log('[Dashboard] Delete response:', responseData);
      
      // 🔥 FIX: Remove from optimisticScreenplays if it exists there
      // This ensures newly created screenplays are properly tracked when deleted
      setOptimisticScreenplays(prev => {
        const newMap = new Map(prev);
        if (newMap.has(screenplayId)) {
          console.log('[Dashboard] Removing deleted screenplay from optimisticScreenplays:', screenplayId);
          newMap.delete(screenplayId);
        }
        return newMap;
      });
      
      // Optimistically remove from UI immediately
      // Backend filters by status='active', so deleted items won't appear on next page load
      setProjects(prev => prev.filter(p => p.id !== screenplayId && p.screenplay_id !== screenplayId));
      
      setShowDeleteConfirm(null);
      toast.success('Deleted successfully');
      
      // Dispatch screenplayDeleted event to notify editor
      window.dispatchEvent(new CustomEvent('screenplayDeleted', {
        detail: { screenplayId }
      }));
      
      // 🔥 FIX: If this was the current screenplay, redirect to dashboard or first available screenplay
      if (currentScreenplayId === screenplayId) {
        setCurrentScreenplayId(null);
        // Redirect to dashboard (will show first available screenplay or empty state)
        router.push('/dashboard');
      }
      
      // Backend filters by status='active', so deleted items won't appear on next refresh
      console.log('[Dashboard] Delete complete - backend will filter deleted items on next load');
    } catch (error) {
      console.error('Error deleting screenplay:', error);
      toast.error(error.message || 'Failed to delete screenplay');
    } finally {
      setDeletingScreenplayId(null);
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
      {editingScreenplayId && (
        <ScreenplaySettingsModal
          isOpen={!!editingScreenplayId}
          onClose={(updatedData) => {
            const screenplayId = editingScreenplayId;
            setEditingScreenplayId(null);
            
            // Following the pattern from characters/locations: update local state immediately
            // Update local state optimistically with the data passed from the modal
            if (updatedData && screenplayId) {
              // 🔥 FIX: Optimistic UI update for immediate feedback
              // State is updated directly, no need to refresh (avoids overwriting with stale data)
              setProjects(prev => prev.map(p => {
                if (p.id === screenplayId || p.screenplay_id === screenplayId) {
                  const updated = {
                    ...p,
                    name: updatedData.title || p.name,
                    description: updatedData.description,
                    genre: updatedData.genre
                  };
                  console.log('[Dashboard] Rename - optimistic UI update:', updated.name);
                  return updated;
                }
                return p;
              }));
              
              // 🔥 FIX: Dispatch screenplayUpdated event to notify editor
              // This ensures editor title updates immediately (bidirectional sync)
              window.dispatchEvent(new CustomEvent('screenplayUpdated', {
                detail: { 
                  screenplayId, 
                  title: updatedData.title,
                  description: updatedData.description,
                  genre: updatedData.genre
                }
              }));
              
              // 🔥 FIX: No refresh needed - state updated directly, database will sync on next page load
              // Refreshing here would overwrite optimistic update with potentially stale API data
            }
          }}
          screenplayId={editingScreenplayId}
        />
      )}

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-6 md:space-y-8">
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

        {/* Phase 4.5: My Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-base-content">My Projects</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red/90 text-base-content rounded-lg transition-all duration-300 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
          
          {ownedScreenplays.length > 0 ? (
            <div className="space-y-3">
              {ownedScreenplays.filter(project => project != null).map((project) => {
                // Feature 0130: Use screenplayId (not projectId) - projects are actually screenplays
                // Check if this screenplay's screenplay_id matches the current screenplay
                const screenplayId = project?.id || project?.screenplay_id; // Use id (which is screenplay_id)
                const projectScreenplayId = project?.screenplay_id || project?.id;
                const isCurrent = currentScreenplayId === projectScreenplayId || 
                                 (typeof window !== 'undefined' && localStorage.getItem('current_screenplay_id') === projectScreenplayId);
                const isDeleting = deletingScreenplayId === screenplayId;
                const showConfirm = showDeleteConfirm === screenplayId;
                
                return (
                  <div
                    key={screenplayId}
                    className="flex items-center justify-between p-5 bg-base-200 rounded-xl hover:shadow-md transition-all duration-300 border border-base-300/50 group"
                  >
                    <Link
                      href={`/write?project=${screenplayId}`}
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
                          <span className="badge badge-sm badge-primary/20 text-primary">Owner</span>
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
                              setEditingScreenplayId(screenplayId);
                            }}
                            className="p-2 rounded-lg hover:bg-primary/20 text-base-content/60 hover:text-primary transition-colors"
                            title="Edit screenplay settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(screenplayId, project.name || project.title || 'Untitled Project');
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
                              handleDeleteProject(screenplayId, project.name || project.title || 'Untitled Project');
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
              <p className="mb-4">No projects yet. Create your first project to get started.</p>
            </div>
          )}
        </div>

        {/* Phase 4.5: Shared with Me Section */}
        {collaboratedScreenplays.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-base-content">Shared with Me</h2>
            </div>
            
            <div className="space-y-3">
              {collaboratedScreenplays.filter(project => project != null).map((project) => {
                const screenplayId = project?.id || project?.screenplay_id;
                const projectScreenplayId = project?.screenplay_id || project?.id;
                const isCurrent = currentScreenplayId === projectScreenplayId || 
                                 (typeof window !== 'undefined' && localStorage.getItem('current_screenplay_id') === projectScreenplayId);
                
                return (
                  <div
                    key={screenplayId}
                    className="flex items-center justify-between p-5 bg-base-200/50 rounded-xl hover:shadow-md transition-all duration-300 border border-base-300/30 group"
                  >
                    <Link
                      href={`/write?project=${screenplayId}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base text-base-content group-hover:text-primary transition-colors truncate">
                            {project.name || project.title || 'Untitled Project'}
                          </h3>
                          {isCurrent && (
                            <span className="badge badge-sm badge-primary">Current</span>
                          )}
                          {project.userRole && (
                            <RoleBadge role={project.userRole} size="sm" />
                          )}
                        </div>
                        <p className="text-sm text-base-content/60">
                          {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Collaborators don't have edit/delete buttons - only view access */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
        {ownedScreenplays.length === 0 && collaboratedScreenplays.length === 0 && (
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
