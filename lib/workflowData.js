/**
 * Workflow Data Aggregator
 * 
 * This module aggregates all workflow definitions from the backend
 * and formats them for use in the frontend help documentation.
 * 
 * Since we can't directly import from the backend (different environments),
 * we recreate the workflow data structure here for the help docs.
 */

// This is a simplified version of workflow data for help documentation
// The actual workflow execution happens in the backend
export const allWorkflows = [
  // ========================================
  // PHOTOREALISTIC (6 workflows)
  // ========================================
  {
    id: 'hollywood-standard',
    name: 'Hollywood Standard',
    description: 'Generate a professional character portrait, create 8 angle variations for consistency, then produce high-quality video. Optional 4K upscale available.',
    category: 'photorealistic',
    cost: { min: 58, max: 258, unit: 'credits', dynamic: true },
    time: { min: 5, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate professional base portrait with Luma Photon', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Generate 8 angle variations with character reference', provider: 'luma-photon-flash', estimatedTime: 60 },
      { step: 3, action: 'Generate high-quality video with character references', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 4, action: 'Upscale to 4K with Runway (optional)', provider: 'runway', estimatedTime: 120, optional: true }
    ],
    bestFor: ['Feature films', 'High-end commercials', 'Professional trailers', 'Premium content creation', 'Client presentations'],
    examples: [
      'Actor headshot → Multiple scene appearances',
      'Director vision → Final production quality',
      'Character concept → Movie-ready footage'
    ],
    tags: ['premium', 'professional', 'feature-film', 'high-quality', '4k', 'cinematic'],
    featured: true,
    popularityScore: 95
  },
  
  {
    id: 'budget-photorealistic',
    name: 'Budget Photorealistic',
    description: 'Fast photorealistic workflow: generate character with Photon Flash, create video with Ray-2. Lower cost, still professional quality.',
    category: 'photorealistic',
    cost: { min: 60, max: 100, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate character with Luma Photon Flash', provider: 'luma-photon-flash', estimatedTime: 20 },
      { step: 2, action: 'Generate video with Luma Ray-2', provider: 'luma-ray-2', estimatedTime: 150 }
    ],
    bestFor: ['YouTube content', 'Social media', 'Budget productions', 'Rapid prototyping', 'Testing concepts'],
    examples: [
      'YouTube video in minutes',
      'Social media content creation',
      'Quick client mockups'
    ],
    tags: ['budget', 'affordable', 'youtube', 'social-media', 'quick'],
    featured: true,
    popularityScore: 85
  },
  
  {
    id: 'multi-platform-hero',
    name: 'Multi-Platform Hero',
    description: 'Create one 16:9 video, then automatically reframe to 9:16 (vertical) and 1:1 (square) for all social platforms.',
    category: 'photorealistic',
    cost: { min: 120, max: 150, unit: 'credits' },
    time: { min: 5, max: 8, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate base 16:9 video', provider: 'luma-ray-2', estimatedTime: 150 },
      { step: 2, action: 'Reframe to 9:16 (vertical)', provider: 'luma-reframe', estimatedTime: 60 },
      { step: 3, action: 'Reframe to 1:1 (square)', provider: 'luma-reframe', estimatedTime: 60 }
    ],
    bestFor: ['Multi-platform marketing', 'Social media campaigns', 'Brand content', 'Influencer content', 'Cross-platform distribution'],
    examples: [
      'One video → YouTube + Instagram + TikTok',
      'Marketing campaign across all platforms',
      'Brand content for social media'
    ],
    tags: ['multi-platform', 'social-media', 'marketing', 'reframe', 'youtube', 'tiktok', 'instagram'],
    featured: false,
    popularityScore: 80
  },
  
  {
    id: 'precision-poser',
    name: 'Precision Poser',
    description: 'Upload a reference pose image or describe the position. System generates your character in that exact pose with high accuracy.',
    category: 'photorealistic',
    cost: { min: 80, max: 120, unit: 'credits' },
    time: { min: 3, max: 6, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze pose reference image', provider: 'internal', estimatedTime: 10 },
      { step: 2, action: 'Generate character in specified pose', provider: 'luma-ray-2', estimatedTime: 150 },
      { step: 3, action: 'Refine pose accuracy', provider: 'luma-modify', estimatedTime: 60 }
    ],
    bestFor: ['Animation reference', 'Storyboarding', 'Character design', 'Pose studies', 'Animation previz'],
    examples: [
      'Upload pose reference → Get character in that pose',
      'Describe action pose → Get accurate result',
      'Animation reference generation'
    ],
    tags: ['poses', 'animation', 'character-design', 'storyboard', 'previz'],
    featured: false,
    popularityScore: 70
  },
  
  {
    id: 'cinematic-camera-suite',
    name: 'Cinematic Camera Suite',
    description: 'Generate base scene, apply professional camera movements (dolly, crane, steadicam, aerial), refine composition for cinematic results.',
    category: 'photorealistic',
    cost: { min: 100, max: 200, unit: 'credits' },
    time: { min: 4, max: 8, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate base scene', provider: 'luma-ray-2', estimatedTime: 150 },
      { step: 2, action: 'Apply camera movement', provider: 'luma-modify', estimatedTime: 90 },
      { step: 3, action: 'Refine composition', provider: 'luma-ray-3', estimatedTime: 60 }
    ],
    bestFor: ['Film production', 'Commercial cinematography', 'Music videos', 'Premium content', 'Director previz'],
    examples: [
      'Dolly shot through dramatic scene',
      'Aerial crane shot for establishing',
      'Steadicam follow character'
    ],
    tags: ['cinema', 'camera-work', 'movements', 'professional', 'dolly', 'crane', 'steadicam'],
    featured: true,
    popularityScore: 90
  },
  
  {
    id: 'scene-composer',
    name: 'Scene Composer',
    description: 'Build complex scenes layer by layer: generate environment, add characters, compose final multi-element scene with proper layering.',
    category: 'photorealistic',
    cost: { min: 150, max: 250, unit: 'credits' },
    time: { min: 6, max: 12, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate environment base', provider: 'luma-ray-2', estimatedTime: 150 },
      { step: 2, action: 'Add character layers', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 3, action: 'Compose final scene', provider: 'internal', estimatedTime: 90 }
    ],
    bestFor: ['Complex scenes', 'Multi-character shots', 'Layered compositions', 'VFX integration', 'Professional productions'],
    examples: [
      'Multiple characters in one scene',
      'Complex environment with props',
      'Layered VFX composition'
    ],
    tags: ['composition', 'complex', 'multi-layer', 'vfx', 'professional'],
    featured: false,
    popularityScore: 75
  },

  // ========================================
  // ANIMATED (3 workflows)
  // ========================================
  {
    id: 'anime-master',
    name: 'Anime Master',
    description: 'Create anime character design with Photon, then animate with Ray-2 using anime style prompts for consistent Japanese animation aesthetics.',
    category: 'animated',
    cost: { min: 75, max: 120, unit: 'credits' },
    time: { min: 3, max: 6, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate anime character design', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Animate with anime style', provider: 'luma-ray-2', estimatedTime: 150 }
    ],
    bestFor: ['Anime content', 'Manga adaptation', 'Japanese-style animation', 'Character showcases', 'Anime trailers'],
    examples: [
      'Character design → Animated sequence',
      'Manga panel → Motion animation',
      'Anime trailer creation'
    ],
    tags: ['anime', 'japanese', 'manga', 'animation', 'character'],
    featured: true,
    popularityScore: 88
  },
  
  {
    id: 'cartoon-classic',
    name: 'Cartoon Classic',
    description: 'Generate Western-style cartoon character with Photon Flash, animate with cartoon physics and appealing motion using Ray-2.',
    category: 'animated',
    cost: { min: 70, max: 110, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate cartoon character', provider: 'luma-photon-flash', estimatedTime: 20 },
      { step: 2, action: 'Animate with cartoon physics', provider: 'luma-ray-2', estimatedTime: 150 }
    ],
    bestFor: ['Children\'s content', 'Educational videos', 'Brand mascots', 'Explainer videos', 'Family entertainment'],
    examples: [
      'Educational cartoon character',
      'Brand mascot animation',
      'Children\'s story adaptation'
    ],
    tags: ['cartoon', 'western', 'disney-style', 'family', 'education'],
    featured: true,
    popularityScore: 82
  },
  
  {
    id: '3d-character',
    name: '3D Character Animation',
    description: 'Generate 3D character model with Photon, animate with Ray-3 using 3D rendering prompts for Pixar-style results.',
    category: 'animated',
    cost: { min: 90, max: 140, unit: 'credits' },
    time: { min: 4, max: 7, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate 3D character model', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Animate with 3D engine', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['Game cinematics', 'Pixar-style animation', 'Product mascots', 'Tech demos', 'Professional presentations'],
    examples: [
      '3D mascot for tech product',
      'Game character cinematic',
      'Pixar-quality short film'
    ],
    tags: ['3d', 'pixar', 'modern', 'game', 'professional'],
    featured: true,
    popularityScore: 85
  },

  // ========================================
  // BUDGET / SPEED (5 workflows)
  // ========================================
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Fastest workflow: Photon Flash for character (20 sec) + Ray Flash for video (60 sec). Total ~90 seconds for complete video.',
    category: 'budget',
    cost: { min: 28, max: 28, unit: 'credits' },
    time: { min: 1, max: 3, unit: 'minutes' },
    quality: 3,
    steps: [
      { step: 1, action: 'Generate character with Luma Photon Flash (fastest)', provider: 'luma-photon-flash', estimatedTime: 20 },
      { step: 2, action: 'Generate quick video with Luma Ray Flash', provider: 'luma-ray-3', estimatedTime: 60 }
    ],
    bestFor: ['Quick tests', 'Rapid iterations', 'Concept validation', 'Budget projects', 'Prototyping', 'Style tests'],
    examples: [
      'Idea → Video in 90 seconds',
      'Quick character test',
      'Budget concept validation'
    ],
    tags: ['fast', 'budget', 'quick', 'prototype', 'test', 'cheap'],
    featured: true,
    popularityScore: 80
  },
  
  {
    id: 'micro-action-loop',
    name: 'Micro Action Loop',
    description: 'Create 2-4 second looping action clips perfect for GIFs, stickers, and social media reactions. Lightning fast and ultra affordable.',
    category: 'budget',
    cost: { min: 15, max: 25, unit: 'credits' },
    time: { min: 1, max: 2, unit: 'minutes' },
    quality: 3,
    steps: [
      { step: 1, action: 'Generate micro loop', provider: 'luma-ray-flash-2', estimatedTime: 30 },
      { step: 2, action: 'Perfect loop', provider: 'internal', estimatedTime: 30 }
    ],
    bestFor: ['GIF creation', 'Stickers', 'Reaction clips', 'Social media', 'Memes', 'Profile animations'],
    examples: [
      'Character reaction GIF',
      'Animated profile pic',
      'Social media sticker'
    ],
    tags: ['loop', 'gif', 'micro', 'sticker', 'social', 'meme'],
    featured: false,
    popularityScore: 70
  },
  
  {
    id: 'multi-platform-loop',
    name: 'Multi-Platform Loop',
    description: 'Create one perfect loop, export for all platforms (TikTok, Instagram, GIF). Social media loop master.',
    category: 'budget',
    cost: { min: 40, max: 60, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 3,
    steps: [
      { step: 1, action: 'Generate perfect loop', provider: 'luma-ray-flash-2', estimatedTime: 40 },
      { step: 2, action: 'Export multiple formats', provider: 'internal', estimatedTime: 60 }
    ],
    bestFor: ['TikTok loops', 'Instagram Reels', 'Twitter GIFs', 'Discord stickers', 'Multi-platform content'],
    examples: [
      'One loop → All social platforms',
      'TikTok + Instagram + Twitter',
      'Universal social media loop'
    ],
    tags: ['loop', 'multi-platform', 'social-media', 'tiktok', 'instagram', 'gif'],
    featured: false,
    popularityScore: 75
  },
  
  {
    id: 'perfect-loop-generator',
    name: 'Perfect Loop Generator',
    description: 'Create seamlessly looping videos that never show a seam. Perfect for backgrounds, profiles, and endless scroll content.',
    category: 'budget',
    cost: { min: 75, max: 100, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate base loop', provider: 'luma-ray-2', estimatedTime: 120 },
      { step: 2, action: 'Perfect seam points', provider: 'luma-modify', estimatedTime: 60 }
    ],
    bestFor: ['Background videos', 'Profile loops', 'Endless animations', 'Seamless content', 'Website backgrounds'],
    examples: [
      'Perfect background loop',
      'Seamless profile animation',
      'Website hero loop'
    ],
    tags: ['loop', 'seamless', 'perfect', 'background', 'endless'],
    featured: true,
    popularityScore: 78
  },
  
  {
    id: 'loop-variations',
    name: 'Loop Variations',
    description: 'Generate multiple variations of the same loop for A/B testing and variety. Create 3-5 different versions to see what works best.',
    category: 'budget',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 4, max: 7, unit: 'minutes' },
    quality: 3,
    steps: [
      { step: 1, action: 'Generate base loop', provider: 'luma-ray-flash-2', estimatedTime: 40 },
      { step: 2, action: 'Generate variations', provider: 'luma-ray-flash-2', estimatedTime: 120 },
      { step: 3, action: 'Perfect all loops', provider: 'internal', estimatedTime: 60 }
    ],
    bestFor: ['A/B testing', 'Content variety', 'Multiple options', 'Testing engagement', 'Portfolio pieces'],
    examples: [
      '5 variations for testing',
      'Multiple loop options',
      'A/B test social content'
    ],
    tags: ['loop', 'variations', 'testing', 'multiple', 'variety'],
    featured: false,
    popularityScore: 65
  },

  // Continue with remaining workflows...
  // I'll add placeholders for the remaining categories to show structure
  
  // HYBRID (11 workflows) - Including NEW ones
  {
    id: 'ai-avatar',
    name: 'AI Avatar',
    description: 'Upload portrait + audio file to create lip-synced video. Or clone a voice, type dialogue, and generate talking avatar automatically.',
    category: 'hybrid',
    cost: { min: 100, max: 100, unit: 'credits' },
    time: { min: 2, max: 3, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate Cloned Voice Audio', provider: 'internal', estimatedTime: 10 },
      { step: 2, action: 'Generate Lip Sync Animation', provider: 'internal', estimatedTime: 120 }
    ],
    outputs: {
      'avatar-video': 'Photorealistic talking avatar with cloned voice',
      'audio-file': 'Generated audio in cloned voice'
    },
    bestFor: [
      'Realistic digital avatars',
      'Celebrity voice clones (with permission)',
      'Multilingual video content',
      'Video messages from cloned personalities',
      'Character dialogue with perfect lip sync'
    ],
    examples: [
      'Clone your voice → Type dialogue → Get photorealistic you speaking',
      'Upload audio file + portrait → Instant lip-sync video',
      'Character image + voice clone → Animated character dialogue'
    ],
    tags: ['ai-avatar', 'voice-cloning', 'lip-sync', 'avatar', 'realistic', 'NEW'],
    featured: true,
    popularityScore: 95,
    requirements: {
      portraitImage: 'Required - High quality face photo',
      voiceOption1: 'Option 1: Voice profile + text dialogue',
      voiceOption2: 'Option 2: Upload audio file',
      legalRights: 'Required - Confirm rights to use voice/audio'
    }
  },

  // ========================================
  // HYBRID - Remaining 10 workflows
  // ========================================
  {
    id: 'image-to-speech',
    name: 'Image to Speech',
    description: 'Upload any image (painting, cartoon, mascot, photo) plus audio file. System generates lip-synced talking animation from static image.',
    category: 'hybrid',
    cost: { min: 100, max: 100, unit: 'credits' },
    time: { min: 2, max: 3, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Prepare image for animation', provider: 'internal', estimatedTime: 5 },
      { step: 2, action: 'Generate lip sync animation', provider: 'internal', estimatedTime: 120 }
    ],
    bestFor: ['Historical figure animations', 'Cartoon character dialogue', 'Brand mascot videos', 'Viral meme creation', 'Museum education'],
    examples: ['Mona Lisa + speech → Talking masterpiece', 'Anime art + voice → Instant animation', 'Brand mascot + pitch → Marketing video'],
    tags: ['image-to-speech', 'lip-sync', 'animation', 'mascot', 'viral', 'NEW'],
    featured: true,
    popularityScore: 90
  },

  {
    id: 'podcast-to-video',
    name: 'Podcast to Video',
    description: 'Upload podcast audio plus host photo. System generates talking-head video with lip-sync. Auto-splits long episodes into segments for YouTube.',
    category: 'hybrid',
    cost: { min: 100, max: 500, unit: 'credits', dynamic: true },
    time: { min: 2, max: 15, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Process podcast audio', provider: 'internal', estimatedTime: 30 },
      { step: 2, action: 'Generate video segments', provider: 'internal', estimatedTime: 120 },
      { step: 3, action: 'Combine segments (optional)', provider: 'internal', estimatedTime: 30, optional: true }
    ],
    bestFor: ['Podcast YouTube channels', 'Audio monetization', 'Social media clips', 'Audiobook visualization', 'Radio to video conversion'],
    examples: ['Podcast + host photo → YouTube video', '1-hour podcast → 30 clips for social', 'Audiobook + narrator → Video audiobook'],
    tags: ['podcast', 'audio-to-video', 'youtube', 'content-repurposing', 'NEW'],
    featured: true,
    popularityScore: 92
  },

  {
    id: 'multilingual-dubbing',
    name: 'Multilingual Dubbing',
    description: 'Upload video or audio. System translates to target languages and generates lip-synced videos for each. Scale globally without re-recording.',
    category: 'hybrid',
    cost: { min: 100, max: 2000, unit: 'credits', dynamic: true },
    time: { min: 2, max: 30, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Translate to target languages', provider: 'internal', estimatedTime: 10 },
      { step: 2, action: 'Generate audio per language', provider: 'internal', estimatedTime: 30 },
      { step: 3, action: 'Generate lip sync per language', provider: 'internal', estimatedTime: 120 }
    ],
    bestFor: ['International marketing', 'E-learning platforms', 'Corporate training', 'Product demos', 'YouTube global expansion'],
    examples: ['English demo → Spanish, French, German versions', 'Course → 20 languages instantly', 'CEO message → All regional offices'],
    tags: ['multilingual', 'dubbing', 'translation', 'international', 'b2b', 'NEW'],
    featured: true,
    popularityScore: 98
  },

  {
    id: 'reality-to-toon',
    name: 'Reality to Toon',
    description: 'Upload live-action video. System transforms to cartoon style while preserving motion and timing. Choose anime, Western cartoon, or 3D styles.',
    category: 'hybrid',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 3, max: 6, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze source video', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Transform to cartoon style', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Live action to animation', 'Explainer videos', 'Social media content', 'Music videos', 'Creative transformations'],
    examples: ['User video → Anime version', 'Dance video → Cartoon transformation', 'Product demo → Animated style'],
    tags: ['transformation', 'cartoon', 'anime', 'style-transfer', 'hybrid'],
    featured: true,
    popularityScore: 85
  },

  {
    id: 'style-chameleon',
    name: 'Style Chameleon',
    description: 'Upload video plus style reference. System transforms video to match reference style (cinematic, vintage, neon, oil painting, etc.).',
    category: 'hybrid',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze style reference', provider: 'internal', estimatedTime: 10 },
      { step: 2, action: 'Apply style transformation', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Artistic videos', 'Brand style matching', 'Music videos', 'Creative projects', 'Style consistency'],
    examples: ['Video → Oil painting style', 'Footage → Cyberpunk aesthetic', 'Content → Brand visual style'],
    tags: ['style-transfer', 'artistic', 'transformation', 'creative', 'hybrid'],
    featured: false,
    popularityScore: 75
  },

  {
    id: 'action-director',
    name: 'Action Director',
    description: 'Upload static image or video. System generates dynamic action sequence with camera movements, intensity levels, and choreography options.',
    category: 'hybrid',
    cost: { min: 100, max: 200, unit: 'credits' },
    time: { min: 3, max: 6, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze scene composition', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Generate action sequence', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['Action scenes', 'Dynamic sequences', 'Fight choreography', 'Sports content', 'Energy-driven videos'],
    examples: ['Static pose → Action sequence', 'Character → Fighting moves', 'Scene → Dynamic camera movement'],
    tags: ['action', 'dynamic', 'choreography', 'movement', 'hybrid'],
    featured: false,
    popularityScore: 78
  },

  {
    id: 'reverse-action-builder',
    name: 'Reverse Action Builder',
    description: 'Generate action sequence then automatically create reverse version. Perfect for time-reversal effects and creative transitions.',
    category: 'hybrid',
    cost: { min: 75, max: 100, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate forward action', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Create reversed version', provider: 'internal', estimatedTime: 30 }
    ],
    bestFor: ['Time reversal effects', 'Creative transitions', 'Magic tricks', 'Rewind sequences', 'Loop content'],
    examples: ['Object falling → Reverse to floating', 'Water splash → Reverse to gathering', 'Explosion → Reverse implosion'],
    tags: ['reverse', 'time-reversal', 'creative', 'effects', 'hybrid'],
    featured: false,
    popularityScore: 68
  },

  {
    id: 'bidirectional-storytelling',
    name: 'Bidirectional Storytelling',
    description: 'Generate narrative that works forward and backward. System creates scenes that tell coherent story in both directions.',
    category: 'hybrid',
    cost: { min: 150, max: 250, unit: 'credits' },
    time: { min: 5, max: 10, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate forward narrative', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 2, action: 'Create reverse narrative', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['Creative storytelling', 'Art projects', 'Experimental films', 'Unique narratives', 'Festival submissions'],
    examples: ['Story forward → Also works backward', 'Mystery reveal in both directions', 'Artistic narrative experiment'],
    tags: ['storytelling', 'narrative', 'creative', 'experimental', 'hybrid'],
    featured: false,
    popularityScore: 65
  },

  {
    id: 'voice-actor-match',
    name: 'Voice Actor Match',
    description: 'Upload character image and voice sample. System finds or generates matching voice, then creates lip-synced performance.',
    category: 'hybrid',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Analyze character and voice', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Generate matched performance', provider: 'internal', estimatedTime: 120 }
    ],
    bestFor: ['Character voice matching', 'Casting decisions', 'Voice auditions', 'Character development', 'Audio production'],
    examples: ['Character → Find matching voice', 'Voice sample → Generate character performance', 'Casting visualization'],
    tags: ['voice', 'casting', 'character', 'audio', 'hybrid'],
    featured: false,
    popularityScore: 72
  },

  {
    id: 'production-pipeline',
    name: 'Production Pipeline',
    description: 'Complete end-to-end workflow: screenplay input → scene generation → character consistency → editing → final export. All-in-one production.',
    category: 'hybrid',
    cost: { min: 300, max: 800, unit: 'credits', dynamic: true },
    time: { min: 10, max: 30, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Parse screenplay', provider: 'internal', estimatedTime: 30 },
      { step: 2, action: 'Generate scenes', provider: 'luma-ray-3', estimatedTime: 360 },
      { step: 3, action: 'Apply character consistency', provider: 'luma-modify', estimatedTime: 180 },
      { step: 4, action: 'Export final package', provider: 'internal', estimatedTime: 60 }
    ],
    bestFor: ['Complete film production', 'Professional projects', 'Client deliverables', 'Full production needs', 'Turnkey solutions'],
    examples: ['Screenplay → Complete video package', 'Script → Final edited film', 'Concept → Production-ready content'],
    tags: ['complete', 'production', 'pipeline', 'professional', 'end-to-end'],
    featured: true,
    popularityScore: 88
  },

  // ========================================
  // FANTASY & VFX (2 workflows)
  // ========================================
  {
    id: 'fantasy-epic',
    name: 'Fantasy Epic',
    description: 'Generate fantasy creatures (dragons, monsters, magical beings) with establishing shot, multiple angles, and action sequences with VFX enhancements.',
    category: 'fantasy',
    cost: { min: 200, max: 500, unit: 'credits', dynamic: true },
    time: { min: 4, max: 8, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate creature base', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Extract reference frame', provider: 'internal', estimatedTime: 5 },
      { step: 3, action: 'Generate angle variations', provider: 'luma-photon-flash', estimatedTime: 60 },
      { step: 4, action: 'Generate action sequences', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 5, action: 'Enhance with magical VFX', provider: 'luma-modify', estimatedTime: 90 }
    ],
    bestFor: ['Fantasy films', 'Game cinematics', 'Creature features', 'Magic scenes', 'Epic battles', 'Dragon content'],
    examples: ['Dragon concept → Flying sequence', 'Monster → Battle scene', 'Magical creature → Multiple actions'],
    tags: ['fantasy', 'creature', 'dragon', 'vfx', 'magic', 'epic'],
    featured: true,
    popularityScore: 93
  },

  {
    id: 'superhero-transform',
    name: 'Superhero Transform',
    description: 'Upload character image, add superpowers and transformation effects. Generate hero poses, power displays, and action sequences.',
    category: 'fantasy',
    cost: { min: 150, max: 250, unit: 'credits' },
    time: { min: 4, max: 7, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate base hero', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Add power effects', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Superhero content', 'Power displays', 'Transformation sequences', 'Comic adaptations', 'Action heroes'],
    examples: ['Character → Superhero transformation', 'Hero → Power display sequence', 'Origin story visualization'],
    tags: ['superhero', 'powers', 'transformation', 'action', 'vfx'],
    featured: false,
    popularityScore: 82
  },

  // ========================================
  // ANIMALS & CREATURES (2 workflows)
  // ========================================
  {
    id: 'animal-kingdom',
    name: 'Animal Kingdom',
    description: 'Generate realistic animal characters with multiple angles and natural behaviors. System ensures consistent appearance across shots.',
    category: 'animals',
    cost: { min: 100, max: 200, unit: 'credits' },
    time: { min: 3, max: 6, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate animal base', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Generate angle variations', provider: 'luma-photon-flash', estimatedTime: 60 },
      { step: 3, action: 'Generate behavior sequences', provider: 'luma-ray-3', estimatedTime: 120 }
    ],
    bestFor: ['Wildlife content', 'Animal documentaries', 'Pet animations', 'Nature videos', 'Educational content'],
    examples: ['Wolf → Pack behavior', 'Eagle → Flight sequence', 'Lion → Pride interactions'],
    tags: ['animals', 'wildlife', 'nature', 'creatures', 'realistic'],
    featured: false,
    popularityScore: 76
  },

  {
    id: 'anthro-character',
    name: 'Anthropomorphic Character',
    description: 'Create animal characters with human traits (walking, talking, expressions). Generate consistent character across multiple scenes.',
    category: 'animals',
    cost: { min: 120, max: 220, unit: 'credits' },
    time: { min: 4, max: 7, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate anthro base', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Generate expressions', provider: 'luma-photon-flash', estimatedTime: 60 },
      { step: 3, action: 'Animate character', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['Animated films', 'Character design', 'Brand mascots', 'Children content', 'Furry fandom'],
    examples: ['Fox character → Walking and talking', 'Cat → Humanlike gestures', 'Dog → Expressive dialogue'],
    tags: ['anthropomorphic', 'furry', 'character', 'mascot', 'animated'],
    featured: false,
    popularityScore: 74
  },

  // ========================================
  // PRODUCTION TOOLS (9 workflows)
  // ========================================
  {
    id: 'complete-scene',
    name: 'Complete Scene',
    description: 'Generate master establishing shot, then create character coverage and product shots with perfect scene consistency. Foundation workflow for Scene Builder.',
    category: 'production',
    cost: { min: 145, max: 689, unit: 'credits', dynamic: true },
    time: { min: 8, max: 15, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate master establishing shot', provider: 'auto-select', estimatedTime: 180 },
      { step: 2, action: 'Generate character coverage', provider: 'luma-modify', estimatedTime: 240, optional: true },
      { step: 3, action: 'Generate product shots', provider: 'luma-modify', estimatedTime: 240, optional: true }
    ],
    bestFor: ['Product advertisements', 'Character showcases', 'Commercial packages', 'Scene exploration', 'Multi-shot packages'],
    examples: ['Scene + character → 7 consistent shots', 'Product + model → Commercial package', 'Location → Multiple angles'],
    tags: ['complete-scene', 'consistency', 'commercial', 'professional', 'scene-builder'],
    featured: true,
    popularityScore: 100
  },

  {
    id: 'scene-bridge',
    name: 'Scene Bridge',
    description: 'Connect two video clips seamlessly. System generates transition that matches both source and destination aesthetics.',
    category: 'production',
    cost: { min: 75, max: 100, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze both clips', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Generate bridge transition', provider: 'luma-ray-3', estimatedTime: 120 }
    ],
    bestFor: ['Smooth transitions', 'Scene connections', 'Continuous narratives', 'Editing solutions', 'Flow improvements'],
    examples: ['Clip A → Seamless transition → Clip B', 'Indoor → Outdoor connection', 'Day → Night bridge'],
    tags: ['transition', 'bridge', 'seamless', 'editing', 'production'],
    featured: false,
    popularityScore: 72
  },

  {
    id: 'video-chain-builder',
    name: 'Video Chain Builder',
    description: 'Create sequences where each clip flows into the next. System generates multi-clip chain with consistent visual style.',
    category: 'production',
    cost: { min: 200, max: 400, unit: 'credits', dynamic: true },
    time: { min: 6, max: 12, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate first clip', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Generate chain clips', provider: 'luma-ray-3', estimatedTime: 360 }
    ],
    bestFor: ['Story sequences', 'Multi-scene narratives', 'Continuous action', 'Long-form content', 'Sequential storytelling'],
    examples: ['5-clip story sequence', 'Action chain across locations', 'Continuous narrative flow'],
    tags: ['sequence', 'chain', 'multi-clip', 'narrative', 'production'],
    featured: false,
    popularityScore: 78
  },

  {
    id: 'genre-camera-variants',
    name: 'Genre Camera Variants',
    description: 'Generate same scene with different genre-specific camera work: horror, action, romance, documentary, etc. Compare styles instantly.',
    category: 'production',
    cost: { min: 200, max: 300, unit: 'credits' },
    time: { min: 5, max: 8, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate base scene', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Generate genre variants', provider: 'luma-ray-3', estimatedTime: 240 }
    ],
    bestFor: ['Genre exploration', 'Style testing', 'Director previz', 'Creative decisions', 'Cinematography comparison'],
    examples: ['Scene → Horror, action, drama versions', 'Same content → Multiple genre treatments', 'Style comparison'],
    tags: ['genre', 'camera', 'variants', 'cinematography', 'production'],
    featured: false,
    popularityScore: 70
  },

  {
    id: 'shot-type-variants',
    name: 'Shot Type Variants',
    description: 'Generate scene with different shot types: wide, medium, close-up, POV, over-shoulder, etc. Complete coverage package.',
    category: 'production',
    cost: { min: 150, max: 300, unit: 'credits' },
    time: { min: 4, max: 8, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate base shot', provider: 'luma-ray-3', estimatedTime: 120 },
      { step: 2, action: 'Generate shot variants', provider: 'luma-ray-3', estimatedTime: 240 }
    ],
    bestFor: ['Complete coverage', 'Editing options', 'Professional packages', 'Shot variety', 'Coverage masters'],
    examples: ['Scene → Wide, medium, close versions', 'Character → All shot types', 'Coverage package'],
    tags: ['shot-types', 'coverage', 'variants', 'cinematography', 'production'],
    featured: false,
    popularityScore: 75
  },

  {
    id: 'vfx-elements',
    name: 'VFX Elements',
    description: 'Generate standalone VFX elements (explosions, smoke, fire, sparks, magic) for compositing into your projects.',
    category: 'production',
    cost: { min: 50, max: 100, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate VFX element', provider: 'luma-ray-3', estimatedTime: 120 }
    ],
    bestFor: ['VFX compositing', 'Element library', 'Post-production', 'Stock elements', 'Effect overlays'],
    examples: ['Explosion element', 'Smoke effect', 'Magic particles', 'Fire effect', 'Spark overlay'],
    tags: ['vfx', 'elements', 'effects', 'compositing', 'production'],
    featured: false,
    popularityScore: 73
  },

  {
    id: 'stock-footage-replacement',
    name: 'Stock Footage Replacement',
    description: 'Describe needed B-roll, system generates custom stock-quality footage. Replace expensive stock libraries with AI-generated alternatives.',
    category: 'production',
    cost: { min: 75, max: 150, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate stock-style footage', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['B-roll generation', 'Stock replacement', 'Budget productions', 'Custom stock', 'Quick assets'],
    examples: ['City skyline B-roll', 'Office environment', 'Nature footage', 'Product contexts', 'Generic backgrounds'],
    tags: ['stock', 'b-roll', 'footage', 'replacement', 'production'],
    featured: true,
    popularityScore: 85
  },

  {
    id: 'broll-master',
    name: 'B-Roll Master',
    description: 'Generate complete B-roll package for topic. System creates multiple relevant shots for cutting into main content.',
    category: 'production',
    cost: { min: 150, max: 300, unit: 'credits' },
    time: { min: 5, max: 10, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate B-roll package', provider: 'luma-ray-3', estimatedTime: 360 }
    ],
    bestFor: ['Video production', 'Documentary B-roll', 'YouTube content', 'Corporate videos', 'Editorial content'],
    examples: ['Tech video → Device B-roll package', 'Travel → Location shots', 'Product → Context footage'],
    tags: ['b-roll', 'footage', 'package', 'production', 'editorial'],
    featured: true,
    popularityScore: 87
  },

  {
    id: 'location-previs',
    name: 'Location Previsualization',
    description: 'Generate location concepts and camera setups before shoot. Test compositions, lighting, and blocking virtually.',
    category: 'production',
    cost: { min: 100, max: 200, unit: 'credits' },
    time: { min: 3, max: 6, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Generate location concepts', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['Location scouting', 'Pre-production', 'Director previz', 'Shot planning', 'Virtual scouting'],
    examples: ['Location concept → Test compositions', 'Virtual location scouting', 'Pre-shoot planning'],
    tags: ['previz', 'location', 'scouting', 'pre-production', 'planning'],
    featured: false,
    popularityScore: 68
  },

  // POST-PRODUCTION (7 workflows)
  {
    id: 'sdr-to-hdr-upgrade',
    name: 'SDR to HDR Upgrade',
    description: 'Upload any standard video (from Runway, iPhone, stock footage, etc.) and convert to 16-bit HDR with enhanced color range. Optional reframing and EXR export.',
    category: 'post-production',
    cost: { min: 100, max: 200, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Upgrade standard video to 16-bit HDR', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 2, action: 'Reframe to different aspect ratio (optional)', provider: 'luma-ray-3', estimatedTime: 60, optional: true },
      { step: 3, action: 'Export EXR frame sequence (optional)', provider: 'luma-ray-3', estimatedTime: 60, optional: true }
    ],
    outputs: {
      hdrVideo: '16-bit HDR upgrade (ACES2065-1)',
      reframed: 'Reframed to target aspect ratio (optional)',
      exrSequence: 'EXR frame sequence (optional)',
      enhancement: 'Vivid, accurate colors with enhanced dynamic range'
    },
    bestFor: ['Upgrade Runway videos to HDR', 'Transform iPhone footage to cinema HDR', 'Enhance stock footage to premium HDR', 'Retroactive HDR for old AI generations', 'Film festival HDR submissions'],
    examples: ['Runway video → HDR upgrade → Cinema reframe', 'iPhone product video → HDR → Client deliverable', 'Stock footage → HDR upgrade → High-end commercial'],
    tags: ['hdr', 'upgrade', 'sdr-to-hdr', 'cinema', 'professional', 'NEW'],
    featured: true,
    popularityScore: 95,
    marketingHighlights: ['🔥 Upgrade Runway videos to HDR', '🎬 Transform iPhone footage to cinema-grade HDR', '💰 Turn $10 stock into $500 HDR assets', '🏆 Only platform with SDR → HDR conversion']
  },

  {
    id: 'native-hdr-generation',
    name: 'Native HDR Generation',
    description: 'Generate video in HDR from the start. System creates 16-bit HDR content directly without conversion for maximum quality.',
    category: 'post-production',
    cost: { min: 150, max: 200, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate native 16-bit HDR video', provider: 'luma-ray-3', estimatedTime: 180 }
    ],
    bestFor: ['Premium projects from start', 'Cinema production', 'High-end deliverables', 'Film festivals', 'Professional finishing'],
    examples: ['Concept → Direct to cinema HDR', 'Scene → Native HDR generation', 'Premium content from start'],
    tags: ['hdr', 'native', 'cinema', 'premium', 'NEW'],
    featured: true,
    popularityScore: 90
  },

  {
    id: 'cinema-hdr-master',
    name: 'Cinema HDR Master',
    description: 'Complete cinema finishing workflow: HDR generation or upgrade, color grading, EXR export for DaVinci Resolve. Professional mastering.',
    category: 'post-production',
    cost: { min: 200, max: 400, unit: 'credits' },
    time: { min: 5, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate or upgrade to HDR', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 2, action: 'Professional color grading', provider: 'internal', estimatedTime: 60 },
      { step: 3, action: 'Export EXR for finishing', provider: 'internal', estimatedTime: 60 }
    ],
    bestFor: ['Cinema finishing', 'Film festivals', 'Professional mastering', 'Client deliverables', 'Theatrical release'],
    examples: ['Video → Cinema-grade master', 'Footage → DaVinci-ready EXR', 'Production → Festival submission'],
    tags: ['cinema', 'hdr', 'mastering', 'professional', 'NEW'],
    featured: true,
    popularityScore: 92
  },

  {
    id: 'hybrid-4k-hdr-pipeline',
    name: 'Hybrid 4K HDR Pipeline',
    description: 'Generate in 1080p, upscale to 4K, convert to HDR. Optimized pipeline for best quality-to-cost ratio.',
    category: 'post-production',
    cost: { min: 180, max: 280, unit: 'credits' },
    time: { min: 4, max: 8, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate 1080p base', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 2, action: 'Upscale to 4K', provider: 'runway', estimatedTime: 120 },
      { step: 3, action: 'Convert to HDR', provider: 'luma-ray-3', estimatedTime: 60 }
    ],
    bestFor: ['Cost-effective 4K HDR', 'Professional quality', 'Budget-conscious projects', 'High-quality output', 'Smart pipeline'],
    examples: ['1080p → 4K → HDR pipeline', 'Budget project → Premium output', 'Smart upscaling workflow'],
    tags: ['4k', 'hdr', 'hybrid', 'pipeline', 'NEW'],
    featured: false,
    popularityScore: 80
  },

  {
    id: 'multi-format-hdr-delivery',
    name: 'Multi-Format HDR Delivery',
    description: 'Generate HDR master, then export to all HDR standards: HDR10, Dolby Vision, HLG. Complete delivery package.',
    category: 'post-production',
    cost: { min: 250, max: 400, unit: 'credits' },
    time: { min: 6, max: 12, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate HDR master', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 2, action: 'Export multiple HDR formats', provider: 'internal', estimatedTime: 180 }
    ],
    bestFor: ['Broadcast delivery', 'Multi-platform distribution', 'Client packages', 'Universal compatibility', 'Professional delivery'],
    examples: ['Master → HDR10 + Dolby Vision + HLG', 'One source → All HDR formats', 'Complete delivery package'],
    tags: ['hdr', 'multi-format', 'delivery', 'broadcast', 'NEW'],
    featured: false,
    popularityScore: 78
  },

  {
    id: 'draft-to-hdr-master',
    name: 'Draft to HDR Master',
    description: 'Upload draft video, system enhances to HDR with quality improvements. Transform rough cuts into cinema masters.',
    category: 'post-production',
    cost: { min: 150, max: 250, unit: 'credits' },
    time: { min: 4, max: 7, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Analyze draft quality', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Upgrade to HDR with enhancements', provider: 'luma-ray-3', estimatedTime: 180 },
      { step: 3, action: 'Polish and finalize', provider: 'internal', estimatedTime: 60 }
    ],
    bestFor: ['Draft finishing', 'Quality upgrades', 'Client revisions', 'Fast turnarounds', 'Budget finishing'],
    examples: ['Rough cut → HDR master', 'Draft → Professional finish', 'Quick upgrade to premium'],
    tags: ['draft', 'upgrade', 'hdr', 'finishing', 'NEW'],
    featured: false,
    popularityScore: 75
  },

  {
    id: 'exr-export-professional',
    name: 'EXR Export Professional',
    description: 'Export any video to 16-bit EXR frame sequence for professional color grading in DaVinci Resolve or other tools.',
    category: 'post-production',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Export to EXR sequence', provider: 'internal', estimatedTime: 120 }
    ],
    bestFor: ['Professional grading', 'DaVinci Resolve workflow', 'Cinema finishing', 'Color grading', 'Post-production'],
    examples: ['Video → EXR sequence', 'Footage → DaVinci-ready frames', 'Professional export'],
    tags: ['exr', 'export', 'professional', 'grading', 'NEW'],
    featured: false,
    popularityScore: 70
  },

  // ========================================
  // VIDEO ENHANCEMENT (5 workflows)
  // ========================================
  {
    id: 'vfx-magic',
    name: 'VFX Magic',
    description: 'Upload existing video, describe effects (rain, fire, magic, powers). System adds VFX seamlessly while preserving original content.',
    category: 'video-enhancement',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Analyze source video', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Apply VFX effects', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Adding superhero powers', 'Weather effects (rain, snow, fog)', 'Magic and fantasy effects', 'Energy effects and glows', 'Action enhancements'],
    examples: ['Action shot → Add energy blast powers', 'Outdoor scene → Add rain and lightning', 'Character → Add superhero effects'],
    tags: ['vfx', 'enhancement', 'effects', 'magic', 'powers', 'NEW'],
    featured: true,
    popularityScore: 95
  },

  {
    id: 'scene-transformer',
    name: 'Scene Transformer',
    description: 'Upload video, change the environment and setting. Transform location, time of day, weather, or atmosphere while keeping action.',
    category: 'video-enhancement',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze scene structure', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Transform environment', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Location changes', 'Time of day shifts', 'Weather transformation', 'Environment replacement', 'Virtual sets'],
    examples: ['Day scene → Night version', 'Indoors → Outdoor setting', 'Clear → Rainy weather'],
    tags: ['transformation', 'environment', 'scene', 'enhancement', 'NEW'],
    featured: false,
    popularityScore: 82
  },

  {
    id: 'element-eraser',
    name: 'Element Eraser',
    description: 'Upload video, specify unwanted objects or elements. System removes them seamlessly with intelligent background fill.',
    category: 'video-enhancement',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 2, max: 4, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Detect and track elements', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Remove and fill background', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Object removal', 'Clean up shots', 'Remove unwanted elements', 'Background cleanup', 'Post-production fixes'],
    examples: ['Remove person from background', 'Erase unwanted objects', 'Clean up scene clutter'],
    tags: ['removal', 'cleanup', 'eraser', 'enhancement', 'NEW'],
    featured: false,
    popularityScore: 80
  },

  {
    id: 'product-reshoot',
    name: 'Product Reshoot',
    description: 'Upload product video, change product appearance, color, or branding without reshooting. Virtual product variants.',
    category: 'video-enhancement',
    cost: { min: 100, max: 150, unit: 'credits' },
    time: { min: 3, max: 5, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Identify product in video', provider: 'internal', estimatedTime: 15 },
      { step: 2, action: 'Transform product appearance', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Product variations', 'Color options showcase', 'Brand updates', 'Virtual reshoots', 'E-commerce content'],
    examples: ['Red product → Blue version', 'Logo update without reshoot', 'Show all color options'],
    tags: ['product', 'reshoot', 'variants', 'e-commerce', 'NEW'],
    featured: false,
    popularityScore: 78
  },

  {
    id: 'still-photo-performer',
    name: 'Still Photo Performer',
    description: 'Upload still photo, add motion and life. System animates static images with natural movement and camera motion.',
    category: 'video-enhancement',
    cost: { min: 75, max: 100, unit: 'credits' },
    time: { min: 2, max: 3, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Analyze photo composition', provider: 'internal', estimatedTime: 10 },
      { step: 2, action: 'Add motion and life', provider: 'luma-ray-3', estimatedTime: 120 }
    ],
    bestFor: ['Animate photos', 'Add life to stills', 'Photo to video', 'Ken Burns effects', 'Dynamic photography'],
    examples: ['Portrait → Breathing and subtle movement', 'Landscape → Camera pan', 'Product photo → Dynamic showcase'],
    tags: ['photo', 'animation', 'still-to-video', 'enhancement', 'NEW'],
    featured: false,
    popularityScore: 76
  },

  // ========================================
  // PERFORMANCE CAPTURE (8 workflows)
  // ========================================
  {
    id: 'anime-performance-capture',
    name: 'Anime Performance Capture',
    description: 'Record yourself acting, upload video. Your performance transfers to anime character with your expressions and movements.',
    category: 'performance-capture',
    cost: { min: 185, max: 185, unit: 'credits' },
    time: { min: 6, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate anime character', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Generate angle variations', provider: 'luma-photon-flash', estimatedTime: 60 },
      { step: 3, action: 'Transfer your performance', provider: 'runway', estimatedTime: 240 },
      { step: 4, action: 'Apply anime style', provider: 'luma-modify', estimatedTime: 90 }
    ],
    bestFor: ['BE your anime character', 'VTuber content', 'Anime performances', 'Voice actor visualization', 'Cosplay animation'],
    examples: ['Upload acting video → Become anime character', 'Your expressions → Anime version', 'Performance capture to anime'],
    tags: ['anime', 'performance-capture', 'act-two', 'vtuber', 'NEW'],
    featured: true,
    popularityScore: 88
  },

  {
    id: '3d-performance-capture',
    name: '3D Performance Capture',
    description: 'Record yourself, upload video. Transfer your performance to 3D character with Pixar-quality animation.',
    category: 'performance-capture',
    cost: { min: 185, max: 185, unit: 'credits' },
    time: { min: 6, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate 3D character', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Transfer performance', provider: 'runway', estimatedTime: 240 },
      { step: 3, action: 'Apply 3D rendering', provider: 'luma-modify', estimatedTime: 90 }
    ],
    bestFor: ['3D character animation', 'Game cinematics', 'Pixar-style content', 'Professional animation', 'Motion transfer'],
    examples: ['Your acting → 3D character', 'Performance → Pixar animation', 'Motion capture alternative'],
    tags: ['3d', 'performance-capture', 'pixar', 'animation', 'NEW'],
    featured: true,
    popularityScore: 85
  },

  {
    id: 'cartoon-performance-capture',
    name: 'Cartoon Performance Capture',
    description: 'Record yourself, system transfers performance to Western cartoon character with expressive animation.',
    category: 'performance-capture',
    cost: { min: 185, max: 185, unit: 'credits' },
    time: { min: 6, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate cartoon character', provider: 'luma-photon-flash', estimatedTime: 20 },
      { step: 2, action: 'Transfer performance', provider: 'runway', estimatedTime: 240 },
      { step: 3, action: 'Apply cartoon style', provider: 'luma-modify', estimatedTime: 90 }
    ],
    bestFor: ['Cartoon content', 'Kids entertainment', 'Animated series', 'Mascot performances', 'Family content'],
    examples: ['Your acting → Cartoon character', 'Performance → Disney-style animation', 'Live to cartoon transfer'],
    tags: ['cartoon', 'performance-capture', 'animation', 'family', 'NEW'],
    featured: false,
    popularityScore: 80
  },

  {
    id: 'anthro-performance-capture',
    name: 'Anthro Performance Capture',
    description: 'Transfer your performance to anthropomorphic animal character. Perfect for furry content creators.',
    category: 'performance-capture',
    cost: { min: 185, max: 185, unit: 'credits' },
    time: { min: 6, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Generate anthro character', provider: 'luma-photon-1', estimatedTime: 30 },
      { step: 2, action: 'Transfer performance', provider: 'runway', estimatedTime: 240 },
      { step: 3, action: 'Polish animation', provider: 'luma-modify', estimatedTime: 90 }
    ],
    bestFor: ['Furry content', 'Anthro characters', 'Animal mascots', 'Character performances', 'Furry fandom'],
    examples: ['Your acting → Furry character', 'Performance → Anthro animation', 'Human to animal character'],
    tags: ['anthro', 'furry', 'performance-capture', 'character', 'NEW'],
    featured: false,
    popularityScore: 75
  },

  {
    id: 'action-director-performance-capture',
    name: 'Action Director Performance',
    description: 'Perform action sequence, system captures and enhances with dynamic camera work and effects.',
    category: 'performance-capture',
    cost: { min: 200, max: 250, unit: 'credits' },
    time: { min: 6, max: 10, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Capture action performance', provider: 'runway', estimatedTime: 240 },
      { step: 2, action: 'Add dynamic camera work', provider: 'luma-modify', estimatedTime: 90 }
    ],
    bestFor: ['Action choreography', 'Fight scenes', 'Sports content', 'Dynamic sequences', 'Stunt visualization'],
    examples: ['Your stunts → Enhanced action scene', 'Fight moves → Cinema action', 'Performance → Dynamic video'],
    tags: ['action', 'performance-capture', 'choreography', 'dynamic', 'NEW'],
    featured: false,
    popularityScore: 78
  },

  {
    id: 'reality-to-toon-performance-capture',
    name: 'Reality to Toon Performance',
    description: 'Record live performance, system captures and transforms to cartoon while preserving your acting.',
    category: 'performance-capture',
    cost: { min: 200, max: 250, unit: 'credits' },
    time: { min: 6, max: 10, unit: 'minutes' },
    quality: 4,
    steps: [
      { step: 1, action: 'Capture performance', provider: 'runway', estimatedTime: 240 },
      { step: 2, action: 'Transform to cartoon', provider: 'runway-v2v', estimatedTime: 180 }
    ],
    bestFor: ['Live to animation', 'Hybrid performances', 'Creative transformations', 'Rotoscoping alternative', 'Artistic content'],
    examples: ['Live acting → Cartoon version', 'Dance → Animated style', 'Performance → Artistic transformation'],
    tags: ['hybrid', 'performance-capture', 'transformation', 'creative', 'NEW'],
    featured: false,
    popularityScore: 73
  },

  {
    id: 'complete-scene-performance-capture',
    name: 'Complete Scene Performance',
    description: 'Act out entire scene, system captures and generates complete scene package with multiple angles.',
    category: 'performance-capture',
    cost: { min: 300, max: 500, unit: 'credits' },
    time: { min: 10, max: 15, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Capture performance', provider: 'runway', estimatedTime: 240 },
      { step: 2, action: 'Generate scene package', provider: 'luma-ray-3', estimatedTime: 360 }
    ],
    bestFor: ['Complete scenes', 'Multi-angle coverage', 'Professional productions', 'Performance-driven content', 'Full scene capture'],
    examples: ['Act scene → Complete package', 'Performance → Multi-angle coverage', 'Your acting → Professional scene'],
    tags: ['complete-scene', 'performance-capture', 'multi-angle', 'professional', 'NEW'],
    featured: false,
    popularityScore: 77
  },

  {
    id: 'production-pipeline-performance-capture',
    name: 'Production Pipeline Performance',
    description: 'Record performances for entire production. System captures, processes, and delivers complete project with consistency.',
    category: 'performance-capture',
    cost: { min: 500, max: 1500, unit: 'credits', dynamic: true },
    time: { min: 15, max: 45, unit: 'minutes' },
    quality: 5,
    steps: [
      { step: 1, action: 'Capture all performances', provider: 'runway', estimatedTime: 600 },
      { step: 2, action: 'Process and assemble', provider: 'internal', estimatedTime: 600 }
    ],
    bestFor: ['Full productions', 'Series content', 'Complete projects', 'Professional pipelines', 'Large-scale content'],
    examples: ['Multiple scenes → Complete production', 'Series recording → Processed episodes', 'Full project capture'],
    tags: ['pipeline', 'performance-capture', 'complete', 'production', 'professional', 'NEW'],
    featured: false,
    popularityScore: 70
  },

  // Add remaining 51 workflows...
];

