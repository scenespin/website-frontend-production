import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";

export default async function CompositionLayout({ children }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
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

