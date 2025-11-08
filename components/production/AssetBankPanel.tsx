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
import { toast } from 'sonner';

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
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [show3DExportModal, setShow3DExportModal] = useState(false);
  const [assetFor3DExport, setAssetFor3DExport] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [projectId, selectedCategory]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.log('[AssetBank] No auth token available');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({ projectId });
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/asset-bank?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
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
      prop: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
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
    <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
      {/* Context Indicator Banner */}
      {editorContext.currentSceneName && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
          <div className="text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Film className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-slate-400">Managing assets for scene:</span>
              <span className="font-semibold text-blue-400 truncate">{editorContext.currentSceneName}</span>
            </div>
            <button
              onClick={() => {
                const { clearContext } = useContextStore.getState();
                clearContext();
                toast.success('Context cleared');
              }}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white flex-shrink-0 transition-colors"
              title="Clear context"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header - Matches Character/Location Bank */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-200">
            Asset Bank
          </h2>
          {!isMobile && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-1.5 hover:bg-[#DC143C]/10 rounded-lg transition-colors"
              title="New Asset"
            >
              <Plus className="w-5 h-5 text-[#DC143C]" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">
          {assets.length} asset{assets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Category Filters - Simplified Dark Theme */}
      <div className="flex gap-2 p-4 border-b border-slate-700 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-[#DC143C] text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No assets yet</p>
            <p className="text-sm text-slate-500 mt-2">
              {selectedCategory === 'all' 
                ? 'Create your first asset to get started'
                : `No ${ASSET_CATEGORY_METADATA[selectedCategory as AssetCategory]?.label.toLowerCase()} found`
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors mt-4 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map((asset) => {
              const Icon = getCategoryIcon(asset.category);
              const categoryColor = getCategoryColor(asset.category);
              const canExport3D = asset.images.length >= 2 && asset.images.length <= 10;

              return (
                <div
                  key={asset.id}
                  className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-[#DC143C]/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDetailModal(true);
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-700">
                    {asset.images.length > 0 ? (
                      <img
                        src={asset.images[0].url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-12 h-12 text-slate-500" />
                      </div>
                    )}
                    {/* Image Count Badge */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-white font-medium">
                        {asset.images.length}/10
                      </span>
                    </div>
                    {/* 3D Model Badge */}
                    {asset.has3DModel && (
                      <div className="absolute top-2 left-2 bg-[#DC143C]/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-xs text-white font-medium">3D</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-slate-200 truncate flex-1">
                        {asset.name}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${categoryColor}`}>
                        {ASSET_CATEGORY_METADATA[asset.category].label}
                      </div>
                    </div>

                    {asset.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {asset.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {canExport3D && !asset.has3DModel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetFor3DExport(asset);
                            setShow3DExportModal(true);
                          }}
                          className="flex-1 px-3 py-1.5 bg-[#DC143C] text-white rounded text-xs font-medium hover:bg-[#B91238] transition-colors flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Generate 3D
                        </button>
                      )}
                      {asset.has3DModel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload3D(asset);
                          }}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download 3D
                        </button>
                      )}
                      {!canExport3D && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-700 text-slate-300 border border-slate-600 rounded text-xs font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Images
                        </button>
                      )}
                    </div>

                    {!canExport3D && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Need {2 - asset.images.length} more image{(2 - asset.images.length) !== 1 ? 's' : ''} for 3D export
                      </p>
                    )}
                  </div>
                </div>
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

