/**
 * Prop Image Utilities
 *
 * Centralized logic for prop image selection and fallback handling.
 * Used by ShotConfigurationStep and ShotConfigurationPanel to ensure consistency.
 *
 * Groups images by metadata.createdIn so Production Hub uploads appear in
 * "Production Hub" and Creation uploads in "Creation Image" (Scene Builder dropdown).
 */

/** Check if image metadata indicates Production Hub (vs Creation) */
function isProductionHubImage(metadata?: { createdIn?: string; source?: string }): boolean {
  if (!metadata) return false;
  return (
    metadata.createdIn === 'production-hub' ||
    metadata.source === 'angle-generation'
  );
}

export interface PropType {
  id: string;
  name: string;
  imageUrl?: string;
  s3Key?: string;
  angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string; angle?: string }>;
  images?: Array<{ url: string; s3Key?: string; metadata?: { createdIn?: string; source?: string } }>;
  baseReference?: { s3Key?: string; imageUrl?: string; metadata?: { createdIn?: string; source?: string } };
}

export interface AvailableImage {
  id: string;
  imageUrl: string;
  label?: string;
  /** Direct presigned URL (from payload enrichment) - fallback when URL maps miss */
  presignedUrl?: string;
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
  const seenS3Keys = new Set<string>();
  
  // Add angleReferences (Production Hub images)
  // 🔥 Feature 0200: Only include angleReferences that have s3Key (presigned URLs will be fetched)
  if (prop.angleReferences && prop.angleReferences.length > 0) {
    prop.angleReferences.forEach(ref => {
      // Only include if it has s3Key - presigned URL will be fetched from Media Library
      if (ref.s3Key) {
        if (seenS3Keys.has(ref.s3Key)) return;
        seenS3Keys.add(ref.s3Key);
        // 🔥 FIX: Use angle field as label fallback (backend AssetReference uses `angle`, not `label`)
        const effectiveLabel = ref.label || ref.angle;
        // 🔥 FIX: Include presignedUrl from enriched imageUrl (payload-first presigned URL)
        const hasPresignedUrl = ref.imageUrl && !ref.imageUrl.startsWith('projects/') && ref.imageUrl.includes('://');
        availableImages.push({
          id: ref.id,
          imageUrl: ref.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
          label: effectiveLabel,
          presignedUrl: hasPresignedUrl ? ref.imageUrl : undefined
        });
      }
    });
  }
  
  // Add images[] — label by metadata (Creation vs Production Hub)
  if (prop.images && prop.images.length > 0) {
    prop.images.forEach(img => {
      if (img.s3Key) {
        if (seenS3Keys.has(img.s3Key)) return;
        seenS3Keys.add(img.s3Key);
        const hasPresignedUrl = img.url && !img.url.startsWith('projects/') && img.url.includes('://');
        const label = isProductionHubImage(img.metadata) ? 'Production Hub' : 'Creation Image';
        availableImages.push({
          id: img.s3Key,
          imageUrl: img.s3Key,
          label,
          presignedUrl: hasPresignedUrl ? img.url : undefined
        });
      }
    });
  }
  
  // 🔥 SIMPLIFIED: Always add baseReference if it exists - no conditional check
  if (prop.baseReference?.s3Key) {
    if (seenS3Keys.has(prop.baseReference.s3Key)) {
      return availableImages;
    }
    seenS3Keys.add(prop.baseReference.s3Key);
    const hasPresignedUrl = prop.baseReference.imageUrl && !prop.baseReference.imageUrl.startsWith('projects/') && prop.baseReference.imageUrl.includes('://');
    availableImages.push({
      id: prop.baseReference.s3Key,
      imageUrl: prop.baseReference.s3Key, // Use s3Key as identifier - presigned URL will be fetched separately
      label: 'Creation Image',
      presignedUrl: hasPresignedUrl ? prop.baseReference.imageUrl : undefined
    });
  }
  
  return availableImages;
}

