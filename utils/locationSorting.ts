/**
 * Location Sorting Utility
 * Shared sorting logic for LocationBoard
 */

import type { Location } from '@/types/screenplay';
import type { Relationships, Scene } from '@/types/screenplay';

export type LocationSortOption = 'alphabetical' | 'appearance' | 'sceneCount';

const STORAGE_KEY = 'location_sort_preference';

/**
 * Get saved sort preference from localStorage
 */
export function getLocationSortPreference(): LocationSortOption {
  if (typeof window === 'undefined') return 'alphabetical';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['alphabetical', 'appearance', 'sceneCount'].includes(saved)) {
      return saved as LocationSortOption;
    }
  } catch (error) {
    console.error('[locationSorting] Failed to load sort preference:', error);
  }
  return 'alphabetical';
}

/**
 * Save sort preference to localStorage
 */
export function setLocationSortPreference(sortBy: LocationSortOption): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, sortBy);
  } catch (error) {
    console.error('[locationSorting] Failed to save sort preference:', error);
  }
}

/**
 * Sort locations based on selected option
 */
export function sortLocations(
  locations: Location[],
  sortBy: LocationSortOption,
  relationships?: Relationships,
  scenes?: Scene[]
): Location[] {
  if (!locations.length) return locations;
  
  const sorted = [...locations];
  
  switch (sortBy) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
    case 'appearance': {
      if (!relationships || !scenes) return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      return sorted.sort((a, b) => {
        const locARels = relationships.locations?.[a.id];
        const locBRels = relationships.locations?.[b.id];
        
        if (!locARels?.scenes?.length && !locBRels?.scenes?.length) {
          return a.name.localeCompare(b.name);
        }
        if (!locARels?.scenes?.length) return 1;
        if (!locBRels?.scenes?.length) return -1;
        
        // Find first appearance scene for each location
        const firstSceneA = locARels.scenes
          .map(sceneId => scenes.find(s => s.id === sceneId))
          .filter(Boolean)
          .sort((s1, s2) => (s1?.fountain?.startLine || Infinity) - (s2?.fountain?.startLine || Infinity))[0];
        
        const firstSceneB = locBRels.scenes
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
        const locARels = relationships.locations?.[a.id];
        const locBRels = relationships.locations?.[b.id];
        
        const countA = locARels?.scenes?.length || 0;
        const countB = locBRels?.scenes?.length || 0;
        
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
