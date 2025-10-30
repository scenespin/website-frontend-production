import Navigation from "@/components/Navigation";

export default function ChatLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      {children}
    </div>
  );
}

