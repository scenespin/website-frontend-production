'use client';

/**
 * AssetCard - Simple card component for Assets
 * 
 * Matches Locations pattern: receives processed image data from parent
 * No memoization - parent processes images inline on every render
 * This ensures fresh data and proper React Query cache updates
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react';
import { Asset, ASSET_CATEGORY_METADATA } from '@/types/asset';

export interface CinemaCardImage {
  id: string;
  imageUrl: string;
  label: string;
}

export interface AssetCardProps {
  asset: Asset;
  mainImage: CinemaCardImage | null;
  referenceImages: CinemaCardImage[];
  imageCount: number;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export function AssetCard({ 
  asset, 
  mainImage,
  referenceImages,
  imageCount,
  onClick, 
  isSelected = false,
  className 
}: AssetCardProps) {
  // 🔥 FIX: Track image load errors to hide broken images (e.g., deleted images with stale URLs)
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // 🔥 FIX: Reset image error state when main image changes
  React.useEffect(() => {
    setImageLoadError(false);
  }, [mainImage?.id]);

  const categoryMetadata = ASSET_CATEGORY_METADATA[asset.category];
  const metadata = `${imageCount} image${imageCount !== 1 ? 's' : ''}`;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#141414] border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer group',
        isSelected
          ? 'border-[#DC143C] bg-[#DC143C]/10 shadow-lg shadow-[#DC143C]/20'
          : 'border-[#3F3F46] hover:border-[#DC143C]/50 hover:shadow-lg hover:shadow-[#DC143C]/20 hover:scale-[1.02]',
        className
      )}
    >
      {/* Main Image Hero */}
      <div className="relative aspect-[4/3] bg-[#1F1F1F] overflow-hidden">
        {mainImage?.imageUrl && !imageLoadError ? (
          <img
            key={`${asset.id}-${mainImage.id}-${imageCount}`} // 🔥 FIX: Force remount when image count changes
            src={mainImage.imageUrl}
            alt={mainImage.label || asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => {
              // 🔥 FIX: Hide broken images (e.g., deleted images with stale presigned URLs)
              console.log(`[AssetCard] Image failed to load for ${asset.name}, showing placeholder:`, mainImage.id);
              setImageLoadError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="scale-75">
              <Box className="w-16 h-16 text-[#808080]" />
            </div>
          </div>
        )}
        
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Card Content */}
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Name and Type */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs text-[#FFFFFF] truncate mb-1">
              {asset.name}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full inline-block bg-[#808080]/20 text-[#808080]">
              {categoryMetadata.label}
            </span>
          </div>
          
          {/* Reference Images Sidebar */}
          {referenceImages.length > 0 && (
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              {referenceImages.slice(0, 3).map(ref => (
                <img
                  key={`${ref.id}-${imageCount}`} // 🔥 FIX: Force remount when image count changes
                  src={ref.imageUrl}
                  alt={ref.label || 'Reference'}
                  className="w-6 h-6 rounded object-cover border border-[#3F3F46] group-hover:border-[#DC143C]/50 transition-colors"
                  loading="lazy"
                  onError={(e) => {
                    // 🔥 FIX: Hide broken reference images
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.style.display = 'none';
                  }}
                />
              ))}
              {referenceImages.length > 3 && (
                <div className="w-6 h-6 rounded bg-[#1F1F1F] border border-[#3F3F46] flex items-center justify-center text-[10px] text-[#808080] group-hover:border-[#DC143C]/50 transition-colors">
                  +{referenceImages.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Description */}
        {asset.description && (
          <p className="text-xs text-[#808080] line-clamp-1 mb-2">
            {asset.description}
          </p>
        )}
        
        {/* Metadata */}
        {metadata && (
          <div className="text-xs text-[#808080]">
            {metadata}
          </div>
        )}
      </div>
    </div>
  );
}
