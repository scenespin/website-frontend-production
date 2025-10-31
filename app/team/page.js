'use client';

import { useScreenplay } from '@/contexts/ScreenplayContext';
import { CollaborationPanel } from '@/components/CollaborationPanel';
import { Users, ArrowLeft, GitBranch, Cloud } from 'lucide-react';
import Link from 'next/link';

export default function TeamPage() {
  const { currentProject, isLoading } = useScreenplay();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0b14] via-[#1a1625] to-[#0d0b14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0b14] via-[#1a1625] to-[#0d0b14] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Project Selected</h1>
          <p className="text-gray-400 mb-6">
            Select a project to manage team collaborators
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0b14] via-[#1a1625] to-[#0d0b14]">
      <div className="container mx-auto p-4 lg:p-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Team Collaboration</h1>
              <p className="text-gray-400 mt-1">
                Project: <span className="text-white">{currentProject.project_name}</span>
              </p>
            </div>
          </div>

          {/* Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub Info */}
            {currentProject.github_repo_url && (
              <div className="p-4 bg-[#0d0b14] border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <GitBranch className="w-5 h-5 text-green-400" />
                  <h3 className="font-medium text-white">GitHub Repository</h3>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {currentProject.github_repo_url}
                </p>
              </div>
            )}

            {/* Cloud Storage Info */}
            {currentProject.storage_provider && currentProject.storage_provider !== 'local' && (
              <div className="p-4 bg-[#0d0b14] border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  <h3 className="font-medium text-white">Cloud Storage</h3>
                </div>
                <p className="text-sm text-gray-400 capitalize">
                  {currentProject.storage_provider === 'google-drive'
                    ? 'Google Drive'
                    : currentProject.storage_provider}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collaboration Panel */}
        <div className="bg-[#1a1625]/50 border border-purple-500/20 rounded-xl p-6 lg:p-8 backdrop-blur-sm">
          <CollaborationPanel projectId={currentProject.project_id} isOwner={true} />
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
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
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              • <strong className="text-blue-400">Automatic Setup:</strong> When you add a
              collaborator, they&apos;re automatically invited to your GitHub repository and granted
              access to the project&apos;s cloud storage folder.
            </p>
            <p>
              • <strong className="text-blue-400">Role-Based Access:</strong> Each role (Director,
              Writer, Contributor, Viewer) has specific permissions for screenplay editing and asset
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
