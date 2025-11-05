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

  // Auth guaranteed by wrapper, user.id will be available
  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
      <div className="min-h-screen bg-[#0A0A0A]">
        <CompositionStudio 
          userId={user?.id}
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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Composition Studio...</p>
        </div>
      </div>
    }>
      <CompositionContent />
    </Suspense>
  );
}
