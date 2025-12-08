'use client';

/**
 * Asset Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Reduced from ~396 lines to ~250 lines using React Query
 */

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Package, Car, Armchair, Box, Film, X, Loader2 } from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import AssetUploadModal from './AssetUploadModal';
import Asset3DExportModal from './Asset3DExportModal';
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
  const { data: allAssets = [], isLoading: queryLoading } = useAssets(
    screenplayId || '',
    'production-hub',
    !!screenplayId
  );

  // Local UI state only
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [show3DExportModal, setShow3DExportModal] = useState(false);
  const [assetFor3DExport, setAssetFor3DExport] = useState<Asset | null>(null);

  // Filter assets by category
  const assets = selectedCategory === 'all'
    ? allAssets
    : allAssets.filter(a => a.category === selectedCategory);

  const isLoading = queryLoading;

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

  const handleDownload3D = async (asset: Asset) => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await fetch(`/api/asset-bank/${asset.id}/3d-models`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch 3D models');
      }

      const data = await response.json();
      
      if (data.models && data.models.length > 0) {
        data.models.forEach((model: { url: string; format: string }) => {
          const link = document.createElement('a');
          link.href = model.url;
          link.download = `${asset.name.replace(/\s+/g, '_')}.${model.format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
        toast.success('3D models downloaded');
      } else {
        toast.error('No 3D models available');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download 3D models');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

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
          {assets.length} asset{assets.length !== 1 ? 's' : ''}
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#808080]">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium text-[#B3B3B3]">No assets yet</p>
            <p className="text-sm text-[#808080] mt-2">
              {selectedCategory === 'all' 
                ? 'Assets are created in the Write/Create section'
                : `No ${ASSET_CATEGORY_METADATA[selectedCategory as AssetCategory]?.label.toLowerCase()} found`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => {
              const referenceImages: CinemaCardImage[] = (asset.images || []).map((img, idx) => ({
                id: `img-${idx}`,
                imageUrl: img.url,
                label: `${asset.name} - Image ${idx + 1}`
              }));

              const badgeColor = asset.category === 'prop' ? 'gray' :
                                asset.category === 'vehicle' ? 'red' :
                                asset.category === 'furniture' ? 'gold' : 'gray';

              const metadata = asset.has3DModel ? '3D Model Available' : 
                              `${(asset.images || []).length}/10 images`;

              return (
                <CinemaCard
                  key={asset.id}
                  id={asset.id}
                  name={asset.name}
                  type={asset.category}
                  typeLabel={ASSET_CATEGORY_METADATA[asset.category].label}
                  mainImage={referenceImages.length > 0 ? referenceImages[0] : null}
                  referenceImages={referenceImages.slice(1)}
                  referenceCount={referenceImages.length}
                  metadata={metadata}
                  description={asset.description}
                  cardType="asset"
                  typeBadgeColor={badgeColor as 'red' | 'blue' | 'gold' | 'gray'}
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
        onSuccess={handleRefresh}
      />

      {/* 3D Export Modal */}
      {assetFor3DExport && (
        <Asset3DExportModal
          isOpen={show3DExportModal}
          onClose={() => {
            setShow3DExportModal(false);
            setAssetFor3DExport(null);
          }}
          asset={assetFor3DExport}
          onSuccess={handleRefresh}
        />
      )}

      {/* Asset Detail Modal */}
      {showDetailModal && selectedAssetId && (() => {
        const selectedAsset = assets.find(a => a.id === selectedAssetId);
        return selectedAsset ? (
          <AssetDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAssetId(null);
            }}
            asset={selectedAsset}
            onUpdate={handleRefresh}
            onDelete={handleRefresh}
            onAssetUpdate={(updatedAsset) => {
              // React Query will handle the update via cache invalidation
              queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
            }}
            onGenerate3D={(asset) => {
              setShowDetailModal(false);
              setAssetFor3DExport(asset);
              setShow3DExportModal(true);
            }}
          />
        ) : null;
      })()}
    </div>
  );
}

