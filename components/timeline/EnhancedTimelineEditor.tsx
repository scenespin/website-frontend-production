/**
 * Enhanced Multi-Track Timeline Editor
 * 
 * Professional timeline with 8 video tracks + 8 audio tracks
 * Supports video, audio, images, and music assets
 * Frame-accurate positioning with keyframe support
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
  Layers,
  Music,
  Image as ImageIcon,
  Clock,
  Maximize2,
  Minimize2,
  Download,  // Export icon
  Sparkles,  // NEW: Send to Composition icon
  DollarSign,  // NEW: Cost icon
  Info,  // NEW: Info icon
  Plus  // NEW: Mobile FAB icon
} from 'lucide-react';
import { useTimeline, TimelineAsset, calculateProjectCost, getCostBreakdown, createDefaultLUTMetadata } from '@/hooks/useTimeline';
import { TimelineAssetComponent } from './TimelineAssetComponent';
import { TrackHeader } from './TrackHeader';
import { ExportModal, ExportSettings } from './ExportModal';  // NEW
import { ExportProgressModal, ExportStatus } from './ExportProgressModal';  // NEW
import { VideoPreviewModal } from './VideoPreviewModal';  // NEW
import { TransitionPicker } from './TransitionPicker';  // NEW: Feature 0065
import { LUTPicker } from './LUTPicker';  // NEW: Feature 0065
import { UploadModal } from './UploadModal';  // NEW: Feature 0070
import { MediaGallery } from '@/components/media/MediaGallery';  // NEW: Mobile media picker
import { motion } from 'framer-motion';  // For FAB animation
import { toast } from 'sonner';  // For feedback

interface EnhancedTimelineEditorProps {
  projectId?: string;
  preloadedClip?: { url: string; type: string; name: string } | null;
  preloadedClips?: Array<{ url: string; type: string; name: string }> | null;
}

export function EnhancedTimelineEditor({ projectId, preloadedClip, preloadedClips }: EnhancedTimelineEditorProps) {
  const timeline = useTimeline({
    projectId,
    autoSave: true,
    autoSaveInterval: 30000
  });

  const timelineRef = useRef<HTMLDivElement>(null);
  const trackHeadersRef = useRef<HTMLDivElement>(null);
  const [showAudioTracks, setShowAudioTracks] = useState(true);
  const [trackStates, setTrackStates] = useState<Record<number, {
    visible?: boolean;
    locked?: boolean;
    muted?: boolean;
    volume?: number;
  }>>({});

  // NEW: Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [completedVideoUrl, setCompletedVideoUrl] = useState<string | null>(null);
  const [exportMetadata, setExportMetadata] = useState<{ 
    resolution: string;
    aspectRatio: string;
    frameRate: number;
    duration: number;
    creditsUsed: number;
    s3Key?: string;
    renderTime?: number;
  } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // NEW: Transition/LUT picker states (Feature 0065)
  const [showTransitionPicker, setShowTransitionPicker] = useState(false);
  const [showLUTPicker, setShowLUTPicker] = useState(false);
  const [selectedClipForTransition, setSelectedClipForTransition] = useState<string | null>(null);
  const [selectedClipForLUT, setSelectedClipForLUT] = useState<string | null>(null);

  // NEW: Touch zoom support for mobile
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  
  // NEW: Mobile FAB and MediaGallery states
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // NEW: Upload modal state (Feature 0070)
  const [showUploadModal, setShowUploadModal] = useState(false);

  // NEW: Handle preloaded clip from gallery (single clip)
  useEffect(() => {
    if (preloadedClip && timeline.assets.length === 0) {
      // Add the preloaded clip to the first video track
      const newAsset: Omit<TimelineAsset, 'id'> = {
        type: preloadedClip.type as 'video' | 'audio' | 'image',
        url: preloadedClip.url,
        name: preloadedClip.name,
        track: 0, // First video track
        trackType: 'video',
        startTime: 0,
        duration: preloadedClip.type === 'image' ? 5 : 10, // Default duration
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
        keyframes: [],
        lut: createDefaultLUTMetadata()  // NEW: Auto-apply Wryda Signature LUT (Feature 0065)
      };
      
      timeline.addAsset(newAsset);
    }
  }, [preloadedClip, timeline]);

  // NEW: Handle multiple preloaded clips from Production page
  useEffect(() => {
    if (preloadedClips && preloadedClips.length > 0 && timeline.assets.length === 0) {
      // Add clips sequentially on Track V-1 (one after another in time)
      let currentTime = 0;
      
      preloadedClips.forEach((clip, index) => {
        const duration = clip.type === 'image' ? 5 : 10; // Default duration
        
        const newAsset: Omit<TimelineAsset, 'id'> = {
          type: clip.type as 'video' | 'audio' | 'image',
          url: clip.url,
          name: clip.name,
          track: 0, // All on V-1 (first track) in sequence
          trackType: 'video',
          startTime: currentTime, // Sequential placement
          duration: duration,
          trimStart: 0,
          trimEnd: 0,
          volume: 1,
          keyframes: [],
          lut: createDefaultLUTMetadata()  // NEW: Auto-apply Wryda Signature LUT (Feature 0065)
        };
        
        timeline.addAsset(newAsset);
        currentTime += duration; // Next clip starts where this one ends
      });
    }
  }, [preloadedClips, timeline]);
  
  // NEW: Handle clip replacement from Composition Studio
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const replaceData = params.get('replaceClips');
    
    if (replaceData && timeline.assets.length > 0) {
      try {
        const data = JSON.parse(decodeURIComponent(replaceData));
        
        // Verify project match
        if (data.projectId === timeline.project.id) {
          handleReplaceClips(data);
          
          // Clean URL
          window.history.replaceState({}, '', '/app/timeline');
        }
      } catch (error) {
        console.error('[Timeline] Failed to parse replaceClips:', error);
      }
    }
  }, [timeline.assets.length, timeline.project.id]);
  
  // Replace clips with composed version
  const handleReplaceClips = (data: any) => {
    const { composedUrl, originalClips } = data;
    
    // Get first clip position
    const firstClip = originalClips[0];
    
    // Calculate total duration of original clips
    const totalDuration = originalClips.reduce((sum: number, clip: any) => 
      sum + (clip.duration || 10), 0
    );
    
    // Create composed clip
    const composedClip: Omit<TimelineAsset, 'id'> = {
      type: 'video',
      url: composedUrl,
      name: 'composed_scene.mp4',
      track: firstClip.trackIndex,
      trackType: firstClip.trackType,
      startTime: firstClip.position,
      duration: totalDuration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      keyframes: []
    };
    
    // Remove original clips
    originalClips.forEach((clip: any) => {
      timeline.removeAsset(clip.originalId);
    });
    
    // Add composed clip
    timeline.addAsset(composedClip);
    
    // Show success with toast
    const { toast } = require('sonner');
    toast.success('✨ Composition applied!', {
      description: `Replaced ${originalClips.length} clips with composed version`
    });
  };

  // Synchronize vertical scrolling between timeline and track headers
  useEffect(() => {
    const timelineElement = timelineRef.current;
    const trackHeadersElement = trackHeadersRef.current;
    
    if (!timelineElement || !trackHeadersElement) return;

    const handleTimelineScroll = () => {
      trackHeadersElement.scrollTop = timelineElement.scrollTop;
    };

    timelineElement.addEventListener('scroll', handleTimelineScroll);
    return () => timelineElement.removeEventListener('scroll', handleTimelineScroll);
  }, []);

  // NEW: Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timelineElement = timelineRef.current;
    if (!timelineElement) return;

    // Prevent default pinch zoom on the timeline
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Handle pinch-to-zoom gesture
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (lastPinchDistance !== null) {
          const delta = distance - lastPinchDistance;
          const zoomSensitivity = 0.01;
          
          if (delta > 5) {
            // Pinch out - zoom in
            timeline.zoomIn();
          } else if (delta < -5) {
            // Pinch in - zoom out
            timeline.zoomOut();
          }
        }
        
        setLastPinchDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      setLastPinchDistance(null);
    };

    timelineElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    timelineElement.addEventListener('touchstart', preventZoom, { passive: false });
    timelineElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      timelineElement.removeEventListener('touchmove', handleTouchMove);
      timelineElement.removeEventListener('touchstart', preventZoom);
      timelineElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [timeline, lastPinchDistance]);
  
  /**
   * Handle adding media from MediaGallery to timeline
   * NEW: Mobile FAB feature
   */
  const handleAddMediaToTimeline = (item: any) => {
    const newAsset: Omit<TimelineAsset, 'id'> = {
      type: item.type as 'video' | 'audio' | 'image',
      url: item.url,
      name: item.name,
      track: 0, // First video track
      trackType: item.type === 'video' || item.type === 'image' ? 'video' : 'audio',
      startTime: 0, // Add at the beginning for now (could use totalDuration for end)
      duration: item.type === 'image' ? 5 : 10, // Default duration
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      keyframes: [],
      lut: createDefaultLUTMetadata()
    };
    
    timeline.addAsset(newAsset);
    setShowMediaGallery(false);
    
    toast.success(`Added ${item.name} to timeline`, {
      description: `Placed at 0s on Track ${item.type === 'video' ? 'V-1' : 'A-1'}`
    });
  };
  
  /**
   * Handler for upload complete (Feature 0070)
   */
  const handleUploadComplete = (url: string, s3Key: string, type: string, name: string) => {
    const newAsset: Omit<TimelineAsset, 'id'> = {
      type: type as 'video' | 'audio' | 'image',
      url: url,
      name: name,
      track: 0,
      trackType: type === 'audio' ? 'audio' : 'video',
      startTime: 0,
      duration: type === 'image' ? 5 : 10,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      keyframes: [],
      lut: type === 'image' || type === 'video' ? createDefaultLUTMetadata() : undefined,
      assetMetadata: {
        sourceType: 'uploaded',
        uploadedAt: new Date().toISOString(),
        originalFilename: name,
        fileSize: 0, // Unknown from upload
        mimeType: type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'image/jpeg',
        generatedAt: new Date().toISOString(),
        provider: 'user-upload',
        creditsUsed: 0
      }
    };
    
    timeline.addAsset(newAsset);
    
    toast.success(`Added ${name} to timeline`, {
      description: `Placed at 0s on Track ${type === 'audio' ? 'A-1' : 'V-1'}`
    });
  };

  // Calculate timeline dimensions
  const totalTimelineWidth = Math.max(
    timeline.totalDuration * timeline.zoomLevel,
    2000
  );

  // Track configuration
  const videoTrackCount = timeline.project.trackConfig.videoTracks;
  const audioTrackCount = timeline.project.trackConfig.audioTracks;

  // Group assets by track and type
  const videoAssets = Array.from({ length: videoTrackCount }, (_, trackNum) =>
    timeline.assets.filter(a => a.trackType === 'video' && a.track === trackNum)
  );

  const audioAssets = Array.from({ length: audioTrackCount }, (_, trackNum) =>
    timeline.assets.filter(a => a.trackType === 'audio' && a.track === trackNum)
  );

  // Time ruler marks
  const timeMarks = [];
  for (let t = 0; t <= timeline.totalDuration; t += 5) {
    timeMarks.push(t);
  }

  // Format time as MM:SS.f
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Format frame number
  const formatFrame = (seconds: number): string => {
    const frameNum = Math.round(seconds * timeline.project.frameRate);
    return `F${frameNum}`;
  };

  // Handle delete selected assets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (timeline.selectedClips.size > 0) {
          e.preventDefault();
          const selectedIds = Array.from(timeline.selectedClips);
          selectedIds.forEach(id => {
            // Try to remove from assets (new system)
            timeline.removeAsset(id);
            // Also try clips for backward compat
            timeline.removeClip(id);
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeline.selectedClips, timeline.removeAsset, timeline.removeClip]);

  // Track control handlers
  const toggleTrackState = (trackNum: number, property: 'visible' | 'locked' | 'muted') => {
    setTrackStates(prev => ({
      ...prev,
      [trackNum]: {
        ...prev[trackNum],
        [property]: !prev[trackNum]?.[property]
      }
    }));
  };

  const setTrackVolume = (trackNum: number, volume: number) => {
    setTrackStates(prev => ({
      ...prev,
      [trackNum]: {
        ...prev[trackNum],
        volume
      }
    }));
  };

  // NEW: Handle export
  const handleExport = async (settings: ExportSettings) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/timeline/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: timeline.project.id,
          assets: timeline.project.assets,
          duration: timeline.totalDuration,
          resolution: settings.resolution,
          aspectRatio: settings.aspectRatio,
          frameRate: settings.frameRate,
          speed_tier: settings.speedTier
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      const data = await response.json();
      
      // Close export modal and show progress
      setShowExportModal(false);
      setExportJobId(data.job_id);
      
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  // NEW: Handle export completion
  const handleExportComplete = (videoUrl: string, metadata: ExportStatus) => {
    setExportJobId(null);
    setCompletedVideoUrl(videoUrl);
    // Map ExportStatus to ExportMetadata
    setExportMetadata({
      resolution: '1920x1080', // Default or extract from settings
      aspectRatio: '16:9',
      frameRate: 30,
      duration: 0, // You might want to calculate this from timeline
      creditsUsed: metadata.credits_deducted,
      renderTime: metadata.processing_time_ms,
    });
    setShowPreviewModal(true);
  };
  
  // NEW: Send selected clips to Composition Studio
  const handleSendToComposition = () => {
    const selectedIds = Array.from(timeline.selectedClips);
    
    // Get full asset data for selected clips
    const selectedAssets = timeline.assets.filter(asset => 
      selectedIds.includes(asset.id)
    );
    
    if (selectedAssets.length === 0) {
      return;
    }
    
    // Prepare clip data with timeline metadata
    const clipsData = selectedAssets.map(asset => ({
      url: asset.url,
      type: asset.type,
      name: asset.name,
      // Timeline metadata for replacement
      startTime: asset.trimStart || 0,
      endTime: asset.trimEnd || asset.duration,
      trackIndex: asset.track,
      trackType: asset.trackType,
      position: asset.startTime,
      originalId: asset.id,
      duration: asset.duration
    }));
    
    // Encode data with recompose mode flag
    const recomposeData = {
      clips: clipsData,
      returnTo: 'timeline',
      mode: 'recompose',
      projectId: timeline.project.id
    };
    
    const encoded = encodeURIComponent(JSON.stringify(recomposeData));
    
    // Navigate to Composition Studio
    window.location.href = `/app/composition?recompose=${encoded}`;
  };

  // NEW: Handle transition application (Feature 0065)
  const handleAddTransition = (clipId: string) => {
    setSelectedClipForTransition(clipId);
    setShowTransitionPicker(true);
  };

  const handleApplyTransition = (transition: { type: string; duration: number; easing?: string }) => {
    if (selectedClipForTransition) {
      timeline.updateAsset(selectedClipForTransition, {
        transition: {
          type: transition.type,
          duration: transition.duration,
          easing: transition.easing as "linear" | "ease-in" | "ease-out" | "ease-in-out" | undefined
        }
      });
      setShowTransitionPicker(false);
      setSelectedClipForTransition(null);
    }
  };

  // NEW: Handle LUT application (Feature 0065)
  const handleAddLUT = (clipId: string) => {
    setSelectedClipForLUT(clipId);
    setShowLUTPicker(true);
  };

  const handleApplyLUT = (lut: { name: string; lutId: string; cubeFile: string; intensity: number } | null) => {
    if (selectedClipForLUT) {
      timeline.updateAsset(selectedClipForLUT, {
        lut: lut || undefined
      });
      setShowLUTPicker(false);
      setSelectedClipForLUT(null);
    }
  };


  // Count assets by type
  const assetCounts = {
    video: timeline.assets.filter(a => a.type === 'video').length,
    audio: timeline.assets.filter(a => a.type === 'audio').length,
    image: timeline.assets.filter(a => a.type === 'image').length,
    music: timeline.assets.filter(a => a.type === 'music').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <Card className="flex-shrink-0 border-b rounded-none bg-white dark:bg-slate-900 shadow-md overflow-hidden">
        {/* Desktop Header Layout */}
        <div className="hidden md:flex items-center justify-between p-4 overflow-x-auto">
          {/* Left: Project Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {timeline.project.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                <span className="font-mono">{timeline.project.resolution}</span>
                <span className="font-mono">{timeline.project.aspectRatio}</span>
                <span className="font-mono">{timeline.project.frameRate}fps</span>
                <span>•</span>
                <span>{formatTime(timeline.totalDuration)}</span>
                {/* NEW: Project Cost Display (Feature 0064) */}
                <span>•</span>
                <ProjectCostBadge assets={timeline.assets} />
              </div>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => timeline.skipBackward()}
              title="Skip back 5s"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant={timeline.isPlaying ? "default" : "outline"}
              size="sm"
              onClick={timeline.togglePlay}
              className="w-16"
            >
              {timeline.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => timeline.skipForward()}
              title="Skip forward 5s"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="ml-4 text-sm font-mono text-slate-700 dark:text-slate-300">
              {formatTime(timeline.playheadPosition)} / {formatTime(timeline.totalDuration)}
              <span className="ml-2 text-xs text-slate-500">
                {formatFrame(timeline.playheadPosition)}
              </span>
            </div>
          </div>

          {/* Right: Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAudioTracks(!showAudioTracks)}
              title={showAudioTracks ? "Hide audio tracks" : "Show audio tracks"}
            >
              {showAudioTracks ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={timeline.zoomOut}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={timeline.zoomIn}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
            
            {/* NEW: Desktop Add Media Button (Feature 0070) */}
            <Button
              onClick={() => setShowUploadModal(true)}
              size="sm"
              variant="outline"
              className="hidden md:flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Media
            </Button>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />

            {/* NEW: Export Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={timeline.assets.length === 0}
              title="Export video"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={timeline.saveProject}
              title="Save project"
            >
              <Save className="w-4 h-4" />
            </Button>

            {timeline.selectedClips.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendToComposition}
                  title="Send to Composition Studio"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Re-compose
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const selectedIds = Array.from(timeline.selectedClips);
                    selectedIds.forEach(id => {
                      timeline.removeAsset(id);
                      timeline.removeClip(id);
                    });
                  }}
                  title="Delete selected"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header Layout - Simplified and centered */}
        <div className="md:hidden p-3">
          {/* Top Row: Project Name */}
          <div className="flex items-center justify-center mb-3">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {timeline.project.name}
            </h2>
          </div>
          
          {/* Bottom Row: Centered Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => timeline.skipBackward()}
              title="Skip back 5s"
              className="h-9 w-9 p-0"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant={timeline.isPlaying ? "default" : "outline"}
              size="sm"
              onClick={timeline.togglePlay}
              className="h-9 px-4"
            >
              {timeline.isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => timeline.skipForward()}
              title="Skip forward 5s"
              className="h-9 w-9 p-0"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="ml-2 text-xs font-mono text-slate-700 dark:text-slate-300">
              {formatTime(timeline.playheadPosition)}
            </div>
          </div>
        </div>

        {/* Asset Count Stats */}
        <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 hidden md:flex">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Film className="w-3 h-3 mr-1" />
            {assetCounts.video} Video
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Music className="w-3 h-3 mr-1" />
            {assetCounts.audio + assetCounts.music} Audio
          </Badge>
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <ImageIcon className="w-3 h-3 mr-1" />
            {assetCounts.image} Image
          </Badge>
          {timeline.selectedClips.size > 0 && (
            <Badge variant="default" className="bg-yellow-500">
              {timeline.selectedClips.size} selected
            </Badge>
          )}
        </div>
      </Card>

      {/* Timeline Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers - Fixed sidebar that doesn't scroll horizontally */}
        <div className="flex-shrink-0 w-24 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-hidden flex flex-col">
          {/* Spacer for time ruler */}
          <div className="h-10 border-b-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
          
          {/* Scrollable track headers */}
          <div className="flex-1 overflow-y-auto custom-scrollbar" ref={trackHeadersRef}>
            {/* Video Track Headers */}
            {Array.from({ length: videoTrackCount }).map((_, trackNum) => (
              <div key={`v-${trackNum}`} className="h-16 border-b border-slate-200 dark:border-slate-700">
                <TrackHeader
                  trackNumber={trackNum}
                  trackType="video"
                  isVisible={trackStates[trackNum]?.visible !== false}
                  isLocked={trackStates[trackNum]?.locked}
                  onToggleVisible={() => toggleTrackState(trackNum, 'visible')}
                  onToggleLock={() => toggleTrackState(trackNum, 'locked')}
                />
              </div>
            ))}

            {/* Audio Track Headers */}
            {showAudioTracks && Array.from({ length: audioTrackCount }).map((_, trackNum) => (
              <div key={`a-${trackNum}`} className="h-12 border-b border-slate-200 dark:border-slate-700">
                <TrackHeader
                  trackNumber={trackNum}
                  trackType="audio"
                  isMuted={trackStates[trackNum + 8]?.muted}
                  isLocked={trackStates[trackNum + 8]?.locked}
                  volume={trackStates[trackNum + 8]?.volume || 1}
                  onToggleMute={() => toggleTrackState(trackNum + 8, 'muted')}
                  onToggleLock={() => toggleTrackState(trackNum + 8, 'locked')}
                  onVolumeChange={(vol) => setTrackVolume(trackNum + 8, vol)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Canvas */}
        <div className="flex-1 overflow-auto custom-scrollbar" ref={timelineRef}>
          <div className="relative" style={{ width: `${totalTimelineWidth}px` }}>
            {/* Time Ruler */}
            <div className="sticky top-0 z-30 h-10 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-600 flex items-center">
              {timeMarks.map(time => (
                <div
                  key={time}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${time * timeline.zoomLevel}px` }}
                >
                  <div className="h-3 w-px bg-slate-400 dark:bg-slate-500" />
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                    {formatTime(time)}
                  </span>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
              style={{ left: `${timeline.playheadPosition * timeline.zoomLevel}px` }}
            >
              <div className="absolute top-0 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
            </div>

            {/* Video Tracks */}
            <div className="relative">
              {Array.from({ length: videoTrackCount }).map((_, trackNum) => {
                const trackAssets = videoAssets[trackNum];
                const isVisible = trackStates[trackNum]?.visible !== false;
                
                return (
                  <div
                    key={`track-v-${trackNum}`}
                    className={`relative h-16 border-b border-slate-200 dark:border-slate-700 ${
                      isVisible ? '' : 'opacity-30'
                    }`}
                  >
                    {trackAssets.map(asset => (
                      <TimelineAssetComponent
                        key={asset.id}
                        asset={asset}
                        zoomLevel={timeline.zoomLevel}
                        isSelected={timeline.selectedClips.has(asset.id)}
                        onSelect={(addToSelection) => timeline.selectClip(asset.id, addToSelection)}
                        onRemove={() => timeline.removeAsset(asset.id)}
                        onMove={(newTrack, newStartTime) => timeline.moveAsset(asset.id, newTrack, newStartTime)}
                        trackHeight={60}
                        frameRate={timeline.project.frameRate}
                        onAddTransition={handleAddTransition}
                        onAddLUT={handleAddLUT}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Audio Tracks */}
            {showAudioTracks && (
              <div className="relative border-t-2 border-slate-400 dark:border-slate-600">
                {Array.from({ length: audioTrackCount }).map((_, trackNum) => {
                  const trackAssets = audioAssets[trackNum];
                  
                  return (
                    <div
                      key={`track-a-${trackNum}`}
                      className="relative h-12 border-b border-slate-200 dark:border-slate-700"
                    >
                      {trackAssets.map(asset => (
                        <TimelineAssetComponent
                          key={asset.id}
                          asset={asset}
                          zoomLevel={timeline.zoomLevel}
                          isSelected={timeline.selectedClips.has(asset.id)}
                          onSelect={(addToSelection) => timeline.selectClip(asset.id, addToSelection)}
                          onRemove={() => timeline.removeAsset(asset.id)}
                          onMove={(newTrack, newStartTime) => timeline.moveAsset(asset.id, newTrack, newStartTime)}
                          trackHeight={45}
                          frameRate={timeline.project.frameRate}
                          onAddTransition={handleAddTransition}
                          onAddLUT={handleAddLUT}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {timeline.assets.length === 0 && timeline.clips.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8">
                  <Layers className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                    No assets on timeline
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Import shots or drag media files here to begin editing
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* NEW: Export Modals */}
      {showExportModal && (
        <ExportModal
          project={timeline.project}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          userCredits={1000}  // TODO: Fetch from user context
          userTier="pro"  // TODO: Fetch from user context
        />
      )}

      {exportJobId && (
        <ExportProgressModal
          jobId={exportJobId}
          onComplete={handleExportComplete}
          onClose={() => setExportJobId(null)}
          autoCloseOnComplete={false}
        />
      )}

      {showPreviewModal && completedVideoUrl && exportMetadata && (
        <VideoPreviewModal
          videoUrl={completedVideoUrl}
          metadata={exportMetadata}
          onClose={() => {
            setShowPreviewModal(false);
            setCompletedVideoUrl(null);
            setExportMetadata(null);
          }}
          projectName={timeline.project.name}
        />
      )}

      {/* Transition Picker Modal - NEW (Feature 0065) */}
      {showTransitionPicker && (
        <TransitionPicker
          onSelect={handleApplyTransition}
          onClose={() => {
            setShowTransitionPicker(false);
            setSelectedClipForTransition(null);
          }}
        />
      )}

      {/* LUT Picker Modal - NEW (Feature 0065) */}
      {showLUTPicker && selectedClipForLUT && (
        <LUTPicker
          asset={timeline.assets.find(a => a.id === selectedClipForLUT)!}
          onSelect={handleApplyLUT}
          onClose={() => {
            setShowLUTPicker(false);
            setSelectedClipForLUT(null);
          }}
        />
      )}
      
      {/* Mobile: Floating Action Button (FAB) */}
      {isMobile && (
        <motion.button
          onClick={() => setShowMediaGallery(true)}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          title="Add media to timeline"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
      
      {/* MediaGallery Modal */}
      <MediaGallery
        isOpen={showMediaGallery}
        onClose={() => setShowMediaGallery(false)}
        onAddToTimeline={handleAddMediaToTimeline}
      />
      
      {/* Upload Modal (Feature 0070) */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
          projectId={projectId}
        />
      )}
    </div>
  );
}

/**
 * Project Cost Badge Component
 * Shows total credits used in project with breakdown tooltip
 * Feature 0064: Universal Asset Metadata Tracking
 */
function ProjectCostBadge({ assets }: { assets: TimelineAsset[] }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const totalCost = calculateProjectCost(assets);
  const breakdown = getCostBreakdown(assets);
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Badge 
        variant="outline" 
        className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 flex items-center gap-1 cursor-help"
      >
        <DollarSign className="w-3 h-3" />
        {totalCost} credits
      </Badge>
      
      {/* Tooltip */}
      {showTooltip && totalCost > 0 && (
        <div className="absolute left-0 top-full mt-2 z-50 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-3 text-xs">
          <div className="font-bold text-white mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Cost Breakdown
          </div>
          <div className="space-y-1.5">
            {breakdown.videos > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>AI Videos:</span>
                <span className="font-mono">{breakdown.videos}cr</span>
              </div>
            )}
            {breakdown.images > 0 && (
              <div className="flex justify-between text-blue-400">
                <span>AI Images:</span>
                <span className="font-mono">{breakdown.images}cr</span>
              </div>
            )}
            {breakdown.audio > 0 && (
              <div className="flex justify-between text-green-400">
                <span>AI Audio:</span>
                <span className="font-mono">{breakdown.audio}cr</span>
              </div>
            )}
            {breakdown.compositions > 0 && (
              <div className="flex justify-between text-yellow-400">
                <span>Compositions:</span>
                <span className="font-mono">{breakdown.compositions}cr</span>
              </div>
            )}
            {breakdown.uploads > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Uploads:</span>
                <span className="font-mono">FREE ✅</span>
              </div>
            )}
            <div className="pt-1.5 mt-1.5 border-t border-gray-700 flex justify-between text-white font-bold">
              <span>Total:</span>
              <span className="font-mono">{breakdown.total}cr</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

