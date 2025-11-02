'use client';

import { useState, useEffect } from 'react';
import { Cloud, X, Check, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

/**
 * CloudSavePrompt - Prompt users to save to THEIR Dropbox/Google Drive
 * 
 * IMPORTANT: We NEVER store files permanently. All files expire after 7 days.
 * This prompts users to save to their own cloud storage (Dropbox/Google Drive).
 * Users own all assets - we only provide temporary hosting.
 * 
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - called when user closes modal
 * - fileUrl: string - the temporary S3 URL of the file
 * - fileType: 'image' | 'video' | 'audio' | 'attachment' - type of file
 * - fileName: string (optional) - suggested file name
 * - metadata: object (optional) - additional metadata to save
 */
export function CloudSavePrompt({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileType = 'attachment',
  fileName = null,
  metadata = {}
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [customName, setCustomName] = useState(fileName || `${fileType}-${Date.now()}`);
  const [selectedProvider, setSelectedProvider] = useState(null); // 'dropbox' | 'google-drive'
  const [cloudStatus, setCloudStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check cloud storage connection status on mount
  useEffect(() => {
    if (isOpen) {
      checkCloudStatus();
    }
  }, [isOpen]);

  const checkCloudStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await api.cloudStorage.status();
      setCloudStatus(status);
      
      // Auto-select connected provider
      if (status.dropbox?.connected) {
        setSelectedProvider('dropbox');
      } else if (status.googleDrive?.connected) {
        setSelectedProvider('google-drive');
      }
    } catch (error) {
      console.error('Failed to check cloud storage status:', error);
      setCloudStatus({ dropbox: { connected: false }, googleDrive: { connected: false } });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!selectedProvider) {
      toast.error('Please select a storage provider');
      return;
    }

    // Check if provider is connected
    const isConnected = cloudStatus?.[selectedProvider === 'dropbox' ? 'dropbox' : 'googleDrive']?.connected;
    
    if (!isConnected) {
      toast.error('Please connect your cloud storage first');
      // Redirect to settings to connect
      window.location.href = '/dashboard?tab=storage';
      return;
    }

    setIsSaving(true);
    try {
      // Upload file from our temporary S3 to user's cloud storage
      const response = await api.cloudStorage.uploadFile(selectedProvider, {
        fileUrl,
        fileName: customName,
        fileType,
        metadata
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          <span>Saved to {selectedProvider === 'dropbox' ? 'Dropbox' : 'Google Drive'}!</span>
        </div>,
        { duration: 3000 }
      );
      
      onClose({ saved: true, provider: selectedProvider, cloudPath: response.path });
    } catch (error) {
      console.error('Cloud save failed:', error);
      toast.error(error.response?.data?.message || 'Failed to save to cloud storage');
      onClose({ saved: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    toast.error(
      'File will be deleted in 7 days! Save to your cloud storage to keep it permanently.',
      { duration: 5000, icon: '⚠️' }
    );
    onClose({ saved: false, skipped: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-base-content" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Save to Your Drive</h3>
              <p className="text-xs opacity-70">Files expire in 7 days if not saved</p>
            </div>
          </div>
          <button 
            onClick={handleSkip}
            className="btn btn-circle btn-ghost btn-sm"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Warning Banner */}
          <div className="alert alert-warning text-xs">
            <AlertCircle className="w-4 h-4" />
            <span><strong>We don&apos;t store your files!</strong> Save to your Dropbox or Google Drive to keep them permanently.</span>
          </div>

          {/* Loading State */}
          {isCheckingStatus && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-base-content/60" />
              <p className="text-sm opacity-70 mt-2">Checking cloud connections...</p>
            </div>
          )}

          {/* Cloud Provider Selection */}
          {!isCheckingStatus && cloudStatus && (
            <>
              {/* Preview */}
              {fileType === 'image' && (
                <div className="aspect-video rounded-lg overflow-hidden bg-base-200">
                  <img 
                    src={fileUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {fileType === 'video' && (
                <div className="aspect-video rounded-lg overflow-hidden bg-base-200">
                  <video 
                    src={fileUrl} 
                    controls 
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Provider Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Choose Your Cloud Storage</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Dropbox */}
                  <button
                    onClick={() => setSelectedProvider('dropbox')}
                    disabled={!cloudStatus.dropbox?.connected}
                    className={`btn ${selectedProvider === 'dropbox' ? 'btn-primary' : 'btn-outline'} ${!cloudStatus.dropbox?.connected ? 'opacity-50' : ''}`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452 0 13.274zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822L6 18.371z"/>
                    </svg>
                    Dropbox
                    {!cloudStatus.dropbox?.connected && <span className="text-xs">(Not connected)</span>}
                  </button>
                  
                  {/* Google Drive */}
                  <button
                    onClick={() => setSelectedProvider('google-drive')}
                    disabled={!cloudStatus.googleDrive?.connected}
                    className={`btn ${selectedProvider === 'google-drive' ? 'btn-primary' : 'btn-outline'} ${!cloudStatus.googleDrive?.connected ? 'opacity-50' : ''}`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.01 1.485L5.393 12h13.235L12.01 1.485zM2.01 17l4.695-8.125L11.4 17H2.01zM12.924 17l-4.695 8.125L2.924 17h10z"/>
                    </svg>
                    Google Drive
                    {!cloudStatus.googleDrive?.connected && <span className="text-xs">(Not connected)</span>}
                  </button>
                </div>
                
                {/* Connect Link */}
                {!cloudStatus.dropbox?.connected && !cloudStatus.googleDrive?.connected && (
                  <p className="text-xs text-center mt-2 opacity-70">
                    <a href="/dashboard?tab=storage" className="link link-primary">Connect a cloud storage provider</a> to save files.
                  </p>
                )}
              </div>

              {/* File name input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">File Name</span>
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input input-bordered"
                  placeholder="Enter file name..."
                  disabled={isSaving}
                />
              </div>

              {/* Folder path info */}
              {selectedProvider && (
                <div className="text-xs opacity-70">
                  📁 Will be saved to: <code className="bg-base-200 px-1 rounded">/Wryda/{fileType}s/{customName}</code>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleSkip}
            className="btn btn-ghost flex-1"
            disabled={isSaving}
          >
            Skip (Deletes in 7 days)
          </button>
          <button
            onClick={handleSaveToCloud}
            disabled={isSaving || !customName.trim() || !selectedProvider || isCheckingStatus}
            className="btn btn-primary flex-1 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                Save to {selectedProvider === 'dropbox' ? 'Dropbox' : selectedProvider === 'google-drive' ? 'Drive' : 'Cloud'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

