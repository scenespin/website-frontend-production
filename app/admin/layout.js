import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

/**
 * Admin Layout - Wraps all admin pages with authentication and authorization
 * 
 * Security:
 * - Middleware ensures user is authenticated (handled in middleware.ts)
 * - Layout checks if user has admin privileges
 * - Redirects non-admins to dashboard
 * 
 * Uses the same pattern as /api/admin/voice-consents/route.js which is working
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
      console.warn('[Admin Layout] No userId found, redirecting to sign-in');
      redirect("/sign-in");
      return null;
    }
    
    // Use currentUser() - same pattern as working voice-consents API route
    const user = await currentUser();
    
    // Check admin privileges - check both isAdmin and role for flexibility
    const isAdmin = user?.publicMetadata?.isAdmin === true || 
                    user?.publicMetadata?.isAdmin === 'true' ||
                    user?.publicMetadata?.isAdmin === 1 ||
                    user?.publicMetadata?.role === 'admin';
    
    // Fallback: Check hardcoded admin emails (same as voice-consents route)
    let isAdminByEmail = false;
    if (!isAdmin && user?.emailAddresses?.[0]?.emailAddress) {
      const adminEmails = [
        "jeff@gardensc.com",
        // Add more admin emails here as needed
      ];
      const email = user.emailAddresses[0].emailAddress;
      isAdminByEmail = adminEmails.includes(email);
    }
    
    const finalIsAdmin = isAdmin || isAdminByEmail;
    
    if (!finalIsAdmin) {
      // Log unauthorized access attempt
      console.warn(`[Admin Layout] Access Denied - User ${userId} (${user?.emailAddresses?.[0]?.emailAddress || 'unknown'})`, {
        publicMetadata: user?.publicMetadata,
        isAdminValue: user?.publicMetadata?.isAdmin,
        roleValue: user?.publicMetadata?.role,
      });
      redirect("/dashboard");
      return null;
    }
    
    console.log('[Admin Layout] ✅ Admin access granted');
    
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
    // Log error with full details and redirect to prevent infinite loops
    console.error('[Admin Layout] Error:', error);
    console.error('[Admin Layout] Error stack:', error.stack);
    redirect("/dashboard");
    return null;
  }
}

