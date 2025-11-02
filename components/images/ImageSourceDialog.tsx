'use client';

import React, { useState, useRef } from 'react';
import { useImageGenerator } from '@/hooks/useAgentCall';
import { ImageAssociationDialog } from './ImageAssociationDialog';

interface ImageSourceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedEntity?: {
        type: 'character' | 'location' | 'scene' | 'storybeat';
        id: string;
        name: string;
    };
    onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string }) => void;
}

export function ImageSourceDialog({
    isOpen,
    onClose,
    preSelectedEntity,
    onSwitchToChatImageMode
}: ImageSourceDialogProps) {
    const [mode, setMode] = useState<'choice' | 'generate' | 'upload'>('choice');
    const [prompt, setPrompt] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [showAssociationDialog, setShowAssociationDialog] = useState(false);
    const [modelUsed, setModelUsed] = useState('nano-banana');
    
    const { generateImage, isLoading, error: generationError } = useImageGenerator();
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        try {
            const result = await generateImage(prompt, 'nano-banana');
            setGeneratedImageUrl(result.imageUrl);
            setModelUsed(result.modelUsed || 'nano-banana');
            
            // Show association dialog
            setShowAssociationDialog(true);
        } catch (err) {
            console.error('Failed to generate image:', err);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        // Read file as base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setUploadedImageUrl(dataUrl);
            setShowAssociationDialog(true);
        };
        reader.readAsDataURL(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleCloseAssociation = () => {
        setShowAssociationDialog(false);
        // Reset state
        setGeneratedImageUrl(null);
        setUploadedImageUrl(null);
        setPrompt('');
        setMode('choice');
        onClose();
    };

    const currentImageUrl = generatedImageUrl || uploadedImageUrl;

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-base-300 border border-base-content/20 rounded-lg shadow-2xl w-full max-w-xl">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-base-content/20 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-base-content">Add Image</h2>
                            {preSelectedEntity && (
                                <p className="text-sm text-base-content/60 mt-1">
                                    For {preSelectedEntity.type}: {preSelectedEntity.name}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-base-content/60 hover:text-base-content transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {mode === 'choice' && (
                            <div className="space-y-4">
                                <p className="text-base-content/70 text-center mb-6">
                                    How would you like to add an image?
                                </p>

                                {/* Generate Option */}
                                <button
                                    onClick={() => {
                                        // If callback provided, switch to chat image mode
                                        if (onSwitchToChatImageMode) {
                                            onSwitchToChatImageMode('nano-banana', preSelectedEntity);
                                            onClose();
                                        } else {
                                            // Fallback to old behavior
                                            setMode('generate');
                                        }
                                    }}
                                    className="w-full p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 group"
                                >
                                    <div className="flex items-center justify-center gap-4">
                                        <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <div className="text-left">
                                            <div className="text-lg font-semibold text-base-content">Generate with AI</div>
                                            <div className="text-sm text-blue-100">
                                                {onSwitchToChatImageMode 
                                                    ? 'Open chat to generate with AI' 
                                                    : 'Create a new image from a text prompt'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Upload Option */}
                                <button
                                    onClick={() => setMode('upload')}
                                    className="w-full p-6 bg-base-content/20 hover:bg-base-content/40 rounded-lg transition-all group"
                                >
                                    <div className="flex items-center justify-center gap-4">
                                        <svg className="w-8 h-8 text-base-content/70 group-hover:text-base-content transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <div className="text-left">
                                            <div className="text-lg font-semibold text-base-content">Upload Image</div>
                                            <div className="text-sm text-base-content/60">Choose an existing image from your device</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {mode === 'generate' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setMode('choice')}
                                    className="text-sm text-base-content/60 hover:text-base-content transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div>
                                    <label className="block text-sm font-medium text-base-content/70 mb-2">
                                        Describe what you want to generate
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g., A mysterious detective in a noir film, dramatic lighting..."
                                        className="w-full px-4 py-3 bg-base-content/20 border border-base-content/30 rounded-lg text-base-content placeholder-base-content/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={4}
                                        disabled={isLoading}
                                    />
                                </div>

                                {generationError && (
                                    <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                                        <p className="text-sm text-red-400">{generationError}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading || !prompt.trim()}
                                    className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                                        isLoading || !prompt.trim()
                                            ? 'bg-base-content/40 text-base-content/60 cursor-not-allowed'
                                            : 'bg-blue-600 text-base-content hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50'
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
                        )}

                        {mode === 'upload' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setMode('choice')}
                                    className="text-sm text-base-content/60 hover:text-base-content transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                <div className="border-2 border-dashed border-base-content/30 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer" onClick={handleUploadClick}>
                                    <svg className="w-16 h-16 text-base-content/60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-base-content/70 font-medium mb-2">Click to upload</p>
                                    <p className="text-sm text-base-content/50">PNG, JPG, GIF up to 10MB</p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Show Association Dialog after image is ready */}
            {showAssociationDialog && currentImageUrl && (
                <ImageAssociationDialog
                    imageUrl={currentImageUrl}
                    prompt={generatedImageUrl ? prompt : undefined}
                    modelUsed={generatedImageUrl ? modelUsed : undefined}
                    isOpen={showAssociationDialog}
                    onClose={handleCloseAssociation}
                    onAssociate={(entityType, entityId, entityName) => {
                        console.log(`Image associated to ${entityType}: ${entityName}`);
                    }}
                />
            )}
        </>
    );
}

