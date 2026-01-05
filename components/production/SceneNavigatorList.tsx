'use client';

/**
 * SceneNavigatorList - Condensed scene list for Scene Builder
 * 
 * A simplified version of the editor's SceneNavigator, designed for the Scene Builder.
 * Shows scenes in a scrollable list that stacks on mobile.
 */

import React, { useState, useEffect } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { MapPin, Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Scene } from '@/types/screenplay';
import { getScreenplay } from '@/utils/screenplayStorage';

interface SceneNavigatorListProps {
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  className?: string;
  isMobile?: boolean;
  projectId?: string; // Optional: for fetching first line of scene text
}

export function SceneNavigatorList({
  selectedSceneId,
  onSceneSelect,
  className = '',
  isMobile = false,
  projectId
}: SceneNavigatorListProps) {
  const screenplay = useScreenplay();
  const { getToken } = useAuth();
  const [sceneFirstLines, setSceneFirstLines] = useState<Record<string, string>>({});

  // Get character names for a scene - Match editor pattern exactly
  const getSceneCharacters = (scene: Scene): string[] => {
    // 🔥 FIX: Match editor pattern - use relationships directly (no optional chaining)
    // Editor uses: screenplay.relationships.scenes[scene.id] (not optional)
    if (!screenplay.relationships || !screenplay.relationships.scenes) return [];
    
    const sceneRel = screenplay.relationships.scenes[scene.id];
    if (!sceneRel?.characters) return [];
    
    return sceneRel.characters
      .map(charId => screenplay.characters.find(c => c.id === charId)?.name)
      .filter(Boolean) as string[];
  };

  // Get location name for a scene - Match editor pattern exactly
  const getSceneLocation = (scene: Scene): string | null => {
    // 🔥 FIX: Match editor pattern - use relationships directly (no optional chaining)
    if (!screenplay.relationships || !screenplay.relationships.scenes) return null;
    
    const sceneRel = screenplay.relationships.scenes[scene.id];
    if (!sceneRel?.location) return null;
    
    const location = screenplay.locations.find(l => l.id === sceneRel.location);
    return location?.name || null;
  };

  // Get asset/prop count for a scene - Match editor pattern exactly
  const getScenePropsCount = (scene: Scene): number => {
    // 🔥 FIX: Match editor pattern - get asset names like editor does
    const assetIds = scene.fountain?.tags?.props || [];
    if (assetIds.length === 0) return 0;
    
    // Count valid assets (matching editor's getSceneAssets pattern)
    return assetIds
      .map(assetId => screenplay.assets.find(a => a.id === assetId))
      .filter(Boolean).length;
  };

  // Fetch first line of scene text when no synopsis is available
  useEffect(() => {
    if (!projectId || !getToken) return;
    
    const fetchFirstLines = async () => {
      const scenes = screenplay.scenes || [];
      const scenesToFetch = scenes.filter(scene => {
        // Fetch if no synopsis, or synopsis is the placeholder "Imported from script"
        const hasValidSynopsis = scene.synopsis && scene.synopsis.trim() !== '' && scene.synopsis !== 'Imported from script';
        return !hasValidSynopsis && scene.fountain?.startLine && scene.fountain?.endLine;
      });
      if (scenesToFetch.length === 0) return;
      
      try {
        const screenplayData = await getScreenplay(projectId, getToken);
        if (!screenplayData?.content) return;
        
        const fountainLines = screenplayData.content.split('\n');
        const newFirstLines: Record<string, string> = {};
        
        scenesToFetch.forEach(scene => {
          if (scene.fountain?.startLine && scene.fountain?.endLine) {
            const sceneLines = fountainLines.slice(scene.fountain.startLine, scene.fountain.endLine);
            // Find first non-empty line that's not a heading, section, or synopsis
            const firstLine = sceneLines.find(line => {
              const trimmed = line.trim();
              return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('=') && !trimmed.match(/^(INT\.|EXT\.)/i);
            });
            if (firstLine) {
              newFirstLines[scene.id] = firstLine.trim();
            }
          }
        });
        
        if (Object.keys(newFirstLines).length > 0) {
          setSceneFirstLines(prev => ({ ...prev, ...newFirstLines }));
        }
      } catch (error) {
        console.error('[SceneNavigatorList] Failed to fetch first lines:', error);
      }
    };
    
    fetchFirstLines();
  }, [projectId, getToken, screenplay.scenes]);

  // Get state values - Match editor pattern
  const scenes = screenplay.scenes || [];
  const isLoading = screenplay.isLoading || false;
  const hasInitialized = screenplay.hasInitializedFromDynamoDB || false;
  
  // 🔥 FIX: Wait for relationships to be ready (match editor behavior)
  // Editor SceneNavigator only renders after relationships are built
  const relationshipsReady = screenplay.relationships && screenplay.relationships.scenes;
  
  // 🔍 DEBUG: Log relationships to troubleshoot missing icons
  useEffect(() => {
    if (scenes.length > 0 && hasInitialized && relationshipsReady) {
      const firstScene = scenes[0];
      const sceneRel = screenplay.relationships.scenes[firstScene.id];
      const hasLocation = !!getSceneLocation(firstScene);
      const hasCharacters = getSceneCharacters(firstScene).length > 0;
      const hasProps = getScenePropsCount(firstScene) > 0;
      
      console.log('[SceneNavigatorList] 🔍 Relationships check:', {
        hasRelationships: !!screenplay.relationships,
        relationshipsScenesCount: Object.keys(screenplay.relationships.scenes || {}).length,
        scenesCount: scenes.length,
        firstSceneId: firstScene.id,
        firstSceneHeading: firstScene.heading,
        sceneRel: sceneRel,
        sceneRelCharacters: sceneRel?.characters || [],
        sceneRelLocation: sceneRel?.location,
        // Check if we can actually get data
        canGetLocation: hasLocation,
        canGetCharacters: hasCharacters,
        canGetProps: hasProps,
        fountainTags: {
          characters: firstScene.fountain?.tags?.characters || [],
          location: firstScene.fountain?.tags?.location,
          props: firstScene.fountain?.tags?.props || []
        }
      });
    }
  }, [scenes, hasInitialized, relationshipsReady]);
  
  // Show loading state while initializing OR relationships not ready
  if (isLoading || !hasInitialized || !relationshipsReady) {
    return (
      <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-[#808080]">
            Loading scenes...
          </p>
        </div>
      </div>
    );
  }
  
  // Show empty state only after initialization is complete
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
        {sortedScenes.map((scene, index) => {
          const isSelected = scene.id === selectedSceneId;
          const characters = getSceneCharacters(scene);
          const location = getSceneLocation(scene);
          const propsCount = getScenePropsCount(scene);
          
          // Use index + 1 for display number to ensure sequential numbering
          // This fixes the issue where scenes might have duplicate order values
          const displayNumber = index + 1;

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
                  {displayNumber}
                </span>
                <span className={cn(
                  "font-medium truncate flex-1 text-xs",
                  isSelected ? "text-[#FFFFFF]" : "text-[#808080]"
                )}>
                  {scene.heading || 'Untitled Scene'}
                </span>
              </div>

              {/* Synopsis or first line of scene text */}
              {(() => {
                // If synopsis exists and is not the placeholder, use it
                const hasValidSynopsis = scene.synopsis && scene.synopsis.trim() !== '' && scene.synopsis !== 'Imported from script';
                if (hasValidSynopsis) {
                  return (
                    <p className="line-clamp-2 w-full text-left text-[10px] leading-relaxed text-[#808080]">
                      {scene.synopsis}
                    </p>
                  );
                }
                
                // Otherwise, try to get first line from scene content
                const firstLine = sceneFirstLines[scene.id];
                if (firstLine) {
                  return (
                    <p className="line-clamp-2 w-full text-left text-[10px] leading-relaxed text-[#808080]">
                      {firstLine}
                    </p>
                  );
                }
                
                // No synopsis or first line available - don't show placeholder
                return null;
              })()}

              {/* Badges - Minimal inverted style */}
              {(location || characters.length > 0 || propsCount > 0) && (
                <div className="flex flex-wrap w-full gap-1 mt-1">
                  {location && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#3F3F46] text-[#808080] border border-[#3F3F46] max-w-[200px]">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{location}</span>
                    </span>
                  )}
                  {characters.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#3F3F46] text-[#808080] border border-[#3F3F46]">
                      <Users className="w-2.5 h-2.5" />
                      <span>{characters.length}</span>
                    </span>
                  )}
                  {propsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#3F3F46] text-[#808080] border border-[#3F3F46]">
                      <Package className="w-2.5 h-2.5" />
                      <span>{propsCount}</span>
                    </span>
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

