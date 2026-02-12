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
 * Feature 0128: Added folderId and folderPath for S3 folder support
 */
export interface MediaFile {
  id: string;
  fileName: string;
  s3Key: string; // Required - used to generate presigned URLs on-demand
  fileType: 'video' | 'image' | 'audio' | '3d-model' | 'other' | string; // 🔥 FIX: Allow MIME types like 'video/mp4'
  mediaFileType?: 'video' | 'image' | 'audio' | '3d-model' | 'other'; // 🔥 NEW: Simplified file type from backend
  fileSize: number;
  storageType: 'google-drive' | 'dropbox' | 'wryda-temp' | 'local';
  uploadedAt: string;
  expiresAt?: string; // For temporary storage
  thumbnailUrl?: string; // Optional - may be generated client-side for videos
  fileUrl?: string; // DEPRECATED: Will be removed in Phase 2B/C. Use s3Key with on-demand presigned URL generation instead.
  folderId?: string; // Feature 0128: S3 folder ID (if file is in a folder)
  folderPath?: string[]; // Feature 0128: Breadcrumb path array for folder navigation
  metadata?: Record<string, any>; // Feature 0170: Generation metadata (entityType, sceneId, etc.)
  thumbnailS3Key?: string; // Feature 0174: Thumbnail S3 key (if thumbnail exists)
  /** Top-level from GSI (backend); also in metadata. Used by shot board / scene filters. */
  entityType?: 'character' | 'location' | 'asset' | 'scene' | 'standalone-video';
  entityId?: string;
  isArchived?: boolean; // Feature: Archive instead of delete - preserves history and metadata
  archivedAt?: string; // Timestamp when file was archived
}

/**
 * Media folder metadata for S3 folder structure
 * Feature 0128: S3 Folder Support
 */
export interface MediaFolder {
  folderId: string;
  userId: string;
  screenplayId: string;
  parentFolderId?: string;
  folderName: string;
  folderPath: string[]; // Breadcrumb path array, e.g., ['Characters', 'Detective_Smith']
  createdAt: string;
  updatedAt: string;
  fileCount?: number;
}

/**
 * Folder tree node (with nested children)
 * Feature 0128: S3 Folder Support
 */
export interface FolderTreeNode extends MediaFolder {
  children?: FolderTreeNode[];
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
 * Feature 0128: Added folderId and folderPath fields
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
    folderId?: string; // Feature 0128: Optional folder ID
    folderPath?: string[]; // Feature 0128: Optional breadcrumb path array
  }>;
  count: number;
  /** Present when more pages exist (Feature 0254) */
  nextToken?: string;
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

  /**
   * Media folders query key
   * @param screenplayId - Screenplay ID
   */
  folders: (screenplayId: string) => ['media', 'folders', screenplayId] as const,

  /**
   * Media folder tree query key
   * @param screenplayId - Screenplay ID
   */
  folderTree: (screenplayId: string) => ['media', 'folders', 'tree', screenplayId] as const,
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
  screenplayId: string; // Feature 0125/0130: Use screenplayId only
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  folderId?: string; // Feature 0128: Optional folder ID
}

/**
 * Response from media file registration
 */
export interface RegisterMediaFileResponse {
  success: boolean;
  fileId: string;
  message: string;
}

/**
 * Request body for creating a media folder
 * Feature 0128: S3 Folder Support
 */
export interface CreateMediaFolderRequest {
  screenplayId: string;
  folderName: string;
  parentFolderId?: string;
}

/**
 * Response from folder operations
 * Feature 0128: S3 Folder Support
 */
export interface MediaFolderResponse {
  success: boolean;
  folder: MediaFolder;
}

/**
 * Response from folder list/tree operations
 * Feature 0128: S3 Folder Support
 */
export interface MediaFolderListResponse {
  success: boolean;
  folders: MediaFolder[];
  count: number;
}

/**
 * Response from folder tree operation
 * Feature 0128: S3 Folder Support
 */
export interface MediaFolderTreeResponse {
  success: boolean;
  tree: FolderTreeNode[];
}

