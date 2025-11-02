'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Pricing Page Redirect
 * Redirects to /buy-credits where all pricing information is displayed
 */
export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/buy-credits');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="mt-4 text-base-content/60">Redirecting to pricing...</p>
      </div>
    </div>
  );
}

