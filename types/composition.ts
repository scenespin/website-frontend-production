/**
 * Frontend Composition Types
 * Matches backend unified composition library
 */

export type CompositionCategory = 
  | 'static-layout'
  | 'audio-enabled'
  | 'animated'
  | 'production';

export type AudioStrategy = 
  | 'mix_equal'
  | 'focus_main'
  | 'use_index'
  | 'auto_duck'
  | 'spatial'
  | 'custom';

export interface CompositionCanvas {
  width: number;
  height: number;
  background?: string;
}

export interface CompositionLayout {
  id: string;
  name: string;
  description: string;
  category: CompositionCategory;
  subcategory?: string;
  num_regions: number;
  canvas: CompositionCanvas;
  best_for: string[];
  example_use_case: string;
  recommended_aspect_ratios: string[];
  credits: number;
  duration_seconds: number;
  isPremium: boolean;
  audioStrategy?: AudioStrategy;
  hasAnimation?: boolean;
}

export interface CompositionFilters {
  category?: string;
  tag?: string;
  numRegions?: number;
  audioEnabled?: boolean;
  animated?: boolean;
}

export interface VideoGenerationParams {
  model: string;
  prompt: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: number;
}

export interface CompositionResponse {
  success: boolean;
  layouts?: CompositionLayout[];
  layout?: CompositionLayout;
  error?: string;
  message?: string;
}
