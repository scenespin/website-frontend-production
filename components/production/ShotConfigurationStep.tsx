'use client';

/**
 * ShotConfigurationStep - Individual shot configuration step in wizard
 * 
 * Shows one shot at a time with all configuration options
 * Navigation: Previous/Next buttons, progress indicator
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Film, Check, ChevronDown } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { ShotConfigurationPanel } from './ShotConfigurationPanel';
import { ShotNavigatorList } from './ShotNavigatorList';
import { categorizeCharacters } from './utils/characterCategorization';
import { getCharactersFromActionShot, findCharacterById, getCharacterName, getCharacterSource } from './utils/sceneBuilderUtils';
import { toast } from 'sonner';
import { SceneBuilderService } from '@/services/SceneBuilderService';
import { useAuth } from '@clerk/nextjs';
import { ReferencePreview } from './ReferencePreview';
import { ReferenceShotSelector } from './ReferenceShotSelector';
import { VideoGenerationSelector } from './VideoGenerationSelector';
import { DialogueWorkflowType } from './UnifiedDialogueDropdown';
import { getAvailablePropImages, getSelectedPropImageUrl } from './utils/propImageUtils';
import { useSceneBuilderState, useSceneBuilderActions } from '@/contexts/SceneBuilderContext';
import { cn } from '@/lib/utils';

// Aspect Ratio Selector Component (Custom DaisyUI Dropdown)
function AspectRatioSelector({ value, onChange }: { value: string; onChange: (value: '16:9' | '9:16' | '1:1') => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const aspectRatios = useMemo(() => [
    { value: '16:9' as const, label: '16:9 (Horizontal)' },
    { value: '9:16' as const, label: '9:16 (Vertical)' },
    { value: '1:1' as const, label: '1:1 (Square)' }
  ], []);

  const currentLabel = aspectRatios.find(ar => ar.value === value)?.label || '16:9 (Horizontal)';

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
    <div className="mt-3 pt-3 border-t border-[#3F3F46]">
      <label className="text-xs font-medium text-[#FFFFFF] mb-2 block">
        Aspect Ratio
      </label>
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
          <span>{currentLabel}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
        {isOpen && (
          <ul
            className="absolute top-full left-0 mt-1 w-full menu p-2 shadow-lg bg-[#1F1F1F] rounded-box border border-[#3F3F46] z-[9999] max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {aspectRatios.map((ar) => (
              <li key={ar.value}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(ar.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm",
                    value === ar.value
                      ? "bg-[#DC143C]/20 text-[#FFFFFF]"
                      : "text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]"
                  )}
                >
                  {ar.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ShotConfigurationStepProps {
  shot: any;
  sceneAnalysisResult: SceneAnalysisResult;
  shotIndex: number;
  totalShots: number;
  // Character categorization
  explicitCharacters: string[];
  singularPronounCharacters: string[];
  pluralPronounCharacters: string[];
  shotMappings: Record<string, string | string[]>;
  hasPronouns: boolean;
  pronounInfo: { hasPronouns: boolean; pronouns: string[] };
  // Character rendering helpers
  renderCharacterControlsOnly: (charId: string, shotSlot: number, shotMappings: Record<string, string | string[]>, hasPronouns: boolean, category: 'explicit' | 'singular' | 'plural') => React.ReactNode;
  renderCharacterImagesOnly: (charId: string, shotSlot: number, pronounsForChar?: string[]) => React.ReactNode;
  // Location
  selectedLocationReferences: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  onLocationAngleChange?: (shotSlot: number, locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  isLocationAngleRequired: (shot: any) => boolean;
  needsLocationAngle: (shot: any) => boolean;
  locationOptOuts?: Record<number, boolean>;
  onLocationOptOutChange?: (shotSlot: number, optOut: boolean) => void;
  locationDescriptions?: Record<number, string>;
  onLocationDescriptionChange?: (shotSlot: number, description: string) => void;
  // Character data
  allCharacters: any[];
  selectedCharactersForShots: Record<number, string[]>;
  onCharactersForShotChange?: (shotSlot: number, characterIds: string[]) => void;
  onPronounMappingChange?: (shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => void;
  characterHeadshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots: Record<string, boolean>;
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>;
  characterOutfits: Record<number, Record<string, string>>;
  onCharacterReferenceChange: (shotSlot: number, characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  onCharacterOutfitChange: (shotSlot: number, characterId: string, outfitName: string | undefined) => void;
  // Dialogue workflows - NEW: Unified dropdown
  selectedDialogueQuality?: 'premium' | 'reliable';
  selectedDialogueWorkflow?: DialogueWorkflowType;
  selectedBaseWorkflow?: string; // For voiceover workflows
  onDialogueQualityChange?: (shotSlot: number, quality: 'premium' | 'reliable') => void;
  onDialogueWorkflowChange?: (shotSlot: number, workflowType: DialogueWorkflowType) => void;
  onBaseWorkflowChange?: (shotSlot: number, baseWorkflow: string) => void; // For voiceover workflows
  dialogueWorkflowPrompt?: string;
  onDialogueWorkflowPromptChange?: (shotSlot: number, prompt: string) => void;
  // Pronoun extras
  pronounExtrasPrompts?: Record<string, string>;
  onPronounExtrasPromptChange?: (pronoun: string, prompt: string) => void;
  // Camera Angle (moved to Video Generation section)
  shotCameraAngle?: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
  onCameraAngleChange?: (shotSlot: number, angle: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto' | undefined) => void;
  // Shot Duration (moved to Video Generation section)
  shotDuration?: 'quick-cut' | 'extended-take';
  onDurationChange?: (shotSlot: number, duration: 'quick-cut' | 'extended-take' | undefined) => void;
  // Props
  sceneProps?: Array<{ 
    id: string; 
    name: string; 
    imageUrl?: string; 
    s3Key?: string;
    angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
    images?: Array<{ url: string; s3Key?: string }>;
  }>;
  propsToShots?: Record<string, number[]>;
  onPropsToShotsChange?: (propsToShots: Record<string, number[]>) => void;
  shotProps?: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  onPropDescriptionChange?: (shotSlot: number, propId: string, description: string) => void;
  onPropImageChange?: (shotSlot: number, propId: string, imageId: string | undefined) => void;
  propThumbnailS3KeyMap?: Map<string, string>; // 🔥 NEW: Map of s3Key -> thumbnailS3Key from Media Library
  // Workflow override for action shots
  shotWorkflowOverride?: string;
  onShotWorkflowOverrideChange?: (shotSlot: number, workflow: string) => void;
  // Feature 0182: Continuation (REMOVED - deferred to post-launch)
  // Reference Shot (First Frame) Model Selection
  selectedReferenceShotModel?: Record<number, 'nano-banana-pro' | 'flux2-max-4k-16:9'>;
  onReferenceShotModelChange?: (shotSlot: number, model: 'nano-banana-pro' | 'flux2-max-4k-16:9') => void;
  // Video Generation Selection
  selectedVideoType?: Record<number, 'cinematic-visuals' | 'natural-motion'>;
  selectedVideoQuality?: Record<number, 'hd' | '4k'>;
  onVideoTypeChange?: (shotSlot: number, videoType: 'cinematic-visuals' | 'natural-motion') => void;
  onVideoQualityChange?: (shotSlot: number, quality: 'hd' | '4k') => void;
  // Aspect Ratio (per-shot)
  shotAspectRatio?: '16:9' | '9:16' | '1:1';
  onAspectRatioChange?: (shotSlot: number, aspectRatio: '16:9' | '9:16' | '1:1') => void;
  // Navigation
  onPrevious: () => void;
  onNext: () => void;
  // Shot navigation (for ShotNavigatorList)
  onShotSelect?: (shotSlot: number) => void;
  enabledShots?: number[];
  completedShots?: Set<number>; // Shots that are completely filled out
  isMobile?: boolean;
}

export function ShotConfigurationStep({
  shot,
  sceneAnalysisResult,
  shotIndex,
  totalShots,
  explicitCharacters,
  singularPronounCharacters,
  pluralPronounCharacters,
  shotMappings,
  hasPronouns,
  pronounInfo,
  renderCharacterControlsOnly,
  renderCharacterImagesOnly,
  selectedLocationReferences,
  onLocationAngleChange,
  isLocationAngleRequired,
  needsLocationAngle,
  locationOptOuts = {},
  onLocationOptOutChange,
  locationDescriptions = {},
  onLocationDescriptionChange,
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
  shotCameraAngle,
  onCameraAngleChange,
  shotDuration,
  onDurationChange,
  sceneProps = [],
  propsToShots = {},
  onPropsToShotsChange,
  shotProps = {},
  onPropDescriptionChange,
  onPropImageChange,
  shotWorkflowOverride,
  onShotWorkflowOverrideChange,
  propThumbnailS3KeyMap,
  selectedReferenceShotModel = {},
  onReferenceShotModelChange,
  selectedVideoType = {},
  selectedVideoQuality = {},
  onVideoTypeChange,
  onVideoQualityChange,
  shotAspectRatio,
  onAspectRatioChange,
  onPrevious,
  onNext,
  onShotSelect,
  enabledShots = [],
  completedShots = new Set(),
  isMobile = false
}: ShotConfigurationStepProps) {
  const { getToken } = useAuth();
  
  // Get state and actions from context (context is source of truth)
  const state = useSceneBuilderState();
  const actions = useSceneBuilderActions();
  
  // Extract all state from context (context is source of truth)
  const shotSlot = shot.slot;
  const selectedReferenceShotModels = state.selectedReferenceShotModels;
  const selectedVideoTypes = state.selectedVideoTypes;
  const selectedVideoQualities = state.selectedVideoQualities;
  
  // Use context values (context is source of truth, props are for backward compatibility)
  // Override props with context values
  const finalSelectedLocationReferences = state.selectedLocationReferences;
  const finalLocationOptOuts = state.locationOptOuts;
  const finalLocationDescriptions = state.locationDescriptions;
  const finalSelectedCharactersForShots = state.selectedCharactersForShots;
  const finalCharacterHeadshots = state.characterHeadshots;
  const finalLoadingHeadshots = state.loadingHeadshots;
  const finalSelectedCharacterReferences = state.selectedCharacterReferences;
  const finalCharacterOutfits = state.characterOutfits;
  const finalSceneProps = state.sceneProps;
  const finalPropsToShots = state.propsToShots;
  const finalShotProps = state.shotProps;
  const finalPropThumbnailS3KeyMap = state.propThumbnailS3KeyMap;
  const shotPronounExtrasPrompts = (state.pronounExtrasPrompts[shotSlot] || {});
  const finalSelectedDialogueQuality = state.selectedDialogueQualities[shotSlot];
  const finalSelectedDialogueWorkflow = state.selectedDialogueWorkflows[shotSlot];
  const finalDialogueWorkflowPrompt = state.dialogueWorkflowPrompts[shotSlot];
  const finalShotWorkflowOverride = state.shotWorkflowOverrides[shotSlot];
  
  // Create handlers that use context actions
  const finalOnLocationAngleChange = useCallback((shotSlot: number, locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => {
    actions.updateLocationReference(shotSlot, locationId, angle);
  }, [actions]);
  
  const finalOnLocationOptOutChange = useCallback((shotSlot: number, optOut: boolean) => {
    actions.updateLocationOptOut(shotSlot, optOut);
  }, [actions]);
  
  const finalOnLocationDescriptionChange = useCallback((shotSlot: number, description: string) => {
    actions.updateLocationDescription(shotSlot, description);
  }, [actions]);
  
  const finalOnCharactersForShotChange = useCallback((shotSlot: number, characterIds: string[]) => {
    actions.updateSelectedCharactersForShot(shotSlot, characterIds);
  }, [actions]);
  
  const finalOnPronounMappingChange = useCallback((shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => {
    actions.updatePronounMapping(shotSlot, pronoun, characterId);
  }, [actions]);
  
  const finalOnCharacterReferenceChange = useCallback((shotSlot: number, characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => {
    actions.updateCharacterReference(shotSlot, characterId, reference);
  }, [actions]);
  
  const finalOnCharacterOutfitChange = useCallback((shotSlot: number, characterId: string, outfitName: string | undefined) => {
    actions.updateCharacterOutfit(shotSlot, characterId, outfitName);
  }, [actions]);
  
  const finalOnDialogueQualityChange = useCallback((shotSlot: number, quality: 'premium' | 'reliable') => {
    actions.updateDialogueQuality(shotSlot, quality);
  }, [actions]);
  
  const finalOnDialogueWorkflowChange = useCallback((shotSlot: number, workflowType: DialogueWorkflowType) => {
    actions.updateDialogueWorkflow(shotSlot, workflowType);
  }, [actions]);
  
  const finalOnBaseWorkflowChange = useCallback((shotSlot: number, baseWorkflow: string) => {
    actions.updateVoiceoverBaseWorkflow(shotSlot, baseWorkflow);
  }, [actions]);
  
  const finalOnDialogueWorkflowPromptChange = useCallback((shotSlot: number, prompt: string) => {
    actions.updateDialogueWorkflowPrompt(shotSlot, prompt);
  }, [actions]);
  
  const finalOnPronounExtrasPromptChange = useCallback((pronoun: string, prompt: string) => {
    actions.updatePronounExtrasPrompt(shotSlot, pronoun, prompt);
  }, [actions, shotSlot]);
  
  const finalOnCameraAngleChange = useCallback((shotSlot: number, angle: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto' | undefined) => {
    actions.updateShotCameraAngle(shotSlot, angle);
  }, [actions]);
  
  const finalOnDurationChange = useCallback((shotSlot: number, duration: 'quick-cut' | 'extended-take' | undefined) => {
    actions.updateShotDuration(shotSlot, duration);
  }, [actions]);
  
  const finalOnPropsToShotsChange = useCallback((propsToShots: Record<string, number[]>) => {
    actions.setPropsToShots(propsToShots);
  }, [actions]);
  
  const finalOnPropDescriptionChange = useCallback((shotSlot: number, propId: string, description: string) => {
    actions.updatePropDescription(shotSlot, propId, description);
  }, [actions]);
  
  const finalOnPropImageChange = useCallback((shotSlot: number, propId: string, imageId: string | undefined) => {
    actions.updatePropImage(shotSlot, propId, imageId);
  }, [actions]);
  
  const finalOnShotWorkflowOverrideChange = useCallback((shotSlot: number, workflow: string) => {
    actions.updateShotWorkflowOverride(shotSlot, workflow);
  }, [actions]);
  
  const finalOnReferenceShotModelChange = useCallback((shotSlot: number, model: 'nano-banana-pro' | 'flux2-max-4k-16:9') => {
    actions.updateReferenceShotModel(shotSlot, model);
  }, [actions]);
  
  const finalOnVideoTypeChange = useCallback((shotSlot: number, videoType: 'cinematic-visuals' | 'natural-motion') => {
    actions.updateVideoType(shotSlot, videoType);
  }, [actions]);
  
  const finalOnVideoQualityChange = useCallback((shotSlot: number, quality: 'hd' | '4k') => {
    actions.updateVideoQuality(shotSlot, quality);
  }, [actions]);
  
  const finalOnAspectRatioChange = useCallback((shotSlot: number, aspectRatio: '16:9' | '9:16' | '1:1') => {
    actions.updateShotAspectRatio(shotSlot, aspectRatio);
  }, [actions]);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pricing, setPricing] = useState<{ hdPrice: number; k4Price: number; firstFramePrice: number } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  
  // Determine if this is a dialogue shot (only dialogue shots have tabs)
  const isDialogueShot = shot.type === 'dialogue';
  
  // Helper function to scroll to top of the scroll container
  const scrollToTop = useCallback(() => {
    const scrollContainer = document.querySelector('.h-full.overflow-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);
  
  // Fetch pricing from backend (server-side margin calculation)
  useEffect(() => {
    const fetchPricing = async () => {
      if (!shot?.credits) return;
      
      setIsLoadingPricing(true);
      try {
        const referenceShotModel = selectedReferenceShotModels[shot.slot];
        const videoType = selectedVideoTypes[shot.slot];
        const pricingResult = await SceneBuilderService.calculatePricing(
          [{ slot: shot.slot, credits: shot.credits }],
          shotDuration ? { [shot.slot]: shotDuration } : undefined,
          getToken,
          referenceShotModel ? { [shot.slot]: referenceShotModel } : undefined,
          videoType ? { [shot.slot]: videoType } : undefined
        );
        
        const shotPricing = pricingResult.shots.find(s => s.shotSlot === shot.slot);
        if (shotPricing) {
          setPricing({ 
            hdPrice: shotPricing.hdPrice, 
            k4Price: shotPricing.k4Price,
            firstFramePrice: shotPricing.firstFramePrice
          });
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback: don't show pricing if fetch fails
        setPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    
    fetchPricing();
  }, [shot?.slot, shot?.credits, shotDuration, selectedReferenceShotModels, selectedVideoTypes, selectedVideoQualities, getToken, shot.slot]);

  // Validate shot completion before allowing next
  const handleNext = () => {
    const validationErrors: string[] = [];
    
    // 1. Validate location requirement
    if (isLocationAngleRequired(shot) && needsLocationAngle(shot)) {
      const hasLocation = finalSelectedLocationReferences[shot.slot] !== undefined;
      const hasOptOut = finalLocationOptOuts[shot.slot] === true;
      
      if (!hasLocation && !hasOptOut) {
        validationErrors.push('Location image required. Please select a location image or check "Don\'t use location image" to continue.');
      }
      
      // If opted out, location description is required
      if (hasOptOut && (!finalLocationDescriptions || !finalLocationDescriptions[shot.slot] || finalLocationDescriptions[shot.slot].trim() === '')) {
        validationErrors.push('Location description is required when "Don\'t use location image" is checked.');
      }
    }
    
    // 2. Validate character headshots (required - no checkbox override)
    // Collect all character IDs for this shot
    const shotCharacterIds = new Set<string>();
    
    // Add explicit characters from dialogue
    if (shot.type === 'dialogue' && shot.dialogueBlock?.character) {
      const dialogueChar = getCharacterSource(allCharacters, sceneAnalysisResult)
        .find((c: any) => c.name?.toUpperCase().trim() === shot.dialogueBlock.character?.toUpperCase().trim());
      if (dialogueChar) shotCharacterIds.add(dialogueChar.id);
    }
    
    // Add explicit characters from action shots
    if (shot.type === 'action' && shot.characterId) {
      shotCharacterIds.add(shot.characterId);
    }
    
    // Add explicit characters from action shots (detected from text)
    if (shot.type === 'action') {
      const actionChars = getCharactersFromActionShot(shot, sceneAnalysisResult);
      actionChars.forEach((char: any) => shotCharacterIds.add(char.id));
    }
    
    // Add characters from pronoun mappings (but not skipped ones)
    // shotMappings is already a prop that contains mappings for this shot
    for (const [pronoun, mapping] of Object.entries(shotMappings || {})) {
      if (mapping && mapping !== '__ignore__') {
        if (Array.isArray(mapping)) {
          mapping.forEach(charId => shotCharacterIds.add(charId));
        } else {
          shotCharacterIds.add(mapping);
        }
      }
    }
    
    // Add additional characters for dialogue workflows
    const additionalChars = finalSelectedCharactersForShots[shot.slot] || [];
    additionalChars.forEach(charId => shotCharacterIds.add(charId));
    
    // Check each character has headshots and image selection
    for (const charId of shotCharacterIds) {
      if (!charId || charId === '__ignore__') continue;
      
      const headshots = finalCharacterHeadshots[charId] || [];
      const hasSelectedReference = finalSelectedCharacterReferences[shot.slot]?.[charId] !== undefined;
      
      // If headshots are displayed, a selection is required
      if (headshots.length > 0 && !hasSelectedReference) {
        const charName = getCharacterName(charId, allCharacters, sceneAnalysisResult);
        validationErrors.push(
          `${charName} requires a character image selection. Please select an image from the options displayed above.`
        );
      }
      
      // If no headshots available and no reference selected, require adding headshots
      if (headshots.length === 0 && !hasSelectedReference) {
        const charName = getCharacterName(charId, allCharacters, sceneAnalysisResult);
        validationErrors.push(
          `${charName} requires a character image. Please add headshots in the Character Bank (Production Hub) or Creation Hub, or upload images.`
        );
      }
    }
    
    // 3. Validate ALL pronouns are mapped (singular and plural)
    // Each pronoun must either be:
    //   a) Mapped to a character (valid character ID or array of IDs)
    //   b) Skipped with a description (__ignore__ + description in pronounExtrasPrompts)
    if (pronounInfo.hasPronouns && pronounInfo.pronouns.length > 0) {
      const unmappedPronouns: string[] = [];
      
      for (const pronoun of pronounInfo.pronouns) {
        const pronounLower = pronoun.toLowerCase();
        const mapping = shotMappings[pronounLower];
        
        // Check if pronoun is mapped to a character
        const isMappedToCharacter = mapping && 
          mapping !== '__ignore__' && 
          (Array.isArray(mapping) ? mapping.length > 0 : true);
        
        // Check if pronoun is skipped with description
        const isSkippedWithDescription = mapping === '__ignore__' && 
          shotPronounExtrasPrompts[pronounLower] && 
          shotPronounExtrasPrompts[pronounLower].trim() !== '';
        
        // Pronoun must be either mapped OR skipped with description
        if (!isMappedToCharacter && !isSkippedWithDescription) {
          unmappedPronouns.push(pronoun);
        }
      }
      
      if (unmappedPronouns.length > 0) {
        if (unmappedPronouns.length === 1) {
          validationErrors.push(
            `Pronoun "${unmappedPronouns[0]}" must be mapped to a character, or if skipped, a description is required.`
          );
        } else {
          validationErrors.push(
            `Pronouns "${unmappedPronouns.join('", "')}" must be mapped to characters, or if skipped, descriptions are required.`
          );
        }
      }
    }
    
    // Show validation errors if any
    if (validationErrors.length > 0) {
      toast.error('Please complete all required fields', {
        description: validationErrors.join(' '),
        duration: 8000
      });
      return;
    }
    
    // Scroll to top immediately
    scrollToTop();
    
    // Add transition animation
    setIsTransitioning(true);
    setTimeout(() => {
      onNext();
      setIsTransitioning(false);
      // Ensure scroll to top after navigation completes
      setTimeout(() => scrollToTop(), 50);
    }, 800); // 0.8 second transition
  };

  const handlePrevious = () => {
    // Scroll to top immediately
    scrollToTop();
    
    setIsTransitioning(true);
    setTimeout(() => {
      onPrevious();
      setIsTransitioning(false);
      // Ensure scroll to top after navigation completes
      setTimeout(() => scrollToTop(), 50);
    }, 800);
  };

  const shots = sceneAnalysisResult.shotBreakdown?.shots || [];
  const enabledShotsList = shots.filter(s => enabledShots.includes(s.slot));

  return (
    <div className={isMobile ? "space-y-4" : "grid grid-cols-3 gap-4 items-start"}>
      {/* Shot Navigator (Left side: 1/3 width on desktop, top on mobile) */}
      {onShotSelect && (
        <div className={isMobile ? "w-full" : "sticky top-4 flex flex-col"}>
          <label className="text-xs font-medium mb-2 block text-[#808080]">
            Select Shot
          </label>
          <ShotNavigatorList
            shots={enabledShotsList}
            currentShotSlot={shot.slot}
            onShotSelect={(shotSlot) => {
              // Only allow navigation if shot is navigable (will be checked in navigator)
              // Scroll to top immediately
              scrollToTop();
              // Trigger fade transition when clicking shot
              setIsTransitioning(true);
              setTimeout(() => {
                onShotSelect(shotSlot);
                setIsTransitioning(false);
                // Ensure scroll to top after transition
                setTimeout(() => scrollToTop(), 50);
              }, 800);
            }}
            isMobile={isMobile}
            completedShots={completedShots}
            enabledShots={enabledShots}
          />
        </div>
      )}
      
      {/* Shot Configuration (Right side: 2/3 width on desktop, bottom on mobile) */}
      <div className={isMobile ? "w-full" : "col-span-2"}>
        <div className={`space-y-4 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <Card className="bg-[#141414] border-[#3F3F46]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
                <Film className="w-4 h-4" />
                Shot {shot.slot} Configuration
              </CardTitle>
              <CardDescription className="text-[10px] text-[#808080] mt-1">
                {shot.type === 'dialogue' ? 'Dialogue' : 'Action'} Shot • Step {shotIndex + 1} of {totalShots}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                shot.type === 'dialogue'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-green-500 text-green-400'
              }`}
            >
              {shot.type === 'dialogue' ? 'Dialogue' : 'Action'}
            </Badge>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: totalShots }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded ${
                  idx < shotIndex
                    ? 'bg-green-500'
                    : idx === shotIndex
                    ? 'bg-[#DC143C]'
                    : 'bg-[#3F3F46]'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {/* Shot Description - Full text, no truncation */}
          <div className="pb-3 border-b border-[#3F3F46]">
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Shot Description</div>
            <div className="text-xs text-[#808080] break-words whitespace-pre-wrap">
              {shot.narrationBlock?.text || shot.dialogueBlock?.dialogue || shot.description || 'No description'}
            </div>
          </div>

          {/* Conditional rendering: Tabs for dialogue shots, single screen for action shots */}
          {isDialogueShot ? (
            /* Dialogue shots: Show tabs (LIP SYNC OPTIONS / NON-LIP SYNC OPTIONS) */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1F1F1F] border border-[#3F3F46]">
                <TabsTrigger value="basic" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white">
                  LIP SYNC OPTIONS
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white">
                  NON-LIP SYNC OPTIONS
                </TabsTrigger>
              </TabsList>
              
              {/* LIP SYNC OPTIONS Tab */}
              <TabsContent value="basic" className="mt-4">
                <ShotConfigurationPanel
                  activeTab="basic"
                  isDialogueShot={isDialogueShot}
                  shot={shot}
                  sceneAnalysisResult={sceneAnalysisResult}
                  shotMappings={shotMappings}
                  hasPronouns={hasPronouns}
                  explicitCharacters={explicitCharacters}
                  singularPronounCharacters={singularPronounCharacters}
                  pluralPronounCharacters={pluralPronounCharacters}
                  selectedLocationReferences={finalSelectedLocationReferences}
                  onLocationAngleChange={finalOnLocationAngleChange}
                  isLocationAngleRequired={isLocationAngleRequired}
                  needsLocationAngle={needsLocationAngle}
                  locationOptOuts={finalLocationOptOuts}
                  onLocationOptOutChange={finalOnLocationOptOutChange}
                  locationDescriptions={finalLocationDescriptions}
                  onLocationDescriptionChange={finalOnLocationDescriptionChange}
                  renderCharacterControlsOnly={renderCharacterControlsOnly}
                  renderCharacterImagesOnly={renderCharacterImagesOnly}
                  pronounInfo={pronounInfo}
                  allCharacters={allCharacters}
                  selectedCharactersForShots={finalSelectedCharactersForShots}
                  onCharactersForShotChange={finalOnCharactersForShotChange}
                  onPronounMappingChange={finalOnPronounMappingChange}
                  characterHeadshots={finalCharacterHeadshots}
                  loadingHeadshots={finalLoadingHeadshots}
                  selectedCharacterReferences={finalSelectedCharacterReferences}
                  characterOutfits={finalCharacterOutfits}
                  onCharacterReferenceChange={finalOnCharacterReferenceChange}
                  onCharacterOutfitChange={finalOnCharacterOutfitChange}
                  selectedDialogueQuality={selectedDialogueQuality}
                  selectedDialogueWorkflow={selectedDialogueWorkflow}
                  onDialogueQualityChange={finalOnDialogueQualityChange}
                  onDialogueWorkflowChange={finalOnDialogueWorkflowChange}
                  dialogueWorkflowPrompt={dialogueWorkflowPrompt}
                  onDialogueWorkflowPromptChange={finalOnDialogueWorkflowPromptChange}
                  pronounExtrasPrompts={shotPronounExtrasPrompts}
                  onPronounExtrasPromptChange={finalOnPronounExtrasPromptChange}
                  sceneProps={finalSceneProps}
                  propsToShots={finalPropsToShots}
                  onPropsToShotsChange={finalOnPropsToShotsChange}
                  shotProps={finalShotProps}
                  onPropDescriptionChange={finalOnPropDescriptionChange}
                  onPropImageChange={finalOnPropImageChange}
                  shotWorkflowOverride={shotWorkflowOverride}
                  onShotWorkflowOverrideChange={finalOnShotWorkflowOverrideChange}
                  propThumbnailS3KeyMap={finalPropThumbnailS3KeyMap}
                />
              </TabsContent>

              {/* NON-LIP SYNC OPTIONS Tab */}
              <TabsContent value="advanced" className="mt-4">
                <ShotConfigurationPanel
                  activeTab="advanced"
                  isDialogueShot={isDialogueShot}
                  shot={shot}
                  sceneAnalysisResult={sceneAnalysisResult}
                  shotMappings={shotMappings}
                  hasPronouns={hasPronouns}
                  explicitCharacters={explicitCharacters}
                  singularPronounCharacters={singularPronounCharacters}
                  pluralPronounCharacters={pluralPronounCharacters}
                  selectedLocationReferences={finalSelectedLocationReferences}
                  onLocationAngleChange={finalOnLocationAngleChange}
                  isLocationAngleRequired={isLocationAngleRequired}
                  needsLocationAngle={needsLocationAngle}
                  locationOptOuts={finalLocationOptOuts}
                  onLocationOptOutChange={finalOnLocationOptOutChange}
                  locationDescriptions={finalLocationDescriptions}
                  onLocationDescriptionChange={finalOnLocationDescriptionChange}
                  renderCharacterControlsOnly={renderCharacterControlsOnly}
                  renderCharacterImagesOnly={renderCharacterImagesOnly}
                  pronounInfo={pronounInfo}
                  allCharacters={allCharacters}
                  selectedCharactersForShots={finalSelectedCharactersForShots}
                  onCharactersForShotChange={finalOnCharactersForShotChange}
                  onPronounMappingChange={finalOnPronounMappingChange}
                  characterHeadshots={finalCharacterHeadshots}
                  loadingHeadshots={finalLoadingHeadshots}
                  selectedCharacterReferences={finalSelectedCharacterReferences}
                  characterOutfits={finalCharacterOutfits}
                  onCharacterReferenceChange={finalOnCharacterReferenceChange}
                  onCharacterOutfitChange={finalOnCharacterOutfitChange}
                  selectedDialogueQuality={selectedDialogueQuality}
                  selectedDialogueWorkflow={selectedDialogueWorkflow}
                  onDialogueQualityChange={finalOnDialogueQualityChange}
                  onDialogueWorkflowChange={finalOnDialogueWorkflowChange}
                  dialogueWorkflowPrompt={dialogueWorkflowPrompt}
                  onDialogueWorkflowPromptChange={finalOnDialogueWorkflowPromptChange}
                  pronounExtrasPrompts={shotPronounExtrasPrompts}
                  onPronounExtrasPromptChange={finalOnPronounExtrasPromptChange}
                  sceneProps={finalSceneProps}
                  propsToShots={finalPropsToShots}
                  onPropsToShotsChange={finalOnPropsToShotsChange}
                  shotProps={finalShotProps}
                  onPropDescriptionChange={finalOnPropDescriptionChange}
                  onPropImageChange={finalOnPropImageChange}
                  shotWorkflowOverride={shotWorkflowOverride}
                  onShotWorkflowOverrideChange={finalOnShotWorkflowOverrideChange}
                  propThumbnailS3KeyMap={finalPropThumbnailS3KeyMap}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* Action/Establishing shots: Single screen, no tabs */
            <ShotConfigurationPanel
              activeTab="basic"
              isDialogueShot={isDialogueShot}
              shot={shot}
              sceneAnalysisResult={sceneAnalysisResult}
              shotMappings={shotMappings}
              hasPronouns={hasPronouns}
              explicitCharacters={explicitCharacters}
              singularPronounCharacters={singularPronounCharacters}
              pluralPronounCharacters={pluralPronounCharacters}
              selectedLocationReferences={selectedLocationReferences}
              onLocationAngleChange={onLocationAngleChange}
              isLocationAngleRequired={isLocationAngleRequired}
              needsLocationAngle={needsLocationAngle}
              locationOptOuts={locationOptOuts}
              onLocationOptOutChange={onLocationOptOutChange}
              locationDescriptions={locationDescriptions}
              onLocationDescriptionChange={onLocationDescriptionChange}
              renderCharacterControlsOnly={renderCharacterControlsOnly}
              renderCharacterImagesOnly={renderCharacterImagesOnly}
              pronounInfo={pronounInfo}
              allCharacters={allCharacters}
              selectedCharactersForShots={finalSelectedCharactersForShots}
              onCharactersForShotChange={finalOnCharactersForShotChange}
              onPronounMappingChange={finalOnPronounMappingChange}
              characterHeadshots={finalCharacterHeadshots}
              loadingHeadshots={finalLoadingHeadshots}
              selectedCharacterReferences={finalSelectedCharacterReferences}
              characterOutfits={finalCharacterOutfits}
              onCharacterReferenceChange={finalOnCharacterReferenceChange}
              onCharacterOutfitChange={finalOnCharacterOutfitChange}
              selectedDialogueQuality={finalSelectedDialogueQuality}
              selectedDialogueWorkflow={finalSelectedDialogueWorkflow}
              onDialogueQualityChange={finalOnDialogueQualityChange}
              onDialogueWorkflowChange={finalOnDialogueWorkflowChange}
              dialogueWorkflowPrompt={finalDialogueWorkflowPrompt}
              onDialogueWorkflowPromptChange={finalOnDialogueWorkflowPromptChange}
              pronounExtrasPrompts={shotPronounExtrasPrompts}
              onPronounExtrasPromptChange={finalOnPronounExtrasPromptChange}
              sceneProps={finalSceneProps}
              propsToShots={finalPropsToShots}
              onPropsToShotsChange={finalOnPropsToShotsChange}
              shotProps={finalShotProps}
              onPropDescriptionChange={finalOnPropDescriptionChange}
              onPropImageChange={finalOnPropImageChange}
              shotWorkflowOverride={finalShotWorkflowOverride}
              onShotWorkflowOverrideChange={finalOnShotWorkflowOverrideChange}
              propThumbnailS3KeyMap={finalPropThumbnailS3KeyMap}
            />
          )}

          {/* Reference Shot (First Frame) Model Selection */}
          {onReferenceShotModelChange && (
            <>
              <ReferenceShotSelector
                shotSlot={shot.slot}
                selectedModel={selectedReferenceShotModels[shot.slot]}
                onModelChange={finalOnReferenceShotModelChange}
              />
              {/* Reference Preview - Shows what references will be used for this shot (directly under Reference Shot) */}
              {(() => {
                // Collect references for this shot
                const references: Array<{ type: 'character' | 'location' | 'prop' | 'asset' | 'other'; imageUrl?: string; label: string; id: string }> = [];
                
                // Character references - include explicit characters, pronoun-mapped characters, and additional characters
                const allShotCharacters = new Set<string>();
                
                // Add explicit characters
                explicitCharacters.forEach(charId => allShotCharacters.add(charId));
                
                // Add characters from pronoun mappings
                Object.values(shotMappings || {}).forEach(mapping => {
                  if (mapping && mapping !== '__ignore__') {
                    if (Array.isArray(mapping)) {
                      mapping.forEach(charId => allShotCharacters.add(charId));
                    } else {
                      allShotCharacters.add(mapping);
                    }
                  }
                });
                
                // Add additional characters
                (finalSelectedCharactersForShots[shot.slot] || []).forEach(charId => allShotCharacters.add(charId));
                
                // Collect references for all characters
                allShotCharacters.forEach(charId => {
                  const char = allCharacters.find(c => c.id === charId);
                  if (char) {
                    const charRef = finalSelectedCharacterReferences[shot.slot]?.[charId];
                    // 🔥 FIX: Check if we have a reference (even if imageUrl is empty, we might have s3Key)
                    // The imageUrl should be set by the parent component's useEffect that updates with presigned URLs
                    if (charRef && (charRef.imageUrl || charRef.s3Key)) {
                      // Use imageUrl if available, otherwise try to get from characterHeadshots
                      let imageUrl = charRef.imageUrl;
                      if (!imageUrl && charRef.s3Key && finalCharacterHeadshots[charId]) {
                        const headshot = finalCharacterHeadshots[charId].find(h => h.s3Key === charRef.s3Key);
                        if (headshot?.imageUrl) {
                          imageUrl = headshot.imageUrl;
                        }
                      }
                      
                      if (imageUrl) {
                        references.push({
                          type: 'character',
                          imageUrl: imageUrl,
                          label: char.name || `Character ${charId}`,
                          id: `char-${charId}`
                        });
                      }
                    }
                  }
                });
                
                // Location reference
                const locationRef = finalSelectedLocationReferences[shot.slot];
                if (locationRef?.imageUrl) {
                  const location = finalSceneProps.find(loc => loc.id === shot.locationId);
                  references.push({
                    type: 'location',
                    imageUrl: locationRef.imageUrl,
                    label: location?.name || 'Location',
                    id: `loc-${shot.slot}`
                  });
                }
                
                // Prop references
                const shotPropsForThisShot = finalSceneProps.filter(prop => 
                  finalPropsToShots[prop.id]?.includes(shot.slot)
                );
                shotPropsForThisShot.forEach(prop => {
                  const propConfig = finalShotProps[shot.slot]?.[prop.id];
                  
                  // Use centralized prop image utility
                  const propImageUrl = getSelectedPropImageUrl(prop, propConfig?.selectedImageId);
                  
                  // Add to references if we have an image URL
                  if (propImageUrl) {
                    references.push({
                      type: 'prop',
                      imageUrl: propImageUrl,
                      label: prop.name,
                      id: `prop-${prop.id}`
                    });
                  }
                });
                
                return references.length > 0 ? (
                  <ReferencePreview references={references} className="mt-2 mb-3" />
                ) : null;
              })()}
            </>
          )}

          {/* Video Generation Selection */}
          {/* Show for action shots OR dialogue lip-sync shots (basic tab) - ONLY if it's actually a lip-sync workflow */}
          {(() => {
            // 🔥 FIX: Default to 'first-frame-lipsync' if no workflow is selected (basic tab defaults to lip-sync)
            const effectiveWorkflow = finalSelectedDialogueWorkflow || (shot.type === 'dialogue' && activeTab === 'basic' ? 'first-frame-lipsync' : undefined);
            const isLipSyncWorkflow = shot.type === 'dialogue' && (effectiveWorkflow === 'first-frame-lipsync' || effectiveWorkflow === 'extreme-closeup' || effectiveWorkflow === 'extreme-closeup-mouth');
            const shouldShowForDialogue = shot.type === 'dialogue' && isDialogueShot && activeTab === 'basic' && onVideoQualityChange && isLipSyncWorkflow;
            return (onVideoTypeChange && onVideoQualityChange) || shouldShowForDialogue;
          })() && (
            <>
              <VideoGenerationSelector
                shotSlot={shot.slot}
                shotType={shot.type}
                selectedVideoType={selectedVideoTypes[shot.slot]}
                selectedQuality={selectedVideoQualities[shot.slot]}
                onVideoTypeChange={finalOnVideoTypeChange}
                onQualityChange={finalOnVideoQualityChange}
                shotCameraAngle={shotCameraAngle}
                onCameraAngleChange={finalOnCameraAngleChange}
                shotDuration={shotDuration}
                onDurationChange={finalOnDurationChange}
                isLipSyncWorkflow={(() => {
                  // 🔥 FIX: Default to 'first-frame-lipsync' if no workflow is selected (basic tab defaults to lip-sync)
                  const effectiveWorkflow = finalSelectedDialogueWorkflow || (shot.type === 'dialogue' && activeTab === 'basic' ? 'first-frame-lipsync' : undefined);
                  return shot.type === 'dialogue' && (effectiveWorkflow === 'first-frame-lipsync' || effectiveWorkflow === 'extreme-closeup' || effectiveWorkflow === 'extreme-closeup-mouth');
                })()}
              />
              {/* Aspect Ratio Selector */}
              {onAspectRatioChange && (
                <AspectRatioSelector
                  value={shotAspectRatio || '16:9'}
                  onChange={(value) => finalOnAspectRatioChange(shot.slot, value as '16:9' | '9:16' | '1:1')}
                />
              )}
            </>
          )}

          {/* Cost Calculator - Prices from backend (margins hidden) - Moved after Video Generation */}
          {pricing && (
            <div className="pt-3 border-t border-[#3F3F46]">
              <div className="text-xs font-medium text-[#FFFFFF] mb-2">Estimated Cost</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808080]">Reference Shot:</span>
                  <span className="text-[#FFFFFF] font-medium">{pricing.firstFramePrice} credits</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808080]">HD Video:</span>
                  <span className="text-[#FFFFFF] font-medium">{pricing.hdPrice} credits</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808080]">4K Video:</span>
                  <span className="text-[#FFFFFF] font-medium">{pricing.k4Price} credits</span>
                </div>
                <div className="pt-2 border-t border-[#3F3F46]">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#FFFFFF]">HD Total:</span>
                    <span className={selectedVideoQuality[shot.slot] === 'hd' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}>
                      {pricing.firstFramePrice + pricing.hdPrice} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium mt-1">
                    <span className="text-[#FFFFFF]">4K Total:</span>
                    <span className={selectedVideoQuality[shot.slot] === '4k' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}>
                      {pricing.firstFramePrice + pricing.k4Price} credits
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-[#808080] italic mt-1">
                  Final resolution selected on review page
                </div>
              </div>
            </div>
          )}
          {isLoadingPricing && (
            <div className="pt-3 border-t border-[#3F3F46]">
              <div className="text-xs text-[#808080]">Loading pricing...</div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-3 pb-12 border-t border-[#3F3F46]">
            <Button
              onClick={handlePrevious}
              disabled={isTransitioning}
              variant="outline"
              className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {shotIndex === 0 ? 'Back to Analysis' : 'Previous'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={isTransitioning}
              className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white"
            >
              {shotIndex === totalShots - 1 ? 'Review' : 'Next Shot'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}

