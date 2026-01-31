'use client';

/**
 * MediaLibraryBrowser - Browse and select images from Archive
 * 
 * NOTE: Displayed to users as "Archive" for film industry terminology.
 * Backend/API still uses "Storage" or "media-library" - component name kept for compatibility.
 * 
 * Features:
 * - Browse Archive folders with folder tree navigation (displayed as "Archive", backend uses "Storage")
 * - Multi-select images
 * - Filter by image type
 * - Show selected count
 * - Folder browsing (advanced feature - shows root folder structure)
 */

import React, { useState, useMemo } from 'react';
import { FolderOpen, Check, Loader2, Folder, ChevronRight, ChevronDown, HardDrive, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import type { MediaFile } from '@/types/media';
import { useMediaFiles, useBulkPresignedUrls, useDropboxPreviewUrls, useMediaFolderTree } from '@/hooks/useMediaLibrary';
import type { FolderTreeNode } from '@/types/media';
import { getMediaFileDisplayUrl } from '@/components/production/utils/imageUrlResolver';

// Thumbnail component: receives display URL from parent (S3/Drive/Dropbox resolved)
function MediaLibraryImageThumbnail({
  file,
  displayUrl,
  urlLoading,
  isSelected,
  onToggle
}: {
  file: MediaFile;
  displayUrl: string | null;
  urlLoading: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
          : 'border-[#3F3F46] hover:border-[#DC143C]/50'
      }`}
    >
      {/* Thumbnail */}
      {urlLoading ? (
        <div className="w-full h-full bg-[#1F1F1F] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#808080]" />
        </div>
      ) : displayUrl ? (
        <img
          src={displayUrl}
          alt={file.fileName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#1F1F1F] flex items-center justify-center">
          <FolderOpen className="w-6 h-6 text-[#808080]" />
        </div>
      )}
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#DC143C] rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Folder Path Indicator */}
      {file.folderPath && file.folderPath.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
          <p className="text-xs text-white truncate">
            {file.folderPath.join(' / ')}
          </p>
        </div>
      )}
    </button>
  );
}

interface MediaLibraryBrowserProps {
  screenplayId: string;
  onSelectImages: (images: MediaFile[]) => void;
  filterTypes?: Array<'image' | 'video' | 'audio' | '3d-model' | 'other'>;
  allowMultiSelect?: boolean;
  maxSelections?: number;
  selectedFolderPath?: string[];
  onCancel?: () => void;
}

export function MediaLibraryBrowser({
  screenplayId,
  onSelectImages,
  filterTypes = ['image'],
  allowMultiSelect = true,
  maxSelections = 10,
  selectedFolderPath,
  onCancel
}: MediaLibraryBrowserProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  
  // Load folder tree for navigation
  const { 
    data: folderTree = [], 
    isLoading: folderTreeLoading 
  } = useMediaFolderTree(screenplayId, !!screenplayId);
  
  // Load media files - filter by selected folder
  // When selectedFolderId is null (root), show all files from all folders
  // When a folder is selected, show only files in that folder
  const { data: mediaFiles = [], isLoading } = useMediaFiles(
    screenplayId,
    selectedFolderId || undefined, // folderId - filter by selected folder (undefined = all files)
    true, // enabled
    !selectedFolderId // includeAllFolders - show all files when root is selected, only folder files when folder selected
  );

  // Filter to images only
  const imageFiles = useMemo(() => {
    return mediaFiles.filter(file => file.fileType === 'image');
  }, [mediaFiles]);

  const imageS3Keys = useMemo(() =>
    imageFiles.map(f => f.s3Key).filter((k): k is string => !!k),
    [imageFiles]
  );
  const { data: presignedUrls = new Map(), isLoading: presignedLoading } = useBulkPresignedUrls(
    imageS3Keys,
    !!screenplayId && imageFiles.length > 0
  );
  const dropboxUrlMap = useDropboxPreviewUrls(imageFiles, !!screenplayId && imageFiles.length > 0);
  const presignedMaps = useMemo(() => ({
    fullImageUrlsMap: presignedUrls,
    thumbnailS3KeyMap: null as Map<string, string> | null,
    thumbnailUrlsMap: null as Map<string, string> | null,
  }), [presignedUrls]);
  const displayUrlMap = useMemo(() => {
    const m = new Map<string, string>();
    imageFiles.forEach(f => {
      const url = getMediaFileDisplayUrl(f, presignedMaps, dropboxUrlMap);
      if (url) m.set(f.id, url);
    });
    return m;
  }, [imageFiles, presignedMaps, dropboxUrlMap]);
  const urlLoading = presignedLoading;

  const handleImageToggle = (fileId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        if (newSet.size < maxSelections) {
          newSet.add(fileId);
        } else {
          toast.error(`Maximum ${maxSelections} images can be selected`);
        }
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selected = imageFiles.filter(file => selectedImages.has(file.id));
    if (selected.length === 0) {
      toast.error('Please select at least one image');
      return;
    }
    onSelectImages(selected);
  };

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedImages(new Set()); // Clear selection when changing folders
  };

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Folder node interface for tree structure
  interface FolderNode {
    id: string;
    name: string;
    path: string[];
    folderId: string;
    fileCount?: number;
    children?: FolderNode[];
  }

  // Convert folder tree to renderable format
  const convertFolderTree = (tree: FolderTreeNode[]): FolderNode[] => {
    return tree.map(folder => ({
      id: folder.folderId,
      name: folder.folderName,
      path: folder.folderPath,
      folderId: folder.folderId,
      fileCount: folder.fileCount,
      children: folder.children ? convertFolderTree(folder.children) : undefined,
    }));
  };

  // Build folder tree with root
  const buildFolderTree = (): FolderNode[] => {
    const root: FolderNode = {
      id: 'root',
      name: 'All Files',
      path: [],
      folderId: '',
      children: folderTree.length > 0 ? convertFolderTree(folderTree) : undefined,
    };
    return [root];
  };

  // Render folder node recursively
  const renderFolderNode = (node: FolderNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolderId === node.folderId || (node.id === 'root' && !selectedFolderId);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#DC143C]/20 text-[#FFFFFF] border border-[#DC143C]/50'
              : 'text-[#808080] hover:bg-[#1F1F1F] hover:text-[#FFFFFF]'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleFolder(node.id);
            }
            handleFolderSelect(node.folderId || null);
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="p-0.5 hover:bg-[#1F1F1F] rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Spacer
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-sm truncate flex-1">{node.name}</span>
          {node.fileCount !== undefined && (
            <span className="text-xs text-[#808080] ml-1">{node.fileCount}</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const folderNodes = buildFolderTree();

  return (
    <div className="flex gap-4 h-[500px]">
      {/* Folder Sidebar */}
      <div className="w-64 bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#3F3F46]">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Folders</h3>
          <p className="text-xs text-[#808080] mt-1">Browse folder structure</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {folderTreeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#808080]" />
            </div>
          ) : (
            folderNodes.map(node => renderFolderNode(node))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white">Select Images from Archive</h3>
            {/* NOTE: Displayed as "Archive" to users, but backend/API still uses "Storage" or "media-library" */}
            <p className="text-xs text-[#808080]">
              {selectedImages.size} of {maxSelections} selected
              {selectedFolderId && ` • Folder: ${folderNodes[0]?.children?.find(f => f.folderId === selectedFolderId)?.name || 'Unknown'}`}
            </p>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white rounded text-sm"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={selectedImages.size === 0}
              className="px-3 py-1.5 bg-[#DC143C] hover:bg-[#DC143C]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm"
            >
              Add Selected ({selectedImages.size})
            </button>
          </div>
        </div>

        {/* Archive Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
            </div>
          ) : imageFiles.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-[#808080] mx-auto mb-4" />
              <p className="text-[#808080] mb-2">
                {selectedFolderId ? 'No images in this folder' : 'No images in Archive'}
              </p>
              <p className="text-xs text-[#6B7280]">
                {selectedFolderId 
                  ? 'Navigate to a different folder or upload images here'
                  : 'Upload images to Archive first, or use the Upload button'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {imageFiles.map(file => (
                <MediaLibraryImageThumbnail
                  key={file.id}
                  file={file}
                  displayUrl={displayUrlMap.get(file.id) ?? null}
                  urlLoading={urlLoading}
                  isSelected={selectedImages.has(file.id)}
                  onToggle={() => handleImageToggle(file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

