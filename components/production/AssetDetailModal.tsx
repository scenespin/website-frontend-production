'use client';

/**
 * Asset Detail Modal - Full-screen asset detail view
 * 
 * Features:
 * - Image gallery (main + references with thumbnail grid)
 * - Description and info
 * - Uploaded images management
 * - Three tabs: Gallery, Info, References
 * - Full-screen modal with cinema theme
 * 
 * Consistent with CharacterDetailModal and LocationDetailModal
 */

import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Trash2, Image as ImageIcon, Sparkles, Package, Car, Armchair, Box, Upload, FileText, MoreVertical, Info, Eye, Download, CheckSquare, Square, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { GenerateAssetTab } from './Coverage/GenerateAssetTab';
import { UploadAssetImagesTab } from './Coverage/UploadAssetImagesTab';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { RegenerateConfirmModal } from './RegenerateConfirmModal';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { useThumbnailMapping } from '@/hooks/useThumbnailMapping';
import { ModernGallery } from './Gallery/ModernGallery';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAssets } from '@/hooks/useAssetBank';

/**
 * Get display label for provider ID
 */
function getProviderLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  
  const providerMap: Record<string, string> = {
    'nano-banana-pro': 'Nano Banana Pro',
    'runway-gen4-image': 'Gen4',
    'luma-photon-1': 'Photon',
    'luma-photon-flash': 'Photon',
    'flux2-max-4k-16:9': 'FLUX.2 [max]',
    'flux2-pro-4k': 'FLUX.2 [pro]',
    'flux2-pro-2k': 'FLUX.2 [pro]',
    'flux2-flex': 'FLUX.2 [flex]',
  };
  
  return providerMap[providerId] || null;
}

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onUpdate: () => void;
  onDelete?: () => void; // 🔥 Made optional - delete removed from Production Hub
  onAssetUpdate?: (updatedAsset: Asset) => void; // 🔥 NEW: Callback to update asset in parent
}

