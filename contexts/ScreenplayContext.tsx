'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import type {
    StoryBeat,
    Scene,
    Character,
    Location,
    Relationships,
    CreateInput,
    CascadeOption,
    DeletionResult,
    ImageAsset,
    CharacterType,
    ArcStatus,
    LocationType
} from '@/types/screenplay';
import {
    listCharacters,
    createCharacter as apiCreateCharacter,
    updateCharacter as apiUpdateCharacter,
    deleteCharacter as apiDeleteCharacter,
    listLocations,
    createLocation as apiCreateLocation,
    updateLocation as apiUpdateLocation,
    deleteLocation as apiDeleteLocation,
    listBeats,
    createBeat as apiCreateBeat,
    updateBeat as apiUpdateBeat,
    deleteBeat as apiDeleteBeat,
    updateRelationships as apiUpdateRelationships,
    updateScreenplay as apiUpdateScreenplay
} from '@/utils/screenplayStorage';
import {
    updateScriptTags
} from '@/utils/fountainTags';
import { 
    persistenceManager,
    waitForInitialization 
} from '@/utils/screenplayPersistence';

// ============================================================================
// Context Type Definition
// ============================================================================

interface ScreenplayContextType {
    // State
    beats: StoryBeat[];
    characters: Character[];
    locations: Location[];
    relationships: Relationships;
    isLoading: boolean;
    hasInitializedFromDynamoDB: boolean; // NEW: Track if initial load is complete
    error: string | null;
    
    // Feature 0111 Phase 3: DynamoDB screenplay tracking
    screenplayId: string | null;
    
    // CRUD - Story Beats
    createBeat: (beat: CreateInput<StoryBeat>) => Promise<StoryBeat>;
    updateBeat: (id: string, updates: Partial<StoryBeat>) => Promise<void>;
    deleteBeat: (id: string) => Promise<void>;
    
    // CRUD - Scenes
    createScene: (beatId: string, scene: CreateInput<Scene>) => Promise<Scene>;
    updateScene: (id: string, updates: Partial<Scene>) => Promise<void>;
    deleteScene: (id: string) => Promise<void>;
    moveScene: (sceneId: string, targetBeatId: string, newOrder: number) => Promise<void>;
    
    // CRUD - Characters
    createCharacter: (character: CreateInput<Character>) => Promise<Character>;
    updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>;
    deleteCharacter: (id: string, cascade: CascadeOption) => Promise<DeletionResult>;
    addCharacterToScene: (characterId: string, sceneId: string) => Promise<void>;
    removeCharacterFromScene: (characterId: string, sceneId: string) => Promise<void>;
    
    // CRUD - Locations
    createLocation: (location: CreateInput<Location>) => Promise<Location>;
    updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
    deleteLocation: (id: string, cascade: CascadeOption) => Promise<DeletionResult>;
    setSceneLocation: (sceneId: string, locationId: string) => Promise<void>;
    
    // Bulk Import
    bulkImportCharacters: (characterNames: string[], descriptions?: Map<string, string>) => Promise<Character[]>;
    bulkImportLocations: (locationNames: string[]) => Promise<Location[]>;
    bulkImportScenes: (beatId: string, scenes: Array<{
        heading: string;
        location: string;
        characterIds: string[];
        locationId?: string;
        startLine: number;
        endLine: number;
    }>) => Promise<Scene[]>;
    saveBeatsToDynamoDB: () => Promise<void>; // Save beats after all imports complete
    saveAllToDynamoDBDirect: (
        beats: StoryBeat[],
        characters: Character[],
        locations: Location[],
        screenplayId: string
    ) => Promise<void>; // 🔥 NEW: Save ALL structure (NO CLOSURE ISSUES!)
    
    // 🔥 NEW: Get current state without closure issues
    getCurrentState: () => {
        beats: StoryBeat[];
        characters: Character[];
        locations: Location[];
    };
    
    // Scene Position Management
    updateScenePositions: (content: string) => Promise<void>;
    
    // Relationships
    updateRelationships: () => Promise<void>;
    getSceneCharacters: (sceneId: string) => Character[];
    getCharacterScenes: (characterId: string) => Scene[];
    getLocationScenes: (locationId: string) => Scene[];
    
    // Image Management
    addImageToEntity: (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string,
        imageUrl: string,
        metadata?: { prompt?: string; modelUsed?: string }
    ) => Promise<void>;
    removeImageFromEntity: (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string,
        imageIndex: number
    ) => Promise<void>;
    getEntityImages: (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string
    ) => ImageAsset[];
    
    // Clear all data (when editor is cleared)
    clearAllData: () => Promise<void>;
}

const ScreenplayContext = createContext<ScreenplayContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface ScreenplayProviderProps {
    children: ReactNode;
}

