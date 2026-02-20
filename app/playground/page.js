import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PlaygroundPageClient from './PlaygroundPageClient';

// Route segment config - must be in server component
export const dynamic = 'force-dynamic';

/**
 * Playground Page - Creative Experimentation Hub
 * 
 * Standalone route for experimental AI generation:
 * - Image Generation (all models, transparency support)
 * - Video Generation (starting frame, frame-to-frame)
 * - Annotation-to-Video (visual annotation system)
 * - Pre-Production Workflows
 * - Post-Production Workflows (Audio, Enhancement)
 * 
 * Independent from Production Hub, accessible via top-level navigation.
 */

export default function PlaygroundPage() {
  const isPlaygroundEnabled = process.env.NEXT_PUBLIC_ENABLE_PLAYGROUND !== 'false';
  if (!isPlaygroundEnabled) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Playground...</p>
        </div>
      </div>
    }>
      <PlaygroundPageClient />
    </Suspense>
  );
}

