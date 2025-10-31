/**
 * useTimeline Hook
 * 
 * Centralized state management for Timeline Editor
 * Handles clips, playback, selection, and persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Snap time to nearest frame boundary for frame-accurate positioning
 * @param time Time in seconds
 * @param frameRate Project frame rate (24, 30, or 60 fps)
 * @returns Frame-aligned time in seconds
 */
export function snapToFrame(time: number, frameRate: number): number {
  const frameDuration = 1 / frameRate;  // e.g., 1/30 = 0.033333s per frame
  const frameNumber = Math.round(time / frameDuration);
  return frameNumber * frameDuration;
}

/**
 * Filter out clips hidden by compositions
 * Used when rendering timeline to hide source clips
 */
export function getVisibleAssets(assets: TimelineAsset[]): TimelineAsset[] {
  return assets.filter(asset => !asset.hiddenByComposition);
}

/**
 * Get source clips for a composition
 * Returns all clips hidden by the given composition ID
 */
export function getCompositionSourceClips(
  assets: TimelineAsset[], 
  compositionId: string
): TimelineAsset[] {
  return assets.filter(asset => asset.hiddenByComposition === compositionId);
}

/**
 * Calculate total credits used in project (Feature 0064)
 */
export function calculateProjectCost(assets: TimelineAsset[]): number {
  return assets.reduce((total, asset) => {
    const assetCost = asset.assetMetadata?.creditsUsed || 0;
    const compositionCost = asset.compositionMetadata?.creditsUsed || 0;
    return total + assetCost + compositionCost;
  }, 0);
}

/**
 * Get cost breakdown by asset type (Feature 0064)
 */
export function getCostBreakdown(assets: TimelineAsset[]): {
  videos: number;
  images: number;
  audio: number;
  compositions: number;
  uploads: number;
  total: number;
} {
  const breakdown = {
    videos: 0,
    images: 0,
    audio: 0,
    compositions: 0,
    uploads: 0,
    total: 0
  };
  
  assets.forEach(asset => {
    const cost = asset.assetMetadata?.creditsUsed || 0;
    
    if (asset.assetMetadata?.sourceType === 'ai-video') {
      breakdown.videos += cost;
    } else if (asset.assetMetadata?.sourceType === 'ai-image') {
      breakdown.images += cost;
    } else if (asset.assetMetadata?.sourceType === 'ai-audio' || 
               asset.assetMetadata?.sourceType === 'ai-music' ||
               asset.assetMetadata?.sourceType === 'ai-voice') {
      breakdown.audio += cost;
    } else if (asset.assetMetadata?.sourceType === 'uploaded') {
      breakdown.uploads += 0; // Always 0
    }
    
    if (asset.compositionMetadata) {
      breakdown.compositions += asset.compositionMetadata.creditsUsed;
    }
  });
  
  breakdown.total = breakdown.videos + breakdown.images + 
                   breakdown.audio + breakdown.compositions;
  
  return breakdown;
}

/**
 * Get asset count by source type (Feature 0064)
 */
export function getAssetCountByType(assets: TimelineAsset[]): {
  aiVideos: number;
  aiImages: number;
  aiAudio: number;
  uploads: number;
  compositions: number;
  total: number;
} {
  const counts = {
    aiVideos: 0,
    aiImages: 0,
    aiAudio: 0,
    uploads: 0,
    compositions: 0,
    total: assets.length
  };
  
  assets.forEach(asset => {
    if (asset.assetMetadata?.sourceType === 'ai-video') {
      counts.aiVideos++;
    } else if (asset.assetMetadata?.sourceType === 'ai-image') {
      counts.aiImages++;
    } else if (asset.assetMetadata?.sourceType === 'ai-audio' || 
               asset.assetMetadata?.sourceType === 'ai-music' ||
               asset.assetMetadata?.sourceType === 'ai-voice') {
      counts.aiAudio++;
    } else if (asset.assetMetadata?.sourceType === 'uploaded') {
      counts.uploads++;
    }
    
    if (asset.isComposition) {
      counts.compositions++;
    }
  });
  
  return counts;
}

/**
 * Validate file size for upload (Feature 0064 - Performance)
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Check for RAW/professional formats
  if (PROXY_REQUIRED_FORMATS.includes(ext as any)) {
    if (file.size > MAX_FILE_SIZES.raw) {
      return {
        valid: false,
        error: `Professional format ${ext.toUpperCase()} limited to 1GB. Consider converting to MP4 for timeline editing.`
      };
    }
    return { valid: true }; // Will need proxy generation
  }
  
  // Check standard limits
  if (file.type.startsWith('video/')) {
    if (file.size > MAX_FILE_SIZES.video) {
      return {
        valid: false,
        error: `Video files limited to 500MB for smooth playback. Please compress or convert to MP4.`
      };
    }
  } else if (file.type.startsWith('image/')) {
    if (file.size > MAX_FILE_SIZES.image) {
      return {
        valid: false,
        error: `Image files limited to 50MB. Please compress or resize.`
      };
    }
  } else if (file.type.startsWith('audio/')) {
    if (file.size > MAX_FILE_SIZES.audio) {
      return {
        valid: false,
        error: `Audio files limited to 100MB. Please compress to MP3 or AAC.`
      };
    }
  }
  
  return { valid: true };
}

/**
 * Check if file needs proxy generation (Feature 0064 - Performance)
 */
export function needsProxyGeneration(filename: string, fileSize: number): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  // Professional formats always need proxy
  if (PROXY_REQUIRED_FORMATS.includes(ext as any)) {
    return true;
  }
  
  // Large files need proxy (>200MB)
  if (fileSize > 200 * 1024 * 1024) {
    return true;
  }
  
  return false;
}

/**
 * Get recommended format message (Feature 0064 - Performance)
 */
export function getFormatRecommendation(mimeType: string): string | null {
  if (mimeType.startsWith('video/')) {
    const recommended = RECOMMENDED_FORMATS.video;
    return `For best timeline performance, we recommend: ${recommended.join(', ').toUpperCase()}`;
  } else if (mimeType.startsWith('image/')) {
    const recommended = RECOMMENDED_FORMATS.image;
    return `For best performance, we recommend: ${recommended.join(', ').toUpperCase()}`;
  } else if (mimeType.startsWith('audio/')) {
    const recommended = RECOMMENDED_FORMATS.audio;
    return `For best performance, we recommend: ${recommended.join(', ').toUpperCase()}`;
  }
  return null;
}

// ==================== TYPES ====================

// Asset Types
export type AssetType = 'video' | 'audio' | 'image' | 'music';
export type TrackType = 'video' | 'audio';

// File size limits (Feature 0064 - Performance)
export const MAX_FILE_SIZES = {
  video: 500 * 1024 * 1024,      // 500MB max for smooth playback
  image: 50 * 1024 * 1024,       // 50MB max
  audio: 100 * 1024 * 1024,      // 100MB max
  raw: 1000 * 1024 * 1024,       // 1GB for professional formats only
} as const;

