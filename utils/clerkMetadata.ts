/**
 * Clerk Metadata Utilities
 * Feature 0119: Store current_screenplay_id in Clerk metadata instead of localStorage
 * 
 * This provides a centralized way to read/write the current screenplay ID
 * to Clerk's user metadata, which persists across sessions and devices.
 */

import type { UserResource } from '@clerk/types';

/**
 * Type definition for UserResource.update() method
 * Clerk's types don't include publicMetadata in the update signature, but it works at runtime
 */
interface UserUpdateParams {
  publicMetadata?: Record<string, unknown>;
  unsafeMetadata?: Record<string, unknown>;
  username?: string;
  firstName?: string;
  lastName?: string;
  primaryEmailAddressId?: string;
  primaryPhoneNumberId?: string;
  primaryWeb3WalletId?: string;
}

interface UserResourceWithUpdate extends UserResource {
  update(params: UserUpdateParams): Promise<UserResource>;
}

/**
 * Get current screenplay ID from Clerk metadata
 * Falls back to localStorage for backward compatibility
 * 
 * @param user - Clerk user object (from useUser() hook)
 * @returns screenplay_id or null if not found
 */
export function getCurrentScreenplayId(user: UserResource | null | undefined): string | null {
  // Priority 1: Read from Clerk unsafeMetadata (frontend-writable)
  if (user?.unsafeMetadata?.current_screenplay_id) {
    const screenplayId = user.unsafeMetadata.current_screenplay_id as string;
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
 * Uses unsafeMetadata (frontend-writable) per Clerk best practices
 * Also updates localStorage for backward compatibility
 * 
 * @param user - Clerk user object (from useUser() hook)
 * @param screenplayId - The screenplay ID to store
 * @returns Promise that resolves when update is complete
 */
export async function setCurrentScreenplayId(
  user: UserResource | null | undefined,
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
    // Use unsafeMetadata (frontend-writable) per Clerk documentation
    // publicMetadata is backend-only, unsafeMetadata is for user preferences
    const userWithUpdate = user as unknown as UserResourceWithUpdate;
    await userWithUpdate.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        current_screenplay_id: screenplayId
      }
    });

    console.log('[ClerkMetadata] ✅ Updated current_screenplay_id in Clerk unsafeMetadata:', screenplayId);

    // Also update localStorage for backward compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_screenplay_id', screenplayId);
    }
  } catch (error: any) {
    console.error('[ClerkMetadata] ❌ Failed to update Clerk metadata:', error);
    
    // Fallback: Save to localStorage only (non-critical - app still works)
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_screenplay_id', screenplayId);
      console.warn('[ClerkMetadata] ⚠️ Saved to localStorage as fallback');
    }
    
    // Don't re-throw - metadata update failure shouldn't break the app
    // The screenplay_id is still saved in localStorage
  }
}

/**
 * Clear current screenplay ID from Clerk metadata and localStorage.
 * Use this when a stale/invalid screenplay ID is detected.
 */
export async function clearCurrentScreenplayId(
  user: UserResource | null | undefined
): Promise<void> {
  if (!user) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('current_screenplay_id');
    }
    return;
  }

  try {
    const userWithUpdate = user as unknown as UserResourceWithUpdate;
    await userWithUpdate.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        current_screenplay_id: null
      }
    });
  } catch (error) {
    console.error('[ClerkMetadata] ❌ Failed to clear current_screenplay_id in Clerk metadata:', error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('current_screenplay_id');
    }
  }
}

/**
 * Migrate screenplay ID from localStorage to Clerk metadata
 * One-time migration helper (can be called on app mount)
 * 
 * @param user - Clerk user object (from useUser() hook)
 */
export async function migrateFromLocalStorage(user: UserResource | null | undefined): Promise<void> {
  if (!user) {
    return;
  }

  // If metadata already exists, no migration needed
  if (user.unsafeMetadata?.current_screenplay_id) {
    return;
  }

  // Check localStorage for existing screenplay_id
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('current_screenplay_id');
    if (stored && stored.length > 0) {
      try {
        await setCurrentScreenplayId(user, stored);
        console.log('[ClerkMetadata] ✅ Migrated screenplay_id from localStorage to Clerk unsafeMetadata');
      } catch (error) {
        console.error('[ClerkMetadata] ❌ Migration failed:', error);
        // Don't throw - migration failure shouldn't break the app
      }
    }
  }
}

