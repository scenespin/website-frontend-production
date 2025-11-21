'use client';

/**
 * Folder Actions Dropdown Component
 * 
 * Dropdown menu for folder operations (rename, delete, create subfolder).
 * Feature 0128: S3 Folder Support
 */

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, FolderPlus, MoreVertical } from 'lucide-react';
import { CreateFolderModal } from './CreateFolderModal';
import { RenameFolderModal } from './RenameFolderModal';
import { DeleteFolderModal } from './DeleteFolderModal';
import { MediaFolder } from '@/types/media';

interface FolderActionsMenuProps {
  folder: MediaFolder;
  screenplayId: string;
  onFolderUpdated?: () => void;
  onFolderDeleted?: () => void;
}

export function FolderActionsMenu({
  folder,
  screenplayId,
  onFolderUpdated,
  onFolderDeleted,
}: FolderActionsMenuProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 hover:bg-[#1F1F1F] rounded opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Actions for ${folder.folderName}`}
          >
            <MoreVertical className="w-4 h-4 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#141414] border border-[#3F3F46]">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateModal(true);
            }}
            className="text-[#FFFFFF] hover:bg-[#1F1F1F] cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 mr-2 text-[#808080]" />
            Create Subfolder
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowRenameModal(true);
            }}
            className="text-[#FFFFFF] hover:bg-[#1F1F1F] cursor-pointer"
          >
            <Edit className="w-4 h-4 mr-2 text-[#808080]" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="text-[#DC143C] hover:bg-[#DC143C]/10 cursor-pointer"
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

