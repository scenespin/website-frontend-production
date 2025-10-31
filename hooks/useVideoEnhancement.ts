/**
 * useVideoEnhancement Hook
 * 
 * Handles video post-production enhancements using AI-powered video transformation.
 * Provides color grading, weather effects, and style transfer capabilities.
 * 
 * Usage:
 * const { enhance, applyPreset, isProcessing, result } = useVideoEnhancement();
 * 
 * await applyPreset(videoUrl, 'cinematic');
 * await enhance(videoUrl, { type: 'color-grade', customPrompt: '...' });
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type EnhancementProvider = 'standard' | 'premium';
export type EnhancementType = 'color-grade' | 'style-transform';
export type EnhancementMode = 'subtle' | 'moderate' | 'strong';

export interface EnhancementOptions {
  type: EnhancementType;
  preset?: string;
  customPrompt?: string;
  mode?: EnhancementMode;
  tier?: EnhancementProvider;
}

export interface EnhancementResult {
  videoUrl: string;
  s3Key: string;
  creditsUsed: number;
  processingTime: number;
  provider: string;
  preset?: string;
  generatedAt: string;
}

export interface PresetOption {
  id: string;
  name: string;
  prompt: string;
  mode: EnhancementMode;
  credits: number;
  preview: string;
  category: 'color-grade' | 'weather' | 'style-transfer' | 'artistic';
  tier: EnhancementProvider;
  _internalProvider?: string; // Internal only, not exposed to UI
}

// Color Grading Presets
export const COLOR_GRADE_PRESETS: PresetOption[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    prompt: 'Professional cinematic color grading with teal and orange tones, high contrast, film-like quality',
    mode: 'moderate',
    credits: 25,
    preview: 'Blockbuster movie look',
    category: 'color-grade',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'noir',
    name: 'Film Noir',
    prompt: 'Film noir black and white with high contrast, dramatic shadows, vintage 1940s aesthetic',
    mode: 'moderate',
    credits: 25,
    preview: 'Classic noir detective film',
    category: 'color-grade',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'warm-golden',
    name: 'Warm Golden Hour',
    prompt: 'Warm golden hour lighting, soft highlights, amber tones, romantic atmosphere',
    mode: 'subtle',
    credits: 25,
    preview: 'Sunset wedding video',
    category: 'color-grade',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    prompt: 'Cyberpunk neon aesthetic with purple and blue tones, high saturation, futuristic vibe',
    mode: 'moderate',
    credits: 25,
    preview: 'Blade Runner style',
    category: 'color-grade',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'vintage',
    name: 'Vintage 70s',
    prompt: 'Vintage 1970s film look with warm grain, faded colors, nostalgic feel',
    mode: 'subtle',
    credits: 25,
    preview: 'Retro home video',
    category: 'color-grade',
    tier: 'standard',
    _internalProvider: 'luma'
  }
];

// Weather Effects Presets
export const WEATHER_PRESETS: PresetOption[] = [
  {
    id: 'rain',
    name: 'Dramatic Rain',
    prompt: 'Add dramatic rain and storm with dark clouds, wet surfaces, realistic water effects',
    mode: 'moderate',
    credits: 25,
    preview: 'Moody rainy scene',
    category: 'weather',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'snow',
    name: 'Gentle Snow',
    prompt: 'Add gentle snowfall with cold atmosphere, snow-covered surfaces, winter ambiance',
    mode: 'moderate',
    credits: 25,
    preview: 'Winter wonderland',
    category: 'weather',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'fog',
    name: 'Atmospheric Fog',
    prompt: 'Add atmospheric fog and mist, mysterious mood, soft diffused lighting',
    mode: 'subtle',
    credits: 25,
    preview: 'Mysterious foggy atmosphere',
    category: 'weather',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'sunset',
    name: 'Golden Hour',
    prompt: 'Transform to golden hour sunset with warm lighting, dramatic sky, long shadows',
    mode: 'moderate',
    credits: 25,
    preview: 'Dramatic sunset transformation',
    category: 'weather',
    tier: 'standard',
    _internalProvider: 'luma'
  },
  {
    id: 'night',
    name: 'Nighttime',
    prompt: 'Convert to nighttime with moonlight, city lights, dark atmosphere',
    mode: 'moderate',
    credits: 25,
    preview: 'Day to night conversion',
    category: 'weather',
    tier: 'standard',
    _internalProvider: 'luma'
  }
];

// Style Transfer Presets (Premium Tier)
export const STYLE_TRANSFER_PRESETS: PresetOption[] = [
  {
    id: 'anime',
    name: 'Anime Animation',
    prompt: 'Transform to anime animation style with cel-shading, vibrant colors, Japanese animation aesthetic',
    mode: 'strong',
    credits: 100,
    preview: 'Japanese anime style',
    category: 'style-transfer',
    tier: 'premium',
    _internalProvider: 'runway'
  },
  {
    id: 'cartoon',
    name: '3D Cartoon',
    prompt: 'Convert to 3D Pixar-style cartoon with rounded features, exaggerated expressions, animated look',
    mode: 'strong',
    credits: 100,
    preview: 'Pixar animation style',
    category: 'style-transfer',
    tier: 'premium',
    _internalProvider: 'runway'
  },
  {
    id: 'sketch',
    name: 'Hand Drawn Sketch',
    prompt: 'Transform to hand-drawn sketch with pencil lines, artistic hatching, illustration style',
    mode: 'strong',
    credits: 100,
    preview: 'Pencil sketch artwork',
    category: 'style-transfer',
    tier: 'premium',
    _internalProvider: 'runway'
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    prompt: 'Convert to impressionist oil painting with visible brushstrokes, painterly texture, fine art aesthetic',
    mode: 'strong',
    credits: 100,
    preview: 'Impressionist art',
    category: 'artistic',
    tier: 'premium',
    _internalProvider: 'runway'
  },
  {
    id: 'sci-fi',
    name: 'Sci-Fi Future',
    prompt: 'Transform to futuristic sci-fi aesthetic with holographic effects, advanced technology, cybernetic elements',
    mode: 'strong',
    credits: 100,
    preview: 'Futuristic sci-fi look',
    category: 'style-transfer',
    tier: 'premium',
    _internalProvider: 'runway'
  }
];

export const ALL_PRESETS = [
  ...COLOR_GRADE_PRESETS,
  ...WEATHER_PRESETS,
  ...STYLE_TRANSFER_PRESETS
];

export function useVideoEnhancement() {
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Quality protection state
  const [originalVideo, setOriginalVideo] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const [enhancementCount, setEnhancementCount] = useState(0);
  
  // Cache state for free restore
  const [lastEnhancedVideo, setLastEnhancedVideo] = useState<string | null>(null);
  const [lastEnhancedPreset, setLastEnhancedPreset] = useState<string | null>(null);
  const [lastEnhancementCredits, setLastEnhancementCredits] = useState<number>(0);

  /**
   * Get preset by ID
   */
  const getPreset = useCallback((presetId: string): PresetOption | undefined => {
    return ALL_PRESETS.find(p => p.id === presetId);
  }, []);

  /**
   * Enhance video with custom options
   */
  const enhance = useCallback(async (
    videoUrl: string,
    options: EnhancementOptions
  ): Promise<EnhancementResult> => {
    // Set original video if not set
    if (!originalVideo) {
      setOriginalVideo(videoUrl);
    }
    
    // ALWAYS use original video as source for quality protection
    const sourceVideo = originalVideo || videoUrl;
    
    // Clear any cached enhancement since we're applying a new one
    if (lastEnhancedVideo) {
      clearEnhancementCache();
    }
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const toastId = toast.loading('Starting video enhancement...');

    try {
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Determine endpoint based on type
      let endpoint = '';
      let body: any = {};

      // Determine provider based on preset tier
      const preset = options.preset ? getPreset(options.preset) : null;
      const internalProvider = preset?._internalProvider || 'luma';
      
      // Both providers now route to generic /video/enhance endpoint (Feature 0078)
      endpoint = `${apiUrl}/api/video/enhance`;
      
      if (internalProvider === 'luma' || options.type === 'color-grade') {
        body = {
          videoUrl: sourceVideo, // USE ORIGINAL, not current
          prompt: options.customPrompt || '',
          mode: options.mode || 'moderate',
          model: 'ray-flash-2'
        };
      } else if (internalProvider === 'runway' || options.type === 'style-transform') {
        body = {
          videoUrl: sourceVideo, // USE ORIGINAL, not current
          prompt: options.customPrompt || '',
          model: 'gen4_turbo',
          duration: 5,
          watermark: false
        };
      }

      toast.loading('Processing enhancement...', { id: toastId });
      setProgress(50);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Enhancement failed: ${response.statusText}`);
      }

      const data = await response.json();

      const enhancementResult: EnhancementResult = {
        videoUrl: data.videoUrl,
        s3Key: data.s3Key,
        creditsUsed: data.creditsUsed || (options.tier === 'premium' ? 100 : 25),
        processingTime: data.processingTime || 0,
        provider: 'Wryda AI Enhancement',
        preset: options.preset,
        generatedAt: data.generatedAt || new Date().toISOString()
      };

      setResult(enhancementResult);
      setCurrentVideo(enhancementResult.videoUrl);
      setAppliedPreset(options.preset || 'custom');
      setEnhancementCount(prev => prev + 1);
      setProgress(100);

      toast.success(`✅ Enhancement complete! Used ${enhancementResult.creditsUsed} credits.`, { id: toastId });

      return enhancementResult;

    } catch (err: any) {
      const errorMessage = err.message || 'Enhancement failed';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, { id: toastId });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Apply a preset enhancement
   */
  const applyPreset = useCallback(async (
    videoUrl: string,
    presetId: string
  ): Promise<EnhancementResult> => {
    const preset = getPreset(presetId);

    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }
    
    // If already enhanced, warn about re-enhancement charges
    if (appliedPreset && appliedPreset !== presetId) {
      // This warning should be handled by the UI component before calling this function
      console.warn('[useVideoEnhancement] Replacing existing enhancement:', appliedPreset, '→', presetId);
    }

    const options: EnhancementOptions = {
      type: preset.category === 'style-transfer' || preset.category === 'artistic' ? 'style-transform' : 'color-grade',
      preset: presetId,
      customPrompt: preset.prompt,
      mode: preset.mode,
      tier: preset.tier
    };

    return enhance(videoUrl, options);
  }, [enhance, getPreset, appliedPreset]);

  /**
   * Get presets by category
   */
  const getPresetsByCategory = useCallback((category: PresetOption['category']) => {
    return ALL_PRESETS.filter(p => p.category === category);
  }, []);

  /**
   * Revert to original video (caches current enhancement)
   */
  const revertToOriginal = useCallback(() => {
    if (currentVideo && appliedPreset) {
      // Cache the current enhancement for free restore
      setLastEnhancedVideo(currentVideo);
      setLastEnhancedPreset(appliedPreset);
      setLastEnhancementCredits(result?.creditsUsed || 0);
      
      toast.success('✅ Reverted to original (no charge). Enhanced version cached.', {
        description: `${appliedPreset} enhancement saved - restore anytime for free`
      });
    }
    
    // Reset to original
    setCurrentVideo(originalVideo);
    setAppliedPreset(null);
    setEnhancementCount(0);
    setResult(null);
  }, [currentVideo, appliedPreset, originalVideo, result]);

  /**
   * Restore previously cached enhancement (FREE)
   */
  const restoreEnhancedVersion = useCallback(() => {
    if (lastEnhancedVideo && lastEnhancedPreset) {
      setCurrentVideo(lastEnhancedVideo);
      setAppliedPreset(lastEnhancedPreset);
      setEnhancementCount(1);
      
      // Restore the result metadata
      setResult({
        videoUrl: lastEnhancedVideo,
        s3Key: '', // Preserved from cache
        creditsUsed: lastEnhancementCredits,
        processingTime: 0,
        provider: 'Wryda AI Enhancement (Cached)',
        preset: lastEnhancedPreset,
        generatedAt: new Date().toISOString()
      });
      
      toast.success(`✅ Restored ${lastEnhancedPreset} enhancement (no charge)`, {
        description: 'Your cached enhancement is now active'
      });
    }
  }, [lastEnhancedVideo, lastEnhancedPreset, lastEnhancementCredits]);

  /**
   * Clear enhancement cache (called when applying new enhancement)
   */
  const clearEnhancementCache = useCallback(() => {
    setLastEnhancedVideo(null);
    setLastEnhancedPreset(null);
    setLastEnhancementCredits(0);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
    setProgress(0);
    setOriginalVideo(null);
    setCurrentVideo(null);
    setAppliedPreset(null);
    setEnhancementCount(0);
    setLastEnhancedVideo(null);
    setLastEnhancedPreset(null);
    setLastEnhancementCredits(0);
  }, []);

  return {
    // State
    isProcessing,
    result,
    error,
    progress,
    
    // Quality protection state
    originalVideo,
    currentVideo: currentVideo || originalVideo,
    appliedPreset,
    enhancementCount,
    
    // Cache state
    hasCachedEnhancement: !!lastEnhancedVideo,
    cachedPreset: lastEnhancedPreset,
    cachedCredits: lastEnhancementCredits,

    // Actions
    enhance,
    applyPreset,
    revertToOriginal,
    restoreEnhancedVersion,
    clearEnhancementCache,
    getPreset,
    getPresetsByCategory,
    reset,

    // Presets
    colorGradePresets: COLOR_GRADE_PRESETS,
    weatherPresets: WEATHER_PRESETS,
    styleTransferPresets: STYLE_TRANSFER_PRESETS,
    allPresets: ALL_PRESETS
  };
}

