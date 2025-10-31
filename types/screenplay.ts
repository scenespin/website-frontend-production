/**
 * TypeScript type definitions for GitHub Screenplay Structure
 * Based on: GitHub Screenplay Storage Structure.md
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Card types used throughout the structure system
 */
export type CardType = 'story_beat' | 'scene' | 'character' | 'location';

/**
 * Character protagonist level
 */
export type CharacterType = 'lead' | 'supporting' | 'minor';

/**
 * Character arc status
 */
export type ArcStatus = 'introduced' | 'developing' | 'resolved';

/**
 * Location type (interior/exterior)
 */
export type LocationType = 'INT' | 'EXT' | 'INT/EXT';

/**
 * Scene status in writing process
 */
export type SceneStatus = 'draft' | 'review' | 'final';

// ============================================================================
// Image Assets
// ============================================================================

/**
 * Image asset metadata for screenplay entities
 */
export interface ImageAsset {
    imageUrl: string; // URL or base64 data URL
    createdAt: string; // ISO 8601
    metadata?: {
        prompt?: string; // Original generation prompt
        modelUsed?: string; // AI model ID used (e.g., "nano-banana")
        isEdited?: boolean; // True if this is an edited version
        originalImageUrl?: string; // If edited, reference to original
    };
}

// ============================================================================
// Story Structure
// ============================================================================

/**
 * Story Beat (Act/Sequence)
 * Stored in: /structure/beats.json
 */
export interface StoryBeat {
    id: string;
    title: string;
    description: string;
    order: number;
    scenes: Scene[];
    images?: ImageAsset[]; // Associated images (concept art, mood boards)
    
    // Production integration (NEW - for composition-first workflow)
    production?: {
        compositionTemplateId?: string; // ID of chosen CompositionTemplate
        characterAssignments?: string[]; // Character IDs used in this beat
        clipCount?: number; // How many clips planned
        status: 'not-started' | 'planning' | 'generating' | 'ready' | 'in-timeline';
        clipIds?: string[]; // IDs of GeneratedClip objects
        creditsUsed?: number; // Total credits spent on this beat
        lastGeneratedAt?: string; // ISO 8601
    };
    
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}

/**
 * Scene within a story beat
 * References characters and locations
 */
export interface Scene {
    id: string;
    number: number;
    heading: string; // "INT. COFFEE SHOP - DAY"
    synopsis: string;
    beatId: string; // Parent story beat
    status: SceneStatus;
    order: number; // Order within beat
    fountain: {
        startLine: number;
        endLine: number;
        tags: {
            location?: string; // Location UUID
            characters: string[]; // Character UUIDs
        };
    };
    estimatedPageCount?: number;
    images?: ImageAsset[]; // Associated images (storyboards, reference photos)
    videoAssets?: {
        promptsJson?: string; // S3 URL to JSON file containing ScenePrompt[]
        videos?: {
            videoUrl: string; // CloudFront URL to generated video
            s3Key: string; // S3 storage key
            veo3ModelUsed: string; // Veo 3 model variant
            segmentDuration: number; // Seconds per segment (3, 5, 10, 30, or 60)
            totalDuration: number; // Total video duration in seconds
            creditsUsed: number; // Credits deducted for generation
            generatedAt: string; // ISO timestamp
        }[];
    };
    // Timeline positioning (in minutes from screenplay start)
    timing?: {
        startMinute: number; // When scene starts in timeline
        durationMinutes: number; // How long scene lasts
        pageNumber?: number; // Calculated from timing (1 page ≈ 1 minute)
    };
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Character Registry
// ============================================================================

/**
 * Character entity
 * Stored in: /structure/characters.json
 */
export interface Character {
    id: string;
    name: string;
    type: CharacterType;
    description?: string;
    age?: string;
    arcNotes?: string;
    costumeDetails?: string;
    firstAppearance?: string; // Scene ID
    arcStatus: ArcStatus;
    customFields: CharacterCustomField[];
    images?: ImageAsset[]; // Associated images (portraits, costumes, references)
    
    // Character consistency integration (NEW - links to production CharacterBank)
    referenceLibrary?: {
        bankId: string; // References CharacterBank in production system
        profileId: string; // References CharacterProfile
        hasReferences: boolean; // Quick check if references exist
        referenceCount: number; // Number of reference images available
    };
    
