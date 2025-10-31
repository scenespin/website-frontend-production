/**
 * Workflow Categories Configuration
 * 
 * Organizes workflows by category for mobile workflow selector.
 * This is a simplified, wrapper-compliant interface that hides provider complexity.
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
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
  quality: number;
  featured?: boolean;
  popularityScore?: number;
  tags?: string[];
  bestFor?: string[];
  examples?: string[];
  requiresVideoUpload?: boolean;
  videoUploadInstructions?: {
    title?: string;
    subtitle?: string;
    requirements?: string[];
    tips?: string[];
  };
}

/**
 * Workflows organized by category
 * These match the categories shown in MobileWorkflowSelector
 */
export const workflowsByCategory: Record<string, WorkflowDefinition[]> = {
  // Production Essentials
  production: [
    {
      id: 'complete-scene',
      name: 'Complete Scene',
      description: 'Generate a complete scene package with establishing shot + character/product coverage. All shots maintain perfect consistency.',
      category: 'production',
      cost: { min: 100, max: 550, unit: 'credits' },
      time: { min: 8, max: 15, unit: 'minutes' },
      quality: 5,
      featured: true,
      popularityScore: 100,
      tags: ['multi-shot', 'scene-builder', 'professional'],
      bestFor: [
        'Product advertisements with model',
        'Character showcase videos',
        'Commercial packages',
        'Professional video production'
      ],
      examples: [
        'Detective in rain-soaked alley + evidence photo → 7 scene-consistent shots',
        'Product showcase with lifestyle model → Professional commercial package'
      ]
    },
    {
      id: 'broll-master',
      name: 'B-Roll Master',
      description: 'Generate professional B-roll footage package for any scene. Perfect for enhancing your main footage.',
      category: 'production',
      cost: { min: 75, max: 150, unit: 'credits' },
      time: { min: 6, max: 10, unit: 'minutes' },
      quality: 4,
      tags: ['b-roll', 'supplemental', 'cinematic'],
      bestFor: [
        'Documentary filmmakers',
        'YouTube creators',
        'Corporate videos',
        'Event coverage'
      ],
      examples: [
        'Conference scene → Multiple audience reactions, speaker details',
        'Product launch → Various angles and detail shots'
      ]
    }
  ],

  // Photorealistic
  photorealistic: [
    {
      id: 'hollywood-standard',
      name: 'Hollywood Standard',
      description: 'Maximum quality photorealistic character generation. Professional-grade output with multiple angle variations.',
      category: 'photorealistic',
      cost: { min: 58, max: 258, unit: 'credits' },
      time: { min: 5, max: 10, unit: 'minutes' },
      quality: 5,
      featured: true,
      popularityScore: 95,
      tags: ['premium', 'professional', 'high-quality', 'cinematic'],
      bestFor: [
        'Feature films',
        'High-end commercials',
        'Professional trailers',
        'Client presentations'
      ],
      examples: [
        'Actor headshot → Multiple scene appearances',
        'Character concept → Movie-ready footage'
      ]
    }
  ],

  // Performance Capture
  'performance-capture': [
    {
      id: 'action-director-performance-capture',
      name: 'Action Performance Capture',
      description: 'Upload your action/stunt video and transfer it to any character style. Perfect for fight choreography, martial arts, and parkour.',
      category: 'performance-capture',
      cost: { min: 105, max: 135, unit: 'credits' },
      time: { min: 6, max: 10, unit: 'minutes' },
      quality: 5,
      featured: true,
      popularityScore: 92,
      tags: ['action', 'stunts', 'martial-arts', 'choreography'],
      bestFor: [
        'Stunt performers showcasing moves',
        'Martial artists creating demo reels',
        'Parkour athletes',
        'Fight choreographers'
      ],
      examples: [
        'Upload martial arts video → Character performs your moves',
        'Your parkour run → Animated character doing your stunts'
      ],
      requiresVideoUpload: true,
      videoUploadInstructions: {
        title: '🎬 Record Your Performance Video',
        subtitle: 'Your movements and expressions become the character',
        requirements: [
          'Film yourself performing the action/stunt',
          'Face the SAME direction as your target character will',
          'Take up similar screen space (not too far, not too close)'
        ],
        tips: [
          'Face same direction as character for best results',
          'Dynamic movements transfer beautifully'
        ]
      }
    },
    {
      id: 'anime-performance-capture',
      name: 'Anime Performance Capture',
      description: 'Upload your acting video and become your anime character. Your expressions and movements transfer to anime style.',
      category: 'performance-capture',
      cost: { min: 105, max: 140, unit: 'credits' },
      time: { min: 6, max: 10, unit: 'minutes' },
      quality: 5,
      popularityScore: 88,
      tags: ['anime', 'motion-transfer', 'vtuber'],
      bestFor: [
        'Content creators wanting anime personas',
        'VTubers with custom performances',
        'Voice actors performing as characters'
      ],
      examples: [
        'Upload acting video → Become anime character',
        'Your facial expressions → Anime version of you'
      ],
      requiresVideoUpload: true
    }
  ],

  // Animated
  animated: [
    {
      id: 'cartoon-classic',
      name: 'Cartoon Classic',
      description: 'Generate Pixar-style 2D cartoon character with bouncy, expressive animation. Perfect for kids content.',
      category: 'animated',
      cost: { min: 60, max: 160, unit: 'credits' },
      time: { min: 4, max: 8, unit: 'minutes' },
      quality: 5,
      tags: ['cartoon', 'pixar', '2d', 'expressive'],
      bestFor: [
        'Kids content creators',
        'Educational videos',
        'Comedy sketches',
        'Animated stories'
      ],
      examples: [
        'Character description → Pixar-style animation',
        'Funny character concept → Expressive cartoon'
      ]
    }
  ],

  // Budget / Fast
  budget: [
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Lightning-fast video generation for quick iterations and testing. Optimized for speed and cost.',
      category: 'budget',
      cost: { min: 35, max: 50, unit: 'credits' },
      time: { min: 2, max: 4, unit: 'minutes' },
      quality: 3,
      tags: ['fast', 'budget', 'quick', 'testing'],
      bestFor: [
        'Quick concept testing',
        'Budget-conscious creators',
        'High-volume content',
        'Social media posts'
      ],
      examples: [
        'Test multiple character designs quickly',
        'Generate placeholder footage fast'
      ]
    }
  ],

  // Fantasy
  fantasy: [
    {
      id: 'superhero-transform',
      name: 'Superhero Transformation',
      description: 'Transform ordinary person into superhero with powers and effects. Epic transformation sequence included.',
      category: 'fantasy',
      cost: { min: 120, max: 180, unit: 'credits' },
      time: { min: 8, max: 12, unit: 'minutes' },
      quality: 5,
      tags: ['superhero', 'transformation', 'vfx', 'powers'],
      bestFor: [
        'Superhero content creators',
        'Comic book adaptations',
        'Fantasy storytelling',
        'VFX showreels'
      ],
      examples: [
        'Regular person → Superhero with powers',
        'Origin story transformation sequence'
      ]
    }
  ]
};

/**
 * Get all workflows sorted by popularity
 */
export function getAllWorkflows(): WorkflowDefinition[] {
  const allWorkflows: WorkflowDefinition[] = [];
  Object.values(workflowsByCategory).forEach(workflows => {
    allWorkflows.push(...workflows);
  });
  return allWorkflows.sort((a, b) => 
    (b.popularityScore || 0) - (a.popularityScore || 0)
  );
}

/**
 * Get featured workflows (for quick access)
 */
export function getFeaturedWorkflows(): WorkflowDefinition[] {
  return getAllWorkflows()
    .filter(w => w.featured)
    .slice(0, 6);
}

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return getAllWorkflows().find(w => w.id === id);
}

