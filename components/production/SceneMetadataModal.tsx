'use client';

/**
 * Scene Metadata Modal
 * 
 * Displays generation metadata for a scene or shot, including:
 * - Prompt used
 * - Provider/model
 * - Quality settings
 * - Timestamp
 * - References
 * - Workflow information
 */

import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SceneMetadataModalProps {
  metadata: any;
  onClose: () => void;
}

export function SceneMetadataModal({ metadata, onClose }: SceneMetadataModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!metadata) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] rounded-lg border border-[#3F3F46] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#3F3F46] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">Generation Metadata</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3F3F46] rounded transition-colors"
          >
            <X className="w-5 h-5 text-[#808080]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Timestamp */}
          {metadata.timestamp && (
            <div>
              <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide">
                Generated
              </label>
              <p className="text-sm text-[#FFFFFF] mt-1">
                {new Date(metadata.timestamp.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6')).toLocaleString()}
              </p>
            </div>
          )}

          {/* Prompt */}
          {metadata.prompt && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide">
                  Prompt
                </label>
                <button
                  onClick={() => copyToClipboard(metadata.prompt, 'prompt')}
                  className="p-1 hover:bg-[#3F3F46] rounded transition-colors"
                  title="Copy prompt"
                >
                  {copiedField === 'prompt' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#808080]" />
                  )}
                </button>
              </div>
              <p className="text-sm text-[#FFFFFF] mt-1 bg-[#0A0A0A] p-3 rounded border border-[#3F3F46]">
                {metadata.prompt}
              </p>
            </div>
          )}

          {/* Provider & Model */}
          <div className="grid grid-cols-2 gap-4">
            {metadata.provider && (
              <div>
                <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide">
                  Provider
                </label>
                <p className="text-sm text-[#FFFFFF] mt-1">{metadata.provider}</p>
              </div>
            )}
            {metadata.model && (
              <div>
                <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide">
                  Model
                </label>
                <p className="text-sm text-[#FFFFFF] mt-1">{metadata.model}</p>
              </div>
            )}
          </div>

          {/* Quality Settings */}
          {(metadata.qualityTier || metadata.aspectRatio || metadata.duration) && (
            <div>
              <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide mb-2 block">
                Quality Settings
              </label>
              <div className="grid grid-cols-3 gap-4">
                {metadata.qualityTier && (
                  <div>
                    <p className="text-xs text-[#808080]">Quality</p>
                    <p className="text-sm text-[#FFFFFF]">{metadata.qualityTier}</p>
                  </div>
                )}
                {metadata.aspectRatio && (
                  <div>
                    <p className="text-xs text-[#808080]">Aspect Ratio</p>
                    <p className="text-sm text-[#FFFFFF]">{metadata.aspectRatio}</p>
                  </div>
                )}
                {metadata.duration && (
                  <div>
                    <p className="text-xs text-[#808080]">Duration</p>
                    <p className="text-sm text-[#FFFFFF]">{metadata.duration}s</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scene/Shot Info */}
          {(metadata.sceneNumber || metadata.shotNumber) && (
            <div>
              <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide mb-2 block">
                Scene Information
              </label>
              <div className="grid grid-cols-2 gap-4">
                {metadata.sceneNumber && (
                  <div>
                    <p className="text-xs text-[#808080]">Scene Number</p>
                    <p className="text-sm text-[#FFFFFF]">{metadata.sceneNumber}</p>
                  </div>
                )}
                {metadata.shotNumber && (
                  <div>
                    <p className="text-xs text-[#808080]">Shot Number</p>
                    <p className="text-sm text-[#FFFFFF]">{metadata.shotNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Credits Used */}
          {metadata.creditsUsed !== undefined && (
            <div>
              <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide">
                Credits Used
              </label>
              <p className="text-sm text-[#FFFFFF] mt-1">{metadata.creditsUsed}</p>
            </div>
          )}

          {/* Workflow Info */}
          {metadata.workflowName && (
            <div>
              <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide">
                Workflow
              </label>
              <p className="text-sm text-[#FFFFFF] mt-1">{metadata.workflowName}</p>
            </div>
          )}

          {/* References */}
          {metadata.references && metadata.references.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-[#808080] uppercase tracking-wide mb-2 block">
                Reference Images
              </label>
              <div className="grid grid-cols-4 gap-2">
                {metadata.references.map((ref: string, index: number) => (
                  <div key={index} className="bg-[#0A0A0A] rounded border border-[#3F3F46] p-2">
                    <p className="text-xs text-[#808080] truncate">{ref}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full JSON (collapsible) */}
          <details className="mt-4">
            <summary className="text-xs font-semibold text-[#808080] uppercase tracking-wide cursor-pointer hover:text-[#B3B3B3]">
              Full Metadata (JSON)
            </summary>
            <div className="mt-2 bg-[#0A0A0A] p-3 rounded border border-[#3F3F46]">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2), 'json')}
                  className="p-1 hover:bg-[#3F3F46] rounded transition-colors"
                  title="Copy JSON"
                >
                  {copiedField === 'json' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#808080]" />
                  )}
                </button>
              </div>
              <pre className="text-xs text-[#808080] overflow-x-auto">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

