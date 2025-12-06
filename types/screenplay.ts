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
        angle?: string; // For character headshots: 'front' | 'side' | 'three-quarter'
        s3Key?: string; // S3 key for the uploaded file
        source?: string; // Source of image: 'pose-generation' | 'user-upload' | etc.
        outfitName?: string; // Phase 3: Outfit name for pose organization (e.g., 'business-casual', 'default')
        poseId?: string; // Pose definition ID for AI-generated poses (e.g., 'front-facing', 'three-quarter-left')
        poseName?: string; // Name/label for the pose (e.g., 'Front-facing', 'Three-quarter-left')
        creditsUsed?: number; // Credits used for AI generation
        uploadMethod?: string; // Upload method: 'pose-generation' | 'manual' | 'user-upload'
        createdIn?: string; // Where image was created/uploaded: 'creation' | 'production-hub'
    };
}

// ============================================================================
// Story Structure
// ============================================================================

/**
 * Story Beat (Act/Sequence)
 * Feature 0117: Frontend-only template - NOT persisted to DynamoDB
 * Used purely for UI organization. Scenes are grouped by group_label or order.
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
 * Scene within a screenplay
 * Feature 0117: Simplified architecture - scenes use global ordering
 * References characters and locations
 */
export interface Scene {
    id: string;
    number: number;
    heading: string; // "INT. COFFEE SHOP - DAY"
    synopsis: string;
    status: SceneStatus;
    order: number; // Global order in screenplay (1, 2, 3, 4...)
    group_label?: string; // Optional grouping label (e.g., "Act 1", "Setup", "Sequence 1")
    fountain: {
        startLine: number;
        endLine: number;
        tags: {
            location?: string; // Location UUID
            characters: string[]; // Character UUIDs
            props?: string[]; // Prop UUIDs
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
    
    // Physical Attributes (Optional - for pose package generation and AI consistency)
    physicalAttributes?: {
        height?: 'short' | 'average' | 'tall';
        weight?: string; // "slim", "athletic", "muscular", "heavyset", "average"
        eyeColor?: string; // "blue", "brown", "green", "hazel", "gray"
        bodyType?: 'slim' | 'athletic' | 'muscular' | 'heavyset' | 'average';
        hairColor?: string; // "blonde", "brunette", "brown", "black", "red", "gray", "bald"
        hairLength?: 'bald' | 'very-short' | 'short' | 'medium' | 'long';
        hairStyle?: string; // "curly", "straight", "wavy", "braided", "ponytail"
        typicalClothing?: string; // Default outfit description (e.g., 'business casual', 'military uniform')
    };
    
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
    angleVariations?: Array<{ // NEW: Angle variations stored directly (like assets)
        id: string;
        imageUrl?: string;
        s3Key: string;
        angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail';
        timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
        weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
        season?: 'spring' | 'summer' | 'fall' | 'winter';
        generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
        creditsUsed: number;
        createdAt: string;
    }>;
    locationBankProfile?: { // DEPRECATED: Keep for backward compat
        baseReferenceS3Key?: string;
        angleVariations?: Array<{
            s3Key: string;
            angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail';
            timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
            weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
            season?: 'spring' | 'summer' | 'fall' | 'winter';
            generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
            creditsUsed: number;
            createdAt: string;
        }>;
        totalCreditsSpent?: number;
        consistencyRating?: number;
        createdAt: string;
        updatedAt: string;
    };
    githubIssueNumber?: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Props Registry
// ============================================================================

/**
 * Prop entity
 * Stored in: /structure/props.json
 */
export interface Prop {
    id: string;
    name: string;
    category?: 'weapon' | 'vehicle' | 'item' | 'costume' | 'tech' | 'furniture' | 'food' | 'other';
    description?: string;
    productionNotes?: string;
    storageLocation?: string;
    images?: ImageAsset[]; // Reference photos
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
    beats: {
        [beatId: string]: any; // Placeholder for beat relationships
    };
    scenes: {
        [sceneId: string]: SceneRelationships;
    };
    characters: {
        [characterId: string]: CharacterRelationships;
    };
    locations: {
        [locationId: string]: LocationRelationships;
    };
    props: {
        [propId: string]: PropRelationships;
    };
}

/**
 * Scene's relationships to other entities
 */
export interface SceneRelationships {
    type: 'scene';
    characters: string[]; // Character IDs
    location?: string; // Location ID
    props?: string[]; // Prop IDs
    storyBeat?: string; // Story beat ID (optional - beats removed, kept for backward compatibility)
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

/**
 * Prop's relationships to scenes
 */
export interface PropRelationships {
    type: 'prop';
    usedInScenes: string[]; // Scene IDs
}

// ============================================================================
// GitHub Storage Files
// ============================================================================

/**
 * Structure file types stored in GitHub
 */
export type StructureFileType = 'beats' | 'characters' | 'locations' | 'props' | 'relationships';

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
 * Props JSON file structure
 */
export interface PropsFile {
    version: string;
    lastUpdated: string;
    props: Prop[];
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

// ============================================================================
// Screenplay Types (for ScreenplayService)
// ============================================================================

export interface Screenplay {
    id: string;
    screenplayId?: string; // Alternative ID field
    userId: string;
    title: string;
    description?: string;
    content: string;
    beats?: StoryBeat[];
    characters?: Character[];
    locations?: Location[];
    metadata?: {
        genre?: string;
        logline?: string;
        pageCount?: number;
        tags?: string[];
        wordCount?: number;
        sceneCount?: number;
        characterCount?: number;
        version?: number;
    };
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

export type CreateScreenplayInput = Omit<Screenplay, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateScreenplayInput = Partial<Omit<Screenplay, 'id' | 'createdAt'>> & { id: string };

export interface ScreenplayListItem {
    id: string;
    title: string;
    isActive?: boolean;
    updatedAt: string;
}

export interface ScreenplaySummary {
    id: string;
    title: string;
    beatCount: number;
    characterCount: number;
    locationCount: number;
    totalCount?: number;
    activeCount?: number;
    limit?: number;
    screenplays?: ScreenplayListItem[];
    updatedAt: string;
}

