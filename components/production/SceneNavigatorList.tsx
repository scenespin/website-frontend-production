'use client';

/**
 * SceneNavigatorList - Condensed scene list for Scene Builder
 * 
 * A simplified version of the editor's SceneNavigator, designed for the Scene Builder.
 * Shows scenes in a scrollable list that stacks on mobile.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const firstLineRequestKeyRef = useRef<string>('');
  const firstLineRequestInFlightRef = useRef(false);
  const firstLineRetryAfterRef = useRef(0);
  const scenesWithMissingSynopsis = useMemo(() => {
    const scenes = screenplay.scenes || [];
    return scenes.filter(scene => {
      const hasValidSynopsis = scene.synopsis && scene.synopsis.trim() !== '' && scene.synopsis !== 'Imported from script';
      return !hasValidSynopsis && scene.fountain?.startLine !== undefined && scene.fountain?.endLine !== undefined;
    });
  }, [screenplay.scenes]);

  // Get character names for a scene - Match editor pattern with fallback
  const getSceneCharacters = (scene: Scene): string[] => {
    // 🔥 FIX #2: Try relationships first (preferred source of truth)
    if (screenplay.relationships?.scenes?.[scene.id]?.characters) {
      const sceneRel = screenplay.relationships.scenes[scene.id];
      const characterNames = sceneRel.characters
        .map(charId => screenplay.characters.find(c => c.id === charId)?.name)
        .filter(Boolean) as string[];
      if (characterNames.length > 0) return characterNames;
    }
    
    // 🔥 FIX #2: Fallback to fountain tags (like SceneBuilderPanel does)
    // This ensures icons show even if relationships aren't built yet
    const characterIds = scene.fountain?.tags?.characters || [];
    if (characterIds.length > 0) {
      return characterIds
        .map(charId => screenplay.characters.find(c => c.id === charId)?.name)
        .filter(Boolean) as string[];
    }
    
    return [];
  };

  // Get location name for a scene - Match editor pattern with fallback
  const getSceneLocation = (scene: Scene): string | null => {
    // 🔥 FIX #2: Try relationships first (preferred source of truth)
    if (screenplay.relationships?.scenes?.[scene.id]?.location) {
      const sceneRel = screenplay.relationships.scenes[scene.id];
      const location = screenplay.locations.find(l => l.id === sceneRel.location);
      if (location) return location.name;
    }
    
    // 🔥 FIX #2: Fallback to fountain tags (like SceneBuilderPanel does)
    // This ensures icons show even if relationships aren't built yet
    if (scene.fountain?.tags?.location) {
      const location = screenplay.locations.find(l => l.id === scene.fountain.tags.location);
      if (location) return location.name;
    }
    
    return null;
  };

  // Get asset/prop count for a scene - Match Scene Preview pattern (direct count from tags)
  const getScenePropsCount = (scene: Scene): number => {
    // 🔥 FIX: Match Scene Preview pattern - just count props from fountain tags
    // Scene Preview shows: (scene.fountain?.tags?.props || []).length
    // This avoids timing issues with asset loading and ID mismatches
    const assetIds = scene.fountain?.tags?.props || [];
    return assetIds.length;
  };

  // Fetch first line of scene text when no synopsis is available
  useEffect(() => {
    if (!projectId || !getToken) return;
    
    const fetchFirstLines = async () => {
      const scenesToFetch = scenesWithMissingSynopsis;
      if (scenesToFetch.length === 0) return;

      const fetchKey = `${projectId}:${scenesToFetch.map(s => s.id).join(',')}`;
      if (firstLineRequestInFlightRef.current || firstLineRequestKeyRef.current === fetchKey) return;
      if (Date.now() < firstLineRetryAfterRef.current) return;
      
      try {
        firstLineRequestInFlightRef.current = true;
        const screenplayData = await getScreenplay(projectId, getToken);
        if (!screenplayData?.content) return;
        
        const fountainLines = screenplayData.content.split('\n');
        const newFirstLines: Record<string, string> = {};
        
        scenesToFetch.forEach(scene => {
          // 🔥 FIX: Check for undefined instead of falsy - 0 is a valid line number (first line)
          if (scene.fountain?.startLine !== undefined && scene.fountain?.endLine !== undefined) {
            // 🔥 FIX: endLine is inclusive (0-based), but slice() is exclusive, so add 1
            const sceneLines = fountainLines.slice(scene.fountain.startLine, scene.fountain.endLine + 1);
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
        firstLineRequestKeyRef.current = fetchKey;
      } catch (error) {
        console.error('[SceneNavigatorList] Failed to fetch first lines:', error);
        // Avoid hammering screenplay endpoint on repeated failures.
        firstLineRetryAfterRef.current = Date.now() + 30000;
      } finally {
        firstLineRequestInFlightRef.current = false;
      }
    };
    
    fetchFirstLines();
  }, [projectId, getToken, scenesWithMissingSynopsis]);

  // Get state values - Match editor pattern
  const scenes = screenplay.scenes || [];
  const isLoading = screenplay.isLoading || false;
  const hasInitialized = screenplay.hasInitializedFromDynamoDB || false;
  
  // 🔥 FIX: Wait for relationships to be ready (match editor behavior)
  // Editor SceneNavigator only renders after relationships are built
  const relationshipsReady = screenplay.relationships && screenplay.relationships.scenes;
  
  // 🔍 DEBUG: Log relationships and props to troubleshoot missing icons
  useEffect(() => {
    if (scenes.length > 0 && hasInitialized && relationshipsReady) {
      const firstScene = scenes[0];
      const sceneRel = screenplay.relationships.scenes[firstScene.id];
      const hasLocation = !!getSceneLocation(firstScene);
      const hasCharacters = getSceneCharacters(firstScene).length > 0;
      const hasProps = getScenePropsCount(firstScene) > 0;
      const assetIds = firstScene.fountain?.tags?.props || [];
      
      // 🔍 DEBUG: Log props info (moved to useEffect to prevent React error #185)
      if (assetIds.length > 0) {
        console.log('[SceneNavigatorList] 🔍 Props info:', {
          sceneId: firstScene.id,
          sceneHeading: firstScene.heading,
          assetIds,
          propsCount: hasProps,
          assetsCount: screenplay.assets.length
        });
      }
      
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

              {/* Badges - Ultra minimal inverted style (no background, just icons and text) */}
              {(location || characters.length > 0 || propsCount > 0) && (
                <div className="flex flex-wrap w-full gap-1.5 mt-1">
                  {location && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#808080] opacity-70">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{location}</span>
                    </span>
                  )}
                  {characters.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#808080] opacity-70">
                      <Users className="w-2.5 h-2.5" />
                      <span>{characters.length}</span>
                    </span>
                  )}
                  {propsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#808080] opacity-70">
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

