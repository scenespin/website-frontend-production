/**
 * SceneBuilderContext
 * 
 * Context API for Scene Builder state management.
 * Eliminates props drilling and centralizes all Scene Builder state.
 * 
 * Phase 3: Context API Refactor
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { DialogueWorkflowType } from '@/components/production/UnifiedDialogueDropdown';
import { SceneAnalysisResult } from '@/types/screenplay';
import { useCharacterReferences } from '@/components/production/hooks/useCharacterReferences';
import { filterValidCharacterIds } from '@/components/production/utils/characterIdValidation';
import { getCharactersFromActionShot } from '@/components/production/utils/sceneBuilderUtils';

// ============================================================================
// Types
// ============================================================================

export interface CharacterReference {
  poseId?: string;
  s3Key?: string;
  imageUrl?: string;
}

export interface LocationReference {
  angleId?: string;
  s3Key?: string;
  imageUrl?: string;
}

export interface PropType {
  id: string;
  name: string;
  imageUrl?: string;
  s3Key?: string;
  angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
  images?: Array<{ url: string; s3Key?: string }>;
  baseReference?: { s3Key?: string; imageUrl?: string };
}

export interface ShotPropConfig {
  selectedImageId?: string;
  usageDescription?: string;
}

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

export type ShotDuration = 'quick-cut' | 'extended-take';
export type Resolution = '1080p' | '4k';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ReferenceShotModel = 'nano-banana-pro' | 'flux2-max-4k-16:9';
export type VideoType = 'cinematic-visuals' | 'natural-motion';
export type VideoQuality = 'hd' | '4k';
export type DialogueQuality = 'premium' | 'reliable';
export type WizardStep = 'analysis' | 'shot-config' | 'review';

// ============================================================================
// Context State Interface
// ============================================================================

export interface SceneBuilderState {
  // Scene Analysis
  sceneAnalysisResult: SceneAnalysisResult | null;
  
  // Character State
  selectedCharacterReferences: Record<number, Record<string, CharacterReference>>;
  characterHeadshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots: Record<string, boolean>;
  characterOutfits: Record<number, Record<string, string>>;
  selectedCharactersForShots: Record<number, string[]>;
  pronounMappingsForShots: Record<number, Record<string, string | string[]>>;
  pronounExtrasPrompts: Record<number, Record<string, string>>;
  autoResolvedPronouns: Record<number, Set<string>>;
  
  // Location State
  selectedLocationReferences: Record<number, LocationReference>;
  locationOptOuts: Record<number, boolean>;
  locationDescriptions: Record<number, string>;
  
  // Props State
  sceneProps: PropType[];
  propsToShots: Record<string, number[]>; // propId -> shot slots
  shotProps: Record<number, Record<string, ShotPropConfig>>;
  
  // Dialogue Workflow State
  selectedDialogueQualities: Record<number, DialogueQuality>;
  selectedDialogueWorkflows: Record<number, DialogueWorkflowType>;
  voiceoverBaseWorkflows: Record<number, string>;
  dialogueWorkflowPrompts: Record<number, string>;
  
  // Workflow Override State
  shotWorkflowOverrides: Record<number, string>;
  
  // Shot Configuration State
  shotCameraAngles: Record<number, CameraAngle>;
  shotDurations: Record<number, ShotDuration>;
  shotAspectRatios: Record<number, AspectRatio>;
  selectedReferenceShotModels: Record<number, ReferenceShotModel>;
  selectedVideoTypes: Record<number, VideoType>;
  selectedVideoQualities: Record<number, VideoQuality>;
  
  // Global Settings
  globalResolution: Resolution;
  
  // Navigation State
  wizardStep: WizardStep;
  currentShotIndex: number;
  currentStep: 1 | 2;
  enabledShots: number[];
  
  // Media Library Data (from hooks)
  characterThumbnailS3KeyMap: Map<string, string>;
  characterThumbnailUrlsMap: Map<string, string>;
  characterFullImageUrlsMap: Map<string, string>;
  propThumbnailS3KeyMap: Map<string, string>;
  propThumbnailUrlsMap: Map<string, string>;
  locationThumbnailS3KeyMap: Map<string, string>;
  locationThumbnailUrlsMap: Map<string, string>;
}

// ============================================================================
// Context Actions Interface
// ============================================================================

export interface SceneBuilderActions {
  // Character Actions
  setSelectedCharacterReferences: (references: Record<number, Record<string, CharacterReference>>) => void;
  updateCharacterReference: (shotSlot: number, characterId: string, reference: CharacterReference | undefined) => void;
  setCharacterOutfits: (outfits: Record<number, Record<string, string>>) => void;
  updateCharacterOutfit: (shotSlot: number, characterId: string, outfitName: string | undefined) => void;
  setSelectedCharactersForShots: (characters: Record<number, string[]>) => void;
  updateSelectedCharactersForShot: (shotSlot: number, characterIds: string[]) => void;
  setPronounMappingsForShots: (mappings: Record<number, Record<string, string | string[]>>) => void;
  updatePronounMapping: (shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => void;
  setPronounExtrasPrompts: (prompts: Record<number, Record<string, string>>) => void;
  updatePronounExtrasPrompt: (shotSlot: number, pronoun: string, prompt: string) => void;
  
  // Location Actions
  setSelectedLocationReferences: (references: Record<number, LocationReference>) => void;
  updateLocationReference: (shotSlot: number, locationId: string, reference: LocationReference | undefined) => void;
  setLocationOptOuts: (optOuts: Record<number, boolean>) => void;
  updateLocationOptOut: (shotSlot: number, optOut: boolean) => void;
  setLocationDescriptions: (descriptions: Record<number, string>) => void;
  updateLocationDescription: (shotSlot: number, description: string) => void;
  
  // Props Actions
  setSceneProps: (props: PropType[]) => void;
  setPropsToShots: (propsToShots: Record<string, number[]>) => void;
  updatePropsToShots: (propId: string, shotSlots: number[]) => void;
  setShotProps: (shotProps: Record<number, Record<string, ShotPropConfig>>) => void;
  updateShotProp: (shotSlot: number, propId: string, config: ShotPropConfig) => void;
  updatePropDescription: (shotSlot: number, propId: string, description: string) => void;
  updatePropImage: (shotSlot: number, propId: string, imageId: string | undefined) => void;
  
  // Dialogue Workflow Actions
  setSelectedDialogueQualities: (qualities: Record<number, DialogueQuality>) => void;
  updateDialogueQuality: (shotSlot: number, quality: DialogueQuality) => void;
  setSelectedDialogueWorkflows: (workflows: Record<number, DialogueWorkflowType>) => void;
  updateDialogueWorkflow: (shotSlot: number, workflow: DialogueWorkflowType) => void;
  setVoiceoverBaseWorkflows: (workflows: Record<number, string>) => void;
  updateVoiceoverBaseWorkflow: (shotSlot: number, workflow: string) => void;
  setDialogueWorkflowPrompts: (prompts: Record<number, string>) => void;
  updateDialogueWorkflowPrompt: (shotSlot: number, prompt: string) => void;
  
  // Workflow Override Actions
  setShotWorkflowOverrides: (overrides: Record<number, string>) => void;
  updateShotWorkflowOverride: (shotSlot: number, workflow: string) => void;
  
  // Shot Configuration Actions
  setShotCameraAngles: (angles: Record<number, CameraAngle>) => void;
  updateShotCameraAngle: (shotSlot: number, angle: CameraAngle | undefined) => void;
  setShotDurations: (durations: Record<number, ShotDuration>) => void;
  updateShotDuration: (shotSlot: number, duration: ShotDuration | undefined) => void;
  setShotAspectRatios: (ratios: Record<number, AspectRatio>) => void;
  updateShotAspectRatio: (shotSlot: number, aspectRatio: AspectRatio) => void;
  setSelectedReferenceShotModels: (models: Record<number, ReferenceShotModel>) => void;
  updateReferenceShotModel: (shotSlot: number, model: ReferenceShotModel) => void;
  setSelectedVideoTypes: (types: Record<number, VideoType>) => void;
  updateVideoType: (shotSlot: number, videoType: VideoType) => void;
  setSelectedVideoQualities: (qualities: Record<number, VideoQuality>) => void;
  updateVideoQuality: (shotSlot: number, quality: VideoQuality) => void;
  
  // Global Settings Actions
  setGlobalResolution: (resolution: Resolution) => void;
  
  // Navigation Actions
  setWizardStep: (step: WizardStep) => void;
  setCurrentShotIndex: (index: number) => void;
  setCurrentStep: (step: 1 | 2) => void;
  setEnabledShots: (shots: number[]) => void;
  
  // Scene Analysis Actions
  setSceneAnalysisResult: (result: SceneAnalysisResult | null) => void;
  
  // Media Library Actions (for syncing hook data)
  setCharacterThumbnailS3KeyMap: (map: Map<string, string>) => void;
  setCharacterThumbnailUrlsMap: (map: Map<string, string>) => void;
  setCharacterFullImageUrlsMap: (map: Map<string, string>) => void;
  setPropThumbnailS3KeyMap: (map: Map<string, string>) => void;
  setPropThumbnailUrlsMap: (map: Map<string, string>) => void;
  setLocationThumbnailS3KeyMap: (map: Map<string, string>) => void;
  setLocationThumbnailUrlsMap: (map: Map<string, string>) => void;
  
  // Additional state setters needed for Media Library hooks
  setCharacterHeadshots: (headshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>) => void;
  setLoadingHeadshots: (loading: Record<string, boolean>) => void;
}

// ============================================================================
// Context Interface
// ============================================================================

export interface SceneBuilderContextValue {
  state: SceneBuilderState;
  actions: SceneBuilderActions;
}

// ============================================================================
// Context Creation
// ============================================================================

const SceneBuilderContext = createContext<SceneBuilderContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface SceneBuilderProviderProps {
  children: ReactNode;
  projectId: string;
}

export function SceneBuilderProvider({ children, projectId }: SceneBuilderProviderProps) {
  // Initialize state with defaults
  const [state, setState] = useState<SceneBuilderState>({
    // Scene Analysis
    sceneAnalysisResult: null,
    
    // Character State
    selectedCharacterReferences: {},
    characterHeadshots: {},
    loadingHeadshots: {},
    characterOutfits: {},
    selectedCharactersForShots: {},
    pronounMappingsForShots: {},
    pronounExtrasPrompts: {},
    autoResolvedPronouns: {},
    
    // Location State
    selectedLocationReferences: {},
    locationOptOuts: {},
    locationDescriptions: {},
    
    // Props State
    sceneProps: [],
    propsToShots: {},
    shotProps: {},
    
    // Dialogue Workflow State
    selectedDialogueQualities: {},
    selectedDialogueWorkflows: {},
    voiceoverBaseWorkflows: {},
    dialogueWorkflowPrompts: {},
    
    // Workflow Override State
    shotWorkflowOverrides: {},
    
    // Shot Configuration State
    shotCameraAngles: {},
    shotDurations: {},
    shotAspectRatios: {},
    selectedReferenceShotModels: {},
    selectedVideoTypes: {},
    selectedVideoQualities: {},
    
    // Global Settings
    globalResolution: '4k',
    
    // Navigation State
    wizardStep: 'analysis',
    currentShotIndex: 0,
    currentStep: 1,
    enabledShots: [],
    
    // Media Library Data
    characterThumbnailS3KeyMap: new Map(),
    characterThumbnailUrlsMap: new Map(),
    characterFullImageUrlsMap: new Map(),
    propThumbnailS3KeyMap: new Map(),
    propThumbnailUrlsMap: new Map(),
    locationThumbnailS3KeyMap: new Map(),
    locationThumbnailUrlsMap: new Map()
  });

  // ============================================================================
  // Derive Character IDs for Media Library Query
  // ============================================================================
  
  // Derive character IDs from context state (scene analysis + pronoun selections)
  const characterIdsForMediaLibrary = useMemo(() => {
    const characterIds: string[] = [];
    
    // 1. Get character IDs from scene analysis shots
    if (state.sceneAnalysisResult?.shotBreakdown?.shots) {
      const shots = state.sceneAnalysisResult.shotBreakdown.shots;
      
      // Dialogue shots with characterId
      const dialogueShots = shots.filter((shot: any) => 
        shot.type === 'dialogue' && shot.characterId
      );
      dialogueShots.forEach((shot: any) => {
        if (shot.characterId) characterIds.push(shot.characterId);
      });
      
      // Action shots that mention characters
      const actionShots = shots.filter((shot: any) => shot.type === 'action');
      actionShots.forEach((shot: any) => {
        // Check if shot has characterId (from actionShotHasCharacters detection)
        if (shot.characterId) {
          characterIds.push(shot.characterId);
        }
        // Also check for mentionedCharacterIds (multiple characters)
        if (shot.mentionedCharacterIds && Array.isArray(shot.mentionedCharacterIds)) {
          characterIds.push(...shot.mentionedCharacterIds);
        }
      });
    }
    
    // 2. Get character IDs from pronoun-selected characters
    const pronounSelectedCharacterIds = Object.values(state.selectedCharactersForShots).flat();
    characterIds.push(...pronounSelectedCharacterIds);
    
    // Filter and deduplicate
    const validIds = filterValidCharacterIds(characterIds);
    return [...new Set(validIds)];
  }, [
    state.sceneAnalysisResult?.shotBreakdown?.shots,
    state.selectedCharactersForShots
  ]);
  
  // ============================================================================
  // Media Library Hook (Character References)
  // ============================================================================
  
  // Call hook in provider - updates context directly (no sync needed)
  const {
    characterHeadshots: characterHeadshotsFromHook,
    characterThumbnailS3KeyMap: hookThumbnailS3KeyMap,
    thumbnailUrlsMap: hookThumbnailUrlsMap,
    fullImageUrlsMap: hookFullImageUrlsMap,
    loading: loadingCharacterHeadshots
  } = useCharacterReferences({
    projectId,
    characterIds: characterIdsForMediaLibrary,
    enabled: characterIdsForMediaLibrary.length > 0
  });
  
  // Update context state directly when hook data changes (no sync loop!)
  useEffect(() => {
    if (Object.keys(characterHeadshotsFromHook).length > 0) {
      setState(prev => ({ ...prev, characterHeadshots: characterHeadshotsFromHook }));
    }
  }, [characterHeadshotsFromHook]);
  
  useEffect(() => {
    const loading: Record<string, boolean> = {};
    characterIdsForMediaLibrary.forEach(charId => {
      loading[charId] = loadingCharacterHeadshots;
    });
    setState(prev => ({ ...prev, loadingHeadshots: loading }));
  }, [characterIdsForMediaLibrary, loadingCharacterHeadshots]);
  
  // Update Media Library maps in context
  useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      characterThumbnailS3KeyMap: hookThumbnailS3KeyMap,
      characterThumbnailUrlsMap: hookThumbnailUrlsMap,
      characterFullImageUrlsMap: hookFullImageUrlsMap
    }));
  }, [hookThumbnailS3KeyMap, hookThumbnailUrlsMap, hookFullImageUrlsMap]);

  // ============================================================================
  // Action Creators (using useCallback for performance)
  // ============================================================================

  const actions: SceneBuilderActions = {
    // Character Actions
    setSelectedCharacterReferences: useCallback((references) => {
      setState(prev => ({ ...prev, selectedCharacterReferences: references }));
    }, []),
    
    updateCharacterReference: useCallback((shotSlot, characterId, reference) => {
      setState(prev => ({
        ...prev,
        selectedCharacterReferences: {
          ...prev.selectedCharacterReferences,
          [shotSlot]: {
            ...prev.selectedCharacterReferences[shotSlot],
            [characterId]: reference
          }
        }
      }));
    }, []),
    
    setCharacterOutfits: useCallback((outfits) => {
      setState(prev => ({ ...prev, characterOutfits: outfits }));
    }, []),
    
    updateCharacterOutfit: useCallback((shotSlot, characterId, outfitName) => {
      setState(prev => ({
        ...prev,
        characterOutfits: {
          ...prev.characterOutfits,
          [shotSlot]: {
            ...prev.characterOutfits[shotSlot],
            [characterId]: outfitName
          }
        }
      }));
    }, []),
    
    setSelectedCharactersForShots: useCallback((characters) => {
      setState(prev => ({ ...prev, selectedCharactersForShots: characters }));
    }, []),
    
    updateSelectedCharactersForShot: useCallback((shotSlot, characterIds) => {
      setState(prev => ({
        ...prev,
        selectedCharactersForShots: {
          ...prev.selectedCharactersForShots,
          [shotSlot]: characterIds
        }
      }));
    }, []),
    
    setPronounMappingsForShots: useCallback((mappings) => {
      setState(prev => ({ ...prev, pronounMappingsForShots: mappings }));
    }, []),
    
    updatePronounMapping: useCallback((shotSlot, pronoun, characterId) => {
      setState(prev => ({
        ...prev,
        pronounMappingsForShots: {
          ...prev.pronounMappingsForShots,
          [shotSlot]: {
            ...prev.pronounMappingsForShots[shotSlot],
            [pronoun]: characterId
          }
        }
      }));
    }, []),
    
    setPronounExtrasPrompts: useCallback((prompts) => {
      setState(prev => ({ ...prev, pronounExtrasPrompts: prompts }));
    }, []),
    
    updatePronounExtrasPrompt: useCallback((shotSlot, pronoun, prompt) => {
      setState(prev => ({
        ...prev,
        pronounExtrasPrompts: {
          ...prev.pronounExtrasPrompts,
          [shotSlot]: {
            ...prev.pronounExtrasPrompts[shotSlot],
            [pronoun]: prompt
          }
        }
      }));
    }, []),
    
    // Location Actions
    setSelectedLocationReferences: useCallback((references) => {
      setState(prev => ({ ...prev, selectedLocationReferences: references }));
    }, []),
    
    updateLocationReference: useCallback((shotSlot, locationId, reference) => {
      setState(prev => ({
        ...prev,
        selectedLocationReferences: {
          ...prev.selectedLocationReferences,
          [shotSlot]: reference
        }
      }));
    }, []),
    
    setLocationOptOuts: useCallback((optOuts) => {
      setState(prev => ({ ...prev, locationOptOuts: optOuts }));
    }, []),
    
    updateLocationOptOut: useCallback((shotSlot, optOut) => {
      setState(prev => ({
        ...prev,
        locationOptOuts: {
          ...prev.locationOptOuts,
          [shotSlot]: optOut
        }
      }));
    }, []),
    
    setLocationDescriptions: useCallback((descriptions) => {
      setState(prev => ({ ...prev, locationDescriptions: descriptions }));
    }, []),
    
    updateLocationDescription: useCallback((shotSlot, description) => {
      setState(prev => ({
        ...prev,
        locationDescriptions: {
          ...prev.locationDescriptions,
          [shotSlot]: description
        }
      }));
    }, []),
    
    // Props Actions
    setSceneProps: useCallback((props) => {
      setState(prev => ({ ...prev, sceneProps: props }));
    }, []),
    
    setPropsToShots: useCallback((propsToShots) => {
      setState(prev => ({ ...prev, propsToShots }));
    }, []),
    
    updatePropsToShots: useCallback((propId, shotSlots) => {
      setState(prev => ({
        ...prev,
        propsToShots: {
          ...prev.propsToShots,
          [propId]: shotSlots
        }
      }));
    }, []),
    
    setShotProps: useCallback((shotProps) => {
      setState(prev => ({ ...prev, shotProps }));
    }, []),
    
    updateShotProp: useCallback((shotSlot, propId, config) => {
      setState(prev => ({
        ...prev,
        shotProps: {
          ...prev.shotProps,
          [shotSlot]: {
            ...prev.shotProps[shotSlot],
            [propId]: config
          }
        }
      }));
    }, []),
    
    updatePropDescription: useCallback((shotSlot, propId, description) => {
      setState(prev => ({
        ...prev,
        shotProps: {
          ...prev.shotProps,
          [shotSlot]: {
            ...prev.shotProps[shotSlot],
            [propId]: {
              ...prev.shotProps[shotSlot]?.[propId],
              usageDescription: description
            }
          }
        }
      }));
    }, []),
    
    updatePropImage: useCallback((shotSlot, propId, imageId) => {
      setState(prev => ({
        ...prev,
        shotProps: {
          ...prev.shotProps,
          [shotSlot]: {
            ...prev.shotProps[shotSlot],
            [propId]: {
              ...prev.shotProps[shotSlot]?.[propId],
              selectedImageId: imageId
            }
          }
        }
      }));
    }, []),
    
    // Dialogue Workflow Actions
    setSelectedDialogueQualities: useCallback((qualities) => {
      setState(prev => ({ ...prev, selectedDialogueQualities: qualities }));
    }, []),
    
    updateDialogueQuality: useCallback((shotSlot, quality) => {
      setState(prev => ({
        ...prev,
        selectedDialogueQualities: {
          ...prev.selectedDialogueQualities,
          [shotSlot]: quality
        }
      }));
    }, []),
    
    setSelectedDialogueWorkflows: useCallback((workflows) => {
      setState(prev => ({ ...prev, selectedDialogueWorkflows: workflows }));
    }, []),
    
    updateDialogueWorkflow: useCallback((shotSlot, workflow) => {
      setState(prev => ({
        ...prev,
        selectedDialogueWorkflows: {
          ...prev.selectedDialogueWorkflows,
          [shotSlot]: workflow
        }
      }));
    }, []),
    
    setVoiceoverBaseWorkflows: useCallback((workflows) => {
      setState(prev => ({ ...prev, voiceoverBaseWorkflows: workflows }));
    }, []),
    
    updateVoiceoverBaseWorkflow: useCallback((shotSlot, workflow) => {
      setState(prev => ({
        ...prev,
        voiceoverBaseWorkflows: {
          ...prev.voiceoverBaseWorkflows,
          [shotSlot]: workflow
        }
      }));
    }, []),
    
    setDialogueWorkflowPrompts: useCallback((prompts) => {
      setState(prev => ({ ...prev, dialogueWorkflowPrompts: prompts }));
    }, []),
    
    updateDialogueWorkflowPrompt: useCallback((shotSlot, prompt) => {
      setState(prev => ({
        ...prev,
        dialogueWorkflowPrompts: {
          ...prev.dialogueWorkflowPrompts,
          [shotSlot]: prompt
        }
      }));
    }, []),
    
    // Workflow Override Actions
    setShotWorkflowOverrides: useCallback((overrides) => {
      setState(prev => ({ ...prev, shotWorkflowOverrides: overrides }));
    }, []),
    
    updateShotWorkflowOverride: useCallback((shotSlot, workflow) => {
      setState(prev => ({
        ...prev,
        shotWorkflowOverrides: {
          ...prev.shotWorkflowOverrides,
          [shotSlot]: workflow
        }
      }));
    }, []),
    
    // Shot Configuration Actions
    setShotCameraAngles: useCallback((angles) => {
      setState(prev => ({ ...prev, shotCameraAngles: angles }));
    }, []),
    
    updateShotCameraAngle: useCallback((shotSlot, angle) => {
      if (angle === undefined) {
        setState(prev => {
          const newAngles = { ...prev.shotCameraAngles };
          delete newAngles[shotSlot];
          return { ...prev, shotCameraAngles: newAngles };
        });
      } else {
        setState(prev => ({
          ...prev,
          shotCameraAngles: {
            ...prev.shotCameraAngles,
            [shotSlot]: angle
          }
        }));
      }
    }, []),
    
    setShotDurations: useCallback((durations) => {
      setState(prev => ({ ...prev, shotDurations: durations }));
    }, []),
    
    updateShotDuration: useCallback((shotSlot, duration) => {
      if (duration === undefined) {
        setState(prev => {
          const newDurations = { ...prev.shotDurations };
          delete newDurations[shotSlot];
          return { ...prev, shotDurations: newDurations };
        });
      } else {
        setState(prev => ({
          ...prev,
          shotDurations: {
            ...prev.shotDurations,
            [shotSlot]: duration
          }
        }));
      }
    }, []),
    
    setShotAspectRatios: useCallback((ratios) => {
      setState(prev => ({ ...prev, shotAspectRatios: ratios }));
    }, []),
    
    updateShotAspectRatio: useCallback((shotSlot, aspectRatio) => {
      setState(prev => ({
        ...prev,
        shotAspectRatios: {
          ...prev.shotAspectRatios,
          [shotSlot]: aspectRatio
        }
      }));
    }, []),
    
    setSelectedReferenceShotModels: useCallback((models) => {
      setState(prev => ({ ...prev, selectedReferenceShotModels: models }));
    }, []),
    
    updateReferenceShotModel: useCallback((shotSlot, model) => {
      setState(prev => ({
        ...prev,
        selectedReferenceShotModels: {
          ...prev.selectedReferenceShotModels,
          [shotSlot]: model
        }
      }));
    }, []),
    
    setSelectedVideoTypes: useCallback((types) => {
      setState(prev => ({ ...prev, selectedVideoTypes: types }));
    }, []),
    
    updateVideoType: useCallback((shotSlot, videoType) => {
      setState(prev => ({
        ...prev,
        selectedVideoTypes: {
          ...prev.selectedVideoTypes,
          [shotSlot]: videoType
        }
      }));
    }, []),
    
    setSelectedVideoQualities: useCallback((qualities) => {
      setState(prev => ({ ...prev, selectedVideoQualities: qualities }));
    }, []),
    
    updateVideoQuality: useCallback((shotSlot, quality) => {
      setState(prev => ({
        ...prev,
        selectedVideoQualities: {
          ...prev.selectedVideoQualities,
          [shotSlot]: quality
        }
      }));
    }, []),
    
    // Global Settings Actions
    setGlobalResolution: useCallback((resolution) => {
      setState(prev => ({ ...prev, globalResolution: resolution }));
    }, []),
    
    // Navigation Actions
    setWizardStep: useCallback((step) => {
      setState(prev => ({ ...prev, wizardStep: step }));
    }, []),
    
    setCurrentShotIndex: useCallback((index) => {
      setState(prev => ({ ...prev, currentShotIndex: index }));
    }, []),
    
    setCurrentStep: useCallback((step) => {
      setState(prev => ({ ...prev, currentStep: step }));
    }, []),
    
    setEnabledShots: useCallback((shots) => {
      setState(prev => ({ ...prev, enabledShots: shots }));
    }, []),
    
    // Scene Analysis Actions
    setSceneAnalysisResult: useCallback((result) => {
      setState(prev => ({ ...prev, sceneAnalysisResult: result }));
    }, []),
    
    // Media Library Actions
    setCharacterThumbnailS3KeyMap: useCallback((map) => {
      setState(prev => ({ ...prev, characterThumbnailS3KeyMap: map }));
    }, []),
    
    setCharacterThumbnailUrlsMap: useCallback((map) => {
      setState(prev => ({ ...prev, characterThumbnailUrlsMap: map }));
    }, []),
    
    setCharacterFullImageUrlsMap: useCallback((map) => {
      setState(prev => ({ ...prev, characterFullImageUrlsMap: map }));
    }, []),
    
    setPropThumbnailS3KeyMap: useCallback((map) => {
      setState(prev => ({ ...prev, propThumbnailS3KeyMap: map }));
    }, []),
    
    setPropThumbnailUrlsMap: useCallback((map) => {
      setState(prev => ({ ...prev, propThumbnailUrlsMap: map }));
    }, []),
    
    setLocationThumbnailS3KeyMap: useCallback((map) => {
      setState(prev => ({ ...prev, locationThumbnailS3KeyMap: map }));
    }, []),
    
    setLocationThumbnailUrlsMap: useCallback((map) => {
      setState(prev => ({ ...prev, locationThumbnailUrlsMap: map }));
    }, []),
    
    // Additional state setters needed for Media Library hooks
    setCharacterHeadshots: useCallback((headshots) => {
      setState(prev => ({ ...prev, characterHeadshots: headshots }));
    }, []),
    
    setLoadingHeadshots: useCallback((loading) => {
      setState(prev => ({ ...prev, loadingHeadshots: loading }));
    }, [])
  };

  const value: SceneBuilderContextValue = {
    state,
    actions
  };

  return (
    <SceneBuilderContext.Provider value={value}>
      {children}
    </SceneBuilderContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useSceneBuilder() {
  const context = useContext(SceneBuilderContext);
  if (context === undefined) {
    throw new Error('useSceneBuilder must be used within a SceneBuilderProvider');
  }
  return context;
}

// ============================================================================
// Convenience Hooks (for easier access to specific state/actions)
// ============================================================================

export function useSceneBuilderState() {
  const { state } = useSceneBuilder();
  return state;
}

export function useSceneBuilderActions() {
  const { actions } = useSceneBuilder();
  return actions;
}

