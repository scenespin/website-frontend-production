/**
 * Media Library React Query Hooks
 * 
 * Custom React Query hooks for Media Library operations.
 * Part of Feature 0127: Media Library Refactor to Best Practices
 */

'use client';

import { useQuery, useQueries, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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

/** Page size when fetching all pages (shot board / link library). Backend max is 200. */
const MEDIA_LIST_PAGE_SIZE = 100;

/**
 * Map backend file shape to frontend MediaFile (single place for consistency).
 */
function mapBackendFileToMediaFile(file: any): MediaFile {
  return {
    id: file.fileId,
    fileName: file.fileName,
    s3Key: file.s3Key,
    fileType: detectFileType(file.fileType),
    mediaFileType: file.mediaFileType,
    fileSize: file.fileSize,
    storageType: (file.storageType || 'local') as 'local' | 'google-drive' | 'dropbox' | 'wryda-temp',
    uploadedAt: file.createdAt,
    expiresAt: undefined,
    thumbnailUrl: undefined,
    folderId: file.folderId,
    folderPath: file.folderPath,
    metadata: file.metadata,
    thumbnailS3Key: file.metadata?.thumbnailS3Key || file.thumbnailS3Key,
    entityType: file.entityType,
    entityId: file.entityId,
    cloudSyncStatus: file.cloudSyncStatus,
    cloudSyncAttempts: file.cloudSyncAttempts,
    cloudSyncLastError: file.cloudSyncLastError ?? null,
    cloudSyncUpdatedAt: file.cloudSyncUpdatedAt ?? null,
  };
}

/**
 * Query hook for fetching media files list
 * Feature 0128: Added optional folderId parameter for folder filtering
 * Feature: Added includeAllFolders parameter to show all files regardless of folder
 * Feature 0174: Added entityType and entityId parameters for efficient filtering
 * Feature 0220: Added directChildrenOnly for Archive – when true and folderId set, return only direct children of that folder
 * Feature: limit + fetchAllPages for shot board / link library – scalable pagination (no 50-item cap)
 */
export function useMediaFiles(
  screenplayId: string,
  folderId?: string,
  enabled: boolean = true,
  includeAllFolders: boolean = false,
  entityType?: 'character' | 'location' | 'asset' | 'scene' | 'standalone-video',
  entityId?: string,
  directChildrenOnly: boolean = false,
  limit?: number,
  fetchAllPages: boolean = false
) {
  const { getToken } = useAuth();

  return useQuery<MediaFile[], Error>({
    queryKey: ['media', 'files', screenplayId, folderId || 'root', includeAllFolders ? 'all' : 'filtered', entityType, entityId, directChildrenOnly ? 'direct' : 'recursive', limit ?? null, fetchAllPages],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const buildParams = (pageToken?: string) => {
        const params = new URLSearchParams({ screenplayId });
        if (folderId) params.append('folderId', folderId);
        if (includeAllFolders) params.append('includeAllFolders', 'true');
        if (entityType) params.append('entityType', entityType);
        if (entityId) params.append('entityId', entityId);
        if (directChildrenOnly && folderId) params.append('directChildrenOnly', 'true');
        const pageLimit = limit ?? (fetchAllPages ? MEDIA_LIST_PAGE_SIZE : undefined);
        if (pageLimit != null) params.set('limit', String(pageLimit));
        if (pageToken) params.set('nextToken', pageToken);
        return params;
      };

      const allBackendFiles: any[] = [];
      let nextToken: string | undefined;

      do {
        const params = buildParams(nextToken);
        const response = await fetch(`/api/media/list?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            if (allBackendFiles.length === 0) {
              console.warn('[useMediaFiles] No files found (404):', { screenplayId, folderId, entityType, entityId });
              return [];
            }
            break;
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
        const batch = data.files || [];
        allBackendFiles.push(...batch);
        nextToken = data.nextToken;
      } while (fetchAllPages && entityType && nextToken);

      // Filter out archived/expired (Feature 0200)
      const activeFiles = allBackendFiles.filter((file: any) => {
        if (file.isArchived === true || file.metadata?.isArchived === true) return false;
        return true;
      });

      if (entityType && entityId) {
        const filesWithThumbnails = activeFiles.filter((f: any) => f.metadata?.thumbnailS3Key || f.thumbnailS3Key);
        console.log('[useMediaFiles] Entity query results:', {
          entityType,
          entityId,
          filesFound: activeFiles.length,
          filesWithThumbnails: filesWithThumbnails.length,
        });
      }

      return activeFiles.map((file: any) => mapBackendFileToMediaFile(file));
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

const PAGE_SIZE = 50;

/** Page shape returned by useStandaloneVideosPaginated (each page in data.pages) */
export type StandaloneVideosPage = { files: MediaFile[]; nextToken?: string };

/**
 * Paginated standalone videos for Direct > Videos tab (Feature 0254).
 * Returns all accumulated pages and loadMore() for next page. Use for standalone section only.
 */
export function useStandaloneVideosPaginated(screenplayId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useInfiniteQuery<StandaloneVideosPage, Error, import('@tanstack/react-query').InfiniteData<StandaloneVideosPage>, string[], string | undefined>({
    queryKey: ['media', 'files', screenplayId, 'standalone-video', 'paginated'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const token = await getAuthToken(getToken);
      if (!token) throw new Error('Not authenticated');

      const params = new URLSearchParams({
        screenplayId,
        includeAllFolders: 'true',
        entityType: 'standalone-video',
        limit: String(PAGE_SIZE),
      });
      if (pageParam) params.set('nextToken', pageParam);

      const response = await fetch(`/api/media/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to fetch: ${response.status} ${err.slice(0, 100)}`);
      }

      const data: MediaFileListResponse = await response.json();
      const backendFiles = (data.files || []).filter(
        (file: any) => file.isArchived !== true && file.metadata?.isArchived !== true
      );

      const files: MediaFile[] = backendFiles.map((file: any) => ({
        id: file.fileId,
        fileName: file.fileName,
        s3Key: file.s3Key,
        fileType: detectFileType(file.fileType),
        mediaFileType: file.mediaFileType,
        fileSize: file.fileSize,
        storageType: (file.storageType || 'local') as 'local' | 'google-drive' | 'dropbox' | 'wryda-temp',
        uploadedAt: file.createdAt,
        expiresAt: undefined,
        thumbnailUrl: undefined,
        folderId: file.folderId,
        folderPath: file.folderPath,
        metadata: file.metadata,
        thumbnailS3Key: file.metadata?.thumbnailS3Key || file.thumbnailS3Key,
        entityType: file.entityType,
        entityId: file.entityId,
        cloudSyncStatus: file.cloudSyncStatus,
        cloudSyncAttempts: file.cloudSyncAttempts,
        cloudSyncLastError: file.cloudSyncLastError ?? null,
        cloudSyncUpdatedAt: file.cloudSyncUpdatedAt ?? null,
      }));

      return { files, nextToken: data.nextToken };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextToken ?? undefined,
    enabled: enabled && !!screenplayId,
    staleTime: 5 * 1000,
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
 * Feature 0243: Can use proxy URLs (stable, cacheable) or presigned URLs (legacy).
 * Toggle via USE_PROXY_URLS environment variable or feature flag.
 */
export function useBulkPresignedUrls(s3Keys: string[], enabled: boolean = true) {
  const { getToken } = useAuth();
  
  // Feature 0252 Phase 3: Re-enable stable proxy URLs for cached media display.
  const USE_PROXY_URLS = true;

  return useQuery<Map<string, string>, Error>({
    queryKey: ['media', 'presigned-urls', [...s3Keys].sort().join(','), USE_PROXY_URLS ? 'proxy' : 'presigned'],
    queryFn: async () => {
      if (s3Keys.length === 0) {
        return new Map();
      }

      // Feature 0243: Use proxy URLs if enabled (stable, cacheable, no API call)
      if (USE_PROXY_URLS) {
        const urlMap = new Map<string, string>();
        s3Keys.forEach((s3Key) => {
          if (s3Key) {
            urlMap.set(s3Key, `/api/media/file?key=${encodeURIComponent(s3Key)}`);
          }
        });

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
      }

      // Legacy: Fetch presigned URLs from API
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const requestBody: BulkPresignedUrlRequest = {
        s3Keys,
        expiresIn: 3600, // 1 hour
      };

      console.log('[useBulkPresignedUrls] 🔍 Requesting bulk presigned URLs:', {
        s3KeysCount: s3Keys.length,
        s3KeysSample: s3Keys.slice(0, 3).map(k => k.substring(0, 50) + '...'),
        areThumbnails: s3Keys.some(k => k.includes('thumbnails/'))
      });

      const response = await fetch('/api/s3/bulk-download-urls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useBulkPresignedUrls] ❌ Failed to generate bulk presigned URLs:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        });
        throw new Error(`Failed to generate bulk presigned URLs: ${response.status} ${response.statusText}`);
      }

      const data: BulkPresignedUrlResponse = await response.json();
      
      // Convert array to Map for easy lookup
      const urlMap = new Map<string, string>();
      data.urls?.forEach(({ s3Key, downloadUrl }) => {
        if (s3Key && downloadUrl) {
          urlMap.set(s3Key, downloadUrl);
        }
      });

      console.log('[useBulkPresignedUrls] ✅ Bulk presigned URL response:', {
        success: true,
        urlsCount: urlMap.size,
        urlsSample: Array.from(urlMap.entries()).slice(0, 2).map(([key, url]) => ({
          s3Key: key.substring(0, 50) + '...',
          urlPreview: url.substring(0, 60) + '...',
          isThumbnail: key.includes('thumbnails/')
        }))
      });

      return urlMap;
    },
    enabled: enabled && s3Keys.length > 0,
    staleTime: USE_PROXY_URLS ? Infinity : 5 * 60 * 1000, // Proxy URLs never expire, presigned URLs expire in 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: USE_PROXY_URLS ? false : 2, // No retry needed for proxy URLs
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
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

export type CloudSyncStatusValue = 'pending' | 'syncing' | 'synced' | 'failed' | 'skipped';

export interface MediaCloudSyncStatus {
  fileId: string;
  fileName: string;
  s3Key: string;
  cloudSyncStatus: CloudSyncStatusValue;
  cloudSyncAttempts: number;
  cloudSyncLastError: string | null;
  cloudSyncUpdatedAt: string | null;
  cloudStorageLocation: string | null;
  cloudFileId: string | null;
  updatedAt: string | null;
}

export function useMediaCloudSyncStatuses(screenplayId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<MediaCloudSyncStatus[], Error>({
    queryKey: ['media', 'cloud-sync-status', screenplayId],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const allFiles: MediaCloudSyncStatus[] = [];
      let nextToken: string | undefined;

      do {
        const params = new URLSearchParams({
          screenplayId,
          limit: '200',
        });
        if (nextToken) {
          params.set('nextToken', nextToken);
        }

        const response = await fetch(`/api/media/cloud-sync-status?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cloud sync status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allFiles.push(...((data.files || []) as MediaCloudSyncStatus[]));
        nextToken = typeof data.nextToken === 'string' ? data.nextToken : undefined;
      } while (nextToken);

      // Deduplicate by fileId because backend can include overlapping rows
      // when traversing primary + fallback status sources.
      const dedupedByFileId = new Map<string, MediaCloudSyncStatus>();
      allFiles.forEach((item) => {
        if (item.fileId) {
          dedupedByFileId.set(item.fileId, item);
        }
      });

      return Array.from(dedupedByFileId.values());
    },
    enabled: enabled && !!screenplayId,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useRetryMediaCloudSync(screenplayId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<
    { success: boolean; fileId: string; cloudSyncStatus: CloudSyncStatusValue; cloudSyncAttempts: number; skipped: boolean; error: string | null },
    Error,
    { fileId?: string; s3Key?: string }
  >({
    mutationFn: async ({ fileId, s3Key }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/media/retry-cloud-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenplayId,
          fileId,
          s3Key,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Failed to retry cloud sync: ${response.status} ${response.statusText}`);
      }

      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ queryKey: ['media', 'cloud-sync-status', screenplayId] });
    },
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

