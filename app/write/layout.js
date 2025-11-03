'use client';

import { ScreenplayProvider } from '@/contexts/ScreenplayContext';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function WriteLayout({ children }) {
  return (
    <ScreenplayProvider>
      {children}
    </ScreenplayProvider>
  );
}

