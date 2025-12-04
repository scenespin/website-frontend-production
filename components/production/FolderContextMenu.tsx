'use client';

/**
 * Folder Actions Dropdown Component
 * 
 * Dropdown menu for folder operations (rename, delete, create subfolder).
 * Feature 0128: S3 Folder Support
 */

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, FolderPlus, MoreVertical, Cloud } from 'lucide-react';
import { CreateFolderModal } from './CreateFolderModal';
import { RenameFolderModal } from './RenameFolderModal';
import { DeleteFolderModal } from './DeleteFolderModal';
import { MediaFolder } from '@/types/media';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useStorageConnectionsQuery } from '@/hooks/useMediaLibrary';
import { CloudStorageConnection } from '@/types/media';

interface FolderActionsMenuProps {
  folder: MediaFolder;
  screenplayId: string;
  onFolderUpdated?: () => void;
  onFolderDeleted?: () => void;
  onFolderSynced?: () => void;
}

export function FolderActionsMenu({
  folder,
  screenplayId,
  onFolderUpdated,
  onFolderDeleted,
  onFolderSynced,
}: FolderActionsMenuProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { getToken } = useAuth();
  const { data: cloudConnections = [] } = useStorageConnectionsQuery();
  const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
  
  const hasConnectedProviders = (cloudConnections as CloudStorageConnection[]).some(
    c => c.connected && (c.provider === 'google-drive' || c.provider === 'dropbox')
  );
  
  const handleSyncFolder = async () => {
    if (!screenplayId) {
      toast.error('Screenplay ID required');
      return;
    }

    const activeConnection = (cloudConnections as CloudStorageConnection[]).find(
      c => (c.connected || c.status === 'active') && (c.provider === 'google-drive' || c.provider === 'dropbox')
    );

    if (!activeConnection) {
      toast.error('No cloud storage connection found. Please connect Google Drive or Dropbox first.');
      return;
    }

    setIsSyncing(true);
    setDropdownOpen(false);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${BACKEND_API_URL}/api/storage/sync-folder-to-cloud`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenplayId,
          folderId: folder.folderId,
          provider: activeConnection.provider
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to sync folder');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully synced ${result.syncedFiles} file${result.syncedFiles === 1 ? '' : 's'} from folder to cloud storage`, {
          description: result.failedFiles > 0 
            ? `${result.failedFiles} file${result.failedFiles === 1 ? '' : 's'} failed to sync`
            : undefined
        });
        onFolderSynced?.();
      } else {
        toast.error(`Sync completed with errors: ${result.failedFiles} file${result.failedFiles === 1 ? '' : 's'} failed`, {
          description: result.errors.length > 0 ? result.errors[0].error : undefined
        });
      }

    } catch (error: any) {
      console.error('[FolderActionsMenu] Sync folder error:', error);
      toast.error(`Failed to sync folder: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Close dropdown when any modal opens - use immediate effect
  useEffect(() => {
    if (showCreateModal || showRenameModal || showDeleteModal) {
      // Immediately close dropdown
      setDropdownOpen(false);
    }
  }, [showCreateModal, showRenameModal, showDeleteModal]);

  // Also close dropdown when clicking menu items (before modal opens)
  const handleMenuItemClick = (modalSetter: () => void) => {
    setDropdownOpen(false);
    // Small delay to ensure dropdown closes before modal opens
    setTimeout(() => {
      modalSetter();
    }, 50);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 hover:bg-[#1F1F1F] rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Actions for ${folder.folderName}`}
          >
            <MoreVertical className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuItemClick(() => setShowCreateModal(true));
            }}
            className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
          >
            <FolderPlus className="w-4 h-4 mr-2 text-[#808080]" />
            Create Subfolder
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuItemClick(() => setShowRenameModal(true));
            }}
            className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
          >
            <Edit className="w-4 h-4 mr-2 text-[#808080]" />
            Rename
          </DropdownMenuItem>
          {/* 🔥 NEW: Sync to Cloud option - only show if cloud storage is connected */}
          {hasConnectedProviders && (
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation();
                setDropdownOpen(false);
                await handleSyncFolder();
              }}
              disabled={isSyncing}
              className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] cursor-pointer focus:bg-[#8B5CF6]/10 focus:text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cloud className="w-4 h-4 mr-2" />
              {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuItemClick(() => setShowDeleteModal(true));
            }}
            className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      {showCreateModal && (
        <CreateFolderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          screenplayId={screenplayId}
          parentFolderId={folder.folderId}
          parentFolderPath={folder.folderPath}
          onSuccess={() => {
            onFolderUpdated?.();
            setShowCreateModal(false);
          }}
        />
      )}

      {showRenameModal && (
        <RenameFolderModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          folder={folder}
          screenplayId={screenplayId}
          onSuccess={() => {
            onFolderUpdated?.();
            setShowRenameModal(false);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteFolderModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          folder={folder}
          screenplayId={screenplayId}
          onSuccess={() => {
            onFolderDeleted?.();
            setShowDeleteModal(false);
          }}
        />
      )}
    </>
  );
}

