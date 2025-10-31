/**
 * Production Pipeline Types
 * 
 * Defines the composition-first video generation workflow with character consistency.
 * This is the foundation for the revolutionary production system.
 */

import { StoryBeat } from './screenplay';

// ============================================================================
// Character Bank & References
// ============================================================================

/**
 * Character Bank - Container for all project characters
 */
export interface CharacterBank {
  id: string;
  projectId: string;
  characters: CharacterProfile[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Character Profile - Complete character with reference library
 * This enables perfect character consistency across all video generations
 */
export interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  type: 'lead' | 'supporting' | 'minor';
  
  // Primary Reference - The base character image
  baseReference: CharacterReference;
  
  // Auto-generated reference library for different angles and expressions
  angleReferences: CharacterReference[]; // front, side, 3/4, back
  expressionReferences: CharacterReference[]; // neutral, happy, sad, angry
  actionReferences: CharacterReference[]; // walking, sitting, running
  
  // Visual style metadata
  style: 'photorealistic' | 'animated' | 'stylized' | 'illustration';
  age?: string;
  ethnicity?: string;
  customTags: string[];
  
  // Usage tracking
  appearanceCount: number; // How many beats use this character
  totalCreditsSpent: number; // Total credits spent on this character
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Character Reference - A single reference image with metadata
 */
export interface CharacterReference {
  id: string;
  imageUrl: string; // CloudFront/S3 URL
  s3Key: string; // S3 storage key
  thumbnailUrl?: string; // Optimized thumbnail for UI
  
  // Reference classification
  referenceType: 'base' | 'angle' | 'expression' | 'action' | 'custom';
  label: string; // Human-readable: "Front View", "Happy Expression", etc.
  
  // How this reference was created
  generationMethod: 'upload' | 'nano-banana' | 'photon-1' | 'photon-flash' | 'imagen-3' | 'dall-e-3' | 'stability-ai' | 'replicate';
  prompt?: string; // Original generation prompt if AI-generated
  
  // Cost tracking
  creditsUsed: number;
  
  // Metadata for smart selection
  tags?: string[]; // ["front-facing", "neutral", "medium-shot"]
  quality?: 'draft' | 'standard' | 'high' | 'premium';
  
  createdAt: string;
}

/**
 * Character Reference Request - For generating new references
 */
export interface CharacterReferenceRequest {
  characterId: string;
  referenceType: 'angle' | 'expression' | 'action' | 'custom';
  label: string;
  generationMethod: 'upload' | 'generate';
  
  // If uploading
  imageFile?: File;
  imageData?: string; // base64 data URL
  
  // If generating
  prompt?: string;
  model?: string;
  baseImageUrl?: string; // For image-to-image generation
}

// ============================================================================
// Composition Templates & Planning
// ============================================================================

/**
 * Composition Template - Pre-defined layout patterns
 */
export interface CompositionTemplate {
  id: string;
  name: string;
  category: 'dialogue' | 'action' | 'montage' | 'establishing' | 'transition' | 'custom';
  
  // Visual layout specification
  layout: CompositionLayout;
  
  // Smart suggestions for this template
  suggestedCameraAngles: CameraAngle[];
  suggestedCharacterViews: ReferenceViewType[];
  suggestedDuration: number; // Seconds per clip
  
  // Template metadata
  description: string;
  previewImageUrl?: string;
  usageCount: number; // How many times used
  
  // Tags for filtering
  tags: string[];
  isPremium: boolean; // Some templates only for Pro/Ultra users
}

/**
 * Composition Layout - Technical layout specification
 */
export interface CompositionLayout {
  type: '1-up' | '2-up-h' | '2-up-v' | '3-up' | '4-up' | 'pip' | 'grid' | 'custom';
  clipCount: number; // How many video clips needed
  
  // Position definitions for each clip
  positions?: ClipPosition[];
  
  // Default dimensions (can be overridden)
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  resolution: '720p' | '1080p' | '4K';
}

/**
 * Clip Position - Where a clip appears in the composition
 */
export interface ClipPosition {
  clipIndex: number; // 0, 1, 2, etc.
  x: number; // Percentage of canvas width (0-100)
  y: number; // Percentage of canvas height (0-100)
  width: number; // Percentage of canvas width (0-100)
  height: number; // Percentage of canvas height (0-100)
  zIndex: number; // Layering
}

/**
 * Camera Angle Types
 */
export type CameraAngle = 
  | 'extreme-wide'
  | 'wide-shot'
  | 'medium-shot'
  | 'medium-close-up'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-shoulder'
  | 'dutch-angle';

/**
 * Reference View Types
 */
export type ReferenceViewType = 
  | 'front'
  | 'profile-left'
  | 'profile-right'
  | 'three-quarter-left'
  | 'three-quarter-right'
  | 'back'
  | 'top-down'
  | 'low-angle';

// ============================================================================
// Beat Production & Generation
// ============================================================================

/**
 * Story Beat Production - Complete production data for one story beat
 * This is the core unit of the composition-first workflow
 */
export interface StoryBeatProduction {
  id: string;
  beatId: string;
  beat: StoryBeat; // From screenplay.ts
  
  // Composition Planning (NEW - plan BEFORE generating)
  compositionPlan: CompositionPlan;
  
  // Generated clips
  clips: GeneratedClip[];
  
  // Production status
  status: 'planning' | 'generating' | 'ready' | 'in-timeline' | 'completed';
  progress: number; // 0-100 percentage
  
  // Cost tracking
  estimatedCredits: number;
  actualCreditsUsed: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Composition Plan - The plan for how to generate clips for a beat
 * This is created BEFORE any video generation happens
 */
export interface CompositionPlan {
  template: CompositionTemplate;
  
  // Character assignments for each clip in the composition
  characterAssignments: CharacterAssignment[];
  
  // Generation settings
  settings: GenerationSettings;
  
  // Cost estimates (calculated before generation)
  estimatedCredits: number;
  estimatedDuration: number; // Total video duration in seconds
  estimatedGenerationTime: string; // "2-3 minutes"
  
  // AI suggestions (auto-filled, user can override)
  aiSuggestions?: {
    reasoning: string; // "This beat has 2 characters with high dialogue..."
    confidence: number; // 0-100
    alternatives?: CompositionTemplate[]; // Other template suggestions
  };
}

/**
 * Character Assignment - Which character appears in which clip
 */
export interface CharacterAssignment {
  clipIndex: number; // Position in composition (0, 1, 2, etc.)
  characterId: string; // From CharacterBank
  characterName: string; // For display
  
  // Which reference to use
  preferredReference: string; // CharacterReference.id
  referenceLabel: string; // "Front View", "Happy Expression"
  referenceImageUrl: string; // For preview
  
  // Camera setup for this clip
  cameraAngle: CameraAngle;
  framing: 'tight' | 'standard' | 'loose';
  
  // Scene context
  action?: string; // "Sitting at desk", "Walking toward camera"
  emotion?: string; // "Confident", "Nervous"
}

/**
 * Generation Settings - Technical settings for video generation
 */
export interface GenerationSettings {
  // Video specifications
  duration: number; // Seconds per clip (3, 5, 8, 10)
  resolution: '720p' | '1080p' | '4K';
  aspectRatio: '16:9' | '9:16' | '1:1';
  
  // AI Provider
  provider: 'veo-3.1' | 'veo-3.1-fast' | 'luma' | 'luma-flash' | 'runway-gen3' | 'runway-gen3-turbo';
  
  // Quality settings
  useFastMode: boolean;
  useVideoChaining: boolean; // Link clips for continuity
  
  // Style preferences
  stylePrompt?: string; // "cinematic lighting", "natural daylight", etc.
  mood?: string; // "tense", "lighthearted", "dramatic"
}

/**
 * Generated Clip - A single generated video clip
 */
export interface GeneratedClip {
  id: string;
  beatProductionId: string;
  sceneId: string;
  
  // Position in composition
  clipIndex: number; // 0, 1, 2, etc.
  
  // Character association (optional - some clips may not have characters)
  characterId?: string;
  characterReferenceUsed?: string; // Which CharacterReference was used
  
  // Video file
  videoUrl: string; // CloudFront/S3 URL
  s3Key: string; // S3 storage key
  thumbnailUrl?: string; // Video thumbnail
  
  // Video specifications
  duration: number; // Actual duration in seconds
  resolution: string;
  fileSize: number; // Bytes
  format: string; // "mp4", "webm"
  
  // Generation details
  prompt: string; // Full prompt sent to AI
  provider: string; // Which AI model was used
  creditsUsed: number;
  generatedAt: string;
  generationTime: number; // Seconds to generate
  
  // Quality management
  needsRegeneration: boolean; // User flagged for redo
  userRating?: 1 | 2 | 3 | 4 | 5; // User satisfaction rating
  failureReason?: string; // If generation failed
  
  // Metadata
  metadata?: {
    modelVersion?: string;
    seed?: number;
    temperature?: number;
    [key: string]: any; // Extensible for provider-specific data
  };
}

// ============================================================================
// Generation Requests & Responses
// ============================================================================

/**
 * Beat Generation Request - Request to generate all clips for a beat
 */
export interface BeatGenerationRequest {
  beatId: string;
  compositionPlan: CompositionPlan;
  
  // Options
  options?: {
    generateInBackground?: boolean; // Queue for batch processing
    priority?: 'low' | 'normal' | 'high';
    notifyOnComplete?: boolean; // Send notification when done
  };
}

/**
 * Beat Generation Response - Response from generation request
 */
export interface BeatGenerationResponse {
  beatProductionId: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  clips: GeneratedClip[];
  
  // Progress tracking
  totalClips: number;
  completedClips: number;
  failedClips: number;
  
  // Cost summary
  creditsUsed: number;
  estimatedTimeRemaining?: string; // "2 minutes"
  
  // Error handling
  errors?: GenerationError[];
}

/**
 * Generation Error - Error during clip generation
 */
export interface GenerationError {
  clipIndex: number;
  errorType: 'credit_insufficient' | 'api_error' | 'timeout' | 'invalid_reference' | 'unknown';
  message: string;
  retryable: boolean;
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

/**
 * Production Statistics - Usage and cost tracking
 */
export interface ProductionStatistics {
  projectId: string;
  
  // Character usage
  totalCharacters: number;
  charactersWithReferences: number;
  totalReferences: number;
  
  // Beat production
  totalBeats: number;
  beatsInProduction: number;
  beatsCompleted: number;
  
  // Clip generation
  totalClipsGenerated: number;
  successRate: number; // Percentage
  averageGenerationTime: number; // Seconds
  
  // Cost tracking
  totalCreditsSpent: number;
  characterSetupCredits: number;
  videoGenerationCredits: number;
  
  // Efficiency metrics
  clipsPerBeat: number; // Average
  creditsPerClip: number; // Average
  regenerationRate: number; // Percentage of clips that needed regen
  
  // Timeline
  firstGeneratedAt?: string;
  lastGeneratedAt?: string;
}

// ============================================================================
// UI State Management
// ============================================================================

/**
 * Production UI State - Manages UI state for production workflow
 */
export interface ProductionUIState {
  // Current selections
  selectedBeatId?: string;
  selectedCharacterId?: string;
  selectedClipId?: string;
  
  // Active modals/panels
  showCharacterBankModal: boolean;
  showTemplateLibrary: boolean;
  showGenerationProgress: boolean;
  
  // Filters and views
  filterByCharacter?: string;
  filterByStatus?: StoryBeatProduction['status'];
  viewMode: 'grid' | 'list' | 'timeline';
  
  // Generation queue
  generationQueue: BeatGenerationRequest[];
  activeGenerations: string[]; // Beat IDs currently generating
}

/**
 * Character Selection State - For character assignment UI
 */
export interface CharacterSelectionState {
  clipIndex: number;
  availableCharacters: CharacterProfile[];
  selectedCharacterId?: string;
  selectedReferenceId?: string;
  previewMode: boolean;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Reference Gallery Item - For UI display
 */
export interface ReferenceGalleryItem {
  reference: CharacterReference;
  isSelected: boolean;
  isRecommended: boolean;
  usageCount: number;
}

/**
 * Template Preview - For template library UI
 */
export interface TemplatePreview {
  template: CompositionTemplate;
  estimatedCost: number;
  estimatedTime: string;
  isAvailable: boolean; // Based on user plan
  popularityRank: number;
}

/**
 * Generation Progress - Real-time generation tracking
 */
export interface GenerationProgress {
  beatProductionId: string;
  totalClips: number;
  completedClips: number;
  currentClipIndex: number;
  currentClipStatus: 'queued' | 'generating' | 'uploading' | 'complete' | 'failed';
  elapsedTime: number; // Seconds
  estimatedTimeRemaining: number; // Seconds
  creditsUsedSoFar: number;
}

// ============================================================================
// Feature 0030: Intelligent Clip Classification & Hybrid Workflow
// ============================================================================

/**
 * Physical Attributes - Extracted from character images for consistency
 */
export interface PhysicalAttributes {
  // Skin & Complexion
  skinTone: string; // "light ivory", "tan", "deep brown", etc.
  skinTexture?: string; // "smooth", "freckled", "weathered"
  
  // Body Type & Build
  bodyType: string; // "slim", "athletic", "muscular", "heavyset", "average"
  height?: 'short' | 'average' | 'tall';
  build?: 'petite' | 'average' | 'broad' | 'stocky';
  
  // Hair
  hairColor: string; // "blonde", "brunette", "red", "black", "gray", "bald"
  hairStyle: string; // "short", "shoulder-length", "long", "curly", "straight", "wavy"
  hairLength?: 'bald' | 'very-short' | 'short' | 'medium' | 'long';
  
  // Facial Features (if visible)
  faceShape?: 'oval' | 'round' | 'square' | 'heart' | 'oblong';
  eyeColor?: string; // "blue", "brown", "green", "hazel"
  
  // Distinguishing Features
  distinctiveFeatures?: string[]; // ["beard", "glasses", "tattoos", "scar on left cheek"]
  
  // Confidence score
  extractionConfidence: number; // 0-100
  extractedAt: string; // ISO 8601
}

/**
 * Clip Visibility - Classification of character visibility in a clip
 */
export type ClipVisibility = 
  | 'face-visible'      // Full face visible - REQUIRES character reference
  | 'face-obscured'     // Face partially hidden (helmet, shadow) - Use physical attributes
  | 'body-only'         // Only body visible (back, distance) - Use physical attributes only
  | 'hands-close-up'    // Only hands/feet - Use skin tone + context
  | 'no-character'      // No human character - B-roll, environment
  | 'vfx-action'        // Pure VFX with no humans - explosions, space, etc.
  | 'uploaded-footage'; // User uploaded real video

/**
 * Clip Generation Requirement - Per-clip specifications for templates
 */
export interface ClipGenerationRequirement {
  clipIndex: number;
  description: string; // "Character running away", "Explosion VFX", etc.
  
  // Upload vs AI
  allowUpload: boolean; // Can user upload video for this clip?
  requiresCharacterRef: boolean; // Does this clip need a character reference image?
  
  // Visibility classification
  suggestedVisibility: ClipVisibility;
  
  // Cost optimization hints
  canUseCheaperModel?: boolean; // If true, can use lower cost options
  estimatedCreditSavings?: number; // Percentage savings vs premium generation
}

/**
 * AI Enhancement Options - For uploaded video clips
 */
export interface AIEnhancementOptions {
  // Video modification options
  modifyType?: 'restyle' | 'add-vfx' | 'change-environment' | 'add-elements';
  modifyPrompt?: string; // "Add dramatic storm clouds", "Make it look like a cyberpunk city"
  modifyStrength?: number; // 0-100
  
  // Aspect ratio adjustment
  reframeToAspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  
  // Style transformation options
  styleTransform?: boolean;
  transformPrompt?: string; // "Transform into animation style"
  preserveMotion?: boolean; // Keep original motion
  
  // General
  enhancementCredits?: number; // Estimated credits for enhancement
}

/**
 * Extended CompositionTemplate with Feature 0030 additions
 */
export interface CompositionTemplateExtended extends CompositionTemplate {
  // Per-clip requirements (NEW)
  clipRequirements?: ClipGenerationRequirement[];
  
  // Cost optimization metadata (NEW)
  optimization?: {
    canUseCheaperModels: boolean;
    estimatedSavings: number; // Percentage (0-100)
    hybridFriendly: boolean; // Supports upload workflow
  };
}

/**
 * Extended CharacterProfile with Physical Attributes
 */
export interface CharacterProfileExtended extends CharacterProfile {
  // Physical attributes extracted from base reference (NEW)
  physicalAttributes?: PhysicalAttributes;
  
  // Auto-extracted attributes from all references (NEW)
  autoExtractedAttributes?: {
    dominantSkinTone?: string;
    dominantHairColor?: string;
    dominantBodyType?: string;
    extractedFromReferences: string[]; // Reference IDs used for extraction
    lastExtractedAt?: string;
  };
}

/**
 * Uploaded Clip - User-uploaded video footage
 */
export interface UploadedClip {
  id: string;
  beatProductionId: string;
  clipIndex: number; // Position in composition
  
  // Original upload
  originalVideoUrl: string; // Temporary S3 URL
  originalS3Key: string;
  originalDuration: number; // Seconds
  originalResolution: string;
  originalAspectRatio: string;
  originalFileSize: number; // Bytes
  
  // Cloud storage (permanent)
  cloudProvider: 'google-drive' | 'dropbox' | 's3-permanent';
  cloudFileId?: string; // Google Drive/Dropbox file ID
  cloudPath?: string; // Path in user's cloud storage
  
  // AI Enhancement (optional)
  isEnhanced: boolean;
  enhancementType?: AIEnhancementOptions['modifyType'];
  enhancedVideoUrl?: string; // Enhanced version URL
  enhancedS3Key?: string;
  enhancementCreditsUsed?: number;
  
  // Metadata
  uploadedAt: string;
  uploadedBy: string; // User ID
  description?: string; // User-provided description
}

// ============================================================================
// All types are exported inline above - no need for re-export block
// ============================================================================

