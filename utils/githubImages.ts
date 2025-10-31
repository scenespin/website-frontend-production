/**
 * GitHub Images Integration
 * 
 * Syncs S3 image references with GitHub screenplay structure files
 * - Saves image metadata (s3Key, caption, etc.) to structure JSON files
 * - Loads images from GitHub and generates fresh signed download URLs
 * - Maintains single source of truth in GitHub for collaboration
 */

import { getStructureFile, saveStructureFile, createMultiFileCommit } from './github';
import type { ImageAsset } from '../../types/screenplay';
import type { 
    BeatsFile, 
    CharactersFile, 
    LocationsFile,
    StoryBeat,
    Scene,
    Character,
    Location
} from '../../types/screenplay';

// ============================================================================
// Types for GitHub Image Storage
// ============================================================================

/**
 * Simplified image metadata stored in GitHub
 * (excludes temporary downloadUrl, which is generated on-demand)
 */
export interface GitHubImageMetadata {
    id: string;                 // Unique image ID
    s3Key: string;              // Permanent S3 reference
    s3Bucket: string;           // S3 bucket name
    caption?: string;           // User-provided caption
    createdAt: string;          // ISO 8601 timestamp
    metadata?: {
        prompt?: string;        // AI generation prompt
        modelUsed?: string;     // AI model ID
        isEdited?: boolean;     // True if edited image
        originalImageUrl?: string; // If edited, reference to original
        uploadedFileName?: string; // Original filename if uploaded
        fileSize?: number;      // File size in bytes
        mimeType?: string;      // MIME type
        width?: number;         // Image dimensions
        height?: number;
    };
}

// ============================================================================
// Save Images to GitHub
// ============================================================================

/**
 * Save image reference to a character's record in GitHub
 */
export async function saveCharacterImage(
    characterId: string,
    imageData: GitHubImageMetadata,
    commitMessage?: string
): Promise<void> {
    try {
        // 1. Load current characters.json
        const charactersFile: CharactersFile = await getStructureFile('structure/characters.json');
        
        // 2. Find the character
        const character = charactersFile.characters.find(c => c.id === characterId);
        if (!character) {
            throw new Error(`Character ${characterId} not found`);
        }

        // 3. Add image to character's images array
        if (!character.images) {
            character.images = [];
        }
        
        // Check if image already exists (by id)
        const existingIndex = character.images.findIndex(img => img.id === imageData.id);
        if (existingIndex >= 0) {
            // Update existing image
            character.images[existingIndex] = imageData;
        } else {
            // Add new image
            character.images.push(imageData);
        }

        // 4. Save updated characters.json
        await saveStructureFile(
            'structure/characters.json',
            charactersFile,
            commitMessage || `feat: Add image to character ${character.name}`
        );

        console.log(`[githubImages] Saved image ${imageData.id} to character ${characterId}`);
    } catch (error) {
        console.error('[githubImages] Error saving character image:', error);
        throw error;
    }
}

/**
 * Save image reference to a location's record in GitHub
 */
export async function saveLocationImage(
    locationId: string,
    imageData: GitHubImageMetadata,
    commitMessage?: string
): Promise<void> {
    try {
        const locationsFile: LocationsFile = await getStructureFile('structure/locations.json');
        
        const location = locationsFile.locations.find(l => l.id === locationId);
        if (!location) {
            throw new Error(`Location ${locationId} not found`);
        }

        if (!location.images) {
            location.images = [];
        }
        
        const existingIndex = location.images.findIndex(img => img.id === imageData.id);
        if (existingIndex >= 0) {
            location.images[existingIndex] = imageData;
        } else {
            location.images.push(imageData);
        }

        await saveStructureFile(
            'structure/locations.json',
            locationsFile,
            commitMessage || `feat: Add image to location ${location.name}`
        );

        console.log(`[githubImages] Saved image ${imageData.id} to location ${locationId}`);
    } catch (error) {
        console.error('[githubImages] Error saving location image:', error);
        throw error;
    }
}

/**
 * Save image reference to a scene's record in GitHub
 */
