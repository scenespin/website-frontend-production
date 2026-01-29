'use client';

/**
 * LocationDetailModal - Full-screen location detail view
 * 
 * Features:
 * - Image gallery (main + references with thumbnail grid)
 * - Description and info from script
 * - Uploaded images management
 * - Three tabs: Gallery, Info, References
 * - Full-screen modal with cinema theme
 * 
 * Consistent with CharacterDetailModal for scene consistency and AI generation
 */

import React, { useState, useMemo } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, MapPin, FileText, Box, Download, Trash2, Plus, Camera, MoreVertical, Info, Eye, CheckSquare, Square, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import LocationAngleGenerationModal from './LocationAngleGenerationModal';
import { GenerateLocationTab } from './Coverage/GenerateLocationTab';
import { UploadLocationImagesTab } from './Coverage/UploadLocationImagesTab';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useLocations } from '@/hooks/useLocationBank';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { RegenerateConfirmModal } from './RegenerateConfirmModal';
import { ModernGallery } from './Gallery/ModernGallery';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { useThumbnailMapping } from '@/hooks/useThumbnailMapping';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Get display label for provider ID (all location angle/background image models)
 */
function getProviderLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  
  const providerMap: Record<string, string> = {
    'nano-banana-pro': 'Nano Banana Pro',
    'nano-banana-pro-2k': 'Nano Banana Pro 2K',
    'runway-gen4-image': 'Gen4',
    'luma-photon-1': 'Photon',
    'luma-photon-flash': 'Photon',
    'flux2-max-4k-16:9': 'FLUX.2 [max]',
    'flux2-max-2k': 'FLUX.2 [max]',
    'flux2-pro-4k': 'FLUX.2 [pro]',
    'flux2-pro-2k': 'FLUX.2 [pro]',
    'flux2-flex': 'FLUX.2 [flex]',
    'imagen-3-fast': 'Imagen 3 Fast',
    'imagen-4-fast': 'Imagen 4 Fast',
    'imagen-3': 'Imagen 3',
    'imagen-4': 'Imagen 4',
  };
  
  return providerMap[providerId] || null;
}

/** Resolution tag for provider (2K, 4K, or null) */
function getResolutionLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  const twoK = ['nano-banana-pro-2k', 'flux2-pro-2k', 'flux2-max-2k'];
  const fourK = ['nano-banana-pro', 'flux2-max-4k-16:9', 'flux2-pro-4k'];
  if (twoK.includes(providerId)) return '2K';
  if (fourK.includes(providerId)) return '4K';
  return null;
}

// Location Profile from Location Bank API (Feature 0142: Unified storage)
interface LocationReference {
  id: string;
  locationId: string;
  imageUrl: string;
  s3Key: string;
  angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail' | 'corner' | 'low-angle' | 'entrance' | 'foreground-framing' | 'pov' | 'atmospheric' | 'golden-hour' | 'back-view' | 'close-up' | 'establishing';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
  creditsUsed: number;
  createdAt: string;
  // 🔥 NEW: Generation metadata for exact regeneration
  metadata?: {
    generationPrompt?: string;
    providerId?: string;
    quality?: 'standard' | 'high-quality';
    referenceImageUrls?: string[];
    generatedAt?: string;
    isRegenerated?: boolean;
    // ✅ Images are now generated directly at 16:9 (or 21:9) - no cropping needed
    // No crop-related metadata needed anymore
    cropMethod?: 'center' | 'user-defined'; // Crop method used
    aspectRatio?: '16:9' | '21:9'; // Final aspect ratio shown to user
    autoCropped?: boolean; // Flag indicating this was auto-cropped
  };
}

interface LocationBackground {
  id: string;
  imageUrl?: string;
  s3Key: string;
  backgroundType: 'window' | 'wall' | 'doorway' | 'texture' | 'corner-detail' | 'furniture' | 'architectural-feature' | 'custom';
  description?: string;
  sourceType?: 'reference-images' | 'angle-variations';
  sourceAngleId?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'ai-generated' | 'angle-crop' | 'upload';
  creditsUsed: number;
  createdAt: string;
  metadata?: {
    generationPrompt?: string;
    providerId?: string;
    quality?: 'standard' | 'high-quality';
    referenceImageUrls?: string[];
    generatedAt?: string;
  };
}

interface LocationProfile {
  locationId: string;
  screenplayId: string;
  projectId: string; // Backward compatibility
  name: string;
  type: 'interior' | 'exterior' | 'mixed';
  description: string;
  baseReference: LocationReference;
  angleVariations: LocationReference[];
  creationImages?: LocationReference[]; // 🔥 NEW: All images uploaded in Creation section
  backgrounds?: LocationBackground[]; // Feature: Background variations (close-up views)
  totalCreditsSpent?: number;
  consistencyRating?: number;
  createdAt: string;
  updatedAt: string;
}

interface LocationDetailModalProps {
  location: LocationProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (locationId: string, updates: Partial<LocationProfile>) => void;
  onDelete?: (locationId: string) => void;
  // Removed projectId prop - screenplayId comes from ScreenplayContext
  onUploadImage?: (locationId: string, file: File) => Promise<void>;
  onGenerateAngles?: (locationId: string) => Promise<void>;
}

