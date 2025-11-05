'use client';

import { useState, useCallback } from 'react';

export interface DirectS3UploadOptions {
  file: File;
  projectId?: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
  onSuccess?: (data: { s3Url: string; s3Key: string; fileName: string; fileType: string }) => void;
  onError?: (error: Error) => void;
}

export interface DirectS3UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  s3Url: string | null;
  s3Key: string | null;
}

/**
 * Professional Direct S3 Upload Hook
 * 
 * Industry-standard upload approach using pre-signed URLs:
 * 1. Get pre-signed URL from backend
 * 2. Upload directly to S3 (bypasses Next.js)
 * 3. Return S3 URL and key
 * 
 * Benefits:
 * - No file size limits (supports up to 50GB)
 * - No Vercel bandwidth costs
 * - Faster uploads (direct to S3)
 * - Scalable to any traffic volume
 * 
 * Usage:
 * ```tsx
 * const { uploadFile, isUploading, progress } = useDirectS3Upload();
 * 
 * await uploadFile({
 *   file,
 *   projectId: 'my-project',
 *   onProgress: (p) => console.log(`${p}% complete`),
 *   onSuccess: ({ s3Url, s3Key }) => {
 *     // Show StorageDecisionModal
 *   }
 * });
 * ```
 */
export function useDirectS3Upload() {
  const [state, setState] = useState<DirectS3UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    s3Url: null,
    s3Key: null
  });

  const uploadFile = useCallback(async ({
    file,
    projectId = 'default',
    metadata,
    onProgress,
    onSuccess,
    onError
  }: DirectS3UploadOptions) => {
    setState({ isUploading: true, progress: 0, error: null, s3Url: null, s3Key: null });
    
    try {
      // Step 1: Get pre-signed URL from backend
      if (onProgress) onProgress(10);
      
      console.log('[DirectS3Upload] Requesting pre-signed URL for:', file.name);
      
      const presignedUrl = `/api/video/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(projectId)}`;
      
      const presignedResponse = await fetch(presignedUrl);
      
      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error('File too large. Maximum size is 50GB.');
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json();
          throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
        }
      }
      
      const { uploadUrl, s3Key } = await presignedResponse.json();
      
      if (!uploadUrl || !s3Key) {
        throw new Error('Invalid response from server');
      }
      
      console.log('[DirectS3Upload] Got pre-signed URL, uploading to S3...');
      
      if (onProgress) onProgress(30);
      
      // Step 2: Upload directly to S3 using XMLHttpRequest (for progress tracking)
      const s3Url = await uploadToS3WithProgress(uploadUrl, file, (progress) => {
        // Map S3 upload progress to 30-90%
        const mappedProgress = 30 + (progress * 0.6);
        setState(prev => ({ ...prev, progress: mappedProgress }));
        if (onProgress) onProgress(mappedProgress);
      });
      
      console.log('[DirectS3Upload] Upload complete:', s3Key);
      
      if (onProgress) onProgress(100);
      
      // Step 3: Generate final S3 URL
      const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
      const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
      const finalS3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
      
      setState({
        isUploading: false,
        progress: 100,
        error: null,
        s3Url: finalS3Url,
        s3Key: s3Key
      });
      
      const result = {
        s3Url: finalS3Url,
        s3Key: s3Key,
        fileName: file.name,
        fileType: file.type
      };
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      
      console.error('[DirectS3Upload] Upload failed:', error);
      
      setState({
        isUploading: false,
        progress: 0,
        error: error.message,
        s3Url: null,
        s3Key: null
      });
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null, s3Url: null, s3Key: null });
  }, []);

  return {
    ...state,
    uploadFile,
    reset
  };
}

/**
 * Upload file to S3 using XMLHttpRequest for progress tracking
 */
function uploadToS3WithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(uploadUrl.split('?')[0]); // Return S3 URL without query params
      } else {
        reject(new Error(`S3 upload failed: ${xhr.statusText}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Start upload
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

