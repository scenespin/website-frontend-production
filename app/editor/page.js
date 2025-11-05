'use client';

/**
 * /editor Page - Simple redirect to /write page
 * The actual editor is at /write
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual editor at /write
    router.replace('/write');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading editor...</p>
      </div>
    </div>
  );
}
