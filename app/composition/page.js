'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { 
  Clapperboard,
  Plus,
  Trash2,
  Play,
  Download,
  Sparkles,
  Clock,
  Grid3x3,
  Layers,
  X,
  Maximize2,
  Settings,
  ChevronUp
} from 'lucide-react';

export default function CompositionPage() {
  const { user } = useUser();
  const [compositions, setCompositions] = useState([]);
  const [activeComposition, setActiveComposition] = useState(null);
  const [clips, setClips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mobile-specific state
  const [showClipOptions, setShowClipOptions] = useState(null); // Which clip's bottom sheet is open
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);

  // Load user compositions
  useEffect(() => {
    if (user) {
      loadCompositions();
    }
  }, [user]);

  const loadCompositions = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockCompositions = [
        {
          id: '1',
          name: 'Opening Sequence',
          clipCount: 5,
          duration: 45,
          thumbnail: null,
          updatedAt: new Date().toISOString()
        }
      ];
      setCompositions(mockCompositions);
    } catch (error) {
      console.error('Failed to load compositions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewComposition = () => {
    const newComp = {
      id: Date.now().toString(),
      name: 'New Composition',
      clipCount: 0,
      duration: 0,
      thumbnail: null,
      updatedAt: new Date().toISOString()
    };
    setCompositions([newComp, ...compositions]);
    setActiveComposition(newComp);
    setClips([]);
  };

  const addClip = () => {
    const newClip = {
      id: Date.now().toString(),
      type: 'video',
      name: 'Untitled Clip',
      duration: 5,
      order: clips.length
    };
    setClips([...clips, newClip]);
  };

  const removeClip = (clipId) => {
    setClips(clips.filter(clip => clip.id !== clipId));
  };

  const exportComposition = async () => {
    // TODO: Implement composition export
    alert('Composition export will be implemented with backend integration');
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
              <div className="p-3 bg-cinema-red/20 rounded-xl">
                <Clapperboard className="w-8 h-8 text-cinema-red" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cinema-red to-cinema-blue bg-clip-text text-transparent">
                  Composition Studio
                </h1>
                <p className="text-base-content/60 mt-1">
                  Arrange clips, add transitions, and create your final cut
                </p>
              </div>
            </div>
            <button
              onClick={createNewComposition}
              className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none hover:opacity-90"
            >
              <Plus className="w-5 h-5" />
              New Composition
            </button>
          </div>

          {/* Mobile Layout - Stacked */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cinema-red/20 rounded-lg">
                <Clapperboard className="w-6 h-6 text-cinema-red" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cinema-red to-cinema-blue bg-clip-text text-transparent">
                  Compositions
                </h1>
                <p className="text-sm text-base-content/60">
                  Create your final cut
                </p>
              </div>
            </div>
            <button
              onClick={createNewComposition}
              className="btn btn-md w-full bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
            >
              <Plus className="w-5 h-5" />
              New Composition
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!activeComposition ? (
          // Composition Library
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Compositions</h2>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline">
                  <Grid3x3 className="w-4 h-4" />
                  Grid
                </button>
                <button className="btn btn-sm btn-outline">
                  <Layers className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>

            {compositions.length === 0 ? (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body items-center text-center py-16">
                  <Clapperboard className="w-16 h-16 text-base-content/30 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No compositions yet</h3>
                  <p className="text-base-content/60 mb-6 max-w-md">
                    Create your first composition to start arranging clips and building your video
                  </p>
                  <button
                    onClick={createNewComposition}
                    className="btn btn-lg bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Composition
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compositions.map((comp) => (
                  <div
                    key={comp.id}
                    className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                    onClick={() => setActiveComposition(comp)}
                  >
                    <div className="aspect-video bg-base-300 flex items-center justify-center">
                      {comp.thumbnail ? (
                        <img src={comp.thumbnail} alt={comp.name} className="w-full h-full object-cover" />
                      ) : (
                        <Clapperboard className="w-12 h-12 text-base-content/30" />
                      )}
                    </div>
                    <div className="card-body">
                      <h3 className="card-title text-lg">{comp.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-base-content/60">
                        <span className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          {comp.clipCount} clips
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {comp.duration}s
                        </span>
                      </div>
                      <div className="card-actions justify-end mt-2">
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
          // Active Composition Editor
          <div className="pb-24 lg:pb-0">
            {/* Composition Header - Desktop */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveComposition(null)}
                  className="btn btn-sm btn-ghost"
                >
                  ← Back
                </button>
                <input
                  type="text"
                  value={activeComposition.name}
                  onChange={(e) => setActiveComposition({ ...activeComposition, name: e.target.value })}
                  className="input input-ghost text-2xl font-bold max-w-md"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFullscreenPreview(true)}
                  className="btn btn-outline"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={exportComposition}
                  className="btn bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Composition Header - Mobile Sticky */}
            <div className="lg:hidden sticky top-0 z-40 bg-base-100 border-b border-base-300 -mx-4 px-4 py-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveComposition(null)}
                  className="btn btn-sm btn-ghost btn-circle"
                >
                  <X className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={activeComposition.name}
                  onChange={(e) => setActiveComposition({ ...activeComposition, name: e.target.value })}
                  className="input input-ghost input-sm flex-1 text-lg font-bold"
                  placeholder="Composition name"
                />
                <button 
                  onClick={() => setShowFullscreenPreview(true)}
                  className="btn btn-sm btn-ghost btn-circle"
                  title="Preview"
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Composition Canvas */}
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body p-3 lg:p-6">
                <div 
                  className="aspect-video bg-base-300 rounded-lg flex items-center justify-center relative group cursor-pointer"
                  onClick={() => setShowFullscreenPreview(true)}
                >
                  <div className="text-center">
                    <Clapperboard className="w-12 lg:w-16 h-12 lg:h-16 text-base-content/30 mx-auto mb-2 lg:mb-4" />
                    <p className="text-sm lg:text-base text-base-content/60">Composition preview</p>
                    <p className="text-xs text-base-content/40 mt-1 lg:hidden">Tap for fullscreen</p>
                  </div>
                  {/* Fullscreen button overlay - desktop only */}
                  <button className="hidden lg:flex absolute top-3 right-3 btn btn-sm btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg lg:text-xl font-bold">Timeline</h3>
                  {/* Desktop: Show button directly */}
                  <button
                    onClick={addClip}
                    className="hidden lg:flex btn btn-sm btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    Add Clip
                  </button>
                  {/* Mobile: Icon button only */}
                  <button
                    onClick={addClip}
                    className="lg:hidden btn btn-sm btn-primary btn-circle"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {clips.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-lg">
                    <Layers className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
                    <p className="text-base-content/60 mb-4">No clips in timeline</p>
                    <button
                      onClick={addClip}
                      className="btn btn-sm btn-outline"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Clip
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clips.map((clip, index) => (
                      <div
                        key={clip.id}
                        className="flex items-center gap-2 lg:gap-3 p-3 bg-base-300 rounded-lg hover:bg-base-300/70 transition-colors"
                      >
                        <div className="text-base-content/60 font-mono text-sm w-6 lg:w-8">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{clip.name}</div>
                          <div className="text-sm text-base-content/60">
                            {clip.duration}s • {clip.type}
                          </div>
                        </div>
                        {/* Desktop: Show both buttons */}
                        <div className="hidden lg:flex gap-2">
                          <button className="btn btn-sm btn-ghost">
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeClip(clip.id)}
                            className="btn btn-sm btn-ghost text-error hover:bg-error/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Mobile: Single menu button that opens bottom sheet */}
                        <button
                          onClick={() => setShowClipOptions(clip.id)}
                          className="lg:hidden btn btn-sm btn-ghost btn-circle"
                        >
                          <Settings className="w-5 h-5" />
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
      {activeComposition && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
          <button
            onClick={exportComposition}
            className="btn btn-lg w-full bg-gradient-to-r from-cinema-red to-cinema-blue text-white border-none shadow-2xl"
          >
            <Download className="w-5 h-5" />
            Export Composition
          </button>
        </div>
      )}

      {/* Mobile Clip Options Bottom Sheet */}
      {showClipOptions && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-black/50" 
          onClick={() => setShowClipOptions(null)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-lg">Clip Options</h3>
              <button 
                onClick={() => setShowClipOptions(null)}
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
                  // Add effects logic
                  setShowClipOptions(null);
                }}
              >
                <Sparkles className="w-5 h-5" />
                <span className="flex-1 text-left">Add Effects</span>
              </button>
              
              <button 
                className="btn btn-lg w-full justify-start bg-base-200 hover:bg-base-300 border-none"
                onClick={() => {
                  // Edit clip logic
                  setShowClipOptions(null);
                }}
              >
                <Settings className="w-5 h-5" />
                <span className="flex-1 text-left">Edit Clip</span>
              </button>
              
              <button 
                className="btn btn-lg w-full justify-start bg-error/10 hover:bg-error/20 border-none text-error"
                onClick={() => {
                  removeClip(showClipOptions);
                  setShowClipOptions(null);
                }}
              >
                <Trash2 className="w-5 h-5" />
                <span className="flex-1 text-left">Delete Clip</span>
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
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-60">Fullscreen Preview</p>
                <p className="text-sm opacity-40 mt-2">Tap anywhere to close</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

