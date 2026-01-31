'use client';

/**
 * Asset Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Matches LocationBankPanel pattern exactly
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Package, Car, Armchair, Box, Film, X, Loader2 } from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import AssetUploadModal from './AssetUploadModal';
import AssetDetailModal from './AssetDetailModal';
import { useEditorContext, useContextStore } from '@/lib/contextStore';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { toast } from 'sonner';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { useQueryClient } from '@tanstack/react-query';
import { useAssets } from '@/hooks/useAssetBank';
import { useMediaFiles, useBulkPresignedUrls, useDropboxPreviewUrls } from '@/hooks/useMediaLibrary';
import { getMediaFileDisplayUrl } from './utils/imageUrlResolver';

interface AssetBankPanelProps {
  className?: string;
  isMobile?: boolean;
  entityToOpen?: string | null; // Asset ID to open modal for
  onEntityOpened?: () => void; // Callback when entity modal is opened
}

export default function AssetBankPanel({ className = '', isMobile = false, entityToOpen, onEntityOpened }: AssetBankPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId; // 🔥 MATCH MODALS: Use context directly (same as AssetDetailModal)
  const editorContext = useEditorContext();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // 🔥 MATCH MODALS: Use React Query hook directly (same pattern as AssetDetailModal)
  const { data: assets = [], isLoading: queryLoading } = useAssets(
    screenplayId || '',
    'production-hub',
    !!screenplayId
  );

  // 🔥 Feature 0200: Query Media Library for all asset files (source of truth for cards)
  // This matches the pattern used by AssetDetailModal - ensures cards and modals show same data
  const { data: allAssetMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined, // no folder filter
    !!screenplayId, // enabled
    true, // includeAllFolders
    'asset' // entityType - get all asset files
  );

  // 🔥 Feature 0200: Process Media Library files to get images per asset
  // This is the same logic used in AssetDetailModal - ensures consistency
  const assetImagesFromMediaLibrary = useMemo(() => {
    const assetMap: Record<string, {
      creationImages: Array<{ s3Key: string; label?: string; isBase?: boolean }>;
      angleReferences: Array<{ s3Key: string; angle?: string; label?: string }>;
    }> = {};

    allAssetMediaFiles.forEach((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return;
      
      const entityId = file.metadata?.entityId || file.entityId;
      if (!entityId) return;

      if (!assetMap[entityId]) {
        assetMap[entityId] = { creationImages: [], angleReferences: [] };
      }

      // Determine image type from Media Library metadata
      const isAngleReference = file.metadata?.source === 'angle-generation' ||
                              file.metadata?.uploadMethod === 'angle-generation' ||
                              file.metadata?.isAngleReference === true;
      const isBase = file.metadata?.isBase === true;

      if (isAngleReference) {
        assetMap[entityId].angleReferences.push({
          s3Key: file.s3Key,
          angle: file.metadata?.angle,
          label: file.metadata?.angle || 'angle'
        });
      } else {
        assetMap[entityId].creationImages.push({
          s3Key: file.s3Key,
          label: file.fileName?.replace(/\.[^/.]+$/, '') || 'Image',
          isBase
        });
      }
    });

    return assetMap;
  }, [allAssetMediaFiles]);

  // 🔥 Feature 0200: Get all s3Keys for presigned URL generation
  const allAssetS3Keys = useMemo(() => {
    const keys: string[] = [];
    Object.values(assetImagesFromMediaLibrary).forEach(asset => {
      asset.creationImages.forEach(img => keys.push(img.s3Key));
      asset.angleReferences.forEach(ref => keys.push(ref.s3Key));
    });
    return keys;
  }, [assetImagesFromMediaLibrary]);

  // 🔥 Feature 0200: Generate presigned URLs for all asset images
  const { data: assetPresignedUrls = new Map() } = useBulkPresignedUrls(
    allAssetS3Keys,
    !!screenplayId && allAssetS3Keys.length > 0
  );
  const dropboxUrlMap = useDropboxPreviewUrls(allAssetMediaFiles, !!screenplayId && allAssetMediaFiles.length > 0);
  const assetMediaFileMap = useMemo(() => {
    const map = new Map<string, any>();
    allAssetMediaFiles.forEach((file: any) => {
      if (file.s3Key && !file.s3Key.startsWith('thumbnails/')) map.set(file.s3Key, file);
    });
    return map;
  }, [allAssetMediaFiles]);
  const presignedMapsForDisplay = useMemo(() => ({
    fullImageUrlsMap: assetPresignedUrls,
    thumbnailS3KeyMap: null as Map<string, string> | null,
    thumbnailUrlsMap: null as Map<string, string> | null,
  }), [assetPresignedUrls]);

  const isLoading = queryLoading;

  // Local UI state only
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Auto-open modal when entityToOpen is set
  useEffect(() => {
    if (entityToOpen && !showDetailModal) {
      const asset = assets.find(a => a.id === entityToOpen);
      if (asset) {
        setSelectedAssetId(entityToOpen);
        setShowDetailModal(true);
        onEntityOpened?.();
      }
    }
  }, [entityToOpen, assets, showDetailModal, onEntityOpened]);

  // Early return after all hooks
  if (!screenplayId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading assets...</p>
        </div>
      </div>
    );
  }

  // Helper functions
  const getCategoryIcon = (category: AssetCategory) => {
    const icons = {
      prop: Package,
      vehicle: Car,
      furniture: Armchair,
      other: Box,
    };
    return icons[category];
  };

  async function updateAsset(assetId: string, updates: Partial<Asset>) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const apiUpdates: any = {};
      
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.category !== undefined) apiUpdates.category = updates.category;

      const response = await fetch(`/api/asset-bank/${assetId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUpdates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update asset: ${response.status}`);
      }

      toast.success('Asset updated successfully');
      
      // 🔥 FIX: Use same aggressive pattern as AssetDetailModal (works!)
      // removeQueries + invalidateQueries + setTimeout refetchQueries with type: 'active'
      // This ensures disabled queries don't block invalidation (see GitHub issue #947)
      queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ 
        queryKey: ['media', 'files', screenplayId],
        exact: false
      });
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ['assets', screenplayId, 'production-hub'],
          type: 'active' // Only refetch active (enabled) queries
        });
        queryClient.refetchQueries({ 
          queryKey: ['media', 'files', screenplayId],
          exact: false
        });
      }, 2000);
    } catch (error: any) {
      console.error('[AssetBank] Failed to update asset:', error);
      toast.error(`Failed to update asset: ${error.message}`);
    }
  }

  const filteredAssets = selectedCategory === 'all'
    ? assets
    : assets.filter(a => a.category === selectedCategory);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
      </div>
    );
  }


  return (
    <div className={`flex flex-col h-full bg-[#0A0A0A] ${className}`}>
      {/* Context Indicator Banner */}
      {editorContext.currentSceneName && (
        <div className="bg-[#1F1F1F] border-b border-[#3F3F46] px-4 py-2">
          <div className="text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Film className="w-4 h-4 text-[#808080] flex-shrink-0" />
              <span className="text-[#808080]">Managing assets for scene:</span>
              <span className="font-semibold text-[#FFFFFF] truncate">{editorContext.currentSceneName}</span>
            </div>
            <button
              onClick={() => {
                const { clearContext } = useContextStore.getState();
                clearContext();
                toast.success('Context cleared');
              }}
              className="p-1 rounded hover:bg-[#1F1F1F] text-[#808080] hover:text-[#FFFFFF] flex-shrink-0 transition-colors"
              title="Clear context"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 p-4 border-b border-[#3F3F46] overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#DC143C] text-white'
              : 'bg-[#141414] text-[#B3B3B3] hover:bg-[#1F1F1F] border border-[#3F3F46]'
          }`}
        >
          All Props
        </button>
        {(['prop', 'vehicle', 'furniture', 'other'] as AssetCategory[]).map((cat) => {
          const Icon = getCategoryIcon(cat);
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-[#DC143C] text-white'
                  : 'bg-[#141414] text-[#B3B3B3] hover:bg-[#1F1F1F] border border-[#3F3F46]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {ASSET_CATEGORY_METADATA[cat].label}
            </button>
          );
        })}
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4 mx-4">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#808080]">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium text-[#B3B3B3]">No assets yet</p>
            <p className="text-sm text-[#808080] mt-2">
              {selectedCategory === 'all'
                ? 'Assets are created in the Write/Create section'
                : `No ${ASSET_CATEGORY_METADATA[selectedCategory as AssetCategory]?.label.toLowerCase()} found`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
            {filteredAssets.map((asset) => {
              const allReferences: CinemaCardImage[] = [];
              
              // 🔥 Feature 0200: Use Media Library as source of truth (matches AssetDetailModal pattern)
              const mediaLibraryImages = assetImagesFromMediaLibrary[asset.id];
              
              if (mediaLibraryImages) {
                // Add creation images (user-uploaded, from Creation section) with valid presigned URLs
                mediaLibraryImages.creationImages.forEach((img) => {
                  const file = assetMediaFileMap.get(img.s3Key);
                  const imageUrl = getMediaFileDisplayUrl(
                    file ?? { id: img.s3Key, storageType: 'local', s3Key: img.s3Key } as any,
                    presignedMapsForDisplay,
                    dropboxUrlMap
                  );
                  if (imageUrl) {
                    allReferences.push({
                      id: img.s3Key,
                      imageUrl,
                      label: `${asset.name} - ${img.label || 'Image'}`
                    });
                  }
                });
                
                // Add angle references with valid presigned URLs
                mediaLibraryImages.angleReferences.forEach((ref) => {
                  const file = assetMediaFileMap.get(ref.s3Key);
                  const imageUrl = getMediaFileDisplayUrl(
                    file ?? { id: ref.s3Key, storageType: 'local', s3Key: ref.s3Key } as any,
                    presignedMapsForDisplay,
                    dropboxUrlMap
                  );
                  if (imageUrl) {
                    allReferences.push({
                      id: ref.s3Key,
                      imageUrl,
                      label: `${asset.name} - ${ref.angle || ref.label || 'angle'} view`
                    });
                  }
                });
              } else {
                // Fallback to asset prop data (for backward compatibility)
                if (asset.images && asset.images.length > 0) {
                  asset.images.forEach((img, idx) => {
                    const isAngleGenerated = img.metadata?.source === 'angle-generation' || img.metadata?.source === 'image-generation';
                    if (!isAngleGenerated && img.url) {
                      allReferences.push({
                        id: img.s3Key || `img-${asset.id}-${idx}`,
                        imageUrl: img.url,
                        label: `${asset.name} - Image ${idx + 1}`
                      });
                    }
                  });
                }
                
                const angleRefs = asset.angleReferences || [];
                angleRefs.forEach((ref, idx) => {
                  if (ref && ref.imageUrl) {
                    allReferences.push({
                      id: ref.s3Key || `angle-${asset.id}-${idx}`,
                      imageUrl: ref.imageUrl,
                      label: `${asset.name} - ${ref.angle || 'angle'} view`
                    });
                  }
                });
              }

              // 🔥 Feature 0200: Count images with valid presigned URLs (matches detail modal)
              const imageCount = allReferences.length;
              const metadata = imageCount > 0 ? `${imageCount} image${imageCount !== 1 ? 's' : ''}` : undefined;

              return (
                <CinemaCard
                  key={asset.id}
                  id={asset.id}
                  name={asset.name}
                  type={asset.category}
                  typeLabel={ASSET_CATEGORY_METADATA[asset.category].label}
                  mainImage={allReferences.length > 0 ? allReferences[0] : null}
                  referenceImages={allReferences.slice(1)}
                  referenceCount={allReferences.length}
                  metadata={metadata}
                  description={asset.description}
                  cardType="asset"
                  onClick={() => {
                    setSelectedAssetId(asset.id);
                    setShowDetailModal(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AssetUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        projectId={screenplayId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })}
      />

      {/* Asset Detail Modal */}
      {showDetailModal && selectedAssetId && (() => {
        const selectedAsset = filteredAssets.find(a => a.id === selectedAssetId);
        return selectedAsset ? (
          <AssetDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAssetId(null);
            }}
            asset={selectedAsset}
            onUpdate={() => {
              // 🔥 FIX: Use same aggressive pattern as AssetDetailModal
              queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              setTimeout(() => {
                queryClient.refetchQueries({ 
                  queryKey: ['assets', screenplayId, 'production-hub'],
                  type: 'active'
                });
              }, 2000);
            }}
            onDelete={async () => {
              // 🔥 FIX: Use same aggressive pattern as AssetDetailModal
              queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'creation'] });
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'creation'] });
              setTimeout(() => {
                queryClient.refetchQueries({ 
                  queryKey: ['assets', screenplayId, 'production-hub'],
                  type: 'active'
                });
                queryClient.refetchQueries({ 
                  queryKey: ['assets', screenplayId, 'creation'],
                  type: 'active'
                });
              }, 2000);
              setShowDetailModal(false);
              setSelectedAssetId(null);
            }}
            onAssetUpdate={() => {
              // 🔥 FIX: Use same aggressive pattern as AssetDetailModal.handleFileUpload (works!)
              // removeQueries + invalidateQueries + setTimeout refetchQueries with type: 'active'
              // Also invalidate Media Library and presigned URLs to ensure card thumbnails update
              queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
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
                  queryKey: ['assets', screenplayId, 'production-hub'],
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
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
