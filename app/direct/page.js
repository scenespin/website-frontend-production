import { Suspense } from 'react';
import DirectPageClient from './DirectPageClient';

// Route segment config - must be in server component
export const dynamic = 'force-dynamic';

/**
 * Direct Page - Scene Builder & Storyboard
 * 
 * Contains:
 * - Scene Builder (renamed from Scene Manifest)
 * - Storyboard (renamed from Scenes)
 */

export default function DirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Direct Hub...</p>
        </div>
      </div>
    }>
      <DirectPageClient />
    </Suspense>
  );
}

