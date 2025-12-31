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
import { X, Trash2, Image as ImageIcon, Sparkles, Package, Car, Armchair, Box, Upload, FileText, MoreVertical, Info, Eye, Download, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import AssetAngleGenerationModal from './AssetAngleGenerationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { RegenerateConfirmModal } from './RegenerateConfirmModal';
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

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onUpdate: () => void;
  onDelete?: () => void; // 🔥 Made optional - delete removed from Production Hub
  isMobile?: boolean;
  onAssetUpdate?: (updatedAsset: Asset) => void; // 🔥 NEW: Callback to update asset in parent
}

export default function AssetDetailModal({ 
  isOpen, 
  onClose, 
  asset, 
  onUpdate,
  onDelete,
  isMobile = false,
  onAssetUpdate
}: AssetDetailModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient(); // 🔥 NEW: For invalidating Media Library cache
  // 🔥 ONE-WAY SYNC: Removed ScreenplayContext sync - Production Hub changes stay in Production Hub
  // 🔥 FIX: Use screenplayId (primary) with projectId fallback for backward compatibility
  const screenplayId = asset?.screenplayId || asset?.projectId;
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  // Phase 2: Multiple Delete Checkbox
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  // 🔥 NEW: Regeneration state
  const [regenerateAngle, setRegenerateAngle] = useState<{ angleId: string; s3Key: string; angle: string; metadata?: any } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingS3Key, setRegeneratingS3Key] = useState<string | null>(null); // Track which specific image is regenerating

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
      const response = await fetch(`${BACKEND_API_URL}/api/asset-bank/${asset.id}/regenerate-angle?screenplayId=${screenplayId}`, {
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

  const categoryMeta = ASSET_CATEGORY_METADATA[asset.category];
  const assetImages = asset.images || []; // Safety check for undefined images
  
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
    const assetIdPattern = `asset/${asset.id}/`;
    
    const filtered = allMediaFiles.filter((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return false;
      if (entityS3Keys.has(file.s3Key)) return false;
      
      const entityType = (file as any).entityType || file.metadata?.entityType;
      const entityId = (file as any).entityId || file.metadata?.entityId;
      if (entityType === 'asset' && entityId === asset.id) {
        return true;
      }
      return file.s3Key.includes(assetIdPattern);
    });
    
    return [...entityMediaFiles, ...filtered];
  }, [entityMediaFiles, allMediaFiles, asset.id, isOpen]);
  
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
          label: `${asset.name} - Image ${idx + 1}`,
          isBase: idx === 0,
          isAngleReference: false,
          isCreationImage: true,
          metadata: img.metadata || {}
        });
      }
    });
    
    // Add angleReferences metadata (from asset.angleReferences)
    const angleReferences = asset.angleReferences || [];
    angleReferences.forEach((ref: any) => {
      if (ref.s3Key) {
        map.set(ref.s3Key, {
          id: ref.id || `angle-${ref.angle || 'unknown'}`,
          label: `${asset.name} - ${ref.angle || 'Angle'} view`,
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
  }, [asset.images, asset.angleReferences, asset.name]);
  
  // Build images from Media Library FIRST (primary source), enrich with DynamoDB metadata
  const imagesFromMediaLibrary = useMemo(() => {
    const images: Array<{
      id: string;
      imageUrl: string;
      s3Key: string;
      label: string;
      isBase: boolean;
      isAngleReference?: boolean;
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
      const isAngleReference = file.metadata?.source === 'angle-generation' ||
                                file.metadata?.uploadMethod === 'angle-generation' ||
                                (dynamoMetadata?.isAngleReference ?? false);
      const isCreationImage = !isAngleReference;
      const isBase = dynamoMetadata?.isBase ?? (index === 0 && isCreationImage);
      
      // Get label from DynamoDB metadata or Media Library
      const label = dynamoMetadata?.label ||
                    file.fileName?.replace(/\.[^/.]+$/, '') ||
                    `${asset.name} - Image ${index + 1}`;
      
      images.push({
        id: dynamoMetadata?.id || file.id || `img-${index}`,
        imageUrl: '', // Will be generated from s3Key via presigned URL
        s3Key: file.s3Key,
        label,
        isBase,
        isAngleReference,
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
  }, [mediaFiles, dynamoDBMetadataMap, asset.name]);
  
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
  const enrichedMediaLibraryImages = useMemo(() => {
    return imagesFromMediaLibrary.map(img => ({
      ...img,
      imageUrl: mediaLibraryUrls.get(img.s3Key) || img.imageUrl || ''
    }));
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
      angle?: string;
      isRegenerated?: boolean;
      metadata?: any;
      index: number;
    }> = [];
    const mediaLibraryS3KeysSet = new Set(mediaLibraryS3Keys);
    
    // Check creation images
    assetImages.forEach((img: any, idx: number) => {
      const source = img.metadata?.source;
      const isCreationImage = !source || source === 'user-upload';
      
      if (isCreationImage) {
        const s3Key = img.s3Key || img.metadata?.s3Key;
        if (s3Key && !mediaLibraryS3KeysSet.has(s3Key)) {
          fallback.push({
            id: `img-${idx}`,
            imageUrl: img.url || '',
            s3Key,
            label: `${asset.name} - Image ${idx + 1}`,
            isBase: idx === 0,
            isAngleReference: false,
            metadata: img.metadata || {},
            index: fallback.length
          });
        }
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
          label: `${asset.name} - ${ref.angle || 'Angle'} view`,
          isBase: false,
          isAngleReference: true,
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
  }, [asset.images, asset.angleReferences, asset.name, mediaLibraryS3Keys]);
  
  // 🔥 COMBINED: Media Library images (primary) + Fallback images (from asset prop)
  const allImages = useMemo(() => {
    return [...enrichedMediaLibraryImages, ...fallbackImages];
  }, [enrichedMediaLibraryImages, fallbackImages]);
  
  // 🔥 DERIVED: Separate creation images and angle references for backward compatibility
  const userImages = useMemo(() => {
    return allImages.filter(img => !img.isAngleReference);
  }, [allImages]);
  
  const angleImageObjects = useMemo(() => {
    return allImages.filter(img => img.isAngleReference);
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
  
  const canGenerateAngles = userImages.length >= 1; // Need at least 1 creation image for angle generation
  
  // 🔥 DEBUG: Log asset images for troubleshooting
  useEffect(() => {
    if (isOpen) {
      console.log('[AssetDetailModal] Asset images:', {
        assetId: asset.id,
        assetName: asset.name,
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
  }, [isOpen, asset.id, asset.name, mediaFiles.length, imagesFromMediaLibrary.length, enrichedMediaLibraryImages.length, fallbackImages.length, allImages.length, userImages.length, angleImageObjects.length, canGenerateAngles]);

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

        const response = await fetch(`/api/asset-bank/${asset.id}/images`, {
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
      
      // 🔥 NEW: Invalidate Media Library cache so new image appears
      if (screenplayId) {
        queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
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

  const getCategoryIcon = () => {
    const icons = { prop: Package, vehicle: Car, furniture: Armchair, other: Box };
    const Icon = icons[asset.category];
    return <Icon className="w-6 h-6" />;
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
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#DC143C]/10 rounded-lg">
                  {getCategoryIcon()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#FFFFFF]">{asset.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#808080]">{categoryMeta.label}</span>
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
              
              {/* Generate Angle Package Button - Always visible */}
              <div className="ml-auto">
                {canGenerateAngles ? (
                  <button
                    onClick={() => setShowAngleModal(true)}
                    disabled={isGeneratingAngles}
                    className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <span className="text-base">🤖</span>
                    {isGeneratingAngles ? 'Generating...' : 'Generate Angle Package'}
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg text-sm text-[#808080]">
                    ⚠️ Upload at least 1 image to generate angle package
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {activeTab === 'gallery' && (
                <div className="p-6">
                  {allImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {allImages.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setPreviewImageIndex(idx)}
                          className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden hover:border-[#DC143C] transition-colors"
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.label}
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, img)}
                          />
                          {img.isBase && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-[#DC143C] text-white text-[10px] rounded">
                              Base
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Box className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Asset Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Asset Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        <p className="text-[#FFFFFF]">{asset.name}</p>
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

              {activeTab === 'references' && (
                <div className="p-6 space-y-6">
                  {/* Phase 2: Selection Mode Toggle & Bulk Actions */}
                  {angleImageObjects.length > 0 && (
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {angleImageObjects.map((img) => {
                          // All angleImages are Production Hub images (editable/deletable)
                          const isSelected = selectedImageIds.has(img.id);
                          return (
                            <div
                              key={img.id}
                              className={`relative group aspect-square bg-[#141414] border rounded-lg overflow-hidden transition-colors cursor-pointer ${
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
                                src={img.imageUrl}
                                alt={img.label}
                                className={`w-full h-full object-cover ${
                                  regeneratingS3Key && regeneratingS3Key.trim() === (img.s3Key || '').trim()
                                    ? 'animate-pulse opacity-75'
                                    : ''
                                }`}
                                onError={(e) => handleImageError(e, img)}
                              />
                              {/* Shimmer overlay for regenerating images */}
                              {regeneratingS3Key && regeneratingS3Key.trim() === (img.s3Key || '').trim() && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                              )}
                              {/* Top-right label: Angle/Regenerated */}
                              <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded ${
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
                              <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent transition-opacity ${
                                selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Delete button - all Production Hub images can be deleted - only show when not in selection mode */}
                                {!img.isBase && !selectionMode && (
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
                                          const filename = `${asset.name}_${angle.replace(/[^a-zA-Z0-9]/g, '-')}_${Date.now()}.jpg`;
                                          await downloadImageAsBlob(img.imageUrl, filename, img.s3Key);
                                        } catch (error: any) {
                                          toast.error('Failed to download image');
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-2 text-[#808080]" />
                                      Download
                                    </DropdownMenuItem>
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
                                          
                                          const token = await getToken({ template: 'wryda-backend' });
                                          if (!token) {
                                            toast.error('Authentication required');
                                            return;
                                          }
                                          
                                          // 🔥 FIX: For angle images, only update angleReferences (same pattern as LocationDetailModal)
                                          // Angle images are stored in angleReferences, not in the images array
                                          const updatedAngleReferences = (asset.angleReferences || []).filter(
                                            (ref: any) => ref.s3Key !== img.s3Key
                                          );
                                          
                                          // Update asset via API - only update angleReferences for angle images
                                          const response = await fetch(`/api/asset-bank/${asset.id}?screenplayId=${encodeURIComponent(screenplayId)}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                              angleReferences: updatedAngleReferences
                                            }),
                                          });
                                          
                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.error || 'Failed to delete image');
                                          }
                                          
                                          // 🔥 ONE-WAY SYNC: Do NOT update ScreenplayContext - Production Hub changes stay in Production Hub
                                          // Production Hub images (createdIn: 'production-hub') should NOT sync back to Creation section
                                          
                                          // 🔥 FIX: Use refetchQueries for immediate UI update (same pattern as CharacterDetailModal)
                                          await Promise.all([
                                            queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] }),
                                            queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })
                                          ]);
                                          
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    {/* Asset Angle Generation Modal */}
    {showAngleModal && (
      <AssetAngleGenerationModal
        isOpen={showAngleModal}
        onClose={() => {
          setShowAngleModal(false);
        }}
        assetId={asset.id}
        assetName={asset.name}
        projectId={screenplayId || asset.projectId || ''}
        asset={asset}
        onComplete={async (result) => {
          toast.success(`Angle generation started for ${asset.name}!`, {
            description: 'Check the Jobs tab to track progress.'
          });
          setShowAngleModal(false);
          setIsGeneratingAngles(false);
          
          // Refresh asset data after delay to catch completed angles
          setTimeout(() => {
            onUpdate();
          }, 5000);
        }}
      />
    )}
    
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
                  
                  // Batch delete: Remove all selected angle references in one update
                  const updatedAngleReferences = (asset.angleReferences || []).filter((ref: any) => 
                    !s3KeysToDelete.has(ref.s3Key)
                  );
                  
                  // Make API call to update asset (same pattern as single deletion)
                  const token = await getToken({ template: 'wryda-backend' });
                  if (!token) {
                    toast.error('Authentication required');
                    return;
                  }
                  
                  const response = await fetch(`/api/asset-bank/${asset.id}?screenplayId=${encodeURIComponent(screenplayId)}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      angleReferences: updatedAngleReferences
                    }),
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to delete images');
                  }
                  
                  // Refetch queries for immediate UI update (same pattern as single deletion)
                  await Promise.all([
                    queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] }),
                    queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })
                  ]);
                  
                  // Trigger parent update
                  onUpdate();
                  
                  // Update asset via callback if provided
                  if (onAssetUpdate) {
                    onAssetUpdate({
                      ...asset,
                      angleReferences: updatedAngleReferences
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
