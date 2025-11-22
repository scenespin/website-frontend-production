'use client';

import { useSearchParams } from 'next/navigation';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import CharacterBoard from '@/components/screenplay/CharacterBoard';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';

export default function CharactersPageClient() {
  const searchParams = useSearchParams();
  // Feature 0130: Use 'project' URL parameter (query param name stays as 'project' for compatibility)
  // No 'default' fallback - matches write/page.js
  const screenplayId = searchParams.get('project');
  const { openDrawer } = useDrawer();
  const { setMode, setEntityContextBanner } = useChatContext();

  // Handler for AI Interview workflow
  const handleSwitchToChatImageMode = (modelId, entityContext) => {
    console.log('[CharacterPage] AI Interview triggered:', entityContext);
    
    if (entityContext?.workflow === 'interview') {
      // Set mode to the entity type (character) so the correct agent panel is shown
      setMode(entityContext.type || 'character');
      
      // Set entity context banner so the mode panel knows what entity we're creating
      setEntityContextBanner(entityContext);
      
      // Open the drawer - the CharacterModePanel will auto-start the workflow
      openDrawer('chat');
      console.log('[CharacterPage] Opened AI Interview drawer with character agent');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-base-content">
      {/* Editor Sub-Navigation */}
      <EditorSubNav activeTab="characters" screenplayId={screenplayId} />

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

