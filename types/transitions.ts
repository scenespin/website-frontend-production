/**
 * Hollywood Transition Templates - Type Definitions
 * 
 * Feature 0031: Professional ffmpeg-powered transitions
 */

// ============================================================================
// Transition Types
// ============================================================================

/**
 * Transition Category
 */
export type TransitionCategory = 
  | 'motion'      // Fast camera movements (whip pan, spin, zoom)
  | 'graphic'     // Visual effects (glitch, film burn, VHS)
  | 'light'       // Lighting effects (lens flare, flash, glow)
  | 'shape'       // Geometric wipes (circular, hexagonal, star)
  | 'cinematic';  // Advanced techniques (match cut, invisible cut)

/**
 * Transition Duration Options
 */
export type TransitionDuration = 0.5 | 0.8 | 1.0 | 1.5 | 2.0;

/**
 * Transition Template - Pre-defined Hollywood-quality transitions
 */
export interface TransitionTemplate {
  id: string;
  name: string;
  category: TransitionCategory;
  duration: TransitionDuration; // Default duration in seconds
  description: string;
  
  // ffmpeg command template (will be populated with actual clip paths)
  ffmpegCommand: string;
  
  // Visual assets
  previewUrl: string; // Video preview loop
  thumbnailUrl: string; // Static thumbnail image
  
  // Metadata
  isPremium: boolean;
  tags: string[]; // ["fast", "dramatic", "smooth", "jarring"]
  bestFor: string[]; // ["action", "drama", "horror", "comedy"]
  mood: string[]; // ["intense", "calm", "energetic", "mysterious"]
  
  // Usage and popularity
  popularity: number; // 0-100 (for sorting)
  usageCount: number; // How many times used across all projects
  
  // Customization options
  customizable: {
    duration: boolean; // Can user adjust duration?
    speed: boolean; // Can user adjust playback speed?
    intensity: boolean; // Can user adjust effect intensity?
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Applied Transition - Instance of a transition between two clips
 */
export interface AppliedTransition {
  id: string;
  templateId: string;
  template: TransitionTemplate;
  
  // Timeline position
  beforeClipId: string; // Clip that comes before transition
  afterClipId: string; // Clip that comes after transition
  timelinePosition: number; // Position in timeline (seconds)
  
  // Customized settings
  duration: TransitionDuration;
  speed: number; // 0.5 - 2.0 (1.0 = normal)
  intensity: number; // 0-100 (100 = full effect)
  
  // Processing status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  
  // Output
  outputUrl?: string; // URL of processed video with transition
  s3Key?: string;
  
  // Credits and cost
  creditsUsed: number;
  
  // Timestamps
  appliedAt: string;
  completedAt?: string;
}

/**
 * Transition Library Filter Options
 */
export interface TransitionFilter {
  category?: TransitionCategory;
  tags?: string[];
  isPremium?: boolean;
  searchQuery?: string;
  sortBy?: 'popularity' | 'name' | 'recent' | 'duration';
}

/**
 * Transition Application Request
 */
export interface ApplyTransitionRequest {
  templateId: string;
  beforeClipId: string;
  afterClipId: string;
  
  // Optional customization
  duration?: TransitionDuration;
  speed?: number;
  intensity?: number;
  
  // Project context
  projectId: string;
  timelineId: string;
}

/**
 * Transition Application Response
 */
export interface ApplyTransitionResponse {
  appliedTransitionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime: string; // "2-3 seconds"
  creditsUsed: number;
  outputUrl?: string;
  error?: string;
}

/**
 * Transition Preview Request
 */
export interface TransitionPreviewRequest {
  templateId: string;
  beforeClipUrl: string; // URL of first clip
  afterClipUrl: string; // URL of second clip
  duration?: TransitionDuration;
}

/**
 * AI Transition Suggestion
 */
export interface TransitionSuggestion {
  template: TransitionTemplate;
  confidence: number; // 0-100
  reasoning: string; // Why this transition was suggested
  rank: number; // 1, 2, 3 (top 3 suggestions)
}

/**
 * Clip Metadata for AI Analysis
 */
export interface ClipMetadataForTransition {
  clipId: string;
  duration: number;
  
  // Visual analysis
  mood: 'calm' | 'intense' | 'mysterious' | 'energetic' | 'melancholic';
  motion: 'static' | 'low' | 'medium' | 'high';
  brightness: 'dark' | 'normal' | 'bright';
  colorPalette: string[]; // Dominant colors
  
  // Scene context
  genre?: 'action' | 'drama' | 'horror' | 'comedy' | 'thriller' | 'romance';
  hasDialogue: boolean;
  hasFaces: boolean;
  
  // Audio
  hasMusic: boolean;
  audioIntensity: 'low' | 'medium' | 'high';
}

/**
 * Transition Statistics
 */
export interface TransitionStatistics {
  totalTransitions: number;
  mostPopularTransition: string;
  averageTransitionDuration: number;
  transitionsByCategory: Record<TransitionCategory, number>;
  creditsSpentOnTransitions: number;
}

// ============================================================================
// Exports
// ============================================================================

// All types already exported inline above, no need to re-export


