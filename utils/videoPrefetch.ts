/**
 * Video Prefetching Utility
 * 
 * Converts presigned URLs to Blob URLs to avoid CORS and format detection issues.
 * This is a best practice for reliable video playback with presigned URLs.
 */

interface PrefetchOptions {
  onProgress?: (progress: number) => void;
  timeout?: number;
}

/**
 * Prefetch a video from a URL and convert it to a Blob URL
 * This eliminates CORS issues and improves format detection
 */
export async function prefetchVideo(
  url: string,
  options: PrefetchOptions = {}
): Promise<string> {
  const { onProgress, timeout = 30000 } = options;

  try {
    // Check if URL is already a blob URL
    if (url.startsWith('blob:')) {
      return url;
    }

    // Fetch the video
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors', // Explicitly request CORS
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    // Check Content-Type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('video/')) {
      console.warn('[prefetchVideo] Unexpected Content-Type:', contentType);
    }

    // Get content length for progress tracking
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    // Read the response as a blob
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const chunks: BlobPart[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      received += value.length;

      // Report progress if callback provided
      if (onProgress && total > 0) {
        onProgress(received / total);
      }
    }

    // Create blob from chunks
    const blob = new Blob(chunks, { type: contentType || 'video/mp4' });
    
    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Video prefetch timeout');
    }
    throw error;
  }
}

/**
 * Check if browser supports the video format
 * Tests multiple codec variants for better compatibility detection
 */
export function canPlayVideoFormat(url: string): { supported: boolean; format: string; codecSupport: Record<string, string> } {
  const video = document.createElement('video');
  
  // Detect format from URL
  const urlLower = url.toLowerCase();
  let format = 'unknown';
  const codecTests: Record<string, string> = {};

  if (urlLower.includes('.mp4') || urlLower.includes('video/mp4')) {
    format = 'mp4';
    // Test multiple H.264 variants
    codecTests['H.264 Baseline'] = 'video/mp4; codecs="avc1.42E01E"';
    codecTests['H.264 Main'] = 'video/mp4; codecs="avc1.4D401E"';
    codecTests['H.264 High'] = 'video/mp4; codecs="avc1.640028"';
    codecTests['H.264 Generic'] = 'video/mp4; codecs="avc1"';
    codecTests['MP4 Generic'] = 'video/mp4';
    // Also test H.265/HEVC (some videos might use this)
    codecTests['H.265/HEVC'] = 'video/mp4; codecs="hev1.1.6.L93.B0"';
  } else if (urlLower.includes('.webm') || urlLower.includes('video/webm')) {
    format = 'webm';
    codecTests['VP8'] = 'video/webm; codecs="vp8, vorbis"';
    codecTests['VP9'] = 'video/webm; codecs="vp9, opus"';
    codecTests['WebM Generic'] = 'video/webm';
  } else if (urlLower.includes('.mov') || urlLower.includes('video/quicktime')) {
    format = 'mov';
    codecTests['QuickTime'] = 'video/quicktime';
    codecTests['H.264 in MOV'] = 'video/quicktime; codecs="avc1"';
  } else if (urlLower.includes('.mkv')) {
    format = 'mkv';
    codecTests['Matroska'] = 'video/x-matroska';
  }

  // Test all codec variants
  const codecSupport: Record<string, string> = {};
  let anySupported = false;

  for (const [name, mimeType] of Object.entries(codecTests)) {
    const canPlay = video.canPlayType(mimeType);
    codecSupport[name] = canPlay;
    if (canPlay === 'probably' || canPlay === 'maybe') {
      anySupported = true;
    }
  }

  return { supported: anySupported, format, codecSupport };
}

/**
 * Cleanup blob URL to free memory
 */
export function revokeBlobUrl(blobUrl: string): void {
  if (blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
}
