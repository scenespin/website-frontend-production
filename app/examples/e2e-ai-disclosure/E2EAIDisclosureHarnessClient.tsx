'use client';

import AIDisclosurePanel from '@/components/screenplay/AIDisclosurePanel';

interface E2EAIDisclosureHarnessClientProps {
  screenplayId: string;
  screenplayTitle: string;
}

export default function E2EAIDisclosureHarnessClient({
  screenplayId,
  screenplayTitle,
}: E2EAIDisclosureHarnessClientProps) {
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
