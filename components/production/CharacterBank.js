/**
 * CharacterBank.js
 * 
 * Complete Character Bank with:
 * - Image upload with Visual Captioning (auto-describe)
 * - Character variations generation
 * - Voice Profile integration
 * - 3D Export with Visual Q&A analysis
 * - Cloud storage integration
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Sparkles, 
  Box, 
  Mic, 
  Eye,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Download,
  Cloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import VoiceProfileModal from './VoiceProfileModal';
import Export3DModal from './Export3DModal';

export default function CharacterBank() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [export3DModalOpen, setExport3DModalOpen] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  
  const fileInputRef = useRef(null);

  const loadCharacters = async () => {
    try {
      const response = await api.characters.list();
      setCharacters(response.characters || []);
    } catch (error) {
      console.error('Failed to load characters:', error);
      // Start with empty array if API fails
      setCharacters([]);
    }
  };

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, []);

  const handleImageUpload = async (characterId, file) => {
    if (!file) return;

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      // 1. Upload image to S3
      const formData = new FormData();
      formData.append('image', file);
      formData.append('characterId', characterId);

      const uploadResponse = await api.characters.uploadImage(formData);
      const imageUrl = uploadResponse.imageUrl;

      toast.success('Image uploaded! Analyzing...');

      // 2. Auto-generate description using Visual Captioning
      try {
        const captionResponse = await api.imagen.visualCaption({
          imageUrl,
          characterId,
        });

        // Check if safety rejected
        if (captionResponse.safetyRejected || !captionResponse.caption) {
          // Still add image but no description
          const character = characters.find(c => c.id === characterId);
          const existingImages = character?.images || [];
          
          await api.characters.update(characterId, {
            images: [...existingImages, imageUrl]
          });
          
          toast.error(
            '⚠️ AI couldn\'t analyze this image (safety filters). Please write your own description.',
            { duration: 5000 }
          );
          
          await loadCharacters();
          return;
        }

        const description = captionResponse.caption;
        
        const character = characters.find(c => c.id === characterId);
        const existingImages = character?.images || [];

        // 3. Update character with auto-generated description and new image
        await api.characters.update(characterId, {
          description,
          images: [...existingImages, imageUrl]
        });

        toast.success(`✨ AI Description: "${description}"`);
        
        // Reload characters
        await loadCharacters();
      } catch (captionError) {
        console.error('Visual captioning failed:', captionError);
        
        // Still add image even if captioning fails
        const character = characters.find(c => c.id === characterId);
        const existingImages = character?.images || [];
        
        await api.characters.update(characterId, {
          images: [...existingImages, imageUrl]
        });
        
        // Check if it's a safety rejection
        const isSafetyRejection = captionError.response?.data?.safetyRejected || 
                                   captionError.response?.data?.error?.includes('safety');
        
        if (isSafetyRejection) {
          toast.error(
            '⚠️ AI couldn\'t analyze this image (safety filters). Please write your own description.',
            { duration: 5000 }
          );
        } else {
          toast.error(
            '⚠️ AI analysis failed. Please write your own description.',
            { duration: 4000 }
          );
        }
        
        await loadCharacters();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim()) {
      toast.error('Please enter a character name');
      return;
    }

    try {
      const response = await api.characters.create({
        name: newCharacterName,
        description: '',
        images: []
      });

      setCharacters([...characters, response.character]);
      setNewCharacterName('');
      setShowAddCharacter(false);
      toast.success(`Character "${newCharacterName}" created!`);
    } catch (error) {
      console.error('Failed to create character:', error);
      toast.error('Failed to create character');
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
      await api.characters.delete(characterId);
      setCharacters(characters.filter(c => c.id !== characterId));
      toast.success('Character deleted');
    } catch (error) {
      console.error('Failed to delete character:', error);
      toast.error('Failed to delete character');
    }
  };

  const handleExport3D = async (character) => {
    // Check if character has enough images
    if (!character.images || character.images.length < 2) {
      toast.error('Need at least 2 images for 3D export. Add more images first!');
      return;
    }

    setSelectedCharacter(character);
    setExport3DModalOpen(true);
  };

  const handleVoiceProfile = (character) => {
    setSelectedCharacter(character);
    setVoiceModalOpen(true);
  };

  const handleGenerateVariation = async (character) => {
    if (!character.description) {
      toast.error('No description available. Upload an image first for auto-description!');
      return;
    }

    try {
      toast.loading('Generating variation...', { id: 'gen-variation' });
      
      const response = await api.characters.generateVariation({
        characterId: character.id,
        prompt: character.description,
        baseImage: character.images[0]
      });

      toast.success('Variation generated!', { id: 'gen-variation' });
      await loadCharacters();
    } catch (error) {
      console.error('Failed to generate variation:', error);
      toast.error('Failed to generate variation', { id: 'gen-variation' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cinema-red to-cinema-blue text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="font-bold text-lg">Character Bank</h2>
          </div>
          <button
            onClick={() => setShowAddCharacter(true)}
            className="btn btn-sm bg-white text-cinema-red hover:bg-white/90"
          >
            <Plus className="w-4 h-4" />
            Add Character
          </button>
        </div>
        <p className="text-xs text-white/80 mt-1">
          Upload images for AI descriptions, voice profiles, and 3D exports
        </p>
      </div>

      {/* Add Character Form */}
      {showAddCharacter && (
        <div className="p-4 bg-base-200 border-b border-base-300">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              placeholder="Character name (e.g., 'Detective Miller')"
              className="input input-bordered flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCharacter()}
            />
            <button
              onClick={handleCreateCharacter}
              className="btn btn-primary"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowAddCharacter(false);
                setNewCharacterName('');
              }}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Characters List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {characters.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <p className="text-base-content/60 mb-2">No characters yet</p>
            <p className="text-sm text-base-content/40 mb-4">
              Create your first character to get started
            </p>
            <button
              onClick={() => setShowAddCharacter(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Character
            </button>
          </div>
        ) : (
          characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onUploadImage={(file) => handleImageUpload(character.id, file)}
              onExport3D={() => handleExport3D(character)}
              onVoiceProfile={() => handleVoiceProfile(character)}
              onGenerateVariation={() => handleGenerateVariation(character)}
              onDelete={() => handleDeleteCharacter(character.id)}
              isUploading={isUploading}
              isAnalyzing={isAnalyzing}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {selectedCharacter && (
        <>
          <VoiceProfileModal
            character={selectedCharacter}
            isOpen={voiceModalOpen}
            onClose={() => {
              setVoiceModalOpen(false);
              setSelectedCharacter(null);
            }}
            onSave={async (voiceData) => {
              await loadCharacters();
              setVoiceModalOpen(false);
              setSelectedCharacter(null);
            }}
          />
          
          <Export3DModal
            isOpen={export3DModalOpen}
            onClose={() => {
              setExport3DModalOpen(false);
              setSelectedCharacter(null);
            }}
            characterId={selectedCharacter.id}
            type="character"
            entityName={selectedCharacter.name}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// CHARACTER CARD COMPONENT
// ============================================================================

function CharacterCard({
  character,
  onUploadImage,
  onExport3D,
  onVoiceProfile,
  onGenerateVariation,
  onDelete,
  isUploading,
  isAnalyzing
}) {
  const fileInputRef = useRef(null);
  const imageCount = character.images?.length || 0;
  const hasVoiceProfile = !!character.voiceProfile;
  const canExport3D = imageCount >= 2;

  return (
    <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{character.name}</h3>
            {character.description && (
              <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                {character.description}
              </p>
            )}
          </div>
          <button
            onClick={onDelete}
            className="btn btn-ghost btn-sm btn-circle text-error"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Images Grid */}
        {imageCount > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {character.images.slice(0, 6).map((img, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={img}
                  alt={`${character.name} ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
            {imageCount > 6 && (
              <div className="aspect-square bg-base-300 rounded-lg flex items-center justify-center">
                <span className="text-xs font-semibold">+{imageCount - 6} more</span>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => onUploadImage(e.target.files[0])}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn btn-sm btn-outline w-full mb-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isAnalyzing ? 'Analyzing with AI...' : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Image {imageCount > 0 && `(${imageCount})`}
            </>
          )}
        </button>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Generate Variation */}
          <button
            onClick={onGenerateVariation}
            disabled={!character.description}
            className="btn btn-sm btn-primary"
            title={!character.description ? 'Upload an image first' : 'Generate variation'}
          >
            <Sparkles className="w-4 h-4" />
            Variation
          </button>

          {/* Voice Profile */}
          <button
            onClick={onVoiceProfile}
            className={`btn btn-sm ${hasVoiceProfile ? 'btn-success' : 'btn-outline'}`}
          >
            <Mic className="w-4 h-4" />
            {hasVoiceProfile ? 'Voice ✓' : 'Voice'}
          </button>

          {/* Export to 3D */}
          <button
            onClick={onExport3D}
            disabled={!canExport3D}
            className="btn btn-sm btn-accent col-span-2"
            title={!canExport3D ? 'Need at least 2 images' : 'Export to 3D (GLB, OBJ, USDZ)'}
          >
            <Box className="w-4 h-4" />
            Export to 3D {canExport3D ? '(500 cr)' : '(Need 2+ images)'}
          </button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 mt-2">
          {imageCount > 0 && (
            <span className="badge badge-sm">
              <ImageIcon className="w-3 h-3 mr-1" />
              {imageCount} image{imageCount !== 1 ? 's' : ''}
            </span>
          )}
          {hasVoiceProfile && (
            <span className="badge badge-success badge-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              Voice Profile
            </span>
          )}
          {canExport3D && (
            <span className="badge badge-accent badge-sm">
              <Box className="w-3 h-3 mr-1" />
              3D Ready
            </span>
          )}
        </div>

        {/* Auto-Description Info */}
        {imageCount === 0 && (
          <div className="alert alert-info mt-2 py-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">
              Upload an image for AI auto-description
            </span>
          </div>
        )}
        
        {/* Manual Description Prompt (if no description after upload) */}
        {imageCount > 0 && !character.description && (
          <div className="alert alert-warning mt-2 py-2">
            <AlertCircle className="w-4 h-4" />
            <div className="flex-1">
              <span className="text-xs block font-semibold mb-1">
                Add description to generate variations
              </span>
              <button
                onClick={() => {
                  const desc = prompt('Enter character description:', '');
                  if (desc) {
                    api.characters.update(character.id, { description: desc })
                      .then(() => {
                        toast.success('Description added!');
                        loadCharacters();
                      });
                  }
                }}
                className="btn btn-xs btn-warning"
              >
                Add Description
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

