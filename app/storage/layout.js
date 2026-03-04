import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ScreenplayProvider } from "@/contexts/ScreenplayContext";

export default function StorageLayout({ children }) {
  return (
    <ScreenplayProvider>
      <DrawerProvider>
        <ChatProvider>
          <div className="min-h-screen bg-base-100 flex flex-col">
            <Navigation />
            <main className="flex-1 min-h-0 flex flex-col">
              {children}
            </main>
          </div>
        </ChatProvider>
      </DrawerProvider>
    </ScreenplayProvider>
  );
}

