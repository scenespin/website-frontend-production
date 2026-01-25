'use client';

/**
 * Scene Card Component
 * 
 * Displays a single scene with its videos in a storyboard-style layout.
 * Shows full stitched scene (if available) and individual shots.
 */

import React, { useState } from 'react';
import { Play, Info, Download, ChevronDown, ChevronUp, Film } from 'lucide-react';
import { toast } from 'sonner';
import { ShotThumbnail } from './ShotThumbnail';
import { ScenePlaylistPlayer } from './ScenePlaylistPlayer';
import { useDeleteMedia } from '@/hooks/useMediaLibrary';
import type { SceneVideo } from '@/hooks/useScenes';

interface SceneCardProps {
  scene: {
    id?: string;
    number: number;
    heading: string;
    synopsis?: string;
    videos: SceneVideo['videos'] | null;
  };
  presignedUrls?: Map<string, string>;
  onViewMetadata?: (metadata: any) => void;
  screenplayId?: string;
}

export function SceneCard({ scene, presignedUrls, onViewMetadata, screenplayId }: SceneCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // Delete media mutation
  const deleteMedia = useDeleteMedia(screenplayId || '');

  const hasVideos = scene.videos && (
    scene.videos.shots && scene.videos.shots.length > 0
  );

  const getPresignedUrl = (s3Key: string | undefined): string | undefined => {
    if (!s3Key || !presignedUrls) return undefined;
    return presignedUrls.get(s3Key);
  };

  const handleDownload = async (s3Key: string, fileName: string) => {
    try {
      const url = getPresignedUrl(s3Key);
      if (!url) {
        toast.error('Unable to generate download URL');
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Download started');
    } catch (error: any) {
      console.error('[SceneCard] Download failed:', error);
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteMedia.mutateAsync(fileId);
      toast.success('Shot deleted successfully');
    } catch (error: any) {
      console.error('[SceneCard] Delete failed:', error);
      toast.error(`Failed to delete shot: ${error.message}`);
    }
  };

  return (
    <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
      {/* Scene Header */}
      <div 
        className="px-4 py-3 border-b border-[#3F3F46] cursor-pointer hover:bg-[#1A1A1A] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#DC143C] flex items-center justify-center text-white text-sm font-semibold">
                {scene.number}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#FFFFFF]">{scene.heading}</h3>
                {scene.synopsis && (
                  <p className="text-xs text-[#808080] mt-0.5 line-clamp-1">{scene.synopsis}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasVideos && (() => {
              const shots = scene.videos?.shots || [];
              const uniqueShotNumbers = new Set(shots.map(s => s.shotNumber));
              const totalVariations = shots.length;
              const uniqueShots = uniqueShotNumbers.size;
              return (
                <span className="text-xs text-[#808080]" title={`${totalVariations} variation${totalVariations !== 1 ? 's' : ''} across ${uniqueShots} shot${uniqueShots !== 1 ? 's' : ''}`}>
                  {uniqueShots} shot{uniqueShots !== 1 ? 's' : ''} ({totalVariations} variation{totalVariations !== 1 ? 's' : ''})
                </span>
              );
            })()}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#808080]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#808080]" />
            )}
          </div>
        </div>
      </div>

      {/* Scene Content */}
      {isExpanded && hasVideos && (
        <div className="p-4 space-y-4">
          {/* Watch Scene Button - Opens playlist player */}
          {scene.videos?.shots && scene.videos.shots.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setShowPlaylist(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#DC143C] hover:bg-[#B0111E] text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Watch Scene
              </button>
            </div>
          )}

          {/* Individual Shots */}
          {scene.videos?.shots && scene.videos.shots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-4 h-4 text-[#808080]" />
                <h4 className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-wide">
                  Individual Shots
                </h4>
              </div>
              {(() => {
                // 🔥 DEBUG: Log what shots are being rendered
                console.log(`[SceneCard] 🎬 Rendering scene ${scene.number}:`, {
                  sceneId: scene.id,
                  sceneNumber: scene.number,
                  totalShots: scene.videos.shots.length,
                  shots: scene.videos.shots.map((shot, idx) => ({
                    index: idx,
                    shotNumber: shot.shotNumber,
                    fileId: shot.video.id,
                    fileName: shot.video.fileName,
                    timestamp: shot.timestamp,
                    s3Key: shot.video.s3Key?.substring(0, 50),
                    hasPresignedUrl: !!getPresignedUrl(shot.video.s3Key)
                  }))
                });
                return null;
              })()}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {scene.videos.shots.map((shot, index) => (
                  <ShotThumbnail
                    key={`${shot.video.id}-${shot.shotNumber}-${shot.timestamp || index}`}
                    shot={shot}
                    presignedUrl={getPresignedUrl(shot.video.s3Key)}
                    onDownload={() => handleDownload(
                      shot.video.s3Key || '',
                      `Scene_${scene.number}_Shot_${shot.shotNumber}.mp4`
                    )}
                    onViewMetadata={() => onViewMetadata?.(shot.metadata)}
                    onRegenerate={(shot) => {
                      // TODO: Implement regeneration API call
                      console.log('[SceneCard] Regenerate shot:', shot);
                    }}
                    onReshoot={(shot) => {
                      // TODO: Implement reshoot (opens Scene Builder wizard)
                      console.log('[SceneCard] Reshoot shot:', shot);
                    }}
                    onDelete={handleDelete}
                    screenplayId={screenplayId}
                    sceneId={scene.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && !hasVideos && (
        <div className="p-8 text-center">
          <Film className="w-8 h-8 text-[#808080] mx-auto mb-2" />
          <p className="text-sm text-[#808080]">No videos generated for this scene yet</p>
        </div>
      )}

      {/* Playlist Player Modal */}
      {showPlaylist && scene.videos && (
        <ScenePlaylistPlayer
          scene={{
            id: scene.id,
            number: scene.number,
            heading: scene.heading,
            videos: scene.videos,
          }}
          presignedUrls={presignedUrls || new Map()}
          onClose={() => setShowPlaylist(false)}
          screenplayId={screenplayId}
        />
      )}
    </div>
  );
}

