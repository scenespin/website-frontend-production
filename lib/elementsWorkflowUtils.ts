/**
 * Feature 0259: Elements to Video — shared validation and payload helpers.
 * Used by SceneBuilderPanel; unit-tested in tests/elements-workflow-0259.test.ts.
 */

export interface ElementsValidationContext {
  useElementsForVideo?: Record<number, boolean>;
  selectedElementsForVideo?: Record<number, string[]>;
  videoPromptOverrides?: Record<number, string>;
}

export interface ShotForValidation {
  slot: number;
  type: string;
}

export type ElementsVideoModelId = 'veo-3.1' | 'grok-imagine-video';
export type ElementsVideoDurationSeconds = 5 | 8 | 10;
export type ElementsVideoAspectRatio = '16:9' | '9:16';

/** Elements-to-video duration capabilities per model. */
export const ELEMENTS_VIDEO_DURATIONS_BY_MODEL: Record<ElementsVideoModelId, { options: readonly ElementsVideoDurationSeconds[] }> = {
  'veo-3.1': { options: [8] }, // Veo reference_to_video currently supports only 8s in this flow
  'grok-imagine-video': { options: [5, 10] }, // Grok reference-images mode capped to 10s
};
/** Elements-to-video aspect ratio capabilities per model. */
export const ELEMENTS_VIDEO_ASPECT_RATIOS_BY_MODEL: Record<ElementsVideoModelId, { options: readonly ElementsVideoAspectRatio[] }> = {
  'veo-3.1': { options: ['16:9', '9:16'] },
  'grok-imagine-video': { options: ['16:9', '9:16'] },
};
/** Elements-to-video max references per model. */
export const ELEMENTS_VIDEO_MAX_REFERENCES_BY_MODEL: Record<ElementsVideoModelId, number> = {
  'veo-3.1': 3,
  'grok-imagine-video': 7,
};

export const DEFAULT_ELEMENTS_VIDEO_MODEL: ElementsVideoModelId = 'veo-3.1';
export const ELEMENTS_VIDEO_MODEL_OPTIONS: ReadonlyArray<{ id: ElementsVideoModelId; label: string }> = [
  { id: 'veo-3.1', label: 'Veo 3.1' },
  { id: 'grok-imagine-video', label: 'Grok' },
];

export const ELEMENTS_VIDEO_MODEL_MESSAGE_BY_MODEL: Record<ElementsVideoModelId, string> = {
  'veo-3.1': 'Veo Elements: up to 3 refs, 8s.',
  'grok-imagine-video': 'Grok Elements: up to 7 refs, 5s or 10s.',
};

export function getEffectiveElementsVideoModel(
  rawModelId: string | undefined
): ElementsVideoModelId {
  if (rawModelId === 'grok-imagine-video') return 'grok-imagine-video';
  return DEFAULT_ELEMENTS_VIDEO_MODEL;
}

export function getElementsVideoDurationOptions(
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): readonly ElementsVideoDurationSeconds[] {
  return ELEMENTS_VIDEO_DURATIONS_BY_MODEL[modelId]?.options ?? ELEMENTS_VIDEO_DURATIONS_BY_MODEL[DEFAULT_ELEMENTS_VIDEO_MODEL].options;
}

export function getDefaultElementsVideoDuration(
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): ElementsVideoDurationSeconds {
  return getElementsVideoDurationOptions(modelId)[0] ?? 8;
}

export function getEffectiveElementsVideoDuration(
  rawDuration: number | undefined,
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): ElementsVideoDurationSeconds {
  const options = getElementsVideoDurationOptions(modelId);
  if (rawDuration != null && options.includes(rawDuration as ElementsVideoDurationSeconds)) {
    return rawDuration as ElementsVideoDurationSeconds;
  }
  return getDefaultElementsVideoDuration(modelId);
}

export function getElementsVideoModelMessage(
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): string {
  return ELEMENTS_VIDEO_MODEL_MESSAGE_BY_MODEL[modelId] || ELEMENTS_VIDEO_MODEL_MESSAGE_BY_MODEL[DEFAULT_ELEMENTS_VIDEO_MODEL];
}

export function getElementsVideoMaxReferences(
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): number {
  return ELEMENTS_VIDEO_MAX_REFERENCES_BY_MODEL[modelId] ?? ELEMENTS_VIDEO_MAX_REFERENCES_BY_MODEL[DEFAULT_ELEMENTS_VIDEO_MODEL];
}

export function getElementsVideoAspectRatioOptions(
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): readonly ElementsVideoAspectRatio[] {
  return ELEMENTS_VIDEO_ASPECT_RATIOS_BY_MODEL[modelId]?.options ?? ['16:9'];
}

export function getDefaultElementsVideoAspectRatio(
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): ElementsVideoAspectRatio {
  return getElementsVideoAspectRatioOptions(modelId)[0] ?? '16:9';
}

export function getEffectiveElementsVideoAspectRatio(
  rawAspectRatio: string | undefined,
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): ElementsVideoAspectRatio {
  const options = getElementsVideoAspectRatioOptions(modelId);
  if (rawAspectRatio && options.includes(rawAspectRatio as ElementsVideoAspectRatio)) {
    return rawAspectRatio as ElementsVideoAspectRatio;
  }
  return getDefaultElementsVideoAspectRatio(modelId);
}

