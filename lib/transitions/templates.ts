/**
 * Hollywood Transitions Library
 * 30 professional transitions organized by category
 */

export interface TransitionTemplate {
  id: string;
  name: string;
  category: 'motion' | 'graphic' | 'light' | 'shape' | 'cinematic';
  duration: number;
  description: string;
  ffmpegCommand: string;
  previewUrl: string;
  thumbnailUrl: string;
  isPremium: boolean;
  tags: string[];
  bestFor: string[];
  mood: string[];
  popularity: number;
  usageCount: number;
}

export const TRANSITION_TEMPLATES: TransitionTemplate[] = [
  // ========================================================================
  // MOTION TRANSITIONS (8)
  // ========================================================================
  {
    id: 'whip-pan',
    name: 'Whip Pan',
    category: 'motion',
    duration: 0.8,
    description: 'Fast horizontal camera movement blur - perfect for action sequences',
    ffmpegCommand: '[0:v]trim=start={clip1_start}:end={clip1_end},setpts=PTS-STARTPTS[v0];[1:v]trim=start={clip2_start}:end={clip2_end},setpts=PTS-STARTPTS[v1];[v0]boxblur=10:1,fade=t=out:st={fade_start}:d={duration}[v0blur];[v1]fade=t=in:st=0:d={duration}[v1fade];[v0blur][v1fade]xfade=transition=wipeleft:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/whip-pan.mp4',
    thumbnailUrl: '/transitions/thumbs/whip-pan.jpg',
    isPremium: false,
    tags: ['fast', 'dynamic', 'action', 'energetic'],
    bestFor: ['action', 'sports', 'montage'],
    mood: ['intense', 'energetic'],
    popularity: 95,
    usageCount: 4523,
  },
  {
    id: 'spin',
    name: 'Spin Transition',
    category: 'motion',
    duration: 1.0,
    description: '360° rotation blur - dramatic scene change',
    ffmpegCommand: '[0:v]rotate=\'2*PI*t/{duration}:c=none\',fade=t=out:st={fade_start}:d={duration}[v0spin];[1:v]fade=t=in:st=0:d={duration}[v1];[v0spin][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/spin.mp4',
    thumbnailUrl: '/transitions/thumbs/spin.jpg',
    isPremium: true,
    tags: ['dramatic', 'disorienting', 'stylized'],
    bestFor: ['thriller', 'action', 'drama'],
    mood: ['intense', 'mysterious'],
    popularity: 88,
    usageCount: 3201,
  },
  {
    id: 'zoom-blur',
    name: 'Zoom Blur',
    category: 'motion',
    duration: 0.8,
    description: 'Zoom in → zoom out transition - great for reveals',
    ffmpegCommand: '[0:v]zoompan=z=\'min(zoom+0.0015,1.5)\':d={duration}*25,fade=t=out:st={fade_start}:d={duration}[v0zoom];[1:v]fade=t=in:st=0:d={duration}[v1];[v0zoom][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/zoom-blur.mp4',
    thumbnailUrl: '/transitions/thumbs/zoom-blur.jpg',
    isPremium: false,
    tags: ['smooth', 'reveal', 'focus'],
    bestFor: ['documentary', 'drama', 'narrative'],
    mood: ['calm', 'mysterious'],
    popularity: 92,
    usageCount: 4109,
  },
  {
    id: 'shake',
    name: 'Shake Transition',
    category: 'motion',
    duration: 0.5,
    description: 'Handheld camera shake - adds urgency and chaos',
    ffmpegCommand: '[0:v]crop=iw-10:ih-10,scale=iw+10:ih+10,boxblur=5:1,fade=t=out:st={fade_start}:d={duration}[v0shake];[1:v]fade=t=in:st=0:d={duration}[v1];[v0shake][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/shake.mp4',
    thumbnailUrl: '/transitions/thumbs/shake.jpg',
    isPremium: false,
    tags: ['chaotic', 'urgent', 'handheld'],
    bestFor: ['action', 'horror', 'thriller'],
    mood: ['intense', 'energetic'],
    popularity: 85,
    usageCount: 2890,
  },
  {
    id: 'dolly-zoom',
    name: 'Dolly Zoom (Vertigo Effect)',
    category: 'motion',
    duration: 1.2,
    description: 'Hitchcock-style zoom - unnerving and dramatic',
    ffmpegCommand: '[0:v]zoompan=z=\'min(1.5-0.5*t/{duration},1.5)\':d={duration}*25,fade=t=out:st={fade_start}:d={duration}[v0dolly];[1:v]fade=t=in:st=0:d={duration}[v1];[v0dolly][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/dolly-zoom.mp4',
    thumbnailUrl: '/transitions/thumbs/dolly-zoom.jpg',
    isPremium: true,
    tags: ['cinematic', 'unsettling', 'dramatic'],
    bestFor: ['thriller', 'horror', 'drama'],
    mood: ['tense', 'mysterious'],
    popularity: 78,
    usageCount: 1956,
  },
  {
    id: 'dutch-angle',
    name: 'Dutch Angle Roll',
    category: 'motion',
    duration: 0.8,
    description: 'Tilted camera rotation - creates disorientation',
    ffmpegCommand: '[0:v]rotate=\'PI/6*t/{duration}\',fade=t=out:st={fade_start}:d={duration}[v0dutch];[1:v]fade=t=in:st=0:d={duration}[v1];[v0dutch][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/dutch-angle.mp4',
    thumbnailUrl: '/transitions/thumbs/dutch-angle.jpg',
    isPremium: false,
    tags: ['tilted', 'disorienting', 'stylized'],
    bestFor: ['thriller', 'action', 'experimental'],
    mood: ['tense', 'chaotic'],
    popularity: 72,
    usageCount: 1523,
  },
  {
    id: 'pull-focus',
    name: 'Pull Focus Blur',
    category: 'motion',
    duration: 1.0,
    description: 'Rack focus effect - shifts viewer attention',
    ffmpegCommand: '[0:v]boxblur=30:1,fade=t=out:st={fade_start}:d={duration}[v0blur];[1:v]fade=t=in:st=0:d={duration}[v1];[v0blur][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/pull-focus.mp4',
    thumbnailUrl: '/transitions/thumbs/pull-focus.jpg',
    isPremium: false,
    tags: ['smooth', 'cinematic', 'professional'],
    bestFor: ['drama', 'documentary', 'narrative'],
    mood: ['calm', 'thoughtful'],
    popularity: 90,
    usageCount: 3845,
  },
  {
    id: 'crash-zoom',
    name: 'Crash Zoom',
    category: 'motion',
    duration: 0.6,
    description: 'Rapid zoom - adds sudden impact',
    ffmpegCommand: '[0:v]zoompan=z=\'min(1+2*t/{duration},3)\':d={duration}*25,fade=t=out:st={fade_start}:d={duration}[v0crash];[1:v]fade=t=in:st=0:d={duration}[v1];[v0crash][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/crash-zoom.mp4',
    thumbnailUrl: '/transitions/thumbs/crash-zoom.jpg',
    isPremium: true,
    tags: ['fast', 'dramatic', 'impact'],
    bestFor: ['comedy', 'action', 'documentary'],
    mood: ['energetic', 'surprising'],
    popularity: 81,
    usageCount: 2456,
  },

  // ========================================================================
  // GRAPHIC TRANSITIONS (6)
  // ========================================================================
  {
    id: 'ink-bleed',
    name: 'Ink Bleed',
    category: 'graphic',
    duration: 1.5,
    description: 'Organic ink-like spread - artistic and fluid',
    ffmpegCommand: '[0:v][1:v]xfade=transition=circleopen:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/ink-bleed.mp4',
    thumbnailUrl: '/transitions/thumbs/ink-bleed.jpg',
    isPremium: true,
    tags: ['artistic', 'organic', 'fluid'],
    bestFor: ['art', 'documentary', 'creative'],
    mood: ['calm', 'artistic'],
    popularity: 76,
    usageCount: 1890,
  },
  {
    id: 'pixelate',
    name: 'Pixelate Morph',
    category: 'graphic',
    duration: 1.0,
    description: 'Digital pixelation effect - tech/gaming aesthetic',
    ffmpegCommand: '[0:v][1:v]xfade=transition=pixelize:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/pixelate.mp4',
    thumbnailUrl: '/transitions/thumbs/pixelate.jpg',
    isPremium: false,
    tags: ['digital', 'retro', 'gaming'],
    bestFor: ['tech', 'gaming', 'tutorial'],
    mood: ['playful', 'modern'],
    popularity: 84,
    usageCount: 2678,
  },
  {
    id: 'film-burn',
    name: 'Film Burn',
    category: 'graphic',
    duration: 1.2,
    description: 'Vintage film damage effect - nostalgic feel',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}:color=orange[v0burn];[1:v]fade=t=in:st=0:d={duration}[v1];[v0burn][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/film-burn.mp4',
    thumbnailUrl: '/transitions/thumbs/film-burn.jpg',
    isPremium: false,
    tags: ['vintage', 'retro', 'nostalgic'],
    bestFor: ['documentary', 'flashback', 'period'],
    mood: ['nostalgic', 'warm'],
    popularity: 87,
    usageCount: 3123,
  },
  {
    id: 'glitch',
    name: 'Digital Glitch',
    category: 'graphic',
    duration: 0.8,
    description: 'Digital distortion effect - cyberpunk aesthetic',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}[v0glitch];[1:v]fade=t=in:st=0:d={duration}[v1];[v0glitch][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/glitch.mp4',
    thumbnailUrl: '/transitions/thumbs/glitch.jpg',
    isPremium: true,
    tags: ['digital', 'cyberpunk', 'modern'],
    bestFor: ['tech', 'sci-fi', 'experimental'],
    mood: ['chaotic', 'modern'],
    popularity: 89,
    usageCount: 3567,
  },
  {
    id: 'chromatic',
    name: 'Chromatic Aberration',
    category: 'graphic',
    duration: 0.8,
    description: 'RGB split effect - adds visual distortion',
    ffmpegCommand: '[0:v][1:v]xfade=transition=horzopen:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/chromatic.mp4',
    thumbnailUrl: '/transitions/thumbs/chromatic.jpg',
    isPremium: false,
    tags: ['colorful', 'distorted', 'modern'],
    bestFor: ['music video', 'creative', 'experimental'],
    mood: ['energetic', 'artistic'],
    popularity: 79,
    usageCount: 2234,
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope Twist',
    category: 'graphic',
    duration: 1.5,
    description: 'Symmetrical pattern rotation - trippy effect',
    ffmpegCommand: '[0:v][1:v]xfade=transition=circleopen:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/kaleidoscope.mp4',
    thumbnailUrl: '/transitions/thumbs/kaleidoscope.jpg',
    isPremium: true,
    tags: ['trippy', 'symmetrical', 'artistic'],
    bestFor: ['music video', 'experimental', 'creative'],
    mood: ['playful', 'psychedelic'],
    popularity: 74,
    usageCount: 1678,
  },

  // ========================================================================
  // LIGHT TRANSITIONS (5)
  // ========================================================================
  {
    id: 'lens-flare',
    name: 'Lens Flare Wash',
    category: 'light',
    duration: 1.0,
    description: 'Light burst across frame - cinematic feel',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}:color=white[v0flare];[1:v]fade=t=in:st=0:d={duration}[v1];[v0flare][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/lens-flare.mp4',
    thumbnailUrl: '/transitions/thumbs/lens-flare.jpg',
    isPremium: false,
    tags: ['bright', 'cinematic', 'dramatic'],
    bestFor: ['epic', 'sci-fi', 'action'],
    mood: ['dramatic', 'epic'],
    popularity: 91,
    usageCount: 3956,
  },
  {
    id: 'light-leak',
    name: 'Light Leak',
    category: 'light',
    duration: 1.2,
    description: 'Organic light spill - dreamy aesthetic',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}:color=yellow[v0leak];[1:v]fade=t=in:st=0:d={duration}[v1];[v0leak][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/light-leak.mp4',
    thumbnailUrl: '/transitions/thumbs/light-leak.jpg',
    isPremium: false,
    tags: ['dreamy', 'organic', 'warm'],
    bestFor: ['romance', 'drama', 'documentary'],
    mood: ['calm', 'dreamy'],
    popularity: 86,
    usageCount: 2912,
  },
  {
    id: 'flash',
    name: 'Flash Cut',
    category: 'light',
    duration: 0.3,
    description: 'Quick white flash - instant transition',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}:color=white[v0flash];[1:v]fade=t=in:st=0:d={duration}[v1];[v0flash][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/flash.mp4',
    thumbnailUrl: '/transitions/thumbs/flash.jpg',
    isPremium: false,
    tags: ['fast', 'bright', 'instant'],
    bestFor: ['action', 'montage', 'sports'],
    mood: ['energetic', 'intense'],
    popularity: 93,
    usageCount: 4234,
  },
  {
    id: 'sun-flare',
    name: 'Sun Flare Bloom',
    category: 'light',
    duration: 1.5,
    description: 'Natural sunlight bloom - outdoor aesthetic',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}:color=yellow[v0sun];[1:v]fade=t=in:st=0:d={duration}[v1];[v0sun][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/sun-flare.mp4',
    thumbnailUrl: '/transitions/thumbs/sun-flare.jpg',
    isPremium: true,
    tags: ['natural', 'warm', 'cinematic'],
    bestFor: ['travel', 'documentary', 'outdoor'],
    mood: ['warm', 'uplifting'],
    popularity: 82,
    usageCount: 2567,
  },
  {
    id: 'strobe',
    name: 'Strobe Flash',
    category: 'light',
    duration: 0.6,
    description: 'Rapid light pulses - high energy',
    ffmpegCommand: '[0:v]fade=t=out:st={fade_start}:d={duration}[v0strobe];[1:v]fade=t=in:st=0:d={duration}[v1];[v0strobe][v1]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/strobe.mp4',
    thumbnailUrl: '/transitions/thumbs/strobe.jpg',
    isPremium: false,
    tags: ['fast', 'energetic', 'club'],
    bestFor: ['music video', 'club', 'action'],
    mood: ['energetic', 'intense'],
    popularity: 77,
    usageCount: 2001,
  },

  // ========================================================================
  // SHAPE TRANSITIONS (6)
  // ========================================================================
  {
    id: 'circle-wipe',
    name: 'Circle Wipe',
    category: 'shape',
    duration: 1.0,
    description: 'Circular reveal - classic transition',
    ffmpegCommand: '[0:v][1:v]xfade=transition=circleopen:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/circle-wipe.mp4',
    thumbnailUrl: '/transitions/thumbs/circle-wipe.jpg',
    isPremium: false,
    tags: ['classic', 'smooth', 'geometric'],
    bestFor: ['all', 'general', 'professional'],
    mood: ['neutral', 'professional'],
    popularity: 94,
    usageCount: 4456,
  },
  {
    id: 'iris',
    name: 'Iris In/Out',
    category: 'shape',
    duration: 1.0,
    description: 'Silent film-style iris - vintage aesthetic',
    ffmpegCommand: '[0:v][1:v]xfade=transition=circleclose:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/iris.mp4',
    thumbnailUrl: '/transitions/thumbs/iris.jpg',
    isPremium: false,
    tags: ['vintage', 'classic', 'comedic'],
    bestFor: ['comedy', 'vintage', 'creative'],
    mood: ['playful', 'nostalgic'],
    popularity: 80,
    usageCount: 2345,
  },
  {
    id: 'diamond',
    name: 'Diamond Reveal',
    category: 'shape',
    duration: 1.2,
    description: 'Diamond-shaped wipe - elegant transition',
    ffmpegCommand: '[0:v][1:v]xfade=transition=diagtl:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/diamond.mp4',
    thumbnailUrl: '/transitions/thumbs/diamond.jpg',
    isPremium: true,
    tags: ['elegant', 'geometric', 'classic'],
    bestFor: ['wedding', 'luxury', 'formal'],
    mood: ['elegant', 'formal'],
    popularity: 75,
    usageCount: 1789,
  },
  {
    id: 'clock-wipe',
    name: 'Clock Wipe',
    category: 'shape',
    duration: 1.5,
    description: 'Rotating sweep transition - time-themed',
    ffmpegCommand: '[0:v][1:v]xfade=transition=circleopen:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/clock-wipe.mp4',
    thumbnailUrl: '/transitions/thumbs/clock-wipe.jpg',
    isPremium: false,
    tags: ['time', 'rotation', 'smooth'],
    bestFor: ['documentary', 'time-lapse', 'educational'],
    mood: ['methodical', 'professional'],
    popularity: 78,
    usageCount: 2134,
  },
  {
    id: 'split-screen',
    name: 'Split Screen Slide',
    category: 'shape',
    duration: 1.0,
    description: 'Horizontal/vertical split reveal',
    ffmpegCommand: '[0:v][1:v]xfade=transition=slideleft:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/split-screen.mp4',
    thumbnailUrl: '/transitions/thumbs/split-screen.jpg',
    isPremium: false,
    tags: ['clean', 'modern', 'professional'],
    bestFor: ['corporate', 'tutorial', 'comparison'],
    mood: ['professional', 'clean'],
    popularity: 88,
    usageCount: 3345,
  },
  {
    id: 'barn-door',
    name: 'Barn Door',
    category: 'shape',
    duration: 1.2,
    description: 'Double-door opening effect - theatrical',
    ffmpegCommand: '[0:v][1:v]xfade=transition=horzopen:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/barn-door.mp4',
    thumbnailUrl: '/transitions/thumbs/barn-door.jpg',
    isPremium: false,
    tags: ['theatrical', 'classic', 'elegant'],
    bestFor: ['theater', 'presentation', 'formal'],
    mood: ['formal', 'theatrical'],
    popularity: 73,
    usageCount: 1567,
  },

  // ========================================================================
  // CINEMATIC TRANSITIONS (5)
  // ========================================================================
  {
    id: 'smash-cut',
    name: 'Smash Cut',
    category: 'cinematic',
    duration: 0.2,
    description: 'Instant hard cut - dramatic impact',
    ffmpegCommand: '[0:v][1:v]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/smash-cut.mp4',
    thumbnailUrl: '/transitions/thumbs/smash-cut.jpg',
    isPremium: false,
    tags: ['instant', 'dramatic', 'powerful'],
    bestFor: ['action', 'thriller', 'horror'],
    mood: ['intense', 'shocking'],
    popularity: 85,
    usageCount: 2890,
  },
  {
    id: 'match-cut',
    name: 'Match Cut',
    category: 'cinematic',
    duration: 0.5,
    description: 'Visual/thematic match between scenes',
    ffmpegCommand: '[0:v][1:v]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/match-cut.mp4',
    thumbnailUrl: '/transitions/thumbs/match-cut.jpg',
    isPremium: true,
    tags: ['artistic', 'cinematic', 'clever'],
    bestFor: ['narrative', 'art', 'documentary'],
    mood: ['thoughtful', 'artistic'],
    popularity: 92,
    usageCount: 4012,
  },
  {
    id: 'j-cut',
    name: 'J-Cut',
    category: 'cinematic',
    duration: 0.8,
    description: 'Audio leads video - professional editing',
    ffmpegCommand: '[0:v][1:v]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/j-cut.mp4',
    thumbnailUrl: '/transitions/thumbs/j-cut.jpg',
    isPremium: false,
    tags: ['professional', 'smooth', 'audio-visual'],
    bestFor: ['all', 'interview', 'narrative'],
    mood: ['professional', 'smooth'],
    popularity: 96,
    usageCount: 4789,
  },
  {
    id: 'l-cut',
    name: 'L-Cut',
    category: 'cinematic',
    duration: 0.8,
    description: 'Video leads audio - smooth flow',
    ffmpegCommand: '[0:v][1:v]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/l-cut.mp4',
    thumbnailUrl: '/transitions/thumbs/l-cut.jpg',
    isPremium: false,
    tags: ['professional', 'smooth', 'audio-visual'],
    bestFor: ['all', 'interview', 'narrative'],
    mood: ['professional', 'smooth'],
    popularity: 95,
    usageCount: 4656,
  },
  {
    id: 'crossfade',
    name: 'Dissolve (Crossfade)',
    category: 'cinematic',
    duration: 1.0,
    description: 'Classic smooth fade - timeless transition',
    ffmpegCommand: '[0:v][1:v]xfade=transition=fade:duration={duration}:offset={offset}[vout]',
    previewUrl: '/transitions/previews/crossfade.mp4',
    thumbnailUrl: '/transitions/thumbs/crossfade.jpg',
    isPremium: false,
    tags: ['classic', 'smooth', 'timeless'],
    bestFor: ['all', 'general', 'professional'],
    mood: ['calm', 'professional'],
    popularity: 98,
    usageCount: 5234,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all transitions
 */
export function getAllTransitions(): TransitionTemplate[] {
  return TRANSITION_TEMPLATES;
}

/**
 * Get transitions by category
 */
export function getTransitionsByCategory(category: TransitionTemplate['category']): TransitionTemplate[] {
  return TRANSITION_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get transition by ID
 */
export function getTransitionById(id: string): TransitionTemplate | undefined {
  return TRANSITION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get free transitions
 */
export function getFreeTransitions(): TransitionTemplate[] {
  return TRANSITION_TEMPLATES.filter(t => !t.isPremium);
}

/**
 * Get premium transitions
 */
export function getPremiumTransitions(): TransitionTemplate[] {
  return TRANSITION_TEMPLATES.filter(t => t.isPremium);
}

/**
 * Search transitions
 */
export function searchTransitions(query: string): TransitionTemplate[] {
  const lowerQuery = query.toLowerCase();
  return TRANSITION_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    t.bestFor.some(bf => bf.toLowerCase().includes(lowerQuery))
  );
}
