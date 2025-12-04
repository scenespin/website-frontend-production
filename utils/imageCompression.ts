/**
 * Client-side image compression utility
 * Reduces file size before upload to avoid Vercel's 4.5MB body size limit
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeMB?: number; // Target max size in MB
}

/**
 * Compress an image file to reduce its size
 * Returns a new File object with compressed image data
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    maxSizeMB = 4 // Target 4MB to stay under Vercel's 4.5MB limit
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // If still too large, reduce quality further
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB > maxSizeMB) {
              // Recursively compress with lower quality
              canvas.toBlob(
                (smallerBlob) => {
                  if (!smallerBlob) {
                    // Fallback: use the first blob even if slightly over limit
                    const compressedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    resolve(compressedFile);
                    return;
                  }
                  
                  const compressedFile = new File([smallerBlob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                },
                'image/jpeg',
                Math.max(0.5, quality * 0.7) // Reduce quality by 30%
              );
            } else {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if image needs compression
 */
export function needsCompression(file: File, maxSizeMB: number = 4): boolean {
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB > maxSizeMB;
}

