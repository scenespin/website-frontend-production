'use client';

/**
 * Full Scene Card Component
 * 
 * Displays the full stitched scene video in a prominent card.
 */

import React, { useState } from 'react';
import { Play, Info, Download, Film } from 'lucide-react';
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
          onClick={() => setShowVideo(false)}
        >
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <video
              src={presignedUrl}
              controls
              autoPlay
              className="w-full h-auto rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

