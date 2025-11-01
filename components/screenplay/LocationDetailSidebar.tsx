"use client"

import { useState } from "react"
import { X, Trash2, Plus, Image as ImageIcon } from "lucide-react"
import { motion } from 'framer-motion'
import type { Location } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'

interface LocationDetailSidebarProps {
  location?: Location | null
  isCreating: boolean
  initialData?: Partial<Location> // NEW: Pre-fill form with AI-generated data
  onClose: () => void
  onCreate: (data: any) => void
  onUpdate: (location: Location) => void
  onDelete: (locationId: string) => void
  onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void
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
  const { getEntityImages, removeImageFromEntity } = useScreenplay()
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [formData, setFormData] = useState<any>(
    location ? { ...location } : (initialData ? {
      name: initialData.name || '',
      type: initialData.type || 'INT',
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

  const handleSave = () => {
    if (!formData.name.trim()) return
    
    if (isCreating) {
      onCreate(formData)
    } else {
      onUpdate(formData)
    }
  }

  const handleDelete = () => {
    if (location && confirm(`Delete "${location.name}"?`)) {
      onDelete(location.id)
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
          className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors shrink-0"
          style={{ color: '#9CA3AF' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            placeholder="Location name"
            autoFocus={isCreating}
          />
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

        {/* Images Section - Only show for existing locations */}
        {!isCreating && location && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                Location Images
              </label>
              <button
                onClick={() => setShowImageDialog(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: '#8B5CF6', color: 'white' }}
              >
                <Plus size={12} />
                Add Image
              </button>
            </div>
            {(() => {
              const images = getEntityImages('location', location.id)
              return images.length > 0 ? (
                <ImageGallery
                  images={images}
                  entityType="location"
                  entityId={location.id}
                  entityName={location.name}
                  onDeleteImage={(index: number) => {
                    if (confirm('Remove this image from the location?')) {
                      removeImageFromEntity('location', location.id, index)
                    }
                  }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed"
                  style={{ borderColor: '#2C2C2E', backgroundColor: '#0A0A0B' }}
                >
                  <ImageIcon size={32} style={{ color: '#4B5563' }} className="mb-2" />
                  <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                    No images yet
                  </p>
                  <p className="text-xs text-center mt-1" style={{ color: '#4B5563' }}>
                    Click &quot;Add Image&quot; to visualize this location
                  </p>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-6 border-t space-y-2" style={{ borderColor: '#2C2C2E' }}>
        {/* AI Generate Button - Only show when creating */}
        {isCreating && (
          <button
            onClick={() => {
              if (onSwitchToChatImageMode) {
                onSwitchToChatImageMode(undefined, {
                  type: 'location',
                  id: 'new',
                  name: formData.name || 'New Location',
                  workflow: 'interview'
                });
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

      {/* Image Source Dialog */}
      {showImageDialog && location && (
        <ImageSourceDialog
          isOpen={showImageDialog}
          onClose={() => setShowImageDialog(false)}
          preSelectedEntity={{
            type: 'location',
            id: location.id,
            name: location.name
          }}
          onSwitchToChatImageMode={(modelId, entityContext) => {
            onSwitchToChatImageMode?.(modelId, entityContext);
            onClose(); // Close the sidebar
          }}
        />
      )}
    </motion.div>
  )
}
