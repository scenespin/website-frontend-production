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
import { X, Upload, Sparkles, Image as ImageIcon, User, FileText, Box, Download, Trash2, Plus, Camera, Info, MoreVertical, Eye, CheckSquare, Square } from 'lucide-react';
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
import { useMediaFiles } from '@/hooks/useMediaLibrary';
import { ImageViewer, type ImageItem } from './ImageViewer';
import { RegenerateConfirmModal } from './RegenerateConfirmModal';

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
  
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
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
      
      // No toast notification - silent update like assets
    } catch (error: any) {
      console.error('[CharacterDetailModal] Failed to regenerate pose:', error);
      toast.error(`Failed to regenerate pose: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRegenerating(false);
      setRegeneratingS3Key(null); // Clear regenerating state
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
  
  // 🔥 SIMPLIFIED: Get user-uploaded references directly from Character Bank API
  // Backend now returns all references (baseReference + references array) with presigned URLs
  // 🔥 FIX: Memoize userReferences to prevent unnecessary recalculations
  const allPoseRefs = (character as any).angleReferences || character.poseReferences || [];
  
  const userReferences = useMemo(() => {
    return [
      character.baseReference ? {
        id: 'base',
        imageUrl: character.baseReference.imageUrl || '',
        s3Key: character.baseReference.s3Key,
        label: 'Base Reference',
        isBase: true,
        isPose: false,
        index: 0
      } : null,
      // Additional references from Character Bank API (user-uploaded in Creation section)
      ...(character.references || [])
        .filter(ref => {
          // Exclude any references that are in poseReferences (AI-generated)
          const refS3Key = ref.s3Key || ref.metadata?.s3Key;
          const isInPoseReferences = allPoseRefs.some((poseRef: any) => {
            const poseS3Key = typeof poseRef === 'string' ? poseRef : (poseRef.s3Key || poseRef.metadata?.s3Key);
            return poseS3Key === refS3Key;
          });
          return !isInPoseReferences;
        })
        .map((ref, idx) => ({
          id: ref.id || `ref-${idx}`,
          imageUrl: ref.imageUrl || '',
          s3Key: ref.s3Key || ref.metadata?.s3Key,
          label: ref.label || 'Reference',
          isBase: false,
          isPose: false,
          index: idx + 1
        }))
    ].filter(Boolean) as Array<{id: string; imageUrl: string; s3Key?: string; label: string; isBase: boolean; isPose: boolean; index: number}>;
  }, [character.baseReference, character.references, allPoseRefs]);
  
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

  // 🔥 SIMPLIFIED: Get poseReferences directly from character prop (backend already provides presigned URLs and metadata)
  // Backend Character Bank API already enriches poseReferences with imageUrl, outfitName, poseId, etc.
  // 🔥 FIX: Backend returns angleReferences, not poseReferences! Check both fields.
  // 🔥 FIX: Memoize poseReferences to prevent unnecessary recalculations and re-renders
  // 🔥 FIX: Use latestCharacter from query to ensure we get updated data after refetch (same pattern as assets)
  const rawPoseRefs = (latestCharacter as any).angleReferences || (latestCharacter as any).poseReferences || [];
  const poseReferences: PoseReferenceWithOutfit[] = useMemo(() => {
    return rawPoseRefs.map((ref: any, idx: number) => {
      // Handle both string and object formats for poseReferences (backend may return either)
      const refObj = typeof ref === 'string' ? null : ref;
      const refS3Key = typeof ref === 'string' ? ref : (ref.s3Key || ref.metadata?.s3Key || '');
      const refId = typeof ref === 'string' ? `pose_${refS3Key}` : (ref.id || `pose-${idx}`);
      const refImageUrl = typeof ref === 'string' ? '' : (ref.imageUrl || '');
      
      // 🔥 PRESERVE: Extract outfit from metadata (backend saves this during pose generation)
      // Priority: ref.metadata.outfitName > S3 key path > 'default'
      const outfitFromMetadata = refObj?.metadata?.outfitName;
      const outfitFromS3 = extractOutfitFromS3Key(refS3Key);
      const outfitName = outfitFromMetadata || outfitFromS3 || 'default';
      
      // Extract poseId from ref metadata (backend saves this)
      const poseId = refObj?.metadata?.poseId;
      
      // Check if this is a regenerated pose
      const isRegenerated = refObj?.metadata?.isRegenerated || false;
      const regeneratedFrom = refObj?.metadata?.regeneratedFrom;
      
      return {
        id: refId,
        imageUrl: refImageUrl, // Backend already provides presigned URL
        s3Key: refS3Key,
        label: (typeof ref === 'string' ? 'Pose' : ref.label) || refObj?.metadata?.poseName || 'Pose',
        isBase: false,
        isPose: true,
        outfitName: outfitName, // Store outfit name for grouping
        index: userReferences.length + idx, // Set index for display
        poseId: poseId, // Store poseId for regeneration
        isRegenerated: isRegenerated, // 🔥 NEW: Track if this is a regenerated pose
        regeneratedFrom: regeneratedFrom, // 🔥 NEW: Track which pose this regenerated from
        metadata: refObj?.metadata || {} // Preserve all metadata for deletion logic
      };
    });
  }, [rawPoseRefs, userReferences.length]);
  
  // 🔥 NEW: Group poses by outfit, and pair regenerated poses with originals
  const posesByOutfit = useMemo(() => {
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
      const outfit = pose.outfitName || 'default';
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
        const outfit = regenerated.outfitName || 'default';
        if (!grouped[outfit]) {
          grouped[outfit] = [];
        }
        grouped[outfit].push(regenerated);
      }
    });
    
    return grouped;
  }, [poseReferences]);
  
  // 🔥 FIX: Query Media Library to get actual outfit folder names
  // Media Library organizes as: Characters/[Character Name]/Outfits/[Outfit Name]/
  // Always call the hook (React rules), but disable the query when modal is closed or screenplayId is missing
  // 🔥 FIX: Use empty string as fallback for hook call (React requires consistent hook calls)
  const { data: mediaFiles = [] } = useMediaFiles(screenplayId || '', undefined, isOpen && !!screenplayId);
  
  // Extract outfit names from Media Library folder paths
  const mediaLibraryOutfitNames = useMemo(() => {
    const outfitSet = new Set<string>();
    const characterName = character.name;
    
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
              outfitSet.add(outfitName);
            }
          }
        }
        // Also check metadata.outfitName (from pose generation)
        if (metadata.outfitName) {
          outfitSet.add(metadata.outfitName);
        }
      }
    });
    
    return Array.from(outfitSet);
  }, [mediaFiles, latestCharacter.id, latestCharacter.name]);
  
  // Get outfit names sorted (default first, then alphabetically)
  // Combine Media Library folder names with posesByOutfit keys
  const outfitNames = useMemo(() => {
    const allOutfits = new Set<string>();
    
    // Add outfits from Media Library folders
    mediaLibraryOutfitNames.forEach(outfit => allOutfits.add(outfit));
    
    // Add outfits from posesByOutfit (from pose metadata)
    Object.keys(posesByOutfit).forEach(outfit => allOutfits.add(outfit));
    
    const outfits = Array.from(allOutfits);
    const defaultOutfit = outfits.find(o => o === 'default' || o.toLowerCase() === 'default');
    const otherOutfits = outfits.filter(o => o !== 'default' && o.toLowerCase() !== 'default').sort();
    const result = defaultOutfit ? [defaultOutfit, ...otherOutfits] : otherOutfits;
    
    // 🔥 DEBUG: Log outfit names for troubleshooting
    if (isOpen && poseReferences.length > 0) {
      console.log('[CharacterDetailModal] 🔍 Outfit organization:', {
        mediaLibraryOutfitNames: Array.from(mediaLibraryOutfitNames),
        posesByOutfitKeys: Object.keys(posesByOutfit),
        allOutfits: Array.from(allOutfits),
        outfitNames: result,
        outfitNamesCount: result.length,
        poseReferencesCount: poseReferences.length,
        posesByOutfit: Object.keys(posesByOutfit).reduce((acc, key) => {
          acc[key] = posesByOutfit[key].length;
          return acc;
        }, {} as Record<string, number>)
      });
    }
    
    return result;
  }, [posesByOutfit, mediaLibraryOutfitNames, isOpen, poseReferences.length]);
  
  // Selected outfit tab state - null means show all outfits
  // 🔥 FIX: Use separate state for Gallery vs References tabs to prevent conflicts
  const [selectedOutfitGallery, setSelectedOutfitGallery] = useState<string | null>(null);
  const [selectedOutfitReferences, setSelectedOutfitReferences] = useState<string | null>(null);
  
  // Combined for main display (all images, not grouped)
  // 🔥 FIX: Memoize allImages to prevent unnecessary recalculations
  const allImages = useMemo(() => [...userReferences, ...poseReferences], [userReferences, poseReferences]);
  
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
            <div className="flex-shrink-0 px-6 py-3 border-b border-[#3F3F46] bg-[#141414] flex gap-2">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'gallery'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Gallery
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Info
              </button>
              <button
                onClick={() => setActiveTab('references')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'references'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <Box className="w-4 h-4 inline mr-2" />
                References ({allImages.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {activeTab === 'gallery' && (
                <div className="p-6">
                  {allImages.length > 0 ? (
                    <div className="flex gap-6">
                      {/* Thumbnails on left */}
                      <div className="flex-shrink-0 w-32 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
                        {allImages.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === idx
                                ? 'border-[#DC143C] ring-2 ring-[#DC143C]/20'
                                : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                            }`}
                          >
                            <img
                              src={img.imageUrl}
                              alt={img.label}
                              className="w-full h-full object-cover"
                            />
                            {img.isBase && (
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#DC143C] text-white text-[10px] rounded">
                                Base
                              </div>
                            )}
                            {img.isPose && (
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#8B5CF6] text-white text-[10px] rounded">
                                Pose
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* Main image on right */}
                      <div className="flex-1">
                        <div className="relative bg-[#1F1F1F] rounded-lg overflow-hidden border border-[#3F3F46] aspect-video max-h-[600px]">
                          <img
                            src={allImages[selectedImageIndex]?.imageUrl}
                            alt={allImages[selectedImageIndex]?.label}
                            className="w-full h-full object-contain"
                          />
                          {allImages[selectedImageIndex]?.isBase && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-[#DC143C]/20 text-[#DC143C] rounded-full text-xs font-medium">
                              Base Reference
                            </div>
                          )}
                          {allImages[selectedImageIndex]?.isPose && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full text-xs font-medium">
                              Generated Pose
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* User Uploaded Reference Images Section */}
                  {userReferences.length > 0 && (
                    <div className="mb-8 p-4 bg-[#0F0F0F] rounded-lg border border-[#3F3F46]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3F3F46]">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-1">
                            User Uploaded Reference ({userReferences.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Uploaded in Creation section - delete there</p>
                        </div>
                      </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {userReferences.map((img, idx) => {
                          const globalIndex = allImages.findIndex(i => i.id === img.id);
                          return (
                            <div key={img.id} className="relative group">
                            <button
                                onClick={() => setSelectedImageIndex(globalIndex)}
                                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === globalIndex
                                  ? 'border-[#DC143C] ring-2 ring-[#DC143C]/20'
                                  : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                              }`}
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                              {img.isBase && (
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#DC143C] text-white text-[10px] rounded">
                                  Base
                                </div>
                              )}
                            </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* AI Generated Reference/Poses Section - Organized by Outfit */}
                  {poseReferences.length > 0 && (
                    <div className="mb-8 p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            AI Generated Reference/Poses ({poseReferences.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Organized by outfit - Generated in Production Hub</p>
                        </div>
                      </div>
                      
                      {/* Outfit Dropdown Selector - Same as References tab */}
                      {outfitNames.length > 1 && (
                        <div className="mb-4">
                          <label className="text-xs text-[#808080] mb-2 block">Filter by outfit:</label>
                          <select
                            value={selectedOutfitGallery || ''}
                            onChange={(e) => {
                              const newValue = e.target.value || null;
                              setSelectedOutfitGallery(newValue);
                              // 🔥 FIX: Reset selected image when changing outfit filter
                              setSelectedImageId(null);
                            }}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#8B5CF6] focus:outline-none"
                          >
                            <option value="">All Outfits ({poseReferences.length})</option>
                            {outfitNames.map((outfitName) => {
                              const outfitPoses = posesByOutfit[outfitName] || [];
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
                                <option key={outfitName} value={outfitName}>
                                  {outfitDisplayName} ({outfitPoses.length})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      
                      {/* Poses Grid - Filtered by selected outfit */}
                      {/* 🔥 FIX: Limit to 3 rows with scrolling for better navigation (approximately 24 images at 8 cols) */}
                      <div className="max-h-[400px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                          {(selectedOutfitGallery ? posesByOutfit[selectedOutfitGallery] || [] : poseReferences).map((img, idx) => {
                            // 🔥 FIX: Use image ID for selection instead of index to prevent multiple highlights
                            const isSelected = selectedImageId === img.id;
                            const globalIndex = allImages.findIndex(i => i.id === img.id);
                            return (
                              <div key={img.id} className="relative group">
                                <button
                                  onClick={() => {
                                    setSelectedImageId(img.id);
                                    if (globalIndex >= 0) {
                                      setSelectedImageIndex(globalIndex);
                                    }
                                  }}
                                  className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                    isSelected
                                      ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20'
                                      : img.isRegenerated
                                      ? 'border-[#DC143C]/50 hover:border-[#DC143C]'
                                      : 'border-[#3F3F46] hover:border-[#8B5CF6]/50'
                                  }`}
                                >
                                  <img
                                    src={img.imageUrl}
                                    alt={img.label}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded ${
                                    img.isRegenerated ? 'bg-[#DC143C]' : 'bg-[#8B5CF6]'
                                  }`}>
                                    {img.isRegenerated ? 'Regenerated' : 'Pose'}
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {allImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {headshotAngles.map(angle => (
                          <label
                            key={angle.value}
                            className="px-3 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2 text-sm"
                          >
                            <Upload className="w-4 h-4" />
                            Upload {angle.label}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, angle.value)}
                              className="hidden"
                              disabled={isUploading}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Compact, all on one or two rows */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Specific Upload Buttons - Matching Create section */}
                    {headshotAngles.map(angle => (
                      <label
                        key={angle.value}
                        className="px-2.5 py-1 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C]/50 text-[#FFFFFF] rounded cursor-pointer transition-colors inline-flex items-center gap-1 text-xs"
                      >
                        <Upload className="w-3 h-3" />
                        {isUploading ? 'Uploading...' : angle.label}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, angle.value)}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    ))}
                    
                    <button
                      onClick={() => {
                        if (onGeneratePosePackage) {
                          onGeneratePosePackage(character.id);
                        } else {
                          toast.error('Generate pose package function not available');
                        }
                      }}
                      className="px-2.5 py-1 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C]/50 text-[#FFFFFF] rounded transition-colors inline-flex items-center gap-1 text-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      Pose Package
                      <span className="px-0.5 py-0 rounded text-[9px] font-medium bg-[#DC143C] text-white ml-0.5">NEW</span>
                    </button>
                    
                  </div>

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
                          {displayPhysicalAttributes.typicalClothing && <p className="text-[#808080] text-sm">Typical Clothing: <span className="text-[#FFFFFF]">{displayPhysicalAttributes.typicalClothing}</span></p>}
                          {!displayPhysicalAttributes.height && !displayPhysicalAttributes.bodyType && !displayPhysicalAttributes.eyeColor && !displayPhysicalAttributes.hairColor && !displayPhysicalAttributes.hairLength && !displayPhysicalAttributes.hairStyle && !displayPhysicalAttributes.typicalClothing && (
                            <p className="text-[#808080] text-sm">No physical attributes set</p>
                          )}
                        </div>
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
                            value={selectedOutfitReferences || ''}
                            onChange={(e) => setSelectedOutfitReferences(e.target.value || null)}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#FFFFFF] text-sm focus:border-[#8B5CF6] focus:outline-none"
                          >
                            <option value="">All Outfits ({poseReferences.length})</option>
                            {outfitNames.map((outfitName) => {
                              const outfitPoses = posesByOutfit[outfitName] || [];
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
                                <option key={outfitName} value={outfitName}>
                                  {outfitDisplayName} ({outfitPoses.length})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      
                      {/* Production Hub Images Grid - Filtered by selected outfit */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {(selectedOutfitReferences ? posesByOutfit[selectedOutfitReferences] || [] : poseReferences).map((img) => {
                          // All images in poseReferences are Production Hub images (editable/deletable)
                          const isSelected = selectedImageIds.has(img.id);
                          return (
                            <div
                              key={img.id}
                              className={`relative group aspect-square bg-[#141414] border rounded-lg overflow-hidden transition-colors ${
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
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
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
                              <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent transition-opacity ${
                                selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Delete button - all Production Hub images can be deleted - only show when not in selection mode */}
                                {!img.isBase && !selectionMode && (
                              <div className="absolute top-2 right-2">
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
                                    {/* 🔥 NEW: Regenerate option (only for poses with poseId) */}
                                    {(img.poseId || img.metadata?.poseId) && img.s3Key && (() => {
                                      // 🔥 FIX: Ensure both values are strings and trimmed for reliable comparison
                                      const currentS3Key = (img.s3Key || '').trim();
                                      const isRegenerating = regeneratingS3Key !== null && regeneratingS3Key.trim() === currentS3Key;
                                      return (
                                        <DropdownMenuItem
                                          className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Don't allow if this specific image is already regenerating
                                            if (isRegenerating) {
                                              console.log('[CharacterDetailModal] Blocked duplicate click for s3Key:', currentS3Key);
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
                                          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
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
                                          // 🔥 FIX: Extract s3Key from multiple possible locations
                                          // Check img.s3Key first, then img.metadata.s3Key, then try to extract from poseReferences
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
                                          
                                          // 🔥 FIX: If still not found, try to extract from img.id if it's a string s3Key
                                          if (!imgS3Key && img.id && typeof img.id === 'string' && img.id.startsWith('pose_')) {
                                            // img.id might be 'pose_{s3Key}', extract the s3Key
                                            const extractedS3Key = img.id.replace(/^pose_/, '');
                                            if (extractedS3Key && extractedS3Key.length > 0) {
                                              imgS3Key = extractedS3Key;
                                            }
                                          }
                                          
                                          // 🔥 FIX: Last resort - check if img.id itself is an s3Key (for string refs)
                                          if (!imgS3Key && img.id && typeof img.id === 'string' && !img.id.startsWith('pose_') && !img.id.startsWith('ref_')) {
                                            // Might be a direct s3Key
                                            imgS3Key = img.id;
                                          }
                                          
                                          if (!imgS3Key) {
                                            console.error('[CharacterDetailModal] Missing S3 key for image:', {
                                              imgId: img.id,
                                              imgLabel: img.label,
                                              imgKeys: Object.keys(img),
                                              imgS3Key: img.s3Key,
                                              imgMetadata: (img as any).metadata,
                                              characterPoseRefs: (character as any).angleReferences || character.poseReferences,
                                              imgFull: img
                                            });
                                            throw new Error('Missing S3 key for image');
                                          }
                                          
                                          // Check if it's a pose reference (AI-generated) or user reference
                                          const allPoseRefs = (character as any).angleReferences || character.poseReferences || [];
                                          const isPoseRef = allPoseRefs.some((poseRef: any) => {
                                            const poseS3Key = typeof poseRef === 'string' ? poseRef : poseRef.s3Key;
                                            return poseS3Key === imgS3Key;
                                          });
                                          
                                          if (isPoseRef) {
                                            // Delete from poseReferences (AI-generated poses)
                                            const currentPoseReferences = (character as any).angleReferences || character.poseReferences || [];
                                            console.log('[CharacterDetailModal] 🔍 Before deletion:', {
                                              currentCount: currentPoseReferences.length,
                                              imgS3Key,
                                              allS3Keys: currentPoseReferences.map((r: any) => typeof r === 'string' ? r : r.s3Key)
                                            });
                                            
                                            const updatedPoseReferences = currentPoseReferences.filter((ref: any) => {
                                              const refS3Key = typeof ref === 'string' ? ref : ref.s3Key;
                                              return refS3Key !== imgS3Key;
                                            });
                                            
                                            console.log('[CharacterDetailModal] 🔍 After filtering:', {
                                              updatedCount: updatedPoseReferences.length,
                                              removed: currentPoseReferences.length - updatedPoseReferences.length
                                            });
                                            
                                            await onUpdate(character.id, { 
                                              poseReferences: updatedPoseReferences
                                            });
                                            
                                            console.log('[CharacterDetailModal] ✅ Update call completed');
                                            
                                            // 🔥 FIX: Close dropdown after deletion
                                            // The dropdown should close automatically, but we ensure it by waiting for the update
                                          } else {
                                            // Delete from character.references array (user-uploaded references in Production Hub)
                                            const currentReferences = character.references || [];
                                            console.log('[CharacterDetailModal] 🔍 Deleting from references:', {
                                              currentCount: currentReferences.length,
                                              imgS3Key
                                            });
                                            
                                            const updatedReferences = currentReferences.filter((ref: any) => {
                                              const refS3Key = typeof ref === 'string' ? ref : ref.s3Key;
                                              return refS3Key !== imgS3Key;
                                            });
                                            
                                            await onUpdate(character.id, { 
                                              references: updatedReferences 
                                            });
                                            
                                            console.log('[CharacterDetailModal] ✅ Update call completed');
                                            
                                            // 🔥 FIX: Close dropdown after deletion
                                          }
                                          
                                          // 🔥 ONE-WAY SYNC: Only update Production Hub backend
                                          // Production Hub images (createdIn: 'production-hub') should NOT sync back to Creation section
                                          
                                          // 🔥 FIX: Don't invalidate queries here - CharacterBankPanel.updateCharacter already handles refetch
                                          // The refetch will update the character prop automatically, causing the modal to re-render with updated data
                                          
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
                        })}
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {userReferences.map((img) => {
                          return (
                            <div
                              key={img.id}
                              className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden opacity-75"
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
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
            </div>
          </motion.div>
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
      
      {/* Image Viewer */}
      {previewImageIndex !== null && (
        <ImageViewer
          images={(() => {
            // Get images for the current group (outfit)
            if (previewGroupName && posesByOutfit[previewGroupName]) {
              return posesByOutfit[previewGroupName].map((img): ImageItem => ({
                id: img.id || img.s3Key || `img_${Date.now()}`,
                url: img.imageUrl,
                label: img.label,
                s3Key: img.s3Key,
                metadata: img.metadata || { outfitName: img.outfitName, poseId: img.poseId }
              }));
            }
            // Fallback to all images
            return allImages.map((img): ImageItem => ({
              id: img.id,
              url: img.imageUrl,
              label: img.label,
              s3Key: img.s3Key,
              metadata: (img as any).metadata
            }));
          })()}
          allImages={allImages.map((img): ImageItem => ({
            id: img.id,
            url: img.imageUrl,
            label: img.label,
            s3Key: img.s3Key,
            metadata: (img as any).metadata
          }))}
          currentIndex={previewImageIndex}
          isOpen={previewImageIndex !== null}
          onClose={() => {
            setPreviewImageIndex(null);
            setPreviewGroupName(null);
          }}
          onDownload={async (image) => {
            try {
              const poseName = image.metadata?.poseId || image.label || 'pose';
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

