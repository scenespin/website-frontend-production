'use client';

import React from 'react';
import { X, Maximize2 } from 'lucide-react';

interface InlineChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExpand?: () => void;
    children: React.ReactNode;
    showExpandButton?: boolean;
}

export function InlineChatModal({
    isOpen,
    onClose,
    onExpand,
    children,
    showExpandButton = true
}: InlineChatModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 transition-all duration-300"
            onClick={onClose}
        >
            <div 
                className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with close and expand buttons */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    {showExpandButton && onExpand && (
                        <button
                            onClick={onExpand}
                            className="p-2 hover:bg-accent/20 rounded-lg transition-all duration-200 group bg-background/80 backdrop-blur-sm border border-border/50"
                            aria-label="Expand to full screen"
                            title="Expand to full screen"
                        >
                            <Maximize2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent/20 rounded-lg transition-all duration-200 group bg-background/80 backdrop-blur-sm border border-border/50"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative overflow-y-auto max-h-[85vh] custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

