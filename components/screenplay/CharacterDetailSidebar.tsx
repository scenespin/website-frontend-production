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
import { useQueryClient } from '@tanstack/react-query'
import { invalidateProductionHubAndMediaCache } from '@/utils/cacheInvalidation'
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary'

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
  const queryClient = useQueryClient() // 🔥 NEW: For invalidating Media Library cache
  
  // 🔥 Feature 0200: Use Media Library as source of truth for character images
  // Query Media Library for character's images (same pattern as LocationDetailModal)
  const { data: characterMediaFiles = [] } = useMediaFiles(
    screenplayId || '',
    undefined,
    !!screenplayId && !!character?.id,
    true, // includeAllFolders
    'character', // entityType
    character?.id // entityId
  );
  
  // Get s3Keys for presigned URL generation
  const characterMediaS3Keys = useMemo(() => {
    return characterMediaFiles
      .filter((file: any) => file.s3Key && !file.s3Key.startsWith('thumbnails/'))
      .map((file: any) => file.s3Key);
  }, [characterMediaFiles]);
  
  // Fetch presigned URLs for character images
  const { data: characterPresignedUrls = new Map() } = useBulkPresignedUrls(
    characterMediaS3Keys,
    characterMediaS3Keys.length > 0
  );
  
  // 🔥 Feature 0200: Build enriched images from Media Library with valid presigned URLs
  const mediaLibraryImages = useMemo(() => {
    return characterMediaFiles
      .filter((file: any) => file.s3Key && !file.s3Key.startsWith('thumbnails/'))
      .map((file: any) => {
        const presignedUrl = characterPresignedUrls.get(file.s3Key);
        return {
          imageUrl: presignedUrl || '',
          metadata: {
            s3Key: file.s3Key,
            source: file.metadata?.source || 'upload',
            prompt: file.metadata?.prompt,
            modelUsed: file.metadata?.modelUsed,
            angle: file.metadata?.angle,
            ...file.metadata
          },
          createdAt: file.createdAt || new Date().toISOString()
        };
      })
      .filter((img: any) => !!img.imageUrl); // Only include images with valid presigned URLs
  }, [characterMediaFiles, characterPresignedUrls]);
  
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
  
  // 🔥 REMOVED: Sync from Production Hub - Production Hub is now read-only
  // Production Hub no longer edits character data, so no sync needed

  // 🔥 REMOVED: Legacy URL regeneration - now using Media Library (useMediaFiles + useBulkPresignedUrls)
  // The mediaLibraryImages variable already provides valid presigned URLs from the Media Library pattern

  // 🔥 FIX: ALWAYS sync from context on mount and when characters change (matching AssetDetailSidebar pattern)
  // This ensures the modal reflects the latest data even if the character prop is stale
  // (which happens because columns state is a separate copy that updates async)
  useEffect(() => {
    if (character?.id) {
      const updatedCharacterFromContext = characters.find(c => c.id === character.id);
      if (updatedCharacterFromContext) {
        // Compare formData with context (not prop with context)
        // This catches both stale props AND stale formData
        const formDataImages = (formData.images || []).map(img => img.imageUrl || (img.metadata as any)?.s3Key).sort().join(',');
        const contextImages = (updatedCharacterFromContext.images || []).map(img => img.imageUrl || (img.metadata as any)?.s3Key).sort().join(',');
        if (formDataImages !== contextImages) {
          // Context has newer data - update formData
          console.log('[CharacterDetailSidebar] 🔄 Syncing from context (formData stale):', {
            formDataImageCount: formData.images?.length || 0,
            contextImageCount: updatedCharacterFromContext.images?.length || 0
          });
          setFormData({ ...updatedCharacterFromContext });
        }
      }
    }
  }, [characters, character?.id]) // Watch characters array and character.id - NOT formData to avoid loops

  // 🔥 FIX: Sync from context on MOUNT to ensure fresh data when sidebar reopens
  // This catches the case where: upload → close sidebar → reopen sidebar
  // The other sync effects only run when dependencies change, but on remount
  // the dependencies might be "the same" even though context has newer data
  useEffect(() => {
    if (character?.id) {
      const freshCharacter = characters.find(c => c.id === character.id);
      if (freshCharacter) {
        console.log('[CharacterDetailSidebar] 🔄 Syncing from context on mount:', {
          characterId: character.id,
          imageCount: freshCharacter.images?.length || 0
        });
        setFormData({ ...freshCharacter });
      }
    }
  }, [character?.id]) // Only run when character.id changes (on mount or when switching characters)

  // 🔥 FIX: Refetch character data after StorageDecisionModal closes (like MediaLibrary refetches files)
  // This ensures the UI reflects the latest character data, including newly uploaded images
  // EXACT WORKING PATTERN from before - just sync from context, no cache invalidation here
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

    // 🔥 FIX: Validate 5-image limit (1 base + 4 additional) - Only count Creation section reference images
    // Production Hub images (pose references) are stored separately and don't count toward this limit
    const currentImages = character ? getEntityImages('character', character.id) : [];
    // 🔥 SAFEGUARD: Cap count at maxImages to prevent incorrect validation when backend data is corrupted
    // If character.images includes Production Hub images, this prevents false validation errors
    const currentCount = Math.min(currentImages.length, 5); // Cap at 5 for validation
    const maxImages = 5;
    
    if (replaceBase) {
      // Replacing base: currentCount stays same (replacing 1 with 1)
      if (currentCount >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed. Please delete some images first.`);
        return;
      }
    } else {
      // Adding additional: check if adding would exceed limit
      const wouldExceed = currentCount + fileArray.length > maxImages;
      if (wouldExceed) {
        const remaining = Math.max(0, maxImages - currentCount); // Ensure non-negative
        toast.error(`Maximum ${maxImages} images allowed (${currentCount}/${maxImages}). You can add ${remaining} more.`);
        return;
      }
    }

      // Validate all files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB.`);
        return;
      }
    }

    // 🔥 FIX: Allow uploads during creation - use temporary characterId if creating
    const characterId = character?.id || 'new';
    
    if (!character && !isCreating) {
      toast.error('Character not found');
      return;
    }

    setUploading(true);
    
    // Track initial image count to identify newly uploaded images
    const initialImageCount = character?.images?.length || 0;
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // 🔥 FIX: Use direct S3 uploads to bypass Vercel's 4.5MB body size limit
      // Upload files sequentially (backend currently accepts single file per request)
      // For replaceBase, only upload first file. For additional references, upload all.
      let lastEnrichedCharacter: any = null;
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        console.log(`[CharacterDetailSidebar] 📤 Uploading file ${i + 1}/${fileArray.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, replaceBase: ${replaceBase && i === 0}, isCreating: ${isCreating})`);

        // Step 1: Get presigned POST URL for direct S3 upload
        const presignedResponse = await fetch(
          `/api/characters/upload/get-presigned-url?` +
          `fileName=${encodeURIComponent(file.name)}` +
          `&fileType=${encodeURIComponent(file.type)}` +
          `&fileSize=${file.size}` +
          `&screenplayId=${encodeURIComponent(screenplayId)}` +
          `&characterId=${encodeURIComponent(characterId)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!presignedResponse.ok) {
          const errorData = await presignedResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
        }

        const { url, fields, s3Key } = await presignedResponse.json();
        
        if (!url || !fields || !s3Key) {
          throw new Error('Invalid response from server');
        }

        // Step 2: Upload directly to S3 using presigned POST
        const s3FormData = new FormData();
        
        // Add all the fields returned from createPresignedPost
        Object.entries(fields).forEach(([key, value]) => {
          // Skip 'bucket' field - it's only used in the policy, not in FormData
          if (key.toLowerCase() !== 'bucket') {
            s3FormData.append(key, value as string);
          }
        });
        
        // Add the file last (must be last field in FormData per AWS requirements)
        s3FormData.append('file', file);
        
        // Upload to S3 using XMLHttpRequest for better error handling
        const s3UploadResponse = await fetch(url, {
          method: 'POST',
          body: s3FormData,
        });

        if (!s3UploadResponse.ok) {
          const errorText = await s3UploadResponse.text();
          console.error('[CharacterDetailSidebar] S3 upload failed:', errorText);
          throw new Error(`S3 upload failed: ${s3UploadResponse.status}`);
        }

        console.log(`[CharacterDetailSidebar] ✅ Uploaded to S3: ${s3Key}`);

        // Step 3: Register the uploaded image with the character via backend (only if character exists)
        // 🔥 FIX: If creating, skip registration and store in pendingImages instead
        if (character && !isCreating) {
          const registerResponse = await fetch(
            `/api/screenplays/${screenplayId}/characters/${character.id}/images`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                s3Key,
                replaceBase: replaceBase && i === 0, // Only replace base on first file if replaceBase=true
              }),
            }
          );

          if (!registerResponse.ok) {
            const errorData = await registerResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to register image: ${registerResponse.status}`);
          }

          const registerData = await registerResponse.json();
          lastEnrichedCharacter = registerData.data;
        } else if (isCreating) {
          // 🔥 FIX: During creation, generate presigned URL for display and store in pendingImages
          try {
            const presignedUrlResponse = await fetch(
              `/api/s3/download-url`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  s3Key,
                  expiresIn: 3600,
                }),
              }
            );
            
            if (presignedUrlResponse.ok) {
              const { downloadUrl } = await presignedUrlResponse.json();
              // Store in pendingImages for later registration after character creation
              if (!lastEnrichedCharacter) {
                lastEnrichedCharacter = { images: [] };
              }
              lastEnrichedCharacter.images.push({
                imageUrl: downloadUrl,
                s3Key: s3Key,
                createdAt: new Date().toISOString(),
                metadata: {
                  s3Key: s3Key
                }
              });
            } else {
              // Fallback: use S3 URL directly
              const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
              const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
              const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
              if (!lastEnrichedCharacter) {
                lastEnrichedCharacter = { images: [] };
              }
              lastEnrichedCharacter.images.push({
                imageUrl: s3Url,
                s3Key: s3Key,
                createdAt: new Date().toISOString(),
                metadata: {
                  s3Key: s3Key
                }
              });
            }
          } catch (urlError) {
            console.warn('[CharacterDetailSidebar] Failed to get presigned URL, using S3 URL:', urlError);
            // Fallback: use S3 URL directly
            const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
            const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
            const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
            if (!lastEnrichedCharacter) {
              lastEnrichedCharacter = { images: [] };
            }
            lastEnrichedCharacter.images.push({
              imageUrl: s3Url,
              s3Key: s3Key,
              createdAt: new Date().toISOString(),
              metadata: {
                s3Key: s3Key
              }
            });
          }
        }
        
        // Add delay between uploads to allow DynamoDB eventual consistency
        if (fileArray.length > 1 && i < fileArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

        // Step 4: Handle uploaded images based on whether we're creating or editing
        // 🔥 FIX: Check isCreating first to handle pendingImages correctly
        if (isCreating && lastEnrichedCharacter) {
          // New character - store temporarily, will be added after character creation
          const imagesArray = lastEnrichedCharacter.images || [];
          const transformedImages = imagesArray.map((img: any) => ({
            imageUrl: img.imageUrl || img.url,
            s3Key: img.s3Key || img.metadata?.s3Key
          }));
          setPendingImages(prev => [...prev, ...transformedImages]);
          
          // Update formData to show images in UI (preview before save)
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...transformedImages]
          }));
          
          toast.success(`${fileArray.length} image${fileArray.length > 1 ? 's' : ''} ready - will be added when character is created`);
          
          // 🔥 FIX: Show storage modal for first uploaded image during creation
          // Images are in temporary S3 storage, user can choose to save permanently
          if (transformedImages.length > 0) {
            const firstImage = transformedImages[0];
            if (firstImage.s3Key && firstImage.imageUrl) {
              setSelectedAsset({
                url: firstImage.imageUrl,
                s3Key: firstImage.s3Key,
                name: fileArray[0].name,
                type: 'image'
              });
              setShowStorageModal(true);
            }
          }
        } else if (lastEnrichedCharacter && character) {
          // Existing character - backend already updated character, use enriched character data
          const enrichedCharacter = lastEnrichedCharacter;
          
          // Backend returns images array with { imageUrl, s3Key, createdAt }
          // We need to transform to match frontend ImageAsset format
          const imagesArray = enrichedCharacter.images || [];
          console.log('[CharacterDetailSidebar] 📸 Processing images:', {
            count: imagesArray.length,
            images: imagesArray
          });

          // Transform images to frontend format (preserve all metadata from backend)
          const transformedImages = imagesArray.map((img: any) => {
            // Backend returns { imageUrl, s3Key, createdAt, metadata: { s3Key, source } }
            const imageUrl = img.imageUrl || img.url;
            if (!imageUrl) {
              console.warn('[CharacterDetailSidebar] Image missing URL:', img);
            }
            return {
              imageUrl: imageUrl || '', // Preserve empty string if URL generation failed
              createdAt: img.createdAt || new Date().toISOString(),
              metadata: {
                s3Key: img.s3Key || img.metadata?.s3Key,
                source: img.metadata?.source || 'user-upload', // Preserve source metadata (user-upload or pose-generation)
                prompt: img.prompt || img.metadata?.prompt,
                modelUsed: img.modelUsed || img.metadata?.modelUsed,
                isEdited: img.isEdited || img.metadata?.isEdited,
                originalImageUrl: img.originalImageUrl || img.metadata?.originalImageUrl,
                angle: img.angle || img.metadata?.angle, // Preserve angle if present
                createdIn: img.metadata?.createdIn || 'creation', // 🔥 FIX: Mark images uploaded in Create section
              }
            };
          }).filter((img: any) => {
            if (!img.imageUrl) {
              console.warn('[CharacterDetailSidebar] Filtering out image with missing URL:', {
                s3Key: img.metadata?.s3Key,
                img
              });
              return false;
            }
            return true;
          }); // Filter out images with missing URLs

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
          // NOTE: Backend already saved images via /api/screenplays/.../images endpoint
          // This updateCharacter call updates local context only - backend already has the images
          console.log('[CharacterDetailSidebar] 🔄 Updating character in context:', {
            characterId: character.id,
            imageCount: transformedImages.length
          });
          await updateCharacter(character.id, {
            images: transformedImages
          });
          console.log('[CharacterDetailSidebar] ✅ Character updated in context');

          // 🔥 FIX: Aggressively clear and refetch character bank query cache so Production Hub cards refresh
          if (screenplayId) {
            invalidateProductionHubAndMediaCache(queryClient, 'characters', screenplayId);
          }

          toast.success(`${fileArray.length} image${fileArray.length > 1 ? 's' : ''} uploaded successfully`);

          // Step 5: Show StorageDecisionModal for first newly uploaded image
          // If replaceBase, show first image (the replaced headshot)
          // If additional references, find the newly uploaded image by comparing with initial images
          if (transformedImages.length > 0) {
            let imageToShow;
            if (replaceBase) {
              // For headshot replacement, show the first image (the new headshot)
              imageToShow = transformedImages[0];
            } else {
              // For additional references, find the first image that wasn't in the initial set
              // Compare by s3Key to identify newly uploaded images
              const initialS3Keys = new Set(
                (character?.images || []).slice(0, initialImageCount).map((img: any) => 
                  img.metadata?.s3Key || img.s3Key
                ).filter(Boolean)
              );
              
              // Find first image that's not in the initial set
              imageToShow = transformedImages.find((img: any) => {
                const imgS3Key = img.metadata?.s3Key || img.s3Key;
                return imgS3Key && !initialS3Keys.has(imgS3Key);
              });
              
              // Fallback to last image if no new image found
              if (!imageToShow) {
                imageToShow = transformedImages[transformedImages.length - 1];
              }
            }
            
            if (imageToShow) {
              setSelectedAsset({
                url: imageToShow.imageUrl,
                s3Key: imageToShow.metadata?.s3Key || imageToShow.s3Key,
                name: fileArray[0].name,
                type: 'image'
              });
              setShowStorageModal(true);
            }
          }
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
            
            {/* Note: Typical Clothing (Default Outfit) is now managed in Production Hub Character section */}
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
            // 🔥 Feature 0200: Use Media Library as source of truth (same pattern as LocationDetailModal)
            // For existing characters, use mediaLibraryImages (from useMediaFiles hook)
            // For new characters, use pendingImages
            const allImages: ImageAsset[] = character 
              ? mediaLibraryImages.map((img: any) => ({
                  imageUrl: img.imageUrl,
                  metadata: img.metadata,
                  createdAt: img.createdAt
                }))
              : pendingImages.map((img, idx) => ({
                  imageUrl: img.imageUrl,
                  metadata: { 
                    angle: img.angle,
                    s3Key: img.s3Key,
                    prompt: img.prompt, 
                    modelUsed: img.modelUsed 
                  },
                  createdAt: new Date().toISOString()
                }));
            
            // 🔥 FIX: Filter out Production Hub images (pose-generation and user-uploaded) from Creation section
            // Creation section should only show Creation images
            // Production Hub images have source='pose-generation' OR createdIn='production-hub'
            const userUploadedImages = allImages.filter(img => {
              const metadata = img.metadata as any;
              // Exclude Production Hub images (both pose-generation and user-uploaded)
              return metadata?.source !== 'pose-generation' && 
                     metadata?.createdIn !== 'production-hub';
            });
            const aiGeneratedImages = allImages.filter(img => {
              const metadata = img.metadata || {};
              // Only show AI-generated images that are NOT Production Hub pose images
              return (metadata.source === 'image-generation' || metadata.modelUsed) && 
                     metadata.source !== 'pose-generation';
            });
            
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
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1F1F1F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      style={{ 
                        backgroundColor: '#0A0A0A',
                        color: 'white',
                        border: '1px solid #3F3F46'
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
                      disabled={uploading || allImages.length === 0 || userUploadedImages.length >= 5}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1F1F1F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      style={{ 
                        backgroundColor: allImages.length === 0 || userUploadedImages.length >= 5 ? '#0A0A0A' : '#0A0A0A',
                        color: 'white',
                        border: '1px solid #3F3F46'
                      }}
                    >
                      {uploading ? 'Uploading...' : userUploadedImages.length >= 5 ? `Max Images (${userUploadedImages.length}/5)` : `Add Additional Reference (${userUploadedImages.length}/5)`}
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
                                  // 🔥 SEPARATION: Backend now only returns Creation images, so no Production Hub filtering needed
                                  // Keep simple matching by s3Key
                                  return imgS3Key === deleteS3Key;
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
                                
                                // 🔥 FIX: Aggressively clear and refetch character bank query cache so Production Hub cards refresh
                                if (screenplayId) {
                                  invalidateProductionHubAndMediaCache(queryClient, 'characters', screenplayId);
                                }
                                
                                // 🔥 FIX: Don't sync from context immediately after deletion
                                // The useEffect hook will handle syncing when context actually updates
                                // This prevents overwriting the optimistic update with stale data if user clicks Save quickly
                                
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
                    
                    {/* AI Generated Reference/Poses */}
                    {aiGeneratedImages.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: '#3F3F46' }}>
                          <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                            AI Generated Reference/Poses ({aiGeneratedImages.length})
                          </label>
                          <span className="text-xs" style={{ color: '#6B7280' }}>Delete in Production Hub</span>
                        </div>
                        <ImageGallery
                          images={aiGeneratedImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          readOnly={true} // 🔥 RESTRICTION: Creation section cannot delete AI-generated poses - only Production Hub can
                          // Note: onDeleteImage is not provided, so ImageGallery won't show delete button
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
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1F1F1F] flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: '#0A0A0A',
              color: 'white',
              border: '1px solid #3F3F46'
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
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1F1F1F]"
          style={{ backgroundColor: '#0A0A0A', color: 'white', border: '1px solid #3F3F46' }}
        >
          {isCreating ? 'Create Character' : 'Save Changes'}
        </button>
        
        {!isCreating && (
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1F1F1F]"
            style={{ backgroundColor: '#0A0A0A', color: 'white', border: '1px solid #3F3F46' }}
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

                // 🔥 FIX: Aggressively clear and refetch character bank query cache so Production Hub cards refresh
                if (screenplayId) {
                  invalidateProductionHubAndMediaCache(queryClient, 'characters', screenplayId);
                }

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
