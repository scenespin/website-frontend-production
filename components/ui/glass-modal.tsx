'use client';

import React from 'react';
import { X } from 'lucide-react';
import { SpotlightBorder } from '@/components/ui/spotlight-border';

interface GlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
    showCloseButton?: boolean;
    variant?: 'default' | 'dark' | 'gradient';
}

export function GlassModal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'lg',
    showCloseButton = true,
    variant = 'default'
}: GlassModalProps) {
    if (!isOpen) return null;

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-full'
    };

    const variantStyles = {
        default: {
            backdrop: 'bg-background',
            container: 'bg-card',
            border: 'border-border',
            overlay: 'from-primary/5 via-transparent to-primary/5'
        },
        dark: {
            backdrop: 'bg-background',
            container: 'bg-card',
            border: 'border-border',
            overlay: 'from-white/5 via-transparent to-primary/5'
        },
        gradient: {
            backdrop: 'bg-background',
            container: 'bg-gradient-to-br from-card via-popover to-card',
            border: 'border-primary/30',
            overlay: 'from-primary/10 via-transparent to-primary/10'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center ${styles.backdrop} p-4 transition-all duration-300`}
            onClick={onClose}
        >

            <div 
                className={`relative ${styles.container} border ${styles.border} rounded-xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-hidden transition-all duration-300`}
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="relative px-6 py-4 border-b border-[#2a2f39] bg-[#1b1f27] flex items-center justify-between">
                        {title && (
                            <h2 className="text-xl font-semibold text-[#fafafa]">{title}</h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#2d3139] rounded-lg transition-all duration-200 group"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-[#8f96a3] group-hover:text-[#fafafa] transition-colors" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="relative overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

