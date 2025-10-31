/**
 * Image download and clipboard utilities for screenplay image assets
 */

/**
 * Download an image to the user's local filesystem
 * Handles both base64 data URLs and external URLs
 */
export function downloadImage(imageUrl: string, filename: string): void {
    try {
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        
        console.log(`[ImageDownload] Downloaded image: ${filename}`);
    } catch (error) {
        console.error('[ImageDownload] Failed to download image:', error);
        throw new Error('Failed to download image');
    }
}

/**
 * Download multiple images as a ZIP file
 * Useful for exporting all character portraits or location photos
 */
export async function downloadImagesAsZip(
    images: Array<{ imageUrl: string; filename: string }>,
    zipFilename: string,
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    try {
        // Dynamic import JSZip and FileSaver
        const JSZip = (await import('jszip')).default;
        const { saveAs } = await import('file-saver');
        
        console.log(`[ImageDownload] Creating ZIP with ${images.length} images...`);
        
        const zip = new JSZip();
        
        // Download and add each image to ZIP
        for (let i = 0; i < images.length; i++) {
            const { imageUrl, filename } = images[i];
            
            if (onProgress) {
                onProgress(i + 1, images.length);
            }
            
            try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                zip.file(filename, blob);
            } catch (error) {
                console.error(`[ImageDownload] Failed to download ${filename}:`, error);
                // Continue with other images
            }
        }
        
        // Generate ZIP and download
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, zipFilename);
        
        console.log(`[ImageDownload] Downloaded ${images.length} images as ${zipFilename}`);
    } catch (error) {
        console.error('[ImageDownload] Failed to create ZIP:', error);
        throw new Error('Failed to download images as ZIP');
    }
}

/**
 * Copy an image to the clipboard
 * Useful for quickly sharing image URLs
 */
export async function copyImageToClipboard(imageUrl: string): Promise<void> {
    try {
        // If it's a data URL, copy the URL itself
        if (imageUrl.startsWith('data:')) {
            await navigator.clipboard.writeText(imageUrl);
            console.log('[ImageDownload] Copied data URL to clipboard');
            return;
        }
        
        // For external URLs, fetch and copy as blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        
        console.log('[ImageDownload] Copied image to clipboard');
    } catch (error) {
        // Fallback: just copy the URL as text
        try {
            await navigator.clipboard.writeText(imageUrl);
            console.log('[ImageDownload] Copied image URL to clipboard (fallback)');
        } catch (fallbackError) {
            console.error('[ImageDownload] Failed to copy to clipboard:', error);
            throw new Error('Failed to copy image to clipboard');
        }
    }
}

/**
 * Copy image URL as text to clipboard
 * Simpler fallback for copyImageToClipboard
 */
export async function copyImageUrlToClipboard(imageUrl: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(imageUrl);
        console.log('[ImageDownload] Copied image URL to clipboard');
    } catch (error) {
        console.error('[ImageDownload] Failed to copy URL:', error);
        throw new Error('Failed to copy image URL');
    }
}

/**
 * Convert a base64 data URL to a Blob
 * Useful for processing images client-side
 */
export function dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }
    
    return new Blob([u8arr], { type: mime });
}

/**
 * Generate a filename for an entity's image
 */
export function generateImageFilename(
    entityType: 'character' | 'location' | 'scene' | 'storybeat',
    entityName: string,
    index?: number
): string {
    const sanitizedName = entityName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = Date.now();
    const suffix = index !== undefined ? `_${index + 1}` : '';
    
    return `${entityType}_${sanitizedName}${suffix}_${timestamp}.png`;
}

/**
 * Validate if a string is a valid image URL or data URL
 */
export function isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    // Check if it's a data URL
    if (url.startsWith('data:image/')) return true;
    
    // Check if it's a valid URL
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Download entity images as organized ZIP
 */
export async function downloadEntityImages(
    entityType: 'character' | 'location' | 'scene' | 'storybeat',
    entityName: string,
    images: Array<{ imageUrl: string; metadata?: any }>,
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    const imageFiles = images.map((img, index) => {
        const extension = img.metadata?.mimeType?.split('/')[1] || 'jpg';
        return {
            imageUrl: img.imageUrl,
            filename: `${index + 1}_${entityName.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`
        };
    });

    await downloadImagesAsZip(
        imageFiles,
        `${entityType}_${entityName.replace(/[^a-zA-Z0-9]/g, '_')}_images.zip`,
        onProgress
    );
}

/**
 * Download complete production package with all screenplay images
 * Organized by entity type with metadata and README
 */
