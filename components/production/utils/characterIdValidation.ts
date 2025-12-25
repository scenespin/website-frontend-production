/**
 * Utility functions for validating character IDs
 */

/**
 * Special values that are not real character IDs
 */
const INVALID_CHARACTER_IDS = new Set(['__ignore__']);

/**
 * Checks if a character ID is valid (not a special placeholder value)
 * @param characterId - The character ID to validate
 * @returns true if the ID is valid, false otherwise
 */
export function isValidCharacterId(characterId: string | null | undefined): boolean {
  if (!characterId) return false;
  return !INVALID_CHARACTER_IDS.has(characterId);
}

/**
 * Filters an array of character IDs to only include valid ones
 * @param characterIds - Array of character IDs to filter
 * @returns Array of valid character IDs
 */
export function filterValidCharacterIds(characterIds: (string | null | undefined)[]): string[] {
  return characterIds.filter((id): id is string => isValidCharacterId(id));
}

