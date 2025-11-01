/**
 * Timeline Hooks - Modular Export
 * 
 * Refactored from monolithic useTimeline.tsx (1894 lines)
 * into smaller, focused modules:
 * 
 * - useTimelineState: Core state management
 * - useTimelineActions: CRUD operations
 * - useTimelineSave: Save/backup/sync logic
 * - useTimelinePlayback: Playback controls
 * 
 * Usage:
 * ```tsx
 * import { useTimeline } from '@/hooks/useTimeline'; // Legacy - still works
 * // OR use modular hooks:
 * import { useTimelineState, useTimelineActions } from '@/hooks/timeline';
 * ```
 */

export { useTimelineState } from './useTimelineState';
export type { TimelineStateReturn } from './useTimelineState';

export { useTimelineActions } from './useTimelineActions';
export type { TimelineActionsReturn } from './useTimelineActions';

export { useTimelineSave } from './useTimelineSave';
export type { TimelineSaveReturn, TimelineSaveOptions } from './useTimelineSave';

export { useTimelinePlayback } from './useTimelinePlayback';
export type { TimelinePlaybackReturn } from './useTimelinePlayback';

// Re-export types from parent useTimeline for convenience
export type {
  TimelineProject,
  TimelineClip,
  TimelineAsset,
  AssetType,
  TrackType,
  SaveStatus
} from '../useTimeline';

