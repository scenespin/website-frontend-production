'use client';

import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useEditorContext } from '@/lib/contextStore';
import { storyBeatsAPI } from '@/lib/navigationAPI';
import { BookOpen, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
// ResponsiveHeader removed - will use Navigation.js from wrapper

export default function StoryBeatsPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const beatId = searchParams.get('beatId'); // From context navigation
  const context = useEditorContext();
  
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [showAddBeat, setShowAddBeat] = useState(false);

  // Load beats from API
  // Note: Auth guaranteed by AuthenticatedPageWrapper
  useEffect(() => {
    if (!projectId) return;
    
    const loadBeats = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('No auth token');
        
        const data = await storyBeatsAPI.getBeats(projectId, token);
        setBeats(data);
        
        // Auto-select beat from context if provided
        if (beatId) {
          const beat = data.find(b => b.beat_id === beatId);
          if (beat) setSelectedBeat(beat);
        } else if (context.currentBeatId) {
          const beat = data.find(b => b.beat_id === context.currentBeatId);
          if (beat) setSelectedBeat(beat);
        }
      } catch (error) {
        console.error('Failed to load story beats:', error);
        toast.error('Failed to load story beats', {
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadBeats();
  }, [projectId, beatId, context.currentBeatId, getToken]);

  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
      <div className="min-h-screen bg-slate-900 text-base-content">
        {/* Editor Sub-Navigation */}
        <EditorSubNav activeTab="beats" projectId={projectId} />

      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-base-content shadow-lg">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-extrabold truncate">Story Beats</h1>
                <p className="text-xs md:text-sm opacity-80 hidden sm:block">Structure your narrative with proven beat sheets</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddBeat(true)}
              className="btn btn-sm md:btn-md bg-white/20 hover:bg-white/30 gap-1 md:gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Context Indicator - Mobile Optimized */}
      {context.currentSceneName && (
        <div className="bg-info/10 border-b border-info/20">
          <div className="max-w-7xl mx-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
            <span className="opacity-70 hidden sm:inline">Navigated from scene:</span>
            <span className="opacity-70 sm:hidden">Scene:</span>{' '}
            <span className="font-semibold truncate">{context.currentSceneName}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-lg opacity-60">Loading story beats...</p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
          {/* Beats List */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-3 md:p-6">
                <h2 className="card-title text-base md:text-xl">Story Structure</h2>
                
                {/* Act 1 */}
                <div className="mt-2 md:mt-4">
                  <div className="badge badge-primary badge-sm mb-1 md:mb-2">Act 1</div>
                  <div className="space-y-1 md:space-y-2">
                    {beats.filter(b => b.act === 1).map(beat => (
                      <button
                        key={beat.beat_id}
                        onClick={() => setSelectedBeat(beat)}
                        className={`w-full text-left p-2 md:p-3 rounded-lg transition-colors ${
                          selectedBeat?.beat_id === beat.beat_id
                            ? 'bg-cinema-gold/20 border-2 border-cinema-gold'
                            : 'bg-base-300 hover:bg-base-100'
                        }`}
                      >
                        <div className="font-semibold text-xs md:text-sm">{beat.name}</div>
                        <div className="text-[10px] md:text-xs opacity-60 mt-0.5">
                          {beat.scenes.length} scene{beat.scenes.length !== 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Act 2 */}
                <div className="mt-4 md:mt-6">
                  <div className="badge badge-secondary badge-sm mb-1 md:mb-2">Act 2</div>
                  <div className="space-y-1 md:space-y-2">
                    {beats.filter(b => b.act === 2).map(beat => (
                      <button
                        key={beat.beat_id}
                        onClick={() => setSelectedBeat(beat)}
                        className={`w-full text-left p-2 md:p-3 rounded-lg transition-colors ${
                          selectedBeat?.beat_id === beat.beat_id
                            ? 'bg-cinema-gold/20 border-2 border-cinema-gold'
                            : 'bg-base-300 hover:bg-base-100'
                        }`}
                      >
                        <div className="font-semibold text-sm">{beat.name}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {beat.scenes.length} scene{beat.scenes.length !== 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Act 3 */}
                <div className="mt-6">
                  <div className="badge badge-accent mb-2">Act 3</div>
                  <div className="space-y-2">
                    {beats.filter(b => b.act === 3).map(beat => (
                      <button
                        key={beat.beat_id}
                        onClick={() => setSelectedBeat(beat)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedBeat?.beat_id === beat.beat_id
                            ? 'bg-cinema-gold/20 border-2 border-cinema-gold'
                            : 'bg-base-300 hover:bg-base-100'
                        }`}
                      >
                        <div className="font-semibold text-sm">{beat.name}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {beat.scenes.length} scene{beat.scenes.length !== 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beat Details */}
          <div className="lg:col-span-2">
            {selectedBeat ? (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="card-title text-2xl">{selectedBeat.name}</h2>
                      <div className="badge badge-primary mt-2">Act {selectedBeat.act}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-ghost gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="btn btn-sm btn-ghost gap-2 text-error">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-lg mt-4 opacity-80">{selectedBeat.description}</p>

                  <div className="divider"></div>

                  <h3 className="font-bold text-lg mb-3">Scenes in this Beat</h3>
                  <div className="space-y-2">
                    {selectedBeat.scenes.map((scene, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm opacity-60">#{idx + 1}</div>
                          <div className="font-semibold">{scene}</div>
                        </div>
                        <button className="btn btn-xs btn-ghost gap-1">
                          Go to Scene
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button className="btn btn-primary gap-2">
                      <Plus className="w-4 h-4" />
                      Add Scene to Beat
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body items-center text-center py-24">
                  <BookOpen className="w-16 h-16 opacity-30 mb-4" />
                  <h3 className="text-xl font-bold">Select a Story Beat</h3>
                  <p className="opacity-60 max-w-md">
                    Choose a beat from the left to view its details and manage scenes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
    </>
  );
}

