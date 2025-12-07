'use client';

/**
 * Character Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Reduced from ~661 lines to ~150 lines using React Query
 */

import React, { useState, useEffect } from 'react';
import type { CharacterProfile } from './types';
import { User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { CharacterDetailModal } from './CharacterDetailModal';
import PoseGenerationModal from '../character-bank/PoseGenerationModal';
import { PerformanceControls, PerformanceSettings } from '../characters/PerformanceControls';
import { useCharacters } from '@/hooks/useCharacterBank';

interface CharacterBankPanelProps {
  className?: string;
  characters?: CharacterProfile[];
  isLoading?: boolean;
  onCharactersUpdate?: () => void;
}

export function CharacterBankPanel({
  className = '',
  characters: propsCharacters = [],
  isLoading: propsIsLoading = false,
  onCharactersUpdate
}: CharacterBankPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // React Query for fetching characters
  const { data: characters = propsCharacters, isLoading: queryLoading, refetch } = useCharacters(
    screenplayId || '',
    !!screenplayId
  );

  const isLoading = queryLoading || propsIsLoading;

  // Local UI state only
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [showPoseModal, setShowPoseModal] = useState(false);
  const [poseCharacter, setPoseCharacter] = useState<{id: string, name: string, baseReferenceS3Key?: string} | null>(null);
  const [hasAdvancedFeatures, setHasAdvancedFeatures] = useState(false);
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    facialPerformance: 1.0,
    animationStyle: 'full-body'
  });

  // Check advanced features (one-time check)
  useEffect(() => {
    async function checkAdvancedFeatures() {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const response = await fetch('/api/features/advanced-performance', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        setHasAdvancedFeatures(data.available || false);
      } catch (error) {
        console.error('[CharacterBank] Failed to check advanced features:', error);
      }
    }
    checkAdvancedFeatures();
  }, [getToken]);

  // Early return after all hooks
  if (!screenplayId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading characters...</p>
        </div>
      </div>
    );
  }

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  // Load performance settings when character is selected
  useEffect(() => {
    if (selectedCharacter) {
      setPerformanceSettings(selectedCharacter.performanceSettings || {
        facialPerformance: 1.0,
        animationStyle: 'full-body'
      });
    }
  }, [selectedCharacter]);

  // Save performance settings (debounced)
  useEffect(() => {
    if (selectedCharacter && hasAdvancedFeatures) {
      const timeoutId = setTimeout(async () => {
        try {
          await fetch('/api/character-bank/update-performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              screenplayId,
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
  }, [performanceSettings, selectedCharacter, screenplayId, hasAdvancedFeatures]);

  // Helper functions
  async function generateReferences(characterId: string) {
    try {
      const response = await fetch('/api/character-bank/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenplayId,
          characterId,
          variations: ['front', 'profile', 'three-quarter', 'happy', 'sad', 'action']
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error?.message || errorData.error || 'Generation failed');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const referencesCount = (data.data.references || []).length;
        if (referencesCount > 0) {
          toast.success(`Generated ${referencesCount} reference variation${referencesCount > 1 ? 's' : ''}!`);
        }
        // Invalidate React Query cache to refresh
        queryClient.invalidateQueries({ queryKey: ['characters', screenplayId] });
        if (onCharactersUpdate) onCharactersUpdate();
      }
    } catch (error: any) {
      console.error('[CharacterBank] Generate refs failed:', error);
      toast.error(error.message || 'Failed to generate references');
    }
  }

  async function uploadReference(characterId: string, file: File) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Get presigned URL
      const presignedResponse = await fetch(
        `/api/characters/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&screenplayId=${encodeURIComponent(screenplayId)}` +
        `&characterId=${encodeURIComponent(characterId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
      }

      const { url, fields, s3Key } = await presignedResponse.json();
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
      }

      // Upload to S3
      const s3FormData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'bucket') {
          s3FormData.append(key, value as string);
        }
      });
      s3FormData.append('file', file);

      const s3UploadResponse = await fetch(url, {
        method: 'POST',
        body: s3FormData,
      });

      if (!s3UploadResponse.ok) {
        throw new Error(`S3 upload failed: ${s3UploadResponse.status}`);
      }

      // Register with backend
      const registerResponse = await fetch('/api/character-bank/upload-reference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
          screenplayId,
          characterId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to register image: ${registerResponse.status}`);
      }

      toast.success('Image uploaded successfully');
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['characters', screenplayId] });
      if (onCharactersUpdate) onCharactersUpdate();
    } catch (error: any) {
      console.error('[CharacterBank] Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    }
  }

  async function updateCharacter(characterId: string, updates: Partial<CharacterProfile>) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const apiUpdates: any = {};
      
      if (updates.references !== undefined) {
        apiUpdates.referenceImages = updates.references
          .map((ref: any) => typeof ref === 'string' ? ref : ref.s3Key)
          .filter(Boolean);
      }
      
      if (updates.poseReferences !== undefined) {
        apiUpdates.poseReferences = updates.poseReferences
          .map((ref: any) => {
            if (typeof ref === 'string') return ref;
            return ref.s3Key || ref.metadata?.s3Key;
          })
          .filter(Boolean);
      }
      
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.type !== undefined) apiUpdates.type = updates.type;
      if (updates.arcStatus !== undefined) apiUpdates.arcStatus = updates.arcStatus;
      if (updates.arcNotes !== undefined) apiUpdates.arcNotes = updates.arcNotes;
      if (updates.physicalAttributes !== undefined) apiUpdates.physicalAttributes = updates.physicalAttributes;

      const response = await fetch(`/api/character-bank/${characterId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUpdates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update character: ${response.status}`);
      }

      toast.success('Character updated successfully');
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['characters', screenplayId] });
      if (onCharactersUpdate) onCharactersUpdate();
    } catch (error: any) {
      console.error('[CharacterBank] Failed to update character:', error);
      toast.error(`Failed to update character: ${error.message}`);
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">Character Bank</h2>
        </div>
        <p className="text-xs text-[#808080]">
          {characters.length} {characters.length === 1 ? 'character' : 'characters'}
        </p>
      </div>

      {/* Characters Grid */}
      {characters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <User className="w-12 h-12 text-[#808080] mb-3" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">No Characters Yet</p>
          <p className="text-xs text-[#808080] mb-4">
            Characters can only be added in the Create section. Use this panel to view and edit existing characters.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {characters.map(character => {
                const referenceImages: CinemaCardImage[] = character.references.map(ref => ({
                  id: ref.id,
                  imageUrl: ref.imageUrl,
                  label: ref.label
                }));

                return (
                  <CinemaCard
                    key={character.id}
                    id={character.id}
                    name={character.name}
                    type={character.type}
                    typeLabel={character.type}
                    mainImage={character.baseReference ? {
                      id: 'base',
                      imageUrl: character.baseReference.imageUrl,
                      label: `${character.name} - Base Reference`
                    } : null}
                    referenceImages={referenceImages}
                    referenceCount={character.referenceCount}
                    cardType="character"
                    onClick={() => {
                      setSelectedCharacterId(character.id);
                      setShowCharacterDetail(true);
                    }}
                    isSelected={selectedCharacterId === character.id}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Character Detail Modal */}
      {showCharacterDetail && selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          isOpen={showCharacterDetail}
          onClose={() => {
            setShowCharacterDetail(false);
            setSelectedCharacterId(null);
          }}
          onUpdate={updateCharacter}
          onUploadImage={uploadReference}
          onGenerate3D={async () => {}}
          onGenerateVariations={generateReferences}
          onGeneratePosePackage={(characterId) => {
            const character = characters.find(c => c.id === characterId);
            if (character) {
              setPoseCharacter({
                id: character.id,
                name: character.name,
                baseReferenceS3Key: character.baseReference?.s3Key
              });
              setShowPoseModal(true);
            }
          }}
          hasAdvancedFeatures={hasAdvancedFeatures}
          performanceSettings={performanceSettings}
          onPerformanceSettingsChange={setPerformanceSettings}
        />
      )}

      {/* Pose Generation Modal */}
      {showPoseModal && poseCharacter && (
        <PoseGenerationModal
          isOpen={showPoseModal}
          onClose={() => {
            setShowPoseModal(false);
            setPoseCharacter(null);
          }}
          characterId={poseCharacter.id}
          characterName={poseCharacter.name}
          projectId={screenplayId}
          baseReferenceS3Key={poseCharacter.baseReferenceS3Key}
          onComplete={async () => {
            toast.success(`Pose generation started for ${poseCharacter.name}!`, {
              description: 'Check the Jobs tab to track progress.'
            });
            setShowPoseModal(false);
            setPoseCharacter(null);
            // Refresh after delay
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['characters', screenplayId] });
              if (onCharactersUpdate) onCharactersUpdate();
            }, 5000);
          }}
        />
      )}
    </div>
  );
}

