'use client';

import React, { useState } from 'react';
import { 
  Eye, 
  Sparkles, 
  MoreVertical, 
  Check,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Palette,
  Lightbulb,
  Camera
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StyleProfile {
  profileId: string;
  projectId: string;
  sceneId?: string;
  videoUrl: string;
  extractedFrames: string[];
  
  // Visual attributes
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
  
  // AI prompt additions
  stylePromptAdditions: string[];
  negativePrompt: string;
  
  // Metadata
  createdAt: string;
  confidence: number;
}

interface StyleProfileCardProps {
  profile: StyleProfile;
  onApply?: (profile: StyleProfile) => void;
  onEdit?: (profile: StyleProfile) => void;
  onDuplicate?: (profile: StyleProfile) => void;
  onDelete?: (profile: StyleProfile) => void;
  onViewDetails?: (profile: StyleProfile) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StyleProfileCard({
  profile,
  onApply,
  onEdit,
  onDuplicate,
  onDelete,
  onViewDetails,
  isSelected = false,
  showActions = true,
  compact = false,
  className = '',
}: StyleProfileCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApply) {
      onApply(profile);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) {
      onEdit(profile);
    }
  };

  const handleDuplicate = () => {
    setShowMenu(false);
    if (onDuplicate) {
      onDuplicate(profile);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) {
      onDelete(profile);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(profile);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getConfidenceBadgeColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
    if (confidence >= 60) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
    return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300
        border-2 ${isSelected ? 'border-blue-500 dark:border-blue-400' : 'border-transparent'}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
    >
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 z-10">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Actions Menu */}
      {showActions && (
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={handleDuplicate}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              {onViewDetails && (
                <button
                  onClick={handleViewDetails}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Details
                </button>
              )}
              {onDelete && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visual Preview */}
      <div className={`relative ${compact ? 'h-32' : 'h-40'} mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900`}>
        {/* Frame Thumbnail or Color Palette */}
        {profile.extractedFrames && profile.extractedFrames.length > 0 ? (
          <img
            src={profile.extractedFrames[0]}
            alt="Style preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex gap-1">
              {profile.color.palette.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confidence Badge Overlay */}
        <div className="absolute bottom-2 left-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(profile.confidence)}`}>
            {profile.confidence}% confident
          </div>
        </div>

        {/* Hover Overlay */}
        {isHovered && !compact && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Apply Style
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Title & Date */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {profile.sceneId ? `Scene ${profile.sceneId}` : 'Default Style'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Lighting */}
          <div className="flex flex-col items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mb-1" />
            <span className="text-gray-700 dark:text-gray-300 text-center truncate w-full">
              {profile.lighting.type}
            </span>
          </div>

          {/* Color */}
          <div className="flex flex-col items-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
            <Palette className="w-4 h-4 text-pink-600 dark:text-pink-400 mb-1" />
            <span className="text-gray-700 dark:text-gray-300 text-center truncate w-full">
              {profile.color.grading}
            </span>
          </div>

          {/* Camera */}
          <div className="flex flex-col items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
            <span className="text-gray-700 dark:text-gray-300 text-center truncate w-full">
              {profile.composition.framing}
            </span>
          </div>
        </div>

        {/* Mood Tag */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Mood:</span>
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
            {profile.mood}
          </span>
        </div>

        {/* Prompt Additions Count */}
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Sparkles className="w-3 h-3" />
            <span>{profile.stylePromptAdditions.length} prompt suggestions</span>
          </div>
        )}

        {/* Apply Button (Mobile) */}
        {onApply && compact && (
          <button
            onClick={handleApply}
            className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Apply
          </button>
        )}
      </div>

      {/* Expanded Details (on hover, non-compact) */}
      {isHovered && !compact && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 rounded-b-xl">
          <div className="space-y-1 text-white text-xs">
            <p>• Camera: {profile.cameraStyle.movement}, {profile.cameraStyle.stability}</p>
            <p>• Texture: {profile.texture.grain}, {profile.texture.sharpness}</p>
            <p>• Depth: {profile.composition.depth}</p>
          </div>
        </div>
      )}
    </div>
  );
}

