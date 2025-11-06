'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type {
    StoryBeat,
    Scene,
    Character,
    Location,
    Relationships,
    BeatsFile,
    CharactersFile,
    LocationsFile,
    RelationshipsFile,
    CreateInput,
    CascadeOption,
    DeletionResult,
    ImageAsset
} from '@/types/screenplay';
import {
    initializeGitHub,
    getStructureFile,
    saveStructureFile,
    createMultiFileCommit
} from '@/utils/github';
import {
    createCharacterIssue,
    createLocationIssue,
    closeIssue
} from '@/utils/githubIssues';
import {
    updateScriptTags
} from '@/utils/fountainTags';

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
    error: string | null;
    
    // GitHub Config
    isConnected: boolean;
    connect: (token: string, owner: string, repo: string) => void;
    disconnect: () => void;
    
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
    bulkImportCharacters: (characterNames: string[]) => Promise<Character[]>;
    bulkImportLocations: (locationNames: string[]) => Promise<Location[]>;
    bulkImportScenes: (beatId: string, scenes: Array<{
        heading: string;
        location: string;
        characterIds: string[];
        locationId?: string;
        startLine: number;
        endLine: number;
    }>) => Promise<Scene[]>;
    
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
    
    // Sync
    syncFromGitHub: () => Promise<void>;
    syncToGitHub: (message: string) => Promise<void>;
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
    // State - Load from localStorage on mount (with sanitization!)
    // ========================================================================
    const [beats, setBeats] = useState<StoryBeat[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.BEATS);
            if (!saved) return [];
            
            const parsed = JSON.parse(saved);
            // 🛡️ CRITICAL: Sanitize beats on load to prevent corruption
            return parsed.map((beat: any) => ({
                ...beat,
                scenes: Array.isArray(beat.scenes) ? beat.scenes : []
            }));
        } catch (error) {
            console.error('[ScreenplayContext] Failed to load beats from localStorage', error);
            return [];
        }
    });
    
    const [characters, setCharacters] = useState<Character[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('[ScreenplayContext] Failed to load characters', error);
            return [];
        }
    });
    
    const [locations, setLocations] = useState<Location[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('[ScreenplayContext] Failed to load locations', error);
            return [];
        }
    });
    
    const [relationships, setRelationships] = useState<Relationships>(() => {
        if (typeof window === 'undefined') return { scenes: {}, characters: {}, locations: {}, props: {} };
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS);
            return saved ? JSON.parse(saved) : { scenes: {}, characters: {}, locations: {}, props: {} };
        } catch (error) {
            console.error('[ScreenplayContext] Failed to load relationships', error);
            return { scenes: {}, characters: {}, locations: {}, props: {} };
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Track if we've auto-created the 8-Sequence Structure to prevent duplicates
    const hasAutoCreated = useRef(false);
    
    // Ref for auto-sync timer
    const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // GitHub connection - Load from localStorage if available
    const [githubConfig, setGithubConfig] = useState<ReturnType<typeof initializeGitHub> | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
            if (saved) {
                const config = JSON.parse(saved);
                return initializeGitHub(config.token, config.owner, config.repo);
            }
        } catch (error) {
            console.error('[ScreenplayContext] Failed to load GitHub config from localStorage', error);
        }
        return null;
    });
    const [isConnected, setIsConnected] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
    });

    // Load from GitHub on mount + Auto-create 8-Sequence Structure if empty
    useEffect(() => {
        async function initializeData() {
            // Try to load from GitHub if connected
            if (githubConfig && isConnected) {
                try {
                    console.log('[ScreenplayContext] Loading data from GitHub...');
                    await syncFromGitHub();
                    console.log('[ScreenplayContext] ✅ Loaded from GitHub');
                } catch (err) {
                    console.error('[ScreenplayContext] Failed to load from GitHub:', err);
        }
            } else {
                console.log('[ScreenplayContext] GitHub not connected - will create default structure');
            }
            
            // After loading (or if not connected), check if we need to create default structure
            if (beats.length === 0) {
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
                
                // 🛡️ CRITICAL: EXPLICIT empty array, not from spread
                const newBeats = sequences.map((seq, index) => ({
                    id: `beat-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                    title: seq.title,
                    description: seq.description,
                    order: seq.order,
                    scenes: [],  // 🛡️ CRITICAL: EXPLICIT empty array, not from spread
                    createdAt: now,
                    updatedAt: now
                }));
                
                setBeats(newBeats);
                
                // ⚠️ DO NOT sync to GitHub immediately - let useEffect handle it after state settles
                // This prevents race conditions where GitHub sync reads old/incomplete state
            }
        }
        
        initializeData();
    }, []); // Empty deps - run only once on mount
    
    // ========================================================================
    // Auto-save to localStorage when data changes
    // ========================================================================
    
    // Removed aggressive validation logging that was causing performance issues
    
    // Save beats to localStorage (with sanitization!)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (beats.length === 0) return; // Don't save empty state
        
        try {
            // 🛡️ CRITICAL: Sanitize before saving to prevent corruption
            const sanitized = beats.map(beat => ({
                ...beat,
                scenes: Array.isArray(beat.scenes) ? beat.scenes : []
            }));
            
            localStorage.setItem(STORAGE_KEYS.BEATS, JSON.stringify(sanitized));
            localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
        } catch (error) {
            console.error('[ScreenplayContext] Failed to save beats to localStorage:', error);
        }
    }, [beats]);
    
    // Save characters to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
        } catch (error) {
            console.error('[ScreenplayContext] Failed to save characters:', error);
        }
    }, [characters]);
    
    // Save locations to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
        } catch (error) {
            console.error('[ScreenplayContext] Failed to save locations:', error);
        }
    }, [locations]);
    
    // Save relationships to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify(relationships));
        } catch (error) {
            console.error('[ScreenplayContext] Failed to save relationships:', error);
        }
    }, [relationships]);
    
    // ========================================================================
    // GitHub Connection
    // ========================================================================
    
    const connect = useCallback((token: string, owner: string, repo: string) => {
        const config = initializeGitHub(token, owner, repo);
        setGithubConfig(config);
        setIsConnected(true);
        console.log('[ScreenplayContext] Connected to GitHub');
    }, []);
    
    const disconnect = useCallback(() => {
        setGithubConfig(null);
        setIsConnected(false);
        console.log('[ScreenplayContext] Disconnected from GitHub');
    }, []);
    
    // ========================================================================
    // Sync Operations
    // ========================================================================
    
    const syncFromGitHub = useCallback(async () => {
        if (!githubConfig) {
            throw new Error('Not connected to GitHub');
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Load all structure files
            const [beatsFile, charsFile, locsFile, relsFile] = await Promise.all([
                getStructureFile<BeatsFile>(githubConfig, 'beats'),
                getStructureFile<CharactersFile>(githubConfig, 'characters'),
                getStructureFile<LocationsFile>(githubConfig, 'locations'),
                getStructureFile<RelationshipsFile>(githubConfig, 'relationships')
            ]);
            
            // 🛡️ CRITICAL FIX: Sanitize beat.scenes when loading from GitHub
            const sanitizedBeats = (beatsFile?.beats || []).map(beat => {
                return {
                    ...beat,
                    scenes: Array.isArray(beat.scenes) ? beat.scenes : []
                };
            });
            
            setBeats(sanitizedBeats);
            setCharacters(charsFile?.characters || []);
            setLocations(locsFile?.locations || []);
            setRelationships(relsFile?.relationships || { scenes: {}, characters: {}, locations: {}, props: {} });
            
            console.log('[ScreenplayContext] Synced from GitHub (sanitized corrupted data)');
            
        } catch (err: any) {
            setError(err.message);
            console.error('[ScreenplayContext] Sync from GitHub failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [githubConfig]);
    
    const syncToGitHub = useCallback(async (message: string) => {
        if (!githubConfig) {
            throw new Error('Not connected to GitHub');
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const now = new Date().toISOString();
            
            // Prepare structure files
            const beatsFile: BeatsFile = {
                version: '1.0',
                lastUpdated: now,
                beats
            };
            
            const charsFile: CharactersFile = {
                version: '1.0',
                lastUpdated: now,
                characters
            };
            
            const locsFile: LocationsFile = {
                version: '1.0',
                lastUpdated: now,
                locations
            };
            
            const relsFile: RelationshipsFile = {
                version: '1.0',
                lastUpdated: now,
                relationships
            };
            
            try {
                // Try atomic multi-file commit first
                await createMultiFileCommit(
                    githubConfig,
                    [
                        {
                            path: 'structure/beats.json',
                            content: JSON.stringify(beatsFile, null, 2)
                        },
                        {
                            path: 'structure/characters.json',
                            content: JSON.stringify(charsFile, null, 2)
                        },
                        {
                            path: 'structure/locations.json',
                            content: JSON.stringify(locsFile, null, 2)
                        },
                        {
                            path: 'structure/relationships.json',
                            content: JSON.stringify(relsFile, null, 2)
                        }
                    ],
                    message
                );
            } catch (multiFileErr: any) {
                // If multi-file commit fails (e.g., new repo without main branch),
                // fall back to individual file saves
                console.log('[ScreenplayContext] Multi-file commit failed, falling back to individual saves');
                
                await Promise.all([
                    saveStructureFile(githubConfig, 'beats', beatsFile, `${message} (beats)`),
                    saveStructureFile(githubConfig, 'characters', charsFile, `${message} (characters)`),
                    saveStructureFile(githubConfig, 'locations', locsFile, `${message} (locations)`),
                    saveStructureFile(githubConfig, 'relationships', relsFile, `${message} (relationships)`)
                ]);
            }
            
            console.log('[ScreenplayContext] Synced to GitHub');
            
        } catch (err: any) {
            setError(err.message);
            console.error('[ScreenplayContext] Sync to GitHub failed:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [githubConfig, beats, characters, locations, relationships]);
    
    // ========================================================================
    // Auto-Sync to GitHub (every 30 seconds, debounced)
    // ========================================================================
    
    useEffect(() => {
        // Skip if not connected to GitHub
        if (!isConnected || !githubConfig) return;
        
        // Clear existing timer
        if (autoSyncTimerRef.current) {
            clearTimeout(autoSyncTimerRef.current);
        }
        
        // Set new timer for GitHub auto-sync (30 seconds)
        autoSyncTimerRef.current = setTimeout(async () => {
            try {
                console.log('[ScreenplayContext] Auto-syncing to GitHub...');
                await syncToGitHub('auto: Screenplay structure update');
                console.log('[ScreenplayContext] ✅ Auto-synced to GitHub');
            } catch (err) {
                console.error('[ScreenplayContext] Auto-sync failed:', err);
                // Don't throw - just log the error
            }
        }, 30000); // 30 seconds
        
        // Cleanup
        return () => {
            if (autoSyncTimerRef.current) {
                clearTimeout(autoSyncTimerRef.current);
            }
        };
    }, [beats, characters, locations, relationships, isConnected, githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Created story beat "${newBeat.title}"`);
        }
        
        return newBeat;
    }, [githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Updated story beat`);
        }
    }, [githubConfig, syncToGitHub]);
    
    const deleteBeat = useCallback(async (id: string) => {
        const beat = beats.find(b => b.id === id);
        setBeats(prev => prev.filter(b => b.id !== id));
        
        if (githubConfig && beat) {
            await syncToGitHub(`feat: Deleted story beat "${beat.title}"`);
        }
    }, [beats, githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Created scene ${newScene.number} - ${newScene.heading}`);
        }
        
        return newScene;
    }, [githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Updated scene`);
        }
    }, [githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig && deletedScene) {
            await syncToGitHub(`feat: Deleted scene ${deletedScene.number}`);
        }
    }, [githubConfig, syncToGitHub]);
    
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
            
            if (githubConfig) {
                await syncToGitHub(`feat: Moved scene ${movedScene.number}`);
            }
        }
    }, [githubConfig, syncToGitHub]);
    
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
        
        // Create GitHub Issue if connected
        if (githubConfig) {
            const issueNumber = await createCharacterIssue(githubConfig, {
                name: newCharacter.name,
                type: newCharacter.type,
                description: newCharacter.description,
                firstAppearance: newCharacter.firstAppearance,
                arcStatus: newCharacter.arcStatus
            });
            newCharacter.githubIssueNumber = issueNumber;
        }
        
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: [#${newCharacter.githubIssueNumber}] Added character ${newCharacter.name}`);
        }
        
        return newCharacter;
    }, [githubConfig, syncToGitHub]);
    
    const updateCharacter = useCallback(async (id: string, updates: Partial<Character>) => {
        setCharacters(prev => prev.map(char =>
            char.id === id
                ? { ...char, ...updates, updatedAt: new Date().toISOString() }
                : char
        ));
        
        if (githubConfig) {
            const char = characters.find(c => c.id === id);
            if (char?.githubIssueNumber) {
                await syncToGitHub(`feat: [#${char.githubIssueNumber}] Updated character ${char.name}`);
            }
        }
    }, [characters, githubConfig, syncToGitHub]);
    
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
        
        setCharacters(prev => prev.filter(c => c.id !== id));
        
        // Close GitHub Issue
        if (githubConfig && character.githubIssueNumber) {
            await closeIssue(
                githubConfig,
                character.githubIssueNumber,
                'removed',
                `Removed character ${character.name} from screenplay`
            );
        }
        
        if (githubConfig) {
            await syncToGitHub(`fix: [#${character.githubIssueNumber}] Removed character ${character.name}`);
        }
        
        return {
            success: true,
            entityId: id,
            entityType: 'character',
            removedReferences: removedCount
        };
    }, [characters, relationships, githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Added character to scene`);
        }
    }, [githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Removed character from scene`);
        }
    }, [githubConfig, syncToGitHub]);
    
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
        
        // Create GitHub Issue if connected
        if (githubConfig) {
            const issueNumber = await createLocationIssue(githubConfig, {
                name: newLocation.name,
                type: newLocation.type,
                description: newLocation.description,
                productionNotes: newLocation.productionNotes,
                sceneCount: 0
            });
            newLocation.githubIssueNumber = issueNumber;
        }
        
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: [#${newLocation.githubIssueNumber}] Added location ${newLocation.name}`);
        }
        
        return newLocation;
    }, [githubConfig, syncToGitHub]);
    
    const updateLocation = useCallback(async (id: string, updates: Partial<Location>) => {
        setLocations(prev => prev.map(loc =>
            loc.id === id
                ? { ...loc, ...updates, updatedAt: new Date().toISOString() }
                : loc
        ));
        
        if (githubConfig) {
            const loc = locations.find(l => l.id === id);
            if (loc?.githubIssueNumber) {
                await syncToGitHub(`feat: [#${loc.githubIssueNumber}] Updated location ${loc.name}`);
            }
        }
    }, [locations, githubConfig, syncToGitHub]);
    
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
        
        setLocations(prev => prev.filter(l => l.id !== id));
        
        // Close GitHub Issue
        if (githubConfig && location.githubIssueNumber) {
            await closeIssue(
                githubConfig,
                location.githubIssueNumber,
                'removed',
                `Removed location ${location.name} from screenplay`
            );
        }
        
        if (githubConfig) {
            await syncToGitHub(`fix: [#${location.githubIssueNumber}] Removed location ${location.name}`);
        }
        
        return {
            success: true,
            entityId: id,
            entityType: 'location',
            removedReferences: removedCount
        };
    }, [locations, relationships, githubConfig, syncToGitHub]);
    
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
        
        if (githubConfig) {
            await syncToGitHub(`feat: Updated scene location`);
        }
    }, [githubConfig, syncToGitHub]);
    
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
    
    const bulkImportCharacters = useCallback(async (characterNames: string[]): Promise<Character[]> => {
        const now = new Date().toISOString();
        const newCharacters: Character[] = [];
        
        // Filter out duplicates (check against existing characters)
        const existingNames = new Set(characters.map(c => c.name.toUpperCase()));
        const uniqueNames = characterNames.filter(name => 
            !existingNames.has(name.toUpperCase())
        );
        
        for (const name of uniqueNames) {
            const newCharacter: Character = {
                id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name,
                type: 'supporting', // Default type
                description: `Imported from script`,
                firstAppearance: undefined,
                arcStatus: 'introduced',
                customFields: [],
                createdAt: now,
                updatedAt: now,
                images: []
            };
            
            newCharacters.push(newCharacter);
        }
        
        // Bulk add to state
        setCharacters(prev => [...prev, ...newCharacters]);
        
        // Bulk add to relationships
        setRelationships(prev => {
            const updatedCharacters = { ...prev.characters };
            newCharacters.forEach(char => {
                updatedCharacters[char.id] = {
                    type: 'character',
                    appearsInScenes: [],
                    relatedBeats: []
                };
            });
            return {
                ...prev,
                characters: updatedCharacters
            };
        });
        
        return newCharacters;
    }, [characters]);
    
    const bulkImportLocations = useCallback(async (locationNames: string[]): Promise<Location[]> => {
        const now = new Date().toISOString();
        const newLocations: Location[] = [];
        
        // Filter out duplicates (check against existing locations)
        const existingNames = new Set(locations.map(l => l.name.toUpperCase()));
        const uniqueNames = locationNames.filter(name => 
            !existingNames.has(name.toUpperCase())
        );
        
        for (const name of uniqueNames) {
            const newLocation: Location = {
                id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name,
                description: `Imported from script`,
                type: 'INT', // Default type
                createdAt: now,
                updatedAt: now,
                images: []
            };
            
            newLocations.push(newLocation);
        }
        
        // Bulk add to state
        setLocations(prev => [...prev, ...newLocations]);
        
        // Bulk add to relationships
        setRelationships(prev => {
            const updatedLocations = { ...prev.locations };
            newLocations.forEach(loc => {
                updatedLocations[loc.id] = {
                    type: 'location',
                    scenes: []
                };
            });
            return {
                ...prev,
                locations: updatedLocations
            };
        });
        
        return newLocations;
    }, [locations]);
    
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
        
        // Add to beat
        setBeats(prev => prev.map(beat =>
            beat.id === beatId
                ? { ...beat, scenes: [...beat.scenes, ...newScenes], updatedAt: now }
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
        
        return newScenes;
    }, []);
    
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
    // Context Value
    // ========================================================================
    
    const value: ScreenplayContextType = {
        // State
        beats,
        characters,
        locations,
        relationships,
        isLoading,
        error,
        
        // Connection
        isConnected,
        connect,
        disconnect,
        
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
        
        // Sync
        syncFromGitHub,
        syncToGitHub
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

