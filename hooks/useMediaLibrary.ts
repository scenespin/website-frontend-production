/**
 * Media Library React Query Hooks
 * 
 * Custom React Query hooks for Media Library operations.
 * Part of Feature 0127: Media Library Refactor to Best Practices
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
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

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

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
 */
export function useMediaFiles(screenplayId: string, folderId?: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<MediaFile[], Error>({
    queryKey: ['media', 'files', screenplayId, folderId || 'root'],
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No files found - return empty array (not an error)
          return [];
        }
        throw new Error(`Failed to fetch media files: ${response.status} ${response.statusText}`);
      }

      const data: MediaFileListResponse = await response.json();
      const backendFiles = data.files || [];

      // Map backend format to frontend MediaFile format
      // Backend returns: { fileId, fileName, fileType (MIME), fileSize, s3Key, folderId, folderPath, createdAt, metadata }
      // Frontend expects: { id, fileName, s3Key, fileType (enum), fileSize, storageType, uploadedAt, folderId, folderPath }
      return backendFiles.map((file: any) => ({
        id: file.fileId,
        fileName: file.fileName,
        s3Key: file.s3Key, // Required - used for on-demand presigned URL generation
        fileType: detectFileType(file.fileType),
        fileSize: file.fileSize,
        storageType: 'local' as const, // S3 files are 'local' storage type
        uploadedAt: file.createdAt,
        expiresAt: undefined,
        thumbnailUrl: undefined,
        folderId: file.folderId, // Feature 0128: S3 folder support
        folderPath: file.folderPath, // Feature 0128: Breadcrumb path
        metadata: file.metadata, // Feature 0170: Include metadata for scene organization
      }));
    },
    enabled: enabled && !!screenplayId,
    staleTime: 30 * 1000, // 30 seconds - files list doesn't change often
    gcTime: 5 * 60 * 1000, // 5 minutes
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

      const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

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
 */
export function useBulkPresignedUrls(s3Keys: string[], enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<Map<string, string>, Error>({
    queryKey: ['media', 'presigned-urls', [...s3Keys].sort().join(',')],
    queryFn: async () => {
      if (s3Keys.length === 0) {
        return new Map();
      }

      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const requestBody: BulkPresignedUrlRequest = {
        s3Keys,
        expiresIn: 3600, // 1 hour
      };

      const response = await fetch(`${BACKEND_API_URL}/api/s3/bulk-download-urls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate bulk presigned URLs: ${response.status} ${response.statusText}`);
      }

      const data: BulkPresignedUrlResponse = await response.json();
      
      // Convert array to Map for easy lookup
      const urlMap = new Map<string, string>();
      data.urls.forEach(({ s3Key, downloadUrl }) => {
        urlMap.set(s3Key, downloadUrl);
      });

      return urlMap;
    },
    enabled: enabled && s3Keys.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
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

      const response = await fetch(`${BACKEND_API_URL}/api/storage/connections`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/storage/quota`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/register`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/${fileId}`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/folders?${params.toString()}`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/folders/tree?screenplayId=${screenplayId}`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/folders`, {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/folders/${folderId}`, {
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
      const url = new URL(`${BACKEND_API_URL}/api/media/folders/${folderId}`);
      url.searchParams.set('moveFilesToParent', moveFilesToParent.toString());

      const response = await fetch(url.toString(), {
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

      const response = await fetch(`${BACKEND_API_URL}/api/media/folders/initialize`, {
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

