'use client';

/**
 * /timeline Page
 * Multi-track video timeline editor with 8 video + 8 audio tracks
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnhancedTimelineEditor } from '@/components/timeline/EnhancedTimelineEditor';

function TimelineContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('project');
  
  // Handle preloaded clips (can come from composition)
  const preloadedClipsData = searchParams.get('clips') 
    ? JSON.parse(decodeURIComponent(searchParams.get('clips'))) 
    : null;

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A]">
        <EnhancedTimelineEditor 
          projectId={projectId}
          preloadedClips={preloadedClipsData}
        />
      </div>
    </>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading timeline editor...</p>
        </div>
      </div>
    }>
      <TimelineContent />
    </Suspense>
  );
}
