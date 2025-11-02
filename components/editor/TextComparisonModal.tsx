'use client';

import React, { useState } from 'react';
import { X, Check, Edit, ArrowLeftRight } from 'lucide-react';

interface TextComparisonModalProps {
    originalText: string;
    rewrittenText: string;
    onKeepOriginal: () => void;
    onUseRewrite: (textToUse?: string) => void;
    onClose: () => void;
}

/**
 * TextComparisonModal - Side-by-side comparison for AI rewrites
 * Theme-aware with semantic color-coding (red=original, green=rewrite)
 */
export default function TextComparisonModal({
    originalText,
    rewrittenText,
    onKeepOriginal,
    onUseRewrite,
    onClose
}: TextComparisonModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(rewrittenText);
    
    const handleUseRewrite = () => {
        if (editedText !== rewrittenText) {
            onUseRewrite(editedText);
        } else {
            onUseRewrite();
        }
    };
    
    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div 
                className="fixed z-[9999] rounded-xl md:rounded-2xl border-2 border-primary shadow-2xl overflow-hidden flex flex-col bg-base-100"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '95vw',
                    maxWidth: '1400px',
                    maxHeight: '95vh',
                    height: 'auto',
                    minHeight: '60vh'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 md:px-6 py-3 md:py-4 border-b border-base-300 bg-primary flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5 text-primary-content" />
                        <h2 className="text-base md:text-lg font-bold text-primary-content">
                            Compare & Choose
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 md:p-2 rounded-lg transition-colors text-primary-content hover:bg-primary-content/20"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Comparison Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
                    {/* Original Text */}
                    <div className="flex flex-col md:border-r border-base-300 h-full">
                        <div className="px-4 py-3 border-b border-red-900 bg-red-900 flex-shrink-0">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-red-200">
                                📄 Original Text
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-base-300" style={{ minHeight: 0 }}>
                            <pre className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words text-base-content">
                                {originalText}
                            </pre>
                        </div>
                    </div>

                    {/* Rewritten Text */}
                    <div className="flex flex-col h-full">
                        <div className="px-4 py-3 border-b border-green-900 bg-green-900 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-green-200">
                                ✨ AI Rewrite {isEditing && '(Editing)'}
                            </h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    isEditing ? 'bg-success text-success-content' : 'bg-white/10 text-base-content'
                                }`}
                            >
                                <Edit className="w-3 h-3" />
                                {isEditing ? 'Done' : 'Edit'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-base-300" style={{ minHeight: 0 }}>
                            {isEditing ? (
                                <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="textarea w-full h-full font-mono text-xs md:text-sm leading-relaxed resize-none bg-base-100 text-base-content"
                                    style={{ minHeight: '100%' }}
                                    spellCheck={false}
                                />
                            ) : (
                                <pre className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words text-base-content">
                                    {editedText}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 md:px-6 py-4 border-t border-base-300 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0 bg-base-200">
                    <div className="flex items-center gap-2 text-center md:text-left">
                        <span className="text-xs md:text-sm text-base-content/60">
                            Choose which version to keep in your script
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={onKeepOriginal}
                            className="btn btn-error flex-1 md:flex-none"
                        >
                            <X className="w-4 h-4" />
                            <span>Keep Original</span>
                        </button>
                        
                        <button
                            onClick={handleUseRewrite}
                            className="btn btn-success flex-1 md:flex-none"
                        >
                            <Check className="w-4 h-4" />
                            <span>{editedText !== rewrittenText ? 'Use Edited Version' : 'Use Rewrite'}</span>
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden md:block px-6 py-2 border-t border-base-300 text-xs text-center bg-base-300 text-base-content/50">
                    <kbd className="kbd kbd-sm">Esc</kbd> to close
                </div>
            </div>
        </>
    );
}

