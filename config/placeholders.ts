/**
 * Centralized Placeholder Text Configuration
 * 
 * Single source of truth for all input placeholder text across the application.
 * This ensures consistency and makes updates easier.
 */

export const PLACEHOLDERS = {
  // Default chat placeholder
  DEFAULT: 'How can I help you today?',
  
  // Agent-specific placeholders
  CHAT: 'Ask me anything about screenwriting...',
  DIRECTOR: 'Describe the scene you want to create...',
  DIALOGUE: 'Describe the scene and characters for dialogue...',
  EDITOR: 'Select text to rewrite or polish...',
  
  // Image generation placeholders
  IMAGE: 'Describe the image you want to generate...',
  IMAGE_EDIT: 'Describe how to modify this image...',
  
  // Video generation placeholders
  SCENE_VISUALIZER: 'Paste your screenplay scene to convert to video prompts...',
  QUICK_VIDEO: 'Describe the video you want to generate...',
  
  // AI workflow placeholders
  CHARACTER_INTERVIEW: 'Tell me about this character...',
  LOCATION_INTERVIEW: 'Describe this location...',
  SCENE_INTERVIEW: 'Describe this scene...',
  
  // Fallback for empty state
  EMPTY: '',
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

/**
 * Get placeholder text based on context
 */
export function getPlaceholder(
  mode?: 'chat' | 'director' | 'image' | 'dialogue' | 'scene-visualizer' | 'quick-video',
  imageModel?: string | null,
  workflowType?: 'character' | 'location' | 'scene' | null
): string {
  // Priority 1: AI workflow
  if (workflowType === 'character') return PLACEHOLDERS.CHARACTER_INTERVIEW;
  if (workflowType === 'location') return PLACEHOLDERS.LOCATION_INTERVIEW;
  if (workflowType === 'scene') return PLACEHOLDERS.SCENE_INTERVIEW;
  
  // Priority 2: Image mode
  if (imageModel) return PLACEHOLDERS.IMAGE;
  
  // Priority 3: Agent mode
  if (mode === 'director') return PLACEHOLDERS.DIRECTOR;
  if (mode === 'dialogue') return PLACEHOLDERS.DIALOGUE;
  if (mode === 'scene-visualizer') return PLACEHOLDERS.SCENE_VISUALIZER;
  if (mode === 'quick-video') return PLACEHOLDERS.QUICK_VIDEO;
  if (mode === 'image') return PLACEHOLDERS.IMAGE;
  
  // Default
  return PLACEHOLDERS.DEFAULT;
}

