/**
 * Off-Frame Voiceover (Hidden Mouth) types – Feature 0209
 * Values must match backend: website-backend-api/src/types/off-frame-voiceover.types.ts
 */

export type OffFrameShotType =
  | 'back-facing'
  | 'silhouette'
  | 'side-profile-face-away'
  | 'off-frame'
  | 'over-shoulder-listener'
  | 'two-shot-speaker-from-behind'
  | 'speaker-to-group-from-behind'
  | 'speaker-to-group-crowd-pov';

/** Display label for each shot type (plan table). */
export const OFF_FRAME_SHOT_TYPE_OPTIONS: Array<{ value: OffFrameShotType; label: string }> = [
  { value: 'back-facing', label: 'Back-facing' },
  { value: 'silhouette', label: 'Silhouette' },
  { value: 'side-profile-face-away', label: 'Side profile (face away)' },
  { value: 'off-frame', label: 'Off-frame (character not in frame)' },
  { value: 'over-shoulder-listener', label: 'Over shoulder (listener in frame)' },
  { value: 'two-shot-speaker-from-behind', label: 'Two-shot (speaker from behind)' },
  { value: 'speaker-to-group-from-behind', label: 'Speaker to group (from behind)' },
  { value: 'speaker-to-group-crowd-pov', label: 'Speaker to group (crowd POV)' },
];

/** Shot types that show the listener dropdown (single select). */
export const OFF_FRAME_LISTENER_SHOT_TYPES: OffFrameShotType[] = [
  'over-shoulder-listener',
  'two-shot-speaker-from-behind',
];

/** Shot types that show the group checkboxes (multi-select). */
export const OFF_FRAME_GROUP_SHOT_TYPES: OffFrameShotType[] = [
  'speaker-to-group-from-behind',
  'speaker-to-group-crowd-pov',
];

export function isOffFrameListenerShotType(shotType: OffFrameShotType): boolean {
  return OFF_FRAME_LISTENER_SHOT_TYPES.includes(shotType);
}

export function isOffFrameGroupShotType(shotType: OffFrameShotType): boolean {
  return OFF_FRAME_GROUP_SHOT_TYPES.includes(shotType);
}
