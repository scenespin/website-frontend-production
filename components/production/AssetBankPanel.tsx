'use client';

/**
 * Asset Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Matches LocationBankPanel pattern exactly
 */

import { useState } from 'react';
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

interface AssetBankPanelProps {
  className?: string;
  isMobile?: boolean;
}

export default function AssetBankPanel({ className = '', isMobile = false }: AssetBankPanelProps) {
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

  // Local UI state only
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">Asset Bank</h2>
        </div>
        <p className="text-xs text-[#808080]">
          {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
        </p>
      </div>

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
          All Assets
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
      <div className="flex-1 overflow-y-auto p-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => {
              const allReferences: CinemaCardImage[] = [];
              
              // 🔥 DEBUG: Log full asset structure
              if (asset.name === 'coffee cup') {
                console.log(`[AssetBankPanel] Full asset data for ${asset.name}:`, {
                  id: asset.id,
                  name: asset.name,
                  imagesCount: asset.images?.length || 0,
                  angleReferencesCount: asset.angleReferences?.length || 0,
                  angleReferences: asset.angleReferences,
                  images: asset.images?.map((img: any) => ({
                    url: img.url ? `${img.url.substring(0, 50)}...` : 'MISSING',
                    s3Key: img.s3Key || img.metadata?.s3Key || 'MISSING',
                    source: img.metadata?.source || 'unknown',
                    metadata: img.metadata, // 🔥 DEBUG: Show full metadata
                    angle: img.angle || img.metadata?.angle
                  }))
                });
              }
              
              // Add base images (user-uploaded, from Creation section)
              if (asset.images && asset.images.length > 0) {
                asset.images.forEach((img, idx) => {
                  // Only add images that are NOT angle-generated (those go in angleReferences section)
                  const isAngleGenerated = img.metadata?.source === 'angle-generation' || img.metadata?.source === 'image-generation';
                  if (!isAngleGenerated) {
                    allReferences.push({
                      id: img.s3Key || `img-${asset.id}-${idx}`,
                      imageUrl: img.url,
                      label: `${asset.name} - Image ${idx + 1}`
                    });
                  }
                });
              }
              
              // Add angle references (like locations add angleVariations)
              // 🔥 FIX: Use EITHER angleReferences OR angleImages from images array, but NOT both (prevents double-counting)
              const angleRefs = asset.angleReferences || [];
              const angleImages = asset.images?.filter((img: any) => 
                img.metadata?.source === 'angle-generation' || img.metadata?.source === 'image-generation'
              ) || [];
              
              // Prefer angleReferences if it exists and has items, otherwise use angleImages from images array
              if (angleRefs.length > 0) {
                console.log(`[AssetBankPanel] Found ${angleRefs.length} angle references for ${asset.name}:`, angleRefs);
                // Add angleReferences from dedicated field
                angleRefs.forEach((ref, idx) => {
                  if (ref && ref.imageUrl) {
                    allReferences.push({
                      id: ref.s3Key || `angle-${asset.id}-${idx}`,
                      imageUrl: ref.imageUrl,
                      label: `${asset.name} - ${ref.angle || 'angle'} view`
                    });
                  } else if (ref && !ref.imageUrl) {
                    console.warn(`[AssetBankPanel] Angle reference missing imageUrl for ${asset.name}:`, ref);
                  }
                });
              } else if (angleImages.length > 0) {
                console.log(`[AssetBankPanel] Found ${angleImages.length} angle images in images array for ${asset.name}:`, angleImages);
                // Add angle images from images array (backend merges them here)
                angleImages.forEach((img, idx) => {
                  allReferences.push({
                    id: img.s3Key || `angle-img-${asset.id}-${idx}`,
                    imageUrl: img.url,
                    label: `${asset.name} - ${img.metadata?.angle || img.angle || 'angle'} view`
                  });
                });
              } else if (asset.name === 'coffee cup') {
                console.warn(`[AssetBankPanel] ⚠️ No angleReferences or angle images found for ${asset.name}`);
                console.log(`[AssetBankPanel] Full images array:`, asset.images);
              }

              const metadata = asset.has3DModel ? '3D Model Available' :
                              `${allReferences.length} images`;

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
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })}
            onDelete={() => queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })}
            onAssetUpdate={() => queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })}
            onGenerate3D={async (asset) => {
              toast.info('3D generation coming soon');
            }}
          />
        ) : null;
      })()}
    </div>
  );
}
