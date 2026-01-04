'use client';

/**
 * ModernGallery - Professional gallery component using React Photo Gallery
 * 
 * Features:
 * - Masonry layout with larger, more visible thumbnails
 * - Featured image area (first image displayed prominently)
 * - ImageViewer integration (via onImageClick prop)
 * - Outfit filtering
 * - Responsive design
 * - Base image indicators
 * - Source indicators (AI vs User)
 * - Improved spacing and visibility
 */

import React, { useState, useCallback, useMemo } from 'react';
import Gallery from 'react-photo-gallery';
import { motion } from 'framer-motion';
import { Sparkles, Upload as UploadIcon, ZoomIn } from 'lucide-react';

// 🔥 IMPROVED: Import GalleryImage from shared hook for consistency
import type { GalleryImage } from '@/hooks/useThumbnailMapping';

// Re-export for backward compatibility
export type { GalleryImage };

interface ModernGalleryProps {
  images: GalleryImage[];
  outfitFilter?: string | null;
  onOutfitFilterChange?: (outfit: string | null) => void;
  availableOutfits?: string[];
  entityName?: string;
  // 🔥 IMPROVED: Accept either index (backward compat) or image identifier (preferred)
  onImageClick?: (indexOrId: number | string) => void;
  layout?: 'left' | 'top' | 'grid-only'; // 'left' for character gallery, 'top' for location gallery, 'grid-only' for thumbnail grid only
  aspectRatio?: '16:9' | '21:9'; // For top layout
  // 🔥 NEW: If true, onImageClick will receive image.id instead of index
  useImageId?: boolean;
}

