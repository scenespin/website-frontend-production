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
  // Dialogue workflow selection (per-shot)
  selectedDialogueWorkflow?: string; // Selected workflow for this shot (overrides auto-detection)
  onDialogueWorkflowChange?: (shotSlot: number, workflowType: string) => void;
  // Dialogue workflow override prompts (for off-frame-voiceover and scene-voiceover)
  dialogueWorkflowPrompt?: string; // User-provided description of alternate action
  onDialogueWorkflowPromptChange?: (shotSlot: number, prompt: string) => void;
  // Pronoun extras prompts (for skipped pronouns)
  pronounExtrasPrompts?: Record<string, string>; // { pronoun: prompt text }
  onPronounExtrasPromptChange?: (pronoun: string, prompt: string) => void;
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
  onCharacterOutfitChange,
  selectedDialogueWorkflow,
  onDialogueWorkflowChange,
  dialogueWorkflowPrompt,
  onDialogueWorkflowPromptChange,
  pronounExtrasPrompts = {},
  onPronounExtrasPromptChange
}: ShotConfigurationPanelProps) {
  const shouldShowLocation = needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && onLocationAngleChange;

  // Get detected workflow type for dialogue shots
  const detectedWorkflowType = shot.type === 'dialogue' 
    ? sceneAnalysisResult.dialogue?.workflowType 
    : undefined;
  const workflowConfidence = sceneAnalysisResult.dialogue?.workflowTypeConfidence;
  const workflowReasoning = sceneAnalysisResult.dialogue?.workflowTypeReasoning;
  
  // Use selected workflow if available, otherwise use detected
  const currentWorkflow = selectedDialogueWorkflow || detectedWorkflowType || 'first-frame-lipsync';
  
  // For dialogue shots, get the speaking character ID
  const speakingCharacterId = shot.type === 'dialogue' ? shot.characterId : undefined;

  return (
    <div className="mt-3 space-y-4">
      {/* Dialogue Workflow Selection - Only for dialogue shots */}
      {shot.type === 'dialogue' && onDialogueWorkflowChange && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-3 border-b border-[#3F3F46]">
          <div>
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Dialogue Workflow</div>
            <select
              value={currentWorkflow}
              onChange={(e) => {
                onDialogueWorkflowChange(shot.slot, e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
            >
              <option value="first-frame-lipsync">Dialogue (Lip Sync)</option>
              <option value="off-frame-voiceover">Off-Frame VoiceOver</option>
              <option value="scene-voiceover">Scene VoiceOver</option>
            </select>
            {detectedWorkflowType && !selectedDialogueWorkflow && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[#808080]">Auto-detected:</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  workflowConfidence === 'high' ? 'bg-green-500/20 text-green-400' :
                  workflowConfidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {workflowConfidence === 'high' ? 'High' : workflowConfidence === 'medium' ? 'Medium' : 'Low'} confidence
                </span>
                {workflowReasoning && (
                  <span className="text-[10px] text-[#808080] italic" title={workflowReasoning}>
                    (ℹ️)
                  </span>
                )}
              </div>
            )}
            {selectedDialogueWorkflow && selectedDialogueWorkflow !== detectedWorkflowType && (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Override: Using selected workflow instead of auto-detected
              </div>
            )}
            {/* Prompt box for off-frame-voiceover and scene-voiceover */}
            {(currentWorkflow === 'off-frame-voiceover' || currentWorkflow === 'scene-voiceover') && onDialogueWorkflowPromptChange && (
              <div className="mt-3">
                <label className="block text-[10px] text-[#808080] mb-1.5">
                  Describe the alternate action in the scene:
                </label>
                <textarea
                  value={dialogueWorkflowPrompt || ''}
                  onChange={(e) => {
                    onDialogueWorkflowPromptChange(shot.slot, e.target.value);
                  }}
                  placeholder={
                    currentWorkflow === 'off-frame-voiceover'
                      ? 'e.g., Character speaking from off-screen, back turned, or side profile...'
                      : 'e.g., Narrator voice describing the scene. The narrator can appear in the scene or just narrate over it...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors resize-none"
                />
                <div className="text-[10px] text-[#808080] italic mt-1">
                  This description will be used to generate the scene with the selected workflow.
                </div>
              </div>
            )}
            
            {/* Additional Characters Section for scene-voiceover - placed below prompt box */}
            {currentWorkflow === 'scene-voiceover' && shot.type === 'dialogue' && onCharactersForShotChange && (
              <div className="mt-4">
                <div className="mb-2 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
                  Add characters that will appear in the scene. The narrator can also appear in the scene if selected.
                </div>
                <div className="text-xs font-medium text-[#FFFFFF] mb-2">Additional Characters</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(allCharacters.length > 0 ? allCharacters : sceneAnalysisResult?.characters || []).map((char: any) => {
                    const isSelected = selectedCharactersForShots[shot.slot]?.includes(char.id) || false;
                    return (
                      <div key={char.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = selectedCharactersForShots[shot.slot] || [];
                            const updated = e.target.checked
                              ? [...current, char.id]
                              : current.filter((id: string) => id !== char.id);
                            onCharactersForShotChange(shot.slot, updated);
                          }}
                          className="w-3.5 h-3.5 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-xs text-[#FFFFFF] flex-1">
                          {char.name}{char.id === speakingCharacterId ? ' (narrator)' : ''}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-[#DC143C]">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedCharactersForShots[shot.slot] && selectedCharactersForShots[shot.slot].length > 0 && (
                  <div className="mt-4 space-y-4">
                    {selectedCharactersForShots[shot.slot].map((charId: string) => {
                      const char = (allCharacters.length > 0 ? allCharacters : sceneAnalysisResult?.characters || []).find((c: any) => c.id === charId);
                      if (!char) return null;
                      return (
                        <div key={charId} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            {renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit')}
                          </div>
                          <div className="lg:border-l lg:border-[#3F3F46] lg:pl-4">
                            {renderCharacterImagesOnly(charId, shot.slot)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border-l border-[#3F3F46] pl-4">
            {/* Right side content can be added here if needed */}
          </div>
        </div>
      )}

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
          {/* Show message for scene-voiceover */}
          {currentWorkflow === 'scene-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Narrator voice will overlay the scene. The narrator (speaking character) is greyed out below. To add the narrator to the scene, select them in the "Additional Characters" section below.
            </div>
          )}
          {currentWorkflow === 'off-frame-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Character will not be visible (speaking off-screen). Character images are still needed for voice generation.
            </div>
          )}
          <div className="space-y-4">
            {explicitCharacters.map((charId) => {
              // Grey out narrator when scene-voiceover is selected (they're the narrator)
              const isNarrator = currentWorkflow === 'scene-voiceover' && charId === speakingCharacterId;
              // Check if narrator is also manually selected (will show normally in that section)
              const isAlsoManuallySelected = isNarrator && selectedCharactersForShots[shot.slot]?.includes(charId);
              return (
                <div key={charId} className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${isNarrator ? 'opacity-50' : ''}`}>
                  <div>
                    {renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit')}
                    {isNarrator && (
                      <div className="mt-2 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
                        Narrator (voice only). {isAlsoManuallySelected ? 'Also selected to appear in scene below.' : 'Select in "Additional Characters" to add to scene.'}
                      </div>
                    )}
                  </div>
                  <div className="lg:border-l lg:border-[#3F3F46] lg:pl-4">
                    {renderCharacterImagesOnly(charId, shot.slot)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pronoun Mapping Section */}
      {hasPronouns && (
        <div className="pt-3 border-t border-[#3F3F46]">
          {/* Show message for scene-voiceover about adding characters */}
          {currentWorkflow === 'scene-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Map pronouns to characters that will appear in the scene. The narrator can also appear in the scene if selected.
            </div>
          )}
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
                            pronounExtrasPrompts={pronounExtrasPrompts}
                            onPronounExtrasPromptChange={onPronounExtrasPromptChange}
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
                            pronounExtrasPrompts={pronounExtrasPrompts}
                            onPronounExtrasPromptChange={onPronounExtrasPromptChange}
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

