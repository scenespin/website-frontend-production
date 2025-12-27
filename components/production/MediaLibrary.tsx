'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  Upload, 
  Loader2, 
  AlertCircle, 
  Search,
  Filter,
  Grid,
  List,
  Cloud,
  HardDrive,
  Video,
  Image as ImageIcon,
  FileText,
  MoreVertical,
  Trash2,
  Download,
  ExternalLink,
  Clock,
  Check,
  X,
  Eye,
  FileAudio,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderTreeSidebar } from './FolderTreeSidebar';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { toast } from 'sonner';
// Removed useDropdownCoordinator - using uncontrolled state
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import ScreenplaySettingsModal from '@/components/editor/ScreenplaySettingsModal';
import { getScreenplay } from '@/utils/screenplayStorage';
import { Settings, Info } from 'lucide-react';
import { 
  useMediaFiles, 
  useStorageConnectionsQuery, 
  useStorageQuota,
  useUploadMedia,
  useDeleteMedia,
  usePresignedUrl,
  useBulkPresignedUrls,
  useMediaFolderTree,
  useDeleteFolder
} from '@/hooks/useMediaLibrary';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { useQueryClient } from '@tanstack/react-query';
import { Folder, FolderOpen } from 'lucide-react';

// ============================================================================
// VIDEO THUMBNAIL COMPONENT
// ============================================================================

