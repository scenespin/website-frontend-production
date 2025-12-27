'use client';

/**
 * Readings Panel Component
 * 
 * Displays all screenplay reading audio files in a dedicated interface.
 * Features:
 * - Query Media Library for readings (metadata.source === 'screenplay-reading')
 * - Group files by reading session (folderId or timestamp)
 * - Play audio in browser using Video.js
 * - Download combined audio, individual scenes, and SRT files
 * - Delete readings
 * - Generate/Regenerate readings using ScreenplayReadingModal
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useMediaFiles, useDeleteMedia, usePresignedUrl } from '@/hooks/useMediaLibrary';
import { getScreenplay } from '@/utils/screenplayStorage';
import { toast } from 'sonner';
import { 
  Headphones, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  RefreshCw, 
  Plus,
  Loader2,
  Clock,
  FileText,
  Music
} from 'lucide-react';
import type { MediaFile } from '@/types/media';
import ScreenplayReadingModal from '../modals/ScreenplayReadingModal';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/sea/index.css';

interface ReadingsPanelProps {
  className?: string;
}

interface ReadingSession {
  id: string;
  title: string;
  date: string;
  combinedAudio?: MediaFile;
  sceneAudios: MediaFile[];
  subtitles: MediaFile[];
  metadata?: Record<string, any>;
}

export function ReadingsPanel({ className = '' }: ReadingsPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  const [screenplayTitle, setScreenplayTitle] = React.useState<string>('Untitled Screenplay');

  // Fetch screenplay title
  React.useEffect(() => {
    if (screenplayId && getToken) {
      getScreenplay(screenplayId, getToken)
        .then((screenplayData) => {
          if (screenplayData?.title) {
            setScreenplayTitle(screenplayData.title);
          }
        })
        .catch(() => {
          // Keep default title on error
        });
    }
  }, [screenplayId, getToken]);

  // Query all Media Library files
  const { data: allFiles = [], isLoading } = useMediaFiles(
    screenplayId || '',
    undefined,
    !!screenplayId,
    true // includeAllFolders = true to get all files
  );

  const deleteMedia = useDeleteMedia(screenplayId || '');

  // State
  const [readings, setReadings] = useState<ReadingSession[]>([]);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [playingReadingId, setPlayingReadingId] = useState<string | null>(null);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [regenerateReadingId, setRegenerateReadingId] = useState<string | null>(null);
  const [deletingReadingId, setDeletingReadingId] = useState<string | null>(null);
  const playerRefs = useRef<Map<string, any>>(new Map());

  // Filter and group readings
  const groupedReadings = useMemo(() => {
    if (!allFiles.length) return [];

    // Filter for screenplay-reading files
    const readingFiles = allFiles.filter(
      file => file.metadata?.source === 'screenplay-reading'
    );

    if (!readingFiles.length) return [];

    // Group by folderId (all files from same reading session are in same folder)
    const groups = new Map<string, MediaFile[]>();
    
    for (const file of readingFiles) {
      // Use folderId if available, otherwise extract from folderPath or use timestamp from metadata
      const groupKey = file.folderId || 
        (file.folderPath && file.folderPath.length > 0 ? file.folderPath[file.folderPath.length - 1] : '') ||
        file.metadata?.readingTimestamp ||
        file.uploadedAt;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(file);
    }

    // Convert to ReadingSession objects
    const sessions: ReadingSession[] = [];
    
    for (const [groupId, files] of groups.entries()) {
      // Find combined audio
      const combinedAudio = files.find(
        f => f.metadata?.isCombined === true && f.fileType === 'audio'
      );

      // Find scene audio files (not combined, not subtitle)
      const sceneAudios = files.filter(
        f => f.metadata?.isCombined !== true && 
             !f.metadata?.isSubtitle && 
             f.fileType === 'audio'
      );

      // Find subtitle files
      const subtitles = files.filter(
        f => f.metadata?.isSubtitle === true || 
             (f.fileType === 'other' && f.fileName.endsWith('.srt'))
      );

      // Get title from combined audio or use default
      const title = combinedAudio?.fileName || 
        `Screenplay Reading - ${new Date(files[0]?.uploadedAt || Date.now()).toLocaleDateString()}`;

      sessions.push({
        id: groupId,
        title,
        date: combinedAudio?.uploadedAt || files[0]?.uploadedAt || new Date().toISOString(),
        combinedAudio,
        sceneAudios,
        subtitles,
        metadata: combinedAudio?.metadata || files[0]?.metadata
      });
    }

    // Sort by date (newest first)
    return sessions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [allFiles]);

  // Update readings when groupedReadings changes
  useEffect(() => {
    setReadings(groupedReadings);
  }, [groupedReadings]);

  // Download function (reused from JobsDrawer, enhanced for cloud storage)
  const downloadAudioAsBlob = async (file: MediaFile) => {
    try {
      let downloadUrl: string;
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      
      // Handle different storage types
      if (file.storageType === 'local' || !file.storageType) {
        // S3 file - get presigned URL
        const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: file.s3Key,
            expiresIn: 3600,
          }),
        });
        
        if (!presignedResponse.ok) {
          throw new Error(`Failed to generate presigned URL: ${presignedResponse.status}`);
        }
        
        const presignedData = await presignedResponse.json();
        downloadUrl = presignedData.downloadUrl;
      } else if (file.storageType === 'google-drive') {
        // Google Drive file
        const response = await fetch(`${BACKEND_API_URL}/api/storage/download/google-drive/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get Google Drive download URL: ${response.status}`);
        }
        
        const data = await response.json();
        downloadUrl = data.downloadUrl;
      } else if (file.storageType === 'dropbox') {
        // Dropbox file
        const response = await fetch(`${BACKEND_API_URL}/api/storage/download/dropbox/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get Dropbox download URL: ${response.status}`);
        }
        
        const data = await response.json();
        downloadUrl = data.downloadUrl;
      } else {
        throw new Error(`Unsupported storage type: ${file.storageType}`);
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      console.error('[ReadingsPanel] Failed to download file:', error);
      toast.error('Failed to download file', { description: error.message });
      throw error;
    }
  };

  // Handle play/pause
  const handlePlayPause = (readingId: string, audioFile: MediaFile) => {
    if (playingReadingId === readingId) {
      // Pause
      const player = playerRefs.current.get(readingId);
      if (player) {
        player.pause();
      }
      setPlayingReadingId(null);
    } else {
      // Play
      setPlayingReadingId(readingId);
      // Video.js player will be initialized in the AudioPlayer component
    }
  };

  // Handle download combined audio
  const handleDownloadCombined = async (reading: ReadingSession) => {
    if (!reading.combinedAudio) {
      toast.error('Combined audio not found');
      return;
    }

    try {
      await downloadAudioAsBlob(reading.combinedAudio);
      toast.success('Download started');
    } catch (error: any) {
      toast.error('Failed to download', { description: error.message });
    }
  };

  // Handle download all files
  const handleDownloadAll = async (reading: ReadingSession) => {
    try {
      const filesToDownload: MediaFile[] = [];

      if (reading.combinedAudio) {
        filesToDownload.push(reading.combinedAudio);
      }

      filesToDownload.push(...reading.sceneAudios);
      filesToDownload.push(...reading.subtitles);

      // Download sequentially to avoid overwhelming the browser
      for (const { file } of filesToDownload) {
        await downloadAudioAsBlob(file);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success(`Downloaded ${filesToDownload.length} file(s)`);
    } catch (error: any) {
      toast.error('Failed to download files', { description: error.message });
    }
  };

  // Handle delete reading
  const handleDeleteReading = async (reading: ReadingSession) => {
    if (!confirm(`Delete this reading? This will remove all ${reading.sceneAudios.length + (reading.combinedAudio ? 1 : 0) + reading.subtitles.length} files.`)) {
      return;
    }

    setDeletingReadingId(reading.id);

    try {
      const filesToDelete: MediaFile[] = [];
      if (reading.combinedAudio) filesToDelete.push(reading.combinedAudio);
      filesToDelete.push(...reading.sceneAudios);
      filesToDelete.push(...reading.subtitles);

      // Delete all files
      for (const file of filesToDelete) {
        await deleteMedia.mutateAsync(file.id);
      }

      toast.success('Reading deleted');
    } catch (error: any) {
      toast.error('Failed to delete reading', { description: error.message });
    } finally {
      setDeletingReadingId(null);
    }
  };

  // Handle regenerate
  const handleRegenerate = (reading: ReadingSession) => {
    setRegenerateReadingId(reading.id);
    setShowReadingModal(true);
  };

  // Handle generate new
  const handleGenerateNew = () => {
    setRegenerateReadingId(null);
    setShowReadingModal(true);
  };

  if (!screenplayId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 text-sm">Loading readings...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 text-sm">Loading readings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[#0A0A0A] ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] bg-[#141414] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Screenplay Readings</h2>
          <p className="text-sm text-gray-400 mt-1">
            {readings.length} {readings.length === 1 ? 'reading' : 'readings'}
          </p>
        </div>
        <button
          onClick={handleGenerateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91C1C] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate New Reading
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {readings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Headphones className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No readings yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Generate your first screenplay reading to get started
            </p>
            <button
              onClick={handleGenerateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91C1C] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Reading
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readings.map((reading) => (
              <ReadingCard
                key={reading.id}
                reading={reading}
                isPlaying={playingReadingId === reading.id}
                isDeleting={deletingReadingId === reading.id}
                onPlayPause={() => reading.combinedAudio && handlePlayPause(reading.id, reading.combinedAudio)}
                onDownloadCombined={() => handleDownloadCombined(reading)}
                onDownloadAll={() => handleDownloadAll(reading)}
                onDelete={() => handleDeleteReading(reading)}
                onRegenerate={() => handleRegenerate(reading)}
                playerRef={(player) => {
                  if (player) {
                    playerRefs.current.set(reading.id, player);
                  } else {
                    playerRefs.current.delete(reading.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Screenplay Reading Modal */}
      {showReadingModal && (
        <ScreenplayReadingModal
          isOpen={showReadingModal}
          onClose={() => {
            setShowReadingModal(false);
            setRegenerateReadingId(null);
          }}
          screenplayId={screenplayId}
          screenplayTitle={screenplayTitle}
        />
      )}
    </div>
  );
}

