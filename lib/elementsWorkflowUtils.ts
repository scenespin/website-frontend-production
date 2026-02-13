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
