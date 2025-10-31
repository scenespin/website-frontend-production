/**
 * Timeline Effects Renderer
 * 
 * Real-time rendering of transitions and LUTs during playback
 * Feature 0065: Phase 5 - Real-time Preview
 */

import { TimelineAsset } from './useTimeline';

/**
 * Apply transition effect between two clips during playback
 * Uses CSS transforms and opacity for smooth real-time transitions
 */
export function applyTransitionEffect(
  clip1Element: HTMLVideoElement | HTMLImageElement | null,
  clip2Element: HTMLVideoElement | HTMLImageElement | null,
  transition: { type: string; duration: number; easing?: string },
  progress: number  // 0.0 to 1.0 through the transition
) {
  if (!clip1Element || !clip2Element) return;

  // Apply easing function
  const easedProgress = applyEasing(progress, transition.easing || 'ease-in-out');

  // Reset any previous transforms
  const resetElement = (el: HTMLElement) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.clipPath = 'none';
    el.style.filter = 'none';
  };

  // Apply transition based on type
  switch (transition.type) {
    // FADE FAMILY
    case 'fade':
    case 'dissolve':
      clip1Element.style.opacity = `${1 - easedProgress}`;
      clip2Element.style.opacity = `${easedProgress}`;
      break;

    case 'fadeblack':
      clip1Element.style.opacity = `${1 - easedProgress * 2}`;
      clip2Element.style.opacity = `${Math.max(0, (easedProgress - 0.5) * 2)}`;
      break;

    case 'fadewhite':
      const whiteOverlay = 1 - Math.abs(easedProgress - 0.5) * 2;
      clip1Element.style.filter = `brightness(${1 + whiteOverlay * 2})`;
      clip2Element.style.filter = `brightness(${1 + whiteOverlay * 2})`;
      clip1Element.style.opacity = `${1 - easedProgress}`;
      clip2Element.style.opacity = `${easedProgress}`;
      break;

    // WIPE FAMILY
    case 'wipeleft':
      clip1Element.style.clipPath = `inset(0 ${easedProgress * 100}% 0 0)`;
      clip2Element.style.clipPath = `inset(0 0 0 ${(1 - easedProgress) * 100}%)`;
      break;

    case 'wiperight':
      clip1Element.style.clipPath = `inset(0 0 0 ${easedProgress * 100}%)`;
      clip2Element.style.clipPath = `inset(0 ${(1 - easedProgress) * 100}% 0 0)`;
      break;

    case 'wipeup':
      clip1Element.style.clipPath = `inset(0 0 ${easedProgress * 100}% 0)`;
      clip2Element.style.clipPath = `inset(${(1 - easedProgress) * 100}% 0 0 0)`;
      break;

    case 'wipedown':
      clip1Element.style.clipPath = `inset(${easedProgress * 100}% 0 0 0)`;
      clip2Element.style.clipPath = `inset(0 0 ${(1 - easedProgress) * 100}% 0)`;
      break;

    // SLIDE FAMILY
    case 'slideleft':
    case 'smoothleft':
      clip1Element.style.transform = `translateX(${easedProgress * 100}%)`;
      clip2Element.style.transform = `translateX(${(easedProgress - 1) * 100}%)`;
      break;

    case 'slideright':
    case 'smoothright':
      clip1Element.style.transform = `translateX(-${easedProgress * 100}%)`;
      clip2Element.style.transform = `translateX(${(1 - easedProgress) * 100}%)`;
      break;

    case 'slideup':
    case 'smoothup':
      clip1Element.style.transform = `translateY(${easedProgress * 100}%)`;
      clip2Element.style.transform = `translateY(${(easedProgress - 1) * 100}%)`;
      break;

    case 'slidedown':
    case 'smoothdown':
      clip1Element.style.transform = `translateY(-${easedProgress * 100}%)`;
      clip2Element.style.transform = `translateY(${(1 - easedProgress) * 100}%)`;
      break;

    // ZOOM FAMILY
    case 'zoomin':
      clip1Element.style.transform = `scale(${1 + easedProgress})`;
      clip1Element.style.opacity = `${1 - easedProgress}`;
      clip2Element.style.transform = `scale(${1 - easedProgress * 0.5})`;
      clip2Element.style.opacity = `${easedProgress}`;
      break;

    case 'fadefast':
    case 'fadeslow':
      clip1Element.style.transform = `scale(${1 + easedProgress * 0.3})`;
      clip1Element.style.opacity = `${1 - easedProgress}`;
      clip2Element.style.opacity = `${easedProgress}`;
      break;

    // 3D EFFECTS
    case 'squeezeh':
      clip1Element.style.transform = `scaleX(${1 - easedProgress})`;
      clip2Element.style.transform = `scaleX(${easedProgress})`;
      break;

    case 'squeezev':
      clip1Element.style.transform = `scaleY(${1 - easedProgress})`;
      clip2Element.style.transform = `scaleY(${easedProgress})`;
      break;

    // ADVANCED
    case 'pixelize':
      const pixelSize = Math.floor((1 - Math.abs(easedProgress - 0.5) * 2) * 20);
      if (pixelSize > 1) {
        clip1Element.style.filter = `blur(${pixelSize}px)`;
        clip2Element.style.filter = `blur(${pixelSize}px)`;
      }
      clip1Element.style.opacity = `${1 - easedProgress}`;
      clip2Element.style.opacity = `${easedProgress}`;
      break;

    // DEFAULT - Simple fade
    default:
      clip1Element.style.opacity = `${1 - easedProgress}`;
      clip2Element.style.opacity = `${easedProgress}`;
      break;
  }
}

/**
 * Apply LUT (color grading) effect to element
 * Uses CSS filters as a lightweight approximation until WebGL is implemented
 */
