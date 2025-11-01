/**
 * Universal Media Constants
 * 
 * Centralized file type constants used across the platform
 * for Timeline, Composition, Production, and Asset Management
 */

// ===== FILE SIZE LIMITS =====

export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_AUDIO_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_MB = 10;

export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
export const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ===== SUPPORTED FORMATS =====

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',           // MP4 (H.264, H.265, HEVC)
  'video/quicktime',     // MOV (Apple ProRes, H.264)
  'video/webm',          // WebM (VP8, VP9)
  'video/x-matroska'     // MKV (Any codec)
];

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',          // MP3
  'audio/wav',           // WAV (uncompressed, PCM)
  'audio/aac',           // AAC (Apple audio)
  'audio/ogg'            // OGG Vorbis
];

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',          // JPEG
  'image/jpg',           // JPG (same as JPEG)
  'image/png',           // PNG (with transparency)
  'image/gif',           // GIF (animated supported)
  'image/webp'           // WebP (modern format)
];

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES,
  ...SUPPORTED_IMAGE_TYPES
];

// ===== FILE EXTENSIONS =====

export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv'];
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aac', '.ogg'];
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// ===== VALIDATION HELPERS =====

export interface ValidationResult {
  valid: boolean;
  error?: string;
  mediaType?: 'video' | 'audio' | 'image';
}

export function validateMediaFile(file: File): ValidationResult {
  const fileType = file.type;
  
  // Check video types
  if (fileType.startsWith('video/')) {
    if (!SUPPORTED_VIDEO_TYPES.includes(fileType)) {
      return { 
        valid: false, 
        error: 'Unsupported video format. Use MP4, MOV, WebM, or MKV.' 
      };
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return { 
        valid: false, 
        error: `Video too large. Max ${MAX_VIDEO_SIZE_MB}MB` 
      };
    }
    return { valid: true, mediaType: 'video' };
  }
  
  // Check audio types
  if (fileType.startsWith('audio/')) {
    if (!SUPPORTED_AUDIO_TYPES.includes(fileType)) {
      return { 
        valid: false, 
        error: 'Unsupported audio format. Use MP3, WAV, AAC, or OGG.' 
      };
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return { 
        valid: false, 
        error: `Audio too large. Max ${MAX_AUDIO_SIZE_MB}MB` 
      };
    }
    return { valid: true, mediaType: 'audio' };
  }
  
  // Check image types
  if (fileType.startsWith('image/')) {
    if (!SUPPORTED_IMAGE_TYPES.includes(fileType)) {
      return { 
        valid: false, 
        error: 'Unsupported image format. Use JPG, PNG, GIF, or WebP.' 
      };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { 
        valid: false, 
        error: `Image too large. Max ${MAX_IMAGE_SIZE_MB}MB` 
      };
    }
    return { valid: true, mediaType: 'image' };
  }
  
  return { 
    valid: false, 
    error: 'Unsupported file type. Use video, audio, or image files.' 
  };
}

export function getMediaType(file: File): 'video' | 'audio' | 'image' | null {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

