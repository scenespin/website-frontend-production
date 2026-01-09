'use client';

/**
 * Asset Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Matches LocationBankPanel pattern exactly
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Package, Car, Armchair, Box, Film, X, Loader2 } from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import AssetUploadModal from './AssetUploadModal';
import AssetDetailModal from './AssetDetailModal';
import { useEditorContext, useContextStore } from '@/lib/contextStore';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAssets } from '@/hooks/useAssetBank';
import { AssetCard } from './AssetCard';

interface AssetBankPanelProps {
  className?: string;
  isMobile?: boolean;
  entityToOpen?: string | null; // Asset ID to open modal for
  onEntityOpened?: () => void; // Callback when entity modal is opened
}

export default function AssetBankPanel({ className = '', isMobile = false, entityToOpen, onEntityOpened }: AssetBankPanelProps) {
  const { getToken } = useAuth();
  const editorContext = useEditorContext();
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const queryClient = useQueryClient();

  // React Query for fetching assets
  const { data: assets = [], isLoading: queryLoading } = useAssets(
    screenplayId || '',
    'production-hub',
    !!screenplayId
  );

  const isLoading = queryLoading;
  
  // 🔥 DEBUG: Log when assets data changes
  useEffect(() => {
    console.log('[AssetBankPanel] 🔍 Assets data changed:', {
      assetCount: assets.length,
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        imageCount: a.images?.length || 0,
        angleReferencesCount: a.angleReferences?.length || 0,
        images: a.images?.map(img => ({ 
          url: img.url?.substring(0, 50), 
          s3Key: img.s3Key?.substring(0, 80),
          source: img.metadata?.source || 'unknown',
          createdIn: img.metadata?.createdIn || 'unknown'
        })),
        angleReferences: a.angleReferences?.map(ref => ({
          s3Key: ref.s3Key?.substring(0, 80),
          angle: ref.angle,
          hasImageUrl: !!ref.imageUrl
        })) || []
      }))
    });
  }, [assets]);

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
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
    } catch (error: any) {
      console.error('[AssetBank] Failed to update asset:', error);
      toast.error(`Failed to update asset: ${error.message}`);
    }
  }

  // 🔥 MATCH LOCATIONS PATTERN: Use asset.images directly (backend already provides presigned URLs)
  // Media Library is NOT used for cards - only modals use Media Library
  // This matches LocationBankPanel which uses location.images directly

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
              // 🔥 COPY LOCATIONS PATTERN EXACTLY: Process images inline, use imageUrl property
              const allReferences: Array<{ id: string; imageUrl: string; label: string }> = [];
              
              // Process asset.images array (matches location.images pattern)
              if (asset.images && Array.isArray(asset.images) && asset.images.length > 0) {
                asset.images.forEach((img: any) => {
                  // Use imageUrl (standardize to imageUrl like locations use)
                  const imageUrl = img.imageUrl || img.url;
                  if (imageUrl) {
                    allReferences.push({
                      id: img.s3Key || img.metadata?.s3Key || `img-${asset.id}-${allReferences.length}`,
                      imageUrl: imageUrl,
                      label: `${asset.name} - Image ${allReferences.length + 1}`
                    });
                  }
                });
              }
              
              // Add angle references (Production Hub images) - matches location.angleVariations pattern
              const angleRefs = asset.angleReferences || [];
              if (angleRefs.length > 0) {
                angleRefs.forEach((ref: any) => {
                  // Use imageUrl (matches location pattern)
                  const imageUrl = ref.imageUrl || ref.url;
                  if (imageUrl) {
                    allReferences.push({
                      id: ref.s3Key || `angle-${asset.id}-${allReferences.length}`,
                      imageUrl: imageUrl,
                      label: `${asset.name} - ${ref.angle || 'angle'} view`
                    });
                  }
                });
              }
              
              const categoryMetadata = ASSET_CATEGORY_METADATA[asset.category];
              const metadata = `${allReferences.length} image${allReferences.length !== 1 ? 's' : ''}`;

              return (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  mainImage={allReferences.length > 0 ? allReferences[0] : null}
                  referenceImages={allReferences.slice(1)}
                  imageCount={allReferences.length}
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
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })}
            onDelete={async () => {
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'creation'] });
              await queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
              await queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'creation'] });
              setShowDetailModal(false);
              setSelectedAssetId(null);
            }}
            onAssetUpdate={() => queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })}
          />
        ) : null;
      })()}
    </div>
  );
}
