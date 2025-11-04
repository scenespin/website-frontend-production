'use client';

/**
 * Character Bank Manager
 * 
 * The control center for managing character profiles and reference libraries.
 * Users can:
 * - Create characters (upload photo OR generate from text)
 * - View reference libraries
 * - Generate reference sheets (6-8 angles)
 * - Edit character metadata
 * - Delete characters
 * 
 * This is the FOUNDATION of character consistency!
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Plus, 
  Upload, 
  Sparkles, 
  Image as ImageIcon,
  Camera,
  Trash2,
  Edit,
  ChevronRight,
  Loader2,
  Check,
  X,
  FileImage,
  Wand2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface CharacterProfile {
  id: string;
  name: string;
  description?: string;
  baseReferenceUrl: string;
  baseReferenceMethod: 'upload' | 'generate';
  baseReferencePrompt?: string;
  referenceLibrary: CharacterReference[];
  hasReferenceSheet: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CharacterReference {
  id: string;
  imageUrl: string;
  label: string;
  view: string;
  cameraAngle: string;
  emotion?: string;
  isBaseReference: boolean;
  creditsUsed: number;
}

interface Props {
  projectId: string;
  onCharacterSelect?: (characterId: string) => void;
}

export default function CharacterBankManager({ projectId, onCharacterSelect }: Props) {
  // State
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createMethod, setCreateMethod] = useState<'upload' | 'generate'>('upload');
  
  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, [projectId]);
  
  async function loadCharacters() {
    setIsLoading(true);
    try {
      // Call real backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/character-bank/list?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
      } else {
        console.error('Failed to load characters:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  function handleCharacterClick(character: CharacterProfile) {
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character.id);
    }
  }
  
  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#DC143C]/10 rounded-lg">
            <User className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Character Bank</h2>
            <p className="text-sm text-slate-500">Manage character references for consistency</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Character
        </Button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Character List (Left Sidebar) */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Characters ({characters.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : characters.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No characters yet</p>
                  <p className="text-xs mt-1">Create your first character to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {characters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      isSelected={selectedCharacter?.id === character.id}
                      onClick={() => handleCharacterClick(character)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Character Detail View (Right Panel) */}
        <Card className="col-span-8 flex flex-col">
          {selectedCharacter ? (
            <CharacterDetailView 
              character={selectedCharacter} 
              onUpdate={loadCharacters}
              onClose={() => setSelectedCharacter(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Select a character to view details</p>
                <p className="text-sm mt-2">or create a new character to get started</p>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Create Character Dialog */}
      <CreateCharacterDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          loadCharacters();
        }}
        projectId={projectId}
      />
    </div>
  );
}

/**
 * Character Card - List item
 */
function CharacterCard({ 
  character, 
  isSelected, 
  onClick 
}: { 
  character: CharacterProfile; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all
        ${isSelected 
          ? 'bg-[#DC143C]/10 border-2 border-[#DC143C]' 
          : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Character Avatar */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
          <img 
            src={character.baseReferenceUrl} 
            alt={character.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Character Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{character.name}</h3>
            {character.hasReferenceSheet && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Camera className="w-3 h-3" />
              </Badge>
            )}
          </div>
          
          {character.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
              {character.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {character.referenceLibrary.length} refs
            </Badge>
            {character.baseReferenceMethod === 'generate' && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </Badge>
            )}
          </div>
        </div>
        
        <ChevronRight className={`w-4 h-4 text-slate-400 ${isSelected ? 'text-purple-500' : ''}`} />
      </div>
    </motion.div>
  );
}

/**
 * Character Detail View
 */
function CharacterDetailView({ 
  character, 
  onUpdate,
  onClose 
}: { 
  character: CharacterProfile;
  onUpdate: () => void;
  onClose: () => void;
}) {
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  async function handleGenerateReferenceSheet() {
    setIsGeneratingSheet(true);
    setGenerationProgress(0);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/character-bank/generate-sheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterId: character.id
        })
      });
      
      if (response.ok) {
        // Simulate progress (in reality, you'd use a websocket)
        for (let i = 0; i <= 100; i += 10) {
          setGenerationProgress(i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        onUpdate();
      } else {
        throw new Error('Failed to generate reference sheet');
      }
    } catch (error) {
      console.error('Failed to generate sheet:', error);
      alert('Failed to generate reference sheet. Please try again.');
    } finally {
      setIsGeneratingSheet(false);
      setGenerationProgress(0);
    }
  }
  
  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Large Avatar */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
              <img 
                src={character.baseReferenceUrl} 
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Info */}
            <div>
              <CardTitle className="text-2xl">{character.name}</CardTitle>
              {character.description && (
                <CardDescription className="mt-2">{character.description}</CardDescription>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <Badge variant={character.baseReferenceMethod === 'generate' ? 'default' : 'secondary'}>
                  {character.baseReferenceMethod === 'generate' ? (
                    <><Sparkles className="w-3 h-3 mr-1" /> AI Generated</>
                  ) : (
                    <><Upload className="w-3 h-3 mr-1" /> Uploaded</>
                  )}
                </Badge>
                
                {character.hasReferenceSheet && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <Check className="w-3 h-3 mr-1" /> Reference Sheet
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="references" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="references">
              <ImageIcon className="w-4 h-4 mr-2" />
              Reference Library ({character.referenceLibrary.length})
            </TabsTrigger>
            <TabsTrigger value="details">
              <User className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>
          
          {/* References Tab */}
          <TabsContent value="references" className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Generate Sheet Button */}
              {!character.hasReferenceSheet && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Generate Reference Sheet</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Create 6-8 reference angles (front, profile, 3/4, etc.) for consistent video generation
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold">Cost:</span> ~24-32 credits
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleGenerateReferenceSheet}
                      disabled={isGeneratingSheet}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isGeneratingSheet ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {generationProgress}%
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Reference Grid */}
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-3 gap-4 pr-4">
                  {character.referenceLibrary.map((ref) => (
                    <ReferenceCard key={ref.id} reference={ref} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4">
                <div>
                  <Label className="text-sm font-medium">Character ID</Label>
                  <Input value={character.id} readOnly className="mt-1 font-mono text-xs" />
                </div>
                
                {character.baseReferencePrompt && (
                  <div>
                    <Label className="text-sm font-medium">Original Prompt</Label>
                    <Textarea 
                      value={character.baseReferencePrompt} 
                      readOnly 
                      className="mt-1 text-sm"
                      rows={3}
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <Input 
                    value={new Date(character.createdAt).toLocaleString()} 
                    readOnly 
                    className="mt-1 text-sm" 
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <Input 
                    value={new Date(character.updatedAt).toLocaleString()} 
                    readOnly 
                    className="mt-1 text-sm" 
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
}

/**
 * Reference Card - Individual reference image
 */
function ReferenceCard({ reference }: { reference: CharacterReference }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img 
          src={reference.imageUrl} 
          alt={reference.label}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="font-semibold text-base-content text-sm">{reference.label}</h4>
            <p className="text-xs text-base-content/80">{reference.view} • {reference.cameraAngle}</p>
            {reference.emotion && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {reference.emotion}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Base Reference Badge */}
        {reference.isBaseReference && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-[#DC143C] text-base-content text-xs">
              Base
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Create Character Dialog
 */
function CreateCharacterDialog({ 
  open, 
  onClose, 
  onSuccess,
  projectId 
}: { 
  open: boolean; 
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}) {
  const [method, setMethod] = useState<'upload' | 'generate'>('upload');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('nano-banana');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }
  
  async function handleCreate() {
    if (!name) {
      alert('Please enter a character name');
      return;
    }
    
    if (method === 'upload' && !imageFile) {
      alert('Please select an image file');
      return;
    }
    
    if (method === 'generate' && !prompt) {
      alert('Please enter a generation prompt');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      
      // Prepare request body
      const requestBody: any = {
        projectId,
        name,
        description,
        baseReference: {
          method
        }
      };
      
      if (method === 'upload' && imageFile) {
        // Convert image to base64
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
        requestBody.baseReference.imageData = imageData;
      } else if (method === 'generate') {
        requestBody.baseReference.prompt = prompt;
        requestBody.baseReference.model = model;
      }
      
      const response = await fetch(`${backendUrl}/api/character-bank/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        onSuccess();
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create character');
      }
    } catch (error: any) {
      console.error('Failed to create character:', error);
      alert(`Failed to create character: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  }
  
  function resetForm() {
    setName('');
    setDescription('');
    setPrompt('');
    setImageFile(null);
    setImagePreview('');
    setMethod('upload');
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Character</DialogTitle>
          <DialogDescription>
            Add a new character to your bank for consistent video generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={method === 'upload' ? 'default' : 'outline'}
              onClick={() => setMethod('upload')}
              className="h-auto py-4"
            >
              <div className="text-center">
                <Upload className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Upload Photo</div>
                <div className="text-xs mt-1 opacity-70">Use existing image</div>
              </div>
            </Button>
            
            <Button
              variant={method === 'generate' ? 'default' : 'outline'}
              onClick={() => setMethod('generate')}
              className="h-auto py-4"
            >
              <div className="text-center">
                <Sparkles className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">Generate with AI</div>
                <div className="text-xs mt-1 opacity-70">Create from text</div>
              </div>
            </Button>
          </div>
          
          {/* Common Fields */}
          <div>
            <Label>Character Name</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith, Detective Sarah"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Description (Optional)</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the character..."
              className="mt-1"
              rows={2}
            />
          </div>
          
          {/* Upload Method */}
          {method === 'upload' && (
            <div>
              <Label>Upload Image</Label>
              <div className="mt-1 border-2 border-dashed rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <FileImage className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}
          
          {/* Generate Method */}
          {method === 'generate' && (
            <>
              <div>
                <Label>Generation Prompt</Label>
                <Textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="professional woman, 28 years old, confident expression, business attire..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nano-banana">Nano Banana (Fast, 5 credits)</SelectItem>
                    <SelectItem value="photon-1">Photon 1 (Quality, 10 credits)</SelectItem>
                    <SelectItem value="photon-flash">Photon Flash (Fast, 5 credits)</SelectItem>
                    <SelectItem value="dall-e-3">DALL-E 3 (High quality, 15 credits)</SelectItem>
                    <SelectItem value="imagen-3">Imagen 3 (Premium, 20 credits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Character
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

