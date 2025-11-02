'use client';

import React from 'react';
import { Download, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import { GlassModal } from '@/components/ui/glass-modal';
import { SpotlightBorder } from '@/components/ui/spotlight-border';
import type { ImageAsset } from '@/types/screenplay';

interface CharacterImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    character: {
        id: string;
        name: string;
        images?: ImageAsset[];
    };
    onDeleteImage?: (imageUrl: string) => void;
}

export function CharacterImageViewer({
    isOpen,
    onClose,
    character,
    onDeleteImage
}: CharacterImageViewerProps) {
    const handleDownload = async (imageUrl: string, imageName: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = imageName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download image:', error);
            alert('Failed to download image. Please try right-clicking and saving manually.');
        }
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Unknown date';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const images = character.images || [];

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title={`${character.name} - Images`}
            maxWidth="2xl"
        >
            <div className="p-6">
                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-20 h-20 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                            <ImageIcon className="w-10 h-10 text-base-content/30" />
                        </div>
                        <h3 className="text-lg font-semibold text-base-content mb-2">No Images Yet</h3>
                        <p className="text-sm text-base-content/60 text-center max-w-md">
                            Generate or upload images for {character.name} to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {images.map((image, index) => (
                            <SpotlightBorder key={image.imageUrl + index}>
                                <div className="relative group overflow-hidden rounded-xl">
                                    {/* Image */}
                                    <img
                                        src={image.imageUrl}
                                        alt={`${character.name} - Image ${index + 1}`}
                                        className="w-full h-64 object-cover"
                                    />

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            {/* Prompt */}
                                            {image.metadata?.prompt && (
                                                <p className="text-xs text-base-content/80 italic mb-3 line-clamp-2">
                                                    &quot;{image.metadata.prompt}&quot;
                                                </p>
                                            )}

                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-xs text-base-content/60 mb-3">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(new Date(image.createdAt).getTime())}</span>
                                            </div>
                                            
                                            {/* Model & Edit Badge */}
                                            {image.metadata && (
                                                <div className="flex gap-2 mb-3 text-xs">
                                                    {image.metadata.modelUsed && (
                                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                                            {image.metadata.modelUsed}
                                                        </span>
                                                    )}
                                                    {image.metadata.isEdited && (
                                                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                                            Edited
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDownload(image.imageUrl, `${character.name}_${index + 1}.png`)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-base-content text-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </button>
                                                {onDeleteImage && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this image?')) {
                                                                onDeleteImage(image.imageUrl);
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-colors text-red-300 hover:text-red-200"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SpotlightBorder>
                        ))}
                    </div>
                )}
            </div>
        </GlassModal>
    );
}