// Recommended formats for best performance
export const RECOMMENDED_FORMATS = {
  video: ['mp4', 'webm', 'mov'],  // Streaming-friendly
  image: ['jpeg', 'png', 'webp'],  // Web-optimized
  audio: ['mp3', 'aac', 'opus'],   // Compressed
} as const;

// Formats requiring proxy generation
export const PROXY_REQUIRED_FORMATS = [
  'prores', 'dnxhd', 'dnxhr', 'raw', 'braw', 'mxf', 
  'avi', 'mkv', 'flv'
] as const;

// ==================== HOLLYWOOD TRANSITIONS (Feature 0065) ====================

export const HOLLYWOOD_TRANSITIONS = [
  // Fade Family
  { id: 'fade', name: 'Fade', category: 'fade', duration: 1.0, icon: '◐' },
  { id: 'fadeblack', name: 'Fade to Black', category: 'fade', duration: 1.0, icon: '●' },
  { id: 'fadewhite', name: 'Fade to White', category: 'fade', duration: 1.0, icon: '○' },
  { id: 'fadegrays', name: 'Fade Grays', category: 'fade', duration: 1.0, icon: '◑' },
  { id: 'dissolve', name: 'Cross Dissolve', category: 'fade', duration: 1.0, icon: '⊗' },
  { id: 'distance', name: 'Distance', category: 'fade', duration: 1.0, icon: '⧉' },
  
  // Wipe Family
  { id: 'wipeleft', name: 'Wipe Left', category: 'wipe', duration: 0.5, icon: '◀' },
  { id: 'wiperight', name: 'Wipe Right', category: 'wipe', duration: 0.5, icon: '▶' },
  { id: 'wipeup', name: 'Wipe Up', category: 'wipe', duration: 0.5, icon: '▲' },
  { id: 'wipedown', name: 'Wipe Down', category: 'wipe', duration: 0.5, icon: '▼' },
  { id: 'wipebl', name: 'Wipe Bottom-Left', category: 'wipe', duration: 0.5, icon: '◣' },
  { id: 'wipebr', name: 'Wipe Bottom-Right', category: 'wipe', duration: 0.5, icon: '◢' },
  { id: 'wipetl', name: 'Wipe Top-Left', category: 'wipe', duration: 0.5, icon: '◤' },
  { id: 'wipetr', name: 'Wipe Top-Right', category: 'wipe', duration: 0.5, icon: '◥' },
  
  // Slide Family
  { id: 'slideleft', name: 'Slide Left', category: 'slide', duration: 0.5, icon: '⬅' },
  { id: 'slideright', name: 'Slide Right', category: 'slide', duration: 0.5, icon: '➡' },
  { id: 'slideup', name: 'Slide Up', category: 'slide', duration: 0.5, icon: '⬆' },
  { id: 'slidedown', name: 'Slide Down', category: 'slide', duration: 0.5, icon: '⬇' },
  { id: 'smoothleft', name: 'Smooth Left', category: 'slide', duration: 0.7, icon: '⇐' },
  { id: 'smoothright', name: 'Smooth Right', category: 'slide', duration: 0.7, icon: '⇒' },
  { id: 'smoothup', name: 'Smooth Up', category: 'slide', duration: 0.7, icon: '⇑' },
  { id: 'smoothdown', name: 'Smooth Down', category: 'slide', duration: 0.7, icon: '⇓' },
  
  // Zoom Family
  { id: 'zoomin', name: 'Zoom In', category: 'zoom', duration: 0.8, icon: '🔍+' },
  { id: 'fadefast', name: 'Zoom Fade', category: 'zoom', duration: 0.6, icon: '🔎' },
  { id: 'fadeslow', name: 'Slow Zoom', category: 'zoom', duration: 1.5, icon: '⊕' },
  
  // Rotate Family
  { id: 'circleopen', name: 'Circle Open', category: 'rotate', duration: 0.8, icon: '○→●' },
  { id: 'circleclose', name: 'Circle Close', category: 'rotate', duration: 0.8, icon: '●→○' },
  { id: 'radial', name: 'Radial', category: 'rotate', duration: 0.7, icon: '◎' },
  
  // 3D Effects
  { id: 'squeezev', name: 'Squeeze Vertical', category: '3d', duration: 0.8, icon: '↕' },
  { id: 'squeezeh', name: 'Squeeze Horizontal', category: '3d', duration: 0.8, icon: '↔' },
  { id: 'coverup', name: 'Cover Up', category: '3d', duration: 0.7, icon: '⬆' },
  { id: 'coverdown', name: 'Cover Down', category: '3d', duration: 0.7, icon: '⬇' },
  { id: 'coverleft', name: 'Cover Left', category: '3d', duration: 0.7, icon: '⬅' },
  { id: 'coverright', name: 'Cover Right', category: '3d', duration: 0.7, icon: '➡' },
  { id: 'revealup', name: 'Reveal Up', category: '3d', duration: 0.7, icon: '⇧' },
  { id: 'revealdown', name: 'Reveal Down', category: '3d', duration: 0.7, icon: '⇩' },
  { id: 'revealleft', name: 'Reveal Left', category: '3d', duration: 0.7, icon: '⇦' },
  { id: 'revealright', name: 'Reveal Right', category: '3d', duration: 0.7, icon: '⇨' },
  
  // Advanced
  { id: 'diagtl', name: 'Diagonal TL', category: 'advanced', duration: 0.8, icon: '⤡' },
  { id: 'diagtr', name: 'Diagonal TR', category: 'advanced', duration: 0.8, icon: '⤢' },
  { id: 'diagbl', name: 'Diagonal BL', category: 'advanced', duration: 0.8, icon: '⤡' },
  { id: 'diagbr', name: 'Diagonal BR', category: 'advanced', duration: 0.8, icon: '⤢' },
  { id: 'pixelize', name: 'Pixelize', category: 'advanced', duration: 0.5, icon: '▦' },
  { id: 'hlslice', name: 'Horizontal Slice', category: 'advanced', duration: 0.6, icon: '☰' },
  { id: 'vuslice', name: 'Vertical Slice', category: 'advanced', duration: 0.6, icon: '|||' },
  { id: 'rectcrop', name: 'Rectangle Crop', category: 'advanced', duration: 0.7, icon: '▭' },
  { id: 'horzopen', name: 'Horizontal Open', category: 'advanced', duration: 0.8, icon: '⇆' },
  { id: 'horzclose', name: 'Horizontal Close', category: 'advanced', duration: 0.8, icon: '⇄' },
  { id: 'vertopen', name: 'Vertical Open', category: 'advanced', duration: 0.8, icon: '⇅' },
  { id: 'vertclose', name: 'Vertical Close', category: 'advanced', duration: 0.8, icon: '⇵' },
] as const;

// ==================== CINEMATIC LUTS (Feature 0065) ====================
// Complete library of 70 Hollywood-grade LUTs - ALL FREE! 🎨
// Synced with backend: website-backend-api/src/services/LUTService.ts

