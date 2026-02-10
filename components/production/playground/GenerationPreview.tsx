'use client';

/**
 * Generation Preview Component
 * 
 * Displays loading state with timer and generated results (images/videos)
 * Similar to Replicate.com's output preview panel
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Download, Share2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationPreviewProps {
  isGenerating: boolean;
  generatedImageUrl?: string | null;
  generatedVideoUrl?: string | null;
  generationTime?: number; // in seconds
  onDownload?: () => void;
  onShare?: () => void;
  /** Called when the video element fails to load (e.g. 404 after temp file expired). Parent can clear the URL so we show placeholder instead of empty player. */
  onVideoError?: () => void;
  className?: string;
  /** Optional header label (default: "Output") */
  title?: string;
}

export function GenerationPreview({
  isGenerating,
  generatedImageUrl,
  generatedVideoUrl,
  generationTime,
  onDownload,
  onShare,
  onVideoError,
  className = '',
  title = 'Output',
}: GenerationPreviewProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);

  // Timer for generation
  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0);
      setDisplayTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(elapsed);
      setDisplayTime(Math.round(elapsed * 10) / 10); // Round to 1 decimal
    }, 100); // Update every 100ms for smooth timer

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Use provided generationTime if available, otherwise use elapsed
  const finalTime = generationTime !== undefined ? generationTime : displayTime;

  const hasResult = generatedImageUrl || generatedVideoUrl;

  return (
    <div className={cn("h-full flex flex-col bg-[#141414]", className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-medium text-base-content">{title}</h3>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 min-h-[600px] overflow-visible">
        {isGenerating && !hasResult && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-cinema-red animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="text-base-content/80 font-medium">Generating...</p>
                <div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
                  <Clock className="w-4 h-4" />
                  <span>{finalTime.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasResult && (
          <div className="space-y-4">
            {/* Generated Result */}
            <div className="relative bg-[#0A0A0A] rounded-lg overflow-hidden border border-white/10">
              {generatedImageUrl && (
                <img
                  src={generatedImageUrl}
                  alt="Generated image"
                  className="w-full h-auto"
                />
              )}
              {generatedVideoUrl && (
                <video
                  src={generatedVideoUrl}
                  controls
                  className="w-full h-auto"
                  loop
                  playsInline
                  onError={onVideoError}
                />
              )}
            </div>

            {/* Generation Info */}
            {finalTime > 0 && (
              <div className="text-sm text-base-content/60 text-center">
                Generated in {finalTime.toFixed(1)} seconds
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-cinema-red text-white rounded-lg hover:bg-[#B91C1C] transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="px-4 py-2 bg-white/10 text-base-content rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
            </div>
          </div>
        )}

        {!isGenerating && !hasResult && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-base-content/40">
              <p className="text-sm">Generated results will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

