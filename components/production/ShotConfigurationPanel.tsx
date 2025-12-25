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
        <div className="pb-3 border-b border-[#3F3F46]">
          <div className="text-xs font-medium text-[#FFFFFF] mb-2">Character(s)</div>
          <div className="space-y-4">
            {explicitCharacters.map((charId) => (
              <div key={charId} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  {renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit')}
                </div>
                <div className="lg:border-l lg:border-[#3F3F46] lg:pl-4">
                  {renderCharacterImagesOnly(charId, shot.slot)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pronoun Mapping Section */}
      {hasPronouns && (
        <div className="pt-3 border-t border-[#3F3F46]">
          {/* Singular Pronouns Section */}
          {pronounInfo.pronouns.filter((p: string) => ['she', 'her', 'hers', 'he', 'him', 'his'].includes(p.toLowerCase())).length > 0 && (
            <div className="space-y-4 pb-3 border-b border-[#3F3F46]">
              <div className="text-[10px] font-medium text-[#808080] uppercase tracking-wide">
                Singular Pronouns
              </div>
              {pronounInfo.pronouns
                .filter((p: string) => ['she', 'her', 'hers', 'he', 'him', 'his'].includes(p.toLowerCase()))
                .map((pronoun: string) => {
                  const pronounLower = pronoun.toLowerCase();
                  const mapping = shotMappings[pronounLower];
                  const mappedCharacterId = Array.isArray(mapping) ? mapping[0] : mapping;
                  const isIgnored = mappedCharacterId === '__ignore__';
                  const char = mappedCharacterId && !isIgnored 
                    ? (sceneAnalysisResult?.characters.find((c: any) => c.id === mappedCharacterId) ||
                       allCharacters.find((c: any) => c.id === mappedCharacterId))
                    : null;
                  
                  return (
                    <div key={pronoun} className="space-y-2">
                      {/* Mobile: Stack controls + photos together. Desktop: side-by-side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <PronounMappingSection
                            pronouns={[pronoun]}
                            characters={allCharacters.length > 0 ? allCharacters : sceneAnalysisResult.characters}
                            selectedCharacters={selectedCharactersForShots[shot.slot] || []}
                            pronounMappings={shotMappings}
                            onPronounMappingChange={(p, characterIdOrIds) => {
                              onPronounMappingChange?.(shot.slot, p, characterIdOrIds);
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
                        {/* Images - only show if character is mapped */}
                        {char && (
                          <div className="lg:border-l lg:border-[#3F3F46] lg:pl-4">
                            {renderCharacterImagesOnly(char.id, shot.slot, [`"${pronoun}"`])}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Plural Pronouns Section */}
          {pronounInfo.pronouns.filter((p: string) => ['they', 'them', 'their', 'theirs'].includes(p.toLowerCase())).length > 0 && (
            <div className="space-y-4">
              <div className="text-[10px] font-medium text-[#808080] uppercase tracking-wide">
                Plural Pronouns
              </div>
              {pronounInfo.pronouns
                .filter((p: string) => ['they', 'them', 'their', 'theirs'].includes(p.toLowerCase()))
                .map((pronoun: string) => {
                  const pronounLower = pronoun.toLowerCase();
                  const mapping = shotMappings[pronounLower];
                  const isIgnored = mapping === '__ignore__';
                  const mappedCharacterIds = isIgnored ? [] : (Array.isArray(mapping) ? mapping : (mapping ? [mapping] : []));
                  
                  return (
                    <div key={pronoun} className="space-y-2">
                      {/* Mobile: Stack controls + photos together. Desktop: side-by-side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <PronounMappingSection
                            pronouns={[pronoun]}
                            characters={allCharacters.length > 0 ? allCharacters : sceneAnalysisResult.characters}
                            selectedCharacters={selectedCharactersForShots[shot.slot] || []}
                            pronounMappings={shotMappings}
                            onPronounMappingChange={(p, characterIdOrIds) => {
                              onPronounMappingChange?.(shot.slot, p, characterIdOrIds);
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
                        {/* Images - show all mapped characters */}
                        {mappedCharacterIds.length > 0 && (
                          <div className="lg:border-l lg:border-[#3F3F46] lg:pl-4 space-y-4">
                            {mappedCharacterIds.map((charId) => (
                              <div key={charId}>
                                {renderCharacterImagesOnly(charId, shot.slot, [`"${pronoun}"`])}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

