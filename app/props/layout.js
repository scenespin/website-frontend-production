'use client';

import Navigation from "@/components/Navigation";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";

export default function PropsLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      {children}
      {/* Note: DrawerProvider and ChatProvider are already provided by LayoutClient.js (root layout) */}
      <AgentDrawer>
        <UnifiedChatPanel />
      </AgentDrawer>
    </div>
  );
}

