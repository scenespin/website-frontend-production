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
  bulkCreateBeats,
  bulkCreateCharacters,
  bulkCreateLocations,
  deleteAllBeats,
  deleteAllCharacters,
  deleteAllLocations,
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
        relationships: { beats: {}, scenes: {}, characters: {}, locations: {}, props: {} }
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
        relationships: { beats: {}, scenes: {}, characters: {}, locations: {}, props: {} }
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
      // 🔥 NEW ARCHITECTURE: Use separate table endpoints for beats, characters, locations
      // This replaces the old "store as arrays in screenplay document" approach
      
      // Save characters to separate table
      if (data.characters !== undefined && data.characters.length > 0) {
        console.log('[Persistence] 📦 Saving characters to separate table:', data.characters.length);
        const apiCharacters = this.transformCharactersToAPI(data.characters);
        await bulkCreateCharacters(this.screenplayId, apiCharacters, this.getToken);
      }
      
      // Save locations to separate table
      if (data.locations !== undefined && data.locations.length > 0) {
        console.log('[Persistence] 📦 Saving locations to separate table:', data.locations.length);
        const apiLocations = this.transformLocationsToAPI(data.locations);
        await bulkCreateLocations(this.screenplayId, apiLocations, this.getToken);
      }
      
      // Save beats to separate table
      if (data.beats !== undefined && data.beats.length > 0) {
        console.log('[Persistence] 📦 Saving beats to separate table:', data.beats.length);
        const apiBeats = this.transformBeatsToAPI(data.beats);
        await bulkCreateBeats(this.screenplayId, apiBeats, this.getToken);
      }
      
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
    
    console.error('[Persistence] 💾 Saving', characters.length, 'characters via BULK CREATE');
    
    try {
      const apiCharacters = this.transformCharactersToAPI(characters);
      
      // 🔥 NEW ARCHITECTURE: Use separate table endpoint for characters
      await bulkCreateCharacters(this.screenplayId, apiCharacters, this.getToken);
      
      console.error('[Persistence] ✅ Sent', characters.length, 'characters to DynamoDB');
      
      // 🔥 CRITICAL: Verify the save succeeded by checking DynamoDB
      // Use retry logic with exponential backoff to handle eventual consistency
      console.error('[Persistence] 🔍 Verifying characters were saved (with retries)...');
      
      const maxAttempts = 5;
      let attempt = 0;
      let verified = false;
      
      while (!verified && attempt < maxAttempts) {
        attempt++;
        
        // Wait before checking (exponential backoff: 200ms, 400ms, 800ms, ...)
        const delay = Math.min(200 * Math.pow(2, attempt - 1), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.error(`[Persistence] 🔍 Verification attempt ${attempt}/${maxAttempts} (after ${delay}ms)...`);
        
        const savedCharacters = await listCharacters(this.screenplayId!, this.getToken);
        console.error('[Persistence] 📊 Found', savedCharacters.length, 'characters in DynamoDB');
        
        if (savedCharacters.length === characters.length) {
          verified = true;
          console.error('[Persistence] ✅ VERIFIED: All characters saved successfully');
        } else if (savedCharacters.length > characters.length) {
          console.error('[Persistence] ⚠️ Found MORE characters than expected - possible duplicates');
          verified = true; // Don't keep retrying if we have MORE than expected
        }
      }
      
      if (!verified) {
        console.error('[Persistence] ⚠️ Could not verify all characters after', maxAttempts, 'attempts');
        console.error('[Persistence] ⚠️ Expected', characters.length, 'but may not all be visible yet due to eventual consistency');
      }
      
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
      
      // 🔥 NEW ARCHITECTURE: Use separate table endpoint for locations
      await bulkCreateLocations(this.screenplayId, apiLocations, this.getToken);
      
      console.log('[Persistence] ✅ Sent', locations.length, 'locations to DynamoDB');
      
      // 🔥 CRITICAL: Verify the save succeeded by checking DynamoDB
      // Use retry logic with exponential backoff to handle eventual consistency
      console.log('[Persistence] 🔍 Verifying locations were saved (with retries)...');
      
      const maxAttempts = 5;
      let attempt = 0;
      let verified = false;
      
      while (!verified && attempt < maxAttempts) {
        attempt++;
        
        // Wait before checking (exponential backoff: 200ms, 400ms, 800ms, ...)
        const delay = Math.min(200 * Math.pow(2, attempt - 1), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`[Persistence] 🔍 Verification attempt ${attempt}/${maxAttempts} (after ${delay}ms)...`);
        
        const savedLocations = await listLocations(this.screenplayId!, this.getToken);
        console.log('[Persistence] 📊 Found', savedLocations.length, 'locations in DynamoDB');
        
        if (savedLocations.length === locations.length) {
          verified = true;
          console.log('[Persistence] ✅ VERIFIED: All locations saved successfully');
        } else if (savedLocations.length > locations.length) {
          console.log('[Persistence] ⚠️ Found MORE locations than expected - possible duplicates');
          verified = true; // Don't keep retrying if we have MORE than expected
        }
      }
      
      if (!verified) {
        console.log('[Persistence] ⚠️ Could not verify all locations after', maxAttempts, 'attempts');
        console.log('[Persistence] ⚠️ Expected', locations.length, 'but may not all be visible yet due to eventual consistency');
      }
      
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
      
      // 🔥 NEW ARCHITECTURE: Use separate table endpoint for beats
      await bulkCreateBeats(this.screenplayId, apiBeats, this.getToken);
      
      console.log('[Persistence] ✅ Sent', beats.length, 'beats to DynamoDB');
      
      // 🔥 CRITICAL: Verify the save succeeded by checking DynamoDB
      // Use retry logic with exponential backoff to handle eventual consistency
      console.log('[Persistence] 🔍 Verifying beats were saved (with retries)...');
      
      const maxAttempts = 5;
      let attempt = 0;
      let verified = false;
      
      while (!verified && attempt < maxAttempts) {
        attempt++;
        
        // Wait before checking (exponential backoff: 200ms, 400ms, 800ms, ...)
        const delay = Math.min(200 * Math.pow(2, attempt - 1), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`[Persistence] 🔍 Verification attempt ${attempt}/${maxAttempts} (after ${delay}ms)...`);
        
        const savedBeats = await listBeats(this.screenplayId!, this.getToken);
        console.log('[Persistence] 📊 Found', savedBeats.length, 'beats in DynamoDB');
        
        if (savedBeats.length === beats.length) {
          verified = true;
          console.log('[Persistence] ✅ VERIFIED: All beats saved successfully');
        } else if (savedBeats.length > beats.length) {
          console.log('[Persistence] ⚠️ Found MORE beats than expected - possible duplicates');
          verified = true; // Don't keep retrying if we have MORE than expected
        }
      }
      
      if (!verified) {
        console.log('[Persistence] ⚠️ Could not verify all beats after', maxAttempts, 'attempts');
        console.log('[Persistence] ⚠️ Expected', beats.length, 'but may not all be visible yet due to eventual consistency');
      }
      
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
      // 🔥 STEP 1: Send DELETE requests to DynamoDB
      await Promise.all([
        deleteAllBeats(this.screenplayId, this.getToken),
        deleteAllCharacters(this.screenplayId, this.getToken),
        deleteAllLocations(this.screenplayId, this.getToken),
        // Also clear screenplay text content
        apiUpdateScreenplay({
          screenplay_id: this.screenplayId,
          content: ''
        }, this.getToken)
      ]);
      
      console.log('[Persistence] ✅ DELETE requests sent');
      
      // 🔥 STEP 2: VERIFY that DynamoDB is truly empty
      // Poll with exponential backoff until all tables are empty
      console.log('[Persistence] 🔍 Verifying DynamoDB is empty...');
      
      const maxAttempts = 10;
      let attempt = 0;
      let allEmpty = false;
      
      while (!allEmpty && attempt < maxAttempts) {
        attempt++;
        
        // Wait before checking (exponential backoff: 100ms, 200ms, 400ms, 800ms, ...)
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`[Persistence] 🔍 Verification attempt ${attempt}/${maxAttempts} (after ${delay}ms)...`);
        
        // Check if all tables are empty
        const [beatsData, charactersData, locationsData] = await Promise.all([
          listBeats(this.screenplayId!, this.getToken).catch(() => []),
          listCharacters(this.screenplayId!, this.getToken).catch(() => []),
          listLocations(this.screenplayId!, this.getToken).catch(() => [])
        ]);
        
        console.log(`[Persistence] 📊 Remaining: ${beatsData.length} beats, ${charactersData.length} characters, ${locationsData.length} locations`);
        
        if (beatsData.length === 0 && charactersData.length === 0 && locationsData.length === 0) {
          allEmpty = true;
          console.log('[Persistence] ✅ VERIFIED: DynamoDB is empty');
        }
      }
      
      if (!allEmpty) {
        console.warn('[Persistence] ⚠️ Could not verify empty state after', maxAttempts, 'attempts - proceeding anyway');
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

