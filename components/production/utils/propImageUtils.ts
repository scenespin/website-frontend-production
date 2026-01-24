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
 * Get all available images for a prop, grouped by type.
 * 
 * 🔥 SIMPLIFIED: Always include all images (Production Hub + Creation) - user selects what they want
 * 
 * Media Library is the source of truth.
 * Note: angleReferences may have s3Key but empty imageUrl - presigned URLs will be fetched separately.
 */
export function getAvailablePropImages(prop: PropType): AvailableImage[] {
  const availableImages: AvailableImage[] = [];
  
  // Add angleReferences (Production Hub images)
  // 🔥 Feature 0200: Only include angleReferences that have s3Key (presigned URLs will be fetched)
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
  
  // 🔥 SIMPLIFIED: Always add images[] (Creation images) - no conditional check
  if (prop.images && prop.images.length > 0) {
    prop.images.forEach(img => {
      // Only include if it has s3Key - presigned URL will be fetched
      if (img.s3Key) {
        availableImages.push({
          id: img.s3Key,
          imageUrl: img.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
          label: 'Creation Image'
        });
      }
    });
  }
  
  // 🔥 SIMPLIFIED: Always add baseReference if it exists - no conditional check
  if (prop.baseReference?.s3Key) {
    availableImages.push({
      id: prop.baseReference.s3Key,
      imageUrl: prop.baseReference.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
      label: 'Creation Image'
    });
  }
  
  return availableImages;
}

/**
 * Get available images grouped by type (Production Hub vs Creation Image).
 * Used by PropImageSelector dropdown component.
 */
export function getAvailablePropImagesByGroup(prop: PropType): {
  'Production Hub': AvailableImage[];
  'Creation Image': AvailableImage[];
} {
  const productionHub: AvailableImage[] = [];
  const creationImage: AvailableImage[] = [];
  
  // Add angleReferences (Production Hub images)
  if (prop.angleReferences && prop.angleReferences.length > 0) {
    prop.angleReferences.forEach(ref => {
      if (ref.s3Key) {
        productionHub.push({
          id: ref.id,
          imageUrl: ref.s3Key,
          label: ref.label
        });
      }
    });
  }
  
  // Add images[] (Creation images)
  if (prop.images && prop.images.length > 0) {
    prop.images.forEach(img => {
      if (img.s3Key) {
        creationImage.push({
          id: img.s3Key,
          imageUrl: img.s3Key,
          label: 'Creation Image'
        });
      }
    });
  }
  
  // Add baseReference (Creation image)
  if (prop.baseReference?.s3Key) {
    creationImage.push({
      id: prop.baseReference.s3Key,
      imageUrl: prop.baseReference.s3Key,
      label: 'Creation Image'
    });
  }
  
  return {
    'Production Hub': productionHub,
    'Creation Image': creationImage
  };
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

