/**
 * Chunked Upload Utility
 * 
 * Handles large file uploads by splitting them into smaller chunks
 * and uploading them sequentially. This prevents timeout issues and
 * allows for better progress tracking.
 */

export interface ChunkedUploadOptions {
  file: File;
  endpoint: string;
  chunkSize?: number; // in bytes, default 5MB
  onProgress?: (progress: number) => void;
  metadata?: Record<string, string>;
}

export interface ChunkedUploadResult {
  success: boolean;
  url?: string;
  s3Key?: string;
  type?: string;
  message?: string;
  error?: string;
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB max chunk

/**
 * Upload a large file in chunks
 * 
 * For files under 10MB, uses regular upload
 * For larger files, splits into chunks and uploads sequentially
 */
export async function chunkedUpload(
  options: ChunkedUploadOptions
): Promise<ChunkedUploadResult> {
  const {
    file,
    endpoint,
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
    metadata = {}
  } = options;

  // For small files (< 10MB), use regular upload
  if (file.size < MAX_CHUNK_SIZE) {
    return regularUpload(file, endpoint, metadata, onProgress);
  }

  // For large files, use chunked upload
  return chunkedUploadLarge(file, endpoint, chunkSize, metadata, onProgress);
}

/**
 * Regular upload for small files
 */
async function regularUpload(
  file: File,
  endpoint: string,
  metadata: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<ChunkedUploadResult> {
  try {
    const formData = new FormData();
    
    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'video' : 
                     file.type.startsWith('audio/') ? 'audio' : 'image';
    
    formData.append(fileType, file);
    
    // Add metadata
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Track progress using XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}

/**
 * Chunked upload for large files
 * 
 * NOTE: This requires a backend endpoint that supports chunked uploads
 * For now, we'll fall back to regular upload with a warning
 */
async function chunkedUploadLarge(
  file: File,
  endpoint: string,
  chunkSize: number,
  metadata: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<ChunkedUploadResult> {
  console.warn('[ChunkedUpload] File is large, but chunked upload is not yet implemented on the backend.');
  console.warn('[ChunkedUpload] Falling back to regular upload. This may fail for very large files.');
  
  // For now, fall back to regular upload
  // TODO: Implement proper chunked upload with backend support
  return regularUpload(file, endpoint, metadata, onProgress);
  
  /* Future implementation:
  
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let uploadedBytes = 0;
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('uploadId', uploadId);
    formData.append('fileName', file.name);
    
    // Add metadata on first chunk
    if (chunkIndex === 0) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    const response = await fetch(`${endpoint}/chunk`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Chunk upload failed: ${response.status}`);
    }
    
    uploadedBytes += chunk.size;
    
    if (onProgress) {
      const progress = (uploadedBytes / file.size) * 100;
      onProgress(progress);
    }
  }
  
  // Finalize the upload
  const finalizeResponse = await fetch(`${endpoint}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, fileName: file.name, metadata })
  });
  
  if (!finalizeResponse.ok) {
    throw new Error('Failed to finalize upload');
  }
  
  return finalizeResponse.json();
  */
}

/**
 * Check if a file should use chunked upload
 */
export function shouldUseChunkedUpload(fileSize: number): boolean {
  return fileSize > MAX_CHUNK_SIZE;
}

/**
 * Calculate optimal chunk size based on file size
 */
export function calculateChunkSize(fileSize: number): number {
  if (fileSize < 50 * 1024 * 1024) { // < 50MB
    return 5 * 1024 * 1024; // 5MB chunks
  } else if (fileSize < 200 * 1024 * 1024) { // < 200MB
    return 10 * 1024 * 1024; // 10MB chunks
  } else {
    return 20 * 1024 * 1024; // 20MB chunks
  }
}

