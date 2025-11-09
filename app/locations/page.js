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
  const { openDrawer } = useDrawer();
  const { setMode, setWorkflow } = useChatContext();

  // Handler for AI Interview workflow
  const handleSwitchToChatImageMode = (modelId, entityContext) => {
    console.log('[LocationPage] AI Interview triggered:', entityContext);
    
    if (entityContext?.workflow === 'interview') {
      // Set mode and workflow context
      setMode('chat'); // Set to 'chat' mode (interview is a workflow, not a mode)
      setWorkflow(entityContext); // Set the workflow context
      
      // Open the drawer
      openDrawer('chat');
      console.log('[LocationPage] Opened AI Interview drawer');
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

