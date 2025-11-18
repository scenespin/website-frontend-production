'use client';

import React, { useState, useRef } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { ImageAssociationDialog } from './ImageAssociationDialog';
import { ImagePromptModal } from './ImagePromptModal';

interface ImageSourceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedEntity?: {
        type: 'character' | 'location' | 'scene' | 'storybeat';
        id: string;
        name: string;
    };
    entityData?: {
        // For character
        name?: string;
        description?: string;
        type?: string; // 'lead' | 'supporting' | 'minor'
        arcNotes?: string;
        // For location
        locationType?: string; // 'INT' | 'EXT' | 'INT/EXT'
        atmosphereNotes?: string;
    };
    onImageReady?: (imageUrl: string, prompt?: string, modelUsed?: string) => void;
    skipMethodSelection?: boolean; // NEW: If true, skip method selection and go directly to upload
}

export function ImageSourceDialog({
    isOpen,
    onClose,
    preSelectedEntity,
    entityData,
    onImageReady,
    skipMethodSelection = false
}: ImageSourceDialogProps) {
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [showAssociationDialog, setShowAssociationDialog] = useState(false);
    const [imagePrompt, setImagePrompt] = useState<string | undefined>();
    const [imageModelUsed, setImageModelUsed] = useState<string | undefined>();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // If skipMethodSelection is true, trigger file input immediately
    React.useEffect(() => {
        if (isOpen && skipMethodSelection && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [isOpen, skipMethodSelection]);

    if (!isOpen) return null;

    const handleImageGenerated = async (imageUrl: string, prompt: string, modelUsed: string) => {
        setGeneratedImageUrl(imageUrl);
        setImagePrompt(prompt);
        setImageModelUsed(modelUsed);
        setShowPromptModal(false);
        
        // If preSelectedEntity is provided, auto-associate and skip dialog
        if (preSelectedEntity && onImageReady) {
            onImageReady(imageUrl, prompt, modelUsed);
            onClose();
        } else {
            // Show association dialog for manual selection
            setShowAssociationDialog(true);
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
            
            // If preSelectedEntity is provided, auto-associate and skip dialog
            if (preSelectedEntity && onImageReady) {
                onImageReady(dataUrl);
                onClose();
            } else {
                // Show association dialog for manual selection
                setShowAssociationDialog(true);
            }
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
        setImagePrompt(undefined);
        setImageModelUsed(undefined);
        onClose();
    };

    const handleAssociate = (entityType: string, entityId: string, entityName: string) => {
        const currentImageUrl = generatedImageUrl || uploadedImageUrl;
        if (currentImageUrl && onImageReady) {
            onImageReady(currentImageUrl, imagePrompt, imageModelUsed);
        }
        handleCloseAssociation();
    };

    const currentImageUrl = generatedImageUrl || uploadedImageUrl;
    
    // Determine entity type for prompt modal
    const entityTypeForPrompt = preSelectedEntity?.type === 'character' ? 'character' : 
                                preSelectedEntity?.type === 'location' ? 'location' : 
                                'character'; // default

    // If skipMethodSelection, don't show the modal - just handle file input
    if (skipMethodSelection) {
        return (
            <>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </>
        );
    }

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
                        <div className="space-y-4">
                            <p className="text-base-content/70 text-center mb-6">
                                How would you like to add an image?
                            </p>

                            {/* Upload Section */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleUploadClick}
                                    className="w-full p-6 bg-base-content/20 hover:bg-base-content/40 rounded-lg transition-all group border-2 border-dashed border-base-content/30 hover:border-blue-500"
                                >
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Upload className="w-8 h-8 text-base-content/70 group-hover:text-base-content transition-colors" />
                                        <div className="text-center">
                                            <div className="text-lg font-semibold text-base-content">Upload Image</div>
                                            <div className="text-sm text-base-content/60 mt-1">Choose an existing image from your device</div>
                                            <div className="text-xs text-base-content/50 mt-1">PNG, JPG, GIF up to 10MB</div>
                                        </div>
                                    </div>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-base-content/20"></div>
                                <span className="text-sm text-base-content/50">OR</span>
                                <div className="flex-1 h-px bg-base-content/20"></div>
                            </div>

                            {/* Generate with AI Section */}
                            <button
                                onClick={() => {
                                    setShowPromptModal(true);
                                }}
                                className="w-full p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 group"
                            >
                                <div className="flex items-center justify-center gap-4">
                                    <Sparkles className="w-8 h-8 text-white" />
                                    <div className="text-left">
                                        <div className="text-lg font-semibold text-white">Generate with AI</div>
                                        <div className="text-sm text-blue-100">
                                            Create a new image from a text prompt
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prompt Modal for AI Generation */}
            {showPromptModal && preSelectedEntity && entityData && (
                <ImagePromptModal
                    isOpen={showPromptModal}
                    onClose={() => setShowPromptModal(false)}
                    entityType={entityTypeForPrompt}
                    entityData={{
                        name: entityData.name || preSelectedEntity.name,
                        description: entityData.description,
                        type: entityTypeForPrompt === 'character' ? entityData.type : entityData.locationType,
                        arcNotes: entityData.arcNotes,
                        atmosphereNotes: entityData.atmosphereNotes
                    }}
                    onImageGenerated={handleImageGenerated}
                />
            )}

            {/* Show Association Dialog after image is ready */}
            {showAssociationDialog && currentImageUrl && (
                <ImageAssociationDialog
                    imageUrl={currentImageUrl}
                    prompt={imagePrompt}
                    modelUsed={imageModelUsed}
                    isOpen={showAssociationDialog}
                    onClose={handleCloseAssociation}
                    onAssociate={handleAssociate}
                    preSelectedEntity={preSelectedEntity}
                />
            )}
        </>
    );
}

