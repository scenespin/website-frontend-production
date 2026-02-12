/**
 * SceneBuilderContext
 * 
 * Context API for Scene Builder state management.
 * Eliminates props drilling and centralizes all Scene Builder state.
 * 
 * Phase 3: Context API Refactor
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { DialogueWorkflowType } from '@/components/production/UnifiedDialogueDropdown';
import { SceneAnalysisResult } from '@/types/screenplay';
import type { OffFrameShotType } from '@/types/offFrame';
import { useCharacterReferences, type UseCharacterReferencesReturn } from '@/components/production/hooks/useCharacterReferences';
import type { CharacterHeadshot } from '@/components/production/hooks/useCharacterReferences';
import { filterValidCharacterIds } from '@/components/production/utils/characterIdValidation';
import { getCharactersFromActionShot } from '@/components/production/utils/sceneBuilderUtils';
import { useCharacters } from '@/hooks/useCharacterBank';
import { useBulkPresignedUrls } from '@/hooks/useMediaLibrary';

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
export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9' | '9:21';
export type ReferenceShotModel = 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k';
export type VideoType = 'cinematic-visuals' | 'natural-motion' | 'premium-quality';
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
  /** Narrate Shot: what the narrator says (per-shot). Required for scene-voiceover. */
  narrationOverrides: Record<number, string>;
  /** Narrate Shot: which character is the narrator (per-shot). When unset, speaking character is used. */
  narrationNarratorCharacterId: Record<number, string>;
  // Feature 0209: Off-frame voiceover (Hidden Mouth) – separate namespace; do not clear when switching workflow
  offFrameShotType: Record<number, OffFrameShotType>;
  offFrameListenerCharacterId: Record<number, string | null>;
  offFrameGroupCharacterIds: Record<number, string[]>;
  offFrameSceneContextPrompt: Record<number, string>;
  /** Feature 0218: Additive video prompt for Hidden Mouth (add to default motion prompt). Not an override. */
  offFrameVideoPromptAdditive: Record<number, string>;
  
  // Prompt Override State
  firstFramePromptOverrides: Record<number, string>;
  videoPromptOverrides: Record<number, string>;
  promptOverrideEnabled: Record<number, boolean>; // Legacy: Per-shot checkbox state for prompt override (kept for backward compatibility)
  firstFrameOverrideEnabled: Record<number, boolean>; // 🔥 NEW: Per-shot checkbox state for first frame override
  videoPromptOverrideEnabled: Record<number, boolean>; // 🔥 NEW: Per-shot checkbox state for video prompt override
  
  // Uploaded First Frames State
  uploadedFirstFrames: Record<number, string>; // Per-shot uploaded first frame URLs
  
  // Workflow Override State
  shotWorkflowOverrides: Record<number, string>;
  
  // Shot Configuration State
  shotCameraAngles: Record<number, CameraAngle>;
  shotDurations: Record<number, ShotDuration>;
  shotAspectRatios: Record<number, AspectRatio>;
  selectedReferenceShotModels: Record<number, ReferenceShotModel>;
  selectedVideoTypes: Record<number, VideoType>;
  /** Feature 0233: Per-shot video opt-in. When false/absent, shot is first-frame-only. */
  generateVideoForShot: Record<number, boolean>;
  /** Feature 0234: Additive motion direction for lip-sync dialogue (e.g., "tilts head", "rolls eyes"). */
  motionDirectionPrompt: Record<number, string>;
  
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
  characterDropboxUrlMap: Map<string, string>;
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
  setNarrationOverrides: (overrides: Record<number, string>) => void;
  updateNarrationOverride: (shotSlot: number, text: string) => void;
  setNarrationNarratorCharacterIds: (byShot: Record<number, string>) => void;
  updateNarrationNarratorCharacterId: (shotSlot: number, characterId: string) => void;
  // Feature 0209: Off-frame voiceover (Hidden Mouth) – separate namespace
  setOffFrameShotType: (byShot: Record<number, OffFrameShotType>) => void;
  updateOffFrameShotType: (shotSlot: number, shotType: OffFrameShotType) => void;
  setOffFrameListenerCharacterId: (byShot: Record<number, string | null>) => void;
  updateOffFrameListenerCharacterId: (shotSlot: number, characterId: string | null) => void;
  setOffFrameGroupCharacterIds: (byShot: Record<number, string[]>) => void;
  updateOffFrameGroupCharacterIds: (shotSlot: number, characterIds: string[]) => void;
  setOffFrameSceneContextPrompt: (byShot: Record<number, string>) => void;
  updateOffFrameSceneContextPrompt: (shotSlot: number, prompt: string) => void;
  setOffFrameVideoPromptAdditive: (byShot: Record<number, string>) => void;
  updateOffFrameVideoPromptAdditive: (shotSlot: number, prompt: string) => void;
  
  // Prompt Override Actions
  setFirstFramePromptOverrides: (overrides: Record<number, string>) => void;
  updateFirstFramePromptOverride: (shotSlot: number, prompt: string) => void;
  setVideoPromptOverrides: (overrides: Record<number, string>) => void;
  updateVideoPromptOverride: (shotSlot: number, prompt: string) => void;
  setPromptOverrideEnabled: (enabled: Record<number, boolean>) => void; // Legacy: kept for backward compatibility
  updatePromptOverrideEnabled: (shotSlot: number, enabled: boolean) => void; // Legacy: kept for backward compatibility
  setFirstFrameOverrideEnabled: (enabled: Record<number, boolean>) => void; // 🔥 NEW: Separate first frame override enabled
  updateFirstFrameOverrideEnabled: (shotSlot: number, enabled: boolean) => void; // 🔥 NEW: Separate first frame override enabled
  setVideoPromptOverrideEnabled: (enabled: Record<number, boolean>) => void; // 🔥 NEW: Separate video prompt override enabled
  updateVideoPromptOverrideEnabled: (shotSlot: number, enabled: boolean) => void; // 🔥 NEW: Separate video prompt override enabled
  
  // Uploaded First Frames Actions
  setUploadedFirstFrames: (frames: Record<number, string>) => void;
  updateUploadedFirstFrame: (shotSlot: number, firstFrameUrl: string | null) => void;
  
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
  /** Feature 0233: Per-shot video opt-in. Expand "Add Dialogue Video" sets true. */
  setGenerateVideoForShot: (byShot: Record<number, boolean>) => void;
  updateGenerateVideoForShot: (shotSlot: number, enabled: boolean) => void;
  /** Feature 0234: Additive motion direction for lip-sync dialogue. */
  setMotionDirectionPrompt: (byShot: Record<number, string>) => void;
  updateMotionDirectionPrompt: (shotSlot: number, prompt: string) => void;
  
  // Global Settings Actions
  setGlobalResolution: (resolution: Resolution) => void;
  
  // Navigation Actions
  setWizardStep: (step: WizardStep) => void;
  setCurrentShotIndex: (index: number) => void;
  setCurrentStep: (step: 1 | 2) => void;
  setEnabledShots: (shots: number[]) => void;
  /** Feature 0259: Reset all context state to initial (equivalent to hard refresh after run). */
  resetToInitialState: () => void;

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