export const CINEMATIC_LUTS = [
  // ==================== BASE LUTS ====================
  { id: 'wryda-professional', name: '✨ Wryda Professional Grade', category: 'base', file: '/luts/base/wryda-professional.cube', preview: '/luts/previews/wryda-professional.jpg', isDefault: true, description: 'Wryda\'s signature look - balanced, cinematic, professional' },
  { id: 'film-standard', name: 'Film Standard', category: 'base', file: '/luts/base/film-standard.cube', preview: '/luts/previews/film-standard.jpg' },
  { id: 'digital-clean', name: 'Digital Clean', category: 'base', file: '/luts/base/digital-clean.cube', preview: '/luts/previews/digital-clean.jpg' },
  
  // ==================== CINEMATIC LUTS ====================
  { id: 'cinematic-teal-orange', name: 'Cinematic Teal & Orange', category: 'cinematic', file: '/luts/cinematic/cinematic-teal-orange.cube', preview: '/luts/previews/cinematic-teal-orange.jpg' },
  { id: 'anamorphic-flare', name: 'Anamorphic Flare', category: 'cinematic', file: '/luts/cinematic/anamorphic-flare.cube', preview: '/luts/previews/anamorphic-flare.jpg' },
  { id: 'imax-epic', name: 'IMAX Epic', category: 'cinematic', file: '/luts/cinematic/imax-epic.cube', preview: '/luts/previews/imax-epic.jpg' },
  { id: 'spielberg-warm', name: 'Spielberg Warm (Golden Hour)', category: 'cinematic', file: '/luts/cinematic/spielberg-warm.cube', preview: '/luts/previews/spielberg-warm.jpg' },
  { id: 'bleach-bypass', name: 'Bleach Bypass', category: 'cinematic', file: '/luts/cinematic/bleach-bypass.cube', preview: '/luts/previews/bleach-bypass.jpg' },
  { id: 'film-print', name: 'Film Print', category: 'cinematic', file: '/luts/cinematic/film-print.cube', preview: '/luts/previews/film-print.jpg' },
  { id: 'moonlight-blue', name: 'Moonlight Blue', category: 'cinematic', file: '/luts/cinematic/moonlight-blue.cube', preview: '/luts/previews/moonlight-blue.jpg' },
  { id: 'summer-blockbuster', name: 'Summer Blockbuster', category: 'cinematic', file: '/luts/cinematic/summer-blockbuster.cube', preview: '/luts/previews/summer-blockbuster.jpg' },
  { id: 'dark-thriller', name: 'Dark Thriller', category: 'cinematic', file: '/luts/cinematic/dark-thriller.cube', preview: '/luts/previews/dark-thriller.jpg' },
  { id: 'anamorphic-blue', name: 'Anamorphic Blue', category: 'cinematic', file: '/luts/cinematic/anamorphic-blue.cube', preview: '/luts/previews/anamorphic-blue.jpg' },
  { id: 'blockbuster-orange-teal', name: 'Blockbuster Orange Teal', category: 'cinematic', file: '/luts/cinematic/blockbuster-orange-teal.cube', preview: '/luts/previews/blockbuster-orange-teal.jpg' },
  { id: 'golden-age-hollywood', name: 'Golden Age Hollywood', category: 'cinematic', file: '/luts/cinematic/golden-age-hollywood.cube', preview: '/luts/previews/golden-age-hollywood.jpg' },
  { id: 'deep-shadows', name: 'Deep Shadows', category: 'cinematic', file: '/luts/cinematic/deep-shadows.cube', preview: '/luts/previews/deep-shadows.jpg' },
  { id: 'high-key-fashion', name: 'High Key Fashion', category: 'cinematic', file: '/luts/cinematic/high-key-fashion.cube', preview: '/luts/previews/high-key-fashion.jpg' },
  { id: 'low-key-noir', name: 'Low Key Noir', category: 'cinematic', file: '/luts/cinematic/low-key-noir.cube', preview: '/luts/previews/low-key-noir.jpg' },
  { id: 'pastel-dream', name: 'Pastel Dream', category: 'cinematic', file: '/luts/cinematic/pastel-dream.cube', preview: '/luts/previews/pastel-dream.jpg' },
  { id: 'neon-nights', name: 'Neon Nights', category: 'cinematic', file: '/luts/cinematic/neon-nights.cube', preview: '/luts/previews/neon-nights.jpg' },
  
  // ==================== GENRE LUTS ====================
  // Noir/Crime
  { id: 'noir-bw', name: 'Noir Black & White', category: 'genre', subcategory: 'noir', file: '/luts/genre/noir-bw.cube', preview: '/luts/previews/noir-bw.jpg' },
  { id: 'noir-color', name: 'Noir Detective', category: 'genre', subcategory: 'noir', file: '/luts/genre/noir-color.cube', preview: '/luts/previews/noir-color.jpg' },
  { id: 'crime-drama', name: 'Crime Drama', category: 'genre', subcategory: 'noir', file: '/luts/genre/crime-drama.cube', preview: '/luts/previews/crime-drama.jpg' },
  // Horror
  { id: 'horror-cold', name: 'Horror Cold', category: 'genre', subcategory: 'horror', file: '/luts/genre/horror-cold.cube', preview: '/luts/previews/horror-cold.jpg' },
  { id: 'slasher-grain', name: 'Slasher Grain', category: 'genre', subcategory: 'horror', file: '/luts/genre/slasher-grain.cube', preview: '/luts/previews/slasher-grain.jpg' },
  // Sci-Fi
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', category: 'genre', subcategory: 'scifi', file: '/luts/genre/cyberpunk-neon.cube', preview: '/luts/previews/cyberpunk-neon.jpg' },
  { id: 'space-blue', name: 'Space Blue', category: 'genre', subcategory: 'scifi', file: '/luts/genre/space-blue.cube', preview: '/luts/previews/space-blue.jpg' },
  { id: 'alien-teal', name: 'Alien Teal', category: 'genre', subcategory: 'scifi', file: '/luts/genre/alien-teal.cube', preview: '/luts/previews/alien-teal.jpg' },
  // Romance
  { id: 'romance-warm', name: 'Romance Warm', category: 'genre', subcategory: 'romance', file: '/luts/genre/romance-warm.cube', preview: '/luts/previews/romance-warm.jpg' },
  { id: 'wedding-dreamy', name: 'Wedding Dreamy', category: 'genre', subcategory: 'romance', file: '/luts/genre/wedding-dreamy.cube', preview: '/luts/previews/wedding-dreamy.jpg' },
  // Fantasy
  { id: 'fantasy-epic', name: 'Fantasy Epic', category: 'genre', subcategory: 'fantasy', file: '/luts/genre/fantasy-epic.cube', preview: '/luts/previews/fantasy-epic.jpg' },
  { id: 'medieval-muted', name: 'Medieval Muted', category: 'genre', subcategory: 'fantasy', file: '/luts/genre/medieval-muted.cube', preview: '/luts/previews/medieval-muted.jpg' },
  // Comedy
  { id: 'comedy-bright', name: 'Comedy Bright', category: 'genre', subcategory: 'comedy', file: '/luts/genre/comedy-bright.cube', preview: '/luts/previews/comedy-bright.jpg' },
  { id: 'quirky-pastel', name: 'Quirky Pastel (Wes Anderson)', category: 'genre', subcategory: 'comedy', file: '/luts/genre/quirky-pastel.cube', preview: '/luts/previews/quirky-pastel.jpg' },
  // Action
  { id: 'explosive-action', name: 'Explosive Action', category: 'genre', subcategory: 'action', file: '/luts/genre/explosive-action.cube', preview: '/luts/previews/explosive-action.jpg' },
  { id: 'military-tactical', name: 'Military Tactical', category: 'genre', subcategory: 'action', file: '/luts/genre/military-tactical.cube', preview: '/luts/previews/military-tactical.jpg' },
  // Documentary
  { id: 'documentary-neutral', name: 'Documentary Neutral', category: 'genre', subcategory: 'documentary', file: '/luts/genre/documentary-neutral.cube', preview: '/luts/previews/documentary-neutral.jpg' },
  { id: 'nature-documentary', name: 'Nature Documentary', category: 'genre', subcategory: 'documentary', file: '/luts/genre/nature-documentary.cube', preview: '/luts/previews/nature-documentary.jpg' },
  // Drama
  { id: 'dramatic-desaturated', name: 'Dramatic Desaturated', category: 'genre', subcategory: 'drama', file: '/luts/genre/dramatic-desaturated.cube', preview: '/luts/previews/dramatic-desaturated.jpg' },
  { id: 'prestige-film', name: 'Prestige Film', category: 'genre', subcategory: 'drama', file: '/luts/genre/prestige-film.cube', preview: '/luts/previews/prestige-film.jpg' },
  // Western
  { id: 'western-dust', name: 'Western Dust', category: 'genre', subcategory: 'western', file: '/luts/genre/western-dust.cube', preview: '/luts/previews/western-dust.jpg' },
  
  // ==================== ERA LUTS ====================
  { id: '70s-film-grain', name: '1970s Film Grain', category: 'era', file: '/luts/era/70s-film-grain.cube', preview: '/luts/previews/70s-film-grain.jpg' },
  { id: '80s-vhs', name: '1980s VHS', category: 'era', file: '/luts/era/80s-vhs.cube', preview: '/luts/previews/80s-vhs.jpg' },
  { id: '90s-camcorder', name: '1990s Camcorder', category: 'era', file: '/luts/era/90s-camcorder.cube', preview: '/luts/previews/90s-camcorder.jpg' },
  { id: 'sepia-vintage', name: 'Vintage Sepia', category: 'era', file: '/luts/era/sepia-vintage.cube', preview: '/luts/previews/sepia-vintage.jpg' },
  { id: 'silent-film', name: 'Silent Film (1920s)', category: 'era', file: '/luts/era/silent-film.cube', preview: '/luts/previews/silent-film.jpg' },
  { id: '50s-technicolor', name: '1950s Technicolor', category: 'era', file: '/luts/era/50s-technicolor.cube', preview: '/luts/previews/50s-technicolor.jpg' },
  { id: '60s-new-wave', name: '1960s French New Wave', category: 'era', file: '/luts/era/60s-new-wave.cube', preview: '/luts/previews/60s-new-wave.jpg' },
  { id: '2000s-digital', name: '2000s Digital', category: 'era', file: '/luts/era/2000s-digital.cube', preview: '/luts/previews/2000s-digital.jpg' },
  { id: 'moody-autumn', name: 'Moody Autumn', category: 'era', file: '/luts/era/moody-autumn.cube', preview: '/luts/previews/moody-autumn.jpg' },
  { id: 'crisp-winter', name: 'Crisp Winter', category: 'era', file: '/luts/era/crisp-winter.cube', preview: '/luts/previews/crisp-winter.jpg' },
  { id: 'vibrant-spring', name: 'Vibrant Spring', category: 'era', file: '/luts/era/vibrant-spring.cube', preview: '/luts/previews/vibrant-spring.jpg' },
  
  // ==================== PLATFORM/SOCIAL MEDIA LUTS ====================
  { id: 'instagram-vibrant', name: 'Instagram Vibrant', category: 'platform', file: '/luts/platform/instagram-vibrant.cube', preview: '/luts/previews/instagram-vibrant.jpg' },
  { id: 'tiktok-trendy', name: 'TikTok Trendy', category: 'platform', file: '/luts/platform/tiktok-trendy.cube', preview: '/luts/previews/tiktok-trendy.jpg' },
  { id: 'youtube-vlog', name: 'YouTube Vlog', category: 'platform', file: '/luts/platform/youtube-vlog.cube', preview: '/luts/previews/youtube-vlog.jpg' },
  { id: 'facebook-clean', name: 'Facebook Clean', category: 'platform', file: '/luts/platform/facebook-clean.cube', preview: '/luts/previews/facebook-clean.jpg' },
  { id: 'netflix-drama', name: 'Netflix Drama', category: 'platform', file: '/luts/platform/netflix-drama.cube', preview: '/luts/previews/netflix-drama.jpg' },
  { id: 'hbo-prestige', name: 'HBO Prestige', category: 'platform', file: '/luts/platform/hbo-prestige.cube', preview: '/luts/previews/hbo-prestige.jpg' },
  { id: 'sitcom-bright', name: 'Sitcom Bright', category: 'platform', file: '/luts/platform/sitcom-bright.cube', preview: '/luts/previews/sitcom-bright.jpg' },
  { id: 'luxury-commercial', name: 'Luxury Commercial', category: 'platform', file: '/luts/platform/luxury-commercial.cube', preview: '/luts/previews/luxury-commercial.jpg' },
  { id: 'tech-commercial', name: 'Tech Commercial', category: 'platform', file: '/luts/platform/tech-commercial.cube', preview: '/luts/previews/tech-commercial.jpg' },
  { id: 'food-commercial', name: 'Food Commercial', category: 'platform', file: '/luts/platform/food-commercial.cube', preview: '/luts/previews/food-commercial.jpg' },
  { id: 'pop-music-video', name: 'Pop Music Video', category: 'platform', file: '/luts/platform/pop-music-video.cube', preview: '/luts/previews/pop-music-video.jpg' },
  { id: 'hiphop-video', name: 'Hip-Hop Video', category: 'platform', file: '/luts/platform/hiphop-video.cube', preview: '/luts/previews/hiphop-video.jpg' },
  { id: 'indie-music-video', name: 'Indie Music Video', category: 'platform', file: '/luts/platform/indie-music-video.cube', preview: '/luts/previews/indie-music-video.jpg' },
  
  // ==================== ADDITIONAL ERA LUTS ====================
  { id: 'golden-hour', name: 'Golden Hour', category: 'era', file: '/luts/era/golden-hour.cube', preview: '/luts/previews/golden-hour.jpg' },
  { id: 'blue-hour', name: 'Blue Hour', category: 'era', file: '/luts/era/blue-hour.cube', preview: '/luts/previews/blue-hour.jpg' },
  { id: 'summer-sun', name: 'Summer Sun', category: 'era', file: '/luts/era/summer-sun.cube', preview: '/luts/previews/summer-sun.jpg' },
  { id: 'harsh-midday', name: 'Harsh Midday', category: 'era', file: '/luts/era/harsh-midday.cube', preview: '/luts/previews/harsh-midday.jpg' },
  { id: 'overcast-day', name: 'Overcast Day', category: 'era', file: '/luts/era/overcast-day.cube', preview: '/luts/previews/overcast-day.jpg' },
] as const;

