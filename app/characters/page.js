'use client';

import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useEditorContext } from '@/lib/contextStore';
import { charactersAPI } from '@/lib/navigationAPI';
import { Users, Plus, Edit, Trash2, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
// ResponsiveHeader removed - will use Navigation.js from wrapper

export default function CharactersPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const characterId = searchParams.get('characterId');
  const context = useEditorContext();
  
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showAddCharacter, setShowAddCharacter] = useState(false);

  // Load characters from API
  // Note: Auth guaranteed by AuthenticatedPageWrapper
  useEffect(() => {
    if (!projectId) return;
    
    const loadCharacters = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) throw new Error('No auth token');
        
        const data = await charactersAPI.getCharacters(projectId, token);
        setCharacters(data);
        
        // Auto-select character from context
        if (characterId) {
          const char = data.find(c => c.character_id === characterId);
          if (char) setSelectedCharacter(char);
        } else if (context.activeCharacterId) {
          const char = data.find(c => c.character_id === context.activeCharacterId);
          if (char) setSelectedCharacter(char);
        }
      } catch (error) {
        console.error('Failed to load characters:', error);
        toast.error('Failed to load characters', {
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCharacters();
  }, [projectId, characterId, context.activeCharacterId, getToken]);

  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
      <div className="min-h-screen bg-slate-900 text-base-content">
        {/* Editor Sub-Navigation */}
        <EditorSubNav activeTab="characters" projectId={projectId} />

      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-base-content shadow-lg">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Users className="w-6 h-6 md:w-8 md:h-8 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-extrabold truncate">Characters</h1>
                <p className="text-xs md:text-sm opacity-80 hidden sm:block">Manage your cast and character profiles</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddCharacter(true)}
              className="btn btn-sm md:btn-md bg-white/20 hover:bg-white/30 gap-1 md:gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Context Indicator - Mobile Optimized */}
      {context.activeCharacterName && (
        <div className="bg-info/10 border-b border-info/20">
          <div className="max-w-7xl mx-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
            <span className="opacity-70">Active:</span>{' '}
            <span className="font-semibold">{context.activeCharacterName}</span>
            {context.currentSceneName && (
              <span className="opacity-70 hidden sm:inline"> • {context.currentSceneName}</span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
          {/* Characters List */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-3 md:p-6">
                <h2 className="card-title text-base md:text-xl">Cast</h2>
                <p className="text-xs md:text-sm opacity-60 mb-2 md:mb-4">{characters.length} character{characters.length !== 1 ? 's' : ''}</p>
                
                <div className="space-y-1.5 md:space-y-2">
                  {characters.map(character => (
                    <button
                      key={character.character_id}
                      onClick={() => setSelectedCharacter(character)}
                      className={`w-full text-left p-2 md:p-4 rounded-lg transition-colors ${
                        selectedCharacter?.character_id === character.character_id
                          ? 'bg-cinema-gold/20 border-2 border-cinema-gold'
                          : 'bg-base-300 hover:bg-base-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-8 md:w-10">
                            <span className="text-xs md:text-sm">{character.name[0]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{character.name}</div>
                          <div className="text-xs opacity-60 truncate hidden sm:block">{character.full_name}</div>
                          <div className="text-[10px] md:text-xs opacity-50 mt-0.5">
                            {character.scenes.length} scene{character.scenes.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Character Details */}
          <div className="lg:col-span-2">
            {selectedCharacter ? (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-16">
                          <span className="text-2xl">{selectedCharacter.name[0]}</span>
                        </div>
                      </div>
                      <div>
                        <h2 className="card-title text-2xl">{selectedCharacter.full_name}</h2>
                        <div className="flex gap-2 mt-2">
                          <div className="badge badge-primary">{selectedCharacter.name}</div>
                          <div className="badge badge-ghost">{selectedCharacter.age}</div>
                        </div>
                      </div>
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

                  <div className="divider"></div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Description</h3>
                      <p className="opacity-80">{selectedCharacter.description}</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3">Appears in Scenes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedCharacter.scenes.map((scene, idx) => (
                          <div key={idx} className="p-3 bg-base-300 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 opacity-60" />
                              <span className="font-semibold text-sm">{scene}</span>
                            </div>
                            <button className="btn btn-xs btn-ghost">View</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card bg-base-300">
                        <div className="card-body p-4">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Reference Images
                          </h4>
                          <button className="btn btn-sm btn-outline gap-2">
                            <Plus className="w-3 h-3" />
                            Upload
                          </button>
                        </div>
                      </div>

                      <div className="card bg-base-300">
                        <div className="card-body p-4">
                          <h4 className="font-semibold mb-2">AI Generation</h4>
                          <button className="btn btn-sm btn-primary gap-2">
                            Generate Scenes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body items-center text-center py-24">
                  <Users className="w-16 h-16 opacity-30 mb-4" />
                  <h3 className="text-xl font-bold">Select a Character</h3>
                  <p className="opacity-60 max-w-md">
                    Choose a character from the left to view their details and manage their scenes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

