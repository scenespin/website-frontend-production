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
  Plus,  // NEW: Mobile FAB icon
  X,  // NEW: Context dismiss icon
  Scissors,  // NEW: Split clip icon (Feature 0103)
  Eye,  // NEW: Preview mode icon (Feature 0103)
  EyeOff,  // NEW: Preview mode off icon (Feature 0103)
  Copy,  // NEW: Copy clips icon (Feature 0103 Sprint 2)
  Clipboard,  // NEW: Paste clips icon (Feature 0103 Sprint 2)
  Link,  // NEW: Ripple mode icon (Feature 0103 Sprint 2)
  Type,  // NEW: Add text icon (Feature 0103 Sprint 3)
  Github  // NEW: GitHub export icon (Feature 0110)
} from 'lucide-react';
import { useTimeline, TimelineAsset, calculateProjectCost, getCostBreakdown, createDefaultLUTMetadata } from '@/hooks/useTimeline';
import { TimelineAssetComponent } from './TimelineAssetComponent';
import { TrackHeader } from './TrackHeader';
import { ExportModal, ExportSettings } from './ExportModal';  // NEW
import { ExportProgressModal, ExportStatus } from './ExportProgressModal';  // NEW
import { VideoPreviewModal } from './VideoPreviewModal';  // NEW
import { useAuth } from '@clerk/nextjs';
import { TransitionPicker } from './TransitionPicker';  // NEW: Feature 0065
import { LUTPicker } from './LUTPicker';  // NEW: Feature 0065
import { SpeedSelector } from './SpeedSelector';  // NEW: Feature 0103
import { EffectsPanel } from './EffectsPanel';  // NEW: Feature 0103 Sprint 3
import { TextEditorPanel } from './TextEditorPanel';  // NEW: Feature 0103 Sprint 3
import { UploadModal } from './UploadModal';  // NEW: Feature 0070
import { MediaGallery } from '@/components/media/MediaGallery';  // NEW: Mobile media picker
import { MobileTimelineToolbar } from './MobileTimelineToolbar';  // NEW: Mobile bottom toolbar
import { MobileTimelineMoreMenu } from './MobileTimelineMoreMenu';  // NEW: Mobile more menu
import { motion } from 'framer-motion';  // For FAB animation
import { toast } from 'sonner';  // For feedback
import { useEditorContext, useContextStore } from '@/lib/contextStore';  // Contextual navigation
import { usePinchZoom } from '@/hooks/usePinchZoom';  // NEW: Pinch-to-zoom gestures
import { useHaptic } from '@/lib/haptics';  // NEW: Haptic feedback
import AgentDrawer from '@/components/agents/AgentDrawer';  // NEW: Audio Agent integration

interface EnhancedTimelineEditorProps {
  projectId?: string;
  preloadedClip?: { url: string; type: string; name: string } | null;
  preloadedClips?: Array<{ url: string; type: string; name: string }> | null;
}

