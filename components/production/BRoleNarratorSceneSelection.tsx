'use client';

/**
 * B-Role Narrator Scene Selection Component
 * 
 * Allows users to select multiple scenes and configure them for narration video generation.
 * Part of B-Role Narrator workflow.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  Check,
  X,
  Clock,
  MapPin,
  Users,
  Package,
  GripVertical,
  Plus,
  Trash2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import type { Scene } from '@/types/screenplay';

interface BRoleNarratorSceneSelectionProps {
  characterId?: string; // Optional - can be selected in component
  screenplayId: string;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

interface SelectedSceneConfig {
  sceneId: string;
  scene: Scene;
  description: string; // User-provided prompt
  duration: number; // 1-10 seconds
  locationId?: string;
  locationName?: string;
  assetIds?: string[];
  otherCharacterIds?: string[];
}

const MAX_SCENES = 10;
const MIN_SCENES = 1;
const DEFAULT_DURATION = 5;

export function BRoleNarratorSceneSelection({
  characterId: propCharacterId,
  screenplayId,
  onComplete,
  onCancel
}: BRoleNarratorSceneSelectionProps) {
  const { getToken } = useAuth();
  const screenplay = useScreenplay();
  const scenes = screenplay.scenes || [];
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(propCharacterId || null);
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());
  const [selectedScenesConfig, setSelectedScenesConfig] = useState<Map<string, SelectedSceneConfig>>(new Map());
  const [narrationText, setNarrationText] = useState('');
  const [usePerSceneNarration, setUsePerSceneNarration] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);

  // Load locations, assets, and characters
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;

        // Load locations
        const locationsRes = await fetch(`/api/location-bank/list?screenplayId=${screenplayId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          setLocations(locationsData.data?.locations || []);
        }

        // Load assets
        const assetsRes = await fetch(`/api/asset-bank?screenplayId=${screenplayId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          setAssets(assetsData.assets || []);
        }

        // Load characters
        const charactersRes = await fetch(`/api/character-bank/list?screenplayId=${screenplayId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (charactersRes.ok) {
          const charactersData = await charactersRes.json();
          setCharacters(charactersData.data?.characters || []);
        }
      } catch (error: any) {
        console.error('Failed to load data:', error);
      }
    };

    if (screenplayId) {
      loadData();
    }
  }, [screenplayId, getToken]);

  // Handle scene selection
  const handleSceneToggle = (sceneId: string) => {
    const newSelected = new Set(selectedSceneIds);
    
    if (newSelected.has(sceneId)) {
      newSelected.delete(sceneId);
      const newConfig = new Map(selectedScenesConfig);
      newConfig.delete(sceneId);
      setSelectedScenesConfig(newConfig);
    } else {
      if (newSelected.size >= MAX_SCENES) {
        toast.error(`Maximum ${MAX_SCENES} scenes allowed`);
        return;
      }
      newSelected.add(sceneId);
      
      // Initialize config for new scene
      const scene = scenes.find(s => s.id === sceneId);
      if (scene) {
        const newConfig = new Map(selectedScenesConfig);
        newConfig.set(sceneId, {
          sceneId,
          scene,
          description: scene.synopsis || scene.heading || '',
          duration: DEFAULT_DURATION,
          otherCharacterIds: [],
          assetIds: []
        });
        setSelectedScenesConfig(newConfig);
      }
    }
    
    setSelectedSceneIds(newSelected);
  };

  // Update scene config
  const updateSceneConfig = (sceneId: string, updates: Partial<SelectedSceneConfig>) => {
    const newConfig = new Map(selectedScenesConfig);
    const current = newConfig.get(sceneId);
    if (current) {
      newConfig.set(sceneId, { ...current, ...updates });
      setSelectedScenesConfig(newConfig);
    }
  };

  // Reorder scenes
  const moveScene = (sceneId: string, direction: 'up' | 'down') => {
    const orderedIds = Array.from(selectedSceneIds);
    const index = orderedIds.indexOf(sceneId);
    
    if (direction === 'up' && index > 0) {
      [orderedIds[index], orderedIds[index - 1]] = [orderedIds[index - 1], orderedIds[index]];
    } else if (direction === 'down' && index < orderedIds.length - 1) {
      [orderedIds[index], orderedIds[index + 1]] = [orderedIds[index + 1], orderedIds[index]];
    }
    
    setSelectedSceneIds(new Set(orderedIds));
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!selectedCharacterId) {
      toast.error('Please select a narrator character');
      return;
    }

    if (selectedSceneIds.size < MIN_SCENES) {
      toast.error(`Please select at least ${MIN_SCENES} scene`);
      return;
    }

    if (!narrationText.trim() && !usePerSceneNarration) {
      toast.error('Please provide narration text');
      return;
    }

    // Validate all selected scenes have descriptions
    const orderedIds = Array.from(selectedSceneIds);
    for (const sceneId of orderedIds) {
      const config = selectedScenesConfig.get(sceneId);
      if (!config || !config.description.trim()) {
        toast.error(`Please provide a description for all selected scenes`);
        return;
      }
    }

    setIsGenerating(true);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication failed');
        return;
      }

      // Build scene cuts
      const sceneCuts = orderedIds.map(sceneId => {
        const config = selectedScenesConfig.get(sceneId);
        if (!config) throw new Error(`Missing config for scene ${sceneId}`);
        
        return {
          description: config.description,
          duration: config.duration,
          otherCharacters: config.otherCharacterIds || [],
          location: config.locationName,
          locationId: config.locationId,
          assetIds: config.assetIds || []
        };
      });

      // Build request
      const request = {
        characterId: selectedCharacterId,
        screenplayId,
        narration: usePerSceneNarration 
          ? orderedIds.map(() => narrationText) // For now, use same text for all (can be enhanced)
          : narrationText,
        scenes: sceneCuts,
        generateSeparateAudioTrack: true,
        aspectRatio: '16:9' as const,
        autoMatchVoice: true
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai'}/api/dialogue/b-role-narrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Narration video generation started!');
        if (onComplete) {
          onComplete(data);
        }
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('B-Role Narrator generation error:', error);
      toast.error(error.message || 'Failed to generate narration video');
    } finally {
      setIsGenerating(false);
    }
  };

  const orderedSelectedIds = Array.from(selectedSceneIds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Film className="w-5 h-5" />
            B-Role Narrator Scene Selection
          </h2>
          <p className="text-sm text-[#808080] mt-1">
            Select scenes to include in your narration video ({selectedSceneIds.size}/{MAX_SCENES} selected)
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Character Selection */}
      {!propCharacterId && (
        <Card className="bg-[#141414] border-[#3F3F46]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white">Narrator Character</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-xs text-[#808080] mb-2 block">Select the character who will narrate</Label>
            <select
              value={selectedCharacterId || ''}
              onChange={(e) => setSelectedCharacterId(e.target.value || null)}
              className="w-full bg-[#1A1A1A] border border-[#3F3F46] rounded-md px-3 py-2 text-sm text-white"
            >
              <option value="">Select a character...</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {!selectedCharacterId && (
        <Card className="bg-[#141414] border-[#3F3F46]">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-[#808080] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[#808080]">Please select a narrator character to continue</p>
          </CardContent>
        </Card>
      )}

      {/* Scene List - Only show if character selected */}
      {selectedCharacterId && (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-white">Available Scenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {scenes.length === 0 ? (
            <div className="text-center py-8 text-[#808080]">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No scenes available</p>
              <p className="text-xs mt-1">Create scenes in the Editor first</p>
            </div>
          ) : (
            scenes.map((scene) => {
              const isSelected = selectedSceneIds.has(scene.id);
              const config = selectedScenesConfig.get(scene.id);
              
              return (
                <div key={scene.id} className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#3F3F46] hover:border-[#808080] transition-colors">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSceneToggle(scene.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          Scene {scene.number}: {scene.heading}
                        </span>
                        {scene.fountain?.tags?.location && (
                          <Badge variant="outline" className="text-[10px]">
                            <MapPin className="w-3 h-3 mr-1" />
                            Location
                          </Badge>
                        )}
                        {scene.fountain?.tags?.characters && scene.fountain.tags.characters.length > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            <Users className="w-3 h-3 mr-1" />
                            {scene.fountain.tags.characters.length}
                          </Badge>
                        )}
                      </div>
                      {scene.synopsis && (
                        <p className="text-xs text-[#808080] line-clamp-2">{scene.synopsis}</p>
                      )}
                    </div>
                  </div>

                  {/* Scene Configuration (when selected) */}
                  <AnimatePresence>
                    {isSelected && config && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 pl-4 border-l-2 border-[#DC143C] space-y-3 p-3 bg-[#0F0F0F] rounded-lg"
                      >
                        {/* Reorder buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveScene(scene.id, 'up')}
                            disabled={orderedSelectedIds.indexOf(scene.id) === 0}
                            className="h-6 w-6 p-0"
                          >
                            <GripVertical className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-[#808080]">
                            Order: {orderedSelectedIds.indexOf(scene.id) + 1} of {orderedSelectedIds.length}
                          </span>
                        </div>

                        {/* Description/Prompt */}
                        <div>
                          <Label className="text-xs text-[#808080] mb-1 block">
                            Scene Description/Prompt
                          </Label>
                          <Textarea
                            value={config.description}
                            onChange={(e) => updateSceneConfig(scene.id, { description: e.target.value })}
                            placeholder="Describe the scene, camera angles, mood, atmosphere..."
                            className="bg-[#1A1A1A] border-[#3F3F46] text-white text-sm min-h-[80px]"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <Label className="text-xs text-[#808080] mb-1 block">
                            Duration (seconds)
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={config.duration}
                            onChange={(e) => updateSceneConfig(scene.id, { duration: parseInt(e.target.value) || 5 })}
                            className="bg-[#1A1A1A] border-[#3F3F46] text-white w-24"
                          />
                        </div>

                        {/* Location Selection */}
                        {locations.length > 0 && (
                          <div>
                            <Label className="text-xs text-[#808080] mb-1 block">
                              Location (optional)
                            </Label>
                            <select
                              value={config.locationId || ''}
                              onChange={(e) => {
                                const location = locations.find(l => l.locationId === e.target.value);
                                updateSceneConfig(scene.id, {
                                  locationId: e.target.value || undefined,
                                  locationName: location?.name
                                });
                              }}
                              className="w-full bg-[#1A1A1A] border border-[#3F3F46] rounded-md px-3 py-2 text-sm text-white"
                            >
                              <option value="">None</option>
                              {locations.map((loc) => (
                                <option key={loc.locationId} value={loc.locationId}>
                                  {loc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Other Characters */}
                        {characters.length > 0 && (
                          <div>
                            <Label className="text-xs text-[#808080] mb-1 block">
                              Other Characters in Scene (optional)
                            </Label>
                            <div className="space-y-2">
                              {characters
                                .filter(c => c.id !== selectedCharacterId)
                                .map((char) => (
                                  <div key={char.id} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={config.otherCharacterIds?.includes(char.id) || false}
                                      onCheckedChange={(checked) => {
                                        const current = config.otherCharacterIds || [];
                                        const updated = checked
                                          ? [...current, char.id]
                                          : current.filter(id => id !== char.id);
                                        updateSceneConfig(scene.id, { otherCharacterIds: updated });
                                      }}
                                    />
                                    <span className="text-sm text-white">{char.name}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Assets */}
                        {assets.length > 0 && (
                          <div>
                            <Label className="text-xs text-[#808080] mb-1 block">
                              Props/Assets (optional)
                            </Label>
                            <div className="space-y-2 max-h-[120px] overflow-y-auto">
                              {assets.map((asset) => (
                                <div key={asset.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={config.assetIds?.includes(asset.id) || false}
                                    onCheckedChange={(checked) => {
                                      const current = config.assetIds || [];
                                      const updated = checked
                                        ? [...current, asset.id]
                                        : current.filter(id => id !== asset.id);
                                      updateSceneConfig(scene.id, { assetIds: updated });
                                    }}
                                  />
                                  <span className="text-sm text-white">{asset.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      )}

      {/* Narration Text */}
      {selectedCharacterId && selectedSceneIds.size > 0 && (
        <Card className="bg-[#141414] border-[#3F3F46]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white">Narration Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={usePerSceneNarration}
                onCheckedChange={setUsePerSceneNarration}
              />
              <Label className="text-xs text-[#808080]">
                Use per-scene narration (advanced)
              </Label>
            </div>
            <Textarea
              value={narrationText}
              onChange={(e) => setNarrationText(e.target.value)}
              placeholder="Enter narration text that will span all selected scenes..."
              className="bg-[#1A1A1A] border-[#3F3F46] text-white min-h-[120px]"
            />
            <p className="text-xs text-[#808080]">
              {usePerSceneNarration
                ? 'Narration will be applied to each scene individually'
                : 'Single narration will be overlaid on the combined video'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {selectedCharacterId && selectedSceneIds.size > 0 && (
        <div className="flex items-center justify-end gap-3">
          <div className="text-xs text-[#808080]">
            Estimated: ~{(70 + 145) / 2 * selectedSceneIds.size} credits
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedCharacterId || selectedSceneIds.size < MIN_SCENES || !narrationText.trim()}
            className="bg-[#DC143C] hover:bg-[#B91C1C] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Narration Video
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

