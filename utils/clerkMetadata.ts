/**
 * Clerk Metadata Utilities
 * Feature 0119: Store current_screenplay_id in Clerk metadata instead of localStorage
 * 
 * This provides a centralized way to read/write the current screenplay ID
 * to Clerk's user metadata, which persists across sessions and devices.
 */

import { User } from '@clerk/nextjs/server';

/**
 * Get current screenplay ID from Clerk metadata
 * Falls back to localStorage for backward compatibility
 * 
 * @param user - Clerk user object (from useUser() hook)
 * @returns screenplay_id or null if not found
 */
export function getCurrentScreenplayId(user: User | null | undefined): string | null {
  // Priority 1: Read from Clerk metadata
  if (user?.publicMetadata?.current_screenplay_id) {
    const screenplayId = user.publicMetadata.current_screenplay_id as string;
    if (typeof screenplayId === 'string' && screenplayId.length > 0) {
      return screenplayId;
    }
  }

  // Priority 2: Fallback to localStorage (backward compatibility)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('current_screenplay_id');
    if (stored && stored.length > 0) {
      return stored;
    }
  }

  return null;
}

/**
 * Set current screenplay ID in Clerk metadata
 * Also updates localStorage for backward compatibility
 * 
 * @param user - Clerk user object (from useUser() hook)
 * @param screenplayId - The screenplay ID to store
 * @returns Promise that resolves when update is complete
 */
export async function setCurrentScreenplayId(
  user: User | null | undefined,
  screenplayId: string
): Promise<void> {
  if (!user) {
    console.warn('[ClerkMetadata] Cannot update metadata: user not available');
    // Still save to localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_screenplay_id', screenplayId);
    }
    return;
  }

  try {
    // Update Clerk metadata
    await user.update({
      publicMetadata: {
        ...user.publicMetadata,
        current_screenplay_id: screenplayId
      }
    });

    console.log('[ClerkMetadata] ✅ Updated current_screenplay_id in Clerk metadata:', screenplayId);

    // Also update localStorage for backward compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_screenplay_id', screenplayId);
    }
  } catch (error: any) {
    console.error('[ClerkMetadata] ❌ Failed to update Clerk metadata:', error);
    
    // Fallback: Save to localStorage only
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_screenplay_id', screenplayId);
      console.warn('[ClerkMetadata] ⚠️ Saved to localStorage as fallback');
    }
    
    // Re-throw error so caller can handle it
    throw error;
  }
}

/**
 * Migrate screenplay ID from localStorage to Clerk metadata
 * One-time migration helper (can be called on app mount)
 * 
 * @param user - Clerk user object (from useUser() hook)
 */
export async function migrateFromLocalStorage(user: User | null | undefined): Promise<void> {
  if (!user) {
    return;
  }

  // If metadata already exists, no migration needed
  if (user.publicMetadata?.current_screenplay_id) {
    return;
  }

  // Check localStorage for existing screenplay_id
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('current_screenplay_id');
    if (stored && stored.length > 0) {
      try {
        await setCurrentScreenplayId(user, stored);
        console.log('[ClerkMetadata] ✅ Migrated screenplay_id from localStorage to Clerk metadata');
      } catch (error) {
        console.error('[ClerkMetadata] ❌ Migration failed:', error);
        // Don't throw - migration failure shouldn't break the app
      }
    }
  }
}