/** Returns fresh initial state for Scene Builder. Used for mount and for resetAfterRun (Feature 0259). */
function getInitialSceneBuilderState(): SceneBuilderState {
  return {
    sceneAnalysisResult: null,
    selectedCharacterReferences: {},
    characterHeadshots: {},
    loadingHeadshots: {},
    characterOutfits: {},
    selectedCharactersForShots: {},
    pronounMappingsForShots: {},
    pronounExtrasPrompts: {},
    autoResolvedPronouns: {},
    selectedLocationReferences: {},
    locationOptOuts: {},
    locationDescriptions: {},
    sceneProps: [],
    propsToShots: {},
    shotProps: {},
    selectedDialogueQualities: {},
    selectedDialogueWorkflows: {},
    voiceoverBaseWorkflows: {},
    dialogueWorkflowPrompts: {},
    narrationOverrides: {},
    narrationNarratorCharacterId: {},
    offFrameShotType: {},
    offFrameListenerCharacterId: {},
    offFrameGroupCharacterIds: {},
    offFrameSceneContextPrompt: {},
    offFrameVideoPromptAdditive: {},
    firstFramePromptOverrides: {},
    videoPromptOverrides: {},
    promptOverrideEnabled: {},
    firstFrameOverrideEnabled: {},
    videoPromptOverrideEnabled: {},
    uploadedFirstFrames: {},
    shotWorkflowOverrides: {},
    shotCameraAngles: {},
    shotDurations: {},
    shotAspectRatios: {},
    selectedReferenceShotModels: {},
    selectedVideoTypes: {},
    generateVideoForShot: {},
    motionDirectionPrompt: {},
    globalResolution: '4k',
    wizardStep: 'analysis',
    currentShotIndex: 0,
    currentStep: 1,
    enabledShots: [],
    characterThumbnailS3KeyMap: new Map(),
    characterThumbnailUrlsMap: new Map(),
    characterFullImageUrlsMap: new Map(),
    characterDropboxUrlMap: new Map(),
    propThumbnailS3KeyMap: new Map(),
    propThumbnailUrlsMap: new Map(),
    locationThumbnailS3KeyMap: new Map(),
    locationThumbnailUrlsMap: new Map()
  };
}

