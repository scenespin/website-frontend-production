type StoryAdvisorCopyMarker = {
  markerId: string;
  source: 'story_advisor_ai';
  createdAt: number;
  expiresAt: number;
  normalizedHash: string;
  normalizedLength: number;
  preview: string;
};

const MARKER_TTL_MS = 10 * 60 * 1000;
const MAX_MARKERS = 20;

const markerQueue: StoryAdvisorCopyMarker[] = [];

function normalizeClipboardText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function pruneExpiredMarkers(now: number): void {
  for (let i = markerQueue.length - 1; i >= 0; i -= 1) {
    if (markerQueue[i].expiresAt <= now) {
      markerQueue.splice(i, 1);
    }
  }
}

export function registerStoryAdvisorCopy(text: string): StoryAdvisorCopyMarker | null {
  if (!text || typeof window === 'undefined') return null;

  const normalized = normalizeClipboardText(text);
  if (!normalized) return null;

  const now = Date.now();
  pruneExpiredMarkers(now);

  const marker: StoryAdvisorCopyMarker = {
    markerId: `copy_${now}_${Math.random().toString(36).slice(2, 9)}`,
    source: 'story_advisor_ai',
    createdAt: now,
    expiresAt: now + MARKER_TTL_MS,
    normalizedHash: hashText(normalized),
    normalizedLength: normalized.length,
    preview: normalized.slice(0, 220),
  };

  markerQueue.unshift(marker);
  if (markerQueue.length > MAX_MARKERS) {
    markerQueue.length = MAX_MARKERS;
  }

  return marker;
}

export function matchStoryAdvisorCopy(text: string): StoryAdvisorCopyMarker | null {
  if (!text || typeof window === 'undefined') return null;

  const normalized = normalizeClipboardText(text);
  if (!normalized) return null;

  const now = Date.now();
  pruneExpiredMarkers(now);

  const normalizedHash = hashText(normalized);
  const normalizedLength = normalized.length;

  return markerQueue.find(
    (marker) =>
      marker.normalizedHash === normalizedHash &&
      marker.normalizedLength === normalizedLength
  ) || null;
}
