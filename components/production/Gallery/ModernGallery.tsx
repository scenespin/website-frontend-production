'use client';

/**
 * ModernGallery - Professional gallery component using React Photo Gallery
 * 
 * Features:
 * - Masonry layout (no clunky scrolling)
 * - Lightbox viewing
 * - Outfit filtering
 * - Responsive design
 * - Base image indicators
 * - Source indicators (AI vs User)
 */

import React, { useState, useCallback, useMemo } from 'react';
import Gallery from 'react-photo-gallery';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { motion } from 'framer-motion';
import { Sparkles, Upload as UploadIcon } from 'lucide-react';

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

  // Filter images by outfit
  const filteredImages = useMemo(() => {
    if (!outfitFilter) return images;
    return images.filter(img => {
      const imgOutfit = img.outfitName || 'default';
      return imgOutfit === outfitFilter;
    });
  }, [images, outfitFilter]);

  // Convert to react-photo-gallery format
  const photos = useMemo(() => {
    return filteredImages.map((img, index) => ({
      src: img.thumbnailUrl || img.imageUrl,
      width: img.width || 4,
      height: img.height || 3,
      alt: img.label,
      key: img.id,
      // Store original index for lightbox
      originalIndex: index
    }));
  }, [filteredImages]);

  // Open lightbox
  const openLightbox = useCallback((event: any, { index }: { index: number }) => {
    setLightboxIndex(index);
    setSelectedIndex(index);
    if (onImageClick) {
      onImageClick(index);
    }
  }, [onImageClick]);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxIndex(-1);
    setSelectedIndex(null);
  }, []);

  // Lightbox slides
  const slides = useMemo(() => {
    return filteredImages.map(img => ({
      src: img.imageUrl,
      alt: img.label,
      title: img.label
    }));
  }, [filteredImages]);

  // Custom image renderer with badges
  const imageRenderer = useCallback(
    ({ photo, margin, onClick }: any) => {
      const originalImg = filteredImages[photo.originalIndex];
      if (!originalImg) return null;

      return (
        <div
          key={photo.key}
          style={{ margin, width: photo.width, height: photo.height }}
          className="relative group cursor-pointer"
          onClick={(e) => onClick(e, { index: photo.originalIndex })}
        >
          <img
            src={photo.src}
            alt={photo.alt}
            className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
            style={{ width: '100%', height: '100%' }}
          />
          
          {/* Overlay badges */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-start justify-between p-2">
            {/* Base badge */}
            {originalImg.isBase && (
              <div className="px-2 py-1 bg-[#DC143C] text-white text-xs rounded font-medium">
                Base
              </div>
            )}
            
            {/* Source badge */}
            {originalImg.source && (
              <div className={`px-2 py-1 text-white text-xs rounded font-medium ${
                originalImg.source === 'pose-generation' 
                  ? 'bg-[#8B5CF6]' 
                  : 'bg-[#3F3F46]'
              }`}>
                {originalImg.source === 'pose-generation' ? (
                  <Sparkles className="w-3 h-3 inline mr-1" />
                ) : (
                  <UploadIcon className="w-3 h-3 inline mr-1" />
                )}
                {originalImg.source === 'pose-generation' ? 'AI' : 'User'}
              </div>
            )}
          </div>
        </div>
      );
    },
    [filteredImages]
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

  return (
    <div className="w-full">
      {/* Gallery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Gallery
          photos={photos}
          onClick={openLightbox}
          renderImage={imageRenderer}
          margin={8}
          direction="row"
        />
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

