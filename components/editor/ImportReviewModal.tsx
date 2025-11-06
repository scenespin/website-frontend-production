'use client';

import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { QuestionableItem } from '@/utils/fountainAutoImport';

interface ImportReviewModalProps {
    importedCharacters: string[];
    importedLocations: string[];
    importedScenes: number;
    questionableItems: QuestionableItem[];
    onClose: () => void;
}

/**
 * ImportReviewModal - Shows what was successfully imported and what needs fixing
 * Simple informational modal - no editing, just tells user what worked and what didn't
 */
export default function ImportReviewModal({
    importedCharacters,
    importedLocations,
    importedScenes,
    questionableItems,
    onClose
}: ImportReviewModalProps) {
    
    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div 
                className="fixed z-[9999] rounded-2xl border-2 border-primary shadow-2xl overflow-hidden flex flex-col bg-base-100"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90vw',
                    maxWidth: '800px',
                    maxHeight: '85vh'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-base-300 bg-primary flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary-content" />
                        <div>
                            <h2 className="text-xl font-bold text-primary-content">
                                Import Complete
                            </h2>
                            <p className="text-sm text-primary-content/80">
                                {importedCharacters.length + importedLocations.length + importedScenes} items imported
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors text-primary-content hover:bg-primary-content/20"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'auto', msOverflowStyle: 'auto' }}>
                    
                    {/* Successfully Imported Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            <h3 className="text-lg font-semibold text-base-content">
                                ✅ Successfully Imported
                            </h3>
                        </div>
                        
                        <div className="bg-success/10 border border-success/30 rounded-lg p-4 space-y-3">
                            {/* Characters */}
                            {importedCharacters.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-base-content mb-2">
                                        <span className="text-success font-bold">{importedCharacters.length}</span> Characters:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {importedCharacters.map((char, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-base-200 rounded text-xs font-mono text-base-content">
                                                {char}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Locations */}
                            {importedLocations.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-base-content mb-2">
                                        <span className="text-success font-bold">{importedLocations.length}</span> Locations:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {importedLocations.map((loc, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-base-200 rounded text-xs font-mono text-base-content">
                                                {loc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Scenes */}
                            {importedScenes > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-base-content">
                                        <span className="text-success font-bold">{importedScenes}</span> Scenes detected
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Questionable Items Section */}
                    {questionableItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-warning" />
                                <h3 className="text-lg font-semibold text-base-content">
                                    ⚠️ Needs Review ({questionableItems.length} items)
                                </h3>
                            </div>
                            
                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                                <p className="text-sm text-base-content/80 mb-4">
                                    These items don't match proper Fountain format. Fix them in the editor and they'll automatically appear in the sidebar.
                                </p>
                                
                                <div className="space-y-3">
                                    {questionableItems.map((item, idx) => (
                                        <div key={idx} className="bg-base-200 rounded-lg p-3 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-mono text-sm text-error font-medium">
                                                        Line {item.lineNumber}: "{item.text}"
                                                    </p>
                                                    <p className="text-xs text-base-content/70 mt-1">
                                                        {item.reason}
                                                    </p>
                                                    {item.suggestion && (
                                                        <p className="text-xs text-success mt-1">
                                                            Suggestion: <span className="font-mono">{item.suggestion}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                                    item.type === 'character' ? 'bg-purple-500/20 text-purple-300' :
                                                    item.type === 'location' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* No Issues */}
                    {questionableItems.length === 0 && (
                        <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                            <p className="text-sm text-base-content/80">
                                🎉 Perfect! Your screenplay is properly formatted according to Fountain spec.
                            </p>
                        </div>
                    )}
                    
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 border-t border-base-300 bg-base-200 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                    >
                        Got It, Continue Writing
                    </button>
                </div>
            </div>
        </>
    );
}