export async function saveSceneImage(
    sceneId: string,
    imageData: GitHubImageMetadata,
    commitMessage?: string
): Promise<void> {
    try {
        const beatsFile: BeatsFile = await getStructureFile('structure/beats.json');
        
        // Find the scene across all beats
        let targetBeat: StoryBeat | undefined;
        let targetScene: Scene | undefined;
        
        for (const beat of beatsFile.beats) {
            const scene = beat.scenes.find(s => s.id === sceneId);
            if (scene) {
                targetBeat = beat;
                targetScene = scene;
                break;
            }
        }

        if (!targetScene) {
            throw new Error(`Scene ${sceneId} not found`);
        }

        if (!targetScene.images) {
            targetScene.images = [];
        }
        
        const existingIndex = targetScene.images.findIndex(img => img.id === imageData.id);
        if (existingIndex >= 0) {
            targetScene.images[existingIndex] = imageData;
        } else {
            targetScene.images.push(imageData);
        }

        await saveStructureFile(
            'structure/beats.json',
            beatsFile,
            commitMessage || `feat: Add image to scene ${targetScene.number || sceneId}`
        );

        console.log(`[githubImages] Saved image ${imageData.id} to scene ${sceneId}`);
    } catch (error) {
        console.error('[githubImages] Error saving scene image:', error);
        throw error;
    }
}

/**
 * Save image reference to a story beat's record in GitHub
 */
export async function saveStoryBeatImage(
    beatId: string,
    imageData: GitHubImageMetadata,
    commitMessage?: string
): Promise<void> {
    try {
        const beatsFile: BeatsFile = await getStructureFile('structure/beats.json');
        
        const beat = beatsFile.beats.find(b => b.id === beatId);
        if (!beat) {
            throw new Error(`Story beat ${beatId} not found`);
        }

        if (!beat.images) {
            beat.images = [];
        }
        
        const existingIndex = beat.images.findIndex(img => img.id === imageData.id);
        if (existingIndex >= 0) {
            beat.images[existingIndex] = imageData;
        } else {
            beat.images.push(imageData);
        }

        await saveStructureFile(
            'structure/beats.json',
            beatsFile,
            commitMessage || `feat: Add image to beat ${beat.title}`
        );

        console.log(`[githubImages] Saved image ${imageData.id} to beat ${beatId}`);
    } catch (error) {
        console.error('[githubImages] Error saving beat image:', error);
        throw error;
    }
}

/**
 * Generic save function that routes to the appropriate entity type
 */
export async function saveImageToGitHub(
    entityType: 'character' | 'location' | 'scene' | 'storybeat',
    entityId: string,
    imageData: GitHubImageMetadata,
    commitMessage?: string
): Promise<void> {
    switch (entityType) {
        case 'character':
            return saveCharacterImage(entityId, imageData, commitMessage);
        case 'location':
            return saveLocationImage(entityId, imageData, commitMessage);
        case 'scene':
            return saveSceneImage(entityId, imageData, commitMessage);
        case 'storybeat':
            return saveStoryBeatImage(entityId, imageData, commitMessage);
        default:
            throw new Error(`Unknown entity type: ${entityType}`);
    }
}

// ============================================================================
// Load Images from GitHub
// ============================================================================

/**
 * Convert GitHub image metadata to frontend ImageAsset
 * (generates fresh signed download URL from S3)
 */
async function convertGitHubImageToAsset(
    gitHubImage: GitHubImageMetadata,
    getSignedUrl: (s3Key: string) => Promise<{ downloadUrl: string; expiresAt: number }>
): Promise<ImageAsset> {
    // Generate fresh signed URL
    const { downloadUrl, expiresAt } = await getSignedUrl(gitHubImage.s3Key);

    return {
        imageUrl: downloadUrl,
        s3Key: gitHubImage.s3Key,
        s3Bucket: gitHubImage.s3Bucket,
        createdAt: new Date(gitHubImage.createdAt).getTime(),
        metadata: gitHubImage.metadata
    };
}

/**
 * Load all images for an entity and generate fresh signed URLs
 * 
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @param getSignedUrl - Function to generate signed URLs (from API)
 * @returns Array of ImageAsset objects with fresh download URLs
 */
