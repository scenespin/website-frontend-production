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
import { X, Upload, Sparkles, Image as ImageIcon, MapPin, FileText, Box, Download, Trash2, Plus, Camera, MoreVertical, Info, Eye, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import LocationAngleGenerationModal from './LocationAngleGenerationModal';
import { GenerateLocationTab } from './Coverage/GenerateLocationTab';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { RegenerateConfirmModal } from './RegenerateConfirmModal';
import { ModernGallery, type GalleryImage } from './Gallery/ModernGallery';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';

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
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references' | 'generate'>('gallery');
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingS3Key, setRegeneratingS3Key] = useState<string | null>(null); // Track which specific image is regenerating
  
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
  
  // 🔥 SIMPLIFIED: Get angleVariations directly from location prop (backend already provides this with presigned URLs)
  // Backend LocationBankService already enriches angleVariations with imageUrl and all metadata
  const angleVariations = location.angleVariations || [];
  
  // 🔥 FIX: Create allCreationImages as separate variable (used in JSX for Creation section display)
  // This is separate from allImages which is used for the gallery viewer
  const allCreationImages: Array<{ id: string; imageUrl: string; label: string; isBase: boolean; s3Key?: string }> = [];
  
  // Add baseReference (first Creation image)
  if (location.baseReference) {
    allCreationImages.push({
      id: location.baseReference.id,
      imageUrl: location.baseReference.imageUrl,
      label: `${location.name} - Base Reference`,
      isBase: true,
      s3Key: location.baseReference.s3Key
    });
  }
  
  // Add additional Creation images from Location Bank API
  if (location.creationImages && Array.isArray(location.creationImages)) {
    location.creationImages.forEach((img: LocationReference) => {
      allCreationImages.push({
        id: img.id,
        imageUrl: img.imageUrl,
        label: `${location.name} - Reference`,
        isBase: false,
        s3Key: img.s3Key
      });
    });
  }
  
  // 🔥 IMPROVED: Organize angles and backgrounds by metadata combinations (timeOfDay + weather) for better visual grouping
  // Group all angles and backgrounds by their metadata combinations - no tag-based filtering, just visual organization
  const imagesByMetadata: Record<string, { angles: any[]; backgrounds: any[] }> = {};
  
  // Group angles
  angleVariations.forEach((variation: any) => {
    // Create a display-friendly key for grouping
    const metadataParts = [
      variation.timeOfDay ? variation.timeOfDay : null,
      variation.weather ? variation.weather : null
    ].filter(Boolean);
    
    const key = metadataParts.length > 0 
      ? metadataParts.join(' • ') 
      : 'No Metadata';
    
    if (!imagesByMetadata[key]) {
      imagesByMetadata[key] = { angles: [], backgrounds: [] };
    }
    imagesByMetadata[key].angles.push(variation);
  });
  
  // Group backgrounds (same metadata structure as angles)
  if (location.backgrounds && Array.isArray(location.backgrounds)) {
    location.backgrounds.forEach((background: LocationBackground) => {
      const metadataParts = [
        background.timeOfDay ? background.timeOfDay : null,
        background.weather ? background.weather : null
      ].filter(Boolean);
      
      const key = metadataParts.length > 0 
        ? metadataParts.join(' • ') 
        : 'No Metadata';
      
      if (!imagesByMetadata[key]) {
        imagesByMetadata[key] = { angles: [], backgrounds: [] };
      }
      imagesByMetadata[key].backgrounds.push(background);
    });
  }
  
  // Sort groups: "No Metadata" last, then alphabetically
  const sortedMetadataKeys = Object.keys(imagesByMetadata).sort((a, b) => {
    if (a === 'No Metadata') return 1;
    if (b === 'No Metadata') return -1;
    return a.localeCompare(b);
  });
  
  // Keep anglesByMetadata for backward compatibility with References tab
  const anglesByMetadata: Record<string, any[]> = {};
  sortedMetadataKeys.forEach(key => {
    anglesByMetadata[key] = imagesByMetadata[key].angles;
  });
  
  // 🔥 SIMPLIFIED: Always show 16:9 cropped version (final version for video)
  // Note: allCreationImages is separate and used for the Creation section display
  const allImages = useMemo(() => {
    const images: Array<{ id: string; imageUrl: string; label: string; isBase: boolean; s3Key?: string; isRegenerated?: boolean; metadata?: any }> = [];
    
    // Add Creation images (baseReference + creationImages) - same as allCreationImages but for gallery
    if (location.baseReference) {
      images.push({
        id: location.baseReference.id,
        imageUrl: location.baseReference.imageUrl,
        label: `${location.name} - Base Reference`,
        isBase: true,
        s3Key: location.baseReference.s3Key,
        metadata: {
          generationMethod: location.baseReference.generationMethod || 'upload'
        }
      });
    }
    
    if (location.creationImages && Array.isArray(location.creationImages)) {
      location.creationImages.forEach((img: LocationReference) => {
        images.push({
          id: img.id,
          imageUrl: img.imageUrl,
          label: `${location.name} - Reference`,
          isBase: false,
          s3Key: img.s3Key,
          metadata: {
            generationMethod: img.generationMethod || 'upload'
          }
        });
      });
    }
    
    // Add angle variations (always 16:9 cropped version)
    angleVariations.forEach((variation: any) => {
      // Extract isRegenerated from metadata (like Characters do)
      const isRegenerated = variation.metadata?.isRegenerated || false;
      
      // ✅ SIMPLIFIED: Just use variation.imageUrl directly (like assets do)
      // Images are now generated directly at 16:9 (or 21:9) - no cropping needed
      // Backend already provides fresh presigned URLs in variation.imageUrl
      images.push({
        id: variation.id || `ref_${variation.s3Key}`,
        imageUrl: variation.imageUrl || '', // Direct 16:9 image (no cropping logic needed)
        label: `${location.name} - ${variation.angle} view`,
        isBase: false,
        s3Key: variation.s3Key,
        isRegenerated: isRegenerated,
        metadata: {
          ...variation.metadata,
          generationMethod: variation.generationMethod || 'angle-variation', // Store generationMethod for source badge
          variation: variation // Store full variation for regeneration
        }
      });
    });
    
    // Feature: Add background images (close-up views of specific areas)
    if (location.backgrounds && Array.isArray(location.backgrounds)) {
      location.backgrounds.forEach((background: LocationBackground) => {
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
        const descriptionLabel = background.description ? ` - ${background.description}` : '';
        
        images.push({
          id: background.id || `bg_${background.s3Key}`,
          imageUrl: background.imageUrl || '',
          label: `${location.name} - ${typeLabel}${descriptionLabel}`,
          isBase: false,
          s3Key: background.s3Key,
          metadata: {
            ...background.metadata,
            generationMethod: background.generationMethod || 'background-generation',
            backgroundType: background.backgroundType,
            background: background // Store full background for reference
          }
        });
      });
    }
    
    return images;
  }, [location.angleVariations, location.baseReference, location.creationImages, location.backgrounds, location.name]);

  // Feature 0179: Query Media Library to get thumbnails for location images
  const { data: mediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    isOpen && !!screenplayId,
    true, // includeAllFolders
    'location', // entityType
    location.locationId // entityId
  );

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

  // Feature 0179: Extract thumbnail S3 keys for bulk presigned URL generation
  const thumbnailS3Keys = useMemo(() => {
    const keys = allImages
      .map(img => {
        const s3Key = img.s3Key;
        if (!s3Key) return null;
        const thumbnailS3Key = thumbnailS3KeyMap.get(s3Key) || (img as any).metadata?.thumbnailS3Key;
        return thumbnailS3Key || null;
      })
      .filter((key): key is string => key !== null);
    return keys;
  }, [allImages, thumbnailS3KeyMap]);

  // Feature 0179: Get presigned URLs for thumbnails
  const { data: thumbnailUrls = new Map() } = useBulkPresignedUrls(
    thumbnailS3Keys.length > 0 ? thumbnailS3Keys : [],
    isOpen && thumbnailS3Keys.length > 0
  );
  
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
      await onUploadImage(location.locationId, file);
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
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#DC143C]/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-[#DC143C]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#FFFFFF]">{location.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-[#808080]">{typeLabel}</p>
                    {/* 🔥 READ-ONLY BADGE */}
                    <span className="px-2 py-0.5 bg-[#6B7280]/20 border border-[#6B7280]/50 rounded text-[10px] text-[#9CA3AF]">
                      Read-only - Edit in Creation section
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-[#3F3F46] bg-[#141414] flex items-center gap-2">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'gallery'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Gallery
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Info
              </button>
              <button
                onClick={() => setActiveTab('references')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'references'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <Box className="w-4 h-4 inline mr-2" />
                References ({allImages.length})
              </button>
              
              {/* Generate Packages Button - Always visible */}
              <div className="ml-auto">
                <button
                  onClick={handleGeneratePackages}
                  disabled={isGeneratingAngles}
                  className={`px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium ${
                    activeTab === 'generate'
                      ? 'bg-[#DC143C] text-white'
                      : 'bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF]'
                  }`}
                >
                  <span className="text-base">🤖</span>
                  {isGeneratingAngles ? 'Generating...' : 'Generate Packages'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {activeTab === 'gallery' && (
                <div className="p-6">
                  {allImages.length > 0 ? (
                    <ModernGallery
                      images={allImages.map((img): GalleryImage => {
                        // Feature 0179: Get thumbnail URL if available
                        const s3Key = img.s3Key;
                        const thumbnailS3Key = s3Key ? (thumbnailS3KeyMap.get(s3Key) || (img as any).metadata?.thumbnailS3Key) : null;
                        let thumbnailUrl = img.imageUrl;
                        if (thumbnailS3Key && thumbnailUrls.has(thumbnailS3Key)) {
                          thumbnailUrl = thumbnailUrls.get(thumbnailS3Key)!;
                        }
                        
                        return {
                          id: img.id,
                          imageUrl: img.imageUrl, // Always use full image for lightbox/preview
                          thumbnailUrl: thumbnailUrl, // Use thumbnail for grid view, fallback to full image
                          label: img.label,
                          isBase: img.isBase,
                          source: (img.metadata?.generationMethod === 'ai-generated' || img.metadata?.generationMethod === 'angle-variation') 
                            ? 'pose-generation' 
                            : 'user-upload',
                          width: 16,
                          height: 9
                        };
                      })}
                      layout="grid-only"
                      onImageClick={(index) => {
                        setPreviewImageIndex(index);
                        setPreviewGroupName(null);
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

              {activeTab === 'info' && (
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
                      {location.angleVariations && location.angleVariations.length > 0 && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Angle Variations</label>
                          <p className="text-[#808080]">{location.angleVariations.length} angle{location.angleVariations.length !== 1 ? 's' : ''}</p>
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

              {activeTab === 'references' && (
                <div className="p-6 space-y-6">
                  {/* Phase 2: Selection Mode Toggle & Bulk Actions */}
                  {(angleVariations.length > 0 || (location.backgrounds && location.backgrounds.length > 0)) && (
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
                                  if (location.backgrounds) {
                                    location.backgrounds.forEach((b: LocationBackground) => {
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
                                {selectedImageIds.size === (angleVariations.length + (location.backgrounds?.length || 0)) ? 'Deselect All' : 'Select All'}
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
                  
                  {/* 🔥 SEPARATION: Production Hub Images - Angle Variations & Backgrounds (Editable/Deletable) */}
                  {(angleVariations.length > 0 || (location.backgrounds && location.backgrounds.length > 0)) && (
                    <div className="p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            Production Hub Images ({angleVariations.length + (location.backgrounds?.length || 0)})
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
                              
                              {/* Angles Section */}
                              {variations.length > 0 && (
                                <div className="space-y-2">
                                  {backgrounds.length > 0 && (
                                    <p className="text-xs text-[#808080] uppercase tracking-wide">Angles</p>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {variations.map((variation: any) => {
                          const img = allImages.find(i => i.s3Key === variation.s3Key && !i.isBase);
                          if (!img) return null;
                          const imgId = img.id || `ref_${variation.s3Key}`;
                          const isSelected = selectedImageIds.has(imgId);
                          
                          return (
                            <div
                              key={imgId}
                              className={`relative group aspect-square bg-[#141414] border rounded-lg overflow-hidden transition-colors cursor-pointer ${
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
                                src={img.imageUrl}
                                alt={img.label}
                                className={`w-full h-full object-cover ${
                                  regeneratingS3Key && regeneratingS3Key.trim() === (variation.s3Key || '').trim()
                                    ? 'animate-pulse opacity-75'
                                    : ''
                                }`}
                              />
                              {/* Shimmer overlay for regenerating images */}
                              {regeneratingS3Key && regeneratingS3Key.trim() === (variation.s3Key || '').trim() && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                              )}
                              {/* Top-right label: Angle/Regenerated */}
                              <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded ${
                                (img as any).isRegenerated || variation.metadata?.isRegenerated ? 'bg-[#DC143C]' : 'bg-[#8B5CF6]'
                              }`}>
                                {(img as any).isRegenerated || variation.metadata?.isRegenerated ? 'Regenerated' : 'Angle'}
                              </div>
                              {/* Bottom-right label: Provider */}
                              {(() => {
                                // Check multiple possible paths for providerId (backend may nest it differently)
                                const providerId = (img as any).metadata?.providerId 
                                  || variation.metadata?.providerId 
                                  || variation.metadata?.generationMetadata?.providerId
                                  || (img as any).metadata?.generationMetadata?.providerId;
                                if (!providerId) return null;
                                const providerLabel = getProviderLabel(providerId);
                                if (!providerLabel) return null;
                                return (
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                    {providerLabel}
                                  </div>
                                );
                              })()}
                              <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent transition-opacity ${
                                selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Delete button - all Production Hub images can be deleted - only show when not in selection mode */}
                                {!selectionMode && (
                                <div className="absolute top-2 right-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className="p-1.5 bg-[#DC143C]/80 hover:bg-[#DC143C] rounded-lg transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-3 h-3 text-white" />
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
                                            
                                            // Remove from angleVariations by matching s3Key
                                            const updatedAngleVariations = angleVariations.filter(
                                              (v: any) => v.s3Key !== variation.s3Key
                                            );
                                            
                                            // 🔥 ONE-WAY SYNC: Only update Production Hub backend
                                            await onUpdate(location.locationId, {
                                              angleVariations: updatedAngleVariations
                                            });
                                            
                                            queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
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
                              </div>
                            </div>
                          );
                        })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Backgrounds Section */}
                              {backgrounds.length > 0 && (
                                <div className="space-y-2">
                                  {variations.length > 0 && (
                                    <p className="text-xs text-[#808080] uppercase tracking-wide">Backgrounds</p>
                                  )}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {backgrounds.map((background: LocationBackground) => {
                                      const img = allImages.find(i => i.s3Key === background.s3Key && !i.isBase);
                                      if (!img) return null;
                                      const imgId = img.id || `bg_${background.s3Key}`;
                                      const isSelected = selectedImageIds.has(imgId);
                                      
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
                                          className={`relative group aspect-square bg-[#141414] border rounded-lg overflow-hidden transition-colors ${
                                            selectionMode
                                              ? isSelected
                                                ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                                : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                                              : 'border-[#3F3F46] hover:border-[#DC143C]'
                                          }`}
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
                                            src={img.imageUrl}
                                            alt={img.label}
                                            className="w-full h-full object-cover"
                                          />
                                          {/* Top-right label: Background Type */}
                                          <div className="absolute top-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-[#10B981]">
                                            {typeLabel}
                                          </div>
                                          {/* Bottom-right label: Provider */}
                                          {(() => {
                                            const providerId = (img as any).metadata?.providerId || background.metadata?.providerId;
                                            if (!providerId) return null;
                                            const providerLabel = getProviderLabel(providerId);
                                            if (!providerLabel) return null;
                                            return (
                                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                                {providerLabel}
                                              </div>
                                            );
                                          })()}
                                          <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent transition-opacity ${
                                            selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                                          }`}>
                                            <div className="absolute bottom-2 left-2 right-2">
                                              <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                            </div>
                                            {/* Delete button - only show when not in selection mode */}
                                            {!selectionMode && (
                                              <div className="absolute top-2 right-2">
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <button
                                                      className="p-1.5 bg-[#DC143C]/80 hover:bg-[#DC143C] rounded-lg transition-colors"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <MoreVertical className="w-3 h-3 text-white" />
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
                                                        setPreviewImageIndex(allImages.findIndex(i => i.id === imgId));
                                                        setPreviewGroupName(displayName);
                                                      }}
                                                    >
                                                      <Eye className="w-4 h-4 mr-2 text-[#808080]" />
                                                      Preview
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
                                                          
                                                          // Remove from backgrounds
                                                          const updatedBackgrounds = (location.backgrounds || []).filter(
                                                            (b: LocationBackground) => b.s3Key !== background.s3Key
                                                          );
                                                          
                                                          await onUpdate(location.locationId, {
                                                            backgrounds: updatedBackgrounds
                                                          });
                                                          
                                                          queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
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
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {allCreationImages.map((img) => (
                          <div
                            key={img.id}
                            className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden opacity-75"
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

              {/* Generate Tab */}
              {activeTab === 'generate' && (
                <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
                  <GenerateLocationTab
                    locationId={location.locationId}
                    locationName={location.name}
                    screenplayId={screenplayId || ''}
                    locationProfile={location}
                    location={location}
                    onClose={onClose}
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
                    }}
                  />
                </div>
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
    
    {/* 🔥 NEW: Regenerate Confirmation Modal */}
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
                    // Get selected variations by matching IDs
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
                    
                    // Batch delete: Remove all selected angle variations in one update
                    const updatedAngleVariations = location.angleVariations.filter((variation: any) => 
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

