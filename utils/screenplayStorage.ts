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
      'Authorization': `Bearer ${token}`
    }
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
  return data.data.character;
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
      'Authorization': `Bearer ${token}`
    }
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
  return data.data.location;
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
  return data.data.location;
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
// ============================================================================

/**
 * List beats for a screenplay
 */
export async function listBeats(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Beat[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/beats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list beats');
  }

  const data = await response.json();
  return data.data.beats;
}

/**
 * Create a new beat
 */
export async function createBeat(
  screenplayId: string,
  beat: Omit<Beat, 'id'>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Beat> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/beats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(beat)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create beat');
  }

  const data = await response.json();
  return data.data.beat;
}

/**
 * Bulk create beats (for imports/paste)
 */
export async function bulkCreateBeats(
  screenplayId: string,
  beats: Array<Omit<Beat, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Beat[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 POST /api/screenplays/' + screenplayId + '/beats/bulk', { count: beats.length });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/beats/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ beats })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to bulk create beats');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Bulk created', data.count, 'beats');
  return data.data;
}

/**
 * Update a beat
 */
export async function updateBeat(
  screenplayId: string,
  beatId: string,
  updates: Partial<Omit<Beat, 'id'>>,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Beat> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/beats/${beatId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update beat');
  }

  const data = await response.json();
  return data.data.beat;
}

/**
 * Delete a beat
 */
export async function deleteBeat(
  screenplayId: string,
  beatId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/beats/${beatId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete beat');
  }
}

/**
 * Delete ALL beats for a screenplay
 */
export async function deleteAllBeats(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.log('[screenplayStorage] 🔥 DELETE /api/screenplays/' + screenplayId + '/beats (all)');
  
  const response = await fetch(`/api/screenplays/${screenplayId}/beats`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete all beats');
  }
  
  console.log('[screenplayStorage] ✅ Deleted all beats');
}

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

