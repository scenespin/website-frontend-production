'use client';

import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import AgentDrawer from '@/components/AgentDrawer';
import UnifiedChatPanel from '@/components/UnifiedChatPanel';
import { PitchDeckAdvisorProvider, useOptionalPitchDeckAdvisorContext } from '@/contexts/PitchDeckAdvisorContext';
import type { ReactNode } from 'react';

function PitchDeckStoryAdvisorPanel() {
  const advisorContext = useOptionalPitchDeckAdvisorContext();
  return <UnifiedChatPanel pitchDeckContextPacket={advisorContext?.packet || null} />;
}

export default function PitchDeckLayout({ children }: { children: ReactNode }) {
  return (
    <PitchDeckAdvisorProvider>
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <Suspense fallback={<div className="h-16 border-b border-white/10 bg-[#0A0A0A]" />}>
          <Navigation />
        </Suspense>
        <div className="flex-1">{children}</div>
        <div className="border-t border-[#3F3F46] bg-[#0A0A0A] px-4 py-2" />
        <AgentDrawer>
          <PitchDeckStoryAdvisorPanel />
        </AgentDrawer>
      </div>
    </PitchDeckAdvisorProvider>
  );
}

