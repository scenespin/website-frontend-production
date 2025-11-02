'use client';

/**
 * /workflows Page
 * Redirects to /production with workflows tab active
 * This maintains URL compatibility while centralizing workflow access
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkflowsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to production page with workflows tab
    router.replace('/production?tab=workflows');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-base-content">Redirecting to workflows...</p>
      </div>
    </div>
  );
}
