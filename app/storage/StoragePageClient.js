'use client';

import { useEffect, useState, Suspense } from 'react';
import { StorageHub } from '@/components/storage/StorageHub';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { QueryClientProvider } from '@/providers/QueryClientProvider';
import { ProductionErrorBoundary } from '@/components/production/ProductionErrorBoundary';

function StorageHubWrapper() {
  return (
    <ProductionErrorBoundary componentName="Storage Hub">
      <StorageHub />
    </ProductionErrorBoundary>
  );
}

export default function StoragePageClient() {
  const [mounted, setMounted] = useState(false);
  const screenplay = useScreenplay();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Storage...</p>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading Storage...</p>
          </div>
        </div>
      }>
        <StorageHubWrapper />
      </Suspense>
    </QueryClientProvider>
  );
}

