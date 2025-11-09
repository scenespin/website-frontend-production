// ============================================================================
// WORKFLOW METADATA - Complete catalog of all 58 workflows
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
  // Ordered by: Viral appeal → Ease of use → Quality
  // ==========================================================================
  
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
    whatItDoes: 'YOU: Create one video → AI: Gives you 3 versions automatically - YouTube (16:9), TikTok/Reels (9:16), and Instagram (1:1). No need to generate 3 separate times!',
    technicalDetails: 'Intelligent focal point detection analyzes composition and reframes content for optimal viewing on each platform. Uses content-aware cropping with subject tracking to maintain proper framing across aspect ratios. Multi-format delivery system optimized for platform-specific viewing experiences.',
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
    subcategoryOrder: 1, // MOST VIRAL - Create once, post everywhere!
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
    whatItDoes: 'YOU: Describe your scene → AI: Gives you photorealistic video in 3-5 minutes for just 35-50 credits. Great quality at beginner-friendly prices!',
    technicalDetails: 'Optimized single-pass rendering pipeline with efficient quality/speed trade-offs. Streamlined post-production workflow delivers professional photorealistic results in significantly reduced time. Ideal for iterative production and high-volume content creation where efficiency is prioritized.',
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
    subcategoryOrder: 2, // BEGINNER FRIENDLY - Low cost entry
  },
  
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
    whatItDoes: 'YOU: Describe your scene → AI: Runs your video through MULTIPLE enhancement stages for maximum quality. Takes longer (8-12 min) but delivers cinema-grade results!',
    technicalDetails: 'Multi-stage enhancement workflow: initial render → resolution enhancement (2x) → detail refinement pass → temporal consistency processing → color grading optimization. Progressive enhancement pipeline comparable to traditional cinema post-production but fully automated for maximum efficiency.',
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
    subcategoryOrder: 3, // PREMIUM QUALITY
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
    heroDescription: 'Make characters perform EXACT poses and movements. Perfect for dance, choreography, or matching reference images.',
    whatItDoes: 'YOU: "Character doing a specific yoga pose" or "Character in exact dance position" → AI: Generates that EXACT pose. Upload a reference photo or describe the exact body position you need.',
    perfectFor: [
      'Dance videos and choreography tutorials',
      'Yoga and fitness instruction videos',
      'Product demos requiring specific hand positions',
      'Matching storyboard poses exactly',
      'Athletic movements and sports demonstrations',
    ],
    technicalDetails: 'Keyframe-based pose guidance system with reference matching capabilities. Advanced motion capture techniques ensure precise body positioning and choreography alignment. Frame-accurate pose control for professional-grade character animation.',
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
    heroDescription: 'Get 5 different camera angles of the SAME scene - dolly push-in, crane shot, tracking shot, static, and orbit.',
    whatItDoes: 'YOU: "Warrior walking through battlefield" → AI: Gives you 5 versions with different camera movements (dolly in, crane up, tracking sideways, static shot, circular orbit). Pick your favorite!',
    perfectFor: [
      'Testing which camera movement looks best',
      'Creating dynamic music videos',
      'Professional film presentations with options',
      'Learning cinematography by comparison',
      'Getting variety without re-generating',
    ],
    technicalDetails: 'Multi-camera simulation system generates identical scene content with varied cinematography techniques: static lock-off, dolly push/pull, crane movements, tracking shots, and orbital moves. Professional coverage workflow enables post-production flexibility and dynamic editing options.',
    proTip: 'Generate once, get 5 different cinematic camera moves. Perfect for finding the right "feel" for your scene.',
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
    heroDescription: 'Automatically makes your shots look "professional" using the Rule of Thirds and Golden Ratio composition.',
    whatItDoes: 'YOU: Describe any scene → AI: Positions everything using professional photography rules (Rule of Thirds, Golden Ratio). Your shots automatically look magazine-quality.',
    perfectFor: [
      'Portfolio pieces that need to look impressive',
      'Product photography and commercial ads',
      'Architectural and landscape shots',
      'Instagram-worthy aesthetic content',
      'When you want "that professional look"',
    ],
    technicalDetails: 'Automated composition framework applies classical cinematography principles: Rule of Thirds, Golden Ratio, leading lines, and balanced framing. Professional framing techniques ensure visually compelling shots with proper subject placement and negative space utilization.',
    proTip: 'Think of this as having a professional cinematographer auto-frame your shots. Everything is positioned for maximum visual impact.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'quality-premium', 'photorealistic', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 1,
    subcategoryOrder: 6,
  },

  // ==========================================================================
  // 2. ANIMATED (3 workflows)
  // Ordered by: Viral appeal (Anime > Cartoon > 3D for general audience)
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
    proTip: 'Upload 1-2 reference images of your character to maintain perfect consistency across all your anime scenes.',
    creditRange: { min: 85, max: 100 },
    tags: ['text-only', 'single-output', 'animation', 'generation', 'character-consistency-optional'],
    stars: 5,
    categoryOrder: 2,
    subcategoryOrder: 1, // MOST POPULAR - Massive anime audience
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
    subcategoryOrder: 2, // FAMILY FRIENDLY - Broad appeal
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
    subcategoryOrder: 3, // PREMIUM 3D
  },

  // ==========================================================================
  // FANTASY & VFX (2 workflows) - Category 4
  // Ordered by: Viral potential (Superhero > Fantasy)
  // ==========================================================================
  
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
    subcategoryOrder: 1, // MOST VIRAL - Superhero transformation!
  },

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
    subcategoryOrder: 2, // FANTASY WORLDS
  },

  // ==========================================================================
  // ANIMALS & CREATURES (2 workflows) - Category 5
  // Ordered by: Viral appeal (Talking animals > Realistic animals)
  // ==========================================================================
  
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
    subcategoryOrder: 1, // MOST VIRAL - Talking animals!
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
    subcategoryOrder: 2, // REALISTIC WILDLIFE
  },

  // ==========================================================================
  // BUDGET & SPEED (6 workflows) - Category 6
  // Ordered by: Beginner appeal → Social media viral → Ultra budget
  // ==========================================================================
  
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
    heroDescription: 'FASTEST workflow - Get your video in under 2 minutes! Cheapest option to test ideas quickly.',
    whatItDoes: 'YOU: Type a description → AI: Gives you a video in ~2 minutes for only 15-25 credits. Perfect for beginners testing ideas or making quick content.',
    perfectFor: [
      'BEGINNERS - Try AI video for the first time',
      'Testing ideas before spending more credits',
      'Quick storyboards and concept testing',
      'Time-sensitive trending content (jump on trends FAST)',
      'When you need something RIGHT NOW',
    ],
    technicalDetails: 'Rapid rendering workflow optimized for speed over enhancement passes. Direct-to-output pipeline minimizes processing time while maintaining acceptable quality thresholds. Ideal for concept validation, storyboarding, and time-sensitive content production.',
    proTip: 'Start here! Generate 5 test videos for the price of 1 Hollywood Standard. Once you find what works, upgrade to premium quality.',
    creditRange: { min: 15, max: 25 },
    tags: ['text-only', 'single-output', 'budget-friendly', 'fastest', 'generation', 'character-consistency-optional'],
    stars: 3,
    categoryOrder: 6,
    subcategoryOrder: 1, // BEST FOR BEGINNERS - Fastest & cheapest!
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
    heroDescription: 'SHORT 2-5 second loops perfect for Instagram, TikTok, Twitter. Plays on repeat seamlessly!',
    whatItDoes: 'YOU: "Fire burning" or "Character waving" → AI: Creates a SHORT 2-5 second video that loops perfectly (end connects back to start). Designed for social media autoplay!',
    perfectFor: [
      'Instagram profile videos and posts',
      'Twitter/X header videos',
      'TikTok transitions and effects',
      'Discord and Slack profile animations',
      'Any content that will loop on autoplay',
    ],
    technicalDetails: 'Seamless loop generation using motion prediction and temporal blending. End-frame to start-frame transition optimized for infinite playback scenarios. Perfect for autoplay environments and continuous display applications.',
    proTip: 'Social media feeds auto-loop videos. These short clips are specifically designed to look good when looping - maximize engagement!',
    creditRange: { min: 20, max: 30 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'social-media', 'generation', 'character-consistency-optional'],
    stars: 4,
    categoryOrder: 6,
    subcategoryOrder: 2, // MOST VIRAL - Social media loops!
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
    heroDescription: 'PERFECT seamless loops - viewers won\'t even realize it\'s looping! Great for backgrounds and website headers.',
    whatItDoes: 'YOU: "Ocean waves" or "City traffic" → AI: Creates a video where the last frame perfectly matches the first frame. Loops so smoothly people won\'t notice the repeat!',
    perfectFor: [
      'Website header background videos',
      'Zoom/Teams virtual backgrounds',
      'Digital signage and displays',
      'Meditation and ambient content',
      'Live stream backgrounds',
    ],
    technicalDetails: 'Advanced seamless loop rendering with mathematically perfect frame matching. Temporal motion analysis ensures zero-jarring transitions between loop points. Professional-grade looping for broadcast and display applications.',
    proTip: 'More expensive than Micro Loop but MUCH smoother. Use this when the loop quality really matters (website headers, professional backgrounds).',
    creditRange: { min: 35, max: 50 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'generation', 'character-consistency-optional'],
    stars: 4,
    categoryOrder: 6,
    subcategoryOrder: 3, // PROFESSIONAL LOOPS
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
    heroDescription: 'FAST loop testing - Cheaper than Perfect Loop but better than Budget Loop. Good middle ground!',
    whatItDoes: 'YOU: Need a loop quickly → AI: Gives you a decent looping video fast and cheap. Not perfect, but good enough for testing or drafts.',
    perfectFor: [
      'Testing loop ideas before committing',
      'Draft versions to show clients',
      'Bulk content where perfection isn\'t critical',
      'When you need many loops quickly',
      'Prototyping loop concepts',
    ],
    technicalDetails: 'Rapid loop rendering with balanced quality/speed optimization. Intermediate processing workflow suitable for draft versions and bulk production. Good seamlessness without full temporal analysis overhead.',
    proTip: 'Use this to test 5-10 loop ideas, then re-generate your best 2-3 with Perfect Loop Generator for final versions.',
    creditRange: { min: 18, max: 28 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'fastest', 'generation', 'character-consistency-optional'],
    stars: 3,
    categoryOrder: 6,
    subcategoryOrder: 4, // FAST LOOP TESTING
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
    heroDescription: 'CHEAPEST loop option - Perfect for creating 10-20 loops at once when you need VOLUME over perfection.',
    whatItDoes: 'YOU: Need LOTS of loops → AI: Gives you the cheapest possible loops. Quality is "okay" but you can make WAY more for your credits.',
    perfectFor: [
      'Bulk content creation (making 20+ loops)',
      'Background content where quality doesn\'t matter much',
      'Building a large loop library quickly',
      'Testing many concepts without spending much',
      'Maximizing credit efficiency',
    ],
    technicalDetails: 'High-volume loop production workflow with minimal processing overhead. Optimized for quantity over quality refinement. Suitable for building large content libraries where cost efficiency is paramount.',
    proTip: 'Build your loop library here (20 loops for ~$5), then upgrade your 2-3 best performers to Perfect Loop quality.',
    creditRange: { min: 18, max: 28 },
    tags: ['text-only', 'single-output', 'looping', 'budget-friendly', 'fastest', 'generation', 'character-consistency-optional'],
    stars: 3,
    categoryOrder: 6,
    subcategoryOrder: 5, // BULK CREATION
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
    heroDescription: 'Multi-angle ACTION coverage! Same moment → 3 camera angles. Character stays consistent!',
    whatItDoes: 'YOU: Upload character image + describe action → AI: Films from 3 ANGLES simultaneously! Like having 3 cameras on set. Character looks identical in all shots!',
    technicalDetails: 'Multi-camera angle generation with character consistency enforcement. Simultaneous coverage from multiple perspectives (front, side, dynamic) while maintaining identical character appearance across all viewpoints. Professional action cinematography workflow.',
    perfectFor: [
      'Action movie trailers',
      'Sports highlights with coverage',
      'Character-driven series',
      'Professional action content',
      'Multi-angle storytelling',
    ],
    proTip: '🎬 Upload 1-2 clear character photos (front + side view). System ensures perfect consistency across all 3 camera angles!',
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
    heroDescription: 'Same scene → 5 ART STYLES! Photorealistic, anime, oil painting, cyberpunk, sketch. Find your aesthetic!',
    whatItDoes: 'YOU: Upload character + describe scene → AI: Generates in 5 WILDLY different styles! Same composition, different art. Test what works!',
    technicalDetails: 'Multi-style rendering with compositional consistency. Generates identical scene composition across dramatically different visual aesthetics: photorealistic, anime, impressionist painting, cyberpunk, pencil sketch. Style exploration workflow for pre-production.',
    perfectFor: [
      'Client presentations with style options',
      'Find perfect visual aesthetic for project',
      'Music videos with style-shifting',
      'Portfolio showcasing versatility',
      'Pre-production style testing',
    ],
    proTip: '🎨 Use during PRE-PRODUCTION! Test which art style serves your story best before committing.',
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
    heroDescription: 'Build BACKWARDS from climax! Define epic ending → AI generates the buildup. Perfect for trailers!',
    whatItDoes: 'YOU: Describe dramatic FINALE → AI: Generates the action leading up to it! Create suspense & buildup automatically!',
    technicalDetails: 'Reverse timeline generation starting from climactic endpoint. Builds tension and narrative progression backward from defined peak moment. Trailer-optimized workflow for maximum dramatic impact.',
    perfectFor: [
      '🎬 Movie trailers building to climax!',
      'Product reveals with dramatic buildup',
      'Mystery content (reveal → backstory)',
      'Music video drop moments',
      'Suspenseful storytelling',
    ],
    proTip: '💥 Great for trailers! Define your "money shot", AI creates the tension leading to it!',
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
    heroDescription: 'Tell stories in BOTH DIRECTIONS! One moment → BACKSTORY + CONSEQUENCES. Flashbacks & flash-forwards!',
    whatItDoes: 'YOU: Define pivotal moment → AI: Generates BOTH what led to it AND what happens after! Non-linear storytelling made easy!',
    technicalDetails: 'Dual-timeline generation from single narrative pivot point. Generates both causality chain (backstory) and consequence chain (aftermath) maintaining character and narrative consistency. Advanced non-linear storytelling workflow.',
    perfectFor: [
      'Flashbacks & flash-forwards',
      'Before/after transformations',
      'Decision-point consequences',
      'Time-loop & time-travel content',
      'Sophisticated cinema-style narratives',
    ],
    proTip: '🎭 Creates CINEMA-quality storytelling! More sophisticated than linear YouTube content.',
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
    heroDescription: '🔥 Character DIALOGUE with PERFECT lip-sync! Facial animation + emotional performance. No voice actors needed!',
    whatItDoes: 'YOU: Upload character + type dialogue → AI: Character SPEAKS with perfect lip-sync, facial expressions, natural delivery! Like hiring voice actors but FREE!',
    technicalDetails: 'Automated dialogue generation with synchronized lip animation and facial performance. Phoneme-accurate mouth shapes with emotion-appropriate facial expressions. Professional voice synthesis with character-driven delivery suitable for narrative content.',
    perfectFor: [
      'Explainer & educational videos',
      'Character-driven narratives & short films',
      'Corporate spokesperson (no talent hiring!)',
      'Podcast visualization',
      'ANY project with talking characters',
    ],
    proTip: '🚀 GAME-CHANGER for solo creators! Create entire character dialogues without recording equipment OR hiring talent!',
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
    heroDescription: '💰 ENTERPRISE! Complete Hollywood pipeline automated. Script → Final edit with color grading. BROADCAST-QUALITY!',
    whatItDoes: 'YOU: Provide script + character → AI: FULL PRODUCTION! Character generation + scene composition + transitions + color grading + post-production. Studio quality at AI speed!',
    technicalDetails: 'End-to-end production automation: character generation, scene composition, professional transition design, cinematic color grading, and final post-production polish. Enterprise workflow delivering broadcast-standard output suitable for high-end client deliverables.',
    perfectFor: [
      '💼 HIGH-END CLIENT WORK - fast turnaround!',
      'Complex multi-shot sequences',
      'Agency work with premium standards',
      'Film festival submissions',
      'Broadcast-quality requirements',
    ],
    proTip: '⚡ Ultimate workflow for PROFESSIONAL creators delivering studio-quality on aggressive deadlines. Worth every credit!',
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
    heroDescription: 'Perfect LOOP → ALL PLATFORMS! One generation = YouTube, TikTok, Instagram. Seamless looping + multi-format!',
    whatItDoes: 'YOU: Upload character + describe loop → AI: Creates perfect loop in 3-4 platform formats! Seamlessly loops on ALL!',
    technicalDetails: 'Combined seamless loop generation with multi-platform aspect ratio optimization. Perfect temporal loop closure (end-frame to start-frame) delivered in platform-optimized formats: YouTube (16:9), TikTok/Reels (9:16), Instagram (1:1), with maintained loop integrity across all formats.',
    perfectFor: [
      'Social media managers (multiple platforms)',
      'Product showcases needing platform coverage',
      'Brand animations cross-platform',
      'Maximize reach efficiency',
      'Time-saving multi-platform strategy',
    ],
    proTip: '⚡ Maximum EFFICIENCY! One generation = content for 3-4 platforms. Saves hours of work!',
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
    heroDescription: 'Same loop → 5 MOODS! Test different color grading, lighting, camera movement. Find your vibe!',
    whatItDoes: 'YOU: Upload character + describe loop → AI: Creates 5 STYLE VARIATIONS! Different color grading, lighting moods, camera movements. A/B test aesthetics!',
    technicalDetails: 'Style variation workflow maintaining core loop motion while varying cinematic treatments: color grading palettes, lighting schemes, camera movement patterns, and artistic filters. Enables aesthetic testing and audience preference identification.',
    perfectFor: [
      'Find perfect mood for scene',
      'Client presentations with options',
      'A/B testing different aesthetics',
      'Build variety pack of content',
      'Learn what resonates with audience',
    ],
    proTip: '📊 POST ALL 5! Track which gets best engagement. Learn what your audience loves!',
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
    heroDescription: '"A-ha Take On Me" effect! Transform real references → animated style. Preserve motion & character!',
    whatItDoes: 'YOU: Upload reference images + pick animation style → AI: Transforms to animated while keeping motion & character! Rotoscoping without manual work!',
    technicalDetails: 'Style transfer with motion preservation and character consistency. Transforms photographic reference material into target animation aesthetic (anime, cartoon, sketch) while maintaining original movement and character identity. Automated rotoscoping workflow.',
    perfectFor: [
      '🔥 "A-ha Take On Me" style music videos!',
      'Mix live-action with animation',
      'Rotoscoping without manual frame-by-frame work',
      'Hybrid documentary-animation',
      'Artistic style transformations',
    ],
    proTip: '🎵 Perfect for music videos! Mix real footage with animation like famous "Take On Me" video. Huge viral potential!',
    creditRange: { min: 125, max: 150 },
    tags: ['needs-images', 'needs-images-veo', 'single-output', 'character-consistency-required', 'animation', 'transform'],
    stars: 5,
    categoryOrder: 3,
    subcategoryOrder: 2,
  },

  // ==========================================================================
  // PRODUCTION TOOLS (9 workflows) - Category 7  
  // Ordered by: Simple/practical → Professional packages → Enterprise
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
    heroDescription: 'Connect two video clips seamlessly! AI generates smooth transitions between shots.',
    whatItDoes: 'YOU: Upload 2 separate clips → AI: Creates smooth transition connecting them! Perfect for fixing continuity gaps or building montages.',
    technicalDetails: 'Automated transition generation with motion matching and temporal blending. Analyzes end-frame of Clip A and start-frame of Clip B to generate seamless bridging footage. Maintains visual consistency across cuts for professional narrative flow.',
    perfectFor: [
      'Fix continuity gaps in footage',
      'Create smooth montages',
      'Connect disparate shots into sequences',
      'Professional editing workflows',
      'Build narrative flow',
    ],
    proTip: 'Works best when clips have similar lighting/color. Think of this as auto-generating the "in-between" footage!',
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
    heroDescription: 'Chain multiple video clips together with auto-transitions! Upload many → Get seamless sequence.',
    whatItDoes: 'YOU: Upload multiple clips → AI: Connects ALL of them with consistent style, pacing, and smooth transitions! Perfect for music videos & montages.',
    technicalDetails: 'Multi-clip sequencing with style consistency enforcement across timeline. Generates bridging transitions between all clips while maintaining unified visual language. Automated pacing analysis ensures rhythm and flow across complete sequence.',
    perfectFor: [
      'Music video compilation',
      'Documentary montages',
      'Multi-shot narratives',
      'Series production',
      'Large-scale editing projects',
    ],
    proTip: 'Upload clips in desired order. AI handles ALL transitions automatically - massive time-saver for editors!',
    creditRange: { min: 200, max: 300 },
    tags: ['needs-video', 'multi-output', 'post-production', 'extend'],
    stars: 5,
    categoryOrder: 7,
    subcategoryOrder: 2,
  },

  // ==========================================================================
  // PERFORMANCE CAPTURE (12 workflows) - Category 8
  // Ordered by: NEW lip sync workflows → "Be the Character" performance capture
  // ==========================================================================
  
  'ai-avatar': {
    id: 'ai-avatar',
    name: 'AI Avatar (Voice Clone + Lip Sync)',
    slug: 'ai-avatar',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 1,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'create',
    experienceLevel: 'intermediate',
    outputType: 'single',
    heroDescription: '🔥 NEWEST! Clone ANY voice + create photorealistic talking avatar! Type dialogue, watch them speak in perfect lip sync.',
    whatItDoes: 'YOU: Upload portrait photo + type dialogue → AI: Character speaks YOUR cloned voice with Hollywood-grade lip sync! Scale yourself or create digital spokespersons.',
    technicalDetails: 'Professional voice cloning combined with photorealistic facial animation and lip-sync generation. Motion capture technology drives facial expressions and mouth movements synchronized to audio waveform analysis. Broadcast-quality avatar animation suitable for spokesperson videos and digital presenters.',
    perfectFor: [
      'SCALE YOURSELF - Be in 100 videos without filming',
      'Digital spokespersons and brand ambassadors',
      'Educational content with consistent presenter',
      'Corporate training videos without re-shooting',
      'Multilingual content with same face',
    ],
    proTip: '🚀 MASSIVE time-saver! Record voice samples once, then generate unlimited videos by just typing. No more filming!',
    creditRange: { min: 100, max: 150 },
    tags: ['needs-images', 'lip-sync', 'voice-cloning', 'avatar', 'generation', 'viral-potential'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 1, // 🔥 NEWEST & MOST SELLABLE!
  },

  'image-to-speech': {
    id: 'image-to-speech',
    name: 'Image to Speech',
    slug: 'image-to-speech',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: false,
      requiresImages: true,
      minImages: 1,
      maxImages: 1,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: '🔥 Make ANY image speak! Mona Lisa, anime characters, brand mascots - anything with a face!',
    whatItDoes: 'YOU: Upload ANY image (painting, cartoon, mascot, photo) + add audio → AI: Makes it SPEAK with perfect lip sync! Viral magic!',
    technicalDetails: 'Facial feature detection on static images combined with lip-sync animation generation. Works with any image containing recognizable facial structure - paintings, illustrations, photographs, cartoons. Audio-driven facial animation with automatic mouth shape (phoneme) generation.',
    perfectFor: [
      'VIRAL CONTENT - Make Mona Lisa speak!',
      'Anime/manga character dialogue',
      'Brand mascots talking (Tony the Tiger, Ronald McDonald)',
      'Historical figures in educational content',
      'Meme creation and social media content',
    ],
    proTip: 'HUGE viral potential! Make famous paintings, anime characters, or memes talk. Perfect for educational content + entertainment!',
    creditRange: { min: 100, max: 100 },
    tags: ['needs-images', 'lip-sync', 'animation', 'viral-potential', 'generation'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 2, // 🔥 VIRAL POTENTIAL!
  },

  'podcast-to-video': {
    id: 'podcast-to-video',
    name: 'Podcast to Video',
    slug: 'podcast-to-video',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: false,
      requiresImages: true,
      minImages: 1,
      maxImages: 1,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'create',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: '🔥 Turn podcast audio into YouTube videos! Upload audio + host photo = instant talking-head video!',
    whatItDoes: 'YOU: Upload podcast MP3 + host photo → AI: Creates talking-head video with perfect lip sync! No camera needed for YouTube presence!',
    technicalDetails: 'Audio-to-video synthesis with lip-sync generation. Long-form audio processing with automatic segmentation for videos longer than 2 minutes. Batch processing capability for multi-episode production. Professional talking-head format optimized for podcast visualization.',
    perfectFor: [
      'PODCASTERS - Get on YouTube without filming!',
      'Audio content monetization',
      'Repurpose existing podcast episodes',
      'Audiobook visualization',
      'Radio shows to video format',
    ],
    proTip: 'Record your podcast normally (audio only), then convert to YouTube video! Massive time-saver for podcasters.',
    creditRange: { min: 100, max: 500 },
    tags: ['needs-images', 'podcast', 'audio-to-video', 'lip-sync', 'youtube', 'generation'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 3, // 🔥 PODCASTER DREAM!
  },

  'multilingual-dubbing': {
    id: 'multilingual-dubbing',
    name: 'Multilingual Dubbing',
    slug: 'multilingual-dubbing',
    inputType: 'text-with-images',
    workflowType: 'generation',
    inputRequirements: {
      requiresText: true,
      requiresImages: true,
      minImages: 1,
      maxImages: 1,
      requiresVideo: false,
      supportsCharacterBank: false,
    },
    action: 'multi-output',
    experienceLevel: 'advanced',
    outputType: 'multiple',
    heroDescription: '🔥 Speak EVERY language! Same face, different languages with perfect lip sync. Record once → 20+ language versions!',
    whatItDoes: 'YOU: Upload photo + your content → AI: Creates videos in Spanish, French, Japanese, etc. Same face, perfect lip sync for each language!',
    technicalDetails: 'Multi-language voice synthesis with language-specific lip-sync generation. Automated translation pipeline with phoneme-accurate facial animation for each target language. Supports 99+ languages with proper mouth shape (viseme) generation for authentic lip movement across different phonetic systems.',
    perfectFor: [
      'GLOBAL BUSINESSES - Localize content instantly!',
      'International marketing campaigns',
      'E-learning platforms (teach in every language)',
      'YouTube channels going global',
      'Corporate training worldwide',
    ],
    proTip: '💰 HUGE B2B opportunity! Businesses will pay premium for instant multilingual content. One recording = 20 markets!',
    creditRange: { min: 100, max: 2000 },
    tags: ['needs-images', 'multilingual', 'dubbing', 'lip-sync', 'b2b', 'enterprise', 'generation'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 4, // 🔥 B2B GOLDMINE!
  },

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
    heroDescription: '"BE THE CHARACTER" - Film yourself → Get anime version! Your movements become anime animation.',
    whatItDoes: 'YOU: Film yourself acting → AI: Transforms YOU into anime character with your exact movements! No animation skills needed!',
    technicalDetails: 'Performance capture with style transfer to anime aesthetic. Motion tracking and retargeting preserves actor performance while applying anime art style, characteristic shading, and animation principles. Real-time motion data drives anime character output.',
    perfectFor: [
      'VTubers and virtual content creators',
      'Anime music videos with YOUR performance',
      'YouTubers wanting anime personas',
      'No animation skills needed',
      'Webcam-to-anime content',
    ],
    proTip: 'VTubers use expensive setups - this turns your webcam footage into anime! Film with good lighting, exaggerate expressions.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'performance-capture', 'animation', 'single-output', 'transform'],
    stars: 5,
    categoryOrder: 8,
    subcategoryOrder: 5,
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
  // VIDEO ENHANCEMENT (5 workflows) - Category 9
  // Ordered by: Viral/magical → Practical fixes → E-commerce
  // ==========================================================================

  'still-photo-performer': {
    id: 'still-photo-performer',
    name: 'Still Photo Performer',
    slug: 'still-photo-performer',
    inputType: 'video-transform',
    workflowType: 'transform',
    inputRequirements: {
      requiresText: false,
      requiresImages: true,
      minImages: 1,
      maxImages: 1,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'advanced',
    outputType: 'single',
    heroDescription: '🔥 VIRAL MAGIC! Make old photos SPEAK! Animate grandma\'s photo, historical figures, anyone!',
    whatItDoes: 'YOU: Upload old photo + film yourself speaking → AI: Transfers YOUR voice & expressions to the photo! Make deceased loved ones "speak" again. MASSIVE viral + emotional potential!',
    technicalDetails: 'Performance transfer technology extracts facial movements and voice from source performance video and retargets to static portrait image. Deep fake-style facial animation with lip-sync drives photo subject. Emotional storytelling capability with viral content potential.',
    perfectFor: [
      '🔥 VIRAL TRIBUTE VIDEOS - Make grandma\'s photo speak!',
      'Historical figures speaking in education',
      'Emotional family memory videos',
      'Animate old family photos',
      'Bring illustrations/artwork to life',
    ],
    proTip: '💔 Emotionally powerful! Film yourself reading a message, apply to deceased relative\'s photo. Creates deeply personal, shareable viral moments.',
    creditRange: { min: 125, max: 150 },
    tags: ['needs-video', 'needs-images', 'animation', 'performance-transfer', 'viral-potential', 'emotional', 'single-output', 'advanced'],
    stars: 5,
    categoryOrder: 9,
    subcategoryOrder: 1, // MOST VIRAL & EMOTIONAL!
  },

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
    heroDescription: '🔥 Add HOLLYWOOD VFX to your footage! Rain, fire, lightning, superpowers, magic - anything!',
    whatItDoes: 'YOU: Upload video + describe effects → AI: Adds rain, fire, lightning, superpowers, magic, or ANY effect! Cheaper than hiring VFX artists!',
    technicalDetails: 'Visual effects compositing with scene-aware integration. Maintains proper lighting interaction, perspective matching, and motion tracking for realistic VFX integration. Supports weather effects, energy effects, magical elements, and cinematic enhancement layers.',
    perfectFor: [
      '🔥 SUPERHERO POWERS - Energy blasts, glowing eyes!',
      'Weather effects (rain, snow, lightning storms)',
      'Magic spells and fantasy effects',
      'YouTubers creating action sequences',
      'Cinematic effects without expensive VFX team',
    ],
    proTip: '🎬 Film your base footage first with good lighting. Adding VFX in post is MUCH cheaper than traditional methods - iterate until perfect!',
    creditRange: { min: 100, max: 150 },
    tags: ['needs-video', 'vfx', 'enhancement', 'post-production', 'single-output', 'advanced'],
    stars: 5,
    categoryOrder: 9,
    subcategoryOrder: 2, // MAGICAL EFFECTS!
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
    heroDescription: 'Change location, time of day, or style! Film once → unlimited variations. No green screen!',
    whatItDoes: 'YOU: Upload video + describe new setting → AI: Changes location/time/style while keeping YOU! Day→night, indoor→outdoor, modern→historical. Virtual production without green screen!',
    technicalDetails: 'Environment replacement and style transfer with subject preservation. Background transformation maintains proper lighting consistency and depth mapping. Virtual production workflow eliminates need for expensive location shoots or green screen setups.',
    perfectFor: [
      'VIRTUAL BACKGROUNDS without green screen!',
      'Day to night conversions',
      'Location changes (indoor → beach, city → forest)',
      'Realistic → anime style transformations',
      'Budget filmmaking with limited locations',
    ],
    proTip: '💰 Shoot in ONE cheap location, then transform to any setting! Saves thousands on location permits and travel.',
    creditRange: { min: 100, max: 125 },
    tags: ['needs-video', 'transformation', 'virtual-production', 'post-production', 'single-output', 'intermediate'],
    stars: 5,
    categoryOrder: 9,
    subcategoryOrder: 3, // CREATIVE TRANSFORMATION!
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
    heroDescription: 'REMOVE anything! Photobombers, watermarks, logos, unwanted objects - gone!',
    whatItDoes: 'YOU: Upload video + "remove the red car" → AI: Erases it and fills in naturally! Save footage ruined by photobombers or mistakes!',
    technicalDetails: 'Content-aware fill technology with temporal consistency. Object removal with intelligent background reconstruction maintains scene continuity across frames. Similar to professional rotoscoping but automated for efficiency.',
    perfectFor: [
      'Remove photobombers from shots',
      'Erase watermarks and logos',
      'Clean up messy backgrounds',
      'Remove modern items from historical content',
      'Salvage "almost perfect" shots',
    ],
    proTip: '🎯 Be SPECIFIC: "Remove red car in back-left" works better than "clean background". Precision = better results!',
    creditRange: { min: 75, max: 100 },
    tags: ['needs-video', 'cleanup', 'removal', 'post-production', 'single-output', 'intermediate'],
    stars: 4,
    categoryOrder: 9,
    subcategoryOrder: 4, // PRACTICAL FIX-IT!
  },

  'product-reshoot': {
    id: 'product-reshoot',
    name: 'Product Reshoot',
    slug: 'product-reshoot',
    inputType: 'video-transform',
    workflowType: 'post-production',
    inputRequirements: {
      requiresText: true,
      requiresImages: false,
      requiresVideo: true,
      supportsCharacterBank: false,
    },
    action: 'transform',
    experienceLevel: 'beginner',
    outputType: 'single',
    heroDescription: 'E-COMMERCE MAGIC! Shoot product once → get unlimited backgrounds! No expensive photoshoots!',
    whatItDoes: 'YOU: Upload product photo/video → AI: Changes background, lighting, setting! One shoot = unlimited variations for A/B testing!',
    technicalDetails: 'Product isolation with environment replacement. Maintains product integrity while transforming presentation context. Virtual staging workflow ideal for e-commerce optimization and lifestyle context variations without additional photography costs.',
    perfectFor: [
      '💰 E-COMMERCE SELLERS - Unlimited product backgrounds!',
      'Virtual staging for real estate',
      'Product in different lifestyle settings',
      'Seasonal variations (Christmas, summer, etc.)',
      'A/B test different presentations',
    ],
    proTip: '🛍️ Shoot product once with good lighting → test 20 different backgrounds! Perfect for optimizing e-commerce conversions.',
    creditRange: { min: 75, max: 100 },
    tags: ['needs-video', 'product', 'e-commerce', 'virtual-staging', 'post-production', 'single-output', 'beginner', 'b2b'],
    stars: 5,
    categoryOrder: 9,
    subcategoryOrder: 5, // E-COMMERCE B2B!
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

