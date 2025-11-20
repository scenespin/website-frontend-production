/**
 * Media Library Types
 * 
 * Type definitions for Media Library component and React Query hooks.
 * Part of Feature 0127: Media Library Refactor to Best Practices
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Media file metadata stored in DynamoDB
 * 
 * Phase 1: fileUrl is optional for backward compatibility
 * Phase 2B/C: fileUrl will be removed - presigned URLs generated on-demand via React Query
 */
export interface MediaFile {
  id: string;
  fileName: string;
  s3Key: string; // Required - used to generate presigned URLs on-demand
  fileType: 'video' | 'image' | 'audio' | 'other';
  fileSize: number;
  storageType: 'google-drive' | 'dropbox' | 'wryda-temp' | 'local';
  uploadedAt: string;
  expiresAt?: string; // For temporary storage
  thumbnailUrl?: string; // Optional - may be generated client-side for videos
  fileUrl?: string; // DEPRECATED: Will be removed in Phase 2B/C. Use s3Key with on-demand presigned URL generation instead.
}

/**
 * Presigned URL response from backend
 */
export interface PresignedUrlResponse {
  downloadUrl: string;
  expiresAt: number;
}

/**
 * Bulk presigned URL response from backend
 */
export interface BulkPresignedUrlResponse {
  success: boolean;
  urls: Array<{
    s3Key: string;
    downloadUrl: string;
    expiresAt: number;
  }>;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  used: number;
  total: number;
  storageType: string;
}

/**
 * Cloud storage connection
 */
export interface CloudStorageConnection {
  provider: 'google-drive' | 'dropbox';
  connected: boolean;
  connectedAt?: string;
  quota?: StorageQuota;
}

/**
 * Media file list response from backend
 */
export interface MediaFileListResponse {
  success: boolean;
  files: Array<{
    fileId: string;
    userId: string;
    screenplayId: string;
    projectId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    s3Key: string;
    s3Url: string; // Legacy field - not used, s3Key is used instead
    createdAt: string;
    updatedAt: string;
  }>;
  count: number;
}

// ============================================================================
// REACT QUERY CACHE KEYS
// ============================================================================

/**
 * Cache key factory functions for React Query
 * Ensures consistent cache key structure across the application
 */
export const mediaCacheKeys = {
  /**
   * File list query key
   * @param screenplayId - Screenplay/project ID
   */
  files: (screenplayId: string) => ['media', 'files', screenplayId] as const,

  /**
   * Single presigned URL query key
   * @param s3Key - S3 object key
   */
  presignedUrl: (s3Key: string) => ['media', 'presigned-url', s3Key] as const,

  /**
   * Bulk presigned URLs query key
   * @param s3Keys - Array of S3 object keys (sorted for consistent caching)
   */
  bulkPresignedUrls: (s3Keys: string[]) => 
    ['media', 'presigned-urls', [...s3Keys].sort().join(',')] as const,

  /**
   * Storage connections query key
   */
  storageConnections: () => ['storage', 'connections'] as const,

  /**
   * Storage quota query key
   */
  storageQuota: () => ['storage', 'quota'] as const,
} as const;

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request body for generating a presigned URL
 */
export interface PresignedUrlRequest {
  s3Key: string;
  expiresIn?: number; // Optional, defaults to 3600 (1 hour)
}

/**
 * Request body for generating bulk presigned URLs
 */
export interface BulkPresignedUrlRequest {
  s3Keys: string[];
  expiresIn?: number; // Optional, defaults to 3600 (1 hour)
}

/**
 * Request body for registering a media file
 */
export interface RegisterMediaFileRequest {
  screenplayId?: string;
  projectId?: string; // Fallback for backward compatibility
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
}

/**
 * Response from media file registration
 */
export interface RegisterMediaFileResponse {
  success: boolean;
  fileId: string;
  message: string;
}

