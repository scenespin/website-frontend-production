import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";

export default function ProductionLayout({ children }) {
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

