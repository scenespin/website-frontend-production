/**
 * Dashboard Type Definitions
 * Feature 0068: Production Dashboard Backend Integration
 */

// ==================== PRODUCTION METRICS ====================

export interface ProductionMetrics {
  total_videos_generated: number;
  total_compositions: number;
  estimated_time_saved_hours: number;
}

// ==================== CREDIT BREAKDOWN ====================

export interface CreditBreakdown {
  videos: number;
  images: number;
  audio: number;
  compositions: number;
  total: number;
}

// ==================== PRODUCTION ACTIVITY ====================

export interface ProductionActivityWeek {
  week: string; // "Week 1", "Week 2", etc.
  videos: number;
  images: number;
  audio: number;
  compositions: number;
}

// ==================== VIDEO JOBS ====================

export interface VideoJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  videos?: VideoResult[];
  totalCreditsUsed?: number;
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sceneName?: string;
  prompts?: Array<{ prompt: string }>;
}

export interface VideoResult {
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  provider?: string;
  creditsUsed?: number;
}

// ==================== USER PROFILE ====================

export interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'ultra';
  credits_remaining: number;
  character_assets?: CharacterAsset[];
  location_assets?: LocationAsset[];
  created_at: string;
  last_login?: string;
}

export interface CharacterAsset {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  sceneCount?: number;
  createdAt: string;
}

export interface LocationAsset {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  sceneCount?: number;
  createdAt: string;
}

// ==================== DASHBOARD STATS ====================

export interface DashboardStats {
  active_projects: number;
  total_pages_written: number;
  credits_used_this_month: number;
  completed_scripts: number;
  writing_streak_days: number;
  credits_remaining: number;
  total_scenes: number;
  project_distribution: {
    feature_films: number;
    tv_pilots: number;
    short_scripts: number;
    other: number;
  };
}

// ==================== AI USAGE ====================

export interface AIUsageBreakdown {
  chat_agent: number; // percentage
  director_agent: number;
  editor_agent: number;
  image_agent: number;
  video_generation: number;
  total_requests: number;
}

// ==================== METERING ====================

export interface MeteringLog {
  log_id: string;
  user_id: string;
  service_type: string;
  credits_used: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListJobsResponse {
  success: boolean;
  jobs: VideoJob[];
  total: number;
}

