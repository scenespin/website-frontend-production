'use client';

/**
 * PropImageSelector - Prop Image Selection for Shots
 *
 * Single dropdown: All angles (by category) + Creation Image.
 * Display names use spaces (no underscores). Same pattern as location filter.
 */

import React, { useMemo, useState } from 'react';
import { Check, Package } from 'lucide-react';
import { getAvailablePropImagesByGroup, type AvailableImage } from './utils/propImageUtils';
import { SCENE_BUILDER_GRID_COLS, SCENE_BUILDER_GRID_GAP, THUMBNAIL_ASPECT_RATIO, THUMBNAIL_STYLE } from './utils/imageConstants';

const CREATION_IMAGE_VALUE = '__creation__';

/** Display category with spaces instead of underscores (e.g. "back_left" → "back left"). */
function formatCategoryDisplay(value: string): string {
  if (value === CREATION_IMAGE_VALUE) return 'Creation Image';
  return value.replace(/_/g, ' ').trim() || value;
}

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

  const hubImages = groupedImages['Production Hub'] || [];
  const creationImages = groupedImages['Creation Image'] || [];
  const hasAnyImages = hubImages.length > 0 || creationImages.length > 0;

  // Unified options: All (if any hub) + each angle category + Creation Image (if any)
  const unifiedOptions = useMemo(() => {
    const options: Array<{ value: string; count: number }> = [];
    if (hubImages.length > 0) {
      options.push({ value: 'All', count: hubImages.length });
      const labels = new Set<string>();
      hubImages.forEach((img) => {
        const label = (img.label && img.label.trim()) ? img.label.trim() : 'Uncategorized';
        labels.add(label);
      });
      Array.from(labels)
        .sort((a, b) => a.localeCompare(b))
        .forEach((label) => {
          const count = hubImages.filter((img) => {
            const l = (img.label && img.label.trim()) ? img.label.trim() : 'Uncategorized';
            return l === label;
          }).length;
          options.push({ value: label, count });
        });
    }
    if (creationImages.length > 0) {
      options.push({ value: CREATION_IMAGE_VALUE, count: creationImages.length });
    }
    return options;
  }, [groupedImages]);

  // Single selection: one of 'All', an angle label, or CREATION_IMAGE_VALUE
  const selectedOptionFromImage = useMemo(() => {
    if (!selectedImageId) return unifiedOptions[0]?.value ?? 'All';
    const inCreation = creationImages.some((img) => img.id === selectedImageId);
    if (inCreation) return CREATION_IMAGE_VALUE;
    const hubImg = hubImages.find((img) => img.id === selectedImageId);
    if (hubImg) {
      const label = (hubImg.label && hubImg.label.trim()) ? hubImg.label.trim() : 'Uncategorized';
      return label;
    }
    return unifiedOptions[0]?.value ?? 'All';
  }, [selectedImageId, hubImages, creationImages, unifiedOptions]);

  const [selectedOption, setSelectedOption] = useState<string>(() => selectedOptionFromImage);

  React.useEffect(() => {
    setSelectedOption((prev) => (prev === selectedOptionFromImage ? prev : selectedOptionFromImage));
  }, [selectedOptionFromImage]);

  // Images to show based on single dropdown selection
  const displayedImages = useMemo(() => {
    if (selectedOption === CREATION_IMAGE_VALUE) return creationImages;
    if (selectedOption === 'All') return hubImages;
    return hubImages.filter((img) => {
      const label = (img.label && img.label.trim()) ? img.label.trim() : 'Uncategorized';
      return label === selectedOption;
    });
  }, [selectedOption, hubImages, creationImages]);

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

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    const nextImages = value === CREATION_IMAGE_VALUE
      ? creationImages
      : value === 'All'
        ? hubImages
        : hubImages.filter((img) => {
            const label = (img.label && img.label.trim()) ? img.label.trim() : 'Uncategorized';
            return label === value;
          });
    const stillVisible = selectedImageId && nextImages.some((img) => img.id === selectedImageId);
    if (!stillVisible) onImageChange(propId, undefined);
  };

  // Handle image selection
  const handleImageSelect = (imageId: string) => {
    const newSelection = selectedImageId === imageId ? undefined : imageId;
    onImageChange(propId, newSelection);
  };

  if (!hasAnyImages) {
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
      {/* Single unified dropdown: All + angle categories + Creation Image */}
      {unifiedOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#808080]">Filter by:</label>
          <select
            value={selectedOption}
            onChange={(e) => handleOptionChange(e.target.value)}
            className="px-2 py-1 bg-[#1F1F1F] border border-[#3F3F46] rounded text-white text-xs focus:border-[#DC143C] focus:outline-none"
          >
            {unifiedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {formatCategoryDisplay(opt.value)} ({opt.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Image Grid */}
      {displayedImages.length > 0 && (
        <div>
          <div className={`grid ${SCENE_BUILDER_GRID_COLS} ${SCENE_BUILDER_GRID_GAP}`}>
            {displayedImages.map((image) => {
              const isSelected = selectedImageId === image.id;
              const imageUrl = resolveImageUrl(image);
              
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => handleImageSelect(image.id)}
                  className={`relative ${THUMBNAIL_ASPECT_RATIO} rounded-lg overflow-hidden border-2 transition-all ${
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
                      style={THUMBNAIL_STYLE}
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
                  {(image.label || selectedOption === CREATION_IMAGE_VALUE) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-[10px] text-white truncate block">
                        {selectedOption === CREATION_IMAGE_VALUE ? 'Creation Image' : formatCategoryDisplay(image.label || '')}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {displayedImages.length === 0 && hasAnyImages && (
        <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
          <div className="text-xs text-[#808080]">
            No images in "{formatCategoryDisplay(selectedOption)}"
          </div>
        </div>
      )}
    </div>
  );
}