// Helper functions
export function getAllWorkflows() {
  return allWorkflows;
}

export function getWorkflowById(id) {
  return allWorkflows.find(w => w.id === id);
}

export function getWorkflowsByCategory(category) {
  return allWorkflows.filter(w => w.category === category);
}

export function getFeaturedWorkflows() {
  return allWorkflows.filter(w => w.featured).sort((a, b) => b.popularityScore - a.popularityScore);
}

export function getWorkflowsByTag(tag) {
  return allWorkflows.filter(w => w.tags?.includes(tag));
}

export const workflowCategories = [
  { id: 'photorealistic', name: 'Photorealistic', count: 6, color: 'blue' },
  { id: 'animated', name: 'Animated', count: 3, color: 'pink' },
  { id: 'budget', name: 'Budget / Speed', count: 5, color: 'yellow' },
  { id: 'hybrid', name: 'Hybrid & Transform', count: 11, color: 'purple' },
  { id: 'fantasy', name: 'Fantasy & VFX', count: 2, color: 'indigo' },
  { id: 'animals', name: 'Animals & Creatures', count: 2, color: 'green' },
  { id: 'production', name: 'Production Tools', count: 9, color: 'orange' },
  { id: 'performance-capture', name: 'Performance Capture', count: 8, color: 'red' },
  { id: 'post-production', name: 'Post-Production & HDR', count: 7, color: 'pink' },
  { id: 'video-enhancement', name: 'Video Enhancement', count: 5, color: 'cyan' },
];

