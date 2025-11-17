'use client';

import React, { useState } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { X, Download } from 'lucide-react';
import type { Character, Location, Scene, StoryBeat } from '@/types/screenplay';
import { SpotlightBorder } from '@/components/ui/spotlight-border';

interface ImageAssociationDialogProps {
    imageUrl: string;
    prompt?: string;
    modelUsed?: string;
    isOpen: boolean;
    onClose: () => void;
    onAssociate?: (entityType: string, entityId: string, entityName: string) => void;
    preSelectedEntity?: {
        type: 'character' | 'location' | 'scene' | 'storybeat';
        id: string;
        name: string;
    };
}

type EntityType = 'character' | 'location' | 'scene' | 'storybeat';

export function ImageAssociationDialog({
    imageUrl,
    prompt,
    modelUsed,
    isOpen,
    onClose,
    onAssociate,
    preSelectedEntity
}: ImageAssociationDialogProps) {
    const { characters, locations, beats, addImageToEntity } = useScreenplay();
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(
        preSelectedEntity?.type || 'character'
    );
    const [selectedEntityId, setSelectedEntityId] = useState<string>(
        preSelectedEntity?.id || ''
    );
    const [isAssociating, setIsAssociating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-select and auto-associate pre-selected entity when dialog opens
    React.useEffect(() => {
        if (preSelectedEntity && isOpen && preSelectedEntity.id) {
            setSelectedEntityType(preSelectedEntity.type);
            setSelectedEntityId(preSelectedEntity.id);
            
            // Auto-associate if entity is pre-selected (no need for user to click)
            const autoAssociate = async () => {
                try {
                    setIsAssociating(true);
                    await addImageToEntity(
                        preSelectedEntity.type,
                        preSelectedEntity.id,
                        imageUrl,
                        { prompt, modelUsed }
                    );
                    
                    // Call callback if provided
                    if (onAssociate) {
                        onAssociate(preSelectedEntity.type, preSelectedEntity.id, preSelectedEntity.name);
                    }
                    
                    // Close dialog
                    onClose();
                } catch (err) {
                    console.error('Failed to auto-associate image:', err);
                    setError('Failed to associate image. Please try again.');
                    setIsAssociating(false);
                }
            };
            
            // Small delay to ensure UI is ready
            setTimeout(() => {
                autoAssociate();
            }, 100);
        }
    }, [preSelectedEntity, isOpen, imageUrl, prompt, modelUsed, onAssociate, onClose, addImageToEntity]);

    if (!isOpen) return null;

    // Get all scenes from beats
    const allScenes: Scene[] = beats.flatMap(beat => beat.scenes);

    // Get available entities based on selected type
    const getAvailableEntities = (): Array<{ id: string; name: string }> => {
        switch (selectedEntityType) {
            case 'character':
                return characters.map(c => ({ id: c.id, name: c.name }));
            case 'location':
                return locations.map(l => ({ id: l.id, name: l.name }));
            case 'scene':
                return allScenes.map(s => ({ id: s.id, name: s.heading || 'Untitled Scene' }));
            case 'storybeat':
                return beats.map(b => ({ id: b.id, name: b.title }));
            default:
                return [];
        }
    };

    const availableEntities = getAvailableEntities();

    const handleAssociate = async () => {
        if (!selectedEntityId) {
            setError('Please select an entity');
            return;
        }

        setIsAssociating(true);
        setError(null);

        try {
            await addImageToEntity(
                selectedEntityType,
                selectedEntityId,
                imageUrl,
                { prompt, modelUsed }
            );

            // Find entity name for callback
            const entity = availableEntities.find(e => e.id === selectedEntityId);
            const entityName = entity?.name || 'Unknown';

            // Call callback if provided
            if (onAssociate) {
                onAssociate(selectedEntityType, selectedEntityId, entityName);
            }

            // Close dialog
            onClose();
        } catch (err) {
            console.error('Failed to associate image:', err);
            setError('Failed to associate image. Please try again.');
        } finally {
            setIsAssociating(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const handleDownload = async () => {
        try {
            // Fetch the image as a blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename from prompt or use default
            const filename = prompt 
                ? `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`
                : `generated_image_${Date.now()}.png`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('[Download] Image downloaded successfully');
        } catch (err) {
            console.error('[Download] Failed to download image:', err);
            alert('Failed to download image. Please try right-clicking and saving manually.');
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={onClose}
        >
            {/* Animated background orbs - ULTRA VISIBLE */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/70 via-fuchsia-500/60 to-pink-400/70 rounded-full blur-2xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] bg-gradient-to-br from-cyan-400/70 via-blue-500/60 to-indigo-400/70 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/60 via-amber-500/50 to-yellow-400/60 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div 
                className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none" />
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between bg-white/5 backdrop-blur-xl relative">
                    <div>
                        <h2 className="text-xl font-semibold text-base-content text-glow">Link Image to Screenplay</h2>
                        <p className="text-sm text-base-content/60 mt-1">
                            Associate with a character, location, scene, or storybeat
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-base-content/60 hover:text-base-content transition-all duration-300 p-2 hover:bg-white/10 rounded-xl hover:scale-105 backdrop-blur-sm border border-white/10 hover:border-white/20"
                        disabled={isAssociating}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6 relative">
                    {/* Image Preview */}
                    <div className="space-y-3">
                        <div className="relative w-full h-64 bg-gradient-to-br from-black/40 to-purple-900/20 rounded-2xl overflow-hidden border border-white/10 shadow-inner group flex items-center justify-center backdrop-blur-sm">
                            <img
                                src={imageUrl}
                                alt="Generated"
                                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                            {/* Download button overlay */}
                            <button
                                onClick={handleDownload}
                                className="absolute top-3 right-3 p-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 text-base-content rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg border border-white/20 hover:scale-105"
                                title="Download image"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                        {prompt && (
                            <div className="flex items-start justify-between gap-3 px-4 py-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                                <p className="text-xs text-base-content/70 italic flex-1 leading-relaxed">
                                    <span className="text-purple-300 font-medium">Prompt:</span> &quot;{prompt}&quot;
                                </p>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-base-content/70 hover:text-base-content hover:bg-white/10 rounded-lg transition-all duration-300 flex-shrink-0 border border-white/10 hover:border-white/20"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Entity Type Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-base-content/90">
                            1. Choose Entity Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {(['character', 'location', 'scene', 'storybeat'] as EntityType[]).map((type) => (
                                <SpotlightBorder key={type}>
                                    <button
                                        onClick={() => {
                                            setSelectedEntityType(type);
                                            setSelectedEntityId('');
                                            setError(null);
                                        }}
                                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                            selectedEntityType === type
                                                ? 'bg-purple-500/20 text-base-content'
                                                : 'text-base-content/90 hover:bg-white/5'
                                        }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                </SpotlightBorder>
                            ))}
                        </div>
                    </div>

                    {/* Entity Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-base-content/90">
                            2. Select {selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}
                        </label>
                        {availableEntities.length > 0 ? (
                            <select
                                value={selectedEntityId}
                                onChange={(e) => {
                                    setSelectedEntityId(e.target.value);
                                    setError(null);
                                }}
                                className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 focus:bg-white/15 transition-all duration-300 hover:bg-white/15 hover:border-white/30"
                            >
                                <option value="" className="bg-base-200 text-base-content/60">-- Choose {selectedEntityType} --</option>
                                {availableEntities.map((entity) => (
                                    <option key={entity.id} value={entity.id} className="bg-base-200 text-base-content">
                                        {entity.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="px-4 py-3.5 bg-amber-500/10 backdrop-blur-sm border border-amber-400/30 rounded-xl">
                                <p className="text-sm text-amber-200">
                                    No {selectedEntityType}s available yet. You can skip for now and create one later.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/10 backdrop-blur-sm border border-red-400/30 rounded-xl">
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end bg-white/5 backdrop-blur-xl relative">
                    <SpotlightBorder>
                        <button
                            onClick={handleSkip}
                            className="px-5 py-2.5 text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-white/5 rounded-xl transition-all duration-300"
                            disabled={isAssociating}
                        >
                            Skip for Now
                        </button>
                    </SpotlightBorder>
                    <SpotlightBorder>
                        <button
                            onClick={handleAssociate}
                            disabled={isAssociating || !selectedEntityId || availableEntities.length === 0}
                            className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                                isAssociating || !selectedEntityId || availableEntities.length === 0
                                    ? 'bg-white/5 text-base-content/30 cursor-not-allowed'
                                    : 'bg-purple-500/20 text-base-content hover:bg-purple-500/30'
                            }`}
                        >
                            {isAssociating ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Linking...
                                </span>
                            ) : (
                                'Link Image'
                            )}
                        </button>
                    </SpotlightBorder>
                </div>
            </div>
        </div>
    );
}

