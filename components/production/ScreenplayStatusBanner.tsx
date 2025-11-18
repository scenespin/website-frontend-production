'use client';

/**
 * ScreenplayStatusBanner Component
 * 
 * Shows screenplay connection status and quick stats.
 * Part of Production Hub Phase 1 redesign.
 */

import React from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { CheckCircle, AlertCircle, FileText, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenplayStatusBannerProps {
  onViewEditor?: () => void;
  onRescan?: () => void;
  className?: string;
}

export function ScreenplayStatusBanner({ 
  onViewEditor, 
  onRescan,
  className = '' 
}: ScreenplayStatusBannerProps) {
  const screenplay = useScreenplay();

  const isConnected = !!screenplay.screenplayId;
  const sceneCount = screenplay.scenes?.length || 0;
  const characterCount = screenplay.characters?.length || 0;
  const locationCount = screenplay.locations?.length || 0;
  
  // Get title from screenplay context or default
  const title = screenplay.screenplayId ? 'Current Screenplay' : null;

  // Not Connected State
  if (!isConnected) {
    return (
      <div className={`bg-yellow-900/30 border border-yellow-700/50 rounded-md p-2 md:p-3 ${className}`}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-xs md:text-sm font-medium text-yellow-200 mb-1">
              No screenplay connected
            </h3>
            <p className="text-xs md:text-sm text-yellow-300/80 mb-2">
              Create or open a screenplay in the Editor to start generating scenes.
            </p>
            {onViewEditor && (
              <Button
                onClick={onViewEditor}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs bg-yellow-900/50 border-yellow-700 text-yellow-200 hover:bg-yellow-900/70"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Go to Editor
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connected State
  return (
    <div className={`bg-green-900/30 border border-green-700/50 rounded-md p-2 md:p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <h3 className="text-xs md:text-sm font-medium text-green-200">
              Connected to screenplay
            </h3>
            {title && (
              <span className="text-sm text-green-300/80 font-medium">
                "{title}"
              </span>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs md:text-sm text-green-300/90 mb-2">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}</span>
            </div>
            <span>•</span>
            <span>{characterCount} {characterCount === 1 ? 'character' : 'characters'}</span>
            <span>•</span>
            <span>{locationCount} {locationCount === 1 ? 'location' : 'locations'}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onViewEditor && (
              <Button
                onClick={onViewEditor}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs bg-green-900/50 border-green-700 text-green-200 hover:bg-green-900/70"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Editor
              </Button>
            )}
            {onRescan && (
              <Button
                onClick={onRescan}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-300 hover:text-green-200 hover:bg-green-900/30"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Rescan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