/**
 * Get available images grouped by type (Production Hub vs Creation Image).
 * Used by PropImageSelector dropdown component.
 *
 * Groups by metadata.createdIn and metadata.source so Production Hub uploads
 * appear in "Production Hub" and Creation uploads in "Creation Image".
 */
export function getAvailablePropImagesByGroup(prop: PropType): {
  'Production Hub': AvailableImage[];
  'Creation Image': AvailableImage[];
} {
  const productionHub: AvailableImage[] = [];
  const creationImage: AvailableImage[] = [];
  const seenS3Keys = new Set<string>();

  // Add angleReferences (Production Hub)
  if (prop.angleReferences && prop.angleReferences.length > 0) {
    prop.angleReferences.forEach(ref => {
      if (ref.s3Key && !seenS3Keys.has(ref.s3Key)) {
        seenS3Keys.add(ref.s3Key);
        const effectiveLabel = ref.label || ref.angle;
        const hasPresignedUrl = ref.imageUrl && !ref.imageUrl.startsWith('projects/') && ref.imageUrl.includes('://');
        productionHub.push({
          id: ref.id,
          imageUrl: ref.s3Key,
          label: effectiveLabel,
          presignedUrl: hasPresignedUrl ? ref.imageUrl : undefined
        });
      }
    });
  }

  // Add images[] — group by metadata (createdIn / source)
  if (prop.images && prop.images.length > 0) {
    prop.images.forEach(img => {
      if (!img.s3Key || seenS3Keys.has(img.s3Key)) return;
      seenS3Keys.add(img.s3Key);
      const hasPresignedUrl = img.url && !img.url.startsWith('projects/') && img.url.includes('://');
      const entry = {
        id: img.s3Key,
        imageUrl: img.s3Key,
        label: isProductionHubImage(img.metadata) ? 'Production Hub' : 'Creation Image',
        presignedUrl: hasPresignedUrl ? img.url : undefined
      };
      if (isProductionHubImage(img.metadata)) {
        productionHub.push(entry);
      } else {
        creationImage.push(entry);
      }
    });
  }

  // Add baseReference (typically Creation; group by metadata if present)
  if (prop.baseReference?.s3Key && !seenS3Keys.has(prop.baseReference.s3Key)) {
    seenS3Keys.add(prop.baseReference.s3Key);
    const hasPresignedUrl =
      prop.baseReference.imageUrl &&
      !prop.baseReference.imageUrl.startsWith('projects/') &&
      prop.baseReference.imageUrl.includes('://');
    const entry = {
      id: prop.baseReference.s3Key,
      imageUrl: prop.baseReference.s3Key,
      label: isProductionHubImage(prop.baseReference.metadata) ? 'Production Hub' : 'Creation Image',
      presignedUrl: hasPresignedUrl ? prop.baseReference.imageUrl : undefined
    };
    if (isProductionHubImage(prop.baseReference.metadata)) {
      productionHub.push(entry);
    } else {
      creationImage.push(entry);
    }
  }

  return {
    'Production Hub': productionHub,
    'Creation Image': creationImage
  };
}

/**
 * Get the selected image s3Key for a prop based on the selectedImageId.
 * Returns undefined if no explicit selection is made.
 * 
 * 🔥 Feature 0200: Returns s3Key (not imageUrl) - presigned URLs should be fetched separately
 * Don't use expired imageUrl values from entity props.
 */
export function getSelectedPropImageUrl(
  prop: PropType,
  selectedImageId?: string
): string | undefined {
  const availableImages = getAvailablePropImages(prop);

  if (!selectedImageId || availableImages.length === 0) {
    return undefined; // Explicit-only behavior for prop references.
  }

  const selectedImage = availableImages.find(img => img.id === selectedImageId);
  if (!selectedImage) return undefined;

  // Return s3Key (which is stored in imageUrl field) - presigned URL will be fetched separately
  return selectedImage.imageUrl;
}

