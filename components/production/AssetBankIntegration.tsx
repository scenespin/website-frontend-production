/**
 * Asset Bank Integration for Scene Builder
 * 
 * Adds asset selection to scene generation with 4-reference limit enforcement.
 * Part of Feature 0099: Asset Bank
 * 
 * Usage in ClipGenerationPanel or SceneBuilderPanel:
 * import { AssetSelector, useAssetReferences } from './AssetBankIntegration';
 */

import { useState, useEffect } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { Asset } from '@/types/asset';

/**
 * Hook for managing asset references with 4-reference limit
 */
export function useAssetReferences() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  const addAsset = (assetId: string) => {
    if (!selectedAssets.includes(assetId)) {
      setSelectedAssets(prev => [...prev, assetId]);
    }
  };
  
  const removeAsset = (assetId: string) => {
    setSelectedAssets(prev => prev.filter(id => id !== assetId));
  };
  
  const clearAssets = () => {
    setSelectedAssets([]);
  };
  
  return {
    selectedAssets,
    addAsset,
    removeAsset,
    clearAssets,
  };
}

/**
 * Asset Selector Component
 * Displays assets with reference count enforcement
 */
interface AssetSelectorProps {
  projectId: string;
  selectedAssets: string[];
  onAssetToggle: (assetId: string) => void;
  totalReferencesUsed: number; // Characters + Location + Assets
  maxReferences?: number; // Default: 4 (Runway Gen-4 limit)
}

export function AssetSelector({
  projectId,
  selectedAssets,
  onAssetToggle,
  totalReferencesUsed,
  maxReferences = 4,
}: AssetSelectorProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`/api/asset-bank?projectId=${projectId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Only show assets with images (ready for reference)
        setAssets(data.assets?.filter((a: Asset) => a.images.length > 0) || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = maxReferences - totalReferencesUsed;
  const canSelectMore = availableSlots > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No assets available</p>
        <p className="text-xs mt-1">Create assets in the Assets tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Reference Counter */}
      <div className={`flex items-center justify-between text-sm p-2 rounded-lg ${
        availableSlots === 0 
          ? 'bg-yellow-500/10 text-yellow-500' 
          : 'bg-gray-800 text-gray-400'
      }`}>
        <span>References Used:</span>
        <span className="font-semibold">
          {totalReferencesUsed}/{maxReferences}
          {availableSlots > 0 && ` (${availableSlots} slot${availableSlots !== 1 ? 's' : ''} available)`}
        </span>
      </div>

      {/* Warning if limit reached */}
      {availableSlots === 0 && (
        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-500">
            Maximum 4 references reached. Remove a character, location, or asset to add more.
          </p>
        </div>
      )}

      {/* Asset Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {assets.map((asset) => {
          const isSelected = selectedAssets.includes(asset.id);
          const canSelect = canSelectMore || isSelected;

          return (
            <button
              key={asset.id}
              onClick={() => canSelect && onAssetToggle(asset.id)}
              disabled={!canSelect}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/50'
                  : canSelect
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <img
                src={asset.images[0].url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                <span className="text-white text-xs font-medium truncate">
                  {asset.name}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Helper to get selected asset image URLs for API
 */
export async function getAssetReferenceUrls(assetIds: string[]): Promise<string[]> {
  const urls: string[] = [];
  
  for (const assetId of assetIds) {
    try {
      const response = await fetch(`/api/asset-bank/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const asset: Asset = data.asset;
        // Use first image as reference
        if (asset.images.length > 0) {
          urls.push(asset.images[0].url);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch asset ${assetId}:`, error);
    }
  }
  
  return urls;
}

/**
 * Example integration snippet for ClipGenerationPanel:
 * 
 * ```tsx
 * import { AssetSelector, useAssetReferences, getAssetReferenceUrls } from './AssetBankIntegration';
 * 
 * // In your component:
 * const { selectedAssets, addAsset, removeAsset } = useAssetReferences();
 * 
 * const totalRefs = (characterId ? 1 : 0) + (locationId ? 1 : 0) + selectedAssets.length;
 * 
 * // In your render:
 * <div>
 *   <label>Assets (Props/Vehicles/Furniture)</label>
 *   <AssetSelector
 *     projectId={projectId}
 *     selectedAssets={selectedAssets}
 *     onAssetToggle={(assetId) => {
 *       if (selectedAssets.includes(assetId)) {
 *         removeAsset(assetId);
 *       } else {
 *         addAsset(assetId);
 *       }
 *     }}
 *     totalReferencesUsed={totalRefs}
 *   />
 * </div>
 * 
 * // When generating video:
 * const assetUrls = await getAssetReferenceUrls(selectedAssets);
 * const allReferences = [
 *   ...characterUrls,
 *   ...locationUrls,
 *   ...assetUrls,
 * ].slice(0, 4); // Enforce 4-reference limit
 * ```
 */