// Total: 70 LUTs - ALL 100% FREE! 🔥

// Get default LUT (Wryda Signature)
export const getDefaultLUT = () => {
  return CINEMATIC_LUTS.find(lut => 'isDefault' in lut && lut.isDefault) || CINEMATIC_LUTS[0];
};

// Helper to create LUT metadata
export function createDefaultLUTMetadata() {
  const defaultLUT = getDefaultLUT();
  return {
    name: defaultLUT.name,
    lutId: defaultLUT.id,
    cubeFile: defaultLUT.file,
    intensity: 1.0
  };
}

// Keyframe for animations
export interface TimelineKeyframe {
  time: number;  // Time relative to asset start (seconds)
  
  // Transform properties (for video/image)
  x?: number;  // Position X (pixels or percentage)
  y?: number;  // Position Y (pixels or percentage)
  scale?: number;  // 0.1 to 5.0
  rotation?: number;  // Degrees
  opacity?: number;  // 0.0 to 1.0
  blur?: number;  // Blur amount
  
  // Audio properties (for audio keyframes)
  volume?: number;  // 0.0 to 2.0
  
  // Easing
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

// Composition source clip metadata
export interface CompositionSourceClip {
  id: string;
  url: string;
  name: string;
  startTime: number;
  duration: number;
  trackIndex: number;
  trackType: TrackType;
}

// Composition metadata for non-destructive editing
export interface CompositionMetadata {
  compositionId: string;              // UUID for this composition
  sourceClips: CompositionSourceClip[]; // Original clips that made this
  compositionType: 'static-layout' | 'animated' | 'paced-sequence' | 'audio-mix' | 'music-mix';
  layoutId?: string;                  // e.g., "3-way-split" (for video)
  animationId?: string;               // e.g., "slide-show" (for video)
  pacingId?: string;                  // e.g., "dramatic" (for video)
  