    githubIssueNumber?: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Custom field for character metadata
 */
export interface CharacterCustomField {
    id: string;
    name: string;
    value: string;
}

// ============================================================================
// Location Registry
// ============================================================================

/**
 * Location entity
 * Stored in: /structure/locations.json
 */
export interface Location {
    id: string;
    name: string;
    type: LocationType;
    description?: string;
    address?: string;
    timePeriod?: string;
    atmosphereNotes?: string;
    setRequirements?: string;
    productionNotes?: string;
    images?: ImageAsset[]; // Associated images (location photos, set designs)
    githubIssueNumber?: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Relationship Tracking (Bidirectional)
// ============================================================================

/**
 * Bidirectional relationships between all entities
 * Stored in: /structure/relationships.json
 */
export interface Relationships {
    scenes: {
        [sceneId: string]: SceneRelationships;
    };
    characters: {
        [characterId: string]: CharacterRelationships;
    };
    locations: {
        [locationId: string]: LocationRelationships;
    };
}

/**
 * Scene's relationships to other entities
 */
export interface SceneRelationships {
    type: 'scene';
    characters: string[]; // Character IDs
    location?: string; // Location ID
    storyBeat: string; // Story beat ID
}

/**
 * Character's relationships to scenes and beats
 */
export interface CharacterRelationships {
    type: 'character';
    appearsInScenes: string[]; // Scene IDs
    relatedBeats: string[]; // Story beat IDs
}

/**
 * Location's relationships to scenes
 */
export interface LocationRelationships {
    type: 'location';
    scenes: string[]; // Scene IDs
}

// ============================================================================
// GitHub Storage Files
// ============================================================================

/**
 * Structure file types stored in GitHub
 */
export type StructureFileType = 'beats' | 'characters' | 'locations' | 'relationships';

/**
 * Beats JSON file structure
 */
export interface BeatsFile {
    version: string;
    lastUpdated: string;
    beats: StoryBeat[];
}

/**
 * Characters JSON file structure
 */
export interface CharactersFile {
    version: string;
    lastUpdated: string;
    characters: Character[];
}

/**
 * Locations JSON file structure
 */
export interface LocationsFile {
    version: string;
    lastUpdated: string;
    locations: Location[];
}

/**
 * Relationships JSON file structure
 */
export interface RelationshipsFile {
    version: string;
    lastUpdated: string;
    relationships: Relationships;
}

// ============================================================================
// GitHub Issues Integration
// ============================================================================

/**
 * GitHub Issue custom fields for characters
 */
export interface CharacterIssueFields {
    entity_type: 'character';
    protagonist_level: CharacterType;
    first_appearance?: string; // Scene ID or heading
    arc_status: ArcStatus;
}

/**
 * GitHub Issue custom fields for locations
 */
export interface LocationIssueFields {
    entity_type: 'location';
    location_type: LocationType;
    scene_count: number;
    production_notes?: string;
}

// ============================================================================
// Dependency Checking
// ============================================================================

/**
 * Character dependencies (used before deletion)
 */
export interface CharacterDependencies {
    scenes: Scene[];
    beats: StoryBeat[];
    totalAppearances: number;
}

/**
 * Location dependencies (used before deletion)
 */
export interface LocationDependencies {
    scenes: Scene[];
    totalUsages: number;
}

// ============================================================================
// Deletion Operations
// ============================================================================

/**
 * Cascade options for entity deletion
 */
export type CascadeOption = 'remove' | 'cancel';

/**
 * Deletion result with details
 */
export interface DeletionResult {
    success: boolean;
    entityId: string;
    entityType: 'character' | 'location' | 'scene' | 'beat';
    removedReferences: number;
    githubCommitSha?: string;
    error?: string;
}

// ============================================================================
// Continuity & Reports
// ============================================================================

/**
 * Character appearance in scene (for timeline)
 */
export interface CharacterAppearance {
    characterId: string;
    characterName: string;
    sceneId: string;
    sceneNumber: number;
    beatId: string;
    beatTitle: string;
}

/**
 * Location usage in scene (for shooting schedule)
 */
export interface LocationUsage {
    locationId: string;
    locationName: string;
    locationType: LocationType;
    sceneId: string;
    sceneNumber: number;
    sceneHeading: string;
}

/**
 * Continuity warning/inconsistency
 */
export interface ContinuityWarning {
    type: 'age_inconsistency' | 'missing_character' | 'timeline_gap' | 'other';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedEntities: {
        type: 'character' | 'location' | 'scene';
        id: string;
        name: string;
    }[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic create input (omits id and timestamps)
 */
export type CreateInput<T extends { id: string; createdAt: string; updatedAt: string }> = Omit<
    T,
    'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Generic update input (partial with id required)
 */
export type UpdateInput<T extends { id: string }> = Partial<Omit<T, 'id' | 'createdAt'>> & {
    id: string;
};

