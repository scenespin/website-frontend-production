'use client';

import React from 'react';

/**
 * EditorFooter - Bottom bar showing keyboard shortcuts
 * Theme-aware styling with DaisyUI classes
 * Hidden on mobile since keyboard shortcuts don't work on touch devices
 */
export default function EditorFooter() {
    return (
        <div className="hidden md:block border-t border-base-300 bg-base-200 px-4 py-2 text-xs text-base-content/50">
            <div className="flex flex-wrap gap-4">
                <span>
                    <kbd className="kbd kbd-sm bg-base-300 text-base-content/70">
                        Enter
                    </kbd> New line
                </span>
                <span>
                    <kbd className="kbd kbd-sm bg-base-300 text-base-content/70">
                        Tab
                    </kbd> Character
                </span>
                <span>
                    <kbd className="kbd kbd-sm bg-base-300 text-base-content/70">
                        Shift+Tab
                    </kbd> Scene heading
                </span>
            </div>
        </div>
    );
}

