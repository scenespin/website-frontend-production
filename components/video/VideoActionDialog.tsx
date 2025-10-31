'use client';

import React, { useState } from 'react';
import { X, Save, Link as LinkIcon, Sparkles } from 'lucide-react';

interface VideoActionDialogProps {
    videoUrl: string;
    metadata: {
        provider: string;
        resolution: string;
        aspectRatio: string;
        duration: string;
        creditsUsed: number;
        s3Key: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSaveToAssets: (assetName: string) => void;
    onAssociate: () => void;
}

export function VideoActionDialog({
    videoUrl,
    metadata,
    isOpen,
    onClose,
    onSaveToAssets,
    onAssociate
}: VideoActionDialogProps) {
    const [assetName, setAssetName] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (assetName.trim()) {
            onSaveToAssets(assetName.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
                {/* Header */}
                <div 
                    className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
                    style={{ 
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border-primary)'
                    }}
                >
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        💾 Save Video to Assets
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-zinc-700"
                    >
                        <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Video Preview */}
                    <div className="rounded-lg overflow-hidden">
                        <video 
                            src={videoUrl} 
                            controls 
                            className="w-full max-h-96 bg-black"
                        />
                    </div>

                    {/* Video Metadata */}
                    <div 
                        className="p-4 rounded-lg space-y-2"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                        <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                            Video Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                                    Provider:
                                </span>
                                <span className="ml-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {metadata.provider}
                                </span>
                            </div>
                            <div>
                                <span className="opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                                    Resolution:
                                </span>
                                <span className="ml-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {metadata.resolution}
                                </span>
                            </div>
                            <div>
                                <span className="opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                                    Aspect Ratio:
                                </span>
                                <span className="ml-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {metadata.aspectRatio}
                                </span>
                            </div>
                            <div>
                                <span className="opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                                    Duration:
                                </span>
                                <span className="ml-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {metadata.duration}
                                </span>
                            </div>
                            <div>
                                <span className="opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                                    Credits Used:
                                </span>
                                <span className="ml-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {metadata.creditsUsed}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Asset Name Input */}
                    <div>
                        <label 
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            Asset Name
                        </label>
                        <input
                            type="text"
                            value={assetName}
                            onChange={(e) => setAssetName(e.target.value)}
                            placeholder="e.g., Opening Scene - Car Chase"
                            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderColor: 'var(--color-border-primary)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    {/* Info Box */}
                    <div 
                        className="p-4 rounded-lg border-l-4"
                        style={{ 
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            borderLeftColor: '#8b5cf6'
                        }}
                    >
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            💡 <strong>Tip:</strong> After saving, you can associate this video with specific scenes, characters, or locations in your screenplay.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div 
                    className="sticky bottom-0 flex gap-3 p-6 border-t"
                    style={{ 
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border-primary)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!assetName.trim()}
                        className="flex-1 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#8b5cf6',
                            color: '#ffffff'
                        }}
                    >
                        <Save className="w-5 h-5" />
                        Save to Assets
                    </button>
                    <button
                        onClick={onAssociate}
                        className="flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#10b981',
                            color: '#ffffff'
                        }}
                    >
                        <Sparkles className="w-5 h-5" />
                        Save & Associate
                    </button>
                </div>
            </div>
        </div>
    );
}