  // Audio-specific composition metadata
  audioMixType?: 'balanced' | 'music-heavy' | 'dialogue-heavy' | 'ambient' | 'podcast';
  audioEffects?: {
    normalization?: boolean;          // Volume normalization
    compression?: boolean;            // Dynamic range compression
    eq?: string;                      // EQ preset applied
    reverb?: number;                  // Reverb amount (0-100)
    fade?: {                         // Master fade in/out
      fadeIn?: number;
      fadeOut?: number;
    };
  };
  
  createdAt: string;                  // ISO timestamp
  creditsUsed: number;                // Cost of this composition
  canRecompose: boolean;              // Whether user can re-edit
  lastModified?: string;              // ISO timestamp of last edit
  version: number;                    // Composition version (for re-edits)
}

// ==================== ASSET METADATA (Feature 0064) ====================

// Base generation metadata
export interface AssetGenerationMetadata {
  generatedAt: string;              // ISO timestamp
  provider: string;                 // Internal provider ID (e.g., 'provider-a-fast', 'provider-b-quality', 'photon-1', etc.)
  model?: string;                   // Model version if applicable
  creditsUsed: number;              // Cost in credits
  generationTime?: number;          // Milliseconds to generate
  jobId?: string;                   // Backend job ID for tracking
  
  // Version tracking
  version?: number;                 // Asset version (for regenerations)
  parentAssetId?: string;           // ID of asset this was regenerated from
  regenerationPrompt?: string;      // If user modified prompt
  variationSeed?: number;           // For style variations
}

// AI Video generation metadata
export interface VideoGenerationMetadata extends AssetGenerationMetadata {
  sourceType: 'ai-video';
  prompt: string;                   // User's video prompt
  resolution: string;               // '720p', '1080p', '4k'
  aspectRatio: string;              // '16:9', '9:16', etc.
  duration: string;                 // '5s', '10s'
  videoMode: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images';
  
  // Optional parameters
  enableSound?: boolean;
  enableLoop?: boolean;
  cameraMotion?: string;
  referenceImages?: string[];       // URLs of reference images used
  startImage?: string;              // URL if image-to-video
  endImage?: string;                // URL if interpolation
  qualityTier?: string;             // 'professional', 'premium', 'cinema'
}

// AI Image generation metadata
export interface ImageGenerationMetadata extends AssetGenerationMetadata {
  sourceType: 'ai-image';
  prompt: string;                   // User's image prompt
  resolution: string;               // '1024x1024', '1920x1080', etc.
  aspectRatio?: string;             // Requested aspect ratio
  style?: string;                   // Style preset if used
  negativePrompt?: string;          // Negative prompt if used
  seed?: number;                    // Random seed for reproducibility
  steps?: number;                   // Inference steps
  guidanceScale?: number;           // CFG scale
  characterReference?: string;      // Character bank reference
  styleReference?: string;          // Style reference image
}

// AI Audio/Music generation metadata
export interface AudioGenerationMetadata extends AssetGenerationMetadata {
  sourceType: 'ai-audio' | 'ai-music' | 'ai-voice';
  prompt?: string;                  // For music/SFX generation
  text?: string;                    // For TTS
  voice?: string;                   // Voice ID or name
  language?: string;                // Language code
  musicGenre?: string;              // For Suno music
  mood?: string;                    // Mood/emotion
  duration: string;                 // Audio length
  format?: string;                  // 'mp3', 'wav'
  sampleRate?: number;              // Audio sample rate
}

// Upload metadata (supports all industry-standard formats)
export interface UploadMetadata extends AssetGenerationMetadata {
  sourceType: 'uploaded';
  originalFilename: string;
  fileSize: number;                 // Bytes
  uploadedAt: string;               // ISO timestamp
  
  // MIME types for all industry-standard formats
  // Video: mp4, mov, webm, avi, mkv, m4v, flv, wmv, mpeg, mpg, 3gp, ogv
  // Image: jpeg, png, webp, gif, svg, tiff, bmp, heic, avif, apng
  // Audio: mp3, wav, aac, m4a, flac, ogg, wma, aiff, opus, amr
  // Subtitles: srt, vtt, ass, sbv
  mimeType: string;
  
