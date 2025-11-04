'use client';

/**
 * Asset 3D Export Modal
 * 
 * Modal for generating 3D models from assets with format selection.
 * Part of Feature 0099: Asset Bank
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, Download, Clock, AlertCircle, CheckCircle, Package, Loader } from 'lucide-react';
import { Asset, ASSET_CATEGORY_METADATA } from '@/types/asset';

interface Asset3DExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onSuccess: () => void;
}

type ExportFormat = 'glb' | 'obj' | 'usdz';

interface Job3DStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  presignedUrls?: {
    glb?: string;
    obj?: string;
    usdz?: string;
  };
  error?: string;
  daysRemaining?: number;
}

export default function Asset3DExportModal({ isOpen, onClose, asset, onSuccess }: Asset3DExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['glb', 'obj']);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<Job3DStatus | null>(null);

  const categoryMeta = ASSET_CATEGORY_METADATA[asset.category];
  const credits = categoryMeta.credits;
  const priceUSD = categoryMeta.priceUSD;

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (jobId && jobStatus?.status === 'processing') {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/3d/job/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setJobStatus(data.job);

            if (data.job.status === 'completed' || data.job.status === 'failed') {
              clearInterval(pollInterval);
              if (data.job.status === 'completed') {
                onSuccess();
              }
            }
          }
        } catch (error) {
          console.error('Failed to poll job status:', error);
        }
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [jobId, jobStatus?.status, onSuccess]);

  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleGenerate = async () => {
    if (selectedFormats.length === 0) {
      alert('Please select at least one format');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch(`/api/3d/asset/${asset.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          outputFormats: selectedFormats,
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start 3D generation');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setJobStatus({
        jobId: data.jobId,
        status: 'processing',
        progress: 0,
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(error.message || 'Failed to start 3D generation');
      setGenerating(false);
    }
  };

  const handleDownload = (url: string, format: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${asset.name.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setSelectedFormats(['glb', 'obj']);
    setGenerating(false);
    setJobId(null);
    setJobStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h3 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#DC143C]" />
              Generate 3D Model
            </h3>
            <p className="text-sm text-slate-400 mt-1">{asset.name}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={jobStatus?.status === 'processing'}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!jobId ? (
            // Format Selection
            <>
              {/* Asset Info */}
              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center gap-4">
                  {asset.images[0] && (
                    <img
                      src={asset.images[0].url}
                      alt={asset.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-200">{asset.name}</h4>
                    <p className="text-sm text-slate-400">{categoryMeta.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{asset.images.length} images uploaded</p>
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Export Formats (select all that you need)
                </label>
                <div className="space-y-3">
                  {[
                    { id: 'glb' as ExportFormat, name: 'GLB', desc: 'Unity, Unreal, Three.js (Recommended)' },
                    { id: 'obj' as ExportFormat, name: 'OBJ', desc: 'Blender, Maya, 3ds Max' },
                    { id: 'usdz' as ExportFormat, name: 'USDZ', desc: 'Apple AR, iOS apps' },
                  ].map(format => (
                    <button
                      key={format.id}
                      onClick={() => toggleFormat(format.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedFormats.includes(format.id)
                          ? 'border-[#DC143C] bg-[#DC143C]/10'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-200">{format.name}</div>
                          <div className="text-sm text-slate-400 mt-1">{format.desc}</div>
                        </div>
                        {selectedFormats.includes(format.id) && (
                          <CheckCircle className="w-5 h-5 text-[#DC143C]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Cost:</span>
                  <span className="text-xl font-bold text-slate-200">{credits} credits ({priceUSD})</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Estimated Time:</span>
                  <span className="text-slate-300">20-40 minutes</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-500 font-medium mb-1">Files expire in 7 days</p>
                  <p className="text-slate-400">
                    3D models are stored temporarily. Download immediately or save to your cloud storage.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleClose} className="px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={selectedFormats.length === 0 || generating}
                  className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {generating ? 'Starting...' : `Generate 3D Model (${priceUSD})`}
                </button>
              </div>
            </>
          ) : (
            // Job Status
            <>
              {jobStatus?.status === 'processing' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h4 className="text-xl font-bold text-slate-200 mb-2">Generating 3D Model...</h4>
                  <p className="text-slate-400 mb-4">Processing typically takes 20-40 minutes</p>
                  {jobStatus.progress > 0 && (
                    <div className="max-w-md mx-auto">
                      <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                        <div
                          className="bg-[#DC143C] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${jobStatus.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-500">{jobStatus.progress}% complete</p>
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    Feel free to close this and come back later
                  </div>
                </div>
              )}

              {jobStatus?.status === 'completed' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-200 mb-2">3D Model Ready!</h4>
                  <p className="text-slate-400 mb-6">Your 3D model has been generated successfully</p>

                  {/* Download Links */}
                  <div className="space-y-3 max-w-md mx-auto">
                    {selectedFormats.map(format => {
                      const url = jobStatus.presignedUrls?.[format];
                      if (!url) return null;

                      return (
                        <button
                          key={format}
                          onClick={() => handleDownload(url, format)}
                          className="w-full px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download {format.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  {jobStatus.daysRemaining !== undefined && (
                    <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-slate-400 max-w-md mx-auto">
                      ⚠️ Files expire in {jobStatus.daysRemaining} day{jobStatus.daysRemaining !== 1 ? 's' : ''}
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="mt-6 px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {jobStatus?.status === 'failed' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-200 mb-2">Generation Failed</h4>
                  <p className="text-slate-400 mb-6">
                    {jobStatus.error || 'Something went wrong. Please try again.'}
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

