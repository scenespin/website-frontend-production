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

// Feature 0122: Collaborator interface (defined early for use in Screenplay)
export interface Collaborator {
  user_id?: string;
  email: string;
  role: 'director' | 'writer' | 'producer' | 'viewer';
  added_at: string;
  added_by?: string;
}

export interface Screenplay {
  user_id: string;
  screenplay_id: string;
  title: string;
  author: string;
  description?: string;
  content: string;
  beats: Beat[];
  characters: Character[];
  locations: Location[];
  relationships: Relationships;
  metadata?: {
    genre?: string;
    logline?: string;
    pageCount?: number;
    tags?: string[];
    wordCount?: number;
    sceneCount?: number;
    characterCount?: number;
    version?: number;
  };
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  status: 'active' | 'archived' | 'deleted';
  version: string;
  word_count?: number;
  scene_count?: number;
  github_config?: GitHubConfig;
  last_edited_by?: string; // Feature 0133: user_id of the person who last edited
  last_edited_at?: string; // Feature 0133: ISO timestamp of last edit
  collaborators?: Collaborator[]; // Feature 0122: Array of collaborators with their roles
  cloudStorageProvider?: 'google-drive' | 'dropbox' | null; // Feature 0144: Per-screenplay cloud provider for auto-sync
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
  description?: string;
  metadata?: {
    genre?: string;
    logline?: string;
    pageCount?: number;
    tags?: string[];
    wordCount?: number;
    sceneCount?: number;
    characterCount?: number;
    version?: number;
  };
  content?: string;
  beats?: Beat[];
  characters?: Character[];
  locations?: Location[];
  relationships?: Relationships;
  github_config?: GitHubConfig;
  status?: 'active' | 'archived' | 'deleted';
  cloudStorageProvider?: 'google-drive' | 'dropbox' | null; // Feature 0144: Per-screenplay cloud provider for auto-sync
  // Feature 0133: Optimistic Locking
  expectedVersion?: number;  // Version number expected when saving (for conflict detection)
  force?: boolean;  // Force save (bypass version check) - for conflict resolution "Keep My Changes"
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================


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
  // Note: Next.js API route handles auth server-side via Clerk middleware
  // No need to send Authorization header - the route uses auth() to get token
  console.log('[screenplayStorage] Creating screenplay with params:', { title: params.title, author: params.author });
  
  const response = await fetch('/api/screenplays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[screenplayStorage] Failed to create screenplay:', response.status, error);
    throw new Error(error.message || 'Failed to create screenplay');
  }

  const data = await response.json();
  console.log('[screenplayStorage] Create response structure:', {
    hasData: !!data.data,
    hasSuccess: 'success' in data,
    keys: Object.keys(data),
    dataKeys: data.data ? Object.keys(data.data) : null,
    screenplayId: data.data?.screenplay_id
  });
  
  if (!data.data) {
    console.error('[screenplayStorage] ❌ Response missing data.data:', data);
    throw new Error('Invalid response format - missing screenplay data');
  }
  
  if (!data.data.screenplay_id) {
    console.error('[screenplayStorage] ❌ Response missing screenplay_id:', data.data);
    throw new Error('Invalid response format - missing screenplay_id');
  }
  
  console.log('[screenplayStorage] ✅ Screenplay created successfully:', data.data.screenplay_id);
  return data.data;
}

/**
 * Get screenplay by ID
 * Feature 0130: Uses screenplay_id only - no project_id fallback
 */
