/**
 * 🎯 SCREENPLAY PERSISTENCE MANAGER
 * 
 * SINGLE SOURCE OF TRUTH for all screenplay data persistence
 * DynamoDB is the ONLY source of truth - no localStorage caching
 * 
 * This module provides:
 * - Centralized data loading from DynamoDB
 * - Centralized data saving to DynamoDB
 * - Clear initialization tracking
 * - Type-safe transformations between app types and API types
 * - Consistent error handling
 * 
 * @author AI Assistant
 * @date November 10, 2025
 * @feature 0114 - Screenplay Persistence Rewrite
 */

import { 
  listBeats, 
  listCharacters, 
  listLocations,
  updateScreenplay as apiUpdateScreenplay 
} from './screenplayStorage';
import type { 
  StoryBeat, 
  Character, 
  Location, 
  Relationships,
  CharacterType,
  ArcStatus,
  LocationType 
} from '@/types/screenplay';
import type { useAuth } from '@clerk/nextjs';

// ============================================================================
// Types
// ============================================================================

/**
 * Complete screenplay structural data
 */
export interface ScreenplayData {
  beats: StoryBeat[];
  characters: Character[];
  locations: Location[];
  relationships: Relationships;
}

/**
 * Partial update for screenplay data
 */
export interface ScreenplayDataUpdate {
  beats?: StoryBeat[];
  characters?: Character[];
  locations?: Location[];
  relationships?: Relationships;
}

/**
 * API-compatible character format
 */
interface APICharacter {
  id: string;
  name: string;
  description?: string;
  referenceImages?: string[];
}

/**
 * API-compatible location format
 */
interface APILocation {
  id: string;
  name: string;
  description?: string;
  referenceImages?: string[];
}

/**
 * API-compatible beat format
 */
interface APIBeat {
  id: string;
  title: string;
  description: string; // Required by API
  order: number;
  scenes: any[];
}

// ============================================================================
// Persistence Manager Class
// ============================================================================

export class ScreenplayPersistenceManager {
  private screenplayId: string | null = null;
  private isInitialized: boolean = false;
  private getToken: ReturnType<typeof useAuth>['getToken'];
  
  constructor() {
    // getToken will be set via setAuth()
    this.getToken = async () => null;
  }
  
  /**
   * Initialize with screenplay ID and auth token getter
   */
  setScreenplay(screenplayId: string | null, getToken: ReturnType<typeof useAuth>['getToken']): void {
    this.screenplayId = screenplayId;
    this.getToken = getToken;
    this.isInitialized = false; // Reset on screenplay change
  }
  
  /**
   * Load ALL screenplay data from DynamoDB
   * Called ONCE on page load or screenplay change
   * 
   * @returns Complete screenplay data
   * @throws Error if screenplay_id not set or load fails
   */
  async loadAll(): Promise<ScreenplayData> {
    if (!this.screenplayId) {
      console.warn('[Persistence] No screenplay_id set, returning empty data');
      this.isInitialized = true;
      return {
        beats: [],
        characters: [],
        locations: [],
        relationships: { scenes: {}, characters: {}, locations: {}, props: {} }
      };
    }
    
    console.log('[Persistence] 📥 Loading from DynamoDB...', this.screenplayId);
    
    try {
      // Load all data in parallel
      const [beatsData, charactersData, locationsData] = await Promise.all([
        listBeats(this.screenplayId, this.getToken).catch(err => {
          console.warn('[Persistence] Failed to load beats:', err);
          return [];
        }),
        listCharacters(this.screenplayId, this.getToken).catch(err => {
          console.warn('[Persistence] Failed to load characters:', err);
          return [];
        }),
        listLocations(this.screenplayId, this.getToken).catch(err => {
          console.warn('[Persistence] Failed to load locations:', err);
          return [];
        })
      ]);
      
      // Transform API data to app format
      const transformedData: ScreenplayData = {
        beats: this.transformBeatsFromAPI(beatsData),
        characters: this.transformCharactersFromAPI(charactersData),
        locations: this.transformLocationsFromAPI(locationsData),
        relationships: { scenes: {}, characters: {}, locations: {}, props: {} }
      };
      
      this.isInitialized = true;
      
      console.log('[Persistence] ✅ Loaded:', {
        beats: transformedData.beats.length,
        characters: transformedData.characters.length,
        locations: transformedData.locations.length
      });
      
      return transformedData;
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to load:', error);
      this.isInitialized = true; // Mark as initialized even on error to prevent infinite loops
      throw error;
    }
  }
  
