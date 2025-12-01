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
  
  // Headshot angle labels for multiple headshots
  const headshotAngles = [
    { value: 'front', label: 'Front View' },
    { value: 'side', label: 'Side Profile' },
    { value: 'three-quarter', label: '3/4 Angle' }
  ]
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

  // 🔥 FIX: Refetch character data after StorageDecisionModal closes (like MediaLibrary refetches files)
  // This ensures the UI reflects the latest character data, including newly uploaded images
  useEffect(() => {
    if (!showStorageModal && character?.id) {
      // Modal just closed - sync from context (which should have been updated by the upload)
      // Add small delay to ensure DynamoDB consistency (like MediaLibrary does)
      const syncCharacter = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedCharacterFromContext = characters.find(c => c.id === character.id);
        if (updatedCharacterFromContext) {
          setFormData(updatedCharacterFromContext);
        }
      };
      syncCharacter();
    }
  }, [showStorageModal, character?.id, characters])

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

  const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, angle?: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!screenplayId) {
      toast.error('Screenplay ID not found');
      return;
    }

    setUploading(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Upload file to S3
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
          throw new Error(`File too large. Maximum size is 10MB.`);
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json();
          throw new Error(errorData.error || `Failed to get upload URL: ${presignedResponse.status}`);
        }
      }

      const { url, fields, s3Key } = await presignedResponse.json();
      
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
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
            reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('S3 upload failed: Network error'));
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
            expiresIn: 604800 // 7 days - matches S3 lifecycle
          }),
        });
        
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          if (downloadData.downloadUrl) {
            downloadUrl = downloadData.downloadUrl;
          }
        }
      } catch (error) {
        console.warn('[CharacterDetailSidebar] Failed to get presigned download URL:', error);
      }

      // Step 4: Persist image to character (or add to pending)
      if (character) {
        // 🔥 FIX: Get latest character from context to avoid stale images (race condition)
        // If multiple images are uploaded quickly, they all use the same stale character.images
        // Get the latest from context to ensure we're appending to the most recent images array
        const currentCharacter = characters.find(c => c.id === character.id) || character;
        const currentImages = currentCharacter.images || [];
        
        // Check if image with same angle already exists (prevent duplicates)
        const existingImageWithAngle = currentImages.find(img => img.metadata?.angle === angle);
        if (existingImageWithAngle && angle) {
          toast.warning(`An image with ${angle} angle already exists. Replacing it.`);
          // Replace existing image with same angle
          const updatedImages = currentImages.map(img => 
            img.metadata?.angle === angle ? {
              imageUrl: downloadUrl,
              createdAt: new Date().toISOString(),
              metadata: {
                angle: angle,
                s3Key: s3Key
              }
            } : img
          );
          
          await updateCharacter(character.id, {
            images: updatedImages
          });
        } else {
          // Add new image (no existing image with this angle)
          const newImage: ImageAsset = {
            imageUrl: downloadUrl,
            createdAt: new Date().toISOString(),
            metadata: {
              angle: angle,
              s3Key: s3Key
            }
          };
          
          // Update character with new image - this persists to DynamoDB
          await updateCharacter(character.id, {
            images: [...currentImages, newImage]
          });
        }
        
        // Force a small delay to ensure DynamoDB consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 🔥 FIX: Sync character data from context after update (like MediaLibrary refetches)
        // Get updated character from context to ensure UI reflects the new image
        const updatedCharacterFromContext = characters.find(c => c.id === character.id);
        if (updatedCharacterFromContext) {
          setFormData({ ...updatedCharacterFromContext });
        }
        
        toast.success('Headshot uploaded successfully');
      } else if (isCreating) {
        // New character - store temporarily, will be added after character creation
        setPendingImages(prev => [...prev, { 
          imageUrl: downloadUrl, 
          s3Key: s3Key,
          angle: angle
        }]);
        toast.success('Headshot ready - will be added when character is created');
      }

      // Step 5: Show StorageDecisionModal
      setSelectedAsset({
        url: downloadUrl,
        s3Key: s3Key,
        name: file.name,
        type: 'image'
      });
      setShowStorageModal(true);

    } catch (error: any) {
      console.error('[CharacterDetailSidebar] Upload error:', error);
      toast.error(error.message || 'Failed to upload headshot(s)');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
            const allImages: ImageAsset[] = character ? images : pendingImages.map((img, idx) => ({
              imageUrl: img.imageUrl,
              metadata: { 
                angle: img.angle,
                s3Key: img.s3Key,
                prompt: img.prompt, 
                modelUsed: img.modelUsed 
              },
              createdAt: new Date().toISOString()
            }))
            
            // Group images by angle for display
            const frontImages = allImages.filter(img => img.metadata?.angle === 'front' || !img.metadata?.angle)
            const sideImages = allImages.filter(img => img.metadata?.angle === 'side')
            const threeQuarterImages = allImages.filter(img => img.metadata?.angle === 'three-quarter')
            const otherImages = allImages.filter(img => 
              img.metadata?.angle && 
              img.metadata.angle !== 'front' && 
              img.metadata.angle !== 'side' && 
              img.metadata.angle !== 'three-quarter'
            )
            
            return (
              <div className="space-y-4">
                {/* Multiple Headshot Upload Buttons with Angle Labels */}
                <div className="space-y-2">
                  {headshotAngles.map((angle) => {
                    const existingCount = allImages.filter(img => img.metadata?.angle === angle.value).length
                    const isMaxReached = existingCount >= 1 // Allow 1 per angle for now, can be increased
                    
                    return (
                      <div key={angle.value} className="flex items-center gap-2">
                        <label className="text-xs font-medium w-24 shrink-0" style={{ color: '#9CA3AF' }}>
                          {angle.label}:
                        </label>
                        <button
                          onClick={() => {
                            if (isMaxReached) {
                              toast.info(`You already have a ${angle.label} headshot. Remove it first to upload a new one.`)
                              return
                            }
                            // Create a temporary input for this angle
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              const target = e.target as HTMLInputElement
                              if (target.files?.[0]) {
                                handleDirectFileUpload({ target } as any, angle.value)
                              }
                            }
                            input.click()
                          }}
                          disabled={uploading || isMaxReached}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: isMaxReached ? '#2C2C2E' : '#DC143C',
                            color: 'white',
                            border: `1px solid ${isMaxReached ? '#3F3F46' : '#DC143C'}`
                          }}
                        >
                          {uploading ? 'Uploading...' : isMaxReached ? `✓ ${angle.label}` : `Upload ${angle.label}`}
                        </button>
                      </div>
                    )
                  })}
                  
                  {/* Generic Upload (no angle specified) */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium w-24 shrink-0" style={{ color: '#9CA3AF' }}>
                      Other:
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
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    {/* Hidden file input for generic upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDirectFileUpload(e)}
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
                
                {/* Image Gallery - Show if images exist */}
                {allImages.length > 0 && (
                  <div className="space-y-3">
                    {frontImages.length > 0 && (
                      <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: '#9CA3AF' }}>
                          Front View
                        </label>
                        <ImageGallery
                          images={frontImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          onDeleteImage={async (index: number) => {
                            if (character) {
                              // Find the actual image in allImages array by matching imageUrl
                              const imageToDelete = frontImages[index]
                              const actualIndex = allImages.findIndex(img => img.imageUrl === imageToDelete.imageUrl)
                              if (actualIndex >= 0) {
                                // 🔥 FIX: ImageGallery already shows confirm dialog, so we don't need another one
                                try {
                                  // 🔥 FIX: Use updateCharacter directly (like assets) instead of removeImageFromEntity
                                  // Get current character from context to ensure we have latest images
                                  const currentCharacter = characters.find(c => c.id === character.id) || character;
                                  const updatedImages = (currentCharacter.images || []).filter((_, i) => i !== actualIndex);
                                  
                                  // 🔥 FIX: Optimistic UI update - remove image immediately
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
                              }
                            } else {
                              // Remove from pending images by finding the matching image
                              const imageToDelete = frontImages[index]
                              setPendingImages(prev => prev.filter((img) => {
                                return !(img.imageUrl === imageToDelete.imageUrl && 
                                        (img.angle === 'front' || !img.angle))
                              }))
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {sideImages.length > 0 && (
                      <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: '#9CA3AF' }}>
                          Side Profile
                        </label>
                        <ImageGallery
                          images={sideImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          onDeleteImage={async (index: number) => {
                            if (character) {
                              const imageToDelete = sideImages[index]
                              const actualIndex = allImages.findIndex(img => img.imageUrl === imageToDelete.imageUrl)
                              if (actualIndex >= 0) {
                                // 🔥 FIX: ImageGallery already shows confirm dialog, so we don't need another one
                                try {
                                  // 🔥 FIX: Use updateCharacter directly (like assets) instead of removeImageFromEntity
                                  const currentCharacter = characters.find(c => c.id === character.id) || character;
                                  const updatedImages = (currentCharacter.images || []).filter((_, i) => i !== actualIndex);
                                  await updateCharacter(character.id, { images: updatedImages });
                                  
                                  // Sync from context after update
                                  await new Promise(resolve => setTimeout(resolve, 500));
                                  const updatedCharacterFromContext = characters.find(c => c.id === character.id);
                                  if (updatedCharacterFromContext) {
                                    setFormData({ ...updatedCharacterFromContext });
                                  }
                                  
                                  toast.success('Image removed');
                                } catch (error: any) {
                                  toast.error(`Failed to remove image: ${error.message}`);
                                }
                              }
                            } else {
                              const imageToDelete = sideImages[index]
                              setPendingImages(prev => prev.filter((img) => {
                                return !(img.imageUrl === imageToDelete.imageUrl && img.angle === 'side')
                              }))
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {threeQuarterImages.length > 0 && (
                      <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: '#9CA3AF' }}>
                          3/4 Angle
                        </label>
                        <ImageGallery
                          images={threeQuarterImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          onDeleteImage={async (index: number) => {
                            if (character) {
                              const imageToDelete = threeQuarterImages[index]
                              const actualIndex = allImages.findIndex(img => img.imageUrl === imageToDelete.imageUrl)
                              if (actualIndex >= 0) {
                                // 🔥 FIX: ImageGallery already shows confirm dialog, so we don't need another one
                                try {
                                  // 🔥 FIX: Use updateCharacter directly (like assets) instead of removeImageFromEntity
                                  const currentCharacter = characters.find(c => c.id === character.id) || character;
                                  const updatedImages = (currentCharacter.images || []).filter((_, i) => i !== actualIndex);
                                  await updateCharacter(character.id, { images: updatedImages });
                                  
                                  // Sync from context after update
                                  await new Promise(resolve => setTimeout(resolve, 500));
                                  const updatedCharacterFromContext = characters.find(c => c.id === character.id);
                                  if (updatedCharacterFromContext) {
                                    setFormData({ ...updatedCharacterFromContext });
                                  }
                                  
                                  toast.success('Image removed');
                                } catch (error: any) {
                                  toast.error(`Failed to remove image: ${error.message}`);
                                }
                              }
                            } else {
                              const imageToDelete = threeQuarterImages[index]
                              setPendingImages(prev => prev.filter((img) => {
                                return !(img.imageUrl === imageToDelete.imageUrl && img.angle === 'three-quarter')
                              }))
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    {otherImages.length > 0 && (
                      <div>
                        <label className="text-xs font-medium mb-2 block" style={{ color: '#9CA3AF' }}>
                          Other Images
                        </label>
                        <ImageGallery
                          images={otherImages}
                          entityType="character"
                          entityId={character?.id || 'new'}
                          entityName={formData.name || 'New Character'}
                          onDeleteImage={async (index: number) => {
                            if (character) {
                              const imageToDelete = otherImages[index]
                              const actualIndex = allImages.findIndex(img => img.imageUrl === imageToDelete.imageUrl)
                              if (actualIndex >= 0) {
                                // 🔥 FIX: ImageGallery already shows confirm dialog, so we don't need another one
                                try {
                                  // 🔥 FIX: Use updateCharacter directly (like assets) instead of removeImageFromEntity
                                  const currentCharacter = characters.find(c => c.id === character.id) || character;
                                  const updatedImages = (currentCharacter.images || []).filter((_, i) => i !== actualIndex);
                                  
                                  // 🔥 FIX: Optimistic UI update - remove image immediately
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
                              }
                            } else {
                              const imageToDelete = otherImages[index]
                              setPendingImages(prev => prev.filter((img) => {
                                return !(img.imageUrl === imageToDelete.imageUrl && 
                                        img.angle && 
                                        img.angle !== 'front' && 
                                        img.angle !== 'side' && 
                                        img.angle !== 'three-quarter')
                              }))
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {allImages.length === 0 && (
                  <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                    Upload headshots for better character consistency (front, side, 3/4 angle recommended)
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

              if (character) {
                // Existing character - add image via addImageToEntity
                await addImageToEntity('character', character.id, downloadUrl, {
                  prompt,
                  modelUsed,
                  s3Key: s3Key
                });
                
                // 🔥 FIX: Sync character data from context after update (like MediaLibrary refetches)
                // Get updated character from context to ensure UI reflects the new image
                const updatedCharacterFromContext = characters.find(c => c.id === character.id);
                if (updatedCharacterFromContext) {
                  setFormData({ ...updatedCharacterFromContext });
                }
                
                toast.success('Image generated and uploaded');
                
                // Show StorageDecisionModal
                setSelectedAsset({
                  url: downloadUrl,
                  s3Key: s3Key,
                  name: 'generated-headshot.png',
                  type: 'image'
                });
                setShowStorageModal(true);
              } else if (isCreating) {
                // New character - store temporarily with s3Key
                setPendingImages(prev => [...prev, { 
                  imageUrl: downloadUrl, 
                  s3Key: s3Key,
                  prompt, 
                  modelUsed 
                }]);
                toast.success('Image generated - will be uploaded when character is created');
                
                // Show StorageDecisionModal
                setSelectedAsset({
                  url: downloadUrl,
                  s3Key: s3Key,
                  name: 'generated-headshot.png',
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
