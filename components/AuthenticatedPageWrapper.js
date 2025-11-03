'use client';

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ScreenplayProvider } from "@/contexts/ScreenplayContext";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";

/**
 * AuthenticatedPageWrapper
 * 
 * Wraps authenticated pages to ensure:
 * 1. User is signed in (redirects to /sign-in if not)
 * 2. Navigation.js appears on all pages consistently
 * 3. Required context providers are available (Screenplay, Drawer, Chat)
 * 4. AgentDrawer and UnifiedChatPanel are available
 * 
 * Usage:
 * ```jsx
 * import AuthenticatedPageWrapper from '@/components/AuthenticatedPageWrapper';
 * 
 * export default function MyPage() {
 *   return (
 *     <AuthenticatedPageWrapper>
 *       {page content here}
 *     </AuthenticatedPageWrapper>
 *   );
 * }
 * ```
 */
export default function AuthenticatedPageWrapper({ children, requiresProject = false }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!userId) {
    return null;
  }

  return (
    <ScreenplayProvider>
      <DrawerProvider>
        <ChatProvider>
          <div className="min-h-screen bg-base-100">
            <Navigation />
            <main>
              {children}
            </main>
            <AgentDrawer>
              <UnifiedChatPanel />
            </AgentDrawer>
          </div>
        </ChatProvider>
      </DrawerProvider>
    </ScreenplayProvider>
  );
}