/**
 * Validates Elements requirements for action/establishing shots.
 * When useElementsForVideo[slot] is true: requires at least one reference and a non-empty prompt.
 * Returns an array of error messages (empty if valid).
 */
export function validateElementsForShots(
  shots: ShotForValidation[],
  contextState: ElementsValidationContext
): string[] {
  const errors: string[] = [];
  for (const shot of shots) {
    if (shot.type !== 'action' && shot.type !== 'establishing') continue;
    const useElements = contextState.useElementsForVideo?.[shot.slot];
    if (!useElements) continue;
    const elementIds = contextState.selectedElementsForVideo?.[shot.slot];
    const hasRefs = Array.isArray(elementIds) && elementIds.length > 0;
    if (!hasRefs) {
      errors.push(
        `Shot ${shot.slot}: Select at least one reference (character, location, or prop) when using Elements, or turn off Elements for this shot.`
      );
      continue;
    }
    const prompt = contextState.videoPromptOverrides?.[shot.slot]?.trim();
    if (!prompt) {
      errors.push(
        `Shot ${shot.slot}: Enter a video prompt in the Elements section when using Elements (prefilled from the script; you can edit it).`
      );
    }
  }
  return errors;
}

/**
 * Builds the selectedElementsForVideo payload: only shots where useElementsForVideo is true
 * and the ref list is non-empty. Returns undefined if no such shots.
 */
export function buildSelectedElementsForVideoPayload(
  selectedElementsForVideo: Record<number, string[]> | undefined,
  useElementsForVideo: Record<number, boolean> | undefined
): Record<number, string[]> | undefined {
  if (!selectedElementsForVideo || typeof selectedElementsForVideo !== 'object') return undefined;
  const withEntries = Object.entries(selectedElementsForVideo).filter(([slot, ids]) => {
    const use = useElementsForVideo?.[parseInt(slot, 10)];
    return use && Array.isArray(ids) && ids.length > 0;
  });
  return withEntries.length > 0
    ? Object.fromEntries(withEntries.map(([k, v]) => [parseInt(k, 10), v]))
    : undefined;
}

/**
 * Builds normalized elementsVideoModels payload for shots where Elements is enabled.
 * Falls back to DEFAULT model when value is invalid/missing.
 */
export function buildElementsVideoModelsPayload(
  elementsVideoModels: Record<number, string> | undefined,
  useElementsForVideo: Record<number, boolean> | undefined
): Record<number, ElementsVideoModelId> | undefined {
  if (!useElementsForVideo || typeof useElementsForVideo !== 'object') return undefined;
  const entries = Object.entries(useElementsForVideo).filter(([, enabled]) => !!enabled);
  if (entries.length === 0) return undefined;

  const normalized: Record<number, ElementsVideoModelId> = {};
  for (const [slot] of entries) {
    const slotNum = parseInt(slot, 10);
    normalized[slotNum] = getEffectiveElementsVideoModel(elementsVideoModels?.[slotNum]);
  }
  return normalized;
}

/**
 * Builds normalized elementsVideoDurations payload for shots where Elements is enabled.
 * Values are normalized against the active model capabilities.
 */
export function buildElementsVideoDurationsPayload(
  elementsVideoDurations: Record<number, number> | undefined,
  useElementsForVideo: Record<number, boolean> | undefined,
  elementsVideoModels?: Record<number, string>
): Record<number, ElementsVideoDurationSeconds> | undefined {
  if (!useElementsForVideo || typeof useElementsForVideo !== 'object') return undefined;
  const entries = Object.entries(useElementsForVideo).filter(([, enabled]) => !!enabled);
  if (entries.length === 0) return undefined;

  const normalized: Record<number, ElementsVideoDurationSeconds> = {};
  for (const [slot] of entries) {
    const slotNum = parseInt(slot, 10);
    const raw = elementsVideoDurations?.[slotNum];
    const modelId = getEffectiveElementsVideoModel(elementsVideoModels?.[slotNum]);
    normalized[slotNum] = getEffectiveElementsVideoDuration(raw, modelId);
  }
  return normalized;
}

/**
 * Builds normalized elementsVideoAspectRatios payload for shots where Elements is enabled.
 * Values are normalized against the active model capabilities.
 */
export function buildElementsVideoAspectRatiosPayload(
  elementsVideoAspectRatios: Record<number, string> | undefined,
  useElementsForVideo: Record<number, boolean> | undefined,
  modelId: ElementsVideoModelId = DEFAULT_ELEMENTS_VIDEO_MODEL
): Record<number, ElementsVideoAspectRatio> | undefined {
  if (!useElementsForVideo || typeof useElementsForVideo !== 'object') return undefined;
  const entries = Object.entries(useElementsForVideo).filter(([, enabled]) => !!enabled);
  if (entries.length === 0) return undefined;

  const normalized: Record<number, ElementsVideoAspectRatio> = {};
  for (const [slot] of entries) {
    const slotNum = parseInt(slot, 10);
    const raw = elementsVideoAspectRatios?.[slotNum];
    normalized[slotNum] = getEffectiveElementsVideoAspectRatio(raw, modelId);
  }
  return normalized;
}
