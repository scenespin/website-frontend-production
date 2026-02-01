/**
 * Shared validation and error display for "reference image required" before generation.
 * Used when user clicks Generate (pose/angle/background) so they get immediate feedback
 * instead of a failed job. Backend still enforces for safety.
 */

export const REFERENCE_REQUIRED_MESSAGE =
  'Add a reference image before generating.';

type ToastLike = { error: (msg: string, opts?: { description?: string; duration?: number }) => void };

/**
 * Show toast and optional inline error. Call when validation fails; caller should return early.
 */
export function showReferenceRequired(
  toast: ToastLike,
  setError?: (message: string) => void
): void {
  toast.error(REFERENCE_REQUIRED_MESSAGE, {
    description: 'Upload a reference image for this character, location, or asset, then try again.',
    duration: 5000,
  });
  if (setError) {
    setError(REFERENCE_REQUIRED_MESSAGE);
  }
}

/** Character has a reference if base S3 key is set or in-modal headshot is provided. */
export function hasCharacterReference(opts: {
  baseReferenceS3Key?: string | null;
  headshotFile?: File | null;
  headshotPreview?: string;
}): boolean {
  const { baseReferenceS3Key, headshotFile, headshotPreview } = opts;
  if (baseReferenceS3Key && baseReferenceS3Key.trim() !== '') return true;
  if (headshotFile) return true;
  if (headshotPreview && headshotPreview.trim() !== '') return true;
  return false;
}

/** Location has reference images (images or referenceImages array). */
export function hasLocationReference(location?: {
  images?: unknown[];
  referenceImages?: unknown[];
} | null): boolean {
  if (!location) return false;
  const images = location.images ?? location.referenceImages;
  return Array.isArray(images) && images.length > 0;
}

/** Asset has reference images (creation images). */
export function hasAssetReference(asset?: { images?: unknown[] } | null): boolean {
  if (!asset) return false;
  return Array.isArray(asset.images) && asset.images.length > 0;
}