export async function downloadProductionPackage(
    data: {
        characters: Array<{ name: string; images?: Array<{ imageUrl: string; metadata?: any; s3Key?: string; createdAt?: string }> }>;
        locations: Array<{ name: string; images?: Array<{ imageUrl: string; metadata?: any; s3Key?: string; createdAt?: string }> }>;
        scenes: Array<{ number: number; heading: string; images?: Array<{ imageUrl: string; metadata?: any; s3Key?: string; createdAt?: string }> }>;
        beats: Array<{ title: string; images?: Array<{ imageUrl: string; metadata?: any; s3Key?: string; createdAt?: string }> }>;
    },
    onProgress?: (current: number, total: number, message: string) => void
): Promise<void> {
    try {
        // Dynamic imports
        const JSZip = (await import('jszip')).default;
        const { saveAs } = await import('file-saver');
        
        console.log('[ImageDownload] Creating production package...');
        
        const zip = new JSZip();
        
        // Count total images
        const totalImages = 
            data.characters.reduce((sum, c) => sum + (c.images?.length || 0), 0) +
            data.locations.reduce((sum, l) => sum + (l.images?.length || 0), 0) +
            data.scenes.reduce((sum, s) => sum + (s.images?.length || 0), 0) +
            data.beats.reduce((sum, b) => sum + (b.images?.length || 0), 0);

        let currentImage = 0;

        // Helper to add images to folder
        const addImagesToFolder = async (
            folderPath: string,
            entityName: string,
            images: Array<{ imageUrl: string; metadata?: any; s3Key?: string; createdAt?: string }>
        ) => {
            if (!images || images.length === 0) return;

            const sanitizedName = entityName.replace(/[^a-zA-Z0-9]/g, '_');
            
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                currentImage++;

                if (onProgress) {
                    onProgress(currentImage, totalImages, `Packaging ${entityName} (${i + 1}/${images.length})`);
                }

                try {
                    const response = await fetch(img.imageUrl);
                    const blob = await response.blob();
                    const extension = img.metadata?.mimeType?.split('/')[1] || 'jpg';
                    
                    zip.file(`${folderPath}/${sanitizedName}/${i + 1}.${extension}`, blob);

                    // Add metadata
                    if (img.metadata || img.s3Key) {
                        const metadata = {
                            prompt: img.metadata?.prompt,
                            modelUsed: img.metadata?.modelUsed,
                            s3Key: img.s3Key,
                            createdAt: img.createdAt,
                            fileSize: img.metadata?.fileSize,
                            dimensions: img.metadata?.width && img.metadata?.height 
                                ? `${img.metadata.width}x${img.metadata.height}` 
                                : undefined
                        };
                        zip.file(`${folderPath}/${sanitizedName}/${i + 1}_metadata.json`, JSON.stringify(metadata, null, 2));
                    }
                } catch (error) {
                    console.error(`[ImageDownload] Failed to add image for ${entityName}:`, error);
                }
            }
        };

        // Add all entity images
        for (const character of data.characters) {
            if (character.images && character.images.length > 0) {
                await addImagesToFolder('characters', character.name, character.images);
            }
        }

        for (const location of data.locations) {
            if (location.images && location.images.length > 0) {
                await addImagesToFolder('locations', location.name, location.images);
            }
        }

        for (const scene of data.scenes) {
            if (scene.images && scene.images.length > 0) {
                const sceneName = `Scene_${scene.number}_${scene.heading.substring(0, 30)}`;
                await addImagesToFolder('scenes', sceneName, scene.images);
            }
        }

        for (const beat of data.beats) {
            if (beat.images && beat.images.length > 0) {
                await addImagesToFolder('storybeats', beat.title, beat.images);
            }
        }

        // Create README
        const readme = `# Production Package - Screenplay Images

Generated: ${new Date().toISOString()}

## Contents

- **characters/**: ${data.characters.filter(c => c.images && c.images.length > 0).length} characters with images
- **locations/**: ${data.locations.filter(l => l.images && l.images.length > 0).length} locations with images
- **scenes/**: ${data.scenes.filter(s => s.images && s.images.length > 0).length} scenes with images
- **storybeats/**: ${data.beats.filter(b => b.images && b.images.length > 0).length} beats with images

## Total Images: ${totalImages}

## Structure

Each entity folder contains:
- Numbered images (1.jpg, 2.jpg, etc.)
- Metadata JSON files (1_metadata.json) with generation details

## Usage

This package contains all visual references for the screenplay.
Use these images for:
- Production design reference
- Costume design
- Location scouting
- Storyboarding
- Pitch decks

---

Generated by Scene Spin
`;

        zip.file('README.md', readme);

        // Create inventory CSV
        const csvLines = ['Entity Type,Entity Name,Image Count'];
        data.characters.forEach(c => {
            if (c.images && c.images.length > 0) {
                csvLines.push(`Character,${c.name},${c.images.length}`);
            }
        });
        data.locations.forEach(l => {
            if (l.images && l.images.length > 0) {
                csvLines.push(`Location,${l.name},${l.images.length}`);
            }
        });
        zip.file('image_inventory.csv', csvLines.join('\n'));

        if (onProgress) {
            onProgress(totalImages, totalImages, 'Creating ZIP file...');
        }

        // Generate and download
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        const timestamp = new Date().toISOString().split('T')[0];
        saveAs(zipBlob, `production_package_${timestamp}.zip`);

        console.log(`[ImageDownload] Production package complete with ${totalImages} images`);
    } catch (error) {
        console.error('[ImageDownload] Failed to create production package:', error);
        throw new Error('Failed to create production package');
    }
}

