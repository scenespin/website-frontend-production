/**
 * Media Library Mappers
 * 
 * Centralized functions for mapping Media Library files to component data structures.
 * Ensures consistent handling of Production Hub vs Creation images across the app.
 */

export interface MediaFile {
  s3Key?: string;
  s3Url?: string;
  entityId?: string;
  isArchived?: boolean; // Feature: Archive instead of delete - preserves history and metadata
  metadata?: {
    entityId?: string;
    createdIn?: string;
    source?: string;
    uploadMethod?: string;
    poseId?: string;
    pose?: { id?: string };
    poseName?: string;
    angle?: string;
    priority?: number;
    outfitName?: string;
    referenceType?: string;
    isClothingReference?: boolean;
    backgroundType?: string;
    sourceType?: string;
    isArchived?: boolean; // Also check metadata.isArchived (backend may store it either way)
  };
  fileName?: string;
}

export interface CharacterHeadshot {
  poseId?: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
  priority?: number;
  outfitName?: string;
}

export interface PropAngleReference {
  id: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
}

export interface PropImage {
  url: string;
  s3Key?: string;
}

/**
 * Map Media Library files to character headshot structure.
 * 
 * SIMPLIFIED LOGIC:
 * - Media Library is the source of truth
 * - Fetch ALL images associated with the character
 * - Only filter: Don't show creation images UNLESS there are no production images (last resort)
 * - Filter out clothing references from virtual try-on
 * - No sorting, no prioritization, no limits - let the user decide
 * 
 * @param mediaFiles - Media Library files for the character
 * @param characterId - Character ID to filter files
 * @returns Array of all headshots (unsorted, unlimited)
 */
export function mapMediaFilesToHeadshots(
  mediaFiles: MediaFile[],
  characterId: string
): CharacterHeadshot[] {
  const allImages: MediaFile[] = [];
  let hasProductionImages = false;
  
  // First pass: collect all images and check if we have production images
  mediaFiles.forEach((file) => {
    if ((file.metadata?.entityId || file.entityId) === characterId) {
      // Skip thumbnails only
      if (file.s3Key?.startsWith('thumbnails/')) return;
      
      // Skip if no s3Key (invalid file)
      if (!file.s3Key) return;
      
      // Filter out clothing references from virtual try-on
      if (
        file.metadata?.isClothingReference === true ||
        file.metadata?.referenceType === 'clothing' ||
        file.s3Key?.toLowerCase().includes('clothing_reference') ||
        file.s3Key?.toLowerCase().includes('clothing-reference') ||
        file.fileName?.toLowerCase().includes('clothing reference')
      ) {
        return; // Skip clothing references
      }
      
      // Check if this is a production image (not a creation image)
      const isProductionImage =
        file.metadata?.createdIn === 'production-hub' ||
        file.metadata?.source === 'pose-generation' ||
        file.metadata?.uploadMethod === 'pose-generation' ||
        file.metadata?.poseId || // Any pose ID means it's from production
        file.metadata?.angle; // Any angle means it's from production
      
      const isCreationImage =
        file.metadata?.createdIn === 'creation' ||
        file.metadata?.referenceType === 'base' ||
        file.metadata?.uploadMethod === 'character-creation' ||
        file.metadata?.uploadMethod === 'character-generation' ||
        file.metadata?.uploadMethod === 'character-bank';
      
      if (isProductionImage) {
        hasProductionImages = true;
      }
      
      allImages.push(file);
    }
  });
  
  // Filter: if production images exist, exclude creation images (last resort only)
  // If no production images, include creation images
  const filteredImages = hasProductionImages
    ? allImages.filter((file) => {
        const isCreationImage =
          file.metadata?.createdIn === 'creation' ||
          file.metadata?.referenceType === 'base' ||
          file.metadata?.uploadMethod === 'character-creation' ||
          file.metadata?.uploadMethod === 'character-generation' ||
          file.metadata?.uploadMethod === 'character-bank';
        return !isCreationImage; // Exclude creation images if production images exist
      })
    : allImages; // Include everything (including creation) if no production images
  
  // Map to headshot structure - no sorting, no prioritization, no limits
  const headshots: CharacterHeadshot[] = filteredImages.map((file) => {
    const poseId = file.metadata?.poseId || file.metadata?.pose?.id;
    const label = file.metadata?.poseName || file.metadata?.angle || file.metadata?.fileName || 'Image';
    
    return {
      poseId: poseId || file.s3Key,
      s3Key: file.s3Key!,
      // 🔥 FIX: Media Library files don't have s3Url - presigned URLs are fetched separately
      // Set imageUrl to null (not empty string) - will be resolved via URL maps
      imageUrl: null as any, // Will be resolved via thumbnailUrlsMap or fullImageUrlsMap
      label,
      priority: 0, // No prioritization - all images are equal
      outfitName: file.metadata?.outfitName
    };
  });
  
  // Return all headshots - no sorting, no limiting - let the user decide
  return headshots;
}

