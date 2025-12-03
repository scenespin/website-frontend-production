'use client';

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";

// Client-side auth check - cleaner and no server redirect loops
// Note: Next.js 16 requires providers in nested client layouts for proper context availability
// Root LayoutClient.js also has providers, but nested layouts need their own for timing
export default function LayoutPrivate({ children }) {
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
    <DrawerProvider>
      <ChatProvider>
        <div className="min-h-screen bg-base-100">
          <Navigation />
          {children}
          <AgentDrawer>
            <UnifiedChatPanel />
          </AgentDrawer>
        </div>
      </ChatProvider>
    </DrawerProvider>
  );
}
