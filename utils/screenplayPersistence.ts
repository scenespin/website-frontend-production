/**
 * 🎯 SCREENPLAY PERSISTENCE MANAGER
 * 
 * SINGLE SOURCE OF TRUTH for all screenplay data persistence
 * DynamoDB is the ONLY source of truth - no localStorage caching
 * 
 * Feature 0117: Simplified Architecture - Beats are frontend-only UI templates
 * Scenes use global ordering with optional group_label for UI organization
 * 
 * This module provides:
 * - Centralized data loading from DynamoDB (scenes, characters, locations only)
 * - Centralized data saving to DynamoDB (scenes, characters, locations only)
 * - Clear initialization tracking
 * - Type-safe transformations between app types and API types
 * - Consistent error handling
 * 
 * @author AI Assistant
 * @date November 13, 2025
 * @feature 0117 - Simplified Scene Architecture
 */

import { 
  listCharacters, 
  listLocations,
  listScenes,          // Feature 0117: Simplified Scene Architecture
  bulkCreateCharacters,
  bulkCreateLocations,
  bulkCreateScenes,    // Feature 0117: Simplified Scene Architecture
  deleteAllCharacters,
  deleteAllLocations,
  deleteAllScenes,     // Feature 0117: Simplified Scene Architecture
  updateScreenplay as apiUpdateScreenplay 
} from './screenplayStorage';
import type { 
  StoryBeat,
  Scene,                // Feature 0115: Separate Scenes Table
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

// Feature 0117: APIBeat interface removed - beats are frontend-only

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
      // 🔥 Feature 0117: Load ONLY scenes, characters, locations (NO beats)
      const [charactersData, locationsData, scenesData] = await Promise.all([
        listCharacters(this.screenplayId, this.getToken).catch(err => {
          console.warn('[Persistence] Failed to load characters:', err);
          return [];
        }),
        listLocations(this.screenplayId, this.getToken).catch(err => {
          console.warn('[Persistence] Failed to load locations:', err);
          return [];
        }),
        listScenes(this.screenplayId, this.getToken).catch(err => {
          console.warn('[Persistence] Failed to load scenes:', err);
          return [];
        })
      ]);
      
      // Transform scenes from API format
      const transformedScenes = this.transformScenesFromAPI(scenesData);
      
      // 🔥 Feature 0117: Create default beats from frontend template
      // Beats are UI-only templates, scenes are grouped by group_label or order
      const defaultBeats = this.createDefaultBeats();
      const beatsWithScenes = this.groupScenesIntoBeats(defaultBeats, transformedScenes);
      
      // Transform API data to app format
      const transformedData: ScreenplayData = {
        beats: beatsWithScenes,
        characters: this.transformCharactersFromAPI(charactersData),
        locations: this.transformLocationsFromAPI(locationsData),
        relationships: { beats: {}, scenes: {}, characters: {}, locations: {}, props: {} }
      };
      
      this.isInitialized = true;
      
      console.log('[Persistence] ✅ Loaded:', {
        beats: transformedData.beats.length,
        characters: transformedData.characters.length,
        locations: transformedData.locations.length,
        scenes: transformedScenes.length
      });
      
      return transformedData;
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to load:', error);
      this.isInitialized = true; // Mark as initialized even on error to prevent infinite loops
      throw error;
    }
  }
  
  // Feature 0117: loadBeats() removed - beats are frontend-only UI templates
  
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
      
      // 🔥 Feature 0117: Save scenes extracted from beats
      // Beats are frontend-only, so we extract scenes from beats.flatMap(b => b.scenes)
      if (data.beats !== undefined && data.beats.length > 0) {
        const allScenes = data.beats.flatMap(beat => beat.scenes || []);
        if (allScenes.length > 0) {
          console.log('[Persistence] 📦 Saving scenes extracted from beats:', allScenes.length);
          await this.saveScenes(allScenes);
        }
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
      
      // 🔥 NEW ARCHITECTURE: Use separate table endpoint for locations
      await bulkCreateLocations(this.screenplayId, apiLocations, this.getToken);
      
      console.log('[Persistence] ✅ Saved', locations.length, 'locations');
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to save locations:', error);
      throw error;
    }
  }
  
  // Feature 0117: saveBeats() removed - beats are frontend-only UI templates
  // Use saveScenes() instead to persist scene data
  
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
      // 🔥 Feature 0117: Delete scenes, characters, locations (NO beats - frontend-only)
      await Promise.all([
        deleteAllScenes(this.screenplayId, this.getToken),
        deleteAllCharacters(this.screenplayId, this.getToken),
        deleteAllLocations(this.screenplayId, this.getToken),
        // Also clear screenplay text content
        apiUpdateScreenplay({
          screenplay_id: this.screenplayId,
          content: ''
        }, this.getToken)
      ]);
      
      console.log('[Persistence] ✅ Cleared all data');
      
    } catch (error) {
      console.error('[Persistence] ❌ Failed to clear:', error);
      throw error;
    }
  }
  
  /**
   * Delete ONLY characters from DynamoDB (for imports)
   * Preserves beats, locations, and scenes
   */
  async deleteAllCharacters(): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot delete characters: No screenplay_id set');
    }
    
    console.log('[Persistence] 🗑️ Deleting all characters...');
    
    try {
      await deleteAllCharacters(this.screenplayId, this.getToken);
      console.log('[Persistence] ✅ Deleted all characters');
    } catch (error) {
      console.error('[Persistence] ❌ Failed to delete characters:', error);
      throw error;
    }
  }
  
  /**
   * Delete ONLY locations from DynamoDB (for imports)
   * Preserves beats, characters, and scenes
   */
  async deleteAllLocations(): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot delete locations: No screenplay_id set');
    }
    
    console.log('[Persistence] 🗑️ Deleting all locations...');
    
    try {
      await deleteAllLocations(this.screenplayId, this.getToken);
      console.log('[Persistence] ✅ Deleted all locations');
    } catch (error) {
      console.error('[Persistence] ❌ Failed to delete locations:', error);
      throw error;
    }
  }
  
  /**
   * 🔥 Feature 0115: Save scenes to separate wryda-scenes table
   */
  async saveScenes(scenes: Scene[]): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot save scenes: No screenplay_id set');
    }
    
    console.log('[Persistence] 💾 Saving scenes...', scenes.length);
    
    try {
      const apiScenes = this.transformScenesToAPI(scenes);
      await bulkCreateScenes(this.screenplayId, apiScenes, this.getToken);
      console.log('[Persistence] ✅ Saved', scenes.length, 'scenes');
    } catch (error) {
      console.error('[Persistence] ❌ Failed to save scenes:', error);
      throw error;
    }
  }
  
  /**
   * 🔥 Feature 0115: Delete all scenes from wryda-scenes table
   */
  async deleteAllScenes(): Promise<void> {
    if (!this.screenplayId) {
      throw new Error('[Persistence] Cannot delete scenes: No screenplay_id set');
    }
    
    console.log('[Persistence] 🗑️ Deleting all scenes...');
    
    try {
      await deleteAllScenes(this.screenplayId, this.getToken);
      console.log('[Persistence] ✅ Deleted all scenes');
    } catch (error) {
      console.error('[Persistence] ❌ Failed to delete scenes:', error);
      throw error;
    }
  }
  
  // Feature 0117: deleteAllBeats() removed - beats are frontend-only UI templates
  
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
   * 🔥 Feature 0115: Transform scenes from API format to app format
   */
  private transformScenesFromAPI(apiScenes: any[]): Scene[] {
    return apiScenes.map(scene => {
      // 🔥 CRITICAL: Ensure fountain.tags always exists with all required fields
      const fountain = scene.fountain || {};
      const tags = fountain.tags || {};
      
      return {
        id: scene.id || scene.scene_id,
        number: scene.number,
        heading: scene.heading || '',
        synopsis: scene.synopsis || '',
        status: scene.status || 'draft',
        order: scene.order || 0,
        group_label: scene.group_label,
        fountain: {
          startLine: fountain.startLine || 0,
          endLine: fountain.endLine || 0,
          tags: {
            characters: tags.characters || [],
            location: tags.location || undefined,
            props: tags.props || undefined
          }
        },
        estimatedPageCount: scene.estimatedPageCount,
        images: scene.images,
        videoAssets: scene.videoAssets,
        timing: scene.timing,
        createdAt: scene.created_at || new Date().toISOString(),
        updatedAt: scene.updated_at || new Date().toISOString()
      };
    });
  }
  
  /**
   * 🔥 Feature 0115: Transform scenes from app format to API format
   */
  private transformScenesToAPI(scenes: Scene[]): any[] {
    return scenes.map(scene => ({
      number: scene.number,
      heading: scene.heading,
      synopsis: scene.synopsis,
      status: scene.status,
      order: scene.order,
      group_label: scene.group_label,
      fountain: scene.fountain,
      estimatedPageCount: scene.estimatedPageCount,
      images: scene.images,
      videoAssets: scene.videoAssets,
      timing: scene.timing
    }));
  }
  
  /**
   * 🔥 Feature 0117: Create default beats template (frontend-only UI structure)
   * Returns 8-sequence template structure for UI organization
   * Scenes are populated by matching group_label or order
   */
  private createDefaultBeats(): StoryBeat[] {
    const defaultBeatTitles = [
      'Setup',
      'Inciting Incident',
      'First Plot Point',
      'First Pinch Point',
      'Midpoint',
      'Second Pinch Point',
      'Second Plot Point',
      'Resolution'
    ];
    
    return defaultBeatTitles.map((title, index) => ({
      id: `beat_${index + 1}`,
      title,
      description: '',
      order: index + 1,
      scenes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
  
  /**
   * 🔥 Feature 0117: Group scenes into beats based on group_label or order
   * This is a frontend-only operation for UI organization
   */
  private groupScenesIntoBeats(beats: StoryBeat[], scenes: Scene[]): StoryBeat[] {
    // Sort scenes by order
    const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
    
    // If scenes have group_label, try to match them to beats by title
    // Otherwise, distribute evenly across beats
    const scenesPerBeat = Math.ceil(sortedScenes.length / beats.length);
    
    return beats.map((beat, beatIndex) => {
      const startIndex = beatIndex * scenesPerBeat;
      const endIndex = Math.min(startIndex + scenesPerBeat, sortedScenes.length);
      const beatScenes = sortedScenes.slice(startIndex, endIndex);
      
      // Try to match by group_label if available
      const matchedScenes = sortedScenes.filter(scene => 
        scene.group_label?.toLowerCase() === beat.title.toLowerCase()
      );
      
      return {
        ...beat,
        scenes: matchedScenes.length > 0 ? matchedScenes : beatScenes
      };
    });
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

