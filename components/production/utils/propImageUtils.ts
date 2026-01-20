/**
 * Prop Image Utilities
 * 
 * Centralized logic for prop image selection and fallback handling.
 * Used by ShotConfigurationStep and ShotConfigurationPanel to ensure consistency.
 */

export interface PropType {
  id: string;
  name: string;
  imageUrl?: string;
  s3Key?: string;
  angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
  images?: Array<{ url: string; s3Key?: string }>;
  baseReference?: { s3Key?: string; imageUrl?: string };
}

export interface AvailableImage {
  id: string;
  imageUrl: string;
  label?: string;
}

/**
 * Get all available images for a prop, following the priority order:
 * 1. angleReferences (Production Hub images)
 * 2. images[] (Creation images) - only if no angleReferences
 * 3. baseReference (Creation image fallback) - ONLY as last resort if no Production Hub images
 * 4. prop.imageUrl (Default fallback)
 * 
 * Media Library is the source of truth.
 * Note: angleReferences may have s3Key but empty imageUrl - presigned URLs will be fetched separately.
 * 
 * 🔥 FIX: Match location pattern - only show creation image (baseReference) as last resort
 * if there are NO Production Hub images (angleReferences).
 */
export function getAvailablePropImages(prop: PropType): AvailableImage[] {
  const availableImages: AvailableImage[] = [];
  
  // Add angleReferences first (Production Hub images)
  // 🔥 Feature 0200: Only include angleReferences that have s3Key (presigned URLs will be fetched)
  // Don't include images that only have expired imageUrl values
  if (prop.angleReferences && prop.angleReferences.length > 0) {
    prop.angleReferences.forEach(ref => {
      // Only include if it has s3Key - presigned URL will be fetched from Media Library
      if (ref.s3Key) {
        availableImages.push({
          id: ref.id,
          imageUrl: ref.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
          label: ref.label
        });
      }
    });
  }
  
  // Add images[] (Creation images) if no valid angleReferences
  // 🔥 Feature 0200: Only include images that have s3Key
  if (availableImages.length === 0 && prop.images && prop.images.length > 0) {
    prop.images.forEach(img => {
      // Only include if it has s3Key - presigned URL will be fetched
      if (img.s3Key) {
        availableImages.push({
          id: img.s3Key,
          imageUrl: img.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
          label: undefined
        });
      }
    });
  }
  
  // 🔥 Feature 0200: Only show baseReference if it has s3Key (presigned URL will be fetched)
  // This matches the pattern used for locations - creation image only when no Production Hub images exist
  const hasProductionHubImages = prop.angleReferences && prop.angleReferences.length > 0;
  if (!hasProductionHubImages && availableImages.length === 0 && prop.baseReference?.s3Key) {
    availableImages.push({
      id: prop.baseReference.s3Key,
      imageUrl: prop.baseReference.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
      label: 'Creation Image (Last Resort)'
    });
  }
  
  // 🔥 Feature 0200: Don't fall back to prop.imageUrl - it may be expired
  // If no images with s3Key are available, return empty array (component will show nothing)
  
  return availableImages;
}

/**
 * Get the selected image s3Key for a prop based on the selectedImageId.
 * Falls back to the first available image if no selection is made.
 * 
 * 🔥 Feature 0200: Returns s3Key (not imageUrl) - presigned URLs should be fetched separately
 * Don't use expired imageUrl values from entity props.
 */
export function getSelectedPropImageUrl(
  prop: PropType,
  selectedImageId?: string
): string | undefined {
  const availableImages = getAvailablePropImages(prop);
  
  if (availableImages.length === 0) {
    return undefined; // 🔥 Feature 0200: Don't fall back to prop.imageUrl (may be expired)
  }
  
  // If selectedImageId exists, use it; otherwise, first image is auto-selected
  const effectiveSelectedId = selectedImageId || availableImages[0]?.id;
  
  if (effectiveSelectedId) {
    const selectedImage = availableImages.find(img => img.id === effectiveSelectedId);
    if (selectedImage) {
      // Return s3Key (which is stored in imageUrl field) - presigned URL will be fetched separately
      return selectedImage.imageUrl;
    }
  }
  
  // Fallback to first available image
  return availableImages[0]?.imageUrl;
}

