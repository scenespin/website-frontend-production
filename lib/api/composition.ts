/**
 * Composition API Client
 * Centralized client for all composition-related API calls
 */

import { CompositionLayout, CompositionFilters, CompositionResponse } from '../types/composition';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Fetch all composition layouts with optional filters
 */
export async function fetchCompositionLayouts(
  filters?: CompositionFilters
): Promise<CompositionLayout[]> {
  const params = new URLSearchParams();
  
  if (filters?.category) params.append('category', filters.category);
  if (filters?.tag) params.append('tag', filters.tag);
  if (filters?.numRegions) params.append('num_videos', filters.numRegions.toString());
  if (filters?.audioEnabled) params.append('audio_enabled', 'true');
  if (filters?.animated) params.append('animated', 'true');
  
  const url = `${API_BASE}/api/composition/layouts${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include auth cookies
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch compositions: ${response.statusText}`);
  }
  
  const data: CompositionResponse = await response.json();
  return data.layouts;
}

/**
 * Fetch animated compositions only
 */
export async function fetchAnimatedCompositions(
  filters?: { tag?: string; numRegions?: number }
): Promise<CompositionLayout[]> {
  const params = new URLSearchParams();
  
  if (filters?.tag) params.append('tag', filters.tag);
  if (filters?.numRegions) params.append('num_videos', filters.numRegions.toString());
  
  const url = `${API_BASE}/api/composition/animations${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch animations: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.animations;
}

/**
 * Get AI-suggested composition for a story beat
 */
export async function suggestComposition(data: {
  beat: {
    title: string;
    description: string;
    scenes?: any[];
  };
  characters?: string[];
}): Promise<any> {
  const url = `${API_BASE}/api/composition/suggest`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get composition suggestion: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch composition presets (for builder)
 */
export async function fetchCompositionPresets(): Promise<any[]> {
  const url = `${API_BASE}/api/composition-builder/presets`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch presets: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.presets || [];
}

