/**
 * Fix welcome modal persistence - update Clerk metadata for existing users
 * Usage: Just log in with each account and run this in browser console:
 * 
 * await window.Clerk.user.update({
 *   publicMetadata: { hasSeenWelcome: true }
 * });
 * 
 * Or use this backend script if you have Clerk Admin API access
 */

// This is a client-side fix. Users should run this in their browser console while logged in:
console.log(`
To fix the welcome modal appearing every time:

1. Log in to your account
2. Open browser console (F12)
3. Run this command:

await window.Clerk.user.update({
  publicMetadata: { hasSeenWelcome: true }
});

4. Refresh the page - welcome modal should not appear anymore!
`);

// Alternative: Add this to the dashboard page to auto-fix on first visit
export async function autoFixWelcomeModal(user: any) {
  if (!user?.publicMetadata?.hasSeenWelcome) {
    try {
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          hasSeenWelcome: true,
        },
      });
      console.log('✅ Welcome modal flag set');
    } catch (error) {
      console.error('❌ Failed to update welcome flag:', error);
    }
  }
}

