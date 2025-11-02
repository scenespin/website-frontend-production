"use client"

import { useState } from "react"
import { X, Trash2, Image as ImageIcon, Plus } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import type { Scene, Character, Location } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'

interface SceneDetailSidebarProps {
  scene?: Scene | null
  isCreating: boolean
  beatId: string // Parent beat for new scenes
  initialData?: Partial<Scene> // NEW: Pre-fill form with AI-generated data
  characters: Character[]
  locations: Location[]
  onClose: () => void
  onCreate: (beatId: string, data: any) => void
  onUpdate: (scene: Scene) => void
  onDelete: (sceneId: string) => void
  onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void
}

export default function SceneDetailSidebar({
  scene,
  isCreating,
  beatId,
  initialData,
  characters,
  locations,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSwitchToChatImageMode
}: SceneDetailSidebarProps) {
  const { getEntityImages, removeImageFromEntity } = useScreenplay()
  const [formData, setFormData] = useState<any>(
    scene ? { ...scene } : (initialData ? {
      number: initialData.number || 1,
      heading: initialData.heading || '',
      synopsis: initialData.synopsis || '',
      status: initialData.status || 'draft',
      order: 0,
      fountain: {
        startLine: 0,
        endLine: 0,
        tags: {
          characters: [],
          location: undefined
        }
      }
    } : {
      number: 1,
      heading: '',
      synopsis: '',
      status: 'draft',
      order: 0,
      fountain: {
        startLine: 0,
        endLine: 0,
        tags: {
          characters: [],
          location: undefined
        }
      }
    })
  )
  const [showImageDialog, setShowImageDialog] = useState(false)

  const handleSave = () => {
    if (!formData.heading.trim()) return
    
    if (isCreating) {
      onCreate(beatId, formData)
    } else {
      onUpdate(formData)
    }
  }

  const handleDelete = () => {
    if (scene && confirm(`Delete Beat ${scene.number}?`)) {
      onDelete(scene.id)
    }
  }

  const toggleCharacter = (charId: string) => {
    const currentChars = formData.fountain.tags.characters || []
    const newChars = currentChars.includes(charId)
      ? currentChars.filter((id: string) => id !== charId)
      : [...currentChars, charId]
    
    setFormData({
      ...formData,
      fountain: {
        ...formData.fountain,
        tags: {
          ...formData.fountain.tags,
          characters: newChars
        }
      }
    })
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
          {isCreating ? 'New Story Beat' : `Beat ${formData.number}`}
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
        {/* Beat Number */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Beat Number
          </label>
          <input
            type="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            placeholder="1"
          />
        </div>

        {/* Scene Heading */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Heading
          </label>
          <input
            type="text"
            value={formData.heading}
            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            placeholder="INT. COFFEE SHOP - DAY"
            autoFocus={isCreating}
          />
        </div>

        {/* Synopsis */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Synopsis
          </label>
          <textarea
            value={formData.synopsis || ''}
            onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
            rows={3}
            placeholder="Brief scene description"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="final">Final</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Location
          </label>
          <select
            value={formData.fountain.tags.location || ''}
            onChange={(e) => setFormData({
              ...formData,
              fountain: {
                ...formData.fountain,
                tags: {
                  ...formData.fountain.tags,
                  location: e.target.value || undefined
                }
              }
            })}
            className="w-full px-3 py-2 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            style={{ backgroundColor: '#2C2C2E', color: '#E5E7EB' }}
          >
            <option value="">No location</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.type})
              </option>
            ))}
          </select>
        </div>

        {/* Characters */}
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#9CA3AF' }}>
            Characters
          </label>
          <div className="space-y-2">
            {characters.map(char => {
              const isSelected = (formData.fountain.tags.characters || []).includes(char.id)
              return (
                <button
                  key={char.id}
                  onClick={() => toggleCharacter(char.id)}
                  className="w-full px-3 py-2 rounded-lg text-left text-sm transition-all"
                  style={{
                    backgroundColor: isSelected ? '#14B8A6' : '#2C2C2E',
                    color: isSelected ? 'white' : '#9CA3AF',
                    border: isSelected ? '1px solid #14B8A6' : '1px solid #2C2C2E'
                  }}
                >
                  {char.name} ({char.type})
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Images Section - Only show for existing beats */}
        {!isCreating && scene && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                Beat Images
              </label>
              <button
                onClick={() => setShowImageDialog(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: '#14B8A6', color: 'white' }}
              >
                <Plus size={12} />
                Add Image
              </button>
            </div>
            
            {(() => {
              const images = getEntityImages('scene', scene.id)
              return images.length > 0 ? (
                <ImageGallery
                  images={images}
                  entityType="scene"
                  entityId={scene.id}
                  entityName={scene.heading}
                  onDeleteImage={(index: number) => {
                    if (confirm('Remove this image from the scene?')) {
                      removeImageFromEntity('scene', scene.id, index)
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
                    Click &quot;Add Image&quot; to visualize this beat
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
              console.log('AI Scene Creation Interview: Starting workflow');
              
              if (onSwitchToChatImageMode) {
                onSwitchToChatImageMode(undefined, {
                  type: 'scene',
                  id: 'new',
                  name: formData.heading || 'New Scene',
                  workflow: 'interview'
                });
              }
              
              // Close the sidebar so user can see the chat
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
          disabled={!formData.heading.trim()}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: '#14B8A6', color: 'white' }}
        >
          {isCreating ? 'Create Story Beat' : 'Save Changes'}
        </button>
        
        {!isCreating && (
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#DC2626', color: 'white' }}
          >
            <Trash2 className="h-4 w-4 inline mr-2" />
            Delete Story Beat
          </button>
        )}
      </div>
      
      {/* Image Source Dialog */}
      {showImageDialog && scene && (
        <ImageSourceDialog
          isOpen={showImageDialog}
          onClose={() => setShowImageDialog(false)}
          preSelectedEntity={{
            type: 'scene',
            id: scene.id,
            name: scene.heading
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

