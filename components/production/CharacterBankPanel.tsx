'use client';

/**
 * Character Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Matches LocationBankPanel pattern exactly
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { CharacterProfile } from './types';
import { User, Loader2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { getEstimatedDuration } from '@/utils/jobTimeEstimates';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { CharacterDetailModal } from './CharacterDetailModal';
import PoseGenerationModal from '../character-bank/PoseGenerationModal';
import { useCharacters } from '@/hooks/useCharacterBank';
import { 
  getCharacterSortPreference, 
  setCharacterSortPreference, 
  sortCharacters,
  type CharacterSortOption 
} from '@/utils/characterSorting';
import type { Character } from '@/types/screenplay';

interface CharacterBankPanelProps {
  className?: string;
  characters?: CharacterProfile[];
  isLoading?: boolean;
  onCharactersUpdate?: () => void;
  entityToOpen?: string | null; // Character ID to open modal for
  onEntityOpened?: () => void; // Callback when entity modal is opened
}

export function CharacterBankPanel({
  className = '',
  characters: propsCharacters = [],
  isLoading: propsIsLoading = false,
  onCharactersUpdate,
  entityToOpen,
  onEntityOpened
}: CharacterBankPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // React Query for fetching characters - Production Hub context
  const { data: characters = propsCharacters, isLoading: queryLoading } = useCharacters(
    screenplayId || '',
    'production-hub', // 🔥 FIX: Use production-hub context to separate from Creation section
    !!screenplayId
  );

  const isLoading = queryLoading || propsIsLoading;

  // Local UI state only
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [showPoseModal, setShowPoseModal] = useState(false);
  const [poseCharacter, setPoseCharacter] = useState<{id: string, name: string, baseReferenceS3Key?: string} | null>(null);
  const [sortBy, setSortBy] = useState<CharacterSortOption>(() => getCharacterSortPreference());
  
  // 🔥 FIX: Get selectedCharacter from query data (always up-to-date) instead of stale prop
  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  
  // Convert CharacterProfile[] to Character[] for sorting utility
  const charactersForSorting: Character[] = useMemo(() => {
    return characters.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type || 'supporting',
      arcStatus: 'introduced' as const,
      description: c.description || '',
      customFields: [], // Required field, empty array for sorting purposes
      createdAt: new Date().toISOString(), // Required field, dummy value for sorting
      updatedAt: new Date().toISOString() // Required field, dummy value for sorting
    }));
  }, [characters]);
  
  // Sort characters using shared utility
  const sortedCharactersForSorting = useMemo(() => {
    return sortCharacters(
      charactersForSorting,
      sortBy,
      screenplay.relationships,
      screenplay.scenes
    );
  }, [charactersForSorting, sortBy, screenplay.relationships, screenplay.scenes]);
  
  // Map back to CharacterProfile[] maintaining original data
  const sortedCharacters = useMemo(() => {
    const sortedIds = new Set(sortedCharactersForSorting.map(c => c.id));
    return characters.filter(c => sortedIds.has(c.id))
      .sort((a, b) => {
        const indexA = sortedCharactersForSorting.findIndex(c => c.id === a.id);
        const indexB = sortedCharactersForSorting.findIndex(c => c.id === b.id);
        return indexA - indexB;
      });
  }, [characters, sortedCharactersForSorting]);
  
  // Save sort preference when it changes
  useEffect(() => {
    setCharacterSortPreference(sortBy);
  }, [sortBy]);

  // Auto-open modal when entityToOpen is set
  useEffect(() => {
    if (entityToOpen && !showCharacterDetail) {
      const character = characters.find(c => c.id === entityToOpen);
      if (character) {
        setSelectedCharacterId(entityToOpen);
        setShowCharacterDetail(true);
        onEntityOpened?.();
      }
    }
  }, [entityToOpen, characters, showCharacterDetail, onEntityOpened]);

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

  // Helper functions
  function handleGeneratePoses(characterId: string) {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setPoseCharacter({
        id: character.id,
        name: character.name,
        baseReferenceS3Key: character.baseReference?.s3Key
      });
      setShowPoseModal(true);
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
      
      // 🔥 FIX: Send full poseReferences objects (not just s3Keys)
      // Backend expects full objects with metadata (outfitName, poseId, etc.)
      if (updates.poseReferences !== undefined) {
        apiUpdates.poseReferences = updates.poseReferences;
        console.log('[CharacterBankPanel] 🔍 Updating poseReferences:', {
          characterId,
          count: updates.poseReferences.length,
          poseRefs: updates.poseReferences.map((r: any) => ({
            s3Key: typeof r === 'string' ? r : r.s3Key,
            id: typeof r === 'string' ? undefined : r.id
          }))
        });
      }
      
      // 🔥 FIX: Also handle angleReferences (backend may use either name)
      if ((updates as any).angleReferences !== undefined) {
        apiUpdates.poseReferences = (updates as any).angleReferences;
        console.log('[CharacterBankPanel] 🔍 Updating angleReferences (as poseReferences):', {
          characterId,
          count: (updates as any).angleReferences.length
        });
      }
      
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.type !== undefined) apiUpdates.type = updates.type;

      console.log('[CharacterBankPanel] 🚀 Sending PUT request:', {
        characterId,
        screenplayId,
        apiUpdates: {
          ...apiUpdates,
          poseReferences: apiUpdates.poseReferences ? `${apiUpdates.poseReferences.length} items` : undefined
        }
      });

      const response = await fetch(`/api/character-bank/${characterId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiUpdates),
      });

      console.log('[CharacterBankPanel] 📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CharacterBankPanel] ❌ Update failed:', errorData);
        throw new Error(errorData.error || `Failed to update character: ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('[CharacterBankPanel] ✅ Update successful:', {
        characterId,
        responseDataKeys: Object.keys(responseData),
        responseDataStructure: JSON.stringify(responseData).substring(0, 200),
        // Backend might return { success: true, data: { character: {...} } } or { character: {...} }
        character: responseData.character || responseData.data?.character,
        characterKeys: (responseData.character || responseData.data?.character) ? Object.keys(responseData.character || responseData.data?.character) : 'no character',
        poseReferencesCount: (responseData.character || responseData.data?.character)?.poseReferences?.length,
        angleReferencesCount: (responseData.character || responseData.data?.character)?.angleReferences?.length
      });
      
      // 🔥 FIX: Handle different response structures
      const updatedCharacter = responseData.character || responseData.data?.character;

      toast.success('Character updated successfully');
      
      // Check cache before refetch
      const cacheBeforeRefetch = queryClient.getQueryData<CharacterProfile[]>(['characters', screenplayId, 'production-hub']);
      console.log('[CharacterBankPanel] 📊 Cache before refetch:', {
        hasData: !!cacheBeforeRefetch,
        characterCount: cacheBeforeRefetch?.length,
        updatedChar: cacheBeforeRefetch?.find(c => c.id === characterId),
        poseRefsCount: cacheBeforeRefetch?.find(c => c.id === characterId)?.poseReferences?.length
      });
      
      // Invalidate React Query cache and refetch immediately - Production Hub context only
      // 🔥 FIX: Use refetchQueries to ensure immediate UI update
      console.log('[CharacterBankPanel] 🔄 Refetching characters after update');
      await queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
      
      // Check cache after refetch
      const cacheAfterRefetch = queryClient.getQueryData<CharacterProfile[]>(['characters', screenplayId, 'production-hub']);
      console.log('[CharacterBankPanel] 📊 Cache after refetch:', {
        hasData: !!cacheAfterRefetch,
        characterCount: cacheAfterRefetch?.length,
        updatedChar: cacheAfterRefetch?.find(c => c.id === characterId),
        poseRefsCount: cacheAfterRefetch?.find(c => c.id === characterId)?.poseReferences?.length
      });
      
      if (onCharactersUpdate) onCharactersUpdate();
      
      // 🔥 FIX: Return the updated character data so the modal can use it
      // Handle different response structures: { character: {...} } or { data: { character: {...} } }
      return updatedCharacter;
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
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Empty State */}
      {characters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 mx-4 text-center">
          <User className="w-12 h-12 text-[#808080] mb-3" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">No Characters Yet</p>
          <p className="text-xs text-[#808080] mb-4">
            Characters can only be added in the Create section. Use this panel to view and edit existing characters.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Sort Selector */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-[#1A1A1A]">
            <span className="text-sm text-[#B3B3B3]">{characters.length} {characters.length === 1 ? 'Character' : 'Characters'}</span>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[#808080]" />
              <select
                value={sortBy}
                onChange={(e) => {
                  const newSort = e.target.value as CharacterSortOption;
                  setSortBy(newSort);
                  setCharacterSortPreference(newSort);
                }}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1 text-sm text-[#B3B3B3] focus:outline-none focus:border-[#DC143C] cursor-pointer"
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="appearance">Order of Appearance</option>
                <option value="sceneCount">Scene Count</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 mx-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
              {sortedCharacters.map((character) => {
                const allReferences: CinemaCardImage[] = [];
                
                // Add base reference (only if it has imageUrl)
                if (character.baseReference?.imageUrl) {
                  allReferences.push({
                    id: 'base',
                    imageUrl: character.baseReference.imageUrl,
                    label: `${character.name} - Base Reference`
                  });
                }
                
                // Add user-uploaded references (only if they have imageUrl)
                (character.references || []).forEach((ref) => {
                  if (ref?.imageUrl) {
                    allReferences.push({
                      id: ref.id,
                      imageUrl: ref.imageUrl,
                      label: ref.label || 'Reference'
                    });
                  }
                });
                
                // Add AI-generated pose references (like locations add angleVariations)
                // Backend may return as angleReferences OR poseReferences - check both!
                const poseRefs = (character as any).angleReferences || character.poseReferences || [];
                poseRefs.forEach((poseRef: any) => {
                  const ref = typeof poseRef === 'string' ? null : poseRef;
                  if (ref && ref.imageUrl) {
                    allReferences.push({
                      id: ref.id || `pose-${ref.s3Key}`,
                      imageUrl: ref.imageUrl,
                      label: ref.label || 'Pose'
                    });
                  }
                });

                return (
                  <CinemaCard
                    key={character.id}
                    id={character.id}
                    name={character.name}
                    type={character.type}
                    typeLabel={character.type}
                    mainImage={allReferences.length > 0 ? allReferences[0] : null}
                    referenceImages={allReferences.slice(1)}
                    referenceCount={allReferences.length}
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
      {/* 🔥 FIX: Use selectedCharacter from query (always up-to-date) - will be null if characterId doesn't match */}
      {showCharacterDetail && selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          isOpen={showCharacterDetail}
          onClose={() => {
            setShowCharacterDetail(false);
            setSelectedCharacterId(null);
          }}
          onUpdate={async (characterId, updates) => {
            await updateCharacter(characterId, updates);
            // 🔥 FIX: Modal will automatically get updated character from query after refetch
          }}
          onUploadImage={async (characterId, file) => {
            toast.info('Character image upload coming soon');
          }}
          onGenerateVariations={async (characterId) => {
            toast.info('Reference generation coming soon');
          }}
          onGeneratePosePackage={(characterId) => {
            handleGeneratePoses(characterId);
          }}
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
              description: `Estimated time: ${getEstimatedDuration('pose-generation')}. Check the Jobs tab to track progress.`
            });
            setShowPoseModal(false);
            setPoseCharacter(null);
            // Job started - refresh characters after delay - Production Hub context only
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
              if (onCharactersUpdate) onCharactersUpdate();
            }, 5000);
          }}
        />
      )}
    </div>
  );
}