function VideoThumbnail({ videoUrl, fileName, className }: { videoUrl: string; fileName: string; className: string }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !videoUrl) return;

    let mounted = true;

    const generateThumbnail = () => {
      if (!mounted || !video || !canvas) return;
      try {
        // Set video time to capture first frame
        video.currentTime = 0.5; // Use 0.5 seconds for better frame capture
      } catch (err) {
        console.warn('[VideoThumbnail] Failed to seek video:', err);
      }
    };

    const captureFrame = () => {
      if (!mounted || !video || !canvas) return;
      
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (mounted) {
          setThumbnailUrl(dataUrl);
        }
      } catch (err) {
        console.warn('[VideoThumbnail] Failed to capture frame:', err);
      }
    };

    const handleLoadedMetadata = () => {
      if (mounted && video) {
        generateThumbnail();
      }
    };

    const handleSeeked = () => {
      if (mounted) {
        captureFrame();
      }
    };

    const handleLoadedData = () => {
      if (mounted && video && video.readyState >= 2) {
        generateThumbnail();
      }
    };

    // Set video source and load
    video.src = videoUrl;
    video.load();

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', (e) => {
      console.warn('[VideoThumbnail] Video load error:', e);
    });

    return () => {
      mounted = false;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [videoUrl]);

  return (
    <div className={`${className} relative bg-[#1F1F1F] rounded overflow-hidden`}>
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={fileName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="w-8 h-8 text-[#808080]" />
        </div>
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        className="hidden"
        crossOrigin="anonymous"
        onError={(e) => {
          console.warn('[VideoThumbnail] Video load error:', e);
        }}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ============================================================================
// TYPES
// ============================================================================

import type { 
  MediaFile, 
  StorageQuota, 
  CloudStorageConnection 
} from '@/types/media';
import { mediaCacheKeys } from '@/types/media';

// Re-export types for component use
// Note: MediaFile no longer includes fileUrl - presigned URLs are generated on-demand
// TODO Phase 2B/C: Remove all fileUrl usage and replace with on-demand presigned URL generation via React Query

interface MediaLibraryProps {
  projectId: string;
  onSelectFile?: (file: MediaFile) => void;
  allowMultiSelect?: boolean;
  filterTypes?: Array<'video' | 'image' | 'audio' | '3d-model' | 'other'>;
  maxFileSize?: number; // in MB
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MediaLibrary({
  projectId,
  onSelectFile,
  allowMultiSelect = false,
  filterTypes,
  maxFileSize = 500, // 500MB default
  className = '',
}: MediaLibraryProps) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Backend API URL for direct calls (Phase 2A: Direct Backend Auth)
  const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

  // ============================================================================
  // UI STATE (not server state - keep as useState)
  // ============================================================================
  
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  // Phase 2: Multiple Delete Checkbox
  const [selectionMode, setSelectionMode] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  // Removed useDropdownCoordinator - using uncontrolled state like MusicLibrary
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string[]>([]);
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);
  
  // Folder files state (cloud storage files in folders - will be refactored in Phase 2C)
  const [folderFiles, setFolderFiles] = useState<MediaFile[]>([]);
  const [folderFilesLoading, setFolderFilesLoading] = useState(false);
  
  // Local error state for mutations (upload/delete)
  const [mutationError, setMutationError] = useState<string | null>(null);
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  // ============================================================================
  // REACT QUERY HOOKS (Phase 2B: React Query Integration)
  // ============================================================================
  
  // Load media files - Feature 0128: Support folder filtering
  // If selectedFolderId is set and it's an S3 folder, filter by folderId
  // If it's a cloud storage folder, use existing cloud storage logic
  const [selectedStorageType, setSelectedStorageType] = useState<'s3' | 'cloud' | null>(null);
  
  const { 
    data: files = [], 
    isLoading, 
    error: filesError,
    refetch: refetchFiles 
  } = useMediaFiles(
    projectId, 
    selectedFolderId && selectedStorageType === 's3' ? selectedFolderId : undefined,
    !selectedFolderId || selectedStorageType === 's3' // Only load S3 files when S3 folder selected or no folder
  );
  
  // 🔥 NEW: Load folder tree to display folders in main view
  const { 
    data: folderTree = [],
    isLoading: folderTreeLoading 
  } = useMediaFolderTree(projectId, !!projectId);
  
  // Load cloud storage connections
  const { 
    data: cloudConnections = [],
    isLoading: connectionsLoading 
  } = useStorageConnectionsQuery();
  
  // Load storage quota
  const { 
    data: storageQuota,
    isLoading: quotaLoading 
  } = useStorageQuota();

  // Mutations
  const uploadMediaMutation = useUploadMedia(projectId);
  const deleteMediaMutation = useDeleteMedia(projectId);
  const deleteFolderMutation = useDeleteFolder(projectId);
  
  // Query client for on-demand presigned URL fetching
  const queryClient = useQueryClient();
  
  // Storage Decision Modal state (same as Scene Builder)
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    s3Key: string;
    name: string;
    type: 'video' | 'image' | 'attachment';
  } | null>(null);

  // Auto-sync configuration state (Feature 0144)
  const [screenplayData, setScreenplayData] = useState<{ cloudStorageProvider?: 'google-drive' | 'dropbox' | null; title?: string } | null>(null);
  const [isLoadingScreenplay, setIsLoadingScreenplay] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  
  // Check if banner should be dismissed (from localStorage)
  useEffect(() => {
    const dismissed = localStorage.getItem('mediaLibraryAutoSyncBannerDismissed') === 'true';
    setIsBannerDismissed(dismissed);
  }, []);
  
  // Check if any providers are connected
  const hasConnectedProviders = (cloudConnections as CloudStorageConnection[]).some(
    c => c.connected && (c.provider === 'google-drive' || c.provider === 'dropbox')
  );
  
  // Reset banner dismissal when all providers are disconnected
  useEffect(() => {
    if (!hasConnectedProviders && isBannerDismissed) {
      // If all providers are disconnected and banner was dismissed, show it again
      setIsBannerDismissed(false);
      localStorage.removeItem('mediaLibraryAutoSyncBannerDismissed');
    }
  }, [hasConnectedProviders, isBannerDismissed]);
  
  // Hide banner permanently once a provider is connected
  useEffect(() => {
    if (hasConnectedProviders && !isBannerDismissed) {
      setIsBannerDismissed(true);
      localStorage.setItem('mediaLibraryAutoSyncBannerDismissed', 'true');
    }
  }, [hasConnectedProviders, isBannerDismissed]);
  
  const handleDismissBanner = () => {
    console.log('[MediaLibrary] Dismissing banner');
    setIsBannerDismissed(true);
    localStorage.setItem('mediaLibraryAutoSyncBannerDismissed', 'true');
    // Force a small delay to ensure state update
    setTimeout(() => {
      console.log('[MediaLibrary] Banner dismissed, isBannerDismissed:', localStorage.getItem('mediaLibraryAutoSyncBannerDismissed'));
    }, 100);
  };

  // ============================================================================
  // API CALLS
  // ============================================================================

  // Load screenplay data to check auto-sync status (Feature 0144)
  useEffect(() => {
    const loadScreenplayData = async () => {
      // Only load if projectId is a valid screenplay ID
      if (!projectId || !projectId.startsWith('screenplay_')) {
        return;
      }

      setIsLoadingScreenplay(true);
      try {
        const screenplay = await getScreenplay(projectId, getToken);
        if (screenplay) {
          setScreenplayData({
            cloudStorageProvider: screenplay.cloudStorageProvider || null,
            title: screenplay.title
          });
        }
      } catch (error) {
        console.error('[MediaLibrary] Failed to load screenplay data:', error);
        // Don't show error toast - this is optional data
      } finally {
        setIsLoadingScreenplay(false);
      }
    };

    loadScreenplayData();
  }, [projectId, getToken]);

  // Load folder files (cloud storage folders - not using React Query yet)
  const loadFolderFiles = async (folderId: string) => {
    setFolderFilesLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      let allFiles: MediaFile[] = [];

      // If folderId is provided, load files from that folder only
      if (folderId) {
        // Load files from specific folder (cloud storage)
        try {
          const connectionsResponse = await fetch(`${BACKEND_API_URL}/api/storage/connections`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (connectionsResponse.ok) {
            const connectionsData = await connectionsResponse.json();
            const connections = connectionsData.connections || [];

            // Determine provider from folderId (Google Drive IDs are long strings, Dropbox paths start with /)
            const provider = folderId.startsWith('/') ? 'dropbox' : 'google-drive';
            const connection = connections.find((c: any) => c.provider === provider && (c.status === 'active' || c.status === 'connected'));

            if (connection) {
              try {
                const filesResponse = await fetch(`${BACKEND_API_URL}/api/storage/files/${provider}?folderId=${encodeURIComponent(folderId)}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });

                if (filesResponse.ok) {
                  const filesData = await filesResponse.json();
                  const cloudFiles = (filesData.files || []).map((file: any) => ({
                    id: file.id,
                    fileName: file.name,
                    fileUrl: file.webViewLink || file.downloadUrl || '',
                    fileType: detectFileType(file.mimeType || file.name),
                    fileSize: file.size || 0,
                    storageType: provider,
                    uploadedAt: file.createdTime || file.modified || new Date().toISOString(),
                    thumbnailUrl: file.thumbnailLink || undefined,
                  }));
                  allFiles = cloudFiles;
                }
              } catch (error) {
                console.warn(`[MediaLibrary] Failed to load files from folder:`, error);
              }
            }
          }
        } catch (error) {
          console.warn('[MediaLibrary] Failed to load folder files:', error);
        }
      } else {
        // Load all files (no folder filter)
        // Load local/S3 files
        // Use screenplayId as primary, projectId as fallback (projectId prop is actually screenplayId)
        const localResponse = await fetch(`${BACKEND_API_URL}/api/media/list?screenplayId=${projectId}&projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (localResponse.ok) {
          const localData = await localResponse.json();
          const backendFiles = localData.files || [];
          
          console.log('[MediaLibrary] Loaded files from backend:', {
            count: backendFiles.length,
            screenplayId: projectId, // projectId prop is actually screenplayId
            projectId: projectId, // Keep for backward compatibility
            files: backendFiles.map((f: any) => ({ id: f.fileId, name: f.fileName }))
          });
          
          // Map backend format to frontend format
          // Backend returns: { fileId, fileName, fileType (MIME), fileSize, s3Key, s3Url, createdAt }
          // Frontend expects: { id, fileName, fileUrl, fileType (enum), fileSize, storageType, uploadedAt }
          allFiles = await Promise.all(
            backendFiles.map(async (file: any) => {
              // Generate presigned URL for S3 files (more reliable than direct S3 URL)
              let fileUrl = file.s3Url;
              
              if (file.s3Key) {
                try {
                  const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      s3Key: file.s3Key,
                      expiresIn: 3600, // 1 hour
                    }),
                  });
                  
                  if (presignedResponse.ok) {
                    const presignedData = await presignedResponse.json();
                    fileUrl = presignedData.downloadUrl || file.s3Url;
                  }
                } catch (error) {
                  console.warn('[MediaLibrary] Failed to get presigned URL, using direct S3 URL:', error);
                }
              }
              
              return {
                id: file.fileId,                    // Map fileId → id
                fileName: file.fileName,
                fileUrl,                            // Use presigned URL if available
                fileType: detectFileType(file.fileType),  // Convert MIME type to enum
                fileSize: file.fileSize,
                storageType: 'local' as const,      // S3 files are 'local' storage type
                uploadedAt: file.createdAt,         // Map createdAt → uploadedAt
                expiresAt: undefined,               // Not applicable for S3 files
                thumbnailUrl: undefined,            // Will be generated client-side for videos
                s3Key: file.s3Key,                  // Store S3 key for generating fresh presigned URLs (bucket is private)
              };
            })
          );
        }

        // Load cloud storage files (Google Drive & Dropbox)
        try {
          const connectionsResponse = await fetch(`${BACKEND_API_URL}/api/storage/connections`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (connectionsResponse.ok) {
            const connectionsData = await connectionsResponse.json();
            const connections = connectionsData.connections || [];

            // Fetch files from each connected provider
            for (const connection of connections) {
              if (connection.status === 'active' || connection.status === 'connected') {
                try {
                  const filesResponse = await fetch(`${BACKEND_API_URL}/api/storage/files/${connection.provider}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  });

                  if (filesResponse.ok) {
                    const filesData = await filesResponse.json();
                    const cloudFiles = (filesData.files || []).map((file: any) => ({
                      id: file.id,
                      fileName: file.name,
                      fileUrl: file.webViewLink || file.downloadUrl || '',
                      fileType: detectFileType(file.mimeType || file.name),
                      fileSize: file.size || 0,
                      storageType: connection.provider,
                      uploadedAt: file.createdTime || file.modified || new Date().toISOString(),
                      thumbnailUrl: file.thumbnailLink || undefined,
                    }));
                    allFiles = [...allFiles, ...cloudFiles];
                  }
                } catch (error) {
                  console.warn(`[MediaLibrary] Failed to load files from ${connection.provider}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.warn('[MediaLibrary] Failed to load cloud storage files:', error);
          // Don't fail the whole load, just show local files
        }
      }

      setFolderFiles(allFiles);
    } catch (err) {
      console.error('[MediaLibrary] Load folder files error:', err);
      setFolderFiles([]);
    } finally {
      setFolderFilesLoading(false);
    }
  };
  
  // Load folder files when folderId changes (only for cloud storage)
  useEffect(() => {
    if (selectedFolderId && selectedStorageType === 'cloud') {
      loadFolderFiles(selectedFolderId);
    } else {
      setFolderFiles([]);
    }
  }, [selectedFolderId, selectedStorageType, projectId]);

  const handleFolderSelect = (folderId: string, path: string[], storageType: 's3' | 'cloud') => {
    setSelectedFolderId(folderId || null);
    setSelectedFolderPath(path);
    setSelectedStorageType(folderId ? storageType : null);
    // loadFolderFiles will be called by useEffect when selectedFolderId changes (for cloud storage)
  };

  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      // Navigate to root (All Files)
      setSelectedFolderId(null);
      setSelectedFolderPath([]);
      setSelectedStorageType(null);
    } else {
      // Navigate to specific folder in path
      const newPath = selectedFolderPath.slice(0, index + 1);
      setSelectedFolderPath(newPath);
      
      // Find folderId for this path by traversing the folder tree
      // For S3 folders, we need to find the folderId from the folder tree
      if (selectedStorageType === 's3' && folderTree && folderTree.length > 0) {
        const findFolderByPath = (tree: any[], path: string[], currentIndex: number = 0): string | null => {
          if (currentIndex >= path.length) return null;
          
          const targetName = path[currentIndex];
          for (const folder of tree) {
            if (folder.folderName === targetName) {
              if (currentIndex === path.length - 1) {
                // Found the target folder
                return folder.folderId;
              } else if (folder.children) {
                // Continue searching in children
                const found = findFolderByPath(folder.children, path, currentIndex + 1);
                if (found) return found;
              }
            }
          }
          return null;
        };
        
        const folderId = findFolderByPath(folderTree, newPath);
        if (folderId) {
          setSelectedFolderId(folderId);
          setSelectedStorageType('s3');
        }
      } else if (selectedStorageType === 'cloud') {
        // For cloud storage, we need to reconstruct the folderId from the path
        // This is a simplified approach - in reality, cloud folders use different IDs
        // For now, just update the path and let the folder selection handle it
        setSelectedFolderPath(newPath);
      }
    }
  };
  
  // Determine which files to display
  // Feature 0128: S3 folders use React Query (files), cloud storage uses folderFiles
  const displayFiles: MediaFile[] = (selectedFolderId && selectedStorageType === 'cloud') 
    ? folderFiles 
    : (files as MediaFile[]);
  const displayLoading = (selectedFolderId && selectedStorageType === 'cloud') 
    ? folderFilesLoading 
    : isLoading;
  const displayError = mutationError || filesError?.message || null;
  
  // Phase 2C: Generate bulk presigned URLs for grid view thumbnails (S3 files only)
  const s3Files = displayFiles.filter(f => (f.storageType === 'local' || f.storageType === 'wryda-temp') && f.s3Key);
  const s3Keys = s3Files.map(f => f.s3Key!);
  const { data: bulkPresignedUrls } = useBulkPresignedUrls(
    s3Keys,
    viewMode === 'grid' && s3Keys.length > 0 // Only fetch when in grid view and we have S3 files
  );
  
  // Helper function to get file URL (presigned for S3, original for cloud storage)
  const getFileUrl = (file: MediaFile): string | undefined => {
    if (file.storageType === 'local' || file.storageType === 'wryda-temp') {
      if (file.s3Key && bulkPresignedUrls) {
        return (bulkPresignedUrls as Map<string, string>).get(file.s3Key);
      }
      // Fallback to deprecated fileUrl if available (for backward compatibility during transition)
      return file.fileUrl;
    }
    // Cloud storage files use their original URLs
    return file.fileUrl;
  };

  // Helper function to detect file type from MIME type or filename
  const detectFileType = (mimeTypeOrFilename: string): 'video' | 'image' | 'audio' | 'other' => {
    const lower = mimeTypeOrFilename.toLowerCase();
    if (lower.includes('video') || lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi')) {
      return 'video';
    }
    if (lower.includes('image') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif')) {
      return 'image';
    }
    if (lower.includes('audio') || lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.aac')) {
      return 'audio';
    }
    return 'other';
  };

  // loadStorageQuota and loadCloudConnections removed - now handled by React Query hooks
  // (useStorageQuota and useStorageConnectionsQuery)

  const uploadFile = async (file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      setMutationError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
      setMutationError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Step 1: Get pre-signed URL for S3 upload
      // Use screenplayId as primary, projectId as fallback (projectId prop is actually screenplayId)
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` + 
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&screenplayId=${encodeURIComponent(projectId)}` +
        `&projectId=${encodeURIComponent(projectId)}`, // Keep for backward compatibility
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error(`File too large. Maximum size is ${maxFileSize}MB.`);
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json();
          throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
        }
      }

      const { url, fields, s3Key } = await presignedResponse.json();
      
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
      }

      // Step 2: Upload directly to S3 using FormData POST (presigned POST)
      // This is the recommended approach for browser uploads - Content-Type is handled
      // as form data, not headers, preventing 403 Forbidden errors
      const formData = new FormData();
      
      // Add all the fields returned from createPresignedPost
      // CRITICAL: The 'key' field must be present and match the S3 key exactly
      // NOTE: Do NOT include 'bucket' field in FormData - it's only for policy validation
      console.log('[MediaLibrary] Presigned POST fields:', fields);
      console.log('[MediaLibrary] Expected S3 key:', s3Key);
      
      Object.entries(fields).forEach(([key, value]) => {
        // Skip 'bucket' field - it's only used in the policy, not in FormData
        if (key.toLowerCase() === 'bucket') {
          console.log(`[MediaLibrary] Skipping 'bucket' field (policy-only): ${value}`);
          return;
        }
        formData.append(key, value as string);
        console.log(`[MediaLibrary] Added field: ${key} = ${value}`);
      });
      
      // Verify 'key' field is present (required for presigned POST)
      if (!fields.key && !fields.Key) {
        console.error('[MediaLibrary] WARNING: No "key" field in presigned POST fields!');
        console.error('[MediaLibrary] Available fields:', Object.keys(fields));
      }
      
      // Add the file last (must be last field in FormData per AWS requirements)
      formData.append('file', file);
      console.log('[MediaLibrary] Added file:', file.name, `(${file.size} bytes, ${file.type})`);
      console.log('[MediaLibrary] Uploading to URL:', url);
      
      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 50); // 0-50% for upload
            setUploadProgress(25 + percentComplete); // 25-75% total
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            // Parse XML error response for detailed error code
            let errorCode = 'Unknown';
            let errorMessage = xhr.statusText;
            try {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
              errorCode = xmlDoc.querySelector('Code')?.textContent || 'Unknown';
              errorMessage = xmlDoc.querySelector('Message')?.textContent || xhr.statusText;
              const requestId = xmlDoc.querySelector('RequestId')?.textContent;
              
              console.error('[MediaLibrary] S3 Error Details:', {
                Code: errorCode,
                Message: errorMessage,
                RequestId: requestId,
                Status: xhr.status,
                StatusText: xhr.statusText
              });
            } catch (e) {
              // Not XML, use as-is
            }
            
            // Log FormData contents for debugging
            const formDataEntries = Array.from(formData.entries());
            console.error('[MediaLibrary] FormData contents:', formDataEntries.map(([k, v]) => [
              k,
              typeof v === 'string' 
                ? (v.length > 100 ? v.substring(0, 100) + '...' : v)
                : `File: ${(v as File).name} (${(v as File).size} bytes)`
            ]));
            
            reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}. ${errorCode}: ${errorMessage}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('S3 upload failed: Network error'));
        });
        
        xhr.open('POST', url);
        xhr.send(formData);
      });

      setUploadProgress(75);

      // Step 3: Register the file with the backend using mutation (automatically invalidates cache)
      // Add small delay to ensure DynamoDB consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await uploadMediaMutation.mutateAsync({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          s3Key,
          folderId: selectedFolderId && selectedStorageType === 's3' ? selectedFolderId : undefined, // Feature 0128: Include folderId if S3 folder selected
        });
        console.log('[MediaLibrary] File registered, cache invalidated');
        
        // Force refetch to ensure UI updates immediately
        await refetchFiles();
        console.log('[MediaLibrary] Files refetched after upload');
      } catch (error) {
        console.error('[MediaLibrary] Failed to register file:', error);
        throw new Error('File uploaded but failed to register. Please refresh the page.');
      }

      // Step 4: Generate S3 URL and get presigned download URL for StorageDecisionModal (bucket is private)
      const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
      const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
      const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
      
      let downloadUrl = s3Url; // Fallback to direct S3 URL if presigned URL generation fails
      try {
        const downloadResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: s3Key,
            expiresIn: 3600 // 1 hour
          }),
        });
        
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          if (downloadData.downloadUrl) {
            downloadUrl = downloadData.downloadUrl;
          }
        }
      } catch (error) {
        console.warn('[MediaLibrary] Failed to get presigned download URL for modal, using direct S3 URL:', error);
      }

      // ✅ Upload and registration successful
      // Feature 0128: Invalidate and refetch folder tree query to update folder counts
      queryClient.invalidateQueries({ 
        queryKey: mediaCacheKeys.folderTree(projectId) 
      });
      // Also refetch to ensure counts update immediately
      queryClient.refetchQueries({ 
        queryKey: mediaCacheKeys.folderTree(projectId) 
      });
      
      toast.success(`✅ File uploaded: ${file.name}`, {
        description: 'File is now available in your library',
      });

      // Show StorageDecisionModal (same as Scene Builder)
      const fileType = file.type.startsWith('video/') ? 'video' : 
                       file.type.startsWith('image/') ? 'image' : 'attachment';
      
      setSelectedAsset({
        url: downloadUrl,
        s3Key: s3Key,
        name: file.name,
        type: fileType
      });
      setShowStorageModal(true);

      // File registration already handled above via mutation
      
      setUploadProgress(100);

    } catch (err) {
      console.error('[MediaLibrary] Upload error:', err);
      setMutationError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      // Use mutation (automatically invalidates cache and refetches)
      await deleteMediaMutation.mutateAsync(fileId);
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('[MediaLibrary] Delete error:', error);
      setMutationError(error instanceof Error ? error.message : 'Failed to delete file');
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  // Phase 2: Bulk delete handler (files and folders)
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0 && selectedFolders.size === 0) {
      return;
    }

    const fileIds = Array.from(selectedFiles);
    const folderIds = Array.from(selectedFolders);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Delete files first
      for (const fileId of fileIds) {
        try {
          await deleteMediaMutation.mutateAsync(fileId);
          successCount++;
        } catch (error) {
          console.error('[MediaLibrary] Failed to delete file in bulk:', fileId, error);
          errorCount++;
        }
      }

      // Delete folders recursively (delete children first, then parent)
      const deleteFolderRecursively = async (folderId: string): Promise<void> => {
        // Get child folders
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Not authenticated');
        
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const childFoldersResponse = await fetch(
          `${BACKEND_API_URL}/api/media/folders?screenplayId=${encodeURIComponent(projectId)}&parentFolderId=${encodeURIComponent(folderId)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (childFoldersResponse.ok) {
          const childFoldersData = await childFoldersResponse.json();
          const childFolders = childFoldersData.folders || [];
          
          // Recursively delete all child folders first (depth-first)
          for (const childFolder of childFolders) {
            await deleteFolderRecursively(childFolder.folderId);
          }
        }
        
        // Now delete the parent folder
        await deleteFolderMutation.mutateAsync({ folderId, moveFilesToParent: true });
      };
      
      for (const folderId of folderIds) {
        try {
          await deleteFolderRecursively(folderId);
          successCount++;
        } catch (error) {
          console.error('[MediaLibrary] Failed to delete folder in bulk:', folderId, error);
          errorCount++;
        }
      }

      // Clear selection and exit selection mode
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
      setSelectionMode(false);

      const totalItems = fileIds.length + folderIds.length;
      if (errorCount === 0) {
        toast.success(`Successfully deleted ${successCount} item${successCount !== 1 ? 's' : ''}`);
      } else {
        toast.warning(`Deleted ${successCount} item${successCount !== 1 ? 's' : ''}, ${errorCount} failed`);
      }
    } catch (error) {
      console.error('[MediaLibrary] Bulk deletion error:', error);
      toast.error(`Failed to delete items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewFile = async (file: MediaFile) => {
    
    try {
      let previewUrl: string | undefined = undefined;
      
      // Phase 2C: On-demand presigned URL generation for S3/local files
      if (file.storageType === 'wryda-temp' || file.storageType === 'local') {
        if (!file.s3Key) {
          console.warn('[MediaLibrary] No s3Key available for file:', file.id);
          toast.error('Cannot preview file: missing file key');
          return;
        }
        
        // Use React Query to fetch presigned URL on-demand
        try {
          const presignedData = await queryClient.fetchQuery({
            queryKey: ['media', 'presigned-url', file.s3Key],
            queryFn: async () => {
              const token = await getToken({ template: 'wryda-backend' });
              if (!token) throw new Error('Not authenticated');
              
              const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  s3Key: file.s3Key,
                  expiresIn: 3600, // 1 hour
                }),
              });
              
              if (!response.ok) {
                throw new Error(`Failed to generate presigned URL: ${response.status}`);
              }
              
              return await response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
          
          previewUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[MediaLibrary] Failed to get presigned URL:', error);
          toast.error('Failed to get preview URL');
          return;
        }
      } else if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
        // For cloud storage files, fetch direct media URLs for preview
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          console.warn('[MediaLibrary] No auth token');
          setPreviewFile(file);
          return;
        }
        
        if (file.fileType === 'image' || file.fileType === 'video' || file.fileType === 'audio') {
          if (file.storageType === 'google-drive') {
            // Google Drive: Use direct view URL for images, direct download for videos/audio
            if (file.fileType === 'image') {
              previewUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
            } else {
              // For videos/audio, get download URL from backend
              try {
                const response = await fetch(`${BACKEND_API_URL}/api/storage/download/google-drive/${file.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  previewUrl = data.downloadUrl;
                }
              } catch (error) {
                console.warn('[MediaLibrary] Failed to get Google Drive download URL');
                previewUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
              }
            }
          } else if (file.storageType === 'dropbox') {
            // Dropbox: Get download URL from backend
            try {
              const response = await fetch(`${BACKEND_API_URL}/api/storage/download/dropbox/${file.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) {
                const data = await response.json();
                previewUrl = data.downloadUrl || file.thumbnailUrl;
              } else {
                previewUrl = file.thumbnailUrl;
              }
            } catch (error) {
              console.warn('[MediaLibrary] Failed to get Dropbox download URL');
              previewUrl = file.thumbnailUrl;
            }
          }
        }
      }
      
      if (!previewUrl) {
        toast.error('Cannot preview this file type');
        return;
      }
      
      // For images, use ImageViewer with navigation
      if (file.fileType === 'image') {
        const imageFiles = filteredFiles.filter(f => f.fileType === 'image');
        const index = imageFiles.findIndex(f => f.id === file.id);
        if (index >= 0) {
          setPreviewImageIndex(index);
        }
      } else {
        // For non-images, use the old modal
        setPreviewFile({
          ...file,
          fileUrl: previewUrl
        });
      }
    } catch (error) {
      console.error('[MediaLibrary] Error getting preview URL:', error);
      toast.error('Failed to get preview URL');
    }
  };

  const handleDownloadFile = async (file: MediaFile) => {
    try {
      let downloadUrl: string | undefined = undefined;
      
      // Phase 2C: On-demand presigned URL generation for S3/local files
      if (file.storageType === 'wryda-temp' || file.storageType === 'local') {
        if (!file.s3Key) {
          toast.error('Cannot download file: missing file key');
          return;
        }
        
        // Use React Query to fetch presigned URL on-demand
        try {
          const presignedData = await queryClient.fetchQuery({
            queryKey: ['media', 'presigned-url', file.s3Key],
            queryFn: async () => {
              const token = await getToken({ template: 'wryda-backend' });
              if (!token) throw new Error('Not authenticated');
              
              const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  s3Key: file.s3Key,
                  expiresIn: 3600, // 1 hour
                }),
              });
              
              if (!response.ok) {
                throw new Error(`Failed to generate presigned URL: ${response.status}`);
              }
              
              return await response.json();
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
          
          downloadUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[MediaLibrary] Failed to get presigned URL:', error);
          toast.error('Failed to get download URL');
          return;
        }
      } else if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
        // For cloud storage files, get download URL from backend
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Not authenticated');
          return;
        }
        
        const response = await fetch(`${BACKEND_API_URL}/api/storage/download/${file.storageType}/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          downloadUrl = data.downloadUrl;
        } else {
          toast.error('Failed to get download URL');
          return;
        }
      }

      if (!downloadUrl) {
        toast.error('Cannot download this file');
        return;
      }

      // Professional blob-based download approach
      // Fetch file as blob, create object URL, then download
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Determine file extension from file type or name
      const fileExtension = file.fileName.split('.').pop() || 
                           (file.fileType === 'image' ? 'jpg' : 
                            file.fileType === 'video' ? 'mp4' : 
                            file.fileType === 'audio' ? 'mp3' : 'bin');
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.fileName || `download.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('[MediaLibrary] Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download file');
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  const handleFileClick = (file: MediaFile) => {
    if (selectionMode || allowMultiSelect) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    } else {
      // Default behavior: Open preview modal when clicking file card
      // This is more intuitive than just logging to console
      handleViewFile(file);
    }
  };

  /**
   * 🔥 NEW: Sync single file to cloud storage
   */
  const handleSyncFileToCloud = async (fileId: string) => {
    if (!projectId) {
      toast.error('Project ID required');
      return;
    }

    const activeConnection = (cloudConnections as CloudStorageConnection[]).find(
      c => c.connected && (c.provider === 'google-drive' || c.provider === 'dropbox')
    );

    if (!activeConnection) {
      toast.error('No cloud storage connection found. Please connect Google Drive or Dropbox first.');
      return;
    }

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${BACKEND_API_URL}/api/storage/sync-file-to-cloud`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenplayId: projectId,
          fileId,
          provider: activeConnection.provider
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to sync file');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('File synced to cloud storage successfully');
        await refetchFiles();
        queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
      } else {
        toast.error(result.error || 'Failed to sync file');
      }

    } catch (error: any) {
      console.error('[MediaLibrary] Sync file error:', error);
      toast.error(`Failed to sync file: ${error.message}`);
    }
  };

  /**
   * 🔥 NEW: Sync folder to cloud storage
   */
  const handleSyncFolderToCloud = async (folderId: string) => {
    if (!projectId) {
      toast.error('Project ID required');
      return;
    }

    const activeConnection = (cloudConnections as CloudStorageConnection[]).find(
      c => c.connected && (c.provider === 'google-drive' || c.provider === 'dropbox')
    );

    if (!activeConnection) {
      toast.error('No cloud storage connection found. Please connect Google Drive or Dropbox first.');
      return;
    }

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${BACKEND_API_URL}/api/storage/sync-folder-to-cloud`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenplayId: projectId,
          folderId,
          provider: activeConnection.provider
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to sync folder');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully synced ${result.syncedFiles} file${result.syncedFiles === 1 ? '' : 's'} from folder to cloud storage`, {
          description: result.failedFiles > 0 
            ? `${result.failedFiles} file${result.failedFiles === 1 ? '' : 's'} failed to sync`
            : undefined
        });
        await refetchFiles();
        queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
        queryClient.invalidateQueries({ queryKey: ['media', 'folders', projectId] });
      } else {
        toast.error(`Sync completed with errors: ${result.failedFiles} file${result.failedFiles === 1 ? '' : 's'} failed`, {
          description: result.errors.length > 0 ? result.errors[0].error : undefined
        });
      }

    } catch (error: any) {
      console.error('[MediaLibrary] Sync folder error:', error);
      toast.error(`Failed to sync folder: ${error.message}`);
    }
  };

  const handleConnectDrive = async (storageType: 'google-drive' | 'dropbox') => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Get OAuth authorization URL from backend
      const response = await fetch(`${BACKEND_API_URL}/api/storage/connect/${storageType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.status}`);
      }

      const data = await response.json();
      
      // Open OAuth flow in popup
      const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${BACKEND_API_URL}/api/auth/${storageType === 'google-drive' ? 'google' : 'dropbox'}/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.connected) {
              clearInterval(pollInterval);
              if (popup && !popup.closed) {
                popup.close();
              }
              // Refresh file list to include cloud storage files
              await refetchFiles();
              alert(`${storageType === 'google-drive' ? 'Google Drive' : 'Dropbox'} connected successfully!`);
            }
          }
        } catch (error) {
          console.error('[MediaLibrary] Status poll error:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('[MediaLibrary] Connect error:', error);
      setMutationError(error instanceof Error ? error.message : 'Failed to connect storage');
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * 🔥 NEW: Get child folders of currently selected folder
   * Returns folders that are direct children of the selected folder (or root if none selected)
   * Includes both S3 folders and cloud storage folders for identical experience
   */
  const getChildFolders = (): Array<{ id: string; name: string; fileCount?: number; path: string[]; storageType?: 's3' | 'cloud' }> => {
    const folders: Array<{ id: string; name: string; fileCount?: number; path: string[]; storageType?: 's3' | 'cloud' }> = [];
    
    // Helper to recursively find folder by ID in S3 tree
    const findFolderById = (nodes: typeof folderTree, folderId: string): typeof folderTree[0] | null => {
      for (const node of nodes) {
        if (node.folderId === folderId) return node;
        if (node.children) {
          const found = findFolderById(node.children, folderId);
          if (found) return found;
        }
      }
      return null;
    };
    
    // Get S3 folders
    if (folderTree && folderTree.length > 0) {
      if (!selectedFolderId) {
        // Root level: show top-level S3 folders
        const s3Folders = folderTree
          .filter(node => node.folderPath && node.folderPath.length === 1)
          .map(node => ({
            id: node.folderId,
            name: node.folderName,
            fileCount: node.fileCount,
            path: node.folderPath || [],
            storageType: 's3' as const
          }));
        folders.push(...s3Folders);
      } else {
        // Check if selected folder is an S3 folder
        const selectedFolder = findFolderById(folderTree, selectedFolderId);
        if (selectedFolder && selectedFolder.children) {
          const s3Children = selectedFolder.children.map(node => ({
            id: node.folderId,
            name: node.folderName,
            fileCount: node.fileCount,
            path: node.folderPath || [],
            storageType: 's3' as const
          }));
          folders.push(...s3Children);
        }
      }
    }
    
    // 🔥 NEW: Get cloud storage folders (for identical experience across storage providers)
    if (screenplayData?.cloudStorageProvider && cloudConnections.length > 0) {
      const activeConnection = (cloudConnections as CloudStorageConnection[]).find(
        c => c.provider === screenplayData.cloudStorageProvider && c.connected
      );
      
      if (activeConnection && !selectedFolderId) {
        // Root level: show cloud storage top-level folders (Characters, Locations, etc.)
        const cloudFolders = [
          { id: 'characters-cloud', name: 'Characters', path: ['Characters'], storageType: 'cloud' as const },
          { id: 'locations-cloud', name: 'Locations', path: ['Locations'], storageType: 'cloud' as const },
          { id: 'scenes-cloud', name: 'Scenes', path: ['Scenes'], storageType: 'cloud' as const },
          { id: 'audio-cloud', name: 'Audio', path: ['Audio'], storageType: 'cloud' as const },
          { id: 'compositions-cloud', name: 'Compositions', path: ['Compositions'], storageType: 'cloud' as const }
        ];
        folders.push(...cloudFolders);
      } else if (selectedFolderId && selectedStorageType === 'cloud') {
        // TODO: Load cloud storage subfolders (character subfolders, outfit folders, etc.)
        // For now, cloud storage subfolders are handled via file loading
        // This would require fetching folder structure from cloud provider API
      }
    }
    
    return folders;
  };
  
  const childFolders = getChildFolders();

  const filteredFiles = displayFiles.filter(file => {
    // Search filter
    if (searchQuery && !file.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType !== 'all' && file.fileType !== filterType) {
      return false;
    }

    // Allowed types filter
    if (filterTypes && !filterTypes.includes(file.fileType)) {
      return false;
    }

    return true;
  });
  
  // 🔥 NEW: Filter folders by search query
  const filteredFolders = childFolders.filter(folder => {
    if (searchQuery && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) return `${diffDays} days left`;
    if (diffHours > 1) return `${diffHours} hours left`;
    return 'Expires soon';
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Show relative time for recent files
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
        }
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        // Show full date for older files
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
      }
    } catch (error) {
      return '';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case 'google-drive':
      case 'dropbox':
        return <Cloud className="w-4 h-4" />;
      default:
        return <HardDrive className="w-4 h-4" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-[#0A0A0A] rounded-lg shadow-lg flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[#3F3F46] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-[#FFFFFF]">
            Archive
          </h2>
          {/* NOTE: Displayed as "Archive" to users, but backend/API still uses "Storage" or "media-library" terminology */}

          {/* Storage Quota */}
          {storageQuota && (
            <div className="text-sm text-[#808080]">
              <span className="font-medium">{formatFileSize((storageQuota as { used: number; total: number }).used)}</span>
              {' / '}
              <span>{formatFileSize((storageQuota as { used: number; total: number }).total)}</span>
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Files
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={filterTypes?.map(t => {
              if (t === 'video') return 'video/*';
              if (t === 'image') return 'image/*';
              if (t === 'audio') return 'audio/*';
              return '*/*';
            }).join(',')}
            multiple
            className="hidden"
          />

          {/* Cloud Storage Section - Feature 0144: Improved UI */}
          <div className="flex gap-2">
            {/* Google Drive Connection */}
            <button
              onClick={() => handleConnectDrive('google-drive')}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                (cloudConnections as CloudStorageConnection[]).find(c => c.provider === 'google-drive')?.connected
                  ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF]'
                  : 'bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C]'
              }`}
            >
              {(cloudConnections as CloudStorageConnection[]).find(c => c.provider === 'google-drive')?.connected ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="hidden sm:inline">Drive Connected</span>
                </>
              ) : (
                <>
                  <Cloud className="w-5 h-5" />
                  <span className="hidden sm:inline">Google Drive</span>
                </>
              )}
            </button>

            {/* Dropbox Connection */}
            <button
              onClick={() => handleConnectDrive('dropbox')}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                (cloudConnections as CloudStorageConnection[]).find(c => c.provider === 'dropbox')?.connected
                  ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF]'
                  : 'bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C]'
              }`}
            >
              {(cloudConnections as CloudStorageConnection[]).find(c => c.provider === 'dropbox')?.connected ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="hidden sm:inline">Dropbox Connected</span>
                </>
              ) : (
                <>
                  <Cloud className="w-5 h-5" />
                  <span className="hidden sm:inline">Dropbox</span>
                </>
              )}
            </button>

            {/* Configure Auto-Sync Button */}
            {projectId && projectId.startsWith('screenplay_') && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C] transition-colors flex items-center justify-center gap-2"
                title="Configure auto-sync for this screenplay"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Auto-Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Auto-Sync Status Banner - Feature 0144 */}
        {/* Only show when no providers connected and not dismissed */}
        {projectId && projectId.startsWith('screenplay_') && screenplayData && !hasConnectedProviders && !isBannerDismissed && (
          <div className="mt-4 p-3 rounded-lg border bg-[#3F3F46]/20 border-[#3F3F46] text-[#808080] relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Immediately update state and localStorage
                const newDismissed = true;
                setIsBannerDismissed(newDismissed);
                localStorage.setItem('mediaLibraryAutoSyncBannerDismissed', 'true');
                // Force immediate re-render by updating state again
                setTimeout(() => {
                  setIsBannerDismissed(true);
                }, 0);
              }}
              className="absolute top-2 right-2 p-1.5 hover:bg-[#3F3F46] rounded transition-colors z-10"
              title="Dismiss"
              type="button"
            >
              <X className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
            </button>
            <div className="flex items-start gap-3 pr-8">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">Auto-sync not configured</div>
                <div className="text-xs mt-1 opacity-80">
                  Enable auto-sync to automatically save files to your cloud storage. Each screenplay can use a different provider, but all files in this screenplay will use the same provider.
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-xs underline hover:no-underline flex-shrink-0 text-[#DC143C]"
                type="button"
              >
                Configure
              </button>
            </div>
          </div>
        )}
        
        {/* Auto-Sync Enabled Banner (always show when configured) */}
        {projectId && projectId.startsWith('screenplay_') && screenplayData && screenplayData.cloudStorageProvider && (
          <div className="mt-4 p-3 rounded-lg border bg-[#00D9FF]/10 border-[#00D9FF]/30 text-[#00D9FF]">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Auto-sync enabled: {screenplayData.cloudStorageProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'}
                </div>
                <div className="text-xs mt-1 opacity-80">
                  Files automatically save to: <span className="font-mono">/Wryda Screenplays/{screenplayData.title || 'Screenplay'}/...</span>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-xs underline hover:no-underline flex-shrink-0"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Selection Mode Bulk Actions - Only show when selection mode is active and items are selected */}
        {selectionMode && (selectedFiles.size > 0 || selectedFolders.size > 0) && (
          <div className="flex items-center justify-between mt-4 p-3 bg-[#141414] border border-[#3F3F46] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#808080]">
                {selectedFiles.size + selectedFolders.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allFilesSelected = selectedFiles.size === filteredFiles.length;
                  const allFoldersSelected = selectedFolders.size === filteredFolders.length;
                  if (allFilesSelected && allFoldersSelected) {
                    setSelectedFiles(new Set());
                    setSelectedFolders(new Set());
                  } else {
                    setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
                    setSelectedFolders(new Set(filteredFolders.map(f => f.id)));
                  }
                }}
                className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#808080] hover:text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
              >
                {selectedFiles.size === filteredFiles.length && selectedFolders.size === filteredFolders.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedFiles.size + selectedFolders.size})
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
            />
          </div>

          {/* Select Multiple Button */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) {
                setSelectedFiles(new Set()); // Clear selection when exiting
                setSelectedFolders(new Set()); // Clear folder selection too
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectionMode
                ? 'bg-[#DC143C] text-white'
                : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF] border border-[#3F3F46]'
            }`}
          >
            {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectionMode ? 'Selection Mode' : 'Select Multiple'}
          </button>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-[#141414] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-[#1F1F1F] shadow'
                  : 'hover:bg-[#1F1F1F]'
              }`}
            >
              <Grid className="w-5 h-5 text-[#B3B3B3]" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-[#1F1F1F] shadow'
                  : 'hover:bg-[#1F1F1F]'
              }`}
            >
              <List className="w-5 h-5 text-[#B3B3B3]" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="mx-6 mt-4 p-4 bg-[#DC143C]/20 border border-[#DC143C] rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#FFFFFF]">Error</p>
            <p className="text-sm text-[#B3B3B3]">{displayError}</p>
          </div>
          <button
            onClick={() => setMutationError(null)}
            className="ml-auto text-[#DC143C] hover:text-[#B91238]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content with Folder Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Folder Tree Sidebar */}
        {showFolderSidebar && (
          <FolderTreeSidebar
            screenplayId={projectId}
            onFolderSelect={handleFolderSelect}
            selectedFolderId={selectedFolderId && selectedStorageType === 's3' ? selectedFolderId : null}
          />
        )}
        
        {/* File Grid Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation
            path={selectedFolderPath}
            onNavigate={handleBreadcrumbClick}
          />
          
          {/* File Grid Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Files Grid/List */}
            <div className="p-6">
              {displayLoading || folderTreeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#808080]" />
                </div>
              ) : filteredFiles.length === 0 && filteredFolders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#B3B3B3]">No files or folders found</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                      : 'space-y-2'
                  }
                >
                  {/* 🔥 NEW: Display folders first (like a traditional file browser) */}
                  {filteredFolders.map((folder) => {
                    // Determine storage type from folder (S3 or cloud)
                    const storageType = folder.storageType || (folder.id.includes('-cloud') ? 'cloud' : 's3');
                    return (
                      <div
                        key={folder.id}
                        onClick={(e) => {
                          if (selectionMode) {
                            // In selection mode, toggle folder selection
                            const newSelected = new Set(selectedFolders);
                            if (selectedFolders.has(folder.id)) {
                              newSelected.delete(folder.id);
                            } else {
                              newSelected.add(folder.id);
                            }
                            setSelectedFolders(newSelected);
                          } else {
                            // Normal mode: navigate to folder
                            handleFolderSelect(folder.id, folder.path, storageType);
                          }
                        }}
                        className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                          selectionMode
                            ? selectedFolders.has(folder.id)
                              ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50 bg-[#DC143C]/10'
                              : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                            : selectedFolderId === folder.id
                              ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                              : 'border-[#3F3F46] hover:border-[#8B5CF6]/50 hover:bg-[#1F1F1F]'
                        } ${viewMode === 'grid' ? 'p-3' : 'p-4 flex items-center gap-4'}`}
                      >
                        {/* Phase 2: Checkbox overlay in selection mode */}
                        {selectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newSelected = new Set(selectedFolders);
                                if (selectedFolders.has(folder.id)) {
                                  newSelected.delete(folder.id);
                                } else {
                                  newSelected.add(folder.id);
                                }
                                setSelectedFolders(newSelected);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                selectedFolders.has(folder.id)
                                  ? 'bg-[#DC143C] text-white'
                                  : 'bg-[#0A0A0A]/80 text-[#808080] hover:bg-[#1F1F1F]'
                              }`}
                            >
                              {selectedFolders.has(folder.id) ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                        {/* Folder Icon */}
                        <div className={`${viewMode === 'grid' ? 'mb-3' : ''} flex-shrink-0 relative`}>
                          <div className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} bg-[#1F1F1F] rounded flex items-center justify-center`}>
                            <Folder className="w-12 h-12 text-[#8B5CF6]" />
                          </div>
                          {/* Cloud storage indicator */}
                          {storageType === 'cloud' && (
                            <div className="absolute top-1 right-1">
                              <Cloud className="w-4 h-4 text-[#808080]" />
                            </div>
                          )}
                        </div>
                        
                        {/* Folder Name */}
                        <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1'}`}>
                          <p className="text-sm font-medium text-white truncate">
                            {folder.name}
                          </p>
                          {folder.fileCount !== undefined && (
                            <p className="text-xs text-[#6B7280] mt-1">
                              {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                            </p>
                          )}
                        </div>
                        
                        {/* 🔥 NEW: Folder Actions Menu (for S3 folders with local files) - only show when not in selection mode */}
                        {!selectionMode && storageType === 's3' && hasConnectedProviders && (
                          <div 
                            className="absolute top-2 right-2 z-50" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="p-1 bg-[#141414] border border-[#3F3F46] rounded opacity-70 group-hover:opacity-100 transition-all hover:bg-[#1F1F1F] hover:border-[#DC143C] hover:opacity-100"
                                  aria-label={`Actions for ${folder.name}`}
                                  type="button"
                                >
                                  <MoreVertical className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end"
                                className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none"
                                style={{ backgroundColor: '#0A0A0A' }}
                              >
                                <DropdownMenuItem 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    console.log('[MediaLibrary] Sync folder to Cloud onClick for folder:', folder.id);
                                    await handleSyncFolderToCloud(folder.id);
                                  }}
                                  className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6]"
                                >
                                  <Cloud className="w-4 h-4 mr-2" />
                                  Sync to Cloud
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Files */}
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      // TEMPORARILY DISABLED: Testing if parent onClick is interfering with dropdown menu items
                      onClick={(e) => {
                        // Don't trigger file click if clicking on dropdown menu area or menu items
                        const target = e.target as HTMLElement;
                        // Check if click originated from dropdown trigger or menu
                        if (
                          target.closest('button[aria-haspopup="menu"]') ||
                          target.closest('[data-radix-dropdown-menu-trigger]') || 
                          target.closest('[data-radix-dropdown-menu-content]') ||
                          target.closest('[data-slot="dropdown-menu-content"]') ||
                          target.closest('[data-slot="dropdown-menu-item"]') ||
                          target.closest('[data-radix-dropdown-menu-item]') ||
                          target.closest('[role="menuitem"]')
                        ) {
                          return;
                        }
                        handleFileClick(file);
                      }}
                      className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                        selectionMode
                          ? selectedFiles.has(file.id)
                            ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50 bg-[#DC143C]/10'
                            : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                          : selectedFiles.has(file.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${viewMode === 'grid' ? 'p-3' : 'p-4 flex items-center gap-4'}`}
                    >
                      {/* Phase 2: Checkbox overlay in selection mode */}
                      {selectionMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedFiles);
                              if (selectedFiles.has(file.id)) {
                                newSelected.delete(file.id);
                              } else {
                                newSelected.add(file.id);
                              }
                              setSelectedFiles(newSelected);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              selectedFiles.has(file.id)
                                ? 'bg-[#DC143C] text-white'
                                : 'bg-[#0A0A0A]/80 text-[#808080] hover:bg-[#1F1F1F]'
                            }`}
                          >
                            {selectedFiles.has(file.id) ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                      {/* Selected Checkmark (only show when not in selection mode) */}
                      {!selectionMode && selectedFiles.has(file.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 z-10">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className={`${viewMode === 'grid' ? 'mb-3' : ''} flex-shrink-0 relative`}>
                        {(() => {
                          const fileUrl = getFileUrl(file);
                          return file.fileType === 'image' && fileUrl ? (
                            <img
                              src={fileUrl}
                              alt={file.fileName}
                              className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} object-cover rounded bg-[#1F1F1F]`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : file.fileType === 'video' && fileUrl ? (
                            <VideoThumbnail 
                              videoUrl={fileUrl} 
                              fileName={file.fileName}
                              className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'}`}
                            />
                          ) : file.thumbnailUrl ? (
                            <img
                              src={file.thumbnailUrl}
                              alt={file.fileName}
                              className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} object-cover rounded bg-[#1F1F1F]`}
                            />
                          ) : null;
                        })()}
                        {/* Fallback icon */}
                        <div className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} bg-[#1F1F1F] rounded flex items-center justify-center ${(file.fileType === 'image' && getFileUrl(file)) || (file.fileType === 'video' && getFileUrl(file)) ? 'hidden' : ''}`}>
                          {getFileIcon(file.fileType)}
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#FFFFFF] truncate text-sm">
                          {file.fileName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#808080]">
                          {getStorageIcon(file.storageType)}
                          <span>{formatFileSize(file.fileSize)}</span>
                        </div>
                        {file.uploadedAt && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-[#6B7280]">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                        )}
                        {file.expiresAt && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600 dark:text-orange-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeRemaining(file.expiresAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions Menu - only show when not in selection mode */}
                      {!selectionMode && (
                      <div 
                        className="absolute top-2 right-2 z-50" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button
                              className="p-1 bg-[#141414] border border-[#3F3F46] rounded opacity-70 group-hover:opacity-100 transition-all hover:bg-[#1F1F1F] hover:border-[#DC143C] hover:opacity-100"
                              aria-label={`Actions for ${file.fileName}`}
                              type="button"
                            >
                              <MoreVertical className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end"
                            className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none"
                            style={{ backgroundColor: '#0A0A0A' }}
                          >
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[MediaLibrary] View onClick for file:', file.id);
                                handleViewFile(file);
                              }}
                              className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                            >
                              <Eye className="w-4 h-4 mr-2 text-[#808080]" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[MediaLibrary] Download onClick for file:', file.id);
                                handleDownloadFile(file);
                              }}
                              className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                            >
                              <Download className="w-4 h-4 mr-2 text-[#808080]" />
                              Download
                            </DropdownMenuItem>
                            {/* 🔥 NEW: Sync to Cloud option - only show for local files */}
                            {(file.storageType === 'local' || file.storageType === 'wryda-temp') && file.s3Key && hasConnectedProviders && (
                              <DropdownMenuItem 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  console.log('[MediaLibrary] Sync to Cloud onClick for file:', file.id);
                                  await handleSyncFileToCloud(file.id);
                                }}
                                className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6]"
                              >
                                <Cloud className="w-4 h-4 mr-2" />
                                Sync to Cloud
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[MediaLibrary] Delete onClick for file:', file.id);
                                deleteFile(file.id);
                              }}
                              className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Drop Zone - Moved below folders and files */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`m-6 p-8 border-2 border-dashed rounded-lg transition-colors ${
                isDragging
                  ? 'border-[#DC143C] bg-[#DC143C]/10'
                  : 'border-[#3F3F46]'
              }`}
            >
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto text-[#808080] mb-3" />
                <p className="text-[#B3B3B3] mb-1">
                  Drag and drop files here, or click Upload Files
                </p>
                <p className="text-sm text-[#808080]">
                  Max file size: {maxFileSize}MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer - For images only */}
      {previewImageIndex !== null && (() => {
        const imageFiles = filteredFiles.filter(f => f.fileType === 'image');
        return (
          <ImageViewer
            images={imageFiles.map((file): ImageItem => ({
              id: file.id,
              url: file.fileUrl || file.thumbnailUrl || '',
              label: file.fileName,
              s3Key: file.s3Key,
              metadata: { fileType: file.fileType, fileSize: file.fileSize }
            }))}
            currentIndex={previewImageIndex}
            isOpen={previewImageIndex !== null}
            onClose={() => setPreviewImageIndex(null)}
            onDownload={async (image) => {
              const file = imageFiles[previewImageIndex];
              if (file) {
                await handleDownloadFile(file);
              }
            }}
            onDelete={async (image) => {
              const file = imageFiles.find(f => f.id === image.id);
              if (file && confirm('Are you sure you want to delete this file?')) {
                await deleteFile(file.id);
                // If we deleted the current image, close viewer or move to next
                if (previewImageIndex >= imageFiles.length - 1) {
                  if (previewImageIndex > 0) {
                    setPreviewImageIndex(previewImageIndex - 1);
                  } else {
                    setPreviewImageIndex(null);
                  }
                }
              }
            }}
            groupName={selectedFolderId ? `Folder: ${selectedFolderId}` : undefined}
          />
        );
      })()}
      
      {/* Preview Modal - For videos, audio, and other file types */}
      {previewFile && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
          onKeyDown={(e) => {
            // Close modal on Escape key
            if (e.key === 'Escape') {
              setPreviewFile(null);
            }
          }}
          tabIndex={-1}
        >
          <div 
            className="bg-[#0A0A0A] rounded-lg border border-[#3F3F46] max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#141414] p-4 md:p-5 border-b border-[#3F3F46] flex items-center justify-between">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-[#FFFFFF]">{previewFile.fileName}</h3>
                <p className="text-sm text-[#808080] mt-1">
                  {formatFileSize(previewFile.fileSize)} • {previewFile.fileType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(previewFile);
                  }}
                  className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this file?')) {
                      deleteFile(previewFile.id);
                      setPreviewFile(null);
                    }
                  }}
                  className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#DC143C] text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewFile(null);
                  }}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-5">
              {previewFile.fileType === 'image' && (
                <div className="relative">
                  <img 
                    src={previewFile.fileUrl || previewFile.thumbnailUrl || ''} 
                    alt={previewFile.fileName}
                    className="w-full h-auto rounded-lg max-h-[70vh] object-contain mx-auto bg-[#0A0A0A]"
                    onError={(e) => {
                      console.error('[MediaLibrary] Image failed to load:', previewFile.fileUrl);
                      toast.error('Image failed to load. The file may be corrupted or the URL expired.');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              {previewFile.fileType === 'video' && (
                <div className="relative">
                  <video 
                    src={previewFile.fileUrl} 
                    controls
                    controlsList="nodownload"
                    className="w-full h-auto rounded-lg max-h-[70vh] bg-[#0A0A0A]"
                    preload="metadata"
                    onError={(e) => {
                      console.error('[MediaLibrary] Video failed to load:', previewFile.fileUrl);
                      toast.error('Video failed to load. The file may be corrupted or the URL expired.');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {previewFile.fileType === 'audio' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileAudio className="w-16 h-16 text-[#DC143C] mb-4" />
                  <audio 
                    src={previewFile.fileUrl} 
                    controls
                    className="w-full max-w-md"
                    preload="metadata"
                    onError={(e) => {
                      console.error('[MediaLibrary] Audio failed to load:', previewFile.fileUrl);
                      toast.error('Audio file failed to load. The file may be corrupted or the URL expired.');
                    }}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                  <p className="text-sm text-[#808080] mt-4">{previewFile.fileName}</p>
                </div>
              )}
              {previewFile.fileType === 'other' && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-[#808080] mx-auto mb-4" />
                  <p className="text-[#B3B3B3] mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownloadFile(previewFile)}
                    className="bg-[#DC143C] hover:bg-[#B91238] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download File
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-[#141414] p-4 border-t border-[#3F3F46] flex items-center justify-end gap-3">
              <button
                onClick={() => handleDownloadFile(previewFile)}
                className="bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this file?')) {
                    deleteFile(previewFile.id);
                    setPreviewFile(null);
                  }
                }}
                className="bg-[#DC143C] hover:bg-[#B91238] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Decision Modal (same as Scene Builder) */}
      {showStorageModal && selectedAsset && (
        <StorageDecisionModal
          isOpen={showStorageModal}
          onClose={() => {
            setShowStorageModal(false);
            setSelectedAsset(null);
          }}
          assetType={selectedAsset.type === 'video' ? 'video' : 
                     selectedAsset.type === 'image' ? 'image' : 'composition'}
          assetName={selectedAsset.name}
          s3TempUrl={selectedAsset.url}
          s3Key={selectedAsset.s3Key}
        />
      )}

      {/* Screenplay Settings Modal for Auto-Sync Configuration - Feature 0144 */}
      {projectId && projectId.startsWith('screenplay_') && (
        <ScreenplaySettingsModal
          isOpen={showSettingsModal}
          onClose={(updatedData) => {
            setShowSettingsModal(false);
            // Reload screenplay data if settings were updated
            if (updatedData) {
              const loadScreenplayData = async () => {
                try {
                  const screenplay = await getScreenplay(projectId, getToken);
                  if (screenplay) {
                    setScreenplayData({
                      cloudStorageProvider: screenplay.cloudStorageProvider || null,
                      title: screenplay.title
                    });
                  }
                } catch (error) {
                  console.error('[MediaLibrary] Failed to reload screenplay data:', error);
                }
              };
              loadScreenplayData();
            }
          }}
          screenplayId={projectId}
        />
      )}

      {/* Phase 2: Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">Delete Selected Files?</h3>
            <p className="text-sm text-[#808080] mb-6">
              Are you sure you want to delete {selectedFiles.size + selectedFolders.size} item{(selectedFiles.size + selectedFolders.size) !== 1 ? 's' : ''}?
              {selectedFiles.size > 0 && ` ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}`}
              {selectedFolders.size > 0 && ` ${selectedFolders.size} folder${selectedFolders.size !== 1 ? 's' : ''}`}
              {' '}This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowBulkDeleteConfirm(false);
                  await handleBulkDelete();
                }}
                className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete {selectedFiles.size + selectedFolders.size} Item{(selectedFiles.size + selectedFolders.size) !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

