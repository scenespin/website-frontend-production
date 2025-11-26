/**
 * Collaboration Types
 * 
 * Type definitions for real-time collaboration features including
 * cursor position sharing and presence indicators.
 */

/**
 * Cursor position data for a single user
 * Used to track where a user's cursor is in the screenplay editor
 */
export interface CursorPosition {
  /** User ID of the cursor owner */
  userId: string;
  
  /** User's email address (for display) */
  userEmail?: string;
  
  /** User's display name (for display) */
  userName?: string;
  
  /** Screenplay ID this cursor is associated with */
  screenplayId: string;
  
  /** Character offset in the screenplay content (0-based) */
  position: number;
  
  /** Optional selection start position (if text is selected) */
  selectionStart?: number;
  
  /** Optional selection end position (if text is selected) */
  selectionEnd?: number;
  
  /** Timestamp when this cursor position was last updated (milliseconds since epoch) */
  lastSeen: number;
  
  /** User-specific color for cursor indicator (hex color code) */
  color?: string;
}

/**
 * Presence data for a user viewing/editing a screenplay
 * Used to show who is currently active in the screenplay
 */
export interface PresenceData {
  /** User ID */
  userId: string;
  
  /** User's email address (for display) */
  userEmail?: string;
  
  /** User's display name (for display) */
  userName?: string;
  
  /** Screenplay ID this presence is associated with */
  screenplayId: string;
  
  /** Whether the user is actively editing (cursor moved recently) */
  isActive: boolean;
  
  /** Timestamp of last cursor movement (milliseconds since epoch) */
  lastActivity: number;
}

/**
 * Request payload for updating cursor position
 */
export interface UpdateCursorPositionRequest {
  /** Character offset in the screenplay content */
  position: number;
  
  /** Optional selection start position */
  selectionStart?: number;
  
  /** Optional selection end position */
  selectionEnd?: number;
}

/**
 * Response from cursor position API
 */
export interface CursorPositionResponse {
  /** Array of all active cursor positions for the screenplay */
  cursors: CursorPosition[];
  
  /** Timestamp when this response was generated */
  timestamp: number;
}

