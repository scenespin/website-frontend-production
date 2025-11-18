'use client';

/**
 * SceneSelector Component
 * 
 * Allows users to select a scene from the database.
 * Part of Production Hub Phase 2 redesign.
 */

import React, { useState, useEffect } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useContextStore } from '@/lib/contextStore';
import { Film, ChevronDown, Edit, CheckCircle, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Scene } from '@/types/screenplay';

interface SceneSelectorProps {
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onUseScene: (scene: Scene) => void;
  onEditScene?: (sceneId: string) => void;
  className?: string;
  isMobile?: boolean;
}

export function SceneSelector({
  selectedSceneId,
  onSceneSelect,
  onUseScene,
  onEditScene,
  className = '',
  isMobile = false
}: SceneSelectorProps) {
  const screenplay = useScreenplay();
  const contextStore = useContextStore();
  const scenes = screenplay.scenes || [];
  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  // Auto-select first scene if none selected and scenes available
  useEffect(() => {
    if (!selectedSceneId && scenes.length > 0) {
      onSceneSelect(scenes[0].id);
    }
  }, [scenes.length, selectedSceneId, onSceneSelect]);

  const handleEditScene = () => {
    if (selectedSceneId && onEditScene) {
      onEditScene(selectedSceneId);
    } else if (selectedSceneId) {
      // Use context store to set scene, then navigate to editor
      // The editor will read the context and jump to the scene's startLine
      const scene = screenplay.scenes?.find(s => s.id === selectedSceneId);
      
      if (scene) {
        // Set scene in context store so editor can jump to it
        contextStore.setCurrentScene(scene.id, scene.heading || scene.synopsis || 'Scene');
        
        // Navigate to editor - it will read context and jump to scene.startLine
        window.location.href = `/write?sceneId=${scene.id}`;
      } else {
        window.location.href = '/write';
      }
    } else {
      window.location.href = '/write';
    }
  };

  if (scenes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-2">
            No scenes available
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Create scenes in the Editor to use them here
          </p>
          <Button
            onClick={() => window.location.href = '/write'}
            variant="outline"
            size="sm"
          >
            Go to Editor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Scene Dropdown */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Select Scene
        </label>
        {isMobile ? (
          // Native select on mobile for better UX
          <select
            value={selectedSceneId || ''}
            onChange={(e) => onSceneSelect(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.heading || `Scene ${scene.order || scenes.indexOf(scene) + 1}`}
              </option>
            ))}
          </select>
        ) : (
          // Custom dropdown on desktop
          <div className="relative">
            <select
              value={selectedSceneId || ''}
              onChange={(e) => onSceneSelect(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-10"
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.heading || `Scene ${scene.order || scenes.indexOf(scene) + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Selected Scene Display */}
      {selectedScene && (
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            {/* Scene Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {selectedScene.heading || 'Untitled Scene'}
                </h3>
                {selectedScene.fountain?.tags?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {(() => {
                        const location = screenplay.locations?.find(l => l.id === selectedScene.fountain?.tags?.location);
                        return location ? location.name : selectedScene.heading?.split(' - ')[0] || 'Unknown';
                      })()}
                    </span>
                  </div>
                )}
              </div>
              {selectedScene.order && (
                <Badge variant="secondary" className="flex-shrink-0">
                  Scene {selectedScene.order}
                </Badge>
              )}
            </div>

            {/* Scene Synopsis Preview */}
            {selectedScene.synopsis && (
              <div className="mb-3">
                <p className="text-sm text-muted-foreground mb-1">Scene Synopsis:</p>
                <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-32 overflow-y-auto">
                  {selectedScene.synopsis.substring(0, 300)}
                  {selectedScene.synopsis.length > 300 && '...'}
                </div>
              </div>
            )}

            {/* Characters in Scene */}
            {selectedScene.fountain?.tags?.characters && selectedScene.fountain.tags.characters.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Characters:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedScene.fountain.tags.characters.map((charId) => {
                    const character = screenplay.characters?.find(c => c.id === charId);
                    return character ? (
                      <Badge key={charId} variant="outline" className="text-xs">
                        {character.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                onClick={() => onUseScene(selectedScene)}
                className="flex-1"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Use This Scene
              </Button>
              <Button
                onClick={handleEditScene}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Scene
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

