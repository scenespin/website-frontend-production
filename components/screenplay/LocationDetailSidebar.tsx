"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Upload, Sparkles } from "lucide-react"
import { motion } from 'framer-motion'
import type { Location, ImageAsset } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useEditor } from '@/contexts/EditorContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'
import { ImagePromptModal } from '@/components/images/ImagePromptModal'
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

interface LocationDetailSidebarProps {
  location?: Location | null
  isCreating: boolean
  initialData?: Partial<Location> // NEW: Pre-fill form with AI-generated data
  onClose: () => void
  onCreate: (data: any) => void
  onUpdate: (location: Location) => void
  onDelete: (locationId: string) => void
  onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string; existingData?: { name?: string; description?: string; type?: string } }) => void
}

export default function LocationDetailSidebar({
  location,
  isCreating,
  initialData,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSwitchToChatImageMode
}: LocationDetailSidebarProps) {
  const { getEntityImages, removeImageFromEntity, isEntityInScript, addImageToEntity, updateLocation, screenplayId, locations } = useScreenplay()
  const { state: editorState } = useEditor()
  const { getToken } = useAuth()
  
  // Check if location is in script (if editing existing location) - memoized to prevent render loops
  const isInScript = useMemo(() => {
    return location ? isEntityInScript(editorState.content, location.name, 'location') : false;
  }, [location, editorState.content, isEntityInScript]);
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showImagePromptModal, setShowImagePromptModal] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ imageUrl: string; s3Key: string; prompt?: string; modelUsed?: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [showStorageModal, setShowStorageModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{url: string; s3Key: string; name: string; type: 'image' | 'video' | 'attachment'} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<any>(
    location ? { ...location } : (initialData ? {
      name: initialData.name || '',
      type: initialData.type || 'INT', // 🔥 FIX: Use initialData.type directly
      description: initialData.description || '',
      address: initialData.address || '',
      atmosphereNotes: initialData.atmosphereNotes || '',
      setRequirements: initialData.setRequirements || '',
      productionNotes: initialData.productionNotes || ''
    } : {
      name: '',
      type: 'INT',
      description: '',
      address: '',
      atmosphereNotes: '',
      setRequirements: '',
      productionNotes: ''
    })
  )

  // 🔥 FIX: Update formData when initialData changes (for column type selection)
  useEffect(() => {
    if (location) {
      setFormData({ ...location })
    } else if (isCreating && !location) {
      // If initialData is provided, use it (especially for column type)
      if (initialData) {
        console.log('[LocationDetailSidebar] 🔄 Updating formData from initialData:', initialData);
        setFormData({
          name: initialData.name || '',
          type: initialData.type || 'INT', // 🔥 FIX: Use initialData.type (from column selection)
          description: initialData.description || '',
          address: initialData.address || '',
          atmosphereNotes: initialData.atmosphereNotes || '',
          setRequirements: initialData.setRequirements || '',
          productionNotes: initialData.productionNotes || ''
        });
      } else {
        // Reset to defaults if no initialData
        setFormData({
          name: '',
          type: 'INT',
          description: '',
          address: '',
          atmosphereNotes: '',
          setRequirements: '',
          productionNotes: ''
        });
      }
    }
  }, [isCreating, initialData, location])

  // 🔥 FIX: Refetch location data after StorageDecisionModal closes (like MediaLibrary refetches files)
  // This ensures the UI reflects the latest location data, including newly uploaded images
  useEffect(() => {
    if (!showStorageModal && location?.id) {
      // Modal just closed - sync from context (which should have been updated by the upload)
      // Add small delay to ensure DynamoDB consistency (like MediaLibrary does)
      const syncLocation = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedLocationFromContext = locations.find(l => l.id === location.id);
        if (updatedLocationFromContext) {
          setFormData(updatedLocationFromContext);
        }
      };
      syncLocation();
    }
  }, [showStorageModal, location?.id, locations])

  const handleSave = async () => {
    if (!formData.name.trim()) return
    
    if (isCreating) {
      // Pass pending images with form data so parent can add them after location creation
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
    // 🔥 FIX: Remove browser confirm() - let DeleteLocationDialog handle confirmation
    // Close sidebar first, then trigger delete dialog
    if (location) {
      onClose(); // Close sidebar
      onDelete(location.id); // This will open DeleteLocationDialog with dependency check
    }
  }

  const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Support multiple files - process all selected files
    const fileArray = Array.from(files);

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
          throw new Error(`Invalid response from server for ${file.name}`);
        }

        // Step 2: Upload directly to S3 using FormData POST
        const formData = new FormData();
        
        Object.entries(fields).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'bucket') {
            formData.append(key, value as string);
          }
        });
        
        formData.append('file', file);
        
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`S3 upload failed for ${file.name}: ${xhr.status} ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error(`S3 upload failed for ${file.name}: Network error`));
          });
          
          xhr.open('POST', url);
          xhr.send(formData);
        });

        // Step 3: Get presigned download URL
        const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
        const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
        const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
        
        let downloadUrl = s3Url;
        try {
          const downloadResponse = await fetch('/api/s3/download-url', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 3600
            }),
          });
          
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json();
            if (downloadData.downloadUrl) {
              downloadUrl = downloadData.downloadUrl;
            }
          }
        } catch (error) {
          console.warn('[LocationDetailSidebar] Failed to get presigned download URL:', error);
        }

        uploadedImages.push({
          imageUrl: downloadUrl,
          s3Key: s3Key
        });
      }

      // Step 4: Persist images to location (or add to pending)
      if (location) {
        // Existing location - update location's images array directly
        // 🔥 FIX: Get latest location from context (not prop) to ensure we have current images
        const currentLocation = locations.find(l => l.id === location.id) || location;
        const currentImages = currentLocation.images || [];
        const newImages: ImageAsset[] = uploadedImages.map(img => ({
          imageUrl: img.imageUrl,
          createdAt: new Date().toISOString(),
          metadata: {
            s3Key: img.s3Key
          }
        }));
        
        const updatedImages = [...currentImages, ...newImages];
        
        // 🔥 FIX: Optimistic UI update - add images immediately
        setFormData(prev => ({
          ...prev,
          images: updatedImages
        }));
        
        // Update location with new images array - this persists to DynamoDB
        await updateLocation(location.id, {
          images: updatedImages
        });
        
        // Force a small delay to ensure DynamoDB consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 🔥 FIX: Sync location data from context after update (like MediaLibrary refetches)
        // Get updated location from context to ensure UI reflects the new images
        const updatedLocationFromContext = locations.find(l => l.id === location.id);
        if (updatedLocationFromContext) {
          setFormData({ ...updatedLocationFromContext });
        }
        
        toast.success(`Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`);
      } else if (isCreating) {
        // New location - store temporarily, will be added after location creation
        setPendingImages(prev => [...prev, ...uploadedImages]);
        toast.success(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} ready - will be added when location is created`);
      }

      // Step 5: Show StorageDecisionModal for all uploaded images
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
      console.error('[LocationDetailSidebar] Upload error:', error);
      toast.error(error.message || 'Failed to upload image(s)');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
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
    >
      {/* Header - Full width on mobile */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: '#2C2C2E' }}>
        <h2 className="text-base sm:text-lg font-semibold truncate pr-2" style={{ color: '#E5E7EB' }}>
          {isCreating ? 'New Location' : formData.name}
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
            placeholder="Location name"
            autoFocus={isCreating}
          />
          {isInScript && (
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Name cannot be changed because this location appears in your script. Edit the script directly to change the name.
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
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
          >
            <option value="INT">Interior</option>
            <option value="EXT">Exterior</option>
            <option value="INT/EXT">INT/EXT</option>
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
            placeholder="Brief description"
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Address
          </label>
          <input
            type="text"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            placeholder="Physical address or location"
          />
        </div>

        {/* Atmosphere Notes */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Atmosphere Notes
          </label>
          <textarea
            value={formData.atmosphereNotes || ''}
            onChange={(e) => setFormData({ ...formData, atmosphereNotes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            rows={2}
            placeholder="Mood, lighting, ambiance"
          />
        </div>

        {/* Set Requirements */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Set Requirements
          </label>
          <textarea
            value={formData.setRequirements || ''}
            onChange={(e) => setFormData({ ...formData, setRequirements: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            rows={2}
            placeholder="Props, dressing, special needs"
          />
        </div>

        {/* Production Notes */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Production Notes
          </label>
          <textarea
            value={formData.productionNotes || ''}
            onChange={(e) => setFormData({ ...formData, productionNotes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            rows={2}
            placeholder="Logistics, permits, accessibility"
          />
        </div>

        {/* Location Images Section - Show for both creating and editing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
              Location Images
              <span className="ml-2 text-xs font-normal" style={{ color: '#6B7280' }}>
                (Upload multiple for better reference)
              </span>
            </label>
          </div>
          {(() => {
            const images = location ? getEntityImages('location', location.id) : []
            const allImages = location ? images : pendingImages.map((img, idx) => ({
              id: `pending-${idx}`,
              imageUrl: img.imageUrl,
              metadata: { 
                s3Key: img.s3Key,
                prompt: img.prompt, 
                modelUsed: img.modelUsed 
              },
              createdAt: new Date().toISOString()
            }))
            return (
              <div className="space-y-3">
                {/* Upload Buttons */}
                <div className="flex gap-2">
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
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  {/* Hidden file input for direct upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDirectFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      // Only allow AI generation if location has name/description
                      if (isCreating && (!formData.name || !formData.description)) {
                        toast.error('Please enter location name and description first to generate an image')
                        return
                      }
                      setShowImagePromptModal(true)
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                    style={{ 
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      border: '1px solid #8B5CF6'
                    }}
                  >
                    Create Photo with AI
                  </button>
                </div>
                
                {/* Image Gallery - Show if images exist */}
                {allImages.length > 0 && (
                  <ImageGallery
                    images={allImages}
                    entityType="location"
                    entityId={location?.id || 'new'}
                    entityName={formData.name || 'New Location'}
                    onDeleteImage={async (index: number) => {
                      if (location) {
                        // 🔥 FIX: ImageGallery already shows confirm dialog, so we don't need another one
                        try {
                          // 🔥 FIX: Use updateLocation directly (like assets/characters) instead of removeImageFromEntity
                            // Get current location from context to ensure we have latest images
                            const currentLocation = locations.find(l => l.id === location.id) || location;
                            const updatedImages = (currentLocation.images || []).filter((_, i) => i !== index);
                            
                            // Optimistic UI update - remove image immediately
                            setFormData(prev => ({
                              ...prev,
                              images: updatedImages
                            }));
                            
                            // Update via API
                            await updateLocation(location.id, { images: updatedImages });
                            
                            // Sync from context after update (with delay for DynamoDB consistency)
                            await new Promise(resolve => setTimeout(resolve, 500));
                            const updatedLocationFromContext = locations.find(l => l.id === location.id);
                            if (updatedLocationFromContext) {
                              setFormData({ ...updatedLocationFromContext });
                            }
                            
                            toast.success('Image removed');
                          } catch (error: any) {
                            // Rollback on error
                            setFormData(prev => ({
                              ...prev,
                              images: location.images || []
                            }));
                            toast.error(`Failed to remove image: ${error.message}`);
                          }
                        }
                      } else {
                        // Remove from pending images
                        setPendingImages(prev => prev.filter((_, i) => i !== index))
                      }
                    }}
                  />
                )}
                
                {allImages.length === 0 && (
                  <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                    Add images to visualize this location (multiple angles recommended)
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
                    type: 'location',
                    id: 'new',
                    name: formData.name || 'New Location',
                    workflow: 'interview',
                    existingData: {
                      name: formData.name || '',
                      description: formData.description || '',
                      type: formData.type || ''
                    }
                  });
                } catch (error) {
                  console.error('[LocationDetailSidebar] Error calling onSwitchToChatImageMode:', error);
                }
              } else {
                console.warn('[LocationDetailSidebar] onSwitchToChatImageMode is not a function:', typeof onSwitchToChatImageMode);
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
          {isCreating ? 'Create Location' : 'Save Changes'}
        </button>
        
        {!isCreating && (
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#DC2626', color: 'white' }}
          >
            <Trash2 className="h-4 w-4 inline mr-2" />
            Delete Location
          </button>
        )}
      </div>


      {/* Image Prompt Modal - For AI Generation */}
      {showImagePromptModal && (
        <ImagePromptModal
          isOpen={showImagePromptModal}
          onClose={() => setShowImagePromptModal(false)}
          entityType="location"
          entityData={{
            name: formData.name || 'New Location',
            description: formData.description || '',
            type: formData.type || 'INT',
            atmosphereNotes: formData.atmosphereNotes || ''
          }}
          onImageGenerated={async (imageUrl, prompt, modelUsed) => {
            // AI-generated images come as data URLs - we need to upload them to S3
            try {
              setUploading(true);
              // Convert data URL to blob
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              const file = new File([blob], 'generated-location.png', { type: 'image/png' });
              
              if (!screenplayId) {
                throw new Error('Screenplay ID not found');
              }

              const token = await getToken({ template: 'wryda-backend' });
              if (!token) throw new Error('Not authenticated');

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
              const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
              const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
              const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
              let downloadUrl = s3Url; // Fallback
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

              if (location) {
                // 🔥 FIX: Get latest location from context (not prop) to ensure we have current images
                const currentLocation = locations.find(l => l.id === location.id) || location;
                
                // 🔥 FIX: Optimistic UI update - add image immediately
                const newImage: ImageAsset = {
                  imageUrl: downloadUrl,
                  createdAt: new Date().toISOString(),
                  metadata: {
                    prompt,
                    modelUsed,
                    s3Key: s3Key
                  }
                };
                const updatedImages = [...(currentLocation.images || []), newImage];
                setFormData(prev => ({
                  ...prev,
                  images: updatedImages
                }));
                
                // Existing location - update via updateLocation directly (like assets)
                await updateLocation(location.id, {
                  images: updatedImages
                });
                
                // 🔥 FIX: Sync location data from context after update (with delay for DynamoDB consistency)
                await new Promise(resolve => setTimeout(resolve, 500));
                const updatedLocationFromContext = locations.find(l => l.id === location.id);
                if (updatedLocationFromContext) {
                  setFormData({ ...updatedLocationFromContext });
                }
                
                toast.success('Image generated and uploaded');
                
                // Show StorageDecisionModal
                setSelectedAsset({
                  url: downloadUrl,
                  s3Key: s3Key,
                  name: 'generated-location.png',
                  type: 'image'
                });
                setShowStorageModal(true);
              } else if (isCreating) {
                // New location - store temporarily with s3Key
                setPendingImages(prev => [...prev, { 
                  imageUrl: downloadUrl, 
                  s3Key: s3Key,
                  prompt, 
                  modelUsed 
                }]);
                toast.success('Image generated - will be uploaded when location is created');
                
                // Show StorageDecisionModal
                setSelectedAsset({
                  url: downloadUrl,
                  s3Key: s3Key,
                  name: 'generated-location.png',
                  type: 'image'
                });
                setShowStorageModal(true);
              }
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
              entityType: 'location',
              entityId: location?.id || 'new',
              entityName: formData.name || 'Location'
            }}
          />
        )}
    </motion.div>
  )
}
