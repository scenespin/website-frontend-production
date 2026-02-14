/**
 * Per-tab identity for editor lock (Feature 0187 / 0265).
 * Each tab gets a stable ID so the lock applies per-tab within the same browser.
 */

const STORAGE_KEY = 'editor_tab_id';

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create a stable ID for this browser tab.
 * Stored in sessionStorage so it persists for the tab but is different per tab.
 */
export function getOrCreateEditorTabId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id || !id.trim()) {
      id = generateTabId();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateTabId();
  }
}
