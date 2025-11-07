'use client';

import React, { useState } from 'react';
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
  Search
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CreativeExample {
  id: string;
  title: string;
  description: string;
  category: 'scenes' | 'effects' | 'style-match' | 'hybrid' | 'characters';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  estimatedCredits: number;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  tags: string[];
  conversationPrompt: string; // What to say to AI to start this
}

interface CreativePossibilitiesGalleryProps {
  onStartExample?: (example: CreativeExample) => void;
  className?: string;
}

// ============================================================================
// EXAMPLE DATA
// ============================================================================

const CREATIVE_EXAMPLES: CreativeExample[] = [
  {
    id: 'one-off-dialogue',
    title: 'Quick Dialogue Scene',
    description: 'Generate a conversation between two characters with automatic camera angles',
    category: 'scenes',
    difficulty: 'beginner',
    estimatedTime: '5-10 min',
    estimatedCredits: 180,
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
    tags: ['dialogue', 'conversation', 'easy'],
    conversationPrompt: 'Create a dialogue scene between two characters',
  },
  {
    id: 'action-sequence',
    title: 'Action Sequence',
    description: 'Build an intense action scene with multiple camera angles and dynamic movement',
    category: 'scenes',
    difficulty: 'intermediate',
    estimatedTime: '15-20 min',
    estimatedCredits: 420,
    thumbnailUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
    tags: ['action', 'dynamic', 'multiple shots'],
    conversationPrompt: 'Create an action scene with multiple angles',
  },
  {
    id: 'character-consistency',
    title: 'Character Pose Package',
    description: 'Create a full pose package for a character to use across multiple scenes',
    category: 'characters',
    difficulty: 'beginner',
    estimatedTime: '10-15 min',
    estimatedCredits: 60,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    tags: ['character', 'consistency', 'reusable'],
    conversationPrompt: 'Create a character with multiple poses',
  },
  {
    id: 'style-match-footage',
    title: 'Match Existing Footage',
    description: 'Upload your footage and generate new shots that perfectly match the style',
    category: 'style-match',
    difficulty: 'intermediate',
    estimatedTime: '10-15 min',
    estimatedCredits: 240,
    thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400',
    tags: ['style matching', 'hybrid', 'footage'],
    conversationPrompt: 'I have footage and need matching shots',
  },
  {
    id: 'complete-scene',
    title: 'Complete Scene Package',
    description: 'Generate a full scene with master shot, close-ups, and coverage',
    category: 'scenes',
    difficulty: 'advanced',
    estimatedTime: '20-30 min',
    estimatedCredits: 540,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=400',
    tags: ['complete', 'coverage', 'professional'],
    conversationPrompt: 'Create a complete scene with full coverage',
  },
  {
    id: 'vfx-enhancement',
    title: 'VFX Enhancement',
    description: 'Add special effects or enhance existing footage with AI',
    category: 'effects',
    difficulty: 'advanced',
    estimatedTime: '15-25 min',
    estimatedCredits: 360,
    thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400',
    tags: ['vfx', 'effects', 'enhancement'],
    conversationPrompt: 'I want to add effects to my footage',
  },
  {
    id: 'hybrid-workflow',
    title: 'Hybrid Workflow',
    description: 'Combine your uploaded footage with AI-generated shots seamlessly',
    category: 'hybrid',
    difficulty: 'intermediate',
    estimatedTime: '15-20 min',
    estimatedCredits: 300,
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
    tags: ['hybrid', 'upload', 'mix'],
    conversationPrompt: 'I want to mix my footage with AI shots',
  },
  {
    id: 'emotional-moment',
    title: 'Emotional Close-Up',
    description: 'Capture subtle emotional performances with detailed close-up shots',
    category: 'scenes',
    difficulty: 'beginner',
    estimatedTime: '5-10 min',
    estimatedCredits: 120,
    thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    tags: ['emotion', 'close-up', 'performance'],
    conversationPrompt: 'Create an emotional close-up scene',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreativePossibilitiesGallery({
  onStartExample,
  className = '',
}: CreativePossibilitiesGalleryProps) {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredExample, setHoveredExample] = useState<string | null>(null);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const filteredExamples = CREATIVE_EXAMPLES.filter(example => {
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

      {/* Examples Grid */}
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

      {/* Footer Tip */}
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
    </div>
  );
}

