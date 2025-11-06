/**
 * Composition API Client
 * Centralized client for all composition-related API calls
 */

import { CompositionLayout, CompositionFilters, CompositionResponse } from '@/types/composition';
import apiClient from '@/lib/api';

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
  
  const url = `/api/composition/layouts${params.toString() ? '?' + params.toString() : ''}`;
  
  // Use apiClient to automatically include auth token via interceptor
  const response = await apiClient.get(url);
  
  return response.data.layouts;
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
  
  const url = `/api/composition/animations${params.toString() ? '?' + params.toString() : ''}`;
  
  // Use apiClient to automatically include auth token via interceptor
  const response = await apiClient.get(url);
  
  return response.data.animations;
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
  const url = `/api/composition/suggest`;
  
  // Use apiClient to automatically include auth token via interceptor
  const response = await apiClient.post(url, data);
  
  return response.data;
}

/**
 * Fetch composition presets (for builder)
 */
export async function fetchCompositionPresets(): Promise<any[]> {
  const url = `/api/composition-builder/presets`;
  
  // Use apiClient to automatically include auth token via interceptor
  const response = await apiClient.get(url);
  
  return response.data.presets || [];
}

