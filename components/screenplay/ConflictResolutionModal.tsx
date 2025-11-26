'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, Save, Trash2 } from 'lucide-react';

export interface ConflictDetails {
  currentVersion: number;
  yourVersion: number;
  lastEditedBy?: string;
  lastEditedAt?: string;
  fieldChanges?: string[];
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflictDetails: ConflictDetails;
  yourContent?: string;  // Current editor content (user's changes)
  theirContent?: string;  // Content from server (their changes)
  onResolve: (choice: 'keep-mine' | 'keep-theirs' | 'merge-manually') => void;
  onCancel: () => void;
  lastEditedByName?: string;  // User name who made the conflicting edit
}

export default function ConflictResolutionModal({
  isOpen,
  conflictDetails,
  yourContent,
  theirContent,
  onResolve,
  onCancel,
  lastEditedByName
}: ConflictResolutionModalProps) {
  const [showDiff, setShowDiff] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getFieldChangeSummary = () => {
    if (!conflictDetails.fieldChanges || conflictDetails.fieldChanges.length === 0) {
      return 'Various fields';
    }
    return conflictDetails.fieldChanges.join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-[#3F3F46] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3F3F46]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Conflict Detected</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conflict Info */}
          <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4">
            <p className="text-gray-300 mb-4">
              Another user has saved changes since you started editing. Your changes conflict with theirs.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Edited by:</span>
                <span className="text-white">{lastEditedByName || conflictDetails.lastEditedBy || 'Unknown user'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Edited at:</span>
                <span className="text-white">{formatDate(conflictDetails.lastEditedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fields changed:</span>
                <span className="text-white">{getFieldChangeSummary()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your version:</span>
                <span className="text-white">{conflictDetails.yourVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current version:</span>
                <span className="text-white">{conflictDetails.currentVersion}</span>
              </div>
            </div>
          </div>

          {/* Diff Toggle */}
          {(yourContent || theirContent) && (
            <div>
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="text-sm text-[#DC143C] hover:text-[#B91238] transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 transition-transform ${showDiff ? 'rotate-180' : ''}`} />
                {showDiff ? 'Hide' : 'Show'} Changes
              </button>
              
              {showDiff && (
                <div className="mt-4 space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-200">
                      💡 <strong>Tip:</strong> Compare the two versions below. If content appears identical, the conflict may be in metadata (title, author) or the versions differ but content is the same.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Your Version ({yourContent?.length || 0} chars)
                      </h3>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                        {yourContent || '(empty)'}
                      </pre>
                    </div>
                    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Their Version ({theirContent?.length || 0} chars)
                      </h3>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                        {theirContent || '(empty)'}
                      </pre>
                    </div>
                  </div>
                  {yourContent === theirContent && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-200">
                        ℹ️ <strong>Note:</strong> Content appears identical. The conflict may be due to version mismatch or metadata changes (title/author). You can safely choose "Keep My Changes" or "Keep Their Changes".
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Resolution Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Choose how to resolve:</h3>
            
            <button
              onClick={() => onResolve('keep-mine')}
              className="w-full bg-[#DC143C] hover:bg-[#B91238] text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Keep My Changes (Overwrite Theirs)
            </button>
            
            <button
              onClick={() => onResolve('keep-theirs')}
              className="w-full bg-[#3F3F46] hover:bg-[#52525B] text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Keep Their Changes (Discard Mine)
            </button>
            
            <button
              onClick={() => onResolve('merge-manually')}
              className="w-full bg-[#3F3F46] hover:bg-[#52525B] text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Merge Manually (Preserve Both Versions)
            </button>
          </div>

          {/* Warnings */}
          <div className="space-y-2">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-200">
                ⚠️ <strong>Warning:</strong> "Keep My Changes" will overwrite their changes. Make sure you want to discard their work.
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-200">
                ℹ️ <strong>Merge Manually:</strong> Your content will be preserved. The version will be updated to match the server. Use the diff view above to see what changed, then manually incorporate any changes you want to keep before saving.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#3F3F46]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

