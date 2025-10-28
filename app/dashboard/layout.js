import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { DrawerProvider } from "@/contexts/DrawerContext";

// Protected layout for authenticated pages
// Applies to: /dashboard, /chat, /production, /editor, /write
export default async function LayoutPrivate({ children }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <DrawerProvider>
      <div className="min-h-screen bg-base-100">
        <Navigation />
        {children}
      </div>
    </DrawerProvider>
  );
}