export function LocationDetailModal({
  location,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onUploadImage,
  onGenerateAngles
}: LocationDetailModalProps) {
  // 🔥 FIX: Get screenplayId from context instead of props
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  
  // 🔥 ONE-WAY SYNC: Production Hub reads from ScreenplayContext but doesn't update it
  // Removed updateLocation - Production Hub changes stay in Production Hub
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // 🔥 FIX: Get latest location from React Query cache (always up-to-date)
  // This ensures UI updates immediately when cache changes (optimistic updates + refetches)
  const { data: queryLocations = [] } = useLocations(
    screenplayId || '',
    'production-hub',
    !!screenplayId && isOpen // Only fetch when modal is open
  );
  
  // Get latest location from React Query, fallback to prop
  const latestLocation = useMemo(() => {
    const queryLoc = queryLocations.find(l => l.locationId === location.locationId);
    if (queryLoc) {
      // Use query location (always fresh from cache)
      return queryLoc;
    }
    // Fallback to prop if not in cache yet
    return location;
  }, [queryLocations, location.locationId]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references' | 'generate'>('references');
  // 🔥 Feature 0192: Coverage tab for upload/generate
  const [coverageTab, setCoverageTab] = useState<'upload' | 'generate' | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [previewGroupName, setPreviewGroupName] = useState<string | null>(null);
  const { getToken } = useAuth();
  // Phase 2: Multiple Delete Checkbox
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  // 🔥 NEW: Regeneration state
  const [regenerateAngle, setRegenerateAngle] = useState<{ angleId: string; s3Key: string; angle: string; variation?: LocationReference } | null>(null);
  const [regenerateBackground, setRegenerateBackground] = useState<{ backgroundId: string; s3Key: string; backgroundType: string; background?: LocationBackground } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingS3Key, setRegeneratingS3Key] = useState<string | null>(null); // Track which specific image is regenerating
  const [flippingAngleId, setFlippingAngleId] = useState<string | null>(null);
  // Track which dropdown is open (only one at a time)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // 🔥 CRITICAL: Don't render until screenplayId is available (after all hooks are called)
  if (!screenplayId) {
    return null;
  }

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
          console.error('[LocationDetailModal] Failed to get presigned URL, using original URL:', error);
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
      console.error('[LocationDetailModal] Failed to download image:', error);
      throw error;
    }
  };

  // 🔥 NEW: Handle angle regeneration
  const handleRegenerateAngle = async (angleId: string, existingAngleS3Key: string, angle: string, variation?: LocationReference) => {
    if (!angleId || !existingAngleS3Key || !angle) {
      toast.error('Missing angle information for regeneration');
      return;
    }

    // 🔥 CRITICAL: Set regenerating state IMMEDIATELY before any async operations
    // This ensures the UI updates synchronously before the fetch starts
    const s3KeyToTrack = existingAngleS3Key.trim();
    setIsRegenerating(true);
    setRegeneratingS3Key(s3KeyToTrack); // Track which image is regenerating - set BEFORE closing modal
    setRegenerateAngle(null); // Close modal AFTER state is set
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      const response = await fetch(`${BACKEND_API_URL}/api/location-bank/${location.locationId}/regenerate-angle?screenplayId=${screenplayId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          angleId,
          existingAngleS3Key,
          angle,
          cameraPosition: variation?.angle || angle,
          timeOfDay: variation?.timeOfDay,
          weather: variation?.weather,
          // 🔥 FIX: Send providerId and quality from stored metadata if available, otherwise use defaults
          providerId: variation?.metadata?.providerId || undefined,
          quality: variation?.metadata?.quality || 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to regenerate angle: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Immediately refetch to update UI (like assets do)
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'] }),
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] })
      ]);
      
      // No toast notification - silent update like assets
    } catch (error: any) {
      console.error('[LocationDetailModal] Failed to regenerate angle:', error);
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
      const response = await fetch(`${BACKEND_API_URL}/api/location-bank/${location.locationId}/flip-angle?screenplayId=${screenplayId}`, {
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
      
      // Refresh location data after flip (same pattern as regenerate)
      // Also invalidate presigned URLs so new images get fresh URLs
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ 
        queryKey: ['media', 'presigned-urls'],
        exact: false // Invalidate all presigned URL queries (they have dynamic keys)
      });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'] }),
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] }),
        queryClient.refetchQueries({ 
          queryKey: ['media', 'presigned-urls'],
          exact: false // Refetch all presigned URL queries
        })
      ]);
      
      toast.success('Angle flipped successfully');
    } catch (error: any) {
      console.error('[LocationDetailModal] Failed to flip angle:', error);
      toast.error(`Failed to flip angle: ${error.message || 'Unknown error'}`);
    } finally {
      setFlippingAngleId(null);
    }
  };

  // 🔥 NEW: Handle background regeneration
  const handleRegenerateBackground = async (backgroundId: string, existingBackgroundS3Key: string, backgroundType: string, background?: LocationBackground) => {
    if (!backgroundId || !existingBackgroundS3Key || !backgroundType) {
      toast.error('Missing background information for regeneration');
      return;
    }

    // 🔥 CRITICAL: Set regenerating state IMMEDIATELY before any async operations
    const s3KeyToTrack = existingBackgroundS3Key.trim();
    setIsRegenerating(true);
    setRegeneratingS3Key(s3KeyToTrack); // Track which image is regenerating - set BEFORE closing modal
    setRegenerateBackground(null); // Close modal AFTER state is set
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      const response = await fetch(`${BACKEND_API_URL}/api/location-bank/${location.locationId}/regenerate-background?screenplayId=${screenplayId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backgroundId,
          existingBackgroundS3Key,
          backgroundType,
          timeOfDay: background?.timeOfDay,
          weather: background?.weather,
          // 🔥 FIX: Send providerId and quality from stored metadata if available, otherwise use defaults
          providerId: background?.metadata?.providerId || undefined,
          quality: background?.metadata?.quality || 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to regenerate background: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Immediately refetch to update UI (like angles do)
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'] }),
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] })
      ]);
      
      // No toast notification - silent update like angles
    } catch (error: any) {
      console.error('[LocationDetailModal] Failed to regenerate background:', error);
      toast.error(`Failed to regenerate background: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRegenerating(false);
      setRegeneratingS3Key(null); // Clear regenerating state
    }
  };

  async function handleDeleteBackground(background: LocationBackground) {
    if (!confirm('Delete this background image? This action cannot be undone.')) return;
    try {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ s3Key: background.s3Key })
        });
      } catch {
        /* non-fatal */
      }
      const updatedBackgrounds = backgrounds.filter((b) => b.s3Key !== background.s3Key) as LocationBackground[];
      await onUpdate(location.locationId, { backgrounds: updatedBackgrounds });
      queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId], exact: false });
      queryClient.invalidateQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'], type: 'active' });
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId], exact: false });
        queryClient.refetchQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
      }, 2000);
      toast.success('Background image deleted');
    } catch (err: any) {
      toast.error(`Failed to delete image: ${err.message}`);
    }
  }
  
  // 🔥 PHASE 1: Media Library as Primary Source
  // Query Media Library FIRST for active files (angles + backgrounds)
  
  // Feature 0179: Query Media Library to get active files for location
  const { data: entityMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    isOpen && !!screenplayId,
    true, // includeAllFolders
    'location', // entityType
    location.locationId // entityId
  );
  
  // 🔥 REMOVED: Fallback query - all files are new and properly indexed, so entityMediaFiles is sufficient
  // This matches the working pattern used by angles/assets
  
  // Use entity files directly (same pattern as angles/assets - no fallback needed)
  const mediaFiles = useMemo(() => {
    return entityMediaFiles;
  }, [entityMediaFiles]);
  
  // Create metadata maps from location prop (DynamoDB) for enrichment
  const dynamoDBMetadataMap = useMemo(() => {
    const map = new Map<string, any>();
    
    // Add baseReference metadata
    if (location.baseReference?.s3Key) {
      map.set(latestLocation.baseReference.s3Key, {
        id: latestLocation.baseReference.id,
        label: `${latestLocation.name} - Base Reference`,
        isBase: true,
        isAngle: false,
        isBackground: false,
        generationMethod: location.baseReference.generationMethod || 'upload'
      });
    }
    
    // Add creationImages metadata (if it exists on the location)
    ((latestLocation as any).creationImages || []).forEach((img: LocationReference) => {
      if (img.s3Key) {
        map.set(img.s3Key, {
          id: img.id,
          label: `${latestLocation.name} - Reference`,
          isBase: false,
          isAngle: false,
          isBackground: false,
          generationMethod: img.generationMethod || 'upload'
        });
      }
    });
    
    // Add angleVariations metadata (from DynamoDB)
    (latestLocation.angleVariations || []).forEach((variation: LocationReference) => {
      if (variation.s3Key) {
        map.set(variation.s3Key, {
          id: variation.id || `ref_${variation.s3Key}`,
          label: `${latestLocation.name} - ${variation.angle} view`,
          isBase: false,
          isAngle: true,
          isBackground: false,
          angle: variation.angle,
          timeOfDay: variation.timeOfDay,
          weather: variation.weather,
          generationMethod: variation.generationMethod || 'angle-variation',
          isRegenerated: variation.metadata?.isRegenerated || false,
          metadata: variation.metadata || {}
        });
      }
    });
    
    // Add backgrounds metadata (from DynamoDB)
    (latestLocation.backgrounds || []).forEach((background: LocationBackground) => {
      if (background.s3Key) {
        const backgroundTypeLabels: Record<string, string> = {
          'window': 'Window',
          'wall': 'Wall',
          'doorway': 'Doorway',
          'texture': 'Texture',
          'corner-detail': 'Corner Detail',
          'furniture': 'Furniture',
          'architectural-feature': 'Architectural Feature',
          'custom': background.description || 'Custom Background'
        };
        const typeLabel = backgroundTypeLabels[background.backgroundType] || background.backgroundType;
        const descriptionLabel = background.description ? ` - ${background.description}` : '';
        
        map.set(background.s3Key, {
          id: background.id || `bg_${background.s3Key}`,
          label: `${latestLocation.name} - ${typeLabel}${descriptionLabel}`,
          isBase: false,
          isAngle: false,
          isBackground: true,
          backgroundType: background.backgroundType,
          timeOfDay: background.timeOfDay,
          weather: background.weather,
          generationMethod: background.generationMethod || 'background-generation',
          metadata: background.metadata || {}
        });
      }
    });
    
    return map;
  }, [latestLocation.baseReference, (latestLocation as any).creationImages, latestLocation.angleVariations, latestLocation.backgrounds, latestLocation.name, latestLocation.locationId]);
  
  // Build images from Media Library FIRST (primary source), enrich with DynamoDB metadata
  const imagesFromMediaLibrary = useMemo(() => {
    const images: Array<{
      id: string;
      imageUrl: string;
      s3Key: string;
      label: string;
      isBase: boolean;
      isAngle?: boolean;
      isBackground?: boolean;
      angle?: string;
      timeOfDay?: string;
      weather?: string;
      backgroundType?: string;
      isRegenerated?: boolean;
      metadata?: any;
      index: number;
    }> = [];
    
    let index = 0;
    
    // Process Media Library files
    mediaFiles.forEach((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return;
      
      // Get metadata from DynamoDB (location prop)
      const dynamoMetadata = dynamoDBMetadataMap.get(file.s3Key);
      
      // Determine image type from Media Library metadata or DynamoDB
      // Check explicit flags first (from user uploads), then generation sources, then DynamoDB fallback
      const isAngle = file.metadata?.isAngle === true ||
                      file.metadata?.source === 'angle-generation' ||
                      file.metadata?.uploadMethod === 'angle-generation' ||
                      (dynamoMetadata?.isAngle ?? false);
      const isBackground = file.metadata?.isBackground === true ||
                           file.metadata?.source === 'background-generation' ||
                           file.metadata?.uploadMethod === 'background-generation' ||
                           (dynamoMetadata?.isBackground ?? false);
      const isBase = dynamoMetadata?.isBase ?? false;
      
      // Get label from DynamoDB metadata or Media Library
      const label = dynamoMetadata?.label ||
                    file.fileName?.replace(/\.[^/.]+$/, '') ||
                    'Image';
      
      images.push({
        id: dynamoMetadata?.id || file.id || `img-${index}`,
        imageUrl: '', // Will be generated from s3Key via presigned URL
        s3Key: file.s3Key,
        label,
        isBase,
        isAngle,
        isBackground,
        angle: dynamoMetadata?.angle,
        timeOfDay: dynamoMetadata?.timeOfDay || file.metadata?.timeOfDay,
        weather: dynamoMetadata?.weather || file.metadata?.weather,
        backgroundType: dynamoMetadata?.backgroundType,
        isRegenerated: dynamoMetadata?.isRegenerated,
        metadata: { ...file.metadata, ...dynamoMetadata?.metadata },
        index
      });
    });
    
    return images;
  }, [mediaFiles, dynamoDBMetadataMap]);
  
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
  
  // 🔥 FALLBACK: Use location prop images if not in Media Library (for backward compatibility)
  const fallbackImages = useMemo(() => {
    const fallback: Array<{
      id: string;
      imageUrl: string;
      s3Key?: string;
      label: string;
      isBase: boolean;
      isAngle?: boolean;
      isBackground?: boolean;
      angle?: string;
      timeOfDay?: string;
      weather?: string;
      backgroundType?: string;
      isRegenerated?: boolean;
      metadata?: any;
      index: number;
    }> = [];
    const mediaLibraryS3KeysSet = new Set(mediaLibraryS3Keys);
    
    // Check baseReference
    if (latestLocation.baseReference?.s3Key && !mediaLibraryS3KeysSet.has(latestLocation.baseReference.s3Key)) {
      fallback.push({
        id: latestLocation.baseReference.id,
        imageUrl: latestLocation.baseReference.imageUrl || '',
        s3Key: latestLocation.baseReference.s3Key,
        label: `${latestLocation.name} - Base Reference`,
        isBase: true,
        isAngle: false,
        isBackground: false,
        index: 0
      });
    }
    
    // Check creationImages (if it exists on the location)
    ((latestLocation as any).creationImages || []).forEach((img: LocationReference) => {
      if (img.s3Key && !mediaLibraryS3KeysSet.has(img.s3Key)) {
        fallback.push({
          id: img.id,
          imageUrl: img.imageUrl || '',
          s3Key: img.s3Key,
          label: `${latestLocation.name} - Reference`,
          isBase: false,
          isAngle: false,
          isBackground: false,
          index: fallback.length
        });
      }
    });
    
    // 🔥 REMOVED: Fallback logic for angles and backgrounds
    // Media Library is the single source of truth - if it's not in Media Library, don't show it
    // This prevents deleted items from reappearing via stale latestLocation data
    
    // 🔥 DEBUG: Log fallback images composition (only baseReference and creationImages now)
    if (fallback.length > 0) {
      console.log('[LocationDetailModal] 🔄 FALLBACK IMAGES (baseReference/creationImages only):', {
        fallbackCount: fallback.length,
        fallbackS3Keys: fallback.map(f => f.s3Key),
        fallbackTypes: fallback.map(f => ({ s3Key: f.s3Key, isBase: f.isBase, isAngle: f.isAngle, isBackground: f.isBackground }))
        });
      }
    
    return fallback;
  }, [latestLocation.baseReference, (latestLocation as any).creationImages, latestLocation.name, latestLocation.locationId, mediaLibraryS3Keys]);
  
  // 🔥 COMBINED: Media Library images (primary) + Fallback images (from location prop)
  // 🔥 Feature 0200: Filter out fallback images with empty imageUrl (expired files)
  // 🔥 Group by mediator: Creation first, then Angles (by timeOfDay/weather), then Backgrounds (by backgroundType)
  //    so the image viewer shows an organized order instead of "everything together"
  const allImages = useMemo(() => {
    // Filter fallback images to only include those with valid URLs
    const validFallbackImages = fallbackImages.filter(img => !!img.imageUrl && img.imageUrl.length > 0);
    const combined = [...enrichedMediaLibraryImages, ...validFallbackImages];
    
    // Sort by mediator: Creation (0) → Angles (1) → Backgrounds (2); within each, sub-sort for consistency
    const typeOrder = (img: typeof combined[0]) => {
      if (img.isBase || (!img.isAngle && !img.isBackground)) return 0;
      if (img.isAngle) return 1;
      return 2;
    };
    const sorted = [...combined].sort((a, b) => {
      const orderA = typeOrder(a);
      const orderB = typeOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      if (orderA === 1) {
        // Angles: by timeOfDay then weather
        const keyA = [a.timeOfDay ?? '', a.weather ?? ''].join('|');
        const keyB = [b.timeOfDay ?? '', b.weather ?? ''].join('|');
        return keyA.localeCompare(keyB) || (a.index - b.index);
      }
      if (orderA === 2) {
        // Backgrounds: by backgroundType then timeOfDay/weather
        const keyA = [a.backgroundType ?? 'custom', a.timeOfDay ?? '', a.weather ?? ''].join('|');
        const keyB = [b.backgroundType ?? 'custom', b.timeOfDay ?? '', b.weather ?? ''].join('|');
        return keyA.localeCompare(keyB) || (a.index - b.index);
      }
      return a.index - b.index;
    });
    
    // 🔥 DEBUG: Log allImages composition
    console.log('[LocationDetailModal] 🖼️ ALL IMAGES COMPOSITION (sorted by mediator):', {
      enrichedMediaLibraryCount: enrichedMediaLibraryImages.length,
      fallbackImagesCount: fallbackImages.length,
      validFallbackImagesCount: validFallbackImages.length,
      totalAllImagesCount: sorted.length,
      allImagesBackgroundCount: sorted.filter(i => i.isBackground).length,
      allImagesAngleCount: sorted.filter(i => i.isAngle).length,
    });
    
    return sorted;
  }, [enrichedMediaLibraryImages, fallbackImages]);
  
  // 🔥 FIX: Create allCreationImages as separate variable (used in JSX for Creation section display)
  // This is separate from allImages which is used for the gallery viewer
  const allCreationImages = useMemo(() => {
    return allImages.filter(img => !img.isAngle && !img.isBackground);
  }, [allImages]);
  
  // 🔥 DERIVED: Get angleVariations and backgrounds from allImages (for backward compatibility)
  const angleVariations = useMemo(() => {
    return allImages
      .filter(img => img.isAngle)
      .map(img => ({
        id: img.id,
        locationId: latestLocation.locationId,
        imageUrl: img.imageUrl,
        s3Key: img.s3Key || '',
        angle: (img.angle || 'front') as LocationReference['angle'],
        timeOfDay: img.timeOfDay as LocationReference['timeOfDay'] | undefined,
        weather: img.weather as LocationReference['weather'] | undefined,
        generationMethod: (img.metadata?.generationMethod || 'angle-variation') as LocationReference['generationMethod'],
        creditsUsed: 0,
        createdAt: img.metadata?.generatedAt || new Date().toISOString(),
        metadata: {
          ...img.metadata,
          isRegenerated: img.isRegenerated
        }
      }));
  }, [allImages, latestLocation.locationId]);
  
  const backgrounds = useMemo(() => {
    const backgroundImages = allImages.filter(img => img.isBackground);
    const result = backgroundImages.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        s3Key: img.s3Key || '',
        backgroundType: (img.backgroundType || 'custom') as LocationBackground['backgroundType'],
        timeOfDay: img.timeOfDay,
        weather: img.weather,
        generationMethod: (img.metadata?.generationMethod || 'ai-generated') as LocationBackground['generationMethod'],
        creditsUsed: 0,
        createdAt: img.metadata?.generatedAt || new Date().toISOString(),
        metadata: img.metadata || {}
      }));
    
    // 🔥 DEBUG: Log backgrounds derivation
    console.log('[LocationDetailModal] 🎨 BACKGROUNDS DERIVED:', {
      allImagesCount: allImages.length,
      backgroundImagesCount: backgroundImages.length,
      backgroundsCount: result.length,
      backgroundS3Keys: result.map(b => b.s3Key),
      latestLocationBackgroundsCount: (latestLocation.backgrounds || []).length,
      latestLocationBackgroundS3Keys: (latestLocation.backgrounds || []).map((b: LocationBackground) => b.s3Key),
      allImagesS3Keys: allImages.map(i => i.s3Key).slice(0, 10)
    });
    
    return result;
  }, [allImages]);

  // Feature 0223: Split ECU vs non-ECU backgrounds; main block shows only non-ECU
  const ecuBackgrounds = useMemo(() =>
    backgrounds.filter((b: any) => b.metadata?.useCase === 'extreme-closeup'),
    [backgrounds]
  );
  const nonEcuBackgrounds = useMemo(() =>
    backgrounds.filter((b: any) => b.metadata?.useCase !== 'extreme-closeup'),
    [backgrounds]
  );
  
  // 🔥 IMPROVED: Organize angles and non-ECU backgrounds by metadata combinations (timeOfDay + weather)
  // Feature 0223: Only non-ECU backgrounds go into main grouping; ECU have their own section
  const imagesByMetadata: Record<string, { angles: any[]; backgrounds: any[] }> = useMemo(() => {
    const grouped: Record<string, { angles: any[]; backgrounds: any[] }> = {};
    
    // Group angles from allImages
    angleVariations.forEach((variation: any) => {
      const metadataParts = [
        variation.timeOfDay ? variation.timeOfDay : null,
        variation.weather ? variation.weather : null
      ].filter(Boolean);
      
      const key = metadataParts.length > 0 
        ? metadataParts.join(' • ') 
        : 'No Metadata';
      
      if (!grouped[key]) {
        grouped[key] = { angles: [], backgrounds: [] };
      }
      grouped[key].angles.push(variation);
    });
    
    // Group only non-ECU backgrounds
    nonEcuBackgrounds.forEach((background: any) => {
      const metadataParts = [
        background.timeOfDay ? background.timeOfDay : null,
        background.weather ? background.weather : null
      ].filter(Boolean);
      
      const key = metadataParts.length > 0 
        ? metadataParts.join(' • ') 
        : 'No Metadata';
      
      if (!grouped[key]) {
        grouped[key] = { angles: [], backgrounds: [] };
      }
      grouped[key].backgrounds.push(background);
    });
    
    return grouped;
  }, [angleVariations, nonEcuBackgrounds]);
  
  // Sort groups: "No Metadata" last, then alphabetically
  const sortedMetadataKeys = useMemo(() => {
    return Object.keys(imagesByMetadata).sort((a, b) => {
      if (a === 'No Metadata') return 1;
      if (b === 'No Metadata') return -1;
      return a.localeCompare(b);
    });
  }, [imagesByMetadata]);
  
  // Keep anglesByMetadata for backward compatibility with References tab
  const anglesByMetadata: Record<string, any[]> = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    sortedMetadataKeys.forEach(key => {
      grouped[key] = imagesByMetadata[key].angles;
    });
    return grouped;
  }, [imagesByMetadata, sortedMetadataKeys]);

  // Feature 0179: Create thumbnail S3 key map from Media Library
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
  const { galleryImages: locationGalleryImages } = useThumbnailMapping({
    thumbnailS3KeyMap,
    images: allImages,
    isOpen,
    getThumbnailS3KeyFromMetadata: (img) => (img as any).metadata?.thumbnailS3Key || null,
    getImageSource: (img) => {
      // 🔥 FIX: Don't show source label for locations (removed per user request)
      // Return undefined to hide the source badge
      return undefined;
    },
    defaultAspectRatio: { width: 16, height: 9 }
  });
  
  // 🔥 NEW: Use thumbnail mapping for References tab (angleVariations and backgrounds)
  const referencesImages = useMemo(() => {
    return [...angleVariations, ...backgrounds].map((item: any) => ({
      id: item.id || `ref_${item.s3Key}`,
      s3Key: item.s3Key,
      imageUrl: item.imageUrl,
      label: item.angle || item.backgroundType || 'Location image'
    }));
  }, [angleVariations, backgrounds]);
  
  const { galleryImages: referenceGalleryImages } = useThumbnailMapping({
    thumbnailS3KeyMap,
    images: referencesImages,
    isOpen: isOpen && activeTab === 'references',
    getThumbnailS3KeyFromMetadata: (img) => (img as any).metadata?.thumbnailS3Key || null,
    getImageSource: () => undefined, // Don't show source badge
    defaultAspectRatio: { width: 16, height: 9 }
  });
  
  // 🔥 NEW: Create a map for quick lookup of thumbnail URLs by image ID
  const referenceThumbnailMap = useMemo(() => {
    const map = new Map<string, string>();
    referenceGalleryImages.forEach((galleryImg) => {
      map.set(galleryImg.id, galleryImg.thumbnailUrl || galleryImg.imageUrl);
    });
    return map;
  }, [referenceGalleryImages]);
  
  // Convert type for display
  const typeLabel = location.type === 'interior' ? 'INT.' : 
                   location.type === 'exterior' ? 'EXT.' : 'INT./EXT.';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onUploadImage) {
      toast.error('Upload functionality not available');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadImage(latestLocation.locationId, file);
      
      // 🔥 FIX: Aggressively clear and refetch location queries (same pattern as Creation section)
      // Also invalidate presigned URLs so new images get fresh URLs
      queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ 
        queryKey: ['media', 'files', screenplayId],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['media', 'presigned-urls'],
        exact: false // Invalidate all presigned URL queries (they have dynamic keys)
      });
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ['locations', screenplayId, 'production-hub'],
          type: 'active'
        });
        queryClient.refetchQueries({ 
          queryKey: ['media', 'files', screenplayId],
          exact: false
        });
        queryClient.refetchQueries({ 
          queryKey: ['media', 'presigned-urls'],
          exact: false // Refetch all presigned URL queries
        });
      }, 2000);
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };


  const handleGeneratePackages = () => {
    // Switch to Generate tab
    setActiveTab('generate');
  };

  // 🔥 REMOVED: handleReframeAngles - Luma reframe removed (Photon maxes at 1080p, not worth it)

  if (!isOpen) return null;

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
                    <MapPin className="w-6 h-6 text-[#DC143C]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isMobile && (
                      <div className="p-1.5 bg-[#DC143C]/10 rounded flex-shrink-0">
                        <MapPin className={`text-[#DC143C] ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`} />
                      </div>
                    )}
                    <h2 className={`font-bold text-[#FFFFFF] truncate ${isMobile ? 'text-base' : 'text-xl'}`}>
                      {latestLocation.name}
                    </h2>
                  </div>
                  {isMobile ? (
                    // Mobile: Compact single line
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[#808080] ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {typeLabel}
                      </span>
                    </div>
                  ) : (
                    // Desktop: Full layout
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-[#808080]">{typeLabel}</p>
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
                      disabled={isGeneratingAngles}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        coverageTab === 'generate'
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-white hover:bg-[#2A2A2A]'
                      }`}
                    >
                      <span className="text-base">🤖</span>
                      <span>{isGeneratingAngles ? 'Generating...' : 'Generate Images'}</span>
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
                      disabled={isGeneratingAngles}
                      className={`px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
                        coverageTab === 'generate'
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF]'
                      }`}
                    >
                      <span className="text-base">🤖</span>
                      {isGeneratingAngles ? 'Generating...' : 'Generate Images'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {false && activeTab === 'gallery' && (
                <div className="p-6">
                  {allImages.length > 0 ? (
                    <ModernGallery
                      images={locationGalleryImages}
                      layout="grid-only"
                      useImageId={true}
                      onImageClick={(imageIdOrIndex) => {
                        // 🔥 IMPROVED: Use stable identifier (id) instead of fragile index
                        if (typeof imageIdOrIndex === 'string') {
                          const actualIndex = allImages.findIndex(img => img.id === imageIdOrIndex);
                          if (actualIndex >= 0) {
                            setPreviewImageIndex(actualIndex);
                            setPreviewGroupName(null);
                          }
                        } else {
                          // Fallback for backward compatibility
                          setPreviewImageIndex(imageIdOrIndex);
                          setPreviewGroupName(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MapPin className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                      <p className="text-xs text-[#6B7280]">Upload images in the Creation section</p>
                    </div>
                  )}
                </div>
              )}

              {!coverageTab && activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Location Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Location Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        <p className="text-[#FFFFFF]">{location.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Type</label>
                        <p className="text-[#FFFFFF]">{typeLabel}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                        <p className="text-[#808080]">{location.description || 'No description'}</p>
                      </div>
                      {angleVariations && angleVariations.length > 0 && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Angle Variations</label>
                          <p className="text-[#808080]">{angleVariations.length} angle{angleVariations.length !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Script Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">From Script</h3>
                    <p className="text-[#808080] text-sm">
                      Location information extracted from the screenplay will appear here.
                    </p>
                  </div>
                </div>
              )}

              {!coverageTab && activeTab === 'references' && (
                <div className="p-6 space-y-6">
                  {/* Phase 2: Selection Mode Toggle & Bulk Actions - Desktop only */}
                  {(angleVariations.length > 0 || backgrounds.length > 0) && !isMobile && (
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
                                  // Get all selectable image IDs (angles + backgrounds)
                                  const allSelectableIds = new Set<string>();
                                  angleVariations.forEach((v: any) => {
                                    const id = v.id || `ref_${v.s3Key}`;
                                    allSelectableIds.add(id);
                                  });
                                  if (backgrounds && backgrounds.length > 0) {
                                    backgrounds.forEach((b: any) => {
                                      const id = b.id || `bg_${b.s3Key}`;
                                      allSelectableIds.add(id);
                                    });
                                  }
                                  
                                  if (selectedImageIds.size === allSelectableIds.size) {
                                    setSelectedImageIds(new Set());
                                  } else {
                                    setSelectedImageIds(allSelectableIds);
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#808080] hover:text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                              >
                                {selectedImageIds.size === (angleVariations.length + backgrounds.length) ? 'Deselect All' : 'Select All'}
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
                  
                  {/* 🔥 SEPARATION: Production Hub Images - Angle Variations & non-ECU Backgrounds (Feature 0223: ECU in separate section) */}
                  {(angleVariations.length > 0 || nonEcuBackgrounds.length > 0) && (
                    <div className="p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            Production Hub Images ({angleVariations.length + nonEcuBackgrounds.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">AI-generated angles and backgrounds - can be edited/deleted here</p>
                        </div>
                      </div>
                      {/* 🔥 IMPROVED: Organized by Metadata Combinations - Visual Card-based Grouping */}
                      <div className="space-y-6">
                        {sortedMetadataKeys.map((displayName) => {
                          const group = imagesByMetadata[displayName];
                          const variations = group.angles;
                          const backgrounds = group.backgrounds;
                          const totalImages = variations.length + backgrounds.length;
                          
                          return (
                            <div key={displayName} className="space-y-3">
                              {/* Section Header with Metadata Badge */}
                              <div className="flex items-center justify-between pb-2 border-b border-[#3F3F46]">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-[#8B5CF6] capitalize">
                                    {displayName}
                                  </h4>
                                  <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded text-xs">
                                    {totalImages} {totalImages === 1 ? 'image' : 'images'}
                                    {variations.length > 0 && backgrounds.length > 0 && ` (${variations.length} angles, ${backgrounds.length} backgrounds)`}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Angles + Backgrounds: sub-grouped by angle; backgrounds under derived angle (sourceAngleId) */}
                              {(variations.length > 0 || backgrounds.length > 0) && (() => {
                                const byAngle: Record<string, any[]> = {};
                                variations.forEach((v: any) => {
                                  const k = (v.angle || 'other').toLowerCase();
                                  if (!byAngle[k]) byAngle[k] = [];
                                  byAngle[k].push(v);
                                });
                                const sortedAngleNames = Object.keys(byAngle).sort((a, b) => a.localeCompare(b));
                                // Align backgrounds under the angle they were derived from (sourceAngleId)
                                const byAngleWithBackgrounds = sortedAngleNames.map((angleName) => {
                                  const angleVariations = byAngle[angleName];
                                  const angleIds = angleVariations.map((v: any) => v.id).filter(Boolean);
                                  const derivedBackgrounds = angleIds.length === 0 ? [] : backgrounds.filter((bg: any) => {
                                    const sourceIds = (bg.sourceAngleId || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                    return sourceIds.some((sid: string) => angleIds.includes(sid));
                                  });
                                  return { angleName, angleVariations, derivedBackgrounds };
                                });
                                const usedBackgroundS3Keys = new Set(byAngleWithBackgrounds.flatMap((x: { derivedBackgrounds: any[] }) => x.derivedBackgrounds.map((b: any) => b.s3Key)));
                                const otherBackgrounds = backgrounds.filter((bg: any) => !usedBackgroundS3Keys.has(bg.s3Key));
                                type Row = { type: 'angle'; angleName: string; angleVariations: any[] } | { type: 'backgrounds'; label: string; backgrounds: any[] };
                                const rows: Row[] = [];
                                byAngleWithBackgrounds.forEach(({ angleName, angleVariations, derivedBackgrounds }) => {
                                  rows.push({ type: 'angle', angleName, angleVariations });
                                  if (derivedBackgrounds.length > 0) {
                                    const displayAngle = angleName.charAt(0).toUpperCase() + angleName.slice(1);
                                    rows.push({ type: 'backgrounds', label: `Backgrounds (from ${displayAngle})`, backgrounds: derivedBackgrounds });
                                  }
                                });
                                if (otherBackgrounds.length > 0) {
                                  rows.push({ type: 'backgrounds', label: variations.length > 0 ? 'Other backgrounds' : 'Backgrounds', backgrounds: otherBackgrounds });
                                }
                                return (
                                  <div className="space-y-4">
                                    {rows.map((row, rowIndex) => {
                                      if (row.type === 'angle') {
                                        const { angleName, angleVariations } = row;
                                        const displayAngle = angleName.charAt(0).toUpperCase() + angleName.slice(1);
                                        return (
                                        <div key={`angle-${angleName}`} className="space-y-2">
                                          <p className="text-xs text-[#808080] uppercase tracking-wide">{displayAngle} ({angleVariations.length})</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                                            {angleVariations.map((variation: any) => {
                          const img = allImages.find(i => i.s3Key === variation.s3Key && !i.isBase);
                          if (!img) return null;
                          const imgId = img.id || `ref_${variation.s3Key}`;
                          const isSelected = selectedImageIds.has(imgId);
                          // 🔥 NEW: Use thumbnail URL from mapping, fallback to full image
                          const displayUrl = referenceThumbnailMap.get(imgId) || img.imageUrl;
                          
                          return (
                            <div
                              key={imgId}
                              className={`relative group aspect-video bg-[#141414] border rounded-lg overflow-hidden transition-colors cursor-pointer ${
                                selectionMode
                                  ? isSelected
                                    ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                    : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                                  : 'border-[#3F3F46] hover:border-[#DC143C]'
                              }`}
                              onClick={(e) => {
                                if (!selectionMode) {
                                  // Find index in allImages
                                  const allIndex = allImages.findIndex(aImg => 
                                    aImg.id === img.id || aImg.s3Key === img.s3Key
                                  );
                                  if (allIndex >= 0) {
                                    setPreviewImageIndex(allIndex);
                                    setPreviewGroupName(displayName);
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
                                        newSelection.delete(imgId);
                                      } else {
                                        newSelection.add(imgId);
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
                                className={`w-full h-full object-cover cursor-pointer ${
                                  regeneratingS3Key && regeneratingS3Key.trim() === (variation.s3Key || '').trim()
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
                                  }
                                }}
                                onClick={(e) => {
                                  if (!selectionMode) {
                                    e.stopPropagation();
                                    // Find which metadata group this image belongs to
                                    const metadataKey = [
                                      (img as any).timeOfDay ? (img as any).timeOfDay : null,
                                      (img as any).weather ? (img as any).weather : null
                                    ].filter(Boolean).join(' • ') || 'No Metadata';
                                    
                                    const groupImages = anglesByMetadata[metadataKey] || [];
                                    const groupIndex = groupImages.findIndex((gVariation: any) => 
                                      (gVariation.id === img.id) || (gVariation.s3Key === img.s3Key)
                                    );
                                    
                                    if (groupIndex >= 0) {
                                      setPreviewGroupName(metadataKey);
                                      setPreviewImageIndex(groupIndex);
                                    } else {
                                      // Fallback: find in allImages
                                      const allIndex = allImages.findIndex(aImg => 
                                        aImg.id === img.id || aImg.s3Key === img.s3Key
                                      );
                                      if (allIndex >= 0) {
                                        setPreviewGroupName(null);
                                        setPreviewImageIndex(allIndex);
                                      }
                                    }
                                  }
                                }}
                              />
                              {/* Shimmer overlay for regenerating images */}
                              {regeneratingS3Key && regeneratingS3Key.trim() === (variation.s3Key || '').trim() && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                              )}
                              {/* Top-left label: Angle/Regenerated */}
                              <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-white text-[10px] rounded ${
                                (img as any).isRegenerated || variation.metadata?.isRegenerated ? 'bg-[#DC143C]' : 'bg-[#8B5CF6]'
                              }`}>
                                {(img as any).isRegenerated || variation.metadata?.isRegenerated ? 'Regenerated' : 'Angle'}
                              </div>
                              {/* Bottom-right label: Model name / 2K or 4K */}
                              {(() => {
                                const providerId = (img as any).metadata?.providerId 
                                  || variation.metadata?.providerId 
                                  || variation.metadata?.generationMetadata?.providerId
                                  || (img as any).metadata?.generationMetadata?.providerId;
                                if (!providerId) return null;
                                const providerLabel = getProviderLabel(providerId);
                                const resLabel = getResolutionLabel(providerId);
                                if (!providerLabel) return null;
                                const tagText = resLabel ? `${providerLabel} / ${resLabel}` : providerLabel;
                                return (
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                    {tagText}
                                  </div>
                                );
                              })()}
                              {/* Three dots dropdown - always visible (not in hover div) */}
                              {!selectionMode && (
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
                                          // Find which metadata group this image belongs to
                                          // img is from angleVariations, find it in anglesByMetadata
                                          const metadataKey = [
                                            (img as any).timeOfDay ? (img as any).timeOfDay : null,
                                            (img as any).weather ? (img as any).weather : null
                                          ].filter(Boolean).join(' • ') || 'No Metadata';
                                          
                                          const groupImages = anglesByMetadata[metadataKey] || [];
                                          const groupIndex = groupImages.findIndex((gVariation: any) => 
                                            (gVariation.id === img.id) || (gVariation.s3Key === img.s3Key)
                                          );
                                          
                                          if (groupIndex >= 0) {
                                            setPreviewGroupName(metadataKey);
                                            setPreviewImageIndex(groupIndex);
                                          } else {
                                            // Fallback: find in allImages
                                            const allIndex = allImages.findIndex(aImg => 
                                              aImg.id === img.id || aImg.s3Key === img.s3Key
                                            );
                                            if (allIndex >= 0) {
                                              setPreviewGroupName(null);
                                              setPreviewImageIndex(allIndex);
                                            }
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
                                            const angle = variation.angle || 'angle';
                                            const timeOfDay = variation.timeOfDay ? `_${variation.timeOfDay}` : '';
                                            const weather = variation.weather ? `_${variation.weather}` : '';
                                            const filename = `${location.name}_${angle}${timeOfDay}${weather}_${Date.now()}.jpg`;
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
                                      {variation.s3Key && (
                                        <DropdownMenuItem
                                          className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed"
                                          disabled={flippingAngleId === variation.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleFlipAngle(variation.id, variation.s3Key);
                                          }}
                                        >
                                          <FlipHorizontal className="w-4 h-4 mr-2 text-[#808080]" />
                                          {flippingAngleId === variation.id ? 'Flipping...' : 'Flip Horizontal'}
                                        </DropdownMenuItem>
                                      )}
                                      {/* ✅ Images are now generated directly at 16:9 - no cropping needed */}
                                      {/* 🔥 NEW: Regenerate option (only for AI-generated angles with id) */}
                                      {variation.id && variation.s3Key && (variation.generationMethod === 'angle-variation' || variation.generationMethod === 'ai-generated') && (() => {
                                        // 🔥 FIX: Ensure both values are strings and trimmed for reliable comparison
                                        const currentS3Key = (variation.s3Key || '').trim();
                                        const isThisImageRegenerating = regeneratingS3Key !== null && regeneratingS3Key.trim() === currentS3Key;
                                        return (
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
                                                angleId: variation.id,
                                                s3Key: currentS3Key,
                                                angle: variation.angle,
                                                variation: variation,
                                              });
                                            }}
                                            disabled={isRegenerating}
                                          >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            {isThisImageRegenerating ? 'Regenerating...' : 'Regenerate'}
                                          </DropdownMenuItem>
                                        );
                                      })()}
                                      <DropdownMenuItem
                                        className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!confirm('Delete this angle image? This action cannot be undone.')) {
                                            return;
                                          }
                                          
                                          try {
                                            if (!variation.s3Key) {
                                              throw new Error('Missing S3 key for image');
                                            }
                                            
                                            // 🔥 FIX: Delete from Media Library first (source of truth) - EXACT same pattern as backgrounds
                                            try {
                                              const token = await getToken({ template: 'wryda-backend' });
                                              const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                                              console.log('[LocationDetailModal] 🗑️ Deleting angle from Media Library:', variation.s3Key);
                                              await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
                                                method: 'POST',
                                                headers: {
                                                  'Authorization': `Bearer ${token}`,
                                                  'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({ s3Key: variation.s3Key }),
                                              });
                                              console.log('[LocationDetailModal] ✅ Media Library deletion successful');
                                            } catch (mediaError: any) {
                                              console.warn('[LocationDetailModal] Failed to delete from Media Library (non-fatal):', mediaError);
                                              // Continue with location update even if Media Library deletion fails
                                            }
                                            
                                            // Remove from angleVariations by matching s3Key (keep original working pattern)
                                            const updatedAngleVariations = angleVariations.filter(
                                              (v: any) => v.s3Key !== variation.s3Key
                                            );
                                            
                                            // 🔥 ONE-WAY SYNC: Only update Production Hub backend
                                            await onUpdate(location.locationId, {
                                              angleVariations: updatedAngleVariations
                                            });
                                            
                                            // 🔥 FIX: Aggressively clear and refetch location queries (same pattern as Creation section)
                                            // Remove query from cache completely, then refetch after delay to account for DynamoDB eventual consistency
                                            queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                                            queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                                            queryClient.invalidateQueries({ 
                                              queryKey: ['media', 'files', screenplayId],
                                              exact: false
                                            });
                                            setTimeout(() => {
                                              queryClient.refetchQueries({ 
                                                queryKey: ['locations', screenplayId, 'production-hub'],
                                                type: 'active'
                                              });
                                              queryClient.refetchQueries({ 
                                                queryKey: ['media', 'files', screenplayId],
                                                exact: false
                                              });
                                            }, 2000);
                                            toast.success('Angle image deleted');
                                          } catch (error: any) {
                                            console.error('[LocationDetailModal] Failed to delete angle image:', error);
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
                                        );
                                      }
                                      if (row.type === 'backgrounds') {
                                        const sectionBackgrounds = row.backgrounds;
                                        return (
                                        <div key={`bg-${rowIndex}`} className="space-y-2">
                                          <p className="text-xs text-[#808080] uppercase tracking-wide">{row.label}</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                                            {sectionBackgrounds.map((background: LocationBackground) => {
                                      const img = allImages.find(i => i.s3Key === background.s3Key && !i.isBase);
                                      if (!img) return null;
                                      const imgId = img.id || `bg_${background.s3Key}`;
                                      const isSelected = selectedImageIds.has(imgId);
                                      // 🔥 NEW: Use thumbnail URL from mapping, fallback to full image
                                      const displayUrl = referenceThumbnailMap.get(imgId) || img.imageUrl;
                                      
                                      // Get display label for background type
                                      const backgroundTypeLabels: Record<string, string> = {
                                        'window': 'Window',
                                        'wall': 'Wall',
                                        'doorway': 'Doorway',
                                        'texture': 'Texture',
                                        'corner-detail': 'Corner Detail',
                                        'furniture': 'Furniture',
                                        'architectural-feature': 'Architectural Feature',
                                        'custom': background.description || 'Custom Background'
                                      };
                                      const typeLabel = backgroundTypeLabels[background.backgroundType] || background.backgroundType;
                                      
                                      return (
                                        <div
                                          key={imgId}
                                          className={`relative group aspect-video bg-[#141414] border rounded-lg overflow-hidden transition-colors cursor-pointer ${
                                            selectionMode
                                              ? isSelected
                                                ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                                : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                                              : 'border-[#3F3F46] hover:border-[#DC143C]'
                                          }`}
                                          onClick={(e) => {
                                            if (!selectionMode && e.target === e.currentTarget) {
                                              // If clicking the container (not the image), trigger image click
                                              const imgElement = e.currentTarget.querySelector('img');
                                              if (imgElement) {
                                                imgElement.click();
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
                                                    newSelection.delete(imgId);
                                                  } else {
                                                    newSelection.add(imgId);
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
                                            className="w-full h-full object-cover cursor-pointer"
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
                                              }
                                            }}
                                            onClick={(e) => {
                                              if (!selectionMode) {
                                                e.stopPropagation();
                                                // 🔥 FIX: Find the correct image in allImages by matching s3Key (most reliable)
                                                const imageIndex = allImages.findIndex(i => 
                                                  i.s3Key === background.s3Key || i.s3Key === img.s3Key || i.id === img.id
                                                );
                                                if (imageIndex >= 0) {
                                                  setPreviewImageIndex(imageIndex);
                                                  // 🔥 FIX: Don't set previewGroupName for backgrounds - use allImages directly
                                                  // This ensures backgrounds are shown correctly, not angles
                                                  setPreviewGroupName(null);
                                                } else {
                                                  console.warn('[LocationDetailModal] Could not find background image in allImages:', { 
                                                    imgId, 
                                                    imgId2: img.id, 
                                                    s3Key: img.s3Key,
                                                    backgroundS3Key: background.s3Key,
                                                    allImagesS3Keys: allImages.map(i => i.s3Key).slice(0, 5)
                                                  });
                                                }
                                              }
                                            }}
                                          />
                                          {/* Top-left label: Background Type */}
                                          <div className="absolute top-1 left-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-[#10B981]">
                                            {typeLabel}
                                          </div>
                                          {/* Bottom-right label: Model name / 2K or 4K */}
                                          {(() => {
                                            const providerId = (img as any).metadata?.providerId 
                                              || background.metadata?.providerId 
                                              || (background.metadata as any)?.generationMetadata?.providerId
                                              || (img as any).metadata?.generationMetadata?.providerId;
                                            if (!providerId) return null;
                                            const providerLabel = getProviderLabel(providerId);
                                            const resLabel = getResolutionLabel(providerId);
                                            if (!providerLabel) return null;
                                            const tagText = resLabel ? `${providerLabel} / ${resLabel}` : providerLabel;
                                            return (
                                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                                {tagText}
                                              </div>
                                            );
                                          })()}
                                          {/* Three dots dropdown - always visible (not in hover div) */}
                                          {!selectionMode && (
                                            <div className="absolute top-2 right-2 pointer-events-auto z-20">
                                              <DropdownMenu
                                                open={openDropdownId === imgId}
                                                onOpenChange={(open) => {
                                                  if (open) {
                                                    setOpenDropdownId(imgId);
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
                                                      if (openDropdownId !== imgId) {
                                                        setOpenDropdownId(imgId);
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
                                                        // 🔥 FIX: Find the correct image in allImages by matching s3Key (most reliable)
                                                        const imageIndex = allImages.findIndex(i => 
                                                          i.s3Key === background.s3Key || i.s3Key === img.s3Key || i.id === img.id
                                                        );
                                                        if (imageIndex >= 0) {
                                                          setPreviewImageIndex(imageIndex);
                                                          // 🔥 FIX: Don't set previewGroupName for backgrounds - use allImages directly
                                                          // This ensures backgrounds are shown correctly, not angles
                                                          setPreviewGroupName(null);
                                                        } else {
                                                          console.warn('[LocationDetailModal] Could not find background image in allImages:', { 
                                                            imgId, 
                                                            imgId2: img.id, 
                                                            s3Key: img.s3Key,
                                                            backgroundS3Key: background.s3Key
                                                          });
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
                                                          const filename = `${location.name}_${typeLabel}_${Date.now()}.jpg`;
                                                          await downloadImageAsBlob(img.imageUrl, filename, img.s3Key);
                                                        } catch (error: any) {
                                                          toast.error('Failed to download image');
                                                        }
                                                      }}
                                                    >
                                                      <Download className="w-4 h-4 mr-2 text-[#808080]" />
                                                      Download
                                                    </DropdownMenuItem>
                                                    {/* 🔥 NEW: Regenerate option (only for AI-generated backgrounds with id) */}
                                                    {background.id && background.s3Key && background.generationMethod === 'ai-generated' && (() => {
                                                      const currentS3Key = (background.s3Key || '').trim();
                                                      const isThisImageRegenerating = regeneratingS3Key !== null && regeneratingS3Key.trim() === currentS3Key;
                                                      return (
                                                        <DropdownMenuItem
                                                          className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Don't allow if ANY regeneration is in progress
                                                            if (isRegenerating) {
                                                              return;
                                                            }
                                                            // Show warning modal before regenerating
                                                            setRegenerateBackground({
                                                              backgroundId: background.id,
                                                              s3Key: currentS3Key,
                                                              backgroundType: background.backgroundType,
                                                              background: background,
                                                            });
                                                          }}
                                                          disabled={isRegenerating}
                                                        >
                                                          <Sparkles className="w-4 h-4 mr-2" />
                                                          {isThisImageRegenerating ? 'Regenerating...' : 'Regenerate'}
                                                        </DropdownMenuItem>
                                                      );
                                                    })()}
                                                    <DropdownMenuItem
                                                      className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                                                      onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (!confirm('Delete this background image? This action cannot be undone.')) {
                                                          return;
                                                        }
                                                        
                                                        try {
                                                          if (!background.s3Key) {
                                                            throw new Error('Missing S3 key for image');
                                                          }
                                                          
                                                          console.log('[LocationDetailModal] 🗑️ DELETE BACKGROUND START:', {
                                                            backgroundId: background.id,
                                                            backgroundS3Key: background.s3Key,
                                                            locationId: location.locationId,
                                                            currentBackgroundsCount: (location.backgrounds || []).length,
                                                            derivedBackgroundsCount: backgrounds.length
                                                          });
                                                          
                                                          // 🔥 FIX: Delete from Media Library first (source of truth)
                                                          try {
                                                            const token = await getToken({ template: 'wryda-backend' });
                                                            const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                                                            console.log('[LocationDetailModal] 🗑️ Deleting from Media Library:', background.s3Key);
                                                            await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
                                                              method: 'POST',
                                                              headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json',
                                                              },
                                                              body: JSON.stringify({ s3Key: background.s3Key }),
                                                            });
                                                            console.log('[LocationDetailModal] ✅ Media Library deletion successful');
                                                          } catch (mediaError: any) {
                                                            console.warn('[LocationDetailModal] Failed to delete from Media Library (non-fatal):', mediaError);
                                                            // Continue with location update even if Media Library deletion fails
                                                          }
                                                          
                                                          // Use exact same working pattern as angles: filter derived backgrounds (from allImages)
                                                          const updatedBackgrounds = backgrounds.filter(
                                                            (b: LocationBackground) => b.s3Key !== background.s3Key
                                                          );
                                                          
                                                          // 🔥 ONE-WAY SYNC: Only update Production Hub backend (same pattern as angles)
                                                          await onUpdate(location.locationId, {
                                                            backgrounds: updatedBackgrounds
                                                          });
                                                          
                                                          // 🔥 FIX: Aggressively clear and refetch location queries (same pattern as Creation section)
                                                          // Remove query from cache completely, then refetch after delay to account for DynamoDB eventual consistency
                                                          // Also invalidate presigned URLs so new images get fresh URLs
                                                          queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                                                          queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                                                          queryClient.invalidateQueries({ 
                                                            queryKey: ['media', 'files', screenplayId],
                                                            exact: false
                                                          });
                                                          queryClient.invalidateQueries({ 
                                                            queryKey: ['media', 'presigned-urls'],
                                                            exact: false // Invalidate all presigned URL queries (they have dynamic keys)
                                                          });
                                                          setTimeout(() => {
                                                            queryClient.refetchQueries({ 
                                                              queryKey: ['locations', screenplayId, 'production-hub'],
                                                              type: 'active'
                                                            });
                                                            queryClient.refetchQueries({ 
                                                              queryKey: ['media', 'files', screenplayId],
                                                              exact: false
                                                            });
                                                            queryClient.refetchQueries({ 
                                                              queryKey: ['media', 'presigned-urls'],
                                                              exact: false // Refetch all presigned URL queries
                                                            });
                                                          }, 2000);
                                                          
                                                          toast.success('Background image deleted');
                                                        } catch (error: any) {
                                                          console.error('[LocationDetailModal] Failed to delete background image:', error);
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
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feature 0223: Extreme close-up backgrounds - separate section */}
                  {ecuBackgrounds.length > 0 && (
                    <div className="p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30 mt-6">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            Extreme close-up backgrounds ({ecuBackgrounds.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Soft or abstract backgrounds for ECU face/mouth shots.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {ecuBackgrounds.map((background) => {
                          const img = allImages.find(i => i.s3Key === background.s3Key && !i.isBase);
                          if (!img) return null;
                          const imgId = img.id || `bg_${background.s3Key}`;
                          const isSelected = selectedImageIds.has(imgId);
                          const displayUrl = referenceThumbnailMap.get(imgId) || img.imageUrl;
                          const backgroundTypeLabels: Record<string, string> = {
                            'window': 'Window', 'wall': 'Wall', 'doorway': 'Doorway', 'texture': 'Texture',
                            'corner-detail': 'Corner Detail', 'furniture': 'Furniture', 'architectural-feature': 'Architectural Feature',
                            'custom': (background as LocationBackground).description || 'Custom Background', 'ecu-soft': 'ECU Soft'
                          };
                          const typeLabel = backgroundTypeLabels[background.backgroundType] || background.backgroundType;
                          return (
                            <div
                              key={imgId}
                              className={`relative group aspect-video bg-[#141414] border rounded-lg overflow-hidden transition-colors cursor-pointer ${
                                selectionMode ? (isSelected ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50' : 'border-[#3F3F46] hover:border-[#DC143C]/50') : 'border-[#3F3F46] hover:border-[#DC143C]'
                              }`}
                            >
                              {selectionMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSelection = new Set(selectedImageIds);
                                      if (isSelected) newSelection.delete(imgId); else newSelection.add(imgId);
                                      setSelectedImageIds(newSelection);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-[#DC143C] text-white' : 'bg-[#0A0A0A]/80 text-[#808080] hover:bg-[#1F1F1F]'}`}
                                  >
                                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  </button>
                                </div>
                              )}
                              <img
                                src={displayUrl}
                                alt={img.label}
                                className="w-full h-full object-cover cursor-pointer"
                                style={{ imageRendering: displayUrl !== img.imageUrl ? 'crisp-edges' : 'auto', maxWidth: '640px', maxHeight: '360px' }}
                                loading="lazy"
                                onError={(e) => { if (displayUrl !== img.imageUrl) (e.target as HTMLImageElement).src = img.imageUrl; }}
                                onClick={(e) => {
                                  if (!selectionMode) {
                                    const imageIndex = allImages.findIndex(i => i.s3Key === background.s3Key || i.s3Key === img.s3Key || i.id === img.id);
                                    if (imageIndex >= 0) { setPreviewImageIndex(imageIndex); setPreviewGroupName(null); }
                                  }
                                }}
                              />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-[#10B981]">ECU</div>
                              {(() => {
                                const providerId = (img as any).metadata?.providerId || background.metadata?.providerId;
                                if (!providerId) return null;
                                const providerLabel = getProviderLabel(providerId);
                                const resLabel = getResolutionLabel(providerId);
                                if (!providerLabel) return null;
                                return (
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                    {resLabel ? `${providerLabel} / ${resLabel}` : providerLabel}
                                  </div>
                                );
                              })()}
                              {!selectionMode && (
                                <div className="absolute top-2 right-2 pointer-events-auto z-20">
                                  <DropdownMenu
                                    open={openDropdownId === imgId}
                                    onOpenChange={(open) => { if (open) setOpenDropdownId(imgId); else setOpenDropdownId(null); }}
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <button className={`${isMobile ? 'p-1.5 bg-[#DC143C]' : 'p-2 bg-[#DC143C]/90 hover:bg-[#DC143C]'} rounded-lg transition-colors ${isMobile ? 'min-w-[32px] min-h-[32px]' : 'min-w-[36px] min-h-[36px]'} flex items-center justify-center shadow-lg`} onClick={(e) => { e.stopPropagation(); if (openDropdownId !== imgId) setOpenDropdownId(imgId); }}>
                                        <MoreVertical className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none" style={{ backgroundColor: '#0A0A0A' }}>
                                      <DropdownMenuItem className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]" onClick={(e) => { e.stopPropagation(); const imageIndex = allImages.findIndex(i => i.s3Key === background.s3Key || i.s3Key === img.s3Key || i.id === img.id); if (imageIndex >= 0) { setPreviewImageIndex(imageIndex); setPreviewGroupName(null); } }}>
                                        <Eye className="w-4 h-4 mr-2 text-[#808080]" /> View
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]" onClick={async (e) => { e.stopPropagation(); try { await downloadImageAsBlob(img.imageUrl, `${location.name}_ECU_${Date.now()}.jpg`, img.s3Key); } catch (_) { toast.error('Failed to download image'); } }}>
                                        <Download className="w-4 h-4 mr-2 text-[#808080]" /> Download
                                      </DropdownMenuItem>
                                      {background.id && background.s3Key && background.generationMethod === 'ai-generated' && (
                                        <DropdownMenuItem className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed" onClick={(e) => { e.stopPropagation(); if (!isRegenerating) setRegenerateBackground({ backgroundId: background.id, s3Key: (background.s3Key || '').trim(), backgroundType: background.backgroundType, background: background as LocationBackground }); }} disabled={isRegenerating}>
                                          <Sparkles className="w-4 h-4 mr-2" /> {regeneratingS3Key === (background.s3Key || '').trim() ? 'Regenerating...' : 'Regenerate'}
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]" onClick={(e) => { e.stopPropagation(); handleDeleteBackground(background as LocationBackground); }}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 SEPARATION: Creation Section Images - All Reference Images (Read-Only) */}
                  {allCreationImages.length > 0 && (
                    <div className="p-4 bg-[#0F0F0F] rounded-lg border border-[#3F3F46]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3F3F46]">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Reference Images from Creation ({allCreationImages.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Uploaded in Creation section - view only (delete in Creation section)</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {allCreationImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative group aspect-video bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden opacity-75"
                          >
                            <img
                              src={img.imageUrl}
                              alt={img.label}
                              className="w-full h-full object-cover"
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
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {angleVariations.length === 0 && !location.baseReference && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No reference images yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Coverage Tabs (Upload or Generate) */}
              {coverageTab === 'upload' && (
                <UploadLocationImagesTab
                  locationId={location.locationId}
                  locationName={location.name}
                  screenplayId={screenplayId || ''}
                  existingReferences={(latestLocation.angleVariations || []).map(av => ({
                    id: av.id,
                    s3Key: av.s3Key,
                    imageUrl: av.imageUrl,
                    metadata: {
                      viewName: (av.metadata as any)?.viewName || av.angle || 'default'
                    }
                  }))}
                  existingBackgrounds={(latestLocation.backgrounds || []).map(bg => ({
                    id: bg.id,
                    s3Key: bg.s3Key,
                    imageUrl: bg.imageUrl,
                    backgroundType: bg.backgroundType || 'default'
                  }))}
                  onComplete={async (result) => {
                    // 🔥 FIX: Use same aggressive pattern as CharacterBankPanel and LocationDetailModal.handleFileUpload (works!)
                    // removeQueries + invalidateQueries + setTimeout refetchQueries with type: 'active'
                    // Also invalidate presigned URLs so new images get fresh URLs
                    queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                    queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                    queryClient.invalidateQueries({ 
                      queryKey: ['media', 'files', screenplayId],
                      exact: false
                    });
                    queryClient.invalidateQueries({ 
                      queryKey: ['media', 'presigned-urls'],
                      exact: false // Invalidate all presigned URL queries (they have dynamic keys)
                    });
                    setTimeout(() => {
                      queryClient.refetchQueries({ 
                        queryKey: ['locations', screenplayId, 'production-hub'],
                        type: 'active' // Only refetch active (enabled) queries
                      });
                      queryClient.refetchQueries({ 
                        queryKey: ['media', 'files', screenplayId],
                        exact: false
                      });
                      queryClient.refetchQueries({ 
                        queryKey: ['media', 'presigned-urls'],
                        exact: false // Refetch all presigned URL queries
                      });
                    }, 2000);
                    const categoryLabel = result.category === 'angles' ? 'Location Angles' : 'Location Backgrounds';
                    toast.success(`Successfully added ${result.images.length} image(s) to ${categoryLabel}: ${result.viewName}`);
                    setCoverageTab(null);
                  }}
                />
              )}

              {coverageTab === 'generate' && (
                <GenerateLocationTab
                  locationId={location.locationId}
                  locationName={location.name}
                  screenplayId={screenplayId || ''}
                  locationProfile={location}
                  location={location}
                  onClose={() => setCoverageTab(null)}
                  onComplete={async (result) => {
                    // Job started - tab will close, job runs in background
                    // User can track progress in Jobs tab
                    // Location data will refresh automatically when job completes
                    if (result?.jobId) {
                      toast.success(`${result.type === 'angles' ? 'Angle' : 'Background'} generation started!`, {
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
      
      {/* Location Angle Generation Modal */}
      {showAngleModal && (
        <LocationAngleGenerationModal
        isOpen={showAngleModal}
        onClose={() => {
          setShowAngleModal(false);
        }}
        locationId={location.locationId}
        locationName={location.name}
        projectId={screenplayId}
        locationProfile={location}
        onComplete={async (result) => {
          // Job started - modal already closed, job runs in background
          // User can track progress in Jobs tab
          // Location data will refresh automatically when job completes (via ProductionJobsPanel)
        }}
      />
    )}
    
    {/* 🔥 NEW: Regenerate Confirmation Modal for Angles */}
    <RegenerateConfirmModal
      isOpen={regenerateAngle !== null}
      onClose={() => setRegenerateAngle(null)}
      onConfirm={() => {
        if (regenerateAngle) {
          handleRegenerateAngle(regenerateAngle.angleId, regenerateAngle.s3Key, regenerateAngle.angle, regenerateAngle.variation);
        }
      }}
      imageType="angle"
    />
    
    {/* 🔥 NEW: Regenerate Confirmation Modal for Backgrounds */}
    <RegenerateConfirmModal
      isOpen={regenerateBackground !== null && regeneratingS3Key === null}
      onClose={() => setRegenerateBackground(null)}
      onConfirm={() => {
        if (regenerateBackground && regeneratingS3Key === null) {
          handleRegenerateBackground(regenerateBackground.backgroundId, regenerateBackground.s3Key, regenerateBackground.backgroundType, regenerateBackground.background);
        }
      }}
      imageType="background"
    />

    
    {/* Image Viewer */}
    {previewImageIndex !== null && (
      <ImageViewer
        images={(() => {
          // Get images for the current group (metadata)
          if (previewGroupName && anglesByMetadata[previewGroupName]) {
            return anglesByMetadata[previewGroupName].map((variation): ImageItem => ({
              id: variation.id || variation.s3Key || `img_${Date.now()}`,
              url: variation.imageUrl || '',
              label: `${location.name} - ${variation.angle} view`,
              s3Key: variation.s3Key,
              metadata: { angle: variation.angle, timeOfDay: variation.timeOfDay, weather: variation.weather }
            }));
          }
          // Fallback to all images
          return allImages.map((img): ImageItem => ({
            id: img.id,
            url: img.imageUrl,
            label: img.label,
            s3Key: img.s3Key,
            metadata: {}
          }));
        })()}
        allImages={allImages.map((img): ImageItem => ({
          id: img.id,
          url: img.imageUrl,
          label: img.label,
          s3Key: img.s3Key,
          metadata: {}
        }))}
        currentIndex={previewImageIndex}
        isOpen={previewImageIndex !== null}
        onClose={() => {
          setPreviewImageIndex(null);
          setPreviewGroupName(null);
        }}
        onDownload={async (image) => {
          try {
            const angle = image.metadata?.angle || 'angle';
            const timeOfDay = image.metadata?.timeOfDay || '';
            const weather = image.metadata?.weather || '';
            const timePart = timeOfDay ? `_${timeOfDay.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
            const weatherPart = weather ? `_${weather.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
            const filename = `${location.name}_${angle.replace(/[^a-zA-Z0-9]/g, '-')}${timePart}${weatherPart}_${Date.now()}.jpg`;
            await downloadImageAsBlob(image.url, filename, image.s3Key);
          } catch (error: any) {
            toast.error('Failed to download image');
          }
        }}
        groupName={previewGroupName || undefined}
      />
    )}
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
                    // Get selected variations by matching IDs - use derived angleVariations for ID matching (has all metadata)
                    const selectedVariations = angleVariations.filter((v: any) => {
                      const imgId = v.id || `ref_${v.s3Key}`;
                      return selectedImageIds.has(imgId);
                    });
                    
                    // Extract s3Keys
                    const s3KeysToDelete = new Set(selectedVariations.map((v: any) => v.s3Key).filter(Boolean));
                    
                    if (s3KeysToDelete.size === 0) {
                      toast.error('No valid images to delete');
                      return;
                    }
                    
                    // Batch delete: Remove all selected angle variations in one update (keep original working pattern)
                    const updatedAngleVariations = angleVariations.filter((variation: any) => 
                      !s3KeysToDelete.has(variation.s3Key)
                    );
                    
                    // Single update call for all deletions
                    await onUpdate(location.locationId, { 
                      angleVariations: updatedAngleVariations
                    });
                    
                    // Clear selection and exit selection mode
                    setSelectedImageIds(new Set());
                    setSelectionMode(false);
                    
                    toast.success(`Successfully deleted ${s3KeysToDelete.size} image${s3KeysToDelete.size !== 1 ? 's' : ''}`);
                  } catch (error: any) {
                    console.error('[LocationDetailModal] Bulk deletion error:', error);
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

