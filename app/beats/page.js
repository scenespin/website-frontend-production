'use client';

import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useEditorContext } from '@/lib/contextStore';
import { storyBeatsAPI } from '@/lib/navigationAPI';
import { BookOpen, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function StoryBeatsPage() {
  const { user } = useUser();
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
  useEffect(() => {
    if (!projectId || !user) return;
    
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
  }, [projectId, user, beatId, context.currentBeatId, getToken]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please sign in</h2>
          <p className="opacity-60">You need to be signed in to access Story Beats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-extrabold">Story Beats</h1>
                <p className="text-sm opacity-80">Structure your narrative with proven beat sheets</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddBeat(true)}
              className="btn btn-sm bg-white/20 hover:bg-white/30 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Beat
            </button>
          </div>
        </div>
      </div>

      {/* Context Indicator */}
      {context.currentSceneName && (
        <div className="bg-info/10 border-b border-info/20">
          <div className="max-w-7xl mx-auto px-4 py-2 text-sm">
            <span className="opacity-70">Navigated from scene:</span>{' '}
            <span className="font-semibold">{context.currentSceneName}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-lg opacity-60">Loading story beats...</p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beats List */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Story Structure</h2>
                
                {/* Act 1 */}
                <div className="mt-4">
                  <div className="badge badge-primary mb-2">Act 1</div>
                  <div className="space-y-2">
                    {beats.filter(b => b.act === 1).map(beat => (
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

                {/* Act 2 */}
                <div className="mt-6">
                  <div className="badge badge-secondary mb-2">Act 2</div>
                  <div className="space-y-2">
                    {beats.filter(b => b.act === 2).map(beat => (
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
  );
}