  /**
   * 🔥 NEW: Load only beats from DynamoDB
   */
  async loadBeats(): Promise<StoryBeat[]> {
    console.error('[Persistence] 🎯 loadBeats called - screenplay_id:', this.screenplayId);
    
    if (!this.screenplayId) {
      console.error('[Persistence] ❌ No screenplay_id set, returning empty beats');
      return [];
    }
    
    console.error('[Persistence] 📞 Calling API: /api/screenplays/' + this.screenplayId + '/beats');
    
    try {
      const beatsData = await listBeats(this.screenplayId, this.getToken);
      console.error('[Persistence] ✅ API returned', beatsData.length, 'beats');
      return this.transformBeatsFromAPI(beatsData);
    } catch (error) {
      console.error('[Persistence] ❌ API FAILED:', error);
      return [];
    }
  }
  
  /**
   * 🔥 NEW: Load only characters from DynamoDB
   */
  async loadCharacters(): Promise<Character[]> {
    console.error('[Persistence] 🎯 loadCharacters called - screenplay_id:', this.screenplayId);
    
    if (!this.screenplayId) {
      console.error('[Persistence] ❌ No screenplay_id set, returning empty characters');
      return [];
    }
    
    console.error('[Persistence] 📞 Calling API: /api/screenplays/' + this.screenplayId + '/characters');
    
    try {
      const charactersData = await listCharacters(this.screenplayId, this.getToken);
      console.error('[Persistence] ✅ API returned', charactersData.length, 'characters');
      return this.transformCharactersFromAPI(charactersData);
    } catch (error) {
      console.error('[Persistence] ❌ API FAILED:', error);
      return [];
    }
  }
  
  /**
   * 🔥 NEW: Load only locations from DynamoDB
   */
  async loadLocations(): Promise<Location[]> {
    console.error('[Persistence] 🎯 loadLocations called - screenplay_id:', this.screenplayId);
    
    if (!this.screenplayId) {
      console.error('[Persistence] ❌ No screenplay_id set, returning empty locations');
      return [];
    }
    
    console.error('[Persistence] 📞 Calling API: /api/screenplays/' + this.screenplayId + '/locations');
    
    try {
      const locationsData = await listLocations(this.screenplayId, this.getToken);
      console.error('[Persistence] ✅ API returned', locationsData.length, 'locations');
      return this.transformLocationsFromAPI(locationsData);
    } catch (error) {
      console.error('[Persistence] ❌ API FAILED:', error);
      return [];
    }
  }
  