  fileExtension?: string;           // Original file extension (for rare formats)
  codec?: string;                   // Video/audio codec (ProRes, DNxHR, etc.)
  uploadSource?: 'local' | 'google-drive' | 'dropbox' | 'github' | 'url';
  
  // Performance & Proxy (Feature 0064)
  needsProxy?: boolean;             // True if large/unsupported format
  proxyUrl?: string;                // Low-res proxy for timeline editing
  proxyGenerated?: boolean;         // Whether proxy is ready
  originalResolution?: string;      // e.g., "3840x2160"
  proxyResolution?: string;         // e.g., "1280x720"
  
  creditsUsed: 0;                   // Uploads are free
}

// Subtitle/Caption metadata
export interface SubtitleMetadata extends AssetGenerationMetadata {
  sourceType: 'subtitle' | 'caption';
  format: 'srt' | 'vtt' | 'ass' | 'sbv' | 'txt';  // Subtitle format
  language?: string;                // ISO language code (e.g., 'en', 'es')
  originalFilename?: string;        // If uploaded
  generatedBy?: 'ai' | 'user' | 'auto-transcribe';  // How it was created
  transcriptionProvider?: string;   // If AI-generated (Whisper, etc.)
}

// Union type for all metadata types
export type AssetMetadata = 
  | VideoGenerationMetadata 
  | ImageGenerationMetadata 
  | AudioGenerationMetadata 
  | UploadMetadata
  | SubtitleMetadata;

// Multi-type asset (video, audio, image, music)
export interface TimelineAsset {
  id: string;
  type: AssetType;
  
  // Media source
  url: string;  // S3 URL or cloud storage reference
  thumbnailUrl?: string;
  
  // Identity
  name: string;
  
  // Position on timeline
  track: number;  // Track number (0-7 video, 8-15 audio)
  trackType: TrackType;  // Which type of track
  startTime: number;  // Frame-accurate (in seconds)
  duration: number;
  
  // Trimming (for video/audio)
  trimStart: number;  // How much of the source to skip
  trimEnd: number;
  
  // Audio properties
  volume: number;  // 0.0 to 2.0 (200% max)
  muted?: boolean;
  fadeIn?: number;  // Fade in duration (seconds)
  fadeOut?: number;  // Fade out duration (seconds)
  
  // Video/Image properties
  transition?: {
    type: string;  // EXPANDED: Support all 55 Hollywood transition types (Feature 0065)
    duration: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  
  // NEW: LUT (Color Grading) support (Feature 0065)
  lut?: {
    name: string;           // e.g., "Cinematic Teal & Orange"
    lutId: string;          // e.g., "cinematic-teal-orange"
    cubeFile: string;       // Path to .cube file
    intensity?: number;     // 0.0 - 1.0 (blend with original)
  };
  
  // NEW: Quick color adjustments (Feature 0065)
  colorGrading?: {
    brightness?: number;    // -100 to 100
    contrast?: number;      // -100 to 100
    saturation?: number;    // -100 to 100
    temperature?: number;   // -100 (cool) to 100 (warm)
    tint?: number;          // -100 (green) to 100 (magenta)
  };
  
  // Image-specific (static images)
  displayDuration?: number;  // For images, how long to display
  
  // Keyframe animations (for video/image layers)
  keyframes?: TimelineKeyframe[];
  
  // Asset metadata (Feature 0064) - Comprehensive tracking
  assetMetadata?: AssetMetadata;      // NEW: Complete generation/upload metadata
  
  // Composition tracking (Feature 0063)
  isComposition?: boolean;
  compositionMetadata?: CompositionMetadata;
  
  // Source clip tracking (Feature 0063)
  isSourceClip?: boolean;             // Mark as an original clip
  hiddenByComposition?: string;       // Composition ID that hid this clip
  parentCompositionId?: string;       // Link back to parent composition
  
  // Legacy metadata (for backward compatibility - DEPRECATED)
  metadata?: {
    shotType?: string;
    shotId?: string;
    cameraMovement?: string;
    description?: string;
    visualPrompt?: string;
    sourceType?: 'generated' | 'uploaded' | 'library';
  };
}

// Legacy TimelineClip interface (for backward compatibility)
export interface TimelineClip {
  id: string;
  shotId?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  name: string;
  track: number;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  transition?: {
    type: 'cut' | 'fade' | 'dissolve' | 'wipe';
    duration: number;
  };
  metadata?: {
    shotType?: string;
    cameraMovement?: string;
    description?: string;
    visualPrompt?: string;
  };
}

export interface TimelineProject {
  id: string;
  name: string;
  clips: TimelineClip[];  // Legacy clips array
  assets: TimelineAsset[];  // NEW: Multi-type assets
  duration: number;
  resolution: '720p' | '1080p' | '4K';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
  frameRate: 24 | 30 | 60;
  
  // Track configuration
  trackConfig: {
    videoTracks: number;  // Default: 8
    audioTracks: number;  // Default: 8
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface UseTimelineOptions {
  projectId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // ms
}

export function useTimeline(options: UseTimelineOptions = {}) {
  const { projectId, autoSave = false, autoSaveInterval = 30000 } = options;

  // Project state
  const [project, setProject] = useState<TimelineProject>({
    id: projectId || `timeline_${Date.now()}`,
    name: 'Untitled Project',
    clips: [],  // Legacy clips array for backward compatibility
    assets: [],  // NEW: Multi-type assets array
    duration: 60,
    resolution: '1080p',
    aspectRatio: '16:9',
    frameRate: 30,
    trackConfig: {
      videoTracks: 8,
      audioTracks: 8
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Selection state
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  // UI state
  const [zoomLevel, setZoomLevel] = useState(50); // pixels per second
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClip, setDraggedClip] = useState<TimelineClip | null>(null);

  // Calculated values
  const totalDuration = Math.max(
    project.duration,
    ...project.clips.map(c => c.startTime + c.duration),
    60 // Minimum 60 seconds
  );

  // ==================== CLIP OPERATIONS ====================

  /**
   * Add a new clip to the timeline
   */
  const addClip = useCallback((clip: Omit<TimelineClip, 'id'>) => {
    const newClip: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip],
      updatedAt: new Date()
    }));

    return newClip.id;
  }, []);

