'use client';

import { useEffect, useState } from 'react';
// ResponsiveHeader removed - using Navigation.js from layout to fix double-header bug

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
import { useScreenplay } from '@/contexts/ScreenplayContext';

export default function ProductionPage() {
  const [mounted, setMounted] = useState(false);
  const screenplay = useScreenplay();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base-content/60">Loading production tools...</p>
          </div>
        </div>
    );
  }
  
  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js comes from production/layout.js */}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <ProductionPageLayout projectId={screenplay.projectId || 'default'} />
      </div>
    </>
  );
}
