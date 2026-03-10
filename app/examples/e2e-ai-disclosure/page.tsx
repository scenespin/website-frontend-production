'use client';

import { useSearchParams } from 'next/navigation';
import AIDisclosurePanel from '@/components/screenplay/AIDisclosurePanel';

export default function E2EAIDisclosureHarnessPage() {
  const searchParams = useSearchParams();
  const screenplayId = searchParams?.get('screenplayId') || 'screenplay_e2e_default';
  const screenplayTitle = searchParams?.get('title') || 'E2E Screenplay';

  // Keep this harness out of production deployments while still available in local/CI test runs.
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        E2E harness is disabled in production.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <AIDisclosurePanel
        isOpen={true}
        onClose={() => {}}
        screenplayId={screenplayId}
        screenplayTitle={screenplayTitle}
      />
    </div>
  );
}
