'use client';

/**
 * image.pngimage.pngCharacterDetailModal - Full-screen character detail view
 * 
 * Features:
 * - Image gallery (main + references)
 * - Description and info from script
 * - Uploaded images management
 * - Advanced options
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, User, FileText, Box, Download, Trash2, Plus, Camera, Info, MoreVertical, Eye, CheckSquare, Square, Volume2, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CharacterProfile } from './types';
import { toast } from 'sonner';
import { PerformanceControls, type PerformanceSettings } from '../characters/PerformanceControls';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCharacters } from '@/hooks/useCharacterBank';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { useThumbnailMapping, type GalleryImage } from '@/hooks/useThumbnailMapping';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { useIsMobile } from '@/hooks/use-mobile';
import { RegenerateConfirmModal } from './RegenerateConfirmModal';
import { VoiceAssignmentTab } from './VoiceAssignmentTab';
import { VoiceBrowserModal } from './VoiceBrowserModal';
import { CustomVoiceForm } from './CustomVoiceForm';
import { CharacterPoseCropModal } from './CharacterPoseCropModal';
import { ModernGallery } from './Gallery/ModernGallery';
import { UploadWardrobeTab } from './Coverage/UploadWardrobeTab';
import { GenerateWardrobeTab } from './Coverage/GenerateWardrobeTab';

/**
 * Get display label for provider ID
 */
function getProviderLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  
  const providerMap: Record<string, string> = {
    'nano-banana-pro': 'Nano Banana Pro',
    'runway-gen4-image': 'Gen4',
    'luma-photon-1': 'Photon',
    'luma-photon-flash': 'Photon',
    'flux2-max-4k-16:9': 'FLUX.2 [max]',
    'flux2-pro-4k': 'FLUX.2 [pro]',
    'flux2-pro-2k': 'FLUX.2 [pro]',
    'flux2-flex': 'FLUX.2 [flex]',
  };
  
  return providerMap[providerId] || null;
}


interface CharacterDetailModalProps {
  character: CharacterProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (characterId: string, updates: Partial<CharacterProfile>) => void;
  onDelete?: (characterId: string) => void;
  // Removed projectId prop - screenplayId comes from ScreenplayContext
  onUploadImage?: (characterId: string, file: File) => Promise<void>;
  onGenerateVariations?: (characterId: string) => Promise<void>;
  onGeneratePosePackage?: (characterId: string) => void;
  hasAdvancedFeatures?: boolean;
  performanceSettings?: PerformanceSettings;
  onPerformanceSettingsChange?: (settings: PerformanceSettings) => void;
}

