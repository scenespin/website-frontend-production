/**
 * Export3DModal.js
 * 
 * Modal for exporting characters/locations to 3D models.
 * Includes cloud storage integration, 7-day expiration warnings, and progress tracking.
 */

import { useState, useEffect } from 'react';
import { X, Download, Cloud, AlertTriangle, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function Export3DModal({ 
  isOpen, 
  onClose, 
  characterId, 
  locationId, 
  type, // 'character' or 'location'
  entityName 
}) {
  // State
  const [formats, setFormats] = useState(['glb']); // Default to GLB
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState(null);
  const [cloudStorageConnected, setCloudStorageConnected] = useState(false);
  const [savingToCloud, setSavingToCloud] = useState(false);

  // Check cloud storage connection on mount
  useEffect(() => {
    if (isOpen) {
      checkCloudStorage();
    }
  }, [isOpen]);

  // Poll job status when generation starts
  useEffect(() => {
    if (jobId && jobStatus?.status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const response = await api.luma3D.getJobStatus(jobId);
          setJobStatus(response.job);
          
          if (response.job.status === 'completed' || response.job.status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error polling job status:', err);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [jobId, jobStatus?.status]);

  // Check if user has cloud storage connected
  const checkCloudStorage = async () => {
    try {
      const response = await api.cloudStorage.status();
      setCloudStorageConnected(response.hasActiveConnection);
    } catch (err) {
      console.error('Error checking cloud storage:', err);
      setCloudStorageConnected(false);
    }
  };

  // Handle format toggle
  const toggleFormat = (format) => {
    if (formats.includes(format)) {
      if (formats.length > 1) { // Keep at least one format
        setFormats(formats.filter(f => f !== format));
      }
    } else {
      setFormats([...formats, format]);
    }
  };

  // Start 3D generation
  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const entityId = characterId || locationId;
      const endpoint = type === 'character' 
        ? `/3d/character/${entityId}`
        : `/3d/location/${entityId}`;

      const response = await api.post(endpoint, {
        outputFormats: formats,
        quality: 'standard'
      });

      setJobId(response.jobId);
      setJobStatus({
        status: response.status,
        progress: 0,
        estimatedTime: response.estimatedTime,
        expiresAt: response.expiresAt,
      });
    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.error || 'Failed to start 3D generation');
      
      // Show cloud storage prompt if needed
      if (err.response?.data?.action === 'CONNECT_CLOUD_STORAGE') {
        setCloudStorageConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save to cloud storage
  const handleSaveToCloud = async (provider, format) => {
    setSavingToCloud(true);

    try {
      await api.luma3D.saveToCloud(jobId, {
        format,
        provider,
        fileName: `${entityName}-3d.${format}`
      });

      // Update job status
      const response = await api.luma3D.getJobStatus(jobId);
      setJobStatus(response.job);

      alert(`${format.toUpperCase()} saved to ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}!`);
    } catch (err) {
      console.error('Save to cloud error:', err);
      alert(`Failed to save to ${provider}: ${err.response?.data?.error || 'Unknown error'}`);
    } finally {
      setSavingToCloud(false);
    }
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!jobStatus?.expiresAt) return null;
    const now = new Date();
    const expires = new Date(jobStatus.expiresAt);
    const days = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (!isOpen) return null;

  const creditsRequired = type === 'character' ? 100 : 150;
  const daysRemaining = getDaysRemaining();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-2xl font-bold">Export to 3D</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cloud Storage Check */}
          {!cloudStorageConnected && !jobId && (
            <div className="alert alert-warning">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <h3 className="font-bold">Cloud Storage Required</h3>
                <p className="text-sm">
                  Please connect Dropbox or Google Drive before exporting 3D models.
                  Generated files are stored temporarily for 7 days.
                </p>
                <div className="mt-2">
                  <button className="btn btn-sm btn-primary mr-2">Connect Dropbox</button>
                  <button className="btn btn-sm btn-primary">Connect Google Drive</button>
                </div>
              </div>
            </div>
          )}

          {/* Format Selection */}
          {!jobId && (
            <>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Output Formats</span>
                </label>
                <div className="flex gap-3">
                  {['glb', 'obj', 'usdz'].map(format => (
                    <label key={format} className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={formats.includes(format)}
                        onChange={() => toggleFormat(format)}
                      />
                      <span className="ml-2 uppercase">{format}</span>
                      <span className="text-xs text-base-content/60 ml-2">
                        {format === 'glb' && '(Unity, Unreal, Web)'}
                        {format === 'obj' && '(Blender, Maya)'}
                        {format === 'usdz' && '(AR, iOS)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-base-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Credit Cost:</span>
                  <span className="font-bold">{creditsRequired} credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Time:</span>
                  <span className="font-bold">~30 minutes</span>
                </div>
                <div className="flex justify-between text-warning">
                  <span>Storage Duration:</span>
                  <span className="font-bold">7 days (auto-delete)</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="alert alert-error">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={loading || !cloudStorageConnected}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Starting Generation...
                  </>
                ) : (
                  <>
                    Export to 3D ({creditsRequired} credits)
                  </>
                )}
              </button>
            </>
          )}

          {/* Job Status */}
          {jobId && jobStatus && (
            <div className="space-y-4">
              {/* Progress */}
              {jobStatus.status === 'processing' && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Generating 3D Model...</span>
                    <span>{jobStatus.progress}%</span>
                  </div>
                  <progress 
                    className="progress progress-primary w-full" 
                    value={jobStatus.progress} 
                    max="100"
                  />
                  <p className="text-sm text-base-content/60 mt-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    This will take approximately {Math.round((jobStatus.estimatedTime || 1800) / 60)} minutes
                  </p>
                </div>
              )}

              {/* Completed */}
              {jobStatus.status === 'completed' && (
                <>
                  <div className="alert alert-success">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>3D model generated successfully!</span>
                  </div>

                  {/* Expiration Warning */}
                  <div className="alert alert-warning">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <h3 className="font-bold">⚠️ Files Expire in {daysRemaining} Days!</h3>
                      <p className="text-sm">Save to Dropbox or Google Drive now for permanent storage.</p>
                    </div>
                  </div>

                  {/* Download/Save Buttons */}
                  <div className="space-y-3">
                    {formats.map(format => {
                      const isSaved = jobStatus.cloudStorageSaved?.[format];
                      const url = jobStatus.presignedUrls?.[format];

                      return (
                        <div key={format} className="bg-base-200 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold uppercase">{format}</p>
                              {isSaved && (
                                <p className="text-sm text-success">✓ Saved to cloud storage</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {/* Download */}
                              <a 
                                href={url} 
                                download 
                                className="btn btn-sm btn-outline"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </a>

                              {/* Save to Dropbox */}
                              <button
                                onClick={() => handleSaveToCloud('dropbox', format)}
                                disabled={savingToCloud || isSaved}
                                className="btn btn-sm btn-primary"
                              >
                                <Cloud className="w-4 h-4 mr-1" />
                                {isSaved ? 'Saved' : 'Dropbox'}
                              </button>

                              {/* Save to Google Drive */}
                              <button
                                onClick={() => handleSaveToCloud('google-drive', format)}
                                disabled={savingToCloud || isSaved}
                                className="btn btn-sm btn-primary"
                              >
                                <Cloud className="w-4 h-4 mr-1" />
                                {isSaved ? 'Saved' : 'Drive'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Failed */}
              {jobStatus.status === 'failed' && (
                <div className="alert alert-error">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold">Generation Failed</h3>
                    <p className="text-sm">{jobStatus.error || 'Unknown error'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-300 bg-base-200 text-sm text-base-content/60">
          <p>💡 <strong>Tip:</strong> 3D models can be used in Unity, Unreal Engine, Blender, and AR apps.</p>
          <p className="mt-1">⚠️ Remember: Files auto-delete after 7 days. Save to cloud storage for permanent access.</p>
        </div>
      </div>
    </div>
  );
}

