'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WelcomeModal from '@/components/WelcomeModal';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
// ResponsiveHeader removed - Navigation.js comes from dashboard/layout.js
import { 
  Film, 
  Clapperboard, 
  FileText, 
  Video, 
  Clock, 
  Plus,
  Zap,
  TrendingUp
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

  useEffect(() => {
    // Auth guaranteed by wrapper, fetch data immediately
    // Note: We keep user in scope for welcome modal logic
    if (user) {
      fetchDashboardData();
      checkFirstVisit();
    }
  }, [user]);

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
    
    // Save to localStorage first (instant)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
    
    // Update user metadata in background (can fail silently)
    try {
      await user?.update({
        publicMetadata: {
          ...user.publicMetadata,
          hasSeenWelcome: true,
        },
      });
      console.log('[Dashboard] Welcome modal dismissed and saved');
    } catch (error) {
      console.error('[Dashboard] Error saving welcome modal state (localStorage used as fallback):', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Set the auth token getter for API calls
      // Use JWT template if configured, otherwise use default
      const { setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      
      const [creditsRes, projectsRes, videosRes] = await Promise.all([
        api.user.getCredits(),
        fetch('/api/projects/list').then(r => r.json()),
        api.video.getJobs()
      ]);
      
      setCredits(creditsRes.data);
      setProjects(projectsRes.projects || []);
      setRecentVideos(videosRes.data.jobs?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project) => {
    // Add new project to list
    setProjects([project, ...projects]);
    // Navigate to the editor with the new project
    router.push(`/write?project=${project.project_id}`);
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

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-base-content mb-4">Recent Projects</h2>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.project_id}
                  href={`/write?project=${project.project_id}`}
                  className="flex items-center justify-between p-5 bg-base-200 rounded-xl hover:shadow-md transition-all duration-300 border border-base-300/50 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cinema-red/10 rounded-lg group-hover:bg-cinema-red/20 transition-colors">
                      <FileText className="w-5 h-5 text-cinema-red" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-base-content group-hover:text-cinema-red transition-colors">
                        {project.project_name || 'Untitled Project'}
                      </h3>
                      <p className="text-sm text-base-content/60">
                        {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-sm badge-ghost">{project.is_archived ? 'archived' : 'active'}</span>
                    <svg className="w-5 h-5 text-base-content/30 group-hover:text-cinema-red group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
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
