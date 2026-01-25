/**
 * Image Display Constants
 * 
 * Centralized constants for consistent image thumbnail display across Scene Builder
 * and detail modals. Ensures all image selectors use the same dimensions and aspect ratios.
 */

// Standard thumbnail dimensions (16:9 aspect ratio)
export const THUMBNAIL_MAX_WIDTH = '640px';
export const THUMBNAIL_MAX_HEIGHT = '360px';

// Standard aspect ratio class
export const THUMBNAIL_ASPECT_RATIO = 'aspect-video'; // 16:9

// Standard grid configuration for Scene Builder selectors
export const SCENE_BUILDER_GRID_COLS = 'grid-cols-4';
export const SCENE_BUILDER_GRID_GAP = 'gap-2';

// Standard thumbnail style object (for inline styles)
export const THUMBNAIL_STYLE: { maxWidth: string; maxHeight: string } = {
  maxWidth: THUMBNAIL_MAX_WIDTH,
  maxHeight: THUMBNAIL_MAX_HEIGHT
};
