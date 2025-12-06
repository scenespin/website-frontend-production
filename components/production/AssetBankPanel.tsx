'use client';

/**
 * Asset Bank Panel
 * 
 * Main UI for managing assets (props, vehicles, furniture) in the Asset Bank.
 * Part of Feature 0099: Asset Bank - Digital Prop Department for AI Filmmakers.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Package, Car, Armchair, Box, Trash2, Edit2, Sparkles, Image as ImageIcon, Download, X, Film } from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import AssetUploadModal from './AssetUploadModal';
import Asset3DExportModal from './Asset3DExportModal';
import AssetDetailModal from './AssetDetailModal';
import { useEditorContext, useContextStore } from '@/lib/contextStore';  // Contextual navigation
import { useScreenplay } from '@/contexts/ScreenplayContext';  // 🔥 NEW: Use ScreenplayContext for asset sync
import { toast } from 'sonner';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';

interface AssetBankPanelProps {
  projectId: string;
  className?: string;
  isMobile?: boolean;
}

export default function AssetBankPanel({ projectId, className = '', isMobile = false }: AssetBankPanelProps) {
  // Authentication
  const { getToken } = useAuth();
  
  // Contextual navigation - Get current scene context from editor
  const editorContext = useEditorContext();
  
  // 🔥 FIX: Use ScreenplayContext assets directly for real-time sync (like characters/locations)
  const { assets: contextAssets } = useScreenplay();
  
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [show3DExportModal, setShow3DExportModal] = useState(false);
  const [assetFor3DExport, setAssetFor3DExport] = useState<Asset | null>(null);

  // 🔥 FIX: Store assets in local state for Production Hub (not just ScreenplayContext)
  // Production Hub should have its own asset state, not rely on Creation section's context
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);

  // 🔥 FIX: Use local assets (Production Hub) with fallback to context assets (Creation section)
  // Production Hub should have its own state, but can show Creation section assets as read-only
  const assets = localAssets.length > 0
    ? (selectedCategory === 'all' 
        ? localAssets 
        : localAssets.filter(a => a.category === selectedCategory))
    : (contextAssets && contextAssets.length > 0
        ? (selectedCategory === 'all' 
            ? contextAssets 
            : contextAssets.filter(a => a.category === selectedCategory))
        : []);

  // 🔥 FIX: Always fetch assets on mount for Production Hub (independent of Creation section)
  useEffect(() => {
    fetchAssets();
  }, [projectId]); // Only fetch when projectId changes
  
  // 🔥 NEW: Listen for asset angle generation completion and refresh assets
  useEffect(() => {
    const handleRefreshAssets = async () => {
      console.log('[AssetBankPanel] Refreshing assets due to angle generation completion');
      // Reload assets from API to get newly generated angle images
      await fetchAssets();
      // Also trigger a context refresh by reloading the screenplay
      // The context will pick up the updated assets from the API
    };
    
    const handleRefreshAssetBank = async () => {
      console.log('[AssetBankPanel] Refreshing assets via refreshAssetBank event');
      await fetchAssets();
    };
    
    window.addEventListener('refreshAssets', handleRefreshAssets);
    window.addEventListener('refreshAssetBank', handleRefreshAssetBank);
    return () => {
      window.removeEventListener('refreshAssets', handleRefreshAssets);
      window.removeEventListener('refreshAssetBank', handleRefreshAssetBank);
    };
  }, [projectId]);
  
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.log('[AssetBank] No auth token available');
        setLoading(false);
        return;
      }
      
      // 🔥 FIX: Use api.assetBank.list with context='production-hub' to get both Creation and Production Hub images
      const { api } = await import('@/lib/api');
      const assetsData = await api.assetBank.list(projectId, 'production-hub');
      const assetsResponse = assetsData.assets || assetsData.data?.assets || [];
      const assetsList = Array.isArray(assetsResponse) ? assetsResponse : [];
      
      // Filter by category if needed
      const filteredAssets = selectedCategory === 'all' 
        ? assetsList 
        : assetsList.filter((a: Asset) => a.category === selectedCategory);
      
      // 🔥 FIX: Update local state with fresh asset data from API
      setLocalAssets(filteredAssets);
      
      // 🔥 FIX: If selectedAsset is open, refresh it with fresh data
      if (selectedAsset) {
        const refreshedAsset = filteredAssets.find((a: Asset) => a.id === selectedAsset.id);
        if (refreshedAsset) {
          setSelectedAsset(refreshedAsset);
        }
      }
      
      console.log('[AssetBankPanel] ✅ Fetched assets with production-hub context:', filteredAssets.length, 'assets');
    } catch (error) {
      console.error('[AssetBankPanel] Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    const icons = {
      prop: Package,
      vehicle: Car,
      furniture: Armchair,
      other: Box,
    };
    return icons[category];
  };

  const getCategoryColor = (category: AssetCategory) => {
    const colors = {
      prop: 'bg-[#1F1F1F] text-[#808080] border border-[#3F3F46]',
      vehicle: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      furniture: 'bg-green-500/20 text-green-400 border-green-500/30',
      other: 'bg-base-content/20 text-base-content/60 border-base-content/30',
    };
    return colors[category];
  };

  const handleDownload3D = async (asset: Asset) => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      // Fetch the 3D model URLs from the API
      const response = await fetch(`/api/asset-bank/${asset.id}/3d-models`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch 3D models');
      }

      const data = await response.json();
      
      // Download each available format
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
          <h2 className="text-lg font-semibold text-[#FFFFFF]">
            Asset Bank
          </h2>
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assets.length === 0 ? (
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
            {assets.map((asset) => {
              // Convert asset.images to CinemaCardImage format
              const referenceImages: CinemaCardImage[] = asset.images.map((img, idx) => ({
                id: `img-${idx}`,
                imageUrl: img.url,
                label: `${asset.name} - Image ${idx + 1}`
              }));

              // Determine badge color based on category
              const badgeColor = asset.category === 'prop' ? 'gray' :
                                asset.category === 'vehicle' ? 'red' :
                                asset.category === 'furniture' ? 'gold' : 'gray';

              // Metadata: show 3D status or image count
              const metadata = asset.has3DModel ? '3D Model Available' : 
                              `${asset.images.length}/10 images`;

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
                    setSelectedAsset(asset);
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
        projectId={projectId}
        onSuccess={fetchAssets}
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
          onSuccess={fetchAssets}
        />
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          onUpdate={fetchAssets}
          onDelete={fetchAssets}
          onAssetUpdate={(updatedAsset) => {
            // 🔥 FIX: Update selectedAsset with fresh data from backend
            setSelectedAsset(updatedAsset);
            // Also update in localAssets array
            setLocalAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
          }}
          onGenerate3D={(asset) => {
            setShowDetailModal(false);
            setAssetFor3DExport(asset);
            setShow3DExportModal(true);
          }}
        />
      )}
    </div>
  );
}

