'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { EditorProvider } from '@/contexts/EditorContext';
import { ScreenplayProvider } from '@/contexts/ScreenplayContext';
import { DrawerProvider } from '@/contexts/DrawerContext';
import EditorWorkspace from '@/components/editor/EditorWorkspace';

/**
 * Write Page - Main screenplay writing interface
 * Wraps the editor in all necessary providers
 * EditorWorkspace handles the full layout, responsiveness, and features
 */
export default function WritePage() {
    return (
        <EditorProvider>
            <ScreenplayProvider>
                <DrawerProvider>
                    <EditorWorkspace />
                </DrawerProvider>
            </ScreenplayProvider>
        </EditorProvider>
    );
}