export async function getScreenplay(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay | null> {
  // Feature 0130: Validate ID format - reject proj_ IDs
  if (screenplayId.startsWith('proj_')) {
    console.warn('[screenplayStorage] ⚠️ Rejected proj_ ID (legacy format):', screenplayId);
    throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplayId}`);
  }
  
  if (!screenplayId.startsWith('screenplay_')) {
    console.warn('[screenplayStorage] ⚠️ Invalid ID format:', screenplayId);
    throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplayId}`);
  }
  
  console.log('[screenplayStorage] GET /api/screenplays/' + screenplayId);
  
  // Note: Next.js API route handles auth server-side, so we don't need to send token
  // 🔥 CRITICAL: Disable browser caching to ensure fresh data is always fetched
  // Add cache-busting query parameter to force fresh request
  const cacheBuster = `?t=${Date.now()}`;
  const response = await fetch(`/api/screenplays/${screenplayId}${cacheBuster}`, {
    cache: 'no-store', // Prevent browser from caching the response
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorMessage = 'Failed to get screenplay';
    
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
    }
    
    // 🔥 FIX: Provide user-friendly error messages
    if (response.status === 403) {
      errorMessage = 'You don\'t have access to this screenplay. Please contact the owner.';
    } else if (response.status === 404) {
      errorMessage = 'Screenplay not found. It may have been deleted.';
    }
    
    const error = new Error(errorMessage);
    (error as any).response = response; // Attach response for better error handling
    throw error;
  }

  const data = await response.json();
  // Handle different response structures: { data: {...} } or { success: true, data: {...} }
  return data.data || data;
}

/**
 * Update screenplay
 * Feature 0130: Uses screenplay_id only - no project_id fallback
 */