  /**
   * Save ALL screenplay data to DynamoDB
   * Called after bulk operations (import, clear all, etc.)
   * 
   * @param data - Complete or partial screenplay data to save
   * @throws Error if screenplay_id not set or save fails
   */
  async saveAll(data: ScreenplayDataUpdate): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot save: No screenplay_id set');
    }
    
    console.log('[Persistence] 💾 Saving to DynamoDB...', {
      screenplay_id: this.screenplayId,
      beats: data.beats?.length,
      characters: data.characters?.length,
      locations: data.locations?.length
    });
    
    try {
      // Transform to API format
      const apiData: any = {
        screenplay_id: this.screenplayId
      };
      
      // 🔥 CRITICAL: Only include fields that have actual data
      // Don't overwrite with empty arrays!
      if (data.beats !== undefined && data.beats.length > 0) {
        apiData.beats = this.transformBeatsToAPI(data.beats);
      }
      
      if (data.characters !== undefined && data.characters.length > 0) {
        apiData.characters = this.transformCharactersToAPI(data.characters);
      }
      
      if (data.locations !== undefined && data.locations.length > 0) {
        apiData.locations = this.transformLocationsToAPI(data.locations);
      }
      
      // 🔥 If there's nothing to save, skip the API call
      if (Object.keys(apiData).length === 1) { // Only screenplay_id
        console.log('[Persistence] ⏭️ Nothing to save (all arrays empty), skipping API call');
        return;
      }
      
      // Save to DynamoDB
      await apiUpdateScreenplay(apiData, this.getToken);
      
      console.log('[Persistence] ✅ Saved successfully');
      
    } catch (error) {
      console.error('[Persistence] ❌ Save failed:', error);
      throw error;
    }
  }
  
  /**
   * Save ONLY characters (optimized for quick edits)
   * 
   * @param characters - Array of characters to save
   * @throws Error if screenplay_id not set or save fails
   */
  async saveCharacters(characters: Character[]): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot save characters: No screenplay_id set');
    }
    
    console.error('[Persistence] 💾 Saving', characters.length, 'characters via BULK UPDATE');
    
    try {
      const apiCharacters = this.transformCharactersToAPI(characters);
      
      // 🔥 CRITICAL: Use bulk update route to replace ALL characters at once
      // This is more efficient than individual POST/PUT/DELETE for each character
      const result = await apiUpdateScreenplay({
        screenplay_id: this.screenplayId,
        characters: apiCharacters
      }, this.getToken);
      
      console.error('[Persistence] ✅ Saved', characters.length, 'characters to DynamoDB');
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to save characters:', error);
      throw error;
    }
  }
  
  /**
   * Save ONLY locations (optimized for quick edits)
   * 
   * @param locations - Array of locations to save
   * @throws Error if screenplay_id not set or save fails
   */
  async saveLocations(locations: Location[]): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot save locations: No screenplay_id set');
    }
    
    console.log('[Persistence] 💾 Saving locations...', locations.length);
    
    try {
      const apiLocations = this.transformLocationsToAPI(locations);
      
      await apiUpdateScreenplay({
        screenplay_id: this.screenplayId,
        locations: apiLocations
      }, this.getToken);
      
      console.log('[Persistence] ✅ Saved', locations.length, 'locations');
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to save locations:', error);
      throw error;
    }
  }
  
  /**
   * Save ONLY beats (optimized for reordering/bulk updates)
   * 
   * @param beats - Array of beats to save
   * @throws Error if screenplay_id not set or save fails
   */
  async saveBeats(beats: StoryBeat[]): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot save beats: No screenplay_id set');
    }
    
    console.log('[Persistence] 💾 Saving beats...', beats.length);
    console.log('[Persistence] 🔍 Beats to save:', beats.map(b => ({ id: b.id, title: b.title, scenes: b.scenes?.length || 0 })));
    
    try {
      const apiBeats = this.transformBeatsToAPI(beats);
      console.log('[Persistence] 🔍 Transformed to API format:', apiBeats.length, 'beats');
      console.log('[Persistence] 🔍 API payload:', JSON.stringify({ screenplay_id: this.screenplayId, beats: apiBeats }).substring(0, 500));
      
      const result = await apiUpdateScreenplay({
        screenplay_id: this.screenplayId,
        beats: apiBeats
      }, this.getToken);
      
      console.log('[Persistence] 🔍 API RESPONSE:', result ? JSON.stringify(result).substring(0, 500) : 'null');
      console.log('[Persistence] ✅ Saved', beats.length, 'beats');
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to save beats:', error);
      throw error;
    }
  }
  
  /**
   * Clear ALL screenplay data from DynamoDB
   * Called by "Clear All" button
   * 
   * @throws Error if screenplay_id not set or clear fails
   */
  async clearAll(): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot clear: No screenplay_id set');
    }
    
    console.log('[Persistence] 🗑️ Clearing all data for screenplay:', this.screenplayId);
    
    try {
      // Clear by setting everything to empty
      const result = await apiUpdateScreenplay({
        screenplay_id: this.screenplayId,
        beats: [],
        characters: [],
        locations: [],
        content: '' // Also clear screenplay text
      }, this.getToken);
      
      console.log('[Persistence] ✅ Cleared all data - API response:', result);
      
      // Verify the clear worked by checking the returned document
      if (result && (result.beats?.length > 0 || result.characters?.length > 0 || result.locations?.length > 0)) {
        console.error('[Persistence] ⚠️ WARNING: Clear succeeded but data still exists in response:', {
          beats: result.beats?.length || 0,
          characters: result.characters?.length || 0,
          locations: result.locations?.length || 0
        });
        throw new Error('Clear operation did not fully clear data');
      }
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to clear:', error);
      throw error;
    }
  }
  
  /**
   * Check if data has been loaded from DynamoDB
   * 
   * @returns true if loadAll() has completed (success or failure)
   */
  isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Get current screenplay ID
   */
  getScreenplayId(): string | null {
    return this.screenplayId;
  }
  
  // ==========================================================================
  // Transformation Functions (App Format ↔ API Format)
  // ==========================================================================
  
  /**
   * Transform characters from API format to app format
   */
  private transformCharactersFromAPI(apiCharacters: any[]): Character[] {
    return apiCharacters.map(char => ({
      id: char.id || char.character_id,
      name: char.name || '',
      type: 'supporting' as CharacterType, // Default type
      description: char.description || '',
      arcStatus: 'introduced' as ArcStatus, // Default arc status
      customFields: [], // Default to empty array
      images: (char.referenceImages || char.reference_images || []).map((url: string, index: number) => ({
        id: `img-${char.id}-${index}`,
        imageUrl: url,
        createdAt: new Date().toISOString()
      })),
      sceneAppearances: [],
      createdAt: char.created_at || new Date().toISOString(),
      updatedAt: char.updated_at || new Date().toISOString()
    }));
  }
  
  /**
   * Transform characters from app format to API format
   */
  private transformCharactersToAPI(characters: Character[]): APICharacter[] {
    return characters.map(char => ({
      id: char.id,
      name: char.name,
      description: char.description,
      referenceImages: char.images?.map(img => img.imageUrl) || []
    }));
  }
  
  /**
   * Transform locations from API format to app format
   */
  private transformLocationsFromAPI(apiLocations: any[]): Location[] {
    return apiLocations.map(loc => ({
      id: loc.id || loc.location_id,
      name: loc.name || '',
      type: 'INT' as LocationType, // Default type
      description: loc.description || '',
      customFields: [], // Default to empty array
      images: (loc.referenceImages || loc.reference_images || []).map((url: string, index: number) => ({
        id: `img-${loc.id}-${index}`,
        imageUrl: url,
        createdAt: new Date().toISOString()
      })),
      sceneAppearances: [],
      createdAt: loc.created_at || new Date().toISOString(),
      updatedAt: loc.updated_at || new Date().toISOString()
    }));
  }
  
  /**
   * Transform locations from app format to API format
   */
  private transformLocationsToAPI(locations: Location[]): APILocation[] {
    return locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      description: loc.description,
      referenceImages: loc.images?.map(img => img.imageUrl) || []
    }));
  }
  
  /**
   * Transform beats from API format to app format
   */
  private transformBeatsFromAPI(apiBeats: any[]): StoryBeat[] {
    return apiBeats.map(beat => ({
      id: beat.id || beat.beat_id,
      title: beat.title || '',
      description: beat.description || '',
      order: beat.order || 0,
      scenes: beat.scenes || [],
      createdAt: beat.created_at || new Date().toISOString(),
      updatedAt: beat.updated_at || new Date().toISOString()
    }));
  }
  
  /**
   * Transform beats from app format to API format
   */
  private transformBeatsToAPI(beats: StoryBeat[]): APIBeat[] {
    return beats.map(beat => ({
      id: beat.id,
      title: beat.title,
      description: beat.description || '', // API requires description, default to empty string
      order: beat.order,
      scenes: beat.scenes || []
    }));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton instance of the persistence manager
 * Use this throughout the app for all DynamoDB operations
 */
export const persistenceManager = new ScreenplayPersistenceManager();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wait for persistence manager to be ready (initialized)
 * Useful for import flows that need to wait for data to load
 * 
 * @param timeoutMs - Maximum time to wait (default: 5000ms)
 * @returns Promise that resolves when ready or rejects on timeout
 */
export async function waitForInitialization(timeoutMs: number = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (!persistenceManager.isReady()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('[Persistence] Timeout waiting for initialization');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('[Persistence] ✅ Initialization complete');
}

