'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import Link from 'next/link';
import WelcomeModal from '@/components/WelcomeModal';
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
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Only fetch data once user and auth are loaded
    if (user && getToken) {
      fetchDashboardData();
      // Temporarily disable welcome modal to debug login loop
      // checkFirstVisit();
    }
  }, [user, getToken]);

  const checkFirstVisit = async () => {
    try {
      // Check if user has seen welcome modal
      const hasSeenWelcome = user?.publicMetadata?.hasSeenWelcome;
      
      if (!hasSeenWelcome && user) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
  };

  const handleCloseWelcome = async () => {
    setShowWelcomeModal(false);
    
    // Update user metadata to mark welcome as seen
    try {
      await user?.update({
        publicMetadata: {
          ...user.publicMetadata,
          hasSeenWelcome: true,
        },
      });
    } catch (error) {
      console.error('Error updating user metadata:', error);
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
        api.projects.list(),
        api.video.getJobs()
      ]);
      
      setCredits(creditsRes.data);
      setProjects(projectsRes.data.projects || []);
      setRecentVideos(videosRes.data.jobs?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <main className="min-h-screen bg-base-100">
      {/* Welcome Modal for First-Time Users */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        userCredits={credits?.balance || 100}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName || 'Creator'}! 🎬</h1>
          <p className="text-white/80">Ready to create something amazing?</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Credits */}
          <div className="card bg-base-200 shadow-xl border border-cinema-red/20">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Available Credits</p>
                  <p className="text-3xl font-bold text-cinema-red">
                    {credits?.balance?.toLocaleString() || '0'}
                  </p>
                </div>
                <Zap className="w-12 h-12 text-cinema-gold" />
              </div>
              <Link href="/pricing" className="btn btn-sm btn-outline mt-2">
                Add Credits
              </Link>
            </div>
          </div>

          {/* Projects */}
          <div className="card bg-base-200 shadow-xl border border-cinema-blue/20">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Active Projects</p>
                  <p className="text-3xl font-bold text-cinema-blue">
                    {projects.length}
                  </p>
                </div>
                <FileText className="w-12 h-12 text-cinema-blue" />
              </div>
              <button 
                onClick={() => window.location.href = '/editor'}
                className="btn btn-sm btn-outline mt-2"
              >
                New Project
              </button>
            </div>
          </div>

          {/* Videos */}
          <div className="card bg-base-200 shadow-xl border border-cinema-gold/20">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Videos Created</p>
                  <p className="text-3xl font-bold text-cinema-gold">
                    {recentVideos.length}
                  </p>
                </div>
                <Video className="w-12 h-12 text-cinema-gold" />
              </div>
              <Link href="/production" className="btn btn-sm btn-outline mt-2">
                Generate Video
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              <Film className="w-6 h-6 text-cinema-red" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/editor" 
                className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none hover:opacity-90"
              >
                <FileText className="w-5 h-5" />
                Write Screenplay
              </Link>
              <Link 
                href="/production" 
                className="btn btn-lg btn-outline"
              >
                <Video className="w-5 h-5" />
                Generate Video
              </Link>
              <Link 
                href="/composition" 
                className="btn btn-lg btn-outline"
              >
                <Clapperboard className="w-5 h-5" />
                Compose Clips
              </Link>
              <Link 
                href="/timeline" 
                className="btn btn-lg btn-outline"
              >
                <Clock className="w-5 h-5" />
                Edit Timeline
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                <FileText className="w-6 h-6 text-cinema-blue" />
                Recent Projects
              </h2>
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/editor?project=${project.id}`}
                    className="flex items-center justify-between p-4 bg-base-300 rounded-lg hover:bg-base-100 transition-colors border border-transparent hover:border-cinema-red/30"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{project.title || 'Untitled Project'}</h3>
                      <p className="text-sm text-base-content/60">
                        Last edited: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-outline">{project.status || 'draft'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                <Video className="w-6 h-6 text-cinema-gold" />
                Recent Videos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="card bg-base-300 border border-cinema-gold/20 hover:border-cinema-gold/50 transition-colors"
                  >
                    <div className="card-body p-4">
                      <h3 className="font-semibold line-clamp-2">{video.prompt || 'Video'}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`badge ${
                          video.status === 'completed' ? 'badge-success' :
                          video.status === 'processing' ? 'badge-warning' :
                          'badge-ghost'
                        }`}>
                          {video.status}
                        </span>
                        {video.status === 'completed' && (
                          <button className="btn btn-xs btn-primary">View</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <Film className="w-24 h-24 text-cinema-red/30 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Start Your First Project! 🎬</h2>
              <p className="text-base-content/60 mb-6 max-w-md">
                Write a screenplay, generate videos, or compose clips. Your creative journey begins here.
              </p>
              <Link 
                href="/editor" 
                className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
