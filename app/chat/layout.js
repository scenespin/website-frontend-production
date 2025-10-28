import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";

export default async function ChatLayout({ children }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      {children}
    </div>
  );
}

