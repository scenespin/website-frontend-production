'use client';

import { useEffect, useState, Suspense } from 'react';
import { ProductionHub } from '@/components/production/ProductionHub';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { QueryClientProvider } from '@/providers/QueryClientProvider';

function ProductionHubWrapper({ projectId }) {
  return <ProductionHub projectId={projectId} />;
}

export default function ProductionPageClient() {
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
          <p className="text-gray-400">Loading Production Hub...</p>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider>
      {/* ResponsiveHeader removed - Navigation.js comes from production/layout.js */}
      <Suspense fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading Production Hub...</p>
          </div>
        </div>
      }>
        <ProductionHubWrapper projectId={screenplay.screenplayId || 'default'} />
      </Suspense>
    </QueryClientProvider>
  );
}

