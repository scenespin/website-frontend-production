'use client';

/**
 * Character Bank Panel - Simplified React Query Version
 * 
 * Production Hub Simplification Plan - Phase 1
 * Matches LocationBankPanel pattern exactly
 */

import React, { useState } from 'react';
import type { CharacterProfile } from './types';
import { User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { CharacterDetailModal } from './CharacterDetailModal';
import PoseGenerationModal from '../character-bank/PoseGenerationModal';
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
  const { data: characters = propsCharacters, isLoading: queryLoading } = useCharacters(
    screenplayId || '',
    !!screenplayId
  );

  const isLoading = queryLoading || propsIsLoading;

  // Local UI state only
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [showPoseModal, setShowPoseModal] = useState(false);
  const [poseCharacter, setPoseCharacter] = useState<{id: string, name: string, baseReferenceS3Key?: string} | null>(null);

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
        characterKeys: responseData.character ? Object.keys(responseData.character) : 'no character',
        poseReferencesCount: responseData.character?.poseReferences?.length,
        angleReferencesCount: responseData.character?.angleReferences?.length,
        fullCharacter: responseData.character
      });

      toast.success('Character updated successfully');
      // Invalidate React Query cache and refetch immediately
      await queryClient.refetchQueries({ queryKey: ['characters', screenplayId] });
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

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">Character Bank</h2>
        </div>
        <p className="text-xs text-[#808080]">
          {characters.length} {characters.length === 1 ? 'character' : 'characters'}
        </p>
      </div>

      {/* Empty State */}
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
              {characters.map((character) => {
                const allReferences: CinemaCardImage[] = [];
                
                // Add base reference
                if (character.baseReference) {
                  allReferences.push({
                    id: 'base',
                    imageUrl: character.baseReference.imageUrl,
                    label: `${character.name} - Base Reference`
                  });
                }
                
                // Add user-uploaded references
                (character.references || []).forEach((ref) => {
                  allReferences.push({
                    id: ref.id,
                    imageUrl: ref.imageUrl,
                    label: ref.label || 'Reference'
                  });
                });
                
                // Add AI-generated pose references (like locations add angleVariations)
                // Backend may return as angleReferences OR poseReferences - check both!
                const poseRefs = (character as any).angleReferences || character.poseReferences || [];
                if (poseRefs.length > 0) {
                  console.log(`[CharacterBankPanel] Found ${poseRefs.length} pose/angle references for ${character.name}:`, poseRefs);
                }
                poseRefs.forEach((poseRef: any) => {
                  const ref = typeof poseRef === 'string' ? null : poseRef;
                  if (ref && ref.imageUrl) {
                    allReferences.push({
                      id: ref.id || `pose-${ref.s3Key}`,
                      imageUrl: ref.imageUrl,
                      label: ref.label || 'Pose'
                    });
                  } else if (ref && !ref.imageUrl) {
                    console.warn(`[CharacterBankPanel] Pose reference missing imageUrl for ${character.name}:`, ref);
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
      {showCharacterDetail && selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          isOpen={showCharacterDetail}
          onClose={() => {
            setShowCharacterDetail(false);
            setSelectedCharacterId(null);
          }}
          onUpdate={updateCharacter}
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
              description: 'Check the Jobs tab to track progress.'
            });
            setShowPoseModal(false);
            setPoseCharacter(null);
            // Job started - refresh characters after delay
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
