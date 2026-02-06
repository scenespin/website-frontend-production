/**
 * Media Library React Query Hooks
 * 
 * Custom React Query hooks for Media Library operations.
 * Part of Feature 0127: Media Library Refactor to Best Practices
 */

'use client';

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { getDropboxPath } from '@/components/production/utils/imageUrlResolver';
import type { 
  MediaFile, 
  PresignedUrlRequest, 
  PresignedUrlResponse,
  BulkPresignedUrlRequest,
  BulkPresignedUrlResponse,
  RegisterMediaFileRequest,
  RegisterMediaFileResponse,
  CloudStorageConnection,
  StorageQuota,
  MediaFileListResponse,
  MediaFolder,
  FolderTreeNode,
  CreateMediaFolderRequest,
  MediaFolderResponse,
  MediaFolderListResponse,
  MediaFolderTreeResponse
} from '@/types/media';
import { mediaCacheKeys } from '@/types/media';

// ============================================================================
// HELPER: Get auth token
// ============================================================================

async function getAuthToken(getToken: (options?: { template?: string }) => Promise<string | null>): Promise<string | null> {
  try {
    return await getToken({ template: 'wryda-backend' });
  } catch (error) {
    console.error('[useMediaLibrary] Failed to get auth token:', error);
    return null;
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Query hook for fetching media files list
 * Feature 0128: Added optional folderId parameter for folder filtering
 * Feature: Added includeAllFolders parameter to show all files regardless of folder
 * Feature 0174: Added entityType and entityId parameters for efficient filtering
 * Feature 0220: Added directChildrenOnly for Archive – when true and folderId set, return only direct children of that folder
 */
export function useMediaFiles(
  screenplayId: string, 
  folderId?: string, 
  enabled: boolean = true, 
  includeAllFolders: boolean = false,
  entityType?: 'character' | 'location' | 'asset' | 'scene',
  entityId?: string,
  directChildrenOnly: boolean = false
) {
  const { getToken } = useAuth();

  return useQuery<MediaFile[], Error>({
    queryKey: ['media', 'files', screenplayId, folderId || 'root', includeAllFolders ? 'all' : 'filtered', entityType, entityId, directChildrenOnly ? 'direct' : 'recursive'],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        screenplayId,
      });
      if (folderId) {
        params.append('folderId', folderId);
      }
      if (includeAllFolders) {
        params.append('includeAllFolders', 'true');
      }
      if (entityType) {
        params.append('entityType', entityType);
      }
      if (entityId) {
        params.append('entityId', entityId);
      }
      if (directChildrenOnly && folderId) {
        params.append('directChildrenOnly', 'true');
      }

      const response = await fetch(`/api/media/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No files found - return empty array (not an error)
          console.warn('[useMediaFiles] No files found (404):', { screenplayId, folderId, entityType, entityId });
          return [];
        }
        const errorText = await response.text();
        console.error('[useMediaFiles] Failed to fetch media files:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
          params: { screenplayId, folderId, entityType, entityId },
        });
        throw new Error(`Failed to fetch media files: ${response.status} ${response.statusText}`);
      }

      const data: MediaFileListResponse = await response.json();
      const backendFiles = data.files || [];
      
      // 🔥 FIX: Filter out archived/expired files before processing
      // Backend marks expired files with isArchived: true (Feature 0200)
      const activeFiles = backendFiles.filter((file: any) => {
        // Filter out archived files (expired/deleted)
        if (file.isArchived === true || file.metadata?.isArchived === true) {
          return false;
        }
        return true;
      });
      
      // Debug logging for thumbnail verification
      const filesWithThumbnails = activeFiles.filter((f: any) => f.metadata?.thumbnailS3Key || f.thumbnailS3Key);
      if (entityType && entityId) {
        console.log('[useMediaFiles] Entity query results:', {
          entityType,
          entityId,
          filesFound: activeFiles.length,
          filesFiltered: backendFiles.length - activeFiles.length,
          filesWithThumbnails: filesWithThumbnails.length,
          sampleFiles: filesWithThumbnails.slice(0, 2).map((f: any) => ({
            s3Key: f.s3Key?.substring(0, 50) + '...',
            thumbnailS3Key: f.metadata?.thumbnailS3Key || f.thumbnailS3Key
          }))
        });
      }
      
      // Map backend format to frontend MediaFile format
      // Backend returns: { fileId, fileName, fileType (MIME), mediaFileType, fileSize, s3Key, folderId, folderPath, createdAt, metadata, storageType?, entityType?, entityId? }
      // Frontend expects: { id, fileName, s3Key, fileType (enum), mediaFileType, fileSize, storageType, uploadedAt, folderId, folderPath, thumbnailS3Key, metadata (incl. cloudFileId/cloudFilePath) }
      return activeFiles.map((file: any) => ({
        id: file.fileId,
        fileName: file.fileName,
        s3Key: file.s3Key, // Required - used for on-demand presigned URL generation
        fileType: detectFileType(file.fileType),
        mediaFileType: file.mediaFileType, // 🔥 FIX: Preserve mediaFileType from backend (required for video filtering)
        fileSize: file.fileSize,
        storageType: (file.storageType || 'local') as 'local' | 'google-drive' | 'dropbox' | 'wryda-temp', // Pass through; cloud-synced files have 'google-drive' | 'dropbox'
        uploadedAt: file.createdAt,
        expiresAt: undefined,
        thumbnailUrl: undefined, // Deprecated - use thumbnailS3Key with presigned URL instead
        folderId: file.folderId, // Feature 0128: S3 folder support
        folderPath: file.folderPath, // Feature 0128: Breadcrumb path
        metadata: file.metadata, // Feature 0170: Include metadata (cloudFileId, cloudFilePath for Dropbox, etc.)
        thumbnailS3Key: file.metadata?.thumbnailS3Key || file.thumbnailS3Key, // Feature 0174: Thumbnail S3 key (if exists)
        // Preserve top-level entityType/entityId from GSI (backend stores them at top level for efficient querying)
        entityType: file.entityType,
        entityId: file.entityId,
      }));
    },
    enabled: enabled && !!screenplayId,
    staleTime: 5 * 1000, // 5 seconds - reduced further to catch new videos faster
    gcTime: 5 * 60 * 1000,
    refetchInterval: 10 * 1000, // Auto-refetch every 10 seconds to catch new videos faster
    refetchIntervalInBackground: false, // Only refetch when tab is active
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Query hook for generating a single presigned URL on-demand
 */
export function usePresignedUrl(s3Key: string | null, enabled: boolean = false) {
  const { getToken } = useAuth();

  return useQuery<PresignedUrlResponse, Error>({
    queryKey: ['media', 'presigned-url', s3Key || ''],
    queryFn: async () => {
      if (!s3Key) {
        throw new Error('s3Key is required');
      }

      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const requestBody: PresignedUrlRequest = {
        s3Key,
        expiresIn: 3600, // 1 hour
      };

      const response = await fetch('/api/s3/download-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // 404/500 = file missing or unavailable (e.g. deleted) — return empty so UI doesn't throw
      if (!response.ok && (response.status === 404 || response.status === 500)) {
        return { downloadUrl: '', expiresAt: 0 };
      }
      if (!response.ok) {
        throw new Error(`Failed to generate presigned URL: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    },
    enabled: enabled && !!s3Key,
    staleTime: 5 * 60 * 1000, // 5 minutes - presigned URLs expire in 1 hour, refresh cache after 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Query hook for generating bulk presigned URLs (for grid view thumbnails)
 * 
 * Feature 0243: Updated to return proxy URLs instead of fetching presigned URLs.
 * Proxy URLs are stable and cacheable, improving performance and reducing API calls.
 */
export function useBulkPresignedUrls(s3Keys: string[], enabled: boolean = true) {
  return useQuery<Map<string, string>, Error>({
    queryKey: ['media', 'presigned-urls', [...s3Keys].sort().join(',')],
    queryFn: async () => {
      if (s3Keys.length === 0) {
        return new Map();
      }

      // Feature 0243: Generate proxy URLs directly from S3 keys (no API call needed)
      // Proxy URLs are stable and cacheable, providing better performance
      const urlMap = new Map<string, string>();
      s3Keys.forEach((s3Key) => {
        if (s3Key) {
          urlMap.set(s3Key, `/api/media/file?key=${encodeURIComponent(s3Key)}`);
        }
      });

      // Debug logging for proxy URL generation
      console.log('[useBulkPresignedUrls] ✅ Generated proxy URLs:', {
        success: true,
        urlsCount: urlMap.size,
        urlsSample: Array.from(urlMap.entries()).slice(0, 2).map(([key, url]) => ({
          s3Key: key.substring(0, 50) + '...',
          proxyUrl: url,
          isThumbnail: key.includes('thumbnails/')
        }))
      });

      return urlMap;
    },
    enabled: enabled && s3Keys.length > 0,
    staleTime: Infinity, // Proxy URLs never expire (they're stable)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // No retry needed - URL generation is synchronous
  });
}

/**
 * Fetches temporary preview URLs for Dropbox files in the list.
 * Returns Map<fileId, downloadUrl> for use with getMediaFileDisplayUrl.
 */
export function useDropboxPreviewUrls(files: MediaFile[], enabled: boolean = true): Map<string, string> {
  const { getToken } = useAuth();
  const dropboxFiles = files.filter((f): f is MediaFile => f.storageType === 'dropbox');
  const fileIds = dropboxFiles.map((f) => f.id);
  const paths = dropboxFiles.map((f) => getDropboxPath(f));

  const results = useQueries({
    queries: paths.map((path, i) => ({
      queryKey: ['storage', 'preview-url', 'dropbox', path],
      queryFn: async (): Promise<string> => {
        const token = await getAuthToken(getToken);
        if (!token) throw new Error('Not authenticated');
        const res = await fetch(
          `/api/storage/preview-url/dropbox?path=${encodeURIComponent(path)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Preview URL failed: ${res.status}`);
        const data = await res.json();
        return data.downloadUrl ?? '';
      },
      enabled: enabled && !!path,
      staleTime: 4 * 60 * 60 * 1000 - 60 * 1000, // ~4h - 1min (Dropbox link valid 4h)
      gcTime: 4 * 60 * 60 * 1000,
    })),
  });

  const map = new Map<string, string>();
  results.forEach((result, i) => {
    if (result.data && fileIds[i]) map.set(fileIds[i], result.data);
  });
  return map;
}

/**
 * Query hook for fetching cloud storage connections
 */
export function useStorageConnectionsQuery(enabled: boolean = true) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<CloudStorageConnection[], Error>({
    queryKey: ['storage', 'connections'],
    queryFn: async () => {
      if (!isSignedIn) {
        return [];
      }

      const token = await getAuthToken(getToken);
      if (!token) {
        return []; // Not authenticated - return empty array (not an error)
      }

      const response = await fetch('/api/storage/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Unauthorized - user not authenticated or token expired
        // Return empty array (not an error, just means no connections available)
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch storage connections: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const connections = (data.connections || []).map((conn: any) => ({
        provider: conn.provider,
        connected: conn.status === 'active' || conn.status === 'connected',
        connectedAt: conn.connected_at ? new Date(conn.connected_at * 1000).toISOString() : undefined,
        quota: conn.quota_used && conn.quota_total ? {
          used: conn.quota_used,
          total: conn.quota_total,
          storageType: conn.provider,
        } : undefined,
      }));

      return connections;
    },
    enabled: enabled && isSignedIn,
    staleTime: 60 * 1000, // 1 minute - connections don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for 401 errors
    retryDelay: 1000,
  });
}

/**
 * Query hook for fetching storage quota
 */
export function useStorageQuota(enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<StorageQuota, Error>({
    queryKey: ['storage', 'quota'],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/storage/quota', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch storage quota: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.storage;
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Mutation hook for uploading a media file
 * Feature 0128: Added optional folderId parameter
 */
export function useUploadMedia(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<
    RegisterMediaFileResponse,
    Error,
    { fileName: string; fileType: string; fileSize: number; s3Key: string; folderId?: string }
  >({
    mutationFn: async (fileData) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const requestBody: RegisterMediaFileRequest = {
        screenplayId,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        s3Key: fileData.s3Key,
        folderId: fileData.folderId, // Feature 0128: Optional folder ID
      };

      const response = await fetch('/api/media/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to register media file: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ queryKey: ['storage', 'quota'] });
    },
  });
}

/**
 * Mutation hook for deleting a media file
 */
export function useDeleteMedia(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<void, Error, string>({
    mutationFn: async (fileId) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete media file: ${response.status} ${response.statusText}`);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ queryKey: ['storage', 'quota'] });
    },
  });
}

// ============================================================================
// FOLDER QUERY HOOKS (Feature 0128: S3 Folder Support)
// ============================================================================

/**
 * Query hook for fetching media folders list
 */
export function useMediaFolders(screenplayId: string, parentFolderId?: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<MediaFolder[], Error>({
    queryKey: ['media', 'folders', screenplayId, parentFolderId || 'root'],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams({
        screenplayId,
      });
      if (parentFolderId) {
        params.append('parentFolderId', parentFolderId);
      }

      const response = await fetch(`/api/media/folders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`);
      }

      const data: MediaFolderListResponse = await response.json();
      return data.folders || [];
    },
    enabled: enabled && !!screenplayId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Query hook for fetching folder tree structure
 */
export function useMediaFolderTree(screenplayId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<FolderTreeNode[], Error>({
    queryKey: mediaCacheKeys.folderTree(screenplayId),
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/media/folders/tree?screenplayId=${screenplayId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folder tree: ${response.status} ${response.statusText}`);
      }

      const data: MediaFolderTreeResponse = await response.json();
      return data.tree || [];
    },
    enabled: enabled && !!screenplayId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ============================================================================
// FOLDER MUTATION HOOKS (Feature 0128: S3 Folder Support)
// ============================================================================

/**
 * Mutation hook for creating a media folder
 */
export function useCreateFolder(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<MediaFolder, Error, CreateMediaFolderRequest>({
    mutationFn: async (params) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/media/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to create folder: ${response.status} ${response.statusText}`);
      }

      const data: MediaFolderResponse = await response.json();
      return data.folder;
    },
    onSuccess: () => {
      // Invalidate folder queries
      queryClient.invalidateQueries({ queryKey: ['media', 'folders', screenplayId] });
      queryClient.invalidateQueries({ queryKey: mediaCacheKeys.folderTree(screenplayId) });
    },
  });
}

/**
 * Mutation hook for renaming a media folder
 */
export function useRenameFolder(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<MediaFolder, Error, { folderId: string; folderName: string }>({
    mutationFn: async ({ folderId, folderName }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/media/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to rename folder: ${response.status} ${response.statusText}`);
      }

      const data: MediaFolderResponse = await response.json();
      return data.folder;
    },
    onSuccess: () => {
      // Invalidate folder queries and file list (files may have updated folder paths)
      queryClient.invalidateQueries({ queryKey: ['media', 'folders', screenplayId] });
      queryClient.invalidateQueries({ queryKey: mediaCacheKeys.folderTree(screenplayId) });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
    },
  });
}

/**
 * Mutation hook for deleting a media folder
 */
export function useDeleteFolder(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<void, Error, { folderId: string; moveFilesToParent?: boolean }>({
    mutationFn: async ({ folderId, moveFilesToParent = true }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Add moveFilesToParent query parameter
      const url = `/api/media/folders/${folderId}?moveFilesToParent=${moveFilesToParent.toString()}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Failed to delete folder: ${response.status} ${response.statusText}`);
      }
    },
    onSuccess: () => {
      // Invalidate folder queries and file list
      queryClient.invalidateQueries({ queryKey: ['media', 'folders', screenplayId] });
      queryClient.invalidateQueries({ queryKey: mediaCacheKeys.folderTree(screenplayId) });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
    },
  });
}

/**
 * Mutation hook for initializing default folder structure
 */
export function useInitializeFolders(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<MediaFolder[], Error, void>({
    mutationFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/media/folders/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ screenplayId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to initialize folders: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.folders || [];
    },
    onSuccess: () => {
      // Invalidate folder queries
      queryClient.invalidateQueries({ queryKey: ['media', 'folders', screenplayId] });
      queryClient.invalidateQueries({ queryKey: mediaCacheKeys.folderTree(screenplayId) });
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect file type from MIME type or filename
 */
function detectFileType(fileType: string): 'video' | 'image' | 'audio' | 'other' {
  const lowerType = fileType.toLowerCase();
  
  if (lowerType.startsWith('video/') || lowerType.includes('video')) {
    return 'video';
  }
  if (lowerType.startsWith('image/') || lowerType.includes('image')) {
    return 'image';
  }
  if (lowerType.startsWith('audio/') || lowerType.includes('audio')) {
    return 'audio';
  }
  
  // Check by extension if MIME type not available
  const ext = lowerType.split('.').pop() || '';
  if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) return 'audio';
  
  return 'other';
}

/**
 * Mutation hook for regenerating a thumbnail
 * Feature: Thumbnail Regeneration Utility
 */
export function useRegenerateThumbnail() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; thumbnailS3Key: string; message: string },
    Error,
    { s3Key: string; screenplayId: string; fileType?: 'image' | 'video' }
  >({
    mutationFn: async ({ s3Key, screenplayId, fileType }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/media/regenerate-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
          screenplayId,
          fileType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to regenerate thumbnail' }));
        throw new Error(errorData.error || `Failed to regenerate thumbnail: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh thumbnail URLs
      queryClient.invalidateQueries({ queryKey: ['media', 'presigned-urls'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files'] });
      console.log('[useRegenerateThumbnail] ✅ Thumbnail regenerated:', data.thumbnailS3Key);
    },
  });
}

