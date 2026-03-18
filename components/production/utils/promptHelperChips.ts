/**
 * Prompt Helper Chips (Production Hub)
 *
 * Future-proof schema for additive prompt helpers used across:
 * - Character
 * - Location
 * - Asset
 *
 * Design goals:
 * - Positive phrasing only (no "negative prompt" phrasing)
 * - Centralized copy management
 * - Easy per-entity and shared chip filtering
 * - Backward-compatible additive insertion behavior
 */

export type PromptHelperEntity = 'character' | 'location' | 'asset' | 'shared';

export type PromptHelperGroup =
  | 'continuity'
  | 'control'
  | 'camera'
  | 'lighting'
  | 'materials'
  | 'quality'
  | 'output';

export type PromptHelperContext =
  | 'generate'
  | 'regenerate'
  | 'variation'
  | 'all';

export interface PromptHelperChip {
  id: string;
  label: string;
  insertText: string;
  entity: PromptHelperEntity;
  group: PromptHelperGroup;
  contexts: PromptHelperContext[];
  order: number;
}

export interface PromptHelperSchema {
  version: string;
  updatedAt: string;
  chips: PromptHelperChip[];
  baselines: Record<'character' | 'location' | 'asset', string>;
}

const SHARED_CHIPS: PromptHelperChip[] = [
  {
    id: 'shared-continuity-lock',
    label: 'Continuity Lock',
    insertText:
      'Match continuity with provided references and preserve core identity, styling, and visual language.',
    entity: 'shared',
    group: 'continuity',
    contexts: ['all'],
    order: 10,
  },
  {
    id: 'shared-composition-lock',
    label: 'Composition Lock',
    insertText:
      'Keep composition and camera framing aligned with the current reference set.',
    entity: 'shared',
    group: 'camera',
    contexts: ['all'],
    order: 20,
  },
  {
    id: 'shared-lighting-lock',
    label: 'Lighting Lock',
    insertText:
      'Maintain consistent lighting direction, contrast, and shadow behavior across outputs.',
    entity: 'shared',
    group: 'lighting',
    contexts: ['all'],
    order: 30,
  },
  {
    id: 'shared-material-fidelity',
    label: 'Material Fidelity',
    insertText:
      'Render physically coherent textures, clean edges, and consistent surface detail.',
    entity: 'shared',
    group: 'materials',
    contexts: ['all'],
    order: 40,
  },
  {
    id: 'shared-clean-output',
    label: 'Clean Output',
    insertText:
      'Deliver a clear, artifact-free image with natural detail and balanced sharpness.',
    entity: 'shared',
    group: 'quality',
    contexts: ['all'],
    order: 50,
  },
  {
    id: 'shared-story-readability',
    label: 'Story Readability',
    insertText:
      'Prioritize subject readability and production-reference clarity in the final frame.',
    entity: 'shared',
    group: 'output',
    contexts: ['all'],
    order: 60,
  },
];

const CHARACTER_CHIPS: PromptHelperChip[] = [
  {
    id: 'char-identity-preserve',
    label: 'Preserve Face Identity',
    insertText:
      'Preserve facial identity exactly across all generated variants.',
    entity: 'character',
    group: 'continuity',
    contexts: ['all'],
    order: 100,
  },
  {
    id: 'char-appearance-consistency',
    label: 'Appearance Consistency',
    insertText:
      'Maintain consistent age, skin tone, facial structure, and hairstyle.',
    entity: 'character',
    group: 'continuity',
    contexts: ['all'],
    order: 110,
  },
  {
    id: 'char-wardrobe-lock',
    label: 'Wardrobe Lock',
    insertText:
      'Keep wardrobe details and accessories consistent with references.',
    entity: 'character',
    group: 'continuity',
    contexts: ['all'],
    order: 120,
  },
  {
    id: 'char-pose-adjust',
    label: 'Pose Adjust',
    insertText:
      'Adjust pose naturally while preserving identity and wardrobe continuity.',
    entity: 'character',
    group: 'control',
    contexts: ['generate', 'variation', 'regenerate'],
    order: 130,
  },
  {
    id: 'char-expression-only',
    label: 'Expression Focus',
    insertText:
      'Change expression while keeping pose, wardrobe, and character design consistent.',
    entity: 'character',
    group: 'control',
    contexts: ['variation', 'regenerate'],
    order: 140,
  },
  {
    id: 'char-anatomy-readability',
    label: 'Anatomy Readability',
    insertText:
      'Generate clear anatomy, stable posture, and natural body proportion coherence.',
    entity: 'character',
    group: 'quality',
    contexts: ['all'],
    order: 150,
  },
];

