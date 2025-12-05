'use client';

/**
 * Character 3D Export Modal
 * 
 * Modal for generating 3D models from characters with format selection.
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, Download, Clock, AlertCircle, CheckCircle, User, Loader } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

// CharacterProfile type from ProductionPageLayout
interface CharacterReference {
  id: string;
  imageUrl: string;
  s3Key?: string;
  label?: string;
}

interface CharacterProfile {
  id: string;
  name: string;
  type: 'lead' | 'supporting' | 'minor';
  description?: string;
  baseReference?: {
    imageUrl: string;
    s3Key?: string;
  };
  references?: CharacterReference[];
  poseReferences?: CharacterReference[];
}

interface Character3DExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterProfile;
  projectId?: string; // screenplayId for backend query
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

export default function Character3DExportModal({ isOpen, onClose, character, projectId, onSuccess }: Character3DExportModalProps) {
  const { getToken } = useAuth();
  const [selectedFormats, setSelectedFormats] = useState<ExportFormat[]>(['glb', 'obj']);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<Job3DStatus | null>(null);

  const credits = 500; // Character 3D export costs 500 credits
  const priceUSD = '$5.00';

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (jobId && jobStatus?.status === 'processing') {
      pollInterval = setInterval(async () => {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          const response = await fetch(`/api/3d/job/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setJobStatus(data.job);

            if (data.job.status === 'completed' || data.job.status === 'failed') {
              clearInterval(pollInterval);
              if (data.job.status === 'completed') {
                toast.success('3D model generation completed!');
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
  }, [jobId, jobStatus?.status, onSuccess, getToken]);

  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleGenerate = async () => {
    if (selectedFormats.length === 0) {
      toast.error('Please select at least one format');
      return;
    }

    setGenerating(true);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/3d/character/${character.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          outputFormats: selectedFormats,
          quality: 'standard',
          screenplayId: projectId, // Pass screenplayId for efficient query
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Cloud storage is now optional, so this error shouldn't occur
        // But handle gracefully if it does
        if (error.action === 'CONNECT_CLOUD_STORAGE') {
          toast.warning('Cloud storage recommended but not required. Files can be downloaded directly.', {
            duration: 5000
          });
          // Continue anyway - backend should allow it now
        }
        
        throw new Error(error.error || 'Failed to start 3D generation');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setJobStatus({
        jobId: data.jobId,
        status: 'processing',
        progress: 0,
      });
      
      toast.success('3D generation started!', {
        description: `This will take approximately ${Math.round(data.estimatedTime / 60)} minutes.`,
        duration: 5000
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to start 3D generation');
      setGenerating(false);
    }
  };

  const handleDownload = (url: string, format: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${format.toUpperCase()} file`);
  };

  const handleClose = () => {
    if (jobStatus?.status === 'processing') {
      // Don't allow closing during processing
      toast.info('Generation in progress. You can close this and check back later.');
      return;
    }
    setSelectedFormats(['glb', 'obj']);
    setGenerating(false);
    setJobId(null);
    setJobStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#3F3F46]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3F3F46] sticky top-0 bg-[#141414] z-10">
          <div>
            <h3 className="text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#DC143C]" />
              Generate 3D Model
            </h3>
            <p className="text-sm text-[#808080] mt-1">{character.name}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={jobStatus?.status === 'processing'}
            className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[#808080]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!jobId ? (
            // Format Selection
            <>
              {/* Character Info */}
              <div className="bg-[#1F1F1F] rounded-lg p-3 border border-[#3F3F46]">
                <div className="flex items-center gap-3">
                  {character.baseReference && (
                    <img
                      src={character.baseReference.imageUrl}
                      alt={character.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#FFFFFF]">{character.name}</h4>
                    <p className="text-sm text-[#808080] capitalize">
                      {character.type} Character
                    </p>
                    <p className="text-xs text-[#808080] mt-1">
                      {(() => {
                        const refCount = (character.references?.length || 0) + (character.poseReferences?.length || 0);
                        return refCount + (character.baseReference ? 1 : 0);
                      })()} reference{(() => {
                        const refCount = (character.references?.length || 0) + (character.poseReferences?.length || 0);
                        return refCount + (character.baseReference ? 1 : 0) !== 1 ? 's' : '';
                      })()} available
                    </p>
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                  Export Formats
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'glb' as ExportFormat, name: 'GLB', desc: 'Unity, Unreal, Three.js' },
                    { id: 'obj' as ExportFormat, name: 'OBJ', desc: 'Blender, Maya, 3ds Max' },
                    { id: 'usdz' as ExportFormat, name: 'USDZ', desc: 'Apple AR, iOS apps' },
                  ].map(format => (
                    <button
                      key={format.id}
                      onClick={() => toggleFormat(format.id)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        selectedFormats.includes(format.id)
                          ? 'border-[#DC143C] bg-[#DC143C]/10'
                          : 'border-[#3F3F46] bg-[#1F1F1F] hover:border-[#808080]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-[#FFFFFF]">{format.name}</div>
                          <div className="text-xs text-[#808080] mt-0.5">{format.desc}</div>
                        </div>
                        {selectedFormats.includes(format.id) && (
                          <CheckCircle className="w-4 h-4 text-[#DC143C]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#FFFFFF]">Cost:</span>
                  <span className="text-lg font-bold text-[#FFFFFF]">{credits} credits ({priceUSD})</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808080]">Time:</span>
                  <span className="text-[#FFFFFF]">20-40 min</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-orange-500 font-medium">Files expire in 7 days</p>
                  <p className="text-[#808080]">Download immediately or save to cloud storage.</p>
                </div>
              </div>

              {/* Cloud Storage Recommendation */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex gap-2">
                <User className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-blue-500 font-medium">Cloud Storage Recommended</p>
                  <p className="text-[#808080]">Connect Dropbox or Google Drive to auto-save files. Files can also be downloaded directly.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={handleClose} 
                  className="px-4 py-2 bg-[#1F1F1F] text-[#FFFFFF] border border-[#3F3F46] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                >
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
                <div className="text-center py-6">
                  <div className="w-12 h-12 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="text-lg font-bold text-[#FFFFFF] mb-2">Generating 3D Model...</h4>
                  <p className="text-sm text-[#808080] mb-4">Processing typically takes 20-40 minutes</p>
                  {jobStatus.progress > 0 && (
                    <div className="max-w-md mx-auto">
                      <div className="w-full bg-[#1F1F1F] rounded-full h-2 mb-2">
                        <div
                          className="bg-[#DC143C] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${jobStatus.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-[#808080]">{jobStatus.progress}% complete</p>
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#808080]">
                    <Clock className="w-4 h-4" />
                    Feel free to close this and come back later
                  </div>
                </div>
              )}

              {jobStatus?.status === 'completed' && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-bold text-[#FFFFFF] mb-2">3D Model Ready!</h4>
                  <p className="text-sm text-[#808080] mb-4">Your 3D model has been generated successfully</p>

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
                    <div className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-[#808080] max-w-md mx-auto">
                      ⚠️ Files expire in {jobStatus.daysRemaining} day{jobStatus.daysRemaining !== 1 ? 's' : ''}
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="mt-6 px-4 py-2 bg-[#1F1F1F] text-[#FFFFFF] border border-[#3F3F46] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {jobStatus?.status === 'failed' && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="text-lg font-bold text-[#FFFFFF] mb-2">Generation Failed</h4>
                  <p className="text-sm text-[#808080] mb-4">
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

