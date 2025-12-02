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
import type { Character } from '@/types/screenplay';
import { 
  User, 
  Image as ImageIcon, 
  Sparkles,
  Upload,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PerformanceControls, PerformanceSettings } from '../characters/PerformanceControls';
import PoseGenerationModal from '../character-bank/PoseGenerationModal';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { CinemaCard, type CinemaCardImage } from './CinemaCard';
import { CharacterDetailModal } from './CharacterDetailModal';

interface CharacterBankPanelProps {
  characters: CharacterProfile[];
  isLoading: boolean;
  projectId: string; // Actually screenplayId - kept as projectId for backward compatibility
  onCharactersUpdate: () => void;
}

export function CharacterBankPanel({
  characters,
  isLoading,
  projectId,
  onCharactersUpdate
}: CharacterBankPanelProps) {
  
  const { updateCharacter, deleteCharacter } = useScreenplay();
  const { getToken } = useAuth();
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isGeneratingRefs, setIsGeneratingRefs] = useState<Record<string, boolean>>({});
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  
  // Pose Generation Modal state
  const [showPoseModal, setShowPoseModal] = useState(false);
  const [poseCharacter, setPoseCharacter] = useState<{id: string, name: string, baseReferenceS3Key?: string} | null>(null);
  
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
    async function checkAdvancedFeatures() {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const response = await fetch('/api/features/advanced-performance', {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        const data = await response.json();
        setHasAdvancedFeatures(data.available || false);
      } catch (error) {
        console.error('[CharacterBank] Failed to check advanced features:', error);
        setHasAdvancedFeatures(false); // Silent failure
      }
    }
    checkAdvancedFeatures();
  }, [getToken]);

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
      // Debounced save to backend via Next.js API route (handles auth internally)
      const timeoutId = setTimeout(async () => {
        try {
          await fetch('/api/character-bank/update-performance', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              screenplayId: projectId, // projectId prop is actually screenplayId
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
    console.log('[CharacterBank] Generate references clicked for character:', characterId);
    setIsGeneratingRefs(prev => ({ ...prev, [characterId]: true }));
    try {
      console.log('[CharacterBank] Calling generate-variations API with:', {
        screenplayId: projectId,
        characterId,
        variations: ['front', 'profile', 'three-quarter', 'happy', 'sad', 'action']
      });
      
      // Call Next.js API route which will proxy to backend with auth
      const response = await fetch('/api/character-bank/generate-variations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenplayId: projectId, // Use screenplayId (projectId prop is actually screenplayId)
          characterId,
          variations: ['front', 'profile', 'three-quarter', 'happy', 'sad', 'action']
        })
      });

      console.log('[CharacterBank] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[CharacterBank] API error response:', errorData);
        
        // Extract error message from backend response format
        let errorMessage = 'Unknown error';
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Handle 404 specifically - backend route not deployed yet
        if (response.status === 404) {
          errorMessage = `${errorMessage}. The backend may need to be redeployed with the latest changes.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[CharacterBank] API success response:', data);
      
      if (data.success && data.data) {
        const responseData = data.data;
        const references = responseData.references || [];
        const referencesCount = references.length;
        const character = responseData.character;
        
        console.log('[CharacterBank] Processing response:', {
          referencesCount,
          hasCharacter: !!character,
          hasReferences: references.length > 0,
          references: references.map((r: any) => ({ label: r.label, type: r.referenceType }))
        });
        
        // Update character in context if we have the updated character and references
        if (character && updateCharacter && references.length > 0) {
          try {
            // Map the character profile and generated references to the Character type expected by context
            // The backend returns references as a separate array, not nested in character
            const characterUpdates: Partial<Character> = {
              images: [
                ...(character.baseReference ? [{
                  imageUrl: character.baseReference.imageUrl,
                  s3Key: character.baseReference.s3Key,
                  createdAt: new Date().toISOString(),
                  metadata: { 
                    s3Key: character.baseReference.s3Key,
                    uploadedFileName: 'Base Reference' 
                  }
                }] : []),
                ...references.map((ref: any) => ({
                  imageUrl: ref.imageUrl,
                  s3Key: ref.s3Key,
                  createdAt: new Date().toISOString(),
                  metadata: { 
                    s3Key: ref.s3Key,
                    uploadedFileName: ref.label || ref.referenceType || 'Reference',
                    referenceType: ref.referenceType
                  }
                }))
              ]
            };
            
            console.log('[CharacterBank] Updating character with', characterUpdates.images?.length || 0, 'images');
            await updateCharacter(characterId, characterUpdates);
            console.log('[CharacterBank] ✅ Character updated in context');
          } catch (error) {
            console.error('[CharacterBank] Failed to update character in context:', error);
            toast.error('Generated variations but failed to update character. Please refresh.');
          }
        } else if (references.length === 0) {
          console.warn('[CharacterBank] No references generated - backend may have failed silently');
          toast.warning('Generation completed but no variations were created. Check backend logs.');
        }
        
        if (referencesCount > 0) {
          toast.success(`Generated ${referencesCount} reference variation${referencesCount > 1 ? 's' : ''}!`);
        }
        onCharactersUpdate();
      } else {
        throw new Error(data.error?.message || data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('[CharacterBank] Generate refs failed:', error);
      toast.error(error.message || 'Failed to generate references');
    } finally {
      setIsGeneratingRefs(prev => ({ ...prev, [characterId]: false }));
    }
  }

  async function uploadReference(characterId: string, file: File) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      const formData = new FormData();
      formData.append('image', file);
      formData.append('screenplayId', projectId); // projectId prop is actually screenplayId
      formData.append('characterId', characterId);

      const response = await fetch('/api/character-bank/upload-reference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[CharacterBank] Upload failed:', errorData);
        throw new Error(errorData.error?.message || errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Response format: { success: true, data: { s3Key, imageUrl, message } }
      if (data.success && data.data) {
        toast.success('Image uploaded successfully');
        onCharactersUpdate();
      } else {
        console.error('[CharacterBank] Upload failed:', data.error || 'Unknown error');
        toast.error(data.error?.message || data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('[CharacterBank] Upload failed:', error);
      toast.error('Failed to upload image');
    }
  }


  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC143C]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">
            Character Bank
          </h2>
        </div>
        <p className="text-xs text-[#808080]">
          {characters.length} {characters.length === 1 ? 'character' : 'characters'}
        </p>
      </div>

      {/* Characters Grid */}
      {characters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <User className="w-12 h-12 text-[#808080] mb-3" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">
            No Characters Yet
          </p>
          <p className="text-xs text-[#808080] mb-4">
            Characters can only be added in the Create section. Use this panel to view and edit existing characters.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Character Cards Grid - Smaller cards with more spacing */}
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {characters.map(character => {
                // Convert CharacterReference to CinemaCardImage
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
                      // Open detail modal instead of just selecting
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
          onUpdate={async (characterId, updates) => {
            // Handle character updates via ScreenplayContext
            try {
              await updateCharacter(characterId, updates);
              onCharactersUpdate();
            } catch (error) {
              console.error('[CharacterBank] Failed to update character:', error);
              toast.error('Failed to update character');
            }
          }}
          projectId={projectId}
          onUploadImage={async (characterId, file) => {
            await uploadReference(characterId, file);
          }}
          onGenerate3D={async (characterId) => {
            // TODO: Implement 3D generation
            toast.info('3D generation coming soon');
          }}
          onGenerateVariations={async (characterId) => {
            await generateReferences(characterId);
          }}
          onGeneratePosePackage={(characterId) => {
            const character = characters.find(c => c.id === characterId);
            if (character) {
              setPoseCharacter({
                id: character.id, 
                name: character.name,
                baseReferenceS3Key: character.baseReference?.s3Key // Pass s3Key instead of presigned URL
              });
              setShowPoseModal(true);
            }
          }}
          hasAdvancedFeatures={hasAdvancedFeatures}
          performanceSettings={performanceSettings}
          onPerformanceSettingsChange={setPerformanceSettings}
        />
      )}
      
      {/* NEW: Pose Generation Modal */}
      {showPoseModal && poseCharacter && (
        <PoseGenerationModal
          isOpen={showPoseModal}
          onClose={() => {
            setShowPoseModal(false);
            setPoseCharacter(null);
          }}
          characterId={poseCharacter.id}
          characterName={poseCharacter.name}
          projectId={projectId}
          baseReferenceS3Key={poseCharacter.baseReferenceS3Key}
          onComplete={(result) => {
            toast.success(`Generated ${result.result?.poses?.length || 0} poses for ${poseCharacter.name}!`);
            onCharactersUpdate();
            setShowPoseModal(false);
            setPoseCharacter(null);
          }}
        />
      )}
    </div>
  );
}

