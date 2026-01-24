/**
 * Fountain Format Constants
 * 
 * Unified constants for Fountain format detection and formatting
 * Based on official Fountain specification: https://fountain.io/syntax/
 * 
 * Key Rules from Spec:
 * - Scene Heading: "always has at least one blank line preceding it"
 * - Character: "one empty line before it and without an empty line after it"
 * - Dialogue: follows Character or Parenthetical immediately
 */

/**
 * Scene Heading Detection Pattern
 * 
 * Per Fountain spec: "A line beginning with any of the following, followed by either a dot or a space"
 * 
 * CRITICAL: Order matters! More specific patterns MUST come before simpler ones:
 * 1. INT./EXT. (most specific - with periods)
 * 2. I./E. (most specific - with periods)
 * 3. INT./EXT or INT/EXT (less specific)
 * 4. I/E (less specific)
 * 5. EST
 * 6. INT
 * 7. EXT
 * 
 * This ensures INT./EXT. is captured as a single unit, not split into INT and /EXT.
 */
export const SCENE_HEADING_PATTERN = /^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i;

/**
 * Scene Heading Pattern (for full line matching)
 * Includes standalone patterns for Tab navigation (INT without period, etc.)
 */
export function isSceneHeading(line: string): boolean {
  const trimmed = line.trim();
  return SCENE_HEADING_PATTERN.test(trimmed) || 
         /^(INT\.\/EXT\.|I\.\/E\.|INT\/EXT|I\/E|EST|INT|EXT)$/i.test(trimmed);
}

/**
 * Character Name Detection
 * 
 * Per Fountain spec: "A Character element is any line entirely in uppercase, 
 * with one empty line before it and without an empty line after it."
 * 
 * Rules:
 * - Entirely uppercase
 * - 2-50 characters (allowing for longer names)
 * - Not a scene heading
 * - Not a transition
 * - Must include at least one alphabetical character
 */
export function isCharacterName(line: string, excludeSceneHeadings: boolean = true): boolean {
  const trimmed = line.trim();
  
  // Must be entirely uppercase
  if (trimmed !== trimmed.toUpperCase()) {
    return false;
  }
  
  // Length check (2-50 chars)
  if (trimmed.length < 2 || trimmed.length > 50) {
    return false;
  }
  
  // Must include at least one alphabetical character (per spec)
  if (!/[A-Z]/.test(trimmed)) {
    return false;
  }
  
  // Exclude scene headings if requested
  if (excludeSceneHeadings && SCENE_HEADING_PATTERN.test(trimmed)) {
    return false;
  }
  
  // Exclude transitions
  if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|FADE TO BLACK):?$/i.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Fountain Spacing Rules (per official spec)
 * 
 * Scene Heading:
 * - ONE blank line BEFORE (required by spec)
 * - ONE blank line AFTER (common practice, implied by spec)
 * 
 * Character:
 * - ONE blank line BEFORE (required by spec)
 * - NO blank line AFTER (dialogue follows immediately, per spec)
 * 
 * Dialogue:
 * - Follows Character immediately (no blank line)
 * - ONE blank line AFTER when dialogue block ends
 */
export const FOUNTAIN_SPACING_RULES = {
  SCENE_HEADING: {
    BLANK_LINE_BEFORE: 1, // Required by spec
    BLANK_LINE_AFTER: 1,  // Common practice
  },
  CHARACTER: {
    BLANK_LINE_BEFORE: 1, // Required by spec
    BLANK_LINE_AFTER: 0,  // Per spec: "without an empty line after it"
  },
  DIALOGUE: {
    BLANK_LINE_AFTER: 1, // When dialogue block ends
  },
} as const;
