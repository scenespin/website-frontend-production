'use client';

import React, { useState } from 'react';
import { Camera, Download, Edit2, Trash2, X } from 'lucide-react';
import type { ImageAsset } from '@/types/screenplay';
import { downloadImage, copyImageUrlToClipboard, generateImageFilename } from '@/utils/imageDownload';

interface ImageGalleryProps {
    images: ImageAsset[];
    entityType: 'character' | 'location' | 'scene' | 'storybeat' | 'asset';
    entityId: string;
    entityName?: string;
    onAddImage?: () => void;
    onEditImage?: (imageAsset: ImageAsset, index: number) => void;
    onDeleteImage?: (index: number) => void;
    readOnly?: boolean;
}

export function ImageGallery({
    images,
    entityType,
    entityId,
    entityName,
    onAddImage,
    onEditImage,
    onDeleteImage,
    readOnly = false
}: ImageGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [showActions, setShowActions] = useState<number | null>(null);

    const handleDownload = (image: ImageAsset, index: number) => {
        const filename = generateImageFilename(entityType, entityName || entityId, index);
        downloadImage(image.imageUrl, filename);
    };

    const handleCopyUrl = async (image: ImageAsset) => {
        try {
            await copyImageUrlToClipboard(image.imageUrl);
            // TODO: Show toast notification
            console.log('Image URL copied to clipboard');
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    };

    const handleDelete = (index: number) => {
        if (confirm('Delete this image? This action cannot be undone.')) {
            onDeleteImage?.(index);
        }
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const navigateLightbox = (direction: 'prev' | 'next') => {
        if (lightboxIndex === null) return;
        
        if (direction === 'prev') {
            setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : images.length - 1);
        } else {
            setLightboxIndex(lightboxIndex < images.length - 1 ? lightboxIndex + 1 : 0);
        }
    };

    // Empty state
    if (images.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed"
                style={{ borderColor: '#3F3F46', backgroundColor: '#0A0A0B' }}
            >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: '#A855F730', border: '2px dashed #A855F750' }}
                >
                    <Camera size={28} style={{ color: '#A855F7' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: '#E5E7EB' }}>
                    No images yet
                </p>
                <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                    Generate or upload images for this {entityType}
                </p>
                {!readOnly && onAddImage && (
                    <button
                        onClick={onAddImage}
                        className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                        style={{ backgroundColor: '#A855F7', color: 'white' }}
                    >
                        Add Image
                    </button>
                )}
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#E5E7EB' }}>
                    Images ({images.length})
                </h3>
                {!readOnly && onAddImage && (
                    <button
                        onClick={onAddImage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                        style={{ backgroundColor: '#A855F7', color: 'white' }}
                    >
                        <Camera size={14} />
                        Add
                    </button>
                )}
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer border transition-all hover:scale-105"
                        style={{ borderColor: '#3F3F46', backgroundColor: '#1C1C1E' }}
                        onClick={() => openLightbox(index)}
                        onMouseEnter={() => setShowActions(index)}
                        onMouseLeave={() => setShowActions(null)}
                    >
                        {/* Image */}
                        <img
                            src={image.imageUrl}
                            alt={`${entityType} image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />

                        {/* Hover Overlay */}
                        {showActions === index && !readOnly && (
                            <div
                                className="absolute inset-0 bg-background/95 flex items-center justify-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => handleDownload(image, index)}
                                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                                    title="Download"
                                >
                                    <Download size={18} style={{ color: 'white' }} />
                                </button>
                                {onEditImage && (
                                    <button
                                        onClick={() => onEditImage(image, index)}
                                        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} style={{ color: 'white' }} />
                                    </button>
                                )}
                                {onDeleteImage && (
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="p-2 rounded-lg hover:bg-red-600/80 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} style={{ color: 'white' }} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Metadata Badge */}
                        {image.metadata?.isEdited && (
                            <div
                                className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
                                style={{ backgroundColor: '#3B82F6', color: 'white' }}
                            >
                                Edited
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 bg-background flex items-center justify-center"
                    style={{ zIndex: 10000 }}
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={closeLightbox}
                    >
                        <X size={24} style={{ color: 'white' }} />
                    </button>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateLightbox('prev');
                                }}
                            >
                                <span style={{ color: 'white', fontSize: '32px' }}>‹</span>
                            </button>
                            <button
                                className="absolute right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateLightbox('next');
                                }}
                            >
                                <span style={{ color: 'white', fontSize: '32px' }}>›</span>
                            </button>
                        </>
                    )}

                    {/* Image Container */}
                    <div className="max-w-6xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={images[lightboxIndex].imageUrl}
                            alt={`${entityType} image ${lightboxIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />

                        {/* Image Info */}
                        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#1C1C1E' }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                                    Image {lightboxIndex + 1} of {images.length}
                                </span>
                                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                                    {new Date(images[lightboxIndex].createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Metadata */}
                            {images[lightboxIndex].metadata && (
                                <div className="space-y-1 text-xs" style={{ color: '#9CA3AF' }}>
                                    {images[lightboxIndex].metadata?.prompt && (
                                        <p>
                                            <span className="font-medium">Prompt:</span>{' '}
                                            {images[lightboxIndex].metadata.prompt}
                                        </p>
                                    )}
                                    {images[lightboxIndex].metadata?.modelUsed && (
                                        <p>
                                            <span className="font-medium">Model:</span>{' '}
                                            {images[lightboxIndex].metadata.modelUsed}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {!readOnly && (
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleDownload(images[lightboxIndex], lightboxIndex)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                                        style={{ backgroundColor: '#3B82F6', color: 'white' }}
                                    >
                                        <Download size={14} />
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleCopyUrl(images[lightboxIndex])}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                                        style={{ backgroundColor: '#6B7280', color: 'white' }}
                                    >
                                        Copy URL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

