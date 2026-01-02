'use client';

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useMemo } from "react";
import Navigation from "@/components/Navigation";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";
import { useEditor } from "@/contexts/EditorContext";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function WriteLayout({ children }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { state: editorState, insertText, replaceSelection, isEditorFullscreen } = useEditor();

  // 🔥 CRITICAL FIX: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This prevents React error #310 (hooks order violation)
  // Memoize onInsert to prevent new function reference on every render
  // This prevents UnifiedChatPanel's commonProps from being recreated, which causes infinite loops
  const onInsert = useCallback((text, options) => {
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
  }, [editorState.cursorPosition, editorState.content, insertText, replaceSelection]);

  // Memoize editorContent and cursorPosition to prevent unnecessary re-renders
  // Only create new references when values actually change
  const editorContent = useMemo(() => editorState.content, [editorState.content]);
  const cursorPosition = useMemo(() => editorState.cursorPosition, [editorState.cursorPosition]);

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
      {!isEditorFullscreen && <Navigation />}
      {children}
      <AgentDrawer>
        <UnifiedChatPanel 
          editorContent={editorContent}
          cursorPosition={cursorPosition}
          onInsert={onInsert}
        />
      </AgentDrawer>
    </div>
  );
}