export function ModernGallery({
  images,
  outfitFilter,
  onOutfitFilterChange,
  availableOutfits = [],
  entityName,
  onImageClick,
  layout = 'left',
  aspectRatio = '16:9',
  useImageId = false // Default to index for backward compatibility
}: ModernGalleryProps) {
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);

  // Filter images by outfit
  const filteredImages = useMemo(() => {
    if (!outfitFilter) return images;
    return images.filter(img => {
      const imgOutfit = img.outfitName || 'default';
      return imgOutfit === outfitFilter;
    });
  }, [images, outfitFilter]);

  // Featured image (first image or selected)
  const featuredImage = useMemo(() => {
    return filteredImages[featuredIndex] || filteredImages[0];
  }, [filteredImages, featuredIndex]);

  // Grid images (all except featured, or all if grid-only layout)
  const gridImages = useMemo(() => {
    if (layout === 'grid-only') {
      return filteredImages; // Show all images in grid
    }
    if (filteredImages.length <= 1) return [];
    return filteredImages.filter((_, index) => index !== featuredIndex);
  }, [filteredImages, featuredIndex, layout]);

  // Convert to react-photo-gallery format for grid
  const photos = useMemo(() => {
    const imagesToUse = layout === 'grid-only' ? filteredImages : gridImages;
    return imagesToUse.map((img, index) => ({
      src: img.thumbnailUrl || img.imageUrl,
      width: img.width || 4,
      height: img.height || 3,
      alt: img.label,
      key: img.id,
      originalIndex: layout === 'grid-only' ? index : index + (featuredIndex === 0 ? 1 : 0), // Adjust index for grid
      actualIndex: filteredImages.findIndex(f => f.id === img.id) // Actual index in full array
    }));
  }, [gridImages, filteredImages, featuredIndex, layout]);

  // Handle featured image click
  const handleFeaturedClick = useCallback(() => {
    if (onImageClick) {
      onImageClick(featuredIndex);
    }
  }, [featuredIndex, onImageClick]);

  // Handle grid image click (opens ImageViewer for grid-only, updates featured for other layouts)
  const handleGridImageClick = useCallback((event: any, { index }: { index: number }) => {
    const photo = photos[index];
    const actualIndex = photo?.actualIndex ?? index;
    
    if (layout === 'grid-only') {
      if (onImageClick) {
        onImageClick(actualIndex);
      }
    } else {
      // Update featured image for other layouts
      setFeaturedIndex(actualIndex);
    }
  }, [photos, layout, onImageClick]);

  // Custom image renderer with improved visibility
  const imageRenderer = useCallback(
    ({ photo, margin, onClick }: any) => {
      const originalImg = gridImages.find(img => img.id === photo.key);
      if (!originalImg) return null;

      return (
        <div
          key={photo.key}
          style={{ margin, width: photo.width, height: photo.height }}
          className="relative group cursor-pointer"
          onClick={(e) => handleGridImageClick(e, { index: photo.originalIndex })}
        >
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-[#3F3F46] group-hover:border-[#DC143C] transition-all duration-200 shadow-lg group-hover:shadow-xl">
            <img
              src={photo.src}
              alt={photo.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              style={{ width: '100%', height: '100%' }}
              loading="lazy"
            />
            
            {/* Hover overlay with zoom icon */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            
            {/* Overlay badges - more visible */}
            <div className="absolute inset-0 flex items-start justify-between p-3 pointer-events-none">
              {/* Base badge */}
              {originalImg.isBase && (
                <div className="px-2.5 py-1 bg-[#DC143C] text-white text-xs font-semibold rounded-md shadow-lg">
                  Base
                </div>
              )}
              
              {/* Source badge */}
              {originalImg.source && (
                <div className={`px-2.5 py-1 text-white text-xs font-semibold rounded-md shadow-lg ${
                  originalImg.source === 'pose-generation' 
                    ? 'bg-[#8B5CF6]' 
                    : 'bg-[#3F3F46]'
                }`}>
                  {originalImg.source === 'pose-generation' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      AI
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-3.5 h-3.5 inline mr-1" />
                      User
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
    [gridImages, handleGridImageClick]
  );

  if (filteredImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1F1F1F] flex items-center justify-center mb-4">
          <UploadIcon className="w-8 h-8 text-[#808080]" />
        </div>
        <p className="text-[#808080] mb-2">No images found</p>
        {outfitFilter && (
          <p className="text-sm text-[#6B7280]">
            No images for outfit "{outfitFilter}"
          </p>
        )}
      </div>
    );
  }

  // Single image layout - show featured prominently
  if (filteredImages.length === 1) {
    return (
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative group cursor-pointer"
          onClick={handleFeaturedClick}
        >
          <div className="relative w-full rounded-xl overflow-hidden transition-all duration-200 shadow-2xl">
            <img
              src={featuredImage.imageUrl}
              alt={featuredImage.label}
              className="w-full h-auto object-contain max-h-[600px] mx-auto transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center pointer-events-none">
              <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
              {featuredImage.isBase && (
                <div className="px-3 py-1.5 bg-[#DC143C] text-white text-sm font-semibold rounded-md shadow-lg">
                  Base
                </div>
              )}
              {featuredImage.source && (
                <div className={`px-3 py-1.5 text-white text-sm font-semibold rounded-md shadow-lg ${
                  featuredImage.source === 'pose-generation' 
                    ? 'bg-[#8B5CF6]' 
                    : 'bg-[#3F3F46]'
                }`}>
                  {featuredImage.source === 'pose-generation' ? (
                    <>
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      AI
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 inline mr-1" />
                      User
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Grid-only layout - no featured image, just thumbnails
  if (layout === 'grid-only') {
    return (
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* 🔥 FIX: Match References tab grid columns for consistency */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {filteredImages.map((img, index) => {
              // 🔥 IMPROVED: Use image.id for stable matching (no fragile index tracking)
              const clickValue = useImageId ? img.id : index;
              
              return (
                <div
                  key={img.id}
                  className="relative group cursor-pointer aspect-video rounded-lg overflow-hidden border-2 border-[#3F3F46] hover:border-[#DC143C]/50 transition-all"
                  onClick={() => {
                    if (onImageClick) {
                      onImageClick(clickValue);
                    }
                  }}
                >
                  <img
                    src={img.thumbnailUrl || img.imageUrl}
                    alt={img.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
                    {img.isBase && (
                      <div className="px-1.5 py-0.5 bg-[#DC143C] text-white text-[10px] rounded">
                        Base
                      </div>
                    )}
                    {img.source && (
                      <div className={`px-1.5 py-0.5 text-white text-[10px] rounded ${
                        img.source === 'pose-generation' 
                          ? 'bg-[#8B5CF6]' 
                          : 'bg-[#3F3F46]'
                      }`}>
                        {img.source === 'pose-generation' ? 'AI' : 'User'}
                      </div>
                    )}
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  // Multiple images layout - featured + grid
  return (
    <div className="w-full">
      <div className={`grid gap-6 ${layout === 'top' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Featured Image - Left side (1/3 width) or Top (full width) */}
        <motion.div
          initial={{ opacity: 0, x: layout === 'top' ? 0 : -20, y: layout === 'top' ? -20 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.4 }}
          className={layout === 'top' ? 'w-full' : 'lg:col-span-1'}
        >
          <div
            className="relative group cursor-pointer"
            onClick={handleFeaturedClick}
          >
            <div className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 shadow-2xl bg-[#1F1F1F] flex items-center justify-center ${
              layout === 'left' ? '' : 'group-hover:shadow-2xl' // No border for left layout, shadow only for top
            }`} style={layout === 'top' ? { aspectRatio: aspectRatio === '21:9' ? '21/9' : '16/9' } : { minHeight: '400px', maxHeight: '600px' }}>
              <img
                src={featuredImage.imageUrl}
                alt={featuredImage.label}
                className={`w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
                  layout === 'top' ? 'h-full' : 'max-h-[600px]'
                }`}
                loading="lazy"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {featuredImage.isBase && (
                  <div className="px-3 py-1.5 bg-[#DC143C] text-white text-sm font-semibold rounded-md shadow-lg">
                    Base
                  </div>
                )}
                {featuredImage.source && (
                  <div className={`px-3 py-1.5 text-white text-sm font-semibold rounded-md shadow-lg ${
                    featuredImage.source === 'pose-generation' 
                      ? 'bg-[#8B5CF6]' 
                      : 'bg-[#3F3F46]'
                  }`}>
                    {featuredImage.source === 'pose-generation' ? (
                      <>
                        <Sparkles className="w-4 h-4 inline mr-1" />
                        AI
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4 inline mr-1" />
                        User
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Featured label */}
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div className="px-3 py-2 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-md">
                  {featuredImage.label}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid Gallery - Right side (2/3 width) or Below (full width) */}
        <motion.div
          initial={{ opacity: 0, x: layout === 'top' ? 0 : 20, y: layout === 'top' ? 20 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={layout === 'top' ? 'w-full' : 'lg:col-span-2'}
        >
          {layout === 'top' ? (
            // Simple thumbnail grid for top layout (locations)
            gridImages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-4">
                {gridImages.map((img) => {
                  const actualIndex = filteredImages.findIndex(f => f.id === img.id);
                  const isSelected = actualIndex === featuredIndex;
                  
                  return (
                    <div
                      key={img.id}
                      className={`relative group cursor-pointer aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-[#DC143C] ring-2 ring-[#DC143C]/20'
                          : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                      }`}
                      onClick={(e) => {
                        // Update featured image for top layout
                        setFeaturedIndex(actualIndex);
                      }}
                    >
                    <img
                      src={img.thumbnailUrl || img.imageUrl}
                      alt={img.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
                      {img.isBase && (
                        <div className="px-1.5 py-0.5 bg-[#DC143C] text-white text-[10px] rounded">
                          Base
                        </div>
                      )}
                      {img.source && (
                        <div className={`px-1.5 py-0.5 text-white text-[10px] rounded ${
                          img.source === 'pose-generation' 
                            ? 'bg-[#8B5CF6]' 
                            : 'bg-[#3F3F46]'
                        }`}>
                          {img.source === 'pose-generation' ? 'AI' : 'User'}
                        </div>
                      )}
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center pointer-events-none">
                      <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  );
                })}
              </div>
            )
          ) : (
            // Masonry layout for left layout (characters)
            <Gallery
              photos={photos}
              onClick={handleGridImageClick}
              renderImage={imageRenderer}
              margin={12}
              direction="row"
              targetRowHeight={200}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
