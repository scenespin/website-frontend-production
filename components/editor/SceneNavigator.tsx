'use client';

import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useContextStore } from '@/lib/contextStore';
import type { Scene } from '@/types/screenplay';
import { ChevronRight, ChevronDown, MapPin, Users } from 'lucide-react';
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
    const setCurrentBeat = useContextStore((state) => state.setCurrentBeat);
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
    const [openBeats, setOpenBeats] = useState<Record<string, boolean>>({});

    // Flatten all scenes across beats (with null safety)
    const allScenes = (screenplay?.beats || []).flatMap(beat => 
        beat.scenes.map(scene => ({
            ...scene,
            beatTitle: beat.title,
            beatId: beat.id
        }))
    );

    // Sync with contextStore AND currentLine for double reliability
    useEffect(() => {
        // Prioritize contextStore if available
        if (context.currentSceneId) {
            setCurrentSceneId(context.currentSceneId);
            // Find beat containing this scene
            const beat = (screenplay?.beats || []).find(b => 
                b.scenes.some(s => s.id === context.currentSceneId)
            );
            if (beat) {
                setOpenBeats(prev => ({ ...prev, [beat.id]: true }));
            }
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
            setOpenBeats(prev => ({ ...prev, [foundScene.beatId]: true }));
        }
    }, [currentLine, context.currentSceneId, screenplay?.beats]);

    const toggleBeat = (beatId: string) => {
        setOpenBeats(prev => ({ ...prev, [beatId]: !prev[beatId] }));
    };

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

    if (!screenplay?.beats || screenplay.beats.length === 0) {
        return (
            <div className={cn("w-full rounded-lg border border-base-300 bg-base-100 p-4", className)}>
                <p className="text-sm font-medium text-base-content/70 mb-2">
                    No scenes yet
                </p>
                <p className="text-xs text-base-content/50">
                    Click "Test Data" at the top to add sample scenes
                </p>
            </div>
        );
    }

    const renderBeat = (beat: (typeof screenplay.beats)[0], isLast: boolean) => {
        const isOpen = openBeats[beat.id];
        const beatScenes = beat.scenes;
        const hasScenes = beatScenes.length > 0;
        const hasCurrentScene = beatScenes.some(s => s.id === currentSceneId);

        return (
            <div key={beat.id} className={cn("relative", !isLast && "mb-2 pb-2 border-b border-base-300")}>
                {/* Beat Header */}
                <button
                    onClick={() => hasScenes && toggleBeat(beat.id)}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-md transition-colors p-2 text-sm font-semibold",
                        hasCurrentScene ? "bg-base-300 text-primary" : "text-base-content/70 hover:bg-base-200"
                    )}
                >
                    <span className="flex-grow text-left truncate">{beat.title}</span>
                    <span className="badge badge-sm bg-base-300 text-base-content/60">
                        {beatScenes.length}
                    </span>
                    {hasScenes && (isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />)}
                </button>

                {/* Scenes */}
                {hasScenes && isOpen && (
                    <div className="mt-1 space-y-1">
                        {beatScenes.map((scene) => {
                            const isCurrent = scene.id === currentSceneId;
                            const characters = getSceneCharacters(scene);
                            const location = getSceneLocation(scene);

                            return (
                                <button
                                    key={scene.id}
                                    onClick={() => {
                                        onSceneClick(scene);
                                        // Update global context for cross-page navigation
                                        setCurrentScene(scene.id, scene.heading);
                                        setCurrentBeat(beat.id, beat.title);
                                    }}
                                    className={cn(
                                        "flex w-full flex-col items-start rounded-md transition-all p-2 pl-6 gap-1",
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
                                    {(location || characters.length > 0) && (
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
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn("w-full h-full overflow-auto rounded-lg border border-base-300 bg-base-100 p-2 scrollbar-hide", className)}>
            <div className="flex flex-col gap-1">
                {screenplay.beats.map((beat, index) => 
                    renderBeat(beat, index === screenplay.beats.length - 1)
                )}
            </div>
        </div>
    );
}

