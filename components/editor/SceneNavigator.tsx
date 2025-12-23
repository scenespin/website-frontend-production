'use client';

import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useContextStore } from '@/lib/contextStore';
import type { Scene } from '@/types/screenplay';
import { MapPin, Users, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SceneNavigatorProps {
    currentLine: number;
    onSceneClick: (scene: Scene) => void;
    className?: string;
}

/**
 * SceneNavigator - Collapsible scene list with contextual awareness
 * Integrates with contextStore to show current scene and auto-expand beats
 * Theme-aware styling with DaisyUI classes
 */
export default function SceneNavigator({ currentLine, onSceneClick, className = '' }: SceneNavigatorProps) {
    const screenplay = useScreenplay();
    const context = useContextStore((state) => state.context);
    const setCurrentScene = useContextStore((state) => state.setCurrentScene);
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);

    // 🔥 Get all scenes directly (beats removed - scenes are standalone)
    const allScenesRaw = screenplay?.scenes || [];
    
    // Deduplicate by content (heading + startLine) - this is the source of truth
    // Multiple scenes with same heading+startLine are duplicates
    const sceneMapByContent = new Map<string, Scene>(); // key: "heading|startLine"
    
    allScenesRaw.forEach(scene => {
        if (!scene) return; // Skip null/undefined scenes
        
        // Use content (heading + startLine) as unique key
        const contentKey = `${(scene.heading || '').toUpperCase().trim()}|${scene.fountain?.startLine || 0}`;
        
        // Skip invalid scenes (no heading or startLine)
        if (contentKey === '|0' || !scene.heading) return;
        
        if (!sceneMapByContent.has(contentKey)) {
            sceneMapByContent.set(contentKey, scene);
        } else {
            // Duplicate content found - keep the one with the earlier order/number
            const existing = sceneMapByContent.get(contentKey)!;
            const existingOrder = existing.order ?? existing.number ?? 0;
            const newOrder = scene.order ?? scene.number ?? 0;
            if (newOrder < existingOrder) {
                sceneMapByContent.set(contentKey, scene);
            }
        }
    });
    
    // Sort by order field (primary) or number (fallback)
    const allScenes = Array.from(sceneMapByContent.values()).sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        return (a.number || 0) - (b.number || 0);
    });
    
    if (allScenesRaw.length !== allScenes.length) {
        console.warn(`[SceneNavigator] 🔍 Deduplicated ${allScenesRaw.length - allScenes.length} duplicate scenes`);
        console.log(`[SceneNavigator] Raw scenes: ${allScenesRaw.length}, Unique: ${allScenes.length}`);
    }

    // Sync with contextStore AND currentLine for double reliability
    useEffect(() => {
        // Prioritize contextStore if available
        if (context.currentSceneId) {
            setCurrentSceneId(context.currentSceneId);
            return;
        }

        // Fallback: Find scene by currentLine
        const foundScene = allScenes.find(scene => {
            if (scene.fountain?.startLine && scene.fountain?.endLine) {
                return currentLine >= scene.fountain.startLine && currentLine <= scene.fountain.endLine;
            }
            return false;
        });

        if (foundScene) {
            setCurrentSceneId(foundScene.id);
        }
    }, [currentLine, context.currentSceneId, allScenes]);


    // Get character names for a scene
    const getSceneCharacters = (scene: Scene): string[] => {
        const sceneRel = screenplay.relationships.scenes[scene.id];
        if (!sceneRel?.characters) return [];
        
        return sceneRel.characters
            .map(charId => screenplay.characters.find(c => c.id === charId)?.name)
            .filter(Boolean) as string[];
    };

    // Get location name for a scene
    const getSceneLocation = (scene: Scene): string | null => {
        const sceneRel = screenplay.relationships.scenes[scene.id];
        if (!sceneRel?.location) return null;
        
        const location = screenplay.locations.find(l => l.id === sceneRel.location);
        return location?.name || null;
    };

    // Get asset names for a scene (from scene.fountain.tags.props)
    const getSceneAssets = (scene: Scene): string[] => {
        const assetIds = scene.fountain?.tags?.props || [];
        if (assetIds.length === 0) return [];
        
        return assetIds
            .map(assetId => screenplay.assets.find(a => a.id === assetId)?.name)
            .filter(Boolean) as string[];
    };

    if (!allScenes || allScenes.length === 0) {
        return (
            <div className={cn("w-full rounded-lg border border-base-300 bg-[#0A0A0A] p-4", className)}>
                <p className="text-sm font-medium text-base-content/70 mb-2">
                    No scenes yet
                </p>
                <p className="text-xs text-base-content/50">
                    Import a script to get started
                </p>
            </div>
        );
    }

    return (
        <div className={cn("w-full h-full overflow-auto rounded-lg border border-base-300 bg-[#0A0A0A] p-2 scrollbar-hide", className)}>
            <div className="flex flex-col gap-1">
                {allScenes.map((scene) => {
                    const isCurrent = scene.id === currentSceneId;
                    const characters = getSceneCharacters(scene);
                    const location = getSceneLocation(scene);
                    const assets = getSceneAssets(scene);

                    return (
                        <button
                            key={scene.id}
                            onClick={() => {
                                onSceneClick(scene);
                                // Update global context for cross-page navigation
                                setCurrentScene(scene.id, scene.heading);
                            }}
                            className={cn(
                                "flex w-full flex-col items-start rounded-md transition-all p-2 gap-1",
                                isCurrent 
                                    ? "bg-base-300 text-base-content border-l-2 border-primary" 
                                    : "text-base-content/60 hover:bg-base-200 border-l-2 border-transparent"
                            )}
                        >
                            {/* Scene Number & Heading */}
                            <div className="flex items-center w-full gap-2">
                                <span className={cn(
                                    "font-bold tabular-nums text-sm min-w-[24px]",
                                    isCurrent ? "text-primary" : "text-base-content/40"
                                )}>
                                    {scene.number}
                                </span>
                                <span className={cn(
                                    "font-medium truncate flex-1 text-sm",
                                    isCurrent ? "text-base-content" : "text-base-content/70"
                                )}>
                                    {scene.heading}
                                </span>
                            </div>

                            {/* Synopsis */}
                            {scene.synopsis && (
                                <p className="line-clamp-2 w-full text-left text-xs leading-relaxed text-base-content/50">
                                    {scene.synopsis}
                                </p>
                            )}

                            {/* Badges */}
                            {(location || characters.length > 0 || assets.length > 0) && (
                                <div className="flex flex-wrap w-full gap-1 mt-1">
                                    {location && (
                                        <span className="badge badge-sm badge-secondary gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{location}</span>
                                        </span>
                                    )}
                                    {characters.length > 0 && (
                                        <span className="badge badge-sm badge-warning gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{characters.length}</span>
                                        </span>
                                    )}
                                    {assets.length > 0 && (
                                        <span className="badge badge-sm badge-info gap-1">
                                            <Package className="w-3 h-3" />
                                            <span>{assets.length}</span>
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

