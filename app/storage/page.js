import { Suspense } from 'react';
import StoragePageClient from './StoragePageClient';

// Route segment config - must be in server component
export const dynamic = 'force-dynamic';

/**
 * Archive Page - Media Library & Style Analyzer
 * 
 * NOTE: Displayed as "Archive" to users for film industry terminology.
 * Backend/API still uses "Storage" or "media-library" - no breaking changes.
 * 
 * Contains:
 * - Archive (upload management - displayed as "Archive", backend uses "Storage")
 * - Style Analyzer (match existing footage)
 */

export default function StoragePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Archive...</p>
        </div>
      </div>
    }>
      <StoragePageClient />
    </Suspense>
  );
}

