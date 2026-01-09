"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Upload, Sparkles, Package, Search, Check } from "lucide-react"
import { motion } from 'framer-motion'
import type { Asset, AssetCategory } from '@/types/asset'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useEditor } from '@/contexts/EditorContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImagePromptModal } from '@/components/images/ImagePromptModal'
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface AssetDetailSidebarProps {
  asset?: Asset | null
  isCreating: boolean
  initialData?: Partial<Asset>
  onClose: () => void
  onCreate: (data: any) => void
  onUpdate: (asset: Asset) => void
  onDelete: (assetId: string) => void
  onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string; existingData?: { name?: string; description?: string; category?: string } }) => void
}

export default function AssetDetailSidebar({
  asset,
  isCreating,
  initialData,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSwitchToChatImageMode
}: AssetDetailSidebarProps) {
  const { getAssetScenes, isEntityInScript, screenplayId, assets, updateAsset, scenes, linkAssetToScene, unlinkAssetFromScene, batchUpdatePropAssociations } = useScreenplay()
  // 🔥 FIX: Use ref to track latest assets to avoid stale closures in async functions
  const assetsRef = useRef(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);
  const { state: editorState } = useEditor()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  // Check if asset is in script (if editing existing asset) - memoized to prevent render loops
  const isInScript = useMemo(() => {
    return asset ? isEntityInScript(editorState.content, asset.name, 'asset') : false;
  }, [asset, editorState.content, isEntityInScript]);

  const [showImagePromptModal, setShowImagePromptModal] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ imageUrl: string; s3Key: string; prompt?: string; modelUsed?: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [showStorageModal, setShowStorageModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{url: string; s3Key: string; name: string; type: 'image' | 'video' | 'attachment'} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 🔥 FIX: Regenerate expired presigned URLs for images
  const [regeneratedImageUrls, setRegeneratedImageUrls] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<any>(
    asset ? { ...asset } : (initialData ? {
      name: initialData.name || '',
      category: initialData.category || 'prop',
      description: initialData.description || '',
      tags: initialData.tags || []
    } : {
      name: '',
      category: 'prop',
      description: '',
      tags: []
    })
  )
  
  // 🔥 FIX: Only update formData when asset prop actually changes (not when isCreating or initialData changes)
  // This prevents resetting user input when uploading images during asset creation
  // Use a ref to track the previous asset ID to detect actual changes
  const prevAssetIdRef = useRef<string | undefined>(asset?.id);
  
  useEffect(() => {
    // Only update if asset ID actually changed (switching between assets or create/edit mode)
    if (asset?.id !== prevAssetIdRef.current) {
      if (asset) {
        // Switching to edit mode - load asset data
        setFormData({ ...asset });
        prevAssetIdRef.current = asset.id;
      } else if (initialData) {
        // Switching to create mode with initialData - use initialData
        setFormData({
          name: initialData.name || '',
          category: initialData.category || 'prop',
          description: initialData.description || '',
          tags: initialData.tags || []
        });
        prevAssetIdRef.current = undefined;
      } else {
        // Switching to create mode without initialData - reset to defaults
        setFormData({
          name: '',
          category: 'prop',
          description: '',
          tags: []
        });
        prevAssetIdRef.current = undefined;
      }
    } else if (asset?.id && asset.id === prevAssetIdRef.current) {
      // Same asset ID but asset object might have changed (e.g., images updated)
      // Only update if images actually changed to avoid overwriting user input
      const currentImages = (formData.images || []).map(img => img.url).sort().join(',');
      const assetImages = (asset.images || []).map(img => img.url).sort().join(',');
      if (currentImages !== assetImages) {
        // Asset prop has newer images - update formData
        setFormData({ ...asset });
      }
    }
    // Note: Don't reset formData when isCreating or initialData changes - preserve user input!
    // Only reset when asset.id actually changes (switching between assets or modes)
  }, [asset, asset?.id, asset?.images]) // Watch full asset object and images to catch updates

  // 🔥 FIX: Sync formData when asset in context changes (for immediate UI updates)
  // This ensures the modal reflects changes immediately when images are added/removed
  // Only sync if the asset prop is stale (not matching context)
  useEffect(() => {
    if (asset?.id) {
      const updatedAssetFromContext = assets.find(a => a.id === asset.id);
      if (updatedAssetFromContext) {
        // Only update if the asset from context is different from the prop
        // This handles the case where selectedAsset in AssetBoard is stale
        const assetImages = (asset.images || []).map(img => img.url).sort().join(',');
        const contextImages = (updatedAssetFromContext.images || []).map(img => img.url).sort().join(',');
        if (assetImages !== contextImages) {
          // Context has newer data - update formData
          setFormData({ ...updatedAssetFromContext });
        }
      }
    }
  }, [assets, asset?.id, asset?.images]) // Watch assets array, asset.id, and asset.images

  // 🔥 FIX: Regenerate expired presigned URLs for images that have s3Key
  useEffect(() => {
    if (!asset || !asset.images || asset.images.length === 0) return;
    
    const regenerateUrls = async () => {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;
      
      const urlMap: Record<string, string> = {};
      
      for (const img of asset.images) {
        // Regenerate URL if we have s3Key (regardless of whether URL looks expired)
        // This ensures URLs are always fresh with 7-day expiration
        if (img.s3Key) {
          try {
            const downloadResponse = await fetch('/api/s3/download-url', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                s3Key: img.s3Key, 
                expiresIn: 604800 // 7 days - matches S3 lifecycle
              }),
            });
            
            if (downloadResponse.ok) {
              const downloadData = await downloadResponse.json();
              if (downloadData.downloadUrl) {
                urlMap[img.s3Key] = downloadData.downloadUrl;
              }
            }
          } catch (error) {
            console.warn('[AssetDetailSidebar] Failed to regenerate presigned URL for', img.s3Key, error);
          }
        }
      }
      
      if (Object.keys(urlMap).length > 0) {
        setRegeneratedImageUrls(prev => ({ ...prev, ...urlMap }));
        console.log('[AssetDetailSidebar] 🔄 Regenerated', Object.keys(urlMap).length, 'presigned URLs for images with s3Key');
      }
    };
    
    regenerateUrls();
  }, [asset?.id, asset?.images, getToken]);

  // 🔥 FIX: Refetch asset data after StorageDecisionModal closes (like MediaLibrary refetches files)
  // This ensures the UI reflects the latest asset data, including newly uploaded images
  useEffect(() => {
    if (!showStorageModal && asset?.id) {
      // Modal just closed - sync from context (which should have been updated by the upload)
      // Add small delay to ensure DynamoDB consistency (like MediaLibrary does)
      const syncAsset = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        // 🔥 FIX: Use ref to get latest assets to avoid stale closures
        const updatedAssetFromContext = assetsRef.current.find(a => a.id === asset.id);
        if (updatedAssetFromContext) {
          console.log('[AssetDetailSidebar] 📸 Syncing from context after modal close:', {
            imageCount: updatedAssetFromContext.images?.length || 0,
            imageUrls: updatedAssetFromContext.images?.map(img => img.url) || []
          });
          setFormData({ ...updatedAssetFromContext });
        }
      };
      syncAsset();
    }
  }, [showStorageModal, asset?.id]) // Remove assets from deps, use ref instead

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an asset name')
      return
    }
    
    if (isCreating) {
      // 🔥 FIX: Pass selected scene IDs so they can be applied after asset creation
      await onCreate({
        ...formData,
        pendingImages: pendingImages.length > 0 ? pendingImages : undefined,
        selectedSceneIds: Array.from(selectedSceneIds) // Pass scene IDs to apply after creation
      })
      
      // Clear pending images after creation
      setPendingImages([])
    } else {
      onUpdate(formData)
      // Invalidate Production Hub cache so cards update
      if (screenplayId) {
        queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
      }
    }
    
    // Close the sidebar after successful save
    onClose()
  }

  const handleDelete = () => {
    if (asset) {
      onClose()
      onDelete(asset.id)
    }
  }

  const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Support multiple files - process all selected files
    const fileArray = Array.from(files);

    // 🔥 NEW: Validate 5-image limit (1 base + 4 additional)
    // Assets have images directly on the asset object, not via getEntityImages
    const currentImages = asset?.images || [];
    const currentCount = currentImages.filter(img => {
      const source = (img.metadata as any)?.source;
      return !source || source === 'user-upload';
    }).length;
    const maxImages = 5;
    
    const wouldExceed = currentCount + fileArray.length > maxImages;
    if (wouldExceed) {
      const remaining = maxImages - currentCount;
      toast.error(`Maximum ${maxImages} images allowed (${currentCount}/${maxImages}). You can add ${remaining} more.`);
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

    if (!screenplayId) {
      toast.error('Screenplay ID not found');
      return;
    }

    setUploading(true);
    const uploadedImages: Array<{ imageUrl: string; s3Key: string }> = [];
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Upload all files to S3
      for (const file of fileArray) {
        // Step 1: Get presigned POST URL for S3 upload
        const presignedResponse = await fetch(
          `/api/video/upload/get-presigned-url?` + 
          `fileName=${encodeURIComponent(file.name)}` +
          `&fileType=${encodeURIComponent(file.type)}` +
          `&fileSize=${file.size}` +
          `&screenplayId=${encodeURIComponent(screenplayId)}` +
          `&projectId=${encodeURIComponent(screenplayId)}`, // Keep for backward compatibility
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!presignedResponse.ok) {
          if (presignedResponse.status === 413) {
            throw new Error(`${file.name} is too large. Maximum size is 10MB.`);
          } else if (presignedResponse.status === 401) {
            throw new Error('Please sign in to upload files.');
          } else {
            const errorData = await presignedResponse.json();
            throw new Error(errorData.error || `Failed to get upload URL for ${file.name}: ${presignedResponse.status}`);
          }
        }

        const { url, fields, s3Key } = await presignedResponse.json();
        
        if (!url || !fields || !s3Key) {
          throw new Error('Invalid response from server');
        }

        // Step 2: Upload directly to S3 using FormData POST (presigned POST)
        const formData = new FormData();
        
        Object.entries(fields).forEach(([key, value]) => {
          // Skip 'bucket' field - it's only used in the policy, not in FormData
          if (key.toLowerCase() !== 'bucket') {
            formData.append(key, value as string);
          }
        });
        
        // Add the file last (must be last field in FormData per AWS requirements)
        formData.append('file', file);
        
        // Use XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              // Progress tracking (optional, can be enhanced with UI)
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('S3 upload failed: Network error'));
          });
          
          xhr.open('POST', url);
          xhr.send(formData);
        });

        // Step 3: Get presigned download URL for StorageDecisionModal (bucket is private)
        // 🔥 FIX: Generate 7-day presigned URL for temporary storage (matches S3 lifecycle)
        // This ensures the URL stays valid for the full 7 days the file is in S3
        const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
        const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
        const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
        
        let downloadUrl = s3Url; // Fallback to direct S3 URL if presigned URL generation fails
        try {
          const downloadResponse = await fetch('/api/s3/download-url', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 604800 // 7 days (604800 seconds) - matches S3 lifecycle policy
            }),
          });
          
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            if (downloadData.downloadUrl) {
              downloadUrl = downloadData.downloadUrl;
            }
          }
        } catch (error) {
          console.warn('[AssetDetailSidebar] Failed to get presigned download URL, using direct S3 URL:', error);
        }

        // Store uploaded image info
        uploadedImages.push({
          imageUrl: downloadUrl,
          s3Key: s3Key
        });
      }

      // After all files uploaded, update asset or store pending images
      if (asset) {
        // Existing asset - register all images with asset bank API
        try {
          // Transform to AssetImage format (url, angle?, uploadedAt, s3Key)
          // 🔥 FIX: Store s3Key so we can regenerate presigned URLs when they expire
          const newImageObjects = uploadedImages.map(img => ({
            url: img.imageUrl,
            uploadedAt: new Date().toISOString(),
            s3Key: img.s3Key // Store s3Key for URL regeneration
            // Note: angle can be added later if needed
          }));

          // 🔥 FIX: Get latest asset from context (using ref to avoid stale closures) to ensure we have current images
          const currentAsset = assetsRef.current.find(a => a.id === asset.id) || asset;
          
          // 🔥 DEBUG: Log current state before update
          console.log('[AssetDetailSidebar] 📸 Uploading images:', {
            currentImageCount: currentAsset.images?.length || 0,
            newImageCount: newImageObjects.length,
            totalAfterUpdate: (currentAsset.images?.length || 0) + newImageObjects.length
          });
          
          // 🔥 FIX: Optimistic UI update - add images immediately
          const updatedImages = [
            ...(currentAsset.images || []),
            ...newImageObjects
          ];
          setFormData(prev => ({
            ...prev,
            images: updatedImages
          }));
          
          // Register all images with the asset via ScreenplayContext (updates both API and local state)
          await updateAsset(asset.id, {
            images: updatedImages
          });
          
          // Invalidate Production Hub cache so cards update
          if (screenplayId) {
            queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
          }
          
          // 🔥 FIX: Sync asset data from context after update (with delay for DynamoDB consistency)
          // Use ref to get latest assets after update
          await new Promise(resolve => setTimeout(resolve, 500));
          const updatedAssetFromContext = assetsRef.current.find(a => a.id === asset.id);
          if (updatedAssetFromContext) {
            console.log('[AssetDetailSidebar] 📸 Syncing from context after upload:', {
              imageCount: updatedAssetFromContext.images?.length || 0,
              imageUrls: updatedAssetFromContext.images?.map(img => img.url) || []
            });
            setFormData({ ...updatedAssetFromContext });
          } else {
            console.warn('[AssetDetailSidebar] ⚠️ Asset not found in context after upload:', asset.id);
          }
          
          toast.success(`Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`);
        } catch (error: any) {
          toast.error(`Failed to register images: ${error.message}`);
        }
      } else if (isCreating) {
        // New asset - store temporarily with s3Key, will be uploaded after asset creation
        setPendingImages(prev => [...prev, ...uploadedImages]);
        toast.success(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} ready - will be added when asset is created`);
      }

      // Step 4: Show StorageDecisionModal for all uploaded images
      // Show modal once after all uploads complete - user can choose storage location
      if (uploadedImages.length > 0) {
        // For now, show modal for first image (can be enhanced to batch all images)
        setSelectedAsset({
          url: uploadedImages[0].imageUrl,
          s3Key: uploadedImages[0].s3Key,
          name: fileArray[0].name,
          type: 'image'
        });
        setShowStorageModal(true);
      }

    } catch (error: any) {
      console.error('[AssetDetailSidebar] Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // 🔥 FIX: Track if deletion is in progress to prevent duplicate calls
  const deletingImageRef = useRef<number | null>(null);
  
  const handleRemoveImage = async (index: number) => {
    if (!asset) return;
    
    // 🔥 FIX: Prevent duplicate calls
    if (deletingImageRef.current === index) {
      return; // Already deleting this image
    }
    
    // 🔥 FIX: ImageGallery already shows a confirm dialog, so we don't need another one
    // Just proceed with the deletion
    deletingImageRef.current = index;
    
    try {
      // 🔥 FIX: Use ref to get latest asset from context to avoid stale closures
      const currentAsset = assetsRef.current.find(a => a.id === asset.id) || asset;
      const currentImages = currentAsset.images || [];
      
      // 🔥 FIX: Filter to only user-uploaded images (matches the filtered array shown in UI)
      const userUploadedImages = currentImages.filter((img: any) => {
        const source = img.metadata?.source;
        return !source || source === 'user-upload';
      });
      
      // Get the image to delete from the filtered array
      const imageToDelete = userUploadedImages[index];
      if (!imageToDelete) {
        console.error('[AssetDetailSidebar] Image not found at index:', index);
        toast.error('Image not found');
        return;
      }
      
      const imageS3Key = imageToDelete.metadata?.s3Key || imageToDelete.s3Key;
      const isAngleGenerated = imageToDelete.metadata?.source === 'angle-generation' || 
                                imageToDelete.metadata?.angle ||
                                imageToDelete.angle;
      
      // 🔥 SEPARATION: Backend now only returns Creation images, so no Production Hub filtering needed
      // All images in Creation section can be deleted
      
      console.log('[AssetDetailSidebar] 🗑️ Deleting image:', {
        assetId: asset.id,
        currentImageCount: currentImages.length,
        userUploadedCount: userUploadedImages.length,
        deletingIndex: index,
        imageUrl: imageToDelete?.url,
        imageS3Key,
        isAngleGenerated
      });
      
      // Remove from full images array by matching s3Key
      const updatedImages = currentImages.filter((img: any) => {
        const imgS3Key = img.metadata?.s3Key || img.s3Key;
        return imgS3Key !== imageS3Key;
      });
      
      // 🔥 FIX: If deleting an angle-generated image, also remove from angleReferences
      // This prevents the image from being added back when enrichAssetWithPresignedUrls runs
      let updateData: any = { images: updatedImages };
      if (isAngleGenerated && imageS3Key && currentAsset.angleReferences) {
        const updatedAngleReferences = currentAsset.angleReferences.filter(
          (ref: any) => ref.s3Key !== imageS3Key
        );
        if (updatedAngleReferences.length !== currentAsset.angleReferences.length) {
          updateData.angleReferences = updatedAngleReferences;
          console.log('[AssetDetailSidebar] 🗑️ Also removing from angleReferences:', {
            removedS3Key: imageS3Key,
            remainingAngleRefs: updatedAngleReferences.length
          });
        }
      }
      
      // 🔥 FIX: Optimistic UI update - remove image immediately
      setFormData(prev => ({
        ...prev,
        images: updatedImages,
        ...(updateData.angleReferences !== undefined && { angleReferences: updateData.angleReferences })
      }));
      
      // Update via API
      await updateAsset(asset.id, updateData);
      
      // Invalidate Production Hub cache so cards update
      if (screenplayId) {
        queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
      }
      
      // Sync from context after update (with delay for DynamoDB consistency)
      await new Promise(resolve => setTimeout(resolve, 500));
      // 🔥 FIX: Use ref to get latest asset after update
      const updatedAssetFromContext = assetsRef.current.find(a => a.id === asset.id);
      if (updatedAssetFromContext) {
        console.log('[AssetDetailSidebar] 🗑️ Syncing from context after delete:', {
          imageCount: updatedAssetFromContext.images?.length || 0
        });
        setFormData({ ...updatedAssetFromContext });
      } else {
        console.warn('[AssetDetailSidebar] ⚠️ Asset not found in context after delete:', asset.id);
      }
      
      // 🔥 FIX: Only show one toast notification
      toast.success('Image removed');
    } catch (error: any) {
      // Rollback on error
      console.error('[AssetDetailSidebar] Failed to remove image:', error);
      setFormData(prev => ({
        ...prev,
        images: asset.images || []
      }));
      toast.error(`Failed to remove image: ${error.message}`);
    } finally {
      deletingImageRef.current = null;
    }
  }

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    const trimmedTag = tag.trim();
    if (!formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag]
      });
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tagToRemove)
    });
  }

  // Get scenes where asset is used (returns scene IDs)
  const assetSceneIds = asset ? getAssetScenes(asset.id) : [];
  // Get actual scene objects for display
  const linkedScenes = assetSceneIds
    .map(sceneId => scenes.find(s => s.id === sceneId))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
  
  // Multi-select state for scene linking
  // 🔥 FIX: Initialize with empty set during creation, assetSceneIds when editing
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set(isCreating ? [] : assetSceneIds));
  const [sceneSearchTerm, setSceneSearchTerm] = useState('');
  const [isApplyingSceneChanges, setIsApplyingSceneChanges] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number; sceneHeading?: string } | null>(null);
  
  // Update selected scenes when asset changes (only when editing, not creating)
  useEffect(() => {
    if (asset && !isCreating) {
      setSelectedSceneIds(new Set(assetSceneIds));
    } else if (isCreating) {
      // During creation, start with empty selection
      setSelectedSceneIds(new Set());
    }
  }, [asset?.id, assetSceneIds.join(','), isCreating]);
  
  // Filter scenes by search term
  const filteredScenes = useMemo(() => {
    return scenes.filter(scene => {
      const searchLower = sceneSearchTerm.toLowerCase();
      const heading = (scene.heading || '').toLowerCase();
      const synopsis = (scene.synopsis || '').toLowerCase();
      const number = scene.number?.toString() || '';
      return heading.includes(searchLower) || synopsis.includes(searchLower) || number.includes(searchLower);
    }).sort((a, b) => {
      // Sort by scene number if available, otherwise by heading
      if (a.number && b.number) return a.number - b.number;
      if (a.number) return -1;
      if (b.number) return 1;
      return (a.heading || '').localeCompare(b.heading || '');
    });
  }, [scenes, sceneSearchTerm]);
  
  // Handle checkbox toggle
  const handleSceneToggle = (sceneId: string) => {
    setSelectedSceneIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  };
  
  // Handle select all / deselect all
  const handleSelectAllScenes = () => {
    setSelectedSceneIds(new Set(filteredScenes.map(s => s.id)));
  };
  
  const handleDeselectAllScenes = () => {
    setSelectedSceneIds(new Set());
  };
  
  // Apply scene changes (link/unlink all selected scenes) - using batch API
  // 🔥 FIX: Works during creation mode - stores selectedSceneIds to apply after asset creation
  const handleApplySceneChanges = async () => {
    // During creation, just store the selection (will be applied after asset is created)
    if (isCreating) {
      console.log('[AssetDetailSidebar] 📝 Storing scene selection for creation:', {
        selectedCount: selectedSceneIds.size,
        sceneIds: Array.from(selectedSceneIds)
      });
      toast.success(`Selected ${selectedSceneIds.size} scene${selectedSceneIds.size === 1 ? '' : 's'} - will be linked after asset creation`);
      return;
    }
    
    if (!asset) return;
    
    setIsApplyingSceneChanges(true);
    setProcessingProgress(null);
    
    try {
      // Get fresh assetSceneIds right before processing to avoid stale state
      const freshAssetSceneIds = asset ? getAssetScenes(asset.id) : [];
      const currentlyLinked = new Set(freshAssetSceneIds);
      const toLink: string[] = [];
      const toUnlink: string[] = [];
      
      // Determine what needs to be linked/unlinked
      selectedSceneIds.forEach(sceneId => {
        if (!currentlyLinked.has(sceneId)) {
          toLink.push(sceneId);
        }
      });
      
      currentlyLinked.forEach(sceneId => {
        if (!selectedSceneIds.has(sceneId)) {
          toUnlink.push(sceneId);
        }
      });
      
      const totalChanges = toLink.length + toUnlink.length;
      
      if (totalChanges === 0) {
        toast.info('No changes to apply');
        return;
      }
      
      console.log('[AssetDetailSidebar] 🔗 Using batch API to update scenes:', {
        assetId: asset.id,
        toLink: toLink.length,
        toUnlink: toUnlink.length,
        total: totalChanges
      });
      
      // Use batch API for reliable bulk operations
      await batchUpdatePropAssociations(
        asset.id,
        toLink,
        toUnlink
      );
      
      // Refresh selected scenes to match current state
      setTimeout(() => {
        const updatedAssetSceneIds = asset ? getAssetScenes(asset.id) : [];
        setSelectedSceneIds(new Set(updatedAssetSceneIds));
      }, 100);
      
      toast.success(`Updated ${totalChanges} scene link${totalChanges === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('[AssetDetailSidebar] Error applying scene changes:', error);
      toast.error('Failed to update scene links');
    } finally {
      setIsApplyingSceneChanges(false);
      setProcessingProgress(null);
    }
  };
  
  // Check if there are pending changes
  const hasPendingChanges = useMemo(() => {
    const currentlyLinked = new Set(assetSceneIds);
    if (selectedSceneIds.size !== currentlyLinked.size) return true;
    for (const sceneId of selectedSceneIds) {
      if (!currentlyLinked.has(sceneId)) return true;
    }
    for (const sceneId of currentlyLinked) {
      if (!selectedSceneIds.has(sceneId)) return true;
    }
    return false;
  }, [selectedSceneIds, assetSceneIds]);

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
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: '#2C2C2E' }}>
          <h2 className="text-base sm:text-lg font-semibold truncate pr-2" style={{ color: '#E5E7EB' }}>
            {isCreating ? 'New Asset' : formData.name}
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
                placeholder="Asset name"
                autoFocus={isCreating}
              />
              {isInScript && (
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Name cannot be changed because this asset appears in your script. Edit the script directly to change the name.
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
              >
                <option value="prop">Props & Small Items</option>
                <option value="vehicle">Vehicles</option>
                <option value="furniture">Furniture & Equipment</option>
                <option value="other">Other Objects</option>
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
                placeholder="Brief asset description"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs flex items-center gap-1"
                    style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
                  >
                    {tag}
                    {!isInScript && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {!isInScript && (
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
                  placeholder="Press Enter to add tag"
                />
              )}
            </div>

            {/* Linked Scenes Section - Feature 0136 (Multi-Select) */}
            {/* 🔥 FIX: Show during creation mode too - allows selecting scenes before asset exists */}
            {(isCreating || asset) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                    {isCreating ? (
                      <>Linked Scenes ({selectedSceneIds.size} selected - will be linked after creation)</>
                    ) : (
                      <>Linked Scenes ({selectedSceneIds.size} selected)</>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllScenes}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB', border: '1px solid #3F3F46' }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllScenes}
                      className="px-2 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB', border: '1px solid #3F3F46' }}
                    >
                      Deselect All
                    </button>
                    {hasPendingChanges && (
                      <button
                        onClick={handleApplySceneChanges}
                        disabled={isApplyingSceneChanges}
                        className="px-3 py-1 rounded text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        style={{ 
                          backgroundColor: '#DC2626', 
                          color: '#FFFFFF', 
                          border: '1px solid #991B1B',
                          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
                        }}
                        title={processingProgress ? `Processing scene ${processingProgress.current} of ${processingProgress.total}: ${processingProgress.sceneHeading}` : undefined}
                      >
                        {isApplyingSceneChanges ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {processingProgress ? (
                              <span>{processingProgress.current}/{processingProgress.total}</span>
                            ) : (
                              <span>Applying...</span>
                            )}
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            Apply Changes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search Box */}
                {scenes.length > 5 && (
                  <div className="mb-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      type="text"
                      placeholder="Search scenes..."
                      value={sceneSearchTerm}
                      onChange={(e) => setSceneSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB', border: '1px solid #3F3F46' }}
                    />
                  </div>
                )}
                
                {/* Scene Checkbox List */}
                {filteredScenes.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-2 mb-3" style={{ scrollbarWidth: 'thin' }}>
                    {filteredScenes.map(scene => {
                      const isSelected = selectedSceneIds.has(scene.id);
                      // During creation, no scenes are currently linked yet
                      const isCurrentlyLinked = !isCreating && assetSceneIds.includes(scene.id);
                      
                      return (
                        <label
                          key={scene.id}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-opacity-50"
                          style={{ 
                            backgroundColor: isSelected ? '#3F3F46' : '#2C2C2E',
                            border: `1px solid ${isSelected ? '#8B5CF6' : '#3F3F46'}`
                          }}
                        >
                          <div className="relative flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSceneToggle(scene.id)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-500'
                              }`}
                            >
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium" style={{ color: '#E5E7EB' }}>
                              {scene.number ? `Scene ${scene.number}: ` : ''}{scene.heading || 'Untitled Scene'}
                            </div>
                            {scene.synopsis && (
                              <div className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                                {scene.synopsis}
                              </div>
                            )}
                          </div>
                          {isCurrentlyLinked && !isSelected && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>
                              Currently linked
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border-2 border-dashed mb-3"
                    style={{ borderColor: '#2C2C2E', backgroundColor: '#0A0A0B' }}
                  >
                    <Package size={24} style={{ color: '#4B5563' }} className="mb-2" />
                    <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                      {sceneSearchTerm ? 'No scenes match your search' : 'No scenes available'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Asset Images Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                  Asset Images
                </label>
              </div>
              <div className="space-y-3">
                {/* Upload Buttons */}
                {(() => {
                  // Calculate user-uploaded image count for the upload button
                  const currentImages = asset?.images || [];
                  const userUploadedCount = currentImages.filter((img: any) => {
                    const source = img.metadata?.source;
                    return !source || source === 'user-upload';
                  }).length;
                  
                  return (
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || userUploadedCount >= 5}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1F1F1F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        style={{ 
                          backgroundColor: '#0A0A0A',
                          color: 'white',
                          border: '1px solid #3F3F46'
                        }}
                      >
                        {uploading ? 'Uploading...' : userUploadedCount >= 5 ? `Max Images (${userUploadedCount}/5)` : `Upload Photo (${userUploadedCount}/5)`}
                      </button>
                      <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDirectFileUpload}
                    className="hidden"
                  />
                    </div>
                  );
                })()}
                
                {/* Image Gallery */}
                {asset && asset.images && asset.images.length > 0 && (() => {
                  // 🔥 FIX: Filter images by source (same pattern as CharacterDetailSidebar)
                  // Creation section should only show user-uploaded images, not Production Hub angle images
                  const allImages = asset.images.map((img, idx) => {
                    // Use regenerated URL if available, otherwise use original URL
                    const imageUrl = img.s3Key && regeneratedImageUrls[img.s3Key] 
                      ? regeneratedImageUrls[img.s3Key] 
                      : img.url;
                    
                    return {
                      id: `asset-img-${idx}`,
                      imageUrl: imageUrl,
                      createdAt: img.uploadedAt,
                      metadata: {
                        ...(img.s3Key ? { s3Key: img.s3Key } : {}),
                        ...(img.metadata || {}), // Preserve all metadata (source, angle, etc.)
                        source: img.metadata?.source || (img.s3Key ? undefined : 'user-upload')
                      }
                    };
                  });
                  
                  // Filter: User-uploaded images (Creation section can delete these)
                  const userUploadedImages = allImages.filter(img => {
                    const source = (img.metadata as any)?.source;
                    // Show images with no source, 'user-upload', or undefined source (defaults to user-upload)
                    return !source || source === 'user-upload';
                  });
                  
                  // Filter: AI-generated Production Hub images (read-only in Creation section)
                  const aiGeneratedImages = allImages.filter(img => {
                    const source = (img.metadata as any)?.source;
                    // Show Production Hub generated images (angle-generation, image-generation)
                    return source === 'angle-generation' || source === 'image-generation';
                  });
                  
                  return (
                    <div className="space-y-4">
                      {/* User-Uploaded Images */}
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
                            entityType="asset"
                            entityId={asset.id}
                            entityName={formData.name || 'Asset'}
                            onDeleteImage={handleRemoveImage}
                          />
                        </div>
                      )}
                      
                      {/* 🔥 REMOVED: AI Generated Angle Images - not shown in Creation area for consistency */}
                      {/* AI-generated images are only visible in Production Hub */}
                    </div>
                  );
                })()}
                
                {isCreating && pendingImages.length > 0 && (
                  <ImageGallery
                    images={pendingImages.map((img, idx) => ({
                      id: `pending-${idx}`,
                      imageUrl: img.imageUrl,
                      createdAt: new Date().toISOString(),
                      metadata: img.prompt ? { prompt: img.prompt, modelUsed: img.modelUsed, s3Key: img.s3Key } : { s3Key: img.s3Key }
                    }))}
                    entityType="asset"
                    entityId="new"
                    entityName={formData.name || 'New Asset'}
                    onDeleteImage={(index: number) => {
                      setPendingImages(prev => prev.filter((_, i) => i !== index))
                    }}
                  />
                )}
                
                {(() => {
                  // Show empty state if no user-uploaded images (regardless of AI-generated images)
                  const hasUserUploadedImages = asset && asset.images && asset.images.some((img: any) => {
                    const source = img.metadata?.source;
                    return !source || source === 'user-upload';
                  });
                  
                  if (!hasUserUploadedImages && pendingImages.length === 0) {
                    return (
                      <div className="text-xs text-center space-y-1" style={{ color: '#6B7280' }}>
                        <p>Add images to create this asset</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                          <strong style={{ color: '#DC143C' }}>3D export required for scene generation</strong>
                          <br />
                          • Minimum: 2 images (required)
                          <br />
                          • Recommended: 5-8 images (best quality)
                          <br />
                          • Maximum: 5 images
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
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
                    onSwitchToChatImageMode(undefined, {
                      type: 'asset',
                      id: 'new',
                      name: formData.name || 'New Asset',
                      workflow: 'interview',
                      existingData: {
                        name: formData.name || '',
                        description: formData.description || '',
                        category: formData.category || ''
                      }
                    });
                  } catch (error) {
                    console.error('[AssetDetailSidebar] Error calling onSwitchToChatImageMode:', error);
                  }
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
            {isCreating ? 'Create Asset' : 'Save Changes'}
          </button>
          
          {!isCreating && (
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1F1F1F]"
              style={{ backgroundColor: '#0A0A0A', color: 'white', border: '1px solid #3F3F46' }}
            >
              <Trash2 className="h-4 w-4 inline mr-2" />
              Delete Asset
            </button>
          )}
        </div>

        {/* Image Prompt Modal - For AI Generation */}
        {showImagePromptModal && (
          <ImagePromptModal
            isOpen={showImagePromptModal}
            onClose={() => setShowImagePromptModal(false)}
            entityType="asset"
            entityData={{
              name: formData.name || 'New Asset',
              description: formData.description || '',
              category: formData.category || 'prop'
            }}
            entityId={asset?.id}
            projectId={screenplayId}
            onImageGenerated={async (imageUrl, prompt, modelUsed) => {
              // AI-generated images come as data URLs - we need to upload them to S3
              // For now, store them temporarily and they'll be uploaded when asset is created
              // or we can upload immediately if asset exists
              if (asset) {
                // Existing asset - upload generated image to S3
                try {
                  setUploading(true);
                  // Convert data URL to blob
                  const response = await fetch(imageUrl);
                  const blob = await response.blob();
                  const file = new File([blob], 'generated-image.png', { type: 'image/png' });
                  
                  // Use the same presigned upload flow
                  const token = await getToken({ template: 'wryda-backend' });
                  if (!token) throw new Error('Not authenticated');

                  if (!screenplayId) {
                    throw new Error('Screenplay ID not found');
                  }

                  // Get presigned URL
                  const presignedResponse = await fetch(
                    `/api/video/upload/get-presigned-url?` + 
                    `fileName=${encodeURIComponent(file.name)}` +
                    `&fileType=${encodeURIComponent(file.type)}` +
                    `&fileSize=${file.size}` +
                    `&screenplayId=${encodeURIComponent(screenplayId)}` +
                    `&projectId=${encodeURIComponent(screenplayId)}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  if (!presignedResponse.ok) {
                    throw new Error('Failed to get upload URL');
                  }

                  const { url, fields, s3Key } = await presignedResponse.json();
                  
                  // Upload to S3
                  const formData = new FormData();
                  Object.entries(fields).forEach(([key, value]) => {
                    if (key.toLowerCase() !== 'bucket') {
                      formData.append(key, value as string);
                    }
                  });
                  formData.append('file', file);
                  
                  await fetch(url, { method: 'POST', body: formData });

                  // Get presigned download URL
                  let downloadUrl = imageUrl; // Fallback
                  try {
                    const downloadResponse = await fetch('/api/s3/download-url', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ s3Key, expiresIn: 604800 }), // 7 days - matches S3 lifecycle
                    });
                    if (downloadResponse.ok) {
                      const downloadData = await downloadResponse.json();
                      if (downloadData.downloadUrl) {
                        downloadUrl = downloadData.downloadUrl;
                      }
                    }
                  } catch (error) {
                    console.warn('Failed to get presigned download URL:', error);
                  }

                  // 🔥 FIX: Get latest asset from context (not prop) to ensure we have current images
                  const currentAsset = assets.find(a => a.id === asset.id) || asset;
                  
                  // 🔥 FIX: Optimistic UI update - add image immediately
                  const newImageObject = {
                    url: downloadUrl,
                    uploadedAt: new Date().toISOString(),
                    s3Key: s3Key // Store s3Key for URL regeneration
                  };
                  const updatedImages = [
                    ...(currentAsset.images || []),
                    newImageObject
                  ];
                  setFormData(prev => ({
                    ...prev,
                    images: updatedImages
                  }));
                  
                  // Register with asset via ScreenplayContext (updates both API and local state)
                  await updateAsset(asset.id, {
                    images: updatedImages
                  });
                  
                  // 🔥 FIX: Sync asset data from context after update (with delay for DynamoDB consistency)
                  await new Promise(resolve => setTimeout(resolve, 500));
                  const updatedAssetFromContext = assets.find(a => a.id === asset.id);
                  if (updatedAssetFromContext) {
                    setFormData({ ...updatedAssetFromContext });
                  }
                  
                  toast.success('Image generated and uploaded');
                  
                  // Show StorageDecisionModal
                  setSelectedAsset({
                    url: downloadUrl,
                    s3Key: s3Key,
                    name: 'generated-image.png',
                    type: 'image'
                  });
                  setShowStorageModal(true);
                } catch (error: any) {
                  toast.error(`Failed to upload image: ${error.message}`);
                } finally {
                  setUploading(false);
                }
              } else if (isCreating) {
                // New asset - upload generated image to S3 now, store s3Key for later registration
                try {
                  setUploading(true);
                  // Convert data URL to blob
                  const response = await fetch(imageUrl);
                  const blob = await response.blob();
                  const file = new File([blob], 'generated-image.png', { type: 'image/png' });
                  
                  // Get token for authentication
                  const token = await getToken({ template: 'wryda-backend' });
                  if (!token) throw new Error('Not authenticated');
                  
                  if (!screenplayId) {
                    throw new Error('Screenplay ID not found');
                  }

                  // Get presigned URL
                  const presignedResponse = await fetch(
                    `/api/video/upload/get-presigned-url?` + 
                    `fileName=${encodeURIComponent(file.name)}` +
                    `&fileType=${encodeURIComponent(file.type)}` +
                    `&fileSize=${file.size}` +
                    `&screenplayId=${encodeURIComponent(screenplayId)}` +
                    `&projectId=${encodeURIComponent(screenplayId)}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  if (!presignedResponse.ok) {
                    throw new Error('Failed to get upload URL');
                  }

                  const { url, fields, s3Key } = await presignedResponse.json();
                  
                  // Upload to S3
                  const formData = new FormData();
                  Object.entries(fields).forEach(([key, value]) => {
                    if (key.toLowerCase() !== 'bucket') {
                      formData.append(key, value as string);
                    }
                  });
                  formData.append('file', file);
                  
                  await fetch(url, { method: 'POST', body: formData });

                  // Get presigned download URL
                  let downloadUrl = imageUrl; // Fallback
                  try {
                    const downloadResponse = await fetch('/api/s3/download-url', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ s3Key, expiresIn: 604800 }), // 7 days - matches S3 lifecycle
                    });
                    if (downloadResponse.ok) {
                      const downloadData = await downloadResponse.json();
                      if (downloadData.downloadUrl) {
                        downloadUrl = downloadData.downloadUrl;
                      }
                    }
                  } catch (error) {
                    console.warn('Failed to get presigned download URL:', error);
                  }

                  // Store with s3Key for later registration when asset is created
                  setPendingImages(prev => [...prev, { 
                    imageUrl: downloadUrl, 
                    s3Key: s3Key,
                    prompt, 
                    modelUsed 
                  }]);
                  
                  toast.success('Image generated and ready - will be added when asset is created');
                  
                  // Show StorageDecisionModal
                  setSelectedAsset({
                    url: downloadUrl,
                    s3Key: s3Key,
                    name: 'generated-image.png',
                    type: 'image'
                  });
                  setShowStorageModal(true);
                } catch (error: any) {
                  toast.error(`Failed to upload image: ${error.message}`);
                } finally {
                  setUploading(false);
                }
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
              entityType: 'asset',
              entityId: asset?.id || 'new',
              entityName: formData.name || 'Asset'
            }}
          />
        )}
      </motion.div>
    </>
  )
}

