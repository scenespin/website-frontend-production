import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";

// Protected layout for authenticated pages
// Clerk middleware handles the auth check, so we don't need to check here
export default function LayoutPrivate({ children }) {
  return (
    <DrawerProvider>
      <div className="min-h-screen bg-base-100">
        <Navigation />
        {children}
      </div>
    </DrawerProvider>
  );
}
