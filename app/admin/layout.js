import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Admin Layout - Wraps all admin pages with authentication and authorization
 * 
 * Security:
 * - Middleware ensures user is authenticated (handled in middleware.ts)
 * - Layout checks if user has admin privileges
 * - Redirects non-admins to dashboard
 * 
 * To set admin privileges:
 * 1. Go to Clerk Dashboard → Users
 * 2. Select user → Metadata tab
 * 3. Add to Public Metadata: { "isAdmin": true }
 */
export default async function AdminLayout({ children }) {
  try {
    const { userId } = await auth();
    
    // This shouldn't happen due to middleware, but double-check
    if (!userId) {
      console.warn('[Admin] No userId found, redirecting to sign-in');
      redirect("/sign-in");
      return null;
    }
    
    // Get user with metadata from Clerk API
    const user = await clerkClient.users.getUser(userId);
    
    // Check admin privileges
    const isAdmin = user?.publicMetadata?.isAdmin === true;
    
    if (!isAdmin) {
      // Log unauthorized access attempt
      console.warn(`[Admin Access Denied] User ${userId} (${user?.emailAddresses?.[0]?.emailAddress || 'unknown'}) is not an admin`);
      redirect("/dashboard");
      return null;
    }
    
    // User is admin, render admin interface
    return (
      <div className="min-h-screen bg-base-100">
        {/* Admin Badge - Visual indicator */}
        <div className="bg-error text-error-content px-4 py-2 text-center text-sm font-semibold">
          🛡️ ADMIN MODE - {user?.emailAddresses?.[0]?.emailAddress || userId}
        </div>
        
        {children}
      </div>
    );
  } catch (error) {
    // Log error and redirect to prevent infinite loops
    console.error('[Admin Layout Error]', error);
    redirect("/dashboard");
    return null;
  }
}

