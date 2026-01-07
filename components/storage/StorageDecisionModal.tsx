/**
 * Storage Decision Modal
 * 
 * Simplified warning modal shown after uploading assets when cloud storage is not connected.
 * Shows a warning that files will auto-delete in 7 days and provides options to connect cloud storage.
 * 
 * Behavior:
 * - Shows once per session (tracked in sessionStorage)
 * - Only shows if no cloud storage is connected
 * - Once cloud storage is connected, never shows again
 * - Resets on logout/login (new session = can show once again on first upload)
 */

'use client';

import { useState, useEffect } from 'react';
import { Cloud, Check, Loader2, X, Image, Video, Film, AlertTriangle } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useStorageConnections } from '@/hooks/useStorageConnections';
import { motion, AnimatePresence } from 'framer-motion';

type AssetType = 'image' | 'video' | 'composition' | 'audio';

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

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'google-drive' | 'dropbox' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  
  const { getToken } = useAuth();
  const { googleDrive, dropbox, isLoading: connectionsLoading, refresh } = useStorageConnections();

  // Check sessionStorage on mount to see if we've already shown this modal this session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('storageWarningModalShown');
      setHasShownThisSession(shown === 'true');
    }
  }, []);

  // Don't show if cloud storage is already connected
  // Don't show if we've already shown it this session
  if (!isOpen) return null;
  if (googleDrive || dropbox) {
    // Cloud storage connected - close modal immediately
    onClose();
    return null;
  }
  if (hasShownThisSession) {
    // Already shown this session - close modal immediately
    onClose();
    return null;
  }

  const handleConnectCloudStorage = async (storageType: 'google-drive' | 'dropbox') => {
    setIsConnecting(true);
    setError(null);
    setConnectingProvider(storageType);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Get OAuth authorization URL from backend
      const response = await fetch(`${BACKEND_API_URL}/api/storage/connect/${storageType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.status}`);
      }

      const data = await response.json();
      
      // Open OAuth flow in popup
      const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      // Mark as shown this session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('storageWarningModalShown', 'true');
        setHasShownThisSession(true);
      }
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${BACKEND_API_URL}/api/auth/${storageType === 'google-drive' ? 'google' : 'dropbox'}/status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.connected) {
              clearInterval(pollInterval);
              if (popup && !popup.closed) {
                popup.close();
              }
              // Refresh connections to update UI
              await refresh();
              // Close modal since storage is now connected
              onClose();
            }
          }
        } catch (error) {
          console.error('[StorageDecisionModal] Status poll error:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsConnecting(false);
        setConnectingProvider(null);
      }, 5 * 60 * 1000);
      
    } catch (err: any) {
      console.error('[StorageDecisionModal] Connect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect storage');
      setIsConnecting(false);
      setConnectingProvider(null);
    }
  };

  const handleClose = () => {
    // Mark as shown this session when user closes
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('storageWarningModalShown', 'true');
      setHasShownThisSession(true);
    }
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50"
          />
          
          {/* Modal - Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <div 
              className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F1F1F] rounded-lg border border-[#3F3F46]">
                    {getAssetIcon()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#FFFFFF]">File Uploaded</h2>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                  disabled={isConnecting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Small Thumbnail */}
                  {(assetType === 'image' || assetType === 'video' || assetType === 'composition') && s3TempUrl && (
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-lg overflow-hidden border border-[#3F3F46] bg-[#0A0A0A]">
                        {assetType === 'image' ? (
                          <img 
                            src={s3TempUrl} 
                            alt={assetName}
                            className="w-24 h-24 object-cover"
                          />
                        ) : (
                          <video 
                            src={s3TempUrl}
                            className="w-24 h-24 object-cover"
                            controls={false}
                            muted
                            playsInline
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warning Message */}
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F59E0B] mb-1">This file will be automatically deleted in 7 days</p>
                      <p className="text-sm text-[#808080]">
                        Connect cloud storage to save files permanently, or download them to your device.
                      </p>
                    </div>
                  </div>

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

                  {/* Cloud Storage Connection Buttons */}
                  <div className="space-y-3">
                    {/* Google Drive */}
                    <button
                      onClick={() => handleConnectCloudStorage('google-drive')}
                      disabled={isConnecting || connectionsLoading}
                      className="w-full flex items-center gap-3 p-4 border border-[#3F3F46] rounded-lg transition-all hover:border-[#4285F4] hover:bg-[#1F1F1F] bg-[#141414] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="p-2 rounded-lg bg-[#4285F4]/10">
                        <Cloud className="w-5 h-5 text-[#4285F4]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-[#FFFFFF]">Connect Google Drive</div>
                        <div className="text-xs text-[#808080] mt-0.5">
                          Save files permanently to Google Drive
                        </div>
                      </div>
                      {isConnecting && connectingProvider === 'google-drive' && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#4285F4]" />
                      )}
                    </button>

                    {/* Dropbox */}
                    <button
                      onClick={() => handleConnectCloudStorage('dropbox')}
                      disabled={isConnecting || connectionsLoading}
                      className="w-full flex items-center gap-3 p-4 border border-[#3F3F46] rounded-lg transition-all hover:border-[#0061FF] hover:bg-[#1F1F1F] bg-[#141414] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="p-2 rounded-lg bg-[#0061FF]/10">
                        <Cloud className="w-5 h-5 text-[#0061FF]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-[#FFFFFF]">Connect Dropbox</div>
                        <div className="text-xs text-[#808080] mt-0.5">
                          Save files permanently to Dropbox
                        </div>
                      </div>
                      {isConnecting && connectingProvider === 'dropbox' && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0061FF]" />
                      )}
                    </button>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="w-full mt-4 px-4 py-2.5 border border-[#3F3F46] text-[#808080] rounded-lg hover:bg-[#1F1F1F] hover:text-[#FFFFFF] transition-colors font-medium"
                    disabled={isConnecting}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

