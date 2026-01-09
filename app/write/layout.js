'use client';

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useMemo, useRef } from "react";
import Navigation from "@/components/Navigation";
import AgentDrawer from "@/components/AgentDrawer";
import UnifiedChatPanel from "@/components/UnifiedChatPanel";
import { useEditor } from "@/contexts/EditorContext";
import { useDrawer } from "@/contexts/DrawerContext";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export default function WriteLayout({ children }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  
  // 🔥 FIX: Hooks must be called unconditionally, but EditorProvider should be available
  // If it's not, the error will be caught by error boundary
  // The issue might be a race condition during navigation - ensure EditorProvider is in root layout
  const { state: editorState, insertText, replaceSelection, isEditorFullscreen } = useEditor();
  const { isDrawerOpen } = useDrawer();

  // 🔥 CRITICAL FIX: Use refs for editorState values to prevent onInsert from being recreated
  // cursorPosition changes on every selection, which was causing infinite re-renders
  const editorStateRef = useRef(editorState);
  useEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);

  // 🔥 CRITICAL FIX: ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This prevents React error #310 (hooks order violation)
  // Memoize onInsert to prevent new function reference on every render
  // Use refs instead of direct state to prevent recreation when cursor/content change
  const onInsert = useCallback((text, options) => {
    // If this is a rewrite (selected text exists), use replaceSelection
    if (options?.isRewrite && options?.selectionRange) {
      const { start, end } = options.selectionRange;
      // Clean the text and replace the selection
      const cleanedText = text.trim();
      replaceSelection(cleanedText, start, end);
    } else {
      // Regular insert: Use ref to get current values without depending on them
      const currentState = editorStateRef.current;
      const position = currentState.cursorPosition ?? currentState.content.length;
      // Add newline before insertion for separation (unless at start of file)
      const contentBefore = currentState.content.substring(0, position);
      const needsNewlineBefore = position > 0 && !contentBefore.endsWith('\n\n');
      const textToInsert = needsNewlineBefore ? '\n\n' + text : text;
      insertText(textToInsert, position);
    }
  }, [insertText, replaceSelection]); // Only depend on stable functions, not state values

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
      <div className="pt-16 md:pt-0">
        {children}
      </div>
      <AgentDrawer>
        {/* 🔥 CRITICAL: Only mount UnifiedChatPanel when drawer is open to prevent effects from running */}
        {/* This prevents infinite loops when FAB buttons trigger state updates */}
        {isDrawerOpen && (
          <UnifiedChatPanel 
            editorContent={editorContent}
            cursorPosition={cursorPosition}
            onInsert={onInsert}
          />
        )}
      </AgentDrawer>
    </div>
  );
}

