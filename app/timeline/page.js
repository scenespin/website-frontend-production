'use client';

import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { EnhancedTimelineEditor } from '@/components/timeline/EnhancedTimelineEditor';

export default function TimelinePage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  // Get preloaded clips from navigation state (if coming from other pages)
  const preloadedClipsData = searchParams.get('clips') 
    ? JSON.parse(decodeURIComponent(searchParams.get('clips'))) 
    : null;

  const projectId = searchParams.get('projectId') || null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Please sign in to use the Timeline Editor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <EnhancedTimelineEditor 
        projectId={projectId}
        preloadedClips={preloadedClipsData}
      />
    </div>
  );
}
