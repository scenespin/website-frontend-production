'use client';

import React from 'react';

interface EditorHeaderProps {
    currentLine: number;
    isDirty: boolean;
    wordCount: number;
    duration: string;
}

/**
 * EditorHeader - Top bar showing editor metadata
 * Theme-aware styling with DaisyUI classes
 */
export default function EditorHeader({
    currentLine,
    isDirty,
    wordCount,
    duration
}: EditorHeaderProps) {
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
            </div>
            <div className="flex items-center text-xs text-base-content/50 gap-3">
                <span>{wordCount} words</span>
                <span>•</span>
                <span title="Approximate duration (1 page ≈ 1 minute)">{duration}</span>
            </div>
        </div>
    );
}

