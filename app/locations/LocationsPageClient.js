'use client';

import { useSearchParams } from 'next/navigation';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import LocationBoard from '@/components/screenplay/LocationBoard';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';

export default function LocationsPageClient() {
  const searchParams = useSearchParams();
  // Feature 0130: Use 'project' URL parameter (query param name stays as 'project' for compatibility)
  // No 'default' fallback - matches write/page.js
  const screenplayId = searchParams.get('project');
  const { openDrawer } = useDrawer();
  const { setMode, setEntityContextBanner } = useChatContext();

  // Handler for AI Interview workflow
  const handleSwitchToChatImageMode = (modelId, entityContext) => {
    console.log('[LocationPage] AI Interview triggered:', entityContext);
    
    if (entityContext?.workflow === 'interview') {
      // Set mode to the entity type (location) so the correct agent panel is shown
      setMode(entityContext.type || 'location');
      
      // Set entity context banner so the mode panel knows what entity we're creating
      setEntityContextBanner(entityContext);
      
      // Open the drawer - the LocationModePanel will auto-start the workflow
      openDrawer('chat');
      console.log('[LocationPage] Opened AI Interview drawer with location agent');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-base-content">
      {/* Editor Sub-Navigation */}
      <EditorSubNav activeTab="locations" screenplayId={screenplayId} />

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

