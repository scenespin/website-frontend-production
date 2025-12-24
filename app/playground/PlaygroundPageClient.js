'use client';

import { useEffect, useState, Suspense } from 'react';
import { PlaygroundPanel } from '@/components/production/PlaygroundPanel';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { QueryClientProvider } from '@/providers/QueryClientProvider';
import { ProductionErrorBoundary } from '@/components/production/ProductionErrorBoundary';

function PlaygroundPanelWrapper() {
  return (
    <ProductionErrorBoundary componentName="Playground">
      <PlaygroundPanel className="h-full" />
    </ProductionErrorBoundary>
  );
}

export default function PlaygroundPageClient() {
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
          <p className="text-gray-400">Loading Playground...</p>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">
        <Suspense fallback={
          <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading Playground...</p>
            </div>
          </div>
        }>
          <PlaygroundPanelWrapper />
        </Suspense>
      </div>
    </QueryClientProvider>
  );
}

