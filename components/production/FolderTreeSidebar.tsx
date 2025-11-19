'use client';

/**
 * Folder Tree Sidebar Component
 * 
 * Displays hierarchical folder structure for Media Library navigation.
 * Supports Google Drive and Dropbox folder structures.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface FolderReference {
  google_drive_folder_id?: string;
  dropbox_folder_path?: string;
}

interface ScreenplayFolderStructure {
  root: FolderReference;
  characters: FolderReference;
  locations: FolderReference;
  scenes: FolderReference;
  audio: FolderReference;
  compositions: FolderReference;
  compositionsVideo?: FolderReference;
  compositionsAudio?: FolderReference;
}

interface FolderNode {
  id: string;
  name: string;
  path: string[];
  folderId?: string;
  provider?: 'google-drive' | 'dropbox';
  children?: FolderNode[];
  fileCount?: number;
}

interface FolderTreeSidebarProps {
  screenplayId: string;
  onFolderSelect: (folderId: string, path: string[]) => void;
  selectedFolderId?: string | null;
}

export function FolderTreeSidebar({
  screenplayId,
  onFolderSelect,
  selectedFolderId
}: FolderTreeSidebarProps) {
  const { getToken } = useAuth();
  const [folderStructure, setFolderStructure] = useState<ScreenplayFolderStructure | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (screenplayId) {
      loadFolderStructure();
    }
  }, [screenplayId]);

  const loadFolderStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Try to get folder structure (may not exist if folders haven't been initialized)
      const response = await fetch(`/api/storage/screenplay/${screenplayId}/initialize`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.folder_structure) {
          setFolderStructure(data.folder_structure);
        }
      } else if (response.status === 404) {
        // Folders not initialized yet - that's okay, show empty state
        setFolderStructure(null);
      } else {
        throw new Error(`Failed to load folders: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[FolderTreeSidebar] Failed to load folder structure:', error);
      setError(error instanceof Error ? error.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const buildFolderTree = (): FolderNode[] => {
    if (!folderStructure) return [];

    const tree: FolderNode[] = [
      {
        id: 'root',
        name: 'All Files',
        path: [],
        children: [
          {
            id: 'characters',
            name: 'Characters',
            path: ['Characters'],
            folderId: folderStructure.characters.google_drive_folder_id || folderStructure.characters.dropbox_folder_path,
            provider: folderStructure.characters.google_drive_folder_id ? 'google-drive' : 'dropbox',
            children: [] // Character folders would be loaded dynamically
          },
          {
            id: 'locations',
            name: 'Locations',
            path: ['Locations'],
            folderId: folderStructure.locations.google_drive_folder_id || folderStructure.locations.dropbox_folder_path,
            provider: folderStructure.locations.google_drive_folder_id ? 'google-drive' : 'dropbox',
            children: []
          },
          {
            id: 'scenes',
            name: 'Scenes',
            path: ['Scenes'],
            folderId: folderStructure.scenes.google_drive_folder_id || folderStructure.scenes.dropbox_folder_path,
            provider: folderStructure.scenes.google_drive_folder_id ? 'google-drive' : 'dropbox',
            children: []
          },
          {
            id: 'audio',
            name: 'Audio',
            path: ['Audio'],
            folderId: folderStructure.audio.google_drive_folder_id || folderStructure.audio.dropbox_folder_path,
            provider: folderStructure.audio.google_drive_folder_id ? 'google-drive' : 'dropbox',
            children: []
          },
          {
            id: 'compositions',
            name: 'Compositions',
            path: ['Compositions'],
            folderId: folderStructure.compositions.google_drive_folder_id || folderStructure.compositions.dropbox_folder_path,
            provider: folderStructure.compositions.google_drive_folder_id ? 'google-drive' : 'dropbox',
            children: []
          }
        ]
      }
    ];

    return tree;
  };

  const renderFolderNode = (node: FolderNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolderId === node.folderId || (node.id === 'root' && !selectedFolderId);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#DC143C]/20 text-[#FFFFFF] border border-[#DC143C]/50'
              : 'text-[#808080] hover:bg-[#1F1F1F] hover:text-[#FFFFFF]'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleFolder(node.id);
            }
            if (node.folderId || node.id === 'root') {
              onFolderSelect(node.folderId || '', node.path);
            }
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="p-0.5 hover:bg-[#1F1F1F] rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Spacer
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-sm truncate flex-1">{node.name}</span>
          {node.fileCount !== undefined && (
            <span className="text-xs text-[#808080]">{node.fileCount}</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-64 bg-[#141414] border-r border-[#3F3F46] h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#808080]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-[#141414] border-r border-[#3F3F46] h-full p-4">
        <div className="text-sm text-[#DC143C]">{error}</div>
        <button
          onClick={loadFolderStructure}
          className="mt-2 text-xs text-[#808080] hover:text-[#FFFFFF]"
        >
          Retry
        </button>
      </div>
    );
  }

  const folderTree = buildFolderTree();

  return (
    <div className="w-64 bg-[#141414] border-r border-[#3F3F46] h-full overflow-y-auto">
      <div className="p-4 border-b border-[#3F3F46]">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Folders</h3>
      </div>
      <div className="p-2 space-y-1">
        {folderTree.map(node => renderFolderNode(node))}
      </div>
      {!folderStructure && (
        <div className="p-4 text-xs text-[#808080]">
          <p>Folders will appear here once you connect cloud storage and create content.</p>
        </div>
      )}
    </div>
  );
}

