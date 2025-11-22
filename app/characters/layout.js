'use client';

import Navigation from "@/components/Navigation";

// Force dynamic rendering since child page uses useSearchParams
export const dynamic = 'force-dynamic';

export default function CharactersLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      {children}
    </div>
  );
}