export async function updateScreenplay(
  params: UpdateScreenplayParams,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay> {
  const { screenplay_id, ...updates } = params;
  
  // Feature 0130: Validate ID format - reject proj_ IDs
  if (screenplay_id.startsWith('proj_')) {
    console.warn('[screenplayStorage] ⚠️ Rejected proj_ ID (legacy format):', screenplay_id);
    throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplay_id}`);
  }
  
  if (!screenplay_id.startsWith('screenplay_')) {
    console.warn('[screenplayStorage] ⚠️ Invalid ID format:', screenplay_id);
    throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplay_id}`);
  }
  
  console.log('[screenplayStorage] 🔥 PUT /api/screenplays/' + screenplay_id, {
    screenplay_id,
    updates_keys: Object.keys(updates),
    beats_count: updates.beats?.length,
    characters_count: updates.characters?.length,
    locations_count: updates.locations?.length
  });
  
  // Note: Next.js API route handles auth server-side, so we don't need to send token
  const response = await fetch(`/api/screenplays/${screenplay_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });

  console.log('[screenplayStorage] Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorMessage = 'Failed to update screenplay';
    let errorData: any = {};
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.message || parsed.error || errorMessage;
      errorData = parsed;
    } catch {
      errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
    }
    
    // Feature 0133: Preserve conflict details for conflict resolution UI
    const error: any = new Error(errorMessage);
    if (response.status === 409) {
      error.isConflict = true;
      error.conflictDetails = errorData.conflictDetails || errorData;
      error.statusCode = 409;
    }
    
    console.error('[screenplayStorage] ❌ API ERROR:', errorMessage, response.status === 409 ? '(Conflict)' : '');
    throw error;
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ API SUCCESS:', Object.keys(data));
  // Handle different response structures: { data: {...} } or { success: true, data: {...} }
  const result = data.data || data;
  
  // Feature 0133: Ensure version is a number (handle backward compatibility)
  if (result && typeof result.version === 'string') {
    result.version = parseFloat(result.version) || 1;
  }
  
  return result;
}

/**
 * Delete screenplay (soft delete)
 * Feature 0130: Uses screenplay_id only - no project_id fallback
 */
export async function deleteScreenplay(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<void> {
  // Feature 0130: Validate ID format - reject proj_ IDs
  if (screenplayId.startsWith('proj_')) {
    console.warn('[screenplayStorage] ⚠️ Rejected proj_ ID (legacy format):', screenplayId);
    throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplayId}`);
  }
  
  if (!screenplayId.startsWith('screenplay_')) {
    console.warn('[screenplayStorage] ⚠️ Invalid ID format:', screenplayId);
    throw new Error(`Invalid screenplay ID format. Expected screenplay_* but got: ${screenplayId}`);
  }
  
  // Note: Next.js API route handles auth server-side, so we don't need to send token
  const response = await fetch(`/api/screenplays/${screenplayId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorMessage = 'Failed to delete screenplay';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
    }
    throw new Error(errorMessage);
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
  // Note: Next.js API route handles auth server-side, so we don't need to send token
  const response = await fetch(`/api/screenplays/list?status=${status}&limit=${limit}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let errorMessage = 'Failed to list screenplays';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.message || error.error || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${response.status} ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Backend returns { success: true, data: { screenplays: [...] } }
  if (!data.success || !data.data || !Array.isArray(data.data.screenplays)) {
    console.error('[screenplayStorage] Invalid response structure:', data);
    return [];
  }
  
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
  getToken: ReturnType<typeof useAuth>['getToken'],
  context: 'creation' | 'production-hub' = 'production-hub' // 🔥 NEW: Support context parameter, default to production-hub for Production Hub
): Promise<Character[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  console.error('[screenplayStorage] 🎯 GET /api/screenplays/' + screenplayId + '/characters?context=' + context);
  
  const response = await fetch(`/api/screenplays/${screenplayId}/characters?context=${context}`, {
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
  return data.data; // 🔥 FIX: Backend returns { success: true, data: character }, not { success: true, data: { character } }
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
  getToken: ReturnType<typeof useAuth>['getToken'],
  context: 'creation' | 'production-hub' = 'production-hub' // 🔥 NEW: Support context parameter, default to production-hub for Production Hub
): Promise<Location[]> {
  const token = await getToken({ template: 'wryda-backend' });
  
  const response = await fetch(`/api/screenplays/${screenplayId}/locations?context=${context}`, {
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
 * Batch update prop associations for multiple scenes
 * Prevents race conditions from parallel updates
 */
export async function batchUpdatePropAssociations(
  screenplayId: string,
  assetId: string,
  sceneIdsToLink: string[],
  sceneIdsToUnlink: string[],
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Scene[]> {
  const url = `/api/screenplays/${screenplayId}/scenes/batch-update-props`;
  
  console.log('[screenplayStorage] 🔗 batchUpdatePropAssociations called:', {
    url,
    assetId,
    linkCount: sceneIdsToLink.length,
    unlinkCount: sceneIdsToUnlink.length
  });
  
  const token = await getToken({ template: 'wryda-backend' });
  
  if (!token) {
    console.error('[screenplayStorage] ❌ No token available');
    throw new Error('No authentication token available');
  }
  
  console.log('[screenplayStorage] ✅ Token obtained, making request to:', url);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      asset_id: assetId,
      scene_ids_to_link: sceneIdsToLink,
      scene_ids_to_unlink: sceneIdsToUnlink
    })
  });

  console.log('[screenplayStorage] 📊 Response status:', response.status, response.statusText);
  console.log('[screenplayStorage] 📊 Response URL:', response.url);
  console.log('[screenplayStorage] 📊 Response OK:', response.ok);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      const text = await response.text();
      errorData = { message: text || `HTTP ${response.status}` };
    }
    console.error('[screenplayStorage] ❌ Error response:', errorData);
    throw new Error(errorData.message || errorData.error || 'Failed to batch update prop associations');
  }

  const data = await response.json();
  console.log('[screenplayStorage] ✅ Success, received data:', data);
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

// ============================================================================
// COLLABORATION API FUNCTIONS
// Feature 0122: Screenplay Role-Based Collaboration System
// ============================================================================

// Note: Collaborator interface is defined earlier in the file (before Screenplay interface)

export interface RolePreset {
  id: string;
  name: string;
  description: string;
  capabilities: {
    canEditScript: boolean;
    canViewScript: boolean;
    canManageAssets: boolean;
    canManageOwnAssets: boolean;
    canGenerateAssets: boolean;
    canUploadAssets: boolean;
    canViewAssets: boolean;
    canUseAI: boolean;
    canEditComposition: boolean;
    canEditTimeline: boolean;
    canViewComposition: boolean;
    canViewTimeline: boolean;
  };
}

/**
 * List all collaborators for a screenplay
 */
export async function listScreenplayCollaborators(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Collaborator[]> {
  try {
    const token = await getToken({ template: 'wryda-backend' });
    const response = await fetch(`/api/screenplays/${screenplayId}/collaborators`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to view collaborators');
      }
      throw new Error(`Failed to list collaborators: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.collaborators || [];
  } catch (error: any) {
    console.error('[ScreenplayStorage] Error listing collaborators:', error);
    throw error;
  }
}

/**
 * Add a collaborator to a screenplay
 */
export async function addScreenplayCollaborator(
  screenplayId: string,
  email: string,
  role: 'director' | 'writer' | 'producer' | 'viewer',
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay> {
  try {
    const token = await getToken({ template: 'wryda-backend' });
    const response = await fetch(`/api/screenplays/${screenplayId}/collaborators`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, role }),
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to add collaborators');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid request');
      }
      throw new Error(`Failed to add collaborator: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.screenplay;
  } catch (error: any) {
    console.error('[ScreenplayStorage] Error adding collaborator:', error);
    throw error;
  }
}

/**
 * Remove a collaborator from a screenplay
 */
export async function removeScreenplayCollaborator(
  screenplayId: string,
  identifier: string, // email or user_id
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay> {
  try {
    const token = await getToken({ template: 'wryda-backend' });
    const response = await fetch(`/api/screenplays/${screenplayId}/collaborators/${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to remove collaborators');
      }
      throw new Error(`Failed to remove collaborator: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.screenplay;
  } catch (error: any) {
    console.error('[ScreenplayStorage] Error removing collaborator:', error);
    throw error;
  }
}

/**
 * Update a collaborator's role
 */
export async function updateCollaboratorRole(
  screenplayId: string,
  identifier: string, // email or user_id
  role: 'director' | 'writer' | 'producer' | 'viewer',
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<Screenplay> {
  try {
    const token = await getToken({ template: 'wryda-backend' });
    const response = await fetch(`/api/screenplays/${screenplayId}/collaborators/${encodeURIComponent(identifier)}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role }),
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to update collaborator roles');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid request');
      }
      throw new Error(`Failed to update collaborator role: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.screenplay;
  } catch (error: any) {
    console.error('[ScreenplayStorage] Error updating collaborator role:', error);
    throw error;
  }
}

/**
 * Get available role presets
 */
export async function getAvailableRoles(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<RolePreset[]> {
  try {
    const token = await getToken({ template: 'wryda-backend' });
    const response = await fetch(`/api/screenplays/${screenplayId}/collaborators/roles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to get available roles: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.roles || [];
  } catch (error: any) {
    console.error('[ScreenplayStorage] Error getting available roles:', error);
    throw error;
  }
}

/**
 * Check a specific permission for a screenplay
 * Note: This is a convenience function that calls the test-permissions endpoint
 */
export async function checkScreenplayPermission(
  screenplayId: string,
  permission: 'canViewScript' | 'canEditScript' | 'canManageAssets' | 'canManageOwnAssets' | 'canUseAI' | 'canUploadAssets' | 'canEditComposition' | 'canEditTimeline' | 'canViewComposition' | 'canViewTimeline',
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<boolean> {
  try {
    const token = await getToken({ template: 'wryda-backend' });
    const response = await fetch(`/api/screenplays/test-permissions/${screenplayId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.permissions?.[permission] === true;
  } catch (error: any) {
    console.error('[ScreenplayStorage] Error checking permission:', error);
    return false;
  }
}

