/**
 * Editor Context Utilities
 * 
 * Helper functions for extracting context from the editor for AI agent launches.
 * Used by AgentFABGroup and AgentQuickLaunch components.
 */

import { RefObject } from 'react';
import { getCurrentSceneContext } from './fountain';
import type { SceneContext } from '@/components/agents/ChatContext';

/**
 * Extract scene context and editor state from current editor content
 */
export function extractEditorContext(
  editorContent: string,
  cursorPosition: number
): {
  sceneContext: SceneContext | null;
  currentLine: number;
} {
  // Use existing fountain utility to get scene context
  const sceneContext = getCurrentSceneContext(editorContent, cursorPosition);
  
  // Calculate current line number
  const textBeforeCursor = editorContent.substring(0, cursorPosition);
  const currentLine = textBeforeCursor.split('\n').length;
  
  return {
    sceneContext,
    currentLine
  };
}

/**
 * Get current editor selection (selected text and range)
 */
export function getEditorSelection(
  textareaRef: RefObject<HTMLTextAreaElement>
): { text: string; start: number; end: number } | null {
  if (!textareaRef.current) return null;
  
  const start = textareaRef.current.selectionStart;
  const end = textareaRef.current.selectionEnd;
  
  // No selection if start equals end
  if (start === end) return null;
  
  const text = textareaRef.current.value.substring(start, end);
  
  return { text, start, end };
}

/**
 * Check if there is text selected in the editor
 */
export function hasSelection(textareaRef: RefObject<HTMLTextAreaElement>): boolean {
  if (!textareaRef.current) return false;
  
  const start = textareaRef.current.selectionStart;
  const end = textareaRef.current.selectionEnd;
  
  return start !== end;
}

