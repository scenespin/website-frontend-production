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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { LocationAngleSelector } from './LocationAngleSelector';
import { PronounMappingSection } from './PronounMappingSection';
import { SceneAnalysisResult } from '@/types/screenplay';
import { findCharacterById, getCharacterSource } from './utils/sceneBuilderUtils';
import { UnifiedDialogueDropdown, DialogueQuality, DialogueWorkflowType } from './UnifiedDialogueDropdown';
import { useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { toast } from 'sonner';
import { getAvailablePropImages } from './utils/propImageUtils';
import { cn } from '@/lib/utils';

// Base Workflow Selector Component (Custom DaisyUI Dropdown)
function BaseWorkflowSelector({ 
  value, 
  workflows, 
  getWorkflowLabel, 
  shotWorkflowOverride,
  onChange 
}: { 
  value: string; 
  workflows: Array<{ value: string; label: string }>; 
  getWorkflowLabel: (workflow: string) => string;
  shotWorkflowOverride?: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel = workflows.find(wf => wf.value === value)?.label || 'Action Line';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="mt-4">
      <label className="block text-xs font-medium text-[#FFFFFF] mb-2">Base Workflow:</label>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="w-full h-9 text-sm px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-md text-[#FFFFFF] flex items-center justify-between hover:bg-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
        >
          <span>{currentLabel} {value === 'action-line' ? '(suggested)' : ''}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <ul
            className="absolute top-full left-0 mt-1 w-full menu p-2 shadow-lg bg-[#1F1F1F] rounded-box border border-[#3F3F46] z-[9999] max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {workflows.map((wf) => (
              <li key={wf.value}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(wf.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm",
                    value === wf.value
                      ? "bg-[#DC143C]/20 text-[#FFFFFF]"
                      : "text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]"
                  )}
                >
                  {wf.label} {wf.value === 'action-line' ? '(suggested)' : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="text-[10px] text-[#808080] mt-1">
        This will generate a {getWorkflowLabel(value)} video and add voiceover audio to it.
      </div>
      {shotWorkflowOverride && (
        <div className="text-[10px] text-[#DC143C] mt-1">
          Override: Using selected workflow instead of auto-detected
        </div>
      )}
    </div>
  );
}

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
  // Dialogue workflow selection (per-shot) - NEW: Unified dropdown
  selectedDialogueQuality?: DialogueQuality; // 'premium' or 'reliable'
  selectedDialogueWorkflow?: DialogueWorkflowType; // Selected workflow for this shot (overrides auto-detection)
  selectedBaseWorkflow?: string; // For voiceover workflows (e.g., 'action-line', 'reality-to-toon')
  onDialogueQualityChange?: (shotSlot: number, quality: DialogueQuality) => void;
  onDialogueWorkflowChange?: (shotSlot: number, workflowType: DialogueWorkflowType) => void;
  onBaseWorkflowChange?: (shotSlot: number, baseWorkflow: string) => void; // For voiceover workflows
  // Dialogue workflow override prompts (for Hidden Mouth Dialogue and Narrate Shot)
  // Note: Backend identifiers are 'off-frame-voiceover' and 'scene-voiceover'
  dialogueWorkflowPrompt?: string; // User-provided description of alternate action
  onDialogueWorkflowPromptChange?: (shotSlot: number, prompt: string) => void;
  // Pronoun extras prompts (for skipped pronouns)
  pronounExtrasPrompts?: Record<string, string>; // { pronoun: prompt text }
  onPronounExtrasPromptChange?: (pronoun: string, prompt: string) => void;
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
  propThumbnailS3KeyMap?: Map<string, string>; // 🔥 NEW: Map of s3Key -> thumbnailS3Key from Media Library
  // Workflow override for action shots
  shotWorkflowOverride?: string; // Override workflow for this shot (for action shots)
  onShotWorkflowOverrideChange?: (shotSlot: number, workflow: string) => void; // Callback for workflow override
  // Feature 0182: Tab structure
  activeTab?: 'basic' | 'advanced'; // Which tab is currently active
  isDialogueShot?: boolean; // Whether this is a dialogue shot (for conditional tab labels)
  // Feature 0182: Continuation (REMOVED - deferred to post-launch)
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
  selectedDialogueQuality,
  selectedDialogueWorkflow,
  selectedBaseWorkflow,
  onDialogueQualityChange,
  onDialogueWorkflowChange,
  onBaseWorkflowChange,
  dialogueWorkflowPrompt,
  onDialogueWorkflowPromptChange,
  pronounExtrasPrompts = {},
  onPronounExtrasPromptChange,
  sceneProps = [],
  propsToShots = {},
  onPropsToShotsChange,
  shotProps = {},
  onPropDescriptionChange,
  onPropImageChange,
  shotWorkflowOverride,
  onShotWorkflowOverrideChange,
  propThumbnailS3KeyMap,
  activeTab = 'basic',
  isDialogueShot = false
}: ShotConfigurationPanelProps) {
  const shouldShowLocation = needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && onLocationAngleChange;

  // Get detected workflow type for dialogue shots
  const detectedWorkflowType = shot.type === 'dialogue' 
    ? sceneAnalysisResult.dialogue?.workflowType 
    : undefined;
  const workflowConfidence = sceneAnalysisResult.dialogue?.workflowTypeConfidence;
  const workflowReasoning = sceneAnalysisResult.dialogue?.workflowTypeReasoning;
  
  // 🔥 NEW: Collect all prop image thumbnail S3 keys from Media Library map
  const propThumbnailS3Keys = React.useMemo(() => {
    if (!propThumbnailS3KeyMap) return [];
    const keys: string[] = [];
    const assignedProps = sceneProps.filter(prop => propsToShots[prop.id]?.includes(shot.slot));
    assignedProps.forEach(prop => {
      const fullProp = prop as typeof prop & {
        angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
        images?: Array<{ url: string; s3Key?: string }>;
      };
      
      // Add angleReferences thumbnail s3Keys from Media Library map
      if (fullProp.angleReferences) {
        fullProp.angleReferences.forEach(ref => {
          if (ref.s3Key && propThumbnailS3KeyMap.has(ref.s3Key)) {
            const thumbnailS3Key = propThumbnailS3KeyMap.get(ref.s3Key);
            if (thumbnailS3Key) {
              keys.push(thumbnailS3Key);
            }
          }
        });
      }
      
      // Add images[] thumbnail s3Keys from Media Library map
      if (fullProp.images) {
        fullProp.images.forEach(img => {
          if (img.s3Key && propThumbnailS3KeyMap.has(img.s3Key)) {
            const thumbnailS3Key = propThumbnailS3KeyMap.get(img.s3Key);
            if (thumbnailS3Key) {
              keys.push(thumbnailS3Key);
            }
          }
        });
      }
    });
    return keys;
  }, [sceneProps, propsToShots, shot.slot, propThumbnailS3KeyMap]);
  
  // 🔥 NEW: Fetch thumbnail URLs for all prop images
  const { data: propThumbnailUrlsMap } = useBulkPresignedUrls(propThumbnailS3Keys, propThumbnailS3Keys.length > 0);
  
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

  // Helper function to get workflow label
  const getWorkflowLabel = (workflow: string) => {
    const labels: Record<string, string> = {
      'action-line': 'Action Line',
      'action-director': 'Action Director',
      'reality-to-toon': 'Reality to Toon',
      'anime-master': 'Anime Master',
      'cartoon-classic': 'Cartoon Classic',
      '3d-character': '3D Character',
      'vfx-elements': 'VFX Elements',
      'fantasy-epic': 'Fantasy Epic',
      'superhero-transform': 'Superhero Transform',
      'animal-kingdom': 'Animal Kingdom',
      'style-chameleon': 'Style Chameleon',
      'broll-master': 'B-Roll Master',
      'complete-scene': 'Complete Scene',
      'hollywood-standard': 'Hollywood Standard'
    };
    return labels[workflow] || workflow;
  };

  // All available workflows for override dropdown (action shots only)
  const ACTION_WORKFLOWS = [
    { 
      value: 'action-line', 
      label: 'Action Line',
      description: 'Standard action shots with realistic motion and natural character movement. Best for everyday scenes, conversations, and straightforward actions.'
    },
    { 
      value: 'action-director', 
      label: 'Action Director',
      description: 'Cinematic action sequences with dynamic camera work and dramatic pacing. Ideal for intense scenes, chase sequences, and high-energy moments.'
    },
    { 
      value: 'reality-to-toon', 
      label: 'Reality to Toon',
      description: 'Transforms realistic scenes into cartoon-style animation. Perfect for comedic moments, animated sequences, or stylized storytelling.'
    },
    { 
      value: 'anime-master', 
      label: 'Anime Master',
      description: 'Japanese anime-style animation with expressive characters and vibrant visuals. Great for dramatic scenes, emotional moments, and stylized action.'
    },
    { 
      value: 'cartoon-classic', 
      label: 'Cartoon Classic',
      description: 'Classic cartoon animation style with exaggerated expressions and movements. Ideal for comedic scenes, children\'s content, and lighthearted moments.'
    },
    { 
      value: '3d-character', 
      label: '3D Character',
      description: 'Three-dimensional character animation with depth and dimension. Best for scenes requiring realistic 3D character movement and interaction.'
    },
    { 
      value: 'vfx-elements', 
      label: 'VFX Elements',
      description: 'Visual effects and special effects integration. Perfect for scenes with magic, sci-fi elements, explosions, or other visual effects.'
    },
    { 
      value: 'fantasy-epic', 
      label: 'Fantasy Epic',
      description: 'Epic fantasy scenes with magical elements, mythical creatures, and grand scale. Ideal for fantasy stories, adventure sequences, and magical moments.'
    },
    { 
      value: 'superhero-transform', 
      label: 'Superhero Transform',
      description: 'Superhero-style transformations and power displays. Great for transformation scenes, power demonstrations, and superhero action.'
    },
    { 
      value: 'animal-kingdom', 
      label: 'Animal Kingdom',
      description: 'Animal-focused scenes with realistic or stylized animal characters. Perfect for nature scenes, animal interactions, and wildlife content.'
    },
    { 
      value: 'style-chameleon', 
      label: 'Style Chameleon',
      description: 'Adaptive style that matches your scene\'s tone and mood. Versatile workflow that adjusts to different scene requirements.'
    },
    { 
      value: 'broll-master', 
      label: 'B-Roll Master',
      description: 'B-roll and establishing shots with smooth camera movement. Ideal for location shots, transitions, and scene-setting footage.'
    },
    { 
      value: 'complete-scene', 
      label: 'Complete Scene',
      description: 'Comprehensive scene generation with full context and detail. Best for complex scenes requiring multiple elements and interactions.'
    },
    { 
      value: 'hollywood-standard', 
      label: 'Hollywood Standard',
      description: 'Professional Hollywood-style production with cinematic quality and polished visuals. Perfect for high-production-value scenes and dramatic storytelling.'
    }
  ];

  // Feature 0182: Conditional rendering based on active tab
  // For dialogue shots: Basic = LIP SYNC, Advanced = NON-LIP SYNC
  // For action shots: Basic = standard config, Advanced = workflow override + continuation
  
  // Determine what to show in each tab
  const showBasicContent = activeTab === 'basic';
  const showAdvancedContent = activeTab === 'advanced';
  
  // For dialogue shots: Basic tab shows lip sync workflow, Advanced shows non-lip sync options
  const isDialogueBasicTab = isDialogueShot && showBasicContent;
  const isDialogueAdvancedTab = isDialogueShot && showAdvancedContent;
  
  // For action shots: Single screen (no tabs), always show basic content
  const isActionShot = !isDialogueShot;
  

  return (
    <div className="mt-3 space-y-4">
      {/* Standard configuration - Always show for action shots, show in Basic tab for dialogue shots */}
      {(!isDialogueShot || isDialogueBasicTab) && (
        <>
      {/* 🔥 REORDERED: Character(s) Section - First */}
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

      {/* 🔥 REORDERED: Which Character? Section - Second (Pronoun Mappings) */}
      {hasPronouns && (
        <div className="pt-3 border-t border-[#3F3F46]">
          <div className="mb-3">
            <div className="text-xs font-medium text-[#FFFFFF] mb-1">Which Character?</div>
            <div className="text-[10px] text-[#808080]">
              Select which character each word in the script refers to.
            </div>
          </div>
          {/* Show message for Narrate Shot (scene-voiceover) about adding characters */}
          {currentWorkflow === 'scene-voiceover' && (
            <div className="mb-3 p-2 bg-[#3F3F46]/30 border border-[#808080]/30 rounded text-[10px] text-[#808080]">
              Select which characters will appear in the scene. The narrator can also appear in the scene if selected.
            </div>
          )}
          {/* Single Character Section */}
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
                  Single Character
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
                              characters={getCharacterSource(allCharacters, sceneAnalysisResult)}
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
                              hideSectionLabels={true}
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
                                  This character is mapped to: {characterToPronouns.get(char.id)!.map(p => `"${p}"`).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                          {char && alreadyRendered && (
                            <div className="mt-3">
                              <div className="text-[10px] text-[#808080] italic p-2 bg-[#0A0A0A] border border-[#3F3F46] rounded">
                                Character "{char.name}" images shown above (mapped to: {characterToPronouns.get(char.id)!.map(p => `"${p}"`).join(', ')})
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

          {/* Multiple Characters Section */}
          {pronounInfo.pronouns.filter((p: string) => ['they', 'them', 'their', 'theirs'].includes(p.toLowerCase())).length > 0 && (() => {
            // Track which characters have been rendered (including explicit and single character mappings)
            const renderedCharacters = new Set<string>();
            // Add explicit characters
            explicitCharacters.forEach(charId => renderedCharacters.add(charId));
            // Add single character mappings
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
                Multiple Characters
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
                            characters={getCharacterSource(allCharacters, sceneAnalysisResult)}
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
                            hideSectionLabels={true}
                            pronounExtrasPrompts={pronounExtrasPrompts}
                            onPronounExtrasPromptChange={onPronounExtrasPromptChange}
                          />
                        </div>
                        {/* Images - only show if characters are mapped */}
                        {mappedCharacterIds.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {mappedCharacterIds.map((charId: string) => {
                              const char = findCharacterById(charId, allCharacters, sceneAnalysisResult);
                              if (!char) return null;
                              const alreadyRendered = renderedCharacters.has(char.id);
                              if (!alreadyRendered) {
                                renderedCharacters.add(char.id);
                              }
                              return (
                                <div key={charId}>
                                  {!alreadyRendered && renderCharacterImagesOnly(charId, shot.slot, [`"${pronoun}"`])}
                                  {alreadyRendered && (
                                    <div className="text-[10px] text-[#808080] italic p-2 bg-[#0A0A0A] border border-[#3F3F46] rounded">
                                      Character "{char.name}" images shown above (mapped to: "{pronoun}")
                                    </div>
                                  )}
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

      {/* 🔥 REORDERED: Location Section - Third */}
      {shouldShowLocation && (
        <div className="pb-3 border-b border-[#3F3F46]">
          <div className="text-xs font-medium text-[#FFFFFF] mb-2">Location</div>
          <LocationAngleSelector
            locationId={sceneAnalysisResult.location.id}
            locationName={sceneAnalysisResult.location.name || 'Location'}
            angleVariations={sceneAnalysisResult.location.angleVariations || []}
            backgrounds={sceneAnalysisResult.location.backgrounds || []} // NEW: Pass backgrounds
            baseReference={sceneAnalysisResult.location.baseReference}
            selectedAngle={selectedLocationReferences[shot.slot]} // KEPT for backward compat
            selectedLocationReference={selectedLocationReferences[shot.slot] ? {
              // Convert to unified format if needed
              type: (selectedLocationReferences[shot.slot] as any).type || 'angle',
              angleId: selectedLocationReferences[shot.slot].angleId,
              backgroundId: (selectedLocationReferences[shot.slot] as any).backgroundId,
              s3Key: selectedLocationReferences[shot.slot].s3Key,
              imageUrl: selectedLocationReferences[shot.slot].imageUrl
            } : undefined}
            onAngleChange={(locationId, angle) => {
              // KEPT for backward compat
              onLocationAngleChange?.(shot.slot, locationId, angle);
            }}
            onLocationReferenceChange={(locationId, reference) => {
              // NEW: Unified callback (if available, otherwise falls back to onAngleChange)
              if (onLocationAngleChange) {
                // Convert unified format to angle format for backward compat
                onLocationAngleChange(shot.slot, locationId, reference ? {
                  angleId: reference.angleId,
                  backgroundId: reference.backgroundId as any, // Store backgroundId for future use
                  s3Key: reference.s3Key,
                  imageUrl: reference.imageUrl,
                  type: reference.type as any // Store type for future use
                } as any : undefined);
              }
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

      {/* 🔥 REORDERED: Props Section - Fourth */}
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
                // Type assertion to ensure we have the full prop type with angleReferences, images, and baseReference
                const fullProp = prop as typeof prop & {
                  angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
                  images?: Array<{ url: string; s3Key?: string }>;
                  baseReference?: { s3Key?: string; imageUrl?: string };
                };
                
                return (
                  <div key={prop.id} className="space-y-2 p-3 bg-[#0A0A0A] rounded border border-[#3F3F46]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        {(() => {
                          // 🔥 FIX: Use baseReference as fallback when imageUrl is broken or missing
                          const displayImageUrl = prop.imageUrl || fullProp.baseReference?.imageUrl;
                          return displayImageUrl ? (
                            <img 
                              src={displayImageUrl} 
                              alt={prop.name}
                              className="w-12 h-12 object-cover rounded border border-[#3F3F46]"
                              onError={(e) => {
                                // If main image fails, try baseReference
                                const imgElement = e.target as HTMLImageElement;
                                if (prop.imageUrl && fullProp.baseReference?.imageUrl && imgElement.src !== fullProp.baseReference.imageUrl) {
                                  imgElement.src = fullProp.baseReference.imageUrl;
                                } else {
                                  // Hide broken image
                                  imgElement.style.display = 'none';
                                }
                              }}
                            />
                          ) : null;
                        })()}
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
                      // Use centralized prop image utility
                      const availableImages = getAvailablePropImages(fullProp);
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
                                    {(() => {
                                      // 🔥 NEW: Get thumbnail URL if available, otherwise use full image
                                      // Find the s3Key for this image
                                      const fullPropForImage = prop as typeof prop & {
                                        angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
                                        images?: Array<{ url: string; s3Key?: string }>;
                                        baseReference?: { s3Key?: string; imageUrl?: string };
                                      };
                                      
                                      let imageS3Key: string | null = null;
                                      if (fullPropForImage.angleReferences) {
                                        const ref = fullPropForImage.angleReferences.find(r => r.id === img.id);
                                        if (ref?.s3Key) imageS3Key = ref.s3Key;
                                      }
                                      if (!imageS3Key && fullPropForImage.images) {
                                        const imgData = fullPropForImage.images.find(i => i.url === img.id);
                                        if (imgData?.s3Key) imageS3Key = imgData.s3Key;
                                      }
                                      
                                      // 🔥 NEW: Use Media Library thumbnailS3KeyMap to get thumbnail key
                                      let thumbnailKey: string | null = null;
                                      if (imageS3Key && propThumbnailS3KeyMap?.has(imageS3Key)) {
                                        thumbnailKey = propThumbnailS3KeyMap.get(imageS3Key) || null;
                                      }
                                      
                                      const thumbnailUrl = thumbnailKey && propThumbnailUrlsMap?.get(thumbnailKey);
                                      const displayUrl = thumbnailUrl || img.imageUrl;
                                      
                                      // Get baseReference for fallback
                                      const baseRefImageUrl = fullPropForImage.baseReference?.imageUrl;
                                      
                                      return (
                                        <img
                                          src={displayUrl}
                                          alt={img.label || prop.name}
                                          className="w-full h-full object-cover rounded"
                                          loading="lazy"
                                          onError={(e) => {
                                            // 🔥 FIX: If thumbnail fails, try full image, then baseReference
                                            const imgElement = e.target as HTMLImageElement;
                                            if (thumbnailUrl && displayUrl === thumbnailUrl && img.imageUrl && img.imageUrl !== displayUrl) {
                                              // Try full image first
                                              imgElement.src = img.imageUrl;
                                            } else if (baseRefImageUrl && imgElement.src !== baseRefImageUrl) {
                                              // Then try baseReference
                                              imgElement.src = baseRefImageUrl;
                                            } else {
                                              // Hide broken image if no fallback
                                              imgElement.style.display = 'none';
                                            }
                                          }}
                                        />
                                      );
                                    })()}
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
        </>
      )}

      {/* 🔥 REORDERED: Dialogue Workflow Selection - Fifth (dialogue shots only) */}
      {/* Feature 0182: Show in Basic tab for LIP SYNC OPTIONS (first-frame-lipsync) */}
      {isDialogueBasicTab && shot.type === 'dialogue' && onDialogueWorkflowChange && currentWorkflow === 'first-frame-lipsync' && (
        <div className="space-y-3 pb-3 border-b border-[#3F3F46]">
          <div className="text-xs font-medium text-[#FFFFFF] mb-2">Dialogue Workflow Selection</div>
          <UnifiedDialogueDropdown
            shot={shot}
            selectedQuality={selectedDialogueQuality}
            selectedWorkflow={selectedDialogueWorkflow as DialogueWorkflowType}
            selectedBaseWorkflow={selectedBaseWorkflow}
            characterIds={[
              ...(shot.characterId ? [shot.characterId] : []),
              ...(selectedCharactersForShots[shot.slot] || [])
            ]}
            onQualityChange={(quality) => onDialogueQualityChange?.(shot.slot, quality)}
            onWorkflowChange={(workflow) => onDialogueWorkflowChange(shot.slot, workflow)}
            onBaseWorkflowChange={(baseWorkflow) => onBaseWorkflowChange?.(shot.slot, baseWorkflow)}
            detectedWorkflow={detectedWorkflowType as DialogueWorkflowType}
            workflowConfidence={workflowConfidence}
            workflowReasoning={workflowReasoning}
            showOnlyLipSync={true}
          />
        </div>
      )}

      {/* Feature 0182: NON-LIP SYNC OPTIONS - Show in Advanced tab for dialogue shots */}
      {isDialogueAdvancedTab && shot.type === 'dialogue' && onDialogueWorkflowChange && (
        <div className="space-y-3 pb-3 border-b border-[#3F3F46]">
          <div className="text-xs font-medium text-[#FFFFFF] mb-2">NON-LIP SYNC OPTIONS</div>
          
          {/* Radio buttons for Narrate Shot / Hidden Mouth Dialogue */}
          <div className="space-y-3">
            <div 
              className={`p-3 border rounded cursor-pointer transition-colors ${
                currentWorkflow === 'scene-voiceover' 
                  ? 'border-[#DC143C] bg-[#DC143C]/10' 
                  : 'border-[#3F3F46] hover:border-[#808080]'
              }`}
              onClick={() => onDialogueWorkflowChange(shot.slot, 'scene-voiceover')}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name={`dialogue-workflow-${shot.slot}`}
                  checked={currentWorkflow === 'scene-voiceover'}
                  onChange={() => onDialogueWorkflowChange(shot.slot, 'scene-voiceover')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#FFFFFF] mb-1">Narrate Shot (Scene Voiceover)</div>
                  <div className="text-[10px] text-[#808080]">
                    Create any shot type + add voiceover. The narrator can appear in the scene or just narrate over it.
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-3 border rounded cursor-pointer transition-colors ${
                currentWorkflow === 'off-frame-voiceover' 
                  ? 'border-[#DC143C] bg-[#DC143C]/10' 
                  : 'border-[#3F3F46] hover:border-[#808080]'
              }`}
              onClick={() => onDialogueWorkflowChange(shot.slot, 'off-frame-voiceover')}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name={`dialogue-workflow-${shot.slot}`}
                  checked={currentWorkflow === 'off-frame-voiceover'}
                  onChange={() => onDialogueWorkflowChange(shot.slot, 'off-frame-voiceover')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#FFFFFF] mb-1">Hidden Mouth Dialogue (Off-Frame Voiceover)</div>
                  <div className="text-[10px] text-[#808080]">
                    Character speaking off-screen, back turned, or side profile. Create any shot type + add voiceover.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Base Workflow Dropdown */}
          <BaseWorkflowSelector
            value={selectedBaseWorkflow || 'action-line'}
            workflows={ACTION_WORKFLOWS}
            getWorkflowLabel={getWorkflowLabel}
            shotWorkflowOverride={shotWorkflowOverride}
            onChange={(value) => onBaseWorkflowChange?.(shot.slot, value)}
          />

          {/* Prompt box for Hidden Mouth Dialogue (off-frame-voiceover) and Narrate Shot (scene-voiceover) */}
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
            
            {/* 🔥 NEW: Location Selection for non-lip-sync workflows */}
            {(currentWorkflow === 'off-frame-voiceover' || currentWorkflow === 'scene-voiceover') && sceneAnalysisResult?.location && shouldShowLocation && (
              <div className="mt-4 pb-3 border-b border-[#3F3F46]">
                <div className="text-xs font-medium text-[#FFFFFF] mb-2">Location</div>
                <LocationAngleSelector
                  locationId={sceneAnalysisResult.location.id}
                  locationName={sceneAnalysisResult.location.name || 'Location'}
                  angleVariations={sceneAnalysisResult.location.angleVariations || []}
                  backgrounds={sceneAnalysisResult.location.backgrounds || []}
                  baseReference={sceneAnalysisResult.location.baseReference}
                  selectedAngle={selectedLocationReferences[shot.slot]}
                  selectedLocationReference={selectedLocationReferences[shot.slot] ? {
                    type: (selectedLocationReferences[shot.slot] as any).type || 'angle',
                    angleId: selectedLocationReferences[shot.slot].angleId,
                    backgroundId: (selectedLocationReferences[shot.slot] as any).backgroundId,
                    s3Key: selectedLocationReferences[shot.slot].s3Key,
                    imageUrl: selectedLocationReferences[shot.slot].imageUrl
                  } : undefined}
                  onAngleChange={(locationId, angle) => {
                    onLocationAngleChange?.(shot.slot, locationId, angle);
                  }}
                  onLocationReferenceChange={(locationId, reference) => {
                    if (onLocationAngleChange) {
                      onLocationAngleChange(shot.slot, locationId, reference ? {
                        angleId: reference.angleId,
                        backgroundId: reference.backgroundId as any,
                        s3Key: reference.s3Key,
                        imageUrl: reference.imageUrl,
                        type: reference.type as any
                      } as any : undefined);
                    }
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
                  {getCharacterSource(allCharacters, sceneAnalysisResult).map((char: any) => {
                    const isSelected = selectedCharactersForShots[shot.slot]?.includes(char.id) || false;
                    return (
                      <div key={char.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            if (!onCharactersForShotChange) return;
                            const current = selectedCharactersForShots[shot.slot] || [];
                            const updated = e.target.checked
                              ? [...current, char.id]
                              : current.filter((id: string) => id !== char.id);
                            onCharactersForShotChange(shot.slot, updated);
                          }}
                          onClick={(e) => e.stopPropagation()} // Also prevent click bubbling
                          className="w-3.5 h-3.5 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                          disabled={!onCharactersForShotChange} // Disable if handler not available
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
                      const char = findCharacterById(charId, allCharacters, sceneAnalysisResult);
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
                      const char = findCharacterById(charId, allCharacters, sceneAnalysisResult);
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
      )}


    </div>
  );
}

