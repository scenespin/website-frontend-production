'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, AlertCircle, Grid, List } from 'lucide-react';
import StyleProfileCard from './StyleProfileCard';

// ============================================================================
// TYPES
// ============================================================================

interface StyleProfile {
  profileId: string;
  projectId: string;
  sceneId?: string;
  videoUrl: string;
  extractedFrames: string[];
  lighting: {
    type: string;
    direction: string;
    quality: string;
  };
  color: {
    palette: string[];
    saturation: string;
    temperature: string;
    grading: string;
  };
  composition: {
    framing: string;
    angleHeight: string;
    depth: string;
  };
  cameraStyle: {
    movement: string;
    stability: string;
  };
  texture: {
    grain: string;
    sharpness: string;
  };
  mood: string;
  stylePromptAdditions: string[];
  negativePrompt: string;
  createdAt: string;
  confidence: number;
}

interface StyleProfileGalleryProps {
  projectId: string;
  onApply?: (profile: StyleProfile) => void;
  onEdit?: (profile: StyleProfile) => void;
  onViewDetails?: (profile: StyleProfile) => void;
  selectedProfileId?: string;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StyleProfileGallery({
  projectId,
  onApply,
  onEdit,
  onViewDetails,
  selectedProfileId,
  compact = false,
  className = '',
}: StyleProfileGalleryProps) {
  const { getToken } = useAuth();

  // State
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadProfiles();
  }, [projectId]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/style/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load profiles: ${response.status}`);
      }

      const data = await response.json();
      setProfiles(data.profiles || []);

    } catch (err) {
      console.error('[StyleProfileGallery] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (profile: StyleProfile) => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      // Create a copy with a new ID
      const duplicatedProfile = {
        ...profile,
        sceneId: profile.sceneId ? `${profile.sceneId}-copy` : undefined,
      };

      // Remove profileId to create a new one
      delete (duplicatedProfile as any).profileId;
      delete (duplicatedProfile as any).createdAt;
      delete (duplicatedProfile as any).ttl;

      const response = await fetch('/api/style/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: profile.projectId,
          videoUrl: profile.videoUrl,
          sceneId: duplicatedProfile.sceneId,
        }),
      });

      if (response.ok) {
        await loadProfiles(); // Refresh list
      }

    } catch (err) {
      console.error('[StyleProfileGallery] Duplicate error:', err);
    }
  };

  const handleDelete = async (profile: StyleProfile) => {
    if (!confirm('Are you sure you want to delete this style profile?')) {
      return;
    }

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/style/${profile.profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadProfiles(); // Refresh list
      }

    } catch (err) {
      console.error('[StyleProfileGallery] Delete error:', err);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3 ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800 dark:text-red-200">Failed to load style profiles</p>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={loadProfiles}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 mb-2">No style profiles yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Analyze a video to create your first style profile
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Style Profiles ({profiles.length})
        </h3>
        
        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 shadow'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 shadow'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="List view"
          >
            <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        }
      >
        {profiles.map((profile) => (
          <StyleProfileCard
            key={profile.profileId}
            profile={profile}
            onApply={onApply}
            onEdit={onEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onViewDetails={onViewDetails}
            isSelected={profile.profileId === selectedProfileId}
            compact={viewMode === 'list' || compact}
          />
        ))}
      </div>
    </div>
  );
}

