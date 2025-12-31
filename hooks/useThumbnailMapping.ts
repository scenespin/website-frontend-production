/**
 * useThumbnailMapping - Reusable hook for mapping thumbnails to full images
 * 
 * This hook provides a consistent, type-safe way to:
 * 1. Map thumbnail S3 keys to full image S3 keys
 * 2. Get presigned URLs for thumbnails
 * 3. Create GalleryImage objects with proper thumbnail URLs
 * 
 * Benefits:
 * - Single source of truth for thumbnail logic
 * - Type-safe and maintainable
 * - Prevents thumbnail-to-image mismatches
 * - Consistent across all modals
 */

import { useMemo } from 'react';
import { useBulkPresignedUrls } from './useMediaLibrary';

export interface ImageWithThumbnail {
  id: string;
  s3Key?: string;
  imageUrl: string;
  label: string;
  [key: string]: any; // Allow additional properties
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  label: string;
  outfitName?: string;
  isBase?: boolean;
  source?: 'pose-generation' | 'user-upload' | undefined; // undefined = hide badge
  width?: number;
  height?: number;
  s3Key?: string; // Preserved for stable identifier matching
}

export interface ThumbnailMappingOptions {
  /**
   * Map of full image S3 key -> thumbnail S3 key
   * Usually comes from Media Library query results
   */
  thumbnailS3KeyMap: Map<string, string>;
  
  /**
   * Array of images to process
   */
  images: ImageWithThumbnail[];
  
  /**
   * Whether the modal/gallery is currently open (for conditional fetching)
   */
  isOpen?: boolean;
  
  /**
   * Function to extract thumbnail S3 key from image metadata (fallback)
   */
  getThumbnailS3KeyFromMetadata?: (img: ImageWithThumbnail) => string | null;
  
  /**
   * Function to determine image source type
   * Return undefined to hide the source badge
   */
  getImageSource?: (img: ImageWithThumbnail) => 'pose-generation' | 'user-upload' | undefined;
  
  /**
   * Function to extract outfit name
   */
  getOutfitName?: (img: ImageWithThumbnail) => string;
  
  /**
   * Default aspect ratio for images
   */
  defaultAspectRatio?: { width: number; height: number };
}

/**
 * Hook that provides thumbnail mapping functionality
 */
export function useThumbnailMapping(options: ThumbnailMappingOptions) {
  const {
    thumbnailS3KeyMap,
    images,
    isOpen = true,
    getThumbnailS3KeyFromMetadata,
    getImageSource,
    getOutfitName,
    defaultAspectRatio = { width: 4, height: 3 }
  } = options;

  // Extract all thumbnail S3 keys that we need to fetch
  const thumbnailS3Keys = useMemo(() => {
    const keys: string[] = [];
    images.forEach((img) => {
      const s3Key = img.s3Key;
      if (!s3Key) return;
      
      // Try map first, then metadata fallback
      const thumbnailS3Key = thumbnailS3KeyMap.get(s3Key) || 
                            (getThumbnailS3KeyFromMetadata ? getThumbnailS3KeyFromMetadata(img) : null) ||
                            (img as any).metadata?.thumbnailS3Key;
      
      if (thumbnailS3Key && !keys.includes(thumbnailS3Key)) {
        keys.push(thumbnailS3Key);
      }
    });
    return keys;
  }, [images, thumbnailS3KeyMap, getThumbnailS3KeyFromMetadata]);

  // Fetch presigned URLs for thumbnails
  const { data: thumbnailUrls = new Map<string, string>(), isLoading: thumbnailsLoading } = useBulkPresignedUrls(
    thumbnailS3Keys,
    isOpen && thumbnailS3Keys.length > 0
  );

  // Convert images to GalleryImage format with proper thumbnail mapping
  const galleryImages: GalleryImage[] = useMemo(() => {
    return images.map((img) => {
      const s3Key = img.s3Key;
      
      // Get thumbnail S3 key from map or metadata
      const thumbnailS3Key = s3Key 
        ? (thumbnailS3KeyMap.get(s3Key) || 
           (getThumbnailS3KeyFromMetadata ? getThumbnailS3KeyFromMetadata(img) : null) ||
           (img as any).metadata?.thumbnailS3Key)
        : null;
      
      // Get thumbnail URL if available, otherwise use full image
      // 🔥 CRITICAL: Only use thumbnail if we can definitively match it to this image's s3Key
      // This prevents mismatched thumbnails from appearing on wrong images
      let thumbnailUrl = img.imageUrl;
      if (thumbnailS3Key && thumbnailUrls.has(thumbnailS3Key)) {
        thumbnailUrl = thumbnailUrls.get(thumbnailS3Key)!;
      }
      // No fallback - if we can't match the thumbnail, use the full image
      
      return {
        id: img.id,
        imageUrl: img.imageUrl, // Always use full image for lightbox/preview
        thumbnailUrl: thumbnailUrl, // Use thumbnail for grid view, fallback to full image
        label: img.label,
        outfitName: getOutfitName ? getOutfitName(img) : (img as any).outfitName || 'default',
        isBase: (img as any).isBase || false,
        source: getImageSource ? getImageSource(img) : ((img as any).isPose ? 'pose-generation' : 'user-upload'),
        width: defaultAspectRatio.width,
        height: defaultAspectRatio.height,
        s3Key: s3Key || undefined // Preserved for stable identifier matching
      };
    });
  }, [
    images,
    thumbnailS3KeyMap,
    thumbnailUrls,
    getThumbnailS3KeyFromMetadata,
    getImageSource,
    getOutfitName,
    defaultAspectRatio
  ]);

  return {
    galleryImages,
    thumbnailUrls,
    thumbnailsLoading,
    thumbnailS3Keys
  };
}

