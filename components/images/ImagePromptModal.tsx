'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useImageGenerator } from '@/hooks/useAgentCall';

interface ImagePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: 'character' | 'location' | 'asset';
    entityData: {
        name: string;
        description?: string;
        type?: string; // For character: 'lead' | 'supporting' | 'minor', for location: 'INT' | 'EXT' | 'INT/EXT', for asset: category
        arcNotes?: string; // For characters
        atmosphereNotes?: string; // For locations
        category?: string; // For assets: 'prop' | 'vehicle' | 'furniture' | 'other'
        tags?: string[]; // For assets
    };
    onImageGenerated: (imageUrl: string, prompt: string, modelUsed: string) => void;
}

/**
 * ImagePromptModal - Modal for AI image generation with pre-filled prompts
 * 
 * Pre-fills prompt based on character/location details, user can edit before generating.
 * Uses Photon model (best quality) on backend.
 */
export function ImagePromptModal({
    isOpen,
    onClose,
    entityType,
    entityData,
    onImageGenerated
}: ImagePromptModalProps) {
    const [prompt, setPrompt] = useState('');
    const { generateImage, isLoading, error: generationError } = useImageGenerator();

    // Generate pre-filled prompt when modal opens or entity data changes
    useEffect(() => {
        if (isOpen && entityData) {
            const generatedPrompt = buildPromptFromEntityData(entityType, entityData);
            setPrompt(generatedPrompt);
        }
    }, [isOpen, entityType, entityData]);

    const buildPromptFromEntityData = (
        type: 'character' | 'location' | 'asset',
        data: ImagePromptModalProps['entityData']
    ): string => {
        if (type === 'character') {
            const parts: string[] = [];
            
            // Name and type
            if (data.name) {
                parts.push(data.name);
            }
            if (data.type) {
                const typeLabel = data.type === 'lead' ? 'lead character' : 
                                 data.type === 'supporting' ? 'supporting character' : 
                                 'minor character';
                parts.push(typeLabel);
            }
            
            // Description
            if (data.description) {
                parts.push(data.description);
            }
            
            // Arc notes (if available)
            if (data.arcNotes) {
                parts.push(`Character arc: ${data.arcNotes}`);
            }
            
            // Add quality/style instructions
            parts.push('Professional character portrait, cinematic lighting, high quality, photorealistic');
            
            return parts.join('. ') + '.';
        } else if (type === 'location') {
            // Location
            const parts: string[] = [];
            
            // Name and type
            if (data.name) {
                parts.push(data.name);
            }
            if (data.type) {
                parts.push(`${data.type} location`);
            }
            
            // Description
            if (data.description) {
                parts.push(data.description);
            }
            
            // Atmosphere notes (if available)
            if (data.atmosphereNotes) {
                parts.push(`Atmosphere: ${data.atmosphereNotes}`);
            }
            
            // Add quality/style instructions
            parts.push('Professional location photo, cinematic composition, high quality, photorealistic');
            
            return parts.join('. ') + '.';
        } else {
            // Asset
            const parts: string[] = [];
            
            // Name and category
            if (data.name) {
                parts.push(data.name);
            }
            if (data.category) {
                parts.push(`${data.category} asset`);
            }
            
            // Description
            if (data.description) {
                parts.push(data.description);
            }
            
            // Tags (if available)
            if (data.tags && data.tags.length > 0) {
                parts.push(`Tags: ${data.tags.join(', ')}`);
            }
            
            // Add quality/style instructions
            parts.push('Professional product photo, cinematic lighting, high quality, photorealistic');
            
            return parts.join('. ') + '.';
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        try {
            // Use Photon model (best quality) - backend will use luma-photon-1 or luma-photon-flash
            const result = await generateImage(prompt, 'luma-photon-1', {
                size: '1024x1024',
                quality: 'hd'
            });
            
            // Result structure: { imageUrl, modelUsed, provider, creditsDeducted }
            const imageUrl = (result as any)?.imageUrl || (result as any)?.url;
            const modelUsed = (result as any)?.modelUsed || 'luma-photon-1';
            
            if (imageUrl) {
                onImageGenerated(imageUrl, prompt, modelUsed);
                onClose();
            } else {
                throw new Error('No image URL in response');
            }
        } catch (err: any) {
            console.error('Failed to generate image:', err);
            // Error will be shown in the UI via generationError state from useImageGenerator
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-base-300 border border-base-content/20 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-base-content/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-base-content">
                            Generate {entityType === 'character' ? 'Character' : entityType === 'location' ? 'Location' : 'Asset'} Image
                        </h2>
                        <p className="text-sm text-base-content/60 mt-1">
                            AI will generate an image based on {entityData.name || 'this ' + entityType}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-base-content/60 hover:text-base-content transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-base-content/70 mb-2">
                            Prompt (you can edit this)
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to generate..."
                            className="w-full px-4 py-3 bg-base-content/20 border border-base-content/30 rounded-lg text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={6}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-base-content/50 mt-2">
                            The prompt has been pre-filled based on {entityType} details. Edit as needed.
                        </p>
                    </div>

                    {generationError && (
                        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                            <p className="text-sm text-red-400">{generationError}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg font-medium transition-all bg-base-content/20 text-base-content hover:bg-base-content/30 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                isLoading || !prompt.trim()
                                    ? 'bg-base-content/40 text-base-content/60 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                'Generate Image'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

