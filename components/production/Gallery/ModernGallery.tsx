'use client';

/**
 * ModernGallery - Professional gallery component using React Photo Gallery
 * 
 * Features:
 * - Masonry layout with larger, more visible thumbnails
 * - Featured image area (first image displayed prominently)
 * - Lightbox viewing
 * - Outfit filtering
 * - Responsive design
 * - Base image indicators
 * - Source indicators (AI vs User)
 * - Improved spacing and visibility
 */

import React, { useState, useCallback, useMemo } from 'react';
import Gallery from 'react-photo-gallery';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { motion } from 'framer-motion';
import { Sparkles, Upload as UploadIcon, ZoomIn } from 'lucide-react';

export interface GalleryImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  label: string;
  outfitName?: string;
  isBase?: boolean;
  source?: 'pose-generation' | 'user-upload';
  width?: number;
  height?: number;
}

interface ModernGalleryProps {
  images: GalleryImage[];
  outfitFilter?: string | null;
  onOutfitFilterChange?: (outfit: string | null) => void;
  availableOutfits?: string[];
  entityName?: string;
  onImageClick?: (index: number) => void;
}

export function ModernGallery({
  images,
  outfitFilter,
  onOutfitFilterChange,
  availableOutfits = [],
  entityName,
  onImageClick
}: ModernGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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

  // Grid images (all except featured)
  const gridImages = useMemo(() => {
    if (filteredImages.length <= 1) return [];
    return filteredImages.filter((_, index) => index !== featuredIndex);
  }, [filteredImages, featuredIndex]);

  // Convert to react-photo-gallery format for grid
  const photos = useMemo(() => {
    return gridImages.map((img, index) => ({
      src: img.thumbnailUrl || img.imageUrl,
      width: img.width || 4,
      height: img.height || 3,
      alt: img.label,
      key: img.id,
      originalIndex: index + (featuredIndex === 0 ? 1 : 0), // Adjust index for grid
      actualIndex: filteredImages.findIndex(f => f.id === img.id) // Actual index in full array
    }));
  }, [gridImages, filteredImages, featuredIndex]);

  // Open lightbox
  const openLightbox = useCallback((event: any, { index }: { index: number }) => {
    // Get actual index from photo metadata
    const photo = photos[index];
    const actualIndex = photo?.actualIndex ?? index;
    setLightboxIndex(actualIndex);
    setSelectedIndex(actualIndex);
    if (onImageClick) {
      onImageClick(actualIndex);
    }
  }, [onImageClick, photos]);

  // Handle featured image click
  const handleFeaturedClick = useCallback(() => {
    setLightboxIndex(featuredIndex);
    setSelectedIndex(featuredIndex);
    if (onImageClick) {
      onImageClick(featuredIndex);
    }
  }, [featuredIndex, onImageClick]);

  // Handle grid image click (only updates featured, no lightbox)
  const handleGridImageClick = useCallback((event: any, { index }: { index: number }) => {
    const photo = photos[index];
    const actualIndex = photo?.actualIndex ?? index;
    setFeaturedIndex(actualIndex);
    // Don't open lightbox automatically - user can click featured image to open lightbox
  }, [photos]);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxIndex(-1);
    setSelectedIndex(null);
  }, []);

  // Lightbox slides (all images)
  const slides = useMemo(() => {
    return filteredImages.map(img => ({
      src: img.imageUrl,
      alt: img.label,
      title: img.label
    }));
  }, [filteredImages]);

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
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-center justify-center">
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
          <div className="relative w-full rounded-xl overflow-hidden border-2 border-[#3F3F46] group-hover:border-[#DC143C] transition-all duration-200 shadow-2xl">
            <img
              src={featuredImage.imageUrl}
              alt={featuredImage.label}
              className="w-full h-auto object-contain max-h-[600px] mx-auto transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
              <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
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

        {/* Lightbox */}
        <Lightbox
          open={lightboxIndex >= 0}
          close={closeLightbox}
          index={lightboxIndex}
          slides={slides}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' }
          }}
        />
      </div>
    );
  }

  // Multiple images layout - featured + grid
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Featured Image - Left side, smaller (1/5 width) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-1"
        >
          <div
            className="relative group cursor-pointer h-full min-h-[300px] max-h-[400px]"
            onClick={handleFeaturedClick}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-[#3F3F46] group-hover:border-[#DC143C] transition-all duration-200 shadow-2xl">
              <img
                src={featuredImage.imageUrl}
                alt={featuredImage.label}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
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
              <div className="absolute bottom-4 left-4 right-4">
                <div className="px-3 py-2 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-md">
                  {featuredImage.label}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid Gallery - Right side (4/5 width) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-4"
        >
          <Gallery
            photos={photos}
            onClick={handleGridImageClick}
            renderImage={imageRenderer}
            margin={12}
            direction="row"
            targetRowHeight={200}
          />
        </motion.div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={closeLightbox}
        index={lightboxIndex}
        slides={slides}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' }
        }}
      />
    </div>
  );
}
