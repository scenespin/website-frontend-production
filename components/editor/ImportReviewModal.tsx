'use client';

import React, { useState } from 'react';
import { X, Check, Edit, ArrowLeftRight, AlertCircle, CheckCircle } from 'lucide-react';
import { FormatIssue, getIssueSummary } from '@/utils/fountainValidator';

interface ImportReviewModalProps {
    originalContent: string;
    correctedContent: string;
    issues: FormatIssue[];
    onAccept: (content: string) => void;
    onReject: () => void;
    onClose: () => void;
}

/**
 * ImportReviewModal - Side-by-side comparison of original vs corrected screenplay
 * Theme-aware with semantic color-coding (red=original, green=corrected)
 */
export default function ImportReviewModal({
    originalContent,
    correctedContent,
    issues,
    onAccept,
    onReject,
    onClose
}: ImportReviewModalProps) {
    const [selectedTab, setSelectedTab] = useState<'comparison' | 'issues'>('comparison');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(correctedContent);
    
    const issueSummary = getIssueSummary(issues);
    const totalIssues = issues.length;
    
    const handleAccept = () => {
        onAccept(isEditing ? editedContent : correctedContent);
    };
    
    const getSeverityColor = (severity: FormatIssue['severity']) => {
        switch (severity) {
            case 'error': return '#dc2626';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return '#6b7280';
        }
    };
    
    const getSeverityIcon = (severity: FormatIssue['severity']) => {
        switch (severity) {
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '•';
        }
    };
    
    // Style for showing scrollbars
    const scrollbarStyle = {
        scrollbarWidth: 'auto' as const,
        msOverflowStyle: 'auto' as const
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
                className="fixed z-[9999] rounded-2xl border-2 border-primary shadow-2xl overflow-hidden flex flex-col bg-base-100"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90vw',
                    maxWidth: '1200px',
                    maxHeight: '85vh'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-base-300 bg-primary flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-primary-content" />
                        <div>
                            <h2 className="text-lg font-bold text-primary-content">
                                Import Review
                            </h2>
                            <p className="text-xs text-primary-content/80">
                                {totalIssues === 0 
                                    ? 'No formatting issues detected' 
                                    : `${totalIssues} formatting ${totalIssues === 1 ? 'issue' : 'issues'} found`
                                }
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
                
                {/* Tabs */}
                {totalIssues > 0 && (
                    <div className="flex border-b border-base-300 bg-base-200 flex-shrink-0">
                        <button
                            onClick={() => setSelectedTab('comparison')}
                            className={`px-6 py-3 font-medium transition-all relative ${
                                selectedTab === 'comparison' 
                                    ? 'text-primary border-b-2 border-primary' 
                                    : 'text-base-content/60 border-b-2 border-transparent'
                            }`}
                        >
                            <ArrowLeftRight className="w-4 h-4 inline mr-2" />
                            Side-by-Side
                        </button>
                        <button
                            onClick={() => setSelectedTab('issues')}
                            className={`px-6 py-3 font-medium transition-all relative ${
                                selectedTab === 'issues' 
                                    ? 'text-primary border-b-2 border-primary' 
                                    : 'text-base-content/60 border-b-2 border-transparent'
                            }`}
                        >
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            Issues ({totalIssues})
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-hidden" style={{ minHeight: '300px' }}>
                    {selectedTab === 'comparison' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
                            {/* Original Content */}
                            <div className="flex flex-col md:border-r border-base-300 h-full">
                                <div className="px-4 py-3 border-b border-red-900 bg-red-900 flex-shrink-0">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-red-200">
                                        📄 Original Content
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-base-300" style={scrollbarStyle}>
                                    <pre className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-base-content">
                                        {originalContent}
                                    </pre>
                                </div>
                            </div>

                            {/* Corrected Content */}
                            <div className="flex flex-col h-full">
                                <div className="px-4 py-3 border-b border-green-900 bg-green-900 flex items-center justify-between flex-shrink-0">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-green-200">
                                        ✨ Corrected Format {isEditing && '(Editing)'}
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
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-base-300" style={scrollbarStyle}>
                                    {isEditing ? (
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="textarea w-full h-full font-mono text-xs md:text-sm leading-relaxed resize-none bg-base-100 text-base-content"
                                            style={{ minHeight: '200px' }}
                                            spellCheck={false}
                                        />
                                    ) : (
                                        <pre className="font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-base-content">
                                            {editedContent}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Issues Tab */
                        <div className="h-full overflow-y-auto p-4 md:p-6 bg-base-300" style={scrollbarStyle}>
                            {/* Issue Summary */}
                            <div className="p-4 rounded-lg border border-base-300 bg-base-100 mb-4">
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-base-content">
                                    <CheckCircle className="w-4 h-4 text-success" />
                                    Issue Summary
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {Object.entries(issueSummary).map(([type, count]) => count > 0 && (
                                        <div key={type} className="text-center p-2 rounded bg-base-200">
                                            <div className="text-2xl font-bold text-primary">
                                                {count}
                                            </div>
                                            <div className="text-xs capitalize mt-1 text-base-content/60">
                                                {type.replace('_', ' ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Individual Issues */}
                            <div className="space-y-2">
                                {issues.map((issue, index) => (
                                    <div key={index} className="p-3 rounded-lg border border-base-300 bg-base-100">
                                        <div className="flex items-start gap-3">
                                            <span className="text-lg flex-shrink-0">
                                                {getSeverityIcon(issue.severity)}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="badge badge-sm">
                                                        Line {issue.lineNumber + 1}
                                                    </span>
                                                    <span 
                                                        className="text-xs capitalize px-2 py-0.5 rounded"
                                                        style={{ 
                                                            color: getSeverityColor(issue.severity),
                                                            backgroundColor: `${getSeverityColor(issue.severity)}15`
                                                        }}
                                                    >
                                                        {issue.severity}
                                                    </span>
                                                </div>
                                                <p className="text-sm mb-2 text-base-content">
                                                    {issue.description}
                                                </p>
                                                {issue.suggestedFix && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-2">
                                                        <div>
                                                            <div className="font-semibold mb-1 text-base-content/60">
                                                                Original:
                                                            </div>
                                                            <code className="block p-2 rounded font-mono bg-red-900/10 text-red-400 border border-red-900">
                                                                {issue.originalText}
                                                            </code>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold mb-1 text-base-content/60">
                                                                Fixed:
                                                            </div>
                                                            <code className="block p-2 rounded font-mono whitespace-pre bg-green-900/10 text-green-400 border border-green-900">
                                                                {issue.suggestedFix}
                                                            </code>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="px-4 md:px-6 py-4 border-t border-base-300 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0 bg-base-200">
                    <div className="flex items-center gap-2 text-center md:text-left">
                        <span className="text-xs md:text-sm text-base-content/60">
                            {totalIssues > 0 
                                ? 'Review corrections and import screenplay'
                                : 'Ready to import screenplay'
                            }
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={onReject}
                            className="btn btn-error flex-1 md:flex-none"
                        >
                            <X className="w-4 h-4" />
                            <span>Keep Original</span>
                        </button>
                        
                        <button
                            onClick={handleAccept}
                            className="btn btn-success flex-1 md:flex-none"
                        >
                            <Check className="w-4 h-4" />
                            <span>{isEditing && editedContent !== correctedContent ? 'Accept Edited & Import' : 'Accept & Import'}</span>
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden md:block px-6 py-2 border-t border-base-300 text-xs text-center bg-base-300 text-base-content/50 flex-shrink-0">
                    <kbd className="kbd kbd-sm">Esc</kbd> to close
                </div>
            </div>
        </>
    );
}

