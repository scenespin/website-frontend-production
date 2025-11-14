'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Character, Location } from '@/types/screenplay';

// ============================================================================
// Delete Character Dialog
// ============================================================================

interface DeleteCharacterDialogProps {
    character: Character | null;
    dependencyReport: string;
    sceneCount: number;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

export function DeleteCharacterDialog({
    character,
    dependencyReport,
    sceneCount,
    onConfirm,
    onCancel
}: DeleteCharacterDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    
    if (!character) return null;
    
    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <AlertDialog open={!!character} onOpenChange={(open) => {
            // 🔥 FIX: Properly handle mobile closing - ensure state is cleared
            if (!open) {
                onCancel();
            }
        }}>
            <AlertDialogContent 
                className="max-w-2xl bg-[#1C1C1E] border-[#3F3F46]"
            >
                <AlertDialogHeader>
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <AlertDialogTitle className="text-[#E5E7EB]">Delete Character: {character.name}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <div className="prose prose-sm max-w-none text-base-content/70 dark:text-base-content/70">
                                <div dangerouslySetInnerHTML={{ __html: dependencyReport.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                            </div>
                            
                            {sceneCount > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                                This action cannot be undone
                                            </p>
                                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                                                All references to this character will be removed from your screenplay structure and Fountain tags.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Character
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ============================================================================
// Delete Location Dialog
// ============================================================================

interface DeleteLocationDialogProps {
    location: Location | null;
    dependencyReport: string;
    sceneCount: number;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

export function DeleteLocationDialog({
    location,
    dependencyReport,
    sceneCount,
    onConfirm,
    onCancel
}: DeleteLocationDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    
    if (!location) return null;
    
    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <AlertDialog open={!!location} onOpenChange={(open) => {
            // 🔥 FIX: Properly handle mobile closing - ensure state is cleared
            if (!open) {
                onCancel();
            }
        }}>
            <AlertDialogContent 
                className="max-w-2xl bg-[#1C1C1E] border-[#3F3F46]"
            >
                <AlertDialogHeader>
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <AlertDialogTitle className="text-[#E5E7EB]">Delete Location: {location.name}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <div className="prose prose-sm max-w-none text-base-content/70 dark:text-base-content/70">
                                <div dangerouslySetInnerHTML={{ __html: dependencyReport.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                            </div>
                            
                            {sceneCount > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                                This action cannot be undone
                                            </p>
                                            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                                                All references to this location will be cleared from your screenplay structure and Fountain tags.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Location
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
