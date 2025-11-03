'use client';

/**
 * /app/write Page
 * Main screenplay editor - requires authentication and project selection
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import EditorWorkspace from '@/components/editor/EditorWorkspace';
// ResponsiveHeader removed - will use Navigation.js from wrapper
import { EditorSubNav } from '@/components/editor/EditorSubNav';

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProject, isLoading, error } = useScreenplay();
  const projectId = searchParams?.get('project');

  useEffect(() => {
    // Auth guaranteed by wrapper
    // If no project specified, redirect to dashboard to select one
    if (!projectId && !isLoading) {
      router.replace('/dashboard');
    }
  }, [projectId, isLoading, router]);

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

  // Show loading state while project is loading (with timeout)
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

  // Show loading if no project selected (will redirect)
  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Render the editor workspace
  return (
    <div className="bg-slate-900">
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
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

