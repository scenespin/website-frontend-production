'use client';

/**
 * /app/write Page
 * Main screenplay editor - requires authentication and project selection
 */

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import EditorWorkspace from '@/components/editor/EditorWorkspace';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import { FileText, Plus, Film } from 'lucide-react';

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProject, isLoading, error } = useScreenplay();
  const projectId = searchParams?.get('project');
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  useEffect(() => {
    // Auth guaranteed by wrapper
    // If no project specified, try to redirect once, then show UI
    if (!projectId && !isLoading && !hasAttemptedRedirect) {
      setHasAttemptedRedirect(true);
      // Give dashboard 2 seconds to load, then show create project UI if still no redirect
      const timer = setTimeout(() => {
        // If we're still here after 2 seconds, user needs to create/select a project
        setHasAttemptedRedirect(true);
      }, 2000);
      
      // Try to redirect to dashboard
      router.replace('/dashboard');
      
      return () => clearTimeout(timer);
    }
  }, [projectId, isLoading, router, hasAttemptedRedirect]);

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Editor</h2>
          <p className="text-slate-400 mb-4">{error.message || 'Something went wrong'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while project is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show "Create/Select Project" UI if no project after redirect attempt
  if (!projectId && hasAttemptedRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="inline-flex p-6 bg-[#DC143C]/10 rounded-2xl mb-6">
              <FileText className="w-16 h-16 text-[#DC143C]" />
            </div>
            
            {/* Heading */}
            <h1 className="text-3xl font-bold text-white mb-3">
              No Project Selected
            </h1>
            <p className="text-slate-400 mb-8 text-lg">
              To start writing, you'll need to create a new project or select an existing one from your dashboard.
            </p>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create New Project
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors border border-slate-600"
              >
                <Film className="w-5 h-5" />
                View My Projects
              </button>
            </div>
            
            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                💡 <strong className="text-slate-400">Quick Start:</strong> Create a project on the dashboard, then return here to start writing your screenplay.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if waiting for redirect
  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Checking for projects...</p>
        </div>
      </div>
    );
  }

  // Render the editor workspace
  return (
    <div className="bg-slate-900">
      <EditorSubNav activeTab="write" projectId={projectId} />
      <EditorWorkspace />
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading editor...</p>
        </div>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}