export default function AssetDetailModal({ 
  isOpen, 
  onClose, 
  asset, 
  onUpdate,
  onDelete,
  onAssetUpdate
}: AssetDetailModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient(); // 🔥 NEW: For invalidating Media Library cache
  const isMobile = useIsMobile();
  // 🔥 ONE-WAY SYNC: Removed ScreenplayContext sync - Production Hub changes stay in Production Hub
  // 🔥 FIX: Use screenplayId (primary) with projectId fallback for backward compatibility
  const screenplayId = asset?.screenplayId || asset?.projectId;
  
  // 🔥 FIX: Use React Query hook directly to get latest assets (same as CharacterDetailModal/LocationDetailModal)
  const { data: queryAssets = [] } = useAssets(
    screenplayId || '',
    'production-hub',
    !!screenplayId && isOpen // Only fetch when modal is open
  );
  
  // 🔥 FIX: Get latest asset from React Query cache (always up-to-date)
  // This ensures UI updates immediately when cache changes (optimistic updates + refetches)
  const latestAsset = useMemo(() => {
    const queryAsset = queryAssets.find(a => a.id === asset.id);
    if (queryAsset) {
      // Use query asset (always fresh from cache)
      return queryAsset;
    }
    // Fallback to prop if not in cache yet
    return asset;
  }, [queryAssets, asset.id, asset]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references' | 'generate'>('references');
  // 🔥 Feature 0192: Coverage tab for upload/generate
  const [coverageTab, setCoverageTab] = useState<'upload' | 'generate' | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  // Phase 2: Multiple Delete Checkbox
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  // 🔥 NEW: Regeneration state
  const [regenerateAngle, setRegenerateAngle] = useState<{ angleId: string; s3Key: string; angle: string; metadata?: any } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingS3Key, setRegeneratingS3Key] = useState<string | null>(null); // Track which specific image is regenerating
  const [flippingAngleId, setFlippingAngleId] = useState<string | null>(null);
  // Track which dropdown is open (only one at a time)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Helper function for downloading images via blob (more reliable than download attribute)
  // Follows MediaLibrary pattern: fetches fresh presigned URL if s3Key available
  const downloadImageAsBlob = async (imageUrl: string, filename: string, s3Key?: string) => {
    try {
      let downloadUrl = imageUrl;
      
      // If we have an s3Key, fetch a fresh presigned URL (like MediaLibrary does)
      if (s3Key) {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) throw new Error('Not authenticated');
          
          const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
          const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 3600, // 1 hour
            }),
          });
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to generate presigned URL: ${presignedResponse.status}`);
          }
          
          const presignedData = await presignedResponse.json();
          downloadUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[AssetDetailModal] Failed to get presigned URL, using original URL:', error);
          // Fall back to original imageUrl if presigned URL fetch fails
        }
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      console.error('[AssetDetailModal] Failed to download image:', error);
      throw error;
    }
  };

  // 🔥 NEW: Handle asset angle regeneration
  const handleRegenerateAngle = async (angleId: string, existingAngleS3Key: string, angle: string, imgMetadata?: any) => {
    if (!angleId || !existingAngleS3Key || !angle) {
      toast.error('Missing angle information for regeneration');
      return;
    }

    setIsRegenerating(true);
    setRegeneratingS3Key(existingAngleS3Key); // Track which image is regenerating
    setRegenerateAngle(null); // Close modal
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      const response = await fetch(`${BACKEND_API_URL}/api/asset-bank/${latestAsset.id}/regenerate-angle?screenplayId=${screenplayId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          angleId,
          existingAngleS3Key,
          angle,
          // 🔥 FIX: Send providerId and quality from stored metadata if available
          providerId: imgMetadata?.providerId || undefined,
          quality: imgMetadata?.quality || 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to regenerate angle: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Invalidate queries to refresh asset data
      queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      onUpdate(); // Refresh asset data
    } catch (error: any) {
      console.error('[AssetDetailModal] Failed to regenerate angle:', error);
      toast.error(`Failed to regenerate angle: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRegenerating(false);
      setRegeneratingS3Key(null); // Clear regenerating state
    }
  };

  const handleFlipAngle = async (angleId: string, angleS3Key: string) => {
    if (!angleS3Key || !screenplayId) {
      toast.error('Missing angle information for flipping');
      return;
    }

    setFlippingAngleId(angleId);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      const response = await fetch(`${BACKEND_API_URL}/api/asset-bank/${asset.id}/flip-angle?screenplayId=${screenplayId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          angleId,
          angleS3Key
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to flip angle: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh asset data after flip (same pattern as regenerate)
      queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ queryKey: ['media', 'presigned-urls'] }); // Invalidate thumbnail URLs
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] }),
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] })
      ]);
      onUpdate(); // Refresh asset data
      
      toast.success('Angle flipped successfully');
    } catch (error: any) {
      console.error('[AssetDetailModal] Failed to flip angle:', error);
      toast.error(`Failed to flip angle: ${error.message || 'Unknown error'}`);
    } finally {
      setFlippingAngleId(null);
    }
  };

  const categoryMeta = ASSET_CATEGORY_METADATA[latestAsset.category];
  const assetImages = latestAsset.images || []; // Safety check for undefined images
  
  // 🔥 PHASE 1: Media Library as Primary Source
  // Query Media Library FIRST for active files (creation images + angle references)
  
  // Feature 0179: Query Media Library to get active files for asset
  const { data: entityMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    isOpen && !!screenplayId,
    true, // includeAllFolders
    'asset', // entityType
    asset.id // entityId
  );
  
  // Fallback: If entity query returns 0 files, try querying all files (for old files without entityType/entityId)
  const { data: allMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    isOpen && !!screenplayId && entityMediaFiles.length === 0,
    true, // includeAllFolders
    undefined, // No entityType filter
    undefined // No entityId filter
  );
  
  // Merge Media Library files
  const mediaFiles = useMemo(() => {
    const entityS3Keys = new Set(entityMediaFiles.map((f: any) => f.s3Key).filter(Boolean));
    const assetIdPattern = `asset/${latestAsset.id}/`;
    
    const filtered = allMediaFiles.filter((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return false;
      if (entityS3Keys.has(file.s3Key)) return false;
      
      const entityType = (file as any).entityType || file.metadata?.entityType;
      const entityId = (file as any).entityId || file.metadata?.entityId;
      if (entityType === 'asset' && entityId === latestAsset.id) {
        return true;
      }
      return file.s3Key.includes(assetIdPattern);
    });
    
    return [...entityMediaFiles, ...filtered];
  }, [entityMediaFiles, allMediaFiles, latestAsset.id, isOpen]);
  
  // Create metadata maps from asset prop (DynamoDB) for enrichment
  const dynamoDBMetadataMap = useMemo(() => {
    const map = new Map<string, any>();
    
    // Add creation images metadata (from asset.images)
    assetImages.forEach((img: any, idx: number) => {
      const source = img.metadata?.source;
      const isCreationImage = !source || source === 'user-upload';
      
      if (isCreationImage && (img.s3Key || img.metadata?.s3Key)) {
        const s3Key = img.s3Key || img.metadata?.s3Key;
        map.set(s3Key, {
          id: `img-${idx}`,
          label: `${latestAsset.name} - Image ${idx + 1}`,
          isBase: idx === 0,
          isAngleReference: false,
          isCreationImage: true,
          metadata: img.metadata || {}
        });
      }
    });
    
    // Add angleReferences metadata (from latestAsset.angleReferences)
    const angleReferences = latestAsset.angleReferences || [];
    angleReferences.forEach((ref: any) => {
      if (ref.s3Key) {
        map.set(ref.s3Key, {
          id: ref.id || `angle-${ref.angle || 'unknown'}`,
          label: `${latestAsset.name} - ${ref.angle || 'Angle'} view`,
          isBase: false,
          isAngleReference: true,
          isCreationImage: false,
          angle: ref.angle,
          isRegenerated: ref.metadata?.isRegenerated || false,
          metadata: {
            s3Key: ref.s3Key,
            angle: ref.angle,
            source: 'angle-generation',
            createdIn: 'production-hub',
            creditsUsed: ref.creditsUsed || 0,
            providerId: ref.metadata?.providerId || ref.metadata?.generationMetadata?.providerId,
            quality: ref.metadata?.quality || ref.metadata?.generationMetadata?.quality,
            isRegenerated: ref.metadata?.isRegenerated || false
          }
        });
      }
    });
    
    return map;
  }, [latestAsset.images, latestAsset.angleReferences, latestAsset.name]);
  
  // Build images from Media Library FIRST (primary source), enrich with DynamoDB metadata
  const imagesFromMediaLibrary = useMemo(() => {
    const images: Array<{
      id: string;
      imageUrl: string;
      s3Key: string;
      label: string;
      isBase: boolean;
      isAngleReference?: boolean;
      isProductionHubUpload?: boolean;
      isCreationImage?: boolean;
      angle?: string;
      isRegenerated?: boolean;
      metadata?: any;
      index: number;
    }> = [];
    
    let index = 0;
    
    // Process Media Library files
    mediaFiles.forEach((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return;
      
      // Get metadata from DynamoDB (asset prop)
      const dynamoMetadata = dynamoDBMetadataMap.get(file.s3Key);
      
      // Determine image type from Media Library metadata or DynamoDB
      // Check if this is a Production Hub image (either AI-generated or user-uploaded in Production Hub)
      const isAngleReference = file.metadata?.source === 'angle-generation' ||
                                file.metadata?.uploadMethod === 'angle-generation' ||
                                (dynamoMetadata?.isAngleReference ?? false);
      const isProductionHubUpload = file.metadata?.createdIn === 'production-hub' ||
                                     file.metadata?.isProductionHub === true;
      // Image is from Creation section only if NOT from Production Hub (either AI or upload)
      const isCreationImage = !isAngleReference && !isProductionHubUpload;
      const isBase = dynamoMetadata?.isBase ?? (index === 0 && isCreationImage);
      
      // Get label from DynamoDB metadata or Media Library
      const label = dynamoMetadata?.label ||
                    file.fileName?.replace(/\.[^/.]+$/, '') ||
                    `${latestAsset.name} - Image ${index + 1}`;
      
      images.push({
        id: dynamoMetadata?.id || file.id || `img-${index}`,
        imageUrl: '', // Will be generated from s3Key via presigned URL
        s3Key: file.s3Key,
        label,
        isBase,
        isAngleReference,
        isProductionHubUpload, // User uploads from Production Hub
        isCreationImage, // Images from Creation section only
        angle: dynamoMetadata?.angle || file.metadata?.angle,
        isRegenerated: dynamoMetadata?.isRegenerated,
        metadata: { ...file.metadata, ...dynamoMetadata?.metadata },
        index
      });
      
      index++;
    });
    
    // Sort: creation images first (base first), then angle references
    return images.sort((a, b) => {
      if (a.isAngleReference !== b.isAngleReference) {
        return a.isAngleReference ? 1 : -1; // Creation images first
      }
      if (a.isBase !== b.isBase) {
        return a.isBase ? -1 : 1; // Base first
      }
      return a.index - b.index;
    });
  }, [mediaFiles, dynamoDBMetadataMap, latestAsset.name]);
  
  // Generate presigned URLs for Media Library images
  const mediaLibraryS3Keys = useMemo(() =>
    imagesFromMediaLibrary.map(img => img.s3Key).filter(Boolean),
    [imagesFromMediaLibrary]
  );
  
  const { data: mediaLibraryUrls = new Map() } = useBulkPresignedUrls(
    mediaLibraryS3Keys.length > 0 ? mediaLibraryS3Keys : [],
    isOpen && mediaLibraryS3Keys.length > 0
  );
  
  // Enrich Media Library images with presigned URLs
  // 🔥 Feature 0200: Filter out images with expired/broken presigned URLs
  const enrichedMediaLibraryImages = useMemo(() => {
    return imagesFromMediaLibrary
      .map(img => ({
        ...img,
        imageUrl: mediaLibraryUrls.get(img.s3Key) || img.imageUrl || ''
      }))
      .filter(img => {
        // Only include images with valid URLs (non-empty string)
        // This prevents broken images from appearing in the UI
        return !!img.imageUrl && img.imageUrl.length > 0;
      });
  }, [imagesFromMediaLibrary, mediaLibraryUrls]);
  
  // 🔥 FALLBACK: Use asset prop images if not in Media Library (for backward compatibility)
  const fallbackImages = useMemo(() => {
    const fallback: Array<{
      id: string;
      imageUrl: string;
      s3Key?: string;
      label: string;
      isBase: boolean;
      isAngleReference?: boolean;
      isProductionHubUpload?: boolean;
      isCreationImage?: boolean;
      angle?: string;
      isRegenerated?: boolean;
      metadata?: any;
      index: number;
    }> = [];
    const mediaLibraryS3KeysSet = new Set(mediaLibraryS3Keys);
    
    // Check creation images
    assetImages.forEach((img: any, idx: number) => {
      const source = img.metadata?.source;
      const createdIn = img.metadata?.createdIn;
      // 🔥 FIX: Check BOTH source AND createdIn to properly categorize images
      // Production Hub uploads set createdIn: 'production-hub', not source
      const isProductionHubImage = createdIn === 'production-hub' || 
                                    source === 'angle-generation' ||
                                    source === 'production-hub';
      const isCreationImage = !isProductionHubImage && (!source || source === 'user-upload');
      
      const s3Key = img.s3Key || img.metadata?.s3Key;
      if (s3Key && !mediaLibraryS3KeysSet.has(s3Key)) {
        fallback.push({
          id: `img-${idx}`,
          imageUrl: img.url || '',
          s3Key,
          label: `${latestAsset.name} - Image ${idx + 1}`,
          isBase: idx === 0,
          isAngleReference: source === 'angle-generation',
          isProductionHubUpload: isProductionHubImage && source !== 'angle-generation',
          isCreationImage: isCreationImage,
          metadata: img.metadata || {},
          index: fallback.length
        });
      }
    });
    
    // Check angleReferences
    const angleReferences = asset.angleReferences || [];
    angleReferences.forEach((ref: any) => {
      if (ref.s3Key && !mediaLibraryS3KeysSet.has(ref.s3Key)) {
        const isRegenerated = ref.metadata?.isRegenerated || false;
        fallback.push({
          id: ref.id || `angle-${ref.angle || 'unknown'}`,
          imageUrl: ref.imageUrl || '',
          s3Key: ref.s3Key,
          label: `${latestAsset.name} - ${ref.angle || 'Angle'} view`,
          isBase: false,
          isAngleReference: true,
          isProductionHubUpload: false, // AI-generated angles are not "uploads"
          isCreationImage: false, // Angle references are Production Hub images
          angle: ref.angle,
          isRegenerated,
          metadata: {
            s3Key: ref.s3Key,
            angle: ref.angle,
            source: 'angle-generation',
            createdIn: 'production-hub',
            creditsUsed: ref.creditsUsed || 0,
            providerId: ref.metadata?.providerId || ref.metadata?.generationMetadata?.providerId,
            quality: ref.metadata?.quality || ref.metadata?.generationMetadata?.quality,
            isRegenerated
          },
          index: fallback.length
        });
      }
    });
    
    return fallback;
  }, [latestAsset.images, latestAsset.angleReferences, latestAsset.name, mediaLibraryS3Keys]);
  
  // 🔥 COMBINED: Media Library images (primary) + Fallback images (from asset prop)
  // 🔥 Feature 0200: Filter out fallback images with empty imageUrl (expired files)
  const allImages = useMemo(() => {
    // Filter fallback images to only include those with valid URLs
    const validFallbackImages = fallbackImages.filter(img => !!img.imageUrl && img.imageUrl.length > 0);
    const combined = [...enrichedMediaLibraryImages, ...validFallbackImages];
    
    return combined;
  }, [enrichedMediaLibraryImages, fallbackImages]);
  
  // 🔥 DERIVED: Separate creation images and production hub images
  // userImages = Creation section images ONLY (not from Production Hub)
  const userImages = useMemo(() => {
    return allImages.filter(img => img.isCreationImage);
  }, [allImages]);
  
  // Production Hub images (AI-generated angles + user uploads from Production Hub)
  const angleImageObjects = useMemo(() => {
    return allImages.filter(img => img.isAngleReference || img.isProductionHubUpload);
  }, [allImages]);
  
  // 🔥 DERIVED: Get angleReferences for backward compatibility
  const angleReferences = useMemo(() => {
    return angleImageObjects.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      s3Key: img.s3Key || '',
      angle: (img.angle || 'front') as string,
      createdAt: img.metadata?.generatedAt || new Date().toISOString(),
      creditsUsed: img.metadata?.creditsUsed || 0,
      metadata: {
        ...img.metadata,
        isRegenerated: img.isRegenerated
      }
    }));
  }, [angleImageObjects]);
  
  // 🔥 NEW: Create thumbnail S3 key map from Media Library files
  const thumbnailS3KeyMap = useMemo(() => {
    const map = new Map<string, string>();
    mediaFiles.forEach((file: any) => {
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
      }
    });
    return map;
  }, [mediaFiles]);
  
  // 🔥 IMPROVED: Use reusable hook for thumbnail mapping (single source of truth)
  const { galleryImages: assetGalleryImages } = useThumbnailMapping({
    thumbnailS3KeyMap,
    images: allImages,
    isOpen,
    getThumbnailS3KeyFromMetadata: (img) => (img as any).metadata?.thumbnailS3Key || null,
    getImageSource: (img) => {
      const method = (img as any).metadata?.generationMethod;
      const source = (img as any).metadata?.source;
      return (method === 'ai-generated' || method === 'angle-variation' || source === 'angle-generation')
        ? 'pose-generation'
        : 'user-upload';
    },
    defaultAspectRatio: { width: 4, height: 3 }
  });
  
  // 🔥 NEW: Use thumbnail mapping for References tab (angleImageObjects)
  const { galleryImages: referenceGalleryImages } = useThumbnailMapping({
    thumbnailS3KeyMap,
    images: angleImageObjects,
    isOpen: isOpen && activeTab === 'references',
    getThumbnailS3KeyFromMetadata: (img) => (img as any).metadata?.thumbnailS3Key || null,
    getImageSource: () => 'pose-generation', // All angleImageObjects are AI-generated
    defaultAspectRatio: { width: 4, height: 3 }
  });
  
  // 🔥 NEW: Create a map for quick lookup of thumbnail URLs by image ID
  const referenceThumbnailMap = useMemo(() => {
    const map = new Map<string, string>();
    referenceGalleryImages.forEach((galleryImg) => {
      map.set(galleryImg.id, galleryImg.thumbnailUrl || galleryImg.imageUrl);
    });
    return map;
  }, [referenceGalleryImages]);
  
  const canGenerateAngles = userImages.length >= 1; // Need at least 1 creation image for angle generation
  
  // 🔥 DEBUG: Log asset images for troubleshooting
  useEffect(() => {
    if (isOpen) {
      console.log('[AssetDetailModal] Asset images:', {
        assetId: latestAsset.id,
        assetName: latestAsset.name,
        mediaLibraryFilesCount: mediaFiles.length,
        imagesFromMediaLibraryCount: imagesFromMediaLibrary.length,
        enrichedMediaLibraryImagesCount: enrichedMediaLibraryImages.length,
        fallbackImagesCount: fallbackImages.length,
        allImagesCount: allImages.length,
        userImagesCount: userImages.length,
        angleImageObjectsCount: angleImageObjects.length,
        canGenerateAngles,
      });
    }
  }, [isOpen, latestAsset.id, latestAsset.name, mediaFiles.length, imagesFromMediaLibrary.length, enrichedMediaLibraryImages.length, fallbackImages.length, allImages.length, userImages.length, angleImageObjects.length, canGenerateAngles]);

  const handleGeneratePackages = () => {
    // Switch to Generate tab
    setActiveTab('generate');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required. Please sign in.');
        setIsUploading(false);
        return;
      }

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (assetImages.length >= 5) {
          toast.error('Maximum 5 images per asset');
          break;
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`/api/asset-bank/${latestAsset.id}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload image');
        }
      }

      toast.success(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`);
      
      // 🔥 FIX: Aggressively clear and refetch asset queries (same pattern as Creation section)
      if (screenplayId) {
        queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
        queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
        queryClient.invalidateQueries({ 
          queryKey: ['media', 'files', screenplayId],
          exact: false
        });
        setTimeout(() => {
          queryClient.refetchQueries({ 
            queryKey: ['assets', screenplayId, 'production-hub'],
            type: 'active'
          });
          queryClient.refetchQueries({ 
            queryKey: ['media', 'files', screenplayId],
            exact: false
          });
        }, 2000);
      }
      
      // 🔥 ONE-WAY SYNC: Do NOT update ScreenplayContext - Production Hub changes stay in Production Hub
      // Production Hub image uploads should NOT sync back to Creation section
      
      onUpdate(); // Refresh asset data
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  // 🔥 Helper: Regenerate presigned URL from s3Key if image fails to load
  // Backend already provides fresh presigned URLs (24 hours) on every API call
  // This is just a fallback if URLs expire while modal is open
  const handleImageError = async (e: React.SyntheticEvent<HTMLImageElement>, img: any) => {
    const imgElement = e.target as HTMLImageElement;
    
    // Only regenerate if we have an s3Key and haven't already tried
    if (img.s3Key && !imgElement.dataset.retried) {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: img.s3Key,
            expiresIn: 3600, // 1 hour
          }),
        });
        
        if (response.ok) {
          const { downloadUrl } = await response.json();
          imgElement.src = downloadUrl;
          imgElement.dataset.retried = 'true';
        }
      } catch (error) {
        // Silently fail - image will show broken image icon
      }
    }
  };

  // 🔥 REMOVED: handleSave, handleCancel, handleDelete - assets should only be edited/deleted from Create page

  if (!isOpen) return null;

  const getCategoryIcon = (size: string = 'w-6 h-6') => {
    const icons = { prop: Package, vehicle: Car, furniture: Armchair, other: Box };
    const Icon = icons[latestAsset.category];
    return <Icon className={size} />;
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={`flex-shrink-0 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414] ${
              isMobile ? 'px-3 py-2.5' : 'px-6 py-4'
            }`}>
              <div className={`flex items-center gap-2 md:gap-4 flex-1 min-w-0 ${isMobile ? 'flex-col items-start' : ''}`}>
                {!isMobile && (
                  <div className="p-2 bg-[#DC143C]/10 rounded-lg flex-shrink-0">
                    {getCategoryIcon()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isMobile && (
                      <div className="p-1.5 bg-[#DC143C]/10 rounded flex-shrink-0">
                        {getCategoryIcon('w-4 h-4')}
                      </div>
                    )}
                    <h2 className={`font-bold text-[#FFFFFF] truncate ${isMobile ? 'text-base' : 'text-xl'}`}>
                      {latestAsset.name}
                    </h2>
                  </div>
                  {isMobile ? (
                    // Mobile: Compact single line
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[#808080] ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {categoryMeta.label}
                      </span>
                    </div>
                  ) : (
                    // Desktop: Full layout
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-[#808080]">{categoryMeta.label}</span>
                      {/* 🔥 READ-ONLY BADGE */}
                      <span className="px-2 py-0.5 bg-[#6B7280]/20 border border-[#6B7280]/50 rounded text-[10px] text-[#9CA3AF]">
                        Read-only - Edit in Creation section
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={onClose}
                  className={`hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF] ${
                    isMobile ? 'p-1.5' : 'p-2'
                  }`}
                >
                  <X className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 px-4 md:px-6 py-3 border-b border-[#3F3F46] bg-[#141414]">
              {isMobile ? (
                // Mobile: Dropdown menu
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-lg text-white text-sm font-medium transition-colors">
                      <div className="flex items-center gap-2">
                        {activeTab === 'references' ? (
                          <>
                            <Box className="w-4 h-4" />
                            <span>References ({allImages.length})</span>
                          </>
                        ) : activeTab === 'generate' ? (
                          <>
                            <span className="text-base">🤖</span>
                            <span>Generate Images</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            <span>Info</span>
                          </>
                        )}
                      </div>
                      <MoreVertical className="w-4 h-4 text-[#808080]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm bg-[#1F1F1F]/95 backdrop-blur-md border-[#3F3F46] shadow-xl">
                    {/* Generate - First (Primary CTA) */}
                    <DropdownMenuItem
                      onClick={() => {
                        setCoverageTab('generate');
                        setActiveTab('references');
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        coverageTab === 'generate'
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-white hover:bg-[#2A2A2A]'
                      }`}
                    >
                      <span className="text-base">🤖</span>
                      <span>Generate Images</span>
                      {coverageTab === 'generate' && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                    {/* Upload - Second */}
                    <DropdownMenuItem
                      onClick={() => {
                        setCoverageTab('upload');
                        setActiveTab('references');
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        coverageTab === 'upload'
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-white hover:bg-[#2A2A2A]'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Images</span>
                      {coverageTab === 'upload' && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                    <div className="border-t border-[#3F3F46] my-1"></div>
                    {/* References - Third */}
                    <DropdownMenuItem
                      onClick={() => {
                        setCoverageTab(null);
                        setActiveTab('references');
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        !coverageTab && activeTab === 'references'
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-[#808080] hover:bg-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      <Box className="w-4 h-4" />
                      <span>References ({allImages.length})</span>
                      {!coverageTab && activeTab === 'references' && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                    {/* Info - Fourth */}
                    <DropdownMenuItem
                      onClick={() => {
                        setCoverageTab(null);
                        setActiveTab('info');
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        !coverageTab && activeTab === 'info'
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-[#808080] hover:bg-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Info</span>
                      {!coverageTab && activeTab === 'info' && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Desktop: Horizontal button tabs
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCoverageTab(null);
                      setActiveTab('info');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !coverageTab && activeTab === 'info'
                        ? 'bg-[#DC143C] text-white'
                        : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Info
                  </button>
                  <button
                    onClick={() => {
                      setCoverageTab(null);
                      setActiveTab('references');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !coverageTab && activeTab === 'references'
                        ? 'bg-[#DC143C] text-white'
                        : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Box className="w-4 h-4 inline mr-2" />
                    References ({allImages.length})
                  </button>
                  
                  {/* Right side: Coverage buttons */}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCoverageTab('upload');
                        setActiveTab('references');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        coverageTab === 'upload'
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF]'
                      }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload Images
                    </button>
                    <button
                      onClick={() => {
                        setCoverageTab('generate');
                        setActiveTab('references');
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium ${
                        coverageTab === 'generate'
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF]'
                      }`}
                    >
                      <span className="text-base">🤖</span>
                      Generate Images
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {false && activeTab === 'gallery' && (
                <div className="p-6">
                  {assetGalleryImages.length > 0 ? (
                    <ModernGallery
                      images={assetGalleryImages}
                      layout="grid-only"
                      useImageId={true}
                      onImageClick={(imageIdOrIndex) => {
                        // 🔥 IMPROVED: Use stable identifier (id) instead of fragile index
                        if (typeof imageIdOrIndex === 'string') {
                          const actualIndex = allImages.findIndex(img => img.id === imageIdOrIndex);
                          if (actualIndex >= 0) {
                            setPreviewImageIndex(actualIndex);
                          }
                        } else {
                          // Fallback for backward compatibility
                          setPreviewImageIndex(imageIdOrIndex);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Box className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                      <p className="text-sm text-[#6B7280]">Upload images or generate angle references to get started</p>
                    </div>
                  )}
                </div>
              )}

              {!coverageTab && activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Asset Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Asset Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        <p className="text-[#FFFFFF]">{latestAsset.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Category</label>
                        <p className="text-[#FFFFFF]">{categoryMeta.label}</p>
                      </div>
                      {asset.description !== undefined && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                          <p className="text-[#808080]">{asset.description || <span className="italic">No description</span>}</p>
                        </div>
                      )}
                      {asset.tags !== undefined && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Tags</label>
                          {asset.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {asset.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-[#1F1F1F] text-[#808080] text-sm rounded-lg border border-[#3F3F46]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#808080] italic">No tags</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Metadata</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#808080]">Created:</span>
                        <span className="text-[#FFFFFF]">{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#808080]">Last Updated:</span>
                        <span className="text-[#FFFFFF]">{new Date(asset.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!coverageTab && activeTab === 'references' && (
                <div className="p-6 space-y-6">
                  {/* Phase 2: Selection Mode Toggle & Bulk Actions - Desktop only */}
                  {angleImageObjects.length > 0 && !isMobile && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-[#141414] border border-[#3F3F46] rounded-lg">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectionMode(!selectionMode);
                            if (selectionMode) {
                              setSelectedImageIds(new Set());
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectionMode
                              ? 'bg-[#DC143C] text-white'
                              : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                          }`}
                        >
                          {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          {selectionMode ? 'Selection Mode' : 'Select Multiple'}
                        </button>
                        {selectionMode && selectedImageIds.size > 0 && (
                          <span className="text-sm text-[#808080]">
                            {selectedImageIds.size} selected
                          </span>
                        )}
                      </div>
                      {selectionMode && (
                        <div className="flex items-center gap-2">
                          {selectedImageIds.size > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  if (selectedImageIds.size === angleImageObjects.length) {
                                    setSelectedImageIds(new Set());
                                  } else {
                                    setSelectedImageIds(new Set(angleImageObjects.map(img => img.id)));
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#808080] hover:text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                              >
                                {selectedImageIds.size === angleImageObjects.length ? 'Deselect All' : 'Select All'}
                              </button>
                              <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected ({selectedImageIds.size})
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 🔥 SEPARATION: Production Hub Images - Angle References (Editable/Deletable) */}
                  {angleImageObjects.length > 0 && (
                    <div className="p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            Production Hub Images ({angleImageObjects.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">AI-generated angle variations - can be edited/deleted here</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {angleImageObjects.map((img) => {
                          // All angleImages are Production Hub images (editable/deletable)
                          const isSelected = selectedImageIds.has(img.id);
                          // 🔥 NEW: Use thumbnail URL from mapping, fallback to full image
                          const displayUrl = referenceThumbnailMap.get(img.id) || img.imageUrl;
                          return (
                            <div
                              key={img.id}
                              className={`relative group aspect-video bg-[#141414] border rounded-lg overflow-hidden transition-colors cursor-pointer ${
                                selectionMode
                                  ? isSelected
                                    ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                    : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                                  : 'border-[#3F3F46] hover:border-[#DC143C]'
                              }`}
                              onClick={(e) => {
                                if (!selectionMode) {
                                  // Find index in all images
                                  const allAngleImages = [...userImages, ...angleImageObjects];
                                  const index = allAngleImages.findIndex(aImg => 
                                    aImg.id === img.id || aImg.s3Key === img.s3Key
                                  );
                                  if (index >= 0) {
                                    setPreviewImageIndex(index);
                                  }
                                }
                              }}
                            >
                              {/* Phase 2: Checkbox overlay in selection mode */}
                              {selectionMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSelection = new Set(selectedImageIds);
                                      if (isSelected) {
                                        newSelection.delete(img.id);
                                      } else {
                                        newSelection.add(img.id);
                                      }
                                      setSelectedImageIds(newSelection);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isSelected
                                        ? 'bg-[#DC143C] text-white'
                                        : 'bg-[#0A0A0A]/80 text-[#808080] hover:bg-[#1F1F1F]'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                              <img
                                src={displayUrl}
                                alt={img.label}
                                className={`w-full h-full object-cover ${
                                  regeneratingS3Key && regeneratingS3Key.trim() === (img.s3Key || '').trim()
                                    ? 'animate-pulse opacity-75'
                                    : ''
                                }`}
                                style={{
                                  // 🔥 FIX: Prevent blurriness from upscaling - use crisp rendering for thumbnails
                                  imageRendering: displayUrl !== img.imageUrl ? 'crisp-edges' : 'auto',
                                  maxWidth: '640px',
                                  maxHeight: '360px' // 16:9 aspect ratio (640/1.777 = 360)
                                }}
                                loading="lazy"
                                onError={(e) => {
                                  // 🔥 NEW: Fallback to full image if thumbnail fails
                                  if (displayUrl !== img.imageUrl) {
                                    (e.target as HTMLImageElement).src = img.imageUrl;
                                  } else {
                                    handleImageError(e, img);
                                  }
                                }}
                              />
                              {/* Shimmer overlay for regenerating images */}
                              {regeneratingS3Key && regeneratingS3Key.trim() === (img.s3Key || '').trim() && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                              )}
                              {/* Top-left label: Angle/Regenerated */}
                              <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-white text-[10px] rounded ${
                                img.isRegenerated ? 'bg-[#DC143C]' : 'bg-[#8B5CF6]'
                              }`}>
                                {img.isRegenerated ? 'Regenerated' : 'Angle'}
                              </div>
                              {/* Bottom-right label: Provider */}
                              {(() => {
                                // Check multiple possible paths for providerId (like Locations do)
                                const providerId = (img.metadata as any)?.providerId 
                                  || (img.metadata as any)?.generationMetadata?.providerId;
                                if (!providerId) return null;
                                const providerLabel = getProviderLabel(providerId);
                                if (!providerLabel) return null;
                                return (
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                    {providerLabel}
                                  </div>
                                );
                              })()}
                              {/* Three dots dropdown - always visible (not in hover div) */}
                              {!img.isBase && !selectionMode && (
                                <div className="absolute top-2 right-2 pointer-events-auto z-20">
                                  <DropdownMenu
                                    open={openDropdownId === img.id}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setOpenDropdownId(img.id);
                                      } else {
                                        setOpenDropdownId(null);
                                      }
                                    }}
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className={`${isMobile ? 'p-1.5 bg-[#DC143C]' : 'p-2 bg-[#DC143C]/90 hover:bg-[#DC143C]'} rounded-lg transition-colors ${isMobile ? 'min-w-[32px] min-h-[32px]' : 'min-w-[36px] min-h-[36px]'} flex items-center justify-center shadow-lg`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Close other dropdowns when opening this one
                                          if (openDropdownId !== img.id) {
                                            setOpenDropdownId(img.id);
                                          }
                                        }}
                                      >
                                        <MoreVertical className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent 
                                    align="end"
                                    className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none"
                                    style={{ backgroundColor: '#0A0A0A' }}
                                  >
                                    <DropdownMenuItem
                                      className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Find index in angleImageObjects (all angle images)
                                        const allAngleImages = [...userImages, ...angleImageObjects];
                                        const index = allAngleImages.findIndex(aImg => 
                                          aImg.id === img.id || aImg.s3Key === img.s3Key
                                        );
                                        if (index >= 0) {
                                          setPreviewImageIndex(index);
                                        }
                                      }}
                                    >
                                      <Eye className="w-4 h-4 mr-2 text-[#808080]" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          // Generate filename from metadata
                                          const angle = img.metadata?.angle || img.angle || 'angle';
                                          const filename = `${latestAsset.name}_${angle.replace(/[^a-zA-Z0-9]/g, '-')}_${Date.now()}.jpg`;
                                          await downloadImageAsBlob(img.imageUrl, filename, img.s3Key);
                                        } catch (error: any) {
                                          toast.error('Failed to download image');
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-2 text-[#808080]" />
                                      Download
                                    </DropdownMenuItem>
                                    {/* 🔥 NEW: Flip option (all angles can be flipped) */}
                                    {img.s3Key && (
                                      <DropdownMenuItem
                                        className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={flippingAngleId === img.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFlipAngle(img.id, img.s3Key);
                                        }}
                                      >
                                        <FlipHorizontal className="w-4 h-4 mr-2 text-[#808080]" />
                                        {flippingAngleId === img.id ? 'Flipping...' : 'Flip Horizontal'}
                                      </DropdownMenuItem>
                                    )}
                                    {/* 🔥 NEW: Regenerate option (only for AI-generated angles with id) */}
                                    {img.id && img.s3Key && (img.metadata?.angle || img.angle) && (
                                      <DropdownMenuItem
                                        className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Don't allow if ANY regeneration is in progress
                                          if (isRegenerating) {
                                            return;
                                          }
                                          // Show warning modal before regenerating
                                          setRegenerateAngle({
                                            angleId: img.id,
                                            s3Key: img.s3Key!,
                                            angle: img.metadata?.angle || img.angle || 'angle',
                                            metadata: img.metadata, // 🔥 FIX: Pass metadata for providerId/quality
                                          });
                                        }}
                                        disabled={isRegenerating}
                                      >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {regeneratingS3Key === img.s3Key ? 'Regenerating...' : 'Regenerate'}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Delete this angle image? This action cannot be undone.')) {
                                          return;
                                        }
                                        
                                        try {
                                          if (!img.s3Key) {
                                            throw new Error('Missing S3 key for image');
                                          }
                                          
                                          // 🔥 FIX: Delete from Media Library first (source of truth) - EXACT same pattern as location backgrounds
                                          const token = await getToken({ template: 'wryda-backend' });
                                          try {
                                            const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                                            await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({ s3Key: img.s3Key }),
                                            });
                                          } catch (mediaError: any) {
                                            console.warn('[AssetDetailModal] Failed to delete from Media Library (non-fatal):', mediaError);
                                            // Continue with asset update even if Media Library deletion fails
                                          }
                                          
                                          // 🔥 DEFENSIVE FIX: Remove from BOTH angleReferences AND images arrays
                                          // This handles edge cases where image might be in either array
                                          const updatedAngleReferences = (latestAsset.angleReferences || []).filter(
                                            (ref: any) => ref.s3Key !== img.s3Key
                                          );
                                          const updatedImages = (latestAsset.images || []).filter(
                                            (imgRef: any) => {
                                              const imgS3Key = imgRef.s3Key || imgRef.metadata?.s3Key;
                                              return imgS3Key !== img.s3Key;
                                            }
                                          );
                                          
                                          // 🔥 OPTIMISTIC UPDATE: Immediately update React Query cache before backend call
                                          queryClient.setQueryData<Asset[]>(['assets', screenplayId, 'production-hub'], (old) => {
                                            if (!old) return old;
                                            return old.map(a => 
                                              a.id === latestAsset.id
                                                ? { ...a, angleReferences: updatedAngleReferences, images: updatedImages }
                                                : a
                                            );
                                          });
                                          
                                          // 🔥 ONE-WAY SYNC: Update Production Hub backend with both arrays
                                          const response = await fetch(`/api/asset-bank/${latestAsset.id}?screenplayId=${encodeURIComponent(screenplayId)}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                              angleReferences: updatedAngleReferences,
                                              images: updatedImages
                                            }),
                                          });
                                          
                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.error || 'Failed to delete image');
                                          }
                                          
                                          // 🔥 FIX: Aggressively clear and refetch asset queries (same pattern as Creation section)
                                          queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                                          queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                                          queryClient.invalidateQueries({ 
                                            queryKey: ['media', 'files', screenplayId],
                                            exact: false
                                          });
                                          setTimeout(() => {
                                            queryClient.refetchQueries({ 
                                              queryKey: ['assets', screenplayId, 'production-hub'],
                                              type: 'active'
                                            });
                                            queryClient.refetchQueries({ 
                                              queryKey: ['media', 'files', screenplayId],
                                              exact: false
                                            });
                                          }, 2000);
                                          
                                          onUpdate(); // Refresh asset list in parent
                                          toast.success('Image deleted');
                                        } catch (error: any) {
                                          console.error('[AssetDetailModal] Failed to delete image:', error);
                                          toast.error(`Failed to delete image: ${error.message}`);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                            {/* Label overlay - shown on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent transition-opacity pointer-events-none ${
                              selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                                <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                              </div>
                            </div>
                          </div>
                      );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 SEPARATION: Creation Section Images - User Uploaded (Read-Only) */}
                  {userImages.length > 0 && (
                    <div className="p-4 bg-[#0F0F0F] rounded-lg border border-[#3F3F46]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3F3F46]">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Reference Images from Creation ({userImages.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Uploaded in Creation section - view only (delete in Creation section)</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {userImages.map((img) => {
                          return (
                            <div
                              key={img.id}
                              className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden opacity-75"
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
                                onError={(e) => handleImageError(e, img)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Info icon - read-only indicator */}
                                <div className="absolute top-2 right-2">
                                  <div className="p-1.5 bg-[#1F1F1F]/80 rounded-lg" title="Uploaded in Creation section - delete there">
                                    <Info className="w-3 h-3 text-[#808080]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {angleImageObjects.length === 0 && userImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No reference images yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Coverage Tabs (Upload or Generate) */}
              {coverageTab === 'upload' && (
                <UploadAssetImagesTab
                  assetId={latestAsset.id}
                  assetName={latestAsset.name}
                  screenplayId={screenplayId || ''}
                  existingImages={latestAsset.images || []}
                  onComplete={async (result) => {
                    queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                    queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
                    await queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                    toast.success(`Successfully added ${result.images.length} image(s) to ${result.angleName}`);
                    setCoverageTab(null);
                  }}
                />
              )}

              {coverageTab === 'generate' && (
                <GenerateAssetTab
                  assetId={latestAsset.id}
                  assetName={latestAsset.name}
                  screenplayId={screenplayId || ''}
                  asset={latestAsset}
                  onClose={() => setCoverageTab(null)}
                  onComplete={async (result) => {
                    if (result?.jobId) {
                      toast.success('Angle generation started!', {
                        description: 'View in Jobs tab to track progress.',
                        duration: 5000
                      });
                    }
                    setCoverageTab(null);
                  }}
                />
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    {/* 🔥 NEW: Regenerate Confirmation Modal */}
    <RegenerateConfirmModal
      isOpen={regenerateAngle !== null && regeneratingS3Key === null}
      onClose={() => {
        if (regeneratingS3Key === null) {
          setRegenerateAngle(null);
        }
      }}
      onConfirm={() => {
        if (regenerateAngle && regeneratingS3Key === null) {
          handleRegenerateAngle(regenerateAngle.angleId, regenerateAngle.s3Key, regenerateAngle.angle, regenerateAngle.metadata);
        }
      }}
      imageType="angle"
    />
    
    {/* Image Viewer */}
    {previewImageIndex !== null && (() => {
      const allAngleImages = [...userImages, ...angleImageObjects];
      return (
        <ImageViewer
          images={allAngleImages.map((img): ImageItem => ({
            id: img.id,
            url: img.imageUrl,
            label: img.label,
            s3Key: img.s3Key,
            metadata: img.metadata || { angle: (img as any).angle }
          }))}
          currentIndex={previewImageIndex}
          isOpen={previewImageIndex !== null}
          onClose={() => setPreviewImageIndex(null)}
          onDownload={async (image) => {
            try {
              const angle = image.metadata?.angle || 'angle';
              const filename = `${asset.name}_${angle.replace(/[^a-zA-Z0-9]/g, '-')}_${Date.now()}.jpg`;
              await downloadImageAsBlob(image.url, filename, image.s3Key);
            } catch (error: any) {
              toast.error('Failed to download image');
            }
          }}
        />
      );
    })()}

    {/* Phase 2: Bulk Delete Confirmation Dialog */}
    {showBulkDeleteConfirm && (
      <div className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 max-w-md w-full shadow-2xl"
        >
          <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">Delete Selected Images?</h3>
          <p className="text-sm text-[#808080] mb-6">
            Are you sure you want to delete {selectedImageIds.size} image{selectedImageIds.size !== 1 ? 's' : ''}? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setShowBulkDeleteConfirm(false);
                try {
                  // Get selected images by matching IDs
                  const selectedImages = angleImageObjects.filter(img => selectedImageIds.has(img.id));
                  
                  // Extract s3Keys
                  const s3KeysToDelete = new Set(selectedImages.map(img => img.s3Key).filter(Boolean));
                  
                  if (s3KeysToDelete.size === 0) {
                    toast.error('No valid images to delete');
                    return;
                  }
                  
                  // 🔥 FIX: Delete from Media Library first (source of truth) - batch delete (EXACT same pattern as location backgrounds)
                  const token = await getToken({ template: 'wryda-backend' });
                  const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                  for (const s3Key of s3KeysToDelete) {
                    try {
                      await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ s3Key }),
                      });
                    } catch (mediaError: any) {
                      console.warn('[AssetDetailModal] Failed to delete from Media Library (non-fatal):', mediaError);
                      // Continue with asset update even if Media Library deletion fails
                    }
                  }
                  
                  // 🔥 DEFENSIVE FIX: Remove from BOTH angleReferences AND images arrays
                  // This handles edge cases where image might be in either array
                  const updatedAngleReferences = (latestAsset.angleReferences || []).filter((ref: any) => 
                    !s3KeysToDelete.has(ref.s3Key)
                  );
                  const updatedImages = (latestAsset.images || []).filter((imgRef: any) => {
                    const imgS3Key = imgRef.s3Key || imgRef.metadata?.s3Key;
                    return !s3KeysToDelete.has(imgS3Key);
                  });
                  
                  // 🔥 OPTIMISTIC UPDATE: Immediately update React Query cache before backend call
                  queryClient.setQueryData<Asset[]>(['assets', screenplayId, 'production-hub'], (old) => {
                    if (!old) return old;
                    return old.map(a => 
                      a.id === latestAsset.id
                        ? { ...a, angleReferences: updatedAngleReferences, images: updatedImages }
                        : a
                    );
                  });
                  
                  // Make API call to update asset with both arrays
                  const response = await fetch(`/api/asset-bank/${latestAsset.id}?screenplayId=${encodeURIComponent(screenplayId)}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      angleReferences: updatedAngleReferences,
                      images: updatedImages
                    }),
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to delete images');
                  }
                  
                  // 🔥 FIX: Aggressively clear and refetch asset queries (same pattern as Creation section)
                  queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                  queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                  queryClient.invalidateQueries({ 
                    queryKey: ['media', 'files', screenplayId],
                    exact: false
                  });
                  setTimeout(() => {
                    queryClient.refetchQueries({ 
                      queryKey: ['assets', screenplayId, 'production-hub'],
                      type: 'active'
                    });
                    queryClient.refetchQueries({ 
                      queryKey: ['media', 'files', screenplayId],
                      exact: false
                    });
                  }, 2000);
                  
                  // Trigger parent update
                  onUpdate();
                  
                  // Update asset via callback if provided
                  if (onAssetUpdate) {
                    onAssetUpdate({
                      ...latestAsset,
                      angleReferences: updatedAngleReferences,
                      images: updatedImages
                    });
                  }
                  
                  // Clear selection and exit selection mode
                  setSelectedImageIds(new Set());
                  setSelectionMode(false);
                  
                  toast.success(`Successfully deleted ${s3KeysToDelete.size} image${s3KeysToDelete.size !== 1 ? 's' : ''}`);
                } catch (error: any) {
                  console.error('[AssetDetailModal] Bulk deletion error:', error);
                  toast.error(`Failed to delete images: ${error.message}`);
                }
              }}
              className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete {selectedImageIds.size} Image{selectedImageIds.size !== 1 ? 's' : ''}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </>
  );
}
