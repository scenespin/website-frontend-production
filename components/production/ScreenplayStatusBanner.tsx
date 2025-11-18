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
      <div className={`bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-200 mb-1">
              No screenplay connected
            </h3>
            <p className="text-sm text-yellow-300/80 mb-3">
              Create or open a screenplay in the Editor to start generating scenes.
            </p>
            {onViewEditor && (
              <Button
                onClick={onViewEditor}
                variant="outline"
                size="sm"
                className="bg-yellow-900/50 border-yellow-700 text-yellow-200 hover:bg-yellow-900/70"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
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
    <div className={`bg-green-900/30 border border-green-700/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-green-200">
              Connected to screenplay
            </h3>
            {title && (
              <span className="text-sm text-green-300/80 font-medium">
                "{title}"
              </span>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-green-300/90 mb-3">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>{characterCount} {characterCount === 1 ? 'character' : 'characters'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>{locationCount} {locationCount === 1 ? 'location' : 'locations'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onViewEditor && (
              <Button
                onClick={onViewEditor}
                variant="outline"
                size="sm"
                className="bg-green-900/50 border-green-700 text-green-200 hover:bg-green-900/70"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Editor
              </Button>
            )}
            {onRescan && (
              <Button
                onClick={onRescan}
                variant="ghost"
                size="sm"
                className="text-green-300 hover:text-green-200 hover:bg-green-900/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rescan Script
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

