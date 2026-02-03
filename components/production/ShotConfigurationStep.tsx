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
import { ArrowLeft, ArrowRight, Film, Check, ChevronDown, Upload, X, Loader2 } from 'lucide-react';
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
import { useSceneBuilderState, useSceneBuilderActions, VideoType } from '@/contexts/SceneBuilderContext';
import { useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { cn } from '@/lib/utils';
import { resolveLocationImageUrl } from './utils/imageUrlResolver';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { isOffFrameListenerShotType, isOffFrameGroupShotType } from '@/types/offFrame';
import type { OffFrameShotType } from '@/types/offFrame';

// Aspect Ratio Selector Component (Custom DaisyUI Dropdown)
const ASPECT_RATIO_OPTIONS = [
  { value: '16:9' as const, label: '16:9 (Horizontal)' },
  { value: '9:16' as const, label: '9:16 (Vertical)' },
  { value: '1:1' as const, label: '1:1 (Square)' },
  { value: '21:9' as const, label: '21:9 (Ultrawide)' },
  { value: '9:21' as const, label: '9:21 (Vertical ultrawide)' }
] as const;

function AspectRatioSelector({ value, onChange }: { value: string; onChange: (value: '16:9' | '9:16' | '1:1' | '21:9' | '9:21') => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const aspectRatios = useMemo(() => ASPECT_RATIO_OPTIONS, []);

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
  projectId?: string; // Screenplay/project ID (passed from SceneBuilderPanel)
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
  // 🔥 NEW: URL maps for resolving presigned URLs (same as SceneBuilderPanel)
  characterThumbnailS3KeyMap?: Map<string, string>; // Map of s3Key -> thumbnailS3Key
  characterThumbnailUrlsMap?: Map<string, string>; // Map of thumbnailS3Key -> presigned URL
  selectedReferenceFullImageUrlsMap?: Map<string, string>; // Map of s3Key -> full image presigned URL (for selected references)
  visibleHeadshotFullImageUrlsMap?: Map<string, string>; // Map of s3Key -> full image presigned URL (for visible headshots)
  locationReferenceFullImageUrlsMap?: Map<string, string>; // 🔥 NEW: Map of s3Key -> full image presigned URL (for selected location references)
  locationThumbnailS3KeyMap?: Map<string, string>; // 🔥 NEW: Map of location s3Key -> thumbnailS3Key
  locationThumbnailUrlsMap?: Map<string, string>; // 🔥 NEW: Map of location thumbnailS3Key -> presigned URL
  locationFullImageUrlsMap?: Map<string, string>; // 🔥 NEW: Map of location s3Key -> full image presigned URL
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
  propThumbnailUrlsMap?: Map<string, string>; // 🔥 NEW: Map of thumbnailS3Key -> presigned URL from Media Library
  // Workflow override for action shots
  shotWorkflowOverride?: string;
  onShotWorkflowOverrideChange?: (shotSlot: number, workflow: string) => void;
  // Feature 0182: Continuation (REMOVED - deferred to post-launch)
  // Reference Shot (First Frame) Model Selection
  selectedReferenceShotModel?: Record<number, 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k'>;
  onReferenceShotModelChange?: (shotSlot: number, model: 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k') => void;
  // Video Generation Selection
  selectedVideoType?: Record<number, VideoType>;
  onVideoTypeChange?: (shotSlot: number, videoType: VideoType) => void;
  // Aspect Ratio (per-shot)
  shotAspectRatio?: '16:9' | '9:16' | '1:1' | '21:9' | '9:21';
  onAspectRatioChange?: (shotSlot: number, aspectRatio: '16:9' | '9:16' | '1:1' | '21:9' | '9:21') => void;
  // Navigation
  onPrevious: () => void;
  onNext: () => void;
  // Shot navigation (for ShotNavigatorList)
  onShotSelect?: (shotSlot: number) => void;
  enabledShots?: number[];
  completedShots?: Set<number>; // Shots that are completely filled out
  /** Per-shot display credits (first-frame-only for dialogue when video not opted in). When set, overrides shot.credits in list. */
  shotDisplayCredits?: Record<number, number>;
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
  characterThumbnailS3KeyMap,
  characterThumbnailUrlsMap,
  selectedReferenceFullImageUrlsMap,
  visibleHeadshotFullImageUrlsMap,
  locationReferenceFullImageUrlsMap, // 🔥 NEW: Location URL map for references section
  locationThumbnailS3KeyMap, // 🔥 NEW: Location URL maps for LocationAngleSelector
  locationThumbnailUrlsMap,
  locationFullImageUrlsMap,
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
  propThumbnailUrlsMap: propThumbnailUrlsMapFromParent,
  selectedReferenceShotModel = {},
  onReferenceShotModelChange,
  selectedVideoType = {},
  onVideoTypeChange,
  shotAspectRatio,
  onAspectRatioChange,
  onPrevious,
  onNext,
  onShotSelect,
  enabledShots = [],
  completedShots = new Set(),
  shotDisplayCredits,
  isMobile = false,
  projectId
}: ShotConfigurationStepProps) {
  const { getToken } = useAuth();
  
  // Get state and actions from context (context is source of truth)
  const state = useSceneBuilderState();
  const actions = useSceneBuilderActions();
  
  // Extract all state from context (context is source of truth)
  const shotSlot = shot.slot;
  const selectedReferenceShotModels = state.selectedReferenceShotModels;
  const selectedVideoTypes = state.selectedVideoTypes;
  const generateVideoForShot = state.generateVideoForShot ?? {};
  const videoOptInForThisShot = !!generateVideoForShot[shotSlot];
  
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
  const finalOffFrameShotType = state.offFrameShotType[shotSlot];
  const finalOffFrameListenerCharacterId = state.offFrameListenerCharacterId[shotSlot] ?? null;
  const finalOffFrameGroupCharacterIds = state.offFrameGroupCharacterIds[shotSlot] ?? [];
  const finalOffFrameSceneContextPrompt = state.offFrameSceneContextPrompt[shotSlot] ?? '';
  const finalOffFrameVideoPromptAdditive = state.offFrameVideoPromptAdditive[shotSlot] ?? '';
  const finalShotWorkflowOverride = state.shotWorkflowOverrides[shotSlot];
  const finalFirstFramePromptOverride = state.firstFramePromptOverrides[shotSlot];
  const finalVideoPromptOverride = state.videoPromptOverrides[shotSlot];
  const uploadedFirstFrameUrl = state.uploadedFirstFrames[shotSlot];
  const finalNarrationOverride = state.narrationOverrides[shotSlot] ?? '';
  const finalNarratorCharacterId = state.narrationNarratorCharacterId[shotSlot] ?? (shot.type === 'dialogue' ? shot.characterId : undefined);
  
  // 🔥 DEBUG: Log current dialogue state when it changes (for testing reliable workflow selection)
  useEffect(() => {
    if (shot.type === 'dialogue') {
      console.log('[ShotConfigurationStep] 📊 Dialogue state for shot', shotSlot, ':', {
        quality: finalSelectedDialogueQuality,
        workflow: finalSelectedDialogueWorkflow,
        allQualities: state.selectedDialogueQualities,
        allWorkflows: state.selectedDialogueWorkflows
      });
    }
  }, [shot.slot, shot.type, finalSelectedDialogueQuality, finalSelectedDialogueWorkflow, state.selectedDialogueQualities, state.selectedDialogueWorkflows]);
  
  // 🔥 NEW: Separate enabled flags for first frame and video prompt overrides
  const firstFrameOverrideEnabledFromContext = state.firstFrameOverrideEnabled[shotSlot] ?? false;
  const videoPromptOverrideEnabledFromContext = state.videoPromptOverrideEnabled[shotSlot] ?? false;
  
  // 🔥 Feature 0218: Override section only for Narrate Shot (and non-dialogue). Hidden Mouth uses additive video prompt in panel, not overrides.
  const isDialogueShot = shot.type === 'dialogue';
  const isSceneVoiceover = finalSelectedDialogueWorkflow === 'scene-voiceover';
  const isOverrideAllowed = !isDialogueShot || isSceneVoiceover;
  
  // Auto-enable checkboxes if override data exists (preserves state on navigation)
  // First frame: enabled if prompt override exists OR uploaded first frame exists
  // BUT: Only if override is allowed for this workflow
  const isFirstFrameOverrideEnabled = isOverrideAllowed && (firstFrameOverrideEnabledFromContext || !!(finalFirstFramePromptOverride || uploadedFirstFrameUrl));
  // Video prompt: enabled if prompt override exists
  // BUT: Only if override is allowed for this workflow
  const isVideoPromptOverrideEnabled = isOverrideAllowed && (videoPromptOverrideEnabledFromContext || !!finalVideoPromptOverride);
  
  // Track first frame mode: 'generate' (default) or 'upload'
  const [firstFrameMode, setFirstFrameMode] = useState<'generate' | 'upload'>(
    uploadedFirstFrameUrl ? 'upload' : 'generate'
  );
  
  // Track upload state
  const [isUploadingFirstFrame, setIsUploadingFirstFrame] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔥 FIX Issue 1: Track checkbox state synchronously to avoid React batching issues
  // This ref is updated immediately when the checkbox is clicked, before React re-renders
  const firstFrameOverrideCheckboxRef = useRef<boolean>(firstFrameOverrideEnabledFromContext);
  // Keep ref in sync with context state
  useEffect(() => {
    firstFrameOverrideCheckboxRef.current = firstFrameOverrideEnabledFromContext;
  }, [firstFrameOverrideEnabledFromContext]);
  
  // Sync context state when override data exists (preserves state on navigation)
  // Clear overrides when switching away from Narrate Shot (e.g. to Hidden Mouth or lip-sync)
  useEffect(() => {
    if (isDialogueShot && !isSceneVoiceover) {
      if (firstFrameOverrideEnabledFromContext) {
        actions.updateFirstFrameOverrideEnabled(shotSlot, false);
        actions.updateFirstFramePromptOverride(shotSlot, '');
        // Don't clear uploaded first frame - user might want to keep it
      }
      if (videoPromptOverrideEnabledFromContext) {
        actions.updateVideoPromptOverrideEnabled(shotSlot, false);
        actions.updateVideoPromptOverride(shotSlot, '');
      }
      return; // Don't auto-enable if override is not allowed
    }
    
    // Auto-enable first frame override if prompt override exists OR uploaded first frame exists
    // Only if override is allowed
    if (isOverrideAllowed && (finalFirstFramePromptOverride || uploadedFirstFrameUrl) && !firstFrameOverrideEnabledFromContext) {
      actions.updateFirstFrameOverrideEnabled(shotSlot, true);
    }
    // Auto-enable video prompt override if prompt override exists
    // Only if override is allowed
    if (isOverrideAllowed && finalVideoPromptOverride && !videoPromptOverrideEnabledFromContext) {
      actions.updateVideoPromptOverrideEnabled(shotSlot, true);
    }
  }, [finalFirstFramePromptOverride, finalVideoPromptOverride, uploadedFirstFrameUrl, firstFrameOverrideEnabledFromContext, videoPromptOverrideEnabledFromContext, shotSlot, actions, isDialogueShot, isSceneVoiceover, isOverrideAllowed]);
  
  // Sync first frame mode when uploaded first frame changes
  // Only auto-switch to 'upload' if a file is uploaded, or back to 'generate' if file is removed
  // Don't prevent user from manually selecting 'upload' mode
  const prevUploadedFirstFrameUrl = useRef<string | undefined>(uploadedFirstFrameUrl);
  useEffect(() => {
    // If a file was just uploaded, switch to upload mode
    if (uploadedFirstFrameUrl && !prevUploadedFirstFrameUrl.current) {
      setFirstFrameMode('upload');
    }
    // If a file was just removed (went from existing to null), switch back to generate mode
    else if (!uploadedFirstFrameUrl && prevUploadedFirstFrameUrl.current) {
      setFirstFrameMode('generate');
    }
    // Update ref for next comparison
    prevUploadedFirstFrameUrl.current = uploadedFirstFrameUrl;
  }, [uploadedFirstFrameUrl]);
  
  // Get projectId from prop (passed from SceneBuilderPanel)
  // This is the screenplay/project ID, not the scene ID
  const screenplayId = projectId || '';
  
  // Get screenplay context for sceneNumber lookup
  const { scenes } = useScreenplay();
  
  // Handle first frame file upload (uses working annotation pattern - proven to work)
  const handleFirstFrameUpload = useCallback(async (file: File) => {
    // Validate file type - with fallback detection (matching annotation pattern)
    let fileType = file.type;
    if (!fileType || !fileType.startsWith('image/')) {
      // Try to detect from extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
      };
      fileType = mimeTypes[extension || ''] || 'image/jpeg';
      
      if (!file.type) {
        console.warn('[ShotConfigurationStep] File type was empty, detected:', fileType);
      } else {
        toast.error('Please upload an image file');
        return;
      }
    }
    
    // Validate screenplayId before upload
    if (!screenplayId || screenplayId.trim() === '') {
      console.error('[ShotConfigurationStep] screenplayId is missing:', {
        projectId,
        screenplayId,
        shotSlot
      });
      toast.error('Project ID is required for upload. Please refresh the page and try again.');
      return;
    }
    
    setIsUploadingFirstFrame(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      console.log('[ShotConfigurationStep] Uploading first frame:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        screenplayId: screenplayId.substring(0, 20) + '...',
        shotSlot
      });
      
      // Use working annotation pattern: presigned URL -> S3 upload -> register -> get download URL
      // This avoids multer FormData parsing issues by using query params and JSON bodies
      
      // Step 1: Get presigned URL (query params, not FormData - avoids multer parsing issues)
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(fileType)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(screenplayId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error('File too large. Maximum size is 10MB.');
        }
        if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        }
        const errorData = await presignedResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to get upload URL: ${presignedResponse.statusText}`);
      }
      
      const presignedData = await presignedResponse.json();
      const { url, fields, s3Key } = presignedData;
      
      // Validate presigned URL response
      if (!url || !fields || !s3Key) {
        console.error('[ShotConfigurationStep] Invalid presigned URL response:', presignedData);
        throw new Error('Invalid presigned URL response from server');
      }
      
      console.log('[ShotConfigurationStep] Presigned URL received:', {
        url: url.substring(0, 100) + '...',
        fieldsCount: Object.keys(fields).length,
        s3Key: s3Key.substring(0, 50) + '...'
      });
      
      // Step 2: Upload to S3 directly (using presigned POST)
      // Match working pattern from AnnotationToVideoPanel and SceneBuilderPanel
      // Verify 'key' field is present (required for presigned POST)
      if (!fields.key && !fields.Key) {
        console.error('[ShotConfigurationStep] WARNING: No "key" field in presigned POST fields!');
        console.error('[ShotConfigurationStep] Available fields:', Object.keys(fields));
        throw new Error('Invalid presigned POST response: missing "key" field');
      }
      
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        // Skip 'bucket' field - it's only used in the policy, not in FormData
        if (key.toLowerCase() === 'bucket') {
          console.log(`[ShotConfigurationStep] Skipping 'bucket' field (policy-only): ${value}`);
          return;
        }
        formData.append(key, value as string);
      });
      
      // Add file last (required by S3 presigned POST)
      formData.append('file', file);
      
      console.log('[ShotConfigurationStep] Uploading to S3:', {
        url: url.substring(0, 100) + '...',
        formDataKeys: Array.from(formData.keys()),
        hasKeyField: !!(fields.key || fields.Key),
        fileSize: file.size,
        fileType: file.type
      });
      
      // Small delay to ensure presigned URL is fully ready (fixes intermittent 403 errors)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const s3Response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!s3Response.ok) {
        const errorText = await s3Response.text().catch(() => 'Unknown error');
        console.error('[ShotConfigurationStep] S3 upload failed:', {
          status: s3Response.status,
          statusText: s3Response.statusText,
          error: errorText.substring(0, 200),
          url: url.substring(0, 100) + '...'
        });
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
      }
      
      // Step 3: Register media in Media Library (JSON body, not FormData)
      // 🔥 NEW: Pass scene context for user-uploaded first frames
      // This creates organized folder structure: User First Frames/Scene_{number}/{timestamp}-shot-{shotNumber}/
      const sceneId = sceneAnalysisResult?.sceneId;
      
      // Get sceneNumber from screenplay context (same pattern as SceneBuilderPanel)
      let sceneNumber: number | undefined;
      if (sceneId && scenes) {
        const selectedScene = scenes.find((s: any) => s.id === sceneId);
        if (selectedScene) {
          sceneNumber = selectedScene.number;
        }
      }
      
      const shotNumber = shot.slot;
      
      // Generate timestamp for folder organization (matches backend pattern)
      const generateTimestamp = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}-${hours}${minutes}${seconds}`;
      };
      
      const timestamp = generateTimestamp();
      
      const registerResponse = await fetch('/api/media/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          s3Key,
          fileName: file.name,
          fileType: fileType,
          fileSize: file.size,
          screenplayId,
          // 🔥 NEW: Scene context for user-uploaded first frames
          isUserFirstFrame: true,
          sceneId: sceneId,
          sceneNumber: sceneNumber,
          shotNumber: shotNumber,
          timestamp: timestamp
        })
      });
      
      if (!registerResponse.ok) {
        console.warn('[ShotConfigurationStep] Failed to register media (non-fatal):', registerResponse.statusText);
        // Continue anyway - file is in S3
      }
      
      // Step 4: Get download URL (JSON body, not FormData)
      const downloadResponse = await fetch('/api/s3/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ s3Key })
      });
      
      if (!downloadResponse.ok) {
        throw new Error(`Failed to get download URL: ${downloadResponse.statusText}`);
      }
      
      const { downloadUrl } = await downloadResponse.json();
      const imageUrl = downloadUrl || `https://screenplay-assets-043309365215.s3.us-east-1.amazonaws.com/${s3Key}`;
      
      // Store in context (this will automatically clear all first-frame-related selections)
      actions.updateUploadedFirstFrame(shotSlot, imageUrl);
      
      toast.success('First frame uploaded successfully!');
    } catch (error: any) {
      console.error('[ShotConfigurationStep] First frame upload failed:', error);
      toast.error('Failed to upload first frame', {
        description: error?.message || 'Unknown error'
      });
    } finally {
      setIsUploadingFirstFrame(false);
    }
  }, [screenplayId, getToken, shotSlot, actions, projectId, sceneAnalysisResult, shot, scenes]);
  
  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFirstFrameUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFirstFrameUpload]);
  
  // Handle remove uploaded first frame
  const handleRemoveUploadedFirstFrame = useCallback(() => {
    actions.updateUploadedFirstFrame(shotSlot, null);
    setFirstFrameMode('generate');
    toast.success('Uploaded first frame removed');
  }, [shotSlot, actions]);
  
  // Handle first frame mode change
  const handleFirstFrameModeChange = useCallback((mode: 'generate' | 'upload') => {
    setFirstFrameMode(mode);
    if (mode === 'generate') {
      // Clear uploaded first frame when switching to generate mode
      actions.updateUploadedFirstFrame(shotSlot, null);
    }
  }, [shotSlot, actions]);
  
  // 🔥 Feature 0233: Only require video type when dialogue shot has video opt-in. Action/establishing are first-frame-only.
  // 🔥 FIX Issue 3: Clear video type when video opt-in is disabled to prevent incorrect cost calculation
  useEffect(() => {
    const needsVideoType = shot.type === 'dialogue' && videoOptInForThisShot;
    if (needsVideoType && onVideoTypeChange) {
      const currentVideoType = selectedVideoTypes[shotSlot];
      if (!currentVideoType) {
        onVideoTypeChange(shotSlot, 'cinematic-visuals');
      }
    } else if (shot.type === 'dialogue' && !videoOptInForThisShot && onVideoTypeChange) {
      // Clear video type when video opt-in is disabled to prevent incorrect pricing
      const currentVideoType = selectedVideoTypes[shotSlot];
      if (currentVideoType) {
        onVideoTypeChange(shotSlot, undefined as any); // Clear the video type
      }
    }
  }, [shot.slot, shot.type, videoOptInForThisShot, selectedVideoTypes, shotSlot, onVideoTypeChange]);
  
  // 🔥 NEW: Auto-select default dialogue quality (reliable/Wryda) when dialogue shot has video opt-in
  // 🔥 FIX Issue 3: Only set quality when video is opted in - otherwise it affects cost calculation
  useEffect(() => {
    // Only initialize for dialogue shots that have video opt-in and need quality selection
    if (shot.type === 'dialogue' && videoOptInForThisShot && onDialogueQualityChange) {
      const currentQuality = finalSelectedDialogueQuality;
      // If no quality is set, default to 'reliable' (Wryda)
      if (!currentQuality) {
        onDialogueQualityChange(shotSlot, 'reliable');
      }
    }
  }, [shot.slot, shot.type, videoOptInForThisShot, finalSelectedDialogueQuality, onDialogueQualityChange]);
  
  // 🔥 NEW: Fetch presigned URLs for prop images (for references section)
  // Collect all prop image S3 keys for this shot
  const propImageS3Keys = useMemo(() => {
    const keys: string[] = [];
    const shotPropsForThisShot = finalSceneProps.filter(prop => 
      finalPropsToShots[prop.id]?.includes(shot.slot)
    );
    
    shotPropsForThisShot.forEach(prop => {
      const propConfig = finalShotProps[shot.slot]?.[prop.id];
      const availableImages = getAvailablePropImages(prop);
      const selectedImageId = propConfig?.selectedImageId || (availableImages.length > 0 ? availableImages[0].id : undefined);
      const selectedImage = selectedImageId 
        ? availableImages.find(img => img.id === selectedImageId)
        : availableImages[0];
      
      if (selectedImage) {
        // Find the s3Key for the selected image
        const fullProp = prop as typeof prop & {
          angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
          images?: Array<{ url: string; s3Key?: string }>;
          baseReference?: { s3Key?: string; imageUrl?: string };
        };
        
        let imageS3Key: string | null = null;
        if (fullProp.angleReferences) {
          const ref = fullProp.angleReferences.find(r => r.id === selectedImage.id);
          if (ref?.s3Key) imageS3Key = ref.s3Key;
        }
        if (!imageS3Key && fullProp.images) {
          const imgData = fullProp.images.find(i => i.url === selectedImage.id || i.s3Key === selectedImage.id);
          if (imgData?.s3Key) imageS3Key = imgData.s3Key;
        }
        if (!imageS3Key && fullProp.baseReference?.s3Key && selectedImage.label === 'Creation Image (Last Resort)') {
          imageS3Key = fullProp.baseReference.s3Key;
        }
        
        if (imageS3Key) {
          keys.push(imageS3Key);
        }
      }
    });
    
    return keys;
  }, [finalSceneProps, finalPropsToShots, finalShotProps, shot.slot]);
  
  // Fetch presigned URLs for prop images
  const { data: propImageUrlsMap = new Map() } = useBulkPresignedUrls(
    propImageS3Keys,
    propImageS3Keys.length > 0
  );
  
  // Also fetch thumbnail URLs if available
  const propThumbnailS3Keys = useMemo(() => {
    if (!finalPropThumbnailS3KeyMap) return [];
    const keys: string[] = [];
    const shotPropsForThisShot = finalSceneProps.filter(prop => 
      finalPropsToShots[prop.id]?.includes(shot.slot)
    );
    
    shotPropsForThisShot.forEach(prop => {
      const propConfig = finalShotProps[shot.slot]?.[prop.id];
      const availableImages = getAvailablePropImages(prop);
      const selectedImageId = propConfig?.selectedImageId || (availableImages.length > 0 ? availableImages[0].id : undefined);
      const selectedImage = selectedImageId 
        ? availableImages.find(img => img.id === selectedImageId)
        : availableImages[0];
      
      if (selectedImage) {
        const fullProp = prop as typeof prop & {
          angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
          images?: Array<{ url: string; s3Key?: string }>;
          baseReference?: { s3Key?: string; imageUrl?: string };
        };
        
        let imageS3Key: string | null = null;
        if (fullProp.angleReferences) {
          const ref = fullProp.angleReferences.find(r => r.id === selectedImage.id);
          if (ref?.s3Key) imageS3Key = ref.s3Key;
        }
        if (!imageS3Key && fullProp.images) {
          const imgData = fullProp.images.find(i => i.url === selectedImage.id || i.s3Key === selectedImage.id);
          if (imgData?.s3Key) imageS3Key = imgData.s3Key;
        }
        if (!imageS3Key && fullProp.baseReference?.s3Key && selectedImage.label === 'Creation Image (Last Resort)') {
          imageS3Key = fullProp.baseReference.s3Key;
        }
        
        if (imageS3Key && finalPropThumbnailS3KeyMap.has(imageS3Key)) {
          const thumbnailS3Key = finalPropThumbnailS3KeyMap.get(imageS3Key);
          if (thumbnailS3Key) {
            keys.push(thumbnailS3Key);
          }
        }
      }
    });
    
    return keys;
  }, [finalSceneProps, finalPropsToShots, finalShotProps, finalPropThumbnailS3KeyMap, shot.slot]);
  
  // Use passed-in propThumbnailUrlsMap if available, otherwise fetch it
  const { data: propThumbnailUrlsMapFromHook = new Map() } = useBulkPresignedUrls(
    propThumbnailS3Keys,
    propThumbnailS3Keys.length > 0 && !propThumbnailUrlsMapFromParent // Only fetch if not passed from parent
  );
  
  // Use parent's map if available, otherwise use the one we fetched
  const propThumbnailUrlsMap = propThumbnailUrlsMapFromParent || propThumbnailUrlsMapFromHook;
  
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
    console.log('[ShotConfigurationStep] 🔥 Dialogue quality changed:', { shotSlot, quality, currentState: state.selectedDialogueQualities[shotSlot] });
    actions.updateDialogueQuality(shotSlot, quality);
  }, [actions, state.selectedDialogueQualities]);
  
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
  
  const finalOnFirstFramePromptOverrideChange = useCallback((shotSlot: number, prompt: string) => {
    actions.updateFirstFramePromptOverride(shotSlot, prompt);
  }, [actions]);
  
  const finalOnVideoPromptOverrideChange = useCallback((shotSlot: number, prompt: string) => {
    actions.updateVideoPromptOverride(shotSlot, prompt);
  }, [actions]);
  
  const finalOnReferenceShotModelChange = useCallback((shotSlot: number, model: 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k') => {
    actions.updateReferenceShotModel(shotSlot, model);
  }, [actions]);
  
  const finalOnVideoTypeChange = useCallback((shotSlot: number, videoType: 'cinematic-visuals' | 'natural-motion') => {
    actions.updateVideoType(shotSlot, videoType);
  }, [actions]);
  
  const finalOnAspectRatioChange = useCallback((shotSlot: number, aspectRatio: '16:9' | '9:16' | '1:1' | '21:9' | '9:21') => {
    actions.updateShotAspectRatio(shotSlot, aspectRatio);
  }, [actions]);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pricing, setPricing] = useState<{ hdPrice: number; k4Price: number; firstFramePrice: number } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const firstFrameTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // NOTE: We do NOT clear character references when switching to non-lip-sync. Hidden Mouth (off-frame)
  // needs the speaker's character image for voice and first-frame reference; Narrate Shot uses the
  // narrator's voice (characterId). Clearing refs would break Hidden Mouth and lose user selections
  // if they switch back to lip-sync.

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
        const referenceShotModel = selectedReferenceShotModels[shot.slot] || 'nano-banana-pro-2k'; // Default to match UI
        // 🔥 FIX Issue 3: Only include video type if video opt-in is enabled for dialogue shots
        const videoType = (shot.type === 'dialogue' && videoOptInForThisShot) ? selectedVideoTypes[shot.slot] : undefined;
        const pricingResult = await SceneBuilderService.calculatePricing(
          [{ slot: shot.slot, credits: shot.credits }],
          shotDuration ? { [shot.slot]: shotDuration } : undefined,
          getToken,
          { [shot.slot]: referenceShotModel }, // Always pass model (use default if not selected)
          videoType ? { [shot.slot]: videoType } : undefined,
          undefined, // dialogueQualities
          undefined, // dialogueWorkflows
          undefined, // voiceoverBaseWorkflows
          generateVideoForShot // 🔥 FIX Issue 3: Pass generateVideoForShot to ensure correct pricing
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
  }, [shot?.slot, shot?.credits, shot?.type, shotDuration, selectedReferenceShotModels, selectedVideoTypes, videoOptInForThisShot, generateVideoForShot, getToken]);

  // Validate shot completion before allowing next
  const handleNext = () => {
    const validationErrors: string[] = [];
    
    // 1. Validate prompt override requirements (if overrides are enabled)
    // First frame override validation: when checkbox is on, must have prompt or uploaded image (Plan 0233: applies to both dialogue and action)
    // 🔥 FIX Issue 1: Use ref for synchronous check to avoid React batching issues
    // The ref is updated immediately when checkbox is clicked, before React re-renders
    // Check ref first (most up-to-date), then context state, then if prompt override exists
    const firstFrameOverrideChecked = firstFrameOverrideCheckboxRef.current || firstFrameOverrideEnabledFromContext || !!finalFirstFramePromptOverride;
    if (firstFrameOverrideChecked) {
      const hasFirstFramePrompt = finalFirstFramePromptOverride?.trim() !== '';
      const hasUploadedFirstFrame = !!uploadedFirstFrameUrl;
      if (!hasFirstFramePrompt && !hasUploadedFirstFrame) {
        validationErrors.push('First frame: Enter a prompt when "Override First Frame" is enabled.');
      }
    }
    
    // Video prompt: required for Narrate Shot (primary field); for action shots required when override enabled
    if (isOverrideAllowed && (isVideoPromptOverrideEnabled || isSceneVoiceover)) {
      const hasVideoPrompt = finalVideoPromptOverride?.trim() !== '';
      if (!hasVideoPrompt) {
        validationErrors.push(isSceneVoiceover ? 'Video prompt is required for Narrate Shot.' : 'Video prompt is required when "Override Video Prompt" is enabled.');
      }
    }
    
    // Narrate Shot: narration (what the narrator says) is required
    if (isSceneVoiceover) {
      const hasNarration = finalNarrationOverride?.trim() !== '';
      if (!hasNarration) {
        validationErrors.push('What the narrator says is required for Narrate Shot. Please enter the narration text.');
      }
    }
    
    // Plan 0233: First frame override is allowed for all shots (dialogue and action). No non–lip-sync / video-override validation here.
    
    // 2. Validate location requirement (skip if first frame is uploaded)
    if (!uploadedFirstFrameUrl && isLocationAngleRequired(shot) && needsLocationAngle(shot)) {
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
    
    // 2. Validate character headshots (required - skip if first frame is uploaded)
    if (!uploadedFirstFrameUrl) {
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
    }
    
    // 3. Validate video type selection (Feature 0233: only when dialogue shot has video opt-in)
    const needsVideoType = shot.type === 'dialogue' && videoOptInForThisShot;
    if (needsVideoType && onVideoTypeChange) {
      const currentVideoType = selectedVideoTypes[shotSlot];
      if (!currentVideoType) {
        validationErrors.push('Video model selection required. Expand "Add Dialogue Video" and select a lip-sync option.');
      }
    }
    
    // 4. Validate ALL pronouns are mapped (singular and plural)
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
    // 🔥 MOBILE FIX: Stack on mobile (flex-col), grid on desktop (md:grid)
    <div className="flex flex-col space-y-4 md:!grid md:grid-cols-3 md:gap-4 md:items-start w-full max-w-full overflow-x-hidden">
      {/* Shot Navigator (Left side: 1/3 width on desktop, top on mobile) */}
      {onShotSelect && (
        <div className="w-full md:sticky md:top-4 flex flex-col order-1 md:order-none">
          <label className="text-xs font-medium mb-2 block text-[#808080]">
            Select Shot
          </label>
          <ShotNavigatorList
            shots={enabledShotsList}
            currentShotSlot={shot.slot}
            shotDisplayCredits={shotDisplayCredits}
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
      <div className="w-full max-w-full md:col-span-2 order-2 md:order-none overflow-x-hidden">
        <div className={`space-y-4 transition-opacity duration-500 w-full max-w-full ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <Card className="bg-[#141414] border-[#3F3F46] w-full max-w-full overflow-x-hidden">
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

          {/* 🔥 NEW: Hide reference selection UI when first frame is uploaded (references not needed) */}
          {!uploadedFirstFrameUrl && (
            <>
              {/* Dialogue: ref selection → Reference Shot (model + preview) → Pricing (first frame only) → expand area (LIP SYNC + pricing with dialogue). Action: config then Reference Shot at bottom. */}
              {isDialogueShot ? (
                /* Feature 0233: Always show ref selection + Reference Shot; expand area contains only LIP SYNC + video pricing. */
                <div className="pb-3 border-b border-[#3F3F46]">
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
                  characterThumbnailS3KeyMap={characterThumbnailS3KeyMap}
                  characterThumbnailUrlsMap={characterThumbnailUrlsMap}
                  selectedReferenceFullImageUrlsMap={selectedReferenceFullImageUrlsMap}
                  visibleHeadshotFullImageUrlsMap={visibleHeadshotFullImageUrlsMap}
                  locationThumbnailS3KeyMap={locationThumbnailS3KeyMap} // 🔥 NEW: Pass location URL maps
                  locationThumbnailUrlsMap={locationThumbnailUrlsMap}
                  locationFullImageUrlsMap={locationFullImageUrlsMap}
                  selectedDialogueQuality={finalSelectedDialogueQuality}
                  selectedDialogueWorkflow={finalSelectedDialogueWorkflow}
                  onDialogueQualityChange={finalOnDialogueQualityChange}
                  onDialogueWorkflowChange={finalOnDialogueWorkflowChange}
                  dialogueWorkflowPrompt={finalDialogueWorkflowPrompt}
                  onDialogueWorkflowPromptChange={finalOnDialogueWorkflowPromptChange}
                  narrationOverride={finalNarrationOverride}
                  onNarrationOverrideChange={(_, text) => actions.updateNarrationOverride(shotSlot, text)}
                  narratorCharacterId={finalNarratorCharacterId}
                  onNarrationNarratorChange={(_, characterId) => actions.updateNarrationNarratorCharacterId(shotSlot, characterId)}
                  offFrameShotType={finalOffFrameShotType}
                  offFrameListenerCharacterId={finalOffFrameListenerCharacterId}
                  offFrameGroupCharacterIds={finalOffFrameGroupCharacterIds}
                  offFrameSceneContextPrompt={finalOffFrameSceneContextPrompt}
                  onOffFrameSceneContextPromptChange={(_, prompt) => actions.updateOffFrameSceneContextPrompt(shotSlot, prompt)}
                  offFrameVideoPromptAdditive={finalOffFrameVideoPromptAdditive}
                  onOffFrameVideoPromptAdditiveChange={(_, prompt) => actions.updateOffFrameVideoPromptAdditive(shotSlot, prompt)}
                  onOffFrameShotTypeChange={(_, shotType) => actions.updateOffFrameShotType(shotSlot, shotType)}
                  onOffFrameListenerCharacterIdChange={(_, id) => actions.updateOffFrameListenerCharacterId(shotSlot, id)}
                  onOffFrameGroupCharacterIdsChange={(_, ids) => actions.updateOffFrameGroupCharacterIds(shotSlot, ids)}
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
                  propThumbnailUrlsMap={propThumbnailUrlsMap}
                  showDialogueWorkflowSection={videoOptInForThisShot}
                  onAddDialogueVideoClick={() => actions.updateGenerateVideoForShot(shotSlot, true)}
                  onCollapseDialogueVideo={() => actions.updateGenerateVideoForShot(shotSlot, false)}
                  motionDirectionPrompt={state.motionDirectionPrompt[shotSlot] || ''}
                  onMotionDirectionChange={(value) => actions.updateMotionDirectionPrompt(shotSlot, value)}
                  showMotionDirection={isDialogueShot && !isSceneVoiceover}
                  renderAfterReferenceSelection={onReferenceShotModelChange ? (
                    <>
                      <ReferenceShotSelector shotSlot={shot.slot} selectedModel={selectedReferenceShotModels[shot.slot]} onModelChange={finalOnReferenceShotModelChange} />
                      {(() => {
                        const references: Array<{ type: 'character' | 'location' | 'prop' | 'asset' | 'other'; imageUrl?: string; label: string; id: string }> = [];
                        const allShotCharacters = new Set<string>();
                        explicitCharacters.forEach(charId => allShotCharacters.add(charId));
                        Object.values(shotMappings || {}).forEach(mapping => {
                          if (mapping && mapping !== '__ignore__') {
                            if (Array.isArray(mapping)) { mapping.forEach(charId => allShotCharacters.add(charId)); } else { allShotCharacters.add(mapping); }
                          }
                        });
                        (finalSelectedCharactersForShots[shot.slot] || []).forEach(charId => allShotCharacters.add(charId));
                        const isOffFrameForDisplay = finalSelectedDialogueWorkflow === 'off-frame-voiceover' && activeTab === 'advanced';
                        if (isOffFrameForDisplay) {
                          if (finalOffFrameShotType === 'off-frame') allShotCharacters.delete(shot.characterId);
                          if (finalOffFrameListenerCharacterId && finalOffFrameShotType && isOffFrameListenerShotType(finalOffFrameShotType as OffFrameShotType)) allShotCharacters.add(finalOffFrameListenerCharacterId);
                          if (finalOffFrameShotType && isOffFrameGroupShotType(finalOffFrameShotType as OffFrameShotType) && (finalOffFrameGroupCharacterIds?.length ?? 0) > 0) finalOffFrameGroupCharacterIds.forEach((id: string) => allShotCharacters.add(id));
                        } else {
                          if (finalOffFrameListenerCharacterId) allShotCharacters.delete(finalOffFrameListenerCharacterId);
                          (finalOffFrameGroupCharacterIds || []).forEach((id: string) => allShotCharacters.delete(id));
                        }
                        allShotCharacters.forEach(charId => {
                          const char = allCharacters.find(c => c.id === charId);
                          if (char) {
                            const charRef = finalSelectedCharacterReferences[shot.slot]?.[charId];
                            if (charRef && (charRef.imageUrl || charRef.s3Key)) {
                              let imageUrl = charRef.imageUrl;
                              if (!imageUrl && charRef.s3Key && finalCharacterHeadshots[charId]) {
                                const headshot = finalCharacterHeadshots[charId].find(h => h.s3Key === charRef.s3Key);
                                if (headshot?.imageUrl) imageUrl = headshot.imageUrl;
                              }
                              if (imageUrl) references.push({ type: 'character', imageUrl, label: char.name || `Character ${charId}`, id: `char-${charId}` });
                            }
                          }
                        });
                        const locationRef = finalSelectedLocationReferences[shot.slot];
                        if (locationRef) {
                          const location = finalSceneProps.find(loc => loc.id === shot.locationId);
                          const locationImageUrl = resolveLocationImageUrl(locationRef, { thumbnailS3KeyMap: null, thumbnailUrlsMap: null, fullImageUrlsMap: locationReferenceFullImageUrlsMap || propImageUrlsMap });
                          if (locationImageUrl) references.push({ type: 'location', imageUrl: locationImageUrl, label: location?.name || 'Location', id: `loc-${shot.slot}` });
                        }
                        const shotPropsForThisShot = finalSceneProps.filter(prop => finalPropsToShots[prop.id]?.includes(shot.slot));
                        shotPropsForThisShot.forEach(prop => {
                          const propConfig = finalShotProps[shot.slot]?.[prop.id];
                          const availableImages = getAvailablePropImages(prop);
                          const selectedImageId = propConfig?.selectedImageId || (availableImages.length > 0 ? availableImages[0].id : undefined);
                          const selectedImage = selectedImageId ? availableImages.find(img => img.id === selectedImageId) : availableImages[0];
                          if (selectedImage) {
                            const fullProp = prop as typeof prop & { angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>; images?: Array<{ url: string; s3Key?: string }>; baseReference?: { s3Key?: string; imageUrl?: string } };
                            let imageS3Key: string | null = null;
                            if (fullProp.angleReferences) { const ref = fullProp.angleReferences.find(r => r.id === selectedImage.id); if (ref?.s3Key) imageS3Key = ref.s3Key; }
                            if (!imageS3Key && fullProp.images) { const imgData = fullProp.images.find(i => i.url === selectedImage.id || i.s3Key === selectedImage.id); if (imgData?.s3Key) imageS3Key = imgData.s3Key; }
                            if (!imageS3Key && fullProp.baseReference?.s3Key && selectedImage.label === 'Creation Image (Last Resort)') imageS3Key = fullProp.baseReference.s3Key;
                            if (!imageS3Key && selectedImage.id && (selectedImage.id.startsWith('asset/') || selectedImage.id.includes('/'))) imageS3Key = selectedImage.id;
                            let displayUrl: string | undefined;
                            if (imageS3Key) {
                              if (finalPropThumbnailS3KeyMap?.has(imageS3Key)) { const thumbnailS3Key = finalPropThumbnailS3KeyMap.get(imageS3Key); if (thumbnailS3Key && propThumbnailUrlsMap?.has(thumbnailS3Key)) displayUrl = propThumbnailUrlsMap.get(thumbnailS3Key); }
                              if (!displayUrl && propImageUrlsMap?.has(imageS3Key)) displayUrl = propImageUrlsMap.get(imageS3Key);
                            }
                            if (!displayUrl && selectedImage.imageUrl) {
                              if (selectedImage.imageUrl.startsWith('http')) displayUrl = selectedImage.imageUrl;
                              else if (propImageUrlsMap?.has(selectedImage.imageUrl)) displayUrl = propImageUrlsMap.get(selectedImage.imageUrl);
                            }
                            if (!displayUrl) displayUrl = fullProp.baseReference?.imageUrl || prop.imageUrl;
                            if (displayUrl) references.push({ type: 'prop', imageUrl: displayUrl, label: prop.name, id: `prop-${prop.id}` });
                          }
                        });
                        return references.length > 0 ? <ReferencePreview references={references} className="mt-2 mb-3" /> : null;
                      })()}
                    </>
                  ) : undefined}
                />
                </div>
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
              characterThumbnailS3KeyMap={characterThumbnailS3KeyMap}
              characterThumbnailUrlsMap={characterThumbnailUrlsMap}
              selectedReferenceFullImageUrlsMap={selectedReferenceFullImageUrlsMap}
              visibleHeadshotFullImageUrlsMap={visibleHeadshotFullImageUrlsMap}
              locationThumbnailS3KeyMap={locationThumbnailS3KeyMap} // 🔥 NEW: Pass location URL maps
              locationThumbnailUrlsMap={locationThumbnailUrlsMap}
              locationFullImageUrlsMap={locationFullImageUrlsMap}
              selectedDialogueQuality={finalSelectedDialogueQuality}
              selectedDialogueWorkflow={finalSelectedDialogueWorkflow}
              onDialogueQualityChange={finalOnDialogueQualityChange}
              onDialogueWorkflowChange={finalOnDialogueWorkflowChange}
                  dialogueWorkflowPrompt={finalDialogueWorkflowPrompt}
                  onDialogueWorkflowPromptChange={finalOnDialogueWorkflowPromptChange}
                  narrationOverride={finalNarrationOverride}
                  onNarrationOverrideChange={(_, text) => actions.updateNarrationOverride(shotSlot, text)}
                  offFrameShotType={finalOffFrameShotType}
                  offFrameListenerCharacterId={finalOffFrameListenerCharacterId}
                  offFrameGroupCharacterIds={finalOffFrameGroupCharacterIds}
                  offFrameSceneContextPrompt={finalOffFrameSceneContextPrompt}
                  onOffFrameSceneContextPromptChange={(_, prompt) => actions.updateOffFrameSceneContextPrompt(shotSlot, prompt)}
                  offFrameVideoPromptAdditive={finalOffFrameVideoPromptAdditive}
                  onOffFrameVideoPromptAdditiveChange={(_, prompt) => actions.updateOffFrameVideoPromptAdditive(shotSlot, prompt)}
                  onOffFrameShotTypeChange={(_, shotType) => actions.updateOffFrameShotType(shotSlot, shotType)}
                  onOffFrameListenerCharacterIdChange={(_, id) => actions.updateOffFrameListenerCharacterId(shotSlot, id)}
                  onOffFrameGroupCharacterIdsChange={(_, ids) => actions.updateOffFrameGroupCharacterIds(shotSlot, ids)}
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
              {/* Reference Shot (First Frame) - Action/establishing only: at bottom after config (prop selection, describe shot, etc.) so References carousel is right below model dropdown */}
              {!isDialogueShot && onReferenceShotModelChange && (
                <>
                  <ReferenceShotSelector
                    shotSlot={shot.slot}
                    selectedModel={selectedReferenceShotModels[shot.slot]}
                    onModelChange={finalOnReferenceShotModelChange}
                  />
                  {/* Reference Preview - Shows what references will be used for this shot (directly under Reference Shot) */}
                  {(() => {
                    const references: Array<{ type: 'character' | 'location' | 'prop' | 'asset' | 'other'; imageUrl?: string; label: string; id: string }> = [];
                    const allShotCharacters = new Set<string>();
                    explicitCharacters.forEach(charId => allShotCharacters.add(charId));
                    Object.values(shotMappings || {}).forEach(mapping => {
                      if (mapping && mapping !== '__ignore__') {
                        if (Array.isArray(mapping)) {
                          mapping.forEach(charId => allShotCharacters.add(charId));
                        } else {
                          allShotCharacters.add(mapping);
                        }
                      }
                    });
                    (finalSelectedCharactersForShots[shot.slot] || []).forEach(charId => allShotCharacters.add(charId));
                    const isOffFrameForDisplay = finalSelectedDialogueWorkflow === 'off-frame-voiceover' && activeTab === 'advanced';
                    if (isOffFrameForDisplay) {
                      if (finalOffFrameShotType === 'off-frame') allShotCharacters.delete(shot.characterId);
                      if (finalOffFrameListenerCharacterId && finalOffFrameShotType && isOffFrameListenerShotType(finalOffFrameShotType as OffFrameShotType)) allShotCharacters.add(finalOffFrameListenerCharacterId);
                      if (finalOffFrameShotType && isOffFrameGroupShotType(finalOffFrameShotType as OffFrameShotType) && (finalOffFrameGroupCharacterIds?.length ?? 0) > 0) finalOffFrameGroupCharacterIds.forEach((id: string) => allShotCharacters.add(id));
                    } else {
                      if (finalOffFrameListenerCharacterId) allShotCharacters.delete(finalOffFrameListenerCharacterId);
                      (finalOffFrameGroupCharacterIds || []).forEach((id: string) => allShotCharacters.delete(id));
                    }
                    allShotCharacters.forEach(charId => {
                      const char = allCharacters.find(c => c.id === charId);
                      if (char) {
                        const charRef = finalSelectedCharacterReferences[shot.slot]?.[charId];
                        if (charRef && (charRef.imageUrl || charRef.s3Key)) {
                          let imageUrl = charRef.imageUrl;
                          if (!imageUrl && charRef.s3Key && finalCharacterHeadshots[charId]) {
                            const headshot = finalCharacterHeadshots[charId].find(h => h.s3Key === charRef.s3Key);
                            if (headshot?.imageUrl) imageUrl = headshot.imageUrl;
                          }
                          if (imageUrl) references.push({ type: 'character', imageUrl, label: char.name || `Character ${charId}`, id: `char-${charId}` });
                        }
                      }
                    });
                    const locationRef = finalSelectedLocationReferences[shot.slot];
                    if (locationRef) {
                      const location = finalSceneProps.find(loc => loc.id === shot.locationId);
                      const locationImageUrl = resolveLocationImageUrl(locationRef, { thumbnailS3KeyMap: null, thumbnailUrlsMap: null, fullImageUrlsMap: locationReferenceFullImageUrlsMap || propImageUrlsMap });
                      if (locationImageUrl) references.push({ type: 'location', imageUrl: locationImageUrl, label: location?.name || 'Location', id: `loc-${shot.slot}` });
                    }
                    const shotPropsForThisShot = finalSceneProps.filter(prop => finalPropsToShots[prop.id]?.includes(shot.slot));
                    shotPropsForThisShot.forEach(prop => {
                      const propConfig = finalShotProps[shot.slot]?.[prop.id];
                      const availableImages = getAvailablePropImages(prop);
                      const selectedImageId = propConfig?.selectedImageId || (availableImages.length > 0 ? availableImages[0].id : undefined);
                      const selectedImage = selectedImageId ? availableImages.find(img => img.id === selectedImageId) : availableImages[0];
                      if (selectedImage) {
                        const fullProp = prop as typeof prop & { angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>; images?: Array<{ url: string; s3Key?: string }>; baseReference?: { s3Key?: string; imageUrl?: string } };
                        let imageS3Key: string | null = null;
                        if (fullProp.angleReferences) { const ref = fullProp.angleReferences.find(r => r.id === selectedImage.id); if (ref?.s3Key) imageS3Key = ref.s3Key; }
                        if (!imageS3Key && fullProp.images) { const imgData = fullProp.images.find(i => i.url === selectedImage.id || i.s3Key === selectedImage.id); if (imgData?.s3Key) imageS3Key = imgData.s3Key; }
                        if (!imageS3Key && fullProp.baseReference?.s3Key && selectedImage.label === 'Creation Image (Last Resort)') imageS3Key = fullProp.baseReference.s3Key;
                        if (!imageS3Key && selectedImage.id && (selectedImage.id.startsWith('asset/') || selectedImage.id.includes('/'))) imageS3Key = selectedImage.id;
                        let displayUrl: string | undefined;
                        if (imageS3Key) {
                          if (finalPropThumbnailS3KeyMap?.has(imageS3Key)) { const thumbnailS3Key = finalPropThumbnailS3KeyMap.get(imageS3Key); if (thumbnailS3Key && propThumbnailUrlsMap?.has(thumbnailS3Key)) displayUrl = propThumbnailUrlsMap.get(thumbnailS3Key); }
                          if (!displayUrl && propImageUrlsMap?.has(imageS3Key)) displayUrl = propImageUrlsMap.get(imageS3Key);
                        }
                        if (!displayUrl && selectedImage.imageUrl) {
                          if (selectedImage.imageUrl.startsWith('http')) displayUrl = selectedImage.imageUrl;
                          else if (propImageUrlsMap?.has(selectedImage.imageUrl)) displayUrl = propImageUrlsMap.get(selectedImage.imageUrl);
                        }
                        if (!displayUrl) displayUrl = fullProp.baseReference?.imageUrl || prop.imageUrl;
                        if (displayUrl) references.push({ type: 'prop', imageUrl: displayUrl, label: prop.name, id: `prop-${prop.id}` });
                      }
                    });
                    return references.length > 0 ? <ReferencePreview references={references} className="mt-2 mb-3" /> : null;
                  })()}
                </>
              )}
            </>
          )}

          {/* Override First Frame – for action shots and Narrate Shot only. Plan 0234: HIDDEN for lip-sync dialogue (use Motion Direction instead). */}
          {!uploadedFirstFrameUrl && isOverrideAllowed && (
            <div className="mt-4 pt-3 border-t border-[#3F3F46]">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id={`first-frame-override-${shotSlot}`}
                  checked={firstFrameOverrideCheckboxRef.current || firstFrameOverrideEnabledFromContext || !!finalFirstFramePromptOverride}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    // 🔥 FIX Issue 1: Update ref synchronously before async context update
                    // This ensures validation can read the current state immediately
                    firstFrameOverrideCheckboxRef.current = isChecked;
                    actions.updateFirstFrameOverrideEnabled(shotSlot, isChecked);
                    if (!isChecked) actions.updateFirstFramePromptOverride(shotSlot, '');
                  }}
                  className="w-4 h-4 rounded border-[#3F3F46] bg-[#1A1A1A] text-[#DC143C] focus:ring-2 focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor={`first-frame-override-${shotSlot}`} className="text-xs font-medium text-[#FFFFFF] cursor-pointer">Override First Frame</label>
              </div>
              {(firstFrameOverrideEnabledFromContext || !!finalFirstFramePromptOverride) && (
                <div className="space-y-3 mt-3">
                  {/* Feature 0234: Variable Chips - show available variables from selected references */}
                  {(() => {
                    const availableVariables: Array<{ label: string; variable: string; type: 'character' | 'location' | 'prop' }> = [];
                    
                    // Character references - get all characters for this shot
                    const allShotCharacters = new Set<string>();
                    explicitCharacters.forEach(charId => allShotCharacters.add(charId));
                    Object.values(shotMappings || {}).forEach(mapping => {
                      if (mapping && mapping !== '__ignore__') {
                        if (Array.isArray(mapping)) {
                          mapping.forEach(charId => allShotCharacters.add(charId));
                        } else {
                          allShotCharacters.add(mapping);
                        }
                      }
                    });
                    (finalSelectedCharactersForShots[shotSlot] || []).forEach((charId: string) => allShotCharacters.add(charId));
                    
                    // Filter to only those with selected references
                    const charactersWithRefs = Array.from(allShotCharacters).filter(charId => 
                      finalSelectedCharacterReferences[shotSlot]?.[charId]
                    );
                    
                    charactersWithRefs.forEach((charId, index) => {
                      const char = allCharacters.find((c: any) => c.id === charId);
                      if (char) {
                        availableVariables.push({
                          label: char.name || `Character ${index + 1}`,
                          variable: `{{character${index + 1}}}`,
                          type: 'character'
                        });
                      }
                    });
                    
                    // Location reference (label from scene props/location list when available, else shot or fallback)
                    if (finalSelectedLocationReferences[shotSlot]) {
                      const locationItem = finalSceneProps?.find((loc: any) => loc.id === shot.locationId);
                      const shotData = sceneAnalysisResult?.shotBreakdown?.shots?.find((s: any) => s.slot === shotSlot);
                      const locationLabel = (shotData as { locationDescription?: string } | undefined)?.locationDescription;
                      availableVariables.push({
                        label: locationItem?.name || locationLabel || 'Location',
                        variable: '{{location}}',
                        type: 'location'
                      });
                    }
                    
                    // Prop references
                    const shotPropsForThisShot = (finalSceneProps || []).filter((prop: any) => 
                      finalPropsToShots[prop.id]?.includes(shotSlot)
                    );
                    shotPropsForThisShot.forEach((prop: any, index: number) => {
                      if (finalShotProps[shotSlot]?.[prop.id]?.selectedImageId) {
                        availableVariables.push({
                          label: prop.name || `Prop ${index + 1}`,
                          variable: `{{prop${index + 1}}}`,
                          type: 'prop'
                        });
                      }
                    });
                    
                    return availableVariables.length > 0 ? (
                      <div className="mb-3 p-3 bg-[#0A0A0A] border border-[#3F3F46] rounded">
                        <label className="block text-[10px] text-[#808080] mb-2 font-medium">
                          Available Variables (from selected references):
                        </label>
                        <div className="space-y-1.5">
                          {availableVariables.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <code className="px-2 py-0.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-[#DC143C] font-mono text-[11px]">
                                {item.variable}
                              </code>
                              <span className="text-[#FFFFFF]">=</span>
                              <span className="text-[#808080]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[9px] text-[#808080] italic mt-2">
                          Use these variables in your prompt. Only references with variables will be included.
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 p-3 bg-[#0A0A0A] border border-[#3F3F46] rounded">
                        <div className="text-[10px] text-[#808080] italic">
                          No references selected. Select characters, location, or props above to create variables.
                        </div>
                      </div>
                    );
                  })()}
                  <label className="block text-[10px] text-[#808080] mb-1.5">First Frame Prompt (Image Model)</label>
                  <textarea
                    ref={firstFrameTextareaRef}
                    value={finalFirstFramePromptOverride || ''}
                    onChange={(e) => finalOnFirstFramePromptOverrideChange(shotSlot, e.target.value)}
                    placeholder="Enter custom prompt for first frame generation. Use variables like {{character1}}, {{location}}, {{prop1}} to include references."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors resize-none font-mono"
                  />
                  <div className="text-[10px] text-[#808080] italic">This prompt will be used instead of the auto-generated prompt. Only references with variables will be included.</div>
                </div>
              )}
            </div>
          )}

          {/* Video Generation Selection – only when dialogue shot has video opt-in. */}
          {onVideoTypeChange && isDialogueShot && videoOptInForThisShot && (
            <>
              {isDialogueShot && videoOptInForThisShot && onVideoTypeChange && (
                <VideoGenerationSelector
                  shotSlot={shot.slot}
                  shotType={shot.type}
                  selectedVideoType={selectedVideoTypes[shot.slot]}
                  onVideoTypeChange={finalOnVideoTypeChange}
                  shotCameraAngle={shotCameraAngle}
                  onCameraAngleChange={finalOnCameraAngleChange}
                  shotDuration={shotDuration}
                  onDurationChange={finalOnDurationChange}
                  isLipSyncWorkflow={true}
                />
              )}
            </>
          )}

          {/* Single separator then Aspect ratio + Estimated Cost (fewer lines under Add Dialogue Video) */}
          <div className="border-t border-[#3F3F46]">
            {onAspectRatioChange && (
              <div className="pt-2">
                <label className="block text-[10px] text-[#808080] mb-1.5">Output aspect ratio (image &amp; video)</label>
                <AspectRatioSelector
                  value={shotAspectRatio || '16:9'}
                  onChange={(value) => finalOnAspectRatioChange(shot.slot, value as '16:9' | '9:16' | '1:1' | '21:9' | '9:21')}
                />
              </div>
            )}

            {/* Cost Calculator - Explicit: first frame only vs first frame + video */}
            {pricing && (
              <div className="pt-3">
                <div className="text-xs font-medium text-[#FFFFFF] mb-2">Estimated Cost</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#808080]">Reference Shot (first frame):</span>
                    <span className="text-[#FFFFFF] font-medium">{pricing.firstFramePrice} credits</span>
                  </div>
                  {(isDialogueShot && videoOptInForThisShot) && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#808080]">Video (720p or 1080p by workflow):</span>
                        <span className="text-[#FFFFFF] font-medium">{pricing.hdPrice} credits</span>
                      </div>
                      <div className="pt-2 border-t border-[#3F3F46]">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-[#FFFFFF]">Charged: First frame + video</span>
                          <span className="text-[#FFFFFF]">
                            {pricing.firstFramePrice + pricing.hdPrice} credits
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {(!isDialogueShot || !videoOptInForThisShot) && (
                    <div className="pt-2 border-t border-[#3F3F46]">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-[#FFFFFF]">Charged: First frame only</span>
                        <span className="text-[#FFFFFF]">{pricing.firstFramePrice} credits</span>
                      </div>
                      {isDialogueShot && (
                        <div className="text-[10px] text-[#808080] italic mt-1">
                          Check &quot;Add lip-sync video&quot; above to include video cost
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-[10px] text-[#808080] italic mt-1">
                    Final resolution selected on review page
                  </div>
                </div>
              </div>
            )}
          </div>
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