/**
 * Map Media Library files to prop structure (angleReferences/images).
 * 
 * Logic:
 * - Production Hub images -> angleReferences
 * - Creation images -> images[]
 * - Media Library is the source of truth
 * 
 * @param mediaFiles - Media Library files for the prop
 * @param propId - Prop ID to filter files
 * @returns Object with angleReferences and images arrays
 */
export function mapMediaFilesToPropStructure(
  mediaFiles: MediaFile[],
  propId: string
): {
  angleReferences: PropAngleReference[];
  images: PropImage[];
} {
  const angleReferences: PropAngleReference[] = [];
  const images: PropImage[] = [];
  
  mediaFiles.forEach((file) => {
    if ((file.metadata?.entityId || file.entityId) === propId) {
      // Skip thumbnails (Media Library source of truth)
      if (file.s3Key?.startsWith('thumbnails/')) return;
      
      // Skip if no s3Key (invalid file)
      if (!file.s3Key) return;
      
      // Skip archived/deleted files (Media Library source of truth)
      // Note: This is a safeguard - usePropReferences should already filter these out
      // Check both top-level isArchived and metadata.isArchived (backend may store it either way)
      if (file.isArchived === true || file.metadata?.isArchived === true) return;
      
      const isProductionHub =
        file.metadata?.createdIn === 'production-hub' ||
        file.metadata?.source === 'angle-generation' ||
        file.metadata?.uploadMethod === 'angle-generation';
      
      if (isProductionHub) {
        // Production Hub image -> angleReferences
        // Use s3Key as ID for backend workflow compatibility (backend matches by ID in asset.angleReferences)
        angleReferences.push({
          id: file.s3Key!, // Use s3Key as ID for backend compatibility
          s3Key: file.s3Key!,
          // 🔥 FIX: Media Library files don't have s3Url - presigned URLs are fetched separately
      // Set imageUrl to null (not empty string) - will be resolved via URL maps
      imageUrl: null as any, // Will be resolved via thumbnailUrlsMap or fullImageUrlsMap // Will be replaced with presigned URL if needed
          label: file.metadata?.angle
        });
      } else {
        // Creation image -> images[]
        // Use s3Key as URL for backend workflow compatibility (backend matches img.url === selectedImageId)
        images.push({
          url: file.s3Key!, // Use s3Key as URL for backend compatibility
          s3Key: file.s3Key
        });
      }
    }
  });
  
  return { angleReferences, images };
}

/**
 * Check if a Media Library file is a background image (for locations).
 * 
 * 🔥 FIX: Backgrounds from angle packages have sourceType === 'angle-variations' AND backgroundType set.
 * If sourceType === 'angle-variations' but no backgroundType, it's an angle, not a background.
 */
export function isBackgroundFile(file: MediaFile): boolean {
  // Must have backgroundType to be a background
  if (file.metadata?.backgroundType !== undefined) {
    return true;
  }
  
  // Backgrounds from angle packages: sourceType === 'angle-variations' AND backgroundType must be set
  // If sourceType === 'angle-variations' but no backgroundType, it's an angle, not a background
  if (file.metadata?.sourceType === 'angle-variations') {
    return file.metadata?.backgroundType !== undefined;
  }
  
  // Check file path/name for background indicators
  return (
    file.s3Key?.toLowerCase().includes('background') ||
    file.fileName?.toLowerCase().includes('background')
  );
}

/**
 * Check if a Media Library file is an angle image (for locations).
 */
export function isAngleFile(file: MediaFile): boolean {
  return (
    file.metadata?.sourceType === 'angle-variations' ||
    file.metadata?.angle !== undefined ||
    file.s3Key?.toLowerCase().includes('angle') ||
    file.fileName?.toLowerCase().includes('angle')
  );
}

