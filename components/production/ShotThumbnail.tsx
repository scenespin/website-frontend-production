'use client';

/**
 * Shot Thumbnail Component
 * 
 * Displays a single shot video with thumbnail and actions.
 * Note: First frame images are kept in backend only, not displayed in UI.
 */

import React, { useState } from 'react';
import { Play, Info, Download, RefreshCw, Film, HelpCircle, X, Trash2 } from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ShotThumbnailProps {
  shot: {
    shotNumber: number;
    video: {
      id?: string; // Media file ID for deletion
      s3Key?: string;
      fileName: string;
      fileType: string;
    };
    timestamp?: string;
    metadata?: any; // Generation metadata for regeneration
  };
  presignedUrl?: string;
  onDownload?: () => void;
  onViewMetadata?: () => void;
  onRegenerate?: (shot: any) => void; // Regenerate with same setup
  onReshoot?: (shot: any) => void; // Reshoot with new setup
  onDelete?: (fileId: string) => void; // Delete video
  screenplayId?: string;
  sceneId?: string;
}

export function ShotThumbnail({
  shot,
  presignedUrl,
  onDownload,
  onViewMetadata,
  onRegenerate,
  onReshoot,
  onDelete,
  screenplayId,
  sceneId,
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

        {/* Shot number badge - show "NEW" badge for newest variation */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <div className="bg-[#DC143C] text-white text-xs font-semibold px-2 py-1 rounded">
            Shot {shot.shotNumber}
            {shot.timestamp && (
              <span className="ml-1 text-[10px] opacity-75">
                {new Date(shot.timestamp.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          {(shot as any).isNewest && (
            <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
              NEW
            </div>
          )}
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
          {/* Regenerate/Reshoot Buttons */}
          {(onRegenerate || onReshoot) && (
            <TooltipProvider>
              <div className="flex items-center gap-1 border-r border-[#3F3F46] pr-1 mr-1">
                {onRegenerate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerate(shot);
                        }}
                        className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
                        title="Regenerate Shot"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#808080]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-xs">
                        <div className="font-semibold mb-1">Regenerate Shot</div>
                        <div className="text-[#808080]">Uses same setup (faster, same references). Like a retake.</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onReshoot && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReshoot(shot);
                        }}
                        className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
                        title="Reshoot Shot"
                      >
                        <Film className="w-3.5 h-3.5 text-[#808080]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-xs">
                        <div className="font-semibold mb-1">Reshoot Shot</div>
                        <div className="text-[#808080]">New setup (different first frame/video). Like a reshoot.</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="p-1.5 hover:bg-[#3F3F46] rounded transition-colors"
                      title="Help"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#808080]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-xs space-y-2">
                      <div>
                        <div className="font-semibold mb-1">Regenerate vs Reshoot</div>
                        <div className="text-[#808080]">
                          <strong>Regenerate:</strong> Uses same setup (faster, same references). Like a retake.
                        </div>
                        <div className="text-[#808080] mt-1">
                          <strong>Reshoot:</strong> New setup (different first frame/video). Like a reshoot.
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
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
          {onDelete && shot.video.id && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete this shot? This will permanently remove the video file "${shot.video.fileName}".`)) {
                        onDelete(shot.video.id);
                      }
                    }}
                    className="p-1.5 hover:bg-[#DC143C]/20 hover:text-[#DC143C] rounded transition-colors"
                    title="Delete Shot"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#808080]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs">Delete this shot video</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && presignedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close video"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
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

