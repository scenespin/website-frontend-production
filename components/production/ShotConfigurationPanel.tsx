'use client';

/**
 * ShotConfigurationPanel - Renders the expanded configuration UI for a single shot
 * 
 * Handles:
 * - Location angle selection
 * - Props (placeholder)
 * - Character(s) section (explicit characters from action lines)
 * - Pronoun mapping section (singular and plural)
 * - Character image display (right column)
 */

import React from 'react';
import { LocationAngleSelector } from './LocationAngleSelector';
import { PronounMappingSection } from './PronounMappingSection';
import { SceneAnalysisResult } from '@/types/screenplay';

interface ShotConfigurationPanelProps {
  shot: any;
  sceneAnalysisResult: SceneAnalysisResult;
  shotMappings: Record<string, string | string[]>;
  hasPronouns: boolean;
  explicitCharacters: string[];
  singularPronounCharacters: string[];
  pluralPronounCharacters: string[];
  selectedLocationReferences: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  onLocationAngleChange?: (shotSlot: number, locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  isLocationAngleRequired: (shot: any) => boolean;
  needsLocationAngle: (shot: any) => boolean;
  // Character rendering helpers
  renderCharacterControlsOnly: (charId: string, shotSlot: number, shotMappings: Record<string, string | string[]>, hasPronouns: boolean, category: 'explicit' | 'singular' | 'plural') => React.ReactNode;
  renderCharacterImagesOnly: (charId: string, shotSlot: number, pronounsForChar?: string[]) => React.ReactNode;
  // Pronoun mapping props
  pronounInfo: { hasPronouns: boolean; pronouns: string[] };
  allCharacters: any[];
  selectedCharactersForShots: Record<number, string[]>;
  onCharactersForShotChange?: (shotSlot: number, characterIds: string[]) => void;
  onPronounMappingChange?: (shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => void;
  characterHeadshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots: Record<string, boolean>;
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>;
  characterOutfits: Record<number, Record<string, string>>; // Per-shot, per-character: shotSlot -> characterId -> outfitName
  onCharacterReferenceChange: (shotSlot: number, characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  onCharacterOutfitChange: (shotSlot: number, characterId: string, outfitName: string | undefined) => void;
}

export function ShotConfigurationPanel({
  shot,
  sceneAnalysisResult,
  shotMappings,
  hasPronouns,
  explicitCharacters,
  singularPronounCharacters,
  pluralPronounCharacters,
  selectedLocationReferences,
  onLocationAngleChange,
  isLocationAngleRequired,
  needsLocationAngle,
  renderCharacterControlsOnly,
  renderCharacterImagesOnly,
  pronounInfo,
  allCharacters,
  selectedCharactersForShots,
  onCharactersForShotChange,
  onPronounMappingChange,
  characterHeadshots,
  loadingHeadshots,
  selectedCharacterReferences,
  characterOutfits,
  onCharacterReferenceChange,
  onCharacterOutfitChange
}: ShotConfigurationPanelProps) {
  const shouldShowLocation = needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && onLocationAngleChange;

  return (
    <div className="mt-3 space-y-4">
      {/* Location Section */}
      {shouldShowLocation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3 border-b border-[#3F3F46]">
          <div>
            <div className="text-xs font-medium text-[#FFFFFF]">Location</div>
          </div>
          <div className="border-l border-[#3F3F46] pl-4">
            <LocationAngleSelector
              locationId={sceneAnalysisResult.location.id}
              locationName={sceneAnalysisResult.location.name || 'Location'}
              angleVariations={sceneAnalysisResult.location.angleVariations || []}
              baseReference={sceneAnalysisResult.location.baseReference}
              selectedAngle={selectedLocationReferences[shot.slot]}
              onAngleChange={(locationId, angle) => {
                onLocationAngleChange?.(shot.slot, locationId, angle);
              }}
              isRequired={isLocationAngleRequired(shot)}
              recommended={sceneAnalysisResult.location.recommended}
            />
          </div>
        </div>
      )}

      {/* Props Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3 border-b border-[#3F3F46]">
        <div>
          <div className="text-xs font-medium text-[#808080]">Props</div>
        </div>
        <div className="border-l border-[#3F3F46] pl-4">
          <div className="text-[10px] text-[#808080] italic">Coming in next phase</div>
        </div>
      </div>

      {/* Character(s) Section */}
      {explicitCharacters.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3 border-b border-[#3F3F46]">
          <div>
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Character(s)</div>
            {explicitCharacters.map((charId) => {
              return renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit');
            })}
          </div>
          <div className="border-l border-[#3F3F46] pl-4">
            {explicitCharacters.map((charId) => {
              return renderCharacterImagesOnly(charId, shot.slot);
            })}
          </div>
        </div>
      )}

      {/* Pronoun Mapping Section */}
      {hasPronouns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-[#3F3F46]">
          <div>
            <PronounMappingSection
              pronouns={pronounInfo.pronouns}
              characters={allCharacters.length > 0 ? allCharacters : sceneAnalysisResult.characters}
              selectedCharacters={selectedCharactersForShots[shot.slot] || []}
              pronounMappings={shotMappings}
              onPronounMappingChange={(pronoun, characterIdOrIds) => {
                onPronounMappingChange?.(shot.slot, pronoun, characterIdOrIds);
              }}
              onCharacterSelectionChange={(characterIds) => {
                onCharactersForShotChange?.(shot.slot, characterIds);
              }}
              shotSlot={shot.slot}
              characterHeadshots={characterHeadshots}
              loadingHeadshots={loadingHeadshots}
              selectedCharacterReferences={selectedCharacterReferences}
              characterOutfits={characterOutfits}
              onCharacterReferenceChange={onCharacterReferenceChange}
              onCharacterOutfitChange={onCharacterOutfitChange}
              allCharactersWithOutfits={sceneAnalysisResult?.characters || allCharacters}
            />
          </div>
          <div className="border-l border-[#3F3F46] pl-4 space-y-3">
            {/* Singular Pronoun Characters */}
            {singularPronounCharacters.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-[#3F3F46]">
                {singularPronounCharacters.map((charId) => {
                  const isAlreadyShown = explicitCharacters.includes(charId);
                  const char = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
                             allCharacters.find((c: any) => c.id === charId);
                  
                  const allPronounsForChar = Object.entries(shotMappings)
                    .filter(([_, mappedIdOrIds]) => {
                      if (Array.isArray(mappedIdOrIds)) return mappedIdOrIds.includes(charId);
                      return mappedIdOrIds === charId;
                    })
                    .map(([pronoun]) => `"${pronoun}"`);
                  
                  if (isAlreadyShown) {
                    return (
                      <div key={charId} className="space-y-2">
                        {allPronounsForChar.length > 0 && (
                          <div className="text-[10px] text-[#808080] mb-1">
                            ({allPronounsForChar.join(', ')})
                          </div>
                        )}
                        <div className="text-[10px] text-[#808080] italic border border-[#3F3F46] rounded p-2 bg-[#1A1A1A]">
                          {char?.name || 'Character'} already shown in Character(s) section above
                        </div>
                      </div>
                    );
                  }
                  
                  return renderCharacterImagesOnly(charId, shot.slot, allPronounsForChar);
                })}
              </div>
            )}

            {/* Plural Pronoun Characters */}
            {pluralPronounCharacters.length > 0 && (
              <div className="space-y-2">
                {pluralPronounCharacters.map((charId) => {
                  const isAlreadyShownInExplicit = explicitCharacters.includes(charId);
                  const isAlreadyShownInSingular = singularPronounCharacters.includes(charId);
                  const char = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
                             allCharacters.find((c: any) => c.id === charId);
                  
                  const allPronounsForChar = Object.entries(shotMappings)
                    .filter(([_, mappedIdOrIds]) => {
                      if (Array.isArray(mappedIdOrIds)) return mappedIdOrIds.includes(charId);
                      return mappedIdOrIds === charId;
                    })
                    .map(([pronoun]) => `"${pronoun}"`);
                  
                  if (isAlreadyShownInExplicit || isAlreadyShownInSingular) {
                    return (
                      <div key={charId} className="space-y-2">
                        {allPronounsForChar.length > 0 && (
                          <div className="text-[10px] text-[#808080] mb-1">
                            ({allPronounsForChar.join(', ')})
                          </div>
                        )}
                        <div className="text-[10px] text-[#808080] italic border border-[#3F3F46] rounded p-2 bg-[#1A1A1A]">
                          {char?.name || 'Character'} already shown {isAlreadyShownInExplicit ? 'in Character(s) section above' : 'in Singular Pronoun(s) section above'}
                        </div>
                      </div>
                    );
                  }
                  
                  return renderCharacterImagesOnly(charId, shot.slot, allPronounsForChar);
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

