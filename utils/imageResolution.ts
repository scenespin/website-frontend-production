/**
 * Image Resolution Checker Utility
 * 
 * Checks if an image is 4K, 1080p, or unknown resolution
 * Useful for verifying Nano Banana Pro generates 4K images
 */

/**
 * Check image dimensions to determine if it's 4K or 1080p
 * Returns '4K' if >= 3840x2160, '1080p' if >= 1920x1080, or 'unknown'
 * 
 * @param imageUrl - URL of the image to check
 * @returns Promise resolving to '4K' | '1080p' | 'unknown'
 */
export async function checkImageResolution(imageUrl: string): Promise<'4K' | '1080p' | 'unknown'> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      // 4K is typically 3840x2160 (UHD) or 4096x4096 (DCI 4K)
      if (width >= 3840 || height >= 2160) {
        resolve('4K');
      }
      // 1080p is typically 1920x1080 (Full HD) - Note: Runway Gen-4 maxes out at 1920x1080, not 2K
      else if (width >= 1920 || height >= 1080) {
        resolve('1080p');
      }
      else {
        resolve('unknown');
      }
    };
    img.onerror = () => resolve('unknown');
    img.src = imageUrl;
  });
}

/**
 * Get formatted resolution string for display
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Formatted string like "4096x4096 (4K)" or "1920x1080 (1080p)"
 */
export function formatImageResolution(width: number, height: number): string {
  let resolution: string;
  if (width >= 3840 || height >= 2160) {
    resolution = '4K';
  } else if (width >= 1920 || height >= 1080) {
    resolution = '1080p';
  } else {
    resolution = 'SD';
  }
  
  return `${width}x${height} (${resolution})`;
}

