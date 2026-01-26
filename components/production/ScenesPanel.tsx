'use client';

/**
 * Scenes Panel - Storyboard View
 * 
 * Displays scene videos in a storyboard-style layout.
 * Shows full stitched scenes and individual shots organized by scene number.
 * 
 * Feature 0170: Media Versioning & Scene Organization
 */

import React, { useState, useMemo } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useScenes, useSceneVideos, type SceneVideo } from '@/hooks/useScenes';
import { useBulkPresignedUrls, useMediaFiles, useMediaFolderTree } from '@/hooks/useMediaLibrary';
import { useQueryClient } from '@tanstack/react-query';
import { Film, Loader2, Play, Info, Download, RefreshCw, Folder, Grid } from 'lucide-react';
import { toast } from 'sonner';
import { SceneCard } from './SceneCard';
import { SceneMetadataModal } from './SceneMetadataModal';
import { FolderTreeSidebar } from './FolderTreeSidebar';

interface ScenesPanelProps {
  className?: string;
}

export function ScenesPanel({ className = '' }: ScenesPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const queryClient = useQueryClient();
  
  // 🔥 FIX: Add view mode toggle (Scene View vs Folder View)
  const [viewMode, setViewMode] = useState<'scenes' | 'folders'>('scenes');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string[]>([]);
  const [selectedStorageType, setSelectedStorageType] = useState<'s3' | 'cloud'>('s3');
  const [hasAutoSelectedScenes, setHasAutoSelectedScenes] = useState(false);

  // Fetch scenes and scene videos
  const { data: scenes = [], isLoading: scenesLoading } = useScenes(screenplayId || '', !!screenplayId);
  const { data: sceneVideos = [], isLoading: videosLoading } = useSceneVideos(screenplayId || '', !!screenplayId);
  
  // 🔥 FIX: Fetch folder tree to find Scenes folder
  const { data: folderTree = [] } = useMediaFolderTree(screenplayId || '', viewMode === 'folders' && !!screenplayId);
  
  // 🔥 FIX: Auto-select Scenes folder when folder view is first opened
  React.useEffect(() => {
    if (viewMode === 'folders' && !hasAutoSelectedScenes && folderTree.length > 0 && !selectedFolderId) {
      // Find Scenes folder in the tree
      const findScenesFolder = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.folderName === 'Scenes' || node.folderPath?.[0] === 'Scenes') {
            return node;
          }
          if (node.children) {
            const found = findScenesFolder(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const scenesFolder = findScenesFolder(folderTree);
      if (scenesFolder) {
        setSelectedFolderId(scenesFolder.folderId);
        setSelectedFolderPath(scenesFolder.folderPath || ['Scenes']);
        setSelectedStorageType('s3');
        setHasAutoSelectedScenes(true);
      }
    }
  }, [viewMode, folderTree, hasAutoSelectedScenes, selectedFolderId]);
  
  // Reset auto-select flag when switching back to scenes view
  React.useEffect(() => {
    if (viewMode === 'scenes') {
      setHasAutoSelectedScenes(false);
    }
  }, [viewMode]);

  // 🔥 FIX: Fetch folder files when in folder view
  // If no folder selected, show all videos (includeAllFolders = true)
  const { data: folderFiles = [], isLoading: folderFilesLoading } = useMediaFiles(
    screenplayId || '',
    selectedFolderId || undefined,
    viewMode === 'folders' && !!screenplayId,
    !selectedFolderId, // includeAllFolders: true if no folder selected (show all), false if folder selected (show only that folder)
    undefined, // entityType - show all files in folder view
    undefined  // entityId
  );

  // 🔥 FIX: Manual refresh function to force refetch of scene videos
  const handleRefresh = () => {
    if (screenplayId) {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ queryKey: ['scenes', screenplayId] });
      toast.success('Refreshing storyboard...');
    }
  };
  
  // 🔥 FIX: Handle folder selection
  const handleFolderSelect = (folderId: string, path: string[], storageType: 's3' | 'cloud') => {
    setSelectedFolderId(folderId || null);
    setSelectedFolderPath(path);
    setSelectedStorageType(storageType);
  };
  
  // 🔥 FIX: Filter folder files to show only videos
  const folderVideos = useMemo(() => {
    if (viewMode !== 'folders') return [];
    return folderFiles.filter(file => {
      const isVideo = (file as any).mediaFileType === 'video' || 
                      file.fileType === 'video' || 
                      (typeof file.fileType === 'string' && file.fileType.startsWith('video/'));
      return isVideo;
    });
  }, [folderFiles, viewMode]);
  
  // 🔥 FIX: Collect S3 keys for folder videos
  const folderS3Keys = useMemo(() => {
    return folderVideos.map(f => f.s3Key).filter(Boolean) as string[];
  }, [folderVideos]);
  
  const { data: folderPresignedUrls } = useBulkPresignedUrls(
    folderS3Keys,
    viewMode === 'folders' && folderS3Keys.length > 0
  );

  // 🔥 DEBUG: Log data for troubleshooting
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always expose debug function (even if data not loaded yet)
      (window as any).debugStoryboard = () => {
        console.log('=== STORYBOARD DEBUG ===');
        console.log('Screenplay ID:', screenplayId);
        console.log('Scenes:', scenes);
        console.log('Scene Videos:', sceneVideos);
        console.log('Scenes with videos:', sceneVideos.filter(sv => sv.videos.shots.length > 0));
        console.log('Is Loading:', videosLoading || scenesLoading);
        return { screenplayId, scenes, sceneVideos, isLoading: videosLoading || scenesLoading };
      };
    }
    
    if (!videosLoading && !scenesLoading && screenplayId) {
      console.log('[ScenesPanel] 📊 Storyboard Data:', {
        screenplayId,
        scenesCount: scenes.length,
        sceneVideosCount: sceneVideos.length,
        scenesWithVideos: sceneVideos.filter(sv => sv.videos.shots.length > 0).length,
        sceneVideosDetails: sceneVideos.map(sv => ({
          sceneId: sv.sceneId,
          sceneNumber: sv.sceneNumber,
          sceneHeading: sv.sceneHeading,
          shotsCount: sv.videos.shots.length,
          shots: sv.videos.shots.map(s => ({
            shotNumber: s.shotNumber,
            fileName: s.video.fileName,
            hasS3Key: !!s.video.s3Key,
            metadata: s.metadata
          }))
        }))
      });
      console.log('[ScenesPanel] 🔧 Debug function available: window.debugStoryboard()');
    }
  }, [screenplayId, scenes, sceneVideos, videosLoading, scenesLoading]);

  // Merge scene data with video data
  const scenesWithVideos = useMemo(() => {
    const sceneMap = new Map<number, any>();
    
    // Add all scenes from screenplay
    scenes.forEach(scene => {
      sceneMap.set(scene.number, {
        ...scene,
        videos: null,
      });
    });

    // Add video data
    sceneVideos.forEach(sceneVideo => {
      const existing = sceneMap.get(sceneVideo.sceneNumber);
      if (existing) {
        existing.videos = sceneVideo.videos;
      } else {
        // Scene has videos but not in screenplay (edge case)
        sceneMap.set(sceneVideo.sceneNumber, {
          id: sceneVideo.sceneId,
          number: sceneVideo.sceneNumber,
          heading: sceneVideo.sceneHeading,
          videos: sceneVideo.videos,
        });
      }
    });

    const result = Array.from(sceneMap.values())
      .sort((a, b) => a.number - b.number);
    
    // 🔥 DEBUG: Log merged scenes
    console.log('[ScenesPanel] 🔍 Merged scenes:', {
      totalScenes: scenes.length,
      totalSceneVideos: sceneVideos.length,
      mergedCount: result.length,
      sceneNumbers: result.map(s => s.number),
      scenesWithVideos: result.filter(s => s.videos?.shots?.length > 0).length
    });
    
    return result;
  }, [scenes, sceneVideos]);

  // Collect all S3 keys for bulk presigned URL generation
  const allS3Keys = useMemo(() => {
    const keys: string[] = [];
    sceneVideos.forEach(sceneVideo => {
      // Note: fullScene is no longer part of SceneVideo structure (stitched videos are on-demand)
      sceneVideo.videos.shots.forEach(shot => {
        if (shot.video.s3Key) {
          keys.push(shot.video.s3Key);
        }
        // Note: firstFrame is not part of the shot structure in SceneVideo
      });
    });
    return keys;
  }, [sceneVideos]);

  const { data: presignedUrls } = useBulkPresignedUrls(
    allS3Keys,
    allS3Keys.length > 0
  );

  const isLoading = viewMode === 'scenes' 
    ? (scenesLoading || videosLoading)
    : folderFilesLoading;

  // State for metadata modal
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  if (!screenplayId) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading screenplay...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Header with View Mode Toggle and Refresh Button */}
      <div className="px-4 py-3 border-b border-[#3F3F46] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">Storyboard</h2>
          <span className="text-xs text-[#808080]">
            {viewMode === 'scenes' 
              ? `(${scenesWithVideos.length} scene${scenesWithVideos.length !== 1 ? 's' : ''})`
              : `(${folderVideos.length} video${folderVideos.length !== 1 ? 's' : ''})`
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔥 FIX: View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] rounded-lg p-1 border border-[#3F3F46]">
            <button
              onClick={() => setViewMode('scenes')}
              className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'scenes'
                  ? 'bg-[#DC143C] text-white'
                  : 'text-[#808080] hover:text-[#B3B3B3]'
              }`}
              title="Scene View - Organized by screenplay scenes"
            >
              <Film className="w-4 h-4" />
              Scenes
            </button>
            <button
              onClick={() => setViewMode('folders')}
              className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'folders'
                  ? 'bg-[#DC143C] text-white'
                  : 'text-[#808080] hover:text-[#B3B3B3]'
              }`}
              title="Folder View - Organized by media library folders"
            >
              <Folder className="w-4 h-4" />
              Folders
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] rounded transition-colors"
            title="Refresh storyboard to show new videos"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'scenes' ? (
        // Scene View
        scenesWithVideos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 text-center">
            <Film className="w-10 h-10 text-[#808080] mb-2" />
            <p className="text-sm font-medium text-[#B3B3B3] mb-1">No Scenes Yet</p>
            <p className="text-xs text-[#808080]">
              Generate scenes using the Scene Builder or Workflows tab.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4 md:space-y-5">
              {(() => {
                // 🔥 DEBUG: Log what's being rendered with detailed shot counts
                console.log('[ScenesPanel] 🎬 Rendering scenes:', {
                  totalToRender: scenesWithVideos.length,
                  sceneNumbers: scenesWithVideos.map(s => s.number),
                  scenesWithVideosCount: scenesWithVideos.filter(s => s.videos?.shots?.length > 0).length,
                  detailedSceneData: scenesWithVideos.map(s => ({
                    sceneNumber: s.number,
                    sceneId: s.id,
                    heading: s.heading,
                    shotsCount: s.videos?.shots?.length || 0,
                    shots: s.videos?.shots?.map(shot => ({
                      shotNumber: shot.shotNumber,
                      fileId: shot.video.id,
                      fileName: shot.video.fileName,
                      timestamp: shot.timestamp,
                      s3Key: shot.video.s3Key?.substring(0, 50)
                    })) || []
                  }))
                });
                return scenesWithVideos.map((scene) => (
                  <SceneCard
                    key={scene.id || scene.number}
                    scene={scene}
                    presignedUrls={presignedUrls as Map<string, string> | undefined}
                    screenplayId={screenplayId}
                    onViewMetadata={(metadata) => {
                      setSelectedMetadata(metadata);
                      setShowMetadataModal(true);
                    }}
                  />
                ));
              })()}
            </div>
          </div>
        )
      ) : (
        // 🔥 FIX: Folder View
        <div className="flex-1 flex overflow-hidden">
          {/* Folder Tree Sidebar */}
          <div className="w-64 border-r border-[#3F3F46] overflow-y-auto">
            {screenplayId && (
              <FolderTreeSidebar
                screenplayId={screenplayId}
                onFolderSelect={handleFolderSelect}
                selectedFolderId={selectedFolderId && selectedStorageType === 's3' ? selectedFolderId : null}
              />
            )}
          </div>
          
          {/* Folder Files Grid */}
          <div className="flex-1 overflow-y-auto">
            {folderVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 md:p-5 text-center">
                <Folder className="w-10 h-10 text-[#808080] mb-2" />
                <p className="text-sm font-medium text-[#B3B3B3] mb-1">
                  {selectedFolderId ? 'No videos in this folder' : 'Select a folder to view videos'}
                </p>
                <p className="text-xs text-[#808080]">
                  {selectedFolderId 
                    ? 'Videos in this folder will appear here.'
                    : 'Choose a folder from the sidebar to browse videos organized by folder structure.'
                  }
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#B3B3B3] mb-1">
                    {selectedFolderPath.length > 0 
                      ? selectedFolderPath.join(' / ')
                      : 'All Videos'
                    }
                  </h3>
                  <p className="text-xs text-[#808080]">
                    {folderVideos.length} video{folderVideos.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {folderVideos.map((file) => {
                    const presignedUrl = file.s3Key ? folderPresignedUrls?.get(file.s3Key) : undefined;
                    return (
                      <div
                        key={file.id}
                        className="bg-[#1A1A1A] rounded-lg border border-[#3F3F46] overflow-hidden hover:border-[#DC143C]/50 transition-colors"
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
                            <Film className="w-8 h-8 text-[#808080]" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-[#B3B3B3] truncate" title={file.fileName}>
                            {file.fileName}
                          </p>
                          {file.folderPath && file.folderPath.length > 0 && (
                            <p className="text-xs text-[#808080] truncate mt-1">
                              {file.folderPath.join(' / ')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && selectedMetadata && (
        <SceneMetadataModal
          metadata={selectedMetadata}
          onClose={() => {
            setShowMetadataModal(false);
            setSelectedMetadata(null);
          }}
        />
      )}
    </div>
  );
}

