/**
 * User Color Assignment Utility
 * Feature 0134: Cursor Position Sharing for Collaborative Editing
 * 
 * Generates consistent, distinct colors for each user based on their userId.
 * Uses a hash function to map userId to a color from a predefined palette.
 */

/**
 * Predefined color palette for user cursors
 * Colors are chosen to be distinct and visible on both light and dark backgrounds
 */
const USER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

/**
 * Hash function to convert string to number
 * Simple but effective for color assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color for a user based on their userId
 * Same user always gets the same color (consistent)
 * 
 * @param userId - User ID
 * @returns Hex color code
 */
export function getUserColor(userId: string): string {
  if (!userId) {
    return USER_COLORS[0]; // Default to first color
  }
  
  const hash = hashString(userId);
  const colorIndex = hash % USER_COLORS.length;
  return USER_COLORS[colorIndex];
}

/**
 * Get all available colors (for testing/debugging)
 */
export function getAllUserColors(): string[] {
  return [...USER_COLORS];
}

