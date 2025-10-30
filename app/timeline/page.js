'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { 
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Plus,
  Trash2,
  Volume2,
  Download,
  Sparkles,
  Film,
  X,
  Maximize2,
  Settings,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export default function TimelinePage() {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const timelineRef = useRef(null);
  
  // Mobile-specific state
  const [showTrackOptions, setShowTrackOptions] = useState(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Load user projects
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockProjects = [
        {
          id: '1',
          name: 'Opening Scene',
          duration: 45,
          trackCount: 3,
          updatedAt: new Date().toISOString()
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: 'New Timeline',
      duration: 0,
      trackCount: 0,
      updatedAt: new Date().toISOString()
    };
    setProjects([newProject, ...projects]);
    setActiveProject(newProject);
    setTracks([
      { id: 'video-1', type: 'video', name: 'Video 1', clips: [] },
      { id: 'audio-1', type: 'audio', name: 'Audio 1', clips: [] }
    ]);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const jumpToStart = () => {
    setCurrentTime(0);
  };

  const jumpToEnd = () => {
    setCurrentTime(duration);
  };

  const addTrack = (type = 'video') => {
    const newTrack = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.filter(t => t.type === type).length + 1}`,
      clips: []
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (trackId) => {
    setTracks(tracks.filter(track => track.id !== trackId));
  };

  const exportTimeline = async () => {
    // TODO: Implement timeline export
    alert('Timeline export will be implemented with backend integration');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-cinema-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-cinema-red/10 to-cinema-blue/10 border-b border-base-300">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cinema-blue/20 rounded-xl">
                <Clock className="w-8 h-8 text-cinema-blue" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cinema-red to-cinema-blue bg-clip-text text-transparent">
                  Timeline Editor
                </h1>
                <p className="text-base-content/60 mt-1">
                  Precise video editing with multi-track timeline
                </p>
              </div>
            </div>
            <button
              onClick={createNewProject}
              className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none hover:opacity-90"
            >
              <Plus className="w-5 h-5" />
              New Timeline
            </button>
          </div>

          {/* Mobile Layout - Stacked */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cinema-blue/20 rounded-lg">
                <Clock className="w-6 h-6 text-cinema-blue" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cinema-red to-cinema-blue bg-clip-text text-transparent">
                  Timeline
                </h1>
                <p className="text-sm text-base-content/60">
                  Multi-track editor
                </p>
              </div>
            </div>
            <button
              onClick={createNewProject}
              className="btn btn-md w-full bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
            >
              <Plus className="w-5 h-5" />
              New Timeline
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!activeProject ? (
          // Project Library
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Timeline Projects</h2>

            {projects.length === 0 ? (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body items-center text-center py-16">
                  <Clock className="w-16 h-16 text-base-content/30 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No timeline projects yet</h3>
                  <p className="text-base-content/60 mb-6 max-w-md">
                    Create your first timeline to start editing videos with precision
                  </p>
                  <button
                    onClick={createNewProject}
                    className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Timeline
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                    onClick={() => setActiveProject(project)}
                  >
                    <div className="card-body">
                      <h3 className="card-title text-lg">{project.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-base-content/60">
                        <span className="flex items-center gap-1">
                          <Film className="w-4 h-4" />
                          {project.trackCount} tracks
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {project.duration}s
                        </span>
                      </div>
                      <div className="card-actions justify-end mt-4">
                        <button className="btn btn-sm btn-primary">
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Active Timeline Editor
          <div className="space-y-4 pb-32 lg:pb-4">
            {/* Timeline Header - Desktop */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveProject(null)}
                  className="btn btn-sm btn-ghost"
                >
                  ← Back
                </button>
                <input
                  type="text"
                  value={activeProject.name}
                  onChange={(e) => setActiveProject({ ...activeProject, name: e.target.value })}
                  className="input input-ghost text-2xl font-bold max-w-md"
                />
              </div>
              <button
                onClick={exportTimeline}
                className="btn bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Timeline Header - Mobile Sticky */}
            <div className="lg:hidden sticky top-0 z-40 bg-base-100 border-b border-base-300 -mx-4 px-4 py-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveProject(null)}
                  className="btn btn-sm btn-ghost btn-circle"
                >
                  <X className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={activeProject.name}
                  onChange={(e) => setActiveProject({ ...activeProject, name: e.target.value })}
                  className="input input-ghost input-sm flex-1 text-lg font-bold"
                  placeholder="Timeline name"
                />
                <button 
                  onClick={() => setShowFullscreenPreview(true)}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Preview"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Preview */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-3 lg:p-6">
                <div 
                  className="aspect-video bg-base-300 rounded-lg flex items-center justify-center relative group cursor-pointer"
                  onClick={() => setShowFullscreenPreview(true)}
                >
                  <div className="text-center">
                    <Film className="w-12 lg:w-16 h-12 lg:h-16 text-base-content/30 mx-auto mb-2 lg:mb-4" />
                    <p className="text-sm lg:text-base text-base-content/60">Video preview</p>
                    <p className="text-xs lg:text-sm text-base-content/40 mt-2">{formatTime(currentTime)} / {formatTime(duration)}</p>
                    <p className="text-xs text-base-content/40 mt-1 lg:hidden">Tap for fullscreen</p>
                  </div>
                  {/* Fullscreen button overlay - desktop only */}
                  <button className="hidden lg:flex absolute top-3 right-3 btn btn-sm btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 lg:p-6">
                {/* Desktop: Single row */}
                <div className="hidden lg:flex items-center justify-center gap-4">
                  <button
                    onClick={jumpToStart}
                    className="btn btn-circle btn-outline"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={togglePlayback}
                    className="btn btn-circle btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" />
                    )}
                  </button>
                  <button
                    onClick={jumpToEnd}
                    className="btn btn-circle btn-outline"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <div className="divider divider-horizontal"></div>
                  <button className="btn btn-circle btn-outline">
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button className="btn btn-circle btn-outline">
                    <Scissors className="w-5 h-5" />
                  </button>
                  <button className="btn btn-circle btn-outline">
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile: Two rows */}
                <div className="lg:hidden space-y-3">
                  {/* Row 1: Essential playback */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={jumpToStart}
                      className="btn btn-circle btn-outline btn-md"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={togglePlayback}
                      className="btn btn-circle btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </button>
                    <button
                      onClick={jumpToEnd}
                      className="btn btn-circle btn-outline btn-md"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Row 2: Tools */}
                  <div className="flex items-center justify-center gap-3">
                    <button className="btn btn-circle btn-outline btn-sm">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button className="btn btn-circle btn-outline btn-sm">
                      <Scissors className="w-4 h-4" />
                    </button>
                    <button className="btn btn-circle btn-outline btn-sm">
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowQuickActions(true)}
                      className="btn btn-sm btn-outline"
                    >
                      <Settings className="w-4 h-4" />
                      More
                    </button>
                  </div>
                </div>

                {/* Timeline Scrubber */}
                <div className="mt-4">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="range range-primary w-full"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Track Timeline */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg lg:text-xl font-bold">Tracks</h3>
                  
                  {/* Desktop: Show all controls */}
                  <div className="hidden lg:flex gap-2">
                    <button
                      onClick={() => addTrack('video')}
                      className="btn btn-sm btn-outline"
                    >
                      <Plus className="w-4 h-4" />
                      Video Track
                    </button>
                    <button
                      onClick={() => addTrack('audio')}
                      className="btn btn-sm btn-outline"
                    >
                      <Plus className="w-4 h-4" />
                      Audio Track
                    </button>
                    <div className="divider divider-horizontal"></div>
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                      className="btn btn-sm btn-outline"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-2 text-sm">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                      className="btn btn-sm btn-outline"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile: Single button to open options */}
                  <button
                    onClick={() => setShowTrackOptions(true)}
                    className="lg:hidden btn btn-sm btn-primary btn-circle"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {tracks.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-lg">
                    <Film className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                    <p className="text-base-content/60 mb-4">No tracks in timeline</p>
                    <button
                      onClick={() => addTrack('video')}
                      className="btn btn-sm btn-outline"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Track
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2" ref={timelineRef}>
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 p-3 bg-base-300 rounded-lg"
                      >
                        {/* Track info - stacked on mobile */}
                        <div className="w-full lg:w-32 flex items-center justify-between lg:flex-col lg:items-start lg:justify-start flex-shrink-0">
                          <div>
                            <div className="font-medium text-sm">{track.name}</div>
                            <div className="text-xs text-base-content/60 capitalize">{track.type}</div>
                          </div>
                          <button
                            onClick={() => removeTrack(track.id)}
                            className="lg:hidden btn btn-xs btn-ghost text-error hover:bg-error/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Timeline grid - full width on mobile */}
                        <div className="flex-1 w-full h-16 bg-base-100 rounded relative overflow-x-auto overflow-y-hidden">
                          {/* Timeline grid */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: Math.ceil(duration / 5) }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 border-r border-base-300"
                                style={{ minWidth: `${40 * zoom}px` }}
                              >
                                <span className="text-xs text-base-content/40 px-1">{i * 5}s</span>
                              </div>
                            ))}
                          </div>
                          {/* Playhead */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-cinema-red z-10"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>
                        
                        {/* Delete button - desktop only */}
                        <button
                          onClick={() => removeTrack(track.id)}
                          className="hidden lg:flex btn btn-sm btn-ghost text-error hover:bg-error/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB - Export Button (only in editor view) */}
      {activeProject && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
          <button
            onClick={exportTimeline}
            className="btn btn-lg w-full bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none shadow-2xl"
          >
            <Download className="w-5 h-5" />
            Export Timeline
          </button>
        </div>
      )}

      {/* Mobile Track Options Bottom Sheet */}
      {showTrackOptions && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-black/50" 
          onClick={() => setShowTrackOptions(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-lg">Track Options</h3>
              <button 
                onClick={() => setShowTrackOptions(false)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Content */}
            <div className="p-6 space-y-3">
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  addTrack('video');
                  setShowTrackOptions(false);
                }}
              >
                <Film className="w-5 h-5" />
                <span className="flex-1 text-left">Add Video Track</span>
              </button>
              
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  addTrack('audio');
                  setShowTrackOptions(false);
                }}
              >
                <Volume2 className="w-5 h-5" />
                <span className="flex-1 text-left">Add Audio Track</span>
              </button>
              
              <div className="divider">Zoom</div>
              
              <div className="flex items-center justify-between gap-4">
                <button 
                  className="btn btn-lg flex-1 bg-base-200 hover:bg-base-300 border-none"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="w-5 h-5" />
                  Zoom Out
                </button>
                <span className="text-lg font-bold min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                <button 
                  className="btn btn-lg flex-1 bg-base-200 hover:bg-base-300 border-none"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="w-5 h-5" />
                  Zoom In
                </button>
              </div>
            </div>
            
            {/* Safe area padding */}
            <div className="h-safe pb-6"></div>
          </div>
        </div>
      )}

      {/* Mobile Quick Actions Bottom Sheet */}
      {showQuickActions && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-black/50" 
          onClick={() => setShowQuickActions(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-lg">Quick Actions</h3>
              <button 
                onClick={() => setShowQuickActions(false)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Content */}
            <div className="p-6 space-y-3">
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  // Add trim logic
                  setShowQuickActions(false);
                }}
              >
                <Scissors className="w-5 h-5" />
                <span className="flex-1 text-left">Trim Clip</span>
              </button>
              
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  // Add effects logic
                  setShowQuickActions(false);
                }}
              >
                <Sparkles className="w-5 h-5" />
                <span className="flex-1 text-left">Add Effects</span>
              </button>
              
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  // Add volume logic
                  setShowQuickActions(false);
                }}
              >
                <Volume2 className="w-5 h-5" />
                <span className="flex-1 text-left">Adjust Volume</span>
              </button>
              
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  setShowTrackOptions(true);
                  setShowQuickActions(false);
                }}
              >
                <Layers className="w-5 h-5" />
                <span className="flex-1 text-left">Manage Tracks</span>
              </button>
            </div>
            
            {/* Safe area padding */}
            <div className="h-safe pb-6"></div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {showFullscreenPreview && (
        <div 
          className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
          onClick={() => setShowFullscreenPreview(false)}
        >
          <button
            onClick={() => setShowFullscreenPreview(false)}
            className="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="aspect-video w-full max-w-6xl bg-base-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-60">Fullscreen Preview</p>
                <p className="text-sm opacity-40 mt-2">{formatTime(currentTime)} / {formatTime(duration)}</p>
                <p className="text-xs opacity-30 mt-4">Tap anywhere to close</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
