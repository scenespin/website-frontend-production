/**
 * Music Storage Modal
 * 
 * Modal shown after music generation to let user choose where to save the music file.
 * Options: Google Drive, Dropbox, Temporary Storage (7 days), or Download to device.
 */

'use client';

import { useState } from 'react';
import { Cloud, Download, Clock, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface MusicStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicData: {
    audioUrl: string;
    s3Key: string;
    title?: string;
    tags?: string;
    model: string;
    duration?: number;
    has_vocals: boolean;
  };
}

export function MusicStorageModal({ isOpen, onClose, musicData }: MusicStorageModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<'google-drive' | 'dropbox' | 'temp' | null>(null);

  const { getToken } = useAuth();

  if (!isOpen) return null;

  const handleSaveToCloud = async (storage: 'google-drive' | 'dropbox') => {
    setIsSaving(true);
    setError(null);
    setSelectedStorage(storage);

    try {
      // Generate filename
      const filename = `${musicData.title || 'music'}-${Date.now()}.mp3`.replace(/\s+/g, '-');

      // Get auth token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated. Please sign in.');
      }

      const response = await fetch('/api/music/save-to-cloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          s3_key: musicData.s3Key,
          storage_location: storage,
          filename,
          metadata: {
            title: musicData.title,
            tags: musicData.tags,
            model: musicData.model,
            duration: musicData.duration,
            has_vocals: musicData.has_vocals,
            generated_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save music');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error saving music:', err);
      setError(err.message || 'Failed to save music to cloud storage');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    // Trigger browser download
    const link = document.createElement('a');
    link.href = musicData.audioUrl;
    link.download = `${musicData.title || 'music'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleKeepTemp = () => {
    // Just close modal - file stays in S3 for 7 days
    onClose();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-base-content">Save Your Music</h2>
          <button
            onClick={onClose}
            className="text-base-content/60 hover:text-base-content/40 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Music Info */}
        <div className="bg-base-100 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-base-content text-xl">♪</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base-content">
                {musicData.title || 'Untitled Music'}
              </h3>
              <p className="text-sm text-base-content/40">
                {musicData.tags || 'No tags'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm text-base-content/40 mt-3">
            <div>
              <span className="font-medium">Duration:</span>
              <br />
              {formatDuration(musicData.duration)}
            </div>
            <div>
              <span className="font-medium">Model:</span>
              <br />
              {musicData.model}
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <br />
              {musicData.has_vocals ? 'Vocals' : 'Instrumental'}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Saved Successfully!</p>
              <p className="text-sm text-green-700">Your music has been saved to {selectedStorage === 'google-drive' ? 'Google Drive' : 'Dropbox'}</p>
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
              Where would you like to save this music?
            </p>

            {/* Google Drive */}
            <button
              onClick={() => handleSaveToCloud('google-drive')}
              disabled={isSaving}
              className="w-full flex items-center gap-3 p-4 border-2 border-base-content/20 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Cloud className="w-5 h-5 text-blue-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-base-content group-hover:text-blue-900">
                  Save to Google Drive
                </div>
                <div className="text-sm text-base-content/40">
                  Keep permanently in your Drive
                </div>
              </div>
              {isSaving && selectedStorage === 'google-drive' && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </button>

            {/* Dropbox */}
            <button
              onClick={() => handleSaveToCloud('dropbox')}
              disabled={isSaving}
              className="w-full flex items-center gap-3 p-4 border-2 border-base-content/20 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Cloud className="w-5 h-5 text-indigo-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-base-content group-hover:text-indigo-900">
                  Save to Dropbox
                </div>
                <div className="text-sm text-base-content/40">
                  Keep permanently in your Dropbox
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

