'use client';

/**
 * MediaLibraryBrowser - Browse and select images from Archive
 * 
 * NOTE: Displayed to users as "Archive" for film industry terminology.
 * Backend/API still uses "Storage" or "media-library" - component name kept for compatibility.
 * 
 * Features:
 * - Browse Archive folders (displayed as "Archive", backend uses "Storage")
 * - Multi-select images
 * - Filter by image type
 * - Show selected count
 */

import React, { useState, useMemo } from 'react';
import { FolderOpen, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MediaFile } from '@/types/media';
import { useMediaFiles, usePresignedUrl } from '@/hooks/useMediaLibrary';

// Separate component for image thumbnail (to use hooks correctly)
function MediaLibraryImageThumbnail({
  file,
  isSelected,
  onToggle
}: {
  file: MediaFile;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { data: presignedData, isLoading } = usePresignedUrl(file.s3Key, true);
  const imageUrl = presignedData?.downloadUrl;

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
      {isLoading ? (
        <div className="w-full h-full bg-[#1F1F1F] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#808080]" />
        </div>
      ) : imageUrl ? (
        <img
          src={imageUrl}
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
  
  // Load media files - include all folders for Storage browser
  const { data: mediaFiles = [], isLoading } = useMediaFiles(
    screenplayId,
    undefined, // folderId - show all files
    true, // enabled
    true // includeAllFolders - show files from all folders, not just root
  );

  // Filter to images only
  const imageFiles = useMemo(() => {
    return mediaFiles.filter(file => file.fileType === 'image');
  }, [mediaFiles]);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Select Images from Archive</h3>
          {/* NOTE: Displayed as "Archive" to users, but backend/API still uses "Storage" or "media-library" */}
          <p className="text-xs text-[#808080]">
            {selectedImages.size} of {maxSelections} selected
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
        </div>
      ) : imageFiles.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-[#808080] mx-auto mb-4" />
          <p className="text-[#808080] mb-2">No images in Archive</p>
          <p className="text-xs text-[#6B7280]">
            Upload images to Archive first, or use the Upload button
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto">
          {imageFiles.map(file => (
            <MediaLibraryImageThumbnail
              key={file.id}
              file={file}
              isSelected={selectedImages.has(file.id)}
              onToggle={() => handleImageToggle(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

