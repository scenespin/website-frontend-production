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
  imageSlots: Array<{
    slideType: string;
    slotId: string;
  }>;
}

export interface PitchDeckImageModel {
  id: string;
  provider: string;
  creditsPerImage: number;
  label?: string;
  description?: string;
  speed?: string;
  quality?: string;
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

export async function listImageGenerationModels(): Promise<PitchDeckImageModel[]> {
  const response = await fetch('/api/models/image', {
    method: 'GET',
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to load image models');
  }
  return (json?.models || []) as PitchDeckImageModel[];
}

export async function generatePitchDeckImageFromPrompt(input: {
  prompt: string;
  providerId?: string;
  screenplayId?: string;
}): Promise<{ imageUrl: string; s3Key?: string; creditsDeducted?: number; modelUsed?: string }> {
  const response = await fetch('/api/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: input.prompt,
      providerId: input.providerId,
      ...(input.screenplayId
        ? {
            entityType: 'screenplay',
            entityId: input.screenplayId,
            projectId: input.screenplayId,
          }
        : {}),
    }),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || json?.error?.message || json?.error || 'Failed to generate image');
  }
  return {
    imageUrl: json?.imageUrl,
    s3Key: json?.s3Key,
    creditsDeducted: json?.creditsDeducted,
    modelUsed: json?.modelUsed,
  };
}

export async function generatePitchDeckImageFromReference(input: {
  deckId: string;
  sourceImageUrls: string[];
  editPrompt: string;
  desiredModelId?: string;
}): Promise<{ imageUrl: string; s3Key?: string; creditsDeducted?: number; modelUsed?: string }> {
  const response = await fetch(`/api/pitch-decks/${encodeURIComponent(input.deckId)}/image/remix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceImageUrls: input.sourceImageUrls,
      editPrompt: input.editPrompt,
      desiredModelId: input.desiredModelId,
    }),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.message || json?.error?.message || json?.error || 'Failed to remix image from references');
  }
  const payload = json?.data || json;
  return {
    imageUrl: payload?.imageUrl,
    s3Key: payload?.s3Key,
    creditsDeducted: payload?.creditsDeducted,
    modelUsed: payload?.modelUsed,
  };
}

export async function archivePitchDeckImage(input: {
  deckId: string;
  slideId: string;
  slideType?: string;
  slideTitle?: string;
  s3Key: string;
  label?: string;
  source: 'prompt' | 'reference' | 'upload' | 'manual';
}): Promise<{ fileId?: string; folderId?: string }> {
  const response = await fetch(`/api/pitch-decks/${encodeURIComponent(input.deckId)}/image/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || 'Failed to archive pitch deck image');
  }
  return unwrapResponse(json);
}

export async function exportPitchDeckPdf(
  deckId: string,
  input: {
    includeImages?: boolean;
    watermark?: {
      enabled?: boolean;
      text?: string;
      opacity?: number;
    };
  } = {}
): Promise<{ blob: Blob; fileName: string }> {
  const response = await fetch(`/api/pitch-decks/${encodeURIComponent(deckId)}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.error?.message || 'Failed to export pitch deck PDF');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  const fileName = fileNameMatch?.[1] || 'pitch-deck.pdf';

  return { blob, fileName };
}

