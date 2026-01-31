/**
 * Provider display labels for image generation models
 * Used for thumbnail tags in Character, Asset, and Location detail modals.
 * Single source of truth to avoid "Nano Banana Pro 2K / 2K" duplication.
 */

/** Display name for provider ID (no resolution in name; resolution comes from getResolutionLabel) */
export function getProviderLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;

  const providerMap: Record<string, string> = {
    'nano-banana-pro': 'Nano Banana Pro',
    'nano-banana-pro-2k': 'Nano Banana Pro', // Same base name; resolution shown via getResolutionLabel
    'runway-gen4-image': 'Gen4',
    'luma-photon-1': 'Photon',
    'luma-photon-flash': 'Photon',
    'flux2-max-4k-16:9': 'FLUX.2 [max]',
    'flux2-max-2k': 'FLUX.2 [max]',
    'flux2-pro-4k': 'FLUX.2 [pro]',
    'flux2-pro-2k': 'FLUX.2 [pro]',
    'flux2-flex': 'FLUX.2 [flex]',
    'imagen-3-fast': 'Imagen 3 Fast',
    'imagen-4-fast': 'Imagen 4 Fast',
    'imagen-3': 'Imagen 3',
    'imagen-4': 'Imagen 4',
  };

  return providerMap[providerId] ?? null;
}

/** Resolution tag for provider (2K, 4K, or null) */
export function getResolutionLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  const twoK = ['nano-banana-pro-2k', 'flux2-pro-2k', 'flux2-max-2k'];
  const fourK = ['nano-banana-pro', 'flux2-max-4k-16:9', 'flux2-pro-4k'];
  if (twoK.includes(providerId)) return '2K';
  if (fourK.includes(providerId)) return '4K';
  return null;
}

/** Final tag string for image thumbnail: "ProviderName / 2K" or "ProviderName / 4K" or "ProviderName". Returns null if unknown provider. */
export function formatProviderTag(providerId: string | undefined): string | null {
  const providerLabel = getProviderLabel(providerId);
  if (!providerLabel) return null;
  const resLabel = getResolutionLabel(providerId);
  return resLabel ? `${providerLabel} / ${resLabel}` : providerLabel;
}
