/**
 * useAssetCardImages - Custom hook for processing asset images for card display
 * 
 * Benefits:
 * 1. Reusable logic - can be used in multiple components
 * 2. Memoized - only recalculates when asset changes
 * 3. Testable - pure function, easy to test
 * 4. Type-safe - returns typed data
 */

import { useMemo } from 'react';
import { Asset } from '@/types/asset';

export interface ProcessedAssetImage {
  id: string;
  imageUrl: string;
  label: string;
  source: 'creation' | 'production-hub';
}

export interface AssetCardImageData {
  mainImage: ProcessedAssetImage | null;
  referenceImages: ProcessedAssetImage[];
  totalCount: number;
  creationImageCount: number;
  productionImageCount: number;
}

export function useAssetCardImages(asset: Asset): AssetCardImageData {
  return useMemo(() => {
    const allReferences: ProcessedAssetImage[] = [];
    let creationImageCount = 0;
    let productionImageCount = 0;
    
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
            label: `${asset.name} - Image ${idx + 1}`,
            source: 'creation'
          });
          creationImageCount++;
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
            label: `${asset.name} - ${ref.angle || 'angle'} view`,
            source: 'production-hub'
          });
          productionImageCount++;
        }
      });
    } else if (angleImages.length > 0) {
      angleImages.forEach((img, idx) => {
        if (img.url) {
          allReferences.push({
            id: img.s3Key || `angle-img-${asset.id}-${idx}`,
            imageUrl: img.url,
            label: `${asset.name} - ${img.metadata?.angle || img.angle || 'angle'} view`,
            source: 'production-hub'
          });
          productionImageCount++;
        }
      });
    }
    
    return {
      mainImage: allReferences.length > 0 ? allReferences[0] : null,
      referenceImages: allReferences.slice(1),
      totalCount: allReferences.length,
      creationImageCount,
      productionImageCount
    };
  }, [
    asset.id,
    asset.name,
    // Use JSON.stringify for deep comparison (consider using a library like fast-deep-equal in production)
    JSON.stringify(asset.images?.map(img => ({ 
      url: img.url, 
      s3Key: img.s3Key, 
      source: img.metadata?.source 
    }))),
    JSON.stringify(asset.angleReferences?.map(ref => ({ 
      s3Key: ref.s3Key, 
      imageUrl: ref.imageUrl 
    })))
  ]);
}
