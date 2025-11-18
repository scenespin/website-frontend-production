'use client';

import { useState, useCallback } from 'react';
import { secureFetch } from '@/utils/api';

export interface S3UploadOptions {
    file: File;
    entityType: 'character' | 'location' | 'scene' | 'storybeat';
    entityId: string;
    metadata?: Record<string, any>;
    onProgress?: (progress: number) => void;
    onSuccess?: (data: { downloadUrl: string; s3Key: string; imageAsset: any }) => void;
    onError?: (error: Error) => void;
}

export interface S3UploadState {
    isUploading: boolean;
    progress: number;
    error: string | null;
    downloadUrl: string | null;
    s3Key: string | null;
}

/**
 * Hook for uploading files to S3 with entity association
 * 
 * Handles file uploads, progress tracking, and error handling
 * Uses existing S3 API endpoints
 */
export function useS3Upload() {
    const [state, setState] = useState<S3UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
        downloadUrl: null,
        s3Key: null
    });
    
    const uploadFile = useCallback(async ({
        file,
        entityType,
        entityId,
        metadata,
        onProgress,
        onSuccess,
        onError
    }: S3UploadOptions) => {
        setState({ isUploading: true, progress: 0, error: null, downloadUrl: null, s3Key: null });
        
        try {
            // Step 1: Get presigned upload URL from backend
            console.log('[S3Upload] Requesting upload URL for:', file.name, entityType, entityId);
            
            const uploadUrlResponse: any = await secureFetch(
                `/api/s3/upload-url?fileName=${encodeURIComponent(file.name)}&entityType=${entityType}&entityId=${entityId}&contentType=${encodeURIComponent(file.type)}`,
                {
                    method: 'GET'
                }
            );
            
            if (!uploadUrlResponse?.url || !uploadUrlResponse?.fields || !uploadUrlResponse?.s3Key) {
                throw new Error('Invalid upload URL response');
            }
            
            console.log('[S3Upload] Got pre-signed POST, uploading to S3...');
            
            if (onProgress) {
                onProgress(30);
            }
            
            // Step 2: Upload file directly to S3 using FormData POST (presigned POST)
            // This is the recommended approach for browser uploads - Content-Type is handled
            // as form data, not headers, preventing 403 Forbidden errors
            const formData = new FormData();
            
            // Add all the fields returned from createPresignedPost
            // NOTE: Do NOT include 'bucket' field in FormData - it's only for policy validation
            Object.entries(uploadUrlResponse.fields).forEach(([key, value]) => {
                // Skip 'bucket' field - it's only used in the policy, not in FormData
                if (key.toLowerCase() === 'bucket') {
                    return;
                }
                formData.append(key, value as string);
            });
            
            // Add the file last (must be last field in FormData)
            formData.append('file', file);
            
            const uploadResponse = await fetch(uploadUrlResponse.url, {
                method: 'POST',
                body: formData,
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
            }
            
            console.log('[S3Upload] File uploaded to S3, confirming...');
            
            if (onProgress) {
                onProgress(70);
            }
            
            // Step 3: Confirm upload and get download URL
            const confirmResponse: any = await secureFetch('/api/s3/confirm-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    s3Key: uploadUrlResponse.s3Key,
                    metadata
                })
            });
            
            if (!confirmResponse?.downloadUrl) {
                throw new Error('Failed to confirm upload');
            }
            
            console.log('[S3Upload] Upload confirmed, download URL:', confirmResponse.downloadUrl);
            
            setState({
                isUploading: false,
                progress: 100,
                error: null,
                downloadUrl: confirmResponse.downloadUrl,
                s3Key: uploadUrlResponse.s3Key
            });
            
            if (onProgress) {
                onProgress(100);
            }
            
            const result = {
                downloadUrl: confirmResponse.downloadUrl,
                s3Key: uploadUrlResponse.s3Key,
                imageAsset: confirmResponse.imageAsset
            };
            
            if (onSuccess) {
                onSuccess(result);
            }
            
            return result;
            
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Upload failed');
            
            console.error('[S3Upload] Upload failed:', error);
            
            setState({
                isUploading: false,
                progress: 0,
                error: error.message,
                downloadUrl: null,
                s3Key: null
            });
            
            if (onError) {
                onError(error);
            }
            
            throw error;
        }
    }, []);
    
    const reset = useCallback(() => {
        setState({ isUploading: false, progress: 0, error: null, downloadUrl: null, s3Key: null });
    }, []);
    
    return {
        ...state,
        uploadFile,
        reset
    };
}

