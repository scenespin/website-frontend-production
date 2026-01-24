'use client';

/**
 * PropImageSelector - Prop Image Selection for Shots
 * 
 * Displays dropdown for selecting image group (Production Hub / Creation Image)
 * and grid of images for the selected group.
 * Consistent with LocationAngleSelector pattern.
 */

import React, { useMemo, useState } from 'react';
import { Check, Package } from 'lucide-react';
import { getAvailablePropImagesByGroup, type AvailableImage } from './utils/propImageUtils';

interface PropImageSelectorProps {
  propId: string;
  propName: string;
  prop: {
    id: string;
    name: string;
    angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
    images?: Array<{ url: string; s3Key?: string }>;
    baseReference?: { s3Key?: string; imageUrl?: string };
  };
  selectedImageId?: string;
  onImageChange: (propId: string, imageId: string | undefined) => void;
  propThumbnailS3KeyMap?: Map<string, string>; // Map of s3Key -> thumbnailS3Key
  propThumbnailUrlsMap?: Map<string, string>; // Map of thumbnailS3Key -> presigned URL
  propFullImageUrlsMap?: Map<string, string>; // Map of s3Key -> full image presigned URL
}

export function PropImageSelector({
  propId,
  propName,
  prop,
  selectedImageId,
  onImageChange,
  propThumbnailS3KeyMap,
  propThumbnailUrlsMap,
  propFullImageUrlsMap
}: PropImageSelectorProps) {
  // Get images grouped by type
  const groupedImages = useMemo(() => {
    return getAvailablePropImagesByGroup(prop);
  }, [prop]);

  // Get available groups (only show groups that have images)
  const availableGroups = useMemo(() => {
    const groups: Array<'Production Hub' | 'Creation Image'> = [];
    if (groupedImages['Production Hub'].length > 0) {
      groups.push('Production Hub');
    }
    if (groupedImages['Creation Image'].length > 0) {
      groups.push('Creation Image');
    }
    return groups;
  }, [groupedImages]);

  // Determine which group the selected image belongs to
  const selectedGroup = useMemo(() => {
    if (!selectedImageId) return availableGroups[0] || null;
    
    // Check Production Hub
    if (groupedImages['Production Hub'].some(img => img.id === selectedImageId)) {
      return 'Production Hub';
    }
    
    // Check Creation Image
    if (groupedImages['Creation Image'].some(img => img.id === selectedImageId)) {
      return 'Creation Image';
    }
    
    return availableGroups[0] || null;
  }, [selectedImageId, groupedImages, availableGroups]);

  // Current group selection (defaults to first available group or selected image's group)
  const [currentGroup, setCurrentGroup] = useState<'Production Hub' | 'Creation Image' | null>(
    selectedGroup || availableGroups[0] || null
  );

  // Get images for current group
  const currentGroupImages = useMemo(() => {
    if (!currentGroup) return [];
    return groupedImages[currentGroup] || [];
  }, [currentGroup, groupedImages]);

  // Resolve image URL (thumbnail or full)
  const resolveImageUrl = (image: AvailableImage): string | null => {
    const s3Key = image.imageUrl; // In prop utils, imageUrl is actually the s3Key
    
    // Try thumbnail first (faster loading)
    const thumbnailS3Key = propThumbnailS3KeyMap?.get(s3Key);
    if (thumbnailS3Key && propThumbnailUrlsMap?.has(thumbnailS3Key)) {
      return propThumbnailUrlsMap.get(thumbnailS3Key) || null;
    }
    
    // Try full image URL as fallback
    if (propFullImageUrlsMap?.has(s3Key)) {
      return propFullImageUrlsMap.get(s3Key) || null;
    }
    
    return null;
  };

  // Handle group change
  const handleGroupChange = (newGroup: 'Production Hub' | 'Creation Image') => {
    setCurrentGroup(newGroup);
    // Clear selection when switching groups (user must select from new group)
    onImageChange(propId, undefined);
  };

  // Handle image selection
  const handleImageSelect = (imageId: string) => {
    const newSelection = selectedImageId === imageId ? undefined : imageId;
    onImageChange(propId, newSelection);
  };

  // If no images available, show message
  if (availableGroups.length === 0) {
    return (
      <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
        <div className="text-xs text-[#808080]">
          No images available for this prop
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Group Dropdown */}
      {availableGroups.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#808080]">Image source:</label>
          <select
            value={currentGroup || ''}
            onChange={(e) => {
              const newGroup = e.target.value as 'Production Hub' | 'Creation Image';
              if (newGroup) handleGroupChange(newGroup);
            }}
            className="px-2 py-1 bg-[#1F1F1F] border border-[#3F3F46] rounded text-white text-xs focus:border-[#DC143C] focus:outline-none"
          >
            {availableGroups.map(group => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Image Grid */}
      {currentGroup && currentGroupImages.length > 0 && (
        <div>
          {availableGroups.length === 1 && (
            <div className="text-[10px] text-[#808080] mb-1.5">
              {currentGroup}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {currentGroupImages.map((image) => {
              const isSelected = selectedImageId === image.id;
              const imageUrl = resolveImageUrl(image);
              
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => handleImageSelect(image.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                      : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image.label || propName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1F1F1F] flex items-center justify-center">
                      <Package className="w-6 h-6 text-[#808080]" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-[#DC143C] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {image.label && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-[10px] text-white truncate block">
                        {image.label}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No images in selected group */}
      {currentGroup && currentGroupImages.length === 0 && (
        <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
          <div className="text-xs text-[#808080]">
            No {currentGroup} images available
          </div>
        </div>
      )}
    </div>
  );
}
