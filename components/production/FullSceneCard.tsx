'use client';

/**
 * Full Scene Card Component
 * 
 * Displays the full stitched scene video in a prominent card.
 */

import React, { useState } from 'react';
import { Play, Info, Download, Film, X } from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';

interface FullSceneCardProps {
  fullScene: {
    video: {
      s3Key?: string;
      fileName: string;
      fileType: string;
    };
    metadata?: any;
    timestamp?: string;
  };
  presignedUrl?: string;
  onDownload?: () => void;
  onViewMetadata?: () => void;
}

export function FullSceneCard({
  fullScene,
  presignedUrl,
  onDownload,
  onViewMetadata,
}: FullSceneCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  return (
    <div className="bg-[#1A1A1A] rounded-lg border border-[#3F3F46] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#3F3F46] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#DC143C]" />
          <h4 className="text-sm font-semibold text-[#FFFFFF]">Full Stitched Scene</h4>
        </div>
        <div className="flex items-center gap-2">
          {fullScene.timestamp && (
            <span className="text-xs text-[#808080]">
              {new Date(fullScene.timestamp.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6')).toLocaleString()}
            </span>
          )}
          {onViewMetadata && (
            <button
              onClick={onViewMetadata}
              className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
              title="View metadata"
            >
              <Info className="w-4 h-4 text-[#808080]" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-[#808080]" />
            </button>
          )}
        </div>
      </div>

      {/* Video Thumbnail */}
      <div
        className="relative aspect-video bg-[#0A0A0A] cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowVideo(true)}
      >
        {presignedUrl ? (
          <VideoThumbnail videoUrl={presignedUrl} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-[#808080]" />
          </div>
        )}

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Play className="w-16 h-16 text-white" />
          </div>
        )}

        {/* Full scene badge */}
        <div className="absolute top-3 left-3 bg-[#DC143C] text-white text-xs font-semibold px-2 py-1 rounded">
          Full Scene
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && presignedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => {
            setShowVideo(false);
            setVideoError(null);
          }}
        >
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowVideo(false);
                setVideoError(null);
              }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close video"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {videoError ? (
              <div className="bg-[#1A1A1A] rounded-lg p-8 text-center border border-[#DC143C]">
                <p className="text-[#DC143C] font-semibold mb-2">Video Playback Error</p>
                <p className="text-[#B3B3B3] text-sm mb-4">{videoError}</p>
                <button
                  onClick={() => {
                    setVideoError(null);
                    // Force video reload by toggling showVideo
                    setShowVideo(false);
                    setTimeout(() => setShowVideo(true), 100);
                  }}
                  className="px-4 py-2 bg-[#DC143C] text-white rounded hover:bg-[#B01030] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <video
                src={presignedUrl}
                controls
                autoPlay
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  const video = e.currentTarget;
                  let errorMessage = 'Failed to load video.';
                  
                  if (video.error) {
                    switch (video.error.code) {
                      case video.error.MEDIA_ERR_ABORTED:
                        errorMessage = 'Video loading was aborted.';
                        break;
                      case video.error.MEDIA_ERR_NETWORK:
                        errorMessage = 'Network error while loading video. Please check your connection.';
                        break;
                      case video.error.MEDIA_ERR_DECODE:
                        errorMessage = 'Video decoding error. The file may be corrupted.';
                        break;
                      case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = 'Video format not supported by your browser.';
                        break;
                    }
                  }
                  
                  console.error('[FullSceneCard] Video playback error:', {
                    errorCode: video.error?.code,
                    errorMessage,
                    videoSrc: presignedUrl?.substring(0, 100),
                    fileName: fullScene.video.fileName,
                    s3Key: fullScene.video.s3Key?.substring(0, 100)
                  });
                  
                  setVideoError(errorMessage);
                }}
                onLoadedMetadata={() => {
                  // Clear any previous errors when video loads successfully
                  setVideoError(null);
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

