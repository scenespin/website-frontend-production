/**
 * useQuickVideo Hook
 * 
 * Manages quick video generation state and logic.
 * This hook can be reused anywhere quick video generation is needed.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickVideoState {
    // Quality tier settings
    qualityTier: 'professional' | 'premium' | 'cinema';
    resolution: '540p' | '720p' | '1080p' | '4k' | '8k';
    aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | '1:1';
    duration: '4s' | '5s' | '6s' | '8s';
    
    // Video mode
    mode: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images' | 'workflow';
    
    // Images
    startImage: File | null;
    endImage: File | null;
    referenceImages: (File | null)[];
    
    // Provider A-specific (standard quality)
    concepts: string[];
    cameraMotion: string;
    
    // Options
    enableSound: boolean;
    enableLoop: boolean;
    
    // Generation state
    isGenerating: boolean;
    progress: number;
    
    // Generated video
    videoUrl: string | null;
    videoMetadata: {
        provider: string;
        resolution: string;
        aspectRatio: string;
        duration: string;
        creditsUsed: number;
        s3Key: string;
    } | null;
    
    // Error
    error: string | null;
    
    // Key for forcing component remount
    key: number;
}

export interface QuickVideoActions {
    // Settings
    setQualityTier: (tier: QuickVideoState['qualityTier']) => void;
    setResolution: (resolution: QuickVideoState['resolution']) => void;
    setAspectRatio: (aspectRatio: QuickVideoState['aspectRatio']) => void;
    setDuration: (duration: QuickVideoState['duration']) => void;
    setMode: (mode: QuickVideoState['mode']) => void;
    
    // Images
    setStartImage: (image: File | null) => void;
    setEndImage: (image: File | null) => void;
    setReferenceImages: (images: (File | null)[]) => void;
    
    // Provider A settings
    setConcepts: (concepts: string[]) => void;
    setCameraMotion: (motion: string) => void;
    
    // Options
    setEnableSound: (enabled: boolean) => void;
    setEnableLoop: (enabled: boolean) => void;
    
    // Generation
    generateVideo: (prompt: string) => Promise<void>;
    
    // Reset
    reset: () => void;
    clearImages: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useQuickVideo(): QuickVideoState & QuickVideoActions {
    // State
    const [qualityTier, setQualityTier] = useState<QuickVideoState['qualityTier']>('professional');
    const [resolution, setResolution] = useState<QuickVideoState['resolution']>('1080p');
    const [aspectRatio, setAspectRatio] = useState<QuickVideoState['aspectRatio']>('16:9');
    const [duration, setDuration] = useState<QuickVideoState['duration']>('5s');
    const [mode, setMode] = useState<QuickVideoState['mode']>('text-only');
    const [startImage, setStartImage] = useState<File | null>(null);
    const [endImage, setEndImage] = useState<File | null>(null);
    const [referenceImages, setReferenceImages] = useState<(File | null)[]>([null, null, null]);
    const [concepts, setConcepts] = useState<string[]>([]);
    const [cameraMotion, setCameraMotion] = useState('none');
    const [enableSound, setEnableSound] = useState(false);
    const [enableLoop, setEnableLoop] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoMetadata, setVideoMetadata] = useState<QuickVideoState['videoMetadata']>(null);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    
    // Video generation hook (async with polling)
    const videoGeneration = useVideoGeneration();
    
    // Progress tracking
    const progressToastIdRef = useRef<string | number | null>(null);
    
    // Watch for video generation completion
    useEffect(() => {
        if (videoGeneration.status === 'completed' && videoGeneration.videos.length > 0) {
            const video = videoGeneration.videos[0];
            
            // Build quality tier display name (provider-agnostic)
            const qualityDisplay = qualityTier === 'professional' ? 'Professional 1080p' : 
                                   qualityTier === 'premium' ? 'Premium 4K' : 
                                   'Premium 4K';
            
            // Save video data (no provider name exposed)
            setVideoUrl(video.videoUrl);
            setVideoMetadata({
                provider: qualityDisplay,  // Display quality tier, not provider
                resolution,
                aspectRatio,
                duration,
                creditsUsed: video.creditsUsed || 0,
                s3Key: video.s3Key
            });
            
            setIsGenerating(false);
            setError(null);
            
            // Reset video generation state
            videoGeneration.reset();
        } else if (videoGeneration.status === 'failed') {
            setIsGenerating(false);
            setError(videoGeneration.error || 'Video generation failed');
            videoGeneration.reset();
        }
    }, [videoGeneration.status, videoGeneration.videos, qualityTier, resolution, aspectRatio, duration]);
    
    // Global progress toast for video generation
    useEffect(() => {
        if (videoGeneration.isGenerating) {
            // Show or update progress toast
            if (progressToastIdRef.current === null) {
                // Create new toast
                progressToastIdRef.current = toast.loading(
                    `🎬 Generating video... ${videoGeneration.progress}%`,
                    {
                        duration: Infinity, // Don't auto-dismiss
                        description: "You can continue working while we generate your video!"
                    }
                );
            } else {
                // Update existing toast
                toast.loading(
                    `🎬 Generating video... ${videoGeneration.progress}%`,
                    {
                        id: progressToastIdRef.current,
                        duration: Infinity,
                        description: "You can continue working while we generate your video!"
                    }
                );
            }
        } else if (progressToastIdRef.current !== null) {
            // Dismiss the toast when generation completes or fails
            toast.dismiss(progressToastIdRef.current);
            progressToastIdRef.current = null;
        }
    }, [videoGeneration.isGenerating, videoGeneration.progress]);
    
    // Helper function to upload image with detailed error handling
    async function uploadImage(file: File, token: string): Promise<{ s3Key: string; s3Url: string }> {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/video/upload-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (!response.ok) {
                // Try to get error details from response
                let errorData: any = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Response doesn't have JSON body
                }
                
                // Provide specific error messages based on status code
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Please log in again and try uploading your image.');
                } else if (response.status === 413) {
                    throw new Error(`Image is too large. Maximum size is 20MB. Please resize your image and try again.`);
                } else if (response.status === 400) {
                    const message = errorData.message || errorData.error || 'Invalid image file';
                    throw new Error(`Upload failed: ${message}`);
                } else if (response.status === 415) {
                    throw new Error('Unsupported image format. Please use JPG, PNG, GIF, or WEBP.');
                } else if (response.status >= 500) {
                    throw new Error(`Server error (${response.status}). Please try again in a few moments.`);
                } else {
                    const message = errorData.message || errorData.error || 'Unknown error';
                    throw new Error(`Upload failed (${response.status}): ${message}`);
                }
            }
            
            const data = await response.json();
            
            // Validate response has required data
            if (!data.s3Key || !data.s3Url) {
                console.error('[UploadImage] Missing s3Key or s3Url in response:', data);
                throw new Error('Upload succeeded but server returned invalid response. Please try again.');
            }
            
            console.log('[UploadImage] Success:', { s3Key: data.s3Key, hasPresignedUrl: !!data.s3Url });
            
            return { s3Key: data.s3Key, s3Url: data.s3Url };
        } catch (error) {
            // Network errors (offline, timeout, etc.)
            if (error instanceof TypeError) {
                throw new Error('Network error. Please check your internet connection and try again.');
            }
            // Re-throw our custom errors
            throw error;
        }
    }
    
    // Generate video
    const generateVideo = async (prompt: string): Promise<void> => {
        console.log('[QuickVideo] Generating video with prompt:', prompt);
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }
        
        setIsGenerating(true);
        setError(null);
        
        try {
            // Upload images if needed
            let startImageS3Key: string | undefined;
            let startImageUrl: string | undefined;
            let endImageS3Key: string | undefined;
            let endImageUrl: string | undefined;
            let referenceImageS3Keys: string[] | undefined;
            let referenceImageUrls: string[] | undefined;
            
            if (mode === 'reference-images') {
                // Upload reference images in parallel
                const { getAuthToken } = await import('@/utils/api');
                const token = await getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                const validImages = referenceImages.filter((img): img is File => img !== null);
                if (validImages.length === 0) {
                    throw new Error('At least one reference image is required for character consistency mode');
                }
                
                console.log('[QuickVideo] Uploading', validImages.length, 'reference images in parallel...');
                
                // Upload all images in parallel
                const uploadPromises = validImages.map(img => uploadImage(img, token));
                const uploadResults = await Promise.all(uploadPromises);
                
                referenceImageS3Keys = uploadResults.map(r => r.s3Key);
                referenceImageUrls = uploadResults.map(r => r.s3Url);
                
                console.log('[QuickVideo] Reference images uploaded:', { 
                    count: referenceImageS3Keys.length,
                    keys: referenceImageS3Keys,
                    hasUrls: referenceImageUrls.every(u => !!u)
                });
            } else if (mode !== 'text-only') {
                // Upload start/end images (image-to-video mode)
                const { getAuthToken } = await import('@/utils/api');
                const token = await getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                if (startImage) {
                    const result = await uploadImage(startImage, token);
                    startImageS3Key = result.s3Key;
                    startImageUrl = result.s3Url;
                    console.log('[QuickVideo] Start image uploaded:', { s3Key: startImageS3Key, hasPresignedUrl: !!startImageUrl });
                }
                
                if (mode === 'image-interpolation' && endImage) {
                    const result = await uploadImage(endImage, token);
                    endImageS3Key = result.s3Key;
                    endImageUrl = result.s3Url;
                    console.log('[QuickVideo] End image uploaded:', { s3Key: endImageS3Key, hasPresignedUrl: !!endImageUrl });
                }
            }
            
            // Backend intelligently routes to best provider based on options
            // No provider selection needed - quality tier + video mode determine routing
            const apiProvider = qualityTier === 'professional' ? 'professional' : 'premium';
            
            console.log('[QuickVideo] Starting provider-agnostic generation with:', {
                prompt,
                videoMode: mode,
                qualityTier: apiProvider,
                cameraMotion,
                enableSound,
                resolution,
                aspectRatio,
                duration
            });
            
            // Start async generation (backend router selects provider)
            await videoGeneration.startGeneration({
                prompts: [{
                    text: prompt,
                    segmentIndex: 0,
                }],
                videoMode: mode,                     // NEW: Tell backend what mode we're in
                qualityTier: apiProvider,
                cameraMotion,                        // NEW: Provider-agnostic camera motion
                enableSound,                         // NEW: Provider-agnostic sound generation
                resolution,
                aspectRatio,
                sceneId: 'quick-video-' + Date.now(),
                sceneName: 'Quick Video',
                useVideoExtension: false,
                referenceImageS3Keys,
                referenceImageUrls,
                startImageS3Key,
                startImageUrl,
                endImageS3Key,
                endImageUrl,
                duration,
                enableLoop,
                // DEPRECATED: Backend ignores these, but keep for backward compat
                lumaConcepts: concepts.join(', '),
                lumaCameraMotion: cameraMotion !== 'none' ? cameraMotion : undefined
            });
            
            // Clear images and reset mode after starting generation
            clearImages();
            
        } catch (err: any) {
            console.error('[QuickVideo] Generation failed:', err);
            setError(err.message || 'Video generation failed');
            setIsGenerating(false);
        }
    };
    
    // Clear images
    const clearImages = () => {
        setStartImage(null);
        setEndImage(null);
        setReferenceImages([null, null, null]);
        setMode('text-only');
        setKey(prev => prev + 1);
    };
    
    // Reset all state
    const reset = () => {
        setQualityTier('professional');
        setResolution('1080p');
        setAspectRatio('16:9');
        setDuration('5s');
        setMode('text-only');
        setStartImage(null);
        setEndImage(null);
        setReferenceImages([null, null, null]);
        setConcepts([]);
        setCameraMotion('none');
        setEnableSound(false);
        setEnableLoop(false);
        setIsGenerating(false);
        setVideoUrl(null);
        setVideoMetadata(null);
        setError(null);
        setKey(prev => prev + 1);
    };
    
    return {
        // State
        qualityTier,
        resolution,
        aspectRatio,
        duration,
        mode,
        startImage,
        endImage,
        referenceImages,
        concepts,
        cameraMotion,
        enableSound,
        enableLoop,
        isGenerating,
        progress: videoGeneration.progress,
        videoUrl,
        videoMetadata,
        error,
        key,
        
        // Actions
        setQualityTier,
        setResolution,
        setAspectRatio,
        setDuration,
        setMode,
        setStartImage,
        setEndImage,
        setReferenceImages,
        setConcepts,
        setCameraMotion,
        setEnableSound,
        setEnableLoop,
        generateVideo,
        reset,
        clearImages,
    };
}

