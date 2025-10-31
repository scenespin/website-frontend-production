'use client';

/**
 * Character Bank Panel - Production Page Right Panel
 * 
 * Displays character profiles with reference libraries:
 * - Base reference image
 * - Auto-generated variations (angles, expressions, actions)
 * - Manual uploads
 * - Generation controls
 */

import React, { useState, useEffect } from 'react';
import type { CharacterProfile } from './ProductionPageLayout';
import { 
  User, 
  Plus, 
  Image as ImageIcon, 
  Sparkles,
  Upload,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceControls, PerformanceSettings } from '../characters/PerformanceControls';

interface CharacterBankPanelProps {
  characters: CharacterProfile[];
  isLoading: boolean;
  projectId: string;
  onCharactersUpdate: () => void;
}

export function CharacterBankPanel({
  characters,
  isLoading,
  projectId,
  onCharactersUpdate
}: CharacterBankPanelProps) {
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isGeneratingRefs, setIsGeneratingRefs] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Advanced features availability
  const [hasAdvancedFeatures, setHasAdvancedFeatures] = useState(false);
  
  // Performance settings for selected character
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    facialPerformance: 1.0,
    animationStyle: 'full-body'
  });

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  // Check if advanced features are available (silent check)
  useEffect(() => {
    fetch('/api/features/advanced-performance')
      .then(r => r.json())
      .then(data => setHasAdvancedFeatures(data.available))
      .catch(() => setHasAdvancedFeatures(false)); // Silent failure
  }, []);

  // Load performance settings when character is selected
  useEffect(() => {
    if (selectedCharacter) {
      // Load from character profile if available
      setPerformanceSettings(selectedCharacter.performanceSettings || {
        facialPerformance: 1.0,
        animationStyle: 'full-body'
      });
    }
  }, [selectedCharacter]);

  // Save performance settings when they change
  useEffect(() => {
    if (selectedCharacter && hasAdvancedFeatures) {
      // Debounced save to backend
      const timeoutId = setTimeout(async () => {
        try {
          await fetch('/api/character-bank/update-performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              characterId: selectedCharacter.id,
              performanceSettings
            })
          });
        } catch (error) {
          console.error('[CharacterBank] Failed to save performance settings:', error);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [performanceSettings, selectedCharacter, projectId, hasAdvancedFeatures]);

  async function generateReferences(characterId: string) {
    setIsGeneratingRefs(prev => ({ ...prev, [characterId]: true }));
    try {
      const response = await fetch('/api/character-bank/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          characterId,
          variations: ['front', 'profile', 'three-quarter', 'happy', 'sad', 'action']
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onCharactersUpdate();
      }
    } catch (error) {
      console.error('[CharacterBank] Generate refs failed:', error);
    } finally {
      setIsGeneratingRefs(prev => ({ ...prev, [characterId]: false }));
    }
  }

  async function uploadReference(characterId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('projectId', projectId);
      formData.append('characterId', characterId);

      const response = await fetch('/api/character-bank/upload-reference', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        onCharactersUpdate();
      }
    } catch (error) {
      console.error('[CharacterBank] Upload failed:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Character Bank
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Create Character"
          >
            <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {characters.length} {characters.length === 1 ? 'character' : 'characters'}
        </p>
      </div>

      {/* Characters List */}
      {characters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            No Characters Yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            Create characters to maintain consistency across clips
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Character
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Character Cards */}
          <div className="p-3 space-y-2">
            {characters.map(character => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacterId(
                  selectedCharacterId === character.id ? null : character.id
                )}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  selectedCharacterId === character.id
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Base Reference Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {character.baseReference ? (
                      <img
                        src={character.baseReference.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>

                  {/* Character Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                      {character.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        character.type === 'lead' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                        character.type === 'supporting' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                        character.type === 'minor' && 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      )}>
                        {character.type}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {character.referenceCount} refs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded References */}
                {selectedCharacterId === character.id && character.references.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-2">
                      {character.references.map(ref => (
                        <div key={ref.id} className="relative group">
                          <img
                            src={ref.imageUrl}
                            alt={ref.label}
                            className="w-full aspect-square object-cover rounded border border-slate-200 dark:border-slate-700"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-end p-1">
                            <span className="text-xs text-white font-medium truncate">
                              {ref.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Selected Character Actions */}
          {selectedCharacter && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pt-8 pb-3 px-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-3">
                
                {/* Performance Controls - Only show if advanced features available */}
                {hasAdvancedFeatures && (
                  <div className="pb-3 border-b border-slate-200 dark:border-slate-600">
                    <PerformanceControls
                      settings={performanceSettings}
                      onChange={setPerformanceSettings}
                      compact={false}
                    />
                  </div>
                )}

                <button
                  onClick={() => generateReferences(selectedCharacter.id)}
                  disabled={isGeneratingRefs[selectedCharacter.id]}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isGeneratingRefs[selectedCharacter.id]
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  )}
                >
                  {isGeneratingRefs[selectedCharacter.id] ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate References
                    </>
                  )}
                </button>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadReference(selectedCharacter.id, file);
                    }}
                    className="hidden"
                  />
                  <span className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload Reference
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Character Modal (simplified - would be a full modal in production) */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Create Character
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Create characters in the Write tab first, then generate references here.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

