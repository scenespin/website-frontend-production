"use client"

import { useState } from "react"
import { X, Trash2, Plus, Image as ImageIcon, Camera, Sparkles } from "lucide-react"
import { motion } from 'framer-motion'
import type { Character } from '@/types/screenplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useScreenplay } from '@/contexts/ScreenplayContext'
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
  const { getEntityImages, removeImageFromEntity } = useScreenplay()
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

  const handleSave = () => {
    if (!formData.name.trim()) return
    
    if (isCreating) {
      onCreate(formData)
    } else {
      onUpdate(formData)
    }
  }

  const handleDelete = () => {
    if (character && confirm(`Delete "${character.name}"?`)) {
      onDelete(character.id)
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
          {isCreating ? 'New Character' : formData.name}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0"
          style={{ color: '#9CA3AF' }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Character name"
            autoFocus={isCreating}
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as 'lead' | 'supporting' | 'minor' })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="supporting">Supporting</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Arc Status */}
        <div className="space-y-2">
          <Label htmlFor="arc-status">Arc Status</Label>
          <Select
            value={formData.arcStatus}
            onValueChange={(value) => setFormData({ ...formData, arcStatus: value as 'introduced' | 'developing' | 'resolved' })}
          >
            <SelectTrigger id="arc-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="introduced">Introduced</SelectItem>
              <SelectItem value="developing">Developing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Brief character description"
            className="resize-none"
          />
        </div>

        {/* Arc Notes */}
        <div className="space-y-2">
          <Label htmlFor="arc-notes">Arc Notes</Label>
          <Textarea
            id="arc-notes"
            value={formData.arcNotes || ''}
            onChange={(e) => setFormData({ ...formData, arcNotes: e.target.value })}
            rows={3}
            placeholder="Character arc development notes"
            className="resize-none"
          />
        </div>

        {/* Character Bank Integration - NEW! */}
        {!isCreating && character && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label style={{ fontWeight: 600 }}>
                  Reference Library
                </Label>
                {character.referenceLibrary?.hasReferences && (
                  <Badge variant="secondary" className="text-xs">
                    {character.referenceLibrary.referenceCount} references
                  </Badge>
                )}
              </div>
              
              {character.referenceLibrary?.hasReferences ? (
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">
                      Character Consistency Enabled
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This character has {character.referenceLibrary.referenceCount} reference images 
                    for consistent video generation
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onOpenCharacterBank) {
                        onOpenCharacterBank(character.id);
                      }
                    }}
                    className="w-full"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    Manage References
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">
                        Generate Reference Sheet
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Create 6-8 reference images (angles, expressions) for perfect character 
                        consistency across all video generations
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (onOpenCharacterBank) {
                        onOpenCharacterBank(character.id);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="sm"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Create Reference Library
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    ~30 credits • Maintains consistency in body shots, back shots & more
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Images Section - Only show for existing characters */}
        {!isCreating && character && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Character Images</Label>
              <Button
                onClick={() => setShowImageDialog(true)}
                size="sm"
                variant="outline"
                className="h-8 gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Image
              </Button>
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
      <div className="p-4 sm:p-6 space-y-3 border-t" style={{ borderColor: '#2C2C2E' }}>
        {/* AI Generate Button - Only show when creating */}
        {isCreating && (
          <Button
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
            className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
            size="lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ✨ Create with AI Interview
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          disabled={!formData.name.trim()}
          className="w-full"
          size="lg"
        >
          {isCreating ? 'Create Character' : 'Save Changes'}
        </Button>
        
        {!isCreating && (
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="w-full gap-2"
            size="lg"
          >
            <Trash2 className="h-4 w-4" />
            Delete Character
          </Button>
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
  )
}
