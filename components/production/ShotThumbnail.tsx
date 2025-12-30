'use client';

/**
 * Shot Thumbnail Component
 * 
 * Displays a single shot video with thumbnail and actions.
 * Note: First frame images are kept in backend only, not displayed in UI.
 */

import React, { useState } from 'react';
import { Play, Info, Download } from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';

interface ShotThumbnailProps {
  shot: {
    shotNumber: number;
    video: {
      s3Key?: string;
      fileName: string;
      fileType: string;
    };
    timestamp?: string;
  };
  presignedUrl?: string;
  onDownload?: () => void;
  onViewMetadata?: () => void;
}

export function ShotThumbnail({
  shot,
  presignedUrl,
  onDownload,
  onViewMetadata,
}: ShotThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div
      className="relative group bg-[#1A1A1A] rounded-lg border border-[#3F3F46] overflow-hidden cursor-pointer hover:border-[#DC143C] transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowVideo(true)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-[#0A0A0A] relative">
        {presignedUrl ? (
          <VideoThumbnail videoUrl={presignedUrl} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-[#808080]" />
          </div>
        )}

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Play className="w-12 h-12 text-white" />
          </div>
        )}

        {/* Shot number badge */}
        <div className="absolute top-2 left-2 bg-[#DC143C] text-white text-xs font-semibold px-2 py-1 rounded">
          Shot {shot.shotNumber}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#B3B3B3] truncate">
            {shot.video.fileName || `Shot ${shot.shotNumber}`}
          </p>
          {shot.timestamp && (
            <p className="text-xs text-[#808080]">
              {new Date(shot.timestamp.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6')).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onViewMetadata && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewMetadata();
              }}
              className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
              title="View metadata"
            >
              <Info className="w-3.5 h-3.5 text-[#808080]" />
            </button>
          )}
          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5 text-[#808080]" />
            </button>
          )}
        </div>
      </div>

      {/* Video Modal (simplified - could be enhanced) */}
      {showVideo && presignedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
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

