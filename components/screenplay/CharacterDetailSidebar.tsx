"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Camera, Sparkles } from "lucide-react"
import { motion } from 'framer-motion'
import type { Character } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useEditor } from '@/contexts/EditorContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'

interface CharacterDetailSidebarProps {
  character?: Character | null
  isCreating: boolean
  initialData?: Partial<Character> // NEW: Pre-fill form with AI-generated data
  onClose: () => void
  onCreate: (data: any) => void
  onUpdate: (character: Character) => void
  onDelete: (characterId: string) => void
  onSwitchToChatImageMode?: (modelId?: string, entityContext?: { type: string; id: string; name: string; workflow?: string }) => void
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
  const { getEntityImages, removeImageFromEntity, isEntityInScript } = useScreenplay()
  const { state: editorState } = useEditor()
  
  // Check if character is in script (if editing existing character) - memoized to prevent render loops
  const isInScript = useMemo(() => {
    return character ? isEntityInScript(editorState.content, character.name, 'character') : false;
  }, [character, editorState.content, isEntityInScript]);
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [formData, setFormData] = useState<any>(
    character ? { ...character } : (initialData ? {
      name: initialData.name || '',
      type: initialData.type || 'lead',
      arcStatus: initialData.arcStatus || 'introduced',
      description: initialData.description || '',
      arcNotes: initialData.arcNotes || ''
    } : {
      name: '',
      type: 'lead',
      arcStatus: 'introduced',
      description: '',
      arcNotes: ''
    })
  )
  
  // Update form data when character prop changes
  useEffect(() => {
    if (character) {
      setFormData({ ...character })
    } else if (initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'lead',
        arcStatus: initialData.arcStatus || 'introduced',
        description: initialData.description || '',
        arcNotes: initialData.arcNotes || ''
      })
    } else if (isCreating) {
      setFormData({
        name: '',
        type: 'lead',
        arcStatus: 'introduced',
        description: '',
        arcNotes: ''
      })
    }
  }, [character, initialData, isCreating])

  const handleSave = () => {
    if (!formData.name.trim()) return
    
    if (isCreating) {
      onCreate(formData)
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

        {/* Character Bank Integration - NEW! */}
        {!isCreating && character && (
          <div>
            <div className="h-px my-4" style={{ backgroundColor: '#2C2C2E' }}></div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: '#9CA3AF', fontWeight: 600 }}>
                  Reference Library
                </label>
                {character.referenceLibrary?.hasReferences && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#2C2C2E', color: '#9CA3AF' }}>
                    {character.referenceLibrary.referenceCount} references
                  </span>
                )}
              </div>
              
              {character.referenceLibrary?.hasReferences ? (
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
              ) : (
                <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: '#2C2C2E', backgroundColor: '#0A0A0B' }}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                      <Sparkles className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1" style={{ color: '#E5E7EB' }}>
                        Generate Reference Sheet
                      </h4>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        Create 6-8 reference images (angles, expressions) for perfect character 
                        consistency across all video generations
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenCharacterBank) {
                        onOpenCharacterBank(character.id);
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ 
                      background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                      color: 'white' 
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Create Reference Library
                  </button>
                  <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                    ~30 credits • Maintains consistency in body shots, back shots & more
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Images Section - Only show for existing characters */}
        {!isCreating && character && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
                Character Images
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
              const images = getEntityImages('character', character.id)
              return images.length > 0 ? (
                <ImageGallery
                  images={images}
                  entityType="character"
                  entityId={character.id}
                  entityName={character.name}
                  onDeleteImage={(index: number) => {
                    if (confirm('Remove this image from the character?')) {
                      removeImageFromEntity('character', character.id, index)
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
                    Click &quot;Add Image&quot; to visualize this character
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
                  type: 'character',
                  id: 'new',
                  name: formData.name || 'New Character',
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

      {/* Image Source Dialog */}
      {showImageDialog && character && (
        <ImageSourceDialog
          isOpen={showImageDialog}
          onClose={() => setShowImageDialog(false)}
          preSelectedEntity={{
            type: 'character',
            id: character.id,
            name: character.name
          }}
          onSwitchToChatImageMode={(modelId, entityContext) => {
            onSwitchToChatImageMode?.(modelId, entityContext);
            onClose(); // Close the sidebar
          }}
        />
      )}
      </motion.div>
    </>
  )
}
