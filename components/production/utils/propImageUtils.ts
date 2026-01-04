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
 * 3. baseReference (Creation image fallback)
 * 4. prop.imageUrl (Default fallback)
 * 
 * Media Library is the source of truth - only valid, non-empty imageUrls are included.
 */
export function getAvailablePropImages(prop: PropType): AvailableImage[] {
  const availableImages: AvailableImage[] = [];
  
  // Add angleReferences first (Production Hub images) - only if they have valid imageUrl
  if (prop.angleReferences && prop.angleReferences.length > 0) {
    prop.angleReferences.forEach(ref => {
      // Only add if imageUrl exists and is not empty
      if (ref.imageUrl && ref.imageUrl.trim() !== '') {
        availableImages.push({
          id: ref.id,
          imageUrl: ref.imageUrl,
          label: ref.label
        });
      }
    });
  }
  
  // Add images[] (Creation images) if no valid angleReferences
  if (availableImages.length === 0 && prop.images && prop.images.length > 0) {
    prop.images.forEach(img => {
      // Only add if image has a valid URL
      if (img.url && img.url.trim() !== '') {
        availableImages.push({
          id: img.url,
          imageUrl: img.url,
          label: undefined
        });
      }
    });
  }
  
  // Fallback to baseReference (creation image) if no valid angleReferences or images
  // This ensures we show the creation image when Production Hub images are deleted/broken
  if (availableImages.length === 0 && prop.baseReference?.imageUrl) {
    availableImages.push({
      id: prop.baseReference.imageUrl || prop.baseReference.s3Key || 'base-reference',
      imageUrl: prop.baseReference.imageUrl,
      label: 'Creation Image'
    });
  }
  
  // Final fallback: if no images available, use the default imageUrl
  if (availableImages.length === 0 && prop.imageUrl) {
    availableImages.push({
      id: prop.imageUrl,
      imageUrl: prop.imageUrl,
      label: 'Default'
    });
  }
  
  return availableImages;
}

/**
 * Get the selected image URL for a prop based on the selectedImageId.
 * Falls back to the first available image if no selection is made.
 */
export function getSelectedPropImageUrl(
  prop: PropType,
  selectedImageId?: string
): string | undefined {
  const availableImages = getAvailablePropImages(prop);
  
  if (availableImages.length === 0) {
    return prop.imageUrl; // Final fallback
  }
  
  // If selectedImageId exists, use it; otherwise, first image is auto-selected
  const effectiveSelectedId = selectedImageId || availableImages[0]?.id;
  
  if (effectiveSelectedId) {
    const selectedImage = availableImages.find(img => img.id === effectiveSelectedId);
    if (selectedImage) {
      return selectedImage.imageUrl;
    }
  }
  
  // Fallback to first available image
  return availableImages[0]?.imageUrl || prop.imageUrl;
}

