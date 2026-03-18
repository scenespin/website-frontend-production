'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
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
    const [confirmName, setConfirmName] = useState('');

    useEffect(() => {
        setConfirmName('');
    }, [character?.id]);

    if (!character) return null;

    const isNameMatched = confirmName.trim() === character.name.trim();
    
    const handleConfirm = async () => {
        if (!isNameMatched) return;
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
                                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-300">
                                                This action cannot be undone
                                            </p>
                                            <p className="text-sm text-amber-100/90 mt-1">
                                                All references to this character will be removed from your screenplay structure and Fountain tags.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
                                <div className="flex items-start space-x-3">
                                    <AlertTriangle className="h-5 w-5 text-red-300 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-300">
                                            Deleting also removes linked media files
                                        </p>
                                        <p className="text-sm text-red-100/90 mt-1">
                                            Associated character images and production media will be removed from your media library and project storage. If you need to keep those files, keep this character and rename/update it instead.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-[#3F3F46] bg-[#111827] p-3">
                                <p className="text-sm font-semibold text-[#E5E7EB] mb-2">
                                    To confirm deletion, type the character name:
                                </p>
                                <p className="text-xs font-mono text-[#E5E7EB] bg-[#0A0A0A] px-2 py-1 rounded border border-[#3F3F46] mb-3">
                                    {character.name}
                                </p>
                                <input
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder="Type character name to confirm"
                                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-md text-[#E5E7EB] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && isNameMatched && !isDeleting) {
                                            void handleConfirm();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                        setConfirmName('');
                        onCancel();
                    }} disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting || !isNameMatched}
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
    const [confirmName, setConfirmName] = useState('');

    useEffect(() => {
        setConfirmName('');
    }, [location?.id]);

    if (!location) return null;

    const isNameMatched = confirmName.trim() === location.name.trim();
    
    const handleConfirm = async () => {
        if (!isNameMatched) return;
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
                                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-amber-300">
                                                This action cannot be undone
                                            </p>
                                            <p className="text-sm text-amber-100/90 mt-1">
                                                All references to this location will be cleared from your screenplay structure and Fountain tags.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
                                <div className="flex items-start space-x-3">
                                    <AlertTriangle className="h-5 w-5 text-red-300 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-300">
                                            Deleting also removes linked media files
                                        </p>
                                        <p className="text-sm text-red-100/90 mt-1">
                                            Associated location images and production media will be removed from your media library and project storage. If you need to keep those files, keep this location and rename/update it instead.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-[#3F3F46] bg-[#111827] p-3">
                                <p className="text-sm font-semibold text-[#E5E7EB] mb-2">
                                    To confirm deletion, type the location name:
                                </p>
                                <p className="text-xs font-mono text-[#E5E7EB] bg-[#0A0A0A] px-2 py-1 rounded border border-[#3F3F46] mb-3">
                                    {location.name}
                                </p>
                                <input
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder="Type location name to confirm"
                                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-md text-[#E5E7EB] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && isNameMatched && !isDeleting) {
                                            void handleConfirm();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                        setConfirmName('');
                        onCancel();
                    }} disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting || !isNameMatched}
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
