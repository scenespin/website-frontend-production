import { Suspense } from 'react';
import CharactersPageClient from './CharactersPageClient';

// Route segment config - must be in server component
export const dynamic = 'force-dynamic';

export default function CharactersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <CharactersPageClient />
    </Suspense>
  );
}

