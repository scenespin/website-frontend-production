'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import BeatBoard from '@/components/structure/BeatBoard';
// ResponsiveHeader removed - will use Navigation.js from wrapper

function StoryBeatsPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isClient, setIsClient] = useState(false);

  // Only render after client-side hydration to prevent server/client mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <>
      {/* ResponsiveHeader removed - Navigation.js will be added via wrapper */}
      <div className="min-h-screen bg-slate-900 text-base-content">
        {/* Editor Sub-Navigation */}
        <EditorSubNav activeTab="beats" projectId={projectId} />

        {/* View Toggle */}
        <div className="border-b border-slate-700 bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-200">Story Beats</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag & drop scenes between sequences to reorganize your screenplay
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'board'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="List view (coming soon)"
                disabled
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-180px)]">
          {viewMode === 'board' ? (
            <BeatBoard projectId={projectId} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              List view coming soon...
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function StoryBeatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <StoryBeatsPageContent />
    </Suspense>
  );
}

