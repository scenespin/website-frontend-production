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
 * Logic:
 * - Media Library is the source of truth
 * - Show Production Hub images if available, otherwise show creation images (never mix)
 * - Filter out clothing references from virtual try-on
 * - Prioritize headshots > Production Hub > Other > Creation Image
 * 
 * @param mediaFiles - Media Library files for the character
 * @param characterId - Character ID to filter files
 * @returns Array of headshots sorted by priority
 */
export function mapMediaFilesToHeadshots(
  mediaFiles: MediaFile[],
  characterId: string
): CharacterHeadshot[] {
  const headshotPoseIds = [
    'close-up-front-facing',
    'close-up',
    'extreme-close-up',
    'close-up-three-quarter',
    'headshot-front',
    'headshot-3/4',
    'front-facing'
  ];
  
  const allImages: Array<{
    file: MediaFile;
    isHeadshot: boolean;
    isProductionHub: boolean;
    isCreationImage: boolean;
  }> = [];
  
  // First pass: collect and categorize all images
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
      
      const poseId = file.metadata?.poseId || file.metadata?.pose?.id;
      const isHeadshot =
        poseId &&
        headshotPoseIds.some((hp) =>
          poseId.toLowerCase().includes(hp.toLowerCase())
        );
      const isProductionHub =
        file.metadata?.createdIn === 'production-hub' ||
        file.metadata?.source === 'pose-generation' ||
        file.metadata?.uploadMethod === 'pose-generation';
      const isCreationImage =
        file.metadata?.createdIn === 'creation' ||
        file.metadata?.referenceType === 'base' ||
        file.metadata?.uploadMethod === 'character-creation' ||
        file.metadata?.uploadMethod === 'character-generation' ||
        file.metadata?.uploadMethod === 'character-bank';
      
      allImages.push({ file, isHeadshot, isProductionHub, isCreationImage });
    }
  });
  
  // Check if there are any Production Hub images (headshots or Production Hub uploads)
  const hasProductionHubImages = allImages.some(
    (img) => img.isHeadshot || img.isProductionHub
  );
  
  // Filter: if Production Hub images exist, exclude creation images
  // If no Production Hub images, include creation images
  const filteredImages = hasProductionHubImages
    ? allImages.filter((img) => !img.isCreationImage) // Exclude creation images if Production Hub exists
    : allImages; // Include everything (including creation) if no Production Hub
  
  // Map to headshot structure with proper prioritization
  const headshots: CharacterHeadshot[] = [];
  
  filteredImages.forEach(({ file, isHeadshot, isProductionHub, isCreationImage }) => {
    const poseId = file.metadata?.poseId || file.metadata?.pose?.id;
    
    // Determine label and priority based on image type
    let label = file.metadata?.poseName || file.metadata?.angle || 'Headshot';
    let priority: number;
    
    // Priority assignment (lower number = higher priority, shown first):
    if (isHeadshot) {
      // Headshot poses: highest priority (1-100 range)
      priority = file.metadata?.priority || 50;
    } else if (isProductionHub) {
      // Production Hub images: medium priority (100-500 range)
      priority = file.metadata?.priority || 200;
    } else if (isCreationImage && file.metadata?.referenceType === 'base') {
      // Creation images (base references): lowest priority (last resort)
      label = 'Creation Image (Last Resort)';
      priority = 9999; // Lowest priority (highest number)
    } else {
      // Other images (user uploads, etc.): medium-low priority (500-900 range)
      priority = file.metadata?.priority || 700;
    }
    
    headshots.push({
      poseId: poseId || (isCreationImage ? 'base-reference' : file.s3Key),
      s3Key: file.s3Key!,
      imageUrl: file.s3Url || '',
      label,
      priority,
      outfitName: file.metadata?.outfitName
    });
  });
  
  // Sort by priority (lower number = higher priority)
  headshots.sort((a, b) => (a.priority || 999) - (b.priority || 999));
  
  return headshots.slice(0, 10); // Limit to 10 headshots
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
          imageUrl: file.s3Url || '', // Will be replaced with presigned URL if needed
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

