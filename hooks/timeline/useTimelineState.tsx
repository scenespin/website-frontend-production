/**
 * useTimelineState.tsx
 * Core state management for timeline editor
 * Extracted from useTimeline.tsx for better modularity
 */

import { useState, useRef } from 'react';
import type { 
  TimelineProject, 
  TimelineClip, 
  TimelineAsset,
  SaveStatus 
} from '../useTimeline';

export interface TimelineStateReturn {
  // Project state
  project: TimelineProject;
  setProject: React.Dispatch<React.SetStateAction<TimelineProject>>;
  
  // Playback state
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  playheadPosition: number;
  setPlayheadPosition: React.Dispatch<React.SetStateAction<number>>;
  playbackIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  
  // Selection state
  selectedClips: Set<string>;
  setSelectedClips: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // UI state
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  draggedClip: TimelineClip | null;
  setDraggedClip: React.Dispatch<React.SetStateAction<TimelineClip | null>>;
  
  // Save state
  saveStatus: SaveStatus;
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>;
  lastSaved: Date | null;
  setLastSaved: React.Dispatch<React.SetStateAction<Date | null>>;
  isOnline: boolean;
  setIsOnline: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Refs
  saveQueueRef: React.MutableRefObject<any[]>;
  retryIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isUnmountingRef: React.MutableRefObject<boolean>;
  
  // Computed values
  totalDuration: number;
}

export function useTimelineState(projectId: string | undefined): TimelineStateReturn {
  // Project state
  const [project, setProject] = useState<TimelineProject>({
    id: projectId || `timeline_${Date.now()}`,
    name: 'Untitled Project',
    clips: [],  // Legacy clips array for backward compatibility
    assets: [],  // NEW: Multi-type assets array
    duration: 60,
    resolution: '1080p',
    aspectRatio: '16:9',
    frameRate: 30,
    trackConfig: {
      videoTracks: 8,
      audioTracks: 8
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Selection state
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  // UI state
  const [zoomLevel, setZoomLevel] = useState(50); // pixels per second
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClip, setDraggedClip] = useState<TimelineClip | null>(null);

  // Save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Retry queue for failed saves
  const saveQueueRef = useRef<any[]>([]);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  // Calculated values
  const totalDuration = Math.max(
    project.duration,
    ...project.clips.map(c => c.startTime + c.duration),
    ...project.assets.map(a => a.startTime + a.duration)
  );

  return {
    project,
    setProject,
    isPlaying,
    setIsPlaying,
    playheadPosition,
    setPlayheadPosition,
    playbackIntervalRef,
    selectedClips,
    setSelectedClips,
    zoomLevel,
    setZoomLevel,
    isDragging,
    setIsDragging,
    draggedClip,
    setDraggedClip,
    saveStatus,
    setSaveStatus,
    lastSaved,
    setLastSaved,
    isOnline,
    setIsOnline,
    saveQueueRef,
    retryIntervalRef,
    isUnmountingRef,
    totalDuration
  };
}