export function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onUploadImage,
  onGenerateVariations,
  onGeneratePosePackage,
  hasAdvancedFeatures = false,
  performanceSettings,
  onPerformanceSettingsChange
}: CharacterDetailModalProps) {
  const { getToken } = useAuth();
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { updateCharacter, characters: contextCharacters, isEntityInScript } = screenplay; // Still needed for arcStatus, physicalAttributes, arcNotes, and script locking
  const { state: editorState } = useEditor();
  const queryClient = useQueryClient(); // 🔥 NEW: For invalidating Media Library cache
  const isMobile = useIsMobile();
  
  // 🔥 FIX: Use React Query hook directly to get latest characters (same as CharacterBankPanel)
  const { data: queryCharacters = [] } = useCharacters(
    screenplayId || '',
    'production-hub',
    !!screenplayId && isOpen // Only fetch when modal is open
  );
  
  // 🔥 FIX: Use query characters for images, context characters for script fields
  const latestCharacter = queryCharacters.find(c => c.id === character.id) || character;
  const contextCharacter = contextCharacters.find(c => c.id === character.id);
  
  // Check if character is in script (for locking mechanism)
  const isInScript = useMemo(() => {
    return contextCharacter ? isEntityInScript(editorState.content, contextCharacter.name, 'character') : false;
  }, [contextCharacter, editorState.content, isEntityInScript]);
  
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references' | 'voice'>('references');
  const [coverageTab, setCoverageTab] = useState<'upload' | 'generate' | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null); // 🔥 NEW: Track selected image by ID for Gallery section
  const [isUploading, setIsUploading] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [previewGroupName, setPreviewGroupName] = useState<string | null>(null);
  // Phase 2: Multiple Delete Checkbox
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  // 🔥 NEW: Regeneration state
  const [regeneratePose, setRegeneratePose] = useState<{ poseId: string; s3Key: string } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingS3Key, setRegeneratingS3Key] = useState<string | null>(null); // Track which specific image is regenerating
  // 🔥 NEW: Crop modal state
  const [cropPose, setCropPose] = useState<{ poseId: string; poseS3Key: string } | null>(null);
  // Voice Profile Management (Feature 0152)
  const [voiceProfile, setVoiceProfile] = useState<any | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [showVoiceBrowser, setShowVoiceBrowser] = useState(false);
  const [showCustomVoiceForm, setShowCustomVoiceForm] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [prefilledVoiceId, setPrefilledVoiceId] = useState<string | undefined>(undefined);
  
  // 🔥 READ-ONLY: Get values from contextCharacter for display only (no editing)
  const displayName = contextCharacter?.name || character.name;
  const displayDescription = contextCharacter?.description || character.description || '';
  const displayType = contextCharacter?.type || character.type;
  const displayArcStatus = contextCharacter?.arcStatus || 'introduced';
  const displayArcNotes = contextCharacter?.arcNotes || '';
  const displayPhysicalAttributes = contextCharacter?.physicalAttributes || {
    height: undefined,
    bodyType: undefined,
    eyeColor: undefined,
    hairColor: undefined,
    hairLength: undefined,
    hairStyle: undefined,
    typicalClothing: undefined
  };
  
  // 🔥 CRITICAL: Early return AFTER all hooks are called
  if (!screenplayId) {
    return null;
  }

  // Helper function for downloading images via blob (more reliable than download attribute)
  // Follows MediaLibrary pattern: fetches fresh presigned URL if s3Key available
  // 🔥 NEW: Handle pose regeneration
  const handleRegeneratePose = async (poseId: string, existingPoseS3Key: string) => {
    if (!poseId || !existingPoseS3Key) {
      toast.error('Missing pose information for regeneration');
      return;
    }

    // 🔥 CRITICAL: Set regenerating state IMMEDIATELY before any async operations
    // This ensures the UI updates synchronously before the fetch starts
    const s3KeyToTrack = existingPoseS3Key.trim();
    console.log('[CharacterDetailModal] Starting regeneration for s3Key:', s3KeyToTrack);
    setIsRegenerating(true);
    setRegeneratingS3Key(s3KeyToTrack); // Track which image is regenerating - set BEFORE closing modal
    setRegeneratePose(null); // Close modal AFTER state is set
    console.log('[CharacterDetailModal] Set regeneratingS3Key to:', s3KeyToTrack);
    
    // 🔥 FIX: Find the pose reference to get metadata (providerId, quality)
    const rawPoseRefs = (latestCharacter as any).angleReferences || latestCharacter.poseReferences || [];
    const poseRef = rawPoseRefs.find((ref: any) => {
      const refS3Key = typeof ref === 'string' ? ref : (ref.s3Key || ref.metadata?.s3Key || '');
      return refS3Key.trim() === s3KeyToTrack;
    });
    const poseMetadata = typeof poseRef === 'object' && poseRef ? poseRef.metadata : null;
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      const response = await fetch(`${BACKEND_API_URL}/api/projects/${screenplayId}/characters/${character.id}/regenerate-pose`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poseId,
          existingPoseS3Key,
          // 🔥 FIX: Send providerId and quality from stored metadata if available
          providerId: poseMetadata?.providerId || undefined,
          quality: poseMetadata?.quality || 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to regenerate pose: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Immediately refetch to update UI (like assets do)
      // 🔥 FIX: Use invalidateQueries first to mark as stale, then refetch (same as assets)
      queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] }),
        queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] })
      ]);
      
      // Note: onUpdate callback signature is different from assets, so we rely on query refetch
      // The parent component (CharacterBankPanel) will get updated character from query
      
      // 🔥 FIX: Keep shimmer effect visible for a moment after refetch completes
      // This ensures the user sees the shimmer even after the new image loads
      setTimeout(() => {
        setIsRegenerating(false);
        setRegeneratingS3Key(null); // Clear regenerating state after a brief delay
      }, 500); // 500ms delay to show shimmer effect
    } catch (error: any) {
      console.error('[CharacterDetailModal] Failed to regenerate pose:', error);
      toast.error(`Failed to regenerate pose: ${error.message || 'Unknown error'}`);
      setIsRegenerating(false);
      setRegeneratingS3Key(null); // Clear on error immediately
    }
  };

  const downloadImageAsBlob = async (imageUrl: string, filename: string, s3Key?: string) => {
    try {
      let downloadUrl = imageUrl;
      
      // If we have an s3Key, fetch a fresh presigned URL (like MediaLibrary does)
      if (s3Key) {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) throw new Error('Not authenticated');
          
          const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
          const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 3600, // 1 hour
            }),
          });
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to generate presigned URL: ${presignedResponse.status}`);
          }
          
          const presignedData = await presignedResponse.json();
          downloadUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[CharacterDetailModal] Failed to get presigned URL, using original URL:', error);
          // Fall back to original imageUrl if presigned URL fetch fails
        }
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      console.error('[CharacterDetailModal] Failed to download image:', error);
      throw error;
    }
  };
  
  /**
   * Extract outfit name from S3 key path
   * Path format: temp/images/{userId}/{screenplayId}/character/{characterId}/outfits/{outfitName}/poses/{uuid}.png
   */
  const extractOutfitFromS3Key = (s3Key: string | undefined): string => {
    if (!s3Key) return 'default';
    const parts = s3Key.split('/');
    const outfitsIndex = parts.indexOf('outfits');
    if (outfitsIndex >= 0 && outfitsIndex + 1 < parts.length) {
      return parts[outfitsIndex + 1];
    }
    return 'default';
  };
  
  type PoseReferenceWithOutfit = {
    id: string;
    imageUrl: string;
    s3Key?: string;
    label: string;
    isBase: boolean;
    isPose: boolean;
    outfitName: string;
    index: number;
    poseId?: string; // Pose definition ID for regeneration
    isRegenerated?: boolean; // 🔥 NEW: Track if this is a regenerated pose
    regeneratedFrom?: string; // 🔥 NEW: Track which pose this regenerated from (s3Key)
    metadata?: any; // Preserve metadata for deletion logic
  };
  
  
  // 🔥 FIX: Query Media Library to get actual outfit folder names
  // Media Library organizes as: Characters/[Character Name]/Outfits/[Outfit Name]/
  // Always call the hook (React rules), but disable the query when modal is closed or screenplayId is missing
  // 🔥 FIX: Use empty string as fallback for hook call (React requires consistent hook calls)
  // 🔥 FIX: Filter by character entityType and entityId for efficient querying (only loads files for this character)
  // 🔥 FIX: If entity query returns 0 files, fallback to querying all files (GSI might not be active or old files don't have entityType/entityId)
  const { data: entityMediaFiles = [] } = useMediaFiles(
    screenplayId || '', 
    undefined, 
    isOpen && !!screenplayId, 
    true, // includeAllFolders: true (needed to get files from outfit folders)
    'character', // entityType: filter to character files only
    character.id // entityId: filter to this specific character
  );
  
  // Fallback: If entity query returns 0 files, try querying all files (for old files without entityType/entityId)
  const { data: allMediaFiles = [] } = useMediaFiles(
    screenplayId || '', 
    undefined, 
    isOpen && !!screenplayId && entityMediaFiles.length === 0, // Only query if entity query returned 0
    true, // includeAllFolders: true
    undefined, // No entityType filter
    undefined // No entityId filter
  );
  
  // Use entity files and merge with fallback to catch any files missed by GSI (e.g., newly uploaded files not yet indexed)
  const mediaFiles = useMemo(() => {
    // Start with entity files (from GSI query - most efficient)
    const entityS3Keys = new Set(entityMediaFiles.map((f: any) => f.s3Key).filter(Boolean));
    
    // Fallback: Filter all files by checking metadata OR s3Key pattern
    // Character files can be in: temp/images/.../character/{characterId}/... OR temp/images/.../uploads/... (with entityType/entityId in metadata)
    const characterIdPattern = `character/${character.id}/`;
    const filtered = allMediaFiles.filter((file: any) => {
      if (!file.s3Key) return false;
      // Skip thumbnail files (they're stored separately)
      if (file.s3Key.startsWith('thumbnails/')) return false;
      // Skip files already in entity results (avoid duplicates)
      if (entityS3Keys.has(file.s3Key)) return false;
      
      // Check entityType/entityId - backend stores them at top level (for GSI) AND in metadata
      const entityType = (file as any).entityType || file.metadata?.entityType;
      const entityId = (file as any).entityId || file.metadata?.entityId;
      if (entityType === 'character' && entityId === character.id) {
        return true;
      }
      // Fallback: Check s3Key pattern (for AI-generated files in character/.../outfits/...)
      return file.s3Key.includes(characterIdPattern);
    });
    
    // Merge entity files with fallback results
    return [...entityMediaFiles, ...filtered];
  }, [entityMediaFiles, allMediaFiles, character.id, isOpen]);
  
  // Extract outfit names from Media Library folder paths
  const mediaLibraryOutfitNames = useMemo(() => {
    const outfitSet = new Set<string>();
    const characterName = character.name;
    
    // 🔥 NEW: Normalize outfit name to handle case sensitivity and separator differences
    const normalizeOutfitName = (name: string): string => {
      if (!name) return '';
      // Normalize: lowercase, replace underscores/spaces with consistent format, trim
      return name
        .toLowerCase()
        .replace(/[_\s]+/g, '_') // Replace spaces and multiple underscores with single underscore
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .trim();
    };
    
    mediaFiles.forEach((file: any) => {
      // Check if file belongs to this character
      const metadata = file.metadata || {};
      if (metadata.entityType === 'character' && metadata.entityId === character.id) {
        // Extract outfit from folderPath: ['Characters', 'Character Name', 'Outfits', 'Outfit Name']
        if (file.folderPath && Array.isArray(file.folderPath)) {
          const outfitsIndex = file.folderPath.indexOf('Outfits');
          if (outfitsIndex >= 0 && outfitsIndex + 1 < file.folderPath.length) {
            const outfitName = file.folderPath[outfitsIndex + 1];
            if (outfitName && outfitName !== 'Outfits') {
              // 🔥 FIX: Normalize before adding to prevent duplicates
              const normalized = normalizeOutfitName(outfitName);
              if (normalized) {
                // Store original name but use normalized for deduplication
                // We'll use a Map to preserve the original casing for display
                outfitSet.add(normalized);
              }
            }
          }
        }
        // Also check metadata.outfitName (from pose generation)
        if (metadata.outfitName) {
          // 🔥 FIX: Normalize before adding to prevent duplicates
          const normalized = normalizeOutfitName(metadata.outfitName);
          if (normalized) {
            outfitSet.add(normalized);
          }
        }
      }
    });
    
    return Array.from(outfitSet);
  }, [mediaFiles, latestCharacter.id, latestCharacter.name]);
  
  // Selected outfit tab state - null means show all outfits
  // 🔥 FIX: Use separate state for Gallery vs References tabs to prevent conflicts
  const [selectedOutfitGallery, setSelectedOutfitGallery] = useState<string | null>(null);
  const [selectedOutfitReferences, setSelectedOutfitReferences] = useState<string | null>(null);
  
  // 🔥 PHASE 1: Media Library as Primary Source
  // Build image list from Media Library files FIRST, then enrich with DynamoDB metadata
  
  // Create maps for efficient lookup
  const mediaFileMap = useMemo(() => {
    // Map s3Key -> MediaFile for quick lookup
    const map = new Map<string, any>();
    mediaFiles.forEach((file: any) => {
      if (file.s3Key && !file.s3Key.startsWith('thumbnails/')) {
        map.set(file.s3Key, file);
      }
    });
    return map;
  }, [mediaFiles]);
  
  const thumbnailS3KeyMap = useMemo(() => {
    // Map s3Key -> thumbnailS3Key from Media Library
    const map = new Map<string, string>();
    mediaFiles.forEach((file: any) => {
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
      }
    });
    return map;
  }, [mediaFiles]);
  
  // Create metadata map from character prop (DynamoDB) for enrichment
  const dynamoDBMetadataMap = useMemo(() => {
    const map = new Map<string, any>();
    
    // Add baseReference metadata
    if (character.baseReference?.s3Key) {
      map.set(character.baseReference.s3Key, {
        id: 'base',
        label: 'Base Reference',
        isBase: true,
        isPose: false,
        referenceType: 'base',
        generationMethod: 'upload'
      });
    }
    
    // Add references metadata
    (character.references || []).forEach((ref: any) => {
      const s3Key = ref.s3Key || ref.metadata?.s3Key;
      if (s3Key) {
        map.set(s3Key, {
          id: ref.id,
          label: ref.label || 'Reference',
          isBase: false,
          isPose: false,
          referenceType: ref.referenceType || 'custom',
          generationMethod: ref.generationMethod || 'upload'
        });
      }
    });
    
    // Add poseReferences metadata (from DynamoDB)
    const rawPoseRefs = (character as any).angleReferences || character.poseReferences || [];
    rawPoseRefs.forEach((ref: any, idx: number) => {
      const refS3Key = typeof ref === 'string' ? ref : (ref.s3Key || ref.metadata?.s3Key || '');
      if (refS3Key) {
        const refObj = typeof ref === 'string' ? null : ref;
        map.set(refS3Key, {
          id: refObj?.id || `pose-${idx}`,
          label: (typeof ref === 'string' ? 'Pose' : ref.label) || refObj?.metadata?.poseName || 'Pose',
          isBase: false,
          isPose: true,
          outfitName: refObj?.outfitName || refObj?.metadata?.outfitName || extractOutfitFromS3Key(refS3Key) || 'default',
          poseId: refObj?.poseId || refObj?.metadata?.poseId,
          isRegenerated: refObj?.metadata?.isRegenerated || false,
          regeneratedFrom: refObj?.metadata?.regeneratedFrom,
          metadata: refObj?.metadata || {}
        });
      }
    });
    
    return map;
  }, [character.baseReference, character.references, character.poseReferences]);
  
  // 🔥 NEW: Build images from Media Library FIRST (primary source), enrich with DynamoDB metadata
  const imagesFromMediaLibrary = useMemo(() => {
    const images: Array<{
      id: string;
      imageUrl: string; // Will be generated from s3Key
      s3Key: string;
      label: string;
      isBase: boolean;
      isPose: boolean;
      outfitName?: string;
      outfitNameOriginal?: string; // Original outfit name for display
      poseId?: string;
      isRegenerated?: boolean;
      regeneratedFrom?: string;
      metadata?: any;
      index: number;
    }> = [];
    
    let index = 0;
    
    // Process Media Library files
    mediaFiles.forEach((file: any) => {
      if (!file.s3Key || file.s3Key.startsWith('thumbnails/')) return;
      
      // 🔥 FIX: Exclude clothing references from gallery and references tab
      // Clothing references are stored in folders like "Clothing_Reference" or "Clothing References"
      // They should be saved in the archive but not displayed in the gallery
      if (file.folderPath && Array.isArray(file.folderPath)) {
        const isClothingReference = file.folderPath.some((folder: string) => 
          folder && (
            folder.toLowerCase().includes('clothing') && 
            (folder.toLowerCase().includes('reference') || folder.toLowerCase().includes('ref'))
          )
        );
        if (isClothingReference) {
          return; // Skip clothing references
        }
      }
      
      // Also check metadata for clothing reference indicator
      if (file.metadata?.isClothingReference === true || 
          file.metadata?.referenceType === 'clothing' ||
          file.fileName?.toLowerCase().includes('clothing_reference') ||
          file.fileName?.toLowerCase().includes('clothing-reference')) {
        return; // Skip clothing references
      }
      
      // Get metadata from DynamoDB (character prop)
      const dynamoMetadata = dynamoDBMetadataMap.get(file.s3Key);
      
      // 🔥 Determine if image is from Creation section
      // Creation images are identified by Media Library metadata ONLY (source of truth)
      // createdIn: 'creation' or uploadMethod: 'character-creation'
      const isFromCreation = file.metadata?.createdIn === 'creation' || 
                            file.metadata?.uploadMethod === 'character-creation';
      
      // Determine image type from Media Library metadata or DynamoDB
      // 🔥 FIX: If image is from Creation section, it's NOT a pose
      const isPose = isFromCreation ? false : (
        file.metadata?.source === 'pose-generation' || 
        file.metadata?.uploadMethod === 'pose-generation' ||
        (dynamoMetadata?.isPose ?? false)
      );
      const isBase = dynamoMetadata?.isBase ?? false;
      
      // Get label from DynamoDB metadata or Media Library
      const label = dynamoMetadata?.label || 
                    file.fileName?.replace(/\.[^/.]+$/, '') || 
                    'Image';
      
      // Get outfit from DynamoDB metadata or Media Library folder
      // 🔥 FIX: Store both original and normalized outfit name
      let outfitNameOriginal = dynamoMetadata?.outfitName;
      if (!outfitNameOriginal && file.folderPath && Array.isArray(file.folderPath)) {
        const outfitsIndex = file.folderPath.indexOf('Outfits');
        if (outfitsIndex >= 0 && outfitsIndex + 1 < file.folderPath.length) {
          outfitNameOriginal = file.folderPath[outfitsIndex + 1];
        }
      }
      if (!outfitNameOriginal) {
        outfitNameOriginal = file.metadata?.outfitName || extractOutfitFromS3Key(file.s3Key) || 'default';
      }
      
      // Normalize outfit name for matching (but preserve original for display)
      const normalizeOutfitName = (name: string): string => {
        if (!name) return '';
        return name
          .toLowerCase()
          .replace(/[_\s]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .trim();
      };
      const outfitName = normalizeOutfitName(outfitNameOriginal);
      
      // 🔥 FIX: Use s3Key as stable ID if no DynamoDB ID found (for newly uploaded images)
      // This ensures uploaded images are clickable even before DynamoDB metadata is available
      const stableId = dynamoMetadata?.id || 
                       file.metadata?.referenceId || 
                       `ref_${file.s3Key?.replace(/[^a-zA-Z0-9]/g, '_')}` || 
                       `img-${index}`;
      
      images.push({
        id: stableId,
        imageUrl: '', // Will be generated from s3Key via presigned URL
        s3Key: file.s3Key,
        label,
        isBase,
        isPose,
        outfitName, // Normalized for matching
        outfitNameOriginal: outfitNameOriginal, // Original for display
        poseId: dynamoMetadata?.poseId,
        isRegenerated: dynamoMetadata?.isRegenerated,
        regeneratedFrom: dynamoMetadata?.regeneratedFrom,
        metadata: { ...file.metadata, ...dynamoMetadata?.metadata, outfitNameOriginal },
        index
      });
    });
    
    return images;
  }, [mediaFiles, dynamoDBMetadataMap]);
  
  // Generate presigned URLs for Media Library images
  const mediaLibraryS3Keys = useMemo(() => 
    imagesFromMediaLibrary.map(img => img.s3Key).filter(Boolean),
    [imagesFromMediaLibrary]
  );
  
  const { data: mediaLibraryUrls = new Map() } = useBulkPresignedUrls(
    mediaLibraryS3Keys.length > 0 ? mediaLibraryS3Keys : [],
    isOpen && mediaLibraryS3Keys.length > 0
  );
  
  // Enrich Media Library images with presigned URLs
  const enrichedMediaLibraryImages = useMemo(() => {
    return imagesFromMediaLibrary.map(img => ({
      ...img,
      imageUrl: mediaLibraryUrls.get(img.s3Key) || img.imageUrl || '' // Use Media Library URL, fallback to empty
    }));
  }, [imagesFromMediaLibrary, mediaLibraryUrls]);
  
  // 🔥 FALLBACK: Use character prop images if not in Media Library (for backward compatibility)
  const fallbackImages = useMemo(() => {
    const fallback: Array<{
      id: string;
      imageUrl: string;
      s3Key: string;
      label: string;
      isBase: boolean;
      isPose: boolean;
      outfitName?: string;
      poseId?: string;
      isRegenerated?: boolean;
      regeneratedFrom?: string;
      metadata?: any;
      index: number;
    }> = [];
    const mediaLibraryS3KeysSet = new Set(mediaLibraryS3Keys);
    
    // Check baseReference
    if (character.baseReference?.s3Key && !mediaLibraryS3KeysSet.has(character.baseReference.s3Key)) {
      fallback.push({
        id: 'base',
        imageUrl: character.baseReference.imageUrl || '',
        s3Key: character.baseReference.s3Key,
        label: 'Base Reference',
        isBase: true,
        isPose: false,
        index: 0
      });
    }
    
    // Check references
    (character.references || []).forEach((ref: any, idx: number) => {
      const refS3Key = ref.s3Key || ref.metadata?.s3Key;
      if (refS3Key && !mediaLibraryS3KeysSet.has(refS3Key)) {
        fallback.push({
          id: ref.id || `ref-${idx}`,
          imageUrl: ref.imageUrl || '',
          s3Key: refS3Key,
          label: ref.label || 'Reference',
          isBase: false,
          isPose: false,
          index: fallback.length
        });
      }
    });
    
    // Check poseReferences
    const rawPoseRefs = (character as any).angleReferences || character.poseReferences || [];
    rawPoseRefs.forEach((ref: any, idx: number) => {
      const refS3Key = typeof ref === 'string' ? ref : (ref.s3Key || ref.metadata?.s3Key || '');
      if (refS3Key && !mediaLibraryS3KeysSet.has(refS3Key)) {
        const refObj = typeof ref === 'string' ? null : ref;
        const outfitFromMetadata = refObj?.metadata?.outfitName;
        const outfitFromS3 = extractOutfitFromS3Key(refS3Key);
        const outfitName = outfitFromMetadata || outfitFromS3 || 'default';
        
        fallback.push({
          id: refObj?.id || `pose-${idx}`,
          imageUrl: typeof ref === 'string' ? '' : (ref.imageUrl || ''),
          s3Key: refS3Key,
          label: (typeof ref === 'string' ? 'Pose' : ref.label) || refObj?.metadata?.poseName || 'Pose',
          isBase: false,
          isPose: true,
          outfitName,
          poseId: refObj?.poseId || refObj?.metadata?.poseId,
          isRegenerated: refObj?.metadata?.isRegenerated || false,
          regeneratedFrom: refObj?.metadata?.regeneratedFrom,
          metadata: refObj?.metadata || {},
          index: fallback.length
        });
      }
    });
    
    return fallback;
  }, [character.baseReference, character.references, character.poseReferences, mediaLibraryS3Keys]);
  
  // Generate presigned URLs for fallback images that have s3Key but expired imageUrl
  const fallbackS3Keys = useMemo(() => 
    fallbackImages
      .filter(img => img.s3Key && (!img.imageUrl || !img.imageUrl.startsWith('http')))
      .map(img => img.s3Key)
      .filter(Boolean),
    [fallbackImages]
  );
  
  const { data: fallbackUrls = new Map() } = useBulkPresignedUrls(
    fallbackS3Keys.length > 0 ? fallbackS3Keys : [],
    isOpen && fallbackS3Keys.length > 0
  );
  
  // Enrich fallback images with presigned URLs
  const enrichedFallbackImages = useMemo(() => {
    return fallbackImages.map(img => ({
      ...img,
      imageUrl: img.s3Key && fallbackUrls.has(img.s3Key) 
        ? fallbackUrls.get(img.s3Key) || img.imageUrl || ''
        : img.imageUrl || ''
    }));
  }, [fallbackImages, fallbackUrls]);
  
  // 🔥 COMBINED: Media Library images (primary) + Fallback images (from character prop)
  const allImages = useMemo(() => {
    // Prioritize Media Library images, then add fallback images
    return [...enrichedMediaLibraryImages, ...enrichedFallbackImages];
  }, [enrichedMediaLibraryImages, enrichedFallbackImages]);
  
  // Keep old userReferences and poseReferences for backward compatibility (used in other parts of code)
  // 🔥 MEDIA LIBRARY AS SOURCE OF TRUTH: Filter for creation section images using Media Library metadata only
  // Creation section images are identified by Media Library metadata: createdIn: 'creation' or uploadMethod: 'character-creation'
  // DynamoDB arrays (character.references) are only used for metadata enrichment (labels, etc.), not for identification
  const userReferences = useMemo(() => {
    return allImages.filter(img => {
      // 🔥 MEDIA LIBRARY AS SOURCE OF TRUTH: Use Media Library metadata to identify creation images
      const isFromCreation = img.metadata?.createdIn === 'creation' || 
                            img.metadata?.uploadMethod === 'character-creation';
      
      // Must be identified as creation image by Media Library metadata
      if (!isFromCreation) {
        return false;
      }
      
      // Exclude poses and base references (these shouldn't be in references, but double-check)
      if (img.isPose || img.isBase) return false;
      
      // 🔥 FIX: Exclude images from Outfits folder (these are Production Hub generated poses)
      // Production Hub images are in: Characters/{Name}/Outfits/{Outfit Name}/
      // Creation section images are in: Characters/{Name}/References/ or root character folder
      if (img.s3Key) {
        const s3KeyLower = img.s3Key.toLowerCase();
        // Exclude if in Outfits folder (Production Hub)
        if (s3KeyLower.includes('/outfits/')) {
          return false;
        }
      }
      
      // 🔥 FIX: Exclude clothing references from creation images
      // Check if image is a clothing reference by checking metadata or s3Key
      if (img.metadata?.isClothingReference === true || 
          img.metadata?.referenceType === 'clothing' ||
          img.s3Key?.toLowerCase().includes('clothing_reference') ||
          img.s3Key?.toLowerCase().includes('clothing-reference') ||
          img.label?.toLowerCase().includes('clothing reference')) {
        return false;
      }
      
      return true;
    });
  }, [allImages]);
  
  const poseReferences: PoseReferenceWithOutfit[] = useMemo(() => {
    const userRefsCount = allImages.filter(img => !img.isPose && !img.isBase).length;
    return allImages
      .filter(img => img.isPose)
      .map((img, idx) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        s3Key: img.s3Key,
        label: img.label,
        isBase: false,
        isPose: true,
        outfitName: img.outfitName || 'default',
        index: userRefsCount + idx,
        poseId: img.poseId,
        isRegenerated: img.isRegenerated,
        regeneratedFrom: img.regeneratedFrom,
        metadata: img.metadata || {}
      }));
  }, [allImages]);
  
  // 🔥 NEW: Group poses by outfit, and pair regenerated poses with originals
  const posesByOutfit = useMemo(() => {
    // 🔥 FIX: Normalize outfit names for grouping
    const normalizeOutfitName = (name: string): string => {
      if (!name) return '';
      return name
        .toLowerCase()
        .replace(/[_\s]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .trim();
    };
    
    const grouped: Record<string, PoseReferenceWithOutfit[]> = {};
    
    // First, separate original poses from regenerated ones
    const originalPoses: PoseReferenceWithOutfit[] = [];
    const regeneratedPoses: PoseReferenceWithOutfit[] = [];
    
    poseReferences.forEach(pose => {
      if (pose.isRegenerated && pose.regeneratedFrom) {
        regeneratedPoses.push(pose);
      } else {
        originalPoses.push(pose);
      }
    });
    
    // Group original poses by outfit, and add regenerated versions right after each original
    originalPoses.forEach(pose => {
      const outfit = normalizeOutfitName(pose.outfitName || 'default');
      if (!grouped[outfit]) {
        grouped[outfit] = [];
      }
      grouped[outfit].push(pose);
      
      // Find and add any regenerated versions of this pose right after it
      const regeneratedVersions = regeneratedPoses.filter(r => r.regeneratedFrom === pose.s3Key);
      if (regeneratedVersions.length > 0) {
        grouped[outfit].push(...regeneratedVersions);
      }
    });
    
    // Add any regenerated poses that don't have a matching original (shouldn't happen, but safety)
    regeneratedPoses.forEach(regenerated => {
      if (!originalPoses.some(orig => orig.s3Key === regenerated.regeneratedFrom)) {
        const outfit = normalizeOutfitName(regenerated.outfitName || 'default');
        if (!grouped[outfit]) {
          grouped[outfit] = [];
        }
        grouped[outfit].push(regenerated);
      }
    });
    
    return grouped;
  }, [poseReferences]);
  
  // Get outfit names sorted (default first, then alphabetically)
  // Combine Media Library folder names with posesByOutfit keys
  const outfitNames = useMemo(() => {
    // 🔥 NEW: Normalize outfit name to handle case sensitivity and separator differences
    const normalizeOutfitName = (name: string): string => {
      if (!name) return '';
      // Normalize: lowercase, replace underscores/spaces with consistent format, trim
      return name
        .toLowerCase()
        .replace(/[_\s]+/g, '_') // Replace spaces and multiple underscores with single underscore
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .trim();
    };
    
    const allOutfits = new Set<string>();
    
    // Add outfits from Media Library folders (already normalized in mediaLibraryOutfitNames)
    mediaLibraryOutfitNames.forEach(outfit => {
      const normalized = normalizeOutfitName(outfit);
      if (normalized) allOutfits.add(normalized);
    });
    
    // Add outfits from posesByOutfit (from pose metadata) - normalize them too
    Object.keys(posesByOutfit).forEach(outfit => {
      const normalized = normalizeOutfitName(outfit);
      if (normalized) allOutfits.add(normalized);
    });
    
    const outfits = Array.from(allOutfits);
    const defaultOutfit = outfits.find(o => o === 'default' || o.toLowerCase() === 'default');
    const otherOutfits = outfits.filter(o => o !== 'default' && o.toLowerCase() !== 'default').sort();
    return defaultOutfit ? [defaultOutfit, ...otherOutfits] : otherOutfits;
  }, [posesByOutfit, mediaLibraryOutfitNames, isOpen, poseReferences.length]);
  
  // 🔥 IMPROVED: Use reusable hook for thumbnail mapping (single source of truth)
  const { galleryImages, thumbnailsLoading } = useThumbnailMapping({
    thumbnailS3KeyMap,
    images: allImages,
    isOpen,
    getThumbnailS3KeyFromMetadata: (img) => (img as any).metadata?.thumbnailS3Key || null,
    getImageSource: (img) => {
      // 🔥 FIX: Check generationMethod first to correctly identify uploaded vs AI-generated
      // Uploaded images have generationMethod: 'upload', AI-generated have 'generate' or 'pose-generation'
      const method = (img as any).metadata?.generationMethod || (img as any).generationMethod;
      
      // If generationMethod is explicitly 'upload', it's a user upload
      if (method === 'upload') {
        return 'user-upload';
      }
      
      // If generationMethod is 'generate', 'pose-generation', 'ai-generated', or 'angle-variation', it's AI-generated
      if (method === 'generate' || method === 'pose-generation' || method === 'ai-generated' || method === 'angle-variation') {
        return 'pose-generation';
      }
      
      // Fallback: Check isPose flag (for backward compatibility)
      // But prioritize generationMethod if available
      if (img.isPose && !method) {
        return 'pose-generation';
      }
      
      // 🔥 FIX: If not a pose and no generation method, it's a user upload
      // Check if it's explicitly marked as AI-generated in metadata
      if (img.isPose === false && !method) {
        return 'user-upload';
      }
      
      // Default to user-upload for uploaded images (when no method specified)
      return 'user-upload';
    },
    getOutfitName: (img) => (img as any).outfitName || 'default',
    defaultAspectRatio: { width: 4, height: 3 }
  });
  
  // 🔥 NEW: Use thumbnail mapping for References tab (poseReferences)
  const { galleryImages: referenceGalleryImages } = useThumbnailMapping({
    thumbnailS3KeyMap,
    images: poseReferences,
    isOpen: isOpen && activeTab === 'references',
    getThumbnailS3KeyFromMetadata: (img) => (img as any).metadata?.thumbnailS3Key || null,
    getImageSource: () => 'pose-generation', // All poseReferences are AI-generated
    getOutfitName: (img) => img.outfitName || 'default',
    defaultAspectRatio: { width: 4, height: 3 }
  });
  
  // 🔥 NEW: Create a map for quick lookup of thumbnail URLs by image ID
  const referenceThumbnailMap = useMemo(() => {
    const map = new Map<string, string>();
    referenceGalleryImages.forEach((galleryImg) => {
      map.set(galleryImg.id, galleryImg.thumbnailUrl || galleryImg.imageUrl);
    });
    return map;
  }, [referenceGalleryImages]);
  
  // Filter gallery images by outfit
  // 🔥 FIX: Normalize both sides when comparing outfit names
  const filteredGalleryImages = useMemo(() => {
    if (!selectedOutfitGallery) return galleryImages;
    const normalizeOutfitName = (name: string): string => {
      if (!name) return '';
      return name
        .toLowerCase()
        .replace(/[_\s]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .trim();
    };
    const normalizedSelected = normalizeOutfitName(selectedOutfitGallery);
    return galleryImages.filter(img => {
      const imgOutfit = img.outfitName || 'default';
      const normalizedImgOutfit = normalizeOutfitName(imgOutfit);
      return normalizedImgOutfit === normalizedSelected;
    });
  }, [galleryImages, selectedOutfitGallery]);
  
  // 🔥 CRITICAL: Don't render until screenplayId is available (after all hooks are called)
  if (!screenplayId) {
    return null;
  }

  // Headshot angle labels for multiple headshots (matching Create section)
  const headshotAngles = [
    { value: 'front', label: 'Front View' },
    { value: 'side', label: 'Side Profile' },
    { value: 'three-quarter', label: '3/4 Angle' }
  ];
  
  // Fetch voice profile for character (Feature 0152)
  const fetchVoiceProfile = async () => {
    if (!screenplayId || !character.id) return;
    
    setIsLoadingVoice(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/${character.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch voice profile');
      }

      const data = await response.json();
      if (data.success) {
        setVoiceProfile(data.voiceProfile);
      } else {
        setVoiceProfile(null);
      }
    } catch (error: any) {
      console.error('Error fetching voice profile:', error);
      setVoiceProfile(null);
    } finally {
      setIsLoadingVoice(false);
    }
  };

  // Fetch voice profile when modal opens or character changes (Feature 0152)
  useEffect(() => {
    if (isOpen && screenplayId && character.id) {
      // Reset voice profile when character changes
      setVoiceProfile(null);
      setIsLoadingVoice(false);
      // Fetch voice profile for the current character
      fetchVoiceProfile();
    }
  }, [isOpen, screenplayId, character.id]);

  // Get character demographics for voice browser (Feature 0152)
  const getCharacterDemographics = () => {
    const physicalAttributes = character.physicalAttributes || {};
    const metadata = (character as any).metadata || {};
    
    return {
      gender: (physicalAttributes as any).gender || metadata.gender || 'unknown',
      age: (physicalAttributes as any).age || metadata.age || 'unknown',
      accent: metadata.accent || undefined,
    };
  };

  // Handle custom voice form submission (Feature 0152)
  const handleCustomVoiceSubmit = async (formData: {
    elevenLabsApiKey: string;
    elevenLabsVoiceId: string;
    voiceName: string;
    rightsConfirmed: boolean;
  }) => {
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId: character.id,
            projectId: screenplayId,
            elevenLabsApiKey: formData.elevenLabsApiKey,
            elevenLabsVoiceId: formData.elevenLabsVoiceId,
            voiceName: formData.voiceName,
            rightsConfirmed: formData.rightsConfirmed,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create voice profile');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Voice profile created successfully!');
        fetchVoiceProfile(); // Refresh voice profile
      } else {
        throw new Error(data.error || 'Create failed');
      }
    } catch (error: any) {
      console.error('Custom voice creation error:', error);
      throw error; // Re-throw to let CustomVoiceForm handle the error display
    }
  };

  // Handle voice selection from browser (Feature 0152)
  const handleVoiceSelected = async (voiceId: string, voiceName: string, isCustom?: boolean) => {
    // When a voice is selected from browser, use /select endpoint
    // For custom voices, it will use the existing API key from voice profiles
    // For premade voices, it uses platform API key
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/voice-profile/select`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId: character.id,
            screenplayId: screenplayId,
            voiceId: voiceId,
            isCustom: isCustom || false, // Pass isCustom flag to backend
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to select voice');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Voice "${voiceName}" assigned successfully!`);
        fetchVoiceProfile(); // Refresh voice profile
        setShowVoiceBrowser(false); // Close browser modal
      } else {
        throw new Error(data.error || 'Voice selection failed');
      }
    } catch (error: any) {
      console.error('Voice selection error:', error);
      toast.error(error.message || 'Failed to select voice');
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, angle?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onUploadImage) {
      toast.error('Upload functionality not available');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadImage(character.id, file);
      toast.success(`Image uploaded successfully${angle ? ` (${headshotAngles.find(a => a.value === angle)?.label || angle})` : ''}`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#DC143C]/10 rounded-lg">
                  <User className="w-6 h-6 text-[#DC143C]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#FFFFFF]">{displayName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-[#808080] capitalize">
                      {displayType} character
                      {isInScript && <span className="ml-2 text-[#6B7280]">(locked - appears in script)</span>}
                    </p>
                    {/* 🔥 READ-ONLY BADGE */}
                    <span className="px-2 py-0.5 bg-[#6B7280]/20 border border-[#6B7280]/50 rounded text-[10px] text-[#9CA3AF]">
                      Read-only - Edit in Creation section
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 px-4 md:px-6 py-3 border-b border-[#3F3F46] bg-[#141414]">
              {isMobile ? (
                // Mobile: Dropdown menu
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-lg text-white text-sm font-medium transition-colors">
                      <div className="flex items-center gap-2">
                        {coverageTab === 'upload' ? (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload Wardrobe</span>
                          </>
                        ) : coverageTab === 'generate' ? (
                          <>
                            <span className="text-base">🤖</span>
                            <span>Generate Wardrobe</span>
                          </>
                        ) : activeTab === 'info' ? (
                          <>
                            <FileText className="w-4 h-4" />
                            <span>Info</span>
                          </>
                        ) : activeTab === 'references' ? (
                          <>
                            <Box className="w-4 h-4" />
                            <span>References ({allImages.length})</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>Voice</span>
                            {voiceProfile && <span className="text-xs text-green-400">●</span>}
                          </>
                        )}
                      </div>
                      <MoreVertical className="w-4 h-4 text-[#808080]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm bg-[#1F1F1F] border-[#3F3F46]">
                    {/* Main Tabs */}
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveTab('info');
                        setCoverageTab(null);
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        activeTab === 'info' && !coverageTab
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-[#808080] hover:bg-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Info</span>
                      {activeTab === 'info' && !coverageTab && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveTab('references');
                        setCoverageTab(null);
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        activeTab === 'references' && !coverageTab
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-[#808080] hover:bg-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      <Box className="w-4 h-4" />
                      <span>References ({allImages.length})</span>
                      {activeTab === 'references' && !coverageTab && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                    {/* Coverage buttons - prioritized near References */}
                    <div className="border-t border-[#3F3F46] my-1"></div>
                    <DropdownMenuItem
                      onClick={() => {
                        setCoverageTab('upload');
                        setActiveTab('references');
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        coverageTab === 'upload'
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-white hover:bg-[#2A2A2A]'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Wardrobe</span>
                      {coverageTab === 'upload' && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                    {onGeneratePosePackage && (
                      <DropdownMenuItem
                        onClick={() => {
                          setCoverageTab('generate');
                          setActiveTab('references');
                        }}
                        className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          coverageTab === 'generate'
                            ? 'bg-[#DC143C]/20 text-white'
                            : 'text-white hover:bg-[#2A2A2A]'
                        }`}
                      >
                        <span className="text-base">🤖</span>
                        <span>Generate Wardrobe</span>
                        {coverageTab === 'generate' && (
                          <span className="ml-auto text-[#DC143C]">●</span>
                        )}
                      </DropdownMenuItem>
                    )}
                    <div className="border-t border-[#3F3F46] my-1"></div>
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveTab('voice');
                        setCoverageTab(null);
                        if (!voiceProfile && !isLoadingVoice) {
                          fetchVoiceProfile();
                        }
                      }}
                      className={`min-h-[44px] flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        activeTab === 'voice' && !coverageTab
                          ? 'bg-[#DC143C]/20 text-white'
                          : 'text-[#808080] hover:bg-[#2A2A2A] hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Voice</span>
                      {voiceProfile && (
                        <span className="ml-2 text-xs text-green-400">●</span>
                      )}
                      {activeTab === 'voice' && !coverageTab && (
                        <span className="ml-auto text-[#DC143C]">●</span>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Desktop: Horizontal tabs
                <div className="flex items-center gap-2">
                  {/* Left side: Standard tabs */}
                  <button
                    onClick={() => {
                      setActiveTab('info');
                      setCoverageTab(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'info' && !coverageTab
                        ? 'bg-[#DC143C] text-white'
                        : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Info
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('references');
                      setCoverageTab(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'references' && !coverageTab
                        ? 'bg-[#DC143C] text-white'
                        : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Box className="w-4 h-4 inline mr-2" />
                    References ({allImages.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('voice');
                      setCoverageTab(null);
                      if (!voiceProfile && !isLoadingVoice) {
                        fetchVoiceProfile();
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'voice' && !coverageTab
                        ? 'bg-[#DC143C] text-white'
                        : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 inline mr-2" />
                    Voice
                    {voiceProfile && (
                      <span className={`ml-2 text-xs ${activeTab === 'voice' && !coverageTab ? 'opacity-75' : 'text-green-400'}`}>●</span>
                    )}
                  </button>
                  
                  {/* Right side: Coverage buttons */}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCoverageTab('upload');
                        setActiveTab('references'); // Keep references as active tab for context
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        coverageTab === 'upload'
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF]'
                      }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload Wardrobe
                    </button>
                    {onGeneratePosePackage && (
                      <button
                        onClick={() => {
                          setCoverageTab('generate');
                          setActiveTab('references'); // Keep references as active tab for context
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          coverageTab === 'generate'
                            ? 'bg-[#DC143C] text-white'
                            : 'bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF]'
                        }`}
                        >
                          <span className="text-base mr-2">🤖</span>
                          Generate Wardrobe
                        </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {/* Coverage Tabs (Upload or Generate) */}
              {coverageTab === 'upload' && (
                <UploadWardrobeTab
                  characterId={character.id}
                  characterName={character.name}
                  screenplayId={screenplayId || ''}
                  existingReferences={[...(latestCharacter.references || []), ...(latestCharacter.poseReferences || [])]}
                  onComplete={async (result) => {
                    queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
                    await queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    toast.success(`Successfully added ${result.images.length} image(s) to ${result.outfitName}`);
                    setCoverageTab(null); // Close coverage tab after completion
                  }}
                />
              )}
              
              {coverageTab === 'generate' && onGeneratePosePackage && (
                <GenerateWardrobeTab
                  characterId={character.id}
                  characterName={character.name}
                  screenplayId={screenplayId || ''}
                  baseReferenceS3Key={latestCharacter.baseReference?.s3Key}
                  existingReferences={[...(latestCharacter.references || []), ...(latestCharacter.poseReferences || [])]}
                  onClose={() => setCoverageTab(null)}
                  onComplete={async (result) => {
                    queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    await queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    setCoverageTab(null); // Close coverage tab after completion
                  }}
                />
              )}
              
              {/* Standard Tabs (only show if no coverage tab active) */}
              {!coverageTab && (
                <>
                  {false && activeTab === 'gallery' && (
                <div className="p-6">
                  {/* Action Bar with Character Studio Button and Outfit Filter */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">Character References</h3>
                      <span className="text-sm text-[#808080]">
                        {filteredGalleryImages.length} {filteredGalleryImages.length === 1 ? 'image' : 'images'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Outfit Filter */}
                      {outfitNames.length > 1 && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-[#808080]">Filter by Outfit:</label>
                          <select
                            value={selectedOutfitGallery || '__all__'}
                            onChange={(e) => {
                              const newValue = e.target.value === '__all__' ? null : e.target.value;
                              setSelectedOutfitGallery(newValue);
                              setSelectedImageId(null);
                            }}
                            className="select select-bordered px-3 py-1.5 bg-[#1F1F1F] border border-[#3F3F46] rounded text-white text-sm h-8 focus:border-[#DC143C] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
                          >
                            <option value="__all__" className="bg-[#1A1A1A] text-[#FFFFFF]">All Outfits ({galleryImages.length})</option>
                            {outfitNames.map((outfitName) => {
                              const outfitCount = galleryImages.filter(img => (img.outfitName || 'default') === outfitName).length;
                              let outfitDisplayName: string;
                              if (outfitName === 'default') {
                                outfitDisplayName = displayPhysicalAttributes?.typicalClothing 
                                  ? displayPhysicalAttributes.typicalClothing
                                  : 'Default Outfit';
                              } else {
                                outfitDisplayName = outfitName
                                  .split('-')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
                              }
                              return (
                                <option key={outfitName} value={outfitName} className="bg-[#1A1A1A] text-[#FFFFFF]">
                                  {outfitDisplayName} ({outfitCount})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Modern Gallery */}
                  {filteredGalleryImages.length > 0 ? (
                    <ModernGallery
                      images={filteredGalleryImages}
                      outfitFilter={selectedOutfitGallery || undefined}
                      onOutfitFilterChange={(outfit) => setSelectedOutfitGallery(outfit)}
                      availableOutfits={outfitNames}
                      entityName={character.name}
                      layout="grid-only"
                      useImageId={true}
                      onImageClick={(imageIdOrIndex) => {
                        // 🔥 IMPROVED: Use stable identifier (id) instead of fragile index
                        const imageId = typeof imageIdOrIndex === 'string' ? imageIdOrIndex : null;
                        const clickedImage = imageId 
                          ? filteredGalleryImages.find(img => img.id === imageId)
                          : filteredGalleryImages[imageIdOrIndex as number];
                        
                        if (!clickedImage) {
                          console.error('[CharacterDetailModal] Image not found:', imageIdOrIndex);
                          return;
                        }
                        
                        // 🔥 FIX: Find index in galleryImages (unfiltered) first, then fallback to allImages
                        // This ensures we get the correct index even when filtered
                        let actualIndex = galleryImages.findIndex(img => {
                          if (img.id === clickedImage.id) return true;
                          const clickedS3Key = clickedImage.s3Key;
                          if (clickedS3Key && img.s3Key === clickedS3Key) return true;
                          return false;
                        });
                        
                        // If not found in galleryImages, try allImages
                        if (actualIndex < 0) {
                          actualIndex = allImages.findIndex(img => {
                            if (img.id === clickedImage.id) return true;
                            const clickedS3Key = clickedImage.s3Key;
                            if (clickedS3Key && img.s3Key === clickedS3Key) return true;
                            return false;
                          });
                        }
                        
                        if (actualIndex >= 0 && actualIndex < allImages.length) {
                          setPreviewImageIndex(actualIndex);
                          // Determine outfit group if applicable
                          const outfitName = clickedImage.outfitName || (clickedImage as any).metadata?.outfitName;
                          setPreviewGroupName(outfitName || null);
                        } else {
                          console.error('[CharacterDetailModal] Failed to find image in allImages:', { 
                            clickedImageId: clickedImage.id, 
                            clickedS3Key: clickedImage.s3Key,
                            allImagesLength: allImages.length
                          });
                        }
                      }}
                    />
                  ) : galleryImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                      <p className="text-sm text-[#6B7280]">Use "Upload Wardrobe" or "Generate Wardrobe" to add images</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-2">No images found</p>
                      {selectedOutfitGallery && (
                        <p className="text-sm text-[#6B7280]">
                          No images for outfit "{selectedOutfitGallery}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Performance Controls - Compact, only if advanced features available */}
                  {hasAdvancedFeatures && performanceSettings && onPerformanceSettingsChange && (
                    <div className="mt-3 pt-3 border-t border-[#3F3F46]">
                      <div className="flex items-center gap-3">
                        {/* Compact Preset Buttons */}
                        <div className="flex items-center gap-1">
                          {[
                            { key: 'subtle', icon: '😐', value: 0.5 },
                            { key: 'natural', icon: '😊', value: 1.0 },
                            { key: 'expressive', icon: '😃', value: 1.5 },
                            { key: 'dramatic', icon: '😱', value: 1.8 }
                          ].map((preset) => {
                            const isActive = Math.abs(performanceSettings.facialPerformance - preset.value) < 0.2;
                            return (
                              <button
                                key={preset.key}
                                onClick={() => onPerformanceSettingsChange({
                                  ...performanceSettings,
                                  facialPerformance: preset.value
                                })}
                                className={`px-1.5 py-1 rounded text-xs transition-colors ${
                                  isActive
                                    ? 'bg-[#DC143C]/20 border border-[#DC143C] text-[#DC143C]'
                                    : 'bg-[#141414] border border-[#3F3F46] text-[#808080] hover:border-[#DC143C]/50'
                                }`}
                                title={preset.key.charAt(0).toUpperCase() + preset.key.slice(1)}
                              >
                                {preset.icon}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Compact Slider */}
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] text-[#808080] whitespace-nowrap">Performance:</span>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={performanceSettings.facialPerformance}
                            onChange={(e) => onPerformanceSettingsChange({
                              ...performanceSettings,
                              facialPerformance: parseFloat(e.target.value)
                            })}
                            className="flex-1 h-1 bg-[#1F1F1F] rounded-lg appearance-none cursor-pointer accent-[#DC143C]"
                          />
                          <span className="text-[10px] text-[#808080] whitespace-nowrap min-w-[50px] text-right">
                            {performanceSettings.facialPerformance.toFixed(1)}
                          </span>
                        </div>
                        
                        {/* Animation Style Toggle */}
                        <div className="flex items-center gap-1 bg-[#141414] border border-[#3F3F46] rounded p-0.5">
                          <button
                            onClick={() => onPerformanceSettingsChange({
                              ...performanceSettings,
                              animationStyle: 'full-body'
                            })}
                            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                              performanceSettings.animationStyle === 'full-body'
                                ? 'bg-[#DC143C] text-white'
                                : 'text-[#808080] hover:text-[#FFFFFF]'
                            }`}
                            title="Full Body"
                          >
                            Body
                          </button>
                          <button
                            onClick={() => onPerformanceSettingsChange({
                              ...performanceSettings,
                              animationStyle: 'face-only'
                            })}
                            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                              performanceSettings.animationStyle === 'face-only'
                                ? 'bg-[#DC143C] text-white'
                                : 'text-[#808080] hover:text-[#FFFFFF]'
                            }`}
                            title="Face Only"
                          >
                            Face
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Character Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Character Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        <p className="text-[#FFFFFF]">{displayName}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Type</label>
                        <p className="text-[#FFFFFF] capitalize">{displayType}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                        <p className="text-[#808080]">{displayDescription || 'No description'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Arc Status</label>
                        <p className="text-[#FFFFFF] capitalize">{displayArcStatus}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">
                          Physical Attributes <span className="text-[#6B7280] normal-case">(Optional)</span>
                        </label>
                        <div className="space-y-1">
                          {displayPhysicalAttributes.height && <p className="text-[#808080] text-sm">Height: <span className="text-[#FFFFFF] capitalize">{displayPhysicalAttributes.height}</span></p>}
                          {displayPhysicalAttributes.bodyType && <p className="text-[#808080] text-sm">Body Type: <span className="text-[#FFFFFF] capitalize">{displayPhysicalAttributes.bodyType}</span></p>}
                          {displayPhysicalAttributes.eyeColor && <p className="text-[#808080] text-sm">Eye Color: <span className="text-[#FFFFFF]">{displayPhysicalAttributes.eyeColor}</span></p>}
                          {displayPhysicalAttributes.hairColor && <p className="text-[#808080] text-sm">Hair Color: <span className="text-[#FFFFFF]">{displayPhysicalAttributes.hairColor}</span></p>}
                          {displayPhysicalAttributes.hairLength && <p className="text-[#808080] text-sm">Hair Length: <span className="text-[#FFFFFF] capitalize">{displayPhysicalAttributes.hairLength}</span></p>}
                          {displayPhysicalAttributes.hairStyle && <p className="text-[#808080] text-sm">Hair Style: <span className="text-[#FFFFFF]">{displayPhysicalAttributes.hairStyle}</span></p>}
                        </div>
                      </div>
                      
                      {/* Default Outfit (Typical Clothing) - Editable in Production Hub */}
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-2 block">
                          Default Outfit <span className="text-[#6B7280] normal-case">(for Scene Builder)</span>
                        </label>
                        {(() => {
                          // Extract unique outfit names from character's references
                          const outfitSet = new Set<string>();
                          poseReferences.forEach(ref => {
                            if (ref.outfitName && ref.outfitName !== 'default') {
                              outfitSet.add(ref.outfitName);
                            }
                          });
                          const availableOutfits = Array.from(outfitSet).sort();
                          
                          return availableOutfits.length > 0 ? (
                            <select
                              value={displayPhysicalAttributes.typicalClothing || '__none__'}
                              onChange={async (e) => {
                                const newValue = e.target.value === '__none__' ? undefined : e.target.value;
                                await onUpdate(character.id, {
                                  physicalAttributes: {
                                    ...displayPhysicalAttributes,
                                    typicalClothing: newValue
                                  }
                                });
                              }}
                              className="select select-bordered w-full h-10 px-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-sm text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                            >
                              <option value="__none__" className="bg-[#1A1A1A] text-[#FFFFFF]">None (no default)</option>
                              {availableOutfits.map((outfit) => (
                                <option key={outfit} value={outfit} className="bg-[#1A1A1A] text-[#FFFFFF]">
                                  {outfit}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-sm text-[#808080]">
                              No outfits available. Generate pose packages to create outfits.
                            </div>
                          );
                        })()}
                        <p className="text-[10px] text-[#6B7280] mt-1">
                          Select the default outfit to use in Scene Builder. New outfits are added when you create pose packages.
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Arc Notes</label>
                        <p className="text-[#808080]">{displayArcNotes || 'No arc notes'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Script Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">From Script</h3>
                    <p className="text-[#808080] text-sm">
                      Character information extracted from the screenplay will appear here.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'references' && (
                <div className="p-6 space-y-6">
                  {/* Phase 2: Selection Mode Toggle & Bulk Actions */}
                  {poseReferences.length > 0 && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-[#141414] border border-[#3F3F46] rounded-lg">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectionMode(!selectionMode);
                            if (selectionMode) {
                              setSelectedImageIds(new Set()); // Clear selection when exiting
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectionMode
                              ? 'bg-[#DC143C] text-white'
                              : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                          }`}
                        >
                          {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          {selectionMode ? 'Selection Mode' : 'Select Multiple'}
                        </button>
                        {selectionMode && selectedImageIds.size > 0 && (
                          <span className="text-sm text-[#808080]">
                            {selectedImageIds.size} selected
                          </span>
                        )}
                      </div>
                      {selectionMode && (
                        <div className="flex items-center gap-2">
                          {selectedImageIds.size > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  const currentImages = selectedOutfitReferences 
                                    ? posesByOutfit[selectedOutfitReferences] || []
                                    : poseReferences;
                                  if (selectedImageIds.size === currentImages.length) {
                                    setSelectedImageIds(new Set());
                                  } else {
                                    setSelectedImageIds(new Set(currentImages.map(img => img.id)));
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#808080] hover:text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
                              >
                                {selectedImageIds.size === (selectedOutfitReferences ? posesByOutfit[selectedOutfitReferences]?.length || 0 : poseReferences.length)
                                  ? 'Deselect All'
                                  : 'Select All'}
                              </button>
                              <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected ({selectedImageIds.size})
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 🔥 SEPARATION: Production Hub Images - Organized by Outfit/Style (Editable/Deletable) */}
                  {poseReferences.length > 0 && (
                    <div className="p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            Production Hub Images ({poseReferences.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">AI-generated poses organized by outfit - can be edited/deleted here</p>
                        </div>
                      </div>
                      
                      {/* Outfit Dropdown Selector - Show one outfit at a time */}
                      {outfitNames.length > 1 && (
                        <div className="mb-4">
                          <label className="text-xs text-[#808080] mb-2 block">Filter by outfit:</label>
                          <select
                            value={selectedOutfitReferences || '__all__'}
                            onChange={(e) => setSelectedOutfitReferences(e.target.value === '__all__' ? null : e.target.value)}
                            className="select select-bordered w-full h-10 px-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                          >
                            <option value="__all__" className="bg-[#1A1A1A] text-[#FFFFFF]">All Outfits ({poseReferences.length})</option>
                            {outfitNames.map((outfitName) => {
                              const outfitPoses = posesByOutfit[outfitName] || [];
                              let outfitDisplayName: string;
                              if (outfitName === 'default') {
                                outfitDisplayName = displayPhysicalAttributes?.typicalClothing 
                                  ? displayPhysicalAttributes.typicalClothing
                                  : 'Default Outfit';
                              } else {
                                // 🔥 FIX: Handle both underscores and hyphens in outfit names
                                outfitDisplayName = outfitName
                                  .split(/[-_]/)
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
                              }
                              return (
                                <option key={outfitName} value={outfitName} className="bg-[#1A1A1A] text-[#FFFFFF]">
                                  {outfitDisplayName} ({outfitPoses.length})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      
                      {/* Production Hub Images Grid - Filtered by selected outfit */}
                      {/* 🔥 FIX: Normalize outfit names when filtering */}
                      {/* 🔥 FIX: Use more columns for smaller thumbnails (match ModernGallery grid-only layout) */}
                      {/* Mobile: 2 columns for larger thumbnails, Desktop: More columns */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                        {(() => {
                          const normalizeOutfitName = (name: string): string => {
                            if (!name) return '';
                            return name
                              .toLowerCase()
                              .replace(/[_\s]+/g, '_')
                              .replace(/^_+|_+$/g, '')
                              .trim();
                          };
                          const filteredPoses = selectedOutfitReferences 
                            ? (() => {
                                const normalizedSelected = normalizeOutfitName(selectedOutfitReferences);
                                return poseReferences.filter(img => {
                                  const imgOutfit = img.outfitName || 'default';
                                  return normalizeOutfitName(imgOutfit) === normalizedSelected;
                                });
                              })()
                            : poseReferences;
                          return filteredPoses.map((img) => {
                          // All images in poseReferences are Production Hub images (editable/deletable)
                          const isSelected = selectedImageIds.has(img.id);
                          // 🔥 NEW: Use thumbnail URL from mapping, fallback to full image
                          const displayUrl = referenceThumbnailMap.get(img.id) || img.imageUrl;
                          return (
                            <div
                              key={img.id}
                              className={`relative group aspect-video bg-[#141414] border rounded-lg overflow-hidden transition-colors ${
                                selectionMode
                                  ? isSelected
                                    ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                    : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                                  : 'border-[#3F3F46] hover:border-[#DC143C]'
                              }`}
                            >
                              {/* Phase 2: Checkbox overlay in selection mode */}
                              {selectionMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSelection = new Set(selectedImageIds);
                                      if (isSelected) {
                                        newSelection.delete(img.id);
                                      } else {
                                        newSelection.add(img.id);
                                      }
                                      setSelectedImageIds(newSelection);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      isSelected
                                        ? 'bg-[#DC143C] text-white'
                                        : 'bg-[#0A0A0A]/80 text-[#808080] hover:bg-[#1F1F1F]'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                              <img
                                src={displayUrl}
                                alt={img.label}
                                className="w-full h-full object-cover cursor-pointer"
                                style={{
                                  // 🔥 FIX: Prevent blurriness from upscaling - use crisp rendering for thumbnails
                                  imageRendering: displayUrl !== img.imageUrl ? 'crisp-edges' : 'auto',
                                  maxWidth: '640px',
                                  maxHeight: '360px' // 16:9 aspect ratio (640/1.777 = 360)
                                }}
                                loading="lazy"
                                onError={(e) => {
                                  // 🔥 NEW: Fallback to full image if thumbnail fails
                                  if (displayUrl !== img.imageUrl) {
                                    (e.target as HTMLImageElement).src = img.imageUrl;
                                  }
                                }}
                                onClick={() => {
                                  if (!selectionMode) {
                                    // Original click behavior (view image)
                                    const outfitName = img.outfitName || (img as any).metadata?.outfitName || 'default';
                                    const groupImages = posesByOutfit[outfitName] || [];
                                    const groupIndex = groupImages.findIndex(gImg => 
                                      gImg.id === img.id || gImg.s3Key === img.s3Key
                                    );
                                    if (groupIndex >= 0) {
                                      setPreviewGroupName(outfitName);
                                      setPreviewImageIndex(groupIndex);
                                    }
                                  }
                                }}
                              />
                              {/* Top-right label: Pose/Regenerated */}
                              <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded ${
                                img.isRegenerated ? 'bg-[#DC143C]' : 'bg-[#8B5CF6]'
                              }`}>
                                {img.isRegenerated ? 'Regenerated' : 'Pose'}
                              </div>
                              {/* Bottom-right label: Provider */}
                              {img.metadata?.providerId && (() => {
                                const providerLabel = getProviderLabel(img.metadata.providerId);
                                if (!providerLabel) return null;
                                return (
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
                                    {providerLabel}
                                  </div>
                                );
                              })()}
                              <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent transition-opacity pointer-events-none ${
                                selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Delete button - all Production Hub images can be deleted - only show when not in selection mode */}
                                {!img.isBase && !selectionMode && (
                              <div className="absolute top-2 right-2 pointer-events-auto">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-1.5 bg-[#DC143C]/80 hover:bg-[#DC143C] rounded-lg transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="w-3 h-3 text-white" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent 
                                    align="end"
                                    className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none"
                                    style={{ backgroundColor: '#0A0A0A' }}
                                  >
                                    <DropdownMenuItem
                                      className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Find which outfit group this image belongs to
                                        const outfitName = img.outfitName || (img as any).metadata?.outfitName || 'default';
                                        const groupImages = posesByOutfit[outfitName] || [];
                                        const groupIndex = groupImages.findIndex(gImg => 
                                          gImg.id === img.id || gImg.s3Key === img.s3Key
                                        );
                                        
                                        if (groupIndex >= 0) {
                                          setPreviewGroupName(outfitName);
                                          setPreviewImageIndex(groupIndex);
                                        } else {
                                          // Fallback: find in allImages
                                          const allIndex = allImages.findIndex(aImg => 
                                            aImg.id === img.id || aImg.s3Key === img.s3Key
                                          );
                                          if (allIndex >= 0) {
                                            setPreviewGroupName(null);
                                            setPreviewImageIndex(allIndex);
                                          }
                                        }
                                      }}
                                    >
                                      <Eye className="w-4 h-4 mr-2 text-[#808080]" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          // Generate filename from metadata
                                          const poseName = img.poseId || (img as any).metadata?.poseId || img.label || 'pose';
                                          const outfitName = img.outfitName || (img as any).metadata?.outfitName || '';
                                          const outfitPart = outfitName ? `_${outfitName.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
                                          const filename = `${character.name}_${poseName.replace(/[^a-zA-Z0-9]/g, '-')}${outfitPart}_${Date.now()}.jpg`;
                                          await downloadImageAsBlob(img.imageUrl, filename, img.s3Key);
                                        } catch (error: any) {
                                          toast.error('Failed to download image');
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-2 text-[#808080]" />
                                      Download
                                    </DropdownMenuItem>
                                    {/* 🔥 NEW: Crop option (all poses can be cropped) */}
                                    {img.s3Key && (
                                      <DropdownMenuItem
                                        className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCropPose({
                                            poseId: img.id || img.poseId || (img as any).metadata?.poseId || '',
                                            poseS3Key: img.s3Key
                                          });
                                        }}
                                      >
                                        <Crop className="w-4 h-4 mr-2 text-[#808080]" />
                                        Crop
                                      </DropdownMenuItem>
                                    )}
                                    {/* 🔥 NEW: Regenerate option (only for poses with poseId) */}
                                    {(img.poseId || img.metadata?.poseId) && img.s3Key && (() => {
                                      // 🔥 FIX: Ensure both values are strings and trimmed for reliable comparison
                                      const currentS3Key = (img.s3Key || '').trim();
                                      const isThisImageRegenerating = regeneratingS3Key !== null && regeneratingS3Key.trim() === currentS3Key;
                                      return (
                                        <DropdownMenuItem
                                          className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Don't allow if ANY regeneration is in progress
                                            if (isRegenerating) {
                                              console.log('[CharacterDetailModal] Blocked regenerate - another regeneration in progress');
                                              return;
                                            }
                                            console.log('[CharacterDetailModal] Opening regenerate modal for s3Key:', currentS3Key);
                                            // Show warning modal before regenerating
                                            setRegeneratePose({
                                              poseId: img.poseId || img.metadata?.poseId || '',
                                              s3Key: currentS3Key,
                                            });
                                          }}
                                          disabled={isRegenerating}
                                        >
                                          <Sparkles className="w-4 h-4 mr-2" />
                                          {isThisImageRegenerating ? 'Regenerating...' : 'Regenerate'}
                                        </DropdownMenuItem>
                                      );
                                    })()}
                                    <DropdownMenuItem
                                      className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Delete this image? This action cannot be undone.')) {
                                          return;
                                        }
                                        
                                        try {
                                          // Extract s3Key from multiple possible locations (same as bulk delete)
                                          let imgS3Key = img.s3Key || (img as any).metadata?.s3Key;
                                          
                                          // If still not found, try to find it in character.poseReferences or angleReferences
                                          if (!imgS3Key && img.id) {
                                            const allPoseRefs = (character as any).angleReferences || character.poseReferences || [];
                                            const poseRef = allPoseRefs.find((ref: any) => {
                                              const refId = typeof ref === 'string' ? `pose_${ref}` : ref.id;
                                              return refId === img.id;
                                            });
                                            if (poseRef) {
                                              imgS3Key = typeof poseRef === 'string' 
                                                ? poseRef 
                                                : (poseRef.s3Key || poseRef.metadata?.s3Key);
                                            }
                                          }
                                          
                                          // If still not found, try to extract from img.id if it's a string s3Key
                                          if (!imgS3Key && img.id && typeof img.id === 'string' && img.id.startsWith('pose_')) {
                                            const extractedS3Key = img.id.replace(/^pose_/, '');
                                            if (extractedS3Key && extractedS3Key.length > 0) {
                                              imgS3Key = extractedS3Key;
                                            }
                                          }
                                          
                                          if (!imgS3Key) {
                                            throw new Error('Missing S3 key for image');
                                          }
                                          
                                          const token = await getToken({ template: 'wryda-backend' });
                                          if (!token) {
                                            toast.error('Authentication required');
                                            return;
                                          }
                                          
                                          // 🔥 FIX: Delete from Media Library first (source of truth) - same pattern as locations and props
                                          try {
                                            const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                                            await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({ s3Key: imgS3Key }),
                                            });
                                          } catch (mediaError: any) {
                                            console.warn('[CharacterDetailModal] Failed to delete from Media Library (non-fatal):', mediaError);
                                            // Continue with character update even if Media Library deletion fails
                                          }
                                          
                                          // Check if it's a pose reference (AI-generated) or user reference
                                          const poseRefs = (character as any).angleReferences || character.poseReferences || [];
                                          const isPoseRef = poseRefs.some((poseRef: any) => {
                                            const poseS3Key = typeof poseRef === 'string' ? poseRef : poseRef.s3Key;
                                            return poseS3Key === imgS3Key;
                                          });
                                          
                                          // Use the same simple approach as bulk delete - just filter and update
                                          if (isPoseRef) {
                                            // Delete from poseReferences (AI-generated poses)
                                            const currentPoseReferences = (character as any).angleReferences || character.poseReferences || [];
                                            const updatedPoseReferences = currentPoseReferences.filter((ref: any) => {
                                              const refS3Key = typeof ref === 'string' ? ref : ref.s3Key;
                                              return refS3Key !== imgS3Key;
                                            });
                                            
                                            await onUpdate(character.id, { 
                                              poseReferences: updatedPoseReferences
                                            });
                                          } else {
                                            // Delete from character.references array (user-uploaded references in Production Hub)
                                            const currentReferences = character.references || [];
                                            const updatedReferences = currentReferences.filter((ref: any) => {
                                              const refS3Key = typeof ref === 'string' ? ref : ref.s3Key;
                                              return refS3Key !== imgS3Key;
                                            });
                                            
                                            await onUpdate(character.id, { 
                                              references: updatedReferences 
                                            });
                                          }
                                          
                                          // 🔥 FIX: Invalidate queries to refresh UI immediately
                                          queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                                          queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
                                          await Promise.all([
                                            queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] }),
                                            queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] })
                                          ]);
                                          
                                          toast.success('Image deleted');
                                        } catch (error: any) {
                                          console.error('[CharacterDetailModal] Failed to delete image:', error);
                                          toast.error(`Failed to delete image: ${error.message}`);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                        });
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 SEPARATION: Creation Section Images - Read-Only References */}
                  {userReferences.length > 0 && (
                    <div className="p-4 bg-[#0F0F0F] rounded-lg border border-[#3F3F46]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3F3F46]">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Reference Images from Creation ({userReferences.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Uploaded in Creation section - view only (delete in Creation section)</p>
                        </div>
                      </div>
                      {/* Mobile: 2 columns for larger thumbnails, Desktop: More columns */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                        {userReferences.map((img) => {
                          return (
                            <div
                              key={img.id}
                              className="relative group aspect-video bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden opacity-75"
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
                                style={{
                                  maxWidth: '640px',
                                  maxHeight: '360px' // 16:9 aspect ratio
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Info icon - read-only indicator */}
                                <div className="absolute top-2 right-2">
                                  <div className="p-1.5 bg-[#1F1F1F]/80 rounded-lg" title="Uploaded in Creation section - delete there">
                                    <Info className="w-3 h-3 text-[#808080]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {poseReferences.length === 0 && userReferences.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No reference images yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="p-6">
                  {isLoadingVoice ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-[#808080]">Loading voice profile...</div>
                    </div>
                  ) : (
                    <VoiceAssignmentTab
                      characterId={character.id}
                      screenplayId={screenplayId || ''}
                      character={character}
                      voiceProfile={voiceProfile}
                      onVoiceUpdate={fetchVoiceProfile}
                      onOpenVoiceBrowser={() => setShowVoiceBrowser(true)}
                      onOpenCustomVoiceForm={() => setShowCustomVoiceForm(true)}
                    />
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </motion.div>

          {/* Voice Browser Modal (Feature 0152) */}
          <VoiceBrowserModal
            isOpen={showVoiceBrowser}
            onClose={() => setShowVoiceBrowser(false)}
            onSelectVoice={handleVoiceSelected}
            characterDemographics={getCharacterDemographics()}
          />

          {/* Custom Voice Form Modal (Feature 0152) */}
          <CustomVoiceForm
            isOpen={showCustomVoiceForm}
            onClose={() => {
              setShowCustomVoiceForm(false);
              setPrefilledVoiceId(undefined); // Reset prefilled voice ID when closing
            }}
            onSubmit={handleCustomVoiceSubmit}
            characterId={character.id}
            screenplayId={screenplayId || ''}
            prefilledVoiceId={prefilledVoiceId}
          />

        </>
      )}
      
      {/* 🔥 NEW: Regenerate Confirmation Modal */}
      <RegenerateConfirmModal
        isOpen={regeneratePose !== null && regeneratingS3Key === null}
        onClose={() => {
          if (regeneratingS3Key === null) {
            setRegeneratePose(null);
          }
        }}
        onConfirm={() => {
          if (regeneratePose && regeneratingS3Key === null) {
            handleRegeneratePose(regeneratePose.poseId, regeneratePose.s3Key);
          }
        }}
        imageType="pose"
      />
      
      {/* 🔥 NEW: Crop Pose Modal */}
      {cropPose && screenplayId && (
        <CharacterPoseCropModal
          isOpen={cropPose !== null}
          onClose={() => setCropPose(null)}
          poseId={cropPose.poseId}
          poseS3Key={cropPose.poseS3Key}
          characterId={character.id}
          screenplayId={screenplayId}
          onCropComplete={async () => {
            // Refresh character data after crop - invalidate AND refetch to immediately update UI
            await queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
            // Force immediate refetch to update the displayed image
            await queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
            setCropPose(null);
          }}
        />
      )}
      
      {/* ImageViewer */}
      {previewImageIndex !== null && (
        <ImageViewer
          images={(() => {
            // Get images for the current group (outfit) or all images
            const currentGroupImages = previewGroupName && posesByOutfit[previewGroupName]
              ? posesByOutfit[previewGroupName]
              : allImages;
            
            return currentGroupImages.map((img): ImageItem => ({
              id: img.id || img.s3Key || `img_${Date.now()}`,
              url: img.imageUrl || '',
              label: img.label || `${character.name} image`,
              s3Key: img.s3Key,
              metadata: {
                poseId: (img as any).poseId || (img as any).metadata?.poseId,
                outfitName: (img as any).outfitName || (img as any).metadata?.outfitName,
                pose: (img as any).pose || (img as any).metadata?.pose
              }
            }));
          })()}
          allImages={allImages.map((img): ImageItem => ({
            id: img.id || img.s3Key || `img_${Date.now()}`,
            url: img.imageUrl || '',
            label: img.label || `${character.name} image`,
            s3Key: img.s3Key,
            metadata: {
              poseId: (img as any).poseId || (img as any).metadata?.poseId,
              outfitName: (img as any).outfitName || (img as any).metadata?.outfitName,
              pose: (img as any).pose || (img as any).metadata?.pose
            }
          }))}
          currentIndex={previewImageIndex}
          isOpen={previewImageIndex !== null}
          onClose={() => {
            setPreviewImageIndex(null);
            setPreviewGroupName(null);
          }}
          onDownload={async (image) => {
            try {
              const poseName = image.metadata?.poseId || image.metadata?.pose || 'pose';
              const outfitName = image.metadata?.outfitName || '';
              const outfitPart = outfitName ? `_${outfitName.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
              const filename = `${character.name}_${poseName.replace(/[^a-zA-Z0-9]/g, '-')}${outfitPart}_${Date.now()}.jpg`;
              await downloadImageAsBlob(image.url, filename, image.s3Key);
            } catch (error: any) {
              toast.error('Failed to download image');
            }
          }}
          groupName={previewGroupName || undefined}
        />
      )}

      {/* Phase 2: Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">Delete Selected Images?</h3>
            <p className="text-sm text-[#808080] mb-6">
              Are you sure you want to delete {selectedImageIds.size} image{selectedImageIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowBulkDeleteConfirm(false);
                  try {
                    const selectedImages = poseReferences.filter(img => selectedImageIds.has(img.id));
                    
                    // Extract all s3Keys for selected images
                    const s3KeysToDelete = new Set<string>();
                    for (const img of selectedImages) {
                      let imgS3Key = img.s3Key || (img as any).metadata?.s3Key;
                      
                      if (!imgS3Key && img.id) {
                        const poseRefs = (character as any).angleReferences || character.poseReferences || [];
                        const poseRef = poseRefs.find((ref: any) => {
                          const refId = typeof ref === 'string' ? `pose_${ref}` : ref.id;
                          return refId === img.id;
                        });
                        if (poseRef) {
                          imgS3Key = typeof poseRef === 'string' 
                            ? poseRef 
                            : (poseRef.s3Key || poseRef.metadata?.s3Key);
                        }
                      }
                      
                      if (!imgS3Key && img.id && typeof img.id === 'string' && img.id.startsWith('pose_')) {
                        imgS3Key = img.id.replace(/^pose_/, '');
                      }
                      
                      if (!imgS3Key && img.id && typeof img.id === 'string' && !img.id.startsWith('pose_') && !img.id.startsWith('ref_')) {
                        imgS3Key = img.id;
                      }
                      
                      if (imgS3Key) {
                        s3KeysToDelete.add(imgS3Key);
                      }
                    }
                    
                    if (s3KeysToDelete.size === 0) {
                      toast.error('No valid images to delete');
                      return;
                    }
                    
                    // 🔥 FIX: Delete from Media Library first (source of truth) - batch delete
                    const token = await getToken({ template: 'wryda-backend' });
                    if (!token) {
                      toast.error('Authentication required');
                      return;
                    }
                    
                    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                    for (const s3Key of s3KeysToDelete) {
                      try {
                        await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ s3Key }),
                        });
                      } catch (mediaError: any) {
                        console.warn('[CharacterDetailModal] Failed to delete from Media Library (non-fatal):', mediaError);
                        // Continue with character update even if Media Library deletion fails
                      }
                    }
                    
                    // Batch delete: Remove all selected pose references in one update
                    const currentPoseReferences = (character as any).angleReferences || character.poseReferences || [];
                    const currentReferences = character.references || [];
                    
                    const updatedPoseReferences = currentPoseReferences.filter((ref: any) => {
                      const refS3Key = typeof ref === 'string' ? ref : ref.s3Key;
                      return !s3KeysToDelete.has(refS3Key);
                    });
                    
                    const updatedReferences = currentReferences.filter((ref: any) => {
                      const refS3Key = typeof ref === 'string' ? ref : ref.s3Key;
                      return !s3KeysToDelete.has(refS3Key);
                    });
                    
                    // Single update call for all deletions
                    await onUpdate(character.id, { 
                      poseReferences: updatedPoseReferences,
                      references: updatedReferences
                    });
                    
                    // 🔥 FIX: Invalidate queries to refresh UI immediately
                    queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
                    
                    // Clear selection and exit selection mode
                    setSelectedImageIds(new Set());
                    setSelectionMode(false);
                    
                    toast.success(`Successfully deleted ${s3KeysToDelete.size} image${s3KeysToDelete.size !== 1 ? 's' : ''}`);
                  } catch (error: any) {
                    console.error('[CharacterDetailModal] Bulk deletion error:', error);
                    toast.error(`Failed to delete images: ${error.message}`);
                  }
                }}
                className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete {selectedImageIds.size} Image{selectedImageIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

