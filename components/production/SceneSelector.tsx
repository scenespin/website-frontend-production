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

  // Don't auto-select - let user choose

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
    <div className={`space-y-2 ${className}`}>
      {/* Scene Dropdown */}
      <div>
        <label className="text-xs font-medium mb-1 block text-[#808080]">
          Select Scene
        </label>
        {isMobile ? (
          // Native select on mobile for better UX
          <select
            value={selectedSceneId || ''}
            onChange={(e) => onSceneSelect(e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
            style={{ colorScheme: 'dark' }}
          >
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id} className="bg-[#141414] text-[#FFFFFF]">
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
              className="w-full px-3 py-1.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] appearance-none pr-8"
              style={{ colorScheme: 'dark' }}
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id} className="bg-[#141414] text-[#FFFFFF]">
                  {scene.heading || `Scene ${scene.order || scenes.indexOf(scene) + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#808080] pointer-events-none" />
          </div>
        )}
      </div>

      {/* Selected Scene Display */}
      {selectedScene && (
        <Card className="border border-purple-700/50 bg-[#0A0A0A]">
          <CardContent className="p-2.5">
            {/* Scene Header */}
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-xs mb-0.5 text-[#FFFFFF] truncate">
                  {selectedScene.heading || 'Untitled Scene'}
                </h3>
                {selectedScene.fountain?.tags?.location && (
                  <div className="flex items-center gap-1 text-[10px] text-[#808080]">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">
                      {(() => {
                        const location = screenplay.locations?.find(l => l.id === selectedScene.fountain?.tags?.location);
                        return location ? location.name : selectedScene.heading?.split(' - ')[0] || 'Unknown';
                      })()}
                    </span>
                  </div>
                )}
              </div>
              {selectedScene.order && (
                <Badge variant="secondary" className="flex-shrink-0 text-[9px] px-1 py-0 h-4">
                  Scene {selectedScene.order}
                </Badge>
              )}
            </div>

            {/* Scene Synopsis Preview */}
            {selectedScene.synopsis && (
              <div className="mb-1.5">
                <p className="text-[10px] text-[#808080] mb-0.5">Synopsis:</p>
                <div className="p-2 bg-[#141414] rounded text-[10px] max-h-20 overflow-y-auto text-[#808080]">
                  {selectedScene.synopsis.substring(0, 200)}
                  {selectedScene.synopsis.length > 200 && '...'}
                </div>
              </div>
            )}

            {/* Characters in Scene */}
            {selectedScene.fountain?.tags?.characters && selectedScene.fountain.tags.characters.length > 0 && (
              <div className="mb-1.5">
                <div className="flex items-center gap-1 mb-1">
                  <Users className="w-2.5 h-2.5 text-[#808080]" />
                  <span className="text-[10px] font-medium text-[#808080]">Characters:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedScene.fountain.tags.characters.map((charId) => {
                    const character = screenplay.characters?.find(c => c.id === charId);
                    return character ? (
                      <Badge key={charId} variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#3F3F46] text-[#808080]">
                        {character.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
              <Button
                onClick={() => onUseScene(selectedScene)}
                className="flex-1 h-11 text-xs px-4 py-2.5"
                size="default"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Use This Scene
              </Button>
              <Button
                onClick={handleEditScene}
                variant="outline"
                size="default"
                className="h-11 text-xs px-4 py-2.5 sm:flex-shrink-0"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

