'use client';

/**
 * Video Panel - Standalone Videos
 * 
 * Displays videos from Playground and manual uploads.
 * Scene-generated videos are shown in the "Scenes" tab.
 */

import React from 'react';
import { Video as VideoIcon, Upload, Info } from 'lucide-react';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useAuth } from '@clerk/nextjs';

interface VideoPanelProps {
  className?: string;
}

export function VideoPanel({ className = '' }: VideoPanelProps) {
  const { userId } = useAuth();
  const { data: mediaFiles = [], isLoading } = useMediaLibrary(userId || '');

  // Filter for video files that are NOT part of scenes
  // Scene videos typically have metadata.sceneId or are in specific S3 prefixes
  const standaloneVideos = React.useMemo(() => {
    return mediaFiles.filter(file => {
      // Only include video files
      if (!file.type.startsWith('video/')) return false;
      
      // Exclude scene-generated videos (they have scene metadata or are in scene-specific paths)
      const isSceneVideo = file.metadata?.sceneId || 
                          file.metadata?.isSceneVideo ||
                          file.url?.includes('/scenes/') ||
                          file.url?.includes('/scene-');
      
      return !isSceneVideo;
    });
  }, [mediaFiles]);

  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Info Banner */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46]">
        <div className="flex items-start gap-3 p-3 bg-[#141414] border border-[#3F3F46] rounded-lg">
          <Info className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#FFFFFF] mb-1">
              Standalone Videos
            </p>
            <p className="text-xs text-[#808080] leading-relaxed">
              This section contains videos from <strong>Playground</strong> and <strong>manual uploads</strong>.
              Scene-generated videos (from Scene Manifest) are organized in the <strong>Scenes</strong> tab.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
            <p className="text-sm text-[#808080]">Loading videos...</p>
          </div>
        </div>
      ) : standaloneVideos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 text-center">
          <Video className="w-10 h-10 text-[#808080] mb-2" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">No Standalone Videos Yet</p>
          <p className="text-xs text-[#808080]">
            Generate videos in Playground or upload videos manually to see them here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-[#808080]">
                {standaloneVideos.length} {standaloneVideos.length === 1 ? 'video' : 'videos'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {standaloneVideos.map((video) => (
                <div
                  key={video.id}
                  className="relative aspect-video bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden group hover:border-[#DC143C]/50 transition-colors"
                >
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white font-medium truncate">
                        {video.name || 'Untitled Video'}
                      </p>
                      {video.createdAt && (
                        <p className="text-xs text-white/60 mt-1">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

