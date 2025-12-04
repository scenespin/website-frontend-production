'use client';

/**
 * CharacterDetailModal - Full-screen character detail view
 * 
 * Features:
 * - Image gallery (main + references)
 * - 3D image button/display
 * - Description and info from script
 * - Uploaded images management
 * - Advanced options
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, User, FileText, Box, Download, Trash2, Plus, Camera, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CharacterProfile } from './ProductionPageLayout';
import { toast } from 'sonner';
import { PerformanceControls, type PerformanceSettings } from '../characters/PerformanceControls';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';

interface CharacterDetailModalProps {
  character: CharacterProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (characterId: string, updates: Partial<CharacterProfile>) => void;
  onDelete?: (characterId: string) => void;
  projectId: string;
  onUploadImage?: (characterId: string, file: File) => Promise<void>;
  onGenerate3D?: (characterId: string) => Promise<void>;
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
  projectId,
  onUploadImage,
  onGenerate3D,
  onGenerateVariations,
  onGeneratePosePackage,
  hasAdvancedFeatures = false,
  performanceSettings,
  onPerformanceSettingsChange
}: CharacterDetailModalProps) {
  const { getToken } = useAuth();
  const { updateCharacter, characters, isEntityInScript } = useScreenplay();
  const { state: editorState } = useEditor();
  
  // 🔥 FIX: Use ref to track latest characters to avoid stale closures in async functions
  const charactersRef = useRef(characters);
  useEffect(() => {
    charactersRef.current = characters;
  }, [characters]);
  
  // Get the full Character from context (has arcStatus, physicalAttributes, arcNotes)
  const contextCharacter = characters.find(c => c.id === character.id);
  const allImagesFromContext = contextCharacter?.images || [];
  
  // Check if character is in script (for locking mechanism)
  const isInScript = useMemo(() => {
    return contextCharacter ? isEntityInScript(editorState.content, contextCharacter.name, 'character') : false;
  }, [contextCharacter, editorState.content, isEntityInScript]);
  
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(character.description || '');
  const [type, setType] = useState<CharacterProfile['type']>(character.type);
  const [arcStatus, setArcStatus] = useState<'introduced' | 'developing' | 'resolved'>(contextCharacter?.arcStatus || 'introduced');
  const [arcNotes, setArcNotes] = useState(contextCharacter?.arcNotes || '');
  const [physicalAttributes, setPhysicalAttributes] = useState(contextCharacter?.physicalAttributes || {
    height: undefined,
    bodyType: undefined,
    eyeColor: undefined,
    hairColor: undefined,
    hairLength: undefined,
    hairStyle: undefined,
    typicalClothing: undefined
  });
  
  // Update state when character changes
  useEffect(() => {
    if (contextCharacter) {
      setName(contextCharacter.name);
      setDescription(contextCharacter.description || '');
      setType(contextCharacter.type);
      setArcStatus(contextCharacter.arcStatus || 'introduced');
      setArcNotes(contextCharacter.arcNotes || '');
      setPhysicalAttributes(contextCharacter.physicalAttributes || {
        height: undefined,
        bodyType: undefined,
        eyeColor: undefined,
        hairColor: undefined,
        hairLength: undefined,
        hairStyle: undefined,
        typicalClothing: undefined
      });
    }
  }, [contextCharacter]);
  
  // Separate user-uploaded references from generated poses for better organization
  const userReferences = [
    character.baseReference ? {
      id: 'base',
      imageUrl: character.baseReference.imageUrl,
      s3Key: character.baseReference.s3Key,
      label: 'Base Reference',
      isBase: true,
      isPose: false,
      index: -1 // Will be set below
    } : null,
    ...character.references.map(ref => ({
      id: ref.id,
      imageUrl: ref.imageUrl,
      s3Key: ref.s3Key,
      label: ref.label || 'Reference',
      isBase: false,
      isPose: false,
      index: -1 // Will be set below
    }))
  ].filter(Boolean) as Array<{id: string; imageUrl: string; s3Key?: string; label: string; isBase: boolean; isPose: boolean; index: number}>;
  
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
  };

  const poseReferences: PoseReferenceWithOutfit[] = (character.poseReferences || []).map(ref => {
    // Extract outfit from S3 key or metadata
    const outfitFromS3 = extractOutfitFromS3Key(ref.s3Key);
    // Also check context images for outfit metadata
    const contextImage = allImagesFromContext.find((img: any) => 
      (img.metadata?.s3Key === ref.s3Key || img.s3Key === ref.s3Key) &&
      img.metadata?.source === 'pose-generation'
    );
    const outfitFromMetadata = contextImage?.metadata?.outfitName;
    const outfitName = outfitFromMetadata || outfitFromS3;
    
    return {
      id: ref.id,
      imageUrl: ref.imageUrl,
      s3Key: ref.s3Key,
      label: ref.label || 'Pose',
      isBase: false,
      isPose: true,
      outfitName: outfitName, // Store outfit name for grouping
      index: -1 // Will be set below
    };
  });
  
  // Map to context images array to get the actual index
  // Find each image in the context's images array by s3Key
  userReferences.forEach((ref, idx) => {
    if (ref.s3Key) {
      const contextIndex = allImagesFromContext.findIndex((img: any) => 
        (img.metadata?.s3Key === ref.s3Key || img.s3Key === ref.s3Key) &&
        (!img.metadata?.source || img.metadata?.source === 'user-upload')
      );
      ref.index = contextIndex >= 0 ? contextIndex : -1;
    }
  });
  
  poseReferences.forEach((ref, idx) => {
    if (ref.s3Key) {
      const contextIndex = allImagesFromContext.findIndex((img: any) => 
        (img.metadata?.s3Key === ref.s3Key || img.s3Key === ref.s3Key) &&
        img.metadata?.source === 'pose-generation'
      );
      ref.index = contextIndex >= 0 ? contextIndex : -1;
    }
  });
  
  // 🔥 NEW: Group poses by outfit
  const posesByOutfit = useMemo(() => {
    const grouped: Record<string, PoseReferenceWithOutfit[]> = {};
    poseReferences.forEach(pose => {
      const outfit = pose.outfitName || 'default';
      if (!grouped[outfit]) {
        grouped[outfit] = [];
      }
      grouped[outfit].push(pose);
    });
    return grouped;
  }, [poseReferences]);
  
  // Get outfit names sorted (default first, then alphabetically)
  const outfitNames = useMemo(() => {
    const outfits = Object.keys(posesByOutfit);
    const defaultOutfit = outfits.find(o => o === 'default');
    const otherOutfits = outfits.filter(o => o !== 'default').sort();
    return defaultOutfit ? [defaultOutfit, ...otherOutfits] : otherOutfits;
  }, [posesByOutfit]);
  
  // Selected outfit tab state
  const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
  
  // Set default outfit when poses change
  useEffect(() => {
    if (outfitNames.length > 0 && !selectedOutfit) {
      setSelectedOutfit(outfitNames[0]);
    }
  }, [outfitNames, selectedOutfit]);
  
  // Combined for main display (all images, not grouped)
  const allImages = [...userReferences, ...poseReferences];

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

  const handleGenerate3D = async () => {
    if (!onGenerate3D) {
      toast.error('3D generation not available');
      return;
    }

    setIsGenerating3D(true);
    try {
      await onGenerate3D(character.id);
      toast.success('3D model generation started');
    } catch (error) {
      console.error('3D generation failed:', error);
      toast.error('Failed to generate 3D model');
    } finally {
      setIsGenerating3D(false);
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
                  {editing ? (
                    <div className="w-full">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isInScript}
                        className={`text-xl font-bold bg-[#1F1F1F] border border-[#3F3F46] rounded px-3 py-2 text-[#FFFFFF] w-full focus:border-[#DC143C] focus:outline-none ${
                          isInScript ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        maxLength={100}
                      />
                      {isInScript && (
                        <p className="text-xs text-[#808080] mt-1">
                          Name cannot be changed because this character appears in your script. Edit the script directly to change the name.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-[#FFFFFF]">{character.name}</h2>
                      <p className="text-sm text-[#808080] capitalize">
                        {character.type} character
                        {isInScript && <span className="ml-2 text-[#6B7280]">(locked - appears in script)</span>}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
                {editing && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          // Use updateCharacter from ScreenplayContext to ensure all fields are synced
                          if (contextCharacter) {
                            await updateCharacter(contextCharacter.id, {
                              name: isInScript ? contextCharacter.name : name, // Don't update name if locked
                              description,
                              type,
                              arcStatus,
                              arcNotes,
                              physicalAttributes
                            });
                            // Also call onUpdate for CharacterProfile updates
                            await onUpdate(character.id, { name: isInScript ? character.name : name, description, type });
                          }
                          setEditing(false);
                          toast.success('Character updated successfully');
                        } catch (error) {
                          console.error('Update failed:', error);
                          toast.error('Failed to update character');
                        }
                      }}
                      className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#DC143C] hover:text-[#FFFFFF]"
                      title="Save"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (contextCharacter) {
                          setName(contextCharacter.name);
                          setDescription(contextCharacter.description || '');
                          setType(contextCharacter.type);
                          setArcStatus(contextCharacter.arcStatus || 'introduced');
                          setArcNotes(contextCharacter.arcNotes || '');
                          setPhysicalAttributes(contextCharacter.physicalAttributes || {
                            height: undefined,
                            bodyType: undefined,
                            eyeColor: undefined,
                            hairColor: undefined,
                            hairLength: undefined,
                            hairStyle: undefined,
                            typicalClothing: undefined
                          });
                        }
                        setEditing(false);
                      }}
                      className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
                {!editing && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
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
                References ({character.referenceCount})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {activeTab === 'gallery' && (
                <div className="p-6 space-y-6">
                  {/* Main Image Display */}
                  {allImages.length > 0 ? (
                    <div className="mb-6">
                      <div className="relative aspect-video bg-[#1F1F1F] rounded-lg overflow-hidden border border-[#3F3F46] mb-4">
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
                  ) : null}
                  
                  {/* Reference Images Section */}
                  {userReferences.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          Reference Images ({userReferences.length})
                        </h3>
                        <span className="text-xs text-[#6B7280]">User uploaded</span>
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
                              {/* Delete button - only show on hover */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm(`Delete ${img.isBase ? 'base reference' : 'reference image'}?`)) {
                                    return;
                                  }
                                  // Get current character from context to ensure we have latest images
                                  // Use same pattern as CharacterDetailSidebar: characters.find() with fallback
                                  // Note: context character has 'images' property, CharacterProfile doesn't
                                  const currentCharacter = charactersRef.current.find(c => c.id === character.id);
                                  const currentImages = currentCharacter?.images || [];
                                  
                                  // Store original images for rollback (same pattern as CharacterDetailSidebar)
                                  const originalImages = [...currentImages];
                                  
                                  try {
                                    // 🔥 FIX: Use the index from userReferences (already mapped to context images)
                                    // The userReferences array has an 'index' property that maps to the context images array
                                    let actualIndex = img.index;
                                    
                                    // If index is not set or invalid, try to find by s3Key or id
                                    if (actualIndex < 0 || actualIndex >= currentImages.length) {
                                      actualIndex = currentImages.findIndex((image: any) => {
                                        // Try matching by ID first (most reliable)
                                        if (img.id && image.id === img.id) {
                                          return true;
                                        }
                                        // Then try matching by s3Key
                                        const imgS3Key = image.metadata?.s3Key || image.s3Key;
                                        const deleteS3Key = img.s3Key;
                                        if (imgS3Key && deleteS3Key && imgS3Key === deleteS3Key) {
                                          // For base reference, check if it's the base
                                          if (img.isBase) {
                                            return image.metadata?.isBase || image.isBase || false;
                                          }
                                          // For other references, check source
                                          return !image.metadata?.source || image.metadata?.source === 'user-upload';
                                        }
                                        return false;
                                      });
                                    }
                                    
                                    if (actualIndex < 0 || actualIndex >= currentImages.length) {
                                      console.error('[CharacterDetailModal] Image not found:', {
                                        imgId: img.id,
                                        imgS3Key: img.s3Key,
                                        imgIndex: img.index,
                                        currentImageCount: currentImages.length,
                                        currentImages: currentImages.map((img: any) => ({
                                          id: img.id,
                                          s3Key: img.metadata?.s3Key || img.s3Key,
                                          source: img.metadata?.source
                                        }))
                                      });
                                      throw new Error('Image not found in character data');
                                    }
                                    
                                    // Simple index-based deletion (same pattern as CharacterDetailSidebar)
                                    const updatedImages = currentImages.filter((_, i) => i !== actualIndex);
                                    
                                    // Optimistic UI update - remove image immediately
                                    // Call updateCharacter from context (follows the same pattern as CharacterDetailSidebar)
                                    await updateCharacter(character.id, { images: updatedImages });
                                    
                                    // Sync from context after update (with delay for DynamoDB consistency)
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    const updatedCharacterFromContext = charactersRef.current.find(c => c.id === character.id);
                                    if (updatedCharacterFromContext) {
                                      // Trigger a refresh by calling onUpdate
                                      await onUpdate(character.id, {});
                                    }
                                    
                                    toast.success('Reference image deleted');
                                  } catch (error: any) {
                                    console.error('Failed to delete reference image:', error);
                                    // Rollback on error (same pattern as CharacterDetailSidebar)
                                    try {
                                      await updateCharacter(character.id, { images: originalImages });
                                      await onUpdate(character.id, {});
                                    } catch (rollbackError) {
                                      console.error('Failed to rollback image deletion:', rollbackError);
                                    }
                                    toast.error(`Failed to delete image: ${error.message}`);
                                  }
                                }}
                                className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 hover:bg-red-700 rounded text-white"
                                title="Delete image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                        </div>
                      )}
                  
                  {/* Generated Poses Section - Organized by Outfit */}
                  {poseReferences.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">
                          Generated Poses ({poseReferences.length})
                        </h3>
                        <span className="text-xs text-[#6B7280]">AI generated</span>
                      </div>
                      
                      {/* Outfit Tabs - Only show if multiple outfits */}
                      {outfitNames.length > 1 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#3F3F46] scrollbar-track-transparent">
                          {outfitNames.map((outfitName) => {
                            // Format outfit name for display
                            // If default, use typicalClothing or "Default Outfit"
                            // Otherwise, convert from sanitized format (e.g., "business-casual" -> "Business Casual")
                            let outfitDisplayName: string;
                            if (outfitName === 'default') {
                              outfitDisplayName = physicalAttributes?.typicalClothing 
                                ? physicalAttributes.typicalClothing
                                : 'Default Outfit';
                            } else {
                              // Convert sanitized name back to readable format
                              // e.g., "business-casual" -> "Business Casual"
                              outfitDisplayName = outfitName
                                .split('-')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                            }
                            const poseCount = posesByOutfit[outfitName]?.length || 0;
                            
                            return (
                              <button
                                key={outfitName}
                                onClick={() => setSelectedOutfit(outfitName)}
                                className={cn(
                                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                                  selectedOutfit === outfitName
                                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20"
                                    : "bg-[#1F1F23] text-[#B3B3B3] hover:bg-[#2C2C2E] border border-[#3F3F46]"
                                )}
                              >
                                {outfitDisplayName} <span className="opacity-75">({poseCount})</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Show outfit name as header if single outfit */}
                      {outfitNames.length === 1 && outfitNames[0] !== 'default' && (
                        <div className="mb-3">
                          <p className="text-xs text-[#808080]">
                            Outfit: <span className="text-[#B3B3B3] font-medium">
                              {outfitNames[0]
                                .split('-')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {/* Poses Grid - Filtered by selected outfit */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {(selectedOutfit ? posesByOutfit[selectedOutfit] || [] : poseReferences).map((img, idx) => {
                          const globalIndex = allImages.findIndex(i => i.id === img.id);
                          return (
                            <div key={img.id} className="relative group">
                              <button
                                onClick={() => setSelectedImageIndex(globalIndex)}
                                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === globalIndex
                                    ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20'
                                    : 'border-[#3F3F46] hover:border-[#8B5CF6]/50'
                                }`}
                              >
                                <img
                                  src={img.imageUrl}
                                  alt={img.label}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#8B5CF6] text-white text-[10px] rounded">
                                  Pose
                                </div>
                              </button>
                              {/* Delete button - only show on hover */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm('Delete generated pose?')) {
                                    return;
                                  }
                                  
                                  // 🔥 COPY PATTERN FROM CharacterDetailSidebar (working code)
                                  // Get current character from context to ensure we have latest images
                                  const currentCharacter = charactersRef.current.find(c => c.id === character.id) || character;
                                  if (!currentCharacter) {
                                    toast.error('Character not found');
                                    return;
                                  }
                                  
                                  // Type guard: Character has images, CharacterProfile doesn't
                                  const currentImages = ('images' in currentCharacter ? currentCharacter.images : allImagesFromContext) || [];
                                  
                                  // Store original images for rollback
                                  const originalImages = [...currentImages];
                                  
                                  try {
                                    // 🔥 KEY FIX: Match the same way CharacterDetailSidebar does
                                    // img is a PoseReferenceWithOutfit which has s3Key at top level (from CharacterReference)
                                    // In CharacterDetailSidebar, it uses imageToDelete.metadata?.s3Key because images come from getEntityImages
                                    // But here, img comes from character.poseReferences which has s3Key at top level
                                    const deleteS3Key = img.s3Key; // PoseReferenceWithOutfit has s3Key at top level
                                    
                                    if (!deleteS3Key) {
                                      throw new Error('Pose image missing S3 key');
                                    }
                                    
                                    // Find the actual index in the full images array
                                    // Same pattern as CharacterDetailSidebar (for AI-generated images)
                                    // Context images have s3Key in metadata.s3Key (ImageAsset structure)
                                    const actualIndex = currentImages.findIndex((image: any) => {
                                      const imgS3Key = image.metadata?.s3Key || image.s3Key;
                                      // ImageAsset has s3Key in metadata, not at top level (per CharacterDetailSidebar comment)
                                      return imgS3Key === deleteS3Key && 
                                        (image.metadata?.source === 'pose-generation' || image.metadata?.source === 'image-generation');
                                    });
                                    
                                    if (actualIndex < 0) {
                                      console.error('[CharacterDetailModal] Pose not found in character data:', {
                                        deleteS3Key,
                                        imgId: img.id,
                                        imgUrl: img.imageUrl,
                                        outfitName: img.outfitName,
                                        currentImageCount: currentImages.length,
                                        currentImages: currentImages.map((img: any, idx: number) => ({
                                          idx,
                                          s3Key: img.metadata?.s3Key || img.s3Key,
                                          source: img.metadata?.source,
                                          imageUrl: img.imageUrl?.substring(0, 50)
                                        }))
                                      });
                                      throw new Error('Pose image not found in character data');
                                    }
                                    
                                    // Simple index-based deletion (same pattern as CharacterDetailSidebar)
                                    const updatedImages = currentImages.filter((_, i) => i !== actualIndex);
                                    
                                    // Optimistic UI update - remove image immediately
                                    // Call updateCharacter from context (follows the same pattern as CharacterDetailSidebar)
                                    await updateCharacter(character.id, { images: updatedImages });
                                    
                                    // Sync from context after update (with delay for DynamoDB consistency)
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    const updatedCharacterFromContext = charactersRef.current.find(c => c.id === character.id);
                                    if (updatedCharacterFromContext) {
                                      // Trigger a refresh by calling onUpdate
                                      await onUpdate(character.id, {});
                                    }
                                    
                                    toast.success('Pose deleted');
                                  } catch (error: any) {
                                    console.error('[CharacterDetailModal] Failed to delete pose:', error);
                                    // Rollback on error (same pattern as CharacterDetailSidebar)
                                    try {
                                      await updateCharacter(character.id, { images: originalImages });
                                      await onUpdate(character.id, {});
                                    } catch (rollbackError) {
                                      console.error('[CharacterDetailModal] Failed to rollback pose deletion:', rollbackError);
                                    }
                                    toast.error(`Failed to delete pose: ${error.message}`);
                                  }
                                }}
                                className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 hover:bg-red-700 rounded text-white"
                                title="Delete pose"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
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
                    <button
                      onClick={() => {
                        if (onGenerateVariations) {
                          onGenerateVariations(character.id);
                        } else {
                          toast.error('Generate variations function not available');
                        }
                      }}
                      className="px-2.5 py-1 bg-[#DC143C] hover:bg-[#B91238] text-white rounded transition-colors inline-flex items-center gap-1 text-xs font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate Variations
                    </button>
                    
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
                    
                    <button
                      onClick={handleGenerate3D}
                      disabled={isGenerating3D}
                      className="px-2.5 py-1 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#808080]/50 text-[#808080] hover:text-[#FFFFFF] rounded transition-colors inline-flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export 3D model (500 credits)"
                    >
                      <Box className="w-3 h-3" />
                      3D
                      <span className="text-[9px] text-[#808080] ml-0.5">500cr</span>
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
                        {editing ? (
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
                            maxLength={100}
                          />
                        ) : (
                          <p className="text-[#FFFFFF]">{character.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Type</label>
                        {editing ? (
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value as CharacterProfile['type'])}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
                          >
                            <option value="lead">Lead</option>
                            <option value="supporting">Supporting</option>
                            <option value="minor">Minor</option>
                          </select>
                        ) : (
                          <p className="text-[#FFFFFF] capitalize">{character.type}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                        {editing ? (
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none resize-none"
                            rows={4}
                            maxLength={500}
                          />
                        ) : (
                          <p className="text-[#808080]">{character.description || 'No description'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Arc Status</label>
                        {editing ? (
                          <select
                            value={arcStatus}
                            onChange={(e) => setArcStatus(e.target.value as 'introduced' | 'developing' | 'resolved')}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
                          >
                            <option value="introduced">Introduced</option>
                            <option value="developing">Developing</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        ) : (
                          <p className="text-[#FFFFFF] capitalize">{arcStatus}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">
                          Physical Attributes <span className="text-[#6B7280] normal-case">(Optional)</span>
                        </label>
                        {editing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <select
                                  value={physicalAttributes.height || ''}
                                  onChange={(e) => setPhysicalAttributes({
                                    ...physicalAttributes,
                                    height: e.target.value as 'short' | 'average' | 'tall' | undefined || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                >
                                  <option value="">Height</option>
                                  <option value="short">Short</option>
                                  <option value="average">Average</option>
                                  <option value="tall">Tall</option>
                                </select>
                              </div>
                              <div>
                                <select
                                  value={physicalAttributes.bodyType || ''}
                                  onChange={(e) => setPhysicalAttributes({
                                    ...physicalAttributes,
                                    bodyType: e.target.value as 'slim' | 'athletic' | 'muscular' | 'heavyset' | 'average' | undefined || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                >
                                  <option value="">Body Type</option>
                                  <option value="slim">Slim</option>
                                  <option value="athletic">Athletic</option>
                                  <option value="muscular">Muscular</option>
                                  <option value="heavyset">Heavyset</option>
                                  <option value="average">Average</option>
                                </select>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={physicalAttributes.eyeColor || ''}
                                  onChange={(e) => setPhysicalAttributes({
                                    ...physicalAttributes,
                                    eyeColor: e.target.value || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                  placeholder="Eye Color"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={physicalAttributes.hairColor || ''}
                                  onChange={(e) => setPhysicalAttributes({
                                    ...physicalAttributes,
                                    hairColor: e.target.value || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                  placeholder="Hair Color"
                                />
                              </div>
                              <div>
                                <select
                                  value={physicalAttributes.hairLength || ''}
                                  onChange={(e) => setPhysicalAttributes({
                                    ...physicalAttributes,
                                    hairLength: e.target.value as 'bald' | 'very-short' | 'short' | 'medium' | 'long' | undefined || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                >
                                  <option value="">Hair Length</option>
                                  <option value="bald">Bald</option>
                                  <option value="very-short">Very Short</option>
                                  <option value="short">Short</option>
                                  <option value="medium">Medium</option>
                                  <option value="long">Long</option>
                                </select>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={physicalAttributes.hairStyle || ''}
                                  onChange={(e) => setPhysicalAttributes({
                                    ...physicalAttributes,
                                    hairStyle: e.target.value || undefined
                                  })}
                                  className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                  placeholder="Hair Style (curly, straight, wavy)"
                                />
                              </div>
                            </div>
                            <div>
                              <input
                                type="text"
                                value={physicalAttributes.typicalClothing || ''}
                                onChange={(e) => setPhysicalAttributes({
                                  ...physicalAttributes,
                                  typicalClothing: e.target.value || undefined
                                })}
                                className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none text-sm"
                                placeholder="Typical Clothing (e.g., 'business casual', 'military uniform', 'casual jeans and t-shirt')"
                              />
                            </div>
                            <p className="text-xs text-[#6B7280] mt-1">
                              💡 These help AI generate more accurate character images and pose packages
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {physicalAttributes.height && <p className="text-[#808080] text-sm">Height: <span className="text-[#FFFFFF] capitalize">{physicalAttributes.height}</span></p>}
                            {physicalAttributes.bodyType && <p className="text-[#808080] text-sm">Body Type: <span className="text-[#FFFFFF] capitalize">{physicalAttributes.bodyType}</span></p>}
                            {physicalAttributes.eyeColor && <p className="text-[#808080] text-sm">Eye Color: <span className="text-[#FFFFFF]">{physicalAttributes.eyeColor}</span></p>}
                            {physicalAttributes.hairColor && <p className="text-[#808080] text-sm">Hair Color: <span className="text-[#FFFFFF]">{physicalAttributes.hairColor}</span></p>}
                            {physicalAttributes.hairLength && <p className="text-[#808080] text-sm">Hair Length: <span className="text-[#FFFFFF] capitalize">{physicalAttributes.hairLength}</span></p>}
                            {physicalAttributes.hairStyle && <p className="text-[#808080] text-sm">Hair Style: <span className="text-[#FFFFFF]">{physicalAttributes.hairStyle}</span></p>}
                            {physicalAttributes.typicalClothing && <p className="text-[#808080] text-sm">Typical Clothing: <span className="text-[#FFFFFF]">{physicalAttributes.typicalClothing}</span></p>}
                            {!physicalAttributes.height && !physicalAttributes.bodyType && !physicalAttributes.eyeColor && !physicalAttributes.hairColor && !physicalAttributes.hairLength && !physicalAttributes.hairStyle && !physicalAttributes.typicalClothing && (
                              <p className="text-[#808080] text-sm">No physical attributes set</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Arc Notes</label>
                        {editing ? (
                          <textarea
                            value={arcNotes}
                            onChange={(e) => setArcNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none resize-none"
                            rows={3}
                            placeholder="Character arc development notes"
                          />
                        ) : (
                          <p className="text-[#808080]">{arcNotes || 'No arc notes'}</p>
                        )}
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
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {character.references.map((ref) => (
                      <div
                        key={ref.id}
                        className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden hover:border-[#DC143C] transition-colors"
                      >
                        <img
                          src={ref.imageUrl}
                          alt={ref.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs text-[#FFFFFF] truncate">{ref.label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