  /**
   * Add multiple clips (e.g., from shot list)
   */
  const addClips = useCallback((clips: Omit<TimelineClip, 'id'>[]) => {
    const newClips = clips.map((clip, index) => ({
      ...clip,
      id: `clip_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));

    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, ...newClips],
      updatedAt: new Date()
    }));

    return newClips.map(c => c.id);
  }, []);

  /**
   * Remove a clip
   */
  const removeClip = useCallback((clipId: string) => {
    setProject(prev => ({
      ...prev,
      clips: prev.clips.filter(c => c.id !== clipId),
      updatedAt: new Date()
    }));
    
    setSelectedClips(prev => {
      const next = new Set(prev);
      next.delete(clipId);
      return next;
    });
  }, []);

  /**
   * Remove multiple clips
   */
  const removeClips = useCallback((clipIds: string[]) => {
    setProject(prev => ({
      ...prev,
      clips: prev.clips.filter(c => !clipIds.includes(c.id)),
      updatedAt: new Date()
    }));
    
    setSelectedClips(prev => {
      const next = new Set(prev);
      clipIds.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  /**
   * Update a clip
   */
  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    setProject(prev => ({
      ...prev,
      clips: prev.clips.map(c => 
        c.id === clipId ? { ...c, ...updates } : c
      ),
      updatedAt: new Date()
    }));
  }, []);

  /**
   * Move clip to new position with frame-accurate snapping
   */
  const moveClip = useCallback((clipId: string, newTrack: number, newStartTime: number) => {
    // Snap to frame boundaries for frame-accurate positioning
    const snappedTime = snapToFrame(newStartTime, project.frameRate);
    
    updateClip(clipId, {
      track: Math.max(0, Math.min(3, newTrack)), // Clamp to 0-3
      startTime: Math.max(0, snappedTime)
    });
  }, [updateClip, project.frameRate]);

  /**
   * Duplicate a clip
   */
  const duplicateClip = useCallback((clipId: string) => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return null;

    const newClip: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: clip.startTime + clip.duration + 0.5 // Add 0.5s gap
    };

    setProject(prev => ({
      ...prev,
      clips: [...prev.clips, newClip],
      updatedAt: new Date()
    }));

    return newClip.id;
  }, [project.clips]);

  /**
   * Split clip at playhead position
   */
  const splitClipAtPlayhead = useCallback((clipId: string) => {
    const clip = project.clips.find(c => c.id === clipId);
    if (!clip) return null;

    // Check if playhead is within clip bounds
    if (playheadPosition <= clip.startTime || playheadPosition >= clip.startTime + clip.duration) {
      return null;
    }

    const splitPoint = playheadPosition - clip.startTime;
    
    // Create two new clips
    const clip1: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}_a_${Math.random().toString(36).substr(2, 9)}`,
      duration: splitPoint,
      trimEnd: clip.trimEnd + (clip.duration - splitPoint)
    };

    const clip2: TimelineClip = {
      ...clip,
      id: `clip_${Date.now()}_b_${Math.random().toString(36).substr(2, 9)}`,
      startTime: playheadPosition,
      duration: clip.duration - splitPoint,
      trimStart: clip.trimStart + splitPoint
    };

    setProject(prev => ({
      ...prev,
      clips: [
        ...prev.clips.filter(c => c.id !== clipId),
        clip1,
        clip2
      ],
      updatedAt: new Date()
    }));

    return [clip1.id, clip2.id];
  }, [project.clips, playheadPosition]);

  // ==================== ASSET OPERATIONS (Multi-Type Support) ====================

  /**
   * Add a new asset to the timeline (video, audio, image, or music)
   */
  const addAsset = useCallback((asset: Omit<TimelineAsset, 'id'>) => {
    const newAsset: TimelineAsset = {
      ...asset,
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setProject(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset],
      updatedAt: new Date()
    }));

    return newAsset.id;
  }, []);

