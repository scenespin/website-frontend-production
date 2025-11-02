'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Production Page - Integrated TypeScript Components
 * 
 * Provides advanced production features:
 * - Tab 1: Workflows (guided, workflow-based production)
 * - Tab 2: Scene Builder (advanced, script-based production)
 * - Tab 3: Characters (character bank with references)
 * - Tab 4: Jobs (workflow history & recovery)
 */

import { ProductionPageLayout } from '@/components/production/ProductionPageLayout';

export default function ProductionPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0b14] via-[#1a1625] to-[#0d0b14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content/60">Loading production tools...</p>
          </div>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ProductionPageLayout />
    </div>
  );
}
