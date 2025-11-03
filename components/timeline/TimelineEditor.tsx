/**
 * Timeline Editor - Main Component (Refactored with useTimeline hook)
 * 
 * Professional multi-track video timeline editor
 * Features: drag & drop, playback controls, shot list import
 * 
 * Styled with refined clapboard aesthetic
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Save,
  Trash2,
  Copy,
  Clapperboard,
  Clock,
  Plus,
  Music,
  Mic,
  Volume2,
  Lightbulb,
  Upload,
  X
} from 'lucide-react';
import { useTimeline, TimelineClip } from '@/hooks/useTimeline';
import { TimelineClipComponent } from './TimelineClipComponent';
import { SaveStatusIndicator, OfflineBanner } from './SaveStatusIndicator';

// Re-export types
export type { TimelineClip };

interface TimelineEditorProps {
  projectId?: string;
}

// Track configuration with types
interface TrackConfig {
  id: number;
  type: 'video' | 'audio-music' | 'audio-voice' | 'audio-sfx' | 'story-beats';
  label: string;
  icon: React.ReactNode;
  color: string;
}

export function TimelineEditor({ projectId }: TimelineEditorProps) {
  // Use our powerful timeline hook with enhanced save protection!
  const timeline = useTimeline({
    projectId,
    autoSave: true,
    autoSaveInterval: 10000, // IMPROVED: 10 seconds (was 30)
    enableLocalStorageBackup: true, // NEW: localStorage fallback
    onSaveSuccess: (timestamp) => {
      console.log(`✅ Timeline saved at ${timestamp}`);
    },
    onSaveError: (error) => {
      console.error('❌ Timeline save failed:', error);
    }
  });

  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI state for add element panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedAddType, setSelectedAddType] = useState<'video' | 'music' | 'voice' | 'sfx' | 'story-beat' | null>(null);
  
  // Story beat form state
  const [storyBeatForm, setStoryBeatForm] = useState({
    title: '',
    description: '',
    startTime: 0,
    duration: 5
  });

  // 🔥 AUTO-IMPORT FROM SESSION STORAGE (Shot List → Timeline)
  useEffect(() => {
    const importData = sessionStorage.getItem('timeline_import_shots');
    if (importData) {
      try {
        const shots = JSON.parse(importData);
        timeline.importFromShotList(shots);
        sessionStorage.removeItem('timeline_import_shots');
        
        // Success notification
        console.log(`✅ Imported ${shots.length} shots to timeline!`);
        
        // Optional: Show user-friendly notification
        // You could integrate a toast library here
      } catch (error) {
        console.error('[Timeline] Failed to import shots:', error);
      }
    }
  }, [timeline.importFromShotList]);

  // Define track configurations
  const trackConfigs: TrackConfig[] = [
    { id: 0, type: 'video', label: 'Video 1', icon: <Film className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 1, type: 'video', label: 'Video 2', icon: <Film className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 2, type: 'video', label: 'Video 3', icon: <Film className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 3, type: 'video', label: 'Video 4', icon: <Film className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 4, type: 'audio-music', label: 'Music', icon: <Music className="w-4 h-4" />, color: 'bg-purple-500' },
    { id: 5, type: 'audio-voice', label: 'Voice', icon: <Mic className="w-4 h-4" />, color: 'bg-green-500' },
    { id: 6, type: 'audio-sfx', label: 'SFX', icon: <Volume2 className="w-4 h-4" />, color: 'bg-orange-500' },
    { id: 7, type: 'story-beats', label: 'Story Beats', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-red-500' },
  ];

  // Handler for adding story beat
  const handleAddStoryBeat = () => {
    if (!storyBeatForm.title) {
      alert('Please enter a title for the story beat');
      return;
    }

    timeline.addAsset({
      type: 'audio', // Use 'audio' type but we'll distinguish by metadata
      url: '', // No actual file for story beats
      name: storyBeatForm.title,
      track: 7, // Story beats track
      trackType: 'audio', // Treat as audio track for positioning
      startTime: storyBeatForm.startTime,
      duration: storyBeatForm.duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      metadata: {
        description: storyBeatForm.description,
        sourceType: 'library' as const,
        shotType: 'story-beat'
      }
    });

    // Reset form
    setStoryBeatForm({
      title: '',
      description: '',
      startTime: timeline.playheadPosition,
      duration: 5
    });
    setSelectedAddType(null);
    setShowAddPanel(false);
  };

  // Handler for file upload (audio)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local URL for the audio file
    const url = URL.createObjectURL(file);
    
    // Determine track based on selected type
    let track = 4; // default to music
    let trackType: 'video' | 'audio' = 'audio';
    let assetType: 'audio' | 'music' = 'audio';
    
    if (selectedAddType === 'music') {
      track = 4;
      assetType = 'music';
    } else if (selectedAddType === 'voice') {
      track = 5;
      assetType = 'audio';
    } else if (selectedAddType === 'sfx') {
      track = 6;
      assetType = 'audio';
    }

    // Add the audio asset
    timeline.addAsset({
      type: assetType,
      url,
      name: file.name,
      track,
      trackType,
      startTime: timeline.playheadPosition,
      duration: 10, // Default duration, will be updated after loading
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      metadata: {
        sourceType: 'uploaded' as const,
        description: `Uploaded ${selectedAddType} file`
      }
    });

    // Reset
    setSelectedAddType(null);
    setShowAddPanel(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate timeline dimensions
  const totalTimelineWidth = Math.max(
    timeline.totalDuration * timeline.zoomLevel,
    1000 // Minimum width
  );

  // Group clips by track (include both legacy clips and new assets)
  const clipsByTrack = trackConfigs.map(config => {
    // Legacy clips
    const legacyClips = timeline.clips.filter(c => c.track === config.id);
    
    // New assets
    const assets = timeline.assets.filter(a => a.track === config.id);
    
    return { config, clips: legacyClips, assets };
  });

  // Time ruler marks (every 5 seconds)
  const timeMarks = [];
  for (let t = 0; t <= timeline.totalDuration; t += 5) {
    timeMarks.push(t);
  }

  // Format time as MM:SS.s
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Handle delete selected clips (keyboard shortcut)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (timeline.selectedClips.size > 0) {
          e.preventDefault();
          timeline.removeClips(Array.from(timeline.selectedClips));
        }
      }
      // Cmd+D or Ctrl+D to duplicate
      else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        timeline.selectedClips.forEach(clipId => {
          timeline.duplicateClip(clipId);
        });
      }
      // Space to play/pause
      else if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        timeline.togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeline.selectedClips, timeline.togglePlay, timeline.removeClips, timeline.duplicateClip]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
      {/* Clapboard Header */}
      <div className="flex-shrink-0">
        {/* Black & White Stripes */}
        <div className="h-12 flex shadow-inner">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={i % 2 === 0 ? 'flex-1 bg-black' : 'flex-1 bg-white'}
            />
          ))}
        </div>

        {/* Slate Content */}
        <div className="p-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Clapperboard className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-base-content font-mono">
                  TIMELINE EDITOR
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {timeline.project.name}
                </p>
              </div>
            </div>

            {/* Metadata Cards */}
            <div className="flex gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">CLIPS</div>
                <div className="text-lg font-bold text-slate-900 dark:text-base-content font-mono">
                  {timeline.clips.length}
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">DURATION</div>
                <div className="text-lg font-bold text-slate-900 dark:text-base-content font-mono">
                  {formatTime(timeline.totalDuration)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#DC143C] to-[#B01030] rounded-lg p-3 border-2 border-[#A01020] shadow-md">
                <div className="text-xs text-black font-bold">RESOLUTION</div>
                <div className="text-lg font-bold text-black font-mono">
                  {timeline.project.resolution}
                </div>
              </div>
              {/* NEW: Save Status Indicator */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <SaveStatusIndicator
                  status={timeline.saveStatus}
                  lastSaved={timeline.lastSaved}
                  isOnline={timeline.isOnline}
                  queueLength={timeline.saveQueueLength}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Offline Banner */}
      <div className="px-4 pt-4">
        <OfflineBanner
          isOnline={timeline.isOnline}
          queueLength={timeline.saveQueueLength}
        />
      </div>

      {/* Transport Controls */}
      <div className="flex-shrink-0 p-4 border-y border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          {/* Playback */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => timeline.jumpToStart()}
              title="Jump to start"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => timeline.skipBackward(5)}
              title="Skip backward 5s"
            >
              <SkipBack className="w-4 h-4" />
              <span className="text-xs ml-1">5s</span>
            </Button>
            <Button
              size="lg"
              onClick={timeline.togglePlay}
              className="w-16 h-16 rounded-full bg-white text-[#DC143C] hover:bg-slate-100 border-2 border-[#DC143C]"
            >
              {timeline.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => timeline.skipForward(5)}
              title="Skip forward 5s"
            >
              <span className="text-xs mr-1">5s</span>
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => timeline.jumpToEnd()}
              title="Jump to end"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Playhead Position */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeline.playheadPosition)}
            </Badge>
          </div>

          {/* Zoom & Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={timeline.zoomOut}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400 font-mono w-16 text-center">
              {timeline.zoomLevel}px/s
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={timeline.zoomIn}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-2" />
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (timeline.selectedClips.size > 0) {
                  timeline.removeClips(Array.from(timeline.selectedClips));
                }
              }}
              disabled={timeline.selectedClips.size === 0}
              title="Delete selected clips"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                timeline.selectedClips.forEach(clipId => {
                  timeline.duplicateClip(clipId);
                });
              }}
              disabled={timeline.selectedClips.size === 0}
              title="Duplicate selected clips"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={timeline.saveProject}
              className="bg-white text-[#DC143C] hover:bg-slate-100 border border-[#DC143C]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
        {/* Time Ruler */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-20 overflow-x-auto custom-scrollbar">
          <div className="relative h-full" style={{ width: `${totalTimelineWidth}px` }}>
            {timeMarks.map(time => (
              <div
                key={time}
                className="absolute top-0 h-full flex flex-col justify-center"
                style={{ left: `${time * timeline.zoomLevel}px` }}
              >
                <div className="h-2 w-px bg-slate-400 dark:bg-slate-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono ml-1">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Container */}
        <div
          ref={timelineRef}
          className="absolute top-10 left-0 right-0 bottom-0 overflow-auto custom-scrollbar"
          onClick={() => timeline.clearSelection()}
        >
          <div className="relative" style={{ width: `${totalTimelineWidth}px`, minHeight: '100%' }}>
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{ left: `${timeline.playheadPosition * timeline.zoomLevel}px` }}
            >
              <div className="absolute -top-10 -left-2 w-4 h-4 bg-red-500 rounded-full" />
            </div>

            {/* Tracks */}
            <div className="flex flex-col gap-2 p-2">
              {clipsByTrack.map(({ config, clips, assets }) => (
                <div
                  key={config.id}
                  className="relative h-20 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                >
                  {/* Track Label */}
                  <div className={`absolute left-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-10`}>
                    <div className={`${config.color} bg-opacity-20 dark:bg-opacity-30 rounded p-1`}>
                      {config.icon}
                    </div>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                      {config.label}
                    </span>
                  </div>

                  {/* Clips Container (Legacy video clips) */}
                  <div className="absolute left-20 top-0 right-0 bottom-0">
                    {clips.map(clip => (
                      <TimelineClipComponent
                        key={clip.id}
                        clip={clip}
                        zoomLevel={timeline.zoomLevel}
                        isSelected={timeline.selectedClips.has(clip.id)}
                        onSelect={(addToSelection) => timeline.selectClip(clip.id, addToSelection)}
                        onRemove={() => timeline.removeClip(clip.id)}
                        onMove={(newTrack, newStartTime) => timeline.moveClip(clip.id, newTrack, newStartTime)}
                        trackHeight={80}
                        frameRate={timeline.project.frameRate}
                      />
                    ))}
                    
                    {/* Assets (Story beats, audio, etc.) */}
                    {assets.map(asset => {
                      // Simple asset rendering for now
                      const isStoryBeat = asset.metadata?.shotType === 'story-beat';
                      const leftPos = asset.startTime * timeline.zoomLevel;
                      const width = asset.duration * timeline.zoomLevel;
                      
                      return (
                        <div
                          key={asset.id}
                          className={`absolute top-1 h-16 rounded px-2 py-1 text-xs cursor-pointer border-2 ${
                            timeline.selectedClips.has(asset.id)
                              ? 'ring-2 ring-[#DC143C]'
                              : ''
                          } ${
                            isStoryBeat
                              ? 'bg-[#DC143C] bg-opacity-80 border-[#A01020] text-white font-bold'
                              : config.type === 'audio-music'
                              ? 'bg-purple-500 bg-opacity-80 border-purple-700 text-base-content'
                              : config.type === 'audio-voice'
                              ? 'bg-green-500 bg-opacity-80 border-green-700 text-base-content'
                              : config.type === 'audio-sfx'
                              ? 'bg-orange-500 bg-opacity-80 border-orange-700 text-base-content'
                              : 'bg-blue-500 bg-opacity-80 border-blue-700 text-base-content'
                          }`}
                          style={{ left: `${leftPos}px`, width: `${width}px` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            timeline.selectClip(asset.id, e.shiftKey || e.metaKey);
                          }}
                          title={asset.name}
                        >
                          <div className="truncate font-semibold">{asset.name}</div>
                          {asset.metadata?.description && (
                            <div className="truncate text-xs opacity-80">{asset.metadata.description}</div>
                          )}
                          {isStoryBeat && (
                            <Lightbulb className="w-3 h-3 inline-block ml-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {timeline.clips.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <Film className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                    No clips on timeline
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Import shots from Shot List or drag video files here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-mono">
              {timeline.clips.length + timeline.assets.length} element{(timeline.clips.length + timeline.assets.length) !== 1 ? 's' : ''}
            </span>
            {timeline.selectedClips.size > 0 && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                {timeline.selectedClips.size} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">{timeline.project.resolution}</span>
            <span className="font-mono">{timeline.project.aspectRatio}</span>
            <span className="font-mono">{timeline.project.frameRate}fps</span>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Add Element */}
      <Button
        onClick={() => setShowAddPanel(!showAddPanel)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-2xl z-50 border-2 border-white dark:border-slate-700"
        title="Add element to timeline"
      >
        {showAddPanel ? (
          <X className="w-6 h-6 text-base-content" />
        ) : (
          <Plus className="w-6 h-6 text-base-content" />
        )}
      </Button>

      {/* Add Element Panel */}
      {showAddPanel && (
        <div className="fixed bottom-28 right-8 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-base-content">
            <h3 className="font-bold text-lg">Add Element</h3>
            <p className="text-sm opacity-90">Choose an element type to add</p>
          </div>

          {selectedAddType === null ? (
            <div className="p-4 space-y-3">
              {/* Story Beat Button */}
              <button
                onClick={() => {
                  setSelectedAddType('story-beat');
                  setStoryBeatForm(prev => ({ ...prev, startTime: timeline.playheadPosition }));
                }}
                className="w-full p-4 rounded-lg border-2 border-[#DC143C] bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#DC143C] p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-base-content">Story Beat</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Mark narrative moments</div>
                  </div>
                </div>
              </button>

              {/* Music Button */}
              <button
                onClick={() => {
                  setSelectedAddType('music');
                  fileInputRef.current?.click();
                }}
                className="w-full p-4 rounded-lg border-2 border-purple-400 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Music className="w-6 h-6 text-base-content" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-base-content">Music Track</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Background music or score</div>
                  </div>
                </div>
              </button>

              {/* Voice Button */}
              <button
                onClick={() => {
                  setSelectedAddType('voice');
                  fileInputRef.current?.click();
                }}
                className="w-full p-4 rounded-lg border-2 border-green-400 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-base-content" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-base-content">Voice/Narration</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Dialogue or voice-over</div>
                  </div>
                </div>
              </button>

              {/* Sound Effect Button */}
              <button
                onClick={() => {
                  setSelectedAddType('sfx');
                  fileInputRef.current?.click();
                }}
                className="w-full p-4 rounded-lg border-2 border-orange-400 bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Volume2 className="w-6 h-6 text-base-content" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-base-content">Sound Effect</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">SFX and ambient audio</div>
                  </div>
                </div>
              </button>
            </div>
          ) : selectedAddType === 'story-beat' ? (
            <div className="p-4 space-y-4">
              <button
                onClick={() => setSelectedAddType(null)}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={storyBeatForm.title}
                  onChange={(e) => setStoryBeatForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-base-content"
                  placeholder="e.g., Act 1 Break, Midpoint"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={storyBeatForm.description}
                  onChange={(e) => setStoryBeatForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-base-content"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Time (s)
                  </label>
                  <input
                    type="number"
                    value={storyBeatForm.startTime}
                    onChange={(e) => setStoryBeatForm(prev => ({ ...prev, startTime: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-base-content"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    value={storyBeatForm.duration}
                    onChange={(e) => setStoryBeatForm(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-base-content"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAddType(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStoryBeat}
                  className="flex-1 bg-[#DC143C] hover:bg-[#B01030] text-white"
                >
                  Add Beat
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
