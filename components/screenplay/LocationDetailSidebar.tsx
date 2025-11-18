"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Upload, Sparkles } from "lucide-react"
import { motion } from 'framer-motion'
import type { Location } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useEditor } from '@/contexts/EditorContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'
import { ImagePromptModal } from '@/components/images/ImagePromptModal'

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
  const { getEntityImages, removeImageFromEntity, isEntityInScript, addImageToEntity } = useScreenplay()
  const { state: editorState } = useEditor()
  
  // Check if location is in script (if editing existing location) - memoized to prevent render loops
  const isInScript = useMemo(() => {
    return location ? isEntityInScript(editorState.content, location.name, 'location') : false;
  }, [location, editorState.content, isEntityInScript]);
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showImagePromptModal, setShowImagePromptModal] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ imageUrl: string; prompt?: string; modelUsed?: string }>>([])
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
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      // Associate image with location
      if (location) {
        // Existing location - add image directly
        await addImageToEntity('location', location.id, dataUrl);
      } else if (isCreating) {
        // New location - store temporarily, will be added after location creation
        setPendingImages(prev => [...prev, { imageUrl: dataUrl }]);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            </label>
          </div>
          {(() => {
            const images = location ? getEntityImages('location', location.id) : []
            const allImages = location ? images : pendingImages.map((img, idx) => ({
              id: `pending-${idx}`,
              imageUrl: img.imageUrl,
              metadata: img.prompt ? { prompt: img.prompt, modelUsed: img.modelUsed } : undefined,
              createdAt: new Date().toISOString()
            }))
            return (
              <div className="space-y-3">
                {/* Two Small Buttons - Always visible */}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
                    style={{ 
                      backgroundColor: '#DC143C',
                      color: 'white',
                      border: '1px solid #DC143C'
                    }}
                  >
                    Upload Photo
                  </button>
                  {/* Hidden file input for direct upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDirectFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      // Only allow AI generation if location has name/description
                      if (isCreating && (!formData.name || !formData.description)) {
                        alert('Please enter location name and description first to generate an image')
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
                    onDeleteImage={(index: number) => {
                      if (location) {
                        if (confirm('Remove this image from the location?')) {
                          removeImageFromEntity('location', location.id, index)
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
                    Add an image to visualize this location
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
            // Associate image with location
            if (location) {
              // Existing location - add image directly
              await addImageToEntity('location', location.id, imageUrl, {
                prompt,
                modelUsed
              });
            } else if (isCreating) {
              // New location - store temporarily, will be added after location creation
              setPendingImages(prev => [...prev, { imageUrl, prompt, modelUsed }]);
            }
            setShowImagePromptModal(false);
          }}
        />
      )}
    </motion.div>
  )
}
