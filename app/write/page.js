'use client';

/**
 * /app/write Page
 * Main screenplay editor - requires authentication and project selection
 */

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import EditorWorkspace from '@/components/editor/EditorWorkspace';
// ResponsiveHeader removed - will use Navigation.js from wrapper
import { EditorSubNav } from '@/components/editor/EditorSubNav';

function WritePageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProject, isLoading } = useScreenplay();
  const projectId = searchParams?.get('project');

  useEffect(() => {
    if (isLoaded) {
      // Require authentication
      if (!user) {
        router.replace('/sign-in?redirect_url=/dashboard');
        return;
      }

      // If no project specified, redirect to dashboard to select one
      if (!projectId && !isLoading) {
        router.replace('/dashboard');
      }
    }
  }, [isLoaded, user, projectId, isLoading, router]);

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show loading if user not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Show loading if no project selected
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

