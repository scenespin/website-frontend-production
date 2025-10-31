/**
 * Timeline Asset Component - Multi-Type Support
 * 
 * Universal component for all asset types: video, audio, image, music
 * Supports drag & drop, keyframes, and type-specific visualizations
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, Volume2, VolumeX, Image as ImageIcon, Music, Film, Info, Shuffle, Palette } from 'lucide-react';
import { TimelineAsset, snapToFrame } from '@/hooks/useTimeline';
import { AssetInfoPanel } from './AssetInfoPanel';

interface TimelineAssetComponentProps {
  asset: TimelineAsset;
  zoomLevel: number;
  isSelected: boolean;
  onSelect: (addToSelection: boolean) => void;
  onRemove: () => void;
  onMove: (newTrack: number, newStartTime: number) => void;
  onResize?: (newDuration: number) => void;
  trackHeight: number;
  frameRate?: number;
  onRegenerate?: (metadata: any) => void;
  onAddTransition?: (assetId: string) => void;  // NEW: Transition handler (Feature 0065)
  onAddLUT?: (assetId: string) => void;         // NEW: LUT handler (Feature 0065)
}

export function TimelineAssetComponent({
  asset,
  zoomLevel,
  isSelected,
  onSelect,
  onRemove,
  onMove,
  onResize,
  trackHeight = 60,
  frameRate = 30,
  onRegenerate,
  onAddTransition,  // NEW: Feature 0065
  onAddLUT          // NEW: Feature 0065
}: TimelineAssetComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, assetStart: 0, assetTrack: 0 });
  const [showInfoPanel, setShowInfoPanel] = useState(false);  // NEW: Info panel state
  
  const assetRef = useRef<HTMLDivElement>(null);

  const assetWidth = asset.duration * zoomLevel;
  const assetLeft = asset.startTime * zoomLevel;

  // Handle drag start
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    e.stopPropagation();
    
    const addToSelection = e.metaKey || e.ctrlKey;
    onSelect(addToSelection);

    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      assetStart: asset.startTime,
      assetTrack: asset.track
    });
    
    // Capture pointer to continue receiving events
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newStartTime = dragStart.assetStart + (deltaX / zoomLevel);
      const trackDelta = Math.round(deltaY / trackHeight);
      const newTrack = Math.max(0, dragStart.assetTrack + trackDelta);

      const snappedTime = snapToFrame(newStartTime, frameRate);

      onMove(newTrack, Math.max(0, snappedTime));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, dragStart, zoomLevel, trackHeight, onMove, frameRate]);

  // Get asset type icon
  const getAssetIcon = () => {
    switch (asset.type) {
      case 'video':
        return <Film className="w-3 h-3" />;
      case 'audio':
      case 'music':
        return <Music className="w-3 h-3" />;
      case 'image':
        return <ImageIcon className="w-3 h-3" />;
      default:
        return <Film className="w-3 h-3" />;
    }
  };

  // Get color scheme based on asset type
  const getAssetColor = () => {
    switch (asset.type) {
      case 'video':
        return 'bg-blue-500 border-blue-600';
      case 'audio':
        return 'bg-green-500 border-green-600';
      case 'music':
        return 'bg-purple-500 border-purple-600';
      case 'image':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  // Special styling for audio tracks (different height)
  const isAudio = asset.type === 'audio' || asset.type === 'music';
  const displayHeight = isAudio ? Math.min(trackHeight, 50) : trackHeight - 2;

  return (
    <>
    <div
      ref={assetRef}
      className={`absolute rounded-md cursor-move transition-all group border-2 ${
        isSelected
          ? 'ring-2 ring-yellow-400 ring-offset-1 shadow-lg shadow-yellow-400/50 z-20'
          : isDragging
          ? 'opacity-70 z-30'
          : 'z-10'
      } ${getAssetColor()}`}
      style={{
        left: `${assetLeft}px`,
        width: `${assetWidth}px`,
        height: `${displayHeight}px`,
        top: isAudio ? `${(trackHeight - displayHeight) / 2}px` : '1px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onPointerDown={handlePointerDown}
      title={`${asset.name} (${asset.type})`}
    >
      {/* Asset Content */}
      <div className="h-full flex flex-col justify-between p-2 text-white overflow-hidden select-none">
        <div className="flex items-start justify-between gap-2">
          {/* Icon & Name */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {getAssetIcon()}
            <GripVertical className="w-3 h-3 flex-shrink-0 opacity-50" />
            <span className="text-xs font-medium truncate">
              {asset.name}
            </span>
          </div>

          {/* Audio Indicator */}
          {isAudio && (
            <div className="flex-shrink-0">
              {asset.muted ? (
                <VolumeX className="w-3 h-3 opacity-60" />
              ) : (
                <Volume2 className="w-3 h-3 opacity-60" />
              )}
            </div>
          )}

          {/* Transition Button - NEW (Feature 0065) */}
          {asset.type === 'video' && onAddTransition && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-purple-500/20 rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onAddTransition(asset.id);
              }}
              title="Add Transition"
            >
              <Shuffle className="w-3 h-3 text-purple-400" />
            </button>
          )}

          {/* LUT Button - NEW (Feature 0065) */}
          {(asset.type === 'video' || asset.type === 'image') && onAddLUT && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-orange-500/20 rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onAddLUT(asset.id);
              }}
              title="Apply LUT (Color Grade)"
            >
              <Palette className="w-3 h-3 text-orange-400" />
            </button>
          )}

          {/* Info Button - NEW (Feature 0064) */}
          {(asset.assetMetadata || asset.compositionMetadata) && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-blue-500/20 rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoPanel(true);
              }}
              title="Asset Info"
            >
              <Info className="w-3 h-3 text-blue-400" />
            </button>
          )}

          {/* Delete Button */}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-white/20 rounded p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Delete asset"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Asset Info */}
        <div className="flex items-end justify-between text-xs opacity-75">
          <span>{asset.duration.toFixed(1)}s</span>
          {isAudio && asset.volume !== 1 && (
            <span className="text-xs bg-black/30 px-1 rounded">
              {Math.round(asset.volume * 100)}%
            </span>
          )}
          {asset.type === 'video' && asset.metadata?.shotType && (
            <span className="text-xs font-bold bg-black/30 px-1 rounded">
              {asset.metadata.shotType}
            </span>
          )}
        </div>
      </div>

      {/* Keyframe Indicators */}
      {asset.keyframes && asset.keyframes.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400/50" title={`${asset.keyframes.length} keyframes`} />
      )}

      {/* Fade Indicators (for audio) */}
      {isAudio && (asset.fadeIn || asset.fadeOut) && (
        <>
          {asset.fadeIn && (
            <div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-black/40 to-transparent"
              style={{ width: `${(asset.fadeIn / asset.duration) * 100}%` }}
              title={`Fade in: ${asset.fadeIn}s`}
            />
          )}
          {asset.fadeOut && (
            <div 
              className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-black/40 to-transparent"
              style={{ width: `${(asset.fadeOut / asset.duration) * 100}%` }}
              title={`Fade out: ${asset.fadeOut}s`}
            />
          )}
        </>
      )}

      {/* Transition Indicator - NEW (Feature 0065) */}
      {asset.transition && asset.transition.type !== 'cut' && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-16 bg-purple-500/20 border-r-2 border-purple-500 flex flex-col items-center justify-center"
          title={`${asset.transition.type} (${asset.transition.duration}s)`}
        >
          <Shuffle className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-purple-400 font-bold mt-0.5">{asset.transition.duration}s</span>
        </div>
      )}

      {/* LUT Indicator - NEW (Feature 0065) */}
      {asset.lut && (
        <div 
          className="absolute top-1 left-1 bg-orange-500/90 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md"
          title={`LUT: ${asset.lut.name}${asset.lut.intensity !== undefined ? ` (${Math.round(asset.lut.intensity * 100)}%)` : ''}`}
        >
          <Palette className="w-3 h-3" />
          <span className="font-medium truncate max-w-[100px]">{asset.lut.name}</span>
        </div>
      )}

      {/* Color Grading Indicator - NEW (Feature 0065) */}
      {asset.colorGrading && !asset.lut && (
        <div 
          className="absolute top-1 left-1 bg-blue-500/90 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md"
          title="Custom color grading applied"
        >
          🎨
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
        </div>
      )}

      {/* Resize Handles (for video/image) */}
      {onResize && !isAudio && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity"
            title="Trim start"
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity"
            title="Trim end"
          />
        </>
      )}
    </div>
    
    {/* Asset Info Panel - NEW (Feature 0064) */}
    {showInfoPanel && (
      <AssetInfoPanel
        asset={asset}
        onClose={() => setShowInfoPanel(false)}
        onRegenerate={onRegenerate}
      />
    )}
    </>
  );
}

