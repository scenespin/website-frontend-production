'use client';

/**
 * /app/write Page
 * Main screenplay editor - requires authentication and GitHub connection
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EditorWorkspace from '@/components/editor/EditorWorkspace';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import GitHubRequiredGate from '@/components/onboarding/GitHubRequiredGate';

function WritePageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project');

  // GitHub connection required for full functionality
  // (characters, locations, scenes persistence)
  return (
    <GitHubRequiredGate>
      <div className="bg-slate-900">
        <EditorSubNav activeTab="write" projectId={projectId} />
        <EditorWorkspace />
      </div>
    </GitHubRequiredGate>
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

