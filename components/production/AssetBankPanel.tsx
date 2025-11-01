'use client';

/**
 * Asset Bank Panel
 * 
 * Main UI for managing assets (props, vehicles, furniture) in the Asset Bank.
 * Part of Feature 0099: Asset Bank - Digital Prop Department for AI Filmmakers.
 */

import { useState, useEffect } from 'react';
import { Plus, Package, Car, Armchair, Box, Trash2, Edit2, Sparkles, Image as ImageIcon, Download } from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import AssetUploadModal from './AssetUploadModal';
import Asset3DExportModal from './Asset3DExportModal';
import AssetDetailModal from './AssetDetailModal';

interface AssetBankPanelProps {
  projectId: string;
  className?: string;
  isMobile?: boolean;
}

export default function AssetBankPanel({ projectId, className = '', isMobile = false }: AssetBankPanelProps) {
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
      const params = new URLSearchParams({ projectId });
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/asset-bank?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
      other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[category];
  };

  return (
    <div className={`flex flex-col h-full bg-[#0d0b14] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Asset Bank
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isMobile 
              ? 'View and use your assets in scenes'
              : 'Digital Prop Department - Scan props, vehicles & furniture'
            }
          </p>
          {isMobile && assets.length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              💡 Use desktop to create new assets
            </p>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Asset
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 p-4 border-b border-gray-800 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Assets
        </button>
        {Object.entries(ASSET_CATEGORY_METADATA).map(([key, meta]) => {
          const Icon = getCategoryIcon(key as AssetCategory);
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as AssetCategory)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedCategory === key
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No assets yet</p>
            <p className="text-sm text-gray-600 mt-2">
              {selectedCategory === 'all' 
                ? 'Create your first asset to get started'
                : `No ${ASSET_CATEGORY_METADATA[selectedCategory as AssetCategory]?.label.toLowerCase()} found`
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
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
                  className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDetailModal(true);
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-800">
                    {asset.images.length > 0 ? (
                      <img
                        src={asset.images[0].url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    {/* Image Count Badge */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-white font-medium">
                        {asset.images.length}/10
                      </span>
                    </div>
                    {/* 3D Model Badge */}
                    {asset.has3DModel && (
                      <div className="absolute top-2 left-2 bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <span className="text-xs text-white font-medium">3D</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white truncate flex-1">
                        {asset.name}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${categoryColor}`}>
                        {ASSET_CATEGORY_METADATA[asset.category].label}
                      </div>
                    </div>

                    {asset.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
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
                          className="flex-1 btn btn-sm btn-primary text-xs"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Generate 3D
                        </button>
                      )}
                      {asset.has3DModel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download 3D models
                          }}
                          className="flex-1 btn btn-sm btn-success text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download 3D
                        </button>
                      )}
                      {!canExport3D && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open upload more images modal
                          }}
                          className="flex-1 btn btn-sm btn-outline text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Images
                        </button>
                      )}
                    </div>

                    {!canExport3D && (
                      <p className="text-xs text-gray-600 mt-2 text-center">
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

