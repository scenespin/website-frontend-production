'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ImportResults {
    characters: number;
    locations: number;
    scenes?: number;
}

interface ImportNotificationProps {
    results: ImportResults;
    onClose: () => void;
}

/**
 * ImportNotification - Success notification after screenplay import
 * Theme-aware styling with DaisyUI classes
 */
export default function ImportNotification({ results, onClose }: ImportNotificationProps) {
    return (
        <div className="toast toast-top toast-end z-50">
            <div className="alert alert-success shadow-lg max-w-xs">
                <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                        <span className="text-lg">✓</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold mb-1">
                            Script Imported
                        </h4>
                        <p className="text-xs opacity-90">
                            {results.characters > 0 && (
                                <span>{results.characters} character{results.characters !== 1 ? 's' : ''}</span>
                            )}
                            {results.characters > 0 && (results.locations > 0 || (results.scenes && results.scenes > 0)) && <span>, </span>}
                            {results.locations > 0 && (
                                <span>{results.locations} location{results.locations !== 1 ? 's' : ''}</span>
                            )}
                            {results.locations > 0 && results.scenes && results.scenes > 0 && <span>, and </span>}
                            {results.scenes && results.scenes > 0 && (
                                <span>{results.scenes} scene{results.scenes !== 1 ? 's' : ''}</span>
                            )}
                            {' '}automatically added.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

