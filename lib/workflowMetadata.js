// ============================================================================
// WORKFLOW METADATA - Complete catalog of all 42 workflows
// ============================================================================
// Generated: October 30, 2025
// Source: WORKFLOW_WEBSITE_CONTENT_COMPELLING.md + COMPREHENSIVE_WORKFLOW_REFERENCE.md
// 
// This file contains ALL workflow metadata including:
// - Input requirements (text/images/video)
// - Character consistency support (optional vs required)
// - Credit costs and experience levels
// - Compelling descriptions and use cases
// ============================================================================

/**
 * @typedef {'text-only' | 'text-with-images' | 'video-transform'} InputType
 * @typedef {'create' | 'enhance' | 'transform' | 'extend' | 'multi-output'} WorkflowAction
 * @typedef {'generation' | 'post-production' | 'transform'} WorkflowType
 * @typedef {'beginner' | 'intermediate' | 'advanced'} ExperienceLevel
 * @typedef {'single' | 'multiple'} OutputType
 */

/**
 * @typedef {Object} InputRequirements
 * @property {boolean} requiresText
 * @property {boolean} requiresImages - TRUE if images are REQUIRED
 * @property {number} [minImages]
 * @property {number} [maxImages]
 * @property {boolean} requiresVideo - TRUE if video is REQUIRED
 * @property {boolean} supportsCharacterBank - TRUE if OPTIONAL Character Bank supported
 */

/**
 * @typedef {Object} WorkflowMetadata
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {InputType} inputType
 * @property {InputRequirements} inputRequirements
 * @property {WorkflowType} workflowType
 * @property {WorkflowAction} action
 * @property {ExperienceLevel} experienceLevel
 * @property {OutputType} outputType
 * @property {string} heroDescription
 * @property {string} whatItDoes
 * @property {string[]} perfectFor
 * @property {string} proTip
 * @property {{min: number, max: number}} creditRange
 * @property {string[]} tags
 * @property {number} stars - 1-5 rating
 * @property {number} categoryOrder
 * @property {number} subcategoryOrder
 */

// ============================================================================
// TEXT ONLY - GENERATION (18 workflows)
// IMPORTANT: All work from text alone BUT support optional Character Bank
// ============================================================================

