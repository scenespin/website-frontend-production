/**
 * Outfit name utilities (Feature 0255).
 * Must match backend CharacterBankService.canonicalOutfitName so that
 * "Mr. Saturday Night", "Mr Saturday Night", "Mr_Saturday_night" map to one key/folder.
 */

/**
 * Canonical outfit name for storage and folder resolution.
 * Same rule as backend: trim → replace [.\\s\-_]+ with _ → strip leading/trailing _ → toLowerCase; empty → 'default'.
 */
export function canonicalOutfitName(name: string): string {
  if (!name || typeof name !== 'string') return 'default';
  const t = name.trim();
  if (!t) return 'default';
  const canonical = t
    .replace(/[.\s\-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return canonical || 'default';
}

/**
 * Display label for a canonical outfit name (e.g. for dropdowns).
 * 'default' → defaultLabel or 'Default Outfit'; otherwise replace _ with space and title-case.
 */
export function canonicalToDisplay(
  canonical: string,
  defaultLabel: string = 'Default Outfit'
): string {
  if (!canonical || canonical === 'default') return defaultLabel;
  return canonical
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
