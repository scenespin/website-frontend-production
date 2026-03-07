export type PitchDeckType = 'screenplay' | 'investor';
export type PitchDeckTextMode = 'manual_first' | 'auto_from_screenplay' | 'auto_plus_ai_polish';

export interface PitchDeckBlock {
  blockId: string;
  type: 'text' | 'image' | 'list' | 'metric';
  content: any;
  sourceType: 'screenplay_auto' | 'ai_generated' | 'user_custom' | 'existing_media';
  lockedByUser: boolean;
}

export interface PitchDeckSlide {
  slideId: string;
  deckId: string;
  orderIndex: number;
  slideType: string;
  title: string;
  version: number;
  blocks: PitchDeckBlock[];
  notes?: string;
}

export interface PitchDeck {
  deckId: string;
  screenplayId: string;
  ownerUserId: string;
  title: string;
  deckType: PitchDeckType;
  templateId: string;
  status: 'draft' | 'ready' | 'archived';
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PitchDeckCostEstimate {
  screenplayId: string;
  deckType: PitchDeckType;
  textMode: PitchDeckTextMode;
  includeBusinessSlides: boolean;
  estimate: {
    currency: 'credits';
    totalCredits: number;
    estimatorVersion?: string;
    breakdown: Array<{
      key: string;
      label: string;
      credits: number;
    }>;
    signals?: {
      screenplayCharacters: number;
      estimatedTokens: number;
      projectedSlides: number;
      plannedImageGenerations: number;
      plannedAiRewrites: number;
    };
  };
  note?: string;
}

export interface PitchDeckTemplate {
  templateId: string;
  name: string;
  category: 'screenplay' | 'investor' | 'hybrid';
  description: string;
  styleSummary: string;
  isDefault: boolean;
  slideDefaults: {
    recommendedDeckType: PitchDeckType;
    includeBusinessSlides: boolean;
  };
  allowedBlockTypes: Array<'text' | 'image' | 'list' | 'metric'>;
}

function unwrapResponse<T>(payload: any): T {
  if (!payload?.success) {
    const message = payload?.error?.message || 'Request failed';
    throw new Error(message);
  }
  return payload.data as T;
}

export async function generatePitchDeckDraft(input: {
  screenplayId: string;
  deckType: PitchDeckType;
  templateId: string;
  textMode: PitchDeckTextMode;
  includeBusinessSlides?: boolean;
  titleOverride?: string;
}): Promise<{ deckId: string; status: string; slideCount: number; version: number }> {
  const response = await fetch('/api/pitch-decks/generate-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to generate pitch deck draft');
  }
  return unwrapResponse(json);
}

export async function estimatePitchDeckCost(input: {
  screenplayId: string;
  deckType: PitchDeckType;
  textMode: PitchDeckTextMode;
  templateId?: string;
  includeBusinessSlides?: boolean;
  plannedImageGenerations?: number;
  plannedAiRewrites?: number;
}): Promise<PitchDeckCostEstimate> {
  const response = await fetch('/api/pitch-decks/estimate-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to estimate pitch deck cost');
  }
  return unwrapResponse(json);
}

export async function listPitchDeckTemplates(): Promise<{ templates: PitchDeckTemplate[]; count: number }> {
  const response = await fetch('/api/pitch-decks/templates', {
    method: 'GET',
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to load pitch deck templates');
  }
  return unwrapResponse(json);
}

export async function getPitchDeck(deckId: string): Promise<{ deck: PitchDeck; slides: PitchDeckSlide[] }> {
  const response = await fetch(`/api/pitch-decks/${deckId}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to load pitch deck');
  }
  return unwrapResponse(json);
}

export async function listPitchDecksByScreenplay(screenplayId: string): Promise<{
  screenplayId: string;
  decks: PitchDeck[];
  count: number;
}> {
  const response = await fetch(`/api/pitch-decks?screenplayId=${encodeURIComponent(screenplayId)}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to list pitch decks');
  }
  return unwrapResponse(json);
}

export async function updatePitchDeck(deckId: string, input: {
  expectedVersion: number;
  title?: string;
  templateId?: string;
  status?: 'draft' | 'ready' | 'archived';
}): Promise<PitchDeck> {
  const response = await fetch(`/api/pitch-decks/${deckId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to update pitch deck');
  }
  return unwrapResponse(json);
}

export async function updatePitchDeckSlide(
  deckId: string,
  slideId: string,
  input: {
    expectedVersion: number;
    title?: string;
    notes?: string;
    blocks?: PitchDeckBlock[];
  }
): Promise<PitchDeckSlide> {
  const response = await fetch(`/api/pitch-decks/${deckId}/slides/${slideId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to update pitch deck slide');
  }
  return unwrapResponse(json);
}

export async function deletePitchDeck(deckId: string): Promise<{ deckId: string; deleted: boolean }> {
  const response = await fetch(`/api/pitch-decks/${deckId}`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to delete pitch deck');
  }
  return unwrapResponse(json);
}

