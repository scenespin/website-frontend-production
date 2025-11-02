'use client';

import React, { useState } from 'react';
import { Link2, Download, RefreshCw } from 'lucide-react';
import { SpotlightBorder } from '@/components/ui/spotlight-border';
import { GlassModal } from '@/components/ui/glass-modal';
import { InlineChatModal } from '@/components/images/InlineChatModal';

interface ImageEditedActionDialogProps {
    imageUrl: string;
    prompt?: string;
    isOpen: boolean;
    onClose: () => void;
    onAssociate: () => void;
    onDownload: () => void;
    onEditAgain: () => void;
    inlineMode?: boolean;
}

export function ImageEditedActionDialog({
    imageUrl,
    prompt,
    isOpen,
    onClose,
    onAssociate,
    onDownload,
    onEditAgain,
    inlineMode = true
}: ImageEditedActionDialogProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const content = (
        <>
            {/* Custom Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur-xl relative">
                <div>
                    <h2 className="text-xl font-semibold text-base-content">Image Edited Successfully!</h2>
                    <p className="text-sm text-base-content/60 mt-1">
                        What would you like to do next?
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 relative">
                    {/* Image Preview */}
                    <div className="relative w-full h-52 bg-gradient-to-br from-black/40 to-green-900/20 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center backdrop-blur-sm">
                        <img
                            src={imageUrl}
                            alt="Edited"
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                    {prompt && (
                        <div className="px-4 py-2.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                            <p className="text-xs text-base-content/70 italic leading-relaxed">
                                <span className="text-green-300 font-medium">Edit:</span> &quot;{prompt}&quot;
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Associate Button */}
                        <SpotlightBorder>
                            <button
                                onClick={onAssociate}
                                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-300 group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors border border-blue-400/30">
                                    <Link2 className="w-6 h-6 text-blue-300" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-base font-semibold text-base-content">Link to Screenplay</h3>
                                    <p className="text-sm text-base-content/60">Associate with a character, location, or scene</p>
                                </div>
                            </button>
                        </SpotlightBorder>

                        {/* Download Button */}
                        <SpotlightBorder>
                            <button
                                onClick={onDownload}
                                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-300 group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors border border-green-400/30">
                                    <Download className="w-6 h-6 text-green-300" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-base font-semibold text-base-content">Download Image</h3>
                                    <p className="text-sm text-base-content/60">Save to your device</p>
                                </div>
                            </button>
                        </SpotlightBorder>

                        {/* Edit Again Button */}
                        <SpotlightBorder>
                            <button
                                onClick={onEditAgain}
                                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-300 group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors border border-purple-400/30">
                                    <RefreshCw className="w-6 h-6 text-purple-300" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-base font-semibold text-base-content">Edit Again with AI</h3>
                                    <p className="text-sm text-base-content/60">Make more adjustments with Nano Banana</p>
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
                    Close
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

