'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type PitchDeckStoryAdvisorSlideSummary = {
  slideId: string;
  orderIndex: number;
  slideType: string;
  title: string;
  text: string;
  imageLabels: string[];
};

export type PitchDeckStoryAdvisorContextPacket = {
  contextType: 'pitch_deck_plus_screenplay';
  deckId: string;
  screenplayId?: string;
  deckTitle: string;
  deckTemplateId?: string;
  deckStatus?: string;
  slideCount: number;
  selectedSlide?: PitchDeckStoryAdvisorSlideSummary;
  slides: PitchDeckStoryAdvisorSlideSummary[];
  generatedAt: string;
};

type PitchDeckAdvisorContextValue = {
  packet: PitchDeckStoryAdvisorContextPacket | null;
  setPacket: (packet: PitchDeckStoryAdvisorContextPacket | null) => void;
};

const PitchDeckAdvisorContext = createContext<PitchDeckAdvisorContextValue | null>(null);

export function PitchDeckAdvisorProvider({ children }: { children: ReactNode }) {
  const [packet, setPacketState] = useState<PitchDeckStoryAdvisorContextPacket | null>(null);

  const setPacket = useCallback((nextPacket: PitchDeckStoryAdvisorContextPacket | null) => {
    setPacketState(nextPacket);
  }, []);

  const value = useMemo(
    () => ({
      packet,
      setPacket,
    }),
    [packet, setPacket]
  );

  return <PitchDeckAdvisorContext.Provider value={value}>{children}</PitchDeckAdvisorContext.Provider>;
}

export function useOptionalPitchDeckAdvisorContext(): PitchDeckAdvisorContextValue | null {
  return useContext(PitchDeckAdvisorContext);
}
