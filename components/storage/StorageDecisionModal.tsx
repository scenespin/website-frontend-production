/**
 * Storage Decision Modal
 * 
 * Modal shown after generating assets (images, videos, compositions) to let users
 * choose where to save the file.
 * 
 * Options: Google Drive, Dropbox, Download to device, or Keep temporary (7 days)
 * 
 * Phase 1: Cinema Theme Redesign - Compact layout, dark theme, no scrolling on large screens
 */

'use client';

import { useState } from 'react';
import { Cloud, Download, Clock, Check, Loader2, X, Image, Video, Film } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useStorageConnections } from '@/hooks/useStorageConnections';
import { motion, AnimatePresence } from 'framer-motion';

type AssetType = 'image' | 'video' | 'composition' | 'audio';
type StorageLocation = 'google-drive' | 'dropbox' | 'download' | 'temp';

interface StorageDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: AssetType;
  assetName: string;
  s3TempUrl: string;
  s3Key: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

export function StorageDecisionModal({
  isOpen,
  onClose,
  assetType,
  assetName,
  s3TempUrl,
  s3Key,
  fileSize,
  metadata
}: StorageDecisionModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<StorageLocation | null>(null);
  
  const { getToken } = useAuth();
  const { googleDrive, dropbox, isLoading: connectionsLoading } = useStorageConnections();

  if (!isOpen) return null;

  const handleSaveToCloud = async (storage: 'google-drive' | 'dropbox') => {
    setIsSaving(true);
    setError(null);
    setSelectedStorage(storage);

    try {
      // Get auth token from Clerk with wryda-backend template
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Not authenticated. Please sign in.');
      }

      // Generate filename with sanitization
      const timestamp = Date.now();
      const sanitizedName = assetName.replace(/[^a-zA-Z0-9-_]/g, '-');
      const ext = getFileExtension(assetType);
      const filename = `${sanitizedName}-${timestamp}.${ext}`;

      const response = await fetch('/api/storage/save-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          s3_key: s3Key,
          storage_location: storage,
          filename,
          asset_metadata: {
            type: assetType,
            name: assetName,
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save asset');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error saving asset:', err);
      setError(err.message || 'Failed to save asset to cloud storage');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsSaving(true);
    setError(null);
    setSelectedStorage('download');

    try {
      // Get auth token from Clerk with wryda-backend template
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Not authenticated. Please sign in.');
      }

      const response = await fetch('/api/storage/save-asset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          s3_key: s3Key,
          storage_location: 'download',
          filename: assetName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to get download URL');
      }

      const data = await response.json();
      
      // Trigger browser download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = assetName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        onClose();
      }, 500);

    } catch (err: any) {
      console.error('Error downloading asset:', err);
      setError(err.message || 'Failed to download asset');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeepTemp = () => {
    // Just close modal - file stays in S3 for 7 days
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getFileExtension = (type: AssetType): string => {
    switch (type) {
      case 'image': return 'png';
      case 'video': return 'mp4';
      case 'composition': return 'mp4';
      default: return 'file';
    }
  };

  const getAssetIcon = () => {
    switch (assetType) {
      case 'image':
        return <Image className="w-6 h-6 text-[#4285F4]" />;
      case 'video':
        return <Video className="w-6 h-6 text-[#9C27B0]" />;
      case 'composition':
        return <Film className="w-6 h-6 text-[#E91E63]" />;
      default:
        return <Image className="w-6 h-6 text-[#4285F4]" />;
    }
  };

  const getAssetTypeLabel = () => {
    switch (assetType) {
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'composition': return 'Composition';
      case 'audio': return 'Audio';
      default: return 'Asset';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <div 
              className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F1F1F] rounded-lg border border-[#3F3F46]">
                    {getAssetIcon()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#FFFFFF]">Save Your {getAssetTypeLabel()}</h2>
                    <p className="text-sm text-[#808080] mt-0.5">
                      Choose where to store this file
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Asset Preview */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#FFFFFF] truncate">
                          {assetName}
                        </h3>
                        <p className="text-sm text-[#808080]">
                          {getAssetTypeLabel()} • {formatFileSize(fileSize)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Preview thumbnail */}
                    {(assetType === 'image' || assetType === 'video' || assetType === 'composition') && s3TempUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-[#3F3F46]">
                        {assetType === 'image' ? (
                          <img 
                            src={s3TempUrl} 
                            alt={assetName}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <video 
                            src={s3TempUrl}
                            className="w-full h-32 object-cover"
                            controls={false}
                            muted
                            playsInline
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Success Message */}
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-4 mb-6 flex items-center gap-3"
                    >
                      <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                      <div>
                        <p className="font-medium text-[#10B981]">Saved Successfully!</p>
                        <p className="text-sm text-[#808080]">
                          Your {assetType} has been saved to {selectedStorage === 'google-drive' ? 'Google Drive' : 'Dropbox'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-4 mb-6"
                    >
                      <p className="text-sm text-[#EF4444]">{error}</p>
                    </motion.div>
                  )}

                  {/* Storage Options */}
                  {!saveSuccess && (
                    <div>
                      <p className="text-sm text-[#808080] mb-4">
                        Where would you like to save this {assetType}?
                      </p>

                      {/* Grid Layout: 2 columns on desktop, 1 on mobile */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Google Drive */}
                        <button
                          onClick={() => handleSaveToCloud('google-drive')}
                          disabled={isSaving || connectionsLoading || !googleDrive}
                          className={`relative flex flex-col items-start gap-3 p-4 border rounded-lg transition-all group ${
                            googleDrive
                              ? 'border-[#3F3F46] hover:border-[#4285F4] hover:bg-[#1F1F1F] bg-[#141414]'
                              : 'border-[#3F3F46] bg-[#141414] cursor-not-allowed opacity-50'
                          } ${isSaving && selectedStorage === 'google-drive' ? 'border-[#4285F4]' : ''}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`p-2 rounded-lg ${
                              googleDrive ? 'bg-[#4285F4]/10' : 'bg-[#3F3F46]'
                            }`}>
                              <Cloud className={`w-5 h-5 ${
                                googleDrive ? 'text-[#4285F4]' : 'text-[#808080]'
                              }`} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className={`font-medium truncate ${
                                googleDrive ? 'text-[#FFFFFF]' : 'text-[#808080]'
                              }`}>
                                Google Drive
                              </div>
                              <div className="text-xs text-[#808080] mt-0.5">
                                {googleDrive ? 'Permanent storage' : 'Not connected'}
                              </div>
                            </div>
                            {isSaving && selectedStorage === 'google-drive' && (
                              <Loader2 className="w-4 h-4 animate-spin text-[#4285F4]" />
                            )}
                          </div>
                        </button>

                        {/* Dropbox */}
                        <button
                          onClick={() => handleSaveToCloud('dropbox')}
                          disabled={isSaving || connectionsLoading || !dropbox}
                          className={`relative flex flex-col items-start gap-3 p-4 border rounded-lg transition-all group ${
                            dropbox
                              ? 'border-[#3F3F46] hover:border-[#0061FF] hover:bg-[#1F1F1F] bg-[#141414]'
                              : 'border-[#3F3F46] bg-[#141414] cursor-not-allowed opacity-50'
                          } ${isSaving && selectedStorage === 'dropbox' ? 'border-[#0061FF]' : ''}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`p-2 rounded-lg ${
                              dropbox ? 'bg-[#0061FF]/10' : 'bg-[#3F3F46]'
                            }`}>
                              <Cloud className={`w-5 h-5 ${
                                dropbox ? 'text-[#0061FF]' : 'text-[#808080]'
                              }`} />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className={`font-medium truncate ${
                                dropbox ? 'text-[#FFFFFF]' : 'text-[#808080]'
                              }`}>
                                Dropbox
                              </div>
                              <div className="text-xs text-[#808080] mt-0.5">
                                {dropbox ? 'Permanent storage' : 'Not connected'}
                              </div>
                            </div>
                            {isSaving && selectedStorage === 'dropbox' && (
                              <Loader2 className="w-4 h-4 animate-spin text-[#0061FF]" />
                            )}
                          </div>
                        </button>

                        {/* Download */}
                        <button
                          onClick={handleDownload}
                          disabled={isSaving}
                          className={`relative flex flex-col items-start gap-3 p-4 border rounded-lg transition-all group ${
                            'border-[#3F3F46] hover:border-[#10B981] hover:bg-[#1F1F1F] bg-[#141414]'
                          } ${isSaving && selectedStorage === 'download' ? 'border-[#10B981]' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-lg bg-[#10B981]/10">
                              <Download className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium text-[#FFFFFF] truncate">
                                Download
                              </div>
                              <div className="text-xs text-[#808080] mt-0.5">
                                Save to device
                              </div>
                            </div>
                            {isSaving && selectedStorage === 'download' && (
                              <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                            )}
                          </div>
                        </button>

                        {/* Keep Temporary */}
                        <button
                          onClick={handleKeepTemp}
                          disabled={isSaving}
                          className="relative flex flex-col items-start gap-3 p-4 border border-[#3F3F46] rounded-lg transition-all group hover:border-[#F59E0B] hover:bg-[#1F1F1F] bg-[#141414] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-lg bg-[#F59E0B]/10">
                              <Clock className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium text-[#FFFFFF] truncate">
                                Keep Temporary
                              </div>
                              <div className="text-xs text-[#808080] mt-0.5">
                                Auto-deletes in 7 days
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Close Button (when success) */}
                  {saveSuccess && (
                    <button
                      onClick={onClose}
                      className="w-full mt-6 px-4 py-2.5 bg-[#10B981] text-[#FFFFFF] rounded-lg hover:bg-[#059669] transition-colors font-medium"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

