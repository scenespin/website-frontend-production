/**
 * Character Sorting Utility
 * Shared sorting logic for CharacterBoard and CharacterBankPanel
 */

import type { Character } from '@/types/screenplay';
import type { Relationships, Scene } from '@/types/screenplay';

export type CharacterSortOption = 'alphabetical' | 'appearance' | 'sceneCount';

const STORAGE_KEY = 'character_sort_preference';

/**
 * Get saved sort preference from localStorage
 */
export function getCharacterSortPreference(): CharacterSortOption {
  if (typeof window === 'undefined') return 'alphabetical';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['alphabetical', 'appearance', 'sceneCount'].includes(saved)) {
      return saved as CharacterSortOption;
    }
  } catch (error) {
    console.error('[characterSorting] Failed to load sort preference:', error);
  }
  return 'alphabetical';
}

/**
 * Save sort preference to localStorage
 */
export function setCharacterSortPreference(sortBy: CharacterSortOption): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, sortBy);
  } catch (error) {
    console.error('[characterSorting] Failed to save sort preference:', error);
  }
}

/**
 * Sort characters based on selected option
 */
export function sortCharacters(
  characters: Character[],
  sortBy: CharacterSortOption,
  relationships?: Relationships,
  scenes?: Scene[]
): Character[] {
  if (!characters.length) return characters;
  
  const sorted = [...characters];
  
  switch (sortBy) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
    case 'appearance': {
      if (!relationships || !scenes) return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      return sorted.sort((a, b) => {
        const charARels = relationships.characters?.[a.id];
        const charBRels = relationships.characters?.[b.id];
        
        if (!charARels?.appearsInScenes?.length && !charBRels?.appearsInScenes?.length) {
          return a.name.localeCompare(b.name);
        }
        if (!charARels?.appearsInScenes?.length) return 1;
        if (!charBRels?.appearsInScenes?.length) return -1;
        
        // Find first appearance scene for each character
        const firstSceneA = charARels.appearsInScenes
          .map(sceneId => scenes.find(s => s.id === sceneId))
          .filter(Boolean)
          .sort((s1, s2) => (s1?.fountain?.startLine || Infinity) - (s2?.fountain?.startLine || Infinity))[0];
        
        const firstSceneB = charBRels.appearsInScenes
          .map(sceneId => scenes.find(s => s.id === sceneId))
          .filter(Boolean)
          .sort((s1, s2) => (s1?.fountain?.startLine || Infinity) - (s2?.fountain?.startLine || Infinity))[0];
        
        const lineA = firstSceneA?.fountain?.startLine || Infinity;
        const lineB = firstSceneB?.fountain?.startLine || Infinity;
        
        return lineA - lineB;
      });
    }
      
    case 'sceneCount': {
      if (!relationships) return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      return sorted.sort((a, b) => {
        const charARels = relationships.characters?.[a.id];
        const charBRels = relationships.characters?.[b.id];
        
        const countA = charARels?.appearsInScenes?.length || 0;
        const countB = charBRels?.appearsInScenes?.length || 0;
        
        if (countA !== countB) {
          return countB - countA; // Descending (most scenes first)
        }
        
        return a.name.localeCompare(b.name);
      });
    }
      
    default:
      return sorted;
  }
}

