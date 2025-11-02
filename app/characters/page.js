'use client';

import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useEditorContext } from '@/lib/contextStore';
import { charactersAPI } from '@/lib/navigationAPI';
import { Users, Plus, Edit, Trash2, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { EditorSubNav } from '@/components/editor/EditorSubNav';

export default function CharactersPage() {
  const { user } = useUser();
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
  useEffect(() => {
    if (!projectId || !user) return;
    
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
  }, [projectId, user, characterId, context.activeCharacterId, getToken]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please sign in</h2>
          <p className="opacity-60">You need to be signed in to access Characters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Editor Sub-Navigation */}
      <EditorSubNav activeTab="characters" projectId={projectId} />

      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-base-content shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-extrabold">Characters</h1>
                <p className="text-sm opacity-80">Manage your cast and character profiles</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddCharacter(true)}
              className="btn btn-sm bg-white/20 hover:bg-white/30 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Character
            </button>
          </div>
        </div>
      </div>

      {/* Context Indicator */}
      {context.activeCharacterName && (
        <div className="bg-info/10 border-b border-info/20">
          <div className="max-w-7xl mx-auto px-4 py-2 text-sm">
            <span className="opacity-70">Active in scene:</span>{' '}
            <span className="font-semibold">{context.activeCharacterName}</span>
            {context.currentSceneName && (
              <span className="opacity-70"> • {context.currentSceneName}</span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Characters List */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Cast</h2>
                <p className="text-sm opacity-60 mb-4">{characters.length} character{characters.length !== 1 ? 's' : ''}</p>
                
                <div className="space-y-2">
                  {characters.map(character => (
                    <button
                      key={character.character_id}
                      onClick={() => setSelectedCharacter(character)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedCharacter?.character_id === character.character_id
                          ? 'bg-cinema-gold/20 border-2 border-cinema-gold'
                          : 'bg-base-300 hover:bg-base-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-10">
                            <span className="text-sm">{character.name[0]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{character.name}</div>
                          <div className="text-xs opacity-60 truncate">{character.full_name}</div>
                          <div className="text-xs opacity-50 mt-1">
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
  );
}

