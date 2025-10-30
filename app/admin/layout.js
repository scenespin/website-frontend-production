import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Admin Layout - Wraps all admin pages with authentication and authorization
 * 
 * Security:
 * - Checks if user is logged in
 * - Checks if user has admin privileges (via publicMetadata.isAdmin)
 * - Redirects non-admins to dashboard
 * 
 * To set admin privileges:
 * 1. Go to Clerk Dashboard → Users
 * 2. Select user → Metadata tab
 * 3. Add to Public Metadata: { "isAdmin": true }
 */
export default async function AdminLayout({ children }) {
  const { userId } = await auth();
  
  // Check authentication
  if (!userId) {
    redirect("/sign-in?redirect=/admin");
  }
  
  // Get full user object to check metadata
  const user = await currentUser();
  
  // Check admin privileges
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  
  if (!isAdmin) {
    // Log unauthorized access attempt
    console.warn(`[Admin Access Denied] User ${userId} attempted to access admin area`);
    redirect("/dashboard");
  }
  
  return (
    <div className="min-h-screen bg-base-100">
      {/* Admin Badge - Visual indicator */}
      <div className="bg-error text-error-content px-4 py-2 text-center text-sm font-semibold">
        🛡️ ADMIN MODE - Logged in as {user.emailAddresses?.[0]?.emailAddress}
      </div>
      
      {children}
    </div>
  );
}

