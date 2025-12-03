"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Camera, Upload } from "lucide-react"
import { motion } from 'framer-motion'
import type { Character, ImageAsset } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useEditor } from '@/contexts/EditorContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'
import { ImagePromptModal } from '@/components/images/ImagePromptModal'
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

interface CharacterDetailSidebarProps {
  character?: Character | null
  isCreating: boolean
  initialData?: Partial<Character> // NEW: Pre-fill form with AI-generated data
  onClose: () => void
  onCreate: (data: any) => void
  onUpdate: (character: Character) => void
  onDelete: (characterId: string) => void
  onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string; existingData?: { name?: string; description?: string; type?: string; arcStatus?: string } }) => void
  onOpenCharacterBank?: (characterId: string) => void // NEW: Open Character Bank Manager
}

export default function CharacterDetailSidebar({
  character,
  isCreating,
  initialData,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSwitchToChatImageMode,
  onOpenCharacterBank
}: CharacterDetailSidebarProps) {
  const { getEntityImages, removeImageFromEntity, isEntityInScript, addImageToEntity, updateCharacter, screenplayId, characters } = useScreenplay()
  const { state: editorState } = useEditor()
  const { getToken } = useAuth()
  
  // Check if character is in script (if editing existing character) - memoized to prevent render loops
  const isInScript = useMemo(() => {
    return character ? isEntityInScript(editorState.content, character.name, 'character') : false;
  }, [character, editorState.content, isEntityInScript]);
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showImagePromptModal, setShowImagePromptModal] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ imageUrl: string; s3Key: string; angle?: string; prompt?: string; modelUsed?: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [showStorageModal, setShowStorageModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{url: string; s3Key: string; name: string; type: 'image' | 'video' | 'attachment'} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [regeneratedImageUrls, setRegeneratedImageUrls] = useState<Record<string, string>>({})
  
  // 🔥 FIX: Use ref to track latest characters to avoid stale closures in async functions
  const charactersRef = useRef(characters);
  useEffect(() => {
    charactersRef.current = characters;
  }, [characters]);
  
  // File input refs for headshot and additional references
  const additionalFileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<any>(
    character ? { ...character } : (initialData ? {
      name: initialData.name || '',
      type: initialData.type || 'lead',
      arcStatus: initialData.arcStatus || 'introduced',
      description: initialData.description || '',
      arcNotes: initialData.arcNotes || '',
      physicalAttributes: initialData.physicalAttributes || {}
    } : {
      name: '',
      type: 'lead',
      arcStatus: 'introduced',
      description: '',
      arcNotes: '',
      physicalAttributes: {}
    })
  )
  
  // 🔥 FIX: Only update formData when character ID actually changes (not when isCreating or initialData changes)
  // This prevents resetting user input when uploading images during character creation
  // Use a ref to track the previous character ID to detect actual changes
  const prevCharacterIdRef = useRef<string | undefined>(character?.id);
  
  useEffect(() => {
    // Only update if character ID actually changed (switching between characters or create/edit mode)
    if (character?.id !== prevCharacterIdRef.current) {
      if (character) {
        // Switching to edit mode - load character data
        setFormData({ ...character });
        prevCharacterIdRef.current = character.id;
      } else if (initialData) {
        // Switching to create mode with initialData - use initialData
        setFormData({
          name: initialData.name || '',
          type: initialData.type || 'lead',
          arcStatus: initialData.arcStatus || 'introduced',
          description: initialData.description || '',
          arcNotes: initialData.arcNotes || '',
          physicalAttributes: initialData.physicalAttributes || {}
        });
        prevCharacterIdRef.current = undefined;
      } else {
        // Switching to create mode without initialData - reset to defaults
        setFormData({
          name: '',
          type: 'lead',
          arcStatus: 'introduced',
          description: '',
          arcNotes: '',
          physicalAttributes: {}
        });
        prevCharacterIdRef.current = undefined;
      }
    } else if (character?.id && character.id === prevCharacterIdRef.current) {
      // Same character ID but character object might have changed (e.g., images updated)
      // Only update if images actually changed to avoid overwriting user input
      const currentImages = (formData.images || []).map(img => img.imageUrl).sort().join(',');
      const characterImages = (character.images || []).map(img => img.imageUrl).sort().join(',');
      if (currentImages !== characterImages) {
        // Character prop has newer images - update formData
        setFormData({ ...character });
      }
    }
    // Note: Don't reset formData when isCreating or initialData changes - preserve user input!
    // Only reset when character.id actually changes (switching between characters or modes)
  }, [character, character?.id, character?.images]) // Watch full character object and images to catch updates
  
  // 🔥 FIX: Sync formData when character in context changes (for immediate UI updates)
  // This ensures the sidebar reflects changes immediately when images are added/removed
  // Only sync if the character prop is stale (not matching context)
  useEffect(() => {
    if (character?.id) {
      const updatedCharacterFromContext = characters.find(c => c.id === character.id);
      if (updatedCharacterFromContext) {
        // Only update if the character from context is different from the prop
        // This handles the case where selectedCharacter in CharacterBoard is stale
        const characterImages = (character.images || []).map(img => img.imageUrl).sort().join(',');
        const contextImages = (updatedCharacterFromContext.images || []).map(img => img.imageUrl).sort().join(',');
        if (characterImages !== contextImages) {
          // Context has newer data - update formData
          setFormData({ ...updatedCharacterFromContext });
        }
      }
    }
  }, [characters, character?.id, character?.images]) // Watch characters array, character.id, and character.images

  // 🔥 FIX: Regenerate expired presigned URLs for images that have s3Key
  useEffect(() => {
    if (!character || !character.images || character.images.length === 0) return;
    
    const regenerateUrls = async () => {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;
      
      const urlMap: Record<string, string> = {};
      
      for (const img of character.images) {
        // Regenerate URL if we have s3Key (regardless of whether URL looks expired)
        // This ensures URLs are always fresh with 7-day expiration
        const s3Key = img.metadata?.s3Key;
        if (s3Key) {
          try {
            const downloadResponse = await fetch('/api/s3/download-url', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                s3Key: s3Key, 
                expiresIn: 604800 // 7 days - matches S3 lifecycle
              }),
            });
            
            if (downloadResponse.ok) {
              const downloadData = await downloadResponse.json();
              if (downloadData.downloadUrl) {
                urlMap[s3Key] = downloadData.downloadUrl;
              }
            }
          } catch (error) {
            console.warn('[CharacterDetailSidebar] Failed to regenerate presigned URL for', s3Key, error);
          }
        }
      }
      
      if (Object.keys(urlMap).length > 0) {
        setRegeneratedImageUrls(prev => ({ ...prev, ...urlMap }));
        console.log('[CharacterDetailSidebar] 🔄 Regenerated', Object.keys(urlMap).length, 'presigned URLs for images with s3Key');
      }
    };
    
    regenerateUrls();
  }, [character?.id, character?.images, getToken]);

  // 🔥 FIX: Refetch character data after StorageDecisionModal closes (like MediaLibrary refetches files)
  // This ensures the UI reflects the latest character data, including newly uploaded images
  useEffect(() => {
    if (!showStorageModal && character?.id) {
      // Modal just closed - sync from context (which should have been updated by the upload)
      // Add small delay to ensure DynamoDB consistency (like MediaLibrary does)
      const syncCharacter = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        // 🔥 FIX: Use ref to get latest characters to avoid stale closures
        const updatedCharacterFromContext = charactersRef.current.find(c => c.id === character.id);
        if (updatedCharacterFromContext) {
          console.log('[CharacterDetailSidebar] 📸 Syncing from context after modal close:', {
            imageCount: updatedCharacterFromContext.images?.length || 0,
            imageUrls: updatedCharacterFromContext.images?.map(img => img.imageUrl) || []
          });
          setFormData({ ...updatedCharacterFromContext });
        }
      };
      syncCharacter();
    }
  }, [showStorageModal, character?.id]) // Remove characters from deps, use ref instead

  const handleSave = async () => {
    if (!formData.name.trim()) return
    
    if (isCreating) {
      // Pass pending images with form data so parent can add them after character creation
      await onCreate({
        ...formData,
        pendingImages: pendingImages.length > 0 ? pendingImages : undefined
      })
      
      // Clear pending images after creation
      setPendingImages([])
    } else {
      onUpdate(formData)
    }
    
    // Close the modal after successful save
    onClose()
  }

  const handleDelete = () => {
    // 🔥 FIX: Remove browser confirm() - let DeleteCharacterDialog handle confirmation
    // Close sidebar first, then trigger delete dialog
    if (character) {
      onClose(); // Close sidebar
      onDelete(character.id); // This will open DeleteCharacterDialog with dependency check
    }
  }

  const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, replaceBase: boolean = true) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // For replaceBase (headshot), only use first file
    // For additional references, process all selected files
    const fileArray = replaceBase ? [files[0]] : Array.from(files);

    if (!screenplayId) {
      toast.error('Screenplay ID not found');
      return;
    }

    // Validate all files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
    }

    if (!character) {
      toast.error('Character not found');
      return;
    }

    setUploading(true);
    
    // Track initial image count to identify newly uploaded images
    const initialImageCount = character?.images?.length || 0;
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Upload files sequentially (backend currently accepts single file per request)
      // For replaceBase, only upload first file. For additional references, upload all.
      let lastEnrichedCharacter: any = null;
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('replaceBase', replaceBase && i === 0 ? 'true' : 'false'); // Only replace base on first file if replaceBase=true

        console.log(`[CharacterDetailSidebar] 📤 Uploading file ${i + 1}/${fileArray.length}: ${file.name} (replaceBase: ${replaceBase && i === 0})`);

        const uploadResponse = await fetch(
          `/api/screenplays/${screenplayId}/characters/${character.id}/images`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed for ${file.name}: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        lastEnrichedCharacter = uploadData.data;
        
        // Add delay between uploads to allow DynamoDB eventual consistency
        if (fileArray.length > 1 && i < fileArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

        // Step 4: Backend already updated character - use enriched character data from last upload
        // The backend endpoint returns the enriched character with presigned URLs in images array
        if (lastEnrichedCharacter) {
        const enrichedCharacter = lastEnrichedCharacter;
        
        // Backend returns images array with { imageUrl, s3Key, createdAt }
        // We need to transform to match frontend ImageAsset format
        const imagesArray = enrichedCharacter.images || [];
        console.log('[CharacterDetailSidebar] 📸 Processing images:', {
          count: imagesArray.length,
          images: imagesArray
        });

        // Transform images to frontend format (no angle metadata needed)
        const transformedImages = imagesArray.map((img: any) => ({
          imageUrl: img.imageUrl || img.url,
          createdAt: img.createdAt || new Date().toISOString(),
          metadata: {
            s3Key: img.s3Key || img.metadata?.s3Key,
            prompt: img.prompt || img.metadata?.prompt,
            modelUsed: img.modelUsed || img.metadata?.modelUsed,
            isEdited: img.isEdited || img.metadata?.isEdited,
            originalImageUrl: img.originalImageUrl || img.metadata?.originalImageUrl,
          }
        }));

        console.log('[CharacterDetailSidebar] ✅ Transformed images:', {
          count: transformedImages.length,
          images: transformedImages
        });

        // Update formData immediately for UI update
        setFormData(prev => {
          const updated = {
            ...prev,
            images: transformedImages
          };
          console.log('[CharacterDetailSidebar] 📝 Updated formData:', {
            imageCount: updated.images.length,
            images: updated.images
          });
          return updated;
        });

        // Update character in context to trigger re-render
        if (character) {
          console.log('[CharacterDetailSidebar] 🔄 Updating character in context:', {
            characterId: character.id,
            imageCount: transformedImages.length
          });
          await updateCharacter(character.id, {
            images: transformedImages
          });
          console.log('[CharacterDetailSidebar] ✅ Character updated in context');
        }

        toast.success(`${fileArray.length} image${fileArray.length > 1 ? 's' : ''} uploaded successfully`);

        // Step 5: Show StorageDecisionModal for first newly uploaded image
        // If replaceBase, show first image (the replaced headshot)
        // If additional references, show first newly added image (after initial count)
        if (transformedImages.length > 0) {
          let imageToShow;
          if (replaceBase) {
            // For headshot replacement, show the first image (the new headshot)
            imageToShow = transformedImages[0];
          } else {
            // For additional references, show the first newly uploaded image
            // New images start at index = initialImageCount
            const firstNewImageIndex = initialImageCount;
            imageToShow = transformedImages[firstNewImageIndex] || transformedImages[transformedImages.length - 1];
          }
          
          if (imageToShow) {
            setSelectedAsset({
              url: imageToShow.imageUrl,
              s3Key: imageToShow.metadata.s3Key,
              name: fileArray[0].name,
              type: 'image'
            });
            setShowStorageModal(true);
          }
        }
      } else if (isCreating) {
        // New character - store temporarily, will be added after character creation
        // Extract image data from enriched character response
        if (lastEnrichedCharacter && lastEnrichedCharacter.images) {
          const imagesArray = lastEnrichedCharacter.images || [];
          const transformedImages = imagesArray.map((img: any) => ({
            imageUrl: img.imageUrl || img.url,
            s3Key: img.s3Key || img.metadata?.s3Key
          }));
          setPendingImages(prev => [...prev, ...transformedImages]);
        }
        toast.success(`${fileArray.length} image${fileArray.length > 1 ? 's' : ''} ready - will be added when character is created`);
      }

    } catch (error: any) {
      console.error('[CharacterDetailSidebar] Upload error:', error);
      toast.error(error.message || 'Failed to upload headshot(s)');
    } finally {
      setUploading(false);
      // Reset inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (additionalFileInputRef.current) {
        additionalFileInputRef.current.value = '';
      }
    }
  }

  return (
    <>
      {/* Backdrop - Click outside to close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-[9998]"
      />
      
      {/* Sidebar */}
      <motion.div 
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 w-full sm:w-[480px] flex flex-col shadow-2xl border-l-2 border-border z-[9999]"
        style={{ 
          backgroundColor: '#1e2229',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header - Full width on mobile */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: '#2C2C2E' }}>
        <h2 className="text-base sm:text-lg font-semibold truncate pr-2" style={{ color: '#E5E7EB' }}>
          {isCreating ? 'New Character' : formData.name}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-base-content/20/50 transition-colors shrink-0"
          style={{ color: '#9CA3AF' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Form Fields */}
        <>
          {/* Name */}
          <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Name
            {isInScript && (
              <span className="ml-2 text-xs" style={{ color: '#6B7280' }}>
                (locked - appears in script)
              </span>
            )}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isInScript}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            placeholder="Character name"
            autoFocus={isCreating}
          />
          {isInScript && (
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Name cannot be changed because this character appears in your script. Edit the script directly to change the name.
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'lead' | 'supporting' | 'minor' })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
          >
            <option value="lead">Lead</option>
            <option value="supporting">Supporting</option>
            <option value="minor">Minor</option>
          </select>
        </div>

        {/* Arc Status */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Arc Status
          </label>
          <select
            value={formData.arcStatus}
            onChange={(e) => setFormData({ ...formData, arcStatus: e.target.value as 'introduced' | 'developing' | 'resolved' })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
          >
            <option value="introduced">Introduced</option>
            <option value="developing">Developing</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            rows={3}
            placeholder="Brief character description"
          />
        </div>

        {/* Physical Attributes Section */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Physical Attributes <span className="text-[#6B7280]">(Optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Height */}
            <div>
              <select
                value={formData.physicalAttributes?.height || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    height: e.target.value as 'short' | 'average' | 'tall' | '' || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
              >
                <option value="">Height</option>
                <option value="short">Short</option>
                <option value="average">Average</option>
                <option value="tall">Tall</option>
              </select>
            </div>
            
            {/* Body Type */}
            <div>
              <select
                value={formData.physicalAttributes?.bodyType || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    bodyType: e.target.value as 'slim' | 'athletic' | 'muscular' | 'heavyset' | 'average' | '' || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
              >
                <option value="">Body Type</option>
                <option value="slim">Slim</option>
                <option value="athletic">Athletic</option>
                <option value="muscular">Muscular</option>
                <option value="heavyset">Heavyset</option>
                <option value="average">Average</option>
              </select>
            </div>
            
            {/* Eye Color */}
            <div>
              <input
                type="text"
                value={formData.physicalAttributes?.eyeColor || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    eyeColor: e.target.value || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
                placeholder="Eye Color"
              />
            </div>
            
            {/* Hair Color */}
            <div>
              <input
                type="text"
                value={formData.physicalAttributes?.hairColor || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    hairColor: e.target.value || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
                placeholder="Hair Color"
              />
            </div>
            
            {/* Hair Length */}
            <div>
              <select
                value={formData.physicalAttributes?.hairLength || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    hairLength: e.target.value as 'bald' | 'very-short' | 'short' | 'medium' | 'long' | '' || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
              >
                <option value="">Hair Length</option>
                <option value="bald">Bald</option>
                <option value="very-short">Very Short</option>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            
            {/* Hair Style */}
            <div>
              <input
                type="text"
                value={formData.physicalAttributes?.hairStyle || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    hairStyle: e.target.value || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
                placeholder="Hair Style (curly, straight, wavy)"
              />
            </div>
            
            {/* Typical Clothing */}
            <div className="col-span-2">
              <input
                type="text"
                value={formData.physicalAttributes?.typicalClothing || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  physicalAttributes: {
                    ...formData.physicalAttributes,
                    typicalClothing: e.target.value || undefined
                  }
                })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
                placeholder="Typical Clothing (e.g., 'business casual', 'military uniform', 'casual jeans and t-shirt')"
              />
            </div>
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>
            💡 These help AI generate more accurate character images and pose packages
          </p>
        </div>

        {/* Arc Notes */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Arc Notes
          </label>
          <textarea
            value={formData.arcNotes || ''}
            onChange={(e) => setFormData({ ...formData, arcNotes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            rows={3}
            placeholder="Character arc development notes"
          />
        </div>

        {/* Character Bank Integration - Only show if character has existing references */}
        {!isCreating && character && character.referenceLibrary?.hasReferences && (
          <div>
            <div className="h-px my-4" style={{ backgroundColor: '#2C2C2E' }}></div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: '#9CA3AF', fontWeight: 600 }}>
                  Reference Library
                </label>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#2C2C2E', color: '#9CA3AF' }}>
                  {character.referenceLibrary.referenceCount} references
                </span>
              </div>
              
              <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: '#2C2C2E', backgroundColor: '#0A0A0B' }}>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" style={{ color: '#10B981' }} />
                  <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                    Character Consistency Enabled
                  </span>
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  This character has {character.referenceLibrary.referenceCount} reference images 
                  for consistent video generation
                </p>
                <button
                  onClick={() => {
                    if (onOpenCharacterBank) {
                      onOpenCharacterBank(character.id);
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1"
                  style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB', border: '1px solid #3F3F46' }}
                >
                  <Camera className="w-3 h-3" />
                  Manage References
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Character Headshots Section - Show for both creating and editing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
              Character Headshots
              <span className="ml-2 text-xs font-normal" style={{ color: '#6B7280' }}>
                (Upload up to 3 for better consistency)
              </span>
            </label>
          </div>
          {(() => {
            const images = character ? getEntityImages('character', character.id) : []
            // For existing characters, images come from getEntityImages (ImageAsset[])
            // For new characters, we create ImageAsset objects from pendingImages
            // 🔥 FIX: Use regenerated URLs when available (for expired presigned URLs)
            const allImages: ImageAsset[] = character ? images.map(img => {
              const s3Key = img.metadata?.s3Key;
              const imageUrl = s3Key && regeneratedImageUrls[s3Key] 
                ? regeneratedImageUrls[s3Key] 
                : img.imageUrl;
              
              return {
                ...img,
                imageUrl
              };
            }) : pendingImages.map((img, idx) => ({
              imageUrl: img.imageUrl,
              metadata: { 
                angle: img.angle,
                s3Key: img.s3Key,
                prompt: img.prompt, 
                modelUsed: img.modelUsed 
              },
              createdAt: new Date().toISOString()
            }))
            
            // Separate user-uploaded images from AI-generated images for better organization
            const userUploadedImages = allImages.filter(img => 
              !img.metadata?.source || img.metadata?.source === 'user-upload'
            );
            const aiGeneratedImages = allImages.filter(img => 
              img.metadata?.source === 'pose-generation' || 
              img.metadata?.source === 'image-generation'
            );
            
            return (
              <div className="space-y-4">
                {/* Character Image Upload Buttons */}
                <div className="space-y-2">
                  {/* Upload Headshot Button - Replaces base reference (first image) */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium w-32 shrink-0" style={{ color: '#9CA3AF' }}>
                      Headshot:
                    </label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ 
                        backgroundColor: '#DC143C',
                        color: 'white',
                        border: '1px solid #DC143C'
                      }}
                    >
                      {uploading ? 'Uploading...' : allImages.length > 0 ? 'Replace Headshot' : 'Upload Headshot'}
                    </button>
                    {/* Hidden file input for headshot upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDirectFileUpload(e, true)}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Add Additional Reference Button - Appends to array */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium w-32 shrink-0" style={{ color: '#9CA3AF' }}>
                      Additional:
                    </label>
                    <button
                      onClick={() => additionalFileInputRef.current?.click()}
                      disabled={uploading || allImages.length === 0}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: allImages.length === 0 ? '#2C2C2E' : '#DC143C',
                        color: 'white',
                        border: `1px solid ${allImages.length === 0 ? '#3F3F46' : '#DC143C'}`
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Add Additional Reference'}
                    </button>
                    {/* Hidden file input for additional references - allows multiple files */}
                    <input
                      ref={additionalFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleDirectFileUpload(e, false)}
                      className="hidden"
                    />
                  </div>
                  
                  {/* AI Generation Button */}
                  <button
                    onClick={() => {
                      if (isCreating && (!formData.name || !formData.description)) {
                        toast.error('Please enter character name and description first to generate an image')
                        return
                      }
                      setShowImagePromptModal(true)
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                    style={{ 
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      border: '1px solid #8B5CF6'
                    }}
                  >
                    Create Photo with AI
                  </button>
                </div>
                
                {/* Image Gallery - Separated by source */}
                {allImages.length > 0 && (
                  <div className="space-y-4">
                    {/* User-Uploaded Reference Images */}
                    {userUploadedImages.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                            Reference Images ({userUploadedImages.length})
                          </label>
                          <span className="text-xs" style={{ color: '#6B7280' }}>User uploaded</span>
                        </div>
                        <ImageGallery
                          images={userUploadedImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          onDeleteImage={async (index: number) => {
                            if (character) {
                              try {
                                // Get current character from context to ensure we have latest images
                                const currentCharacter = characters.find(c => c.id === character.id) || character;
                                const currentImages = currentCharacter.images || [];
                                // Find the actual index in the full images array
                                const imageToDelete = userUploadedImages[index];
                                const actualIndex = currentImages.findIndex((img: any) => {
                                  const imgS3Key = img.metadata?.s3Key || img.s3Key;
                                  // ImageAsset has s3Key in metadata, not at top level
                                  const deleteS3Key = imageToDelete.metadata?.s3Key;
                                  return imgS3Key === deleteS3Key && 
                                    (!img.metadata?.source || img.metadata?.source === 'user-upload');
                                });
                                
                                if (actualIndex < 0) {
                                  throw new Error('Image not found in character data');
                                }
                                
                                const updatedImages = currentImages.filter((_, i) => i !== actualIndex);
                                
                                // Optimistic UI update - remove image immediately
                                setFormData(prev => ({
                                  ...prev,
                                  images: updatedImages
                                }));
                                
                                await updateCharacter(character.id, { images: updatedImages });
                                
                                // Sync from context after update (with delay for DynamoDB consistency)
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const updatedCharacterFromContext = characters.find(c => c.id === character.id);
                                if (updatedCharacterFromContext) {
                                  setFormData({ ...updatedCharacterFromContext });
                                }
                                
                                toast.success('Image removed');
                              } catch (error: any) {
                                // Rollback on error
                                setFormData(prev => ({
                                  ...prev,
                                  images: character.images || []
                                }));
                                toast.error(`Failed to remove image: ${error.message}`);
                              }
                            } else {
                              // Remove from pending images
                              setPendingImages(prev => prev.filter((_, i) => i !== index))
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {/* AI-Generated Images (Poses) */}
                    {aiGeneratedImages.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                            Generated Poses ({aiGeneratedImages.length})
                          </label>
                          <span className="text-xs" style={{ color: '#6B7280' }}>AI generated</span>
                        </div>
                        <ImageGallery
                          images={aiGeneratedImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          onDeleteImage={async (index: number) => {
                            if (character) {
                              try {
                                // Get current character from context to ensure we have latest images
                                const currentCharacter = characters.find(c => c.id === character.id) || character;
                                const currentImages = currentCharacter.images || [];
                                // Find the actual index in the full images array
                                const imageToDelete = aiGeneratedImages[index];
                                const actualIndex = currentImages.findIndex((img: any) => {
                                  const imgS3Key = img.metadata?.s3Key || img.s3Key;
                                  // ImageAsset has s3Key in metadata, not at top level
                                  const deleteS3Key = imageToDelete.metadata?.s3Key;
                                  return imgS3Key === deleteS3Key && 
                                    (img.metadata?.source === 'pose-generation' || img.metadata?.source === 'image-generation');
                                });
                                
                                if (actualIndex < 0) {
                                  throw new Error('Image not found in character data');
                                }
                                
                                const updatedImages = currentImages.filter((_, i) => i !== actualIndex);
                                
                                // Optimistic UI update - remove image immediately
                                setFormData(prev => ({
                                  ...prev,
                                  images: updatedImages
                                }));
                                
                                await updateCharacter(character.id, { images: updatedImages });
                                
                                // Sync from context after update (with delay for DynamoDB consistency)
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const updatedCharacterFromContext = characters.find(c => c.id === character.id);
                                if (updatedCharacterFromContext) {
                                  setFormData({ ...updatedCharacterFromContext });
                                }
                                
                                toast.success('Pose removed');
                              } catch (error: any) {
                                // Rollback on error
                                setFormData(prev => ({
                                  ...prev,
                                  images: character.images || []
                                }));
                                toast.error(`Failed to remove pose: ${error.message}`);
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {allImages.length === 0 && (
                  <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                    Upload a headshot for better character consistency
                  </p>
                )}
              </div>
            )
          })()}
        </div>
        </>
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-6 border-t space-y-2" style={{ borderColor: '#2C2C2E' }}>
        {/* AI Interview Button - Always available when creating */}
        {isCreating && (
          <button
            onClick={() => {
              if (onSwitchToChatImageMode && typeof onSwitchToChatImageMode === 'function') {
                try {
                  // Pass existing form data to AI interview (if user has entered anything)
                  onSwitchToChatImageMode(undefined, {
                    type: 'character',
                    id: 'new',
                    name: formData.name || 'New Character',
                    workflow: 'interview',
                    existingData: {
                      name: formData.name || '',
                      description: formData.description || '',
                      type: formData.type || '',
                      arcStatus: formData.arcStatus || ''
                    }
                  });
                } catch (error) {
                  console.error('[CharacterDetailSidebar] Error calling onSwitchToChatImageMode:', error);
                }
              } else {
                console.warn('[CharacterDetailSidebar] onSwitchToChatImageMode is not a function:', typeof onSwitchToChatImageMode);
              }
              onClose();
            }}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white' 
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ✨ Create with AI Interview
          </button>
        )}
        
        {/* Create/Save Button */}
        <button
          onClick={handleSave}
          disabled={!formData.name.trim()}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: '#8B5CF6', color: 'white' }}
        >
          {isCreating ? 'Create Character' : 'Save Changes'}
        </button>
        
        {!isCreating && (
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#DC2626', color: 'white' }}
          >
            <Trash2 className="h-4 w-4 inline mr-2" />
            Delete Character
          </button>
        )}
      </div>


      {/* Image Prompt Modal - For AI Generation */}
      {showImagePromptModal && (
        <ImagePromptModal
          isOpen={showImagePromptModal}
          onClose={() => setShowImagePromptModal(false)}
          entityType="character"
          entityData={{
            name: formData.name || 'New Character',
            description: formData.description || '',
            type: formData.type || 'lead',
            arcNotes: formData.arcNotes || ''
          }}
          entityId={character?.id}
          projectId={screenplayId}
          onImageGenerated={async (imageUrl, prompt, modelUsed) => {
            // AI-generated images come as data URLs - we need to upload them to S3
            try {
              setUploading(true);
              // Convert data URL to blob
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              const file = new File([blob], 'generated-headshot.png', { type: 'image/png' });
              
              if (!screenplayId) {
                throw new Error('Screenplay ID not found');
              }

              const token = await getToken({ template: 'wryda-backend' });
              if (!token) throw new Error('Not authenticated');

              // 🔥 FIX: Use backend upload endpoint (matches asset pattern)
              if (!character) {
                throw new Error('Character not found');
              }

              const formData = new FormData();
              formData.append('image', file);

              const uploadResponse = await fetch(
                `/api/screenplays/${screenplayId}/characters/${character.id}/images`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                  body: formData,
                }
              );

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
              }

              const uploadData = await uploadResponse.json();
              const downloadUrl = uploadData.imageUrl || uploadData.data?.images?.[uploadData.data.images.length - 1]?.imageUrl;
              const s3Key = uploadData.s3Key || uploadData.data?.images?.[uploadData.data.images.length - 1]?.metadata?.s3Key;

              if (!downloadUrl || !s3Key) {
                throw new Error('Invalid response from server');
              }

              // Backend already updated character - use response data
              if (uploadData.data) {
                const enrichedCharacter = uploadData.data;
                const transformedImages = (enrichedCharacter.images || []).map((img: any) => ({
                  imageUrl: img.imageUrl || img.url,
                  createdAt: img.createdAt || img.uploadedAt || new Date().toISOString(),
                  metadata: {
                    s3Key: img.s3Key || img.metadata?.s3Key,
                    prompt: prompt,
                    modelUsed: modelUsed,
                    isEdited: img.isEdited,
                    originalImageUrl: img.originalImageUrl,
                  }
                }));

                setFormData(prev => ({
                  ...prev,
                  images: transformedImages
                }));

                await updateCharacter(character.id, {
                  images: transformedImages
                });

                toast.success('Image generated and uploaded');
              } else if (isCreating) {
                // New character - store temporarily with s3Key
                setPendingImages(prev => [...prev, { 
                  imageUrl: downloadUrl, 
                  s3Key: s3Key,
                  prompt, 
                  modelUsed 
                }]);
                toast.success('Image generated - will be uploaded when character is created');
              }

              // Show StorageDecisionModal
              setSelectedAsset({
                url: downloadUrl,
                s3Key: s3Key,
                name: 'generated-headshot.png',
                type: 'image'
              });
              setShowStorageModal(true);
            } catch (error: any) {
              toast.error(`Failed to upload image: ${error.message}`);
            } finally {
              setUploading(false);
            }
            setShowImagePromptModal(false);
          }}
        />
        )}

        {/* StorageDecisionModal */}
        {showStorageModal && selectedAsset && (
          <StorageDecisionModal
            isOpen={showStorageModal}
            onClose={() => {
              setShowStorageModal(false);
              setSelectedAsset(null);
            }}
            assetType="image"
            assetName={selectedAsset.name}
            s3TempUrl={selectedAsset.url}
            s3Key={selectedAsset.s3Key}
            fileSize={undefined}
            metadata={{
              entityType: 'character',
              entityId: character?.id || 'new',
              entityName: formData.name || 'Character'
            }}
          />
        )}
      </motion.div>
    </>
  )
}
