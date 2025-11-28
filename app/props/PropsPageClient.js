'use client';

import { useSearchParams } from 'next/navigation';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import AssetBoard from '@/components/screenplay/AssetBoard';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';

export default function PropsPageClient() {
  const searchParams = useSearchParams();
  // Feature 0130: Use 'project' URL parameter (query param name stays as 'project' for compatibility)
  const screenplayId = searchParams.get('project');
  const { openDrawer } = useDrawer();
  const { setMode, setEntityContextBanner } = useChatContext();

  // Handler for AI Interview workflow
  const handleSwitchToChatImageMode = (modelId, entityContext) => {
    console.log('[PropsPage] AI Interview triggered:', entityContext);
    
    if (entityContext?.workflow === 'interview') {
      const agentMode = entityContext.type || 'asset';
      
      // Set entity context banner so the mode panel knows what entity we're creating
      setEntityContextBanner(entityContext);
      
      // Open drawer with the correct agent mode
      openDrawer(agentMode, {
        mode: agentMode,
        entityContext: entityContext
      });
      console.log('[PropsPage] Opened AI Interview drawer with', agentMode, 'agent');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-base-content">
      {/* Editor Sub-Navigation */}
      <EditorSubNav activeTab="props" screenplayId={screenplayId} />

      {/* Use AssetBoard component with AI Interview integration */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
        <AssetBoard 
          showHeader={true}
          onSwitchToChatImageMode={handleSwitchToChatImageMode}
        />
      </div>
    </div>
  );
}

