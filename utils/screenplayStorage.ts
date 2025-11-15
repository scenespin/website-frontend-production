/**
 * Screenplay Storage API Client
 * Feature 0111: DynamoDB Storage
 * 
 * Client-side functions for screenplay CRUD operations
 */

import { useAuth } from '@clerk/nextjs';

// ============================================================================
// TYPES
// ============================================================================

export interface Beat {
  id: string;
  title: string;
  description: string;
  order: number;
  scenes?: string[];
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  referenceImages?: string[];
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  referenceImages?: string[];
}

export interface Scene {
  id: string;
  beat_id: string;
  number: number;
  heading: string;
  synopsis: string;
  status: 'draft' | 'review' | 'final';
  order: number;
  fountain: {
    startLine: number;
    endLine: number;
    tags: {
      location?: string;
      characters: string[];
      props?: string[];
    };
  };
  estimatedPageCount?: number;
  images?: any[];
  videoAssets?: any;
  timing?: {
    startMinute: number;
    durationMinutes: number;
    pageNumber?: number;
  };
}

export interface Relationships {
  [key: string]: any;
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  connected: boolean;
  last_synced_at?: string;
}

export interface Screenplay {
  user_id: string;
  screenplay_id: string;
  title: string;
  author: string;
  content: string;
  beats: Beat[];
  characters: Character[];
  locations: Location[];
  relationships: Relationships;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  status: 'active' | 'archived' | 'deleted';
  version: string;
  word_count?: number;
  scene_count?: number;
  github_config?: GitHubConfig;
}

export interface CreateScreenplayParams {
  title: string;
  author: string;
  content?: string;
  beats?: Beat[];
  characters?: Character[];
  locations?: Location[];
  relationships?: Relationships;
}

export interface UpdateScreenplayParams {
  screenplay_id: string;
  title?: string;
  author?: string;
  content?: string;
  beats?: Beat[];
  characters?: Character[];
  locations?: Location[];
  relationships?: Relationships;
  github_config?: GitHubConfig;
  status?: 'active' | 'archived' | 'deleted';
}

// ============================================================================
// API CLIENT FUNCTIONS
// ============================================================================

/**
 * Create a new screenplay
 */
