'use client';

/**
 * Images Panel - Standalone Images
 * 
 * Displays images from Playground and manual uploads.
 * Character/Location/Asset Bank images and Scene first frames are shown in their respective tabs.
 */

import React from 'react';
import { Image as ImageIcon, Upload, Info } from 'lucide-react';
import { useMediaFiles } from '@/hooks/useMediaLibrary';
import { useScreenplay } from '@/contexts/ScreenplayContext';

interface ImagesPanelProps {
  className?: string;
}

export function ImagesPanel({ className = '' }: ImagesPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { data: mediaFiles = [], isLoading } = useMediaFiles(screenplayId || '', undefined, !!screenplayId);

  // Filter for image files that are standalone (not part of Character/Location/Asset Banks or Scenes)
  // Based on IMAGES_PANEL_FILTERING_LOGIC.md
  const standaloneImages = React.useMemo(() => {
    return mediaFiles.filter(file => {
      // Only include image files
      if (file.fileType !== 'image') return false;
      
      // Exclude Character Bank images
      const isCharacterImage = file.metadata?.entityType === 'character' ||
                              file.metadata?.entityId?.startsWith('char-') ||
                              file.s3Key?.includes('/characters/') ||
                              file.s3Key?.includes('/character-');
      
      // Exclude Location Bank images
      const isLocationImage = file.metadata?.entityType === 'location' ||
                             file.metadata?.entityId?.startsWith('loc-') ||
                             file.s3Key?.includes('/locations/') ||
                             file.s3Key?.includes('/location-');
      
      // Exclude Asset Bank images
      const isAssetImage = file.metadata?.entityType === 'asset' ||
                          file.metadata?.entityId?.startsWith('asset-') ||
                          file.s3Key?.includes('/assets/') ||
                          file.s3Key?.includes('/asset-');
      
      // Exclude Scene first frames
      const isSceneImage = file.metadata?.sceneId ||
                          file.metadata?.isFirstFrame ||
                          file.s3Key?.includes('/scenes/') ||
                          file.s3Key?.includes('/scene-') ||
                          file.s3Key?.includes('/first-frame');
      
      // Only include standalone images (Playground-generated or user-uploaded)
      return !isCharacterImage && !isLocationImage && !isAssetImage && !isSceneImage;
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
              Standalone Images
            </p>
            <p className="text-xs text-[#808080] leading-relaxed">
              This section contains images from <strong>Playground</strong> and <strong>manual uploads</strong>.
              Character, Location, Asset Bank images, and Scene first frames are organized in their respective tabs.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC143C] mx-auto mb-4"></div>
            <p className="text-sm text-[#808080]">Loading images...</p>
          </div>
        </div>
      ) : standaloneImages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 text-center">
          <ImageIcon className="w-10 h-10 text-[#808080] mb-2" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">No Standalone Images Yet</p>
          <p className="text-xs text-[#808080]">
            Generate images in Playground or upload images manually to see them here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-[#808080]">
                {standaloneImages.length} {standaloneImages.length === 1 ? 'image' : 'images'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {standaloneImages.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden group hover:border-[#DC143C]/50 transition-colors"
                >
                  <img
                    src={image.s3Key ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET || 'wryda-media'}.s3.amazonaws.com/${image.s3Key}` : undefined}
                    alt={image.fileName || 'Untitled Image'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white font-medium truncate">
                        {image.fileName || 'Untitled Image'}
                      </p>
                      {image.uploadedAt && (
                        <p className="text-xs text-white/60 mt-1">
                          {new Date(image.uploadedAt).toLocaleDateString()}
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

