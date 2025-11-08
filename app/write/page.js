'use client';

/**
 * /app/write Page
 * Main screenplay editor - requires authentication
 * Feature 0111: GitHub is now optional (DynamoDB storage)
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EditorWorkspace from '@/components/editor/EditorWorkspace';
import { EditorSubNav } from '@/components/editor/EditorSubNav';

function WritePageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project');

  // Feature 0111: No GitHub gate - screenplay saves to DynamoDB automatically
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

