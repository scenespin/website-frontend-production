/**
 * Storage Decision Modal
 * 
 * Modal shown after generating assets (images, videos, compositions) to let users
 * choose where to save the file.
 * 
 * Options: Google Drive, Dropbox, Download to device, or Keep temporary (7 days)
 */

'use client';

import { useState } from 'react';
import { Cloud, Download, Clock, Check, Loader2, X, Image, Video, Film } from 'lucide-react';
import { useStorageConnections } from '@/hooks/useStorageConnections';

type AssetType = 'image' | 'video' | 'composition';
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
  
  const { googleDrive, dropbox, isLoading: connectionsLoading } = useStorageConnections();

  if (!isOpen) return null;

  const handleSaveToCloud = async (storage: 'google-drive' | 'dropbox') => {
    setIsSaving(true);
    setError(null);
    setSelectedStorage(storage);

    try {
      // Get auth token
      const token = localStorage.getItem('cognito_id_token');
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
      // Get auth token
      const token = localStorage.getItem('cognito_id_token');
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
        return <Image className="w-8 h-8 text-blue-600" />;
      case 'video':
        return <Video className="w-8 h-8 text-purple-600" />;
      case 'composition':
        return <Film className="w-8 h-8 text-pink-600" />;
    }
  };

  const getAssetTypeLabel = () => {
    switch (assetType) {
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'composition': return 'Composition';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-base-content">Save Your {getAssetTypeLabel()}</h2>
          <button
            onClick={onClose}
            className="text-base-content/60 hover:text-base-content/40 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Asset Preview */}
        <div className="bg-base-100 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              {getAssetIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base-content truncate">
                {assetName}
              </h3>
              <p className="text-sm text-base-content/40">
                {getAssetTypeLabel()} • {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
          
          {/* Preview thumbnail */}
          {(assetType === 'image' || assetType === 'video' || assetType === 'composition') && s3TempUrl && (
            <div className="mt-3">
              {assetType === 'image' ? (
                <img 
                  src={s3TempUrl} 
                  alt={assetName}
                  className="w-full rounded-lg max-h-48 object-cover"
                />
              ) : (
                <video 
                  src={s3TempUrl}
                  className="w-full rounded-lg max-h-48 object-cover"
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Saved Successfully!</p>
              <p className="text-sm text-green-700">
                Your {assetType} has been saved to {selectedStorage === 'google-drive' ? 'Google Drive' : 'Dropbox'}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Storage Options */}
        {!saveSuccess && (
          <div className="space-y-3">
            <p className="text-sm text-base-content/40 mb-4">
              Where would you like to save this {assetType}?
            </p>

            {/* Google Drive */}
            <button
              onClick={() => handleSaveToCloud('google-drive')}
              disabled={isSaving || connectionsLoading || !googleDrive}
              className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all group ${
                googleDrive
                  ? 'border-base-content/20 hover:border-blue-500 hover:bg-blue-50'
                  : 'border-base-content/20 bg-base-100 cursor-not-allowed opacity-60'
              }`}
            >
              <Cloud className="w-5 h-5 text-blue-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-base-content group-hover:text-blue-900">
                  Save to Google Drive
                </div>
                <div className="text-sm text-base-content/40">
                  {googleDrive ? 'Free permanent storage' : 'Not connected - Click to connect'}
                </div>
              </div>
              {isSaving && selectedStorage === 'google-drive' && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </button>

            {/* Dropbox */}
            <button
              onClick={() => handleSaveToCloud('dropbox')}
              disabled={isSaving || connectionsLoading || !dropbox}
              className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all group ${
                dropbox
                  ? 'border-base-content/20 hover:border-indigo-500 hover:bg-indigo-50'
                  : 'border-base-content/20 bg-base-100 cursor-not-allowed opacity-60'
              }`}
            >
              <Cloud className="w-5 h-5 text-indigo-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-base-content group-hover:text-indigo-900">
                  Save to Dropbox
                </div>
                <div className="text-sm text-base-content/40">
                  {dropbox ? 'Free permanent storage' : 'Not connected - Click to connect'}
                </div>
              </div>
              {isSaving && selectedStorage === 'dropbox' && (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              )}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isSaving}
              className="w-full flex items-center gap-3 p-4 border-2 border-base-content/20 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Download className="w-5 h-5 text-green-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-base-content group-hover:text-green-900">
                  Download to Device
                </div>
                <div className="text-sm text-base-content/40">
                  Save to your computer
                </div>
              </div>
              {isSaving && selectedStorage === 'download' && (
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              )}
            </button>

            {/* Keep Temporary */}
            <button
              onClick={handleKeepTemp}
              disabled={isSaving}
              className="w-full flex items-center gap-3 p-4 border-2 border-base-content/20 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Clock className="w-5 h-5 text-orange-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-base-content group-hover:text-orange-900">
                  Keep in Temporary Storage
                </div>
                <div className="text-sm text-base-content/40">
                  Auto-deletes after 7 days
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Close Button (when success) */}
        {saveSuccess && (
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-base-content rounded-lg hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

