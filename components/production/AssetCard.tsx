'use client';

/**
 * AssetCard - Dedicated, optimized card component for Assets
 * 
 * Benefits over CinemaCard:
 * 1. Direct asset prop - reacts to asset changes automatically
 * 2. Memoized with proper comparison - only re-renders when asset actually changes
 * 3. Self-contained image processing - no parent-side transformation needed
 * 4. Better performance - useMemo for expensive operations
 * 5. Type-safe - directly uses Asset type
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react';
import { Asset, ASSET_CATEGORY_METADATA } from '@/types/asset';

export interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const AssetCard = React.memo<AssetCardProps>(({ 
  asset, 
  onClick, 
  isSelected = false,
  className 
}) => {
  // 🔥 DEBUG: Log when component renders
  console.log(`[AssetCard] Rendering card for ${asset.name}:`, {
    id: asset.id,
    imagesCount: asset.images?.length || 0,
    angleReferencesCount: asset.angleReferences?.length || 0,
    images: asset.images?.map(img => ({
      s3Key: img.s3Key?.substring(0, 80),
      source: img.metadata?.source || 'unknown',
      createdIn: img.metadata?.createdIn || 'unknown'
    })),
    angleReferences: asset.angleReferences?.map(ref => ({
      s3Key: ref.s3Key?.substring(0, 80),
      angle: ref.angle,
      hasImageUrl: !!ref.imageUrl
    })) || []
  });
  
  // 🔥 OPTIMIZATION: Memoize image processing to avoid recalculation on every render
  const { mainImage, referenceImages, imageCount } = useMemo(() => {
    const allReferences: Array<{ id: string; imageUrl: string; label: string }> = [];
    
    // Add base images (user-uploaded, from Creation section)
    if (asset.images && asset.images.length > 0) {
      asset.images.forEach((img, idx) => {
        // Only add images that are NOT angle-generated
        const isAngleGenerated = img.metadata?.source === 'angle-generation' || 
                                  img.metadata?.source === 'image-generation';
        if (!isAngleGenerated && img.url) {
          allReferences.push({
            id: img.s3Key || `img-${asset.id}-${idx}`,
            imageUrl: img.url,
            label: `${asset.name} - Image ${idx + 1}`
          });
        }
      });
    }
    
    // Add angle references (Production Hub images)
    const angleRefs = asset.angleReferences || [];
    const angleImages = asset.images?.filter((img: any) => 
      img.metadata?.source === 'angle-generation' || 
      img.metadata?.source === 'image-generation'
    ) || [];
    
    // Prefer angleReferences if it exists, otherwise use angleImages from images array
    if (angleRefs.length > 0) {
      angleRefs.forEach((ref, idx) => {
        if (ref && ref.imageUrl) {
          allReferences.push({
            id: ref.s3Key || `angle-${asset.id}-${idx}`,
            imageUrl: ref.imageUrl,
            label: `${asset.name} - ${ref.angle || 'angle'} view`
          });
        }
      });
    } else if (angleImages.length > 0) {
      angleImages.forEach((img, idx) => {
        if (img.url) {
          allReferences.push({
            id: img.s3Key || `angle-img-${asset.id}-${idx}`,
            imageUrl: img.url,
            label: `${asset.name} - ${img.metadata?.angle || img.angle || 'angle'} view`
          });
        }
      });
    }
    
    return {
      mainImage: allReferences.length > 0 ? allReferences[0] : null,
      referenceImages: allReferences.slice(1),
      imageCount: allReferences.length
    };
  }, [
    asset.id,
    asset.name,
    // 🔥 CRITICAL: Deep comparison of images array - use JSON.stringify for now
    // In production, consider using a more efficient deep comparison library
    JSON.stringify(asset.images?.map(img => ({ url: img.url, s3Key: img.s3Key, source: img.metadata?.source }))),
    JSON.stringify(asset.angleReferences?.map(ref => ({ s3Key: ref.s3Key, imageUrl: ref.imageUrl })))
  ]);

  const categoryMetadata = ASSET_CATEGORY_METADATA[asset.category];
  const metadata = `${imageCount} image${imageCount !== 1 ? 's' : ''}`;
  
  // 🔥 DEBUG: Log processed image data
  console.log(`[AssetCard] Processed images for ${asset.name}:`, {
    imageCount,
    mainImage: mainImage ? 'has main image' : 'no main image',
    referenceImagesCount: referenceImages.length
  });

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
        {mainImage?.imageUrl ? (
          <img
            src={mainImage.imageUrl}
            alt={mainImage.label || asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
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
                  key={ref.id}
                  src={ref.imageUrl}
                  alt={ref.label || 'Reference'}
                  className="w-6 h-6 rounded object-cover border border-[#3F3F46] group-hover:border-[#DC143C]/50 transition-colors"
                  loading="lazy"
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
}, (prevProps, nextProps) => {
  // 🔥 CRITICAL: Memo comparison that works with React Query cache updates
  // When we do setQueryData with new object references, React Query creates new asset objects
  // This comparison detects those changes reliably
  
  // Always re-render if asset object reference changed (React Query cache update or optimistic update)
  // This is the most reliable indicator - when we update cache, we create new object references
  if (prevProps.asset !== nextProps.asset) {
    // Asset reference changed - this means React Query updated the cache
    // Log for debugging but always re-render
    const prevImagesCount = prevProps.asset.images?.length || 0;
    const nextImagesCount = nextProps.asset.images?.length || 0;
    const prevAngleRefsCount = prevProps.asset.angleReferences?.length || 0;
    const nextAngleRefsCount = nextProps.asset.angleReferences?.length || 0;
    
    // Only log if counts actually changed (to reduce console noise)
    if (prevImagesCount !== nextImagesCount || prevAngleRefsCount !== nextAngleRefsCount) {
      console.log(`[AssetCard] Re-rendering: asset reference changed with different image counts for ${prevProps.asset.name}`, {
        prevImages: prevImagesCount,
        nextImages: nextImagesCount,
        prevAngleRefs: prevAngleRefsCount,
        nextAngleRefs: nextAngleRefsCount
      });
    }
    return false; // Re-render - asset reference changed
  }
  
  // Asset reference is the same - check if key fields changed (fallback for edge cases)
  // This handles cases where React Query's structural sharing reuses the same reference
  if (prevProps.asset.id !== nextProps.asset.id) {
    return false; // Different asset
  }
  
  if (prevProps.asset.name !== nextProps.asset.name) {
    return false; // Name changed
  }
  
  if (prevProps.isSelected !== nextProps.isSelected) {
    return false; // Selection changed
  }
  
  // Quick comparison of image counts (fast check)
  const prevImagesCount = prevProps.asset.images?.length || 0;
  const nextImagesCount = nextProps.asset.images?.length || 0;
  const prevAngleRefsCount = prevProps.asset.angleReferences?.length || 0;
  const nextAngleRefsCount = nextProps.asset.angleReferences?.length || 0;
  
  if (prevImagesCount !== nextImagesCount || prevAngleRefsCount !== nextAngleRefsCount) {
    console.log(`[AssetCard] Re-rendering: image counts changed (same reference) for ${prevProps.asset.name}`);
    return false; // Counts changed
  }
  
  // If asset reference is the same AND all key fields are the same, skip re-render
  // This is safe because:
  // 1. Our optimistic updates create new object references (so reference check above catches them)
  // 2. React Query cache updates create new object references (so reference check catches them)
  // 3. This fallback only handles edge cases where structural sharing reuses references
  return true; // Skip re-render - nothing changed
});

AssetCard.displayName = 'AssetCard';
