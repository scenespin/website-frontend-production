'use client';

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";
import { useEditor } from "@/contexts/EditorContext";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function WriteLayout({ children }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { state: editorState, insertText, replaceSelection } = useEditor();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!userId) {
    return null;
  }

  // Note: ScreenplayProvider and EditorProvider are already provided by LayoutClient.js (root layout)
  // DO NOT wrap with duplicate providers here as it creates duplicate contexts
  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      {children}
      <AgentDrawer>
        <UnifiedChatPanel 
          editorContent={editorState.content}
          cursorPosition={editorState.cursorPosition}
          onInsert={(text, options) => {
            // If this is a rewrite (selected text exists), use replaceSelection
            if (options?.isRewrite && options?.selectionRange) {
              const { start, end } = options.selectionRange;
              // Clean the text and replace the selection
              const cleanedText = text.trim();
              replaceSelection(cleanedText, start, end);
            } else {
              // Regular insert: Insert text at current cursor position, or at end if no cursor
              const position = editorState.cursorPosition ?? editorState.content.length;
              // Add newline before insertion for separation (unless at start of file)
              const contentBefore = editorState.content.substring(0, position);
              const needsNewlineBefore = position > 0 && !contentBefore.endsWith('\n\n');
              const textToInsert = needsNewlineBefore ? '\n\n' + text : text;
              insertText(textToInsert, position);
            }
          }}
        />
      </AgentDrawer>
    </div>
  );
}

