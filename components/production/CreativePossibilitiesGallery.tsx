'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Video, 
  Camera, 
  Zap,
  Star,
  Clock,
  DollarSign,
  Play,
  ChevronRight,
  Filter,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowFromAPI {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  cost: {
    min: number;
    max: number;
    unit: string;
  };
  time: {
    min: number;
    max: number;
    unit: string;
  };
  quality: 1 | 2 | 3 | 4 | 5;
  featured: boolean;
  popularityScore: number;
  tags: string[];
  bestFor: string[];
  examples: string[];
  requiresVideoUpload: boolean;
  tierRestriction?: string;
}

interface CreativeExample {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  estimatedCredits: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  tags: string[];
  conversationPrompt: string; // What to say to AI to start this
  quality: number;
  featured: boolean;
  popularityScore: number;
}

interface CreativePossibilitiesGalleryProps {
  onStartExample?: (example: CreativeExample) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert API workflow to CreativeExample format
 */
function workflowToExample(workflow: WorkflowFromAPI): CreativeExample {
  // Determine difficulty based on quality and complexity
  let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  if (workflow.quality <= 2 || workflow.time.max <= 5) {
    difficulty = 'beginner';
  } else if (workflow.quality >= 4 || workflow.requiresVideoUpload) {
    difficulty = 'advanced';
  }

  // Format time range
  const timeRange = workflow.time.min === workflow.time.max
    ? `${workflow.time.min} min`
    : `${workflow.time.min}-${workflow.time.max} min`;

  // Format credit range
  const creditRange = workflow.cost.min === workflow.cost.max
    ? `${workflow.cost.min}`
    : `${workflow.cost.min}-${workflow.cost.max}`;

  // Generate conversation prompt from bestFor or examples
  const conversationPrompt = workflow.bestFor[0] 
    ? `I want to ${workflow.bestFor[0].toLowerCase()}`
    : `Create ${workflow.name.toLowerCase()}`;

  // Use placeholder thumbnails (in production, these would come from workflow definitions)
  const thumbnailUrl = `https://images.unsplash.com/photo-${1485846234645 + workflow.popularityScore}?w=400`;

  return {
    id: workflow.id,
    title: workflow.name,
    description: workflow.description,
    category: workflow.category,
    categoryLabel: workflow.categoryLabel,
    difficulty,
    estimatedTime: timeRange,
    estimatedCredits: creditRange,
    thumbnailUrl,
    tags: workflow.tags,
    conversationPrompt,
    quality: workflow.quality,
    featured: workflow.featured,
    popularityScore: workflow.popularityScore,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreativePossibilitiesGallery({
  onStartExample,
  className = '',
}: CreativePossibilitiesGalleryProps) {
  // State
  const [workflows, setWorkflows] = useState<CreativeExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredExample, setHoveredExample] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      setError(null);

      try {
        // PUBLIC endpoint - no authentication required
        // NEW: Using /api/gallery/workflows (separate from protected /api/workflows)
        const response = await fetch('/api/gallery/workflows');

        if (!response.ok) {
          throw new Error(`Failed to fetch workflows: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.workflows) {
          throw new Error('Invalid response format');
        }

        // Convert API workflows to CreativeExample format
        const examples = data.workflows.map(workflowToExample);
        setWorkflows(examples);

      } catch (err) {
        console.error('[CreativePossibilitiesGallery] Error fetching workflows:', err);
        setError(err instanceof Error ? err.message : 'Failed to load workflows');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []); // No dependencies - fetch once on mount

  // ============================================================================
  // FILTERS
  // ============================================================================

  const filteredExamples = workflows.filter(example => {
    // Category filter
    if (selectedCategory !== 'all' && example.category !== selectedCategory) {
      return false;
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all' && example.difficulty !== selectedDifficulty) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        example.title.toLowerCase().includes(query) ||
        example.description.toLowerCase().includes(query) ||
        example.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartExample = (example: CreativeExample) => {
    if (onStartExample) {
      onStartExample(example);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      case 'intermediate': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'advanced': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'scenes': return <Video className="w-4 h-4" />;
      case 'effects': return <Zap className="w-4 h-4" />;
      case 'style-match': return <Sparkles className="w-4 h-4" />;
      case 'hybrid': return <Camera className="w-4 h-4" />;
      case 'characters': return <Star className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string): string => {
    return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Creative Possibilities
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Discover what you can create with AI. Click any example to get started instantly.
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search examples..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            <option value="scenes">Scenes</option>
            <option value="effects">Effects</option>
            <option value="style-match">Style Match</option>
            <option value="hybrid">Hybrid</option>
            <option value="characters">Characters</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading creative possibilities...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-12 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mb-4" />
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Failed to load workflows</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Examples Grid */}
      {!loading && !error && (
        <div className="p-6">
        {filteredExamples.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No examples found</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExamples.map((example) => (
              <div
                key={example.id}
                onMouseEnter={() => setHoveredExample(example.id)}
                onMouseLeave={() => setHoveredExample(null)}
                className="group relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-xl cursor-pointer"
                onClick={() => handleStartExample(example)}
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={example.thumbnailUrl}
                    alt={example.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full text-xs font-medium">
                    {getCategoryIcon(example.category)}
                    <span className="text-gray-900 dark:text-white">
                      {getCategoryLabel(example.category)}
                    </span>
                  </div>

                  {/* Difficulty Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(example.difficulty)}`}>
                    {example.difficulty.charAt(0).toUpperCase() + example.difficulty.slice(1)}
                  </div>

                  {/* Play Button Overlay */}
                  {hoveredExample === example.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-in fade-in">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {example.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {example.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{example.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{example.estimatedCredits} credits</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {example.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Try Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartExample(example);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium group-hover:bg-purple-700"
                  >
                    Try This
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Footer Tip */}
      {!loading && !error && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                💡 Pro Tip: Start Simple
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                New to AI video? Try a beginner example first! The AI will guide you through each step and help you learn the workflow.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

