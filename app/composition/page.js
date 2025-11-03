'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CompositionStudio } from '@/components/composition/CompositionStudio';
// ResponsiveHeader removed - will use Navigation.js from wrapper

function CompositionContent() {
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
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20">
        <CompositionStudio 
          userId={user.id}
          recomposeData={recomposeData}
          preloadedClips={preloadedClipsData}
        />
      </div>
    </>
  );
}

export default function CompositionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
          <p className="text-base-content/60">Loading Composition Studio...</p>
        </div>
      </div>
    }>
      <CompositionContent />
    </Suspense>
  );
}