export function SceneBuilderProvider({ children, projectId }: SceneBuilderProviderProps) {
  const [state, setState] = useState<SceneBuilderState>(getInitialSceneBuilderState);

  // ============================================================================
  // Derive Character IDs for Media Library Query
  // ============================================================================
  
  // 🔥 CRITICAL FIX: Fetch ALL characters from screenplay to ensure dropdown has images
  // The dropdown uses allCharacters (from screenplay), not just sceneAnalysisResult.characters
  // We need to include ALL screenplay characters in the Media Library query
  const { data: allScreenplayCharacters = [] } = useCharacters(
    projectId,
    'production-hub',
    true // enabled
  );
  
  // Derive character IDs from context state (scene analysis + pronoun selections + ALL screenplay characters)
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
    
    // 3. Include ALL characters from sceneAnalysisResult.characters
    if (state.sceneAnalysisResult?.characters && Array.isArray(state.sceneAnalysisResult.characters)) {
      state.sceneAnalysisResult.characters.forEach((char: any) => {
        if (char?.id) {
          characterIds.push(char.id);
        }
      });
    }
    
    // 🔥 CRITICAL FIX: Include ALL characters from screenplay (this is what dropdown uses)
    // The dropdown uses getCharacterSource(allCharacters, sceneAnalysisResult) which prioritizes allCharacters
    // We MUST include all screenplay characters so dropdown images work
    allScreenplayCharacters.forEach((char: any) => {
      if (char?.id) {
        characterIds.push(char.id);
      }
    });
    
    // Filter and deduplicate
    const validIds = filterValidCharacterIds(characterIds);
    return [...new Set(validIds)];
  }, [
    state.sceneAnalysisResult?.shotBreakdown?.shots,
    state.sceneAnalysisResult?.characters,
    state.selectedCharactersForShots,
    allScreenplayCharacters // 🔥 CRITICAL: Include all screenplay characters
  ]);
  
  // ============================================================================
  // Payload-first character refs (same list as Character Bank), then fallback to ML
  // ============================================================================
  const payloadCharacterS3Keys = useMemo(() => {
    const keys: string[] = [];
    const seen = new Set<string>();
    const idSet = new Set(characterIdsForMediaLibrary);
    allScreenplayCharacters.forEach((char: any) => {
      if (!idSet.has(char.id)) return;
      const refs: Array<{ s3Key?: string }> = [
        ...(char.images || []).map((img: any) => ({ s3Key: img.s3Key || img.metadata?.s3Key })),
        ...(char.poseReferences || char.angleReferences || []),
        ...(char.references || [])
      ];
      if (char.baseReference?.s3Key) refs.push({ s3Key: char.baseReference.s3Key });
      refs.forEach((r: any) => {
        const k = r?.s3Key;
        if (k && !k.startsWith('thumbnails/') && !seen.has(k)) {
          seen.add(k);
          keys.push(k);
        }
      });
    });
    return keys;
  }, [allScreenplayCharacters, characterIdsForMediaLibrary]);

  const { data: characterPayloadUrls = new Map<string, string>() } = useBulkPresignedUrls(
    payloadCharacterS3Keys.length > 0 ? payloadCharacterS3Keys : [],
    characterIdsForMediaLibrary.length > 0 && payloadCharacterS3Keys.length > 0
  );

  const characterHeadshotsFromPayload = useMemo((): Record<string, CharacterHeadshot[]> => {
    const out: Record<string, CharacterHeadshot[]> = {};
    const idSet = new Set(characterIdsForMediaLibrary);
    allScreenplayCharacters.forEach((char: any) => {
      if (!idSet.has(char.id)) return;
      const seen = new Set<string>();
      const headshots: CharacterHeadshot[] = [];
      const add = (s3Key: string, label?: string, outfitName?: string) => {
        if (!s3Key || s3Key.startsWith('thumbnails/') || seen.has(s3Key)) return;
        seen.add(s3Key);
        headshots.push({
          s3Key,
          imageUrl: characterPayloadUrls.get(s3Key) || '',
          label: label || char.name,
          outfitName
        });
      };
      (char.images || []).forEach((img: any) => {
        const k = img.s3Key || img.metadata?.s3Key;
        if (k) add(k, img.metadata?.poseName || img.metadata?.outfitName || char.name, img.metadata?.outfitName);
      });
      (char.poseReferences || char.angleReferences || []).forEach((ref: any) => {
        if (ref?.s3Key) add(ref.s3Key, ref.label || ref.metadata?.poseName || char.name, ref.metadata?.outfitName);
      });
      (char.references || []).forEach((ref: any) => {
        if (ref?.s3Key) add(ref.s3Key, ref.label || char.name, ref.metadata?.outfitName);
      });
      if (char.baseReference?.s3Key) add(char.baseReference.s3Key, `${char.name} - Base`);
      if (headshots.length > 0) out[char.id] = headshots;
    });
    return out;
  }, [allScreenplayCharacters, characterIdsForMediaLibrary, characterPayloadUrls]);

  const usePayloadForCharacters = Object.keys(characterHeadshotsFromPayload).length > 0;

  // Media Library fallback when no payload data
  const {
    characterHeadshots: characterHeadshotsFromHook,
    characterThumbnailS3KeyMap: hookThumbnailS3KeyMap,
    thumbnailUrlsMap: hookThumbnailUrlsMap,
    fullImageUrlsMap: hookFullImageUrlsMap,
    dropboxUrlMap: hookDropboxUrlMap,
    loading: loadingCharacterHeadshots
  }: UseCharacterReferencesReturn = useCharacterReferences({
    projectId,
    characterIds: characterIdsForMediaLibrary,
    enabled: characterIdsForMediaLibrary.length > 0 && !usePayloadForCharacters
  });
  
  // 🔥 FIX: Create stable signatures for Map objects to prevent infinite loops
  const thumbnailS3KeyMapSignature = useMemo(() => {
    if (!hookThumbnailS3KeyMap || hookThumbnailS3KeyMap.size === 0) return '';
    return Array.from(hookThumbnailS3KeyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }, [hookThumbnailS3KeyMap]);
  
  const thumbnailUrlsMapSignature = useMemo(() => {
    if (!hookThumbnailUrlsMap || hookThumbnailUrlsMap.size === 0) return '';
    return Array.from(hookThumbnailUrlsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }, [hookThumbnailUrlsMap]);
  
  const fullImageUrlsMapSignature = useMemo(() => {
    if (!hookFullImageUrlsMap || hookFullImageUrlsMap.size === 0) return '';
    return Array.from(hookFullImageUrlsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }, [hookFullImageUrlsMap]);

  const dropboxUrlMapSignature = useMemo(() => {
    if (!hookDropboxUrlMap || hookDropboxUrlMap.size === 0) return '';
    return Array.from(hookDropboxUrlMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value?.substring(0, 80)}`)
      .join('|');
  }, [hookDropboxUrlMap]);
  
  // Effective headshots: payload-first when available, else ML hook
  const characterHeadshotsEffective = usePayloadForCharacters ? characterHeadshotsFromPayload : characterHeadshotsFromHook;

  const characterHeadshotsSignature = useMemo(() => {
    if (!characterHeadshotsEffective || Object.keys(characterHeadshotsEffective).length === 0) return '';
    return JSON.stringify(
      Object.entries(characterHeadshotsEffective)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([charId, headshots]) => [
          charId,
          headshots.map(h => `${h.s3Key || ''}:${h.imageUrl || ''}`).sort().join(',')
        ])
    );
  }, [characterHeadshotsEffective]);

  const lastHeadshotsSignatureRef = useRef<string>('');
  useEffect(() => {
    if (characterHeadshotsSignature === lastHeadshotsSignatureRef.current) return;
    lastHeadshotsSignatureRef.current = characterHeadshotsSignature;
    if (Object.keys(characterHeadshotsEffective).length > 0) {
      setState(prev => ({ ...prev, characterHeadshots: characterHeadshotsEffective }));
    }
  }, [characterHeadshotsSignature, characterHeadshotsEffective]);

  // 🔥 FIX: Create stable signature for loadingHeadshots to prevent infinite loops
  const loadingHeadshotsSignature = useMemo(() => {
    const loading: Record<string, boolean> = {};
    characterIdsForMediaLibrary.forEach(charId => {
      loading[charId] = loadingCharacterHeadshots;
    });
    return JSON.stringify(Object.entries(loading).sort(([a], [b]) => a.localeCompare(b)));
  }, [characterIdsForMediaLibrary, loadingCharacterHeadshots]);
  
  const lastLoadingHeadshotsSignatureRef = useRef<string>('');
  useEffect(() => {
    const loadingSignature = usePayloadForCharacters ? 'payload-done' : loadingHeadshotsSignature;
    if (loadingSignature === lastLoadingHeadshotsSignatureRef.current) return;
    lastLoadingHeadshotsSignatureRef.current = loadingSignature;
    const loading: Record<string, boolean> = {};
    characterIdsForMediaLibrary.forEach(charId => {
      loading[charId] = usePayloadForCharacters ? false : loadingCharacterHeadshots;
    });
    setState(prev => ({ ...prev, loadingHeadshots: loading }));
  }, [loadingHeadshotsSignature, characterIdsForMediaLibrary, loadingCharacterHeadshots, usePayloadForCharacters]);
  
  const emptyMapRef = useRef(new Map<string, string>());
  const characterThumbnailUrlsMapEffective = usePayloadForCharacters ? characterPayloadUrls : hookThumbnailUrlsMap;
  const characterFullImageUrlsMapEffective = usePayloadForCharacters ? characterPayloadUrls : hookFullImageUrlsMap;
  const characterThumbnailS3KeyMapEffective = usePayloadForCharacters ? emptyMapRef.current : hookThumbnailS3KeyMap;
  const characterDropboxUrlMapEffective = usePayloadForCharacters ? emptyMapRef.current : hookDropboxUrlMap;

  const effectiveMapsSignature = usePayloadForCharacters
    ? `payload|${payloadCharacterS3Keys.length}`
    : `${thumbnailS3KeyMapSignature}|${thumbnailUrlsMapSignature}|${fullImageUrlsMapSignature}|${dropboxUrlMapSignature}`;

  const lastMapsSignatureRef = useRef<string>('');
  useEffect(() => {
    if (effectiveMapsSignature === lastMapsSignatureRef.current) return;
    lastMapsSignatureRef.current = effectiveMapsSignature;
    setState(prev => ({
      ...prev,
      characterThumbnailS3KeyMap: characterThumbnailS3KeyMapEffective,
      characterThumbnailUrlsMap: characterThumbnailUrlsMapEffective,
      characterFullImageUrlsMap: characterFullImageUrlsMapEffective,
      characterDropboxUrlMap: characterDropboxUrlMapEffective
    }));
  }, [effectiveMapsSignature, characterThumbnailS3KeyMapEffective, characterThumbnailUrlsMapEffective, characterFullImageUrlsMapEffective, characterDropboxUrlMapEffective]);

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
      console.log('[SceneBuilderContext] setSceneProps called with:', {
        count: props.length,
        props: props.map((p: any) => ({
          id: p.id,
          name: p.name,
          angleReferencesCount: (p.angleReferences || []).length,
          imagesCount: (p.images || []).length,
          angleReferences: p.angleReferences || [],
          images: p.images || [],
          baseReference: p.baseReference,
          hasBaseReference: !!p.baseReference,
          fullProp: p // Include full prop for inspection
        }))
      });
      setState(prev => {
        const newState = { ...prev, sceneProps: props };
        console.log('[SceneBuilderContext] setSceneProps state update:', {
          prevCount: prev.sceneProps.length,
          newCount: newState.sceneProps.length,
          newProps: newState.sceneProps.map((p: any) => ({
            id: p.id,
            name: p.name,
            angleReferencesCount: (p.angleReferences || []).length,
            imagesCount: (p.images || []).length,
            angleReferences: p.angleReferences || [],
            images: p.images || [],
            baseReference: p.baseReference
          }))
        });
        return newState;
      });
    }, []),
    
    setPropsToShots: useCallback((propsToShots) => {
      console.log('[SceneBuilderContext] setPropsToShots called with:', { 
        propsToShots, 
        keys: Object.keys(propsToShots),
        isEmpty: Object.keys(propsToShots).length === 0
      });
      setState(prev => {
        const newState = { ...prev, propsToShots };
        console.log('[SceneBuilderContext] setPropsToShots state update:', {
          prevKeys: Object.keys(prev.propsToShots),
          newKeys: Object.keys(newState.propsToShots),
          prevEmpty: Object.keys(prev.propsToShots).length === 0,
          newEmpty: Object.keys(newState.propsToShots).length === 0
        });
        return newState;
      });
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
      setState(prev => {
        const next: typeof prev = {
          ...prev,
          selectedDialogueWorkflows: {
            ...prev.selectedDialogueWorkflows,
            [shotSlot]: workflow
          }
        };
        // Feature 0209: When switching to Hidden Mouth, set default shot type if not already set (do not clear other namespace)
        if (workflow === 'off-frame-voiceover' && prev.offFrameShotType[shotSlot] === undefined) {
          next.offFrameShotType = { ...prev.offFrameShotType, [shotSlot]: 'back-facing' as OffFrameShotType };
        }
        return next;
      });
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
    
    setNarrationOverrides: useCallback((overrides) => {
      setState(prev => ({ ...prev, narrationOverrides: overrides }));
    }, []),
    updateNarrationOverride: useCallback((shotSlot, text) => {
      setState(prev => ({
        ...prev,
        narrationOverrides: {
          ...prev.narrationOverrides,
          [shotSlot]: text
        }
      }));
    }, []),
    setNarrationNarratorCharacterIds: useCallback((byShot) => {
      setState(prev => ({ ...prev, narrationNarratorCharacterId: byShot }));
    }, []),
    updateNarrationNarratorCharacterId: useCallback((shotSlot, characterId) => {
      setState(prev => ({
        ...prev,
        narrationNarratorCharacterId: {
          ...prev.narrationNarratorCharacterId,
          [shotSlot]: characterId
        }
      }));
    }, []),
    
    // Feature 0209: Off-frame voiceover (Hidden Mouth) – separate namespace; do not clear when switching workflow
    setOffFrameShotType: useCallback((byShot) => {
      setState(prev => ({ ...prev, offFrameShotType: byShot }));
    }, []),
    updateOffFrameShotType: useCallback((shotSlot, shotType) => {
      setState(prev => {
        const next = { ...prev, offFrameShotType: { ...prev.offFrameShotType, [shotSlot]: shotType } };
        const isListener = shotType === 'over-shoulder-listener' || shotType === 'two-shot-speaker-from-behind';
        const isGroup = shotType === 'speaker-to-group-from-behind' || shotType === 'speaker-to-group-crowd-pov';
        if (!isListener && prev.offFrameListenerCharacterId[shotSlot] != null) {
          next.offFrameListenerCharacterId = { ...prev.offFrameListenerCharacterId, [shotSlot]: null };
        }
        if (!isGroup && (prev.offFrameGroupCharacterIds[shotSlot]?.length ?? 0) > 0) {
          next.offFrameGroupCharacterIds = { ...prev.offFrameGroupCharacterIds, [shotSlot]: [] };
        }
        return next;
      });
    }, []),
    setOffFrameListenerCharacterId: useCallback((byShot) => {
      setState(prev => ({ ...prev, offFrameListenerCharacterId: byShot }));
    }, []),
    updateOffFrameListenerCharacterId: useCallback((shotSlot, characterId) => {
      setState(prev => ({
        ...prev,
        offFrameListenerCharacterId: {
          ...prev.offFrameListenerCharacterId,
          [shotSlot]: characterId
        }
      }));
    }, []),
    setOffFrameGroupCharacterIds: useCallback((byShot) => {
      setState(prev => ({ ...prev, offFrameGroupCharacterIds: byShot }));
    }, []),
    updateOffFrameGroupCharacterIds: useCallback((shotSlot, characterIds) => {
      setState(prev => ({
        ...prev,
        offFrameGroupCharacterIds: {
          ...prev.offFrameGroupCharacterIds,
          [shotSlot]: characterIds
        }
      }));
    }, []),
    setOffFrameSceneContextPrompt: useCallback((byShot) => {
      setState(prev => ({ ...prev, offFrameSceneContextPrompt: byShot }));
    }, []),
    updateOffFrameSceneContextPrompt: useCallback((shotSlot, prompt) => {
      setState(prev => ({
        ...prev,
        offFrameSceneContextPrompt: {
          ...prev.offFrameSceneContextPrompt,
          [shotSlot]: prompt
        }
      }));
    }, []),
    setOffFrameVideoPromptAdditive: useCallback((byShot) => {
      setState(prev => ({ ...prev, offFrameVideoPromptAdditive: byShot }));
    }, []),
    updateOffFrameVideoPromptAdditive: useCallback((shotSlot, prompt) => {
      setState(prev => ({
        ...prev,
        offFrameVideoPromptAdditive: {
          ...prev.offFrameVideoPromptAdditive,
          [shotSlot]: prompt
        }
      }));
    }, []),
    
    // Prompt Override Actions
    setFirstFramePromptOverrides: useCallback((overrides) => {
      setState(prev => ({ ...prev, firstFramePromptOverrides: overrides }));
    }, []),
    
    updateFirstFramePromptOverride: useCallback((shotSlot, prompt) => {
      setState(prev => ({
        ...prev,
        firstFramePromptOverrides: {
          ...prev.firstFramePromptOverrides,
          [shotSlot]: prompt
        }
      }));
    }, []),
    
    setVideoPromptOverrides: useCallback((overrides) => {
      setState(prev => ({ ...prev, videoPromptOverrides: overrides }));
    }, []),
    
    updateVideoPromptOverride: useCallback((shotSlot, prompt) => {
      setState(prev => ({
        ...prev,
        videoPromptOverrides: {
          ...prev.videoPromptOverrides,
          [shotSlot]: prompt
        }
      }));
    }, []),
    
    setPromptOverrideEnabled: useCallback((enabled) => {
      setState(prev => ({ ...prev, promptOverrideEnabled: enabled }));
    }, []),
    
    updatePromptOverrideEnabled: useCallback((shotSlot, enabled) => {
      setState(prev => ({
        ...prev,
        promptOverrideEnabled: {
          ...prev.promptOverrideEnabled,
          [shotSlot]: enabled
        }
      }));
    }, []),
    
    // 🔥 NEW: Separate first frame override enabled
    setFirstFrameOverrideEnabled: useCallback((enabled) => {
      setState(prev => ({ ...prev, firstFrameOverrideEnabled: enabled }));
    }, []),
    
    updateFirstFrameOverrideEnabled: useCallback((shotSlot, enabled) => {
      setState(prev => ({
        ...prev,
        firstFrameOverrideEnabled: {
          ...prev.firstFrameOverrideEnabled,
          [shotSlot]: enabled
        }
      }));
    }, []),
    
    // 🔥 NEW: Separate video prompt override enabled
    setVideoPromptOverrideEnabled: useCallback((enabled) => {
      setState(prev => ({ ...prev, videoPromptOverrideEnabled: enabled }));
    }, []),
    
    updateVideoPromptOverrideEnabled: useCallback((shotSlot, enabled) => {
      setState(prev => ({
        ...prev,
        videoPromptOverrideEnabled: {
          ...prev.videoPromptOverrideEnabled,
          [shotSlot]: enabled
        }
      }));
    }, []),
    
    // Uploaded First Frames Actions
    setUploadedFirstFrames: useCallback((frames) => {
      setState(prev => ({ ...prev, uploadedFirstFrames: frames }));
    }, []),
    
    updateUploadedFirstFrame: useCallback((shotSlot, firstFrameUrl) => {
      setState(prev => {
        if (firstFrameUrl === null) {
          // Remove the entry if null
          const newFrames = { ...prev.uploadedFirstFrames };
          delete newFrames[shotSlot];
          return { ...prev, uploadedFirstFrames: newFrames };
        } else {
          // 🔥 OPTION 1: Clear all first-frame-related selections when uploading
          // This ensures consistent workflow output: same first frame + same settings = same result
          // Clears: character references, location references, prop selections, first frame prompt override, reference shot model
          
          // Build new state immutably
          const newCharacterRefs = { ...prev.selectedCharacterReferences };
          if (newCharacterRefs[shotSlot]) {
            delete newCharacterRefs[shotSlot];
          }
          
          const newLocationRefs = { ...prev.selectedLocationReferences };
          if (newLocationRefs[shotSlot]) {
            delete newLocationRefs[shotSlot];
          }
          
          const newShotProps = { ...prev.shotProps };
          if (newShotProps[shotSlot]) {
            delete newShotProps[shotSlot];
          }
          
          const newFirstFrameOverrides = { ...prev.firstFramePromptOverrides };
          if (newFirstFrameOverrides[shotSlot]) {
            delete newFirstFrameOverrides[shotSlot];
          }
          
          const newReferenceModels = { ...prev.selectedReferenceShotModels };
          if (newReferenceModels[shotSlot]) {
            delete newReferenceModels[shotSlot];
          }
          
          return {
            ...prev,
            uploadedFirstFrames: {
              ...prev.uploadedFirstFrames,
              [shotSlot]: firstFrameUrl
            },
            selectedCharacterReferences: newCharacterRefs,
            selectedLocationReferences: newLocationRefs,
            shotProps: newShotProps,
            firstFramePromptOverrides: newFirstFrameOverrides,
            selectedReferenceShotModels: newReferenceModels
          };
        }
      });
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
      setState(prev => {
        const newVideoTypes = { ...prev.selectedVideoTypes };
        if (videoType === undefined || videoType === null) {
          // Clear video type when undefined/null is passed
          delete newVideoTypes[shotSlot];
        } else {
          newVideoTypes[shotSlot] = videoType;
        }
        return {
          ...prev,
          selectedVideoTypes: newVideoTypes
        };
      });
    }, []),
    
    setGenerateVideoForShot: useCallback((byShot) => {
      setState(prev => ({ ...prev, generateVideoForShot: byShot }));
    }, []),
    
    updateGenerateVideoForShot: useCallback((shotSlot, enabled) => {
      setState(prev => ({
        ...prev,
        generateVideoForShot: {
          ...prev.generateVideoForShot,
          [shotSlot]: enabled
        }
      }));
    }, []),
    
    // Feature 0234: Additive motion direction for lip-sync dialogue
    setMotionDirectionPrompt: useCallback((byShot) => {
      setState(prev => ({ ...prev, motionDirectionPrompt: byShot }));
    }, []),
    
    updateMotionDirectionPrompt: useCallback((shotSlot, prompt) => {
      setState(prev => ({
        ...prev,
        motionDirectionPrompt: {
          ...prev.motionDirectionPrompt,
          [shotSlot]: prompt
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
      console.log('[SceneBuilderContext] setEnabledShots called with:', { 
        shots, 
        length: shots.length,
        isEmpty: shots.length === 0
      });
      setState(prev => {
        const newState = { ...prev, enabledShots: shots };
        console.log('[SceneBuilderContext] setEnabledShots state update:', {
          prevLength: prev.enabledShots.length,
          newLength: newState.enabledShots.length,
          prevEmpty: prev.enabledShots.length === 0,
          newEmpty: newState.enabledShots.length === 0
        });
        return newState;
      });
    }, []),

    resetToInitialState: useCallback(() => {
      setState(getInitialSceneBuilderState());
      // Invalidate sync guards so derived data (headshots, loading, maps) is written back into state on next effect run
      lastHeadshotsSignatureRef.current = '';
      lastLoadingHeadshotsSignatureRef.current = '';
      lastMapsSignatureRef.current = '';
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

  // 🔥 CRITICAL FIX: Memoize the context value to prevent infinite re-renders
  // The value object was being recreated on every render, causing all consumers to re-render
  // Only include 'state' in dependencies - all actions are useCallback with empty deps (stable)
  // Even though 'actions' object is recreated each render, the functions inside are stable,
  // so consumers won't re-render unnecessarily. The key is that 'value' only changes when 'state' changes.
  const value: SceneBuilderContextValue = useMemo(() => ({
    state,
    actions
  }), [state]); // Only state changes - all action functions are stable (useCallback)

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