export function EnhancedTimelineEditor({ projectId, preloadedClip, preloadedClips }: EnhancedTimelineEditorProps) {
  // Authentication
  const { getToken } = useAuth();
  
  const timeline = useTimeline({
    projectId,
    autoSave: true,
    autoSaveInterval: 30000
  });

  // Contextual navigation - Get current scene context from editor
  const editorContext = useEditorContext();

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

  // NEW: Speed/Reverse states (Feature 0103)
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [selectedClipForSpeed, setSelectedClipForSpeed] = useState<{ id: string; currentSpeed: number; duration: number } | null>(null);

  // NEW: Effects Panel state (Feature 0103 Sprint 3)
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [selectedClipForEffects, setSelectedClipForEffects] = useState<string | null>(null);

  // NEW: Text Editor state (Feature 0103 Sprint 3)
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedTextAsset, setSelectedTextAsset] = useState<TimelineAsset | null>(null);

  // NEW: Preview Mode for live speed preview (Feature 0103)
  const [previewMode, setPreviewMode] = useState(true); // Default ON for better UX

  // NEW: Touch zoom support for mobile
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  
  // NEW: Mobile FAB and MediaGallery states
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // NEW: Upload modal state (Feature 0070)
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // NEW: Audio Agent drawer state (UnifiedChatPanel in audio-only mode)
  const [showAudioAgent, setShowAudioAgent] = useState(false);
  
  // NEW: Desktop Tools Menu state
  const [showDesktopToolsMenu, setShowDesktopToolsMenu] = useState(false);
  
  // NEW: Mobile More Menu state
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  
  // NEW: Snap to grid state
  const [snapGrid, setSnapGrid] = useState(true);
  
  // NEW: Haptic feedback hook
  const haptic = useHaptic();
  
  // NEW: Pinch-to-zoom gesture support
  usePinchZoom({
    onZoomIn: () => {
      timeline.zoomIn();
      haptic.light();
    },
    onZoomOut: () => {
      timeline.zoomOut();
      haptic.light();
    },
    minPinchDistance: 50
  });

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

  // NEW: Preview Mode - Apply browser-native speed preview during playback (Feature 0103)
  useEffect(() => {
    if (!previewMode || !timeline.isPlaying) return;

    // Find the asset at current playhead position
    const currentAsset = timeline.assets.find(asset => {
      const assetStart = asset.startTime;
      const assetEnd = asset.startTime + asset.duration;
      return timeline.playheadPosition >= assetStart && timeline.playheadPosition < assetEnd;
    });

    if (currentAsset && currentAsset.speed && currentAsset.speed !== 1.0) {
      // Apply speed to all video/audio elements (browser-native)
      // Note: This is a simple preview - actual export will use FFmpeg for accuracy
      const mediaElements = document.querySelectorAll<HTMLVideoElement | HTMLAudioElement>('video, audio');
      mediaElements.forEach(element => {
        if (element.playbackRate !== currentAsset.speed!) {
          element.playbackRate = currentAsset.speed!;
        }
      });

      // Show info toast once
      if (!sessionStorage.getItem('previewModeInfoShown')) {
        toast.info('🎭 Preview Mode Active: Speed changes visible during playback', {
          duration: 3000
        });
        sessionStorage.setItem('previewModeInfoShown', 'true');
      }
    } else {
      // Reset to normal speed when no speed effect or not on a speed-modified clip
      const mediaElements = document.querySelectorAll<HTMLVideoElement | HTMLAudioElement>('video, audio');
      mediaElements.forEach(element => {
        if (element.playbackRate !== 1.0) {
          element.playbackRate = 1.0;
        }
      });
    }
  }, [timeline.isPlaying, timeline.playheadPosition, timeline.assets, previewMode]);

  // NEW: Keyboard shortcuts for Copy/Paste (Feature 0103 Sprint 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy: Ctrl/Cmd + C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        if (timeline.selectedClips.size > 0) {
          e.preventDefault();
          const count = timeline.copyClips(Array.from(timeline.selectedClips));
          toast.success(`📋 Copied ${count} clip${count > 1 ? 's' : ''} to clipboard`);
        }
      }
      
      // Paste: Ctrl/Cmd + V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (timeline.clipboard.length > 0) {
          e.preventDefault();
          const newIds = timeline.pasteClips();
          toast.success(`✨ Pasted ${newIds.length} clip${newIds.length > 1 ? 's' : ''} at playhead`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeline]);

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
      const token = await getToken({ template: 'wryda-backend' });
      
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

  // NEW: Handle speed change (Feature 0103)
  const handleSpeedChange = (clipId: string, currentSpeed: number) => {
    const asset = timeline.assets.find(a => a.id === clipId);
    if (asset) {
      setSelectedClipForSpeed({
        id: clipId,
        currentSpeed: currentSpeed,
        duration: asset.duration
      });
      setShowSpeedSelector(true);
    }
  };

  const handleApplySpeed = (speed: number) => {
    if (selectedClipForSpeed) {
      timeline.updateAsset(selectedClipForSpeed.id, {
        speed: speed,
        // Update duration based on speed: newDuration = originalDuration / speed
        // (This is cosmetic - backend will handle actual speed processing)
        duration: selectedClipForSpeed.duration / speed
      });
      toast.success(`Speed changed to ${speed}x`);
      setShowSpeedSelector(false);
      setSelectedClipForSpeed(null);
    }
  };

  // NEW: Handle reverse toggle (Feature 0103)
  const handleReverseToggle = (clipId: string) => {
    const asset = timeline.assets.find(a => a.id === clipId);
    if (asset) {
      timeline.updateAsset(clipId, {
        reversed: !asset.reversed
      });
      toast.success(asset.reversed ? 'Clip unreversed' : 'Clip reversed');
    }
  };

  // NEW: Handle effects/color grading (Feature 0103 Sprint 3)
  const handleAddEffects = (clipId: string) => {
    setSelectedClipForEffects(clipId);
    setShowEffectsPanel(true);
  };

  const handleApplyEffects = (effects: NonNullable<TimelineAsset['effects']>, colorGrading: NonNullable<TimelineAsset['colorGrading']>) => {
    if (selectedClipForEffects) {
      timeline.updateAsset(selectedClipForEffects, {
        effects: Object.values(effects).some(v => v && v > 0) ? effects : undefined,
        colorGrading: Object.values(colorGrading).some(v => v && v !== 0) ? colorGrading : undefined
      });
      const effectCount = Object.values(effects).filter(v => v && v > 0).length;
      const colorCount = Object.values(colorGrading).filter(v => v && v !== 0).length;
      const total = effectCount + colorCount;
      toast.success(`✨ Applied ${total} effect${total > 1 ? 's' : ''}`);
      setShowEffectsPanel(false);
      setSelectedClipForEffects(null);
    }
  };

  // NEW: Handle text/title overlays (Feature 0103 Sprint 3)
  const handleAddText = () => {
    setSelectedTextAsset(null);
    setShowTextEditor(true);
  };

  const handleEditText = (asset: TimelineAsset) => {
    setSelectedTextAsset(asset);
    setShowTextEditor(true);
  };

  const handleApplyText = (textConfig: NonNullable<TimelineAsset['textContent']>, duration: number) => {
    if (selectedTextAsset) {
      // Editing existing text
      timeline.updateAsset(selectedTextAsset.id, {
        textContent: textConfig,
        duration
      });
      toast.success('📝 Text updated');
    } else {
      // Adding new text
      const newTextAsset: TimelineAsset = {
        id: `text-${Date.now()}`,
        type: 'text',
      url: '', // Text doesn't need a URL
      name: textConfig.text.substring(0, 30) + (textConfig.text.length > 30 ? '...' : ''),
      track: 0, // Add to first video track
      trackType: 'video',
      startTime: timeline.playheadPosition,
      duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      textContent: textConfig
    };
    timeline.addAsset(newTextAsset);
      toast.success('📝 Text added to timeline');
    }
    setShowTextEditor(false);
    setSelectedTextAsset(null);
  };


  // NEW: Split clip at playhead (Feature 0103)
  const handleSplitAtPlayhead = () => {
    const playhead = timeline.playheadPosition;
    const selectedIds = Array.from(timeline.selectedClips);
    
    if (selectedIds.length !== 1) {
      toast.error('Please select exactly one clip to split');
      return;
    }

    const asset = timeline.assets.find(a => a.id === selectedIds[0]);
    if (!asset) return;

    // Check if playhead is within clip bounds
    if (playhead < asset.startTime || playhead > asset.startTime + asset.duration) {
      toast.error('Playhead must be within the selected clip');
      return;
    }

    // Calculate split point relative to clip
    const splitPoint = playhead - asset.startTime;

    // Create two new assets from the original
    const firstHalf: Omit<TimelineAsset, 'id'> = {
      ...asset,
      duration: splitPoint,
      trimEnd: asset.trimEnd + (asset.duration - splitPoint)
    };

    const secondHalf: Omit<TimelineAsset, 'id'> = {
      ...asset,
      startTime: playhead,
      duration: asset.duration - splitPoint,
      trimStart: asset.trimStart + splitPoint
    };

    // Remove original and add two new clips
    timeline.removeAsset(asset.id);
    timeline.addAsset(firstHalf);
    timeline.addAsset(secondHalf);

    toast.success('Clip split successfully');
  };

  // Count assets by type
  const assetCounts = {
    video: timeline.assets.filter(a => a.type === 'video').length,
    audio: timeline.assets.filter(a => a.type === 'audio').length,
    image: timeline.assets.filter(a => a.type === 'image').length,
    music: timeline.assets.filter(a => a.type === 'music').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Context Indicator Banner */}
      {editorContext.currentSceneName && (
        <div className="bg-info/10 border-b border-info/20 px-4 py-2 flex-shrink-0">
          <div className="text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Film className="w-4 h-4 text-info flex-shrink-0" />
              <span className="opacity-70">Editing clips from scene:</span>
              <span className="font-semibold text-info truncate">{editorContext.currentSceneName}</span>
              {editorContext.currentBeatName && (
                <>
                  <span className="opacity-50">•</span>
                  <span className="opacity-70">Beat:</span>
                  <span className="font-semibold truncate">{editorContext.currentBeatName}</span>
                </>
              )}
            </div>
            <button
              onClick={() => {
                const { clearContext } = useContextStore.getState();
                clearContext();
                toast.success('Context cleared');
              }}
              className="p-1 rounded hover:bg-base-300 text-base-content/60 hover:text-base-content flex-shrink-0 transition-colors"
              title="Clear context"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* NEW: Preview Mode Indicator (Feature 0103) - Shows when preview mode is active */}
      {previewMode && timeline.isPlaying && (
        <div className="bg-[#DC143C]/10 border-b border-[#DC143C]/20 px-3 py-1.5 flex-shrink-0 animate-pulse">
          <div className="text-xs md:text-sm flex items-center justify-center gap-2">
            <Eye className="w-3 h-3 md:w-4 md:h-4 text-[#DC143C] flex-shrink-0" />
            <span className="font-semibold text-[#DC143C]">
              🎭 Preview Mode Active
            </span>
            <span className="hidden md:inline opacity-70 text-[#DC143C]">
              - Speed changes visible during playback
            </span>
            <span className="md:hidden opacity-70 text-[#DC143C]">
              - Live Speed Preview
            </span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <Card className="flex-shrink-0 border-b rounded-none bg-slate-900 border-slate-700 shadow-md overflow-hidden">
        {/* Desktop Header Layout */}
        <div className="hidden md:flex items-center justify-between p-4 overflow-x-auto">
          {/* Left: Project Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Layers className="w-6 h-6 text-blue-600 dark:text-[#DC143C]" />
            <div>
              <h2 className="text-lg font-bold text-slate-100 whitespace-nowrap">
                {timeline.project.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 whitespace-nowrap">
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
            {/* NEW: Jump to Start Button (Desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={timeline.jumpToStart}
              title="Jump to start (Home)"
              className="hidden md:flex"
            >
              <SkipBack className="w-4 h-4" />
              <SkipBack className="w-4 h-4 -ml-3" />
            </Button>
            
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
              className="min-w-[80px]"
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
            
            {/* NEW: Jump to End Button (Desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={timeline.jumpToEnd}
              title="Jump to end (End)"
              className="hidden md:flex"
            >
              <SkipForward className="w-4 h-4" />
              <SkipForward className="w-4 h-4 -ml-3" />
            </Button>

            {/* NEW: Preview Mode Toggle (Feature 0103) */}
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <Button
              variant={previewMode ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setPreviewMode(!previewMode);
                toast.success(
                  !previewMode 
                    ? '🎭 Preview Mode ON: Speed changes visible during playback' 
                    : '👁️ Preview Mode OFF: Normal playback only',
                  { duration: 2000 }
                );
              }}
              title={previewMode ? "Preview Mode ON: Speed effects visible during playback" : "Preview Mode OFF: Click to enable speed preview"}
              className={previewMode ? "bg-[#DC143C] hover:bg-[#B91238] text-white" : ""}
            >
              {previewMode ? (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Preview</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Preview</span>
                </>
              )}
            </Button>

            <div className="ml-4 text-sm font-mono text-slate-300">
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

            <div className="w-px h-6 bg-slate-700 mx-2" />
            
            {/* NEW: Ripple Edit Mode Toggle (Feature 0103 Sprint 2) */}
            <Button
              variant={timeline.rippleMode ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                timeline.setRippleMode(!timeline.rippleMode);
                toast.success(
                  !timeline.rippleMode 
                    ? '🔗 Ripple Mode ON: Adjacent clips auto-adjust' 
                    : '🔓 Ripple Mode OFF: Manual positioning',
                  { duration: 2000 }
                );
              }}
              title={timeline.rippleMode ? "Ripple Mode ON: Clips auto-adjust when moving/deleting" : "Ripple Mode OFF: Click to enable"}
              className={timeline.rippleMode ? "bg-[#DC143C] hover:bg-[#B91238] text-white" : ""}
            >
              <Link className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Ripple</span>
            </Button>

            <div className="w-px h-6 bg-slate-700 mx-2" />
            
            {/* NEW: Desktop Tools Dropdown (Feature Parity with Mobile) */}
            <div className="relative hidden md:block">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDesktopToolsMenu(!showDesktopToolsMenu)}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                title="All editing tools"
              >
                <Layers className="w-4 h-4 mr-2" />
                Tools
              </Button>
              
              {showDesktopToolsMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDesktopToolsMenu(false)}
                  />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-[600px] overflow-y-auto">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700">
                      <h3 className="font-semibold text-lg text-slate-100">Timeline Tools</h3>
                      <p className="text-xs text-slate-400 mt-1">Advanced editing features</p>
                    </div>
                    
                    {/* Video Tools */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">📹 Video Tools</h4>
                      
                      <button
                        onClick={() => {
                          const selectedIds = Array.from(timeline.selectedClips);
                          if (selectedIds.length === 1) {
                            setSelectedClipForTransition(selectedIds[0]);
                            setShowTransitionPicker(true);
                          }
                          setShowDesktopToolsMenu(false);
                        }}
                        disabled={timeline.selectedClips.size !== 1}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <Film className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Transitions</div>
                          <div className="text-xs text-slate-400">55 Hollywood transitions</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const selectedIds = Array.from(timeline.selectedClips);
                          if (selectedIds.length === 1) {
                            setSelectedClipForLUT(selectedIds[0]);
                            setShowLUTPicker(true);
                          }
                          setShowDesktopToolsMenu(false);
                        }}
                        disabled={timeline.selectedClips.size !== 1}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Color Filters</div>
                          <div className="text-xs text-slate-400">34 cinematic filters</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const selectedIds = Array.from(timeline.selectedClips);
                          if (selectedIds.length === 1) {
                            const asset = timeline.assets.find(a => a.id === selectedIds[0]);
                            if (asset) {
                              setSelectedClipForSpeed({
                                id: asset.id,
                                currentSpeed: asset.speed || 1,
                                duration: asset.duration || 0
                              });
                              setShowSpeedSelector(true);
                            }
                          }
                          setShowDesktopToolsMenu(false);
                        }}
                        disabled={timeline.selectedClips.size !== 1}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Speed Control</div>
                          <div className="text-xs text-slate-400">0.25x - 4x speed</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const selectedIds = Array.from(timeline.selectedClips);
                          if (selectedIds.length === 1) {
                            const asset = timeline.assets.find(a => a.id === selectedIds[0]);
                            if (asset) {
                              timeline.updateAsset(asset.id, { ...asset, reversed: !asset.reversed });
                              toast.success(`${!asset.reversed ? '🔄' : '➡️'} Reverse ${!asset.reversed ? 'ON' : 'OFF'}`);
                            }
                          }
                          setShowDesktopToolsMenu(false);
                        }}
                        disabled={timeline.selectedClips.size !== 1}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Reverse</div>
                          <div className="text-xs text-slate-400">Play clip backwards</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const selectedIds = Array.from(timeline.selectedClips);
                          if (selectedIds.length === 1) {
                            setSelectedClipForEffects(selectedIds[0]);
                            setShowEffectsPanel(true);
                          }
                          setShowDesktopToolsMenu(false);
                        }}
                        disabled={timeline.selectedClips.size !== 1}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Effects</div>
                          <div className="text-xs text-slate-400">10 visual effects</div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Audio Tools */}
                    <div className="p-4 border-t border-slate-700 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">🎵 Audio Tools</h4>
                      
                      <button
                        onClick={() => {
                          setShowAudioAgent(true);
                          setShowDesktopToolsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Audio Agent</div>
                          <div className="text-xs text-slate-400">Generate music & SFX</div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Timeline Settings */}
                    <div className="p-4 border-t border-slate-700 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">⚙️ Timeline Settings</h4>
                      
                      <button
                        onClick={() => {
                          setShowAudioTracks(!showAudioTracks);
                          setShowDesktopToolsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-left transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                          {showAudioTracks ? <Maximize2 className="w-5 h-5 text-slate-400" /> : <Minimize2 className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200">Audio Tracks</div>
                          <div className="text-xs text-slate-400">{showAudioTracks ? 'Visible' : 'Hidden'}</div>
                        </div>
                      </button>
                    </div>
                    
                    {/* Help Text */}
                    <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                      <p className="text-xs text-slate-400 text-center">
                        Select a clip to enable editing tools
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* NEW: Desktop Add Media Button (Feature 0070) */}
            <Button
              onClick={() => setShowUploadModal(true)}
              size="sm"
              variant="default"
              className="hidden md:flex items-center gap-2 bg-[#DC143C] hover:bg-[#B91238] text-white"
            >
              <Plus className="w-4 h-4" />
              Add Media
            </Button>

            <div className="w-px h-6 bg-slate-700 mx-2" />

            {/* NEW: Export Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="bg-[#DC143C] hover:bg-[#B91238] text-white"
              disabled={timeline.assets.length === 0}
              title="Export video"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {/* NEW: Export to GitHub Button (Feature 0110) */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const success = await timeline.exportToGitHub();
                if (success) {
                  toast.success('✅ Timeline exported to your GitHub repository!', {
                    description: 'Your timeline data is now version controlled in your repo.',
                    duration: 4000
                  });
                } else {
                  toast.info('Connect GitHub to export your timeline', {
                    description: 'Go to Settings to link your GitHub repository.',
                    duration: 4000
                  });
                }
              }}
              title="Export timeline to GitHub (optional)"
              className="border-slate-600 hover:bg-slate-800"
            >
              <Github className="w-4 h-4 mr-2" />
              Export to GitHub
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
                  className="border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C]/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Re-compose
                </Button>
                
                {/* NEW: Split at Playhead Button (Feature 0103) */}
                {timeline.selectedClips.size === 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSplitAtPlayhead}
                    title="Split clip at playhead (requires clip selection)"
                    className="border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C]/10"
                  >
                    <Scissors className="w-4 h-4 mr-2" />
                    <span className="hidden md:inline">Split</span>
                  </Button>
                )}
                
                {/* NEW: Add Text Button (Feature 0103 Sprint 3) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddText}
                  title="Add text/title overlay to timeline"
                  className="border-[#DC143C] text-[#DC143C] hover:bg-[#DC143C]/10"
                >
                  <Type className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Add Text</span>
                </Button>
                
                {/* NEW: Copy Button (Feature 0103 Sprint 2) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const count = timeline.copyClips(Array.from(timeline.selectedClips));
                    toast.success(`📋 Copied ${count} clip${count > 1 ? 's' : ''}`);
                  }}
                  title="Copy selected clips (Ctrl/Cmd+C)"
                  className="border-slate-300 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Copy</span>
                </Button>
                
                {/* NEW: Paste Button (Feature 0103 Sprint 2) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newIds = timeline.pasteClips();
                    toast.success(`✨ Pasted ${newIds.length} clip${newIds.length > 1 ? 's' : ''}`);
                  }}
                  disabled={timeline.clipboard.length === 0}
                  title={timeline.clipboard.length > 0 ? "Paste clips at playhead (Ctrl/Cmd+V)" : "No clips in clipboard"}
                  className="border-slate-300 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Paste</span>
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

        {/* Mobile Header Layout - Enhanced with all controls */}
        <div className="md:hidden p-3 bg-slate-900 border-b border-slate-700">
          {/* Row 1: Project Name & Stats */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Layers className="w-4 h-4 text-[#DC143C] flex-shrink-0" />
              <h2 className="text-sm font-semibold text-slate-100 truncate">
                {timeline.project.name}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
              <span className="font-mono">{formatTime(timeline.totalDuration)}</span>
              <ProjectCostBadge assets={timeline.assets} />
            </div>
          </div>
          
          {/* Row 2: Enhanced Playback Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Navigation */}
            <div className="flex items-center gap-1">
              {/* NEW: Jump to Start */}
              <Button
                variant="ghost"
                size="sm"
                onClick={timeline.jumpToStart}
                title="Jump to start"
                className="h-11 w-11 p-0 touch-manipulation"
              >
                <SkipBack className="w-5 h-5" />
                <SkipBack className="w-5 h-5 -ml-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => timeline.skipBackward()}
                title="Skip back 5s"
                className="h-11 w-11 p-0 touch-manipulation"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                variant={timeline.isPlaying ? "default" : "outline"}
                size="sm"
                onClick={timeline.togglePlay}
                className="h-11 w-14 px-2 touch-manipulation bg-[#DC143C] hover:bg-[#B91238] text-white border-none"
              >
                {timeline.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => timeline.skipForward()}
                title="Skip forward 5s"
                className="h-11 w-11 p-0 touch-manipulation"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              {/* NEW: Jump to End */}
              <Button
                variant="ghost"
                size="sm"
                onClick={timeline.jumpToEnd}
                title="Jump to end"
                className="h-11 w-11 p-0 touch-manipulation"
              >
                <SkipForward className="w-5 h-5 -mr-4" />
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Center: Timecode */}
            <div className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">
              {formatTime(timeline.playheadPosition)}
            </div>

            {/* Right: Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={timeline.zoomOut}
                title="Zoom out"
                className="h-11 w-11 p-0 touch-manipulation"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={timeline.zoomIn}
                title="Zoom in"
                className="h-11 w-11 p-0 touch-manipulation"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Row 3: Asset Stats (Optional - only shows if assets exist) */}
          {timeline.assets.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-700/50">
              <Badge variant="outline" className="text-[#DC143C] border-[#DC143C]/50 text-xs">
                <Film className="w-3 h-3 mr-1" />
                {assetCounts.video}
              </Badge>
              <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs">
                <Music className="w-3 h-3 mr-1" />
                {assetCounts.audio + assetCounts.music}
              </Badge>
              <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-xs">
                <ImageIcon className="w-3 h-3 mr-1" />
                {assetCounts.image}
              </Badge>
              {timeline.selectedClips.size > 0 && (
                <Badge variant="default" className="bg-[#DC143C] text-white text-xs">
                  {timeline.selectedClips.size} selected
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Asset Count Stats */}
        <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-400 hidden md:flex">
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
            <Badge variant="default" className="bg-[#DC143C] text-white">
              {timeline.selectedClips.size} selected
            </Badge>
          )}
        </div>
      </Card>

      {/* Timeline Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers - Fixed sidebar that doesn't scroll horizontally */}
        <div className="flex-shrink-0 w-24 bg-slate-900 border-r border-slate-700 overflow-y-hidden flex flex-col">
          {/* Spacer for time ruler */}
          <div className="h-10 border-b-2 border-slate-600 bg-slate-800 flex-shrink-0" />
          
          {/* Scrollable track headers */}
          <div className="flex-1 overflow-y-auto custom-scrollbar" ref={trackHeadersRef}>
            {/* Video Track Headers */}
            {Array.from({ length: videoTrackCount }).map((_, trackNum) => (
              <div key={`v-${trackNum}`} className="h-16 border-b border-slate-700">
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
              <div key={`a-${trackNum}`} className="h-12 border-b border-slate-700">
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
            <div className="sticky top-0 z-30 h-10 bg-slate-800 border-b-2 border-slate-600 flex items-center">
              {timeMarks.map(time => (
                <div
                  key={time}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${time * timeline.zoomLevel}px` }}
                >
                  <div className="h-3 w-px bg-slate-500" />
                  <span className="text-xs font-mono text-slate-400 mt-1">
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
              <div className="absolute top-0 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-800" />
            </div>

            {/* Video Tracks */}
            <div className="relative">
              {Array.from({ length: videoTrackCount }).map((_, trackNum) => {
                const trackAssets = videoAssets[trackNum];
                const isVisible = trackStates[trackNum]?.visible !== false;
                
                return (
                  <div
                    key={`track-v-${trackNum}`}
                    className={`relative h-16 border-b border-slate-700 ${
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
                        onSpeedChange={handleSpeedChange}
                        onReverseToggle={handleReverseToggle}
                        onAddEffects={handleAddEffects}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Audio Tracks */}
            {showAudioTracks && (
              <div className="relative border-t-2 border-slate-600">
                {Array.from({ length: audioTrackCount }).map((_, trackNum) => {
                  const trackAssets = audioAssets[trackNum];
                  
                  return (
                    <div
                      key={`track-a-${trackNum}`}
                      className="relative h-12 border-b border-slate-700"
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
                          onSpeedChange={handleSpeedChange}
                          onReverseToggle={handleReverseToggle}
                          onAddEffects={handleAddEffects}
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

      {/* Speed Selector Modal - NEW (Feature 0103) */}
      {showSpeedSelector && selectedClipForSpeed && (
        <SpeedSelector
          currentSpeed={selectedClipForSpeed.currentSpeed}
          clipDuration={selectedClipForSpeed.duration}
          onSelect={handleApplySpeed}
          onClose={() => {
            setShowSpeedSelector(false);
            setSelectedClipForSpeed(null);
          }}
        />
      )}

      {/* Effects Panel Modal - NEW (Feature 0103 Sprint 3) */}
      {showEffectsPanel && selectedClipForEffects && (
        <EffectsPanel
          asset={timeline.assets.find(a => a.id === selectedClipForEffects)!}
          onApply={handleApplyEffects}
          onClose={() => {
            setShowEffectsPanel(false);
            setSelectedClipForEffects(null);
          }}
        />
      )}
      
      {/* Text Editor Panel Modal - NEW (Feature 0103 Sprint 3) */}
      {showTextEditor && (
        <TextEditorPanel
          asset={selectedTextAsset || undefined}
          duration={5.0}  // Default 5 second duration for new text
          onApply={handleApplyText}
          onClose={() => {
            setShowTextEditor(false);
            setSelectedTextAsset(null);
          }}
        />
      )}
      
      {/* Mobile: Floating Action Button (FAB) */}
      {isMobile && (
        <motion.button
          onClick={() => setShowMediaGallery(true)}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base-content flex items-center justify-center"
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

      {/* NEW: Mobile Bottom Toolbar (Context-Aware) */}
      <MobileTimelineToolbar
        selectedCount={timeline.selectedClips.size}
        onAddMedia={() => setShowUploadModal(true)}
        onAddText={() => setShowTextEditor(true)}
        onAddAudio={() => setShowAudioAgent(true)} // Open Audio Agent for sound effects & music generation
        onSplitClip={handleSplitAtPlayhead}
        onOpenEffects={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            setSelectedClipForEffects(selectedIds[0]);
            setShowEffectsPanel(true);
          }
        }}
        onOpenSpeed={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            const asset = timeline.assets.find(a => a.id === selectedIds[0]);
            if (asset) {
              setSelectedClipForSpeed({
                id: asset.id,
                currentSpeed: asset.speed || 1.0,
                duration: asset.duration
              });
              setShowSpeedSelector(true);
            }
          }
        }}
        onCopyClips={() => {
          const count = timeline.copyClips(Array.from(timeline.selectedClips));
          toast.success(`📋 Copied ${count} clip${count > 1 ? 's' : ''}`);
        }}
        onDeleteClips={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          selectedIds.forEach(id => {
            timeline.removeAsset(id);
            timeline.removeClip(id);
          });
          toast.success('🗑️ Deleted clips');
        }}
        onToggleRipple={() => {
          timeline.setRippleMode(!timeline.rippleMode);
          toast.success(
            timeline.rippleMode 
              ? '🔓 Ripple Mode OFF' 
              : '🔗 Ripple Mode ON: Adjacent clips auto-adjust',
            { duration: 2000 }
          );
        }}
        onOpenMore={() => setShowMobileMoreMenu(true)}
        rippleMode={timeline.rippleMode}
        canSplit={timeline.selectedClips.size === 1}
      />

      {/* NEW: Mobile More Menu */}
      <MobileTimelineMoreMenu
        isOpen={showMobileMoreMenu}
        onClose={() => setShowMobileMoreMenu(false)}
        selectedCount={timeline.selectedClips.size}
        onTransitions={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            setSelectedClipForTransition(selectedIds[0]);
            setShowTransitionPicker(true);
          }
        }}
        onColorFilters={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            setSelectedClipForLUT(selectedIds[0]);
            setShowLUTPicker(true);
          }
        }}
        onSpeed={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            const asset = timeline.assets.find(a => a.id === selectedIds[0]);
            if (asset) {
              setSelectedClipForSpeed({
                id: asset.id,
                currentSpeed: asset.speed || 1.0,
                duration: asset.duration
              });
              setShowSpeedSelector(true);
            }
          }
        }}
        onReverse={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            const asset = timeline.assets.find(a => a.id === selectedIds[0]);
            if (asset) {
              timeline.updateAsset(asset.id, { reversed: !asset.reversed });
              toast.success(asset.reversed ? '▶️ Reversed OFF' : '◀️ Reversed ON');
            }
          }
        }}
        onEffects={() => {
          const selectedIds = Array.from(timeline.selectedClips);
          if (selectedIds.length === 1) {
            setSelectedClipForEffects(selectedIds[0]);
            setShowEffectsPanel(true);
          }
        }}
        onPreviewMode={() => {
          setPreviewMode(!previewMode);
          toast.success(
            previewMode 
              ? '👁️ Preview Mode OFF' 
              : '🎭 Preview Mode ON: Speed effects visible during playback',
            { duration: 2000 }
          );
        }}
        previewMode={previewMode}
        onVolume={() => {
          toast.info('🔊 Volume control coming soon!');
        }}
        onFade={() => {
          toast.info('🎚️ Fade in/out coming soon!');
        }}
        onRippleMode={() => {
          timeline.setRippleMode(!timeline.rippleMode);
          toast.success(
            timeline.rippleMode 
              ? '🔓 Ripple Mode OFF' 
              : '🔗 Ripple Mode ON',
            { duration: 2000 }
          );
        }}
        onSnapGrid={() => {
          setSnapGrid(!snapGrid);
          toast.success(snapGrid ? '📐 Snap Grid OFF' : '📐 Snap Grid ON');
        }}
        onShowInfo={() => {
          toast.info('ℹ️ Select a clip and tap the info icon on it');
        }}
        onToggleAudioTracks={() => {
          setShowAudioTracks(!showAudioTracks);
        }}
        rippleMode={timeline.rippleMode}
        snapGrid={snapGrid}
        showAudioTracks={showAudioTracks}
      />

      {/* Audio Agent Drawer - Audio-only mode for Timeline */}
      {showAudioAgent && (
        <AgentDrawer
          isOpen={showAudioAgent}
          onClose={() => setShowAudioAgent(false)}
          launchTrigger={{
            mode: 'audio',
            initialPrompt: 'Generate audio for my timeline',
          }}
          onInsertText={(audioUrl) => {
            // Add generated audio to timeline
            const newAsset: Omit<TimelineAsset, 'id'> = {
              type: 'audio',
              url: audioUrl,
              name: 'AI Generated Audio',
              track: 4, // Music track
              trackType: 'audio',
              startTime: timeline.playheadPosition,
              duration: 10, // Default, will be updated
              trimStart: 0,
              trimEnd: 0,
              volume: 1,
              keyframes: [],
              metadata: {
                sourceType: 'generated',
                description: 'AI generated audio'
              }
            };
            
            timeline.addAsset(newAsset);
            setShowAudioAgent(false);
            toast.success('🎵 Audio added to timeline!');
          }}
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
        className="bg-[#DC143C]/10 text-[#DC143C] border-[#DC143C]/20 flex items-center gap-1 cursor-help"
      >
        <DollarSign className="w-3 h-3" />
        {totalCost} credits
      </Badge>
      
      {/* Tooltip */}
      {showTooltip && totalCost > 0 && (
        <div className="absolute left-0 top-full mt-2 z-50 w-48 bg-base-200 border border-base-content/20 rounded-lg shadow-lg p-3 text-xs">
          <div className="font-bold text-base-content mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Cost Breakdown
          </div>
          <div className="space-y-1.5">
            {breakdown.videos > 0 && (
              <div className="flex justify-between text-[#DC143C]">
                <span>AI Videos:</span>
                <span className="font-mono">{breakdown.videos}cr</span>
              </div>
            )}
            {breakdown.images > 0 && (
              <div className="flex justify-between text-[#DC143C]">
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
              <div className="flex justify-between text-base-content/60">
                <span>Uploads:</span>
                <span className="font-mono">FREE ✅</span>
              </div>
            )}
            <div className="pt-1.5 mt-1.5 border-t border-base-content/20 flex justify-between text-base-content font-bold">
              <span>Total:</span>
              <span className="font-mono">{breakdown.total}cr</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

