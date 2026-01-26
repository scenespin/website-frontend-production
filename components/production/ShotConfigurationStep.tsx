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
  selectedReferenceShotModel?: Record<number, 'nano-banana-pro' | 'flux2-max-4k-16:9'>;
  onReferenceShotModelChange?: (shotSlot: number, model: 'nano-banana-pro' | 'flux2-max-4k-16:9') => void;
  // Video Generation Selection
  selectedVideoType?: Record<number, VideoType>;
  onVideoTypeChange?: (shotSlot: number, videoType: VideoType) => void;
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
  const finalFirstFramePromptOverride = state.firstFramePromptOverrides[shotSlot];
  const finalVideoPromptOverride = state.videoPromptOverrides[shotSlot];
  const uploadedFirstFrameUrl = state.uploadedFirstFrames[shotSlot];
  
  // Track if prompt override is enabled for this shot (local state for UI)
  const [isPromptOverrideEnabled, setIsPromptOverrideEnabled] = useState(
    !!(finalFirstFramePromptOverride || finalVideoPromptOverride)
  );
  
  // Track first frame mode: 'generate' (default) or 'upload'
  const [firstFrameMode, setFirstFrameMode] = useState<'generate' | 'upload'>(
    uploadedFirstFrameUrl ? 'upload' : 'generate'
  );
  
  // Track upload state
  const [isUploadingFirstFrame, setIsUploadingFirstFrame] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sync local state when context state changes
  useEffect(() => {
    setIsPromptOverrideEnabled(!!(finalFirstFramePromptOverride || finalVideoPromptOverride));
  }, [finalFirstFramePromptOverride, finalVideoPromptOverride]);
  
  // Sync first frame mode when uploaded first frame changes
  useEffect(() => {
    if (uploadedFirstFrameUrl) {
      setFirstFrameMode('upload');
    }
  }, [uploadedFirstFrameUrl]);
  
  // Get projectId from prop (passed from SceneBuilderPanel)
  // This is the screenplay/project ID, not the scene ID
  const screenplayId = projectId || '';
  
  // Handle first frame file upload (uses compression utility)
  const handleFirstFrameUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // No size limit - compression utility handles it
    setIsUploadingFirstFrame(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');
      
      // Use compression API endpoint (handles compression and upload)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('screenplayId', screenplayId);
      formData.append('maxSizeBytes', (10 * 1024 * 1024).toString()); // 10MB default
      
      const response = await fetch('/api/first-frame/upload-and-compress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }
      
      const { imageUrl, s3Key } = await response.json();
      
      // Store in context
      actions.updateUploadedFirstFrame(shotSlot, imageUrl);
      
      // Clear first frame prompt override (not needed when uploading)
      actions.updateFirstFramePromptOverride(shotSlot, '');
      
      toast.success('First frame uploaded and compressed successfully!');
    } catch (error: any) {
      console.error('[ShotConfigurationStep] First frame upload failed:', error);
      toast.error('Failed to upload first frame', {
        description: error?.message || 'Unknown error'
      });
    } finally {
      setIsUploadingFirstFrame(false);
    }
  }, [screenplayId, getToken, shotSlot, actions]);
  
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
  
  // 🔥 FIX: Initialize default video type when shot is first accessed (for action/establishing shots)
  useEffect(() => {
    // Only initialize for action/establishing shots that need video type selection
    if ((shot.type === 'action' || shot.type === 'establishing') && onVideoTypeChange) {
      const currentVideoType = selectedVideoTypes[shotSlot];
      // If no video type is set, default to 'cinematic-visuals'
      if (!currentVideoType) {
        onVideoTypeChange(shotSlot, 'cinematic-visuals');
      }
    }
  }, [shot.slot, shot.type, selectedVideoTypes, onVideoTypeChange]);
  
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
  
  const finalOnFirstFramePromptOverrideChange = useCallback((shotSlot: number, prompt: string) => {
    actions.updateFirstFramePromptOverride(shotSlot, prompt);
  }, [actions]);
  
  const finalOnVideoPromptOverrideChange = useCallback((shotSlot: number, prompt: string) => {
    actions.updateVideoPromptOverride(shotSlot, prompt);
  }, [actions]);
  
  const finalOnReferenceShotModelChange = useCallback((shotSlot: number, model: 'nano-banana-pro' | 'flux2-max-4k-16:9') => {
    actions.updateReferenceShotModel(shotSlot, model);
  }, [actions]);
  
  const finalOnVideoTypeChange = useCallback((shotSlot: number, videoType: 'cinematic-visuals' | 'natural-motion') => {
    actions.updateVideoType(shotSlot, videoType);
  }, [actions]);
  
  const finalOnAspectRatioChange = useCallback((shotSlot: number, aspectRatio: '16:9' | '9:16' | '1:1') => {
    actions.updateShotAspectRatio(shotSlot, aspectRatio);
  }, [actions]);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pricing, setPricing] = useState<{ hdPrice: number; k4Price: number; firstFramePrice: number } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const firstFrameTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Determine if this is a dialogue shot (only dialogue shots have tabs)
  const isDialogueShot = shot.type === 'dialogue';
  
  // 🔥 NEW: Clear character references when switching to non-lip-sync tab or workflow
  // Non-lip-sync workflows generate their own first frame, so they don't need character references from lip-sync
  // 🔥 FIX: Use ref to track last state to prevent infinite loops
  const lastTabWorkflowRef = React.useRef<{ tab: string; workflow?: string }>({ tab: 'basic' });
  React.useEffect(() => {
    if (!isDialogueShot || !onCharacterReferenceChange) return;
    
    const isNonLipSyncTab = activeTab === 'advanced';
    const isNonLipSyncWorkflow = finalSelectedDialogueWorkflow === 'scene-voiceover' || finalSelectedDialogueWorkflow === 'off-frame-voiceover';
    const currentState = { tab: activeTab, workflow: finalSelectedDialogueWorkflow };
    const lastState = lastTabWorkflowRef.current;
    
    // Only clear if we're switching TO non-lip-sync (not if we're already there)
    const wasNonLipSync = lastState.tab === 'advanced' || lastState.workflow === 'scene-voiceover' || lastState.workflow === 'off-frame-voiceover';
    const isNowNonLipSync = isNonLipSyncTab || isNonLipSyncWorkflow;
    
    // Only clear if we just switched to non-lip-sync (not if we're already there)
    if (isNowNonLipSync && !wasNonLipSync) {
      const shotRefs = selectedCharacterReferences[shot.slot];
      if (shotRefs && Object.keys(shotRefs).length > 0) {
        // Clear all character references for this shot
        Object.keys(shotRefs).forEach(characterId => {
          onCharacterReferenceChange(shot.slot, characterId, undefined);
        });
      }
    }
    
    // Update ref to track current state
    lastTabWorkflowRef.current = currentState;
  }, [activeTab, finalSelectedDialogueWorkflow, isDialogueShot, shot.slot, onCharacterReferenceChange]);
  
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
  }, [shot?.slot, shot?.credits, shotDuration, selectedReferenceShotModels, selectedVideoTypes, getToken, shot.slot]);

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
    
    // 3. Validate video type selection (required for action/establishing shots)
    if ((shot.type === 'action' || shot.type === 'establishing') && onVideoTypeChange) {
      const currentVideoType = selectedVideoTypes[shotSlot];
      if (!currentVideoType) {
        validationErrors.push('Video model selection required. Please select "Cinematic Visuals" or "Natural Motion" in the Video Generation section.');
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
                  characterThumbnailS3KeyMap={characterThumbnailS3KeyMap}
                  characterThumbnailUrlsMap={characterThumbnailUrlsMap}
                  selectedReferenceFullImageUrlsMap={selectedReferenceFullImageUrlsMap}
                  visibleHeadshotFullImageUrlsMap={visibleHeadshotFullImageUrlsMap}
                  locationThumbnailS3KeyMap={locationThumbnailS3KeyMap} // 🔥 NEW: Pass location URL maps
                  locationThumbnailUrlsMap={locationThumbnailUrlsMap}
                  locationFullImageUrlsMap={locationFullImageUrlsMap}
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
                  propThumbnailUrlsMap={propThumbnailUrlsMap}
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
                  characterThumbnailS3KeyMap={characterThumbnailS3KeyMap}
                  characterThumbnailUrlsMap={characterThumbnailUrlsMap}
                  selectedReferenceFullImageUrlsMap={selectedReferenceFullImageUrlsMap}
                  visibleHeadshotFullImageUrlsMap={visibleHeadshotFullImageUrlsMap}
                  locationThumbnailS3KeyMap={locationThumbnailS3KeyMap} // 🔥 NEW: Pass location URL maps
                  locationThumbnailUrlsMap={locationThumbnailUrlsMap}
                  locationFullImageUrlsMap={locationFullImageUrlsMap}
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
                  propThumbnailUrlsMap={propThumbnailUrlsMap}
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
                if (locationRef) {
                  const location = finalSceneProps.find(loc => loc.id === shot.locationId);
                  
                  // 🔥 FIX: Use standardized URL resolution utility with proper location URL map
                  const locationImageUrl = resolveLocationImageUrl(
                    locationRef,
                    {
                      thumbnailS3KeyMap: null, // Location references don't use thumbnail maps in references section
                      thumbnailUrlsMap: null,
                      fullImageUrlsMap: locationReferenceFullImageUrlsMap || propImageUrlsMap // 🔥 FIX: Use location map first, prop map as fallback
                    }
                  );
                  
                  // Only add if we have a valid URL
                  if (locationImageUrl) {
                    references.push({
                      type: 'location',
                      imageUrl: locationImageUrl,
                      label: location?.name || 'Location',
                      id: `loc-${shot.slot}`
                    });
                  }
                }
                
                // 🔥 FIX: Prop references - show all props with their actual images (not generic icon)
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
                    
                    // 🔥 FIX: Also check if selectedImage.id is the s3Key itself
                    if (!imageS3Key && selectedImage.id && (selectedImage.id.startsWith('asset/') || selectedImage.id.includes('/'))) {
                      imageS3Key = selectedImage.id;
                    }
                    
                    // Get presigned URL from maps (thumbnail first, then full image)
                    let displayUrl: string | undefined;
                    if (imageS3Key) {
                      // Try thumbnail first
                      if (finalPropThumbnailS3KeyMap?.has(imageS3Key)) {
                        const thumbnailS3Key = finalPropThumbnailS3KeyMap.get(imageS3Key);
                        if (thumbnailS3Key && propThumbnailUrlsMap?.has(thumbnailS3Key)) {
                          displayUrl = propThumbnailUrlsMap.get(thumbnailS3Key);
                        }
                      }
                      // Fallback to full image
                      if (!displayUrl && propImageUrlsMap?.has(imageS3Key)) {
                        displayUrl = propImageUrlsMap.get(imageS3Key);
                      }
                    }
                    // 🔥 FIX: If displayUrl is still empty, try selectedImage.imageUrl
                    // It might already be a presigned URL or a direct URL
                    if (!displayUrl && selectedImage.imageUrl) {
                      // Check if it's already a URL (starts with http) or might be an s3Key
                      if (selectedImage.imageUrl.startsWith('http')) {
                        displayUrl = selectedImage.imageUrl;
                      } else if (propImageUrlsMap?.has(selectedImage.imageUrl)) {
                        // It's an s3Key that's in the map
                        displayUrl = propImageUrlsMap.get(selectedImage.imageUrl);
                      }
                    }
                    // Final fallback to baseReference or prop.imageUrl
                    if (!displayUrl) {
                      displayUrl = fullProp.baseReference?.imageUrl || prop.imageUrl;
                    }
                    
                    // 🔥 FIX: Add to references if we have a display URL
                    // If displayUrl is an s3Key (not a URL), it will fail to load, but that's okay
                    // The onError handler in ReferencePreview will show the fallback icon
                    if (displayUrl) {
                      references.push({
                        type: 'prop',
                        imageUrl: displayUrl,
                        label: prop.name,
                        id: `prop-${prop.id}`
                      });
                    }
                  }
                });
                
                return references.length > 0 ? (
                  <ReferencePreview references={references} className="mt-2 mb-3" />
                ) : null;
              })()}
            </>
          )}

          {/* Video Generation Selection */}
          {/* Show for action shots OR dialogue non-lip-sync shots */}
          {onVideoTypeChange && (
            <>
              <VideoGenerationSelector
                shotSlot={shot.slot}
                shotType={shot.type}
                selectedVideoType={selectedVideoTypes[shot.slot]}
                onVideoTypeChange={finalOnVideoTypeChange}
                shotCameraAngle={shotCameraAngle}
                onCameraAngleChange={finalOnCameraAngleChange}
                shotDuration={shotDuration}
                onDurationChange={finalOnDurationChange}
                isLipSyncWorkflow={(() => {
                  // Default to 'first-frame-lipsync' if no workflow is selected (basic tab defaults to lip-sync)
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

          {/* Prompt Override Section */}
          <div className="mt-4 pt-3 border-t border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id={`prompt-override-${shotSlot}`}
                checked={isPromptOverrideEnabled || !!(finalFirstFramePromptOverride || finalVideoPromptOverride)}
                onChange={(e) => {
                  setIsPromptOverrideEnabled(e.target.checked);
                  if (!e.target.checked) {
                    // Clear both overrides when unchecked
                    actions.updateFirstFramePromptOverride(shotSlot, '');
                    actions.updateVideoPromptOverride(shotSlot, '');
                  }
                }}
                className="w-4 h-4 rounded border-[#3F3F46] bg-[#1A1A1A] text-[#DC143C] focus:ring-2 focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
              />
              <label 
                htmlFor={`prompt-override-${shotSlot}`}
                className="text-xs font-medium text-[#FFFFFF] cursor-pointer"
              >
                Override Prompts
              </label>
            </div>
            
            {(isPromptOverrideEnabled || finalFirstFramePromptOverride || finalVideoPromptOverride) && (
              <div className="space-y-3">
                {/* Available Variables Display - Shows selected references as ready-to-use variables */}
                {(() => {
                  // Collect available references for this shot (reuse same logic)
                  const availableVariables: Array<{ label: string; variable: string; type: 'character' | 'location' | 'prop' }> = [];
                  
                  // Character references (need to get all characters for this shot, including explicit and pronoun-mapped)
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
                  (finalSelectedCharactersForShots[shotSlot] || []).forEach(charId => allShotCharacters.add(charId));
                  
                  // Convert to array and filter to only those with references
                  const charactersWithRefs = Array.from(allShotCharacters).filter(charId => 
                    finalSelectedCharacterReferences[shotSlot]?.[charId]
                  );
                  
                  charactersWithRefs.forEach((charId, index) => {
                    const char = allCharacters.find(c => c.id === charId);
                    if (char) {
                      availableVariables.push({
                        label: char.name || `Character ${index + 1}`,
                        variable: `{{character${index + 1}}}`,
                        type: 'character'
                      });
                    }
                  });
                  
                  // Location reference
                  if (finalSelectedLocationReferences[shotSlot]) {
                    const location = finalSceneProps.find(loc => loc.id === shot.locationId);
                    availableVariables.push({
                      label: location?.name || 'Location',
                      variable: '{{location}}',
                      type: 'location'
                    });
                  }
                  
                  // Prop references
                  const shotPropsForThisShot = finalSceneProps.filter(prop => 
                    finalPropsToShots[prop.id]?.includes(shotSlot)
                  );
                  shotPropsForThisShot.forEach((prop, index) => {
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
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs"
                          >
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
                
                {/* First Frame Mode Selection */}
                <div className="mb-3">
                  <label className="block text-[10px] text-[#808080] mb-2 font-medium">
                    First Frame Source:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`first-frame-mode-${shotSlot}`}
                        value="generate"
                        checked={firstFrameMode === 'generate'}
                        onChange={() => handleFirstFrameModeChange('generate')}
                        className="w-4 h-4 border-[#3F3F46] bg-[#1A1A1A] text-[#DC143C] focus:ring-2 focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-[#FFFFFF]">Generate First Frame</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`first-frame-mode-${shotSlot}`}
                        value="upload"
                        checked={firstFrameMode === 'upload'}
                        onChange={() => handleFirstFrameModeChange('upload')}
                        className="w-4 h-4 border-[#3F3F46] bg-[#1A1A1A] text-[#DC143C] focus:ring-2 focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-[#FFFFFF]">Upload First Frame</span>
                    </label>
                  </div>
                </div>
                
                {/* First Frame Upload UI (when mode is 'upload') */}
                {firstFrameMode === 'upload' && (
                  <div className="mb-3">
                    <label className="block text-[10px] text-[#808080] mb-1.5">
                      Upload First Frame Image:
                    </label>
                    {uploadedFirstFrameUrl ? (
                      <div className="relative">
                        <img
                          src={uploadedFirstFrameUrl}
                          alt="Uploaded first frame"
                          className="w-full h-32 object-cover rounded border border-[#3F3F46]"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveUploadedFirstFrame}
                          className="absolute top-2 right-2 p-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded hover:bg-[#2A2A2A] hover:border-[#DC143C] transition-colors"
                          title="Remove uploaded first frame"
                        >
                          <X className="w-4 h-4 text-[#FFFFFF]" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#3F3F46] rounded bg-[#0A0A0A] p-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                          disabled={isUploadingFirstFrame}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingFirstFrame}
                          className={cn(
                            "w-full flex flex-col items-center justify-center gap-2 py-4 px-4 rounded transition-colors",
                            isUploadingFirstFrame
                              ? "bg-[#1A1A1A] border border-[#3F3F46] cursor-not-allowed"
                              : "bg-[#1A1A1A] border border-[#3F3F46] hover:bg-[#2A2A2A] hover:border-[#DC143C] cursor-pointer"
                          )}
                        >
                          {isUploadingFirstFrame ? (
                            <>
                              <Loader2 className="w-5 h-5 text-[#DC143C] animate-spin" />
                              <span className="text-xs text-[#808080]">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-[#808080]" />
                              <span className="text-xs text-[#FFFFFF]">Choose Image</span>
                              <span className="text-[10px] text-[#808080]">Any size (auto-compressed if needed)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    <div className="text-[10px] text-[#808080] italic mt-1">
                      Upload your own first frame image. Only video prompt is needed for generation.
                    </div>
                  </div>
                )}
                
                {/* First Frame Prompt Override (when mode is 'generate') */}
                {firstFrameMode === 'generate' && (
                  <div>
                    <label className="block text-[10px] text-[#808080] mb-1.5">
                      First Frame Prompt (Image Model):
                    </label>
                    <textarea
                      ref={firstFrameTextareaRef}
                      value={finalFirstFramePromptOverride || ''}
                      onChange={(e) => finalOnFirstFramePromptOverrideChange(shotSlot, e.target.value)}
                      placeholder="Enter custom prompt for first frame generation (image model)... Use variables like {{character1}}, {{location}}, {{prop1}} to include references."
                      rows={3}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors resize-none font-mono"
                    />
                    <div className="text-[10px] text-[#808080] italic mt-1">
                      This prompt will be used instead of the auto-generated prompt. Only references with variables (e.g., {'{{character1}}'}) will be included.
                    </div>
                  </div>
                )}
                
                {/* Video Prompt Override */}
                <div>
                  <label className="block text-[10px] text-[#808080] mb-1.5">
                    Video Prompt (Video Model):
                  </label>
                  <textarea
                    value={finalVideoPromptOverride || ''}
                    onChange={(e) => finalOnVideoPromptOverrideChange(shotSlot, e.target.value)}
                    placeholder="Enter custom prompt for video generation (video model)..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] placeholder-[#808080] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors resize-none"
                  />
                  <div className="text-[10px] text-[#808080] italic mt-1">
                    This prompt will be used instead of the auto-generated prompt for video generation.
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    <span className="text-[#FFFFFF]">
                      {pricing.firstFramePrice + pricing.hdPrice} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium mt-1">
                    <span className="text-[#FFFFFF]">4K Total:</span>
                    <span className="text-[#FFFFFF]">
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

