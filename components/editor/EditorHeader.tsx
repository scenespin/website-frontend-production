'use client';

import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';

interface EditorHeaderProps {
    currentLine: number;
    isDirty: boolean;
    wordCount: number;
    duration: string;
    onToggleSceneNav?: () => void; // Optional: for mobile scene navigator button
}

/**
 * EditorHeader - Top bar showing editor metadata
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorHeader({
    currentLine,
    isDirty,
    wordCount,
    duration,
    onToggleSceneNav
}: EditorHeaderProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="border-b border-[#3F3F46] bg-[#0A0A0A] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase text-base-content/60">
                    Screenplay
                </span>
                <span className="text-xs text-base-content/50">
                    Line {currentLine}
                </span>
                {isDirty && (
                    <span className="text-xs font-medium text-warning">
                        • Unsaved changes
                    </span>
                )}
                {/* Scene Navigator Button - Mobile Only */}
                {isMobile && onToggleSceneNav && (
                    <button
                        onClick={onToggleSceneNav}
                        className="btn btn-sm btn-ghost gap-2 md:hidden"
                        title="Toggle Scene Navigator"
                        aria-label="Toggle Scene Navigator"
                    >
                        <List className="w-4 h-4" />
                        <span className="text-xs">Scenes</span>
                    </button>
                )}
            </div>
            <div className="flex items-center text-xs text-base-content/50 gap-3">
                <span>{wordCount} words</span>
                <span>•</span>
                <span title="Approximate duration (1 page ≈ 1 minute)">{duration}</span>
            </div>
        </div>
    );
}