export const WORKFLOW_METADATA = {
  // ==========================================================================
  // 1. PHOTOREALISTIC / LIVE-ACTION (6 workflows)
  // ==========================================================================
  
  'hollywood-standard': {
    id: 'hollywood-standard',
    name: 'Hollywood Standard',
    slug: 'hollywood-standard',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true, // OPTIONAL
    },
    action: 'create',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'The gold standard for professional video production. Multi-step processing delivers cinema-grade quality that rivals traditional film production—at a fraction of the cost.',
    whatItDoes: 'This premium workflow runs your video through multiple AI enhancement stages, progressively improving quality, resolution, and cinematic appeal. The result? Professional-grade footage with advanced upscaling, refined details, and Hollywood-level polish.',
    perfectFor: [
      'Final client deliverables and presentations',
      'Commercial advertising and branded content',
      'Film festival submissions and portfolio pieces',
      'Any project where quality cannot be compromised',
      'YouTube creators wanting broadcast-quality content',
    ],
    proTip: 'Use this workflow for your hero shots and key moments. Pair with Budget Photorealistic for B-roll to maximize your credits while maintaining premium quality where it counts.',
    creditRange: { min: 75, max: 150 },
    tags: ['text-only', 'single-output', 'quality-premium', 'photorealistic', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 1,
    subcategoryOrder: 1,
  },

  'budget-photorealistic': {
    id: 'budget-photorealistic',
    name: 'Budget Photorealistic',
    slug: 'budget-photorealistic',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Professional photorealistic quality without breaking the bank. Fast, efficient, and perfect for high-volume content creation.',
    whatItDoes: 'Optimized for speed and cost-efficiency without sacrificing quality. This workflow uses intelligent processing to deliver photorealistic results in a fraction of the time and credits of premium workflows.',
    perfectFor: [
      'Social media content at scale',
      'Rapid prototyping and concept testing',
      'B-roll footage and establishing shots',
      'YouTube videos where volume matters',
      'Testing ideas before committing to premium quality',
    ],
    proTip: 'Perfect for creating 10-20 shots quickly for a montage or multi-scene project. Generate your entire storyboard in Budget mode, then upgrade only your best 2-3 shots to Hollywood Standard.',
    creditRange: { min: 35, max: 50 },
    tags: ['text-only', 'single-output', 'budget-friendly', 'fastest', 'photorealistic', 'generation', 'character-consistency-optional'],
    stars: 4,
    categoryOrder: 1,
    subcategoryOrder: 2,
  },

  'multi-platform-hero': {
    id: 'multi-platform-hero',
    name: 'Multi-Platform Hero',
    slug: 'multi-platform-hero',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
      minImages: 0,
      maxImages: 3, // Veo-specific workflow
    },
    action: 'multi-output',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'Generate once, conquer everywhere. One video automatically optimized for every social platform with intelligent reframing.',
    whatItDoes: 'This breakthrough workflow analyzes your video\'s focal points and automatically reframes it for YouTube (16:9), TikTok/Reels (9:16), and Instagram (1:1)—all from a single generation.',
    perfectFor: [
      'Content creators managing multiple platforms',
      'Marketing teams with cross-platform campaigns',
      'Agencies creating social media packages',
      'Anyone posting to Instagram, TikTok, AND YouTube',
      'Time-crunched creators who need efficiency',
    ],
    proTip: 'Generate one landscape video and get all three formats instantly. This saves 60% on credits versus generating three separate videos.',
    creditRange: { min: 100, max: 125 },
    tags: ['text-only', 'multi-output', 'multi-platform', 'social-media', 'generation', 'character-consistency-optional', 'needs-images-veo'],
    stars: 5,
    categoryOrder: 1,
    subcategoryOrder: 3,
  },

  'precision-poser': {
    id: 'precision-poser',
    name: 'Precision Poser',
    slug: 'precision-poser',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Perfect control over character positioning and poses. Direct your AI actors with frame-by-frame precision using keyframe-based guidance.',
    whatItDoes: 'Upload reference poses or describe exact positioning, and the AI will match it precisely. This workflow uses advanced pose detection and keyframe technology to give you director-level control over character positioning.',
    perfectFor: [
      'Choreographed dance sequences and performances',
      'Product demonstrations requiring specific hand positions',
      'Athletic movements and sports action',
      'Matching reference footage or storyboards',
      'Any scene requiring precise body positioning',
    ],
    proTip: 'Combine with Character Bank for consistent characters performing exact poses across multiple scenes.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'photorealistic', 'generation', 'character-consistency-optional'],
    stars: 4,
    categoryOrder: 1,
    subcategoryOrder: 4,
  },

  'cinematic-camera-suite': {
    id: 'cinematic-camera-suite',
    name: 'Cinematic Camera Suite',
    slug: 'cinematic-camera-suite',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Professional cinematography, automated. Generate the same scene with 5 different camera movements—from static lock-offs to sweeping crane shots.',
    whatItDoes: 'This workflow is like hiring a full camera crew. It generates your scene with multiple professional camera techniques: static shots, dolly movements, crane shots, tracking shots, and orbits.',
    perfectFor: [
      'Directors previewing shot options before committing',
      'Client presentations with multiple choices',
      'Finding the perfect camera movement for each scene',
      'Film students learning cinematography principles',
      'Creating dynamic shot variety without reshooting',
    ],
    proTip: 'Use this to test different camera movements during pre-production. Once you find your favorite style, use it consistently across your project.',
    creditRange: { min: 90, max: 110 },
    tags: ['text-only', 'multi-output', 'quality-premium', 'photorealistic', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 1,
    subcategoryOrder: 5,
  },

  'scene-composer': {
    id: 'scene-composer',
    name: 'Scene Composer',
    slug: 'scene-composer',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Automatic application of professional composition rules. Every frame follows the Rule of Thirds, Golden Ratio, and leading lines.',
    whatItDoes: 'This intelligent workflow analyzes your scene and automatically applies classical composition principles that have guided filmmakers for a century.',
    perfectFor: [
      'Creating visually stunning establishing shots',
      'Commercial advertising requiring perfect composition',
      'Architectural and landscape cinematography',
      'Educational content demonstrating composition principles',
      'Any project where visual aesthetics are paramount',
    ],
    proTip: 'Perfect for portfolio pieces and showreel content. These professionally composed shots elevate your work and demonstrate sophisticated visual storytelling.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'quality-premium', 'photorealistic', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 1,
    subcategoryOrder: 6,
  },

  // ==========================================================================
  // 2. ANIMATED (3 workflows)
  // ==========================================================================

  'anime-master': {
    id: 'anime-master',
    name: 'Anime Master',
    slug: 'anime-master',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Authentic anime-style animation with consistent art direction. Create studio-quality anime characters and scenes.',
    whatItDoes: 'Generate genuine anime aesthetics with all the hallmarks of Japanese animation: expressive eyes, dynamic hair movement, characteristic shading techniques, and that signature anime art style.',
    perfectFor: [
      'Anime content creators and webtoon artists',
      'Visual novel developers and indie game studios',
      'YouTube anime reviewers and creators',
      'Music videos with anime aesthetics',
      'Anyone building an anime-style project',
    ],
    proTip: 'Upload 2-3 reference images of your character to maintain perfect consistency across all your anime scenes.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'animation', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 2,
    subcategoryOrder: 1,
  },

  'cartoon-classic': {
    id: 'cartoon-classic',
    name: 'Cartoon Classic',
    slug: 'cartoon-classic',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Western cartoon charm with exaggerated expressions and vibrant energy. Think classic Saturday morning cartoons meets modern animation technology.',
    whatItDoes: 'This workflow specializes in that beloved Western animation style: bold lines, expressive faces, exaggerated movements, and vibrant color palettes.',
    perfectFor: [
      'Children\'s content and educational videos',
      'Comedy sketches and parody content',
      'Explainer videos with personality',
      'Brand mascots and character animation',
      'Projects requiring family-friendly aesthetics',
    ],
    proTip: 'This style shines for comedic timing and exaggerated reactions. Perfect for memes, reaction videos, and comedy skits.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'animation', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 2,
    subcategoryOrder: 2,
  },

  '3d-character': {
    id: '3d-character',
    name: '3D Character',
    slug: '3d-character',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Pixar-quality 3D animated characters with professional lighting and rendering.',
    whatItDoes: 'High-end 3D character animation that rivals major studios. Professional subsurface scattering, realistic lighting, and cinematic depth.',
    perfectFor: [
      'Professional animation projects',
      'Gaming cinematics and trailers',
      'Premium brand content',
      'Educational content with 3D characters',
      'Indie films requiring 3D animation',
    ],
    proTip: 'The quality rivals Pixar. Use this for your hero character moments and premium deliverables.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'animation', 'quality-premium', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 2,
    subcategoryOrder: 3,
  },

  // Continue with remaining TEXT-ONLY workflows...
  
  'fantasy-epic': {
    id: 'fantasy-epic',
    name: 'Fantasy Epic',
    slug: 'fantasy-epic',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Build immersive fantasy worlds with mythical creatures, magical effects, and otherworldly environments.',
    whatItDoes: 'Specializes in fantasy and magical content with VFX-level quality: glowing magic effects, mythical creatures with realistic textures, enchanted environments with atmospheric lighting.',
    perfectFor: [
      'Fantasy storytelling and world-building',
      'RPG and gaming content creation',
      'Book trailers for fantasy novels',
      'Music videos with magical aesthetics',
      'Any project requiring supernatural elements',
    ],
    proTip: 'Fantasy content has massive audience appeal. Use this to create eye-catching content that stands out in crowded social feeds.',
    creditRange: { min: 100, max: 125 },
    tags: ['text-only', 'single-output', 'fantasy', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 4,
    subcategoryOrder: 1,
  },

  'superhero-transform': {
    id: 'superhero-transform',
    name: 'Superhero Transform',
    slug: 'superhero-transform',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Epic transformation sequences with power effects, energy auras, and dramatic reveals.',
    whatItDoes: 'Generate dramatic superhero transformation sequences: characters powering up with energy auras, costume changes mid-action, eyes glowing with power.',
    perfectFor: [
      'Superhero content and parodies',
      'Transformation sequences and power-ups',
      'Fitness content with dramatic flair',
      'Gaming content showing character upgrades',
      'Motivational content with epic visuals',
    ],
    proTip: 'Superhero content is perennially popular. Use this workflow to add cinematic flair to any content.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'action', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 4,
    subcategoryOrder: 2,
  },

  'animal-kingdom': {
    id: 'animal-kingdom',
    name: 'Animal Kingdom',
    slug: 'animal-kingdom',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Realistic animal characters with natural behaviors and lifelike movements.',
    whatItDoes: 'Generate photorealistic animals with accurate anatomy, natural behaviors, realistic fur/feather/scale textures, and convincing movements.',
    perfectFor: [
      'Wildlife and nature content',
      'Educational videos about animals',
      'Pet product marketing and demonstrations',
      'Realistic animal characters in narratives',
      'Conservation and environmental storytelling',
    ],
    proTip: 'Animal content has universal appeal and high shareability. Wildlife and pet videos consistently rank among the most-viewed content online.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 5,
    subcategoryOrder: 1,
  },

  'anthro-character': {
    id: 'anthro-character',
    name: 'Anthro Character',
    slug: 'anthro-character',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Anthropomorphic animal characters with human expressions and gestures. Think Zootopia or Kung Fu Panda.',
    whatItDoes: 'Create charming anthropomorphic characters that blend animal features with human expressiveness. These characters walk upright, gesture with paws/wings, display human emotions.',
    perfectFor: [
      'Children\'s content and family entertainment',
      'Brand mascots and character marketing',
      'Animated storytelling with animal protagonists',
      'Educational content making animals relatable',
      'Fantasy and fable-based narratives',
    ],
    proTip: 'Anthro characters are less threatening than humans for children\'s content while being more expressive than realistic animals.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'animation', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 5,
    subcategoryOrder: 2,
  },

  'micro-action-loop': {
    id: 'micro-action-loop',
    name: 'Micro Action Loop',
    slug: 'micro-action-loop',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Perfect short looping clips for social media, GIFs, and eye-catching moments.',
    whatItDoes: 'Creates short (2-5 second), seamlessly looping action clips optimized for social media. These loops are mathematically perfect—the end frame flows naturally back to the start frame.',
    perfectFor: [
      'Instagram posts and profile videos',
      'Twitter/X header videos and GIFs',
      'Discord and Slack animations',
      'Product showcases and demonstrations',
      'Background loops and ambiance',
    ],
    proTip: 'Social feeds auto-play videos on loop. These clips are designed to look good looping, maximizing watch time and engagement.',
    creditRange: { min: 20, max: 30 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'social-media', 'generation', 'character-consistency-optional'],
    stars: 4,
    categoryOrder: 6,
    subcategoryOrder: 2,
  },

  'perfect-loop-generator': {
    id: 'perfect-loop-generator',
    name: 'Perfect Loop Generator',
    slug: 'perfect-loop-generator',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Mathematically perfect seamless loops where the end frame matches the start frame exactly.',
    whatItDoes: 'Uses advanced motion prediction to ensure absolute seamlessness. The last frame and first frame are identical, creating a truly infinite loop with zero jarring.',
    perfectFor: [
      'Website header backgrounds',
      'Digital signage and exhibition displays',
      'Meditation and relaxation content',
      'Loading screens and waiting loops',
      'Live stream backgrounds',
    ],
    proTip: 'These loops are so seamless, viewers won\'t realize they\'re watching repeated content.',
    creditRange: { min: 35, max: 50 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'generation', 'character-consistency-optional'],
    stars: 4,
    categoryOrder: 6,
    subcategoryOrder: 3,
  },

  'budget-loop-2': {
    id: 'budget-loop-2',
    name: 'Budget Loop 2',
    slug: 'budget-loop-2',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Additional budget-friendly loop option for bulk content creation.',
    whatItDoes: 'Alternative budget loop workflow optimized for volume. When you need 10-20 loops for various purposes and want to stretch your credits.',
    perfectFor: [
      'Bulk content creation for multiple projects',
      'Testing loop concepts before upgrading',
      'Background content where perfection isn\'t critical',
      'Building a large library of loopable assets',
      'Maximizing credit efficiency',
    ],
    proTip: 'Build your loop library with this workflow, then use Perfect Loop Generator for your hero loops.',
    creditRange: { min: 18, max: 28 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'fastest', 'generation', 'character-consistency-optional'],
    stars: 3,
    categoryOrder: 6,
    subcategoryOrder: 4,
  },

  'speed-loop-v2': {
    id: 'speed-loop-v2',
    name: 'Speed Loop V2',
    slug: 'speed-loop-v2',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Alternative ultra-fast loop generation balancing speed with quality.',
    whatItDoes: 'Different algorithm from Speed Demon, optimized specifically for looping content. Faster than Perfect Loop Generator, higher quality than Budget Loop.',
    perfectFor: [
      'Rapid loop prototyping',
      'Time-sensitive loop needs',
      'Testing loop concepts',
      'Building draft loop libraries',
      'Content that doesn\'t need perfect seamlessness',
    ],
    proTip: 'Use this for testing and drafts, then regenerate your best performers with Perfect Loop Generator for final versions.',
    creditRange: { min: 18, max: 28 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'fastest', 'generation', 'character-consistency-optional'],
    stars: 3,
    categoryOrder: 6,
    subcategoryOrder: 5,
  },

  'speed-demon': {
    id: 'speed-demon',
    name: 'Speed Demon',
    slug: 'speed-demon',
    inputType: 'text-only',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: false,
      supportsCharacterBank: true,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'Ultra-fast generation in under 2 minutes. Works from text alone or add Character Bank for consistency.',
    whatItDoes: 'Optimized for pure speed. Generate from text description only, or optionally add 1-2 Character Bank images for consistent character appearance.',
    perfectFor: [
      'Rapid prototyping and concept testing',
      'Time-sensitive trending content',
      'Storyboarding and pre-visualization',
      'Beginners with no assets',
      'Testing ideas before committing credits',
    ],
    proTip: 'Start with text-only to test concepts quickly. Once you find your style, add Character Bank images to maintain consistency across a series.',
    creditRange: { min: 15, max: 25 },
    tags: ['text-only', 'single-output', 'budget-friendly', 'fastest', 'generation', 'character-consistency-optional'],
    stars: 3,
    categoryOrder: 6,
    subcategoryOrder: 1,
  },

  // ==========================================================================
  // TEXT + IMAGES - CHARACTER CONSISTENCY REQUIRED (14 workflows)
  // ==========================================================================

  'action-director': {
    id: 'action-director',
    name: 'Action Director',
    slug: 'action-director',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true, // REQUIRED
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false, // Not optional - REQUIRED
    },
    action: 'multi-output',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'Multi-angle action sequences with perfect character consistency across all shots.',
    whatItDoes: 'Generate the same action moment from 3 different camera angles while maintaining perfect character consistency. It\'s like having 3 cameras filming your scene simultaneously.',
    perfectFor: [
      'Action movie trailers',
      'Sports highlights with coverage',
      'Series with consistent characters',
      'Professional action content',
      'Multi-angle storytelling',
    ],
    proTip: 'Upload 1-2 clear character images (front view + 3/4 angle) to ensure consistency across all 3 camera angles.',
    creditRange: { min: 200, max: 250 },
    tags: ['needs-images', 'multi-angle', 'character-consistency-required', 'action', 'generation'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 1,
  },

  // Continue adding remaining CHARACTER-REQUIRED workflows...
  
  'style-chameleon': {
    id: 'style-chameleon',
    name: 'Style Chameleon',
    slug: 'style-chameleon',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'One scene, five artistic interpretations. Generate the same moment in multiple art styles.',
    whatItDoes: 'This workflow generates your scene in 5 dramatically different visual styles—from photorealistic to anime to oil painting to cyberpunk. Each version maintains the same composition and action.',
    perfectFor: [
      'Client presentations requiring style options',
      'Finding the perfect visual aesthetic for a project',
      'Creating art that shifts between styles',
      'Portfolio pieces showcasing versatility',
      'Music videos with style-changing sequences',
    ],
    proTip: 'Use this during pre-production to test which visual style best serves your story.',
    creditRange: { min: 300, max: 400 },
    tags: ['needs-images', 'multi-output', 'character-consistency-required', 'generation'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 3,
  },

  'reverse-action-builder': {
    id: 'reverse-action-builder',
    name: 'Reverse Action Builder',
    slug: 'reverse-action-builder',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'extend',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Build backwards from your climax. Start with the dramatic finale and let AI generate the buildup.',
    whatItDoes: 'Define the epic END moment, and the AI generates the action leading up to it. Perfect for trailers and teasers.',
    perfectFor: [
      'Movie trailers building to climactic moments',
      'Product reveals with dramatic buildup',
      'Mystery content working backward from reveals',
      'Music video climaxes and drop moments',
      'Any narrative benefiting from suspense and buildup',
    ],
    proTip: 'Great for creating trailer-style content. Define your money shot, then let AI create the tension.',
    creditRange: { min: 85, max: 100 },
    tags: ['needs-images', 'single-output', 'character-consistency-required', 'generation'],
    stars: 4,
    categoryOrder: 3,
    subcategoryOrder: 4,
  },

  'bidirectional-storytelling': {
    id: 'bidirectional-storytelling',
    name: 'Bidirectional Storytelling',
    slug: 'bidirectional-storytelling',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'extend',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'Tell stories in both directions from a single pivotal moment.',
    whatItDoes: 'Start with a single crucial moment and this workflow generates both the backstory leading to it and the consequences following it.',
    perfectFor: [
      'Complex narratives with flashbacks and flash-forwards',
      'Before/after transformation sequences',
      'Decision-point storytelling showing consequences',
      'Time-loop and time-travel content',
      'Music videos with non-linear narratives',
    ],
    proTip: 'Perfect for creating sophisticated storytelling that feels more like cinema than YouTube.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-images', 'multi-output', 'character-consistency-required', 'generation'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 5,
  },

  'voice-actor-match': {
    id: 'voice-actor-match',
    name: 'Voice Actor Match',
    slug: 'voice-actor-match',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'create',
    experienceLevel: 'advanced',
    outputType: 'single',
    heroDescription: 'Character dialogue with perfect lip-sync, facial animation, and emotional performance.',
    whatItDoes: 'This groundbreaking workflow generates characters speaking your dialogue with perfectly synchronized lip movements, appropriate facial expressions, and natural delivery.',
    perfectFor: [
      'Explainer videos and educational content',
      'Character-driven narratives and short films',
      'Corporate spokesperson videos without hiring talent',
      'Podcast visualization and audio-to-video conversion',
      'Any project requiring talking characters',
    ],
    proTip: 'Game-changer for solo creators. Create entire character dialogues without recording equipment or voice actors.',
    creditRange: { min: 400, max: 500 },
    tags: ['needs-images', 'single-output', 'dialogue-generation', 'character-consistency-required', 'generation'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 6,
  },

  'production-pipeline': {
    id: 'production-pipeline',
    name: 'Production Pipeline',
    slug: 'production-pipeline',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'The complete Hollywood workflow automated. From script to final edit with professional color grading.',
    whatItDoes: 'This enterprise-level workflow handles the entire production pipeline: character generation, scene composition, professional transitions, color grading, and post-production polish.',
    perfectFor: [
      'High-end client work requiring fast turnaround',
      'Complex multi-shot sequences and narratives',
      'Agency work with premium production standards',
      'Film festival submissions and portfolio pieces',
      'Anyone needing broadcast-quality results quickly',
    ],
    proTip: 'The ultimate workflow for professional creators who need to deliver studio-quality work on aggressive timelines.',
    creditRange: { min: 500, max: 750 },
    tags: ['needs-images', 'multi-output', 'quality-premium', 'character-consistency-required', 'generation'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 7,
  },

  'multi-platform-loop': {
    id: 'multi-platform-loop',
    name: 'Multi-Platform Loop',
    slug: 'multi-platform-loop',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'One perfect loop, automatically optimized for every social platform.',
    whatItDoes: 'Combines seamless looping with multi-platform optimization. Generate one loop and get versions for YouTube, TikTok, Instagram—all maintaining perfect loop seamlessness.',
    perfectFor: [
      'Social media managers posting to multiple platforms',
      'Product showcases needing platform coverage',
      'Brand animations for cross-platform consistency',
      'Content creators maximizing reach',
      'Time-efficient multi-platform strategies',
    ],
    proTip: 'Maximum efficiency: one generation gives you content for 3-4 platforms.',
    creditRange: { min: 40, max: 55 },
    tags: ['needs-images', 'multi-output', 'multi-platform', 'looping', 'social-media', 'character-consistency-required', 'generation'],
    stars: 4,
    categoryOrder: 3,
    subcategoryOrder: 8,
  },

  'loop-variations': {
    id: 'loop-variations',
    name: 'Loop Variations',
    slug: 'loop-variations',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'Generate 5 style variations of the same loop. Test different moods and aesthetics.',
    whatItDoes: 'Creates 5 versions of the same looping concept with different stylistic treatments: different color grading, lighting moods, camera movements, or artistic styles.',
    perfectFor: [
      'Finding the perfect mood for a scene',
      'Client presentations with multiple options',
      'A/B testing different aesthetics',
      'Building a variety pack of similar content',
      'Exploring style options efficiently',
    ],
    proTip: 'Great for learning what resonates with your audience. Post all 5 variations and track which gets the best engagement.',
    creditRange: { min: 150, max: 200 },
    tags: ['needs-images', 'multi-output', 'looping', 'character-consistency-required', 'generation'],
    stars: 4,
    categoryOrder: 3,
    subcategoryOrder: 9,
  },

  'genre-camera-variants': {
    id: 'genre-camera-variants',
    name: 'Genre Camera Variants',
    slug: 'genre-camera-variants',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Same scene shot in 5 different genre styles—horror, action, drama, comedy, documentary.',
    whatItDoes: 'Generates your scene with genre-specific cinematography: horror uses unsettling Dutch angles, action employs dynamic movement, drama features intimate push-ins.',
    perfectFor: [
      'Matching cinematography to your project\'s genre',
      'Film school education and cinematography study',
      'Client presentations showing tonal options',
      'Finding the perfect camera style for your story',
      'Understanding how technique affects emotion',
    ],
    proTip: 'Fascinating for learning how much cinematography affects storytelling.',
    creditRange: { min: 250, max: 350 },
    tags: ['needs-images', 'multi-output', 'character-consistency-required', 'client-work', 'generation'],
    stars: 5,
    categoryOrder: 7,
    subcategoryOrder: 3,
  },

  'shot-type-variants': {
    id: 'shot-type-variants',
    name: 'Shot Type Variants',
    slug: 'shot-type-variants',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Complete coverage from one generation: wide, medium, close-up, and more.',
    whatItDoes: 'Generates your scene in all standard shot types: establishing wide shot, medium shot, close-up, over-the-shoulder, POV, insert shots, and reaction shots.',
    perfectFor: [
      'Professional productions requiring editorial flexibility',
      'Creating dynamically edited sequences',
      'Having options for pacing adjustments',
      'Building shot libraries for projects',
      'Simulating multi-camera shoots',
    ],
    proTip: 'Essential for creating content that needs to be cut and edited dynamically.',
    creditRange: { min: 250, max: 350 },
    tags: ['needs-images', 'multi-output', 'character-consistency-required', 'client-work', 'generation'],
    stars: 5,
    categoryOrder: 7,
    subcategoryOrder: 4,
  },

  'b-roll-master': {
    id: 'b-roll-master',
    name: 'B-Roll Master',
    slug: 'b-roll-master',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'Professional B-roll package: establishing shots, cutaways, environmental details.',
    whatItDoes: 'Generates a complete B-roll package for your main content: establishing shots, cutaway shots, environmental details, and atmospheric footage.',
    perfectFor: [
      'Documentary and narrative projects',
      'YouTube videos needing visual variety',
      'Corporate videos requiring production polish',
      'Tutorial content with insert shots',
      'Any project that benefits from cutaway footage',
    ],
    proTip: 'B-roll makes the difference between amateur and professional content.',
    creditRange: { min: 200, max: 300 },
    tags: ['needs-images', 'multi-output', 'character-consistency-required', 'client-work', 'generation'],
    stars: 5,
    categoryOrder: 7,
    subcategoryOrder: 5,
  },

  'coverage-master': {
    id: 'coverage-master',
    name: 'Coverage Master',
    slug: 'coverage-master',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'TV/film-standard coverage: master shot, OTS angles, close-ups, and reaction shots.',
    whatItDoes: 'Generates complete professional coverage for dialogue scenes: master shot, over-the-shoulder angles, close-ups, and reaction shots.',
    perfectFor: [
      'Dialogue scenes and conversations',
      'Interview-style content with multiple angles',
      'Dramatic scenes requiring emotional coverage',
      'Professional narrative projects',
      'Content requiring professional production standards',
    ],
    proTip: 'Study how professional films cut dialogue scenes—this workflow gives you all those shot types automatically.',
    creditRange: { min: 300, max: 400 },
    tags: ['needs-images', 'multi-output', 'quality-premium', 'character-consistency-required', 'client-work', 'generation'],
    stars: 5,
    categoryOrder: 7,
    subcategoryOrder: 6,
  },

  'scene-variants': {
    id: 'scene-variants',
    name: 'Scene Variants',
    slug: 'scene-variants',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 2,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'intermediate',
    outputType: 'multiple',
    heroDescription: 'Multiple variations of the same scene: different lighting, time of day, weather, and mood.',
    whatItDoes: 'Generates your scene in multiple variations: golden hour sunlight, moody overcast, dramatic night lighting, bright midday.',
    perfectFor: [
      'Client presentations with options',
      'Finding the perfect mood for a scene',
      'Exploring atmospheric options',
      'Time-of-day storytelling (morning vs. night)',
      'Weather and lighting tests',
    ],
    proTip: 'Lighting and weather dramatically affect emotional tone. Use this to find which atmospheric condition best serves your story.',
    creditRange: { min: 250, max: 350 },
    tags: ['needs-images', 'multi-output', 'character-consistency-required', 'generation'],
    stars: 4,
    categoryOrder: 7,
    subcategoryOrder: 7,
  },

  'reality-to-toon': {
    id: 'reality-to-toon',
    name: 'Reality-to-Toon',
    slug: 'reality-to-toon',
    inputType: 'text-with-images',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 3, // Veo-specific
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'advanced',
    outputType: 'single',
    heroDescription: 'Transform live-action reference to animated style while preserving motion and character.',
    whatItDoes: 'Upload reference images and describe your desired animation style. The AI transforms your real-world reference into any animated aesthetic you choose.',
    perfectFor: [
      'Music videos mixing live-action and animation',
      'Rotoscoping-style content without manual work',
      'Converting footage to artistic styles',
      'Motion-preserving style transfers',
      'Hybrid documentary-animation projects',
    ],
    proTip: 'This is perfect for "A-ha Take On Me" style music videos or documentary work that blends reality with animation.',
    creditRange: { min: 125, max: 150 },
    tags: ['needs-images', 'needs-images-veo', 'single-output', 'character-consistency-required', 'animation', 'transform'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 2,
  },

  // ==========================================================================
  // VIDEO TRANSFORM - POST-PRODUCTION (2 workflows)
  // ==========================================================================

  'scene-bridge': {
    id: 'scene-bridge',
    name: 'Scene Bridge',
    slug: 'scene-bridge',
    inputType: 'video-transform',
    workflowType: 'post-production',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true, // REQUIRED
      supportsCharacterBank: false,
    },
    action: 'extend',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Generate seamless transitions between two existing video clips.',
    whatItDoes: 'Upload two video clips and the AI generates a smooth transition that bridges them. Perfect for creating continuous narratives from separate shots.',
    perfectFor: [
      'Connecting disparate footage into sequences',
      'Creating smooth montages',
      'Building narrative flow',
      'Fixing continuity gaps',
      'Professional editing workflows',
    ],
    proTip: 'Works best when both clips share similar lighting and color grading. Use for seamless scene transitions.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'single-output', 'post-production', 'extend'],
    stars: 4,
    categoryOrder: 7,
    subcategoryOrder: 1,
  },

  'video-chain-builder': {
    id: 'video-chain-builder',
    name: 'Video Chain Builder',
    slug: 'video-chain-builder',
    inputType: 'video-transform',
    workflowType: 'post-production',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'extend',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Chain multiple videos together with consistent style and flow.',
    whatItDoes: 'Upload a series of clips and the AI intelligently connects them while maintaining visual consistency, pacing, and narrative flow.',
    perfectFor: [
      'Music video compilation',
      'Documentary sequences',
      'Multi-shot narratives',
      'Montage creation',
      'Series production',
    ],
    proTip: 'Upload clips in the order you want them to appear. The AI will handle transitions and style consistency.',
    creditRange: { min: 200, max: 300 },
    tags: ['needs-video', 'multi-output', 'post-production', 'extend'],
    stars: 5,
    categoryOrder: 7,
    subcategoryOrder: 2,
  },

  // ==========================================================================
  // VIDEO TRANSFORM - PERFORMANCE CAPTURE (8 workflows)
  // ==========================================================================

  'anime-performance-capture': {
    id: 'anime-performance-capture',
    name: 'Anime Performance Capture',
    slug: 'anime-performance-capture',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Upload your performance video, get anime-style output with your movements.',
    whatItDoes: 'Film yourself acting out a scene, then transform your performance into authentic anime-style animation. Your movements, expressions, and timing are preserved in anime form.',
    perfectFor: [
      'VTubers and virtual content creators',
      'Anime music video creators',
      'Performance-based anime content',
      'Motion-captured anime',
      'Webcam-to-anime workflows',
    ],
    proTip: 'Film with good lighting and exaggerate your expressions slightly—anime thrives on expressive acting.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'performance-capture', 'animation', 'single-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 1,
  },


  '3d-performance-capture': {
    id: '3d-performance-capture',
    name: '3D Performance Capture',
    slug: '3d-performance-capture',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Real performance, 3D animation output. Create Pixar-style animation from your acting.',
    whatItDoes: 'Transform real-world performances into high-quality 3D animation. Upload yourself performing, get a 3D animated character performing those exact movements.',
    perfectFor: [
      '3D animation without animation expertise',
      'Game cutscenes and cinematics',
      'Animated explainer content',
      'Virtual character performances',
      'Premium animated content',
    ],
    proTip: 'Film the performance you want, upload it, and get professional 3D animation instantly. Democratizes high-end 3D animation for solo creators.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'performance-capture', 'animation', 'single-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 2,
  },

  'cartoon-performance-capture': {
    id: 'cartoon-performance-capture',
    name: 'Cartoon Performance Capture',
    slug: 'cartoon-performance-capture',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Transform your acting into classic cartoon style. Real performance meets Western animation charm.',
    whatItDoes: 'Upload your performance video, get it back as Western cartoon animation. Your original timing and acting choices are preserved, but with that classic cartoon look.',
    perfectFor: [
      'Comedy content with cartoon aesthetics',
      'Educational videos with animated hosts',
      'Children\'s content with performer input',
      'Comedy sketches in cartoon form',
      'Personable animated content',
    ],
    proTip: 'Great for comedians and performers who want animation\'s visual freedom while keeping their performance timing intact.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'performance-capture', 'animation', 'single-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 3,
  },

  'anthro-performance-capture': {
    id: 'anthro-performance-capture',
    name: 'Anthro Performance Capture',
    slug: 'anthro-performance-capture',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Become an anthropomorphic animal character. Upload your performance, get talking animal version.',
    whatItDoes: 'Transform yourself into an anthro animal character while preserving your performance. Film yourself acting, specify what animal you want to be, and get back that character performing your exact movements.',
    perfectFor: [
      'Furry content creators',
      'Animal mascot performances',
      'Children\'s content with animal characters',
      'Brand mascot videos',
      'Character performances with animal appeal',
    ],
    proTip: 'Great for creating consistent animal character content where you need that character to perform specific actions or deliver specific lines.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'performance-capture', 'animation', 'single-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 4,
  },

  'action-director-performance': {
    id: 'action-director-performance',
    name: 'Action Director Performance',
    slug: 'action-director-performance',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Upload one action performance, get multi-angle coverage automatically. Film once, get professional action coverage.',
    whatItDoes: 'Upload your action performance (fight, dance, athletics), and this workflow generates that same action from multiple camera angles with perfect timing synchronization.',
    perfectFor: [
      'Action choreography from real performances',
      'Dance videos with multi-angle coverage',
      'Athletic highlights with coverage',
      'Martial arts demonstrations',
      'Any performance benefiting from multiple angles',
    ],
    proTip: 'Film yourself performing the action once, then let AI generate the coverage. Edit between angles for professional-looking dynamic sequences.',
    creditRange: { min: 300, max: 400 },
    tags: ['needs-video', 'performance-capture', 'multi-angle', 'action', 'multi-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 5,
  },

  'reality-to-toon-performance': {
    id: 'reality-to-toon-performance',
    name: 'Reality-to-Toon Performance',
    slug: 'reality-to-toon-performance',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'advanced',
    outputType: 'single',
    heroDescription: 'Hybrid workflow combining live-action with animated transformation. Upload performance, get reality-animation blend.',
    whatItDoes: 'Takes your live-action performance and creates a hybrid effect where it transforms between realistic and animated styles, or blends both aesthetics.',
    perfectFor: [
      'Music videos with stylistic variety',
      'Creative transitions between aesthetics',
      'Art pieces exploring medium boundaries',
      'Hybrid storytelling combining realism and animation',
      'Visually experimental content',
    ],
    proTip: 'Extremely eye-catching. The transformation between real and animated naturally grabs attention and creates memorable visual moments.',
    creditRange: { min: 125, max: 150 },
    tags: ['needs-video', 'performance-capture', 'animation', 'single-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 6,
  },

  'complete-scene-performance': {
    id: 'complete-scene-performance',
    name: 'Complete Scene Performance',
    slug: 'complete-scene-performance',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Upload performance, get complete scene package with character consistency and coverage.',
    whatItDoes: 'The most comprehensive performance workflow: upload your acting, get back a complete scene with character consistency maintained, multiple camera angles, and professional coverage.',
    perfectFor: [
      'Professional productions with real performances',
      'Complex scenes requiring coverage',
      'High-end content with performance foundation',
      'Projects needing editorial flexibility',
      'Performance-driven narratives',
    ],
    proTip: 'Ultimate workflow for performance-based content. Upload your best acting take, receive a fully produced scene with all the coverage you need.',
    creditRange: { min: 400, max: 500 },
    tags: ['needs-video', 'performance-capture', 'multi-output', 'quality-premium', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 7,
  },

  'production-pipeline-performance': {
    id: 'production-pipeline-performance',
    name: 'Production Pipeline Performance',
    slug: 'production-pipeline-performance',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: 'Enterprise workflow combining performance upload with complete production pipeline. Upload acting, receive finished product.',
    whatItDoes: 'The ultimate performance-to-production workflow: upload your performance footage, get back fully produced content with character consistency, coverage, transitions, color grading, and post-production polish.',
    perfectFor: [
      'Enterprise and agency productions',
      'High-budget content with tight deadlines',
      'Productions requiring maximum polish',
      'Professional narrative content',
      'Broadcast-quality deliverables',
    ],
    proTip: 'Most comprehensive workflow available. When you need absolutely everything—coverage, consistency, transitions, grading, polish—this delivers all of it from your performance.',
    creditRange: { min: 600, max: 800 },
    tags: ['needs-video', 'performance-capture', 'multi-output', 'quality-premium', 'client-work', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 8,
  },

  // ==========================================================================
  // VIDEO TRANSFORM - VIDEO ENHANCEMENT (3 workflows) 🆕
  // Transform existing video with VFX, style changes, or element removal
  // ==========================================================================

  'vfx-magic': {
    id: 'vfx-magic',
    name: 'VFX Magic',
    slug: 'vfx-magic',
    inputType: 'video-transform',
    workflowType: 'post-production',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'enhance',
    experienceLevel: 'advanced',
    outputType: 'single',
    heroDescription: 'Add special effects to your existing footage. Rain, fire, magic, powers—Hollywood VFX without the Hollywood budget.',
    whatItDoes: 'Upload any video and describe the effects you want added. Our AI analyzes your footage and seamlessly integrates special effects, maintaining lighting, perspective, and realism. Perfect for adding weather effects, superhero powers, magic, energy effects, and cinematic enhancements to footage you\'ve already shot.',
    perfectFor: [
      'Content creators adding superhero powers or action effects',
      'YouTubers creating cinematic action sequences',
      'Weather effects (rain, snow, fog, lightning, wind)',
      'Magic and fantasy effects for storytelling',
      'Energy effects, glows, and power-ups',
    ],
    proTip: 'Film your base scene first with good lighting and clean backgrounds. Adding effects in post is far cheaper and more flexible than traditional VFX—and you can iterate until it\'s perfect.',
    creditRange: { min: 100, max: 150 },
    tags: ['needs-video', 'vfx', 'enhancement', 'post-production', 'single-output', 'advanced'],
    stars: 5,
    categoryOrder: 9,
    subcategoryOrder: 1,
  },

  'scene-transformer': {
    id: 'scene-transformer',
    name: 'Scene Transformer',
    slug: 'scene-transformer',
    inputType: 'video-transform',
    workflowType: 'post-production',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Transform your scene\'s environment, lighting, time of day, or art style. Shoot once, create unlimited variations.',
    whatItDoes: 'Upload existing video and describe how you want it transformed. Change daytime to nighttime, indoor to outdoor, modern to historical, or realistic to stylized. The AI intelligently maintains your subjects and actions while transforming everything around them. Revolutionary for virtual production and budget filmmaking.',
    perfectFor: [
      'Virtual background replacement without green screen',
      'Time of day changes (day to night, golden hour, etc.)',
      'Location changes (indoor → outdoor, city → forest)',
      'Style transfer (realistic → anime, modern → period piece)',
      'Budget filmmaking with limited location access',
    ],
    proTip: 'Shoot in one simple location with good lighting. Then transform it into any setting you need. Much cheaper than location scouting and permits.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'transformation', 'virtual-production', 'post-production', 'single-output', 'intermediate'],
    stars: 5,
    categoryOrder: 9,
    subcategoryOrder: 2,
  },

  'element-eraser': {
    id: 'element-eraser',
    name: 'Element Eraser',
    slug: 'element-eraser',
    inputType: 'video-transform',
    workflowType: 'post-production',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'enhance',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: 'Remove unwanted objects, people, or elements from your video. Clean up footage and salvage otherwise unusable shots.',
    whatItDoes: 'Upload video and describe what needs to be removed. The AI intelligently fills in the removed areas with realistic content that matches the surrounding scene. Works for removing people, objects, watermarks, logos, modern elements from period pieces, or anything else cluttering your shot.',
    perfectFor: [
      'Removing photobombers or unwanted people from shots',
      'Cleaning up location shots with distracting elements',
      'Removing watermarks, logos, or branding',
      'Removing modern elements from historical/period content',
      'Salvaging otherwise perfect shots with one flaw',
    ],
    proTip: 'Be specific about what to remove: "Remove the red car in the background" works better than "clean up the background." The more precise your description, the better the result.',
    creditRange: { min: 75, max: 100 },
    tags: ['needs-video', 'cleanup', 'removal', 'post-production', 'single-output', 'intermediate'],
    stars: 4,
    categoryOrder: 9,
    subcategoryOrder: 3,
  },
};

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Get all workflows as an array
 * @returns {WorkflowMetadata[]}
 */
export function getAllWorkflows() {
  return Object.values(WORKFLOW_METADATA);
}

/**
 * Get workflow by ID
 * @param {string} id
 * @returns {WorkflowMetadata | undefined}
 */
export function getWorkflowById(id) {
  return WORKFLOW_METADATA[id];
}

/**
 * Get workflows by input type
 * @param {InputType} inputType
 * @returns {WorkflowMetadata[]}
 */
export function getWorkflowsByInputType(inputType) {
  return getAllWorkflows().filter(w => w.inputType === inputType);
}

/**
 * Get workflows supporting Character Consistency
 * @param {'all' | 'optional' | 'required'} type
 * @returns {WorkflowMetadata[]}
 */
export function getCharacterConsistencyWorkflows(type = 'all') {
  const all = getAllWorkflows();
  
  if (type === 'all') {
    return all.filter(w =>
      w.tags.includes('character-consistency-optional') ||
      w.tags.includes('character-consistency-required')
    );
  } else if (type === 'optional') {
    return all.filter(w => w.tags.includes('character-consistency-optional'));
  } else if (type === 'required') {
    return all.filter(w => w.tags.includes('character-consistency-required'));
  }
  
  return [];
}

/**
 * Get workflows by experience level
 * @param {ExperienceLevel} level
 * @returns {WorkflowMetadata[]}
 */
export function getWorkflowsByLevel(level) {
  return getAllWorkflows().filter(w => w.experienceLevel === level);
}

/**
 * Get beginner-friendly workflows
 * @returns {WorkflowMetadata[]}
 */
export function getBeginnerWorkflows() {
  return getWorkflowsByLevel('beginner');
}

/**
 * Get fastest/budget workflows
 * @returns {WorkflowMetadata[]}
 */
export function getFastWorkflows() {
  return getAllWorkflows().filter(w =>
    w.tags.includes('fastest') || w.tags.includes('budget-friendly')
  );
}

/**
 * Search workflows by query
 * @param {string} query
 * @returns {WorkflowMetadata[]}
 */
export function searchWorkflows(query) {
  const searchLower = query.toLowerCase();
  return getAllWorkflows().filter(w =>
    w.name.toLowerCase().includes(searchLower) ||
    w.heroDescription.toLowerCase().includes(searchLower) ||
    w.whatItDoes.toLowerCase().includes(searchLower) ||
    w.perfectFor.some(p => p.toLowerCase().includes(searchLower))
  );
}

export default WORKFLOW_METADATA;

