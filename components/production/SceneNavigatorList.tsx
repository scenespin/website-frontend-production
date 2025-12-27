'use client';

/**
 * SceneNavigatorList - Condensed scene list for Scene Builder
 * 
 * A simplified version of the editor's SceneNavigator, designed for the Scene Builder.
 * Shows scenes in a scrollable list that stacks on mobile.
 */

import React from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Scene } from '@/types/screenplay';

interface SceneNavigatorListProps {
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  className?: string;
  isMobile?: boolean;
}

export function SceneNavigatorList({
  selectedSceneId,
  onSceneSelect,
  className = '',
  isMobile = false
}: SceneNavigatorListProps) {
  const screenplay = useScreenplay();
  const scenes = screenplay.scenes || [];

  // Get character names for a scene
  const getSceneCharacters = (scene: Scene): string[] => {
    const sceneRel = screenplay.relationships?.scenes?.[scene.id];
    if (!sceneRel?.characters) {
      // Fallback to fountain tags
      return (scene.fountain?.tags?.characters || [])
        .map(charId => screenplay.characters?.find(c => c.id === charId)?.name)
        .filter(Boolean) as string[];
    }
    
    return sceneRel.characters
      .map(charId => screenplay.characters?.find(c => c.id === charId)?.name)
      .filter(Boolean) as string[];
  };

  // Get location name for a scene
  const getSceneLocation = (scene: Scene): string | null => {
    const sceneRel = screenplay.relationships?.scenes?.[scene.id];
    if (sceneRel?.location) {
      const location = screenplay.locations?.find(l => l.id === sceneRel.location);
      return location?.name || null;
    }
    
    // Fallback to fountain tags
    if (scene.fountain?.tags?.location) {
      const location = screenplay.locations?.find(l => l.id === scene.fountain?.tags?.location);
      return location?.name || null;
    }
    
    return null;
  };

  if (!scenes || scenes.length === 0) {
    return (
      <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
        <p className="text-sm font-medium text-[#808080] mb-2">
          No scenes available
        </p>
        <p className="text-xs text-[#808080]">
          Create scenes in the Editor to use them here
        </p>
      </div>
    );
  }

  // Sort scenes by order
  const sortedScenes = [...scenes].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return (a.number || 0) - (b.number || 0);
  });

  return (
    <div className={cn(
      "w-full overflow-auto rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-2",
      isMobile ? "max-h-64" : "max-h-96",
      className
    )}>
      <div className="flex flex-col gap-1">
        {sortedScenes.map((scene) => {
          const isSelected = scene.id === selectedSceneId;
          const characters = getSceneCharacters(scene);
          const location = getSceneLocation(scene);

          return (
            <button
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={cn(
                "flex w-full flex-col items-start rounded-md transition-all p-2 gap-1 text-left",
                isSelected
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border-l-2 border-[#DC143C]"
                  : "text-[#808080] hover:bg-[#141414] border-l-2 border-transparent hover:text-[#FFFFFF]"
              )}
            >
              {/* Scene Number & Heading */}
              <div className="flex items-center w-full gap-2">
                <span className={cn(
                  "font-bold tabular-nums text-xs min-w-[20px]",
                  isSelected ? "text-[#DC143C]" : "text-[#808080]"
                )}>
                  {scene.order || scene.number || '?'}
                </span>
                <span className={cn(
                  "font-medium truncate flex-1 text-xs",
                  isSelected ? "text-[#FFFFFF]" : "text-[#808080]"
                )}>
                  {scene.heading || 'Untitled Scene'}
                </span>
              </div>

              {/* Synopsis */}
              {scene.synopsis && (
                <p className="line-clamp-2 w-full text-left text-[10px] leading-relaxed text-[#808080]">
                  {scene.synopsis}
                </p>
              )}

              {/* Badges */}
              {(location || characters.length > 0) && (
                <div className="flex flex-wrap w-full gap-1 mt-1">
                  {location && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#3F3F46] text-[#808080] gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{location}</span>
                    </Badge>
                  )}
                  {characters.length > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#3F3F46] text-[#808080] gap-1">
                      <Users className="w-2.5 h-2.5" />
                      <span>{characters.length}</span>
                    </Badge>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

