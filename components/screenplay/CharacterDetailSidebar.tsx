"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Camera, Sparkles, Upload } from "lucide-react"
import { motion } from 'framer-motion'
import type { Character } from '@/types/screenplay'
import { useScreenplay } from '@/contexts/ScreenplayContext'
import { useEditor } from '@/contexts/EditorContext'
import { ImageGallery } from '@/components/images/ImageGallery'
import { ImageSourceDialog } from '@/components/images/ImageSourceDialog'
import { ImagePromptModal } from '@/components/images/ImagePromptModal'

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
  const { getEntityImages, removeImageFromEntity, isEntityInScript, addImageToEntity } = useScreenplay()
  const { state: editorState } = useEditor()
  
  // Check if character is in script (if editing existing character) - memoized to prevent render loops
  const isInScript = useMemo(() => {
    return character ? isEntityInScript(editorState.content, character.name, 'character') : false;
  }, [character, editorState.content, isEntityInScript]);
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showImagePromptModal, setShowImagePromptModal] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ imageUrl: string; prompt?: string; modelUsed?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        arcNotes: initialData.arcNotes || '',
        physicalAttributes: initialData.physicalAttributes || {}
      })
    } else if (isCreating) {
      setFormData({
        name: '',
        type: 'lead',
        arcStatus: 'introduced',
        description: '',
        arcNotes: '',
        physicalAttributes: {}
      })
    }
  }, [character, initialData, isCreating])

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
      
      // Associate image with character
      if (character) {
        // Existing character - add image directly
        await addImageToEntity('character', character.id, dataUrl);
      } else if (isCreating) {
        // New character - store temporarily, will be added after character creation
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
                      // Disabled - Coming Soon
                    }}
                    disabled
                    className="w-full px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                    style={{ 
                      background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
                      color: 'white' 
                    }}
                    title="Coming Soon - This feature will be available shortly"
                  >
                    <Sparkles className="w-3 h-3" />
                    Create Reference Library (Coming Soon)
                  </button>
                  <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                    ~30 credits • Maintains consistency in body shots, back shots & more
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Character Images Section - Show for both creating and editing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>
              Character Images
            </label>
          </div>
          {(() => {
            const images = character ? getEntityImages('character', character.id) : []
            const allImages = character ? images : pendingImages.map((img, idx) => ({
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
                      // Only allow AI generation if character has name/description
                      if (isCreating && (!formData.name || !formData.description)) {
                        alert('Please enter character name and description first to generate an image')
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
                    entityType="character"
                    entityId={character?.id || 'new'}
                    entityName={formData.name || 'New Character'}
                    onDeleteImage={(index: number) => {
                      if (character) {
                        if (confirm('Remove this image from the character?')) {
                          removeImageFromEntity('character', character.id, index)
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
                    Add an image to visualize this character
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
          onImageGenerated={async (imageUrl, prompt, modelUsed) => {
            // Associate image with character
            if (character) {
              // Existing character - add image directly
              await addImageToEntity('character', character.id, imageUrl, {
                prompt,
                modelUsed
              });
            } else if (isCreating) {
              // New character - store temporarily, will be added after character creation
              setPendingImages(prev => [...prev, { imageUrl, prompt, modelUsed }]);
            }
            setShowImagePromptModal(false);
          }}
        />
      )}
      </motion.div>
    </>
  )
}
