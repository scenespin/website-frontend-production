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
  
  const response = await fetch(`/api/screenplays/${screenplay_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update screenplay');
  }

  const data = await response.json();
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

