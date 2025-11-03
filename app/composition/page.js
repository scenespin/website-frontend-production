'use client';

import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CompositionStudio } from '@/components/composition/CompositionStudio';
import { ResponsiveHeader } from '@/components/layout/ResponsiveHeader';

export default function CompositionPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  // Handle preloaded clips and recompose mode
  const recomposeData = searchParams.get('recompose') 
    ? JSON.parse(decodeURIComponent(searchParams.get('recompose'))) 
    : null;

  const preloadedClipsData = searchParams.get('clips') 
    ? JSON.parse(decodeURIComponent(searchParams.get('clips'))) 
    : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Please sign in to use the Composition Studio</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ResponsiveHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-16">
        <CompositionStudio 
          userId={user.id}
          recomposeData={recomposeData}
          preloadedClips={preloadedClipsData}
        />
      </div>
    </>
  );
}
