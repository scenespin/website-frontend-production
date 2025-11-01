/**
 * useTimelineSave.tsx
 * Save, backup, and sync logic for timeline projects
 * Extracted from useTimeline.tsx for better modularity
 */

import { useCallback, useEffect } from 'react';
import type { TimelineProject, SaveStatus } from '../useTimeline';

export interface TimelineSaveOptions {
  projectId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableLocalStorageBackup?: boolean;
  enableGitHubBackup?: boolean;
  onSaveSuccess?: (timestamp: string) => void;
  onSaveError?: (error: Error) => void;
}

export interface TimelineSaveReturn {
  saveProject: () => Promise<boolean>;
  loadProject: () => Promise<TimelineProject | null>;
  saveToLocalStorage: (project: TimelineProject) => void;
  loadFromLocalStorage: () => TimelineProject | null;
  saveToGitHub: (project: TimelineProject) => Promise<void>;
  addToRetryQueue: (project: TimelineProject) => void;
  processRetryQueue: () => Promise<void>;
}

export function useTimelineSave(
  project: TimelineProject,
  setProject: React.Dispatch<React.SetStateAction<TimelineProject>>,
  saveStatus: SaveStatus,
  setSaveStatus: React.Dispatch<React.SetStateAction<SaveStatus>>,
  setLastSaved: React.Dispatch<React.SetStateAction<Date | null>>,
  isOnline: boolean,
  saveQueueRef: React.MutableRefObject<any[]>,
  retryIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  isUnmountingRef: React.MutableRefObject<boolean>,
  options: TimelineSaveOptions
): TimelineSaveReturn {
  
  const {
    projectId,
    enableLocalStorageBackup = true,
    enableGitHubBackup = false,
    onSaveSuccess,
    onSaveError
  } = options;

  const STORAGE_KEY = `timeline_project_${project.id}`;

  /**
   * Save to localStorage (instant backup)
   */
  const saveToLocalStorage = useCallback((projectData: TimelineProject) => {
    try {
      const serialized = JSON.stringify(projectData);
      localStorage.setItem(STORAGE_KEY, serialized);
      console.log('[Timeline] Saved to localStorage');
    } catch (error) {
      console.error('[Timeline] Failed to save to localStorage:', error);
    }
  }, [STORAGE_KEY]);

  /**
   * Load from localStorage
   */
  const loadFromLocalStorage = useCallback((): TimelineProject | null => {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      
      const loaded = JSON.parse(serialized);
      console.log('[Timeline] Loaded from localStorage');
      return loaded;
    } catch (error) {
      console.error('[Timeline] Failed to load from localStorage:', error);
      return null;
    }
  }, [STORAGE_KEY]);

  /**
   * Save to GitHub (optional user data ownership)
   */
  const saveToGitHub = useCallback(async (projectData: TimelineProject) => {
    try {
      // This would integrate with GitHub API
      // For now, just log - implement when GitHub integration is ready
      console.log('[Timeline] GitHub backup triggered (not yet implemented)');
    } catch (error) {
      console.error('[Timeline] GitHub backup failed:', error);
      throw error;
    }
  }, []);

  /**
   * Add failed save to retry queue
   */
  const addToRetryQueue = useCallback((projectData: TimelineProject) => {
    saveQueueRef.current.push({
      project: projectData,
      retryCount: 0,
      timestamp: Date.now()
    });
    console.log('[Timeline] Added to retry queue, length:', saveQueueRef.current.length);
  }, [saveQueueRef]);

  /**
   * Process retry queue (attempt failed saves)
   */
  const processRetryQueue = useCallback(async () => {
    if (saveQueueRef.current.length === 0 || !isOnline) return;

    console.log('[Timeline] Processing retry queue, ${saveQueueRef.current.length} items');
    const queue = [...saveQueueRef.current];
    saveQueueRef.current = [];

    for (const item of queue) {
      try {
        const token = localStorage.getItem('jwt_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://o31t5jk8w5.execute-api.us-east-1.amazonaws.com';
        
        const response = await fetch(`${apiUrl}/api/timeline/project/${item.project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item.project)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log('[Timeline] Retry successful for project:', item.project.id);
      } catch (error) {
        // If retry fails, add back to queue if not too many retries
        if (item.retryCount < 3) {
          saveQueueRef.current.push({ ...item, retryCount: item.retryCount + 1 });
          console.warn('[Timeline] Retry failed, re-queued');
        } else {
          console.error('[Timeline] Max retries exceeded, giving up');
        }
      }
    }
  }, [saveQueueRef, isOnline]);

  /**
   * Save project (main save function)
   */
  const saveProject = useCallback(async () => {
    // Don't save if unmounting (will be handled by beforeunload)
    if (isUnmountingRef.current) return false;
    
    try {
      setSaveStatus('saving');
      
      // Step 1: ALWAYS save to localStorage first (instant backup)
      if (enableLocalStorageBackup) {
        saveToLocalStorage(project);
      }
      
      // Step 2: If offline, queue for retry
      if (!isOnline) {
        console.log('[Timeline] Offline, queuing save for retry');
        addToRetryQueue(project);
        setSaveStatus('offline');
        return false;
      }
      
      // Step 3: Try to save to backend (DynamoDB)
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://o31t5jk8w5.execute-api.us-east-1.amazonaws.com';
      
      const response = await fetch(`${apiUrl}/api/timeline/project/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        throw new Error(`Save failed: HTTP ${response.status}`);
      }

      // Step 4: (OPTIONAL) Save to GitHub if enabled
      if (enableGitHubBackup) {
        try {
          await saveToGitHub(project);
        } catch (gitError) {
          // Don't fail entire save if GitHub fails
          console.warn('[Timeline] GitHub backup failed, but primary save succeeded');
        }
      }

      // Success!
      console.log('[Timeline] Project saved successfully');
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      if (onSaveSuccess) {
        onSaveSuccess(new Date().toISOString());
      }
      
      return true;
    } catch (error: any) {
      console.error('[Timeline] Save failed:', error);
      addToRetryQueue(project);
      setSaveStatus('error');
      
      if (onSaveError) {
        onSaveError(error);
      }
      
      return false;
    }
  }, [
    isUnmountingRef,
    project,
    isOnline,
    enableLocalStorageBackup,
    enableGitHubBackup,
    saveToLocalStorage,
    addToRetryQueue,
    saveToGitHub,
    setSaveStatus,
    setLastSaved,
    onSaveSuccess,
    onSaveError
  ]);

  /**
   * Load project from backend
   */
  const loadProject = useCallback(async (): Promise<TimelineProject | null> => {
    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://o31t5jk8w5.execute-api.us-east-1.amazonaws.com';
      
      const response = await fetch(`${apiUrl}/api/timeline/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Load failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[Timeline] Project loaded from backend');
      return data;
    } catch (error) {
      console.error('[Timeline] Load from backend failed:', error);
      
      // Fallback to localStorage
      return loadFromLocalStorage();
    }
  }, [projectId, loadFromLocalStorage]);

  /**
   * Setup retry interval for failed saves
   */
  useEffect(() => {
    if (isOnline && saveQueueRef.current.length > 0) {
      console.log('[Timeline] Online, processing retry queue');
      processRetryQueue();
    }

    // Setup retry interval (every 30 seconds)
    retryIntervalRef.current = setInterval(() => {
      if (isOnline && saveQueueRef.current.length > 0) {
        processRetryQueue();
      }
    }, 30000);

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, [isOnline, processRetryQueue, saveQueueRef, retryIntervalRef]);

  return {
    saveProject,
    loadProject,
    saveToLocalStorage,
    loadFromLocalStorage,
    saveToGitHub,
    addToRetryQueue,
    processRetryQueue
  };
}

