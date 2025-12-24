import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ScreenplayProvider } from "@/contexts/ScreenplayContext";

export default function DirectLayout({ children }) {
  return (
    <ScreenplayProvider>
      <DrawerProvider>
        <ChatProvider>
          <div className="min-h-screen bg-base-100">
            <Navigation />
            {children}
          </div>
        </ChatProvider>
      </DrawerProvider>
    </ScreenplayProvider>
  );
}

