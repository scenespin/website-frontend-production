/**
 * Storage Decision Modal
 * 
 * Simplified warning modal shown after uploading assets when cloud storage is not connected.
 * Shows a warning that files will auto-delete in 7 days and directs users to Media Library to set up cloud storage.
 * 
 * Behavior:
 * - Shows once per session (tracked in sessionStorage)
 * - Only shows if no cloud storage is connected
 * - Once cloud storage is connected, never shows again
 * - Resets on logout/login (new session = can show once again on first upload)
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Image, Video, Film, AlertTriangle, ExternalLink } from 'lucide-react';
import { useStorageConnections } from '@/hooks/useStorageConnections';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  
  const { googleDrive, dropbox } = useStorageConnections();

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
        return <Image className="w-6 h-6 text-[#DC143C]" />;
      case 'video':
        return <Video className="w-6 h-6 text-[#DC143C]" />;
      case 'composition':
        return <Film className="w-6 h-6 text-[#DC143C]" />;
      default:
        return <Image className="w-6 h-6 text-[#DC143C]" />;
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
            className="fixed inset-0 bg-[#000000]/95 backdrop-blur-sm z-50"
          />
          
          {/* Modal - Simplified */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <div 
              className="bg-[#000000] border border-[#1A1A1A] rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between bg-[#0A0A0A]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#141414] rounded-lg border border-[#1A1A1A]">
                    {getAssetIcon()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#FFFFFF]">File Uploaded</h2>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#141414] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Small Thumbnail */}
                  {(assetType === 'image' || assetType === 'video' || assetType === 'composition') && s3TempUrl && (
                    <div className="mb-6 flex justify-center">
                      <div className="rounded-lg overflow-hidden border border-[#1A1A1A] bg-[#0A0A0A]">
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
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-[#FFFFFF] mb-2">This file will be automatically deleted in 7 days</p>
                        <p className="text-sm text-[#808080] leading-relaxed">
                          To save files permanently, set up cloud storage in your Media Library. Connect Google Drive or Dropbox to automatically sync your files.
                        </p>
                      </div>
                    </div>
                    
                    {/* Link to Media Library */}
                    <Link
                      href="/assets"
                      onClick={handleClose}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#DC143C] hover:bg-[#B81235] text-[#FFFFFF] rounded-lg transition-colors font-medium text-sm group"
                    >
                      Go to Media Library
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-2.5 border border-[#1A1A1A] text-[#808080] rounded-lg hover:bg-[#141414] hover:text-[#FFFFFF] hover:border-[#2A2A2A] transition-colors font-medium"
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

