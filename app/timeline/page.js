'use client';

import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useEditorContext } from '@/lib/contextStore';
import { EnhancedTimelineEditor } from '@/components/timeline/EnhancedTimelineEditor';
import { toast } from 'sonner';

export default function TimelinePage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const editorContext = useEditorContext();
  
  // Get preloaded clips from navigation state (if coming from other pages)
  const preloadedClipsData = searchParams.get('clips') 
    ? JSON.parse(decodeURIComponent(searchParams.get('clips'))) 
    : null;

  const projectId = searchParams.get('projectId') || null;
  const sceneFilter = searchParams.get('sceneId') || null;
  
  // Context-aware state
  const [contextualInfo, setContextualInfo] = useState<string | null>(null);

  // Show contextual information when arriving from editor
  useEffect(() => {
    if (editorContext.currentSceneName) {
      setContextualInfo(editorContext.currentSceneName);
      
      toast.info(`Timeline filtered for: ${editorContext.currentSceneName}`, {
        description: 'Showing clips from your current scene',
        duration: 3000
      });
    }
  }, [editorContext.currentSceneName]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Please sign in to use the Timeline Editor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Context Indicator */}
      {contextualInfo && (
        <div className="bg-info/10 border-b border-info/20 px-4 py-2 text-sm">
          <span className="opacity-70">Scene context:</span>{' '}
          <span className="font-semibold">{contextualInfo}</span>
        </div>
      )}
      
      <EnhancedTimelineEditor 
        projectId={projectId}
        preloadedClips={preloadedClipsData}
        sceneFilter={sceneFilter || editorContext.currentSceneId}
        contextualScene={editorContext.currentSceneName}
      />
    </div>
  );
}