export async function loadImagesFromGitHub(
    entityType: 'character' | 'location' | 'scene' | 'storybeat',
    entityId: string,
    getSignedUrl: (s3Key: string) => Promise<{ downloadUrl: string; expiresAt: number }>
): Promise<ImageAsset[]> {
    try {
        let images: GitHubImageMetadata[] = [];

        // Load appropriate structure file and find images
        if (entityType === 'character') {
            const file: CharactersFile = await getStructureFile('structure/characters.json');
            const character = file.characters.find(c => c.id === entityId);
            images = character?.images || [];
        } else if (entityType === 'location') {
            const file: LocationsFile = await getStructureFile('structure/locations.json');
            const location = file.locations.find(l => l.id === entityId);
            images = location?.images || [];
        } else if (entityType === 'scene') {
            const file: BeatsFile = await getStructureFile('structure/beats.json');
            for (const beat of file.beats) {
                const scene = beat.scenes.find(s => s.id === entityId);
                if (scene) {
                    images = scene.images || [];
                    break;
                }
            }
        } else if (entityType === 'storybeat') {
            const file: BeatsFile = await getStructureFile('structure/beats.json');
            const beat = file.beats.find(b => b.id === entityId);
            images = beat?.images || [];
        }

        // Convert all images to ImageAsset objects with fresh signed URLs
        const imageAssets = await Promise.all(
            images.map(img => convertGitHubImageToAsset(img, getSignedUrl))
        );

        console.log(`[githubImages] Loaded ${imageAssets.length} images for ${entityType} ${entityId}`);
        
        return imageAssets;
    } catch (error) {
        console.error('[githubImages] Error loading images:', error);
        return [];
    }
}

/**
 * Load ALL images from GitHub structure files and generate signed URLs
 * Useful for initial app load / sync from GitHub
 */
export async function loadAllImagesFromGitHub(
    getSignedUrl: (s3Key: string) => Promise<{ downloadUrl: string; expiresAt: number }>
): Promise<{
    characters: Record<string, ImageAsset[]>;
    locations: Record<string, ImageAsset[]>;
    scenes: Record<string, ImageAsset[]>;
    beats: Record<string, ImageAsset[]>;
}> {
    try {
        const result = {
            characters: {} as Record<string, ImageAsset[]>,
            locations: {} as Record<string, ImageAsset[]>,
            scenes: {} as Record<string, ImageAsset[]>,
            beats: {} as Record<string, ImageAsset[]>
        };

        // Load characters
        const charactersFile: CharactersFile = await getStructureFile('structure/characters.json');
        for (const character of charactersFile.characters) {
            if (character.images && character.images.length > 0) {
                result.characters[character.id] = await Promise.all(
                    character.images.map(img => convertGitHubImageToAsset(img, getSignedUrl))
                );
            }
        }

        // Load locations
        const locationsFile: LocationsFile = await getStructureFile('structure/locations.json');
        for (const location of locationsFile.locations) {
            if (location.images && location.images.length > 0) {
                result.locations[location.id] = await Promise.all(
                    location.images.map(img => convertGitHubImageToAsset(img, getSignedUrl))
                );
            }
        }

        // Load beats and scenes
        const beatsFile: BeatsFile = await getStructureFile('structure/beats.json');
        for (const beat of beatsFile.beats) {
            // Beat images
            if (beat.images && beat.images.length > 0) {
                result.beats[beat.id] = await Promise.all(
                    beat.images.map(img => convertGitHubImageToAsset(img, getSignedUrl))
                );
            }
            
            // Scene images
            for (const scene of beat.scenes) {
                if (scene.images && scene.images.length > 0) {
                    result.scenes[scene.id] = await Promise.all(
                        scene.images.map(img => convertGitHubImageToAsset(img, getSignedUrl))
                    );
                }
            }
        }

        console.log('[githubImages] Loaded all images from GitHub structure files');
        
        return result;
    } catch (error) {
        console.error('[githubImages] Error loading all images:', error);
        return {
            characters: {},
            locations: {},
            scenes: {},
            beats: {}
        };
    }
}

// ============================================================================
// Delete Images from GitHub
// ============================================================================

/**
 * Remove image reference from GitHub structure files
 */
