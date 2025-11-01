'use client';

import { ScreenplayProvider } from '@/contexts/ScreenplayContext';

export const dynamic = 'force-dynamic';

export default function TeamLayout({ children }) {
  return (
    <ScreenplayProvider>
      {children}
    </ScreenplayProvider>
  );
}

