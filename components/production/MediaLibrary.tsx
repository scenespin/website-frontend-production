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
  FileAudio
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
import { useDropdownCoordinator } from '@/hooks/useDropdownCoordinator';

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

interface MediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'video' | 'image' | 'audio' | 'other';
  fileSize: number;
  storageType: 'google-drive' | 'dropbox' | 'wryda-temp' | 'local';
  uploadedAt: string;
  expiresAt?: string; // For temporary storage
  thumbnailUrl?: string;
}

interface StorageQuota {
  used: number;
  total: number;
  storageType: string;
}

interface CloudStorageConnection {
  provider: 'google-drive' | 'dropbox';
  connected: boolean;
  connectedAt?: string;
  quota?: StorageQuota;
}

interface MediaLibraryProps {
  projectId: string;
  onSelectFile?: (file: MediaFile) => void;
  allowMultiSelect?: boolean;
  filterTypes?: Array<'video' | 'image' | 'audio' | 'other'>;
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

  // State
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cloudConnections, setCloudConnections] = useState<CloudStorageConnection[]>([]);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const { openMenuId, setOpenMenuId, isOpen } = useDropdownCoordinator();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string[]>([]);
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadFiles(selectedFolderId || undefined);
    loadStorageQuota();
    loadCloudConnections();
  }, [projectId, selectedFolderId]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const loadFiles = async (folderId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      let allFiles: MediaFile[] = [];

      // If folderId is provided, load files from that folder only
      if (folderId) {
        // Load files from specific folder (cloud storage)
        try {
          const connectionsResponse = await fetch('/api/storage/connections', {
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
                const filesResponse = await fetch(`/api/storage/files/${provider}?folderId=${encodeURIComponent(folderId)}`, {
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
        const localResponse = await fetch(`/api/media/list?projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (localResponse.ok) {
          const localData = await localResponse.json();
          allFiles = localData.files || [];
        }

        // Load cloud storage files (Google Drive & Dropbox)
        try {
          const connectionsResponse = await fetch('/api/storage/connections', {
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
                  const filesResponse = await fetch(`/api/storage/files/${connection.provider}`, {
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

      setFiles(allFiles);

    } catch (err) {
      console.error('[MediaLibrary] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderSelect = (folderId: string, path: string[]) => {
    setSelectedFolderId(folderId || null);
    setSelectedFolderPath(path);
    loadFiles(folderId || undefined);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Navigate to root (All Files)
      setSelectedFolderId(null);
      setSelectedFolderPath([]);
      loadFiles();
    } else {
      // Navigate to specific folder in path
      const newPath = selectedFolderPath.slice(0, index + 1);
      // Note: We'd need to get the folderId for this path segment
      // For now, just update the path and reload
      setSelectedFolderPath(newPath);
      // TODO: Get folderId for this path segment and load files
    }
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

  const loadStorageQuota = async () => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;

      const response = await fetch('/api/storage/quota', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageQuota(data.quota);
      }
    } catch (error) {
      console.error('[MediaLibrary] Quota error:', error);
    }
  };

  const loadCloudConnections = async () => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;

      const response = await fetch('/api/storage/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const connections: CloudStorageConnection[] = (data.connections || []).map((conn: any) => ({
          provider: conn.provider,
          connected: conn.status === 'active' || conn.status === 'connected',
          connectedAt: conn.connected_at,
          quota: conn.quota_used && conn.quota_total ? {
            used: conn.quota_used,
            total: conn.quota_total,
            storageType: conn.provider
          } : undefined,
        }));
        setCloudConnections(connections);
      }
    } catch (error) {
      console.error('[MediaLibrary] Cloud connections error:', error);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Step 1: Get pre-signed URL for S3 upload
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` + 
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(projectId)}`,
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

      // Step 3: Register the file with the backend
      const registerResponse = await fetch('/api/media/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          s3Key,
        }),
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register file');
      }

      await loadFiles(); // Refresh list
      setUploadProgress(100);

    } catch (err) {
      console.error('[MediaLibrary] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
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
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadFiles();
        setOpenMenuId(null); // Close menu after deletion
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete file');
      }

    } catch (error) {
      console.error('[MediaLibrary] Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleViewFile = async (file: MediaFile) => {
    setOpenMenuId(null); // Close menu
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.warn('[MediaLibrary] No auth token, using original URL');
        setPreviewFile(file);
        return;
      }

      let previewUrl = file.fileUrl;
      
      // 🔥 FIX: For S3/local files, generate fresh presigned URL if needed
      if (file.storageType === 'wryda-temp' || file.storageType === 'local') {
        // Check if fileUrl is an S3 key or needs a presigned URL
        // If fileUrl doesn't start with http/https, it might be an S3 key
        if (!file.fileUrl.startsWith('http://') && !file.fileUrl.startsWith('https://')) {
          // It's an S3 key, generate presigned URL
          try {
            const response = await fetch('/api/s3/download-url', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key: file.fileUrl,
                expiresIn: 3600 // 1 hour
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.downloadUrl) {
                previewUrl = data.downloadUrl;
              }
            }
          } catch (error) {
            console.warn('[MediaLibrary] Failed to get presigned URL for S3 file:', error);
            // Fallback to original URL
          }
        } else if (file.fileUrl.includes('.s3.') || file.fileUrl.includes('s3.amazonaws.com')) {
          // It's an S3 URL but might be expired, try to get fresh presigned URL
          // Extract S3 key from URL
          const s3KeyMatch = file.fileUrl.match(/s3[^/]*\/\/[^/]+\/(.+?)(\?|$)/);
          if (s3KeyMatch && s3KeyMatch[1]) {
            const s3Key = decodeURIComponent(s3KeyMatch[1]);
            try {
              const response = await fetch('/api/s3/download-url', {
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
              
              if (response.ok) {
                const data = await response.json();
                if (data.downloadUrl) {
                  previewUrl = data.downloadUrl;
                }
              }
            } catch (error) {
              console.warn('[MediaLibrary] Failed to refresh presigned URL:', error);
              // Use original URL as fallback
            }
          }
        }
        // If fileUrl is already a valid presigned URL, use it directly
      } else if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
        // 🔥 FIX: For cloud storage files, fetch direct media URLs for preview
        if (file.fileType === 'image' || file.fileType === 'video' || file.fileType === 'audio') {
          if (file.storageType === 'google-drive') {
            // Google Drive: Use direct view URL for images, direct download for videos/audio
            if (file.fileType === 'image') {
              previewUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
            } else {
              // For videos/audio, get download URL from backend
              try {
                const response = await fetch(`/api/storage/download/google-drive/${file.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (response.ok) {
                  const data = await response.json();
                  if (data.downloadUrl) {
                    previewUrl = data.downloadUrl;
                  }
                }
              } catch (error) {
                console.warn('[MediaLibrary] Failed to get Google Drive download URL, using fallback');
                previewUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
              }
            }
          } else if (file.storageType === 'dropbox') {
            // Dropbox: Get download URL from backend
            try {
              const response = await fetch(`/api/storage/download/dropbox/${file.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) {
                const data = await response.json();
                if (data.downloadUrl) {
                  previewUrl = data.downloadUrl;
                } else {
                  // Fallback to thumbnailUrl for images
                  previewUrl = file.thumbnailUrl || file.fileUrl;
                }
              } else {
                // Fallback to original URL
                previewUrl = file.thumbnailUrl || file.fileUrl;
              }
            } catch (error) {
              console.warn('[MediaLibrary] Failed to get Dropbox download URL, using fallback');
              previewUrl = file.thumbnailUrl || file.fileUrl;
            }
          }
        }
      }
      
      // Update file with preview URL
      setPreviewFile({
        ...file,
        fileUrl: previewUrl
      });
    } catch (error) {
      console.error('[MediaLibrary] Error getting preview URL:', error);
      toast.error('Failed to get preview URL. Using original URL.');
      // Fallback to original file
      setPreviewFile(file);
    }
  };

  const handleDownloadFile = async (file: MediaFile) => {
    try {
      // For cloud storage files, we might need to get a download URL first
      if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Not authenticated');

        // Get download URL from backend
        const response = await fetch(`/api/storage/download/${file.storageType}/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.downloadUrl) {
            window.open(data.downloadUrl, '_blank');
          }
        }
      } else {
        // For local/S3 files, use the fileUrl directly
        window.open(file.fileUrl, '_blank');
      }
      setOpenMenuId(null); // Close menu
    } catch (error) {
      console.error('[MediaLibrary] Download error:', error);
      setError(error instanceof Error ? error.message : 'Failed to download file');
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
    if (allowMultiSelect) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    } else {
      // If onSelectFile callback is provided, use it (for file selection mode)
      // Otherwise, open preview modal (for viewing mode)
      if (onSelectFile) {
        onSelectFile(file);
      } else {
        // Open preview modal when clicking file directly
        handleViewFile(file);
      }
    }
  };

  const handleConnectDrive = async (storageType: 'google-drive' | 'dropbox') => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Get OAuth authorization URL from backend
      const response = await fetch(`/api/storage/connect/${storageType}`, {
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
          const statusResponse = await fetch(`/api/auth/${storageType === 'google-drive' ? 'google' : 'dropbox'}/status`, {
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
              await loadFiles();
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
      setError(error instanceof Error ? error.message : 'Failed to connect storage');
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const filteredFiles = files.filter(file => {
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
            Media Library
          </h2>

          {/* Storage Quota */}
          {storageQuota && (
            <div className="text-sm text-[#808080]">
              <span className="font-medium">{formatFileSize(storageQuota.used)}</span>
              {' / '}
              <span>{formatFileSize(storageQuota.total)}</span>
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

          {/* Cloud Storage Buttons */}
          <button
            onClick={() => handleConnectDrive('google-drive')}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
              cloudConnections.find(c => c.provider === 'google-drive')?.connected
                ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C]'
            }`}
          >
            {cloudConnections.find(c => c.provider === 'google-drive')?.connected ? (
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

          <button
            onClick={() => handleConnectDrive('dropbox')}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
              cloudConnections.find(c => c.provider === 'dropbox')?.connected
                ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF]'
                : 'bg-[#141414] border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C]'
            }`}
          >
            {cloudConnections.find(c => c.provider === 'dropbox')?.connected ? (
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
        </div>

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
      {error && (
        <div className="mx-6 mt-4 p-4 bg-[#DC143C]/20 border border-[#DC143C] rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#FFFFFF]">Error</p>
            <p className="text-sm text-[#B3B3B3]">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
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
            selectedFolderId={selectedFolderId}
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
            {/* Drop Zone */}
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

            {/* Files Grid/List */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#808080]" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#B3B3B3]">No files found</p>
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
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                        selectedFiles.has(file.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${viewMode === 'grid' ? 'p-3' : 'p-4 flex items-center gap-4'}`}
                    >
                      {/* Selected Checkmark */}
                      {selectedFiles.has(file.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 z-10">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className={`${viewMode === 'grid' ? 'mb-3' : ''} flex-shrink-0 relative`}>
                        {file.fileType === 'image' && file.fileUrl ? (
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} object-cover rounded bg-[#1F1F1F]`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : file.fileType === 'video' && file.fileUrl ? (
                          <VideoThumbnail 
                            videoUrl={file.fileUrl} 
                            fileName={file.fileName}
                            className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'}`}
                          />
                        ) : file.thumbnailUrl ? (
                          <img
                            src={file.thumbnailUrl}
                            alt={file.fileName}
                            className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} object-cover rounded bg-[#1F1F1F]`}
                          />
                        ) : null}
                        {/* Fallback icon */}
                        <div className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} bg-[#1F1F1F] rounded flex items-center justify-center ${(file.fileType === 'image' && file.fileUrl) || (file.fileType === 'video' && file.fileUrl) ? 'hidden' : ''}`}>
                          {getFileIcon(file.fileType)}
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {file.fileName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {getStorageIcon(file.storageType)}
                          <span>{formatFileSize(file.fileSize)}</span>
                        </div>
                        {file.expiresAt && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600 dark:text-orange-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeRemaining(file.expiresAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions Menu */}
                      <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu 
                          onOpenChange={(open) => {
                            // Use the coordinator hook which handles all the complexity
                            if (open) {
                              // Close any other open menu first
                              if (openMenuId && openMenuId !== file.id) {
                                setOpenMenuId(null);
                                // Use a small delay to ensure the previous menu closes
                                setTimeout(() => {
                                  setOpenMenuId(file.id);
                                }, 10);
                              } else {
                                setOpenMenuId(file.id);
                              }
                            } else {
                              setOpenMenuId(null);
                            }
                          }}
                          modal={false}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Prevent file card click when clicking menu button
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                // Prevent file card selection when clicking menu button
                              }}
                              className="p-1 bg-[#141414] border border-[#3F3F46] rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1F1F1F] hover:border-[#DC143C]"
                              aria-label={`Actions for ${file.fileName}`}
                              aria-haspopup="menu"
                            >
                              <MoreVertical className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="bg-[#141414] border border-[#3F3F46] text-[#FFFFFF] min-w-[150px] z-[100]"
                            style={{ backgroundColor: '#141414', color: '#FFFFFF', zIndex: 100 }}
                            onCloseAutoFocus={(e) => {
                              // 🔥 FIX: Prevent focus trap issues with aria-hidden
                              e.preventDefault();
                            }}
                            onEscapeKeyDown={() => {
                              setOpenMenuId(null);
                            }}
                            onPointerDownOutside={(e) => {
                              // Allow outside clicks to close menu
                              setOpenMenuId(null);
                            }}
                          >
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setOpenMenuId(null);
                                handleViewFile(file); 
                              }}
                              className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                              style={{ color: '#FFFFFF' }}
                            >
                              <Eye className="w-4 h-4 mr-2 text-[#808080]" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setOpenMenuId(null);
                                handleDownloadFile(file); 
                              }}
                              className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                              style={{ color: '#FFFFFF' }}
                            >
                              <Download className="w-4 h-4 mr-2 text-[#808080]" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setOpenMenuId(null);
                                deleteFile(file.id); 
                              }}
                              className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                              style={{ color: '#DC143C' }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
    </div>
  );
}

