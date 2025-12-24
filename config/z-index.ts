/**
 * Centralized Z-Index Configuration
 * 
 * Manages the visual stacking order of all UI elements.
 * Higher values appear on top of lower values.
 * 
 * Usage:
 * ```tsx
 * import { Z_INDEX } from '@/config/z-index';
 * 
 * <div style={{ zIndex: Z_INDEX.MOBILE_NAV }}>...</div>
 * ```
 */

export const Z_INDEX = {
  // Base level
  BASE: 0,
  
  // Content layers
  CONTENT: 1,
  STICKY_CONTENT: 10,
  
  // Navigation
  HEADER: 20,
  MOBILE_NAV: 40,
  MOBILE_NAV_BELOW_DRAWER: 39, // When drawer is open
  
  // Drawers and panels
  DRAWER: 50,
  JOBS_DRAWER: 50, // Jobs drawer (below chat drawer)
  SIDEBAR: 45,
  
  // Overlays
  DROPDOWN: 60,
  CHAT_DRAWER: 60, // Chat drawer (above jobs drawer)
  POPOVER: 70,
  
  // Modals
  MODAL_BACKDROP: 100,
  MODAL: 110,
  
  // Notifications
  TOAST: 120,
  TOOLTIP: 130,
  
  // Debug/Dev tools (highest)
  DEBUG: 9999,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

/**
 * Get z-index value for mobile navigation based on drawer state
 */
export function getMobileNavZIndex(isDrawerOpen: boolean): number {
  return isDrawerOpen ? Z_INDEX.MOBILE_NAV_BELOW_DRAWER : Z_INDEX.MOBILE_NAV;
}

/**
 * Helper to ensure a component appears above another
 */
export function getZIndexAbove(baseZIndex: number, offset: number = 1): number {
  return baseZIndex + offset;
}

/**
 * Helper to ensure a component appears below another
 */
export function getZIndexBelow(baseZIndex: number, offset: number = 1): number {
  return Math.max(0, baseZIndex - offset);
}