export function ScreenplayProvider({ children }: ScreenplayProviderProps) {
    // ========================================================================
    // LocalStorage Keys
    // ========================================================================
    const STORAGE_KEYS = {
        BEATS: 'screenplay_beats_v1',
        CHARACTERS: 'screenplay_characters_v1',
        LOCATIONS: 'screenplay_locations_v1',
        RELATIONSHIPS: 'screenplay_relationships_v1',
        LAST_SAVED: 'screenplay_last_saved',
        GITHUB_CONFIG: 'screenplay_github_config'
    };

    // ========================================================================
    // State - START WITH EMPTY STATE (DynamoDB is source of truth!)
    // 🔥 CRITICAL FIX: Do NOT load from localStorage on mount!
    // Loading from localStorage first causes race conditions where stale data overwrites fresh edits
    // localStorage is ONLY used as a write cache for performance
    // ========================================================================
    const [beats, setBeats] = useState<StoryBeat[]>([]);
    
    // Characters, locations - START WITH EMPTY STATE
    // 🔥 CRITICAL FIX: Do NOT load from localStorage on mount!
    // DynamoDB is the source of truth - localStorage is just a write cache for performance
    // Loading from localStorage first causes race conditions where stale data overwrites fresh edits
    const [characters, setCharacters] = useState<Character[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    
    // 🔥 NEW: Refs to access current state without closure issues
    // These are updated in sync with state and can be read in callbacks without stale closures
    const beatsRef = useRef<StoryBeat[]>([]);
    const charactersRef = useRef<Character[]>([]);
    const locationsRef = useRef<Location[]>([]);
    
    // Keep refs in sync with state
    useEffect(() => { beatsRef.current = beats; }, [beats]);
    useEffect(() => { charactersRef.current = characters; }, [characters]);
    useEffect(() => { locationsRef.current = locations; }, [locations]);
    
    // Relationships - START WITH EMPTY STATE
    // 🔥 CRITICAL FIX: Do NOT load from localStorage on mount - DynamoDB is source of truth
    const [relationships, setRelationships] = useState<Relationships>({
        scenes: {},
        characters: {},
        locations: {},
        props: {}
    });

    const [isLoading, setIsLoading] = useState(true); // Start true until DynamoDB loads
    const [error, setError] = useState<string | null>(null);
    
    // Track if we've auto-created the 8-Sequence Structure to prevent duplicates
    const hasAutoCreated = useRef(false);
    
    // 🔥 NEW: Track which screenplay_id we've initialized to prevent duplicate effect executions
    // Stores the last screenplay_id (or 'no-id') that we initialized for
    const hasInitializedRef = useRef<string | false>(false);
    
    // Track if initial data has been loaded from DynamoDB
    const [hasInitializedFromDynamoDB, setHasInitializedFromDynamoDB] = useState(false);
    
    // ========================================================================
    // Feature 0111 Phase 3: DynamoDB Integration & Clerk Auth
    // ========================================================================
    const { getToken } = useAuth();
    
    // Track current screenplay_id (from EditorContext via localStorage)
    const [screenplayId, setScreenplayId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('current_screenplay_id');
    });
    
    // Update screenplay_id when localStorage changes (EditorContext saves it)
    useEffect(() => {
        const handleStorageChange = () => {
            const id = localStorage.getItem('current_screenplay_id');
            // CRITICAL FIX: Only update if ID actually changed (prevents infinite reload loop)
            setScreenplayId(prev => {
                if (prev !== id) {
                    console.log('[ScreenplayContext] Screenplay ID updated:', id);
                    return id;
                }
                return prev; // No change, don't trigger re-render
            });
        };
        
        // Listen for changes from other tabs/windows
        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically in case same-tab updates don't fire storage event
        const interval = setInterval(handleStorageChange, 5000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Load structure data from DynamoDB when screenplay_id is available
    useEffect(() => {
        // 🔥 CRITICAL: Guard against duplicate initialization runs
        // This prevents the 26-beat bug caused by multiple effect executions
        const initKey = screenplayId || 'no-id';
        if (hasInitializedRef.current === initKey) {
            console.log('[ScreenplayContext] ⏭️ Already initialized for:', initKey, '- skipping');
            return;
        }
        
        console.log('[ScreenplayContext] 🚀 Starting initialization for:', initKey);
        hasInitializedRef.current = initKey;
        
        async function initializeData() {
            // 🔥 NEW: Load from DynamoDB using persistence manager
            if (screenplayId) {
                try {
                    console.log('[ScreenplayContext] 🔄 Loading structure from DynamoDB for:', screenplayId);
                    
                    // 🔥 CRITICAL: Initialize persistence manager with screenplay_id and getToken
                    persistenceManager.setScreenplay(screenplayId, getToken);
                    
                    // 🔥 NEW: Use persistence manager to load all data
                    // This handles all transformation logic internally
                    const [beatsData, charactersData, locationsData] = await Promise.all([
                        persistenceManager.loadBeats().catch(err => {
                            console.warn('[ScreenplayContext] Failed to load beats:', err);
                            return [];
                        }),
                        persistenceManager.loadCharacters().catch(err => {
                            console.warn('[ScreenplayContext] Failed to load characters:', err);
                            return [];
                        }),
                        persistenceManager.loadLocations().catch(err => {
                            console.warn('[ScreenplayContext] Failed to load locations:', err);
                            return [];
                        })
                    ]);
                    
                    // 🔥 NEW: Update state with loaded data (transformation already done by persistence manager)
                    if (beatsData.length > 0) {
                        setBeats(beatsData);
                        console.log('[ScreenplayContext] ✅ Loaded', beatsData.length, 'beats from DynamoDB');
                        // Prevent auto-creation of default beats since we loaded existing ones
                        hasAutoCreated.current = true;
                    } else {
                        // No beats in DB - need to create default structure
                        console.log('[ScreenplayContext] 📝 No beats in DB, checking if we need to create defaults...');
                    }
                    
                    // 🔥 FIXED: Always load what's in DynamoDB - it's the source of truth!
                    // If DB has empty arrays, that means data was cleared - accept it!
                    // The defensive logic was preventing "Clear All" from working
                    setCharacters(charactersData);
                    console.log('[ScreenplayContext] ✅ Loaded', charactersData.length, 'characters from DynamoDB');
                    
                    setLocations(locationsData);
                    console.log('[ScreenplayContext] ✅ Loaded', locationsData.length, 'locations from DynamoDB');
                    
                    
                    // 🔥 CRITICAL: Check if we need to create default beats AFTER loading
                    // Use beatsData (just loaded) instead of beats (stale state) to avoid race condition
                    if (beatsData.length === 0 && !hasAutoCreated.current) {
                        console.log('[ScreenplayContext] 🏗️ Creating default 8-sequence structure for screenplay:', screenplayId);
                        await createDefaultBeats(screenplayId);
                    } else if (hasAutoCreated.current) {
                        console.log('[ScreenplayContext] ⏭️ Skipping beat creation - already have', beatsData.length, 'beats');
                    }
                    
                } catch (err) {
                    console.error('[ScreenplayContext] Failed to load from DynamoDB:', err);
                } finally {
                    // Mark as initialized and stop loading (even if there was an error)
                    setHasInitializedFromDynamoDB(true);
                    setIsLoading(false);
                    console.log('[ScreenplayContext] ✅ Initialization complete - ready for imports');
                }
            } else {
                console.log('[ScreenplayContext] No screenplay_id yet - waiting for EditorContext');
                // Still mark as initialized so imports can work (for new screenplays)
                setHasInitializedFromDynamoDB(true);
                setIsLoading(false);
                
                // 🔥 CRITICAL: For new screenplays (no ID yet), create default beats immediately
                // But only if we haven't already created them
                if (!hasAutoCreated.current) {
                    console.log('[ScreenplayContext] 🏗️ Creating default 8-sequence structure (no screenplay ID yet)');
                    await createDefaultBeats(null);
                } else {
                    console.log('[ScreenplayContext] ⏭️ Skipping beat creation - already created');
                }
            }
        }
        
        // Helper function to create default 8-sequence beats (DRY principle)
        async function createDefaultBeats(screenplay_id: string | null) {
            // 🔥 DOUBLE-CHECK: Prevent any possibility of duplicate creation
            if (hasAutoCreated.current) {
                console.log('[ScreenplayContext] ⛔ Blocked duplicate beat creation - already created');
                return;
            }
            
            // 🔥 SET FLAG IMMEDIATELY before any async operations
            // This prevents race conditions where multiple calls happen before flag is set
            hasAutoCreated.current = true;
            console.log('[ScreenplayContext] 🔒 Locked hasAutoCreated flag to prevent duplicates');
            
            const sequences = [
                {
                    title: 'Sequence 1: Status Quo',
                    description: 'Opening image. Introduce protagonist, world, ordinary life. What they want vs. what they need. (Pages 1-12, Act I)',
                    order: 0
                },
                {
                    title: 'Sequence 2: Predicament',
                    description: 'Inciting incident. Call to adventure. Protagonist thrust into new situation. (Pages 13-25, Act I)',
                    order: 1
                },
                {
                    title: 'Sequence 3: Lock In',
                    description: 'Protagonist commits to the journey. First major obstacle. Point of no return. (Pages 26-37, Act II-A)',
                    order: 2
                },
                {
                    title: 'Sequence 4: First Culmination',
                    description: 'Complications arise. Stakes raised. Rising tension toward midpoint. (Pages 38-55, Act II-A)',
                    order: 3
                },
                {
                    title: 'Sequence 5: Midpoint Shift',
                    description: 'Major revelation or turning point. False victory or false defeat. Everything changes. (Pages 56-67, Act II-B)',
                    order: 4
                },
                {
                    title: 'Sequence 6: Complications',
                    description: 'Plan falls apart. Obstacles multiply. Protagonist losing ground. (Pages 68-85, Act II-B)',
                    order: 5
                },
                {
                    title: 'Sequence 7: All Is Lost',
                    description: 'Darkest moment. Protagonist\'s lowest point. Appears all is lost. (Pages 86-95, Act III)',
                    order: 6
                },
                {
                    title: 'Sequence 8: Resolution',
                    description: 'Final push. Climax and resolution. New equilibrium established. (Pages 96-110, Act III)',
                    order: 7
                }
            ];
            
            const now = new Date().toISOString();
            const newBeats = sequences.map((seq, index) => ({
                id: `beat-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                title: seq.title,
                description: seq.description,
                order: seq.order,
                scenes: [],
                createdAt: now,
                updatedAt: now
            }));
            
            setBeats(newBeats);
            console.log('[ScreenplayContext] ✅ Created default 8-Sequence Structure:', newBeats.length, 'beats');
            
            if (screenplay_id) {
                console.log('[ScreenplayContext] 💾 Saving default 8 beats to DynamoDB...');
                try {
                    await persistenceManager.saveBeats(newBeats);
                    console.log('[ScreenplayContext] ✅ Saved 8 default beats to DynamoDB');
                } catch (err) {
                    console.error('[ScreenplayContext] Failed to save default beats:', err);
                    // Don't clear the flag if save failed - we still created them locally
                }
            } else {
                console.log('[ScreenplayContext] ⏳ Beats created locally - will save when screenplay_id available');
            }
        }
        
        initializeData();
    }, [screenplayId]); // Only re-run when screenplay_id changes, NOT on getToken changes
    
    // ========================================================================
    // Auto-save to localStorage when data changes
    // ========================================================================
    
    // Removed aggressive validation logging that was causing performance issues
    
    // ========================================================================
    // 🔥 REMOVED: localStorage auto-save for characters/locations/beats
    // These are now saved ONLY to DynamoDB via persistenceManager
    // localStorage should NOT be a cache layer - DynamoDB is source of truth
    // ========================================================================
    
    // ========================================================================
    // Feature 0111 Phase 3: GitHub Connection & Sync (REMOVED)
    // GitHub is now optional - config stored in localStorage for export only
    // Old connect/disconnect/sync functions removed - see EditorToolbar for export
    // All structure data now auto-saves to DynamoDB via EditorContext
    // ========================================================================
    
    // ========================================================================
    // CRUD - Story Beats
    // ========================================================================
    
    const createBeat = useCallback(async (beat: CreateInput<StoryBeat>): Promise<StoryBeat> => {
        const now = new Date().toISOString();
        const newBeat: StoryBeat = {
            ...beat,
            // SAFETY: Ensure scenes is always an array, never undefined or corrupted
            scenes: Array.isArray(beat.scenes) ? beat.scenes : [],
            id: `beat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now
        };
        
        setBeats(prev => [...prev, newBeat]);
        
        // Feature 0111 Phase 3: Create in DynamoDB
        if (screenplayId) {
            try {
                // Transform: Extract scene IDs for backend (backend expects string[], not Scene[])
                const beatForBackend = {
                    ...newBeat,
                    scenes: newBeat.scenes.map(s => s.id)
                };
                await apiCreateBeat(screenplayId, beatForBackend as any, getToken);
                console.log('[ScreenplayContext] ✅ Created beat in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to create beat in DynamoDB:', error);
            }
        }
        
        return newBeat;
    }, [screenplayId, getToken]);
    
    const updateBeat = useCallback(async (id: string, updates: Partial<StoryBeat>) => {
        setBeats(prev => prev.map(beat => {
            if (beat.id !== id) return beat;
            
            const updatedBeat = { ...beat, ...updates, updatedAt: new Date().toISOString() };
            
            // SAFETY: If scenes is being updated, ensure it's always an array
            if ('scenes' in updates) {
                updatedBeat.scenes = Array.isArray(updates.scenes) ? updates.scenes : [];
            }
            
            return updatedBeat;
        }));
        
        // Feature 0111 Phase 3: Update in DynamoDB
        if (screenplayId) {
            try {
                // Transform: Extract scene IDs if scenes are being updated
                const updatesForBackend: any = {};
                if (updates.title !== undefined) updatesForBackend.title = updates.title;
                if (updates.description !== undefined) updatesForBackend.description = updates.description;
                if (updates.order !== undefined) updatesForBackend.order = updates.order;
                if (updates.scenes !== undefined) {
                    updatesForBackend.scenes = updates.scenes.map(s => s.id);
                }
                
                await apiUpdateBeat(screenplayId, id, updatesForBackend, getToken);
                console.log('[ScreenplayContext] ✅ Updated beat in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update beat in DynamoDB:', error);
            }
        }
    }, [screenplayId, getToken]);
    
    const deleteBeat = useCallback(async (id: string) => {
        const beat = beats.find(b => b.id === id);
        setBeats(prev => prev.filter(b => b.id !== id));
        
        // Feature 0111 Phase 3: Delete from DynamoDB
        if (screenplayId && beat) {
            try {
                await apiDeleteBeat(screenplayId, id, getToken);
                console.log('[ScreenplayContext] ✅ Deleted beat from DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to delete beat from DynamoDB:', error);
            }
        }
    }, [beats, screenplayId, getToken]);
    
    // ========================================================================
    // CRUD - Scenes
    // ========================================================================
    
    const createScene = useCallback(async (beatId: string, scene: CreateInput<Scene>): Promise<Scene> => {
        const now = new Date().toISOString();
        const newScene: Scene = {
            ...scene,
            beatId,
            id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now
        };
        
        // Add to beat
        setBeats(prev => prev.map(beat =>
            beat.id === beatId
                ? { ...beat, scenes: [...beat.scenes, newScene], updatedAt: now }
                : beat
        ));
        
        // Add to relationships
        setRelationships(prev => ({
            ...prev,
            scenes: {
                ...prev.scenes,
                [newScene.id]: {
                    type: 'scene',
                    characters: newScene.fountain.tags.characters,
                    location: newScene.fountain.tags.location,
                    storyBeat: beatId
                }
            }
        }));
        
        // Feature 0111 Phase 3: Update beat in DynamoDB (scenes are nested)
        if (screenplayId) {
            try {
                // Find the updated beat
                const updatedBeat = beats.find(b => b.id === beatId);
                if (updatedBeat) {
                    // Transform: Extract scene IDs (backend expects string[], not Scene[])
                    await apiUpdateBeat(
                        screenplayId,
                        beatId,
                        {
                            scenes: [...updatedBeat.scenes.map(s => s.id), newScene.id]
                        },
                        getToken
                    );
                    console.log('[ScreenplayContext] ✅ Updated beat (added scene) in DynamoDB');
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update beat in DynamoDB:', error);
            }
        }
        
        return newScene;
    }, [beats, screenplayId, getToken]);
    
    const updateScene = useCallback(async (id: string, updates: Partial<Scene>) => {
        const now = new Date().toISOString();
        
        setBeats(prev => {
            // Update the scene
            const updatedBeats = prev.map(beat => ({
                ...beat,
                scenes: beat.scenes.map(scene =>
                    scene.id === id
                        ? { ...scene, ...updates, updatedAt: now }
                        : scene
                )
            }));
            
            // Recalculate beat page ranges if timing data changed
            if (updates.timing) {
                return recalculateBeatPageRanges(updatedBeats);
            }
            
            return updatedBeats;
        });
        
        // Feature 0111 Phase 3: Update all beats in DynamoDB (since scene updated)
        if (screenplayId) {
            try {
                // Find which beat contains this scene
                const parentBeat = beats.find(beat => beat.scenes.some(s => s.id === id));
                if (parentBeat) {
                    const updatedScenes = parentBeat.scenes.map(scene =>
                        scene.id === id ? { ...scene, ...updates, updatedAt: now } : scene
                    );
                    
                    // Transform: Extract scene IDs (backend expects string[], not Scene[])
                    await apiUpdateBeat(
                        screenplayId,
                        parentBeat.id,
                        { scenes: updatedScenes.map(s => s.id) },
                        getToken
                    );
                    console.log('[ScreenplayContext] ✅ Updated beat (modified scene) in DynamoDB');
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update beat in DynamoDB:', error);
            }
        }
    }, [beats, screenplayId, getToken]);
    
    // Helper: Recalculate page ranges for all beats based on scene timing
    const recalculateBeatPageRanges = (beats: StoryBeat[]): StoryBeat[] => {
        return beats.map(beat => {
            if (beat.scenes.length === 0) return beat;
            
            // Get all scenes with timing data, sorted by start time
            const scenesWithTiming = beat.scenes
                .filter(s => s.timing?.startMinute !== undefined)
                .sort((a, b) => (a.timing!.startMinute) - (b.timing!.startMinute));
            
            if (scenesWithTiming.length === 0) return beat;
            
            // Calculate beat's page range from first to last scene
            const firstScene = scenesWithTiming[0];
            const lastScene = scenesWithTiming[scenesWithTiming.length - 1];
            
            const startPage = firstScene.timing!.pageNumber ?? 1;
            const endPage = lastScene.timing!.pageNumber ?? 1;
            
            console.log(`[Timeline] Recalculated beat "${beat.title}" pages: ${startPage}-${endPage}`);
            
            return {
                ...beat,
                // Note: StoryBeat doesn't have pageRange field yet, but we can add it if needed
                updatedAt: new Date().toISOString()
            };
        });
    };
    
    const deleteScene = useCallback(async (id: string) => {
        let deletedScene: Scene | undefined;
        
        setBeats(prev => prev.map(beat => {
            const scene = beat.scenes.find(s => s.id === id);
            if (scene) deletedScene = scene;
            
            return {
                ...beat,
                scenes: beat.scenes.filter(s => s.id !== id)
            };
        }));
        
        // Remove from relationships
        setRelationships(prev => {
            const newRels = { ...prev };
            delete newRels.scenes[id];
            return newRels;
        });
        
        // Feature 0111 Phase 3: Update beat in DynamoDB (scene deleted)
        if (screenplayId && deletedScene) {
            try {
                const parentBeat = beats.find(beat => beat.scenes.some(s => s.id === id));
                if (parentBeat) {
                    const updatedScenes = parentBeat.scenes.filter(s => s.id !== id);
                    
                    // Transform: Extract scene IDs (backend expects string[], not Scene[])
                    await apiUpdateBeat(
                        screenplayId,
                        parentBeat.id,
                        { scenes: updatedScenes.map(s => s.id) },
                        getToken
                    );
                    console.log('[ScreenplayContext] ✅ Updated beat (deleted scene) in DynamoDB');
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update beat in DynamoDB:', error);
            }
        }
    }, [beats, screenplayId, getToken]);
    
    const moveScene = useCallback(async (sceneId: string, targetBeatId: string, newOrder: number) => {
        let movedScene: Scene | undefined;
        
        // Remove from current beat
        setBeats(prev => {
            const currentBeat = prev.find(beat => beat.scenes.some(s => s.id === sceneId));
            if (currentBeat) {
                movedScene = currentBeat.scenes.find(s => s.id === sceneId);
            }
            
            return prev.map(beat => ({
                ...beat,
                scenes: beat.scenes.filter(s => s.id !== sceneId)
            }));
        });
        
        // Add to target beat
        if (movedScene) {
            setBeats(prev => prev.map(beat => {
                if (beat.id === targetBeatId) {
                    const scenes = [...beat.scenes];
                    scenes.splice(newOrder, 0, { ...movedScene!, beatId: targetBeatId });
                    return { ...beat, scenes };
                }
                return beat;
            }));
            
            // Feature 0111 Phase 3: Update both beats in DynamoDB (scene moved)
            if (screenplayId) {
                try {
                    // Update source beat (scene removed)
                    const sourceBeat = beats.find(beat => beat.scenes.some(s => s.id === sceneId));
                    if (sourceBeat) {
                        // Transform: Extract scene IDs (backend expects string[], not Scene[])
                        await apiUpdateBeat(
                            screenplayId,
                            sourceBeat.id,
                            { scenes: sourceBeat.scenes.filter(s => s.id !== sceneId).map(s => s.id) },
                            getToken
                        );
                    }
                    
                    // Update target beat (scene added)
                    const targetBeat = beats.find(b => b.id === targetBeatId);
                    if (targetBeat) {
                        const scenes = [...targetBeat.scenes];
                        scenes.splice(newOrder, 0, { ...movedScene, beatId: targetBeatId });
                        
                        // Transform: Extract scene IDs (backend expects string[], not Scene[])
                        await apiUpdateBeat(
                            screenplayId,
                            targetBeatId,
                            { scenes: scenes.map(s => s.id) },
                            getToken
                        );
                    }
                    
                    console.log('[ScreenplayContext] ✅ Updated beats (moved scene) in DynamoDB');
                } catch (error) {
                    console.error('[ScreenplayContext] Failed to update beats in DynamoDB:', error);
                }
            }
        }
    }, [beats, screenplayId, getToken]);
    
    // ========================================================================
    // CRUD - Characters
    // ========================================================================
    
    const createCharacter = useCallback(async (character: CreateInput<Character>): Promise<Character> => {
        const now = new Date().toISOString();
        const newCharacter: Character = {
            ...character,
            id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now
        };
        
        setCharacters(prev => [...prev, newCharacter]);
        
        // Add to relationships
        setRelationships(prev => ({
            ...prev,
            characters: {
                ...prev.characters,
                [newCharacter.id]: {
                    type: 'character',
                    appearsInScenes: [],
                    relatedBeats: []
                }
            }
        }));
        
        // Feature 0111 Phase 3: Create in DynamoDB
        if (screenplayId) {
            try {
                // Transform complex Character to simple API Character
                const apiChar = {
                    name: newCharacter.name,
                    description: newCharacter.description,
                    referenceImages: newCharacter.images?.map(img => img.imageUrl) || []
                };
                await apiCreateCharacter(screenplayId, apiChar, getToken);
                console.log('[ScreenplayContext] ✅ Created character in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to create character in DynamoDB:', error);
            }
        }
        
        return newCharacter;
    }, [screenplayId, getToken]);
    
    const updateCharacter = useCallback(async (id: string, updates: Partial<Character>) => {
        // 🔥 NEW: Optimistic UI update with rollback on error
        const previousCharacters = characters;
        
        // 1. Update local state immediately (optimistic UI)
        const updatedCharacters = characters.map(char => {
            if (char.id === id) {
                return { ...char, ...updates, updatedAt: new Date().toISOString() };
            }
            return char;
        });
        setCharacters(updatedCharacters);
        
        // 2. Save to DynamoDB through persistence manager
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Updating character in DynamoDB:', {
                    characterId: id,
                    totalCharacters: updatedCharacters.length,
                    updates
                });
                
                // 🔥 NEW: Use persistence manager (handles transformation internally)
                await persistenceManager.saveCharacters(updatedCharacters);
                
                console.log('[ScreenplayContext] ✅ Updated character in DynamoDB');
            } catch (error) {
                // 3. Rollback on error
                console.error('[ScreenplayContext] Failed to update character, rolling back:', error);
                setCharacters(previousCharacters);
                throw error; // Re-throw so UI knows it failed
            }
        }
    }, [screenplayId, characters]);
    
    const deleteCharacter = useCallback(async (id: string, cascade: CascadeOption): Promise<DeletionResult> => {
        if (cascade === 'cancel') {
            return {
                success: false,
                entityId: id,
                entityType: 'character',
                removedReferences: 0,
                error: 'Deletion cancelled'
            };
        }
        
        const character = characters.find(c => c.id === id);
        if (!character) {
            return {
                success: false,
                entityId: id,
                entityType: 'character',
                removedReferences: 0,
                error: 'Character not found'
            };
        }
        
        // Remove from all scenes
        const charRels = relationships.characters[id];
        const removedCount = charRels?.appearsInScenes.length || 0;
        
        // 🔥 SAVE ORIGINAL STATE FOR ROLLBACK
        const originalRelationships = relationships;
        
        setRelationships(prev => {
            const newRels = { ...prev };
            delete newRels.characters[id];
            
            // Remove from scene relationships
            for (const sceneId of charRels?.appearsInScenes || []) {
                if (newRels.scenes[sceneId]) {
                    newRels.scenes[sceneId].characters = newRels.scenes[sceneId].characters.filter(cId => cId !== id);
                }
            }
            
            return newRels;
        });
        
        // 🔥 OPTIMISTIC UPDATE: Remove from local state immediately
        const updatedCharacters = characters.filter(c => c.id !== id);
        setCharacters(updatedCharacters);
        
        // 🔥 FIX: Call individual DELETE endpoint for separate tables architecture
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Deleting character from DynamoDB:', id);
                
                // Call the DELETE endpoint for this specific character
                await apiDeleteCharacter(screenplayId, id, getToken);
                
                console.log('[ScreenplayContext] ✅ Deleted character from DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to delete character, rolling back:', error);
                // Rollback: restore the deleted character AND relationships
                setCharacters(characters);
                setRelationships(originalRelationships);
                throw error;
            }
        }
        
        return {
            success: true,
            entityId: id,
            entityType: 'character',
            removedReferences: removedCount
        };
    }, [characters, relationships, screenplayId, getToken]);
    
    const addCharacterToScene = useCallback(async (characterId: string, sceneId: string) => {
        setRelationships(prev => {
            const newRels = { ...prev };
            
            // Add to scene's characters
            if (!newRels.scenes[sceneId].characters.includes(characterId)) {
                newRels.scenes[sceneId].characters.push(characterId);
            }
            
            // Add to character's scenes
            if (!newRels.characters[characterId].appearsInScenes.includes(sceneId)) {
                newRels.characters[characterId].appearsInScenes.push(sceneId);
            }
            
            return newRels;
        });
        
        // Feature 0111 Phase 3: Update relationships in DynamoDB
        if (screenplayId) {
            try {
                const updatedRels = relationships;
                // Apply the local change to the copy
                if (!updatedRels.scenes[sceneId].characters.includes(characterId)) {
                    updatedRels.scenes[sceneId].characters.push(characterId);
                }
                if (!updatedRels.characters[characterId].appearsInScenes.includes(sceneId)) {
                    updatedRels.characters[characterId].appearsInScenes.push(sceneId);
                }
                
                await apiUpdateRelationships(screenplayId, updatedRels, getToken);
                console.log('[ScreenplayContext] ✅ Updated relationships in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update relationships in DynamoDB:', error);
            }
        }
    }, [relationships, screenplayId, getToken]);
    
    const removeCharacterFromScene = useCallback(async (characterId: string, sceneId: string) => {
        setRelationships(prev => {
            const newRels = { ...prev };
            
            // Remove from scene's characters
            newRels.scenes[sceneId].characters = newRels.scenes[sceneId].characters.filter(cId => cId !== characterId);
            
            // Remove from character's scenes
            newRels.characters[characterId].appearsInScenes = 
                newRels.characters[characterId].appearsInScenes.filter(sId => sId !== sceneId);
            
            return newRels;
        });
        
        // Feature 0111 Phase 3: Update relationships in DynamoDB
        if (screenplayId) {
            try {
                const updatedRels = { ...relationships };
                // Apply the local change
                updatedRels.scenes[sceneId].characters = updatedRels.scenes[sceneId].characters.filter(cId => cId !== characterId);
                updatedRels.characters[characterId].appearsInScenes = 
                    updatedRels.characters[characterId].appearsInScenes.filter(sId => sId !== sceneId);
                
                await apiUpdateRelationships(screenplayId, updatedRels, getToken);
                console.log('[ScreenplayContext] ✅ Updated relationships in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update relationships in DynamoDB:', error);
            }
        }
    }, [relationships, screenplayId, getToken]);
    
    // ========================================================================
    // CRUD - Locations
    // ========================================================================
    
    const createLocation = useCallback(async (location: CreateInput<Location>): Promise<Location> => {
        const now = new Date().toISOString();
        const newLocation: Location = {
            ...location,
            id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now
        };
        
        setLocations(prev => [...prev, newLocation]);
        
        // Add to relationships
        setRelationships(prev => ({
            ...prev,
            locations: {
                ...prev.locations,
                [newLocation.id]: {
                    type: 'location',
                    scenes: []
                }
            }
        }));
        
        // Feature 0111 Phase 3: Create in DynamoDB
        if (screenplayId) {
            try {
                // Transform complex Location to simple API Location
                const apiLoc = {
                    name: newLocation.name,
                    description: newLocation.description,
                    referenceImages: newLocation.images?.map(img => img.imageUrl) || []
                };
                await apiCreateLocation(screenplayId, apiLoc, getToken);
                console.log('[ScreenplayContext] ✅ Created location in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to create location in DynamoDB:', error);
            }
        }
        
        return newLocation;
    }, [screenplayId, getToken]);
    
    const updateLocation = useCallback(async (id: string, updates: Partial<Location>) => {
        // 🔥 NEW: Optimistic UI update with rollback on error
        const previousLocations = locations;
        
        // 1. Update local state immediately (optimistic UI)
        const updatedLocations = locations.map(loc => {
            if (loc.id === id) {
                return { ...loc, ...updates, updatedAt: new Date().toISOString() };
            }
            return loc;
        });
        setLocations(updatedLocations);
        
        // 2. Save to DynamoDB through persistence manager
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Updating location in DynamoDB:', {
                    locationId: id,
                    totalLocations: updatedLocations.length,
                    updates
                });
                
                // 🔥 NEW: Use persistence manager (handles transformation internally)
                await persistenceManager.saveLocations(updatedLocations);
                
                console.log('[ScreenplayContext] ✅ Updated location in DynamoDB');
            } catch (error) {
                // 3. Rollback on error
                console.error('[ScreenplayContext] Failed to update location, rolling back:', error);
                setLocations(previousLocations);
                throw error; // Re-throw so UI knows it failed
            }
        }
    }, [screenplayId, locations]);
    
    const deleteLocation = useCallback(async (id: string, cascade: CascadeOption): Promise<DeletionResult> => {
        if (cascade === 'cancel') {
            return {
                success: false,
                entityId: id,
                entityType: 'location',
                removedReferences: 0,
                error: 'Deletion cancelled'
            };
        }
        
        const location = locations.find(l => l.id === id);
        if (!location) {
            return {
                success: false,
                entityId: id,
                entityType: 'location',
                removedReferences: 0,
                error: 'Location not found'
            };
        }
        
        // Remove from all scenes
        const locRels = relationships.locations[id];
        const removedCount = locRels?.scenes.length || 0;
        
        // 🔥 SAVE ORIGINAL STATE FOR ROLLBACK
        const originalRelationships = relationships;
        
        setRelationships(prev => {
            const newRels = { ...prev };
            delete newRels.locations[id];
            
            // Remove from scene relationships
            for (const sceneId of locRels?.scenes || []) {
                if (newRels.scenes[sceneId]) {
                    newRels.scenes[sceneId].location = undefined;
                }
            }
            
            return newRels;
        });
        
        // 🔥 OPTIMISTIC UPDATE: Remove from local state immediately
        const updatedLocations = locations.filter(l => l.id !== id);
        setLocations(updatedLocations);
        
        // 🔥 FIX: Call individual DELETE endpoint for separate tables architecture
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Deleting location from DynamoDB:', id);
                
                // Call the DELETE endpoint for this specific location
                await apiDeleteLocation(screenplayId, id, getToken);
                
                console.log('[ScreenplayContext] ✅ Deleted location from DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to delete location, rolling back:', error);
                // Rollback: restore the deleted location AND relationships
                setLocations(locations);
                setRelationships(originalRelationships);
                throw error;
            }
        }
        
        return {
            success: true,
            entityId: id,
            entityType: 'location',
            removedReferences: removedCount
        };
    }, [locations, relationships, screenplayId, getToken]);
    
    const setSceneLocation = useCallback(async (sceneId: string, locationId: string) => {
        setRelationships(prev => {
            const newRels = { ...prev };
            
            // Set scene's location
            newRels.scenes[sceneId].location = locationId;
            
            // Add to location's scenes
            if (!newRels.locations[locationId].scenes.includes(sceneId)) {
                newRels.locations[locationId].scenes.push(sceneId);
            }
            
            return newRels;
        });
        
        // Feature 0111 Phase 3: Update relationships in DynamoDB
        if (screenplayId) {
            try {
                const updatedRels = { ...relationships };
                updatedRels.scenes[sceneId].location = locationId;
                if (!updatedRels.locations[locationId].scenes.includes(sceneId)) {
                    updatedRels.locations[locationId].scenes.push(sceneId);
                }
                
                await apiUpdateRelationships(screenplayId, updatedRels, getToken);
                console.log('[ScreenplayContext] ✅ Updated relationships in DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update relationships in DynamoDB:', error);
            }
        }
    }, [relationships, screenplayId, getToken]);
    
    // ========================================================================
    // Relationship Queries
    // ========================================================================
    
    const updateRelationships = useCallback(async () => {
        // This would rebuild relationships from scratch based on current data
        // Implementation would scan all scenes and rebuild the relationships object
        console.log('[ScreenplayContext] Updating relationships...');
    }, []);
    
    const getSceneCharacters = useCallback((sceneId: string): Character[] => {
        const sceneRels = relationships.scenes[sceneId];
        if (!sceneRels) return [];
        
        return sceneRels.characters
            .map(charId => characters.find(c => c.id === charId))
            .filter((c): c is Character => c !== undefined);
    }, [relationships, characters]);
    
    const getCharacterScenes = useCallback((characterId: string): Scene[] => {
        const charRels = relationships.characters[characterId];
        if (!charRels) return [];
        
        const allScenes = beats.flatMap(beat => beat.scenes);
        return charRels.appearsInScenes
            .map(sceneId => allScenes.find(s => s.id === sceneId))
            .filter((s): s is Scene => s !== undefined);
    }, [relationships, beats]);
    
    const getLocationScenes = useCallback((locationId: string): Scene[] => {
        const locRels = relationships.locations[locationId];
        if (!locRels) return [];
        
        const allScenes = beats.flatMap(beat => beat.scenes);
        return locRels.scenes
            .map(sceneId => allScenes.find(s => s.id === sceneId))
            .filter((s): s is Scene => s !== undefined);
    }, [relationships, beats]);
    
    // ========================================================================
    // Image Management
    // ========================================================================
    
    /**
     * Add an image to an entity (character, location, scene, or storybeat)
     * Calls backend API and updates local state
     */
    const addImageToEntity = useCallback(async (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string,
        imageUrl: string,
        metadata?: { prompt?: string; modelUsed?: string }
    ) => {
        try {
            // Call backend API to associate image (skip in dev if no token)
            const token = localStorage.getItem('auth_token');
            
            if (token) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/image/associate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        imageUrl,
                        entityType,
                        entityId,
                        metadata
                    })
                });
                
                if (!response.ok) {
                    console.warn('Failed to associate image with backend, storing locally only');
                }
            } else {
                console.log('[Dev Mode] Storing image locally (no auth token)');
            }
            
            // Update local state (works with or without backend)
            const newImage: ImageAsset = {
                imageUrl,
                createdAt: new Date().toISOString(),
                metadata
            };
            
            switch (entityType) {
                case 'character':
                    setCharacters(prev => prev.map(char =>
                        char.id === entityId
                            ? { ...char, images: [...(char.images || []), newImage] }
                            : char
                    ));
                    break;
                case 'location':
                    setLocations(prev => prev.map(loc =>
                        loc.id === entityId
                            ? { ...loc, images: [...(loc.images || []), newImage] }
                            : loc
                    ));
                    break;
                case 'scene':
                    setBeats(prev => prev.map(beat => ({
                        ...beat,
                        scenes: beat.scenes.map(scene =>
                            scene.id === entityId
                                ? { ...scene, images: [...(scene.images || []), newImage] }
                                : scene
                        )
                    })));
                    break;
                case 'storybeat':
                    setBeats(prev => prev.map(beat =>
                        beat.id === entityId
                            ? { ...beat, images: [...(beat.images || []), newImage] }
                            : beat
                    ));
                    break;
            }
            
            console.log(`[ScreenplayContext] Added image to ${entityType} ${entityId}`);
        } catch (error) {
            console.error('[ScreenplayContext] Error adding image:', error);
            throw error;
        }
    }, []);
    
    /**
     * Remove an image from an entity
     * Calls backend API and updates local state
     */
    const removeImageFromEntity = useCallback(async (
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string,
        imageIndex: number
    ) => {
        try {
            // Call backend API to remove image
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('Not authenticated');
            }
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/image/entity/${entityType}/${entityId}/${imageIndex}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to remove image');
            }
            
            // Update local state
            switch (entityType) {
                case 'character':
                    setCharacters(prev => prev.map(char =>
                        char.id === entityId && char.images
                            ? { ...char, images: char.images.filter((_, i) => i !== imageIndex) }
                            : char
                    ));
                    break;
                case 'location':
                    setLocations(prev => prev.map(loc =>
                        loc.id === entityId && loc.images
                            ? { ...loc, images: loc.images.filter((_, i) => i !== imageIndex) }
                            : loc
                    ));
                    break;
                case 'scene':
                    setBeats(prev => prev.map(beat => ({
                        ...beat,
                        scenes: beat.scenes.map(scene =>
                            scene.id === entityId && scene.images
                                ? { ...scene, images: scene.images.filter((_, i) => i !== imageIndex) }
                                : scene
                        )
                    })));
                    break;
                case 'storybeat':
                    setBeats(prev => prev.map(beat =>
                        beat.id === entityId && beat.images
                            ? { ...beat, images: beat.images.filter((_, i) => i !== imageIndex) }
                            : beat
                    ));
                    break;
            }
            
            console.log(`[ScreenplayContext] Removed image from ${entityType} ${entityId}`);
        } catch (error) {
            console.error('[ScreenplayContext] Error removing image:', error);
            throw error;
        }
    }, []);
    
    /**
     * Get all images for an entity
     * Returns images from local state
     */
    const getEntityImages = useCallback((
        entityType: 'character' | 'location' | 'scene' | 'storybeat',
        entityId: string
    ): ImageAsset[] => {
        let entity: Character | Location | Scene | StoryBeat | undefined;
        
        switch (entityType) {
            case 'character':
                entity = characters.find(c => c.id === entityId);
                break;
            case 'location':
                entity = locations.find(l => l.id === entityId);
                break;
            case 'scene':
                entity = beats.flatMap(b => b.scenes).find(s => s.id === entityId);
                break;
            case 'storybeat':
                entity = beats.find(b => b.id === entityId);
                break;
        }
        
        return entity?.images || [];
    }, [characters, locations, beats]);
    
    // ========================================================================
    // Bulk Import
    // ========================================================================
    
    const bulkImportCharacters = useCallback(async (
        characterNames: string[],
        descriptions?: Map<string, string>
    ): Promise<Character[]> => {
        console.log('[ScreenplayContext] 🔄 Starting bulk character import...', characterNames.length, 'characters');
        
        const now = new Date().toISOString();
        const newCharacters: Character[] = [];
        
        // 🔥 NEW: Get existing characters to check for duplicates
        const existingCharactersMap = new Map(
            characters.map(c => [c.name.toUpperCase(), c])
        );
        
        // Create new characters (skipping duplicates within the import batch)
        const seenNames = new Set<string>();
        
        for (const name of characterNames) {
            const upperName = name.toUpperCase();
            
            // Skip if we already processed this name in this import
            if (seenNames.has(upperName)) {
                console.log('[ScreenplayContext] Skipping duplicate in batch:', name);
                continue;
            }
            seenNames.add(upperName);
            
            // Check if character already exists
            const existing = existingCharactersMap.get(upperName);
            
            if (existing) {
                console.log('[ScreenplayContext] Character already exists, skipping:', name);
                continue; // Don't re-add existing characters
            } else {
                // Create new character
                const description = descriptions?.get(upperName) || `Imported from script`;
                
                const newCharacter: Character = {
                    id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    type: 'supporting',
                    description,
                    firstAppearance: undefined,
                    arcStatus: 'introduced',
                    customFields: [],
                    createdAt: now,
                    updatedAt: now,
                    images: []
                };
                
                console.log('[ScreenplayContext] Creating new character:', name);
                newCharacters.push(newCharacter);
            }
        }
        
        // 🔥 FIX: Merge with existing characters instead of replacing
        const allCharacters = [...characters, ...newCharacters];
        setCharacters(allCharacters);
        
        // Update relationships for new characters
        setRelationships(prev => {
            const updatedCharacters = { ...prev.characters };
            newCharacters.forEach(char => {
                if (!updatedCharacters[char.id]) {
                    updatedCharacters[char.id] = {
                        type: 'character',
                        appearsInScenes: [],
                        relatedBeats: []
                    };
                }
            });
            return {
                ...prev,
                characters: updatedCharacters
            };
        });
        
        // 🔥 NEW: Save ALL characters to DynamoDB through persistence manager
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Saving', allCharacters.length, 'characters to DynamoDB...');
                await persistenceManager.saveCharacters(allCharacters);
                console.log('[ScreenplayContext] ✅ Saved characters to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save characters:', error);
                throw error;
            }
        } else {
            console.warn('[ScreenplayContext] ⚠️ No screenplay_id yet - characters saved to local state only (will save when screenplay is created)');
        }
        
        console.log('[ScreenplayContext] ✅ Bulk import complete:', newCharacters.length, 'new characters,', allCharacters.length, 'total');
        return newCharacters;
    }, [characters, screenplayId]);
    
    const bulkImportLocations = useCallback(async (locationNames: string[]): Promise<Location[]> => {
        console.log('[ScreenplayContext] 🔄 Starting bulk location import...', locationNames.length, 'locations');
        
        const now = new Date().toISOString();
        const newLocations: Location[] = [];
        
        // 🔥 NEW: Get existing locations to check for duplicates
        // (BUT we'll replace ALL locations in DynamoDB at the end)
        const existingLocationsMap = new Map(
            locations.map(l => [l.name.toUpperCase(), l])
        );
        
        // Create new locations (skipping duplicates within the import batch)
        const seenNames = new Set<string>();
        
        for (const name of locationNames) {
            const upperName = name.toUpperCase();
            
            // Skip if we already processed this name in this import
            if (seenNames.has(upperName)) {
                console.log('[ScreenplayContext] Skipping duplicate in batch:', name);
                continue;
            }
            seenNames.add(upperName);
            
            // Check if location already exists
            const existing = existingLocationsMap.get(upperName);
            
            if (existing) {
                console.log('[ScreenplayContext] Location already exists, skipping:', name);
                continue; // Don't re-add existing locations
            } else {
                // Create new location
                const newLocation: Location = {
                    id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    description: `Imported from script`,
                    type: 'INT',
                    createdAt: now,
                    updatedAt: now,
                    images: []
                };
                
                console.log('[ScreenplayContext] Creating new location:', name);
                newLocations.push(newLocation);
            }
        }
        
        // 🔥 FIX: Merge with existing locations instead of replacing
        const allLocations = [...locations, ...newLocations];
        setLocations(allLocations);
        
        // Update relationships for new locations
        setRelationships(prev => {
            const updatedLocations = { ...prev.locations };
            newLocations.forEach(loc => {
                if (!updatedLocations[loc.id]) {
                    updatedLocations[loc.id] = {
                        type: 'location',
                        scenes: []
                    };
                }
            });
            return {
                ...prev,
                locations: updatedLocations
            };
        });
        
        // 🔥 NEW: Save ALL locations to DynamoDB through persistence manager
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Saving', allLocations.length, 'locations to DynamoDB...');
                await persistenceManager.saveLocations(allLocations);
                console.log('[ScreenplayContext] ✅ Saved locations to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save locations:', error);
                throw error;
            }
        } else {
            console.warn('[ScreenplayContext] ⚠️ No screenplay_id yet - locations saved to local state only (will save when screenplay is created)');
        }
        
        console.log('[ScreenplayContext] ✅ Bulk import complete:', newLocations.length, 'new locations,', allLocations.length, 'total');
        return newLocations;
    }, [locations, screenplayId]);
    
    const bulkImportScenes = useCallback(async (
        beatId: string, 
        scenes: Array<{
            heading: string;
            location: string;
            characterIds: string[];
            locationId?: string;
            startLine: number;
            endLine: number;
        }>
    ): Promise<Scene[]> => {
        const now = new Date().toISOString();
        const newScenes: Scene[] = [];
        
        // Create scenes
        scenes.forEach((sceneData, index) => {
            const newScene: Scene = {
                id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                beatId,
                number: index + 1,
                heading: sceneData.heading,
                synopsis: `Imported from script`,
                status: 'draft',
                order: index,
                fountain: {
                    startLine: sceneData.startLine,
                    endLine: sceneData.endLine,
                    tags: {
                        characters: sceneData.characterIds,
                        location: sceneData.locationId
                    }
                },
                createdAt: now,
                updatedAt: now
            };
            
            newScenes.push(newScene);
        });
        
        // Add scenes to beat (ensuring beat.scenes is initialized)
        setBeats(prev => prev.map(beat =>
            beat.id === beatId
                ? { ...beat, scenes: [...(beat.scenes || []), ...newScenes], updatedAt: now }
                : beat
        ));
        
        // Add to relationships
        setRelationships(prev => {
            const updatedScenes = { ...prev.scenes };
            const updatedCharacters = { ...prev.characters };
            const updatedLocations = { ...prev.locations };
            
            newScenes.forEach(scene => {
                // Create scene relationship
                updatedScenes[scene.id] = {
                    type: 'scene',
                    characters: scene.fountain.tags.characters,
                    location: scene.fountain.tags.location,
                    storyBeat: beatId
                };
                
                // Link characters to scene
                scene.fountain.tags.characters.forEach(charId => {
                    if (updatedCharacters[charId]) {
                        if (!updatedCharacters[charId].appearsInScenes.includes(scene.id)) {
                            updatedCharacters[charId].appearsInScenes.push(scene.id);
                        }
                    }
                });
                
                // Link location to scene
                if (scene.fountain.tags.location && updatedLocations[scene.fountain.tags.location]) {
                    if (!updatedLocations[scene.fountain.tags.location].scenes.includes(scene.id)) {
                        updatedLocations[scene.fountain.tags.location].scenes.push(scene.id);
                    }
                }
            });
            
            return {
                ...prev,
                scenes: updatedScenes,
                characters: updatedCharacters,
                locations: updatedLocations
            };
        });
        
        // Note: Beats will be saved to DynamoDB in bulk after all imports complete
        // Each bulkImportScenes call updates local state, but we save once at the end
        
        return newScenes;
    }, [beats, screenplayId, getToken]);
    
    // Helper: Save all beats to DynamoDB (called after bulk imports complete)
    const saveBeatsToDynamoDB = useCallback(async () => {
        if (!screenplayId || beats.length === 0) return;
        
        try {
            console.log('[ScreenplayContext] Saving', beats.length, 'beats to DynamoDB...');
            
            // 🔥 NEW: Use persistence manager
            await persistenceManager.saveBeats(beats);
            
            console.log('[ScreenplayContext] ✅ Saved', beats.length, 'beats to DynamoDB');
        } catch (err) {
            console.error('[ScreenplayContext] Failed to save beats to DynamoDB:', err);
        }
    }, [beats, screenplayId]);
    
    // 🔥 FIXED: Save ALL structure to DynamoDB (NO CLOSURE ISSUES!)
    // Accepts data as parameters instead of relying on closure/dependency array
    const saveAllToDynamoDBDirect = useCallback(async (
        beatsToSave: StoryBeat[],
        charactersToSave: Character[],
        locationsToSave: Location[],
        screenplayIdToUse: string
    ) => {
        if (!screenplayIdToUse) {
            console.warn('[ScreenplayContext] Cannot save: no screenplay_id provided');
            return;
        }
        
        try {
            console.log('[ScreenplayContext] 💾 Saving ALL structure to DynamoDB for:', screenplayIdToUse);
            console.log('[ScreenplayContext] 🔍 Data to save:', {
                beats: beatsToSave.length,
                characters: charactersToSave.length,
                locations: locationsToSave.length
            });
            
            // Set the screenplay ID
            persistenceManager.setScreenplay(screenplayIdToUse, getToken);
            
            // Save everything at once
            await persistenceManager.saveAll({
                beats: beatsToSave,
                characters: charactersToSave,
                locations: locationsToSave
            });
            
            console.log('[ScreenplayContext] ✅ Saved ALL structure:', {
                screenplay_id: screenplayIdToUse,
                beats: beatsToSave.length,
                characters: charactersToSave.length,
                locations: locationsToSave.length
            });
        } catch (err) {
            console.error('[ScreenplayContext] Failed to save all to DynamoDB:', err);
            throw err;
        }
    }, [getToken]);
    
    // ========================================================================
    // Scene Position Management
    // ========================================================================
    
    const updateScenePositions = useCallback(async (content: string): Promise<void> => {
        console.log('[ScreenplayContext] Updating scene positions from content');
        
        // Import stripTagsForDisplay to ensure we use the same content the editor displays
        const { stripTagsForDisplay } = await import('@/utils/fountain');
        const displayContent = stripTagsForDisplay(content);
        
        // Parse content to find scene headings with their positions (in order)
        const lines = displayContent.split('\n');
        const scenesInOrder: Array<{ heading: string; startLine: number; endLine: number }> = [];
        
        let currentSceneHeading: string | null = null;
        let currentStartLine = 0;
        
        // Detect scene headings and track their positions
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if this is a scene heading
            const isSceneHeading = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(line);
            
            if (isSceneHeading) {
                // Save the previous scene's end line
                if (currentSceneHeading) {
                    scenesInOrder.push({
                        heading: currentSceneHeading,
                        startLine: currentStartLine,
                        endLine: i - 1
                    });
                }
                
                // Start tracking new scene
                currentSceneHeading = line;
                currentStartLine = i;
            }
        }
        
        // Save the last scene
        if (currentSceneHeading) {
            scenesInOrder.push({
                heading: currentSceneHeading,
                startLine: currentStartLine,
                endLine: lines.length - 1
            });
        }
        
        console.log('[ScreenplayContext] Found', scenesInOrder.length, 'scenes in stripped content (in order)');
        
        // Update scenes by matching them to the scenes in order
        // Collect all scenes from all beats in order
        const allScenesFlat: Array<{ scene: Scene; beatId: string }> = [];
        beats.forEach(beat => {
            beat.scenes.forEach(scene => {
                allScenesFlat.push({ scene, beatId: beat.id });
            });
        });
        
        // Sort by scene number to match the order they appear in content
        allScenesFlat.sort((a, b) => (a.scene.number || 0) - (b.scene.number || 0));
        
        console.log('[ScreenplayContext] Matching', allScenesFlat.length, 'database scenes to', scenesInOrder.length, 'content scenes');
        
        // Match scenes by order and heading similarity
        const updates = new Map<string, { beatId: string; updates: Partial<Scene> }>();
        
        allScenesFlat.forEach((item, index) => {
            if (index < scenesInOrder.length) {
                const contentScene = scenesInOrder[index];
                // Check if headings match (approximately)
                if (item.scene.heading.toUpperCase().trim() === contentScene.heading.toUpperCase().trim()) {
                    console.log(`[ScreenplayContext] Scene ${index + 1}: "${item.scene.heading}" -> lines ${contentScene.startLine}-${contentScene.endLine}`);
                    updates.set(item.scene.id, {
                        beatId: item.beatId,
                        updates: {
                            fountain: {
                                ...item.scene.fountain,
                                startLine: contentScene.startLine,
                                endLine: contentScene.endLine
                            }
                        }
                    });
                } else {
                    console.warn(`[ScreenplayContext] Heading mismatch at position ${index}: DB="${item.scene.heading}" vs Content="${contentScene.heading}"`);
                }
            }
        });
        
        // Apply updates
        setBeats(prev => prev.map(beat => ({
            ...beat,
            scenes: beat.scenes.map(scene => {
                const update = updates.get(scene.id);
                if (update && update.beatId === beat.id) {
                    return { ...scene, ...update.updates };
                }
                return scene;
            })
        })));
        
        console.log('[ScreenplayContext] Scene positions updated -', updates.size, 'scenes updated');
    }, [beats]);
    
    // ========================================================================
    // Clear All Data (Editor Source of Truth)
    // ========================================================================
    
    const clearAllData = useCallback(async () => {
        console.log('[ScreenplayContext] 🗑️ Clearing ALL screenplay data (COMPLETE RESET)...');
        
        // 🔥 NEW: Use persistence manager to clear everything from DynamoDB
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Clearing ALL structural data from DynamoDB...');
                
                // Use persistence manager's clearAll method
                await persistenceManager.clearAll();
                
                console.log('[ScreenplayContext] ✅ Cleared EVERYTHING from DynamoDB (text, beats, characters, locations)');
            } catch (err) {
                console.error('[ScreenplayContext] Failed to clear from DynamoDB:', err);
                throw err; // Re-throw so toolbar shows error
            }
        }
        
        // Now clear local state COMPLETELY
        setBeats([]); // 🔥 CRITICAL: Clear ALL beats, not just their scenes!
        setCharacters([]);
        setLocations([]);
        setRelationships({
            characters: {},
            locations: {},
            scenes: {},
            props: {}
        });
        
        // 🔥 CRITICAL FIX: Reset BOTH flags to allow re-initialization
        // This allows the effect to run again and create fresh 8 beats
        hasAutoCreated.current = false;
        hasInitializedRef.current = false; // Reset initialization tracking
        
        // 🔥 REMOVED: No longer using localStorage for persistence
        // localStorage is being phased out - DynamoDB is single source of truth
        
        console.log('[ScreenplayContext] ✅ ALL data cleared from DynamoDB + local state (COMPLETE RESET)');
        console.log('[ScreenplayContext] 🔓 Reset flags - will create fresh 8-sequence structure on next initialization');
    }, [screenplayId]);
    
    // ========================================================================
    // Get Current State (No Closure Issues)
    // ========================================================================
    
    const getCurrentState = useCallback(() => {
        return {
            beats: beatsRef.current,
            characters: charactersRef.current,
            locations: locationsRef.current
        };
    }, []); // No dependencies - always returns current ref values!
    
    // ========================================================================
    // Context Value
    // ========================================================================
    
    const value: ScreenplayContextType = {
        // State
        beats,
        characters,
        locations,
        relationships,
        isLoading,
        hasInitializedFromDynamoDB,
        error,
        
        // Feature 0111 Phase 3: DynamoDB screenplay tracking
        screenplayId,
        
        // Story Beats
        createBeat,
        updateBeat,
        deleteBeat,
        
        // Scenes
        createScene,
        updateScene,
        deleteScene,
        moveScene,
        
        // Characters
        createCharacter,
        updateCharacter,
        deleteCharacter,
        addCharacterToScene,
        removeCharacterFromScene,
        
        // Locations
        createLocation,
        updateLocation,
        deleteLocation,
        setSceneLocation,
        
        // Bulk Import
        bulkImportCharacters,
        bulkImportLocations,
        bulkImportScenes,
        saveBeatsToDynamoDB, // Save beats after all imports complete
        saveAllToDynamoDBDirect, // 🔥 NEW: Save ALL structure (NO CLOSURE ISSUES!)
        getCurrentState, // 🔥 NEW: Get current state without closure issues
        
        // Scene Position Management
        updateScenePositions,
        
        // Relationships
        updateRelationships,
        getSceneCharacters,
        getCharacterScenes,
        getLocationScenes,
        
        // Image Management
        addImageToEntity,
        removeImageFromEntity,
        getEntityImages,
        
        // Clear all data
        clearAllData
    };
    
    return (
        <ScreenplayContext.Provider value={value}>
            {children}
        </ScreenplayContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useScreenplay() {
    const context = useContext(ScreenplayContext);
    if (!context) {
        throw new Error('useScreenplay must be used within a ScreenplayProvider');
    }
    return context;
}