  /**
   * Add multiple assets at once
   */
  const addAssets = useCallback((assets: Omit<TimelineAsset, 'id'>[]) => {
    const newAssets = assets.map((asset, index) => ({
      ...asset,
      id: `asset_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
    }));

    setProject(prev => ({
      ...prev,
      assets: [...prev.assets, ...newAssets],
      updatedAt: new Date()
    }));

    return newAssets.map(a => a.id);
  }, []);

  /**
   * Remove an asset
   */
  const removeAsset = useCallback((assetId: string) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== assetId),
      updatedAt: new Date()
    }));
    
    setSelectedClips(prev => {
      const next = new Set(prev);
      next.delete(assetId);
      return next;
    });
  }, []);

  /**
   * Update an asset
   */
  const updateAsset = useCallback((assetId: string, updates: Partial<TimelineAsset>) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.map(a => 
        a.id === assetId ? { ...a, ...updates } : a
      ),
      updatedAt: new Date()
    }));
  }, []);

  /**
   * Move asset to new position with frame-accurate snapping
   */
  const moveAsset = useCallback((assetId: string, newTrack: number, newStartTime: number) => {
    const snappedTime = snapToFrame(newStartTime, project.frameRate);
    
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    // Clamp track based on asset type
    const maxTrack = asset.trackType === 'video' 
      ? project.trackConfig.videoTracks - 1 
      : project.trackConfig.audioTracks - 1;
    
    updateAsset(assetId, {
      track: Math.max(0, Math.min(maxTrack, newTrack)),
      startTime: Math.max(0, snappedTime)
    });
  }, [updateAsset, project.frameRate, project.assets, project.trackConfig]);

  /**
   * Move asset to specific frame number
   */
  const moveAssetToFrame = useCallback((assetId: string, frameNumber: number) => {
    const time = (frameNumber / project.frameRate);
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    updateAsset(assetId, {
      startTime: Math.max(0, time)
    });
  }, [updateAsset, project.frameRate, project.assets]);

  // ==================== KEYFRAME OPERATIONS ====================

  /**
   * Add a keyframe to an asset
   */
  const addKeyframe = useCallback((assetId: string, keyframe: Omit<TimelineKeyframe, 'id'>) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.map(asset => {
        if (asset.id !== assetId) return asset;
        
        const existingKeyframes = asset.keyframes || [];
        return {
          ...asset,
          keyframes: [...existingKeyframes, keyframe].sort((a, b) => a.time - b.time)
        };
      }),
      updatedAt: new Date()
    }));
  }, []);

  /**
   * Update a keyframe
   */
  const updateKeyframe = useCallback((assetId: string, keyframeIndex: number, updates: Partial<TimelineKeyframe>) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.map(asset => {
        if (asset.id !== assetId || !asset.keyframes) return asset;
        
        return {
          ...asset,
          keyframes: asset.keyframes.map((kf, index) =>
            index === keyframeIndex ? { ...kf, ...updates } : kf
          )
        };
      }),
      updatedAt: new Date()
    }));
  }, []);

  /**
   * Remove a keyframe
   */
  const removeKeyframe = useCallback((assetId: string, keyframeIndex: number) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.map(asset => {
        if (asset.id !== assetId || !asset.keyframes) return asset;
        
        return {
          ...asset,
          keyframes: asset.keyframes.filter((_, index) => index !== keyframeIndex)
        };
      }),
      updatedAt: new Date()
    }));
  }, []);

  // ==================== AUDIO OPERATIONS ====================

  /**
   * Set audio volume (creates keyframe if time provided)
   */
  const setAudioVolume = useCallback((assetId: string, volume: number, time?: number) => {
    if (time !== undefined) {
      // Create keyframe
      addKeyframe(assetId, { time, volume });
    } else {
      // Set base volume
      updateAsset(assetId, { volume: Math.max(0, Math.min(2, volume)) });
    }
  }, [addKeyframe, updateAsset]);

  /**
   * Mute/unmute an asset
   */
  const muteAsset = useCallback((assetId: string, muted: boolean) => {
    updateAsset(assetId, { muted });
  }, [updateAsset]);

  /**
   * Set fade in/out for audio
   */
  const setAudioFade = useCallback((assetId: string, fadeIn?: number, fadeOut?: number) => {
    updateAsset(assetId, { fadeIn, fadeOut });
  }, [updateAsset]);

  // ==================== PLAYBACK CONTROLS ====================

  /**
   * Play/Pause toggle
   */
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      setIsPlaying(true);
      playbackIntervalRef.current = setInterval(() => {
        setPlayheadPosition(prev => {
          const next = prev + 0.1; // 100ms intervals
          if (next >= totalDuration) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) {
              clearInterval(playbackIntervalRef.current);
              playbackIntervalRef.current = null;
            }
            return 0; // Loop back to start
          }
          return next;
        });
      }, 100);
    }
  }, [isPlaying, totalDuration]);

  /**
   * Seek to specific time
   */
  const seek = useCallback((time: number) => {
    setPlayheadPosition(Math.max(0, Math.min(totalDuration, time)));
  }, [totalDuration]);

  /**
   * Skip forward
   */
  const skipForward = useCallback((seconds: number = 5) => {
    seek(playheadPosition + seconds);
  }, [playheadPosition, seek]);

  /**
   * Skip backward
   */
  const skipBackward = useCallback((seconds: number = 5) => {
    seek(playheadPosition - seconds);
  }, [playheadPosition, seek]);

  /**
   * Jump to start
   */
  const jumpToStart = useCallback(() => {
    seek(0);
  }, [seek]);

  /**
   * Jump to end
   */
  const jumpToEnd = useCallback(() => {
    seek(totalDuration);
  }, [seek, totalDuration]);

  // ==================== SELECTION ====================

  /**
   * Select a clip
   */
  const selectClip = useCallback((clipId: string, addToSelection: boolean = false) => {
    setSelectedClips(prev => {
      if (addToSelection) {
        const next = new Set(prev);
        next.add(clipId);
        return next;
      }
      return new Set([clipId]);
    });
  }, []);

  /**
   * Deselect a clip
   */
  const deselectClip = useCallback((clipId: string) => {
    setSelectedClips(prev => {
      const next = new Set(prev);
      next.delete(clipId);
      return next;
    });
  }, []);

  /**
   * Toggle clip selection
   */
  const toggleClipSelection = useCallback((clipId: string) => {
    setSelectedClips(prev => {
      const next = new Set(prev);
      if (next.has(clipId)) {
        next.delete(clipId);
      } else {
        next.add(clipId);
      }
      return next;
    });
  }, []);

  /**
   * Select all clips
   */
  const selectAll = useCallback(() => {
    setSelectedClips(new Set(project.clips.map(c => c.id)));
  }, [project.clips]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedClips(new Set());
  }, []);

  // ==================== ZOOM ====================

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(200, prev * 1.5));
  }, []);

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(10, prev / 1.5));
  }, []);

  /**
   * Set zoom level
   */
  const setZoom = useCallback((level: number) => {
    setZoomLevel(Math.max(10, Math.min(200, level)));
  }, []);

  // ==================== PROJECT MANAGEMENT ====================

  /**
   * Import clips from shot list
   */
  const importFromShotList = useCallback((shots: any[]) => {
    const clips: Omit<TimelineClip, 'id'>[] = shots.map((shot, index) => ({
      shotId: shot.id,
      videoUrl: shot.generatedVideoUrl || '', // Will be populated after generation
      thumbnailUrl: shot.thumbnailUrl,
      name: `Shot ${shot.shotNumber}: ${shot.subject}`,
      track: 0, // All on track 0 by default
      startTime: shot.startTime,
      duration: shot.duration,
      trimStart: 0,
      trimEnd: 0,
      volume: 1,
      metadata: {
        shotType: shot.shotType,
        cameraMovement: shot.cameraMovement,
        description: shot.description,
        visualPrompt: shot.visualPrompt
      }
    }));

    return addClips(clips);
  }, [addClips]);

  /**
   * Save project
   */
  const saveProject = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://o31t5jk8w5.execute-api.us-east-1.amazonaws.com';
      
      const response = await fetch(`${apiUrl}/api/timeline/project/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      console.log('[Timeline] Project saved successfully');
      return true;
    } catch (error: any) {
      console.error('[Timeline] Error saving project:', error);
      return false;
    }
  }, [project]);

  /**
   * Load project
   */
  const loadProject = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://o31t5jk8w5.execute-api.us-east-1.amazonaws.com';
      
      const response = await fetch(`${apiUrl}/api/timeline/project/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const data = await response.json();
      setProject(data.project);
      console.log('[Timeline] Project loaded successfully');
      return true;
    } catch (error: any) {
      console.error('[Timeline] Error loading project:', error);
      return false;
    }
  }, []);

  /**
   * Clear project (reset to empty)
   */
  const clearProject = useCallback(() => {
    setProject({
      id: `timeline_${Date.now()}`,
      name: 'Untitled Project',
      clips: [],
      assets: [],
      duration: 60,
      resolution: '1080p',
      aspectRatio: '16:9',
      frameRate: 30,
      trackConfig: {
        videoTracks: 8,
        audioTracks: 8
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    clearSelection();
    setPlayheadPosition(0);
    setIsPlaying(false);
  }, [clearSelection]);

  // ==================== EFFECTS ====================

  /**
   * Auto-save (if enabled)
   */
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      saveProject();
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, saveProject]);

  /**
   * Cleanup playback interval on unmount
   */
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // ==================== RETURN ====================

  return {
    // Project state
    project,
    setProject,
    totalDuration,
    
    // Clips (legacy support)
    clips: project.clips,
    addClip,
    addClips,
    removeClip,
    removeClips,
    updateClip,
    moveClip,
    duplicateClip,
    splitClipAtPlayhead,
    
    // Assets (multi-type support - NEW)
    assets: project.assets,
    addAsset,
    addAssets,
    removeAsset,
    updateAsset,
    moveAsset,
    moveAssetToFrame,
    
    // Keyframes (NEW)
    addKeyframe,
    updateKeyframe,
    removeKeyframe,
    
    // Audio operations (NEW)
    setAudioVolume,
    muteAsset,
    setAudioFade,
    
    // Playback
    isPlaying,
    playheadPosition,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
    jumpToStart,
    jumpToEnd,
    
    // Selection
    selectedClips,
    selectClip,
    deselectClip,
    toggleClipSelection,
    selectAll,
    clearSelection,
    
    // UI
    zoomLevel,
    zoomIn,
    zoomOut,
    setZoom,
    isDragging,
    setIsDragging,
    draggedClip,
    setDraggedClip,
    
    // Project management
    importFromShotList,
    saveProject,
    loadProject,
    clearProject
  };
}

