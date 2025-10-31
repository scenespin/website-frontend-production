/**
 * Shared types and interfaces for the UnifiedChatPanel and its modes
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Available agent modes in the chat panel
 */
export type AgentMode = 'chat' | 'director' | 'image' | 'scene-visualizer' | 'quick-video' | 'dialogue';

/**
 * Chat message structure
 */
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    mode?: AgentMode;
}

/**
 * Mode configuration for UI display
 */
export interface ModeConfig {
    id: AgentMode;
    name: string;
    shortName: string;
    color: string;
    icon: string;
    description: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Scene context extracted from screenplay
 */
export interface SceneContext {
    sceneHeading: string | null;
    characters: string[];
    storyBeats: string[];
    surroundingText?: {
        before: string;
        after: string;
    } | null;
}

/**
 * Entity context for character/location workflows
 */
export interface EntityContext {
    type: string;
    id: string;
    name: string;
    workflow?: string;
}

/**
 * Auto-extracted context from cursor position
 */
export interface AutoContext {
    sceneHeading: string | null;
    characters: string[];
    storyBeats: string[];
}

// ============================================================================
// STATE INTERFACES
// ============================================================================

/**
 * Core chat state shared across all modes
 */
export interface ChatState {
    messages: Message[];
    activeMode: AgentMode;
    input: string;
    isStreaming: boolean;
    streamingText: string;
    selectedModel: string;
    attachedFiles: File[];
    contextEnabled: boolean;
}

/**
 * Context state for rewrite workflow and scene awareness
 */
export interface ContextState {
    selectedTextContext: string | null;
    selectionRange: { start: number; end: number } | null;
    sceneContext: SceneContext | null;
    autoContext: AutoContext | null;
    wasInRewriteMode: boolean;
}

/**
 * Image generation state
 */
export interface ImageGenerationState {
    // Generated images
    generatedImageUrl: string | null;
    generatedImagePrompt: string;
    generatedImageModel: string;
    generatedImageS3Key: string | null;
    
    // Uploaded images
    uploadedImageUrl: string | null;
    uploadedImageS3Key: string | null;
    
    // Edited images
    editedImageUrl: string | null;
    lastEditPrompt: string;
    isEditingImage: boolean;
    imageToEdit: string | null;
    
    // Settings
    activeImageModel: string | null;
    imageSize: string;
    
    // UI state
    showImageSourceDialog: boolean;
    showImageAssociationDialog: boolean;
    showImageActionDialog: boolean;
    showImageEditedActionDialog: boolean;
    showCameraModal: boolean;
    
    // Entity context
    entityContextBanner: EntityContext | null;
}

/**
 * Video generation state
 */
export interface VideoGenerationState {
    // Quick video settings
    quickVideoProvider: 'veo-3.1' | 'veo-3.0' | 'veo-2' | 'luma-ray-2' | 'luma-ray-flash-2';
    quickVideoResolution: '540p' | '720p' | '1080p' | '4k' | '8k';
    quickVideoAspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | '1:1';
    quickVideoDuration: '4s' | '5s' | '6s' | '8s';
    quickVideoMode: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images';
    
    // Images for video
    quickVideoStartImage: File | null;
    quickVideoEndImage: File | null;
    quickVideoReferenceImages: (File | null)[];
    
    // Provider A-specific (standard tier)
    quickVideoConcepts: string[];
    quickVideoCameraMotion: string;
    
    // Video options
    quickVideoEnableSound: boolean;
    quickVideoEnableLoop: boolean;
    
    // Generation state
    isGeneratingQuickVideo: boolean;
    quickVideoKey: number; // For forcing remount
    
    // Generated video
    generatedVideoUrl: string | null;
    generatedVideoMetadata: {
        provider: string;
        resolution: string;
        aspectRatio: string;
        duration: string;
        creditsUsed: number;
        s3Key: string;
    } | null;
    
    // UI state
    showQuickVideoCard: boolean;
    showVideoActionDialog: boolean;
}

/**
 * Scene visualizer state
 */
export interface SceneVisualizerState {
    sceneVisualizerPrompts: ScenePrompt[];
    isGeneratingPrompts: boolean;
    isGeneratingVideos: boolean;
    generatingSegments: Set<number>;
    segmentDuration: 3 | 5 | 10 | 30 | 60;
}

/**
 * Dialogue mode state
 */
export interface DialogueContext {
    sceneHeading: string;
    act: number;
    characters: any[];
    conflict: string;
    tone: string;
}

/**
 * Workflow completion data structure
 */
export interface WorkflowCompletionData {
    type: 'character' | 'location' | 'scene';
    parsedData: any;
    aiResponse: string;
}

/**
 * AI workflow state for character/location/scene interviews
 */
export interface WorkflowState {
    activeWorkflow: {
        type: 'character' | 'location' | 'scene';
        questionIndex: number;
    } | null;
    inputPlaceholder: string;
    workflowCompletionData: WorkflowCompletionData | null;
}

/**
 * Post-generation dialog state
 */
export interface PostGenerationItem {
    url: string;
    type: 'image' | 'video';
    name: string;
    s3Key?: string;
    metadata?: any;
}

/**
 * Storage modal data
 */
export interface StorageModalData {
    assetType: 'image' | 'video' | 'composition';
    assetName: string;
    s3TempUrl: string;
    s3Key: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// PROPS INTERFACES
// ============================================================================

/**
 * Props for UnifiedChatPanel (main component)
 */
export interface UnifiedChatPanelProps {
    onInsert?: (text: string) => void;
    externalImageModelTrigger?: string | null;
    onImageModelActivated?: () => void;
    selectedTextContext?: string | null;
    initialPrompt?: string | null;
    initialMode?: AgentMode;
    imageEntityContext?: EntityContext | null;
    onClearContext?: () => void;
    sceneContext?: SceneContext | null;
    editorContent?: string;
    cursorPosition?: number;
    onWorkflowComplete?: (type: 'character' | 'location' | 'scene', parsedData: any) => void;
}

/**
 * Common props for mode panels
 */
export interface ModePanelProps {
    onInsert?: (text: string) => void;
    editorContent?: string;
    cursorPosition?: number;
}

/**
 * Props for ChatModePanel (includes AI interview workflows)
 */
export interface ChatModePanelProps extends ModePanelProps {
    selectedTextContext?: string | null;
    sceneContext?: SceneContext | null;
    onClearContext?: () => void;
    onWorkflowComplete?: (type: 'character' | 'location' | 'scene', parsedData: any) => void;
}

/**
 * Props for ImageModePanel
 */
export interface ImageModePanelProps extends ModePanelProps {
    imageEntityContext?: EntityContext | null;
}

/**
 * Props for SceneVisualizerModePanel
 */
export interface SceneVisualizerModePanelProps extends ModePanelProps {
    initialPrompt?: string | null;
}

// ============================================================================
// SCENE VISUALIZER TYPES (re-export)
// ============================================================================

/**
 * Scene prompt for video generation
 */
export interface ScenePrompt {
    segmentIndex: number;
    text: string;
    videoUrl?: string;
    isGenerating?: boolean;
    error?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Comparison texts for rewrite modal
 */
export interface ComparisonTexts {
    original: string;
    rewritten: string;
}

