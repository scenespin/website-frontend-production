'use client';

/**
 * Folder Tree Sidebar Component
 * 
 * Displays hierarchical folder structure for Media Library navigation.
 * Supports both S3 folders (Feature 0128) and cloud storage folders (Google Drive/Dropbox).
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  HardDrive,
  Cloud,
  Plus
} from 'lucide-react';
import { useMediaFolderTree, useInitializeFolders } from '@/hooks/useMediaLibrary';
import { FolderTreeNode } from '@/types/media';
import { toast } from 'sonner';
import { FolderActionsMenu } from './FolderContextMenu';
import { CreateFolderModal } from './CreateFolderModal';

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
  storageType?: 's3' | 'google-drive' | 'dropbox';
  provider?: 'google-drive' | 'dropbox';
  children?: FolderNode[];
  fileCount?: number;
}

interface FolderTreeSidebarProps {
  screenplayId: string;
  onFolderSelect: (folderId: string, path: string[], storageType: 's3' | 'cloud') => void;
  selectedFolderId?: string | null;
}

export function FolderTreeSidebar({
  screenplayId,
  onFolderSelect,
  selectedFolderId
}: FolderTreeSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [cloudFolderStructure, setCloudFolderStructure] = useState<ScreenplayFolderStructure | null>(null);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [showCreateRootModal, setShowCreateRootModal] = useState(false);
  
  // Feature 0128: Load S3 folder tree
  const { 
    data: s3FolderTree = [], 
    isLoading: s3Loading,
    error: s3Error,
    refetch: refetchS3Folders
  } = useMediaFolderTree(screenplayId, !!screenplayId);
  
  // Initialize folders if they don't exist
  const initializeFolders = useInitializeFolders(screenplayId);

  // Load cloud storage folder structure (existing logic)
  // Note: Cloud storage folder loading can be added later if needed
  // For now, we focus on S3 folders (Feature 0128)
  React.useEffect(() => {
    setCloudLoading(false); // Cloud folders not implemented yet
  }, [screenplayId]);

  const handleInitializeFolders = async () => {
    try {
      await initializeFolders.mutateAsync();
      toast.success('Folder structure initialized');
      refetchS3Folders();
    } catch (error) {
      toast.error('Failed to initialize folders');
      console.error('[FolderTreeSidebar] Initialize folders error:', error);
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

  /**
   * Convert S3 folder tree to FolderNode format
   */
  const convertS3TreeToNodes = (tree: FolderTreeNode[], level: number = 0): FolderNode[] => {
    return tree.map(folder => ({
      id: folder.folderId,
      name: folder.folderName,
      path: folder.folderPath,
      folderId: folder.folderId,
      storageType: 's3' as const,
      children: folder.children ? convertS3TreeToNodes(folder.children, level + 1) : undefined,
      fileCount: folder.fileCount,
    }));
  };

  /**
   * Build unified folder tree (S3 + cloud storage)
   */
  const buildFolderTree = (): FolderNode[] => {
    const tree: FolderNode[] = [
      {
        id: 'root',
        name: 'All Files',
        path: [],
        storageType: undefined,
        children: []
      }
    ];

    // Add S3 folders
    if (s3FolderTree.length > 0) {
      const s3Nodes = convertS3TreeToNodes(s3FolderTree);
      tree[0].children = [...(tree[0].children || []), ...s3Nodes];
    }

    // Add cloud storage folders (if available)
    if (cloudFolderStructure) {
      const cloudNodes: FolderNode[] = [
        {
          id: 'characters-cloud',
          name: 'Characters',
          path: ['Characters'],
          folderId: cloudFolderStructure.characters.google_drive_folder_id || cloudFolderStructure.characters.dropbox_folder_path,
          storageType: cloudFolderStructure.characters.google_drive_folder_id ? 'google-drive' : 'dropbox',
          provider: cloudFolderStructure.characters.google_drive_folder_id ? 'google-drive' : 'dropbox',
          children: []
        },
        {
          id: 'locations-cloud',
          name: 'Locations',
          path: ['Locations'],
          folderId: cloudFolderStructure.locations.google_drive_folder_id || cloudFolderStructure.locations.dropbox_folder_path,
          storageType: cloudFolderStructure.locations.google_drive_folder_id ? 'google-drive' : 'dropbox',
          provider: cloudFolderStructure.locations.google_drive_folder_id ? 'google-drive' : 'dropbox',
          children: []
        },
        {
          id: 'scenes-cloud',
          name: 'Scenes',
          path: ['Scenes'],
          folderId: cloudFolderStructure.scenes.google_drive_folder_id || cloudFolderStructure.scenes.dropbox_folder_path,
          storageType: cloudFolderStructure.scenes.google_drive_folder_id ? 'google-drive' : 'dropbox',
          provider: cloudFolderStructure.scenes.google_drive_folder_id ? 'google-drive' : 'dropbox',
          children: []
        },
        {
          id: 'audio-cloud',
          name: 'Audio',
          path: ['Audio'],
          folderId: cloudFolderStructure.audio.google_drive_folder_id || cloudFolderStructure.audio.dropbox_folder_path,
          storageType: cloudFolderStructure.audio.google_drive_folder_id ? 'google-drive' : 'dropbox',
          provider: cloudFolderStructure.audio.google_drive_folder_id ? 'google-drive' : 'dropbox',
          children: []
        },
        {
          id: 'compositions-cloud',
          name: 'Compositions',
          path: ['Compositions'],
          folderId: cloudFolderStructure.compositions.google_drive_folder_id || cloudFolderStructure.compositions.dropbox_folder_path,
          storageType: cloudFolderStructure.compositions.google_drive_folder_id ? 'google-drive' : 'dropbox',
          provider: cloudFolderStructure.compositions.google_drive_folder_id ? 'google-drive' : 'dropbox',
          children: []
        }
      ];
      tree[0].children = [...(tree[0].children || []), ...cloudNodes];
    }

    return tree;
  };

  const renderFolderNode = (node: FolderNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFolderId === node.folderId || (node.id === 'root' && !selectedFolderId);
    const hasChildren = node.children && node.children.length > 0;
    const isS3Folder = node.storageType === 's3' && node.folderId;

    return (
      <div key={node.id} className="group">
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
              const storageType = node.storageType === 's3' ? 's3' : 'cloud';
              onFolderSelect(node.folderId || '', node.path, storageType);
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
          {/* Storage type indicator */}
          {node.storageType === 's3' && (
            <HardDrive className="w-3 h-3 text-[#808080]" title="S3 Storage" />
          )}
          {(node.storageType === 'google-drive' || node.storageType === 'dropbox') && (
            <Cloud className="w-3 h-3 text-[#808080]" title="Cloud Storage" />
          )}
          {node.fileCount !== undefined && (
            <span className="text-xs text-[#808080] ml-1">{node.fileCount}</span>
          )}
          {/* Folder actions menu (only for S3 folders) */}
          {isS3Folder && (
            <div onClick={(e) => e.stopPropagation()}>
              <FolderActionsMenu
                folder={{
                  folderId: node.folderId!,
                  userId: '',
                  screenplayId,
                  folderName: node.name,
                  folderPath: node.path,
                  createdAt: '',
                  updatedAt: '',
                }}
                screenplayId={screenplayId}
                onFolderUpdated={() => refetchS3Folders()}
                onFolderDeleted={() => {
                  refetchS3Folders();
                  // If deleted folder was selected, go back to root
                  if (selectedFolderId === node.folderId) {
                    onFolderSelect('', [], 's3');
                  }
                }}
              />
            </div>
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

  const isLoading = s3Loading || cloudLoading;
  const hasError = s3Error;
  const folderTree = buildFolderTree();
  const hasNoFolders = s3FolderTree.length === 0 && !cloudFolderStructure;

  if (isLoading) {
    return (
      <div className="w-64 bg-[#141414] border-r border-[#3F3F46] h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#808080]" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-64 bg-[#141414] border-r border-[#3F3F46] h-full p-4">
        <div className="text-sm text-[#DC143C]">Failed to load folders</div>
        <button
          onClick={() => refetchS3Folders()}
          className="mt-2 text-xs text-[#808080] hover:text-[#FFFFFF]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#141414] border-r border-[#3F3F46] h-full overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-[#3F3F46] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Folders</h3>
        <div className="flex items-center gap-2">
          {!hasNoFolders && (
            <button
              onClick={() => setShowCreateRootModal(true)}
              className="p-1 hover:bg-[#1F1F1F] rounded transition-colors"
              title="Create new folder"
            >
              <Plus className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
            </button>
          )}
          {hasNoFolders && (
            <button
              onClick={handleInitializeFolders}
              disabled={initializeFolders.isPending}
              className="p-1 hover:bg-[#1F1F1F] rounded transition-colors"
              title="Initialize folder structure"
            >
              <Plus className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {folderTree.map(node => renderFolderNode(node))}
      </div>
      {hasNoFolders && (
        <div className="p-4 text-xs text-[#808080] border-t border-[#3F3F46]">
          <p className="mb-2">No folders found. Click the + button to initialize folder structure.</p>
        </div>
      )}

      {/* Create Root Folder Modal */}
      {showCreateRootModal && (
        <CreateFolderModal
          isOpen={showCreateRootModal}
          onClose={() => setShowCreateRootModal(false)}
          screenplayId={screenplayId}
          onSuccess={() => {
            refetchS3Folders();
            setShowCreateRootModal(false);
          }}
        />
      )}
    </div>
  );
}
