'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
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
    bulkCreateCharacters,
    deleteAllCharacters,
    listLocations,
    createLocation as apiCreateLocation,
    updateLocation as apiUpdateLocation,
    deleteLocation as apiDeleteLocation,
    bulkCreateLocations,
    deleteAllLocations,
    listScenes,
    bulkCreateScenes,
    deleteScene as apiDeleteScene,
    deleteAllScenes,
    // Feature 0117: Beat API functions removed - beats are frontend-only UI templates
    updateRelationships as apiUpdateRelationships,
    updateScreenplay as apiUpdateScreenplay
} from '@/utils/screenplayStorage';
import {
    updateScriptTags
} from '@/utils/fountainTags';
import { parseContentForImport } from '@/utils/fountainAutoImport';

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
    
    // Feature 0117: Beat CRUD removed - beats are frontend-only UI templates
    
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
    bulkImportCharacters: (characterNames: string[], descriptions?: Map<string, string>, explicitScreenplayId?: string) => Promise<Character[]>;
    bulkImportLocations: (locationNames: string[], explicitScreenplayId?: string) => Promise<Location[]>;
    bulkImportScenes: (beatId: string, scenes: Array<{
        heading: string;
        location: string;
        characterIds: string[];
        locationId?: string;
        startLine: number;
        endLine: number;
    }>) => Promise<Scene[]>;
    // Feature 0117: saveBeatsToDynamoDB removed - beats are frontend-only
    saveScenes: (scenes: Scene[], explicitScreenplayId?: string) => Promise<void>; // Feature 0117: Save scenes to separate table
    
    // 🔥 NEW: Get current state without closure issues
    getCurrentState: () => {
        beats: StoryBeat[];
        characters: Character[];
        locations: Location[];
    };
    
    // 🔥 NEW: Direct state setters for optimistic UI updates
    setBeats?: (beats: StoryBeat[]) => void;
    setCharacters?: (characters: Character[]) => void;
    setLocations?: (locations: Location[]) => void;
    groupScenesIntoBeats?: (scenes: Scene[], beats: StoryBeat[]) => StoryBeat[];
    
    // Feature 0117: clearAllStructure, saveAllToDynamoDBDirect, repairOrphanedScenes removed
    clearContentOnly: () => Promise<StoryBeat[]>;  // 🔥 Returns fresh beats (frontend template only)
    
    // Re-scan script for NEW entities only (smart merge for additive re-scan)
    rescanScript: (content: string) => Promise<{ newCharacters: number; newLocations: number; }>;
    
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
    useEffect(() => { 
        charactersRef.current = characters; 
        console.log('[ScreenplayContext] 🔄 Characters state updated:', characters.length);
        if (typeof window !== 'undefined') {
            (window as any).__debug_characters = characters;
        }
    }, [characters]);
    useEffect(() => { 
        locationsRef.current = locations; 
        console.log('[ScreenplayContext] 🔄 Locations state updated:', locations.length);
        if (typeof window !== 'undefined') {
            (window as any).__debug_locations = locations;
        }
    }, [locations]);
    
    // Relationships - START WITH EMPTY STATE
    // 🔥 CRITICAL FIX: Do NOT load from localStorage on mount - DynamoDB is source of truth
    const [relationships, setRelationships] = useState<Relationships>({
        beats: {},
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
    // Feature 0117: Data Transformation Helpers
    // Simple transformations between frontend and API formats
    // ========================================================================
    
    const transformScenesToAPI = useCallback((scenes: Scene[]): any[] => {
        return scenes.map(scene => ({
            number: scene.number,
            heading: scene.heading,
            synopsis: scene.synopsis,
            status: scene.status,
            order: scene.order,
            group_label: scene.group_label,
            fountain: scene.fountain,
            estimatedPageCount: scene.estimatedPageCount,
            images: scene.images,
            videoAssets: scene.videoAssets,
            timing: scene.timing
        }));
    }, []);
    
    const transformScenesFromAPI = useCallback((apiScenes: any[]): Scene[] => {
        return apiScenes.map(scene => {
            const fountain = scene.fountain || {};
            const tags = fountain.tags || {};
            
            return {
                id: scene.id || scene.scene_id,
                number: scene.number,
                heading: scene.heading || '',
                synopsis: scene.synopsis || '',
                status: scene.status || 'draft',
                order: scene.order || 0,
                group_label: scene.group_label,
                fountain: {
                    startLine: fountain.startLine || 0,
                    endLine: fountain.endLine || 0,
                    tags: {
                        characters: tags.characters || [],
                        location: tags.location || undefined,
                        props: tags.props || undefined
                    }
                },
                estimatedPageCount: scene.estimatedPageCount,
                images: scene.images || [],
                videoAssets: scene.videoAssets || [],
                timing: scene.timing,
                createdAt: scene.created_at || new Date().toISOString(),
                updatedAt: scene.updated_at || new Date().toISOString()
            };
        });
    }, []);
    
    const transformCharactersToAPI = useCallback((characters: Character[]): any[] => {
        return characters.map(char => ({
            id: char.id,  // Frontend uses 'id', backend will map to 'character_id'
            name: char.name,
            description: char.description,
            referenceImages: char.images?.map(img => img.imageUrl) || []
        }));
    }, []);
    
    const transformCharactersFromAPI = useCallback((apiCharacters: any[]): Character[] => {
        return apiCharacters.map(char => ({
            id: char.id || char.character_id,
            name: char.name || '',
            description: char.description || '',
            type: 'primary' as CharacterType,
            arcStatus: 'unassigned' as ArcStatus,
            images: (char.referenceImages || []).map((url: string) => ({
                imageUrl: url,
                description: ''
            })),
            customFields: [],
            createdAt: char.created_at || new Date().toISOString(),
            updatedAt: char.updated_at || new Date().toISOString()
        }));
    }, []);
    
    const transformLocationsToAPI = useCallback((locations: Location[]): any[] => {
        return locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            description: loc.description,
            referenceImages: loc.images?.map(img => img.imageUrl) || []
        }));
    }, []);
    
    const transformLocationsFromAPI = useCallback((apiLocations: any[]): Location[] => {
        return apiLocations.map(loc => ({
            id: loc.id || loc.location_id,
            name: loc.name || '',
            description: loc.description || '',
            type: 'interior' as LocationType,
            images: (loc.referenceImages || []).map((url: string) => ({
                imageUrl: url,
                description: ''
            })),
            customFields: [],
            createdAt: loc.created_at || new Date().toISOString(),
            updatedAt: loc.updated_at || new Date().toISOString()
        }));
    }, []);
    
    // Helper to create default 8-sequence beats (frontend-only UI template)
    const createDefaultBeats = useCallback((): StoryBeat[] => {
        const beatTemplates = [
            { title: 'Opening Image', description: 'Set the tone and world' },
            { title: 'Setup', description: 'Introduce characters and status quo' },
            { title: 'Catalyst', description: 'Inciting incident' },
            { title: 'Debate', description: 'Should they go on this journey?' },
            { title: 'Break into Two', description: 'Commit to the journey' },
            { title: 'Fun and Games', description: 'Promise of the premise' },
            { title: 'Midpoint', description: 'Raise the stakes' },
            { title: 'All Is Lost', description: 'Lowest point' }
        ];
        
        return beatTemplates.map((template, index) => ({
            id: `beat-${Date.now()}-${index}`,
            title: template.title,
            description: template.description,
            order: index,
            scenes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
    }, []);
    
    // Helper to group scenes into beats based on group_label or order
    const groupScenesIntoBeats = useCallback((scenes: Scene[], beats: StoryBeat[]): StoryBeat[] => {
        const beatMap = new Map(beats.map(b => [b.title.toUpperCase(), b]));
        const updatedBeats = beats.map(b => ({ ...b, scenes: [] as Scene[] }));
        const orphanedScenes: Scene[] = [];
        
        scenes.forEach(scene => {
            if (scene.group_label) {
                const beat = beatMap.get(scene.group_label.toUpperCase());
                if (beat) {
                    const index = beats.findIndex(b => b.id === beat.id);
                    if (index !== -1) {
                        updatedBeats[index].scenes.push(scene);
                        return;
                    }
                }
            }
            orphanedScenes.push(scene);
        });
        
        // Distribute orphaned scenes evenly across beats
        if (orphanedScenes.length > 0) {
            const scenesPerBeat = Math.ceil(orphanedScenes.length / updatedBeats.length);
            orphanedScenes.forEach((scene, index) => {
                const beatIndex = Math.floor(index / scenesPerBeat);
                if (beatIndex < updatedBeats.length) {
                    updatedBeats[beatIndex].scenes.push(scene);
                }
            });
        }
        
        return updatedBeats;
    }, []);
    
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
            // Feature 0117: Load directly from DynamoDB API functions
            if (screenplayId) {
                try {
                    console.log('[ScreenplayContext] 🔄 Loading structure from DynamoDB for:', screenplayId);
                    
                    // Load scenes, characters, and locations in parallel
                    const [scenesData, charactersData, locationsData] = await Promise.all([
                        listScenes(screenplayId, getToken),
                        listCharacters(screenplayId, getToken),
                        listLocations(screenplayId, getToken)
                    ]);
                    
                    console.log('[ScreenplayContext] 📦 Raw API response:', {
                        scenes: scenesData.length,
                        characters: charactersData.length,
                        locations: locationsData.length
                    });
                    
                    // Transform API data to frontend format
                    const transformedScenes = transformScenesFromAPI(scenesData);
                    
                    // Feature 0117: Generate beats from scenes (frontend-only grouping)
                    const defaultBeats = createDefaultBeats();
                    const beatsWithScenes = groupScenesIntoBeats(transformedScenes, defaultBeats);
                    
                    setBeats(beatsWithScenes);
                    console.log('[ScreenplayContext] ✅ Generated', beatsWithScenes.length, 'beats with', transformedScenes.length, 'total scenes');
                    console.log('[ScreenplayContext] 🔍 Beat details:', beatsWithScenes.map(b => ({ 
                        id: b.id, 
                        title: b.title, 
                        scenesCount: b.scenes?.length || 0
                    })));
                    
                    // Mark that we loaded beats from DB (even if 0) to prevent auto-creation
                    if (beatsWithScenes.length > 0) {
                        hasAutoCreated.current = true;
                    }
                    
                    // Transform and set characters
                    const transformedCharacters = transformCharactersFromAPI(charactersData);
                    setCharacters(transformedCharacters);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedCharacters.length, 'characters from DynamoDB');
                    console.log('[ScreenplayContext] 🔍 Character names:', transformedCharacters.map(c => c.name));
                    
                    // Transform and set locations
                    const transformedLocations = transformLocationsFromAPI(locationsData);
                    setLocations(transformedLocations);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedLocations.length, 'locations from DynamoDB');
                    console.log('[ScreenplayContext] 🔍 Location names:', transformedLocations.map(l => l.name));
                    
                    // 🔥 CRITICAL: Check if we need to create default beats AFTER loading
                    if (beatsWithScenes.length === 0 && !hasAutoCreated.current) {
                        console.log('[ScreenplayContext] 🏗️ Creating default 8-sequence structure for screenplay:', screenplayId);
                        const freshBeats = createDefaultBeats();
                        setBeats(freshBeats);
                        hasAutoCreated.current = true;
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
                
                // Feature 0117: For new screenplays (no ID yet), create default beats immediately
                if (!hasAutoCreated.current) {
                    console.log('[ScreenplayContext] 🏗️ Creating default 8-sequence structure (no screenplay ID yet)');
                    const freshBeats = createDefaultBeats();
                    setBeats(freshBeats);
                    hasAutoCreated.current = true;
                } else {
                    console.log('[ScreenplayContext] ⏭️ Skipping beat creation - already created');
                }
            }
        }
        
        initializeData();
    }, [screenplayId, transformScenesFromAPI, transformCharactersFromAPI, transformLocationsFromAPI, createDefaultBeats, groupScenesIntoBeats, getToken]);
    
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
    
    // Feature 0117: Beat CRUD functions removed - beats are frontend-only UI templates
    
    // ========================================================================
    // CRUD - Scenes
    // ========================================================================
    
    const createScene = useCallback(async (beatId: string, scene: CreateInput<Scene>): Promise<Scene> => {
        const now = new Date().toISOString();
        // Feature 0117: Removed beatId from Scene object - scenes are standalone entities
        const newScene: Scene = {
            ...scene,
            id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: now,
            updatedAt: now
        };
        
        // Add to beat (frontend grouping only)
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
        // Feature 0117: Save scene directly to DynamoDB (beats don't persist)
        if (screenplayId) {
            try {
                // Find the updated beat
                const updatedBeat = beats.find(b => b.id === beatId);
                if (updatedBeat) {
                    // Feature 0117: Save the new scene to wryda-scenes table directly
                    const apiScene = transformScenesToAPI([newScene]);
                    await bulkCreateScenes(screenplayId, apiScene, getToken);
                    console.log('[ScreenplayContext] ✅ Saved new scene to DynamoDB');
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save scene to DynamoDB:', error);
            }
        }
        
        return newScene;
    }, [beats, screenplayId]);
    
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
                    const updatedScene = parentBeat.scenes.find(s => s.id === id);
                    if (updatedScene) {
                        const sceneWithUpdates = { ...updatedScene, ...updates, updatedAt: now };
                        // Feature 0117: Save updated scene directly (beats don't persist)
                        const apiScene = transformScenesToAPI([sceneWithUpdates]);
                        await bulkCreateScenes(screenplayId, apiScene, getToken);
                        console.log('[ScreenplayContext] ✅ Updated scene in DynamoDB');
                    }
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update scene in DynamoDB:', error);
            }
        }
    }, [beats, screenplayId]);
    
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
        
        // Feature 0117: Delete scene from DynamoDB
        if (screenplayId && deletedScene) {
            try {
                // Delete the scene directly from wryda-scenes table
                const { deleteScene: apiDeleteScene } = await import('@/utils/screenplayStorage');
                await apiDeleteScene(screenplayId, id, getToken);
                console.log('[ScreenplayContext] ✅ Deleted scene from DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to delete scene from DynamoDB:', error);
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
                    // Feature 0117: No beatId on Scene object
                    scenes.splice(newOrder, 0, { ...movedScene! });
                    return { ...beat, scenes };
                }
                return beat;
            }));
            
            // Feature 0111 Phase 3: Update both beats in DynamoDB (scene moved)
            // Feature 0117: No need to update beats in DynamoDB (frontend grouping only)
            // Scenes are standalone entities, just update the moved scene if needed
            if (screenplayId && movedScene) {
                try {
                    // Save the moved scene with updated order if needed
                    const apiScene = transformScenesToAPI([movedScene]);
                    await bulkCreateScenes(screenplayId, apiScene, getToken);
                    console.log('[ScreenplayContext] ✅ Saved moved scene to DynamoDB');
                } catch (error) {
                    console.error('[ScreenplayContext] Failed to save moved scene:', error);
                }
            }
        }
    }, [beats, screenplayId]);
    
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
                
                // Feature 0117: Save characters directly to wryda-characters table
                const apiCharacters = transformCharactersToAPI(updatedCharacters);
                await bulkCreateCharacters(screenplayId, apiCharacters, getToken);
                
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
                
                // Feature 0117: Save locations directly to wryda-locations table
                const apiLocations = transformLocationsToAPI(updatedLocations);
                await bulkCreateLocations(screenplayId, apiLocations, getToken);
                
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
        descriptions?: Map<string, string>,
        explicitScreenplayId?: string
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
        // Feature 0117: Accept explicit screenplay ID to avoid race conditions
        const idToUse = explicitScreenplayId || screenplayId;
        if (idToUse) {
            try {
                console.log('[ScreenplayContext] Saving', allCharacters.length, 'characters to DynamoDB...');
                const apiCharacters = transformCharactersToAPI(allCharacters);
                await bulkCreateCharacters(idToUse, apiCharacters, getToken);
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
    
    const bulkImportLocations = useCallback(async (locationNames: string[], explicitScreenplayId?: string): Promise<Location[]> => {
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
        // Feature 0117: Accept explicit screenplay ID to avoid race conditions
        const idToUse = explicitScreenplayId || screenplayId;
        if (idToUse) {
            try {
                console.log('[ScreenplayContext] Saving', allLocations.length, 'locations to DynamoDB...');
                const apiLocations = transformLocationsToAPI(allLocations);
                await bulkCreateLocations(idToUse, apiLocations, getToken);
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
            // Feature 0117: Removed beatId from Scene object
            const newScene: Scene = {
                id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
                    characters: scene.fountain.tags.characters || [],
                    location: scene.fountain.tags.location,
                    storyBeat: beatId
                };
                
                // Link characters to scene (defensive - ensure array exists)
                const sceneCharacters = scene.fountain.tags.characters || [];
                sceneCharacters.forEach(charId => {
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
    
    // Feature 0117: saveBeatsToDynamoDB removed - beats are frontend-only UI templates
    // Kept for backward compatibility but does nothing
    const saveBeatsToDynamoDB = useCallback(async () => {
        console.log('[ScreenplayContext] ℹ️ saveBeatsToDynamoDB called but beats are frontend-only (no persistence)');
        // No-op: beats don't persist to DynamoDB anymore
    }, []);
    
    /**
     * Feature 0117: Save scenes to separate wryda-scenes table
     * Extracts all scenes from all beats and saves them to DynamoDB
     * @param scenes - Array of scenes to save
     * @param explicitScreenplayId - Optional screenplay ID to use (for race condition fixes)
     */
    const saveScenes = useCallback(async (scenes: Scene[], explicitScreenplayId?: string): Promise<void> => {
        const idToUse = explicitScreenplayId || screenplayId;
        if (!idToUse) {
            console.warn('[ScreenplayContext] Cannot save scenes: no screenplay_id');
            return;
        }
        
        console.log('[ScreenplayContext] 💾 Saving', scenes.length, 'scenes to wryda-scenes table...');
        
        try {
            const apiScenes = transformScenesToAPI(scenes);
            await bulkCreateScenes(idToUse, apiScenes, getToken);
            console.log('[ScreenplayContext] ✅ Saved', scenes.length, 'scenes');
        } catch (err) {
            console.error('[ScreenplayContext] ❌ Failed to save scenes:', err);
            throw err;
        }
    }, [screenplayId, transformScenesToAPI, getToken]);
    
    // Feature 0117: saveAllToDynamoDBDirect removed - use saveScenes() instead
    
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
        // Feature 0117: beatId is for tracking which beat the scene belongs to (frontend grouping)
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
                        beatId: item.beatId,  // Track which beat this scene belongs to
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
                if (update && update.beatId === beat.id) {  // Ensure scene belongs to this beat
                    return { ...scene, ...update.updates };
                }
                return scene;
            })
        })));
        
        console.log('[ScreenplayContext] Scene positions updated -', updates.size, 'scenes updated');
    }, [beats]);
    
    // ========================================================================
    // Clear All Structure (Destructive Import Support)
    // ========================================================================
    
    // Feature 0117: clearAllStructure removed - direct API calls only
    
    // ========================================================================
    // Clear Content Only (For Imports - Preserve 8-Beat Structure)
    // ========================================================================
    
    /**
     * Clear characters, locations, and scenes FROM beats
     * But KEEP the 8-beat structure intact
     * 
     * Use this for script imports where you want to:
     * - Replace characters/locations with new ones
     * - Clear scenes from beats and reimport them
     * - But preserve the permanent 8-beat column structure
     * 
     * Use clearAllStructure() for "Clear All" button (nuclear option)
     */
    // Feature 0117: Simplified clearContentOnly - just reset local state to defaults
    // Beats are frontend-only templates, no DynamoDB operations needed
    const clearContentOnly = useCallback(async (): Promise<StoryBeat[]> => {
        console.log('[ScreenplayContext] 🧹 Clearing content ONLY (preserving beat template structure)...');
        
        // Create default 8-beat template (frontend-only)
        const sequences = [
            { title: 'Setup', description: '', order: 0 },
            { title: 'Inciting Incident', description: '', order: 1 },
            { title: 'First Plot Point', description: '', order: 2 },
            { title: 'First Pinch Point', description: '', order: 3 },
            { title: 'Midpoint', description: '', order: 4 },
            { title: 'Second Pinch Point', description: '', order: 5 },
            { title: 'Second Plot Point', description: '', order: 6 },
            { title: 'Resolution', description: '', order: 7 }
        ];
        
        const now = new Date().toISOString();
        const freshBeats = sequences.map((seq, index) => ({
            id: `beat-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            title: seq.title,
            description: seq.description,
            order: seq.order,
            scenes: [],
            createdAt: now,
            updatedAt: now
        }));
        
        // Reset local state
        setBeats(freshBeats);
        setCharacters([]);
        setLocations([]);
        setRelationships({
            beats: {},
            characters: {},
            locations: {},
            scenes: {},
            props: {}
        });
        
        console.log('[ScreenplayContext] ✅ Reset to default beat template');
        return freshBeats;
    }, []);
    
    // Feature 0117: repairOrphanedScenes removed - no orphaned scenes possible with simplified architecture
    
    // ========================================================================
    // Re-scan Script (Additive Import Support)
    // ========================================================================
    
    /**
     * Re-scan script content for NEW entities only (smart merge).
     * Compares parsed content against existing data and only imports what's missing.
     * Used for additive re-scan - keeps existing data, adds only new items.
     */
    const rescanScript = useCallback(async (content: string) => {
        console.log('[ScreenplayContext] 🔍 Re-scanning script for new entities...');
        
        try {
            // Parse the content
            const parseResult = parseContentForImport(content);
            
            console.log('[ScreenplayContext] Parsed content:', {
                characters: parseResult.characters.size,
                locations: parseResult.locations.size,
                scenes: parseResult.scenes.length
            });
            
            // Find NEW characters (case-insensitive comparison)
            const existingCharNames = new Set(
                characters.map(c => c.name.toUpperCase())
            );
            const newCharacterNames = Array.from(parseResult.characters)
                .filter((name: string) => !existingCharNames.has(name.toUpperCase()));
            
            // Find NEW locations (case-insensitive comparison)
            const existingLocNames = new Set(
                locations.map(l => l.name.toUpperCase())
            );
            const newLocationNames = Array.from(parseResult.locations)
                .filter((name: string) => !existingLocNames.has(name.toUpperCase()));
            
            console.log('[ScreenplayContext] Found new entities:', {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length
            });
            
            // Import only NEW entities
            if (newCharacterNames.length > 0) {
                console.log('[ScreenplayContext] Importing', newCharacterNames.length, 'new characters:', newCharacterNames);
                await bulkImportCharacters(newCharacterNames, parseResult.characterDescriptions);
            }
            
            if (newLocationNames.length > 0) {
                console.log('[ScreenplayContext] Importing', newLocationNames.length, 'new locations:', newLocationNames);
                await bulkImportLocations(newLocationNames);
            }
            
            console.log('[ScreenplayContext] ✅ Re-scan complete');
            
            return {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length
            };
        } catch (err) {
            console.error('[ScreenplayContext] ❌ Re-scan failed:', err);
            throw err;
        }
    }, [characters, locations, bulkImportCharacters, bulkImportLocations]);
    
    // ========================================================================
    // Clear All Data (Editor Source of Truth)
    // ========================================================================
    
    const clearAllData = useCallback(async () => {
        console.log('[ScreenplayContext] 🗑️ Clearing ALL screenplay data (COMPLETE RESET)...');
        
        // 🔥 NEW: Use persistence manager to clear everything from DynamoDB
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Clearing ALL structural data from DynamoDB...');
                
                // Feature 0117: Clear all data directly from API
                await Promise.all([
                    deleteAllScenes(screenplayId, getToken),
                    deleteAllCharacters(screenplayId, getToken),
                    deleteAllLocations(screenplayId, getToken)
                ]);
                
                console.log('[ScreenplayContext] ✅ Cleared EVERYTHING from DynamoDB (scenes, characters, locations)');
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
            beats: {},
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
        
        // Feature 0117: Beat CRUD removed - beats are frontend-only UI templates
        
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
        // Feature 0117: saveBeatsToDynamoDB removed - beats are frontend-only
        saveScenes,          // 🔥 Feature 0117: Save scenes to separate table
        // Feature 0117: saveAllToDynamoDBDirect removed
        getCurrentState, // 🔥 NEW: Get current state without closure issues
        
        // 🔥 NEW: Direct state setters for optimistic UI updates
        setBeats,
        setCharacters,
        setLocations,
        groupScenesIntoBeats,
        
        // Clear and Re-scan (Feature 0117: Destructive Import + Additive Re-scan)
        // Feature 0117: clearAllStructure removed
        clearContentOnly, // 🔥 Clear content only, preserve beat template (for imports)
        rescanScript, // 🔥 NEW: Re-scan for new entities (smart merge)
        // Feature 0117: repairOrphanedScenes removed
        
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

