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
  const [deletingReadingId, setDeletingReadingId] = useState<string | null>(null);
  const playerRefs = useRef<Map<string, any>>(new Map());
  const initializingPlayers = useRef<Set<string>>(new Set()); // Track players being initialized
  const downloadingFiles = useRef<Set<string>>(new Set()); // Track files being downloaded

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

  // Update readings when groupedReadings changes (only if actually different)
  useEffect(() => {
    // Only update if the array reference or content actually changed
    const currentIds = readings.map(r => r.id).sort().join(',');
    const newIds = groupedReadings.map(r => r.id).sort().join(',');
    if (currentIds !== newIds) {
      setReadings(groupedReadings);
    }
  }, [groupedReadings]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Helper function for downloading audio files via blob (matches JobsDrawer exactly)
   */
  const downloadAudioAsBlob = async (audioUrl: string, filename: string, s3Key?: string) => {
    try {
      let downloadUrl = audioUrl;
      
      if (s3Key) {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) throw new Error('Not authenticated');
          
          const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
          const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 3600,
            }),
          });
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to generate presigned URL: ${presignedResponse.status}`);
          }
          
          const presignedData = await presignedResponse.json();
          downloadUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[ReadingsPanel] Failed to get presigned URL, using original URL:', error);
        }
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      console.error('[ReadingsPanel] Failed to download audio:', error);
      toast.error('Failed to download audio', { description: error.message });
      throw error;
    }
  };

  // Download function for MediaFile - wraps downloadAudioAsBlob
  const downloadFile = async (file: MediaFile) => {
    // Prevent duplicate downloads
    if (downloadingFiles.current.has(file.id)) {
      console.warn('[ReadingsPanel] Download already in progress for:', file.id);
      return;
    }

    downloadingFiles.current.add(file.id);
    
    try {
      let downloadUrl: string | undefined = undefined;
      let s3Key: string | undefined = undefined;
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      
      // If we have an s3Key, use it for presigned URL (matches JobsDrawer)
      if (file.s3Key && (file.storageType === 'local' || file.storageType === 'wryda-temp' || !file.storageType)) {
        s3Key = file.s3Key;
        // No fallback URL needed - we'll use s3Key to get presigned URL
        downloadUrl = undefined;
      } else if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
        // For cloud storage files, get download URL from backend
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Not authenticated');
          return;
        }
        
        const response = await fetch(`${BACKEND_API_URL}/api/storage/download/${file.storageType}/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          downloadUrl = data.downloadUrl;
        } else {
          toast.error('Failed to get download URL');
          return;
        }
      } else {
        toast.error('Unsupported storage type for this file');
        return;
      }

      if (!downloadUrl && !s3Key) {
        toast.error('Cannot download this file: no URL available');
        return;
      }

      // Use the blob download function (matches JobsDrawer exactly)
      await downloadAudioAsBlob(
        downloadUrl || file.s3Url || '',
        file.fileName || 'download.mp3',
        s3Key
      );
    } catch (error) {
      // Error already handled in downloadAudioAsBlob
    } finally {
      downloadingFiles.current.delete(file.id);
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

  // Handle download combined audio (stitched scenes)
  const handleDownloadCombined = async (reading: ReadingSession) => {
    if (!reading.combinedAudio) {
      toast.error('Combined audio not found');
      return;
    }

    try {
      await downloadFile(reading.combinedAudio);
      toast.success('Download started');
    } catch (error: any) {
      toast.error('Failed to download', { description: error.message });
    }
  };

  // Handle download individual scene
  const handleDownloadScene = async (sceneFile: MediaFile) => {
    try {
      await downloadFile(sceneFile);
      toast.success('Download started');
    } catch (error: any) {
      toast.error('Failed to download scene', { description: error.message });
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
      for (const file of filesToDownload) {
        await downloadFile(file);
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

  // Handle generate new
  const handleGenerateNew = () => {
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
                onDownloadScene={handleDownloadScene}
                onDownloadAll={() => handleDownloadAll(reading)}
                onDelete={() => handleDeleteReading(reading)}
                playerRef={(player: any) => {
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
  onDownloadScene: (sceneFile: MediaFile) => void;
  onDownloadAll: () => void;
  onDelete: () => void;
  playerRef: (player: any) => void;
}

function ReadingCard({
  reading,
  isPlaying,
  isDeleting,
  onPlayPause,
  onDownloadCombined,
  onDownloadScene,
  onDownloadAll,
  onDelete,
  playerRef
}: ReadingCardProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  const { getToken } = useAuth();

  // Track if we've already tried to initialize (to prevent retries on errors)
  const hasTriedInitRef = useRef<boolean>(false);

  // Initialize Video.js player
  useEffect(() => {
    // Cleanup when not playing
    if (!isPlaying || !reading.combinedAudio) {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.dispose();
        } catch (e) {
          console.warn('[ReadingCard] Error disposing player:', e);
        }
        playerInstanceRef.current = null;
        playerRef(null);
      }
      isInitializingRef.current = false;
      hasTriedInitRef.current = false; // Reset so we can retry if needed
      return;
    }
    
    // Prevent duplicate initialization
    if (isInitializingRef.current || hasTriedInitRef.current || playerInstanceRef.current) {
      return;
    }
    
    // Wait for element to be in DOM with retry logic
    if (!playerContainerRef.current) {
      // Retry after a short delay if element isn't ready
      const retryTimeout = setTimeout(() => {
        if (playerContainerRef.current && isPlaying && !playerInstanceRef.current) {
          // Element is now ready, continue with initialization
          isInitializingRef.current = false;
          hasTriedInitRef.current = false;
        }
      }, 200);
      return () => clearTimeout(retryTimeout);
    }

    isInitializingRef.current = true;
    hasTriedInitRef.current = true; // Mark that we've tried, even if it fails

    const initializePlayer = async () => {
      try {
        const file = reading.combinedAudio!;
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        let downloadUrl: string | undefined = undefined;

        // If we have an s3Key, try to fetch a fresh presigned URL
        if (file.s3Key && (file.storageType === 'local' || file.storageType === 'wryda-temp' || !file.storageType)) {
          try {
            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
              console.error('[ReadingCard] Not authenticated');
              isInitializingRef.current = false;
              toast.error('Not authenticated', { description: 'Please sign in to play audio' });
              return;
            }
            
            const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key: file.s3Key,
                expiresIn: 3600, // 1 hour
              }),
            });
            
            if (!presignedResponse.ok) {
              const errorText = await presignedResponse.text();
              console.error('[ReadingCard] Presigned URL failed:', presignedResponse.status, errorText);
              isInitializingRef.current = false;
              toast.error('Failed to load audio', { 
                description: `Server returned ${presignedResponse.status}. Please try again.` 
              });
              return; // Don't initialize player if we can't get URL
            }
            
            const presignedData = await presignedResponse.json();
            downloadUrl = presignedData.downloadUrl;
          } catch (error: any) {
            console.error('[ReadingCard] Failed to get presigned URL:', error);
            isInitializingRef.current = false;
            toast.error('Failed to load audio', { 
              description: error.message || 'Unable to generate secure download link' 
            });
            return; // Don't initialize player if we can't get URL
          }
        } else if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
          // For cloud storage files, get download URL from backend
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) {
            console.error('[ReadingCard] Not authenticated');
            isInitializingRef.current = false;
            toast.error('Not authenticated', { description: 'Please sign in to play audio' });
            return;
          }
          
          const response = await fetch(`${BACKEND_API_URL}/api/storage/download/${file.storageType}/${file.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            downloadUrl = data.downloadUrl;
          } else {
            console.error('[ReadingCard] Failed to get cloud storage download URL');
            isInitializingRef.current = false;
            toast.error('Failed to load audio', { 
              description: `Server returned ${response.status}` 
            });
            return;
          }
        } else {
          console.error('[ReadingCard] Unsupported storage type:', file.storageType);
          isInitializingRef.current = false;
          toast.error('Unsupported storage type', { 
            description: 'This file cannot be played in the browser' 
          });
          return;
        }

        if (!downloadUrl) {
          console.error('[ReadingCard] No download URL available');
          isInitializingRef.current = false;
          toast.error('No download URL available', { 
            description: 'Unable to generate playback URL' 
          });
          return;
        }

        // Ensure element is still in DOM before initializing
        if (!playerContainerRef.current) {
          console.error('[ReadingCard] Player container not in DOM');
          isInitializingRef.current = false;
          return;
        }

        // Check if player already exists (shouldn't happen, but safety check)
        if (playerInstanceRef.current) {
          console.warn('[ReadingCard] Player already exists, disposing old instance');
          try {
            playerInstanceRef.current.dispose();
          } catch (e) {
            console.warn('[ReadingCard] Error disposing existing player:', e);
          }
        }

        // Initialize Video.js
        const player = videojs(playerContainerRef.current, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: 'metadata',
          sources: [{
            src: downloadUrl,
            type: 'audio/mpeg'
          }],
          errorDisplay: true,
        });

        // Handle player errors
        player.on('error', () => {
          const error = player.error();
          console.error('[ReadingCard] Video.js player error:', error);
          toast.error('Playback error', { 
            description: error?.message || 'Failed to play audio file' 
          });
        });

        playerInstanceRef.current = player;
        playerRef(player);
        isInitializingRef.current = false; // Successfully initialized
        
        console.log('[ReadingCard] ✅ Player initialized successfully');
      } catch (error: any) {
        console.error('[ReadingCard] Failed to initialize player:', error);
        isInitializingRef.current = false;
        toast.error('Failed to initialize player', { 
          description: error.message || 'Unknown error occurred' 
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      initializePlayer();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.dispose();
        } catch (e) {
          console.warn('[ReadingCard] Error disposing player:', e);
        }
        playerInstanceRef.current = null;
        playerRef(null);
      }
      isInitializingRef.current = false;
    };
  }, [isPlaying, reading.combinedAudio, getToken, playerRef]); // Include all dependencies

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
      <div className="space-y-2">
        {/* Primary Actions */}
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
          
          {reading.combinedAudio && (
            <button
              onClick={onDownloadCombined}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors"
              title="Download stitched scenes (all scenes combined)"
            >
              <Download className="w-3 h-3" />
              Stitched Scenes
            </button>
          )}

          <button
            onClick={onDownloadAll}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors"
          >
            <Download className="w-3 h-3" />
            All Files
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

        {/* Individual Scene Downloads */}
        {reading.sceneAudios.length > 0 && (
          <div className="border-t border-[#3F3F46] pt-2">
            <div className="text-xs text-gray-400 mb-2 font-medium">Individual Scenes:</div>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {reading.sceneAudios
                .sort((a, b) => {
                  // Sort by scene number if available in metadata
                  const aSceneNum = a.metadata?.sceneNumber || a.metadata?.sceneId?.match(/\d+/)?.[0] || '0';
                  const bSceneNum = b.metadata?.sceneNumber || b.metadata?.sceneId?.match(/\d+/)?.[0] || '0';
                  return parseInt(aSceneNum) - parseInt(bSceneNum);
                })
                .map((sceneFile) => {
                  const sceneHeading = sceneFile.metadata?.heading || sceneFile.fileName.replace('.mp3', '');
                  const sceneNumber = sceneFile.metadata?.sceneNumber || sceneFile.metadata?.sceneId?.match(/\d+/)?.[0] || '';
                  const displayName = sceneNumber 
                    ? `Scene ${sceneNumber}: ${sceneHeading}` 
                    : sceneHeading;
                  
                  return (
                    <button
                      key={sceneFile.id}
                      onClick={() => onDownloadScene(sceneFile)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-gray-300 hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors text-left"
                      title={`Download ${displayName}`}
                    >
                      <Download className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{displayName}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

