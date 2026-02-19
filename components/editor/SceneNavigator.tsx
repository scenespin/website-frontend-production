'use client';

import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useContextStore } from '@/lib/contextStore';
import type { Scene } from '@/types/screenplay';
import { MapPin, Users, Package } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import { getScreenplay } from '@/utils/screenplayStorage';

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
    const { getToken } = useAuth();
    const [sceneFirstLines, setSceneFirstLines] = useState<Record<string, string>>({});
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const firstLineRequestKeyRef = useRef<string>('');
    const firstLineRequestInFlightRef = useRef(false);
    const firstLineRetryAfterRef = useRef(0);
    const firstLineNotFoundScreenplayIdRef = useRef<string | null>(null);
    
    // 🔥 FIX: Check if initialization is complete before showing empty state
    // This prevents showing "No scenes yet" during initialization, which could trigger rescan duplicates
    const isInitializing = screenplay?.isLoading || !screenplay?.hasInitializedFromDynamoDB;
    const hasSceneLoadError = Boolean(screenplay?.error);
    
    // 🔥 FIX: Add timeout fallback - if initialization takes more than 10 seconds, show empty state
    // This prevents infinite loading spinner if API calls hang
    useEffect(() => {
        if (isInitializing) {
            const timeout = setTimeout(() => {
                console.warn('[SceneNavigator] ⚠️ Initialization timeout - showing empty state after 10 seconds');
                setLoadingTimeout(true);
            }, 10000); // 10 second timeout
            
            return () => clearTimeout(timeout);
        } else {
            setLoadingTimeout(false);
        }
    }, [isInitializing]);

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
    const scenesWithMissingSynopsis = useMemo(
        () => allScenes.filter(scene => {
            const hasValidSynopsis = scene.synopsis && scene.synopsis.trim() !== '' && scene.synopsis !== 'Imported from script';
            return !hasValidSynopsis && scene.fountain?.startLine !== undefined && scene.fountain?.endLine !== undefined;
        }),
        [allScenes]
    );
    
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
            // 🔥 FIX: Check for undefined instead of falsy - 0 is a valid line number (first line)
            if (scene.fountain?.startLine !== undefined && scene.fountain?.endLine !== undefined) {
                return currentLine >= scene.fountain.startLine && currentLine <= scene.fountain.endLine;
            }
            return false;
        });

        if (foundScene) {
            setCurrentSceneId(foundScene.id);
        }
    }, [currentLine, context.currentSceneId, allScenes]);

    // Fetch first line of scene text when no synopsis is available (or synopsis is "Imported from script")
    useEffect(() => {
        if (!screenplay?.screenplayId || !getToken) return;
        if (firstLineNotFoundScreenplayIdRef.current === screenplay.screenplayId) return;
        
        const fetchFirstLines = async () => {
            const scenesToFetch = scenesWithMissingSynopsis;
            if (scenesToFetch.length === 0) return;

            const fetchKey = `${screenplay.screenplayId}:${scenesToFetch.map(s => s.id).join(',')}`;
            if (firstLineRequestInFlightRef.current || firstLineRequestKeyRef.current === fetchKey) return;
            if (Date.now() < firstLineRetryAfterRef.current) return;
            
            try {
                firstLineRequestInFlightRef.current = true;
                const screenplayData = await getScreenplay(screenplay.screenplayId, getToken);
                if (!screenplayData?.content) return;
                firstLineNotFoundScreenplayIdRef.current = null;
                
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
                console.error('[SceneNavigator] Failed to fetch first lines:', error);
                const statusCode = (error as any)?.statusCode || (error as any)?.response?.status;
                const message = error instanceof Error ? error.message : String(error);
                const isNotFound = statusCode === 404 || /not found/i.test(message);
                if (isNotFound && screenplay?.screenplayId) {
                    firstLineNotFoundScreenplayIdRef.current = screenplay.screenplayId;
                    firstLineRequestKeyRef.current = fetchKey;
                }
                // Avoid tight retry loops when screenplay endpoint is failing.
                firstLineRetryAfterRef.current = Date.now() + 30000;
            } finally {
                firstLineRequestInFlightRef.current = false;
            }
        };
        
        fetchFirstLines();
    }, [screenplay?.screenplayId, getToken, scenesWithMissingSynopsis]);

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

    // 🔥 FIX: Show loading state during initialization (prevents blank state that triggers rescan duplicates)
    // But timeout after 10 seconds to prevent infinite loading
    if (isInitializing && !loadingTimeout) {
        return (
            <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-[#B3B3B3]">
                        Loading scenes...
                    </p>
                </div>
            </div>
        );
    }
    
    // 🔥 FIX: If timeout occurred, show empty state with message (allows user to proceed)
    if (isInitializing && loadingTimeout) {
        return (
            <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
                <p className="text-sm font-medium text-[#B3B3B3] mb-2">
                    Loading taking longer than expected
                </p>
                <p className="text-xs text-[#808080] mb-2">
                    Scenes may still be loading. Try refreshing the scene list.
                </p>
            </div>
        );
    }

    if (hasSceneLoadError && (!allScenes || allScenes.length === 0)) {
        return (
            <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
                <p className="text-sm font-medium text-[#B3B3B3] mb-2">
                    Could not load scenes
                </p>
                <p className="text-xs text-[#808080] mb-3">
                    Try refreshing the scene list before using Scan.
                </p>
                <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => window.dispatchEvent(new CustomEvent('refreshScenes'))}
                >
                    Retry Scene Load
                </button>
            </div>
        );
    }
    
    // Show empty state only after initialization is complete
    if (!allScenes || allScenes.length === 0) {
        return (
            <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
                <p className="text-sm font-medium text-[#B3B3B3] mb-2">
                    No scenes yet
                </p>
                <p className="text-xs text-[#808080]">
                    Import a script to get started
                </p>
            </div>
        );
    }

    return (
        <div className={cn("w-full h-full overflow-auto rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-2 scrollbar-hide", className)}>
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
                                    ? "bg-[#1F1F1F] text-white border-l-2 border-[#DC143C]" 
                                    : "text-[#B3B3B3] hover:bg-[#141414] border-l-2 border-transparent"
                            )}
                        >
                            {/* Scene Number & Heading */}
                            <div className="flex items-center w-full gap-2">
                                <span className={cn(
                                    "font-bold tabular-nums text-sm min-w-[24px]",
                                    isCurrent ? "text-[#DC143C]" : "text-[#808080]"
                                )}>
                                    {scene.number}
                                </span>
                                <span className={cn(
                                    "font-medium truncate flex-1 text-sm",
                                    isCurrent ? "text-white" : "text-[#B3B3B3]"
                                )}>
                                    {scene.heading}
                                </span>
                            </div>

                            {/* Synopsis or first line of scene text */}
                            {(() => {
                                // If synopsis exists and is not the placeholder, use it
                                const hasValidSynopsis = scene.synopsis && scene.synopsis.trim() !== '' && scene.synopsis !== 'Imported from script';
                                if (hasValidSynopsis) {
                                    return (
                                        <p className="line-clamp-2 w-full text-left text-xs leading-relaxed text-[#808080]">
                                            {scene.synopsis}
                                        </p>
                                    );
                                }
                                
                                // Otherwise, try to get first line from scene content
                                const firstLine = sceneFirstLines[scene.id];
                                if (firstLine) {
                                    return (
                                        <p className="line-clamp-2 w-full text-left text-xs leading-relaxed text-[#808080]">
                                            {firstLine}
                                        </p>
                                    );
                                }
                                
                                // No synopsis or first line available - don't show placeholder
                                return null;
                            })()}

                            {/* Badges - Cinema Theme */}
                            {(location || characters.length > 0 || assets.length > 0) && (
                                <div className="flex flex-wrap w-full gap-1 mt-1">
                                    {location && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#141414] text-[#00D9FF] border border-[#00D9FF]/30 max-w-[200px]">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{location}</span>
                                        </span>
                                    )}
                                    {characters.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#141414] text-[#DC143C] border border-[#DC143C]/30">
                                            <Users className="w-3 h-3" />
                                            <span>{characters.length}</span>
                                        </span>
                                    )}
                                    {assets.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#141414] text-[#FFD700] border border-[#FFD700]/30">
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

