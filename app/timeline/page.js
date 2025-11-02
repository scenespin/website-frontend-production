'use client';

/**
 * /timeline Page
 * Redirects to dashboard - timeline is accessed via project selection
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function TimelinePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.replace('/sign-in?redirect_url=/dashboard');
      } else {
        // Redirect to dashboard where user can select/create project
        router.replace('/dashboard');
      }
    }
  }, [isLoaded, user, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0b14]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-base-content">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
