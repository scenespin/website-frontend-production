'use client';

import { ScreenplayProvider } from '@/contexts/ScreenplayContext';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function CompositionLayout({ children }) {
  return (
    <ScreenplayProvider>
      {children}
    </ScreenplayProvider>
  );
}
