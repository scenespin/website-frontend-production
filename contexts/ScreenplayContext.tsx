'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode, startTransition } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
import type { Asset, AssetCategory } from '@/types/asset';
import { api } from '@/lib/api';
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
    updateScene as apiUpdateScene,
    deleteScene as apiDeleteScene,
    deleteAllScenes,
    batchUpdatePropAssociations as apiBatchUpdatePropAssociations,
    // Feature 0117: Beat API functions removed - beats are frontend-only UI templates
    updateRelationships as apiUpdateRelationships,
    updateScreenplay as apiUpdateScreenplay,
    // Feature 0122: Collaboration functions
    listScreenplayCollaborators,
    addScreenplayCollaborator,
    removeScreenplayCollaborator,
    updateCollaboratorRole,
    getAvailableRoles,
    checkScreenplayPermission,
    getScreenplay
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
    
    // CRUD - Assets (Props)
    assets: Asset[];
    createAsset: (asset: { name: string; category: AssetCategory; description?: string; tags?: string[] }) => Promise<Asset>;
    updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
    getAssetScenes: (assetId: string) => string[];
    // Feature 0136: Asset-Scene Association
    linkAssetToScene: (assetId: string, sceneId: string) => Promise<void>;
    unlinkAssetFromScene: (assetId: string, sceneId: string) => Promise<void>;
    batchUpdatePropAssociations: (assetId: string, sceneIdsToLink: string[], sceneIdsToUnlink: string[]) => Promise<void>;
    
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
    rescanScript: (content: string) => Promise<{ newCharacters: number; newLocations: number; newScenes: number; updatedScenes: number; preservedMetadata?: number; }>;
    
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
        metadata?: { 
            prompt?: string; 
            modelUsed?: string;
            angle?: string; // For character headshots: 'front' | 'side' | 'three-quarter'
            s3Key?: string; // S3 key for file management
            source?: string; // Source of image: 'pose-generation' | 'user-upload' | etc.
        }
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
    // Check if a character, location, or asset appears in the script content
    isEntityInScript: (scriptContent: string, entityName: string, entityType: 'character' | 'location' | 'asset') => boolean;
    
    // Feature 0122: Role-Based Collaboration System - Phase 3B
    // Permission State
    currentUserRole: 'director' | 'writer' | 'producer' | 'viewer' | null;
    isOwner: boolean;
    permissionsLoading: boolean; // Track if permissions are being loaded
    canEditScript: boolean;
    canViewScript: boolean;
    canManageAssets: boolean;
    canManageOwnAssets: boolean;
    canGenerateAssets: boolean;
    canAccessProductionHub: boolean;
    canUploadCreationImages: boolean;
    canUploadAssets: boolean;
    canViewAssets: boolean;
    canUseAI: boolean;
    canEditComposition: boolean;
    canEditTimeline: boolean;
    canViewComposition: boolean;
    canViewTimeline: boolean;
    collaborators: Array<{
        user_id?: string;
        email: string;
        role: 'director' | 'writer' | 'producer' | 'viewer';
        added_at: string;
        added_by?: string;
    }>;
    
    // Collaboration Management Functions
    loadCollaboratorPermissions: (screenplayId: string) => Promise<void>;
    loadCollaborators: (screenplayId: string) => Promise<void>;
    addCollaborator: (email: string, role: 'director' | 'writer' | 'producer' | 'viewer') => Promise<void>;
    removeCollaborator: (identifier: string) => Promise<void>;
    updateCollaboratorRole: (identifier: string, newRole: 'director' | 'writer' | 'producer' | 'viewer') => Promise<void>;
    getAvailableRoles: () => Promise<Array<{
        id: string;
        name: string;
        description: string;
        capabilities: Record<string, boolean>;
    }>>;
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
    const [assets, setAssets] = useState<Asset[]>(() => {
        console.log('[ScreenplayContext] 🏗️ INITIAL STATE: Creating empty assets array');
        // 🔥 FIX: Load recently created assets from sessionStorage to handle eventual consistency
        // Note: screenplayId is not available in initializer, so we'll load from sessionStorage in useEffect
        return [];
    });
    
    // 🔥 NEW: React Query client for cache invalidation
    const queryClient = useQueryClient();
    
    // 🔥 NEW: Refs to access current state without closure issues
    // These are updated in sync with state and can be read in callbacks without stale closures
    const beatsRef = useRef<StoryBeat[]>([]);
    const scenesRef = useRef<Scene[]>([]);
    const charactersRef = useRef<Character[]>([]);
    const locationsRef = useRef<Location[]>([]);
    const assetsRef = useRef<Asset[]>([]);
    const relationshipsRef = useRef<Relationships | null>(null);
    // 🔥 FIX: Track last buildRelationshipsFromScenes call to prevent redundant updates
    const lastBuildRelationshipsRef = useRef<{
        sceneIds: string;
        characterIds: string;
        locationIds: string;
        beatIds: string;
    } | null>(null);
    // 🔥 FIX: Track if refresh is in progress to prevent multiple simultaneous refreshes
    const isRefreshingScenesRef = useRef<boolean>(false);
    // 🔥 FIX: Track deleted asset IDs to prevent them from reappearing due to eventual consistency
    // Will be initialized after screenplayId is declared
    const deletedAssetIdsRef = useRef<Set<string>>(new Set());
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
    useEffect(() => { 
        assetsRef.current = assets; 
        console.log('[ScreenplayContext] 🔄 Assets state updated:', assets.length);
        if (typeof window !== 'undefined') {
            (window as any).__debug_assets = assets;
        }
    }, [assets]);
    
    // Relationships - START WITH EMPTY STATE
    // 🔥 CRITICAL FIX: Do NOT load from localStorage on mount - DynamoDB is source of truth
    const [relationships, setRelationships] = useState<Relationships>({
        beats: {},
        scenes: {},
        characters: {},
        locations: {},
        props: {}
    });
    
    // Keep relationshipsRef in sync with relationships state
    useEffect(() => { 
        relationshipsRef.current = relationships; 
    }, [relationships]);

    const [isLoading, setIsLoading] = useState(true); // Start true until DynamoDB loads
    const [error, setError] = useState<string | null>(null);
    
    // Feature 0122: Role-Based Collaboration System - Phase 3B
    // Permission State
    const [currentUserRole, setCurrentUserRole] = useState<'director' | 'writer' | 'producer' | 'viewer' | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false); // Track if permissions are being loaded
    const permissionsLoadingRef = useRef<string | null>(null); // Track which screenplayId is currently loading permissions
    const [canEditScript, setCanEditScript] = useState(false);
    const [canViewScript, setCanViewScript] = useState(false);
    const [canManageAssets, setCanManageAssets] = useState(false);
    const [canManageOwnAssets, setCanManageOwnAssets] = useState(false);
    const [canGenerateAssets, setCanGenerateAssets] = useState(false);
    const [canAccessProductionHub, setCanAccessProductionHub] = useState(false);
    const [canUploadCreationImages, setCanUploadCreationImages] = useState(false);
    const [canUploadAssets, setCanUploadAssets] = useState(false);
    const [canViewAssets, setCanViewAssets] = useState(false);
    const [canUseAI, setCanUseAI] = useState(false);
    const [canEditComposition, setCanEditComposition] = useState(false);
    const [canEditTimeline, setCanEditTimeline] = useState(false);
    const [canViewComposition, setCanViewComposition] = useState(false);
    const [canViewTimeline, setCanViewTimeline] = useState(false);
    const [collaborators, setCollaborators] = useState<Array<{
        user_id?: string;
        email: string;
        role: 'director' | 'writer' | 'producer' | 'viewer';
        added_at: string;
        added_by?: string;
    }>>([]);
    
    // Track if we've auto-created the 8-Sequence Structure to prevent duplicates
    const hasAutoCreated = useRef(false);
    
    // 🔥 NEW: Track which screenplay_id we've initialized to prevent duplicate effect executions
    // Stores the last screenplay_id (or 'no-id') that we initialized for
    const hasInitializedRef = useRef<string | false>(false);
    
    // 🔥 NEW: Force reload flag - when set, will force re-initialization even if already initialized
    const forceReloadRef = useRef(false);
    
    // 🔥 NEW: Flag to prevent concurrent initialization runs
    const isInitializingRef = useRef(false);
    
    // 🔥 NEW: Flag to prevent concurrent rescan operations
    const isRescanningRef = useRef(false);
    
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
            // 🔥 FIX: Extract s3Key, not imageUrl (presigned URLs are 1000+ chars, causing KeyTooLongError)
            referenceImages: char.images?.map(img => {
                if (img.metadata?.s3Key) return img.metadata.s3Key;
                if (img.imageUrl && (img.imageUrl.includes('temp/') || img.imageUrl.includes('timeline/'))) {
                    const urlMatch = img.imageUrl.match(/(temp\/[^?]+|timeline\/[^?]+)/);
                    if (urlMatch && urlMatch[1]) return urlMatch[1];
                }
                return null;
            }).filter((key): key is string => key !== null && key.length <= 1024) || []
        }));
    }, []);
    
    const transformCharactersFromAPI = useCallback((apiCharacters: any[], existingCharacters?: Character[]): Character[] => {
        console.log('[ScreenplayContext] 🔄 transformCharactersFromAPI - Input:', apiCharacters.length, 'characters');
        const transformed = apiCharacters.map(char => {
            // Try to find existing character to preserve angle metadata
            const existingChar = existingCharacters?.find(c => 
                c.id === (char.id || char.character_id) || 
                c.name === char.name
            );
            
            // Create a map of s3Key -> angle from existing character for preservation
            const angleMap = new Map<string, string | undefined>();
            if (existingChar?.images) {
                existingChar.images.forEach(img => {
                    const s3Key = img.metadata?.s3Key;
                    if (s3Key) {
                        angleMap.set(s3Key, img.metadata?.angle);
                    }
                });
            }
            
            return {
                id: char.id || char.character_id,
                name: char.name || '',
                description: char.description || '',
                type: (char.type as CharacterType) || 'lead', // 🔥 FIX: Read type from API, default to 'lead'
                arcStatus: (char.arcStatus as ArcStatus) || 'introduced' as ArcStatus, // 🔥 FIX: Read arcStatus from API, default to 'introduced' if missing
                arcNotes: char.arcNotes || '', // 🔥 FIX: Read arcNotes from API
                physicalAttributes: char.physicalAttributes || undefined, // 🔥 FIX: Include physicalAttributes from API
                // 🔥 FIX: Use images array from backend (with presigned URLs and s3Keys) instead of referenceImages
                // 🔥 FIX: Preserve angle metadata from existing character state by matching s3Key
                // 🔥 CRITICAL FIX: Preserve ALL metadata from API (including source, poseId, etc.) for proper image filtering
                images: (char.images || []).map((img: any) => {
                    const s3Key = img.s3Key;
                    const preservedAngle = s3Key ? angleMap.get(s3Key) : undefined;
                    // Use angle from backend response if available, otherwise use preserved angle
                    const angle = img.angle || img.metadata?.angle || preservedAngle;
                    
                    return {
                        imageUrl: img.imageUrl || img.url || '',
                        description: '',
                        metadata: {
                            // Preserve ALL metadata from API response (source, poseId, poseName, outfitName, etc.)
                            ...(img.metadata || {}),
                            s3Key: s3Key, // Ensure s3Key is set (may be in metadata or top-level)
                            angle: angle // Preserve angle metadata from existing state or backend response
                        }
                    };
                }),
                customFields: [],
                createdAt: char.created_at || new Date().toISOString(),
                updatedAt: char.updated_at || new Date().toISOString()
            };
        });
        console.log('[ScreenplayContext] ✅ transformCharactersFromAPI - Output sample:', 
            transformed.length > 0 ? { 
                name: transformed[0].name, 
                arcStatus: transformed[0].arcStatus,
                type: typeof transformed[0].arcStatus,
                imageCount: transformed[0].images?.length || 0,
                imagesWithAngles: transformed[0].images?.filter(img => img.metadata?.angle).length || 0
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
            // 🔥 FIX: Extract s3Key, not imageUrl (presigned URLs are 1000+ chars, causing KeyTooLongError)
            referenceImages: loc.images?.map(img => {
                if (img.metadata?.s3Key) return img.metadata.s3Key;
                if (img.imageUrl && (img.imageUrl.includes('temp/') || img.imageUrl.includes('timeline/'))) {
                    const urlMatch = img.imageUrl.match(/(temp\/[^?]+|timeline\/[^?]+)/);
                    if (urlMatch && urlMatch[1]) return urlMatch[1];
                }
                return null;
            }).filter((key): key is string => key !== null && key.length <= 1024) || [],
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
            // 🔥 FIX: Use images array from backend (with presigned URLs and s3Keys) instead of referenceImages
            // 🔥 CRITICAL FIX: Preserve ALL metadata from API (including source, angle, etc.) for proper image filtering
            images: (loc.images || []).map((img: any) => ({
                imageUrl: img.imageUrl || img.url || '',
                description: '',
                metadata: {
                    // Preserve ALL metadata from API response (source, angle, etc.)
                    ...(img.metadata || {}),
                    s3Key: img.s3Key || img.metadata?.s3Key // Ensure s3Key is set (may be in metadata or top-level)
                }
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
        // 🔥 FIX: Check if inputs are the same as last call to prevent redundant updates
        const sceneIds = scenes.map(s => s.id).sort().join(',');
        const characterIds = charactersList.map(c => c.id).sort().join(',');
        const locationIds = locationsList.map(l => l.id).sort().join(',');
        const beatIds = beats.map(b => b.id).sort().join(',');
        
        if (
            lastBuildRelationshipsRef.current &&
            lastBuildRelationshipsRef.current.sceneIds === sceneIds &&
            lastBuildRelationshipsRef.current.characterIds === characterIds &&
            lastBuildRelationshipsRef.current.locationIds === locationIds &&
            lastBuildRelationshipsRef.current.beatIds === beatIds
        ) {
            // Same inputs - skip to prevent infinite loop
            return;
        }
        
        // Update ref with current inputs
        lastBuildRelationshipsRef.current = {
            sceneIds,
            characterIds,
            locationIds,
            beatIds
        };
        
        console.log('[ScreenplayContext] 🔗 Building relationships from', scenes.length, 'scenes...');
        console.log('[ScreenplayContext] 🔍 Available characters:', charactersList.map(c => ({ id: c.id, name: c.name })));
        console.log('[ScreenplayContext] 🔍 Available locations:', locationsList.map(l => ({ id: l.id, name: l.name })));
        
        // 🔥 FIX: Update synchronously (safe in useEffect) so relationships are available immediately
        setRelationships(prev => {
            // 🔥 FIX: Get set of valid scene IDs to clean up references to deleted scenes
            const validSceneIds = new Set(scenes.map(s => s.id));
            
            const newRels = {
                beats: { ...prev.beats },
                scenes: {} as typeof prev.scenes, // Start fresh - only include scenes that exist
                characters: { ...prev.characters },
                locations: { ...prev.locations },
                props: { ...prev.props }
            };
            
            // 🔥 FIX: Clean up character relationships - remove references to deleted scenes
            for (const charId in newRels.characters) {
                if (newRels.characters[charId]) {
                    newRels.characters[charId] = {
                        ...newRels.characters[charId],
                        appearsInScenes: newRels.characters[charId].appearsInScenes.filter(sceneId => validSceneIds.has(sceneId)),
                        relatedBeats: newRels.characters[charId].relatedBeats || []
                    };
                }
            }
            
            // 🔥 FIX: Clean up location relationships - remove references to deleted scenes
            for (const locId in newRels.locations) {
                if (newRels.locations[locId]) {
                    newRels.locations[locId] = {
                        ...newRels.locations[locId],
                        scenes: newRels.locations[locId].scenes.filter(sceneId => validSceneIds.has(sceneId))
                    };
                }
            }
            
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
            
            // 🔥 FIX: Store new relationships in a ref immediately (before state update)
            // This ensures relationships are available even if state update is deferred
            relationshipsRef.current = newRels;
            
            console.log('[ScreenplayContext] ✅ Relationships ref updated with', Object.keys(newRels.scenes).length, 'scenes');
            
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
    
    // 🔥 FIX: Track deleted asset IDs to prevent them from reappearing due to eventual consistency
    // Use sessionStorage to persist across remounts (refresh)
    // Must be declared after screenplayId
    const getDeletedAssetIds = useCallback(() => {
        if (typeof window === 'undefined' || !screenplayId) return new Set<string>();
        try {
            const stored = sessionStorage.getItem(`deleted-assets-${screenplayId}`);
            if (stored) {
                const ids = JSON.parse(stored) as string[];
                console.log('[ScreenplayContext] 🔄 Loaded', ids.length, 'deleted asset IDs from sessionStorage');
                return new Set(ids);
            }
        } catch (e) {
            console.warn('[ScreenplayContext] Failed to load deleted asset IDs from sessionStorage:', e);
        }
        return new Set<string>();
    }, [screenplayId]);
    
    const saveDeletedAssetIds = useCallback((ids: Set<string>) => {
        if (typeof window === 'undefined' || !screenplayId) return;
        try {
            sessionStorage.setItem(`deleted-assets-${screenplayId}`, JSON.stringify(Array.from(ids)));
        } catch (e) {
            console.warn('[ScreenplayContext] Failed to save deleted asset IDs to sessionStorage:', e);
        }
    }, [screenplayId]);
    
    // 🔥 FIX: Initialize deleted IDs ref when screenplayId is available
    useEffect(() => {
        if (screenplayId) {
            deletedAssetIdsRef.current = getDeletedAssetIds();
        } else {
            deletedAssetIdsRef.current = new Set();
        }
    }, [screenplayId, getDeletedAssetIds]);
    
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
    
    // 🔥 NEW: Listen for character refresh events (e.g., when pose generation completes)
    useEffect(() => {
        if (!screenplayId) return;
        
        const handleRefreshCharacters = async () => {
            console.log('[ScreenplayContext] Refreshing characters due to refreshCharacters event');
            try {
                // 🔥 FIX: Use creation context - Creation section should ONLY see Creation images (not Production Hub images)
                const charactersData = await listCharacters(screenplayId, getToken, 'creation');
                // 🔥 FIX: Use charactersRef.current to avoid stale closures and remove transformCharactersFromAPI from deps
                const transformedCharacters = transformCharactersFromAPI(charactersData, charactersRef.current);
                // 🔥 FIX: Defer state update with setTimeout + startTransition to prevent React error #300
                setTimeout(() => {
                    startTransition(() => {
                setCharacters(transformedCharacters);
                    });
                }, 0);
                console.log('[ScreenplayContext] ✅ Refreshed characters from API:', transformedCharacters.length, 'characters');
                // Log pose references for debugging
                transformedCharacters.forEach((char: any) => {
                    const poseImages = (char.images || []).filter((img: any) => 
                        (img.metadata as any)?.source === 'pose-generation'
                    );
                    if (poseImages.length > 0) {
                        console.log(`[ScreenplayContext] Character ${char.name} has ${poseImages.length} pose images:`, poseImages);
                    }
                });
            } catch (error) {
                console.error('[ScreenplayContext] Failed to refresh characters:', error);
            }
        };
        
        window.addEventListener('refreshCharacters', handleRefreshCharacters);
        return () => {
            window.removeEventListener('refreshCharacters', handleRefreshCharacters);
        };
        // 🔥 FIX: Remove transformCharactersFromAPI from deps - it's a stable useCallback and including it causes hooks mismatch
    }, [screenplayId, getToken]);
    
    // 🔥 NEW: Listen for location refresh events (e.g., when angle generation completes)
    useEffect(() => {
        if (!screenplayId) return;
        
        const handleRefreshLocations = async () => {
            console.log('[ScreenplayContext] Refreshing locations due to refreshLocations event');
            try {
                // 🔥 FIX: Use creation context - Creation section should ONLY see Creation images (not Production Hub images)
                const locationsData = await listLocations(screenplayId, getToken, 'creation');
                const transformedLocations = transformLocationsFromAPI(locationsData);
                // 🔥 FIX: Defer state update with setTimeout + startTransition to prevent React error #300
                setTimeout(() => {
                    startTransition(() => {
                setLocations(transformedLocations);
                    });
                }, 0);
                console.log('[ScreenplayContext] ✅ Refreshed locations from API:', transformedLocations.length, 'locations');
                // Log angle references for debugging
                transformedLocations.forEach((loc: any) => {
                    const angleImages = (loc.images || []).filter((img: any) => 
                        (img.metadata as any)?.source === 'angle-generation' || 
                        (img.metadata as any)?.angle
                    );
                    if (angleImages.length > 0) {
                        console.log(`[ScreenplayContext] Location ${loc.name} has ${angleImages.length} angle images:`, angleImages);
                    }
                });
            } catch (error) {
                console.error('[ScreenplayContext] Failed to refresh locations:', error);
            }
        };
        
        window.addEventListener('refreshLocations', handleRefreshLocations);
        return () => {
            window.removeEventListener('refreshLocations', handleRefreshLocations);
        };
        // 🔥 FIX: Remove transformLocationsFromAPI from deps - it's a stable useCallback and including it causes hooks mismatch
    }, [screenplayId, getToken]);
    
    // 🔥 NEW: Listen for asset refresh events (e.g., when angle generation completes)
    useEffect(() => {
        if (!screenplayId) return;
        
        const handleRefreshAssets = async () => {
            console.log('[ScreenplayContext] Refreshing assets due to refreshAssets event');
            try {
                // 🔥 FIX: Use production-hub context to get both Creation and Production Hub images (same pattern as characters/locations)
                const assetsData = await api.assetBank.list(screenplayId, 'production-hub').catch(() => ({ assets: [] }));
                const assetsResponse = assetsData.assets || assetsData.data?.assets || [];
                const assetsList = Array.isArray(assetsResponse) ? assetsResponse : [];
                
                const activeAssets = assetsList.filter(asset => !asset.deleted_at);
                const normalizedAssets = activeAssets.map(asset => ({
                    ...asset,
                    images: asset.images || []
                }));
                
                // Merge with current state (same logic as initializeData)
                // 🔥 FIX: Defer state update with setTimeout + startTransition to prevent React error #300
                setTimeout(() => {
                    startTransition(() => {
                setAssets(prev => {
                    const filteredApiAssets = normalizedAssets.filter(a => !deletedAssetIdsRef.current.has(a.id));
                    const apiAssetIds = new Set(filteredApiAssets.map(a => a.id));
                    
                    // Merge with current state to preserve recent updates
                    const merged = [...filteredApiAssets];
                    const currentStateAssets = prev.filter(a => {
                        if (deletedAssetIdsRef.current.has(a.id)) return false;
                        const updatedAt = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                        const now = Date.now();
                        return (now - updatedAt) < 300000; // 5 minutes
                    });
                    
                    for (const currentAsset of currentStateAssets) {
                        const existing = merged.find(a => a.id === currentAsset.id);
                        if (!existing) {
                            merged.push(currentAsset);
                        } else {
                            const existingUpdatedAt = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                            const currentUpdatedAt = currentAsset.updatedAt ? new Date(currentAsset.updatedAt).getTime() : 0;
                            if (currentUpdatedAt > existingUpdatedAt + 1000) {
                                const index = merged.indexOf(existing);
                                merged[index] = currentAsset;
                            }
                        }
                    }
                    
                    return merged;
                });
                    });
                }, 0);
                
                console.log('[ScreenplayContext] ✅ Refreshed assets from API');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to refresh assets:', error);
            }
        };
        
        window.addEventListener('refreshAssets', handleRefreshAssets);
        return () => {
            window.removeEventListener('refreshAssets', handleRefreshAssets);
        };
    }, [screenplayId]);
    
    // 🔥 FIX #3: Rebuild relationships when characters/locations/scenes change
    // This ensures relationships stay in sync with state changes
    // 🔥 FIX: Track last values to prevent infinite loops from array reference changes
    const lastRebuildRef = useRef<{
        sceneIds: string;
        characterIds: string;
        locationIds: string;
        beatIds: string;
    } | null>(null);
    
    useEffect(() => {
        if (!hasInitializedFromDynamoDB || scenes.length === 0) return;
        
        // Only rebuild if we have characters or locations loaded
        if (characters.length > 0 || locations.length > 0) {
            // Create stable string representations for comparison
            const sceneIds = scenes.map(s => s.id).sort().join(',');
            const characterIds = characters.map(c => c.id).sort().join(',');
            const locationIds = locations.map(l => l.id).sort().join(',');
            const beatIds = beats.map(b => b.id).sort().join(',');
            
            // Only rebuild if IDs actually changed (not just array reference)
            if (
                lastRebuildRef.current &&
                lastRebuildRef.current.sceneIds === sceneIds &&
                lastRebuildRef.current.characterIds === characterIds &&
                lastRebuildRef.current.locationIds === locationIds &&
                lastRebuildRef.current.beatIds === beatIds
            ) {
                // IDs haven't changed - skip rebuild to prevent infinite loop
                return;
            }
            
            // Update ref with current IDs
            lastRebuildRef.current = {
                sceneIds,
                characterIds,
                locationIds,
                beatIds
            };
            
            console.log('[ScreenplayContext] 🔄 Rebuilding relationships due to state change:', {
                scenes: scenes.length,
                characters: characters.length,
                locations: locations.length
            });
            buildRelationshipsFromScenes(scenes, beats, characters, locations);
        }
    }, [scenes, characters, locations, beats, hasInitializedFromDynamoDB, buildRelationshipsFromScenes]);
    
    // 🔥 FIX #3: Listen for scene refresh events (e.g., when scene analyzer updates dialogue blocks)
    // Improved: Updates refs immediately and rebuilds relationships synchronously
    useEffect(() => {
        if (!screenplayId) return;
        
        const handleRefreshScenes = async () => {
            // 🔥 FIX: Prevent multiple simultaneous refreshes
            if (isRefreshingScenesRef.current) {
                console.log('[ScreenplayContext] ⏸️ Refresh already in progress - skipping');
                return;
            }
            
            isRefreshingScenesRef.current = true;
            console.log('[ScreenplayContext] Refreshing scenes due to refreshScenes event');
            try {
                const scenesData = await listScenes(screenplayId, getToken);
                const transformedScenes = transformScenesFromAPI(scenesData);
                
                // 🔥 FIX: Use startTransition to prevent React error #185 (updating during render)
                startTransition(() => {
                    // Update refs immediately
                    scenesRef.current = transformedScenes;
                    setScenes(transformedScenes);
                    
                    // Rebuild relationships with current state (refs are updated)
                    const currentCharacters = charactersRef.current;
                    const currentLocations = locationsRef.current;
                    const currentBeats = beatsRef.current;
                    buildRelationshipsFromScenes(transformedScenes, currentBeats, currentCharacters, currentLocations);
                });
                
                console.log('[ScreenplayContext] ✅ Refreshed scenes from API:', transformedScenes.length, 'scenes');
            } catch (error) {
                console.error('[ScreenplayContext] Failed to refresh scenes:', error);
            } finally {
                isRefreshingScenesRef.current = false;
            }
        };
        
        window.addEventListener('refreshScenes', handleRefreshScenes);
        return () => {
            window.removeEventListener('refreshScenes', handleRefreshScenes);
        };
        // 🔥 FIX #3: Only depend on stable values - use refs inside handler instead
    }, [screenplayId, getToken, buildRelationshipsFromScenes]);

    // 🔥 FIX: Reset initialization guard when user changes (logout/login)
    const previousUserIdRef = useRef<string | null>(null);
    useEffect(() => {
        const currentUserId = user?.id || null;
        const previousUserId = previousUserIdRef.current;
        
        // If user changed (logout/login), reset initialization guard
        if (previousUserId !== null && currentUserId !== previousUserId) {
            console.log('[ScreenplayContext] 🔄 User changed (logout/login) - resetting initialization guard');
            hasInitializedRef.current = false;
            isInitializingRef.current = false;
            // Clear state to force fresh load
            setCharacters([]);
            setLocations([]);
            setScenes([]);
            setBeats([]);
        }
        
        previousUserIdRef.current = currentUserId;
    }, [user?.id]);

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
                    
                    // Load scenes, characters, locations, and assets in parallel
                    const [scenesData, charactersData, locationsData, assetsData] = await Promise.all([
                        listScenes(screenplayId, getToken),
                        listCharacters(screenplayId, getToken, 'creation'), // 🔥 FIX: Creation section should ONLY see Creation images (not Production Hub images)
                        listLocations(screenplayId, getToken, 'creation'), // 🔥 FIX: Creation section should ONLY see Creation images (not Production Hub images)
                        api.assetBank.list(screenplayId, 'creation').catch(() => ({ assets: [] })) // 🔥 FIX: Creation section should ONLY see Creation images (not Production Hub images)
                    ]);
                    
                    console.log('[ScreenplayContext] 📦 Raw API response:', {
                        scenes: scenesData.length,
                        characters: charactersData.length,
                        locations: locationsData.length,
                        assets: assetsData.assets?.length || 0
                    });
                    
                    // Transform API data to frontend format
                    const transformedScenes = transformScenesFromAPI(scenesData);
                    
                    // 🔥 CRITICAL FIX: Deduplicate and renumber scenes on load (same logic as rescan)
                    const sceneMapByContent = new Map<string, Scene>();
                    const extractLocationName = (heading: string): string => {
                        const match = heading.match(/(?:INT|EXT|INT\/EXT|I\/E)[\.\s]+(.+?)(?:\s*-\s*(?:DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER))?$/i);
                        return match ? match[1].trim().toUpperCase() : '';
                    };
                    
                    transformedScenes.forEach(scene => {
                        // Check by content (heading + startLine)
                        const contentKey = `${(scene.heading || '').toUpperCase().trim()}|${scene.fountain?.startLine || 0}`;
                        
                        // Also check by location name + startLine (handle INT/EXT changes)
                        const locationName = extractLocationName(scene.heading || '');
                        const locationKey = locationName ? `${locationName}|${scene.fountain?.startLine || 0}` : null;
                        
                        let existingScene = sceneMapByContent.get(contentKey);
                        
                        // Check by location key if content key doesn't match
                        if (!existingScene && locationKey) {
                            for (const [key, existing] of sceneMapByContent.entries()) {
                                if (key.includes(locationKey.split('|')[0]) && 
                                    Math.abs((existing.fountain?.startLine || 0) - (scene.fountain?.startLine || 0)) <= 5) {
                                    existingScene = existing;
                                    break;
                                }
                            }
                        }
                        
                        if (!existingScene) {
                            sceneMapByContent.set(contentKey, scene);
                        } else {
                            // Duplicate found - keep the one with earlier order/number
                            const existingOrder = existingScene.order ?? existingScene.number ?? 0;
                            const newOrder = scene.order ?? scene.number ?? 0;
                            if (newOrder < existingOrder) {
                                sceneMapByContent.set(contentKey, scene);
                            }
                        }
                    });
                    
                    // Get deduplicated scenes and sort by order/number
                    const deduplicatedScenes = Array.from(sceneMapByContent.values()).sort((a, b) => {
                        const orderA = a.order ?? a.number ?? 0;
                        const orderB = b.order ?? b.number ?? 0;
                        return orderA - orderB;
                    });
                    
                    // Renumber all scenes sequentially
                    const renumberedScenes = deduplicatedScenes.map((scene, index) => ({
                        ...scene,
                        number: index + 1,
                        order: index
                    }));
                    
                    if (transformedScenes.length !== renumberedScenes.length) {
                        console.log(`[ScreenplayContext] 🔍 Deduplicated ${transformedScenes.length - renumberedScenes.length} duplicate scenes on load`);
                    }
                    
                    // Keep beats as empty UI templates (if needed for backward compatibility)
                    // 🔥 FIX: Create defaultBeats before startTransition so it's available for buildRelationshipsFromScenes
                    const defaultBeats = createDefaultBeats();
                    
                    // Transform characters and locations FIRST (before building relationships)
                    // 🔥 FIX: Pass existing characters to preserve angle metadata when reloading
                    const transformedCharacters = transformCharactersFromAPI(charactersData, characters);
                    const transformedLocations = transformLocationsFromAPI(locationsData);
                    
                    // 🔥 FIX #1: Set state synchronously (no deferred updates)
                    // This ensures refs are updated immediately and relationships can be built with correct data
                    console.log('[ScreenplayContext] ✅ Setting scenes state synchronously with', renumberedScenes.length, 'scenes');
                    scenesRef.current = renumberedScenes;
                    beatsRef.current = defaultBeats;
                    setScenes(renumberedScenes);
                    setBeats(defaultBeats);
                    console.log('[ScreenplayContext] ✅ Loaded', renumberedScenes.length, 'scenes directly (beats removed, deduplicated, renumbered)');
                    
                    // 🔥 FIX #1: Set characters state synchronously (removed setTimeout + startTransition)
                    charactersRef.current = transformedCharacters;
                    setCharacters(transformedCharacters);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedCharacters.length, 'characters from DynamoDB');
                    console.log('[ScreenplayContext] 🔍 Character names:', transformedCharacters.map(c => c.name));
                    
                    // 🔥 DEBUG: Log address fields to track persistence
                    console.log('[ScreenplayContext] 🔍 Location addresses after reload:', transformedLocations.map(l => ({ 
                        name: l.name, 
                        address: l.address, 
                        hasAddress: !!l.address 
                    })));
                    // 🔥 FIX #1: Set locations state synchronously (removed setTimeout + startTransition)
                    locationsRef.current = transformedLocations;
                    setLocations(transformedLocations);
                    console.log('[ScreenplayContext] ✅ Loaded', transformedLocations.length, 'locations from DynamoDB');
                    console.log('[ScreenplayContext] 🔍 Location names:', transformedLocations.map(l => l.name));
                    
                    // 🔥 FIX #1: Build relationships AFTER state is set (ensures refs are updated)
                    // This ensures relationships are built with the latest data and refs are in sync
                    buildRelationshipsFromScenes(renumberedScenes, defaultBeats, transformedCharacters, transformedLocations);
                    
                    // Mark initialization as complete AFTER relationships are built
                    setHasInitializedFromDynamoDB(true);
                    setIsLoading(false);
                    
                    // Mark that we loaded scenes from DB to prevent auto-creation
                    if (transformedScenes.length > 0) {
                        hasAutoCreated.current = true;
                    }
                    
                    // Load and set assets
                    // Extract assets from response (API returns { assets: Asset[] } or { success: true, assets: Asset[] })
                    const assetsResponse = assetsData.assets || assetsData.data?.assets || [];
                    const assetsList = Array.isArray(assetsResponse) ? assetsResponse : [];
                    
                    // 🔥 FIX: Filter out soft-deleted assets (safety measure - backend should already filter)
                    const activeAssets = assetsList.filter(asset => !asset.deleted_at);
                    
                    // Ensure all assets have images array initialized
                    const normalizedAssets = activeAssets.map(asset => ({
                        ...asset,
                        images: asset.images || []
                    }));
                    
                    // 🔥 FIX: Merge with current state to handle DynamoDB eventual consistency
                    // Strategy: 
                    // 1. Filter out assets that were deleted (even if API returns them due to eventual consistency)
                    // 2. Preserve recently created assets that aren't in API yet
                    // 🔥 CRITICAL: Reload deleted IDs from sessionStorage in case ref was reset
                    if (screenplayId && typeof window !== 'undefined') {
                        const storedDeleted = sessionStorage.getItem(`deleted-assets-${screenplayId}`);
                        if (storedDeleted) {
                            try {
                                const deletedIds = JSON.parse(storedDeleted) as string[];
                                deletedAssetIdsRef.current = new Set(deletedIds);
                                console.log('[ScreenplayContext] 🔄 Reloaded', deletedIds.length, 'deleted asset IDs from sessionStorage for merge');
                            } catch (e) {
                                console.warn('[ScreenplayContext] Failed to reload deleted IDs:', e);
                            }
                        }
                    }
                    
                    // 🔥 FIX: Defer state update with setTimeout + startTransition to prevent React error #300
                    setTimeout(() => {
                        startTransition(() => {
                    setAssets(prev => {
                        // Filter out deleted assets from API response (eventual consistency protection)
                        const filteredApiAssets = normalizedAssets.filter(a => !deletedAssetIdsRef.current.has(a.id));
                        
                        // Get IDs of assets from filtered API response
                        const apiAssetIds = new Set(filteredApiAssets.map(a => a.id));
                        
                        // 🔥 CRITICAL FIX: Load ALL recently updated assets from sessionStorage
                        // This includes both newly created AND recently updated assets
                        // The sessionStorage is updated by both createAsset and updateAsset
                        const sessionStorageAssets: Asset[] = [];
                        if (screenplayId && typeof window !== 'undefined') {
                            try {
                                const stored = sessionStorage.getItem(`optimistic-assets-${screenplayId}`);
                                if (stored) {
                                    const storedAssets = JSON.parse(stored) as Asset[];
                                    const now = Date.now();
                                    // Include assets that were created OR updated recently (within last 5 minutes)
                                    sessionStorageAssets.push(...storedAssets.filter(a => {
                                        // Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                                        const timestamp = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                                        const age = now - timestamp;
                                        return age < 300000; // 5 minutes (300 seconds) - accounts for GSI eventual consistency
                                    }));
                                    console.log('[ScreenplayContext] 📦 Loaded', sessionStorageAssets.length, 'assets from sessionStorage (includes updated assets)');
                                }
                            } catch (e) {
                                console.warn('[ScreenplayContext] Failed to load assets from sessionStorage:', e);
                            }
                        }
                        
                        // Combine prev state and sessionStorage assets
                        // 🔥 CRITICAL: prev might be empty if state was reset, so sessionStorage is crucial
                        const allOptimistic = [...prev, ...sessionStorageAssets];
                        
                        // Find assets that aren't in API response OR have been updated more recently
                        // This includes both newly created assets and recently updated assets
                        const optimisticAssets = allOptimistic.filter(a => {
                            if (deletedAssetIdsRef.current.has(a.id)) {
                                return false; // Was deleted, don't keep
                            }
                            
                            // Check if asset exists in API response
                            const apiAsset = filteredApiAssets.find(api => api.id === a.id);
                            if (!apiAsset) {
                                // Asset not in API - keep if recently created (within last 5 minutes)
                                const createdAt = new Date(a.createdAt).getTime();
                                const now = Date.now();
                                const age = now - createdAt;
                                return age < 300000; // 5 minutes - handles GSI eventual consistency
                            } else {
                                // Asset exists in API - keep if our version is newer (updated more recently)
                                const apiUpdatedAt = apiAsset.updatedAt ? new Date(apiAsset.updatedAt).getTime() : 0;
                                const ourUpdatedAt = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                                const isNewer = ourUpdatedAt > apiUpdatedAt + 1000; // More than 1 second newer
                                
                                if (isNewer) {
                                    console.log('[ScreenplayContext] 🔄 Keeping updated asset from sessionStorage (newer than API):', a.id, {
                                        apiUpdatedAt: new Date(apiUpdatedAt).toISOString(),
                                        ourUpdatedAt: new Date(ourUpdatedAt).toISOString(),
                                        apiImages: apiAsset.images?.length || 0,
                                        ourImages: a.images?.length || 0
                                    });
                                }
                                
                                return isNewer; // Keep if our version is newer
                            }
                        });
                        
                        // Remove duplicates from optimistic assets
                        const uniqueOptimistic = optimisticAssets.reduce((acc, asset) => {
                            if (!acc.find(a => a.id === asset.id)) {
                                acc.push(asset);
                            }
                            return acc;
                        }, [] as Asset[]);
                        
                        // Start with filtered API assets (source of truth, minus deleted ones)
                        const merged = [...filteredApiAssets];
                        
                        // 🔥 CRITICAL FIX: Merge sessionStorage assets (which includes updated assets)
                        // These assets have the latest data including recent image updates
                        // Compare with API assets and prefer the newer version
                        for (const sessionAsset of uniqueOptimistic) {
                            const existingApiAsset = merged.find(a => a.id === sessionAsset.id);
                            
                            if (!existingApiAsset) {
                                // Asset not in API - add it (newly created, eventual consistency)
                                merged.push(sessionAsset);
                                console.log('[ScreenplayContext] 🔄 Adding new asset from sessionStorage (not in API yet):', sessionAsset.id);
                            } else {
                                // Asset exists in both - compare timestamps AND image counts
                                const apiUpdatedAt = existingApiAsset.updatedAt ? new Date(existingApiAsset.updatedAt).getTime() : 0;
                                const sessionUpdatedAt = sessionAsset.updatedAt ? new Date(sessionAsset.updatedAt).getTime() : new Date(sessionAsset.createdAt).getTime();
                                const apiImageCount = existingApiAsset.images?.length || 0;
                                const sessionImageCount = sessionAsset.images?.length || 0;
                                
                                // 🔥 FIX: If API has fewer images and is newer, prefer API (image was deleted)
                                // This prevents old sessionStorage versions with more images from overwriting correct deletions
                                if (apiImageCount < sessionImageCount && apiUpdatedAt >= sessionUpdatedAt - 5000) {
                                    // API has fewer images and is recent - keep API version (deletion was successful)
                                    console.log('[ScreenplayContext] ⏭️ Keeping API version (has fewer images, deletion successful):', sessionAsset.id, {
                                        apiImages: apiImageCount,
                                        sessionImages: sessionImageCount,
                                        apiUpdatedAt: new Date(apiUpdatedAt).toISOString(),
                                        sessionUpdatedAt: new Date(sessionUpdatedAt).toISOString()
                                    });
                                } else if (sessionUpdatedAt > apiUpdatedAt + 1000) {
                                    // SessionStorage version is newer - replace API version
                                    const index = merged.indexOf(existingApiAsset);
                                    merged[index] = sessionAsset;
                                    console.log('[ScreenplayContext] 🔄 Replacing API asset with newer sessionStorage version:', sessionAsset.id, {
                                        apiUpdatedAt: new Date(apiUpdatedAt).toISOString(),
                                        sessionUpdatedAt: new Date(sessionUpdatedAt).toISOString(),
                                        apiImages: apiImageCount,
                                        sessionImages: sessionImageCount
                                    });
                                } else {
                                    // API version is newer or same - keep API version
                                    console.log('[ScreenplayContext] ⏭️ Keeping API version (newer or same):', sessionAsset.id);
                                }
                            }
                        }
                        
                        // 🔥 CRITICAL FIX: Also merge with current state (prev) to preserve updated images
                        // When images are uploaded/deleted, the asset's updatedAt is updated in the current state
                        // But the API might return stale data due to eventual consistency
                        // We need to compare and preserve the newer version (which has the updated images)
                        const currentStateAssets = prev.filter(a => {
                            // Only include assets that aren't deleted
                            if (deletedAssetIdsRef.current.has(a.id)) {
                                return false;
                            }
                            // Only include assets that have been updated recently (within last 5 minutes)
                            // This ensures we preserve recent image updates even if API is stale
                            const updatedAt = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                            const now = Date.now();
                            const age = now - updatedAt;
                            return age < 300000; // 5 minutes - same window as optimistic assets
                        });
                        
                        // Add current state assets to merged list (will be deduplicated below)
                        for (const currentAsset of currentStateAssets) {
                            const existingMergedAsset = merged.find(a => a.id === currentAsset.id);
                            
                            if (!existingMergedAsset) {
                                // Asset not in merged list - add it
                                merged.push(currentAsset);
                                console.log('[ScreenplayContext] 🔄 Adding current state asset to merge:', currentAsset.id, 'images:', currentAsset.images?.length || 0);
                            } else {
                                // Asset exists - compare timestamps
                                const mergedUpdatedAt = existingMergedAsset.updatedAt ? new Date(existingMergedAsset.updatedAt).getTime() : 0;
                                const currentUpdatedAt = currentAsset.updatedAt ? new Date(currentAsset.updatedAt).getTime() : 0;
                                
                                if (currentUpdatedAt > mergedUpdatedAt + 1000) {
                                    // Current state version is newer - replace
                                    const index = merged.indexOf(existingMergedAsset);
                                    merged[index] = currentAsset;
                                    console.log('[ScreenplayContext] 🔄 Replacing merged asset with newer current state version:', currentAsset.id, {
                                        mergedUpdatedAt: new Date(mergedUpdatedAt).toISOString(),
                                        currentUpdatedAt: new Date(currentUpdatedAt).toISOString(),
                                        mergedImages: existingMergedAsset.images?.length || 0,
                                        currentImages: currentAsset.images?.length || 0
                                    });
                                }
                            }
                        }
                        
                        // Update sessionStorage with current optimistic assets
                        // 🔥 CRITICAL FIX: Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                        // This ensures that assets that were created long ago but recently updated are preserved
                        if (screenplayId && typeof window !== 'undefined') {
                            try {
                                const now = Date.now();
                                const recentOptimistic = uniqueOptimistic.filter(a => {
                                    // Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                                    const timestamp = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                                    const age = now - timestamp;
                                    return age < 300000; // 5 minutes (300 seconds) - accounts for GSI eventual consistency
                                });
                                sessionStorage.setItem(`optimistic-assets-${screenplayId}`, JSON.stringify(recentOptimistic));
                                console.log('[ScreenplayContext] 💾 Saved', recentOptimistic.length, 'assets to sessionStorage (filtered by updatedAt/createdAt)');
                            } catch (e) {
                                console.warn('[ScreenplayContext] Failed to save optimistic assets to sessionStorage:', e);
                            }
                        }
                        
                        // Remove duplicates - prefer newer version (by updatedAt timestamp, then by image count)
                        // 🔥 CRITICAL: This ensures that current state assets with updated images are preserved
                        // even if the API returns stale data due to eventual consistency
                        const unique = merged.reduce((acc, asset) => {
                            const existing = acc.find(a => a.id === asset.id);
                            if (!existing) {
                                acc.push(asset);
                            } else {
                                // If both exist, compare timestamps to determine which is newer
                                const index = acc.indexOf(existing);
                                const existingUpdatedAt = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                                const assetUpdatedAt = asset.updatedAt ? new Date(asset.updatedAt).getTime() : 0;
                                const existingImageCount = existing.images?.length || 0;
                                const assetImageCount = asset.images?.length || 0;
                                
                                // 🔥 FIX: Prefer the version with the newer updatedAt timestamp
                                // If timestamps are equal (within 1 second), prefer the one with more images
                                // This prevents stale API data from overwriting recent updates (including image updates)
                                const timeDiff = assetUpdatedAt - existingUpdatedAt;
                                const shouldReplace = timeDiff > 1000 || // Asset is more than 1 second newer
                                    (Math.abs(timeDiff) <= 1000 && assetImageCount > existingImageCount); // Same time but more images
                                
                                if (shouldReplace) {
                                    acc[index] = asset; // Replace with newer/better version
                                    console.log('[ScreenplayContext] 🔄 Replacing asset with newer/better version:', asset.id, {
                                        source: asset === existing ? 'same' : (filteredApiAssets.some(a => a.id === asset.id) ? 'API' : 'currentState'),
                                        existingUpdatedAt: new Date(existingUpdatedAt).toISOString(),
                                        assetUpdatedAt: new Date(assetUpdatedAt).toISOString(),
                                        timeDiff: timeDiff,
                                        existingImages: existingImageCount,
                                        assetImages: assetImageCount,
                                        reason: timeDiff > 1000 ? 'newer timestamp' : 'more images'
                                    });
                                } else {
                                    // Keep existing version (it's newer or has more images)
                                    console.log('[ScreenplayContext] ⏭️ Keeping existing asset (newer or better):', asset.id, {
                                        source: existing === asset ? 'same' : (filteredApiAssets.some(a => a.id === existing.id) ? 'API' : 'currentState'),
                                        existingUpdatedAt: new Date(existingUpdatedAt).toISOString(),
                                        assetUpdatedAt: new Date(assetUpdatedAt).toISOString(),
                                        timeDiff: timeDiff,
                                        existingImages: existingImageCount,
                                        assetImages: assetImageCount
                                    });
                                }
                            }
                            return acc;
                        }, [] as Asset[]);
                        
                        // Clean up old deleted IDs (older than 5 minutes) to prevent memory leak
                        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                        // We can't track when assets were deleted, so we'll just limit the set size
                        // If it gets too large, clear it (shouldn't happen in normal usage)
                        if (deletedAssetIdsRef.current.size > 100) {
                            console.warn('[ScreenplayContext] ⚠️ Deleted asset IDs set is large, clearing:', deletedAssetIdsRef.current.size);
                            deletedAssetIdsRef.current.clear();
                        }
                        
                        console.log('[ScreenplayContext] ✅ Merged assets:', {
                            fromAPI: normalizedAssets.length,
                            filteredAPI: filteredApiAssets.length,
                            optimistic: uniqueOptimistic.length,
                            total: unique.length,
                            deletedFiltered: normalizedAssets.length - filteredApiAssets.length
                        });
                        
                        return unique;
                    });
                    });
                }, 0);
                    console.log('[ScreenplayContext] ✅ Loaded', normalizedAssets.length, 'assets from API (filtered', assetsList.length - normalizedAssets.length, 'soft-deleted)');
                    
                    // 🔥 CRITICAL: Check if we need to create default beats AFTER loading
                    if (transformedScenes.length === 0 && !hasAutoCreated.current) {
                        console.log('[ScreenplayContext] 🏗️ Creating default 8-sequence structure for screenplay:', screenplayId);
                        const freshBeats = createDefaultBeats();
                        setBeats(freshBeats);
                        hasAutoCreated.current = true;
                    }
                    
                } catch (err) {
                    console.error('[ScreenplayContext] Failed to load from DynamoDB:', err);
                    // On error, mark as initialized immediately (no scenes to wait for)
                    setHasInitializedFromDynamoDB(true);
                    setIsLoading(false);
                } finally {
                    // Only reset flag here - initialization state is set in startTransition or catch block
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
        let updatedScene: Scene | undefined;
        setScenes(prev => prev.map(scene => {
            if (scene.id === id) {
                updatedScene = { ...scene, ...updates, updatedAt: now };
                return updatedScene;
            }
            return scene;
        }));
        
        // 🔥 FIX: Update ref immediately so it's available for other operations
        if (updatedScene) {
            scenesRef.current = scenesRef.current.map(s => s.id === id ? updatedScene! : s);
        }
        
        // Feature 0117: Save updated scene directly to DynamoDB
        if (screenplayId && updatedScene) {
            try {
                // 🔥 FIX: Use dedicated updateScene API instead of bulkCreateScenes for proper updates
                // 🔥 FIX: Exclude order and number - these are read-only fields managed by backend
                // Also exclude any undefined values to avoid sending unnecessary data
                const sceneUpdates: Partial<Scene> = {};
                if (updatedScene.heading !== undefined) sceneUpdates.heading = updatedScene.heading;
                if (updatedScene.synopsis !== undefined) sceneUpdates.synopsis = updatedScene.synopsis;
                if (updatedScene.status !== undefined) sceneUpdates.status = updatedScene.status;
                if (updatedScene.fountain !== undefined) sceneUpdates.fountain = updatedScene.fountain;
                if (updatedScene.images !== undefined) sceneUpdates.images = updatedScene.images;
                if (updatedScene.videoAssets !== undefined) sceneUpdates.videoAssets = updatedScene.videoAssets;
                if (updatedScene.timing !== undefined) sceneUpdates.timing = updatedScene.timing;
                if (updatedScene.estimatedPageCount !== undefined) sceneUpdates.estimatedPageCount = updatedScene.estimatedPageCount;
                if (updatedScene.group_label !== undefined) sceneUpdates.group_label = updatedScene.group_label;
                // Explicitly exclude order and number - backend manages these and including them causes API errors
                await apiUpdateScene(screenplayId, id, sceneUpdates, getToken);
                console.log('[ScreenplayContext] ✅ Updated scene in DynamoDB:', { sceneId: id, props: updatedScene.fountain?.tags?.props });
            } catch (error) {
                console.error('[ScreenplayContext] Failed to update scene in DynamoDB:', error);
            }
        }
    }, [screenplayId, getToken]);
    
    // 🔥 Feature 0136: Asset-Scene Association - Link asset to scene
    const linkAssetToScene = useCallback(async (assetId: string, sceneId: string) => {
        // 🔥 FIX: Use scenesRef to get latest state (avoid stale closure)
        const scene = scenesRef.current.find(s => s.id === sceneId) || scenes.find(s => s.id === sceneId);
        if (!scene) {
            console.error('[ScreenplayContext] ❌ Scene not found for linking:', { sceneId, availableScenes: scenesRef.current.map(s => s.id) });
            return;
        }
        
        const currentProps = scene.fountain?.tags?.props || [];
        if (currentProps.includes(assetId)) {
            console.log('[ScreenplayContext] ℹ️ Asset already linked to scene:', { assetId, sceneId });
            return;
        }
        
        const updatedProps = [...currentProps, assetId];
        console.log('[ScreenplayContext] 🔗 Linking asset to scene:', { 
            assetId, 
            sceneId, 
            sceneHeading: scene.heading,
            currentPropsCount: currentProps.length,
            updatedPropsCount: updatedProps.length,
            existingTags: scene.fountain?.tags
        });
        
        try {
            // 🔥 FIX: Preserve all existing tags when updating props
            await updateScene(sceneId, {
                fountain: {
                    ...scene.fountain,
                    tags: {
                        ...(scene.fountain?.tags || {}), // Preserve all existing tags first
                        characters: scene.fountain?.tags?.characters || [],
                        location: scene.fountain?.tags?.location,
                        props: updatedProps // Then update props
                    }
                }
            });
            
            // 🔥 FIX: Verify the update by checking the ref
            const updatedScene = scenesRef.current.find(s => s.id === sceneId);
            const propsAfterUpdate = updatedScene?.fountain?.tags?.props || [];
            if (propsAfterUpdate.includes(assetId)) {
                console.log('[ScreenplayContext] ✅ Linked asset to scene (verified):', { assetId, sceneId, propsCount: propsAfterUpdate.length });
                // 🔥 FIX: Trigger scene refresh to ensure UI updates (defer to avoid React error #185)
                if (screenplayId && typeof window !== 'undefined') {
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('refreshScenes'));
                    }, 0);
                }
            } else {
                console.error('[ScreenplayContext] ⚠️ WARNING: Asset link may not have persisted:', { assetId, sceneId, propsAfterUpdate });
            }
        } catch (error) {
            console.error('[ScreenplayContext] ❌ Failed to link asset to scene:', { assetId, sceneId, error });
            throw error;
        }
    }, [scenes, updateScene]);
    
    // 🔥 Feature 0136: Asset-Scene Association - Unlink asset from scene
    const unlinkAssetFromScene = useCallback(async (assetId: string, sceneId: string) => {
        // 🔥 FIX: Use scenesRef to get latest state (avoid stale closure)
        const scene = scenesRef.current.find(s => s.id === sceneId) || scenes.find(s => s.id === sceneId);
        if (!scene) {
            console.error('[ScreenplayContext] ❌ Scene not found for unlinking:', { sceneId });
            return;
        }
        
        const currentProps = scene.fountain?.tags?.props || [];
        if (!currentProps.includes(assetId)) {
            console.log('[ScreenplayContext] ℹ️ Asset not linked to scene:', { assetId, sceneId });
            return;
        }
        
        const updatedProps = currentProps.filter(id => id !== assetId);
        console.log('[ScreenplayContext] 🔗 Unlinking asset from scene:', { 
            assetId, 
            sceneId, 
            sceneHeading: scene.heading,
            currentPropsCount: currentProps.length,
            updatedPropsCount: updatedProps.length,
            existingTags: scene.fountain?.tags
        });
        
        try {
            // 🔥 FIX: Preserve all existing tags when updating props
            await updateScene(sceneId, {
                fountain: {
                    ...scene.fountain,
                    tags: {
                        ...(scene.fountain?.tags || {}), // Preserve all existing tags first
                        characters: scene.fountain?.tags?.characters || [],
                        location: scene.fountain?.tags?.location,
                        props: updatedProps.length > 0 ? updatedProps : undefined // Then update props
                    }
                }
            });
            
            // 🔥 FIX: Verify the update by checking the ref
            const updatedScene = scenesRef.current.find(s => s.id === sceneId);
            const propsAfterUpdate = updatedScene?.fountain?.tags?.props || [];
            if (!propsAfterUpdate.includes(assetId)) {
                console.log('[ScreenplayContext] ✅ Unlinked asset from scene (verified):', { assetId, sceneId, propsCount: propsAfterUpdate.length });
                // 🔥 FIX: Trigger scene refresh to ensure UI updates (defer to avoid React error #185)
                if (screenplayId && typeof window !== 'undefined') {
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('refreshScenes'));
                    }, 0);
                }
            } else {
                console.error('[ScreenplayContext] ⚠️ WARNING: Asset unlink may not have persisted:', { assetId, sceneId, propsAfterUpdate });
            }
        } catch (error) {
            console.error('[ScreenplayContext] ❌ Failed to unlink asset from scene:', { assetId, sceneId, error });
            throw error;
        }
    }, [scenes, updateScene]);
    
    // 🔥 FIX: Use batch API endpoint for reliable bulk operations
    // Single atomic operation instead of sequential individual updates
    const batchUpdatePropAssociations = useCallback(async (
        assetId: string,
        sceneIdsToLink: string[],
        sceneIdsToUnlink: string[]
    ) => {
        if (!screenplayId) {
            console.error('[ScreenplayContext] ❌ No screenplayId for batch prop update');
            return;
        }

        if (sceneIdsToLink.length === 0 && sceneIdsToUnlink.length === 0) {
            console.log('[ScreenplayContext] ℹ️ No scenes to update');
            return;
        }

        console.log('[ScreenplayContext] 🔗 Batch updating prop associations:', {
            assetId,
            linkCount: sceneIdsToLink.length,
            unlinkCount: sceneIdsToUnlink.length
        });

        try {
            // Call backend batch API
            const updatedScenes = await apiBatchUpdatePropAssociations(
                screenplayId,
                assetId,
                sceneIdsToLink,
                sceneIdsToUnlink,
                getToken
            );

            // Update local state with returned scenes
            const transformedScenes = transformScenesFromAPI(updatedScenes);
            setScenes(prev => {
                const sceneMap = new Map(prev.map(s => [s.id, s]));
                transformedScenes.forEach(frontendScene => {
                    sceneMap.set(frontendScene.id, frontendScene);
                });
                return Array.from(sceneMap.values());
            });

            // Update refs (use transformed scenes which have 'id' not 'scene_id')
            scenesRef.current = scenesRef.current.map(scene => {
                const updated = transformedScenes.find(s => s.id === scene.id);
                if (updated) {
                    return {
                        ...scene,
                        fountain: updated.fountain
                    };
                }
                return scene;
            });

            // Rebuild relationships
            buildRelationshipsFromScenes(
                scenesRef.current,
                beatsRef.current,
                charactersRef.current,
                locationsRef.current
            );

            // Trigger refresh
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('refreshScenes'));
                }, 0);
            }

            console.log('[ScreenplayContext] ✅ Batch updated prop associations:', {
                assetId,
                updatedScenesCount: updatedScenes.length
            });
        } catch (error) {
            console.error('[ScreenplayContext] ❌ Failed to batch update prop associations:', error);
            throw error;
        }
    }, [screenplayId, getToken, buildRelationshipsFromScenes, transformScenesFromAPI]);
    
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
                // 🔥 FIX: Include all character fields in API call
                const apiChar = {
                    name: newCharacter.name,
                    description: newCharacter.description,
                    type: newCharacter.type || 'lead', // 🔥 FIX: Include type field
                    arcStatus: newCharacter.arcStatus || 'introduced',
                    arcNotes: newCharacter.arcNotes || '', // 🔥 FIX: Include arcNotes field
                    referenceImages: newCharacter.images?.map(img => {
                        // Extract s3Key from metadata, fallback to extracting from imageUrl
                        if (img.metadata?.s3Key) return img.metadata.s3Key;
                        if (img.imageUrl && (img.imageUrl.includes('temp/') || img.imageUrl.includes('timeline/'))) {
                            const urlMatch = img.imageUrl.match(/(temp\/[^?]+|timeline\/[^?]+)/);
                            if (urlMatch && urlMatch[1]) return urlMatch[1];
                            if (!img.imageUrl.includes('?')) {
                                const s3UrlMatch = img.imageUrl.match(/s3[^/]*\.amazonaws\.com\/([^?]+)/);
                                if (s3UrlMatch && s3UrlMatch[1]) return s3UrlMatch[1];
                                return img.imageUrl;
                            }
                        }
                        return null;
                    }).filter((key): key is string => key !== null && key.length <= 1024) || []
                };
                const createdCharacter = await apiCreateCharacter(screenplayId, apiChar, getToken);
                console.log('[ScreenplayContext] 📥 Received created character from API:', { 
                    characterId: createdCharacter.id || (createdCharacter as any).character_id,
                    name: createdCharacter.name
                });
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                // 🔥 FIX: Pass existing characters to preserve angle metadata (though new character won't have any yet)
                const transformedCharacter = transformCharactersFromAPI([createdCharacter as any], characters)[0];
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
                
                // 🔥 FIX: Update relationships to use the real character ID instead of optimistic ID
                if (transformedCharacter.id !== newCharacter.id) {
                    setRelationships(prev => {
                        const { [newCharacter.id]: oldRel, ...restChars } = prev.characters || {};
                        return {
                            ...prev,
                            characters: {
                                ...restChars,
                                [transformedCharacter.id]: oldRel || {
                                    type: 'character',
                                    appearsInScenes: [],
                                    relatedBeats: []
                                }
                            }
                        };
                    });
                }
                
                // 🔥 CRITICAL FIX: Return the transformed character from API (with real ID) instead of optimistic one
                // This ensures CharacterBoard uses the correct ID when registering images
                return transformedCharacter;
                
                // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
                // The force reload was causing data loss for locations (address field disappeared)
                // Characters now have complex fields (physicalAttributes, referenceLibrary) that could have the same issue
                // Instead, we rely on the state sync above which uses the actual API response
                // The data will be correct on the next page refresh when initializeData runs
                // forceReloadRef.current = true;
                // hasInitializedRef.current = false;
                // setReloadTrigger(prev => prev + 1);
            } catch (error) {
                console.error('[ScreenplayContext] Failed to create character in DynamoDB:', error);
                // If API call fails, return optimistic character as fallback
            }
        }
        
        // Return optimistic character only if API call wasn't made or failed
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
                // Transform updates to API format (include arcStatus, type, arcNotes, and referenceImages)
                const apiUpdates: any = {};
                
                // Only include fields that are actually being updated
                if (updates.name !== undefined) apiUpdates.name = updates.name;
                if (updates.description !== undefined) apiUpdates.description = updates.description;
                if (updates.type !== undefined) apiUpdates.type = updates.type; // 🔥 FIX: Include type field
                if (updates.arcStatus !== undefined) apiUpdates.arcStatus = updates.arcStatus; // 🔥 CRITICAL: Include arcStatus
                if (updates.arcNotes !== undefined) apiUpdates.arcNotes = updates.arcNotes; // 🔥 FIX: Include arcNotes field
                // 🔥 FIX: Include physicalAttributes - check both direct property and nested object
                if (updates.physicalAttributes !== undefined) {
                    apiUpdates.physicalAttributes = updates.physicalAttributes;
                }
                // 🔥 FIX: Extract s3Key from images array and separate into referenceImages and poseReferences
                // CRITICAL: Store s3Key, NOT presigned URL (imageUrl can be 1000+ chars, causing KeyTooLongError)
                if (updates.images !== undefined) {
                    // Helper function to extract s3Key from image
                    const extractS3Key = (img: any): string | null => {
                        if (img.metadata?.s3Key) return img.metadata.s3Key;
                        if (img.s3Key) return img.s3Key;
                        if (img.imageUrl && (img.imageUrl.includes('temp/') || img.imageUrl.includes('timeline/'))) {
                            // Extract s3Key from presigned URL (everything before the first ?)
                            const urlMatch = img.imageUrl.match(/(temp\/[^?]+|timeline\/[^?]+)/);
                            if (urlMatch && urlMatch[1]) return urlMatch[1];
                            // If no query params, might be direct S3 URL
                            if (!img.imageUrl.includes('?')) {
                                // Remove S3 bucket URL prefix if present
                                const s3UrlMatch = img.imageUrl.match(/s3[^/]*\.amazonaws\.com\/([^?]+)/);
                                if (s3UrlMatch && s3UrlMatch[1]) return s3UrlMatch[1];
                                return img.imageUrl;
                            }
                        }
                        return null;
                    };
                    
                    // Separate images by source: user-uploaded vs pose-generated
                    const referenceImageKeys: string[] = [];
                    const poseReferences: Array<{ // NEW: Store full objects like assets
                        id: string;
                        imageUrl?: string;
                        s3Key: string;
                        referenceType: 'pose';
                        label: string;
                        generationMethod: 'pose-generation';
                        creditsUsed: number;
                        metadata?: {
                            poseId?: string;
                            poseName?: string;
                            outfitName?: string;
                            packageId?: string;
                        };
                        createdAt: string;
                    }> = [];
                    
                    // 🔥 CRITICAL FIX: Creation section should ONLY update referenceImages, never poseReferences
                    // When updates.images is provided from Creation section, it only contains Creation images
                    // We should NOT send poseReferences at all (not even empty array) to preserve Production Hub data
                    // Only send poseReferences if updates.poseReferences is explicitly provided (from Production Hub)
                    
                    if (updates.images.length === 0) {
                        // Empty array - only clear referenceImages, NOT poseReferences
                        // Clearing all Creation images should not affect Production Hub poseReferences
                        apiUpdates.referenceImages = [];
                        console.log('[ScreenplayContext] 📤 Clearing Creation images only (preserving Production Hub poseReferences)');
                    } else {
                        // Process images - Creation section images should only be referenceImages
                        updates.images.forEach(img => {
                            const s3Key = extractS3Key(img);
                            if (s3Key && s3Key.length <= 1024) {
                                const source = img.metadata?.source;
                                // 🔥 FIX: Creation section should never send pose-generation images
                                // If a pose-generation image somehow ends up in updates.images from Creation section,
                                // it's a bug - we should log it but still treat it as a reference image
                                if (source === 'pose-generation') {
                                    console.warn('[ScreenplayContext] ⚠️ Pose-generation image found in Creation section update - this should not happen:', {
                                        characterId: id,
                                        s3Key,
                                        source
                                    });
                                    // Still add to referenceImages to prevent data loss, but log the issue
                                    referenceImageKeys.push(s3Key);
                                } else {
                                    // Default to user-uploaded (including undefined/null source)
                                    referenceImageKeys.push(s3Key);
                                }
                            }
                        });
                        
                        apiUpdates.referenceImages = referenceImageKeys;
                    }
                    
                    // 🔥 CRITICAL FIX: Only send poseReferences if explicitly provided from Production Hub
                    // Creation section updates should NEVER include poseReferences in the API call
                    // This ensures Production Hub data is preserved when Creation section updates characters
                    // Use type assertion since Character type doesn't include poseReferences (it's Production Hub only)
                    if ((updates as any).poseReferences !== undefined) {
                        // This is a Production Hub update - send poseReferences
                        const poseRefsArray = Array.isArray((updates as any).poseReferences) ? (updates as any).poseReferences : [];
                        apiUpdates.poseReferences = poseRefsArray.map((ref: any) => {
                            const s3Key = typeof ref === 'string' ? ref : (ref.s3Key || extractS3Key(ref));
                            if (!s3Key) return null;
                            
                            return {
                                id: typeof ref === 'string' ? `ref_${id}_pose_${Date.now()}` : (ref.id || `ref_${id}_pose_${Date.now()}`),
                                imageUrl: typeof ref === 'string' ? undefined : ref.imageUrl,
                                s3Key: s3Key,
                                referenceType: 'pose',
                                label: typeof ref === 'string' ? 'Pose' : (ref.label || ref.metadata?.poseName || 'Pose'),
                                generationMethod: 'pose-generation',
                                creditsUsed: typeof ref === 'string' ? 0 : (ref.creditsUsed || ref.metadata?.creditsUsed || 0),
                                metadata: typeof ref === 'string' ? {} : (ref.metadata || {}),
                                createdAt: typeof ref === 'string' ? new Date().toISOString() : (ref.createdAt || new Date().toISOString())
                            };
                        }).filter((ref: any) => ref !== null);
                        console.log('[ScreenplayContext] 📤 Sending poseReferences from Production Hub:', {
                            characterId: id,
                            count: apiUpdates.poseReferences.length
                        });
                    }
                    // Otherwise, don't include poseReferences in the update - backend will preserve existing values
                    
                    console.log('[ScreenplayContext] 📤 Separated images:', {
                        totalImages: updates.images.length,
                        referenceImages: apiUpdates.referenceImages.length,
                        poseReferences: apiUpdates.poseReferences ? apiUpdates.poseReferences.length : 'not included',
                        isEmpty: updates.images.length === 0
                    });
                }
                
                // 🔥 DEBUG: Log physicalAttributes to verify it's being sent
                if (updates.physicalAttributes !== undefined) {
                    console.log('[ScreenplayContext] 📤 Sending physicalAttributes to API:', updates.physicalAttributes);
                }
                
                // 🔥 CRITICAL FIX: Remove poseReferences from apiUpdates if it's undefined or empty
                // This ensures Creation section never sends poseReferences (even accidentally)
                // Only Production Hub should send poseReferences updates
                if (apiUpdates.poseReferences === undefined || (Array.isArray(apiUpdates.poseReferences) && apiUpdates.poseReferences.length === 0 && (updates as any).poseReferences === undefined)) {
                    delete apiUpdates.poseReferences;
                    console.log('[ScreenplayContext] 🛡️ Removed poseReferences from API update (Creation section should never send this)');
                }
                
                console.log('[ScreenplayContext] 📤 Sending character update to API:', { 
                    characterId: id, 
                    apiUpdates: {
                        ...apiUpdates,
                        poseReferences: apiUpdates.poseReferences ? `${apiUpdates.poseReferences.length} items` : 'not included'
                    }
                });
                const updatedCharacter = await apiUpdateCharacter(screenplayId, id, apiUpdates, getToken);
                console.log('[ScreenplayContext] 📥 Received updated character from API:', { characterId: id, arcStatus: (updatedCharacter as any)?.arcStatus });
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                // Transform the API response to frontend format and update state
                // Pass existing characters to preserve angle metadata
                const transformedCharacter = transformCharactersFromAPI([updatedCharacter as any], characters)[0];
                
                // 🔥 CRITICAL FIX: Preserve poseReferences from existing character state
                // Production Hub images (poseReferences) are NOT included in Creation section API responses
                // When updating from Creation section, we must preserve existing poseReferences to prevent data loss
                const existingCharacter = characters.find(c => 
                    c.id === id || 
                    c.id === transformedCharacter.id ||
                    (updatedCharacter as any)?.character_id === c.id ||
                    (updatedCharacter as any)?.id === c.id
                );
                
                // If this is a Creation section update (not explicitly updating poseReferences), preserve them
                // poseReferences are only managed in Production Hub, not Creation section
                if (existingCharacter && (updates as any).poseReferences === undefined) {
                    // Get poseReferences from existing character (they're stored in images with source='pose-generation')
                    const existingPoseRefs = existingCharacter.images?.filter((img: any) => 
                        img.metadata?.source === 'pose-generation' || 
                        img.metadata?.createdIn === 'production-hub'
                    ) || [];
                    
                    // Preserve poseReferences by adding them back to the transformed character
                    // Note: This is a defensive measure - Production Hub should use its own query cache
                    // But this ensures Creation section updates don't accidentally clear Production Hub data
                    if (existingPoseRefs.length > 0 && (!transformedCharacter.images || transformedCharacter.images.length === 0 || 
                        !transformedCharacter.images.some((img: any) => img.metadata?.source === 'pose-generation'))) {
                        console.log('[ScreenplayContext] 🔄 Preserving poseReferences from existing character:', {
                            characterId: id,
                            poseRefCount: existingPoseRefs.length
                        });
                        // Note: We don't actually add them to transformedCharacter.images here because
                        // Creation section shouldn't see Production Hub images. This is just for logging.
                        // Production Hub uses its own separate query cache with 'production-hub' context.
                    }
                }
                
                // 🔥 FIX: Preserve images from optimistic update if API response doesn't have them enriched
                // The API might return referenceImages (s3Keys) but not the enriched images array with presigned URLs
                // Get the character from the optimistic update array
                const optimisticCharacter = updatedCharacters.find(c => c.id === id);
                
                // 🔥 CRITICAL FIX: If updates.images was explicitly set (including empty array), respect it
                // This handles the case where user deletes all images - we should NOT preserve old images
                const wasImageUpdate = updates.images !== undefined;
                
                if (wasImageUpdate) {
                    // Image update was explicitly made - use the optimistic update value (even if empty)
                    // This ensures that deleting all images (images: []) is respected
                    if (optimisticCharacter && Array.isArray(optimisticCharacter.images)) {
                        transformedCharacter.images = optimisticCharacter.images;
                        console.log('[ScreenplayContext] 🔄 Using images from explicit update (optimistic):', {
                            imageCount: optimisticCharacter.images.length,
                            wasEmpty: optimisticCharacter.images.length === 0
                        });
                    } else if (Array.isArray(updates.images)) {
                        // 🔥 FIX: If optimistic character not found (e.g., just created), use images from updates directly
                        transformedCharacter.images = updates.images;
                        console.log('[ScreenplayContext] 🔄 Using images from explicit update (direct):', {
                            imageCount: updates.images.length,
                            wasEmpty: updates.images.length === 0
                        });
                    }
                } else if (optimisticCharacter && optimisticCharacter.images && optimisticCharacter.images.length > 0) {
                    // Non-image update, but optimistic update has images - preserve if API response is missing them
                    if (!transformedCharacter.images || transformedCharacter.images.length === 0) {
                        console.log('[ScreenplayContext] 🔄 Preserving images from optimistic update:', {
                            imageCount: optimisticCharacter.images.length,
                            images: optimisticCharacter.images
                        });
                        transformedCharacter.images = optimisticCharacter.images;
                    } else {
                        // API response has images - merge angle metadata from optimistic update
                        // Match images by s3Key to preserve angle metadata
                        const angleMap = new Map<string, string | undefined>();
                        optimisticCharacter.images.forEach(img => {
                            const s3Key = img.metadata?.s3Key;
                            if (s3Key) {
                                angleMap.set(s3Key, img.metadata?.angle);
                            }
                            // Also match by imageUrl as fallback (for cases where s3Key might not match)
                            if (img.imageUrl) {
                                angleMap.set(img.imageUrl, img.metadata?.angle);
                            }
                        });
                        
                        // Merge angle metadata into transformed images
                        transformedCharacter.images = transformedCharacter.images.map((img: any) => {
                            const s3Key = img.metadata?.s3Key;
                            const imageUrl = img.imageUrl || img.url;
                            
                            // Try to find preserved angle by s3Key first, then by imageUrl
                            const preservedAngle = (s3Key && angleMap.get(s3Key)) || 
                                                  (imageUrl && angleMap.get(imageUrl)) ||
                                                  undefined;
                            
                            // Use preserved angle if available, otherwise use what's in the response
                            const angle = preservedAngle || img.metadata?.angle || img.angle;
                            
                            return {
                                ...img,
                                metadata: {
                                    ...img.metadata,
                                    angle: angle // 🔥 FIX: Always preserve angle metadata
                                }
                            };
                        });
                        
                        console.log('[ScreenplayContext] 🔄 Merged angle metadata from optimistic update:', {
                            imageCount: transformedCharacter.images.length,
                            imagesWithAngles: transformedCharacter.images.filter((img: any) => img.metadata?.angle).length,
                            angleMapSize: angleMap.size
                        });
                    }
                } else {
                    console.log('[ScreenplayContext] ⚠️ No images in optimistic update to preserve');
                }
                
                console.log('[ScreenplayContext] 🔄 Syncing character state:', { 
                    updateId: id, 
                    transformedId: transformedCharacter.id,
                    arcStatus: transformedCharacter.arcStatus,
                    imageCount: transformedCharacter.images?.length || 0
                });
                setCharacters(prev => {
                    // Check if character exists in current state
                    const existingIndex = prev.findIndex(char => 
                        char.id === id || 
                        char.id === transformedCharacter.id || 
                                      (updatedCharacter as any)?.character_id === char.id ||
                        (updatedCharacter as any)?.id === char.id
                    );
                    
                    if (existingIndex >= 0) {
                        // Character exists - update it
                        const updated = [...prev];
                        updated[existingIndex] = transformedCharacter;
                            console.log('[ScreenplayContext] ✅ Matched character for update:', { 
                            oldId: prev[existingIndex].id, 
                                newId: transformedCharacter.id,
                            oldArcStatus: prev[existingIndex].arcStatus,
                                newArcStatus: transformedCharacter.arcStatus,
                            oldImageCount: prev[existingIndex].images?.length || 0,
                                newImageCount: transformedCharacter.images?.length || 0
                    });
                    return updated;
                    } else {
                        // Character not found - add it (this can happen if character was just created)
                        console.log('[ScreenplayContext] ⚠️ Character not found in state, adding it:', {
                            characterId: id,
                            transformedId: transformedCharacter.id,
                            imageCount: transformedCharacter.images?.length || 0
                        });
                        return [...prev, transformedCharacter];
                    }
                });
                
                console.log('[ScreenplayContext] ✅ Updated character in DynamoDB and synced local state');
                
                // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
                // The force reload was causing data loss for locations (address field disappeared)
                // Characters now have complex fields (physicalAttributes, referenceLibrary) that could have the same issue
                // Instead, we rely on the state sync above which uses the actual API response
                // The data will be correct on the next page refresh when initializeData runs
                // forceReloadRef.current = true;
                // hasInitializedRef.current = false;
                // setReloadTrigger(prev => prev + 1);
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
                
                // 🔥 FIX: Aggressively clear and refetch Production Hub cache so cards update immediately
                if (screenplayId) {
                    // First, remove the query from cache completely to force a fresh fetch
                    queryClient.removeQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    // Then invalidate to mark as stale (in case query is recreated before refetch)
                    queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                    // Force refetch after delay to ensure fresh data from DynamoDB
                    setTimeout(() => {
                        queryClient.refetchQueries({ 
                            queryKey: ['characters', screenplayId, 'production-hub'],
                            type: 'active' // Only refetch active queries
                        });
                    }, 2000); // 2 second delay for DynamoDB eventual consistency
                }
                
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
    }, [characters, relationships, screenplayId, getToken, queryClient]);
    
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
                    referenceImages: newLocation.images?.map(img => {
                        // Extract s3Key from metadata, fallback to extracting from imageUrl
                        if (img.metadata?.s3Key) return img.metadata.s3Key;
                        if (img.imageUrl && (img.imageUrl.includes('temp/') || img.imageUrl.includes('timeline/'))) {
                            const urlMatch = img.imageUrl.match(/(temp\/[^?]+|timeline\/[^?]+)/);
                            if (urlMatch && urlMatch[1]) return urlMatch[1];
                            if (!img.imageUrl.includes('?')) {
                                const s3UrlMatch = img.imageUrl.match(/s3[^/]*\.amazonaws\.com\/([^?]+)/);
                                if (s3UrlMatch && s3UrlMatch[1]) return s3UrlMatch[1];
                                return img.imageUrl;
                            }
                        }
                        return null;
                    }).filter((key): key is string => key !== null && key.length <= 1024) || []
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
                
                // 🔥 FIX: Update relationships to use the real location ID instead of optimistic ID
                if (transformedLocation.id !== newLocation.id) {
                    setRelationships(prev => {
                        const { [newLocation.id]: oldRel, ...restLocs } = prev.locations || {};
                        return {
                            ...prev,
                            locations: {
                                ...restLocs,
                                [transformedLocation.id]: oldRel || {
                                    type: 'location',
                                    scenes: []
                                }
                            }
                        };
                    });
                }
                
                // 🔥 CRITICAL FIX: Return the transformed location from API (with real ID) instead of optimistic one
                // This ensures LocationBoard uses the correct ID when registering images
                return transformedLocation;
                
                // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
                // The force reload was causing the address to disappear because it was happening
                // before DynamoDB had fully written the item, or the address wasn't in the list response
                // Instead, we rely on the state sync above which uses the actual API response
                // forceReloadRef.current = true;
                // hasInitializedRef.current = false;
                // setReloadTrigger(prev => prev + 1);
            } catch (error) {
                console.error('[ScreenplayContext] Failed to create location in DynamoDB:', error);
                // If API call fails, return optimistic location as fallback
            }
        }
        
        // Return optimistic location only if API call wasn't made or failed
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
                // 🔥 FIX: Extract s3Key from images array (not imageUrl) for referenceImages
                // CRITICAL: Store s3Key, NOT presigned URL (imageUrl can be 1000+ chars, causing KeyTooLongError)
                if (updates.images !== undefined) {
                    // 🔥 CRITICAL FIX: Always set referenceImages, even if empty array
                    // This ensures that deleting all images (images: []) properly clears the array
                    if (updates.images.length === 0) {
                        apiUpdates.referenceImages = [];
                    } else {
                        apiUpdates.referenceImages = updates.images.map(img => {
                            // Extract s3Key from metadata, fallback to extracting from imageUrl
                            if (img.metadata?.s3Key) return img.metadata.s3Key;
                            if (img.imageUrl && (img.imageUrl.includes('temp/') || img.imageUrl.includes('timeline/'))) {
                                // Extract s3Key from presigned URL (everything before the first ?)
                                const urlMatch = img.imageUrl.match(/(temp\/[^?]+|timeline\/[^?]+)/);
                                if (urlMatch && urlMatch[1]) return urlMatch[1];
                                // If no query params, might be direct S3 URL
                                if (!img.imageUrl.includes('?')) {
                                    // Remove S3 bucket URL prefix if present
                                    const s3UrlMatch = img.imageUrl.match(/s3[^/]*\.amazonaws\.com\/([^?]+)/);
                                    if (s3UrlMatch && s3UrlMatch[1]) return s3UrlMatch[1];
                                    return img.imageUrl;
                                }
                            }
                            return null;
                        }).filter((key): key is string => key !== null && key.length <= 1024); // Filter out nulls and keys > 1024 chars
                    }
                    console.log('[ScreenplayContext] 📤 Setting referenceImages:', {
                        imageCount: updates.images.length,
                        referenceImageCount: apiUpdates.referenceImages.length,
                        isEmpty: apiUpdates.referenceImages.length === 0
                    });
                }
                if (updates.address !== undefined) apiUpdates.address = updates.address; // 🔥 NEW: Include address
                if (updates.atmosphereNotes !== undefined) apiUpdates.atmosphereNotes = updates.atmosphereNotes; // 🔥 NEW: Include atmosphere notes
                if (updates.setRequirements !== undefined) apiUpdates.setRequirements = updates.setRequirements; // 🔥 NEW: Include set requirements
                if (updates.productionNotes !== undefined) apiUpdates.productionNotes = updates.productionNotes; // 🔥 NEW: Include production notes
                // 🔥 NEW: Include locationBankProfile if it's being updated (e.g., when deleting angle variations)
                if (updates.locationBankProfile !== undefined) apiUpdates.locationBankProfile = updates.locationBankProfile;
                
                const updatedLocation = await apiUpdateLocation(screenplayId, id, apiUpdates, getToken);
                
                // 🔥 FIX: Update local state with the actual response from DynamoDB to ensure consistency
                // Transform the API response to frontend format and update state
                const transformedLocation = transformLocationsFromAPI([updatedLocation as any])[0];
                
                // 🔥 FIX: Preserve images from optimistic update if API response doesn't have them enriched
                // The API might return referenceImages (s3Keys) but not the enriched images array with presigned URLs
                // Get the location from the optimistic update array
                const optimisticLocation = updatedLocations.find(l => l.id === id);
                
                // 🔥 CRITICAL FIX: If updates.images was explicitly set (including empty array), respect it
                // This handles the case where user deletes all images - we should NOT preserve old images
                const wasImageUpdate = updates.images !== undefined;
                
                if (wasImageUpdate) {
                    // Image update was explicitly made - use the optimistic update value (even if empty)
                    // This ensures that deleting all images (images: []) is respected
                    if (optimisticLocation && Array.isArray(optimisticLocation.images)) {
                        transformedLocation.images = optimisticLocation.images;
                        console.log('[ScreenplayContext] 🔄 Using images from explicit update (optimistic):', {
                            imageCount: optimisticLocation.images.length,
                            wasEmpty: optimisticLocation.images.length === 0
                        });
                    } else if (Array.isArray(updates.images)) {
                        // 🔥 FIX: If optimistic location not found (e.g., just created), use images from updates directly
                        transformedLocation.images = updates.images;
                        console.log('[ScreenplayContext] 🔄 Using images from explicit update (direct):', {
                            imageCount: updates.images.length,
                            wasEmpty: updates.images.length === 0
                        });
                    }
                } else if (optimisticLocation && optimisticLocation.images && optimisticLocation.images.length > 0) {
                    // Non-image update, but optimistic update has images - preserve if API response is missing them
                    if (!transformedLocation.images || transformedLocation.images.length === 0) {
                        console.log('[ScreenplayContext] 🔄 Preserving images from optimistic update:', {
                            imageCount: optimisticLocation.images.length,
                            images: optimisticLocation.images
                        });
                        transformedLocation.images = optimisticLocation.images;
                    } else {
                        // API response has images - use it (it should be enriched with presigned URLs from GET endpoint)
                        console.log('[ScreenplayContext] 🔄 Using images from API response:', {
                            imageCount: transformedLocation.images.length
                        });
                    }
                } else {
                    console.log('[ScreenplayContext] ⚠️ No images in optimistic update to preserve');
                }
                
                console.log('[ScreenplayContext] 🔄 Syncing location state:', {
                    locationId: id,
                    imageCount: transformedLocation.images?.length || 0
                });
                setLocations(prev => {
                    // Check if location exists in current state
                    const existingIndex = prev.findIndex(loc => 
                        loc.id === id || 
                        loc.id === transformedLocation.id || 
                                      (updatedLocation as any)?.location_id === loc.id ||
                        (updatedLocation as any)?.id === loc.id
                    );
                    
                    if (existingIndex >= 0) {
                        // Location exists - update it
                        const updated = [...prev];
                        updated[existingIndex] = transformedLocation;
                            console.log('[ScreenplayContext] ✅ Matched location for update:', { 
                            oldId: prev[existingIndex].id, 
                                newId: transformedLocation.id,
                            oldType: prev[existingIndex].type,
                                newType: transformedLocation.type,
                            oldImageCount: prev[existingIndex].images?.length || 0,
                                newImageCount: transformedLocation.images?.length || 0
                    });
                    return updated;
                    } else {
                        // Location not found - add it (this can happen if location was just created)
                        console.log('[ScreenplayContext] ⚠️ Location not found in state, adding it:', {
                            locationId: id,
                            transformedId: transformedLocation.id,
                            imageCount: transformedLocation.images?.length || 0
                        });
                        return [...prev, transformedLocation];
                    }
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
            
            // Ensure scene relationship exists
            if (!newRels.scenes[sceneId]) {
                newRels.scenes[sceneId] = {
                    type: 'scene',
                    characters: [],
                    location: locationId
                };
            } else {
            // Set scene's location
            newRels.scenes[sceneId].location = locationId;
            }
            
            // Ensure location relationship exists before accessing it
            if (!newRels.locations[locationId]) {
                newRels.locations[locationId] = {
                    type: 'location',
                    scenes: []
                };
            }
            
            // Add to location's scenes
            if (!newRels.locations[locationId].scenes.includes(sceneId)) {
                newRels.locations[locationId].scenes.push(sceneId);
            }
            
            return newRels;
        });
        
        // Feature 0111 Phase 3: Update relationships in DynamoDB
        if (screenplayId) {
            try {
                // Use current relationships state
                const currentRels = relationships;
                const updatedRels = { ...currentRels };
                
                // Ensure scene relationship exists
                if (!updatedRels.scenes[sceneId]) {
                    updatedRels.scenes[sceneId] = {
                        type: 'scene',
                        characters: [],
                        location: locationId
                    };
                } else {
                updatedRels.scenes[sceneId].location = locationId;
                }
                
                // Ensure location relationship exists
                if (!updatedRels.locations[locationId]) {
                    updatedRels.locations[locationId] = {
                        type: 'location',
                        scenes: []
                    };
                }
                
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
    // CRUD - Assets (Props)
    // ========================================================================
    
    const createAsset = useCallback(async (asset: { name: string; category: AssetCategory; description?: string; tags?: string[] }): Promise<Asset> => {
        if (!screenplayId) {
            throw new Error('No screenplay ID available');
        }
        
        const now = new Date().toISOString();
        
        // 🔥 FIX: Create optimistic asset locally FIRST (like characters/locations)
        // Use user from component scope (already available via useUser hook)
        const userId = user?.id || 'temp-user-id'; // Will be replaced by real asset from API
        
        const optimisticAsset: Asset = {
            id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            userId: userId,
            projectId: screenplayId, // Backward compatibility
            screenplayId: screenplayId, // Primary identifier
            name: asset.name.trim(),
            category: asset.category,
            description: asset.description?.trim(),
            tags: asset.tags || [],
            images: [],
            has3DModel: false,
            createdAt: now,
            updatedAt: now
        };
        
        // Add to local state IMMEDIATELY (optimistic UI)
        setAssets(prev => [...prev, optimisticAsset]);
        
        // Create asset via API
        try {
            const response = await api.assetBank.create({
                screenplayId,
                name: asset.name.trim(),
                category: asset.category,
                description: asset.description?.trim(),
                tags: asset.tags || []
            });
            
            // Extract asset from response (API returns { success: true, asset })
            const createdAsset = response.asset || response;
            
            console.log('[ScreenplayContext] 📥 Asset creation API response:', {
                hasResponse: !!response,
                hasAsset: !!response.asset,
                responseKeys: response ? Object.keys(response) : [],
                createdAssetId: createdAsset?.id,
                createdAssetName: createdAsset?.name,
                optimisticAssetId: optimisticAsset.id,
                optimisticAssetName: optimisticAsset.name
            });
            
            if (!createdAsset || !createdAsset.id) {
                console.error('[ScreenplayContext] ❌ Invalid asset creation response:', response);
                throw new Error('Invalid response from asset creation API');
            }
            
            // 🔥 FIX: Normalize asset (ensure images array exists)
            const normalizedAsset: Asset = {
                ...createdAsset,
                images: createdAsset.images || []
            };
            
            // 🔥 FIX: REPLACE optimistic asset with real one from DynamoDB (match by optimistic ID only)
            setAssets(prev => {
                // Find and replace the optimistic asset by its ID
                const optimisticIndex = prev.findIndex(a => a.id === optimisticAsset.id);
                
                if (optimisticIndex >= 0) {
                    // Replace optimistic asset with real one
                    const updated = [...prev];
                    updated[optimisticIndex] = normalizedAsset;
                    console.log('[ScreenplayContext] 🔄 Replaced optimistic asset at index', optimisticIndex, 'with real asset:', normalizedAsset.id);
                    return updated;
                } else {
                    // Optimistic asset not found - check if real asset already exists
                    const existingIndex = prev.findIndex(a => a.id === normalizedAsset.id);
                    if (existingIndex >= 0) {
                        // Update existing asset
                        const updated = [...prev];
                        updated[existingIndex] = normalizedAsset;
                        console.log('[ScreenplayContext] 🔄 Updated existing asset at index', existingIndex, ':', normalizedAsset.id);
                        return updated;
                    } else {
                        // Add new asset
                        console.log('[ScreenplayContext] ➕ Adding new asset:', normalizedAsset.id);
                        return [...prev, normalizedAsset];
                    }
                }
            });
            
            // 🔥 FIX: Save optimistic asset to sessionStorage for eventual consistency handling
            if (screenplayId && typeof window !== 'undefined') {
                try {
                    const stored = sessionStorage.getItem(`optimistic-assets-${screenplayId}`);
                    const optimisticAssets = stored ? JSON.parse(stored) as Asset[] : [];
                    // Add or update the asset
                    const index = optimisticAssets.findIndex(a => a.id === normalizedAsset.id || a.id === optimisticAsset.id);
                    if (index >= 0) {
                        optimisticAssets[index] = normalizedAsset;
                    } else {
                        optimisticAssets.push(normalizedAsset);
                    }
                    // Only keep assets created OR updated within last 5 minutes (accounts for GSI eventual consistency)
                    // 🔥 CRITICAL FIX: Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                    const now = Date.now();
                    const recent = optimisticAssets.filter(a => {
                        // Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                        const timestamp = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                        const age = now - timestamp;
                        return age < 300000; // 5 minutes (300 seconds) - accounts for GSI eventual consistency
                    });
                    sessionStorage.setItem(`optimistic-assets-${screenplayId}`, JSON.stringify(recent));
                } catch (e) {
                    console.warn('[ScreenplayContext] Failed to save optimistic asset to sessionStorage:', e);
                }
            }
            
            console.log('[ScreenplayContext] ✅ Created asset:', normalizedAsset.id);
            
            // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
            // The force reload was causing data loss for locations (address field disappeared)
            // Instead, we rely on the state sync above which uses the actual API response
            // The data will be correct on the next page refresh when initializeData runs
            
            return normalizedAsset;
        } catch (error) {
            // Rollback on error
            console.error('[ScreenplayContext] Failed to create asset, rolling back:', error);
            setAssets(prev => prev.filter(a => a.id !== optimisticAsset.id));
            throw error;
        }
    }, [screenplayId, user]);
    
    const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
        // 🔥 FIX: Save previous state for rollback BEFORE optimistic update
        // Use ref to get current state without closure issues
        const previousAsset = assetsRef.current.find(a => a.id === id);
        
        // 🔥 FIX: Skip optimistic updates for newly created assets (created within last 2 seconds)
        // This prevents icon flash when update fails due to eventual consistency
        const isNewlyCreated = previousAsset && previousAsset.createdAt 
            ? (Date.now() - new Date(previousAsset.createdAt).getTime()) < 2000
            : false;
        
        // 🔥 FIX: Use functional update to get latest state (not closure)
        // This prevents stale state issues when updateAsset is called right after createAsset
        // Even if asset is not in state yet (race condition), we'll still update via API
        let assetInState = false;
        if (!isNewlyCreated) {
            // Only do optimistic update for existing assets (not newly created)
            setAssets(prev => {
                const assetIndex = prev.findIndex(a => a.id === id);
                if (assetIndex === -1) {
                    console.warn('[ScreenplayContext] ⚠️ Asset not found in state for update:', id, '- will update via API anyway (race condition)');
                    assetInState = false;
                    return prev; // Asset not found, return unchanged (but we'll still update via API)
                }
                assetInState = true;
                // Update the asset optimistically
                const updated = [...prev];
                updated[assetIndex] = { ...updated[assetIndex], ...updates, updatedAt: new Date().toISOString() };
                return updated;
            });
        } else {
            // Newly created asset - skip optimistic update to prevent flash
            console.log('[ScreenplayContext] ⏭️ Skipping optimistic update for newly created asset:', id);
            assetInState = previousAsset !== undefined;
        }
        
        // Update via API
        if (screenplayId) {
            try {
                const response = await api.assetBank.update(id, updates, 'creation'); // Creation section context - filters out Production Hub images
                
                // Extract asset from response (API returns { success: true, asset } or just asset)
                const updatedAsset = response.asset || response;
                
                // 🔥 DEBUG: Log the response to verify images are included
                console.log('[ScreenplayContext] 📥 Asset update API response:', {
                    hasResponse: !!response,
                    hasAsset: !!response.asset,
                    responseKeys: response ? Object.keys(response) : [],
                    updatedAssetImages: updatedAsset?.images?.length || 0,
                    updatedAssetImageUrls: updatedAsset?.images?.map(img => img.url) || []
                });
                
                // 🔥 FIX: Always refetch after image updates to ensure we have complete data from DynamoDB
                // This handles DynamoDB eventual consistency issues where the response might not include all images
                let finalAsset = updatedAsset;
                const wasImageUpdate = updates.images !== undefined;
                if (wasImageUpdate) {
                    // Image update - always refetch to ensure we have all images (handles eventual consistency)
                    console.log('[ScreenplayContext] 📸 Image update detected, refetching asset to ensure complete data...');
                    try {
                        // Small delay to allow DynamoDB to be consistent
                        await new Promise(resolve => setTimeout(resolve, 300));
                        const refetched = await api.assetBank.get(id, 'creation'); // Creation section context - filters out Production Hub images
                        finalAsset = refetched.asset || refetched;
                        console.log('[ScreenplayContext] ✅ Refetched asset with', finalAsset.images?.length || 0, 'images after image update');
                    } catch (refetchError) {
                        console.warn('[ScreenplayContext] Failed to refetch asset after image update, using response:', refetchError);
                    }
                } else if (!updatedAsset.images || updatedAsset.images.length === 0) {
                    // Non-image update but response missing images - refetch
                    console.log('[ScreenplayContext] ⚠️ Response missing images, refetching asset...');
                    try {
                        const refetched = await api.assetBank.get(id, 'creation'); // Creation section context - filters out Production Hub images
                        finalAsset = refetched.asset || refetched;
                        console.log('[ScreenplayContext] ✅ Refetched asset with', finalAsset.images?.length || 0, 'images');
                    } catch (refetchError) {
                        console.warn('[ScreenplayContext] Failed to refetch asset, using response:', refetchError);
                    }
                }
                
                // 🔥 FIX: Sync with API response using functional update
                setAssets(prev => {
                    const assetIndex = prev.findIndex(a => a.id === id);
                    if (assetIndex === -1) {
                        // Asset not found - might have been created but state not synced yet
                        console.warn('[ScreenplayContext] ⚠️ Asset not found in state for sync, adding:', id);
                        return [...prev, finalAsset];
                    }
                    // Replace with API response
                    const updated = [...prev];
                    updated[assetIndex] = finalAsset;
                    return updated;
                });
                
                // 🔥 FIX: Update sessionStorage to preserve images on refresh (for both new and existing assets)
                // This ensures that if the API returns stale data due to eventual consistency, we can restore the updated images
                if (screenplayId && typeof window !== 'undefined') {
                    try {
                        const stored = sessionStorage.getItem(`optimistic-assets-${screenplayId}`);
                        let optimisticAssets: Asset[] = stored ? JSON.parse(stored) : [];
                        
                        // Find or add the asset to sessionStorage
                        const index = optimisticAssets.findIndex(a => a.id === id);
                        if (index >= 0) {
                            // Update existing asset in sessionStorage with the latest data (including images)
                            optimisticAssets[index] = finalAsset;
                            console.log('[ScreenplayContext] 🔄 Updated existing asset in sessionStorage with images:', id, 'imageCount:', finalAsset.images?.length || 0);
                        } else {
                            // Add asset to sessionStorage if it's not there (for recently updated assets)
                            optimisticAssets.push(finalAsset);
                            console.log('[ScreenplayContext] 🔄 Added updated asset to sessionStorage:', id, 'imageCount:', finalAsset.images?.length || 0);
                        }
                        
                        // Clean up old assets (older than 5 minutes)
                        // 🔥 CRITICAL FIX: Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                        // This ensures that assets that were created long ago but recently updated are preserved
                        const now = Date.now();
                        const recent = optimisticAssets.filter(a => {
                            // Use updatedAt if available (for updated assets), otherwise createdAt (for new assets)
                            const timestamp = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
                            const age = now - timestamp;
                            return age < 300000; // 5 minutes (300 seconds) - accounts for GSI eventual consistency
                        });
                        sessionStorage.setItem(`optimistic-assets-${screenplayId}`, JSON.stringify(recent));
                        console.log('[ScreenplayContext] 💾 Saved', recent.length, 'assets to sessionStorage after update (filtered by updatedAt/createdAt)');
                    } catch (e) {
                        console.warn('[ScreenplayContext] Failed to update asset in sessionStorage:', e);
                    }
                }
                
                console.log('[ScreenplayContext] ✅ Updated asset in API and synced local state');
                
                // 🔥 NEW: Trigger Production Hub refresh when asset is updated in Creation section
                // This ensures Production Hub shows updated Creation images immediately
                // 🔥 FIX: Defer event dispatch to prevent React error #300
                if (wasImageUpdate && typeof window !== 'undefined') {
                    setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('refreshAssetBank'));
                    console.log('[ScreenplayContext] 🔄 Triggered Production Hub asset refresh after image update');
                    }, 0);
                }
                
                // 🔥 FIX: Don't force reload immediately - we've already synced state with API response
                // The force reload was causing data loss for locations (address field disappeared)
                // Instead, we rely on the state sync above which uses the actual API response
                // The data will be correct on the next page refresh when initializeData runs
            } catch (error) {
                // Rollback on error - restore previous asset state (only if we did optimistic update)
                console.error('[ScreenplayContext] Failed to update asset, rolling back:', error);
                if (previousAsset && !isNewlyCreated) {
                    // Only rollback if we did an optimistic update (not for newly created assets)
                    setAssets(prev => {
                        const assetIndex = prev.findIndex(a => a.id === id);
                        if (assetIndex === -1) {
                            // Asset was removed, restore it
                            return [...prev, previousAsset];
                        } else {
                            // Asset exists, restore previous state
                            const restored = [...prev];
                            restored[assetIndex] = previousAsset;
                            return restored;
                        }
                    });
                } else if (isNewlyCreated) {
                    // For newly created assets, no rollback needed (we didn't do optimistic update)
                    console.log('[ScreenplayContext] ⏭️ No rollback needed for newly created asset (no optimistic update)');
                }
                throw error;
            }
        }
    }, [screenplayId]);
    
    const deleteAsset = useCallback(async (id: string) => {
        const asset = assets.find(a => a.id === id);
        if (!asset) {
            throw new Error('Asset not found');
        }
        
        // 🔥 FIX: Track deleted asset ID to prevent it from reappearing on refresh
        deletedAssetIdsRef.current.add(id);
        saveDeletedAssetIds(deletedAssetIdsRef.current); // Persist to sessionStorage
        
        // 🔥 OPTIMISTIC UPDATE: Remove from local state immediately
        setAssets(prev => prev.filter(a => a.id !== id));
        
        // Delete via API
        try {
            await api.assetBank.delete(id);
            console.log('[ScreenplayContext] ✅ Deleted asset:', id);
            
            // 🔥 FIX: Don't reload immediately - DynamoDB eventual consistency causes deleted assets to reappear
            // The optimistic update is sufficient - the asset will be gone on next page refresh
            // when initializeData runs, which will have fresh data from DynamoDB
            // This matches the pattern used for locations (no immediate reload for deletes)
        } catch (error) {
            // Restore on error
            console.error('[ScreenplayContext] Failed to delete asset, restoring:', error);
            deletedAssetIdsRef.current.delete(id); // Remove from deleted set
            saveDeletedAssetIds(deletedAssetIdsRef.current); // Update sessionStorage
            setAssets(prev => [...prev, asset]);
            throw error;
        }
    }, [assets]);
    
    const getAssetScenes = useCallback((assetId: string): string[] => {
        // Find all scenes that reference this asset via props tag
        return scenes
            .filter(scene => scene.fountain?.tags?.props?.includes(assetId))
            .map(scene => scene.id);
    }, [scenes]);
    
    // ========================================================================
    // Relationship Queries
    // ========================================================================
    
    const updateRelationships = useCallback(async () => {
        // 🔥 FIX: Actually rebuild relationships from current scenes, characters, and locations
        console.log('[ScreenplayContext] 🔄 Rebuilding relationships from current state...');
        
        // 🔥 FIX: Use scenes directly (beats removed - scenes are standalone)
        const currentScenes = scenesRef.current.length > 0 ? scenesRef.current : scenes;
        
        // 🔥 FIX: Use refs to get latest state (avoid stale closures)
        const currentCharacters = charactersRef.current.length > 0 ? charactersRef.current : characters;
        const currentLocations = locationsRef.current.length > 0 ? locationsRef.current : locations;
        
        // Rebuild relationships using the same function used during initialization
        buildRelationshipsFromScenes(currentScenes, beats, currentCharacters, currentLocations);
        
        // 🔥 FIX: Save cleaned relationships to database to persist the cleanup
        if (screenplayId) {
            try {
                // Wait a bit for setRelationships to complete and relationshipsRef to be updated
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Get the cleaned relationships from ref (set by buildRelationshipsFromScenes)
                const currentRels = relationshipsRef.current || relationships;
                if (currentRels) {
                    await apiUpdateRelationships(screenplayId, currentRels, getToken);
                    console.log('[ScreenplayContext] ✅ Saved cleaned relationships to DynamoDB');
                }
            } catch (error) {
                console.error('[ScreenplayContext] Failed to save relationships to DynamoDB:', error);
                // Don't throw - relationships are still updated in local state
            }
        }
        
        console.log('[ScreenplayContext] ✅ Relationships rebuilt');
    }, [scenes, beats, characters, locations, buildRelationshipsFromScenes, screenplayId, getToken, relationships]);
    
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
        metadata?: { 
            prompt?: string; 
            modelUsed?: string;
            angle?: string; // For character headshots: 'front' | 'side' | 'three-quarter'
            s3Key?: string; // S3 key for file management
        }
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
                
                // 🔥 FIX: Aggressively clear and refetch Production Hub cache so cards update with new characters
                if (idToUse) {
                    // First, remove the query from cache completely to force a fresh fetch
                    queryClient.removeQueries({ queryKey: ['characters', idToUse, 'production-hub'] });
                    // Then invalidate to mark as stale (in case query is recreated before refetch)
                    queryClient.invalidateQueries({ queryKey: ['characters', idToUse, 'production-hub'] });
                    // Force refetch after delay to ensure fresh data from DynamoDB
                    setTimeout(() => {
                        queryClient.refetchQueries({ 
                            queryKey: ['characters', idToUse, 'production-hub'],
                            type: 'active' // Only refetch active queries
                        });
                    }, 2000); // 2 second delay for DynamoDB eventual consistency
                }
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
    }, [characters, screenplayId, getToken, queryClient]);
    
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
            
            // Also check by location name (handle INT/EXT changes)
            const extractLocationName = (heading: string): string => {
                const match = heading.match(/(?:INT|EXT|INT\/EXT|I\/E)[\.\s]+(.+?)(?:\s*-\s*(?:DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER))?$/i);
                return match ? match[1].trim().toUpperCase() : '';
            };
            
            const existingLocationKeys = new Map<string, Scene>(); // locationName|startLine -> Scene
            prev.forEach(s => {
                const locName = extractLocationName(s.heading || '');
                if (locName) {
                    const key = `${locName}|${s.fountain?.startLine || 0}`;
                    if (!existingLocationKeys.has(key)) {
                        existingLocationKeys.set(key, s);
                    }
                }
            });
            
            const trulyNewScenes = newScenes.filter(scene => {
                // Check by ID
                if (existingSceneIds.has(scene.id)) {
                    console.log(`[ScreenplayContext] ⚠️ Duplicate scene by ID: ${scene.id}`);
                    return false;
                }
                
                // Check by content (heading + startLine)
                const contentKey = `${(scene.heading || '').toUpperCase().trim()}|${scene.fountain?.startLine || 0}`;
                if (existingContentKeys.has(contentKey)) {
                    console.log(`[ScreenplayContext] ⚠️ Duplicate scene by content: ${contentKey}`);
                    return false;
                }
                
                // Check by location name + startLine (handle INT/EXT changes)
                const sceneLocName = extractLocationName(scene.heading || '');
                if (sceneLocName) {
                    const locationKey = `${sceneLocName}|${scene.fountain?.startLine || 0}`;
                    if (existingLocationKeys.has(locationKey)) {
                        console.log(`[ScreenplayContext] ⚠️ Duplicate scene by location: ${locationKey} (${scene.heading} vs ${existingLocationKeys.get(locationKey)?.heading})`);
                        return false;
                    }
                }
                
                return true;
            });
            
            if (trulyNewScenes.length < newScenes.length) {
                console.log(`[ScreenplayContext] 🔍 Deduplicated ${newScenes.length - trulyNewScenes.length} duplicate scenes`);
            }
            
            // Add new scenes and renumber ALL scenes
            const updated = [...prev, ...trulyNewScenes];
            const sorted = updated.sort((a, b) => {
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
                
                // Link location to scene - ensure location relationship exists
                if (scene.fountain.tags.location) {
                    const locationId = scene.fountain.tags.location;
                    if (!updatedLocations[locationId]) {
                        // Create location relationship if it doesn't exist
                        updatedLocations[locationId] = {
                            type: 'location',
                            scenes: []
                        };
                    }
                    if (!updatedLocations[locationId].scenes.includes(scene.id)) {
                        updatedLocations[locationId].scenes.push(scene.id);
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
    // Metadata Preservation Helpers (for Rescan)
    // ========================================================================
    
    /**
     * Extract location name from scene heading
     * Example: "INT. COFFEE SHOP - DAY" -> "COFFEE SHOP"
     */
    const extractLocationName = useCallback((heading: string): string => {
        const match = heading.match(/(?:INT|EXT|INT\/EXT|I\/E)[\.\s]+(.+?)(?:\s*-\s*(?:DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER))?$/i);
        return match ? match[1].trim().toUpperCase() : '';
    }, []);
    
    /**
     * Match old scene to new scene for metadata preservation
     * Uses hybrid matching: heading+position -> location+position -> heading only
     */
    const matchOldSceneToNewScene = useCallback((
        oldScene: Scene,
        newScene: { heading: string; startLine: number; endLine: number }
    ): boolean => {
        // Strategy 1: Exact heading + position match (within ±5 lines)
        const headingMatch = oldScene.heading.toUpperCase().trim() === newScene.heading.toUpperCase().trim();
        const positionMatch = Math.abs((oldScene.fountain?.startLine || 0) - newScene.startLine) <= 5;
        
        if (headingMatch && positionMatch) {
            return true; // Perfect match
        }
        
        // Strategy 2: Location name + position match (handles INT/EXT changes)
        const oldLocation = extractLocationName(oldScene.heading);
        const newLocation = extractLocationName(newScene.heading);
        const locationMatch = oldLocation === newLocation && oldLocation !== '';
        
        if (locationMatch && positionMatch) {
            return true; // Good match (handles INT/EXT changes)
        }
        
        // Strategy 3: Heading only (last resort)
        if (headingMatch) {
            return true; // Acceptable match
        }
        
        return false; // No match
    }, [extractLocationName]);
    
    /**
     * Preserve metadata from old scenes and match to new scenes
     * Returns map of new scene index -> preserved metadata
     */
    interface PreservedMetadata {
        synopsis: string;
        status: 'draft' | 'review' | 'final';
        images?: any[];
        videoAssets?: any;
        timing?: { startMinute: number; durationMinutes: number; pageNumber?: number };
        estimatedPageCount?: number;
        group_label?: string;
        props?: string[]; // Preserve prop associations during rescan
    }
    
    const preserveSceneMetadata = useCallback((
        oldScenes: Scene[],
        newScenes: Array<{ heading: string; startLine: number; endLine: number; synopsis?: string; group_label?: string }>
    ): Map<number, PreservedMetadata> => {
        const metadataMap = new Map<number, PreservedMetadata>();
        const matchedOldScenes = new Set<string>(); // Track which old scenes have been matched
        
        newScenes.forEach((newScene, newIndex) => {
            // Find best matching old scene (closest position match)
            let bestMatch: Scene | null = null;
            let bestDistance = Infinity;
            
            oldScenes.forEach(oldScene => {
                // Skip if already matched
                if (matchedOldScenes.has(oldScene.id)) return;
                
                // Check if scenes match
                if (matchOldSceneToNewScene(oldScene, newScene)) {
                    const distance = Math.abs((oldScene.fountain?.startLine || 0) - newScene.startLine);
                    if (distance < bestDistance) {
                        bestMatch = oldScene;
                        bestDistance = distance;
                    }
                }
            });
            
            // If match found, preserve metadata
            if (bestMatch) {
                matchedOldScenes.add(bestMatch.id);
                // 🔥 FIX: oldScenes parameter is already the current state, so use bestMatch directly
                // This preserves props that exist, but won't restore props that were unlinked
                // (because oldScenes is the current state passed in, not stale data)
                metadataMap.set(newIndex, {
                    synopsis: bestMatch.synopsis,
                    status: bestMatch.status,
                    images: bestMatch.images,
                    videoAssets: bestMatch.videoAssets,
                    timing: bestMatch.timing,
                    estimatedPageCount: bestMatch.estimatedPageCount,
                    group_label: bestMatch.group_label,
                    props: bestMatch.fountain?.tags?.props || [] // Use bestMatch (which is from oldScenes - current state)
                });
            }
        });
        
        return metadataMap;
    }, [matchOldSceneToNewScene]);
    
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
        
        // 🔥 FIX: Use scenes directly instead of beats (beats removed)
        const currentScenes = scenesRef.current.length > 0 ? scenesRef.current : scenes;
        
        // Sort scenes by number/order to match the order they appear in content
        const sortedScenes = [...currentScenes].sort((a, b) => {
            const orderA = a.order ?? a.number ?? 0;
            const orderB = b.order ?? b.number ?? 0;
            return orderA - orderB;
        });
        
        console.log('[ScreenplayContext] Matching', sortedScenes.length, 'database scenes to', scenesInOrder.length, 'content scenes');
        
        // Match scenes using hybrid matching - match each database scene to the correct content scene
        // 🔥 CRITICAL FIX: Don't match by index - match by actual content (heading + position)
        const updates = new Map<string, Partial<Scene>>();
        const matchedContentScenes = new Set<number>(); // Track which content scenes have been matched
        
        // For each database scene, find the best matching content scene
        sortedScenes.forEach((scene) => {
            // Try to find matching content scene using matchScene logic
            let bestMatch: { index: number; scene: typeof scenesInOrder[0] } | null = null;
            let bestMatchDistance = Infinity;
            
            scenesInOrder.forEach((contentScene, contentIndex) => {
                // Skip if already matched
                if (matchedContentScenes.has(contentIndex)) return;
                
                // Use matchScene to check if this content scene matches the database scene
                const testMatch = matchScene(
                    { heading: contentScene.heading, startLine: contentScene.startLine, endLine: contentScene.endLine, id: scene.id },
                    [scene]
                );
                
                if (testMatch && testMatch.id === scene.id) {
                    // Exact match by ID
                    const distance = Math.abs((scene.fountain?.startLine || 0) - contentScene.startLine);
                    if (distance < bestMatchDistance) {
                        bestMatch = { index: contentIndex, scene: contentScene };
                        bestMatchDistance = distance;
                    }
                    } else {
                    // Try location name + position matching
                    const extractLocationName = (heading: string): string => {
                        const match = heading.match(/(?:INT|EXT|INT\/EXT|I\/E)[\.\s]+(.+?)(?:\s*-\s*(?:DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER))?$/i);
                        return match ? match[1].trim().toUpperCase() : '';
                    };
                    
                    const sceneLocName = extractLocationName(scene.heading || '');
                    const contentLocName = extractLocationName(contentScene.heading);
                    const locationMatch = sceneLocName && sceneLocName === contentLocName;
                    const positionMatch = Math.abs((scene.fountain?.startLine || 0) - contentScene.startLine) <= 5;
                    
                    if (locationMatch && positionMatch) {
                        const distance = Math.abs((scene.fountain?.startLine || 0) - contentScene.startLine);
                        if (distance < bestMatchDistance) {
                            bestMatch = { index: contentIndex, scene: contentScene };
                            bestMatchDistance = distance;
                        }
                    } else if (scene.heading.toUpperCase().trim() === contentScene.heading.toUpperCase().trim()) {
                        // Exact heading match
                        const distance = Math.abs((scene.fountain?.startLine || 0) - contentScene.startLine);
                        if (distance < bestMatchDistance) {
                            bestMatch = { index: contentIndex, scene: contentScene };
                            bestMatchDistance = distance;
                        }
                    }
                }
            });
            
            if (bestMatch) {
                const contentScene = bestMatch.scene;
                const currentStartLine = scene.fountain?.startLine ?? -1;
                const currentEndLine = scene.fountain?.endLine ?? -1;
                const currentHeading = scene.heading.toUpperCase().trim();
                const newHeading = contentScene.heading.toUpperCase().trim();
                
                const positionChanged = currentStartLine !== contentScene.startLine || currentEndLine !== contentScene.endLine;
                const headingChanged = currentHeading !== newHeading;
                
                if (positionChanged || headingChanged) {
                    console.log(`[ScreenplayContext] Scene "${scene.heading}" -> "${contentScene.heading}" lines ${contentScene.startLine}-${contentScene.endLine} (was ${currentStartLine}-${currentEndLine})`);
                    updates.set(scene.id, {
                        heading: contentScene.heading,
                                    fountain: {
                            ...scene.fountain,
                                        startLine: contentScene.startLine,
                                        endLine: contentScene.endLine
                                }
                            });
                    matchedContentScenes.add(bestMatch.index);
                        } else {
                    console.log(`[ScreenplayContext] Scene "${scene.heading}" -> position unchanged (${contentScene.startLine}-${contentScene.endLine})`);
                    matchedContentScenes.add(bestMatch.index);
                        }
                    } else {
                console.warn(`[ScreenplayContext] Could not find matching content scene for database scene: "${scene.heading}" (${scene.fountain?.startLine})`);
            }
        });
        
        // Apply updates and collect updated scenes for saving
        const updatedScenes: Scene[] = [];
        setScenes(prev => {
            return prev.map(scene => {
                const update = updates.get(scene.id);
                if (update) {
                    const updatedScene = { ...scene, ...update };
                        updatedScenes.push(updatedScene);
                        return updatedScene;
                }
                return scene;
            });
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
    }, [scenes, matchScene, screenplayId, transformScenesToAPI, getToken]);
    
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
        // 🔥 SAFEGUARD #3: Concurrency lock - prevent multiple rescans
        if (isRescanningRef.current) {
            console.warn('[ScreenplayContext] ⚠️ Rescan already in progress, skipping...');
            throw new Error('Rescan already in progress');
        }
        isRescanningRef.current = true;
        
        try {
            // 🔥 SAFEGUARD #2: Content validation before proceeding
            if (!content || content.trim().length === 0) {
                throw new Error('Script is empty');
            }
            
            console.log('[ScreenplayContext] 🔍 Re-scanning script for new entities...');
            
            // Parse the content
            const parseResult = parseContentForImport(content);
            
            // 🔥 FIX: Handle empty scripts gracefully - delete all scenes if script has no scenes
            if (!parseResult || parseResult.scenes.length === 0) {
                console.log('[ScreenplayContext] Script has no scenes - deleting all existing scenes');
                
                // Get existing scenes count before deletion
                const currentScenes = scenesRef.current.length > 0 ? scenesRef.current : scenes;
                const existingSceneCount = currentScenes.length;
                
                // Delete all existing scenes from database and state
                if (screenplayId && existingSceneCount > 0) {
                    try {
                        const { deleteAllScenes: apiDeleteAllScenes } = await import('@/utils/screenplayStorage');
                        console.log('[ScreenplayContext] 🗑️ Deleting all existing scenes (script has no scenes)...');
                        await apiDeleteAllScenes(screenplayId, getToken);
                        console.log('[ScreenplayContext] ✅ Deleted all existing scenes from DynamoDB');
                        
                        // Clear scenes from state
                        setScenes([]);
                        scenesRef.current = [];
                        
                        // Rebuild relationships with empty scenes
                        buildRelationshipsFromScenes([], beats, charactersRef.current.length > 0 ? charactersRef.current : characters, locationsRef.current.length > 0 ? locationsRef.current : locations);
                        await updateRelationships();
                        
                        console.log('[ScreenplayContext] ✅ Re-scan complete: All scenes deleted (script has no scenes)');
                    } catch (error) {
                        console.error('[ScreenplayContext] ❌ Failed to delete scenes:', error);
                        throw error;
                    }
                } else {
                    console.log('[ScreenplayContext] ✅ Re-scan complete: No scenes to delete (script has no scenes, no existing scenes)');
                }
                
                return {
                    newCharacters: 0,
                    newLocations: 0,
                    newScenes: 0,
                    updatedScenes: 0,
                    preservedMetadata: 0
                };
            }
            
            console.log('[ScreenplayContext] Parsed content:', {
                characters: parseResult.characters.size,
                locations: parseResult.locations.size,
                scenes: parseResult.scenes.length
            });
            
            // 🔥 PHASE 4: Link script entities to reference cards
            // Find NEW characters (case-insensitive comparison)
            // 🔥 FIX: Use current state from refs to avoid stale closures
            const currentCharacters = charactersRef.current.length > 0 ? charactersRef.current : characters;
            const existingCharNames = new Set(
                currentCharacters.map(c => c.name.toUpperCase())
            );
            
            // 🔥 PHASE 4: Separate reference cards (not in script) from active entities (in script)
            const referenceCardCharacters = currentCharacters.filter(char => 
                !isEntityInScript(content, char.name, 'character')
            );
            const activeCharacters = currentCharacters.filter(char => 
                isEntityInScript(content, char.name, 'character')
            );
            
            // Find script character names that don't match existing active characters
            const scriptCharacterNames = Array.from(parseResult.characters);
            const activeCharNames = new Set(
                activeCharacters.map(c => c.name.toUpperCase())
            );
            
            // 🔥 PHASE 4: Match script characters to reference cards before creating new ones
            const charactersToLink: Array<{ scriptName: string; referenceCard: Character }> = [];
            const trulyNewCharacterNames: string[] = [];
            
            for (const scriptCharName of scriptCharacterNames) {
                const upperScriptName = scriptCharName.toUpperCase();
                
                // Check if already active (exact match)
                if (activeCharNames.has(upperScriptName)) {
                    continue; // Already active, skip
                }
                
                // Check if matches existing active character (fuzzy)
                const activeFuzzyMatch = activeCharacters.find(char => 
                    areCharacterNamesSimilar(upperScriptName, char.name.toUpperCase())
                );
                if (activeFuzzyMatch) {
                    continue; // Already active via fuzzy match, skip
                }
                
                // 🔥 PHASE 4: Check for reference card match (exact)
                const exactRefMatch = referenceCardCharacters.find(char => 
                    char.name.toUpperCase() === upperScriptName
                );
                if (exactRefMatch) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Linking script character "${scriptCharName}" to reference card "${exactRefMatch.name}"`);
                    charactersToLink.push({ scriptName: scriptCharName, referenceCard: exactRefMatch });
                    continue;
                }
                
                // 🔥 PHASE 4: Check for reference card match (fuzzy)
                const fuzzyRefMatch = referenceCardCharacters.find(char => 
                    areCharacterNamesSimilar(upperScriptName, char.name.toUpperCase())
                );
                if (fuzzyRefMatch) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Linking script character "${scriptCharName}" to reference card "${fuzzyRefMatch.name}" (fuzzy match)`);
                    charactersToLink.push({ scriptName: scriptCharName, referenceCard: fuzzyRefMatch });
                    continue;
                }
                
                // No match found - truly new character
                trulyNewCharacterNames.push(scriptCharName);
            }
            
            // 🔥 PHASE 4: Update reference cards to become active (link them to script)
            // Update names if script name is different (prefer script name)
            for (const { scriptName, referenceCard } of charactersToLink) {
                const scriptDescription = parseResult.characterDescriptions?.get(scriptName.toUpperCase());
                const updates: Partial<Character> = {};
                
                // Update name if script name is different (prefer script name)
                if (referenceCard.name.toUpperCase() !== scriptName.toUpperCase()) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Updating reference card name "${referenceCard.name}" → "${scriptName}"`);
                    updates.name = scriptName;
                }
                
                // Update description if script has a better one
                if (scriptDescription && scriptDescription.length > (referenceCard.description?.length || 0)) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Updating reference card description for "${scriptName}"`);
                    updates.description = scriptDescription;
                }
                
                if (Object.keys(updates).length > 0) {
                    await updateCharacter(referenceCard.id, updates);
                }
            }
            
            const newCharacterNames = trulyNewCharacterNames;
            
            // Find NEW locations (case-insensitive comparison)
            // 🔥 FIX: Use current state from refs to avoid stale closures
            const currentLocations = locationsRef.current.length > 0 ? locationsRef.current : locations;
            const existingLocNames = new Set(
                currentLocations.map(l => l.name.toUpperCase())
            );
            
            // 🔥 PHASE 4: Separate reference cards (not in script) from active entities (in script)
            const referenceCardLocations = currentLocations.filter(loc => 
                !isEntityInScript(content, loc.name, 'location')
            );
            const activeLocations = currentLocations.filter(loc => 
                isEntityInScript(content, loc.name, 'location')
            );
            
            // Find script location names that don't match existing active locations
            const scriptLocationNames = Array.from(parseResult.locations);
            const activeLocNames = new Set(
                activeLocations.map(l => l.name.toUpperCase())
            );
            
            // 🔥 PHASE 4: Match script locations to reference cards before creating new ones
            const locationsToLink: Array<{ scriptName: string; referenceCard: Location }> = [];
            const trulyNewLocationNames: string[] = [];
            
            for (const scriptLocName of scriptLocationNames) {
                const upperScriptName = scriptLocName.toUpperCase();
                
                // Check if already active (exact match)
                if (activeLocNames.has(upperScriptName)) {
                    continue; // Already active, skip
                }
                
                // Check if matches existing active location (fuzzy - simple contains check for locations)
                const activeFuzzyMatch = activeLocations.find(loc => {
                    const upperLocName = loc.name.toUpperCase();
                    return upperLocName === upperScriptName || 
                           upperLocName.includes(upperScriptName) || 
                           upperScriptName.includes(upperLocName);
                });
                if (activeFuzzyMatch) {
                    continue; // Already active via fuzzy match, skip
                }
                
                // 🔥 PHASE 4: Check for reference card match (exact)
                const exactRefMatch = referenceCardLocations.find(loc => 
                    loc.name.toUpperCase() === upperScriptName
                );
                if (exactRefMatch) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Linking script location "${scriptLocName}" to reference card "${exactRefMatch.name}"`);
                    locationsToLink.push({ scriptName: scriptLocName, referenceCard: exactRefMatch });
                    continue;
                }
                
                // 🔥 PHASE 4: Check for reference card match (fuzzy)
                const fuzzyRefMatch = referenceCardLocations.find(loc => {
                    const upperLocName = loc.name.toUpperCase();
                    return upperLocName === upperScriptName || 
                           upperLocName.includes(upperScriptName) || 
                           upperScriptName.includes(upperLocName);
                });
                if (fuzzyRefMatch) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Linking script location "${scriptLocName}" to reference card "${fuzzyRefMatch.name}" (fuzzy match)`);
                    locationsToLink.push({ scriptName: scriptLocName, referenceCard: fuzzyRefMatch });
                    continue;
                }
                
                // No match found - truly new location
                trulyNewLocationNames.push(scriptLocName);
            }
            
            // 🔥 PHASE 4: Update reference cards to become active (link them to script)
            for (const { scriptName, referenceCard } of locationsToLink) {
                const scriptType = parseResult.locationTypes?.get(scriptName);
                const updates: Partial<Location> = {};
                
                // Update name if script name is different (prefer script name)
                if (referenceCard.name.toUpperCase() !== scriptName.toUpperCase()) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Updating reference card name "${referenceCard.name}" → "${scriptName}"`);
                    updates.name = scriptName;
                }
                
                // Update type if script has a type
                if (scriptType && referenceCard.type !== scriptType) {
                    console.log(`[ScreenplayContext] 🔗 Phase 4: Updating reference card type for "${scriptName}" (${referenceCard.type} → ${scriptType})`);
                    updates.type = scriptType;
                }
                
                if (Object.keys(updates).length > 0) {
                    await updateLocation(referenceCard.id, updates);
                }
            }
            
            const newLocationNames = trulyNewLocationNames;
            
            // 🔥 NEW APPROACH: Reimport all scenes (like import does) with metadata preservation
            // This ensures scene numbers always match script order and eliminates matching failures
            const currentScenes = scenesRef.current.length > 0 ? scenesRef.current : scenes;
            const allExistingScenes = currentScenes;
            
            console.log('[ScreenplayContext] Found new entities:', {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length,
                scenesInScript: parseResult.scenes.length,
                existingScenes: allExistingScenes.length
            });
            
            // Import only NEW entities
            let newlyImportedCharacters: Character[] = [];
            if (newCharacterNames.length > 0) {
                console.log('[ScreenplayContext] Importing', newCharacterNames.length, 'new characters:', newCharacterNames);
                newlyImportedCharacters = await bulkImportCharacters(newCharacterNames, parseResult.characterDescriptions);
            }
            
            if (newLocationNames.length > 0) {
                console.log('[ScreenplayContext] Importing', newLocationNames.length, 'new locations:', newLocationNames);
                // 🔥 FIX: Pass locationTypes to bulkImportLocations
                await bulkImportLocations(newLocationNames, parseResult.locationTypes);
            }
            
            // 🔥 CRITICAL FIX: Merge newly imported characters with current characters for scene linking
            // This ensures newly added characters (like "REPORTER #1") are available when linking scenes
            const allCharactersForLinking = [
                ...currentCharacters,
                ...newlyImportedCharacters
            ];
            // Remove duplicates by ID
            const uniqueCharacters = Array.from(
                new Map(allCharactersForLinking.map(c => [c.id, c])).values()
            );
            
            // 🔥 NEW: Update existing characters/locations with new descriptions from script
            // This handles cases where descriptions are updated in the script
            const existingCharacterNames = Array.from(parseResult.characters)
                .filter((name: string) => existingCharNames.has(name.toUpperCase()));
            
            if (existingCharacterNames.length > 0) {
                console.log('[ScreenplayContext] Updating', existingCharacterNames.length, 'existing characters with new descriptions...');
                for (const charName of existingCharacterNames) {
                    const existingChar = uniqueCharacters.find(c => c.name.toUpperCase() === charName.toUpperCase());
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
            
            // 🔥 NEW APPROACH: Reimport all scenes with metadata preservation
            // Step 1: Preserve metadata from existing scenes
            let preservedCount = 0; // Initialize for return statement
            const metadataMap = preserveSceneMetadata(allExistingScenes, parseResult.scenes);
            preservedCount = metadataMap.size;
            console.log('[ScreenplayContext] Preserved metadata for', preservedCount, 'scenes');
            
            // Step 2: Build all new scenes with preserved metadata + correct numbering (based on script order)
            const now = new Date().toISOString();
            const allNewScenes: Scene[] = parseResult.scenes.map((parsedScene, index) => {
                const preserved = metadataMap.get(index);
                
                // Map character names to IDs
                const characterIds = parsedScene.characters
                    .map(charName => {
                        const char = uniqueCharacters.find(c => c.name.toUpperCase() === charName.toUpperCase());
                        return char?.id;
                    })
                    .filter((id): id is string => !!id);
                
                // Map location name to ID
                const location = currentLocations.find(l => l.name.toUpperCase() === parsedScene.location.toUpperCase());
                const locationId = location?.id;
                
                return {
                    id: `scene-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                    number: index + 1, // ← Sequential based on script order (always correct!)
                    order: index + 1,
                    heading: parsedScene.heading,
                    // 🔥 NEW: Use Fountain synopsis if available, otherwise preserve existing or use default
                    synopsis: parsedScene.synopsis || preserved?.synopsis || `Imported from script`,
                    status: preserved?.status || 'draft',
                    fountain: {
                        startLine: parsedScene.startLine,
                        endLine: parsedScene.endLine,
                        tags: {
                            characters: characterIds,
                            location: locationId,
                            // Preserve props from preserved metadata (which now uses current scene state)
                            ...(preserved?.props && preserved.props.length > 0 ? { props: preserved.props } : {})
                        }
                    },
                    images: preserved?.images,
                    videoAssets: preserved?.videoAssets,
                    timing: preserved?.timing,
                    estimatedPageCount: preserved?.estimatedPageCount,
                    // 🔥 NEW: Use Fountain section (group_label) if available, otherwise preserve existing
                    group_label: parsedScene.group_label || preserved?.group_label,
                    createdAt: now,
                    updatedAt: now
                };
            });
            
            console.log('[ScreenplayContext] Built', allNewScenes.length, 'scenes with correct numbering (1-' + allNewScenes.length + ' based on script order)');
            
            // Step 3: 🔥 CRITICAL FIX: Delete ALL existing scenes FIRST (like import does), then save new ones
            // This prevents duplicates - the current approach saves new scenes then deletes old ones by ID,
            // but if duplicates already exist, they remain. Delete all first ensures clean slate.
            if (screenplayId && allNewScenes.length > 0) {
                try {
                    // 🔥 FIX: Delete ALL scenes first (prevents duplicates from accumulating)
                    // This matches the import behavior which works perfectly
                    const { deleteAllScenes: apiDeleteAllScenes } = await import('@/utils/screenplayStorage');
                    console.log('[ScreenplayContext] 🗑️ Deleting ALL existing scenes first (prevents duplicates)...');
                    await apiDeleteAllScenes(screenplayId, getToken);
                    console.log('[ScreenplayContext] ✅ Deleted all existing scenes from DynamoDB');
                    
                    // Now save the new scenes (clean slate, no duplicates)
                    await saveScenes(allNewScenes, screenplayId);
                    console.log('[ScreenplayContext] ✅ Saved', allNewScenes.length, 'new scenes to DynamoDB');
                    
                    // 🔥 VERIFICATION: Verify scenes were saved correctly
                    const { listScenes } = await import('@/utils/screenplayStorage');
                    const verifyScenes = await listScenes(screenplayId, getToken);
                    const savedSceneCount = verifyScenes?.length || 0;
                    
                    if (savedSceneCount !== allNewScenes.length) {
                        console.warn(`[ScreenplayContext] ⚠️ Scene count mismatch: saved ${savedSceneCount}, expected ${allNewScenes.length}`);
                        // Don't throw - this might be due to deduplication on backend, log warning instead
                    }
                    
                    console.log('[ScreenplayContext] ✅ Verified', savedSceneCount, 'scenes in DynamoDB (expected', allNewScenes.length, ')');
                } catch (error) {
                    console.error('[ScreenplayContext] ❌ Failed to delete/save scenes:', error);
                    throw error; // Re-throw so user sees error
                }
            }
            
            // Step 4: 🔥 SAFEGUARD #4: Update state atomically AFTER all DB operations complete
            // CRITICAL FIX: Update state AFTER save/delete operations to prevent navigation loops
            // Use requestAnimationFrame to ensure state update happens in next render cycle
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Update scenes state with new scenes (this will trigger UI updates)
            setScenes(allNewScenes);
            
            // Update refs immediately to prevent stale closures
            scenesRef.current = allNewScenes;
            
            const updatedScenesCount = allNewScenes.length;
            
            // 🔥 FIX: Wait for state to propagate before rebuilding relationships
            // This prevents navigation loops by ensuring state is stable
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 🔥 FIX: Use the new scenes directly (not from refs) since we just set them
            // This ensures we're working with the correct data
            console.log('[ScreenplayContext] 🔄 Rebuilding relationships with new scenes:', {
                scenes: allNewScenes.length,
                characters: uniqueCharacters.length,
                locations: currentLocations.length
            });
            
            // Rebuild relationships using the new scenes and current characters/locations
            buildRelationshipsFromScenes(allNewScenes, beats, uniqueCharacters, currentLocations);
            
            // Also call updateRelationships to sync with DynamoDB
            await updateRelationships();
            console.log('[ScreenplayContext] ✅ Rebuilt relationships after rescan');
            
            // 🔥 FIX: Dispatch refreshScenes event so Scene Builder refreshes its scene list
            window.dispatchEvent(new CustomEvent('refreshScenes'));
            console.log('[ScreenplayContext] ✅ Dispatched refreshScenes event');
            
            console.log('[ScreenplayContext] ✅ Re-scan complete:', {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length,
                scenesReimported: updatedScenesCount,
                preservedMetadata: preservedCount
            });
            
            return {
                newCharacters: newCharacterNames.length,
                newLocations: newLocationNames.length,
                newScenes: 0, // Always 0 (we reimport all)
                updatedScenes: updatedScenesCount,
                preservedMetadata: preservedCount
            };
        } catch (err) {
            console.error('[ScreenplayContext] ❌ Re-scan failed:', err);
            throw err;
        } finally {
            // Always release the lock
            isRescanningRef.current = false;
        }
    }, [characters, locations, beats, bulkImportCharacters, bulkImportLocations, saveScenes, preserveSceneMetadata, updateRelationships, buildRelationshipsFromScenes, getToken, screenplayId]);
    
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
                
                // 🔥 FIX: Aggressively clear and refetch Production Hub cache so cards update immediately
                // Remove all queries from cache completely to force fresh fetches
                queryClient.removeQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                queryClient.removeQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                queryClient.removeQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                // Then invalidate to mark as stale (in case queries are recreated before refetch)
                queryClient.invalidateQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
                queryClient.invalidateQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
                queryClient.invalidateQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
                // Force refetch after delay to ensure fresh data from DynamoDB
                setTimeout(() => {
                    queryClient.refetchQueries({ 
                        queryKey: ['characters', screenplayId, 'production-hub'],
                        type: 'active' // Only refetch active queries
                    });
                    queryClient.refetchQueries({ 
                        queryKey: ['locations', screenplayId, 'production-hub'],
                        type: 'active'
                    });
                    queryClient.refetchQueries({ 
                        queryKey: ['assets', screenplayId, 'production-hub'],
                        type: 'active'
                    });
                }, 2000); // 2 second delay for DynamoDB eventual consistency
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
    }, [screenplayId, getToken, queryClient]);
    
    // ========================================================================
    // Get Current State (No Closure Issues)
    // ========================================================================
    
    const getCurrentState = useCallback(() => {
        return {
            beats: beatsRef.current,
            scenes: scenesRef.current,
            characters: charactersRef.current,
            locations: locationsRef.current,
            assets: assetsRef.current
        };
    }, []); // No dependencies - always returns current ref values!
    
    // ========================================================================
    // Phase 2: Check if Entity Appears in Script
    // ========================================================================
    
    /**
     * Check if a character, location, or asset is "in the script".
     * 
     * For characters: Name appears in dialogue (ALL CAPS on standalone line)
     * For locations: Name appears in scene headings (INT./EXT. LOCATION)
     * For assets: Either associated with scenes OR name appears in action lines
     * 
     * Used to determine if an entity is "active" (in script) or "reference-only" (not in script).
     */
    const isEntityInScript = useCallback((scriptContent: string, entityName: string, entityType: 'character' | 'location' | 'asset'): boolean => {
        if (!entityName) {
            return false;
        }
        
        const normalizedName = entityName.toUpperCase().trim();
        if (!normalizedName) {
            return false;
        }
        
        // ====================================================================
        // ASSETS: Check scene associations FIRST (primary method)
        // Assets are typically linked via UI, not by name in script text
        // ====================================================================
        if (entityType === 'asset') {
            // Find the asset by name (case-insensitive)
            const asset = assetsRef.current.find(
                a => a.name.toUpperCase().trim() === normalizedName
            );
            
            if (asset) {
                // Check if any scene has this asset in its props tags
                const hasSceneAssociations = scenesRef.current.some(
                    scene => scene.fountain?.tags?.props?.includes(asset.id)
                );
                
                if (hasSceneAssociations) {
                    return true;
                }
            }
            
            // Fall through to text-based check if no scene associations
            // This handles cases where asset name appears in action lines
            if (scriptContent) {
                const lines = scriptContent.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    const upperLine = line.toUpperCase();
                    
                    if (upperLine.includes(normalizedName)) {
                        // Exclude scene headings and metadata tags
                        if (!line.match(/^(INT|EXT|INT\/EXT|INT\.\/EXT|I\/E)[.\s]/i) && 
                            !line.match(/^@(location|characters?|props):/i)) {
                            // Check if it's an action line (has punctuation, not just caps)
                            const isActionLine = line.length > 0 && 
                                (!line.match(/^[A-Z\s]+$/) || 
                                 line.includes('.') || line.includes(',') || 
                                 line.includes('!') || line.includes('?'));
                            
                            if (isActionLine) {
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        }
        
        // ====================================================================
        // CHARACTERS & LOCATIONS: Text-based checks (require script content)
        // ====================================================================
        if (!scriptContent) {
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
                if (upperLine === normalizedName && line.length > 0) {
                    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
                    
                    // If next line is empty or not a scene heading, this is likely a character name
                    if (!nextLine || nextLine.length === 0 || 
                        (!nextLine.startsWith('INT.') && !nextLine.startsWith('EXT.') && !nextLine.startsWith('INT/EXT.'))) {
                        return true;
                    }
                }
            }
        } else if (entityType === 'location') {
            // Check for location name in scene headings (INT./EXT./INT/EXT. LOCATION NAME)
            const locationPattern = new RegExp(
                `(?:INT|EXT|INT/EXT)\\.\\s+${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$|-)`, 
                'i'
            );
            
            for (const line of lines) {
                if (locationPattern.test(line)) {
                    return true;
                }
            }
        }
        
        return false;
    }, []); // Note: Uses refs (assetsRef, scenesRef) which don't need to be in deps
    
    // ========================================================================
    // Feature 0122: Role-Based Collaboration System - Phase 3B
    // Permission Management Functions
    // ========================================================================
    
    /**
     * Load collaborator permissions for the current user
     * Algorithm: Check if user is owner (set all permissions to true, role to 'director'),
     * else fetch collaborator permissions from API, update state accordingly
     */
    const loadCollaboratorPermissions = useCallback(async (screenplayId: string) => {
        if (!screenplayId || !user?.id) {
            console.log('[ScreenplayContext] ⏭️ Skipping permission load - no screenplayId or user');
            return;
        }
        
        // Prevent multiple simultaneous loads for the same screenplay
        if (permissionsLoadingRef.current === screenplayId) {
            console.log('[ScreenplayContext] ⏭️ Permission load already in progress for:', screenplayId);
            return;
        }
        
        permissionsLoadingRef.current = screenplayId; // Mark as loading
        setPermissionsLoading(true); // Mark as loading
        
        try {
            // First, get the screenplay to check ownership
            const screenplay = await getScreenplay(screenplayId, getToken);
            
            if (!screenplay) {
                console.error('[ScreenplayContext] ⚠️ Screenplay not found for permission check');
                return;
            }
            
            // Check if user is owner
            const userIsOwner = screenplay.user_id === user.id;
            setIsOwner(userIsOwner);
            
            if (userIsOwner) {
                // Owner has all permissions (director role)
                console.log('[ScreenplayContext] ✅ User is owner - granting all permissions (director)');
                setCurrentUserRole('director');
                setCanEditScript(true);
                setCanViewScript(true);
                setCanManageAssets(true);
                setCanManageOwnAssets(true);
                setCanGenerateAssets(true);
                setCanAccessProductionHub(true); // 🔥 FIX: Owner (director) should have Production Hub access
                setCanUploadCreationImages(true); // 🔥 FIX: Owner (director) should have creation image upload access
                setCanUploadAssets(true);
                setCanViewAssets(true);
                setCanUseAI(true);
                setCanEditComposition(true);
                setCanEditTimeline(true);
                setCanViewComposition(true);
                setCanViewTimeline(true);
            } else {
                // Check permissions via API using test-permissions endpoint (returns all permissions at once)
                console.log('[ScreenplayContext] 🔍 User is not owner - checking collaborator permissions');
                
                try {
                    const token = await getToken({ template: 'wryda-backend' });
                    if (!token) {
                        throw new Error('Failed to get authentication token');
                    }
                    
                    console.log('[ScreenplayContext] 🔍 Fetching permissions from API for screenplay:', screenplayId);
                    const response = await fetch(`/api/screenplays/test-permissions/${screenplayId}?t=${Date.now()}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        cache: 'no-store'
                    });
                    
                    console.log('[ScreenplayContext] 📡 Permission API response status:', response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        const perms = data.permissions || {};
                        const role = data.role || null;
                        
                        console.log('[ScreenplayContext] 📋 Received permissions:', {
                            role,
                            canEditScript: perms.canEditScript,
                            canViewScript: perms.canViewScript
                        });
                        
                        // Set role FIRST (before permissions) to prevent button flashing for viewers
                        // This ensures UI updates immediately based on role
                        // Strip "(inferred)" suffix if present (from backend fallback)
                        const cleanRole = role ? role.replace(/\s*\(inferred\)$/i, '') : null;
                        if (cleanRole && ['director', 'writer', 'producer', 'viewer'].includes(cleanRole)) {
                            setCurrentUserRole(cleanRole as 'director' | 'writer' | 'producer' | 'viewer');
                        } else {
                            // Fallback: determine role from permissions (check canEditScript first for speed)
                            if (perms.canEditScript === true) {
                                setCurrentUserRole('writer');
                            } else if (perms.canManageAssets === true || perms.canAccessProductionHub === true) {
                                setCurrentUserRole('producer');
                            } else {
                                setCurrentUserRole('viewer');
                            }
                        }
                        
                        // Then set all permissions
                        setCanViewScript(perms.canViewScript === true);
                        setCanEditScript(perms.canEditScript === true);
                        setCanManageAssets(perms.canManageAssets === true);
                        setCanManageOwnAssets(perms.canManageOwnAssets === true);
                        setCanUseAI(perms.canUseAI === true);
                        setCanUploadAssets(perms.canUploadAssets === true);
                        setCanEditComposition(perms.canEditComposition === true);
                        setCanEditTimeline(perms.canEditTimeline === true);
                        setCanViewComposition(perms.canViewComposition === true);
                        setCanViewTimeline(perms.canViewTimeline === true);
                        
                        // Set permissions from API response
                        setCanGenerateAssets(perms.canGenerateAssets === true);
                        setCanAccessProductionHub(perms.canAccessProductionHub === true);
                        setCanUploadCreationImages(perms.canUploadCreationImages === true);
                        // canViewAssets is derived from other permissions
                        setCanViewAssets(perms.canViewScript === true || perms.canManageAssets === true || perms.canManageOwnAssets === true || perms.canUploadAssets === true);
                        
                        console.log('[ScreenplayContext] ✅ Collaborator permissions loaded:', {
                            role: role || currentUserRole,
                            canEditScript: perms.canEditScript,
                            canManageAssets: perms.canManageAssets
                        });
                    } else {
                        const errorText = await response.text().catch(() => response.statusText);
                        console.error('[ScreenplayContext] ❌ Permission API error:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: errorText
                        });
                        throw new Error(`Failed to fetch permissions: ${response.status} ${response.statusText}`);
                    }
                } catch (permError: any) {
                    console.error('[ScreenplayContext] ⚠️ Error fetching permissions:', {
                        message: permError.message,
                        stack: permError.stack,
                        screenplayId
                    });
                    throw permError;
                }
            }
        } catch (error: any) {
            console.error('[ScreenplayContext] ⚠️ Error loading permissions:', error);
            // On error, default to no permissions
            setCurrentUserRole(null);
            setIsOwner(false);
            setCanEditScript(false);
            setCanViewScript(false);
            setCanManageAssets(false);
            setCanManageOwnAssets(false);
            setCanGenerateAssets(false);
            setCanUploadAssets(false);
            setCanViewAssets(false);
            setCanUseAI(false);
            setCanEditComposition(false);
            setCanEditTimeline(false);
            setCanViewComposition(false);
            setCanViewTimeline(false);
        } finally {
            setPermissionsLoading(false); // Mark as done loading
            permissionsLoadingRef.current = null; // Clear loading ref
        }
    }, [user?.id, getToken]); // Removed currentUserRole from deps to prevent infinite loops
    
    /**
     * Load list of collaborators for the screenplay
     */
    const loadCollaborators = useCallback(async (screenplayId: string) => {
        if (!screenplayId) {
            return;
        }
        
        try {
            const collaboratorList = await listScreenplayCollaborators(screenplayId, getToken);
            setCollaborators(collaboratorList);
            console.log('[ScreenplayContext] ✅ Loaded collaborators:', collaboratorList.length);
        } catch (error: any) {
            console.error('[ScreenplayContext] ⚠️ Error loading collaborators:', error);
            // If user is not owner, they can't view collaborators - this is expected
            if (error.message?.includes('permission')) {
                console.log('[ScreenplayContext] ℹ️ User does not have permission to view collaborators (expected for non-owners)');
            }
        }
    }, [getToken]);
    
    /**
     * Add a collaborator to the screenplay
     */
    const addCollaborator = useCallback(async (email: string, role: 'director' | 'writer' | 'producer' | 'viewer') => {
        if (!screenplayId) {
            throw new Error('No screenplay selected');
        }
        
        try {
            await addScreenplayCollaborator(screenplayId, email, role, getToken);
            toast.success(`Added ${email} as ${role}`);
            // Reload collaborators list
            await loadCollaborators(screenplayId);
        } catch (error: any) {
            console.error('[ScreenplayContext] ⚠️ Error adding collaborator:', error);
            toast.error(error.message || 'Failed to add collaborator');
            throw error;
        }
    }, [screenplayId, getToken, loadCollaborators]);
    
    /**
     * Remove a collaborator from the screenplay
     */
    const removeCollaborator = useCallback(async (identifier: string) => {
        if (!screenplayId) {
            throw new Error('No screenplay selected');
        }
        
        try {
            await removeScreenplayCollaborator(screenplayId, identifier, getToken);
            toast.success('Collaborator removed');
            // Reload collaborators list
            await loadCollaborators(screenplayId);
        } catch (error: any) {
            console.error('[ScreenplayContext] ⚠️ Error removing collaborator:', error);
            toast.error(error.message || 'Failed to remove collaborator');
            throw error;
        }
    }, [screenplayId, getToken, loadCollaborators]);
    
    /**
     * Update a collaborator's role
     */
    const updateCollaboratorRoleFn = useCallback(async (identifier: string, newRole: 'director' | 'writer' | 'producer' | 'viewer') => {
        if (!screenplayId) {
            throw new Error('No screenplay selected');
        }
        
        try {
            await updateCollaboratorRole(screenplayId, identifier, newRole, getToken);
            toast.success(`Updated role to ${newRole}`);
            // Reload collaborators list
            await loadCollaborators(screenplayId);
        } catch (error: any) {
            console.error('[ScreenplayContext] ⚠️ Error updating collaborator role:', error);
            toast.error(error.message || 'Failed to update collaborator role');
            throw error;
        }
    }, [screenplayId, getToken, loadCollaborators]);
    
    /**
     * Get available role presets
     */
    const getAvailableRolesFn = useCallback(async () => {
        if (!screenplayId) {
            return [];
        }
        
        try {
            return await getAvailableRoles(screenplayId, getToken);
        } catch (error: any) {
            console.error('[ScreenplayContext] ⚠️ Error getting available roles:', error);
            return [];
        }
    }, [screenplayId, getToken]);
    
    // Load permissions when screenplayId changes
    useEffect(() => {
        if (screenplayId) {
            // Load permissions first (this will set isOwner asynchronously)
            loadCollaboratorPermissions(screenplayId).then(() => {
                // After permissions load, try to load collaborators
                // This will fail gracefully (403) if user is not owner
                loadCollaborators(screenplayId).catch(() => {
                    // Silently fail - user is not owner or doesn't have permission
                    console.log('[ScreenplayContext] ℹ️ Cannot load collaborators (not owner or no permission)');
                });
            });
        } else {
            // Reset permissions when no screenplay is selected
            setCurrentUserRole(null);
            setIsOwner(false);
            setPermissionsLoading(false);
            setCanEditScript(false);
            setCanViewScript(false);
            setCanManageAssets(false);
            setCanManageOwnAssets(false);
            setCanGenerateAssets(false);
            setCanUploadAssets(false);
            setCanViewAssets(false);
            setCanUseAI(false);
            setCanEditComposition(false);
            setCanEditTimeline(false);
            setCanViewComposition(false);
            setCanViewTimeline(false);
            setCollaborators([]);
            permissionsLoadingRef.current = null; // Clear loading ref when screenplayId changes
        }
    }, [screenplayId, loadCollaboratorPermissions, loadCollaborators]);
    
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
        
        // Assets (Props)
        assets,
        createAsset,
        updateAsset,
        deleteAsset,
        getAssetScenes,
        // Feature 0136: Asset-Scene Association
        linkAssetToScene,
        unlinkAssetFromScene,
        batchUpdatePropAssociations,
        
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
        isEntityInScript,
        
        // Feature 0122: Role-Based Collaboration System - Phase 3B
        // Permission State
        currentUserRole,
        isOwner,
        permissionsLoading,
        canEditScript,
        canViewScript,
        canManageAssets,
        canManageOwnAssets,
        canGenerateAssets,
        canAccessProductionHub,
        canUploadCreationImages,
        canUploadAssets,
        canViewAssets,
        canUseAI,
        canEditComposition,
        canEditTimeline,
        canViewComposition,
        canViewTimeline,
        collaborators,
        
        // Collaboration Management Functions
        loadCollaboratorPermissions,
        loadCollaborators,
        addCollaborator,
        removeCollaborator,
        updateCollaboratorRole: updateCollaboratorRoleFn,
        getAvailableRoles: getAvailableRolesFn
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

