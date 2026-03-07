/**
 * Context Store - Global State Management for Cross-Page Navigation
 * 
 * Tracks user's current position in their project (scene, beat, character, etc.)
 * and maintains this context as they navigate between pages.
 * 
 * This enables seamless navigation where clicking from the editor to Production
 * automatically focuses on the current scene/character.
 * 
 * Auto-clear triggers:
 * - User clicks X button on context banner
 * - User switches to different project
 * - Context older than 24 hours
 * - User returns to dashboard (leaves workflow)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface EditorContext {
  // Project identification
  projectId: string | null;
  projectName: string | null;
  
  // Current position in script
  currentSceneId: string | null;
  currentSceneName: string | null;
  currentBeatId: string | null;
  currentBeatName: string | null;
  
  // Active character
  activeCharacterId: string | null;
  activeCharacterName: string | null;
  
  // Cursor position
  cursorPosition: number | null;
  cursorLine: number | null;
  
  // Timestamp
  lastUpdated: Date | null;
}

interface ContextStore {
  context: EditorContext;
  
  // Update entire context
  setContext: (context: Partial<EditorContext>) => void;
  
  // Update specific fields
  setProject: (projectId: string, projectName: string) => void;
  setCurrentScene: (sceneId: string | null, sceneName: string | null) => void;
  setCurrentBeat: (beatId: string | null, beatName: string | null) => void;
  setActiveCharacter: (characterId: string | null, characterName: string | null) => void;
  setCursorPosition: (position: number, line: number) => void;
  
  // Clear context
  clearContext: () => void;
  
  // Get context as URL params
  getContextParams: () => URLSearchParams;
}

const initialContext: EditorContext = {
  projectId: null,
  projectName: null,
  currentSceneId: null,
  currentSceneName: null,
  currentBeatId: null,
  currentBeatName: null,
  activeCharacterId: null,
  activeCharacterName: null,
  cursorPosition: null,
  cursorLine: null,
  lastUpdated: null,
};

export const useContextStore = create<ContextStore>()(
  persist(
    (set, get) => ({
      context: initialContext,
      
      setContext: (newContext) => set((state) => ({
        context: {
          ...state.context,
          ...newContext,
          lastUpdated: new Date(),
        },
      })),
      
      setProject: (projectId, projectName) => {
        const currentProjectId = get().context.projectId;
        
        // If switching to a different project, clear context
        if (currentProjectId && currentProjectId !== projectId) {
          set({ context: initialContext });
        }
        
        set((state) => ({
          context: {
            ...state.context,
            projectId,
            projectName,
            lastUpdated: new Date(),
          },
        }));
      },
      
      setCurrentScene: (sceneId, sceneName) => set((state) => ({
        context: {
          ...state.context,
          currentSceneId: sceneId,
          currentSceneName: sceneName,
          lastUpdated: new Date(),
        },
      })),
      
      setCurrentBeat: (beatId, beatName) => set((state) => ({
        context: {
          ...state.context,
          currentBeatId: beatId,
          currentBeatName: beatName,
          lastUpdated: new Date(),
        },
      })),
      
      setActiveCharacter: (characterId, characterName) => set((state) => ({
        context: {
          ...state.context,
          activeCharacterId: characterId,
          activeCharacterName: characterName,
          lastUpdated: new Date(),
        },
      })),
      
      setCursorPosition: (position, line) => set((state) => ({
        context: {
          ...state.context,
          cursorPosition: position,
          cursorLine: line,
          lastUpdated: new Date(),
        },
      })),
      
      clearContext: () => set({ context: initialContext }),
      
      getContextParams: () => {
        const { context } = get();
        const params = new URLSearchParams();
        
        if (context.projectId) params.set('projectId', context.projectId);
        if (context.currentSceneId) params.set('sceneId', context.currentSceneId);
        if (context.currentBeatId) params.set('beatId', context.currentBeatId);
        if (context.activeCharacterId) params.set('characterId', context.activeCharacterId);
        
        return params;
      },
    }),
    {
      name: 'wryda-context-storage',
      // Only persist essential fields (not cursor position, timestamps)
      partialize: (state) => ({
        context: {
          projectId: state.context.projectId,
          projectName: state.context.projectName,
          currentSceneId: state.context.currentSceneId,
          currentSceneName: state.context.currentSceneName,
          currentBeatId: state.context.currentBeatId,
          currentBeatName: state.context.currentBeatName,
          activeCharacterId: state.context.activeCharacterId,
          activeCharacterName: state.context.activeCharacterName,
          lastUpdated: state.context.lastUpdated,
        },
      }),
    }
  )
);

/**
 * Hook to easily update context from any page
 */
export function useContextUpdater() {
  const setContext = useContextStore((state) => state.setContext);
  const setProject = useContextStore((state) => state.setProject);
  const setCurrentScene = useContextStore((state) => state.setCurrentScene);
  const setCurrentBeat = useContextStore((state) => state.setCurrentBeat);
  const setActiveCharacter = useContextStore((state) => state.setActiveCharacter);
  const setCursorPosition = useContextStore((state) => state.setCursorPosition);
  
  return {
    setContext,
    setProject,
    setCurrentScene,
    setCurrentBeat,
    setActiveCharacter,
    setCursorPosition,
  };
}

/**
 * Hook to read context from any page
 */
export function useEditorContext() {
  return useContextStore((state) => state.context);
}

/**
 * Hook to generate contextual links
 */
export function useContextualLink() {
  const getContextParams = useContextStore((state) => state.getContextParams);
  
  return (basePath: string) => {
    const params = getContextParams();
    const paramString = params.toString();
    return paramString ? `${basePath}?${paramString}` : basePath;
  };
}

/**
 * Hook to check if context is stale (older than 24 hours)
 */
export function useStaleContextCheck() {
  const context = useContextStore((state) => state.context);
  const clearContext = useContextStore((state) => state.clearContext);
  
  useEffect(() => {
    if (!context.lastUpdated) return;
    
    const lastUpdated = new Date(context.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    // Clear context if older than 24 hours
    if (hoursSinceUpdate > 24) {
      console.log('[Context] Context is stale (>24hrs), clearing...');
      clearContext();
    }
  }, [context.lastUpdated, clearContext]);
}

/**
 * Hook to auto-clear context when navigating to dashboard
 */
export function useDashboardContextClear() {
  const pathname = usePathname?.();
  const clearContext = useContextStore((state) => state.clearContext);
  
  useEffect(() => {
    // Clear context when returning to dashboard (leaving workflow)
    if (pathname === '/dashboard') {
      clearContext();
    }
  }, [pathname, clearContext]);
}