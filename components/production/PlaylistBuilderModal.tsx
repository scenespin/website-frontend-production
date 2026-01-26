'use client';

/**
 * Playlist Builder Modal
 * 
 * Comprehensive video playlist builder with drag-and-drop, trimming, and playlist management.
 * Feature 0209: Video Playlist Builder and Editor
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Play, Save, FileText, Trash2, GripVertical, Scissors, Search, Check, Plus, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GlassModal } from '@/components/ui/glass-modal';
import { useCreatePlaylist, useUpdatePlaylist, useDeletePlaylist, useScenePlaylists, usePlaylistTemplates, useDuplicatePlaylist, exportPlaylistAsJSON } from '@/hooks/usePlaylists';
import { useAuth } from '@clerk/nextjs';
import type { PlaylistShot, Playlist } from '@/types/playlist';
import type { SceneVideo } from '@/hooks/useScenes';

interface PlaylistBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: {
    id?: string;
    number: number;
    heading: string;
    videos: SceneVideo['videos'];
  };
  presignedUrls: Map<string, string>;
  onPlay: (playlist: PlaylistShot[]) => void;
  screenplayId: string;
  initialPlaylist?: PlaylistShot[];
}

interface PlaylistItemProps {
  shot: PlaylistShot;
  presignedUrl?: string;
  onRemove: () => void;
  onTrimChange: (trimStart: number, trimEnd: number) => void;
  duration?: number;
}

function PlaylistItem({ shot, presignedUrl, onRemove, onTrimChange, duration }: PlaylistItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: shot.fileId });
  const [trimStart, setTrimStart] = useState(shot.trimStart || 0);
  const [trimEnd, setTrimEnd] = useState(shot.trimEnd || duration || 5);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const trimmedDuration = Math.max(0, trimEnd - trimStart);

  const handleTrimStartChange = (value: number) => {
    const newStart = Math.max(0, Math.min(value, trimEnd - 0.1));
    setTrimStart(newStart);
    onTrimChange(newStart, trimEnd);
  };

  const handleTrimEndChange = (value: number) => {
    const maxEnd = duration || 10;
    const newEnd = Math.max(trimStart + 0.1, Math.min(value, maxEnd));
    setTrimEnd(newEnd);
    onTrimChange(trimStart, newEnd);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#1A1A1A] border border-[#3F3F46] rounded-lg p-3 flex items-center gap-3 group hover:border-[#DC143C]/50 transition-colors"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#808080] hover:text-[#FFFFFF] transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Thumbnail */}
      <div className="w-20 h-12 bg-[#0A0A0A] rounded border border-[#3F3F46] overflow-hidden flex-shrink-0">
        {presignedUrl ? (
          <video
            src={presignedUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#808080]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-[#DC143C]">Shot {shot.shotNumber}</span>
          {shot.fileName && (
            <span className="text-xs text-[#808080] truncate">{shot.fileName}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-[#808080]">
          <span>Duration: {trimmedDuration.toFixed(1)}s</span>
          {duration && <span>Full: {duration.toFixed(1)}s</span>}
        </div>
      </div>

      {/* Trim Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Scissors className="w-4 h-4 text-[#808080]" />
          <input
            type="number"
            step="0.1"
            min="0"
            max={duration || 10}
            value={trimStart.toFixed(1)}
            onChange={(e) => handleTrimStartChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-xs bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
            placeholder="Start"
          />
          <span className="text-xs text-[#808080]">-</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max={duration || 10}
            value={trimEnd.toFixed(1)}
            onChange={(e) => handleTrimEndChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-xs bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
            placeholder="End"
          />
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 text-[#808080] hover:text-[#DC143C] hover:bg-[#DC143C]/10 rounded transition-colors opacity-0 group-hover:opacity-100"
        title="Remove from playlist"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PlaylistBuilderModal({
  isOpen,
  onClose,
  scene,
  presignedUrls,
  onPlay,
  screenplayId,
  initialPlaylist,
}: PlaylistBuilderModalProps) {
  const { getToken } = useAuth();
  const sceneId = scene.id || `scene-${scene.number}`;
  
  // State
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [playlist, setPlaylist] = useState<PlaylistShot[]>([]);
  const [playlistName, setPlaylistName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Hooks
  const createPlaylist = useCreatePlaylist(screenplayId);
  const updatePlaylist = useUpdatePlaylist(screenplayId);
  const deletePlaylist = useDeletePlaylist(screenplayId);
  const duplicatePlaylist = useDuplicatePlaylist(screenplayId);
  const { data: savedPlaylists = [] } = useScenePlaylists(screenplayId, sceneId, isOpen);
  const { data: templates = [] } = usePlaylistTemplates(screenplayId, isOpen);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Available videos from scene
  const availableVideos = useMemo(() => {
    return scene.videos?.shots || [];
  }, [scene.videos]);

  // Filter videos by search
  const filteredVideos = useMemo(() => {
    if (!searchQuery) return availableVideos;
    const query = searchQuery.toLowerCase();
    return availableVideos.filter(video => {
      const fileName = video.video.fileName?.toLowerCase() || '';
      const shotNumber = video.shotNumber?.toString() || '';
      return fileName.includes(query) || shotNumber.includes(query);
    });
  }, [availableVideos, searchQuery]);

  // Initialize playlist from initialPlaylist or saved playlist
  useEffect(() => {
    if (isOpen && initialPlaylist && initialPlaylist.length > 0) {
      setPlaylist(initialPlaylist);
      setSelectedVideoIds(new Set(initialPlaylist.map(s => s.fileId)));
    } else if (isOpen && selectedPlaylistId) {
      const saved = savedPlaylists.find(p => p.playlistId === selectedPlaylistId);
      if (saved) {
        setPlaylist(saved.shots);
        setSelectedVideoIds(new Set(saved.shots.map(s => s.fileId)));
        setPlaylistName(saved.playlistName || '');
      }
    } else if (isOpen) {
      // Reset on open
      setPlaylist([]);
      setSelectedVideoIds(new Set());
      setPlaylistName('');
      setSelectedPlaylistId(null);
    }
  }, [isOpen, initialPlaylist, selectedPlaylistId, savedPlaylists]);

  // Handle video selection
  const handleVideoToggle = useCallback((fileId: string, video: any) => {
    setSelectedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        // Remove from playlist
        next.delete(fileId);
        setPlaylist(prev => prev.filter(s => s.fileId !== fileId));
      } else {
        // Add to playlist
        next.add(fileId);
        const newShot: PlaylistShot = {
          fileId,
          s3Key: video.video.s3Key || '',
          shotNumber: video.shotNumber || 0,
          trimStart: 0,
          trimEnd: video.duration || 5,
          order: playlist.length,
          fileName: video.video.fileName,
          duration: video.duration,
          timestamp: video.timestamp,
        };
        setPlaylist(prev => [...prev, newShot]);
      }
      return next;
    });
  }, [playlist.length]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPlaylist(items => {
      const oldIndex = items.findIndex(item => item.fileId === active.id);
      const newIndex = items.findIndex(item => item.fileId === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      // Update order property
      return newItems.map((item, index) => ({ ...item, order: index }));
    });
  };

  // Handle trim change
  const handleTrimChange = useCallback((fileId: string, trimStart: number, trimEnd: number) => {
    setPlaylist(prev => prev.map(shot => 
      shot.fileId === fileId 
        ? { ...shot, trimStart, trimEnd }
        : shot
    ));
  }, []);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return playlist.reduce((sum, shot) => {
      const duration = (shot.trimEnd || shot.duration || 0) - (shot.trimStart || 0);
      return sum + Math.max(0, duration);
    }, 0);
  }, [playlist]);

  // Handle save
  const handleSave = async () => {
    if (playlist.length === 0) {
      toast.error('Playlist is empty');
      return;
    }

    try {
      if (selectedPlaylistId) {
        // Update existing
        await updatePlaylist.mutateAsync({
          playlistId: selectedPlaylistId,
          updates: {
            playlistName: playlistName || null,
            shots: playlist,
          },
        });
      } else {
        // Create new
        await createPlaylist.mutateAsync({
          sceneId,
          playlistName: playlistName || null,
          isTemplate: false,
          shots: playlist,
        });
      }
      toast.success('Playlist saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save playlist');
    }
  };

  // Handle save as template
  const handleSaveAsTemplate = async () => {
    if (playlist.length === 0) {
      toast.error('Playlist is empty');
      return;
    }

    try {
      await createPlaylist.mutateAsync({
        sceneId: null,
        playlistName: playlistName || 'Untitled Template',
        isTemplate: true,
        shots: playlist,
      });
      toast.success('Template saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    }
  };

  // Handle load playlist
  const handleLoadPlaylist = (playlistId: string) => {
    const saved = savedPlaylists.find(p => p.playlistId === playlistId);
    if (saved) {
      setSelectedPlaylistId(playlistId);
      setPlaylist(saved.shots);
      setSelectedVideoIds(new Set(saved.shots.map(s => s.fileId)));
      setPlaylistName(saved.playlistName || '');
    }
  };

  // Handle apply template
  const handleApplyTemplate = (template: Playlist) => {
    // Map template shots to scene videos by shotNumber
    const mappedShots: PlaylistShot[] = [];
    template.shots.forEach(templateShot => {
      const matchingVideo = availableVideos.find(v => v.shotNumber === templateShot.shotNumber);
      if (matchingVideo && matchingVideo.video.s3Key) {
        mappedShots.push({
          ...templateShot,
          fileId: matchingVideo.video.id,
          s3Key: matchingVideo.video.s3Key,
          fileName: matchingVideo.video.fileName,
          duration: matchingVideo.duration,
          timestamp: matchingVideo.timestamp,
        });
      }
    });
    
    if (mappedShots.length > 0) {
      setPlaylist(mappedShots);
      setSelectedVideoIds(new Set(mappedShots.map(s => s.fileId)));
      setPlaylistName(`${template.playlistName || 'Template'} (Applied)`);
      toast.success(`Applied template: ${template.playlistName || 'Untitled'}`);
    } else {
      toast.warning('No matching videos found for this template');
    }
  };

  // Handle export
  const handleExport = async () => {
    if (playlist.length === 0) {
      toast.error('Playlist is empty');
      return;
    }

    if (selectedPlaylistId) {
      try {
        await exportPlaylistAsJSON(screenplayId, selectedPlaylistId, getToken);
        toast.success('Playlist exported successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to export playlist');
      }
    } else {
      // Export current playlist as JSON
      const exportData = {
        playlistName: playlistName || 'Untitled Playlist',
        sceneId,
        sceneNumber: scene.number,
        createdAt: new Date().toISOString(),
        shots: playlist,
        metadata: {
          totalDuration,
          videoCount: playlist.length,
        },
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playlist_${playlistName || 'untitled'}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Playlist exported successfully');
    }
  };

  if (!isOpen) return null;

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Build Playlist - Scene ${scene.number}`}
      maxWidth="6xl"
      variant="dark"
    >
      <div className="flex flex-col h-[calc(90vh-100px)]">
        {/* Header with Playlist Name and Actions */}
        <div className="px-6 py-4 border-b border-[#3F3F46] bg-[#1A1A1A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist name (optional)"
              className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] placeholder-[#808080] focus:border-[#DC143C] focus:outline-none flex-1 max-w-xs"
            />
            <div className="flex items-center gap-2 text-sm text-[#808080]">
              <span>{playlist.length} video{playlist.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{totalDuration.toFixed(1)}s total</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Load Saved Playlist */}
            {savedPlaylists.length > 0 && (
              <select
                value={selectedPlaylistId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleLoadPlaylist(e.target.value);
                  } else {
                    setSelectedPlaylistId(null);
                    setPlaylist([]);
                    setSelectedVideoIds(new Set());
                    setPlaylistName('');
                  }
                }}
                className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
              >
                <option value="">New Playlist</option>
                {savedPlaylists.map(p => (
                  <option key={p.playlistId} value={p.playlistId}>
                    {p.playlistName || `Playlist ${p.playlistId.slice(-8)}`}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] hover:border-[#DC143C] transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Templates
            </button>
          </div>
        </div>

        {/* Templates Dropdown */}
        {showTemplates && (
          <div className="px-6 py-3 border-b border-[#3F3F46] bg-[#141414] max-h-40 overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-sm text-[#808080]">No templates available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {templates.map(template => (
                  <button
                    key={template.playlistId}
                    onClick={() => handleApplyTemplate(template)}
                    className="px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] hover:border-[#DC143C] transition-colors text-left"
                  >
                    {template.playlistName || 'Untitled Template'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Available Videos */}
          <div className="w-2/5 border-r border-[#3F3F46] flex flex-col bg-[#141414]">
            <div className="px-4 py-3 border-b border-[#3F3F46]">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-[#808080]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="flex-1 px-2 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] placeholder-[#808080] focus:border-[#DC143C] focus:outline-none"
                />
              </div>
              <p className="text-xs text-[#808080]">
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredVideos.map((video) => {
                  const fileId = video.video.id;
                  const isSelected = selectedVideoIds.has(fileId);
                  const presignedUrl = video.video.s3Key ? presignedUrls.get(video.video.s3Key) : undefined;
                  
                  return (
                    <div
                      key={fileId}
                      className={`relative bg-[#1A1A1A] border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                          : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                      }`}
                      onClick={() => handleVideoToggle(fileId, video)}
                    >
                      <div className="aspect-video bg-[#0A0A0A] flex items-center justify-center">
                        {presignedUrl ? (
                          <video
                            src={presignedUrl}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-[#808080]" />
                        )}
                      </div>
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#DC143C]">Shot {video.shotNumber}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#DC143C]" />
                          )}
                        </div>
                        {video.video.fileName && (
                          <p className="text-xs text-[#808080] truncate mt-1">{video.video.fileName}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Playlist */}
          <div className="flex-1 flex flex-col bg-[#0A0A0A]">
            <div className="px-4 py-3 border-b border-[#3F3F46]">
              <h3 className="text-sm font-semibold text-[#FFFFFF]">Playlist</h3>
              <p className="text-xs text-[#808080] mt-1">
                Drag to reorder • Click trim controls to adjust
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {playlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-12 h-12 text-[#808080] mb-3" />
                  <p className="text-sm text-[#808080]">No videos in playlist</p>
                  <p className="text-xs text-[#808080] mt-1">Select videos from the left panel</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={playlist.map(s => s.fileId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {playlist.map((shot) => {
                        const presignedUrl = shot.s3Key ? presignedUrls.get(shot.s3Key) : undefined;
                        return (
                          <PlaylistItem
                            key={shot.fileId}
                            shot={shot}
                            presignedUrl={presignedUrl}
                            onRemove={() => handleVideoToggle(shot.fileId, { video: { id: shot.fileId } })}
                            onTrimChange={(start, end) => handleTrimChange(shot.fileId, start, end)}
                            duration={shot.duration}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#3F3F46] bg-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={playlist.length === 0}
              className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] hover:border-[#DC143C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {selectedPlaylistId && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this playlist?')) {
                    try {
                      await deletePlaylist.mutateAsync({ playlistId: selectedPlaylistId, sceneId });
                      setSelectedPlaylistId(null);
                      setPlaylist([]);
                      setSelectedVideoIds(new Set());
                      setPlaylistName('');
                      toast.success('Playlist deleted');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to delete playlist');
                    }
                  }
                }}
                className="px-3 py-2 bg-[#0A0A0A] border border-[#DC143C]/50 rounded text-sm text-[#DC143C] hover:bg-[#DC143C]/10 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] hover:border-[#808080] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAsTemplate}
              disabled={playlist.length === 0}
              className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] hover:border-[#DC143C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Save as Template
            </button>
            <button
              onClick={handleSave}
              disabled={playlist.length === 0}
              className="px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#FFFFFF] hover:border-[#DC143C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Playlist
            </button>
            <button
              onClick={() => {
                if (playlist.length === 0) {
                  toast.error('Playlist is empty');
                  return;
                }
                onPlay(playlist);
                onClose();
              }}
              disabled={playlist.length === 0}
              className="px-4 py-2 bg-[#DC143C] rounded text-sm text-white hover:bg-[#DC143C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Play
            </button>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
