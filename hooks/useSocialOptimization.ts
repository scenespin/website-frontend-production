/**
 * useSocialOptimization Hook
 * 
 * Handles multi-platform social media video optimization using Luma Reframe.
 * Generates platform-specific versions from a single source video.
 * 
 * Usage:
 * const { optimizeForPlatforms, isOptimizing, platforms, estimateCost } = useSocialOptimization();
 * 
 * const results = await optimizeForPlatforms(
 *   videoUrl,
 *   ['youtube', 'tiktok', 'instagram'],
 *   { enhanceFirst: true, colorGrade: 'cinematic' }
 * );
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

export interface PlatformConfig {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  description: string;
  icon: string;
  reframePrompt?: string;
  creditCost: number;
  popular: boolean;
}

export interface PlatformVideo {
  platform: string;
  platformName: string;
  url: string;
  s3Key: string;
  aspectRatio: AspectRatio;
  creditsUsed: number;
  generatedAt: string;
}

export interface OptimizationOptions {
  enhanceFirst?: boolean;
  colorGrade?: string;
  weather?: string;
}

export interface OptimizationResult {
  platforms: PlatformVideo[];
  totalCredits: number;
  baseVideo: {
    url: string;
    s3Key: string;
    enhanced: boolean;
  };
  processingTime: number;
}

// Platform Configurations
export const SOCIAL_PLATFORMS: Record<string, PlatformConfig> = {
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    aspectRatio: '16:9',
    description: 'Landscape for desktop viewing',
    icon: '📺',
    creditCost: 0, // Primary format, no reframe needed
    popular: true
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    description: 'Vertical mobile-first',
    icon: '🎵',
    reframePrompt: 'Keep main subject centered and in frame, leave top area safe for text overlay',
    creditCost: 10,
    popular: true
  },
  instagram_reels: {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    aspectRatio: '9:16',
    description: 'Vertical stories/reels',
    icon: '📸',
    reframePrompt: 'Keep action in vertical safe zone, center main subject',
    creditCost: 10,
    popular: true
  },
  instagram_feed: {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    aspectRatio: '1:1',
    description: 'Square format',
    icon: '📷',
    reframePrompt: 'Center composition for square frame, balanced framing',
    creditCost: 10,
    popular: true
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    aspectRatio: '16:9',
    description: 'Landscape feed',
    icon: '👥',
    creditCost: 0, // Same as YouTube
    popular: false
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    aspectRatio: '16:9',
    description: 'Landscape tweet embeds',
    icon: '🐦',
    creditCost: 0,
    popular: false
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    aspectRatio: '1:1',
    description: 'Professional square',
    icon: '💼',
    reframePrompt: 'Professional centered composition',
    creditCost: 10,
    popular: false
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    aspectRatio: '9:16',
    description: 'Vertical pins',
    icon: '📌',
    reframePrompt: 'Vertical composition for visual appeal',
    creditCost: 10,
    popular: false
  }
};

// Common platform bundles
export const PLATFORM_BUNDLES = {
  creator: {
    id: 'creator',
    name: 'Creator Bundle',
    platforms: ['youtube', 'tiktok', 'instagram_reels'],
    description: 'YouTube + TikTok + Instagram',
    totalCredits: 20 // 0 + 10 + 10
  },
  business: {
    id: 'business',
    name: 'Business Bundle',
    platforms: ['youtube', 'facebook', 'linkedin'],
    description: 'YouTube + Facebook + LinkedIn',
    totalCredits: 10 // 0 + 0 + 10
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce Bundle',
    platforms: ['instagram_feed', 'instagram_reels', 'pinterest'],
    description: 'Instagram Feed + Reels + Pinterest',
    totalCredits: 30 // 10 + 10 + 10
  },
  all: {
    id: 'all',
    name: 'All Platforms',
    platforms: Object.keys(SOCIAL_PLATFORMS),
    description: 'Maximum reach',
    totalCredits: 50
  }
};

export function useSocialOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Estimate credit cost for optimization
   */
  const estimateCost = useCallback((
    targetPlatforms: string[],
    options: OptimizationOptions = {}
  ): number => {
    let total = 0;

    // Enhancement cost (if requested)
    if (options.enhanceFirst) {
      total += 25; // AI enhancement cost
    }

    // Reframe costs
    targetPlatforms.forEach(platformId => {
      const platform = SOCIAL_PLATFORMS[platformId];
      if (platform) {
        total += platform.creditCost;
      }
    });

    return total;
  }, []);

  /**
   * Calculate savings vs generating separately
   */
  const calculateSavings = useCallback((targetPlatforms: string[]): {
    traditional: number;
    reframe: number;
    saved: number;
    percentage: number;
  } => {
    const platformCount = targetPlatforms.length;
    const traditional = platformCount * 25; // Generate each separately
    const reframe = 25 + estimateCost(targetPlatforms, { enhanceFirst: false }); // Generate once + reframes
    const saved = traditional - reframe;
    const percentage = Math.round((saved / traditional) * 100);

    return { traditional, reframe, saved, percentage };
  }, [estimateCost]);

  /**
   * Optimize video for multiple platforms
   */
  const optimizeForPlatforms = useCallback(async (
    videoUrl: string,
    targetPlatforms: string[],
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> => {
    setIsOptimizing(true);
    setError(null);
    setPlatforms([]);
    setProgress(0);

    const startTime = Date.now();
    const toastId = toast.loading('Starting multi-platform optimization...');

    try {
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      let baseVideo = videoUrl;
      let baseS3Key = '';
      let enhanced = false;
      let totalCredits = 0;

      // Step 1: Optional enhancement
      if (options.enhanceFirst) {
        toast.loading('Enhancing video...', { id: toastId });
        setProgress(20);

        const enhanceResponse = await fetch(`${apiUrl}/api/video/enhance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoUrl,
            prompt: options.colorGrade
              ? `Professional ${options.colorGrade} color grading with high quality`
              : 'Professional cinematic color grading',
            mode: 'adhere_2',
            model: 'ray-flash-2'
          })
        });

        if (!enhanceResponse.ok) {
          throw new Error('Enhancement failed');
        }

        const enhanceData = await enhanceResponse.json();
        baseVideo = enhanceData.videoUrl;
        baseS3Key = enhanceData.s3Key;
        totalCredits += 25;
        enhanced = true;
      }

      setProgress(40);

      // Step 2: Reframe for each platform
      toast.loading('Creating platform-specific versions...', { id: toastId });

      const reframePromises = targetPlatforms.map(async (platformId, index) => {
        const platform = SOCIAL_PLATFORMS[platformId];

        if (!platform) {
          throw new Error(`Unknown platform: ${platformId}`);
        }

        // Skip if same as base (16:9)
        if (platform.aspectRatio === '16:9') {
          return {
            platform: platformId,
            platformName: platform.name,
            url: baseVideo,
            s3Key: baseS3Key,
            aspectRatio: '16:9' as AspectRatio,
            creditsUsed: 0,
            generatedAt: new Date().toISOString()
          };
        }

        // Reframe for this platform
        const reframeResponse = await fetch(`${apiUrl}/api/video/reframe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoUrl: baseVideo,
            aspectRatio: platform.aspectRatio,
            prompt: platform.reframePrompt,
            model: 'ray-flash-2'
          })
        });

        if (!reframeResponse.ok) {
          throw new Error(`Reframe failed for ${platform.name}`);
        }

        const reframeData = await reframeResponse.json();

        // Update progress
        const progressIncrement = (50 / targetPlatforms.length);
        setProgress(prev => Math.min(prev + progressIncrement, 90));

        return {
          platform: platformId,
          platformName: platform.name,
          url: reframeData.videoUrl,
          s3Key: reframeData.s3Key,
          aspectRatio: platform.aspectRatio,
          creditsUsed: 10,
          generatedAt: reframeData.generatedAt || new Date().toISOString()
        };
      });

      const platformVideos = await Promise.all(reframePromises);

      // Calculate total credits
      platformVideos.forEach(pv => {
        totalCredits += pv.creditsUsed;
      });

      setPlatforms(platformVideos);
      setProgress(100);

      const processingTime = (Date.now() - startTime) / 1000;

      const savings = calculateSavings(targetPlatforms);

      toast.success(
        `✅ Created ${platformVideos.length} platform versions! Used ${totalCredits} credits (saved ${savings.percentage}% vs generating separately)`,
        { id: toastId }
      );

      const result: OptimizationResult = {
        platforms: platformVideos,
        totalCredits,
        baseVideo: {
          url: baseVideo,
          s3Key: baseS3Key,
          enhanced
        },
        processingTime
      };

      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Optimization failed';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, { id: toastId });
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  }, [calculateSavings]);

  /**
   * Optimize using a bundle
   */
  const optimizeWithBundle = useCallback(async (
    videoUrl: string,
    bundleId: string,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> => {
    const bundle = PLATFORM_BUNDLES[bundleId as keyof typeof PLATFORM_BUNDLES];

    if (!bundle) {
      throw new Error(`Unknown bundle: ${bundleId}`);
    }

    return optimizeForPlatforms(videoUrl, bundle.platforms, options);
  }, [optimizeForPlatforms]);

  /**
   * Get recommended platforms for a use case
   */
  const getRecommendedPlatforms = useCallback((useCase: 'creator' | 'business' | 'ecommerce'): string[] => {
    return PLATFORM_BUNDLES[useCase].platforms;
  }, []);

  /**
   * Get platform details
   */
  const getPlatform = useCallback((platformId: string): PlatformConfig | undefined => {
    return SOCIAL_PLATFORMS[platformId];
  }, []);

  /**
   * Get popular platforms
   */
  const getPopularPlatforms = useCallback((): PlatformConfig[] => {
    return Object.values(SOCIAL_PLATFORMS).filter(p => p.popular);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsOptimizing(false);
    setPlatforms([]);
    setError(null);
    setProgress(0);
  }, []);

  return {
    // State
    isOptimizing,
    platforms,
    error,
    progress,

    // Actions
    optimizeForPlatforms,
    optimizeWithBundle,
    estimateCost,
    calculateSavings,
    getRecommendedPlatforms,
    getPlatform,
    getPopularPlatforms,
    reset,

    // Constants
    socialPlatforms: SOCIAL_PLATFORMS,
    platformBundles: PLATFORM_BUNDLES
  };
}