export async function createScreenplay(
  params: CreateScreenplayParams,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch('/api/screenplays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create screenplay');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get screenplay by ID
 */
export async function getScreenplay(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay | null> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get screenplay');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update screenplay
 */
export async function updateScreenplay(
  params: UpdateScreenplayParams,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const { screenplay_id, ...updates } = params;
  
  console.error('[screenplayStorage] 🔥 PUT /api/screenplays/' + screenplay_id, {
    updates_keys: Object.keys(updates),
    beats_count: updates.beats?.length,
    characters_count: updates.characters?.length,
    locations_count: updates.locations?.length
  });
  
  const response = await fetch(`/api/screenplays/${screenplay_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  console.error('[screenplayStorage] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json();
    console.error('[screenplayStorage] ❌ API ERROR:', error);
    throw new Error(error.message || 'Failed to update screenplay');
  }

  const data = await response.json();
  console.error('[screenplayStorage] ✅ API SUCCESS:', Object.keys(data));
  return data.data;
}

/**
 * Delete screenplay (soft delete)
 */
export async function deleteScreenplay(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete screenplay');
  }
}

/**
 * List user's screenplays
 */
export async function listScreenplays(
  getToken: ReturnType<typeof useAuth>['getToken'],
  status: 'active' | 'archived' | 'deleted' = 'active',
  limit: number = 50
): Promise<Screenplay[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/list?status=${status}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list screenplays');
  }

  const data = await response.json();
  return data.data.screenplays;
}

/**
 * Get screenplay count
 */
export async function getScreenplayCount(
  getToken: ReturnType<typeof useAuth>['getToken'],
  status: 'active' | 'archived' | 'deleted' = 'active'
): Promise<number> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/count?status=${status}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get screenplay count');
  }

  const data = await response.json();
  return data.data.count;
}

// ============================================================================
// CHARACTER API FUNCTIONS
// ============================================================================

/**
 * List characters for a screenplay
 */
export async function listCharacters(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Character[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.error('[screenplayStorage] 🎯 GET /api/screenplays/' + screenplayId + '/characters');
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    cache: 'no-store' // 🔥 FIX: Prevent browser caching of API responses
  });

  console.error('[screenplayStorage] Characters response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('[screenplayStorage] Characters error:', error);
    throw new Error(error.message || 'Failed to list characters');
  }

  const data = await response.json();
  console.error('[screenplayStorage] Characters data:', data);
  console.error('[screenplayStorage] Characters data.data:', data.data);
  console.error('[screenplayStorage] Characters array:', data.data.characters);
  return data.data.characters;
}

/**
 * Create a new character
 */
export async function createCharacter(
  screenplayId: string,
  character: Omit<Character, 'id'>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Character> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(character)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create character');
  }

  const data = await response.json();
  return data.data.character;
}

/**
 * Bulk create characters (for imports/paste)
 */
export async function bulkCreateCharacters(
  screenplayId: string,
  characters: Array<Omit<Character, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Character[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 POST /api/screenplays/' + screenplayId + '/characters/bulk', { count: characters.length });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ characters })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to bulk create characters');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Bulk created', data.count, 'characters');
  return data.data;
}

/**
 * 🔥 NEW: Bulk UPSERT characters (create if new, update if exists)
 * Prevents duplicates when importing the same script multiple times
 */
export interface CharacterUpsertInput {
  id?: string; // If provided, will try to update
  name: string;
  description?: string;
  referenceImages?: string[];
}

export interface UpsertResult {
  created: Character[];
  updated: Character[];
  failed: Array<{ name: string; error: string }>;
  summary: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
}

export async function bulkUpsertCharacters(
  screenplayId: string,
  characters: CharacterUpsertInput[],
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<UpsertResult> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 PUT /api/screenplays/' + screenplayId + '/characters/bulk (UPSERT)', { count: characters.length });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters/bulk`, {
    method: 'PUT', // ← PUT for UPSERT, not POST
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ characters })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to bulk upsert characters');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Upsert complete:', data.summary);
  return data.data;
}

/**
 * Update a character
 */
export async function updateCharacter(
  screenplayId: string,
  characterId: string,
  updates: Partial<Omit<Character, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Character> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters/${characterId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update character');
  }

  const data = await response.json();
  return data.data; // 🔥 FIX: Backend returns { success: true, data: character }, not { success: true, data: { character } }
}

/**
 * Delete a character
 */
export async function deleteCharacter(
  screenplayId: string,
  characterId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters/${characterId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete character');
  }
}

// ============================================================================
// LOCATION API FUNCTIONS
// ============================================================================

/**
 * List locations for a screenplay
 */
export async function listLocations(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Location[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    cache: 'no-store' // 🔥 FIX: Prevent browser caching of API responses
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list locations');
  }

  const data = await response.json();
  return data.data.locations;
}

/**
 * Create a new location
 */
export async function createLocation(
  screenplayId: string,
  location: Omit<Location, 'id'>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Location> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(location)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create location');
  }

  const data = await response.json();
  return data.data; // 🔥 FIX: Backend returns { success: true, data: location }, not { success: true, data: { location } }
}

/**
 * Bulk create locations (for imports/paste)
 */
export async function bulkCreateLocations(
  screenplayId: string,
  locations: Array<Omit<Location, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Location[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 POST /api/screenplays/' + screenplayId + '/locations/bulk', { count: locations.length });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ locations })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to bulk create locations');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Bulk created', data.count, 'locations');
  return data.data;
}

/**
 * Update a location
 */
export async function updateLocation(
  screenplayId: string,
  locationId: string,
  updates: Partial<Omit<Location, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Location> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations/${locationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update location');
  }

  const data = await response.json();
  return data.data; // 🔥 FIX: Backend returns { success: true, data: location }, not { success: true, data: { location } }
}

