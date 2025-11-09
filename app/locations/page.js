'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import LocationBoard from '@/components/screenplay/LocationBoard';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';

function LocationsPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || 'default';
  const { setIsDrawerOpen } = useDrawer();
  const { setMode, setWorkflow } = useChatContext();

  // Handler for AI Interview workflow
  const handleSwitchToChatImageMode = (modelId, entityContext) => {
    console.log('[LocationPage] AI Interview triggered:', entityContext);
    console.log('[LocationPage] Functions available:', { 
      hasSetMode: typeof setMode === 'function',
      hasSetWorkflow: typeof setWorkflow === 'function',
      hasSetIsDrawerOpen: typeof setIsDrawerOpen === 'function'
    });
    
    if (entityContext?.workflow === 'interview') {
      if (typeof setMode === 'function') {
        setMode('chat'); // Set to 'chat' mode (interview is a workflow, not a mode)
      } else {
        console.error('[LocationPage] setMode is not a function!');
      }
      
      if (typeof setWorkflow === 'function') {
        setWorkflow(entityContext); // Set the workflow context
      } else {
        console.error('[LocationPage] setWorkflow is not a function!');
      }
      
      if (typeof setIsDrawerOpen === 'function') {
        setIsDrawerOpen(true);
      } else {
        console.error('[LocationPage] setIsDrawerOpen is not a function!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-base-content">
      {/* Editor Sub-Navigation */}
      <EditorSubNav activeTab="locations" projectId={projectId} />

      {/* Use existing LocationBoard component with AI Interview integration */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
        <LocationBoard 
          showHeader={true}
          onSwitchToChatImageMode={handleSwitchToChatImageMode}
        />
      </div>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LocationsPageContent />
    </Suspense>
  );
}

