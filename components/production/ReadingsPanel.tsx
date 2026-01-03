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
import { useMediaFiles, useDeleteMedia, usePresignedUrl, useDeleteFolder } from '@/hooks/useMediaLibrary';
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
  const deleteFolder = useDeleteFolder(screenplayId || '');

  // State
  const [readings, setReadings] = useState<ReadingSession[]>([]);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [playingReadingId, setPlayingReadingId] = useState<string | null>(null);
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null); // Track which individual scene is playing
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [deletingReadingId, setDeletingReadingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map()); // Track audio elements for pause
  const sceneAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map()); // Track individual scene audio elements
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
      // If we have s3Key, pass empty string for audioUrl (will be replaced by presigned URL)
      // If we have downloadUrl (cloud storage), use that
      await downloadAudioAsBlob(
        downloadUrl || '',
        file.fileName || 'download.mp3',
        s3Key
      );
    } catch (error) {
      // Error already handled in downloadAudioAsBlob
    } finally {
      downloadingFiles.current.delete(file.id);
    }
  };

  // Handle play/pause for combined audio
  const handlePlayPause = (readingId: string, audioFile: MediaFile) => {
    if (playingReadingId === readingId) {
      // Pause
      const audio = audioRefs.current.get(readingId);
      if (audio) {
        audio.pause();
      }
      setPlayingReadingId(null);
    } else {
      // Play - stop any currently playing audio (combined or scene)
      if (playingReadingId) {
        const currentAudio = audioRefs.current.get(playingReadingId);
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      // Stop any playing scene audio
      if (playingSceneId) {
        const sceneAudio = sceneAudioRefs.current.get(playingSceneId);
        if (sceneAudio) {
          sceneAudio.pause();
        }
        setPlayingSceneId(null);
      }
      setPlayingReadingId(readingId);
    }
  };

  // Handle play/pause for individual scene
  const handleScenePlayPause = (sceneFile: MediaFile, readingId: string) => {
    const sceneId = `${readingId}-${sceneFile.id}`;
    
    if (playingSceneId === sceneId) {
      // Pause
      const audio = sceneAudioRefs.current.get(sceneId);
      if (audio) {
        audio.pause();
      }
      setPlayingSceneId(null);
    } else {
      // Play - stop any currently playing audio (combined or scene)
      if (playingReadingId) {
        const currentAudio = audioRefs.current.get(playingReadingId);
        if (currentAudio) {
          currentAudio.pause();
        }
        setPlayingReadingId(null);
      }
      // Stop any other playing scene
      if (playingSceneId && playingSceneId !== sceneId) {
        const otherSceneAudio = sceneAudioRefs.current.get(playingSceneId);
        if (otherSceneAudio) {
          otherSceneAudio.pause();
        }
      }
      setPlayingSceneId(sceneId);
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

      // Get folderId from files (all files in a reading should have the same folderId)
      // Find the first file with a folderId
      const folderId = filesToDelete.find(f => f.folderId)?.folderId;
      
      // Verify all files have the same folderId (safety check)
      const allHaveSameFolderId = folderId && filesToDelete.every(f => !f.folderId || f.folderId === folderId);

      // Delete all files (non-fatal - continue even if some fail)
      const deletionErrors: string[] = [];
      for (const file of filesToDelete) {
        try {
          await deleteMedia.mutateAsync(file.id);
        } catch (fileError: any) {
          console.warn(`[ReadingsPanel] Failed to delete file ${file.fileName} (non-fatal):`, fileError.message);
          deletionErrors.push(file.fileName);
        }
      }

      // If any files failed to delete, show warning but continue
      if (deletionErrors.length > 0) {
        console.warn(`[ReadingsPanel] ${deletionErrors.length} file(s) failed to delete:`, deletionErrors);
      }

      // Delete the folder if all files had the same folderId
      // This ensures we only delete folders that were actually used by this reading
      if (folderId && allHaveSameFolderId) {
        try {
          await deleteFolder.mutateAsync({ folderId, moveFilesToParent: false });
        } catch (folderError: any) {
          // If folder deletion fails (e.g., folder already deleted, has children, or has other files), 
          // that's okay - we've already deleted all the files
          console.warn('[ReadingsPanel] Failed to delete folder (may have other files or already deleted):', folderError.message);
        }
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
          <h2 className="text-xl font-semibold text-white">Table Reads</h2>
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
                playingSceneId={playingSceneId?.startsWith(`${reading.id}-`) ? playingSceneId : null}
                isDeleting={deletingReadingId === reading.id}
                onPlayPause={() => reading.combinedAudio && handlePlayPause(reading.id, reading.combinedAudio)}
                onScenePlayPause={(sceneFile) => handleScenePlayPause(sceneFile, reading.id)}
                onDownloadCombined={() => handleDownloadCombined(reading)}
                onDownloadScene={handleDownloadScene}
                onDownloadAll={() => handleDownloadAll(reading)}
                onDelete={() => handleDeleteReading(reading)}
                audioRef={(audio: HTMLAudioElement | null) => {
                  if (audio) {
                    audioRefs.current.set(reading.id, audio);
                  } else {
                    audioRefs.current.delete(reading.id);
                  }
                }}
                sceneAudioRef={(sceneId: string, audio: HTMLAudioElement | null) => {
                  if (audio) {
                    sceneAudioRefs.current.set(sceneId, audio);
                  } else {
                    sceneAudioRefs.current.delete(sceneId);
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
  playingSceneId: string | null; // ID of currently playing scene (format: "readingId-sceneFileId")
  isDeleting: boolean;
  onPlayPause: () => void;
  onScenePlayPause: (sceneFile: MediaFile) => void;
  onDownloadCombined: () => void;
  onDownloadScene: (sceneFile: MediaFile) => void;
  onDownloadAll: () => void;
  onDelete: () => void;
  audioRef: (audio: HTMLAudioElement | null) => void;
  sceneAudioRef: (sceneId: string, audio: HTMLAudioElement | null) => void;
}

function ReadingCard({
  reading,
  isPlaying,
  playingSceneId,
  isDeleting,
  onPlayPause,
  onScenePlayPause,
  onDownloadCombined,
  onDownloadScene,
  onDownloadAll,
  onDelete,
  audioRef,
  sceneAudioRef
}: ReadingCardProps) {
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const { getToken } = useAuth();

  // Fetch presigned URL for audio playback
  useEffect(() => {
    if (!isPlaying || !reading.combinedAudio) {
      setAudioUrl(null);
      setIsLoadingAudio(false);
      return;
    }

    const fetchAudioUrl = async () => {
      setIsLoadingAudio(true);
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
              toast.error('Not authenticated', { description: 'Please sign in to play audio' });
              setIsLoadingAudio(false);
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
                expiresIn: 86400 * 7, // 7 days (matches backend ScreenplayReadingService)
              }),
            });
            
            if (!presignedResponse.ok) {
              const errorText = await presignedResponse.text();
              console.error('[ReadingCard] Presigned URL failed:', presignedResponse.status, errorText);
              toast.error('Failed to load audio', { 
                description: `Server returned ${presignedResponse.status}. Please try again.` 
              });
              setIsLoadingAudio(false);
              return;
            }
            
            const presignedData = await presignedResponse.json();
            downloadUrl = presignedData.downloadUrl;
          } catch (error: any) {
            console.error('[ReadingCard] Failed to get presigned URL:', error);
            toast.error('Failed to load audio', { 
              description: error.message || 'Unable to generate secure download link' 
            });
            setIsLoadingAudio(false);
            return;
          }
        } else if (file.storageType === 'google-drive' || file.storageType === 'dropbox') {
          // For cloud storage files, get download URL from backend
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) {
            console.error('[ReadingCard] Not authenticated');
            toast.error('Not authenticated', { description: 'Please sign in to play audio' });
            setIsLoadingAudio(false);
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
            toast.error('Failed to load audio', { 
              description: `Server returned ${response.status}` 
            });
            setIsLoadingAudio(false);
            return;
          }
        } else {
          console.error('[ReadingCard] Unsupported storage type:', file.storageType);
          toast.error('Unsupported storage type', { 
            description: 'This file cannot be played in the browser' 
          });
          setIsLoadingAudio(false);
          return;
        }

        if (downloadUrl) {
          setAudioUrl(downloadUrl);
          console.log('[ReadingCard] ✅ Audio URL loaded:', downloadUrl.substring(0, 100));
        }
      } catch (error: any) {
        console.error('[ReadingCard] Failed to fetch audio URL:', error);
        toast.error('Failed to load audio', { 
          description: error.message || 'Unknown error occurred' 
        });
      } finally {
        setIsLoadingAudio(false);
      }
    };

    fetchAudioUrl();
  }, [isPlaying, reading.combinedAudio, getToken]);

  // Handle audio playback
  useEffect(() => {
    if (!audioElementRef.current || !audioUrl || !isPlaying) return;

    const audio = audioElementRef.current;
    
    // Auto-play when URL is ready
    const playAudio = async () => {
      try {
        await audio.play();
        console.log('[ReadingCard] ✅ Audio playback started');
      } catch (playError: any) {
        console.error('[ReadingCard] Failed to auto-play:', playError);
        // Browser may block autoplay - user can click play button
      }
    };

    // Register audio element with parent
    audioRef(audio);

    // Wait for canplay event (more reliable than loadedmetadata for problematic files)
    const handleCanPlay = () => {
      console.log('[ReadingCard] ✅ Audio can play, duration:', audio.duration);
      playAudio();
    };

    const handleCanPlayThrough = () => {
      console.log('[ReadingCard] ✅ Audio can play through (fully loaded)');
    };

    const handleError = (e: Event) => {
      console.error('[ReadingCard] Audio playback error:', e);
      const error = audio.error;
      if (error) {
        console.error('[ReadingCard] Error code:', error.code);
        console.error('[ReadingCard] Error message:', error.message);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audioRef(null); // Unregister on cleanup
    };
  }, [audioUrl, isPlaying, audioRef]);

  // Helper function to format duration (seconds to MM:SS or HH:MM:SS)
  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds === 0) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const date = new Date(reading.date);
  const sceneCount = reading.sceneAudios.length;
  const totalDuration = reading.combinedAudio?.metadata?.totalDuration as number | undefined;
  const avgDurationPerScene = totalDuration && sceneCount > 0 
    ? totalDuration / sceneCount 
    : undefined;

  return (
    <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4 hover:border-[#DC143C] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate mb-1">
            {reading.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <Clock className="w-3 h-3" />
            <span>{date.toLocaleDateString()}</span>
            {sceneCount > 0 && (
              <>
                <span>•</span>
                <span>{sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}</span>
              </>
            )}
            {totalDuration && (
              <>
                <span>•</span>
                <span>Total: {formatDuration(totalDuration)}</span>
              </>
            )}
            {avgDurationPerScene && (
              <>
                <span>•</span>
                <span>Avg: {formatDuration(avgDurationPerScene)}/scene</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Audio Player (only show when playing) */}
      {isPlaying && reading.combinedAudio && (
        <div className="mb-3">
          {isLoadingAudio ? (
            <div className="flex items-center justify-center py-4 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading audio...
            </div>
          ) : audioUrl ? (
            <audio
              ref={audioElementRef}
              src={audioUrl}
              controls
              preload="metadata"
              crossOrigin="anonymous"
              className="w-full"
              onError={(e) => {
                console.error('[ReadingCard] Audio element error:', e);
                const audio = e.currentTarget;
                const error = audio.error;
                if (error) {
                  console.error('[ReadingCard] Error code:', error.code);
                  console.error('[ReadingCard] Error message:', error.message);
                  
                  // Try to provide helpful error message
                  let errorMsg = 'Failed to load audio';
                  if (error.code === 3) {
                    errorMsg = 'Audio decode error. The file may have encoding issues. Try downloading instead.';
                  } else if (error.code === 4) {
                    errorMsg = 'Audio source not supported or URL expired. Try refreshing the page.';
                  }
                  
                  toast.error('Playback error', { 
                    description: errorMsg
                  });
                } else {
                  toast.error('Failed to load audio', { 
                    description: 'The audio file may be corrupted or the URL expired. Try refreshing the page.' 
                  });
                }
              }}
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              Failed to load audio URL
            </div>
          )}
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
                  // Sort by actual scene number from metadata (preferred) or fallback to sceneId
                  const getSceneNumber = (file: MediaFile): number => {
                    // First try sceneNumber from metadata
                    if (file.metadata?.sceneNumber !== undefined && file.metadata?.sceneNumber !== null) {
                      return Number(file.metadata.sceneNumber);
                    }
                    // Fallback: extract number from sceneId (e.g., "scene-3" -> 3)
                    const sceneIdMatch = file.metadata?.sceneId?.match(/\d+/);
                    if (sceneIdMatch && sceneIdMatch[0]) {
                      return parseInt(sceneIdMatch[0], 10);
                    }
                    // Last resort: try to extract from fileName
                    const fileNameMatch = file.fileName.match(/scene[_-]?(\d+)/i);
                    if (fileNameMatch && fileNameMatch[1]) {
                      return parseInt(fileNameMatch[1], 10);
                    }
                    return 999999; // Put items without scene numbers at the end
                  };
                  
                  const aSceneNum = getSceneNumber(a);
                  const bSceneNum = getSceneNumber(b);
                  return aSceneNum - bSceneNum;
                })
                .map((sceneFile) => {
                  const sceneHeading = sceneFile.metadata?.heading || sceneFile.fileName.replace('.mp3', '');
                  // Use actual scene number from metadata (stored by backend)
                  const sceneNumber = sceneFile.metadata?.sceneNumber;
                  const sceneDuration = sceneFile.metadata?.duration as number | undefined;
                  const displayName = sceneNumber !== undefined
                    ? `Scene ${sceneNumber}: ${sceneHeading}`
                    : sceneHeading;
                  const durationText = sceneDuration ? ` (${formatDuration(sceneDuration)})` : '';
                  
                  const sceneId = `${reading.id}-${sceneFile.id}`;
                  const isScenePlaying = playingSceneId === sceneId;
                  
                  return (
                    <SceneAudioPlayer
                      key={sceneFile.id}
                      sceneFile={sceneFile}
                      sceneId={sceneId}
                      readingId={reading.id}
                      displayName={displayName}
                      durationText={durationText}
                      isPlaying={isScenePlaying}
                      onPlayPause={() => onScenePlayPause(sceneFile)}
                      onDownload={() => onDownloadScene(sceneFile)}
                      audioRef={(id: string, audio: HTMLAudioElement | null) => sceneAudioRef(id, audio)}
                      getToken={getToken}
                    />
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Scene Audio Player Component
interface SceneAudioPlayerProps {
  sceneFile: MediaFile;
  sceneId: string;
  readingId: string;
  displayName: string;
  durationText: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
  audioRef: (sceneId: string, audio: HTMLAudioElement | null) => void;
  getToken: any;
}

function SceneAudioPlayer({
  sceneFile,
  sceneId,
  readingId,
  displayName,
  durationText,
  isPlaying,
  onPlayPause,
  onDownload,
  audioRef,
  getToken
}: SceneAudioPlayerProps) {
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Fetch presigned URL for scene audio playback
  useEffect(() => {
    if (!isPlaying || !sceneFile) {
      setAudioUrl(null);
      setIsLoadingAudio(false);
      return;
    }

    const fetchAudioUrl = async () => {
      setIsLoadingAudio(true);
      try {
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        let downloadUrl: string | undefined = undefined;

        // If we have an s3Key, try to fetch a fresh presigned URL
        if (sceneFile.s3Key && (sceneFile.storageType === 'local' || sceneFile.storageType === 'wryda-temp' || !sceneFile.storageType)) {
          try {
            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
              console.error('[SceneAudioPlayer] Not authenticated');
              toast.error('Not authenticated', { description: 'Please sign in to play audio' });
              setIsLoadingAudio(false);
              return;
            }
            
            console.log('[SceneAudioPlayer] Requesting presigned URL for s3Key:', {
              s3Key: sceneFile.s3Key,
              s3KeyLength: sceneFile.s3Key?.length,
              startsWithMedia: sceneFile.s3Key?.startsWith('media/'),
              firstChars: sceneFile.s3Key?.substring(0, 50),
              sceneFileId: sceneFile.id,
              fileName: sceneFile.fileName
            });
            
            const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key: sceneFile.s3Key,
                expiresIn: 86400 * 7, // 7 days
              }),
            });
            
            if (!presignedResponse.ok) {
              const errorText = await presignedResponse.text();
              console.error('[SceneAudioPlayer] Presigned URL failed:', presignedResponse.status, errorText);
              toast.error('Failed to load audio', { 
                description: `Server returned ${presignedResponse.status}. Please try again.` 
              });
              setIsLoadingAudio(false);
              return;
            }
            
            const presignedData = await presignedResponse.json();
            downloadUrl = presignedData.downloadUrl;
          } catch (error: any) {
            console.error('[SceneAudioPlayer] Failed to get presigned URL:', error);
            toast.error('Failed to load audio', { 
              description: error.message || 'Unable to generate secure download link' 
            });
            setIsLoadingAudio(false);
            return;
          }
        } else if (sceneFile.storageType === 'google-drive' || sceneFile.storageType === 'dropbox') {
          // For cloud storage files, get download URL from backend
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) {
            console.error('[SceneAudioPlayer] Not authenticated');
            toast.error('Not authenticated', { description: 'Please sign in to play audio' });
            setIsLoadingAudio(false);
            return;
          }
          
          const response = await fetch(`${BACKEND_API_URL}/api/storage/download/${sceneFile.storageType}/${sceneFile.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            downloadUrl = data.downloadUrl;
          } else {
            console.error('[SceneAudioPlayer] Failed to get cloud storage download URL');
            toast.error('Failed to load audio', { 
              description: `Server returned ${response.status}` 
            });
            setIsLoadingAudio(false);
            return;
          }
        } else {
          console.error('[SceneAudioPlayer] Unsupported storage type:', sceneFile.storageType);
          toast.error('Unsupported storage type', { 
            description: 'This file cannot be played in the browser' 
          });
          setIsLoadingAudio(false);
          return;
        }

        if (downloadUrl) {
          setAudioUrl(downloadUrl);
          console.log('[SceneAudioPlayer] ✅ Audio URL loaded:', downloadUrl.substring(0, 100));
        }
      } catch (error: any) {
        console.error('[SceneAudioPlayer] Failed to fetch audio URL:', error);
        toast.error('Failed to load audio', { 
          description: error.message || 'Unknown error occurred' 
        });
      } finally {
        setIsLoadingAudio(false);
      }
    };

    fetchAudioUrl();
  }, [isPlaying, sceneFile, getToken]);

  // Handle audio playback
  useEffect(() => {
    if (!audioElementRef.current || !audioUrl || !isPlaying) return;

    const audio = audioElementRef.current;
    
    // Auto-play when URL is ready
    const playAudio = async () => {
      try {
        await audio.play();
        console.log('[SceneAudioPlayer] ✅ Audio playback started');
      } catch (playError: any) {
        console.error('[SceneAudioPlayer] Failed to auto-play:', playError);
        // Browser may block autoplay - user can click play button
      }
    };

    // Register audio element with parent
    audioRef(sceneId, audio);

    // Wait for canplay event
    const handleCanPlay = () => {
      console.log('[SceneAudioPlayer] ✅ Audio can play, duration:', audio.duration);
      playAudio();
    };

    const handleCanPlayThrough = () => {
      console.log('[SceneAudioPlayer] ✅ Audio can play through (fully loaded)');
    };

    const handleError = (e: Event) => {
      console.error('[SceneAudioPlayer] Audio playback error:', e);
      const error = audio.error;
      if (error) {
        console.error('[SceneAudioPlayer] Error code:', error.code);
        console.error('[SceneAudioPlayer] Error message:', error.message);
      }
    };

    const handleEnded = () => {
      // Auto-pause when scene finishes
      audioRef(sceneId, null);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audioRef(sceneId, null); // Unregister on cleanup
    };
  }, [audioUrl, isPlaying, sceneId, audioRef]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 p-1 bg-[#2A2A2A] rounded">
        <span className="text-xs text-gray-300 truncate flex-1">
          {displayName}{durationText}
        </span>
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={onPlayPause}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
            title={isPlaying ? `Pause ${displayName}` : `Play ${displayName}`}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
            title={`Download ${displayName}`}
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Audio Player (only show when playing) */}
      {isPlaying && sceneFile && (
        <div className="ml-2">
          {isLoadingAudio ? (
            <div className="flex items-center justify-center py-2 text-gray-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
              Loading audio...
            </div>
          ) : audioUrl ? (
            <audio
              ref={audioElementRef}
              src={audioUrl}
              controls
              preload="metadata"
              crossOrigin="anonymous"
              className="w-full"
              onError={(e) => {
                console.error('[SceneAudioPlayer] Audio element error:', e);
                const audio = e.currentTarget;
                const error = audio.error;
                if (error) {
                  console.error('[SceneAudioPlayer] Error code:', error.code);
                  console.error('[SceneAudioPlayer] Error message:', error.message);
                  
                  let errorMsg = 'Failed to load audio';
                  if (error.code === 3) {
                    errorMsg = 'Audio decode error. The file may have encoding issues. Try downloading instead.';
                  } else if (error.code === 4) {
                    errorMsg = 'Audio source not supported or URL expired. Try refreshing the page.';
                  }
                  
                  toast.error('Playback error', { 
                    description: errorMsg
                  });
                } else {
                  toast.error('Failed to load audio', { 
                    description: 'The audio file may be corrupted or the URL expired. Try refreshing the page.' 
                  });
                }
              }}
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="text-center py-2 text-gray-400 text-xs">
              Failed to load audio URL
            </div>
          )}
        </div>
      )}
    </div>
  );
}

