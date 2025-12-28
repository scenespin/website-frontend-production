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
import { Check } from 'lucide-react';
import { LocationAngleSelector } from './LocationAngleSelector';
import { PronounMappingSection } from './PronounMappingSection';
import { SceneAnalysisResult } from '@/types/screenplay';

export type ModelStyle = 'cinematic' | 'photorealistic' | 'auto';
export type Resolution = '1080p' | '4k';
export type ShotDuration = 'quick-cut' | 'extended-take'; // 'quick-cut' = ~5s, 'extended-take' = ~10s
export type CameraAngle = 
  | 'close-up'
  | 'medium-shot'
  | 'wide-shot'
  | 'extreme-close-up'
  | 'extreme-wide-shot'
  | 'over-the-shoulder'
  | 'low-angle'
  | 'high-angle'
  | 'dutch-angle'
  | 'auto';

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
  locationOptOuts?: Record<number, boolean>; // Per-shot location opt-out state
  onLocationOptOutChange?: (shotSlot: number, optOut: boolean) => void; // Callback for opt-out changes
  locationDescriptions?: Record<number, string>; // Per-shot location descriptions when opted out
  onLocationDescriptionChange?: (shotSlot: number, description: string) => void; // Callback for description changes
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
  // Dialogue workflow override prompts (for Hidden Mouth Dialogue and Narrate Shot)
  // Note: Backend identifiers are 'off-frame-voiceover' and 'scene-voiceover'
  dialogueWorkflowPrompt?: string; // User-provided description of alternate action
  onDialogueWorkflowPromptChange?: (shotSlot: number, prompt: string) => void;
  // Pronoun extras prompts (for skipped pronouns)
  pronounExtrasPrompts?: Record<string, string>; // { pronoun: prompt text }
  onPronounExtrasPromptChange?: (pronoun: string, prompt: string) => void;
  // Model Style Selector (per-shot override - resolution is global only, set in review)
  globalStyle?: ModelStyle; // Global style (from Step 1)
  shotStyle?: ModelStyle; // Per-shot style override
  onStyleChange?: (shotSlot: number, style: ModelStyle | undefined) => void; // undefined = use global
  // Camera Angle (per-shot)
  shotCameraAngle?: CameraAngle; // Per-shot camera angle (defaults to 'auto')
  onCameraAngleChange?: (shotSlot: number, angle: CameraAngle | undefined) => void; // undefined = use 'auto'
  // Shot Duration (per-shot)
  shotDuration?: ShotDuration; // Per-shot duration (defaults to 'quick-cut' = ~5s)
  onDurationChange?: (shotSlot: number, duration: ShotDuration | undefined) => void; // undefined = use 'quick-cut'
  // Props Configuration (per-shot)
  sceneProps?: Array<{ 
    id: string; 
    name: string; 
    imageUrl?: string; 
    s3Key?: string;
    angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
    images?: Array<{ url: string; s3Key?: string }>;
  }>;
  propsToShots?: Record<string, number[]>; // Which props are assigned to which shots (from Step 1)
  onPropsToShotsChange?: (propsToShots: Record<string, number[]>) => void; // Callback to remove prop from shot
  shotProps?: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>; // Per-shot prop configurations
  onPropDescriptionChange?: (shotSlot: number, propId: string, description: string) => void;
  onPropImageChange?: (shotSlot: number, propId: string, imageId: string | undefined) => void; // Callback for prop image selection
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
  locationOptOuts = {},
  onLocationOptOutChange,
  locationDescriptions = {},
  onLocationDescriptionChange,
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
  onPronounExtrasPromptChange,
  globalStyle = 'auto',
  shotStyle,
  onStyleChange,
  shotCameraAngle,
  onCameraAngleChange,
  shotDuration,
  onDurationChange,
  sceneProps = [],
  propsToShots = {},
  onPropsToShotsChange,
  shotProps = {},
  onPropDescriptionChange,
  onPropImageChange
}: ShotConfigurationPanelProps) {
  const shouldShowLocation = needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && onLocationAngleChange;

  // Get detected workflow type for dialogue shots
  const detectedWorkflowType = shot.type === 'dialogue' 
    ? sceneAnalysisResult.dialogue?.workflowType 
    : undefined;
  const workflowConfidence = sceneAnalysisResult.dialogue?.workflowTypeConfidence;
  const workflowReasoning = sceneAnalysisResult.dialogue?.workflowTypeReasoning;
  
  // Reset character selection when workflow changes away from 'scene-voiceover'
  React.useEffect(() => {
    const currentWorkflow = selectedDialogueWorkflow || detectedWorkflowType || 'first-frame-lipsync';
    if (currentWorkflow !== 'scene-voiceover' && onCharactersForShotChange) {
      const currentSelection = selectedCharactersForShots[shot.slot] || [];
      // Only reset if there are selected characters (to avoid unnecessary updates)
      if (currentSelection.length > 0) {
        onCharactersForShotChange(shot.slot, []);
      }
    }
  }, [selectedDialogueWorkflow, detectedWorkflowType, shot.slot, selectedCharactersForShots, onCharactersForShotChange]);
  
  // Use selected workflow if available, otherwise use detected
  const currentWorkflow = selectedDialogueWorkflow || detectedWorkflowType || 'first-frame-lipsync';
  
  // For dialogue shots, get the speaking character ID
  const speakingCharacterId = shot.type === 'dialogue' ? shot.characterId : undefined;

  return (
    <div className="mt-3 space-y-4">
      {/* Location Section - Always first, before Dialogue Workflow */}
      {shouldShowLocation && (
        <div className="pb-3 border-b border-[#3F3F46]">
          <div className="text-xs font-medium text-[#FFFFFF] mb-2">Location</div>
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
            optOut={locationOptOuts[shot.slot] || false}
            onOptOutChange={(optOut) => {
              onLocationOptOutChange?.(shot.slot, optOut);
            }}
            locationDescription={locationDescriptions[shot.slot] || ''}
            onLocationDescriptionChange={(description) => {
              onLocationDescriptionChange?.(shot.slot, description);
            }}
            splitLayout={false}
          />
        </div>
      )}

      {/* Dialogue Workflow Selection - Only for dialogue shots */}
      {shot.type === 'dialogue' && onDialogueWorkflowChange && (
        <div className="space-y-3 pb-3 border-b border-[#3F3F46]">
          <div>
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Dialogue Workflow</div>
            <select
              value={currentWorkflow}
              onChange={(e) => {
                onDialogueWorkflowChange(shot.slot, e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
            >
              {/* Note: Display labels differ from backend identifiers for better UX
                  Backend identifiers: 'off-frame-voiceover', 'scene-voiceover'
                  Display labels: 'Hidden Mouth Dialogue', 'Narrate Shot' */}
              <option value="first-frame-lipsync">Dialogue (Lip Sync)</option>
              <option value="extreme-closeup">Extreme Close-Up (Face)</option>
              <option value="extreme-closeup-mouth">Extreme Close-Up (Mouth Only)</option>
              <option value="off-frame-voiceover">Hidden Mouth Dialogue</option>
              <option value="scene-voiceover">Narrate Shot</option>
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
            {/* Prompt box for Hidden Mouth Dialogue (off-frame-voiceover) and Narrate Shot (scene-voiceover)
                Note: Using backend identifiers 'off-frame-voiceover' and 'scene-voiceover' for logic */}
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
            
            {/* Additional Characters Section for Hidden Mouth Dialogue (off-frame-voiceover) and Narrate Shot (scene-voiceover) - placed below prompt box */}
            {(currentWorkflow === 'off-frame-voiceover' || currentWorkflow === 'scene-voiceover') && shot.type === 'dialogue' && onCharactersForShotChange && (
              <div className="mt-4">
                <div className="mb-2 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
                  {currentWorkflow === 'scene-voiceover' 
                    ? 'Add characters that will appear in the scene. The narrator can also appear in the scene if selected.'
                    : 'Add characters that will appear in the scene (off-screen or visible).'}
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
                        <div key={charId}>
                          {renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit')}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Character images for selected additional characters - stacked below */}
                {selectedCharactersForShots[shot.slot] && selectedCharactersForShots[shot.slot].length > 0 && (
                  <div className="mt-4 space-y-4">
                    {selectedCharactersForShots[shot.slot].map((charId: string) => {
                      const char = (allCharacters.length > 0 ? allCharacters : sceneAnalysisResult?.characters || []).find((c: any) => c.id === charId);
                      if (!char) return null;
                      return (
                        <div key={charId}>
                          {renderCharacterImagesOnly(charId, shot.slot)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Props Section - Only show props assigned to this shot */}
      {(() => {
        // Get props assigned to this shot
        const assignedProps = sceneProps.filter(prop => 
          propsToShots[prop.id]?.includes(shot.slot)
        );
        
        if (assignedProps.length === 0) return null;
        
        return (
          <div className="pb-3 border-b border-[#3F3F46]">
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Props</div>
            <div className="space-y-3">
              {assignedProps.map((prop) => {
                const propConfig = shotProps[shot.slot]?.[prop.id] || {};
                // Type assertion to ensure we have the full prop type with angleReferences and images
                const fullProp = prop as typeof prop & {
                  angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
                  images?: Array<{ url: string; s3Key?: string }>;
                };
                
                return (
                  <div key={prop.id} className="space-y-2 p-3 bg-[#0A0A0A] rounded border border-[#3F3F46]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        {prop.imageUrl && (
                          <img 
                            src={prop.imageUrl} 
                            alt={prop.name}
                            className="w-12 h-12 object-cover rounded border border-[#3F3F46]"
                          />
                        )}
                        <span className="text-xs font-medium text-[#FFFFFF]">{prop.name}</span>
                      </div>
                      {/* Remove Prop from Shot Checkbox */}
                      {onPropsToShotsChange && (
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[#808080] hover:text-[#FFFFFF] transition-colors">
                          <input
                            type="checkbox"
                            checked={false} // Always unchecked - checking it removes the prop
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Remove this prop from this shot
                                const updatedPropsToShots = { ...propsToShots };
                                if (updatedPropsToShots[prop.id]) {
                                  updatedPropsToShots[prop.id] = updatedPropsToShots[prop.id].filter(slot => slot !== shot.slot);
                                  // If no shots left, remove the prop entirely
                                  if (updatedPropsToShots[prop.id].length === 0) {
                                    delete updatedPropsToShots[prop.id];
                                  }
                                }
                                onPropsToShotsChange(updatedPropsToShots);
                              }
                            }}
                            className="w-3 h-3 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                          />
                          <span>Remove from shot</span>
                        </label>
                      )}
                    </div>
                    
                    {/* Prop Image Selection */}
                    {onPropImageChange && (() => {
                      // Get all available images for this prop (angleReferences first, then images)
                      const availableImages: Array<{ id: string; imageUrl: string; label?: string }> = [];
                      
                      // Add angleReferences (Production Hub images)
                      if (fullProp.angleReferences && fullProp.angleReferences.length > 0) {
                        fullProp.angleReferences.forEach(ref => {
                          availableImages.push({
                            id: ref.id,
                            imageUrl: ref.imageUrl,
                            label: ref.label
                          });
                        });
                      }
                      
                      // Add images[] (Creation images) if no angleReferences
                      if (availableImages.length === 0 && fullProp.images && fullProp.images.length > 0) {
                        fullProp.images.forEach(img => {
                          availableImages.push({
                            id: img.url,
                            imageUrl: img.url,
                            label: undefined
                          });
                        });
                      }
                      
                      // If no images available, use the default imageUrl
                      if (availableImages.length === 0 && prop.imageUrl) {
                        availableImages.push({
                          id: prop.imageUrl,
                          imageUrl: prop.imageUrl,
                          label: 'Default'
                        });
                      }
                      
                      const selectedImageId = propConfig.selectedImageId;
                      
                      // Show image selection if we have any images (even just 1)
                      if (availableImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <label className="block text-[10px] text-[#808080] mb-2">
                              Select prop image for this shot:
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {availableImages.map((img) => {
                                const isSelected = selectedImageId === img.id || (!selectedImageId && img.id === availableImages[0].id);
                                return (
                                  <button
                                    key={img.id}
                                    onClick={() => {
                                      onPropImageChange(shot.slot, prop.id, isSelected ? undefined : img.id);
                                    }}
                                    className={`relative aspect-square rounded border-2 transition-all ${
                                      isSelected
                                        ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                        : 'border-[#3F3F46] hover:border-[#808080]'
                                    }`}
                                    title={img.label || 'Prop image'}
                                  >
                                    <img
                                      src={img.imageUrl}
                                      alt={img.label || prop.name}
                                      className="w-full h-full object-cover rounded"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-[#DC143C]/20">
                                        <Check className="w-3 h-3 text-[#DC143C]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Prop Usage Description */}
                    {onPropDescriptionChange && (
                      <div className="mt-3">
                        <label className="block text-[10px] text-[#808080] mb-1.5">
                          Describe how "{prop.name}" is used in this shot:
                        </label>
                        <textarea
                          value={propConfig.usageDescription || ''}
                          onChange={(e) => {
                            onPropDescriptionChange(shot.slot, prop.id, e.target.value);
                          }}
                          placeholder={`e.g., Character picks up ${prop.name} and examines it...`}
                          rows={2}
                          className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors resize-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Character(s) Section */}
      {explicitCharacters.length > 0 && (() => {
        // Track rendered characters globally across all sections (explicit, singular, plural)
        const allRenderedCharacters = new Set<string>();
        
        // Collect characters from singular pronouns
        pronounInfo.pronouns
          .filter((p: string) => ['she', 'her', 'hers', 'he', 'him', 'his'].includes(p.toLowerCase()))
          .forEach((pronoun: string) => {
            const pronounLower = pronoun.toLowerCase();
            const mapping = shotMappings[pronounLower];
            const mappedCharacterId = Array.isArray(mapping) ? mapping[0] : mapping;
            if (mappedCharacterId && mappedCharacterId !== '__ignore__') {
              allRenderedCharacters.add(mappedCharacterId);
            }
          });
        
        // Collect characters from plural pronouns
        pronounInfo.pronouns
          .filter((p: string) => ['they', 'them', 'their', 'theirs'].includes(p.toLowerCase()))
          .forEach((pronoun: string) => {
            const pronounLower = pronoun.toLowerCase();
            const mapping = shotMappings[pronounLower];
            if (mapping && mapping !== '__ignore__') {
              const mappedCharacterIds = Array.isArray(mapping) ? mapping : [mapping];
              mappedCharacterIds.forEach((charId: string) => {
                if (charId && charId !== '__ignore__') {
                  allRenderedCharacters.add(charId);
                }
              });
            }
          });
        
        return (
        <div className="pb-3 border-b border-[#3F3F46]">
          <div className="text-xs font-medium text-[#FFFFFF] mb-2">Character(s)</div>
          {/* Show message for Narrate Shot (scene-voiceover) */}
          {currentWorkflow === 'scene-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Narrator voice will overlay the scene. The narrator (speaking character) is greyed out below. To add the narrator to the scene, select them in the "Additional Characters" section below.
            </div>
          )}
          {/* Show message for Hidden Mouth Dialogue (off-frame-voiceover) */}
          {currentWorkflow === 'off-frame-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Character will not be visible (speaking off-screen). Character images are still needed for voice generation.
            </div>
          )}
          <div className="space-y-4">
            {explicitCharacters.map((charId) => {
              // Grey out narrator when Narrate Shot (scene-voiceover) is selected (they're the narrator)
              const isNarrator = currentWorkflow === 'scene-voiceover' && charId === speakingCharacterId;
              // Check if narrator is also manually selected (will show normally in that section)
              const isAlsoManuallySelected = isNarrator && selectedCharactersForShots[shot.slot]?.includes(charId);
              // Check if this character is already rendered in pronoun sections
              const alreadyRenderedInPronouns = allRenderedCharacters.has(charId);
              return (
                <div key={charId} className={`space-y-3 ${isNarrator ? 'opacity-50' : ''}`}>
                  {renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit')}
                  {isNarrator && (
                    <div className="p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
                      Narrator (voice only). {isAlsoManuallySelected ? 'Also selected to appear in scene below.' : 'Select in "Additional Characters" to add to scene.'}
                    </div>
                  )}
                  {/* Always show images in Character(s) section, even if also mapped to pronoun */}
                  {renderCharacterImagesOnly(charId, shot.slot)}
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* Pronoun Mapping Section */}
      {hasPronouns && (
        <div className="pt-3 border-t border-[#3F3F46]">
          {/* Show message for Narrate Shot (scene-voiceover) about adding characters */}
          {currentWorkflow === 'scene-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Map pronouns to characters that will appear in the scene. The narrator can also appear in the scene if selected.
            </div>
          )}
          {/* Singular Pronouns Section */}
          {pronounInfo.pronouns.filter((p: string) => ['she', 'her', 'hers', 'he', 'him', 'his'].includes(p.toLowerCase())).length > 0 && (() => {
            // Track which characters have been rendered to avoid duplicates (including explicit characters)
            const renderedCharacters = new Set<string>();
            // Add explicit characters to rendered set (they're shown in Character(s) section)
            explicitCharacters.forEach(charId => renderedCharacters.add(charId));
            const characterToPronouns = new Map<string, string[]>();
            
            // First pass: collect all character-to-pronoun mappings
            pronounInfo.pronouns
              .filter((p: string) => ['she', 'her', 'hers', 'he', 'him', 'his'].includes(p.toLowerCase()))
              .forEach((pronoun: string) => {
                const pronounLower = pronoun.toLowerCase();
                const mapping = shotMappings[pronounLower];
                const mappedCharacterId = Array.isArray(mapping) ? mapping[0] : mapping;
                if (mappedCharacterId && mappedCharacterId !== '__ignore__') {
                  if (!characterToPronouns.has(mappedCharacterId)) {
                    characterToPronouns.set(mappedCharacterId, []);
                  }
                  characterToPronouns.get(mappedCharacterId)!.push(pronoun);
                }
              });
            
            return (
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
                    
                    // Check if this character has already been rendered
                    const alreadyRendered = char && renderedCharacters.has(char.id);
                    if (char && !alreadyRendered) {
                      renderedCharacters.add(char.id);
                    }
                    
                    return (
                      <div key={pronoun} className="space-y-2">
                        {/* Stacked layout: controls + photos vertically */}
                        <div className="space-y-3">
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
                          {/* Images - only show if character is mapped and not already rendered */}
                          {char && !alreadyRendered && (
                            <div className="mt-3">
                              {renderCharacterImagesOnly(char.id, shot.slot, characterToPronouns.get(char.id)?.map(p => `"${p}"`) || [`"${pronoun}"`])}
                              {characterToPronouns.get(char.id)!.length > 1 && (
                                <div className="text-[10px] text-[#808080] mt-2 italic">
                                  This character is mapped to multiple pronouns: {characterToPronouns.get(char.id)!.map(p => `"${p}"`).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                          {char && alreadyRendered && (
                            <div className="mt-3">
                              <div className="text-[10px] text-[#808080] italic p-2 bg-[#0A0A0A] border border-[#3F3F46] rounded">
                                Character "{char.name}" images shown above (mapped to {characterToPronouns.get(char.id)!.map(p => `"${p}"`).join(', ')})
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })()}

          {/* Plural Pronouns Section */}
          {pronounInfo.pronouns.filter((p: string) => ['they', 'them', 'their', 'theirs'].includes(p.toLowerCase())).length > 0 && (() => {
            // Track which characters have been rendered (including explicit and singular pronouns)
            const renderedCharacters = new Set<string>();
            // Add explicit characters
            explicitCharacters.forEach(charId => renderedCharacters.add(charId));
            // Add singular pronoun characters
            pronounInfo.pronouns
              .filter((p: string) => ['she', 'her', 'hers', 'he', 'him', 'his'].includes(p.toLowerCase()))
              .forEach((pronoun: string) => {
                const pronounLower = pronoun.toLowerCase();
                const mapping = shotMappings[pronounLower];
                const mappedCharacterId = Array.isArray(mapping) ? mapping[0] : mapping;
                if (mappedCharacterId && mappedCharacterId !== '__ignore__') {
                  renderedCharacters.add(mappedCharacterId);
                }
              });
            
            return (
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
                      {/* Stacked layout: controls + photos vertically */}
                      <div className="space-y-3">
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
                        {/* Images - show all mapped characters - stacked below, but skip if already rendered */}
                        {mappedCharacterIds.length > 0 && (
                          <div className="mt-3 space-y-4">
                            {mappedCharacterIds.map((charId) => {
                              const alreadyRendered = renderedCharacters.has(charId);
                              if (alreadyRendered) {
                                renderedCharacters.add(charId); // Track it anyway
                                return (
                                  <div key={charId} className="text-[10px] text-[#808080] italic p-2 bg-[#0A0A0A] border border-[#3F3F46] rounded">
                                    Character images shown above (already mapped in another section)
                                  </div>
                                );
                              }
                              renderedCharacters.add(charId);
                              return (
                                <div key={charId}>
                                  {renderCharacterImagesOnly(charId, shot.slot, [`"${pronoun}"`])}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            );
          })()}
        </div>
      )}

      {/* Model Style and Camera Angle - Moved to bottom before navigation */}
      <div className="pt-3 border-t border-[#3F3F46] space-y-3">
        {/* Model Style Override Section (Resolution is global only, set in review step) */}
        {onStyleChange && (
          <div>
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Model Style</div>
            <select
              value={shotStyle || globalStyle}
              onChange={(e) => {
                const style = e.target.value as ModelStyle;
                if (style === globalStyle) {
                  onStyleChange?.(shot.slot, undefined); // Remove override
                } else {
                  onStyleChange(shot.slot, style);
                }
              }}
              className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
            >
              <option value={globalStyle}>Using default: {globalStyle}</option>
              <option value="auto">Auto (Content-aware)</option>
              <option value="cinematic">Cinematic</option>
              <option value="photorealistic">Photorealistic</option>
            </select>
            {shotStyle && shotStyle !== globalStyle && (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Override: Using {shotStyle} instead of default ({globalStyle})
              </div>
            )}
          </div>
        )}

        {/* Camera Angle Section */}
        {onCameraAngleChange && (
          <div>
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Camera Angle</div>
            <select
              value={shotCameraAngle || 'auto'}
              onChange={(e) => {
                const angle = e.target.value as CameraAngle;
                if (angle === 'auto') {
                  onCameraAngleChange(shot.slot, undefined); // Remove override
                } else {
                  onCameraAngleChange(shot.slot, angle);
                }
              }}
              className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
            >
              <option value="auto">Auto (Content-aware) - Default</option>
              <option value="close-up">Close-up</option>
              <option value="medium-shot">Medium Shot</option>
              <option value="wide-shot">Wide Shot</option>
              <option value="extreme-close-up">Extreme Close-up</option>
              <option value="extreme-wide-shot">Extreme Wide Shot</option>
              <option value="over-the-shoulder">Over-the-Shoulder</option>
              <option value="low-angle">Low Angle</option>
              <option value="high-angle">High Angle</option>
              <option value="dutch-angle">Dutch Angle</option>
            </select>
            {shotCameraAngle && shotCameraAngle !== 'auto' && (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Override: Using {shotCameraAngle.replace('-', ' ')} instead of auto-detection
              </div>
            )}
            {!shotCameraAngle && (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Using auto-detection (content-aware selection)
              </div>
            )}
          </div>
        )}

        {/* Shot Duration Section - Moved after Camera Angle */}
        {onDurationChange && (
          <div>
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Shot Duration</div>
            <select
              value={shotDuration || 'quick-cut'}
              onChange={(e) => {
                const duration = e.target.value as ShotDuration;
                onDurationChange(shot.slot, duration);
              }}
              className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
            >
              <option value="quick-cut">Quick Cut (~5s)</option>
              <option value="extended-take">Extended Take (~10s)</option>
            </select>
            <div className="text-[10px] text-[#808080] italic mt-1">
              {shotDuration === 'quick-cut' 
                ? 'Quick Cut: 4-5 seconds (default)'
                : 'Extended Take: 8-10 seconds'}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

