/**
 * useMusicGeneration Hook
 * 
 * React hook for generating AI music using Suno API
 * Handles music generation, polling, error handling, and state management
 */

'use client';

import { useState, useCallback } from 'react';

// ==================== Types ====================

export type SunoModel = 'v3.5' | 'v4' | 'v4.5' | 'v4.5-plus' | 'v5';

export interface MusicGenerationOptions {
  prompt: string;
  model?: SunoModel;
  tags?: string;
  title?: string;
  instrumental?: boolean;
}

export interface MusicGenerationResult {
  audioUrl: string;
  s3Key: string;
  taskId: string;
  title?: string;
  tags?: string;
  duration_seconds?: number;
  model: SunoModel;
  creditsUsed: number;
  has_vocals: boolean;
  generatedAt: string;
  lyrics?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface LyricsGenerationOptions {
  prompt: string;
}

export interface LyricsGenerationResult {
  text: string;
  title?: string;
  id?: string;
  status: 'completed' | 'failed';
}

export interface AudioSeparationResult {
  vocals_url?: string;
  instrumental_url?: string;
  vocals_s3_key?: string;
  instrumental_s3_key?: string;
  taskId: string;
  creditsUsed: number;
  status: 'completed' | 'failed';
}

export interface SunoModelInfo {
  model: SunoModel;
  label: string;
  description: string;
  maxDurationSeconds: number;
  quality: 'standard' | 'high' | 'premium' | 'cinematic';
  speed: 'fast' | 'standard' | 'slow';
  creditsPerGeneration: number;
}

// ==================== API Client ====================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Hook ====================

export function useMusicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MusicGenerationResult | null>(null);

  /**
   * Generate music from text prompt
   */
  const generateMusic = useCallback(async (options: MusicGenerationOptions) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      console.log('[useMusicGeneration] Starting music generation:', options);

      const data = await fetchWithAuth('/api/music/generate', {
        method: 'POST',
        body: JSON.stringify(options),
      });

      console.log('[useMusicGeneration] Generation started:', data);

      // Check if we need to poll for completion
      if (data.status === 'completed') {
        setResult(data);
        setProgress(100);
      } else {
        // Poll for status
        await pollMusicStatus(data.taskId);
      }
    } catch (err: any) {
      console.error('[useMusicGeneration] Generation failed:', err);
      setError(err.message || 'Music generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Poll for music generation status
   */
  const pollMusicStatus = async (taskId: string) => {
    const maxAttempts = 120; // 20 minutes
    const pollInterval = 10000; // 10 seconds
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const data = await fetchWithAuth(`/api/music/${taskId}`);

        console.log(`[useMusicGeneration] Poll attempt ${attempts + 1}: ${data.status}`);

        if (data.status === 'completed') {
          setResult(data);
          setProgress(100);
          return;
        }

        if (data.status === 'failed') {
          throw new Error(data.error_message || 'Music generation failed');
        }

        // Update progress estimate
        attempts++;
        const estimatedProgress = Math.min(95, (attempts / maxAttempts) * 100);
        setProgress(estimatedProgress);

        if (attempts >= maxAttempts) {
          throw new Error('Music generation timed out after 20 minutes');
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        await poll();
      } catch (err: any) {
        throw err;
      }
    };

    await poll();
  };

  /**
   * Clear current state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    generateMusic,
    isGenerating,
    progress,
    error,
    result,
    reset,
  };
}

// ==================== Lyrics Hook ====================

export function useLyricsGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LyricsGenerationResult | null>(null);

  const generateLyrics = useCallback(async (options: LyricsGenerationOptions) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      console.log('[useLyricsGeneration] Generating lyrics:', options);

      const data = await fetchWithAuth('/api/music/generate-lyrics', {
        method: 'POST',
        body: JSON.stringify(options),
      });

      setResult(data);
    } catch (err: any) {
      console.error('[useLyricsGeneration] Generation failed:', err);
      setError(err.message || 'Lyrics generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    generateLyrics,
    isGenerating,
    error,
    result,
    reset,
  };
}

// ==================== Audio Separation Hook ====================

export function useAudioSeparation() {
  const [isSeparating, setIsSeparating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AudioSeparationResult | null>(null);

  const separateAudio = useCallback(async (audioUrl: string) => {
    setIsSeparating(true);
    setError(null);
    setResult(null);

    try {
      console.log('[useAudioSeparation] Separating audio:', audioUrl);

      const data = await fetchWithAuth('/api/music/separate', {
        method: 'POST',
        body: JSON.stringify({ audio_url: audioUrl }),
      });

      setResult(data);
    } catch (err: any) {
      console.error('[useAudioSeparation] Separation failed:', err);
      setError(err.message || 'Audio separation failed');
    } finally {
      setIsSeparating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsSeparating(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    separateAudio,
    isSeparating,
    error,
    result,
    reset,
  };
}

// ==================== Models Hook ====================

export function useSunoModels() {
  const [models, setModels] = useState<SunoModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithAuth('/api/music/models/list');
      setModels(data.models || []);
    } catch (err: any) {
      console.error('[useSunoModels] Failed to load models:', err);
      setError(err.message || 'Failed to load models');
      
      // Fallback to default models
      setModels([
        {
          model: 'v3.5',
          label: 'Standard',
          description: 'Better song structure, up to 4 minutes',
          maxDurationSeconds: 240,
          quality: 'high',
          speed: 'standard',
          creditsPerGeneration: 50,
        },
        {
          model: 'v4',
          label: 'Enhanced',
          description: 'Improved vocals, up to 4 minutes',
          maxDurationSeconds: 240,
          quality: 'premium',
          speed: 'standard',
          creditsPerGeneration: 75,
        },
        {
          model: 'v4.5',
          label: 'Premium',
          description: 'Smart prompts, up to 8 minutes',
          maxDurationSeconds: 480,
          quality: 'premium',
          speed: 'standard',
          creditsPerGeneration: 100,
        },
        {
          model: 'v4.5-plus',
          label: 'Professional',
          description: 'Richer tones, up to 8 minutes',
          maxDurationSeconds: 480,
          quality: 'cinematic',
          speed: 'slow',
          creditsPerGeneration: 150,
        },
        {
          model: 'v5',
          label: 'Ultra',
          description: 'Latest model, premium quality',
          maxDurationSeconds: 480,
          quality: 'cinematic',
          speed: 'slow',
          creditsPerGeneration: 200,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    models,
    isLoading,
    error,
    loadModels,
  };
}

// ==================== Utility Functions ====================

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get model badge color based on quality
 */
export function getModelBadgeColor(quality: string): string {
  switch (quality) {
    case 'cinematic':
      return 'purple';
    case 'premium':
      return 'blue';
    case 'high':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get recommended model for user
 */
export function getRecommendedModel(): SunoModel {
  return 'v4.5'; // Best balance of quality and cost
}

