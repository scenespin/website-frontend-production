'use client';

import Navigation from "@/components/Navigation";

export default function BeatsLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      {children}
    </div>
  );
}
