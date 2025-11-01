/**
 * useTimelineActions.tsx
 * CRUD operations for timeline clips and assets
 * Extracted from useTimeline.tsx for better modularity
 */

import { useCallback } from 'react';
import type { 
  TimelineProject, 
  TimelineClip, 
  TimelineAsset 
} from '../useTimeline';

export interface TimelineActionsReturn {
  addClip: (clip: Omit<TimelineClip, 'id'>) => string;
  addClips: (clips: Omit<TimelineClip, 'id'>[]) => string[];
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  deleteClip: (id: string) => void;
  deleteClips: (ids: string[]) => void;
  duplicateClip: (id: string) => string | null;
  moveClip: (id: string, startTime: number, track: number) => void;
  trimClip: (id: string, trimStart: number, trimEnd: number) => void;
  
  addAsset: (asset: Omit<TimelineAsset, 'id'>) => string;
  updateAsset: (id: string, updates: Partial<TimelineAsset>) => void;
  deleteAsset: (id: string) => void;
  
  clearTimeline: () => void;
}

export function useTimelineActions(
  project: TimelineProject,
  setProject: React.Dispatch<React.SetStateAction<TimelineProject>>
): TimelineActionsReturn {
  
  /**
   * Add a single clip to the timeline
   */
  const addClip = useCallback((clipData: Omit<TimelineClip, 'id'>): string => {
    const newClip: TimelineClip = {
      ...clipData,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip],
      updatedAt: new Date()
    }));
    
    return newClip.id;
  }, [setProject]);

  /**
   * Add multiple clips at once
   */
  const addClips = useCallback((clipsData: Omit<TimelineClip, 'id'>[]): string[] => {
    const newClips = clipsData.map(clipData => ({
      ...clipData,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    
    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, ...newClips],
      updatedAt: new Date()
    }));
    
    return newClips.map(c => c.id);
  }, [setProject]);

  /**
   * Update an existing clip
   */
  const updateClip = useCallback((id: string, updates: Partial<TimelineClip>) => {
    setProject(prev => ({
      ...prev,
      clips: prev.clips.map(clip => 
        clip.id === id ? { ...clip, ...updates } : clip
      ),
      updatedAt: new Date()
    }));
  }, [setProject]);

  /**
   * Delete a single clip
   */
  const deleteClip = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      clips: prev.clips.filter(clip => clip.id !== id),
      updatedAt: new Date()
    }));
  }, [setProject]);

  /**
   * Delete multiple clips
   */
  const deleteClips = useCallback((ids: string[]) => {
    const idsSet = new Set(ids);
    setProject(prev => ({
      ...prev,
      clips: prev.clips.filter(clip => !idsSet.has(clip.id)),
      updatedAt: new Date()
    }));
  }, [setProject]);

  /**
   * Duplicate a clip
   */
  const duplicateClip = useCallback((id: string): string | null => {
    const clip = project.clips.find(c => c.id === id);
    if (!clip) return null;
    
    const newClip: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: clip.startTime + clip.duration + 0.1 // Place after original
    };
    
    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip],
      updatedAt: new Date()
    }));
    
    return newClip.id;
  }, [project.clips, setProject]);

  /**
   * Move a clip to a new position
   */
  const moveClip = useCallback((id: string, startTime: number, track: number) => {
    updateClip(id, { startTime, track });
  }, [updateClip]);

  /**
   * Trim a clip (adjust in/out points)
   */
  const trimClip = useCallback((id: string, trimStart: number, trimEnd: number) => {
    const clip = project.clips.find(c => c.id === id);
    if (!clip) return;
    
    const newDuration = clip.duration - trimStart - trimEnd;
    if (newDuration <= 0) return; // Invalid trim
    
    updateClip(id, {
      trimStart: clip.trimStart + trimStart,
      trimEnd: clip.trimEnd + trimEnd,
      duration: newDuration
    });
  }, [project.clips, updateClip]);

  /**
   * Add a multi-type asset (video, audio, image, music)
   */
  const addAsset = useCallback((assetData: Omit<TimelineAsset, 'id'>): string => {
    const newAsset: TimelineAsset = {
      ...assetData,
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setProject(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset],
      updatedAt: new Date()
    }));
    
    return newAsset.id;
  }, [setProject]);

  /**
   * Update an existing asset
   */
  const updateAsset = useCallback((id: string, updates: Partial<TimelineAsset>) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      ),
      updatedAt: new Date()
    }));
  }, [setProject]);

  /**
   * Delete an asset
   */
  const deleteAsset = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.filter(asset => asset.id !== id),
      updatedAt: new Date()
    }));
  }, [setProject]);

  /**
   * Clear all clips and assets from timeline
   */
  const clearTimeline = useCallback(() => {
    setProject(prev => ({
      ...prev,
      clips: [],
      assets: [],
      updatedAt: new Date()
    }));
  }, [setProject]);

  return {
    addClip,
    addClips,
    updateClip,
    deleteClip,
    deleteClips,
    duplicateClip,
    moveClip,
    trimClip,
    addAsset,
    updateAsset,
    deleteAsset,
    clearTimeline
  };
}

