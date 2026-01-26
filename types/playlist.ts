/**
 * Playlist Types
 * 
 * Type definitions for Video Playlist Builder and Editor.
 * Feature 0209: Video Playlist Builder and Editor
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * A single shot in a playlist with trim information
 */
export interface PlaylistShot {
  fileId: string;
  s3Key: string;
  shotNumber: number;
  trimStart: number;
  trimEnd: number;
  order: number;
  fileName?: string;
  duration?: number;
  timestamp?: string;
}

/**
 * A complete playlist with metadata
 */
export interface Playlist {
  playlistId: string;
  screenplayId: string;
  userId: string;
  sceneId: string | null;
  playlistName: string | null;
  isTemplate: boolean;
  shots: PlaylistShot[];
  metadata: {
    totalDuration: number;
    videoCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

/**
 * Request body for creating a playlist
 */
export interface CreatePlaylistRequest {
  sceneId: string | null;
  playlistName?: string | null;
  isTemplate?: boolean;
  shots: PlaylistShot[];
}

/**
 * Request body for updating a playlist
 */
export interface UpdatePlaylistRequest {
  playlistName?: string | null;
  shots?: PlaylistShot[];
}

/**
 * Response from playlist API
 */
export interface PlaylistResponse {
  success: boolean;
  playlist: Playlist;
}

/**
 * Response from list playlists API
 */
export interface PlaylistListResponse {
  success: boolean;
  playlists: Playlist[];
  count: number;
}

/**
 * Response from templates API
 */
export interface PlaylistTemplatesResponse {
  success: boolean;
  templates: Playlist[];
  count: number;
}

// ============================================================================
// REACT QUERY CACHE KEYS
// ============================================================================

/**
 * Cache key factory functions for React Query
 */
export const playlistCacheKeys = {
  /**
   * Single playlist query key
   */
  playlist: (screenplayId: string, playlistId: string) => 
    ['playlists', screenplayId, playlistId] as const,

  /**
   * Scene playlists query key
   */
  scenePlaylists: (screenplayId: string, sceneId: string) => 
    ['playlists', screenplayId, 'scene', sceneId] as const,

  /**
   * User templates query key
   */
  templates: (screenplayId: string) => 
    ['playlists', screenplayId, 'templates'] as const,
} as const;

// ============================================================================
// FUTURE TYPES (Phase 4: Audio Tracks)
// ============================================================================

/**
 * Audio track for playlist (future feature)
 */
export interface AudioTrack {
  trackId: string;
  name: string;
  audioFileId: string; // MediaFile.id for audio file
  s3Key: string;
  startTime: number; // When audio starts in playlist timeline
  volume: number; // 0-1
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}