const LOCATION_CHIPS: PromptHelperChip[] = [
  {
    id: 'loc-layout-preserve',
    label: 'Preserve Layout',
    insertText:
      'Preserve architectural layout, spatial relationships, and set dressing continuity.',
    entity: 'location',
    group: 'continuity',
    contexts: ['all'],
    order: 200,
  },
  {
    id: 'loc-depth-consistency',
    label: 'Depth Consistency',
    insertText:
      'Maintain foreground, midground, and background depth consistency.',
    entity: 'location',
    group: 'camera',
    contexts: ['all'],
    order: 210,
  },
  {
    id: 'loc-landmark-lock',
    label: 'Landmark Lock',
    insertText:
      'Keep landmark placement and horizon continuity stable across variants.',
    entity: 'location',
    group: 'continuity',
    contexts: ['all'],
    order: 220,
  },
  {
    id: 'loc-time-weather-lock',
    label: 'Time + Weather Lock',
    insertText:
      'Maintain time-of-day and weather continuity aligned with selected references.',
    entity: 'location',
    group: 'lighting',
    contexts: ['all'],
    order: 230,
  },
  {
    id: 'loc-angle-only-change',
    label: 'Angle-Only Change',
    insertText:
      'Change camera angle only while preserving location identity and scene dressing.',
    entity: 'location',
    group: 'control',
    contexts: ['variation', 'regenerate'],
    order: 240,
  },
  {
    id: 'loc-perspective-integrity',
    label: 'Perspective Integrity',
    insertText:
      'Render crisp structural lines, coherent perspective, and realistic depth cues.',
    entity: 'location',
    group: 'quality',
    contexts: ['all'],
    order: 250,
  },
];

const ASSET_CHIPS: PromptHelperChip[] = [
  {
    id: 'asset-geometry-lock',
    label: 'Geometry Lock',
    insertText:
      'Preserve object geometry, silhouette, and dimensional proportions exactly.',
    entity: 'asset',
    group: 'continuity',
    contexts: ['all'],
    order: 300,
  },
  {
    id: 'asset-material-lock',
    label: 'Material + Color Lock',
    insertText:
      'Maintain material definition, finish, and colorway consistency across views.',
    entity: 'asset',
    group: 'materials',
    contexts: ['all'],
    order: 310,
  },
  {
    id: 'asset-viewpoint-only',
    label: 'Viewpoint-Only Change',
    insertText:
      'Vary camera viewpoint only while preserving object design details.',
    entity: 'asset',
    group: 'control',
    contexts: ['variation', 'regenerate'],
    order: 320,
  },
  {
    id: 'asset-hero-readability',
    label: 'Hero Readability',
    insertText:
      'Generate a clear hero framing with stable edge definition and product readability.',
    entity: 'asset',
    group: 'camera',
    contexts: ['all'],
    order: 330,
  },
  {
    id: 'asset-grounding',
    label: 'Scale + Grounding',
    insertText:
      'Preserve realistic scale and coherent grounding through natural contact and shadows.',
    entity: 'asset',
    group: 'quality',
    contexts: ['all'],
    order: 340,
  },
  {
    id: 'asset-surface-clarity',
    label: 'Surface Clarity',
    insertText:
      'Render clean contours, stable reflections, and coherent surface detail.',
    entity: 'asset',
    group: 'quality',
    contexts: ['all'],
    order: 350,
  },
];

const BASELINES: PromptHelperSchema['baselines'] = {
  character:
    'Preserve facial identity, age, hairstyle, wardrobe, and body proportions. Keep lighting and composition continuity with references.',
  location:
    'Preserve location layout, landmark placement, scene dressing, and depth relationships. Maintain time-of-day, weather, and lighting continuity.',
  asset:
    'Preserve geometry, silhouette, material finish, and colorway. Keep design details stable while varying only camera viewpoint.',
};

const ALL_CHIPS = [
  ...SHARED_CHIPS,
  ...CHARACTER_CHIPS,
  ...LOCATION_CHIPS,
  ...ASSET_CHIPS,
].sort((a, b) => a.order - b.order);

export const PROMPT_HELPER_SCHEMA: PromptHelperSchema = {
  version: '1.0.0',
  updatedAt: '2026-03-18',
  chips: ALL_CHIPS,
  baselines: BASELINES,
};

export function getPromptHelperChips(params: {
  entity: 'character' | 'location' | 'asset';
  context?: PromptHelperContext;
  includeShared?: boolean;
  group?: PromptHelperGroup;
}): PromptHelperChip[] {
  const {
    entity,
    context = 'all',
    includeShared = true,
    group,
  } = params;

  return PROMPT_HELPER_SCHEMA.chips.filter((chip) => {
    const entityMatch = chip.entity === entity || (includeShared && chip.entity === 'shared');
    const contextMatch =
      context === 'all' ||
      chip.contexts.includes('all') ||
      chip.contexts.includes(context);
    const groupMatch = !group || chip.group === group;
    return entityMatch && contextMatch && groupMatch;
  });
}

export function getPromptHelperBaseline(entity: 'character' | 'location' | 'asset'): string {
  return PROMPT_HELPER_SCHEMA.baselines[entity];
}

/**
 * Utility to append helper text to an existing additive prompt.
 * Keeps separators predictable and avoids accidental double-spacing.
 */
export function appendPromptHelperText(existingPrompt: string, helperText: string): string {
  const existing = (existingPrompt || '').trim();
  const addition = (helperText || '').trim();
  if (!addition) return existingPrompt || '';
  if (!existing) return addition;
  const needsPeriod = /[.!?]$/.test(existing);
  return `${existing}${needsPeriod ? '' : '.'} ${addition}`;
}

