'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import CharacterBoard from '@/components/screenplay/CharacterBoard';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';

function CharactersPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || 'default';
  const { setIsDrawerOpen } = useDrawer();
  const { setMode, setWorkflow } = useChatContext();

  // Handler for AI Interview workflow
  const handleSwitchToChatImageMode = (modelId, entityContext) => {
    if (entityContext?.workflow === 'interview') {
      setMode('interview');
      setWorkflow(entityContext);
      setIsDrawerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-base-content">
      {/* Editor Sub-Navigation */}
      <EditorSubNav activeTab="characters" projectId={projectId} />

      {/* Use existing CharacterBoard component with AI Interview integration */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
        <CharacterBoard 
          showHeader={true}
          onSwitchToChatImageMode={handleSwitchToChatImageMode}
        />
      </div>
    </div>
  );
}

export default function CharactersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <CharactersPageContent />
    </Suspense>
  );
}