export function applyLUTEffect(
  element: HTMLVideoElement | HTMLImageElement | null,
  lut: { name: string; lutId: string; cubeFile: string; intensity?: number },
  colorGrading?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    temperature?: number;
    tint?: number;
  }
) {
  if (!element) return;

  const intensity = lut.intensity ?? 1.0;
  const filters: string[] = [];

  // Apply LUT-specific presets (CSS approximations)
  const lutPresets = getLUTPreset(lut.lutId);
  if (lutPresets) {
    if (lutPresets.brightness) filters.push(`brightness(${1 + (lutPresets.brightness * intensity)})`);
    if (lutPresets.contrast) filters.push(`contrast(${1 + (lutPresets.contrast * intensity)})`);
    if (lutPresets.saturation) filters.push(`saturate(${1 + (lutPresets.saturation * intensity)})`);
    if (lutPresets.hueRotate) filters.push(`hue-rotate(${lutPresets.hueRotate * intensity}deg)`);
    if (lutPresets.sepia) filters.push(`sepia(${lutPresets.sepia * intensity})`);
    if (lutPresets.grayscale) filters.push(`grayscale(${lutPresets.grayscale * intensity})`);
  }

  // Apply custom color grading
  if (colorGrading) {
    if (colorGrading.brightness) {
      filters.push(`brightness(${1 + colorGrading.brightness / 100})`);
    }
    if (colorGrading.contrast) {
      filters.push(`contrast(${1 + colorGrading.contrast / 100})`);
    }
    if (colorGrading.saturation) {
      filters.push(`saturate(${1 + colorGrading.saturation / 100})`);
    }
    if (colorGrading.temperature) {
      // Warm = orange hue, Cool = blue hue
      filters.push(`hue-rotate(${colorGrading.temperature * 0.3}deg)`);
    }
  }

  element.style.filter = filters.join(' ');
}

/**
 * Get CSS filter preset for LUT approximation
 * These are visual approximations until WebGL LUT rendering is implemented
 */
function getLUTPreset(lutId: string): {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hueRotate?: number;
  sepia?: number;
  grayscale?: number;
} | null {
  const presets: Record<string, any> = {
    'wryda-signature': {
      brightness: 0.05,
      contrast: 0.15,
      saturation: 0.2,
      hueRotate: 10
    },
    'cinematic-teal-orange': {
      contrast: 0.2,
      saturation: 0.3,
      hueRotate: 15
    },
    'cinematic-dark': {
      brightness: -0.2,
      contrast: 0.3,
      saturation: -0.1
    },
    'cinematic-bright': {
      brightness: 0.2,
      contrast: 0.1,
      saturation: 0.15
    },
    'film-noir': {
      grayscale: 0.8,
      contrast: 0.4
    },
    'vintage-70s': {
      sepia: 0.3,
      contrast: 0.1,
      hueRotate: 20
    },
    'vintage-80s': {
      saturation: 0.4,
      hueRotate: -10
    },
    'horror-desaturated': {
      saturation: -0.5,
      brightness: -0.15,
      contrast: 0.2
    },
    'sci-fi-blue': {
      hueRotate: -40,
      saturation: 0.2,
      brightness: -0.1
    },
    'bw-classic': {
      grayscale: 1.0,
      contrast: 0.1
    },
    'bw-high-contrast': {
      grayscale: 1.0,
      contrast: 0.5
    }
  };

  return presets[lutId] || null;
}

/**
 * Apply easing function to progress value
 */
function applyEasing(progress: number, easing: string): number {
  switch (easing) {
    case 'linear':
      return progress;
    
    case 'ease-in':
      return progress * progress;
    
    case 'ease-out':
      return 1 - Math.pow(1 - progress, 2);
    
    case 'ease-in-out':
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    default:
      return progress;
  }
}

/**
 * Reset all effects on element
 */
export function resetEffects(element: HTMLVideoElement | HTMLImageElement | null) {
  if (!element) return;
  
  element.style.opacity = '1';
  element.style.transform = 'none';
  element.style.clipPath = 'none';
  element.style.filter = 'none';
}

/**
 * Get assets that should be visible at current playhead position
 */
export function getActiveAssetsAtTime(
  assets: TimelineAsset[],
  currentTime: number
): {
  activeAssets: TimelineAsset[];
  transitionPairs: Array<{
    clip1: TimelineAsset;
    clip2: TimelineAsset;
    progress: number;
  }>;
} {
  const activeAssets = assets.filter(asset => {
    const assetStart = asset.startTime;
    const assetEnd = asset.startTime + asset.duration;
    return currentTime >= assetStart && currentTime <= assetEnd;
  });

  const transitionPairs: Array<{ clip1: TimelineAsset; clip2: TimelineAsset; progress: number }> = [];

  // Find transition pairs
  assets.forEach((asset, index) => {
    if (asset.transition && asset.transition.type !== 'cut') {
      const transitionStart = asset.startTime + asset.duration - asset.transition.duration;
      const transitionEnd = asset.startTime + asset.duration;

      if (currentTime >= transitionStart && currentTime <= transitionEnd) {
        // Find the next asset on the same track
        const nextAsset = assets.find(a => 
          a.track === asset.track &&
          a.trackType === asset.trackType &&
          Math.abs(a.startTime - transitionEnd) < 0.1
        );

        if (nextAsset) {
          const progress = (currentTime - transitionStart) / asset.transition.duration;
          transitionPairs.push({
            clip1: asset,
            clip2: nextAsset,
            progress: Math.max(0, Math.min(1, progress))
          });
        }
      }
    }
  });

  return { activeAssets, transitionPairs };
}

