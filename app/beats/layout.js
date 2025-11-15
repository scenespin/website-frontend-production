'use client';

import Navigation from "@/components/Navigation";
import { EditorProvider } from "@/contexts/EditorContext";

export default function BeatsLayout({ children }) {
  return (
    <EditorProvider>
      <div className="min-h-screen bg-base-100">
        <Navigation />
        {children}
      </div>
    </EditorProvider>
  );
}