/**
 * Delete a location
 */
export async function deleteLocation(
  screenplayId: string,
  locationId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations/${locationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete location');
  }
}

// ============================================================================
// BEAT API FUNCTIONS
// Feature 0117: Removed - beats are now frontend-only UI templates
// ============================================================================

/**
 * Delete ALL characters for a screenplay
 */
export async function deleteAllCharacters(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 DELETE /api/screenplays/' + screenplayId + '/characters (all)');
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete all characters');
  }
  
  console.log('[screenplayStorage] ✅ Deleted all characters');
}

/**
 * Delete ALL locations for a screenplay
 */
export async function deleteAllLocations(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 DELETE /api/screenplays/' + screenplayId + '/locations (all)');
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete all locations');
  }
  
  console.log('[screenplayStorage] ✅ Deleted all locations');
}

// ============================================================================
// SCENE API FUNCTIONS (Feature 0117: Simplified Scene Architecture)
// ============================================================================

/**
 * List scenes for a screenplay
 */
export async function listScenes(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Scene[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🎯 GET /api/screenplays/' + screenplayId + '/scenes');
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list scenes');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Scenes response:', data.data.scenes.length, 'scenes');
  return data.data.scenes;
}

/**
 * Create a new scene
 */
export async function createScene(
  screenplayId: string,
  scene: Omit<Scene, 'id'>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Scene> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(scene)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create scene');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Bulk create scenes (for imports/paste)
 */
export async function bulkCreateScenes(
  screenplayId: string,
  scenes: Array<Omit<Scene, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Scene[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 POST /api/screenplays/' + screenplayId + '/scenes/bulk', { count: scenes.length });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ scenes })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to bulk create scenes');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Bulk created', data.count, 'scenes');
  return data.data;
}

/**
 * Update a scene
 */
export async function updateScene(
  screenplayId: string,
  sceneId: string,
  updates: Partial<Omit<Scene, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Scene> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes/${sceneId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update scene');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Delete a scene
 */
export async function deleteScene(
  screenplayId: string,
  sceneId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes/${sceneId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete scene');
  }
}

/**
 * Delete all scenes for a screenplay (for Clear All)
 */
export async function deleteAllScenes(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 DELETE /api/screenplays/' + screenplayId + '/scenes (all)');
  
  const response = await fetch(`/api/screenplays/${screenplayId}/scenes`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete all scenes');
  }
  
  console.log('[screenplayStorage] ✅ Deleted all scenes');
}

// ============================================================================
// RELATIONSHIPS API FUNCTIONS
// ============================================================================

/**
 * Update relationships (full replace)
 */
export async function updateRelationships(
  screenplayId: string,
  relationships: Relationships,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Relationships> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/relationships`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(relationships)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update relationships');
  }

  const data = await response.json();
  return data.data.relationships;
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const LOCALSTORAGE_KEY_PREFIX = 'wryda_screenplay_';

/**
 * Save screenplay to localStorage (crash protection)
 */
export function saveToLocalStorage(screenplayId: string, screenplay: Partial<Screenplay>): void {
  try {
    const key = `${LOCALSTORAGE_KEY_PREFIX}${screenplayId}`;
    localStorage.setItem(key, JSON.stringify({
      ...screenplay,
      _saved_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error('[Screenplay] Failed to save to localStorage:', error);
  }
}

/**
 * Load screenplay from localStorage
 */
export function loadFromLocalStorage(screenplayId: string): Partial<Screenplay> | null {
  try {
    const key = `${LOCALSTORAGE_KEY_PREFIX}${screenplayId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('[Screenplay] Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear screenplay from localStorage
 */
export function clearFromLocalStorage(screenplayId: string): void {
  try {
    const key = `${LOCALSTORAGE_KEY_PREFIX}${screenplayId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[Screenplay] Failed to clear localStorage:', error);
  }
}

