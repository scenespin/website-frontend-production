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
  X
} from 'lucide-react';

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

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadFiles();
    loadStorageQuota();
  }, [projectId]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/media/list?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files || []);

    } catch (err) {
      console.error('[MediaLibrary] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
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

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
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
      }

    } catch (error) {
      console.error('[MediaLibrary] Delete error:', error);
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
      if (onSelectFile) {
        onSelectFile(file);
      }
    }
  };

  const handleConnectDrive = (storageType: 'google-drive' | 'dropbox') => {
    // Open OAuth flow in popup
    const authUrl = `/api/auth/${storageType === 'google-drive' ? 'google' : 'dropbox'}`;
    window.open(authUrl, '_blank', 'width=600,height=700');
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
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Media Library
          </h2>

          {/* Storage Quota */}
          {storageQuota && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Cloud className="w-5 h-5 text-blue-500" />
            <span className="hidden sm:inline">Google Drive</span>
          </button>

          <button
            onClick={() => handleConnectDrive('dropbox')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Cloud className="w-5 h-5 text-blue-600" />
            <span className="hidden sm:inline">Dropbox</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="video">Videos</option>
            <option value="image">Images</option>
            <option value="audio">Audio</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 dark:text-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`m-6 p-8 border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            Drag and drop files here, or click Upload Files
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Max file size: {maxFileSize}MB
          </p>
        </div>
      </div>

      {/* Files Grid/List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No files found</p>
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
                <div className={`${viewMode === 'grid' ? 'mb-3' : ''} flex-shrink-0`}>
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.fileName}
                      className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} object-cover rounded`}
                    />
                  ) : (
                    <div className={`${viewMode === 'grid' ? 'w-full h-32' : 'w-16 h-16'} bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center`}>
                      {getFileIcon(file.fileType)}
                    </div>
                  )}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