export async function deleteImageFromGitHub(
    entityType: 'character' | 'location' | 'scene' | 'storybeat',
    entityId: string,
    imageId: string,
    commitMessage?: string
): Promise<void> {
    try {
        if (entityType === 'character') {
            const file: CharactersFile = await getStructureFile('structure/characters.json');
            const character = file.characters.find(c => c.id === entityId);
            if (character?.images) {
                character.images = character.images.filter(img => img.id !== imageId);
                await saveStructureFile(
                    'structure/characters.json',
                    file,
                    commitMessage || `feat: Remove image from character ${character.name}`
                );
            }
        } else if (entityType === 'location') {
            const file: LocationsFile = await getStructureFile('structure/locations.json');
            const location = file.locations.find(l => l.id === entityId);
            if (location?.images) {
                location.images = location.images.filter(img => img.id !== imageId);
                await saveStructureFile(
                    'structure/locations.json',
                    file,
                    commitMessage || `feat: Remove image from location ${location.name}`
                );
            }
        } else if (entityType === 'scene') {
            const file: BeatsFile = await getStructureFile('structure/beats.json');
            for (const beat of file.beats) {
                const scene = beat.scenes.find(s => s.id === entityId);
                if (scene?.images) {
                    scene.images = scene.images.filter(img => img.id !== imageId);
                    await saveStructureFile(
                        'structure/beats.json',
                        file,
                        commitMessage || `feat: Remove image from scene ${scene.number || entityId}`
                    );
                    break;
                }
            }
        } else if (entityType === 'storybeat') {
            const file: BeatsFile = await getStructureFile('structure/beats.json');
            const beat = file.beats.find(b => b.id === entityId);
            if (beat?.images) {
                beat.images = beat.images.filter(img => img.id !== imageId);
                await saveStructureFile(
                    'structure/beats.json',
                    file,
                    commitMessage || `feat: Remove image from beat ${beat.title}`
                );
            }
        }

        console.log(`[githubImages] Deleted image ${imageId} from ${entityType} ${entityId}`);
    } catch (error) {
        console.error('[githubImages] Error deleting image:', error);
        throw error;
    }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk save multiple images at once (single commit)
 */
export async function bulkSaveImagesToGitHub(
    updates: Array<{
        entityType: 'character' | 'location' | 'scene' | 'storybeat';
        entityId: string;
        imageData: GitHubImageMetadata;
    }>,
    commitMessage: string
): Promise<void> {
    try {
        // Group updates by file
        const characterUpdates = updates.filter(u => u.entityType === 'character');
        const locationUpdates = updates.filter(u => u.entityType === 'location');
        const sceneOrBeatUpdates = updates.filter(u => u.entityType === 'scene' || u.entityType === 'storybeat');

        const filesToCommit: Array<{ path: string; content: any }> = [];

        // Process characters
        if (characterUpdates.length > 0) {
            const file: CharactersFile = await getStructureFile('structure/characters.json');
            for (const update of characterUpdates) {
                const character = file.characters.find(c => c.id === update.entityId);
                if (character) {
                    if (!character.images) character.images = [];
                    const existingIndex = character.images.findIndex(img => img.id === update.imageData.id);
                    if (existingIndex >= 0) {
                        character.images[existingIndex] = update.imageData;
                    } else {
                        character.images.push(update.imageData);
                    }
                }
            }
            filesToCommit.push({
                path: 'structure/characters.json',
                content: JSON.stringify(file, null, 2)
            });
        }

        // Process locations
        if (locationUpdates.length > 0) {
            const file: LocationsFile = await getStructureFile('structure/locations.json');
            for (const update of locationUpdates) {
                const location = file.locations.find(l => l.id === update.entityId);
                if (location) {
                    if (!location.images) location.images = [];
                    const existingIndex = location.images.findIndex(img => img.id === update.imageData.id);
                    if (existingIndex >= 0) {
                        location.images[existingIndex] = update.imageData;
                    } else {
                        location.images.push(update.imageData);
                    }
                }
            }
            filesToCommit.push({
                path: 'structure/locations.json',
                content: JSON.stringify(file, null, 2)
            });
        }

        // Process scenes and beats
        if (sceneOrBeatUpdates.length > 0) {
            const file: BeatsFile = await getStructureFile('structure/beats.json');
            for (const update of sceneOrBeatUpdates) {
                if (update.entityType === 'scene') {
                    for (const beat of file.beats) {
                        const scene = beat.scenes.find(s => s.id === update.entityId);
                        if (scene) {
                            if (!scene.images) scene.images = [];
                            const existingIndex = scene.images.findIndex(img => img.id === update.imageData.id);
                            if (existingIndex >= 0) {
                                scene.images[existingIndex] = update.imageData;
                            } else {
                                scene.images.push(update.imageData);
                            }
                            break;
                        }
                    }
                } else {
                    const beat = file.beats.find(b => b.id === update.entityId);
                    if (beat) {
                        if (!beat.images) beat.images = [];
                        const existingIndex = beat.images.findIndex(img => img.id === update.imageData.id);
                        if (existingIndex >= 0) {
                            beat.images[existingIndex] = update.imageData;
                        } else {
                            beat.images.push(update.imageData);
                        }
                    }
                }
            }
            filesToCommit.push({
                path: 'structure/beats.json',
                content: JSON.stringify(file, null, 2)
            });
        }

        // Create multi-file commit
        if (filesToCommit.length > 0) {
            await createMultiFileCommit(filesToCommit, commitMessage);
        }

        console.log(`[githubImages] Bulk saved ${updates.length} images`);
    } catch (error) {
        console.error('[githubImages] Error bulk saving images:', error);
        throw error;
    }
}

