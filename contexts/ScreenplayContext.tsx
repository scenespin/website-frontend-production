'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';
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
    beats: StoryBeat[]; // Frontend-only UI templates (not persisted)
    scenes: Scene[]; // Direct scene storage (beats removed)
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
    bulkImportLocations: (locationNames: string[], locationTypes?: Map<string, 'INT' | 'EXT' | 'INT/EXT'>, explicitScreenplayId?: string) => Promise<Location[]>;
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
        scenes: Scene[];
        characters: Character[];
        locations: Location[];
    };
    
    // 🔥 NEW: Direct state setters for optimistic UI updates
    setBeats?: (beats: StoryBeat[]) => void;
    setScenes?: (scenes: Scene[]) => void;
    setCharacters?: (characters: Character[]) => void;
    setLocations?: (locations: Location[]) => void;
    groupScenesIntoBeats?: (scenes: Scene[], beats: StoryBeat[]) => StoryBeat[];
    
    // Feature 0117: clearAllStructure, saveAllToDynamoDBDirect, repairOrphanedScenes removed
    clearContentOnly: () => Promise<StoryBeat[]>;  // 🔥 Returns fresh beats (frontend template only)
    
    // Re-scan script for NEW entities only (smart merge for additive re-scan)
    rescanScript: (content: string) => Promise<{ newCharacters: number; newLocations: number; newScenes: number; updatedScenes: number; }>;
    
    // Scene Position Management
    updateScenePositions: (content: string) => Promise<number>; // Returns count of scenes updated
    
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
    
    // Phase 2: Reference-only manual creation
    // Check if a character or location appears in the script content
    isEntityInScript: (scriptContent: string, entityName: string, entityType: 'character' | 'location') => boolean;
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
    const [beats, setBeats] = useState<StoryBeat[]>([]); // Frontend-only UI templates
    const [scenes, setScenes] = useState<Scene[]>([]); // Direct scene storage (beats removed)
    
    // Characters, locations - START WITH EMPTY STATE
    // 🔥 CRITICAL FIX: Do NOT load from localStorage on mount!
    // DynamoDB is the source of truth - localStorage is just a write cache for performance
    // Loading from localStorage first causes race conditions where stale data overwrites fresh edits
    const [characters, setCharacters] = useState<Character[]>(() => {
        console.log('[ScreenplayContext] 🏗️ INITIAL STATE: Creating empty characters array');
        return [];
    });
    const [locations, setLocations] = useState<Location[]>(() => {
        console.log('[ScreenplayContext] 🏗️ INITIAL STATE: Creating empty locations array');
        return [];
    });
    
    // 🔥 NEW: Refs to access current state without closure issues
    // These are updated in sync with state and can be read in callbacks without stale closures
    const beatsRef = useRef<StoryBeat[]>([]);
    const scenesRef = useRef<Scene[]>([]);
    const charactersRef = useRef<Character[]>([]);
    const locationsRef = useRef<Location[]>([]);
    const updateScenePositionsRef = useRef<((content: string) => Promise<number>) | null>(null);
    
    // Keep refs in sync with state
    useEffect(() => { beatsRef.current = beats; }, [beats]);
    useEffect(() => { scenesRef.current = scenes; }, [scenes]);
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
    
    // 🔥 NEW: Force reload flag - when set, will force re-initialization even if already initialized
    const forceReloadRef = useRef(false);
    
    // 🔥 NEW: Flag to prevent concurrent initialization runs
    const isInitializingRef = useRef(false);
    
    // 🔥 NEW: Reload trigger - incrementing this will force a reload from DynamoDB
    const [reloadTrigger, setReloadTrigger] = useState(0);
    
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
        console.log('[ScreenplayContext] 🔄 transformCharactersFromAPI - Input:', apiCharacters.length, 'characters');
        const transformed = apiCharacters.map(char => ({
            id: char.id || char.character_id,
            name: char.name || '',
            description: char.description || '',
            type: 'primary' as CharacterType,
            arcStatus: (char.arcStatus as ArcStatus) || 'introduced' as ArcStatus, // 🔥 FIX: Read arcStatus from API, default to 'introduced' if missing
            images: (char.referenceImages || []).map((url: string) => ({
                imageUrl: url,
                description: ''
            })),
            customFields: [],
            createdAt: char.created_at || new Date().toISOString(),
            updatedAt: char.updated_at || new Date().toISOString()
        }));
        console.log('[ScreenplayContext] ✅ transformCharactersFromAPI - Output sample:', 
            transformed.length > 0 ? { 
                name: transformed[0].name, 
                arcStatus: transformed[0].arcStatus,
                type: typeof transformed[0].arcStatus 
            } : 'no characters'
        );
        return transformed;
    }, []);
    
    const transformLocationsToAPI = useCallback((locations: Location[]): any[] => {
        return locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            description: loc.description,
            type: loc.type, // 🔥 NEW: Include location type in API payload
            referenceImages: loc.images?.map(img => img.imageUrl) || [],
            address: loc.address, // 🔥 NEW: Include address
            atmosphereNotes: loc.atmosphereNotes, // 🔥 NEW: Include atmosphere notes
            setRequirements: loc.setRequirements, // 🔥 NEW: Include set requirements
            productionNotes: loc.productionNotes // 🔥 NEW: Include production notes
        }));
    }, []);
    
    const transformLocationsFromAPI = useCallback((apiLocations: any[]): Location[] => {
        return apiLocations.map(loc => ({
            id: loc.id || loc.location_id,
            name: loc.name || '',
            description: loc.description || '',
            type: (loc.type as 'INT' | 'EXT' | 'INT/EXT') || 'INT', // 🔥 FIXED: Preserve type from DynamoDB, default to 'INT'
            images: (loc.referenceImages || []).map((url: string) => ({
                imageUrl: url,
                description: ''
            })),
            address: loc.address || '', // 🔥 NEW: Include address
            atmosphereNotes: loc.atmosphereNotes || '', // 🔥 NEW: Include atmosphere notes
            setRequirements: loc.setRequirements || '', // 🔥 NEW: Include set requirements
            productionNotes: loc.productionNotes || '', // 🔥 NEW: Include production notes
            customFields: [],
            createdAt: loc.created_at || new Date().toISOString(),
            updatedAt: loc.updated_at || new Date().toISOString()
        }));
    }, []);
    
    // Helper to create default 8-sequence beats (frontend-only UI template)
    const createDefaultBeats = useCallback((): StoryBeat[] => {
        // 🔥 FIX: Use consistent 8-Sequence Structure template
        const beatTemplates = [
            { title: 'Setup', description: '' },
            { title: 'Inciting Incident', description: '' },
            { title: 'First Plot Point', description: '' },
            { title: 'First Pinch Point', description: '' },
            { title: 'Midpoint', description: '' },
            { title: 'Second Pinch Point', description: '' },
            { title: 'Second Plot Point', description: '' },
            { title: 'Resolution', description: '' }
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
        // 🔥 FIX: Deduplicate scenes by ID AND content (heading + startLine)
        // This handles cases where same scene has different IDs (from multiple imports)
        const sceneMapById = new Map<string, Scene>();
        const sceneMapByContent = new Map<string, Scene>(); // key: "heading|startLine"
        
        scenes.forEach(scene => {
            if (!scene) return; // Skip null/undefined scenes
            
            // Track by ID if available
            if (scene.id && !sceneMapById.has(scene.id)) {
                sceneMapById.set(scene.id, scene);
            }
            
            // Always track by content (heading + startLine) to catch duplicates with different IDs or no IDs
            const contentKey = `${(scene.heading || '').toUpperCase().trim()}|${scene.fountain?.startLine || 0}`;
            if (contentKey !== '|0' && !sceneMapByContent.has(contentKey)) {
                sceneMapByContent.set(contentKey, scene);
            } else if (contentKey !== '|0' && sceneMapByContent.has(contentKey)) {
                // Duplicate content found - keep the one with the earlier order/number
                const existing = sceneMapByContent.get(contentKey)!;
                const existingOrder = existing.order ?? existing.number ?? 0;
                const newOrder = scene.order ?? scene.number ?? 0;
                if (newOrder < existingOrder) {
                    sceneMapByContent.set(contentKey, scene);
                    // Remove old one from ID map if it exists
                    if (existing.id && sceneMapById.has(existing.id)) {
                        sceneMapById.delete(existing.id);
                    }
                }
            }
        });
        
        // Use content-based deduplication as final source of truth
        const uniqueScenes = Array.from(sceneMapByContent.values());
        
        console.log('[ScreenplayContext] 🔍 Deduplicated scenes:', scenes.length, '->', uniqueScenes.length, '(by ID and content)');
        
        // 🔥 FIX: Sort scenes by order field first (primary) or number (fallback) to maintain correct sequence
        const sortedScenes = uniqueScenes.sort((a, b) => {
            // Use order field if available (more reliable for persistence)
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // Fallback to number if order is not set
            return (a.number || 0) - (b.number || 0);
        });
        
        const beatMap = new Map(beats.map(b => [b.title.toUpperCase(), b]));
        const updatedBeats = beats.map(b => ({ ...b, scenes: [] as Scene[] }));
        const orphanedScenes: Scene[] = [];
        
        // First pass: Assign scenes with group_label to matching beats (deduplicate within beat)
        sortedScenes.forEach(scene => {
            if (scene.group_label) {
                const beat = beatMap.get(scene.group_label.toUpperCase());
                if (beat) {
                    const index = beats.findIndex(b => b.id === beat.id);
                    if (index !== -1) {
                        // Check if scene already exists in this beat (by ID or content)
                        const contentKey = `${scene.heading.toUpperCase().trim()}|${scene.fountain.startLine}`;
                        const alreadyExists = updatedBeats[index].scenes.some(s => 
                            s.id === scene.id || 
                            `${s.heading.toUpperCase().trim()}|${s.fountain.startLine}` === contentKey
                        );
                        if (!alreadyExists) {
                            updatedBeats[index].scenes.push(scene);
                        }
                        return;
                    }
                }
            }
            orphanedScenes.push(scene);
        });
        
        // 🔥 FIX: Distribute orphaned scenes evenly across ALL beats (not just first one)
        if (orphanedScenes.length > 0 && updatedBeats.length > 0) {
            // Scenes are already sorted by order/number above
            // Distribute evenly across all beats (deduplicate within beat)
            orphanedScenes.forEach((scene, index) => {
                const beatIndex = index % updatedBeats.length; // Round-robin distribution
                // Check if scene already exists in this beat (by ID or content)
                const contentKey = `${scene.heading.toUpperCase().trim()}|${scene.fountain.startLine}`;
                const alreadyExists = updatedBeats[beatIndex].scenes.some(s => 
                    s.id === scene.id || 
                    `${s.heading.toUpperCase().trim()}|${s.fountain.startLine}` === contentKey
                );
                if (!alreadyExists) {
                    updatedBeats[beatIndex].scenes.push(scene);
                }
            });
            
            console.log('[ScreenplayContext] 📊 Distributed', orphanedScenes.length, 'orphaned scenes across', updatedBeats.length, 'beats');
        }
        
        // Sort scenes within each beat by their order (primary) or number (fallback)
        updatedBeats.forEach(beat => {
            beat.scenes.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                }
                return (a.number || 0) - (b.number || 0);
            });
        });
        
        return updatedBeats;
    }, []);
    
    // 🔥 NEW: Helper to build relationships from scenes
    // This ensures character/location scene counts are accurate
    const buildRelationshipsFromScenes = useCallback((scenes: Scene[], beats: StoryBeat[], charactersList: Character[], locationsList: Location[]) => {
        console.log('[ScreenplayContext] 🔗 Building relationships from', scenes.length, 'scenes...');
        console.log('[ScreenplayContext] 🔍 Available characters:', charactersList.map(c => ({ id: c.id, name: c.name })));
        console.log('[ScreenplayContext] 🔍 Available locations:', locationsList.map(l => ({ id: l.id, name: l.name })));
        
        setRelationships(prev => {
            const newRels = {
                beats: { ...prev.beats },
                scenes: { ...prev.scenes },
                characters: { ...prev.characters },
                locations: { ...prev.locations },
                props: { ...prev.props }
            };
            
            // Build character and location maps for validation
            const characterMap = new Map<string, Character>();
            charactersList.forEach(char => {
                characterMap.set(char.id, char);
            });
            
            const locationMap = new Map<string, Location>();
            locationsList.forEach(loc => {
                locationMap.set(loc.id, loc);
            });
            
            // Build beat map for scene-to-beat lookup
            const beatMap = new Map<string, string>();
            beats.forEach(beat => {
                beat.scenes.forEach(scene => {
                    beatMap.set(scene.id, beat.id);
                });
            });
            
            // Process each scene
            let validCharacterLinks = 0;
            let invalidCharacterLinks = 0;
            scenes.forEach(scene => {
                const beatId = beatMap.get(scene.id) || '';
                
                // Scene relationships
                const characterIds = scene.fountain?.tags?.characters || [];
                // 🔥 FIX: Filter out invalid character IDs (characters that don't exist)
                const validCharacterIds = characterIds.filter(charId => {
                    const isValid = characterMap.has(charId);
                    if (!isValid) {
                        invalidCharacterLinks++;
                        console.warn(`[ScreenplayContext] ⚠️ Scene "${scene.heading}" references invalid character ID: ${charId}`);
                    } else {
                        validCharacterLinks++;
                    }
                    return isValid;
                });
                
                newRels.scenes[scene.id] = {
                    type: 'scene',
                    characters: validCharacterIds,
                    location: scene.fountain?.tags?.location,
                    storyBeat: beatId
                };
                
                // Link characters to scene (only valid IDs)
                validCharacterIds.forEach(charId => {
                    if (!newRels.characters[charId]) {
                        newRels.characters[charId] = {
                            type: 'character',
                            appearsInScenes: [],
                            relatedBeats: []
                        };
                    }
                    if (!newRels.characters[charId].appearsInScenes.includes(scene.id)) {
                        newRels.characters[charId].appearsInScenes.push(scene.id);
                    }
                    if (beatId && !newRels.characters[charId].relatedBeats.includes(beatId)) {
                        newRels.characters[charId].relatedBeats.push(beatId);
                    }
                });
                
                // Link location to scene (validate location ID)
                const locationId = scene.fountain?.tags?.location;
                if (locationId) {
                    if (locationMap.has(locationId)) {
                        if (!newRels.locations[locationId]) {
                            newRels.locations[locationId] = {
                                type: 'location',
                                scenes: []
                            };
                        }
                        if (!newRels.locations[locationId].scenes.includes(scene.id)) {
                            newRels.locations[locationId].scenes.push(scene.id);
                        }
                    } else {
                        console.warn(`[ScreenplayContext] ⚠️ Scene "${scene.heading}" references invalid location ID: ${locationId}`);
                    }
                }
            });
            
            // 🔥 DEBUG: Log sample scene to see if it has character tags
            const sampleScene = scenes[0];
            if (sampleScene) {
                console.log('[ScreenplayContext] 🔍 Sample scene tags:', {
                    sceneId: sampleScene.id,
                    heading: sampleScene.heading,
                    characterIds: sampleScene.fountain?.tags?.characters || [],
                    locationId: sampleScene.fountain?.tags?.location
                });
            }
            
            console.log('[ScreenplayContext] ✅ Built relationships:', {
                scenes: Object.keys(newRels.scenes).length,
                characters: Object.keys(newRels.characters).length,
                locations: Object.keys(newRels.locations).length,
                validCharacterLinks,
                invalidCharacterLinks: invalidCharacterLinks > 0 ? invalidCharacterLinks : undefined,
                scenesWithCharacters: scenes.filter(s => (s.fountain?.tags?.characters || []).length > 0).length,
                totalScenes: scenes.length
            });
            
            return newRels;
        });
    }, []);
    
    // ========================================================================
    // Feature 0111 Phase 3: DynamoDB Integration & Clerk Auth
    // Feature 0119: Use Clerk metadata instead of localStorage
    // ========================================================================
    const { getToken } = useAuth();
    const { user } = useUser(); // Feature 0119: Get user for Clerk metadata
    
    // Track current screenplay_id (from Clerk metadata, falls back to localStorage)
    // Initialize to null - useEffect will set it from Clerk metadata
    const [screenplayId, setScreenplayId] = useState<string | null>(null);
    
    // Feature 0119: Update screenplay_id when Clerk metadata changes
    // Also listen to localStorage for backward compatibility (EditorContext still triggers storage events)
    useEffect(() => {
        // Update from Clerk metadata (primary source)
        const idFromMetadata = getCurrentScreenplayId(user);
        setScreenplayId(prev => {
            if (prev !== idFromMetadata) {
                console.log('[ScreenplayContext] Screenplay ID updated from Clerk metadata:', idFromMetadata, '(was:', prev, ')');
                return idFromMetadata;
            }
            return prev;
        });
        
        // Also listen to localStorage changes for backward compatibility
        // (EditorContext still triggers storage events when updating metadata)
        const handleStorageChange = () => {
            const id = localStorage.getItem('current_screenplay_id');
            setScreenplayId(prev => {
                if (prev !== id) {
                    console.log('[ScreenplayContext] Screenplay ID updated from localStorage:', id, '(was:', prev, ')');
                    return id;
                }
                return prev;
            });
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user]); // Re-run when user object changes (e.g., after metadata update)

    // Load structure data from DynamoDB when screenplay_id is available
    useEffect(() => {
        console.log('[ScreenplayContext] 🔍 INIT EFFECT RUNNING - screenplayId:', screenplayId, 'hasInitializedRef:', hasInitializedRef.current, 'isInitializing:', isInitializingRef.current);
        
        // 🔥 CRITICAL: Guard against duplicate initialization runs
        // This prevents the 26-beat bug caused by multiple effect executions
        const initKey = screenplayId || 'no-id';
        
        // 🔥 FIX: Prevent concurrent initialization runs
        if (isInitializingRef.current) {
            console.log('[ScreenplayContext] ⏸️ Initialization already in progress - skipping');
            return;
        }
        
        // 🔥 FIX: If we previously initialized with 'no-id' but now have a real ID, reset the guard
        if (hasInitializedRef.current === 'no-id' && screenplayId) {
            console.log('[ScreenplayContext] 🔄 Screenplay ID became available - resetting initialization guard');
            hasInitializedRef.current = false; // Reset to allow initialization
        }
        
        // 🔥 FIX: Check guard BEFORE any async operations to prevent infinite loops
        if (hasInitializedRef.current === initKey && !forceReloadRef.current) {
            console.log('[ScreenplayContext] ⏭️ Already initialized for:', initKey, '- skipping');
            return;
        }
        
        // Reset force reload flag if it was set
        if (forceReloadRef.current) {
            console.log('[ScreenplayContext] 🔄 Force reload requested - re-initializing');
            forceReloadRef.current = false;
        }
        
        // 🔥 CRITICAL: Set guards IMMEDIATELY to prevent re-entry during async operations
        console.log('[ScreenplayContext] 🚀 Starting initialization for:', initKey);
        hasInitializedRef.current = initKey;
        isInitializingRef.current = true;
        
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
                    
                    // 🔥 Beats removed - store scenes directly
                    setScenes(transformedScenes);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedScenes.length, 'scenes directly (beats removed)');
                    
                    // Keep beats as empty UI templates (if needed for backward compatibility)
                    const defaultBeats = createDefaultBeats();
                    setBeats(defaultBeats);
                    
                    // Mark that we loaded scenes from DB to prevent auto-creation
                    if (transformedScenes.length > 0) {
                        hasAutoCreated.current = true;
                    }
                    
                    // Transform and set characters
                    const transformedCharacters = transformCharactersFromAPI(charactersData);
                    setCharacters(transformedCharacters);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedCharacters.length, 'characters from DynamoDB');
                    console.log('[ScreenplayContext] 🔍 Character names:', transformedCharacters.map(c => c.name));
                    
                    // Transform and set locations
                    const transformedLocations = transformLocationsFromAPI(locationsData);
                    // 🔥 DEBUG: Log address fields to track persistence
                    console.log('[ScreenplayContext] 🔍 Location addresses after reload:', transformedLocations.map(l => ({ 
                        name: l.name, 
                        address: l.address, 
                        hasAddress: !!l.address 
                    })));
                    setLocations(transformedLocations);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedLocations.length, 'locations from DynamoDB');
                    console.log('[ScreenplayContext] 🔍 Location names:', transformedLocations.map(l => l.name));
                    
                    // 🔥 NEW: Build relationships from scenes so scene counts work
                    // Pass characters and locations for validation (beats are empty templates now)
                    buildRelationshipsFromScenes(transformedScenes, defaultBeats, transformedCharacters, transformedLocations);
                    
                    // 🔥 CRITICAL: Check if we need to create default beats AFTER loading
                    if (transformedScenes.length === 0 && !hasAutoCreated.current) {
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
                    isInitializingRef.current = false; // 🔥 FIX: Reset initialization flag
                    console.log('[ScreenplayContext] ✅ Initialization complete - ready for imports');
                }
            } else {
                console.log('[ScreenplayContext] No screenplay_id yet - waiting for EditorContext');
                // Still mark as initialized so imports can work (for new screenplays)
                setHasInitializedFromDynamoDB(true);
                setIsLoading(false);
                isInitializingRef.current = false; // 🔥 FIX: Reset initialization flag
                
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // Note: transform functions and helpers are stable useCallbacks, so we don't need them in deps
        // Only screenplayId, reloadTrigger, and getToken can actually change
    }, [screenplayId, reloadTrigger, getToken]);
    
    // 🔥 NEW: Auto-build relationships when beats/scenes change
    // This ensures scene counts are always accurate
    useEffect(() => {
        if (scenes.length === 0) return;
        
        // Only build if we have characters/locations loaded (to avoid empty relationships)
        if (characters.length > 0 || locations.length > 0) {
            buildRelationshipsFromScenes(scenes, beats, characters, locations);
        }
    }, [scenes, characters.length, locations.length, buildRelationshipsFromScenes, beats]);
    
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
        
        // 🔥 Beats removed - add directly to scenes state with deduplication and renumbering
        setScenes(prev => {
            // Check for duplicates by ID
            if (prev.some(s => s.id === newScene.id)) {
                console.log('[ScreenplayContext] ⚠️ Scene with same ID already exists, skipping:', newScene.id);
                return prev;
            }
            
            // Check for duplicates by content (heading + startLine)
            const contentKey = `${(newScene.heading || '').toUpperCase().trim()}|${newScene.fountain?.startLine || 0}`;
            const existingContentKeys = new Set(
                prev.map(s => `${(s.heading || '').toUpperCase().trim()}|${s.fountain?.startLine || 0}`)
            );
            
            if (existingContentKeys.has(contentKey)) {
                console.log('[ScreenplayContext] ⚠️ Scene with same content already exists, skipping:', contentKey);
                return prev;
            }
            
            // Add new scene and renumber all scenes
            const updatedScenes = [...prev, newScene];
            
            // Sort by order or number, then renumber sequentially
            updatedScenes.sort((a, b) => {
                const orderA = a.order ?? a.number ?? 0;
                const orderB = b.order ?? b.number ?? 0;
                return orderA - orderB;
            });
            
            // Renumber all scenes sequentially
            const renumberedScenes = updatedScenes.map((scene, index) => ({
                ...scene,
                number: index + 1,
                order: index
            }));
            
            console.log('[ScreenplayContext] ✅ Added new scene and renumbered all scenes. Total:', renumberedScenes.length);
            
            return renumberedScenes;
        });
        
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
        
        // Feature 0117: Save scene directly to DynamoDB (beats don't persist)
        if (screenplayId) {
            try {
                const apiScene = transformScenesToAPI([newScene]);
                await bulkCreateScenes(screenplayId, apiScene, getToken);
                console.log('[ScreenplayContext] ✅ Saved new scene to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save scene to DynamoDB:', error);
            }
        }
        
        return newScene;
    }, [screenplayId, getToken]);
    
    const updateScene = useCallback(async (id: string, updates: Partial<Scene>) => {
        const now = new Date().toISOString();
        
        // 🔥 Beats removed - update directly in scenes state
        setScenes(prev => prev.map(scene =>
            scene.id === id
                ? { ...scene, ...updates, updatedAt: now }
                : scene
        ));
        
        // Feature 0117: Save updated scene directly to DynamoDB
        if (screenplayId) {
            try {
                const currentScene = scenes.find(s => s.id === id);
                if (currentScene) {
                    const sceneWithUpdates = { ...currentScene, ...updates, updatedAt: now };
                    const apiScene = transformScenesToAPI([sceneWithUpdates]);
                    await bulkCreateScenes(screenplayId, apiScene, getToken);
                    console.log('[ScreenplayContext] ✅ Updated scene in DynamoDB');
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update scene in DynamoDB:', error);
            }
        }
    }, [scenes, screenplayId, getToken]);
    
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
        // 🔥 Beats removed - find and remove from scenes state
        const deletedScene = scenes.find(s => s.id === id);
        
        setScenes(prev => prev.filter(s => s.id !== id));
        
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
    
    // ========================================================================
    // Script Reordering Helper
    // ========================================================================
    
    /**
     * Reorder script content based on new scene order.
     * Extracts scene blocks from script and reorders them according to the new scene order.
     * 
     * @param content - Current script content
     * @param newSceneOrder - Scenes in their new order (from updated beats state)
     * @param oldSceneOrder - Scenes in their original order (for matching)
     * @returns Reordered script content
     */
    const reorderScriptContent = useCallback((
        content: string,
        newSceneOrder: Scene[],
        oldSceneOrder: Scene[]
    ): string => {
        console.log('[ScreenplayContext] Reordering script content:', {
            newOrder: newSceneOrder.length,
            oldOrder: oldSceneOrder.length,
            contentLength: content.length
        });
        
        // 🔥 FIX: Use scene headings to find scenes instead of relying on stale line numbers
        // This is more robust when line numbers are outdated
        const lines = content.split('\n');
        
        // Build a map of scene heading to scene block (using headings as keys for reliability)
        const sceneBlocksByHeading = new Map<string, { block: string[]; scene: Scene }>();
        const sceneBlocksById = new Map<string, string[]>();
        
        // First, try to extract using line numbers (if valid)
        let validLineNumbers = 0;
        let invalidLineNumbers = 0;
        
        oldSceneOrder.forEach(scene => {
            const startLine = scene.fountain?.startLine ?? -1;
            const endLine = scene.fountain?.endLine ?? -1;
            
            // Validate boundaries
            if (startLine >= 0 && endLine >= startLine && endLine < lines.length) {
                const sceneBlock = lines.slice(startLine, endLine + 1);
                sceneBlocksById.set(scene.id, sceneBlock);
                sceneBlocksByHeading.set(scene.heading.toUpperCase().trim(), { block: sceneBlock, scene });
                validLineNumbers++;
                console.log(`[ScreenplayContext] Extracted scene "${scene.heading}" using line numbers: ${startLine}-${endLine}`);
            } else {
                invalidLineNumbers++;
                console.warn(`[ScreenplayContext] Invalid line numbers for scene "${scene.heading}": ${startLine}-${endLine}, will use heading-based extraction`);
            }
        });
        
        // If too many scenes have invalid line numbers, use heading-based extraction
        if (invalidLineNumbers > validLineNumbers && invalidLineNumbers > 0) {
            console.log('[ScreenplayContext] 🔄 Too many invalid line numbers, using heading-based extraction...');
            sceneBlocksById.clear();
            sceneBlocksByHeading.clear();
            
            // Find scenes by their headings in the content
            let currentScene: { heading: string; startLine: number; scene: Scene } | null = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const isSceneHeading = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[\.\s]/i.test(line);
                
                if (isSceneHeading) {
                    // Save previous scene
                    if (currentScene) {
                        const sceneBlock = lines.slice(currentScene.startLine, i);
                        sceneBlocksById.set(currentScene.scene.id, sceneBlock);
                        sceneBlocksByHeading.set(currentScene.heading.toUpperCase().trim(), { block: sceneBlock, scene: currentScene.scene });
                    }
                    
                    // Find matching scene from oldSceneOrder
                    const normalizedHeading = line.toUpperCase().trim();
                    const matchingScene = oldSceneOrder.find(s => 
                        s.heading.toUpperCase().trim() === normalizedHeading
                    );
                    
                    if (matchingScene) {
                        currentScene = { heading: normalizedHeading, startLine: i, scene: matchingScene };
                    } else {
                        currentScene = null; // Scene not in old order, skip
                    }
                }
            }
            
            // Save last scene
            if (currentScene) {
                const sceneBlock = lines.slice(currentScene.startLine);
                sceneBlocksById.set(currentScene.scene.id, sceneBlock);
                sceneBlocksByHeading.set(currentScene.heading, { block: sceneBlock, scene: currentScene.scene });
            }
        }
        
        // Find content before first scene (title page, etc.)
        const firstScene = oldSceneOrder
            .map(s => ({ scene: s, startLine: s.fountain?.startLine ?? Infinity }))
            .sort((a, b) => a.startLine - b.startLine)[0];
        
        const contentBeforeFirstScene = firstScene && firstScene.scene.fountain?.startLine !== undefined && firstScene.scene.fountain.startLine >= 0
            ? lines.slice(0, firstScene.scene.fountain.startLine)
            : [];
        
        // Find content after last scene
        const lastScene = oldSceneOrder
            .map(s => ({ scene: s, endLine: s.fountain?.endLine ?? -1 }))
            .sort((a, b) => b.endLine - a.endLine)[0];
        
        const contentAfterLastScene = lastScene && lastScene.scene.fountain?.endLine !== undefined && lastScene.scene.fountain.endLine >= 0
            ? lines.slice(lastScene.scene.fountain.endLine + 1)
            : [];
        
        // Reorder scene blocks according to new order
        const reorderedSceneBlocks: string[] = [];
        const missingScenes: string[] = [];
        
        newSceneOrder.forEach((scene, index) => {
            // Try ID first, then heading
            let sceneBlock = sceneBlocksById.get(scene.id);
            if (!sceneBlock) {
                const headingMatch = sceneBlocksByHeading.get(scene.heading.toUpperCase().trim());
                if (headingMatch) {
                    sceneBlock = headingMatch.block;
                    console.log(`[ScreenplayContext] Found scene "${scene.heading}" by heading match`);
                }
            }
            
            if (sceneBlock && sceneBlock.length > 0) {
                reorderedSceneBlocks.push(...sceneBlock);
                console.log(`[ScreenplayContext] Added scene "${scene.heading}" at position ${index + 1} (${sceneBlock.length} lines)`);
            } else {
                missingScenes.push(scene.id);
                console.warn(`[ScreenplayContext] Scene block not found for scene ${scene.id} ("${scene.heading}") - skipping`);
            }
        });
        
        if (missingScenes.length > 0) {
            console.warn(`[ScreenplayContext] ⚠️ ${missingScenes.length} scene(s) could not be reordered (missing scene blocks):`, missingScenes);
        }
        
        // Reconstruct script: content before + reordered scenes + content after
        const reorderedLines = [
            ...contentBeforeFirstScene,
            ...reorderedSceneBlocks,
            ...contentAfterLastScene
        ];
        
        const reorderedContent = reorderedLines.join('\n');
        
        // 🔥 VALIDATION: Ensure reordered content is valid
        if (!reorderedContent || reorderedContent.trim().length === 0) {
            console.error('[ScreenplayContext] ❌ Reordered content is empty! Returning original content.');
            return content; // Return original content if reordering failed
        }
        
        // Validate that we didn't lose too much content (safety check)
        const originalLength = content.length;
        const reorderedLength = reorderedContent.length;
        const lengthDiff = Math.abs(originalLength - reorderedLength);
        const lengthDiffPercent = (lengthDiff / originalLength) * 100;
        
        // 🔥 FIX: Return original content if length difference is too large (prevents truncation)
        if (lengthDiffPercent > 50) {
            console.error(`[ScreenplayContext] ❌ Reordered content length differs significantly: ${lengthDiffPercent.toFixed(1)}% (original: ${originalLength}, reordered: ${reorderedLength}). Returning original content to prevent data loss.`);
            return content; // Return original content to prevent truncation
        }
        
        console.log('[ScreenplayContext] ✅ Script reordered:', {
            totalLines: reorderedLines.length,
            scenesReordered: reorderedSceneBlocks.length > 0 ? newSceneOrder.length : 0,
            missingScenes: missingScenes.length,
            originalLength,
            reorderedLength,
            lengthDiffPercent: lengthDiffPercent.toFixed(1) + '%'
        });
        
        return reorderedContent;
    }, []);
    
    
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
                // 🔥 FIX: Include arcStatus in API call
                const apiChar = {
                    name: newCharacter.name,
                    description: newCharacter.description,
                    arcStatus: newCharacter.arcStatus || 'introduced', // 🔥 FIX: Include arcStatus
                    referenceImages: newCharacter.images?.map(img => img.imageUrl) || []
                };
                const createdCharacter = await apiCreateCharacter(screenplayId, apiChar, getToken);
                console.log('[ScreenplayContext] 📥 Received created character from API:', { 
                    characterId: createdCharacter.id || (createdCharacter as any).character_id,
                    name: createdCharacter.name
                });
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                const transformedCharacter = transformCharactersFromAPI([createdCharacter as any])[0];
                console.log('[ScreenplayContext] 🔄 Syncing created character state:', { 
                    transformedId: transformedCharacter.id,
                    name: transformedCharacter.name
                });
                setCharacters(prev => {
                    // Replace the optimistic character with the real one from DynamoDB
                    const updated = prev.map(char => {
                        // Match by name or ID
                        if (char.id === newCharacter.id || char.name === newCharacter.name) {
                            return transformedCharacter;
                        }
                        return char;
                    });
                    // If not found, add it
                    if (!updated.find(char => char.id === transformedCharacter.id)) {
                        return [...updated, transformedCharacter];
                    }
                    return updated;
                });
                
                // 🔥 FIX: Force reload from DynamoDB to ensure we have the latest data
                forceReloadRef.current = true;
                hasInitializedRef.current = false;
                setReloadTrigger(prev => prev + 1);
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
        
        // 2. Save to DynamoDB using proper update API
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Updating character in DynamoDB:', {
                    characterId: id,
                    updates
                });
                
                // 🔥 FIX: Use proper updateCharacter API instead of bulkCreateCharacters
                // Transform updates to API format (include arcStatus and referenceImages)
                const apiUpdates: any = {};
                
                // Only include fields that are actually being updated
                if (updates.name !== undefined) apiUpdates.name = updates.name;
                if (updates.description !== undefined) apiUpdates.description = updates.description;
                if (updates.arcStatus !== undefined) apiUpdates.arcStatus = updates.arcStatus; // 🔥 CRITICAL: Include arcStatus
                if (updates.images !== undefined) {
                    apiUpdates.referenceImages = updates.images.map(img => img.imageUrl);
                }
                
                console.log('[ScreenplayContext] 📤 Sending character update to API:', { characterId: id, apiUpdates });
                const updatedCharacter = await apiUpdateCharacter(screenplayId, id, apiUpdates, getToken);
                console.log('[ScreenplayContext] 📥 Received updated character from API:', { characterId: id, arcStatus: (updatedCharacter as any)?.arcStatus });
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                // Transform the API response to frontend format and update state
                const transformedCharacter = transformCharactersFromAPI([updatedCharacter as any])[0];
                console.log('[ScreenplayContext] 🔄 Syncing character state:', { 
                    updateId: id, 
                    transformedId: transformedCharacter.id,
                    arcStatus: transformedCharacter.arcStatus 
                });
                setCharacters(prev => {
                    const updated = prev.map(char => {
                        // Match by either the frontend id or the character_id from API
                        const matches = char.id === id || char.id === transformedCharacter.id || 
                                      (updatedCharacter as any)?.character_id === char.id ||
                                      (updatedCharacter as any)?.id === char.id;
                        if (matches) {
                            console.log('[ScreenplayContext] ✅ Matched character for update:', { 
                                oldId: char.id, 
                                newId: transformedCharacter.id,
                                oldArcStatus: char.arcStatus,
                                newArcStatus: transformedCharacter.arcStatus
                            });
                            return transformedCharacter;
                        }
                        return char;
                    });
                    return updated;
                });
                
                console.log('[ScreenplayContext] ✅ Updated character in DynamoDB and synced local state');
                
                // 🔥 FIX: Force reload from DynamoDB to ensure we have the latest data
                // This ensures that on refresh, we'll have the correct data
                forceReloadRef.current = true;
                hasInitializedRef.current = false;
                // Trigger re-initialization by incrementing reload trigger
                setReloadTrigger(prev => prev + 1);
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
                
                // 🔥 FIX: Force reload from DynamoDB to ensure we have the latest data
                forceReloadRef.current = true;
                hasInitializedRef.current = false;
                setReloadTrigger(prev => prev + 1);
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
                const apiLoc: any = {
                    name: newLocation.name,
                    description: newLocation.description || '',
                    type: newLocation.type || 'INT', // 🔥 FIX: Include type field (INT/EXT/INT-EXT)
                    referenceImages: newLocation.images?.map(img => img.imageUrl) || []
                };
                
                // 🔥 FIX: Include custom fields if they exist (even if empty string, but not if undefined)
                if (newLocation.address !== undefined) apiLoc.address = newLocation.address;
                if (newLocation.atmosphereNotes !== undefined) apiLoc.atmosphereNotes = newLocation.atmosphereNotes;
                if (newLocation.setRequirements !== undefined) apiLoc.setRequirements = newLocation.setRequirements;
                if (newLocation.productionNotes !== undefined) apiLoc.productionNotes = newLocation.productionNotes;
                const createdLocation = await apiCreateLocation(screenplayId, apiLoc, getToken);
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                const transformedLocation = transformLocationsFromAPI([createdLocation as any])[0];
                setLocations(prev => {
                    // Replace the optimistic location with the real one from DynamoDB
                    const updated = prev.map(loc => {
                        // Match by name or ID
                        if (loc.id === newLocation.id || loc.name === newLocation.name) {
                            return transformedLocation;
                        }
                        return loc;
                    });
                    // If not found, add it
                    if (!updated.find(loc => loc.id === transformedLocation.id)) {
                        return [...updated, transformedLocation];
                    }
                    return updated;
                });
                
                // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
                // The force reload was causing the address to disappear because it was happening
                // before DynamoDB had fully written the item, or the address wasn't in the list response
                // Instead, we rely on the state sync above which uses the actual API response
                // forceReloadRef.current = true;
                // hasInitializedRef.current = false;
                // setReloadTrigger(prev => prev + 1);
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
        
        // 2. Save to DynamoDB using proper update API
        if (screenplayId) {
            try {
                console.log('[ScreenplayContext] Updating location in DynamoDB:', {
                    locationId: id,
                    updates
                });
                
                // 🔥 FIX: Use proper updateLocation API instead of bulkCreateLocations
                // Transform updates to API format (include type field)
                const apiUpdates: any = {};
                
                // Only include fields that are actually being updated
                if (updates.name !== undefined) apiUpdates.name = updates.name;
                if (updates.description !== undefined) apiUpdates.description = updates.description;
                if (updates.type !== undefined) apiUpdates.type = updates.type; // 🔥 CRITICAL: Include type field (INT/EXT/INT-EXT)
                if (updates.images !== undefined) {
                    apiUpdates.referenceImages = updates.images.map(img => img.imageUrl);
                }
                if (updates.address !== undefined) apiUpdates.address = updates.address; // 🔥 NEW: Include address
                if (updates.atmosphereNotes !== undefined) apiUpdates.atmosphereNotes = updates.atmosphereNotes; // 🔥 NEW: Include atmosphere notes
                if (updates.setRequirements !== undefined) apiUpdates.setRequirements = updates.setRequirements; // 🔥 NEW: Include set requirements
                if (updates.productionNotes !== undefined) apiUpdates.productionNotes = updates.productionNotes; // 🔥 NEW: Include production notes
                
                const updatedLocation = await apiUpdateLocation(screenplayId, id, apiUpdates, getToken);
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                // Transform the API response to frontend format and update state
                const transformedLocation = transformLocationsFromAPI([updatedLocation as any])[0];
                setLocations(prev => {
                    const updated = prev.map(loc => {
                        // Match by either the frontend id or the location_id from API
                        const matches = loc.id === id || loc.id === transformedLocation.id || 
                                      (updatedLocation as any)?.location_id === loc.id ||
                                      (updatedLocation as any)?.id === loc.id;
                        if (matches) {
                            console.log('[ScreenplayContext] ✅ Matched location for update:', { 
                                oldId: loc.id, 
                                newId: transformedLocation.id,
                                oldType: loc.type,
                                newType: transformedLocation.type
                            });
                            return transformedLocation;
                        }
                        return loc;
                    });
                    return updated;
                });
                
                console.log('[ScreenplayContext] ✅ Updated location in DynamoDB and synced local state');
                
                // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
                // The force reload was causing the address to disappear because it was happening
                // before DynamoDB had fully written the item, or the address wasn't in the list response
                // Instead, we rely on the state sync above which uses the actual API response
                // The data will be correct on the next page refresh when initializeData runs
                // forceReloadRef.current = true;
                // hasInitializedRef.current = false;
                // setReloadTrigger(prev => prev + 1);
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
                
                // 🔥 FIX: Force reload from DynamoDB to ensure we have the latest data
                forceReloadRef.current = true;
                hasInitializedRef.current = false;
                setReloadTrigger(prev => prev + 1);
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
        // 🔥 FIX: Actually rebuild relationships from current scenes, characters, and locations
        console.log('[ScreenplayContext] 🔄 Rebuilding relationships from current state...');
        
        // Extract all scenes from all beats
        const allScenes: Scene[] = [];
        beats.forEach(beat => {
            beat.scenes.forEach(scene => {
                allScenes.push(scene);
            });
        });
        
        // 🔥 FIX: Use refs to get latest state (avoid stale closures)
        const currentCharacters = charactersRef.current.length > 0 ? charactersRef.current : characters;
        const currentLocations = locationsRef.current.length > 0 ? locationsRef.current : locations;
        
        // Rebuild relationships using the same function used during initialization
        buildRelationshipsFromScenes(allScenes, beats, currentCharacters, currentLocations);
        
        console.log('[ScreenplayContext] ✅ Relationships rebuilt');
    }, [beats, characters, locations, buildRelationshipsFromScenes]);
    
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
        
        return charRels.appearsInScenes
            .map(sceneId => scenes.find(s => s.id === sceneId))
            .filter((s): s is Scene => s !== undefined);
    }, [relationships, scenes]);
    
    const getLocationScenes = useCallback((locationId: string): Scene[] => {
        const locRels = relationships.locations[locationId];
        if (!locRels) return [];
        
        return locRels.scenes
            .map(sceneId => scenes.find(s => s.id === sceneId))
            .filter((s): s is Scene => s !== undefined);
    }, [relationships, scenes]);
    
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
    
    // 🔥 NEW: Helper to check if two character names are variations of each other
    // Examples: "SARAH" vs "SARAH CHEN", "RIVERA" vs "DETECTIVE RIVERA"
    const areCharacterNamesSimilar = useCallback((name1: string, name2: string): boolean => {
        const upper1 = name1.toUpperCase().trim();
        const upper2 = name2.toUpperCase().trim();
        
        // Exact match
        if (upper1 === upper2) return true;
        
        // One name contains the other (e.g., "DETECTIVE RIVERA" contains "RIVERA")
        if (upper1.includes(upper2) || upper2.includes(upper1)) {
            // But exclude very short matches (e.g., "A" matching "SARAH")
            const shorter = upper1.length < upper2.length ? upper1 : upper2;
            const longer = upper1.length >= upper2.length ? upper1 : upper2;
            
            // Only consider it a match if the shorter name is at least 3 characters
            // and the longer name contains it as a whole word or at the start
            if (shorter.length >= 3) {
                // Check if shorter is a whole word in longer, or at the start/end
                const wordBoundaryRegex = new RegExp(`(^|\\s)${shorter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
                if (wordBoundaryRegex.test(longer)) {
                    return true;
                }
                // Also check if shorter is at the start or end of longer
                if (longer.startsWith(shorter + ' ') || longer.endsWith(' ' + shorter)) {
                    return true;
                }
            }
        }
        
        return false;
    }, []);
    
    const bulkImportCharacters = useCallback(async (
        characterNames: string[],
        descriptions?: Map<string, string>,
        explicitScreenplayId?: string
    ): Promise<Character[]> => {
        console.log('[ScreenplayContext] 🔄 Starting bulk character import...', characterNames.length, 'characters');
        
        const now = new Date().toISOString();
        const newCharacters: Character[] = [];
        
        // 🔥 FIX: Get existing characters to check for duplicates (exact and fuzzy)
        // Use refs if available (for rescan), otherwise use state
        const currentCharacters = charactersRef.current.length > 0 ? charactersRef.current : characters;
        const existingCharactersMap = new Map(
            currentCharacters.map(c => [c.name.toUpperCase(), c])
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
            
            // 🔥 FIX: Check for existing character (for rescan/additive import)
            // If explicitScreenplayId is provided, it's a destructive import (clearAllData was called)
            // Otherwise, it's a rescan/additive import - check for existing
            if (!explicitScreenplayId) {
                // Check for exact match
                const exactMatch = existingCharactersMap.get(upperName);
                if (exactMatch) {
                    console.log('[ScreenplayContext] Character already exists (exact match), skipping:', name);
                    continue;
                }
                
                // 🔥 NEW: Check for fuzzy match (variations like "SARAH" vs "SARAH CHEN")
                let fuzzyMatch: Character | undefined;
                for (const [existingUpper, existingChar] of existingCharactersMap.entries()) {
                    if (areCharacterNamesSimilar(upperName, existingUpper)) {
                        fuzzyMatch = existingChar;
                        console.log(`[ScreenplayContext] Character fuzzy match found: "${name}" matches "${existingChar.name}" - using existing`);
                        break;
                    }
                }
                
                if (fuzzyMatch) {
                    // Use the existing character (prefer longer/more specific name)
                    // Update description if the new one is more detailed
                    const newDescription = descriptions?.get(upperName);
                    if (newDescription && newDescription.length > (fuzzyMatch.description?.length || 0)) {
                        console.log(`[ScreenplayContext] Updating description for "${fuzzyMatch.name}" with more detailed description`);
                        // Note: We don't update here, just log - actual update would be in a separate function
                    }
                    continue; // Don't create duplicate
                }
            }
            
            // Create new character (either because it's a destructive import or it's truly new)
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
        
        // 🔥 FIX: During import (explicitScreenplayId), replace all characters (import is destructive)
        // For rescan (!explicitScreenplayId), we merge with existing
        const allCharacters = explicitScreenplayId ? newCharacters : [...currentCharacters, ...newCharacters];
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
        
        // 🔥 NEW: Save NEW characters to DynamoDB through persistence manager
        // Feature 0117: Accept explicit screenplay ID to avoid race conditions
        // 🔥 FIX: Only save NEW characters, not all characters (prevents duplicates in DB)
        const idToUse = explicitScreenplayId || screenplayId;
        if (idToUse && newCharacters.length > 0) {
            try {
                console.log('[ScreenplayContext] Saving', newCharacters.length, 'new characters to DynamoDB...');
                const apiCharacters = transformCharactersToAPI(newCharacters);
                await bulkCreateCharacters(idToUse, apiCharacters, getToken);
                console.log('[ScreenplayContext] ✅ Saved new characters to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save characters:', error);
                throw error;
            }
        } else if (idToUse && newCharacters.length === 0) {
            console.log('[ScreenplayContext] No new characters to save (all already exist)');
        } else {
            console.warn('[ScreenplayContext] ⚠️ No screenplay_id yet - characters saved to local state only (will save when screenplay is created)');
        }
        
        console.log('[ScreenplayContext] ✅ Bulk import complete:', newCharacters.length, 'new characters,', allCharacters.length, 'total');
        return newCharacters;
    }, [characters, screenplayId]);
    
    const bulkImportLocations = useCallback(async (
        locationNames: string[], 
        locationTypes?: Map<string, 'INT' | 'EXT' | 'INT/EXT'>, // 🔥 NEW: Optional location types map
        explicitScreenplayId?: string
    ): Promise<Location[]> => {
        console.log('[ScreenplayContext] 🔄 Starting bulk location import...', locationNames.length, 'locations');
        
        const now = new Date().toISOString();
        const newLocations: Location[] = [];
        
        // 🔥 FIX: Get existing locations to check for duplicates
        // Use refs if available (for rescan), otherwise use state
        const currentLocations = locationsRef.current.length > 0 ? locationsRef.current : locations;
        const existingLocationsMap = new Map(
            currentLocations.map(l => [l.name.toUpperCase(), l])
        );
        
        // Only skip duplicates WITHIN the import batch itself
        const seenNames = new Set<string>();
        
        for (const name of locationNames) {
            const upperName = name.toUpperCase();
            
            // Skip if we already processed this name in this import batch
            if (seenNames.has(upperName)) {
                console.log('[ScreenplayContext] Skipping duplicate in batch:', name);
                continue;
            }
            seenNames.add(upperName);
            
            // 🔥 FIX: Check for existing location (for rescan/additive import)
            // If explicitScreenplayId is provided, it's a destructive import (clearAllData was called)
            // Otherwise, it's a rescan/additive import - check for existing
            if (!explicitScreenplayId) {
                const existingLoc = existingLocationsMap.get(upperName);
                if (existingLoc) {
                    console.log('[ScreenplayContext] Location already exists, skipping:', name);
                    continue; // Don't create duplicate
                }
            }
            
            // 🔥 NEW: Get location type from map, default to 'INT' if not found
            const locationType = locationTypes?.get(name) || 'INT';
            
            // Create new location
            const newLocation: Location = {
                id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name,
                description: `Imported from script`,
                type: locationType, // 🔥 FIXED: Use parsed type instead of hardcoded 'INT'
                createdAt: now,
                updatedAt: now,
                images: []
            };
            
            console.log('[ScreenplayContext] Creating new location:', locationType, name);
            newLocations.push(newLocation);
        }
        
        // 🔥 FIX: During import (explicitScreenplayId), replace all locations (import is destructive)
        // For rescan (!explicitScreenplayId), we merge with existing
        const allLocations = explicitScreenplayId ? newLocations : [...currentLocations, ...newLocations];
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
        
        // 🔥 NEW: Save NEW locations to DynamoDB through persistence manager
        // Feature 0117: Accept explicit screenplay ID to avoid race conditions
        // 🔥 FIX: Only save NEW locations, not all locations (prevents duplicates in DB)
        const idToUse = explicitScreenplayId || screenplayId;
        if (idToUse && newLocations.length > 0) {
            try {
                console.log('[ScreenplayContext] Saving', newLocations.length, 'new locations to DynamoDB...');
                const apiLocations = transformLocationsToAPI(newLocations);
                await bulkCreateLocations(idToUse, apiLocations, getToken);
                console.log('[ScreenplayContext] ✅ Saved new locations to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save locations:', error);
                throw error;
            }
        } else if (idToUse && newLocations.length === 0) {
            console.log('[ScreenplayContext] No new locations to save (all already exist)');
        } else {
            console.warn('[ScreenplayContext] ⚠️ No screenplay_id yet - locations saved to local state only (will save when screenplay is created)');
        }
        
        console.log('[ScreenplayContext] ✅ Bulk import complete:', newLocations.length, 'new locations,', allLocations.length, 'total');
        return newLocations;
    }, [locations, screenplayId]);
    
    const bulkImportScenes = useCallback(async (
        beatId: string, // 🔥 Kept for backward compatibility but not used (beats removed)
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
            // Feature 0117: Removed beatId from Scene object - scenes are standalone
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
        
        // 🔥 Beats removed - add directly to scenes state with deduplication
        setScenes(prev => {
            const existingSceneIds = new Set(prev.map(s => s.id));
            const existingContentKeys = new Set(
                prev.map(s => `${(s.heading || '').toUpperCase().trim()}|${s.fountain?.startLine || 0}`)
            );
            
            const trulyNewScenes = newScenes.filter(scene => {
                // Check by ID
                if (existingSceneIds.has(scene.id)) return false;
                
                // Check by content (heading + startLine)
                const contentKey = `${(scene.heading || '').toUpperCase().trim()}|${scene.fountain?.startLine || 0}`;
                if (existingContentKeys.has(contentKey)) return false;
                
                return true;
            });
            
            if (trulyNewScenes.length < newScenes.length) {
                console.log(`[ScreenplayContext] 🔍 Deduplicated ${newScenes.length - trulyNewScenes.length} duplicate scenes`);
            }
            
            return [...prev, ...trulyNewScenes];
        });
        
        // Add to relationships
        setRelationships(prev => {
            const updatedScenes = { ...prev.scenes };
            const updatedCharacters = { ...prev.characters };
            const updatedLocations = { ...prev.locations };
            
            newScenes.forEach(scene => {
                // Create scene relationship (beats removed - no storyBeat)
                updatedScenes[scene.id] = {
                    type: 'scene',
                    characters: scene.fountain.tags.characters || [],
                    location: scene.fountain.tags.location
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
        
        // Feature 0117: Save scenes directly to DynamoDB (beats don't persist)
        if (screenplayId && newScenes.length > 0) {
            try {
                const apiScenes = transformScenesToAPI(newScenes);
                await bulkCreateScenes(screenplayId, apiScenes, getToken);
                console.log('[ScreenplayContext] ✅ Saved', newScenes.length, 'imported scenes to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save imported scenes to DynamoDB:', error);
            }
        }
        
        return newScenes;
    }, [screenplayId, getToken]);
    
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
    // Scene Matching Helper (Hybrid: ID first, heading+position fallback)
    // ========================================================================
    
    /**
     * Match a parsed scene to an existing scene using hybrid matching:
     * 1. Try ID match (most reliable)
     * 2. Fallback to heading + position proximity
     * 3. Return null if no match found (treat as new scene)
     */
    const matchScene = useCallback((
        parsedScene: { heading: string; startLine: number; endLine: number; id?: string },
        existingScenes: Scene[]
    ): Scene | null => {
        // Step 1: Try ID match (most reliable)
        if (parsedScene.id) {
            const idMatch = existingScenes.find(s => 
                s.id === parsedScene.id || 
                (s as any).scene_id === parsedScene.id
            );
            if (idMatch) {
                console.log('[ScreenplayContext] Matched scene by ID:', parsedScene.id, '->', idMatch.heading);
                return idMatch;
            }
        }
        
        // Step 2: Try heading + position match (exact match)
        const normalizedHeading = parsedScene.heading.toUpperCase().trim();
        const candidates = existingScenes.filter(s => 
            s.heading.toUpperCase().trim() === normalizedHeading
        );
        
        if (candidates.length === 1) {
            // Single exact match - use it
            console.log('[ScreenplayContext] Matched scene by heading:', parsedScene.heading, '->', candidates[0].id);
            return candidates[0];
        }
        
        // Step 3: Try location-based matching (handle INT/EXT vs INT changes)
        // Extract location name from heading (e.g., "INT. LOCATION - DAY" -> "LOCATION")
        const extractLocationName = (heading: string): string => {
            const match = heading.match(/(?:INT|EXT|INT\/EXT|I\/E)[\.\s]+(.+?)(?:\s*-\s*(?:DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER))?$/i);
            return match ? match[1].trim().toUpperCase() : '';
        };
        
        const parsedLocationName = extractLocationName(parsedScene.heading);
        if (parsedLocationName) {
            // Find scenes with same location name and similar startLine (within 5 lines)
            const locationMatches = existingScenes.filter(s => {
                const existingLocationName = extractLocationName(s.heading);
                const locationMatch = existingLocationName === parsedLocationName;
                const positionMatch = Math.abs((s.fountain?.startLine || 0) - parsedScene.startLine) <= 5;
                return locationMatch && positionMatch;
            });
            
            if (locationMatches.length === 1) {
                console.log('[ScreenplayContext] Matched scene by location name + position:', parsedScene.heading, '->', locationMatches[0].heading, locationMatches[0].id);
                return locationMatches[0];
            }
        }
        
        if (candidates.length === 0) {
            // No match found
            return null;
        }
        
        // Multiple scenes with same heading - use position proximity
        const bestMatch = candidates.reduce((best, current) => {
            const currentDistance = Math.abs((current.fountain?.startLine || 0) - parsedScene.startLine);
            const bestDistance = Math.abs((best.fountain?.startLine || 0) - parsedScene.startLine);
            return currentDistance < bestDistance ? current : best;
        });
        
        console.log('[ScreenplayContext] Matched scene by heading+position:', parsedScene.heading, '->', bestMatch.id, `(distance: ${Math.abs((bestMatch.fountain?.startLine || 0) - parsedScene.startLine)} lines)`);
        return bestMatch;
    }, []);
    
    // ========================================================================
    // Scene Position Management
    // ========================================================================
    
    const updateScenePositions = useCallback(async (content: string): Promise<number> => {
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
        
        // Match scenes using hybrid matching (ID first, heading+position fallback)
        const updates = new Map<string, { beatId: string; updates: Partial<Scene> }>();
        
        allScenesFlat.forEach((item, index) => {
            if (index < scenesInOrder.length) {
                const contentScene = scenesInOrder[index];
                const currentStartLine = item.scene.fountain?.startLine ?? -1;
                const currentEndLine = item.scene.fountain?.endLine ?? -1;
                
                // Check if position actually changed
                const positionChanged = currentStartLine !== contentScene.startLine || currentEndLine !== contentScene.endLine;
                
                // Use hybrid matching to find the best match
                const matchedScene = matchScene(
                    { heading: contentScene.heading, startLine: contentScene.startLine, endLine: contentScene.endLine, id: item.scene.id },
                    [item.scene] // Pass single scene for matching (we already know it's the right one by order)
                );
                
                if (matchedScene && matchedScene.id === item.scene.id) {
                    // Match confirmed - update position only if it changed
                    if (positionChanged) {
                        console.log(`[ScreenplayContext] Scene ${index + 1}: "${item.scene.heading}" -> lines ${contentScene.startLine}-${contentScene.endLine} (was ${currentStartLine}-${currentEndLine})`);
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
                        console.log(`[ScreenplayContext] Scene ${index + 1}: "${item.scene.heading}" -> position unchanged (${contentScene.startLine}-${contentScene.endLine})`);
                    }
                } else {
                    // Try matching by heading only (fallback for order-based matching)
                    if (item.scene.heading.toUpperCase().trim() === contentScene.heading.toUpperCase().trim()) {
                        if (positionChanged) {
                            console.log(`[ScreenplayContext] Scene ${index + 1}: "${item.scene.heading}" -> lines ${contentScene.startLine}-${contentScene.endLine} (heading match, was ${currentStartLine}-${currentEndLine})`);
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
                            console.log(`[ScreenplayContext] Scene ${index + 1}: "${item.scene.heading}" -> position unchanged (heading match)`);
                        }
                    } else {
                        console.warn(`[ScreenplayContext] Heading mismatch at position ${index}: DB="${item.scene.heading}" vs Content="${contentScene.heading}"`);
                    }
                }
            }
        });
        
        // Apply updates and collect updated scenes for saving
        const updatedScenes: Scene[] = [];
        setBeats(prev => {
            const updatedBeats = prev.map(beat => ({
            ...beat,
            scenes: beat.scenes.map(scene => {
                const update = updates.get(scene.id);
                    if (update && update.beatId === beat.id) {  // Ensure scene belongs to this beat
                        const updatedScene = { ...scene, ...update.updates };
                        updatedScenes.push(updatedScene);
                        return updatedScene;
                }
                return scene;
            })
            }));
            return updatedBeats;
        });
        
        console.log('[ScreenplayContext] Scene positions updated -', updates.size, 'scenes updated');
        
        // Save updated scenes to DynamoDB
        if (screenplayId && updatedScenes.length > 0) {
            try {
                const apiScenes = transformScenesToAPI(updatedScenes);
                await bulkCreateScenes(screenplayId, apiScenes, getToken);
                console.log('[ScreenplayContext] ✅ Saved', updatedScenes.length, 'updated scene positions to DynamoDB');
            } catch (error) {
                console.error('[ScreenplayContext] ❌ Failed to save updated scene positions:', error);
            }
        }
        
        return updates.size; // Return count of scenes that were actually updated
    }, [beats, matchScene, screenplayId, transformScenesToAPI, getToken]);
    
    useEffect(() => {
        updateScenePositionsRef.current = updateScenePositions;
    }, [updateScenePositions]);
    
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
            
        // 🔥 FIX: DON'T clear characters/locations here!
        // clearAllData() already cleared them from DynamoDB
        // Clearing them here causes race condition where import sets them, then this clears them again
        // We ONLY need to reset beats and relationships
            setBeats(freshBeats);
        // setCharacters([]);  // ❌ REMOVED: Causes race condition!
        // setLocations([]);    // ❌ REMOVED: Causes race condition!
            setRelationships({
                beats: {},
                characters: {},
                locations: {},
                scenes: {},
                props: {}
            });
            
        console.log('[ScreenplayContext] ✅ Reset beats to default template (characters/locations will be set by import)');
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
            // 🔥 FIX: Use current state from refs to avoid stale closures
            const currentCharacters = charactersRef.current.length > 0 ? charactersRef.current : characters;
            const existingCharNames = new Set(
                currentCharacters.map(c => c.name.toUpperCase())
            );
            const newCharacterNames = Array.from(parseResult.characters)
                .filter((name: string) => !existingCharNames.has(name.toUpperCase()));
            
            // Find NEW locations (case-insensitive comparison)
            // 🔥 FIX: Use current state from refs to avoid stale closures
            const currentLocations = locationsRef.current.length > 0 ? locationsRef.current : locations;
            const existingLocNames = new Set(
                currentLocations.map(l => l.name.toUpperCase())
            );
            const newLocationNames = Array.from(parseResult.locations)
                .filter((name: string) => !existingLocNames.has(name.toUpperCase()));
            
            // Find NEW scenes using hybrid matching
            // Collect all existing scenes from all beats
            // 🔥 Beats removed - get all existing scenes directly
            const currentScenes = scenesRef.current.length > 0 ? scenesRef.current : scenes;
            const allExistingScenes = currentScenes;
            
            const newScenes: typeof parseResult.scenes = [];
            const existingScenesToUpdate: typeof parseResult.scenes = [];
            
            parseResult.scenes.forEach(parsedScene => {
                const matched = matchScene(
                    { heading: parsedScene.heading, startLine: parsedScene.startLine, endLine: parsedScene.endLine },
                    allExistingScenes
                );
                
                if (!matched) {
                    // No match found - it's a new scene
                    newScenes.push(parsedScene);
                    console.log('[ScreenplayContext] New scene detected:', parsedScene.heading);
                } else {
                    // Match found - mark for position update
                    existingScenesToUpdate.push(parsedScene);
                }
            });
            
            console.log('[ScreenplayContext] Found new entities:', {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length,
                newScenes: newScenes.length,
                existingScenesToUpdate: existingScenesToUpdate.length
            });
            
            // Import only NEW entities
            if (newCharacterNames.length > 0) {
                console.log('[ScreenplayContext] Importing', newCharacterNames.length, 'new characters:', newCharacterNames);
                await bulkImportCharacters(newCharacterNames, parseResult.characterDescriptions);
            }
            
            if (newLocationNames.length > 0) {
                console.log('[ScreenplayContext] Importing', newLocationNames.length, 'new locations:', newLocationNames);
                // 🔥 FIX: Pass locationTypes to bulkImportLocations
                await bulkImportLocations(newLocationNames, parseResult.locationTypes);
            }
            
            // 🔥 NEW: Update existing characters/locations with new descriptions from script
            // This handles cases where descriptions are updated in the script
            const existingCharacterNames = Array.from(parseResult.characters)
                .filter((name: string) => existingCharNames.has(name.toUpperCase()));
            
            if (existingCharacterNames.length > 0) {
                console.log('[ScreenplayContext] Updating', existingCharacterNames.length, 'existing characters with new descriptions...');
                for (const charName of existingCharacterNames) {
                    const existingChar = currentCharacters.find(c => c.name.toUpperCase() === charName.toUpperCase());
                    const newDescription = parseResult.characterDescriptions?.get(charName.toUpperCase());
                    
                    if (existingChar && newDescription && newDescription.length > (existingChar.description?.length || 0)) {
                        console.log(`[ScreenplayContext] Updating character "${charName}" description (${existingChar.description?.length || 0} → ${newDescription.length} chars)`);
                        await updateCharacter(existingChar.id, { description: newDescription });
                    }
                }
            }
            
            // Update existing locations with new types (if location type changed in script)
            const existingLocationNames = Array.from(parseResult.locations)
                .filter((name: string) => existingLocNames.has(name.toUpperCase()));
            
            if (existingLocationNames.length > 0) {
                console.log('[ScreenplayContext] Updating', existingLocationNames.length, 'existing locations with new types...');
                for (const locName of existingLocationNames) {
                    const existingLoc = currentLocations.find(l => l.name.toUpperCase() === locName.toUpperCase());
                    const newType = parseResult.locationTypes?.get(locName);
                    
                    if (existingLoc && newType && existingLoc.type !== newType) {
                        console.log(`[ScreenplayContext] Updating location "${locName}" type (${existingLoc.type} → ${newType})`);
                        await updateLocation(existingLoc.id, { type: newType });
                    }
                }
            }
            
            // Import new scenes (beats removed - scenes are standalone)
            if (newScenes.length > 0) {
                console.log('[ScreenplayContext] Importing', newScenes.length, 'new scenes');
                // 🔥 FIX: Use currentCharacters (from refs) to avoid stale state
                await bulkImportScenes('', newScenes.map(scene => ({ // beatId not used anymore
                    heading: scene.heading,
                    location: scene.location,
                    characterIds: scene.characters.map(charName => {
                        // Find character ID by name (use currentCharacters from refs)
                        const char = currentCharacters.find(c => c.name.toUpperCase() === charName.toUpperCase());
                        return char?.id || '';
                    }).filter(id => id !== ''),
                    locationId: (() => {
                        // Find location ID by name (use currentLocations from refs)
                        const loc = currentLocations.find(l => l.name.toUpperCase() === scene.location.toUpperCase());
                        return loc?.id;
                    })(),
                    startLine: scene.startLine,
                    endLine: scene.endLine
                })));
                
                // 🔥 CRITICAL FIX: Renumber ALL scenes after importing new ones
                setScenes(prev => {
                    const sorted = [...prev].sort((a, b) => {
                        const orderA = a.order ?? a.number ?? 0;
                        const orderB = b.order ?? b.number ?? 0;
                        return orderA - orderB;
                    });
                    
                    return sorted.map((scene, index) => ({
                        ...scene,
                        number: index + 1,
                        order: index
                    }));
                });
                console.log('[ScreenplayContext] ✅ Renumbered all scenes after import');
            }
            
            // Update positions for existing scenes
            let updatedScenesCount = 0;
            if (existingScenesToUpdate.length > 0) {
                console.log('[ScreenplayContext] Updating positions for', existingScenesToUpdate.length, 'existing scenes');
                updatedScenesCount = await updateScenePositions(content);
                console.log('[ScreenplayContext] Actually updated', updatedScenesCount, 'scene positions');
            }
            
            // 🔥 FIX: Rebuild relationships after rescan to ensure scene counts are updated
            await updateRelationships();
            console.log('[ScreenplayContext] ✅ Rebuilt relationships after rescan');
            
            console.log('[ScreenplayContext] ✅ Re-scan complete:', {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length,
                newScenes: newScenes.length,
                updatedScenes: updatedScenesCount
            });
            
            return {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length,
                newScenes: newScenes.length,
                updatedScenes: updatedScenesCount
            };
        } catch (err) {
            console.error('[ScreenplayContext] ❌ Re-scan failed:', err);
            throw err;
        }
    }, [characters, locations, beats, bulkImportCharacters, bulkImportLocations, bulkImportScenes, matchScene, updateScenePositions, updateCharacter, updateLocation, updateRelationships]);
    
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
            scenes: scenesRef.current,
            characters: charactersRef.current,
            locations: locationsRef.current
        };
    }, []); // No dependencies - always returns current ref values!
    
    // ========================================================================
    // Phase 2: Check if Entity Appears in Script
    // ========================================================================
    
    /**
     * Check if a character or location name appears in the script content.
     * Used to determine if an entity is "active" (in script) or "reference-only" (not in script).
     */
    const isEntityInScript = useCallback((scriptContent: string, entityName: string, entityType: 'character' | 'location'): boolean => {
        if (!scriptContent || !entityName) {
            return false;
        }
        
        const normalizedName = entityName.toUpperCase().trim();
        if (!normalizedName) {
            return false;
        }
        
        const lines = scriptContent.split('\n');
        
        if (entityType === 'character') {
            // Check for character name in dialogue (all caps, standalone line)
            // Also check for @CHARACTER notation
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const upperLine = line.toUpperCase();
                
                // Check for @CHARACTER notation
                if (line.startsWith('@') && upperLine.substring(1).trim() === normalizedName) {
                    return true;
                }
                
                // Check for character name as dialogue (all caps, standalone)
                // Character names in dialogue are typically all caps and on their own line
                if (upperLine === normalizedName && line.length > 0) {
                    // Make sure it's not part of a scene heading or action
                    const prevLine = i > 0 ? lines[i - 1].trim() : '';
                    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
                    
                    // If next line is empty or dialogue, this is likely a character name
                    if (!nextLine || nextLine.length === 0 || (!nextLine.startsWith('INT.') && !nextLine.startsWith('EXT.') && !nextLine.startsWith('INT/EXT.'))) {
                        return true;
                    }
                }
            }
        } else if (entityType === 'location') {
            // Check for location name in scene headings (INT./EXT./INT/EXT. LOCATION NAME)
            const locationPattern = new RegExp(`(?:INT|EXT|INT/EXT)\\.\\s+${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$|-)`, 'i');
            
            for (const line of lines) {
                if (locationPattern.test(line)) {
                    return true;
                }
            }
        }
        
        return false;
    }, []);
    
    // ========================================================================
    // Context Value
    // ========================================================================
    
    const value: ScreenplayContextType = {
        // State
        beats,
        scenes,
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
        setScenes,
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
        clearAllData,
        
        // Phase 2: Reference-only manual creation
        isEntityInScript
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

