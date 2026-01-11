/**
 * Showcase Hook
 * Feature 0193: Demo Account Showcase System
 * 
 * React Query hooks for fetching public demo content for marketing/landing pages.
 * No authentication required - fetches from demo account.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

export interface ShowcaseCharacter {
  name: string;
  description: string;
  type: string;
  thumbnailUrl: string | null;
  referenceImages: string[];
  poses: Array<{
    label: string;
    imageUrl: string | null;
  }>;
}

export interface ShowcaseLocation {
  name: string;
  description: string;
  thumbnailUrl: string | null;
  referenceImages: string[];
  backgrounds: Array<{
    label: string;
    imageUrl: string | null;
  }>;
  angles: Array<{
    label: string;
    imageUrl: string | null;
  }>;
}

export interface ShowcaseProp {
  name: string;
  description: string;
  thumbnailUrl: string | null;
  images: string[];
}

export interface ShowcaseReading {
  title: string;
  description: string;
  audioUrl: string;
  subtitleUrl?: string;
  duration: number;
  sceneCount: number;
}

export interface ShowcaseVideo {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  workflow: string;
}

export interface ShowcaseAllContent {
  characters: ShowcaseCharacter[];
  locations: ShowcaseLocation[];
  props: ShowcaseProp[];
  readings: ShowcaseReading[];
  videos: ShowcaseVideo[];
  counts: {
    characters: number;
    locations: number;
    props: number;
    readings: number;
    videos: number;
  };
}

export interface ShowcaseStatus {
  demoAccountId: string;
  demoScreenplayId: string;
  urlExpiryDays: number;
  contentCounts: {
    characters: number;
    locations: number;
    props: number;
    readings: number;
    videos: number;
  };
  status: string;
}

// ============================================================================
// FETCH HELPERS
// ============================================================================

async function fetchShowcaseData<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api/showcase/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    // Public endpoints - no auth needed
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch showcase ${endpoint}: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// ============================================================================
// INDIVIDUAL HOOKS
// ============================================================================

/**
 * Fetch showcase characters
 */
export function useShowcaseCharacters(enabled: boolean = true) {
  return useQuery<{ characters: ShowcaseCharacter[]; count: number }, Error>({
    queryKey: ['showcase', 'characters'],
    queryFn: () => fetchShowcaseData<{ characters: ShowcaseCharacter[]; count: number }>('characters'),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - showcase data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Fetch showcase locations
 */
export function useShowcaseLocations(enabled: boolean = true) {
  return useQuery<{ locations: ShowcaseLocation[]; count: number }, Error>({
    queryKey: ['showcase', 'locations'],
    queryFn: () => fetchShowcaseData<{ locations: ShowcaseLocation[]; count: number }>('locations'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch showcase props
 */
export function useShowcaseProps(enabled: boolean = true) {
  return useQuery<{ props: ShowcaseProp[]; count: number }, Error>({
    queryKey: ['showcase', 'props'],
    queryFn: () => fetchShowcaseData<{ props: ShowcaseProp[]; count: number }>('props'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch showcase screenplay readings
 */
export function useShowcaseReadings(enabled: boolean = true) {
  return useQuery<{ readings: ShowcaseReading[]; count: number }, Error>({
    queryKey: ['showcase', 'readings'],
    queryFn: () => fetchShowcaseData<{ readings: ShowcaseReading[]; count: number }>('readings'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch showcase videos
 */
export function useShowcaseVideos(enabled: boolean = true) {
  return useQuery<{ videos: ShowcaseVideo[]; count: number }, Error>({
    queryKey: ['showcase', 'videos'],
    queryFn: () => fetchShowcaseData<{ videos: ShowcaseVideo[]; count: number }>('videos'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// ============================================================================
// COMBINED HOOK
// ============================================================================

/**
 * Fetch all showcase content at once (optimized for landing pages)
 */
export function useShowcaseAll(enabled: boolean = true) {
  return useQuery<ShowcaseAllContent, Error>({
    queryKey: ['showcase', 'all'],
    queryFn: () => fetchShowcaseData<ShowcaseAllContent>('all'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch showcase status (content counts)
 */
export function useShowcaseStatus(enabled: boolean = true) {
  return useQuery<ShowcaseStatus, Error>({
    queryKey: ['showcase', 'status'],
    queryFn: () => fetchShowcaseData<ShowcaseStatus>('status'),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
