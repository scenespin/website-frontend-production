/**
 * useImageGeneration Hook
 * 
 * Manages image generation, editing, and upload state.
 * This hook can be reused anywhere image generation is needed (Character Board, Location Board, etc.)
 */

'use client';

import { useState } from 'react';
import { useImageGenerator, useImageEditor } from '@/hooks/useAgentCall';
import { useS3Upload } from '@/hooks/useS3Upload';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageGenerationState {
    // Generated images
    generatedImageUrl: string | null;
    generatedImagePrompt: string;
    generatedImageModel: string;
    generatedImageS3Key: string | null;
    
    // Uploaded images
    uploadedImageUrl: string | null;
    uploadedImageS3Key: string | null;
    
    // Edited images
    editedImageUrl: string | null;
    lastEditPrompt: string;
    isEditingImage: boolean;
    imageToEdit: string | null;
    
    // Settings
    activeImageModel: string | null;
    imageSize: string;
    
    // Entity context (for character/location association)
    entityContextBanner: { type: string; id: string; name: string } | null;
    
    // Loading states
    isGenerating: boolean;
    isUploading: boolean;
    uploadProgress: number;
    
    // Error
    error: string | null;
}

export interface ImageGenerationActions {
    // Generate
    generateImage: (prompt: string, model: string, size: string) => Promise<void>;
    
    // Edit
    editImage: (imageUrl: string, prompt: string) => Promise<void>;
    setImageToEdit: (imageUrl: string | null) => void;
    
    // Upload
    uploadImage: (file: File) => Promise<void>;
    
    // Settings
    setActiveImageModel: (model: string | null) => void;
    setImageSize: (size: string) => void;
    
    // Entity context
    setEntityContextBanner: (entity: { type: string; id: string; name: string } | null) => void;
    
    // Reset
    reset: () => void;
    clearGeneratedImage: () => void;
    clearUploadedImage: () => void;
    clearEditedImage: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useImageGeneration(): ImageGenerationState & ImageGenerationActions {
    // Generated images
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [generatedImagePrompt, setGeneratedImagePrompt] = useState('');
    const [generatedImageModel, setGeneratedImageModel] = useState('');
    const [generatedImageS3Key, setGeneratedImageS3Key] = useState<string | null>(null);
    
    // Uploaded images
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [uploadedImageS3Key, setUploadedImageS3Key] = useState<string | null>(null);
    
    // Edited images
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [lastEditPrompt, setLastEditPrompt] = useState('');
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    
    // Settings
    const [activeImageModel, setActiveImageModel] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState('1024x1024');
    
    // Entity context
    const [entityContextBanner, setEntityContextBanner] = useState<{ type: string; id: string; name: string } | null>(null);
    
    // Error
    const [error, setError] = useState<string | null>(null);
    
    // Hooks
    const { generateImage: generateImageAPI, isLoading: isGeneratingAPI } = useImageGenerator();
    const { editImage: editImageAPI, isLoading: isEditingAPI } = useImageEditor();
    const { uploadFile, isUploading, progress: uploadProgress } = useS3Upload();
    
    // Generate image
    const generateImage = async (prompt: string, model: string, size: string): Promise<void> => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }
        
        setError(null);
        
        try {
            console.log('[useImageGeneration] Generating image:', { prompt: prompt.substring(0, 50), model, size });
            
            const result = await generateImageAPI(prompt, model, { size });
            
            if (result && typeof result === 'object') {
                const data = result as any;
                
                setGeneratedImageUrl(data.imageUrl || data.url);
                setGeneratedImageS3Key(data.s3Key || null);
                setGeneratedImagePrompt(prompt);
                setGeneratedImageModel(model);
                
                console.log('[useImageGeneration] Image generated successfully');
            } else {
                throw new Error('Invalid response from image generation API');
            }
        } catch (err: any) {
            console.error('[useImageGeneration] Generation failed:', err);
            setError(err.message || 'Image generation failed');
            throw err;
        }
    };
    
    // Edit image
    const editImage = async (imageUrl: string, prompt: string): Promise<void> => {
        if (!imageUrl || !prompt.trim()) {
            setError('Please provide an image and edit prompt');
            return;
        }
        
        setError(null);
        setIsEditingImage(true);
        
        try {
            console.log('[useImageGeneration] Editing image:', { prompt: prompt.substring(0, 50) });
            
            const result = await editImageAPI(imageUrl, prompt);
            
            if (result && typeof result === 'object') {
                const data = result as any;
                
                setEditedImageUrl(data.imageUrl || data.url);
                setLastEditPrompt(prompt);
                
                console.log('[useImageGeneration] Image edited successfully');
            } else {
                throw new Error('Invalid response from image edit API');
            }
        } catch (err: any) {
            console.error('[useImageGeneration] Edit failed:', err);
            setError(err.message || 'Image editing failed');
            throw err;
        } finally {
            setIsEditingImage(false);
        }
    };
    
    // Upload image
    const uploadImage = async (file: File): Promise<void> => {
        if (!file) {
            setError('Please select a file');
            return;
        }
        
        setError(null);
        
        try {
            console.log('[useImageGeneration] Uploading image:', file.name);
            
            // For now, use temp upload without entity association
            // TODO: Integrate with entity association when needed
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/s3/upload-temp', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            
            const data = await response.json();
            
            setUploadedImageUrl(data.url || data.downloadUrl);
            setUploadedImageS3Key(data.s3Key || data.key);
            
            console.log('[useImageGeneration] Image uploaded successfully');
        } catch (err: any) {
            console.error('[useImageGeneration] Upload failed:', err);
            setError(err.message || 'Image upload failed');
            throw err;
        }
    };
    
    // Clear generated image
    const clearGeneratedImage = () => {
        setGeneratedImageUrl(null);
        setGeneratedImagePrompt('');
        setGeneratedImageModel('');
        setGeneratedImageS3Key(null);
    };
    
    // Clear uploaded image
    const clearUploadedImage = () => {
        setUploadedImageUrl(null);
        setUploadedImageS3Key(null);
    };
    
    // Clear edited image
    const clearEditedImage = () => {
        setEditedImageUrl(null);
        setLastEditPrompt('');
        setImageToEdit(null);
    };
    
    // Reset all state
    const reset = () => {
        clearGeneratedImage();
        clearUploadedImage();
        clearEditedImage();
        setActiveImageModel(null);
        setImageSize('1024x1024');
        setEntityContextBanner(null);
        setError(null);
    };
    
    return {
        // State
        generatedImageUrl,
        generatedImagePrompt,
        generatedImageModel,
        generatedImageS3Key,
        uploadedImageUrl,
        uploadedImageS3Key,
        editedImageUrl,
        lastEditPrompt,
        isEditingImage,
        imageToEdit,
        activeImageModel,
        imageSize,
        entityContextBanner,
        isGenerating: isGeneratingAPI,
        isUploading,
        uploadProgress,
        error,
        
        // Actions
        generateImage,
        editImage,
        setImageToEdit,
        uploadImage,
        setActiveImageModel,
        setImageSize,
        setEntityContextBanner,
        reset,
        clearGeneratedImage,
        clearUploadedImage,
        clearEditedImage,
    };
}