// Reading Card Component
interface ReadingCardProps {
  reading: ReadingSession;
  isPlaying: boolean;
  isDeleting: boolean;
  onPlayPause: () => void;
  onDownloadCombined: () => void;
  onDownloadAll: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  playerRef: (player: any) => void;
}

function ReadingCard({
  reading,
  isPlaying,
  isDeleting,
  onPlayPause,
  onDownloadCombined,
  onDownloadAll,
  onDelete,
  onRegenerate,
  playerRef
}: ReadingCardProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const { getToken } = useAuth();

  // Initialize Video.js player
  useEffect(() => {
    if (!reading.combinedAudio || !playerContainerRef.current) return;

    const initializePlayer = async () => {
      try {
        // Get download URL based on storage type
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;

        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        let downloadUrl: string;

        const file = reading.combinedAudio!;
        
        if (file.storageType === 'local' || !file.storageType) {
          // S3 file
          const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: file.s3Key,
              expiresIn: 3600,
            }),
          });

          if (!response.ok) return;
          const data = await response.json();
          downloadUrl = data.downloadUrl;
        } else if (file.storageType === 'google-drive') {
          // Google Drive file
          const response = await fetch(`${BACKEND_API_URL}/api/storage/download/google-drive/${file.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) return;
          const data = await response.json();
          downloadUrl = data.downloadUrl;
        } else if (file.storageType === 'dropbox') {
          // Dropbox file
          const response = await fetch(`${BACKEND_API_URL}/api/storage/download/dropbox/${file.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) return;
          const data = await response.json();
          downloadUrl = data.downloadUrl;
        } else {
          console.error('[ReadingCard] Unsupported storage type:', file.storageType);
          return;
        }

        // Initialize Video.js
        const player = videojs(playerContainerRef.current!, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: 'metadata',
          sources: [{
            src: downloadUrl,
            type: 'audio/mpeg'
          }]
        });

        playerInstanceRef.current = player;
        playerRef(player);

        return () => {
          if (playerInstanceRef.current) {
            playerInstanceRef.current.dispose();
            playerInstanceRef.current = null;
            playerRef(null);
          }
        };
      } catch (error) {
        console.error('[ReadingCard] Failed to initialize player:', error);
      }
    };

    if (isPlaying) {
      initializePlayer();
    }

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.dispose();
        playerInstanceRef.current = null;
        playerRef(null);
      }
    };
  }, [isPlaying, reading.combinedAudio, getToken, playerRef]);

  const date = new Date(reading.date);
  const sceneCount = reading.sceneAudios.length;

  return (
    <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4 hover:border-[#DC143C] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate mb-1">
            {reading.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{date.toLocaleDateString()}</span>
            {sceneCount > 0 && (
              <>
                <span>•</span>
                <span>{sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Audio Player (only show when playing) */}
      {isPlaying && reading.combinedAudio && (
        <div className="mb-3">
          <div data-vjs-player>
            <div ref={playerContainerRef} className="video-js vjs-theme-sea" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {reading.combinedAudio && (
          <button
            onClick={onPlayPause}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
        
        <button
          onClick={onDownloadCombined}
          disabled={!reading.combinedAudio}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3 h-3" />
          Audio
        </button>

        <button
          onClick={onDownloadAll}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors"
        >
          <Download className="w-3 h-3" />
          All Files
        </button>

        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-red-400 hover:bg-[#2A2A2A] hover:border-red-500 transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
}

