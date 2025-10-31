'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';

/**
 * ScreenplayContext
 * 
 * Provides screenplay-centric storage and project management.
 * 
 * KEY ARCHITECTURE:
 * - Each screenplay = separate project with its own storage provider
 * - Each screenplay = dedicated cloud storage folder (e.g., /Wryda Screenplays/{Title}/)
 * - Each screenplay = optional GitHub repo for script and asset manifest
 * - All generated assets save to screenplay's folder structure
 * 
 * HIERARCHICAL FOLDER STRUCTURE:
 * /Wryda Screenplays/{Screenplay Title}/
 *   ├── Characters/{CharacterName}/
 *   │   ├── references/
 *   │   ├── 3d_models/
 *   │   └── voices/
 *   ├── Locations/{LocationName}/
 *   │   ├── references/
 *   │   └── 3d_models/
 *   ├── Scenes/Scene_{number}/
 *   │   ├── storyboards/
 *   │   ├── videos/
 *   │   └── audio/
 *   ├── Audio/
 *   │   ├── music/
 *   │   ├── sfx/
 *   │   ├── dialogue/
 *   │   └── voiceovers/
 *   └── Compositions/
 *       ├── video/
 *       └── audio/
 */

const ScreenplayContext = createContext(undefined);

export function ScreenplayProvider({ children }) {
  const { user } = useUser();
  
  // Current screenplay/project
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // All user projects
  const [projects, setProjects] = useState([]);
  
  // Storage configuration for current project
  const [storageConfig, setStorageConfig] = useState(null);

  /**
   * Load all user projects
   */
  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.projects.list();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('[ScreenplayContext] Error loading projects:', error);
    }
  }, [user]);

  /**
   * Load specific project
   */
  const loadProject = useCallback(async (projectId) => {
    if (!projectId) {
      setCurrentProject(null);
      setStorageConfig(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Load project details
      const projectResponse = await api.projects.get(projectId);
      const project = projectResponse.data.project;
      setCurrentProject(project);
      
      // Load storage configuration
      if (project.storage_provider && project.storage_provider !== 'local') {
        const storageResponse = await api.projects.getStorageConfig(projectId);
        setStorageConfig(storageResponse.data.config);
      } else {
        setStorageConfig(null);
      }
      
      console.log('[ScreenplayContext] Loaded project:', project.project_name);
    } catch (error) {
      console.error('[ScreenplayContext] Error loading project:', error);
      setCurrentProject(null);
      setStorageConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Switch to a different project
   */
  const switchProject = useCallback(async (projectId) => {
    await loadProject(projectId);
  }, [loadProject]);

  /**
   * Create new project
   */
  const createProject = useCallback(async (projectData) => {
    try {
      const response = await api.projects.create(projectData);
      const newProject = response.data.project;
      
      // Add to projects list
      setProjects(prev => [...prev, newProject]);
      
      // Switch to new project
      await loadProject(newProject.project_id);
      
      return newProject;
    } catch (error) {
      console.error('[ScreenplayContext] Error creating project:', error);
      throw error;
    }
  }, [loadProject]);

  /**
   * Get folder path for a specific entity type
   * 
   * @param {string} entityType - 'character', 'location', 'scene', 'audio', 'composition'
   * @param {string} entityName - Name of the entity (e.g., character name)
   * @param {string} subfolder - Optional subfolder (e.g., 'references', 'voices', '3d_models')
   * @returns {string} Full folder path
   */
  const getFolderPath = useCallback((entityType, entityName = null, subfolder = null) => {
    if (!currentProject) {
      // Fallback to old static paths if no project loaded
      if (entityType === 'character' && entityName) {
        return `/Wryda Screenplays/Characters/${entityName}${subfolder ? `/${subfolder}` : ''}`;
      }
      return '/Wryda Screenplays/Generated Images';
    }
    
    // Build screenplay-centric path
    const basePath = `/Wryda Screenplays/${currentProject.project_name}`;
    
    switch (entityType) {
      case 'character':
        if (!entityName) return `${basePath}/Characters`;
        return `${basePath}/Characters/${entityName}${subfolder ? `/${subfolder}` : ''}`;
      
      case 'location':
        if (!entityName) return `${basePath}/Locations`;
        return `${basePath}/Locations/${entityName}${subfolder ? `/${subfolder}` : ''}`;
      
      case 'scene':
        if (!entityName) return `${basePath}/Scenes`;
        return `${basePath}/Scenes/${entityName}${subfolder ? `/${subfolder}` : ''}`;
      
      case 'audio':
        // entityName = audio type (music, sfx, dialogue, voiceovers)
        return `${basePath}/Audio${entityName ? `/${entityName}` : ''}`;
      
      case 'composition':
        // entityName = composition type (video, audio)
        return `${basePath}/Compositions${entityName ? `/${entityName}` : ''}`;
      
      case 'voice-profile':
        // entityName = character name
        if (!entityName) return `${basePath}/Voice Profiles`;
        return `${basePath}/Voice Profiles/${entityName}`;
      
      case '3d-model':
        // For 3D models exported from Character Bank
        if (!entityName) return `${basePath}/3D Models`;
        return `${basePath}/3D Models/${entityName}`;
      
      default:
        return `${basePath}/Generated Images`;
    }
  }, [currentProject]);

  /**
   * Get storage provider for current project
   * @returns {'google-drive' | 'dropbox' | 'local' | null}
   */
  const getStorageProvider = useCallback(() => {
    return currentProject?.storage_provider || null;
  }, [currentProject]);

  /**
   * Check if project has cloud storage configured
   */
  const hasCloudStorage = useCallback(() => {
    const provider = getStorageProvider();
    return provider && provider !== 'local';
  }, [getStorageProvider]);

  /**
   * Get GitHub repo info for current project
   */
  const getGitHubRepo = useCallback(() => {
    if (!currentProject?.github_repo_url) return null;
    
    try {
      const match = currentProject.github_repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, ''),
          url: currentProject.github_repo_url
        };
      }
    } catch (error) {
      console.error('[ScreenplayContext] Error parsing GitHub URL:', error);
    }
    
    return null;
  }, [currentProject]);

  /**
   * Track asset in GitHub manifest
   * 
   * @param {Object} assetData - Asset information
   * @param {string} assetData.asset_id - Unique asset ID
   * @param {string} assetData.asset_type - 'image' | 'video' | 'audio'
   * @param {string} assetData.entity_type - 'character' | 'location' | 'scene'
   * @param {string} assetData.entity_id - Entity ID
   * @param {string} assetData.entity_name - Entity name
   * @param {string} assetData.storage_location - 'google-drive' | 'dropbox' | 's3'
   * @param {Object} assetData.storage_metadata - Storage-specific metadata
   */
  const trackAsset = useCallback(async (assetData) => {
    const githubRepo = getGitHubRepo();
    
    if (!githubRepo) {
      console.log('[ScreenplayContext] No GitHub repo configured, skipping asset tracking');
      return;
    }
    
    try {
      await api.assets.track({
        userId: user.id,
        owner: githubRepo.owner,
        repo: githubRepo.repo,
        asset: assetData
      });
      
      console.log('[ScreenplayContext] Asset tracked in manifest:', assetData.asset_id);
    } catch (error) {
      console.error('[ScreenplayContext] Error tracking asset:', error);
      // Non-critical error - don't throw
    }
  }, [user, getGitHubRepo]);

  // Load projects on mount
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, loadProjects]);

  // Auto-load project from URL params (for editor page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('project');
      
      if (projectId && projectId !== currentProject?.project_id) {
        loadProject(projectId);
      } else if (!projectId && currentProject) {
        setIsLoading(false);
      }
    }
  }, [currentProject, loadProject]);

  const value = {
    // Current project
    currentProject,
    isLoading,
    
    // Projects list
    projects,
    loadProjects,
    
    // Project management
    loadProject,
    switchProject,
    createProject,
    
    // Storage configuration
    storageConfig,
    getStorageProvider,
    hasCloudStorage,
    
    // Folder paths
    getFolderPath,
    
    // GitHub integration
    getGitHubRepo,
    trackAsset,
  };

  return (
    <ScreenplayContext.Provider value={value}>
      {children}
    </ScreenplayContext.Provider>
  );
}

export function useScreenplay() {
  const context = useContext(ScreenplayContext);
  if (context === undefined) {
    throw new Error('useScreenplay must be used within a ScreenplayProvider');
  }
  return context;
}

