import { Suspense } from 'react';
import ProductionPageClient from './ProductionPageClient';

// Route segment config - must be in server component
export const dynamic = 'force-dynamic';

/**
 * Production Page - Feature 0109 Complete Redesign
 * 
 * Mobile-first, screenplay-centric production interface with:
 * - AI Chat (conversational workflows) - NOW VIA DRAWER
 * - Scene Builder (from screenplay)
 * - Media Library (upload management + style matching)
 * - Character/Location/Asset Banks
 * - Jobs (monitoring)
 * - Creative Gallery (inspiration)
 * 
 * Three Clear Paths:
 * 1. One-Off Creation → AI Chat Drawer
 * 2. Screenplay-Driven → Scene Builder
 * 3. Hybrid Workflow → Media Library + Style Analyzer + Scene Builder
 */

export default function ProductionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Production Hub...</p>
        </div>
      </div>
    }>
      <ProductionPageClient />
    </Suspense>
  );
}
