/**
 * Timeline Clip Component with Drag & Drop
 * 
 * Draggable clip component for timeline editor
 * Supports drag to reposition, resize handles, and visual feedback
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { TimelineClip as TimelineClipType, snapToFrame } from '@/hooks/useTimeline';

interface TimelineClipComponentProps {
  clip: TimelineClipType;
  zoomLevel: number;
  isSelected: boolean;
  onSelect: (addToSelection: boolean) => void;
  onRemove: () => void;
  onMove: (newTrack: number, newStartTime: number) => void;
  onResize?: (newDuration: number) => void;
  trackHeight: number;
  frameRate?: number; // NEW: Frame rate for snapping
}

export function TimelineClipComponent({
  clip,
  zoomLevel,
  isSelected,
  onSelect,
  onRemove,
  onMove,
  onResize,
  trackHeight = 80,
  frameRate = 30 // Default to 30fps if not provided
}: TimelineClipComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, clipStart: 0, clipTrack: 0 });
  
  const clipRef = useRef<HTMLDivElement>(null);

  const clipWidth = clip.duration * zoomLevel;
  const clipLeft = clip.startTime * zoomLevel;

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking delete button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    e.stopPropagation();
    
    // Check if Cmd/Ctrl key is pressed for multi-select
    const addToSelection = e.metaKey || e.ctrlKey;
    onSelect(addToSelection);

    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      clipStart: clip.startTime,
      clipTrack: clip.track
    });
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Calculate new position
      const newStartTime = dragStart.clipStart + (deltaX / zoomLevel);
      const trackDelta = Math.round(deltaY / trackHeight);
      const newTrack = Math.max(0, Math.min(3, dragStart.clipTrack + trackDelta));

      // Apply frame-accurate snapping
      const snappedTime = snapToFrame(newStartTime, frameRate);

      onMove(newTrack, Math.max(0, snappedTime));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, zoomLevel, trackHeight, onMove]);

  // Get color based on shot type
  const getClipColor = () => {
    const shotType = clip.metadata?.shotType;
    if (!shotType) return 'bg-blue-500 border-blue-600';
    
    const colors: Record<string, string> = {
      'EWS': 'bg-sky-500 border-sky-600',
      'WS': 'bg-blue-500 border-blue-600',
      'MS': 'bg-purple-500 border-purple-600',
      'CU': 'bg-pink-500 border-pink-600',
      'ECU': 'bg-red-500 border-red-600',
      'OTS': 'bg-amber-500 border-amber-600',
      'POV': 'bg-indigo-500 border-indigo-600'
    };
    
    return colors[shotType] || 'bg-blue-500 border-blue-600';
  };

  return (
    <div
      ref={clipRef}
      className={`absolute top-1 bottom-1 rounded-lg cursor-move transition-all group ${
        isSelected
          ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-yellow-400/50 z-20'
          : isDragging
          ? 'opacity-70 z-30'
          : 'z-10'
      } ${getClipColor()}`}
      style={{
        left: `${clipLeft}px`,
        width: `${clipWidth}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      title={clip.name}
    >
      {/* Clip Content */}
      <div className="h-full flex flex-col justify-between p-2 text-white overflow-hidden select-none">
        <div className="flex items-start justify-between gap-2">
          {/* Drag Handle */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <GripVertical className="w-3 h-3 flex-shrink-0 opacity-50" />
            <span className="text-xs font-medium truncate">
              {clip.name}
            </span>
          </div>

          {/* Delete Button */}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-white/20 rounded p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Delete clip"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Clip Info */}
        <div className="flex items-end justify-between text-xs opacity-75">
          <span>{clip.duration.toFixed(1)}s</span>
          {clip.metadata?.shotType && (
            <span className="text-xs font-bold bg-black/30 px-1 rounded">
              {clip.metadata.shotType}
            </span>
          )}
        </div>
      </div>

      {/* Resize Handles (Optional) */}
      {onResize && (
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

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
        </div>
      )}
    </div>
  );
}

