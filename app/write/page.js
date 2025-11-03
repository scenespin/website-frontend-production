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
  const { currentProject, isLoading } = useScreenplay();
  const projectId = searchParams?.get('project');

  useEffect(() => {
    // Auth guaranteed by wrapper
    // If no project specified, redirect to dashboard to select one
    if (!projectId && !isLoading) {
      router.replace('/dashboard');
    }
  }, [projectId, isLoading, router]);

  // Show loading state while project is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show loading if no project selected (will redirect)
  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Render the editor workspace
  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
      <EditorSubNav activeTab="write" projectId={projectId} />
      <EditorWorkspace />
    </>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content">Loading editor...</p>
        </div>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}

