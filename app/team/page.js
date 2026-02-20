'use client';

import { Users, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Prevent static generation since this requires runtime context
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function TeamPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Only render after client-side mount to avoid SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Wait for auth to load
  if (!isLoaded || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0b14] via-[#1a1625] to-[#0d0b14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content/60">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Require authentication
  if (!user) {
    router.push('/sign-in?redirect_url=/team');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0b14] via-[#1a1625] to-[#0d0b14]">
      <div className="container mx-auto p-4 lg:p-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-base-content/60 hover:text-base-content transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">Team Collaboration</h1>
              <p className="text-base-content/60 mt-1">
                Manage team members and permissions
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-base-content/70">
              <p className="font-medium text-blue-400 mb-1">Project-Based Collaboration</p>
              <p>Open a project from your dashboard to access team collaboration features. Each project has its own team settings, GitHub repository, and cloud storage access.</p>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="bg-[#1a1625]/50 border border-purple-500/20 rounded-xl p-8 text-center">
          <Users className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-base-content mb-2">No Project Selected</h2>
          <p className="text-base-content/60 mb-6">
            Select a project to manage collaborators, roles, and permissions
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-base-content rounded-lg transition-all shadow-lg shadow-purple-500/20 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-base-content mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How Collaboration Works
          </h3>
          <div className="space-y-2 text-sm text-base-content/70">
            <p>
              • <strong className="text-blue-400">Automatic Setup:</strong> When you add a
              collaborator, they're automatically invited to your GitHub repository and granted
              access to the project's cloud storage folder.
            </p>
            <p>
              • <strong className="text-blue-400">Role-Based Access:</strong> Each role (Director,
              Writer, Asset Manager, Contributor, Viewer) has specific permissions for screenplay editing and asset
              management.
            </p>
            <p>
              • <strong className="text-blue-400">Real-Time Sync:</strong> All changes are synced
              via GitHub, ensuring everyone works with the latest version.
            </p>
            <p>
              • <strong className="text-blue-400">Your Data, Your Control:</strong> All screenplay
              content and assets are stored in your own GitHub repository and cloud storage - no
              vendor lock-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

