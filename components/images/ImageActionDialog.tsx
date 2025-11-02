'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Wand2, Download } from 'lucide-react';
import { GlassModal } from '@/components/ui/glass-modal';
import { InlineChatModal } from '@/components/images/InlineChatModal';
import { SpotlightBorder } from '@/components/ui/spotlight-border';

interface ImageActionDialogProps {
    imageUrl: string;
    isOpen: boolean;
    onClose: () => void;
    onJustAdd: () => void;
    onEditWithAI: () => void;
    onDownload?: () => void;
    inlineMode?: boolean;
}

export function ImageActionDialog({
    imageUrl,
    isOpen,
    onClose,
    onJustAdd,
    onEditWithAI,
    onDownload,
    inlineMode = true
}: ImageActionDialogProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDownload = async () => {
        if (onDownload) {
            onDownload();
            return;
        }
        
        // Default download implementation
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `generated_image_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            // Close dialog after download
            onClose();
        } catch (error) {
            console.error('Failed to download image:', error);
            alert('Failed to download image. Please try right-clicking and saving manually.');
        }
    };

    const content = (
        <>
            {/* Custom Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur-xl relative">
                <div>
                    <h2 className="text-xl font-semibold text-base-content">Choose an action for your image</h2>
                    <p className="text-sm text-base-content/60 mt-1">
                        What would you like to do next?
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 relative">
                {/* Image Preview */}
                <div className="relative w-full h-52 bg-gradient-to-br from-black/40 to-purple-900/20 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <img
                        src={imageUrl}
                        alt="Uploaded"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Just Add Button */}
                    <SpotlightBorder>
                        <button
                            onClick={onJustAdd}
                            className="w-full flex items-center gap-4 p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-300 group shadow-lg"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500/30 to-blue-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:from-blue-500/40 group-hover:to-blue-600/30 transition-all duration-300 border border-blue-400/40 shadow-lg shadow-blue-500/20">
                                <ImageIcon className="w-6 h-6 text-blue-200" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-base font-semibold text-base-content">Add to Script</h3>
                                <p className="text-sm text-base-content/60">Link this image to a character, location, or scene</p>
                            </div>
                        </button>
                    </SpotlightBorder>

                    {/* Download Button */}
                    <SpotlightBorder>
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center gap-4 p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-300 group shadow-lg"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500/30 to-emerald-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:from-green-500/40 group-hover:to-emerald-600/30 transition-all duration-300 border border-green-400/40 shadow-lg shadow-green-500/20">
                                <Download className="w-6 h-6 text-green-200" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-base font-semibold text-base-content">Download Only</h3>
                                <p className="text-sm text-base-content/60">Save to your device and start fresh</p>
                            </div>
                        </button>
                    </SpotlightBorder>

                    {/* Edit with AI Button */}
                    <SpotlightBorder>
                        <button
                            onClick={onEditWithAI}
                            className="w-full flex items-center gap-4 p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md hover:from-white/15 hover:to-white/10 rounded-xl transition-all duration-300 group shadow-lg"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/30 to-fuchsia-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:from-purple-500/40 group-hover:to-fuchsia-600/30 transition-all duration-300 border border-purple-400/40 shadow-lg shadow-purple-500/20">
                                <Wand2 className="w-6 h-6 text-purple-200" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-base font-semibold text-base-content">Edit with AI First</h3>
                                <p className="text-sm text-base-content/60">Use Nano Banana to modify the image before adding</p>
                            </div>
                        </button>
                    </SpotlightBorder>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-xl relative">
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-white/10 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 hover:scale-[1.02]"
                >
                    Cancel
                </button>
            </div>
        </>
    );

    // If in expanded mode, use GlassModal
    if (isExpanded) {
        return (
            <GlassModal
                isOpen={isOpen}
                onClose={onClose}
                maxWidth="lg"
                showCloseButton={false}
            >
                {content}
            </GlassModal>
        );
    }

    // Default: use InlineChatModal
    if (inlineMode) {
        return (
            <InlineChatModal
                isOpen={isOpen}
                onClose={onClose}
                onExpand={() => setIsExpanded(true)}
                showExpandButton={true}
            >
                {content}
            </InlineChatModal>
        );
    }

    // Fallback to GlassModal if inlineMode is false
    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="lg"
            showCloseButton={false}
        >
            {content}
        </GlassModal>
    );
}

