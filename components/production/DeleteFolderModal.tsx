'use client';

/**
 * Delete Folder Modal Component
 * 
 * Modal for deleting folders in the Media Library.
 * Feature 0128: S3 Folder Support
 */

import React, { useState } from 'react';
import { X, Folder, Loader2, AlertTriangle } from 'lucide-react';
import { useDeleteFolder, useMediaFolders } from '@/hooks/useMediaLibrary';
import { MediaFolder } from '@/types/media';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: MediaFolder;
  screenplayId: string;
  onSuccess?: () => void;
}

export function DeleteFolderModal({
  isOpen,
  onClose,
  folder,
  screenplayId,
  onSuccess,
}: DeleteFolderModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [moveFilesToParent, setMoveFilesToParent] = useState(true); // Default: move files to parent
  const deleteFolder = useDeleteFolder(screenplayId);
  const { getToken } = useAuth();
  
  // Check if folder has children
  const { data: childFolders = [] } = useMediaFolders(screenplayId, folder.folderId, isOpen);
  const hasChildren = childFolders.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText !== folder.folderName) {
      toast.error('Folder name does not match');
      return;
    }

    try {
      // Recursively delete child folders first, then parent
      const deleteFolderRecursively = async (folderId: string): Promise<void> => {
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        
        // Get child folders
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Not authenticated');
        
        const childFoldersResponse = await fetch(
          `${BACKEND_API_URL}/api/media/folders?screenplayId=${encodeURIComponent(screenplayId)}&parentFolderId=${encodeURIComponent(folderId)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (childFoldersResponse.ok) {
          const childFoldersData = await childFoldersResponse.json();
          const childFolders = childFoldersData.folders || [];
          
          // Recursively delete all child folders first (depth-first)
          for (const childFolder of childFolders) {
            await deleteFolderRecursively(childFolder.folderId);
          }
        }
        
        // Now delete the parent folder
        await deleteFolder.mutateAsync({ folderId, moveFilesToParent });
      };
      
      await deleteFolderRecursively(folder.folderId);
      toast.success(`Folder "${folder.folderName}" deleted successfully`);
      setConfirmText('');
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete folder';
      toast.error(errorMessage);
      console.error('[DeleteFolderModal] Delete folder error:', error);
    }
  };

  const handleClose = () => {
    if (!deleteFolder.isPending) {
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#0A0A0A] rounded-lg border border-[#3F3F46] max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#141414] p-4 md:p-5 border-b border-[#3F3F46] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DC143C]" />
            <h3 className="text-lg font-bold text-[#FFFFFF]">Delete Folder</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={deleteFolder.isPending}
            className="p-1 hover:bg-[#1F1F1F] rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5">
          {/* Warning Messages */}
          {hasChildren && (
            <div className="mb-4 p-3 bg-[#FFA500]/20 border border-[#FFA500]/50 rounded-lg">
              <p className="text-sm text-[#FFA500] font-medium">
                ⚠️ This folder contains {childFolders.length} subfolder{childFolders.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#808080] mt-1">
                All subfolders and their contents will also be deleted. This cannot be undone.
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-[#B3B3B3] mb-4">
              This action cannot be undone. Choose what to do with files in this folder:
            </p>
            
            {/* Phase 2: File handling option */}
            <div className="mb-4 p-3 bg-[#141414] border border-[#3F3F46] rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="fileHandling"
                  checked={moveFilesToParent}
                  onChange={() => setMoveFilesToParent(true)}
                  className="mt-1 w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#FFFFFF]">Move files to parent folder</div>
                  <div className="text-xs text-[#808080] mt-1">
                    Files will be moved to the parent folder. Recommended option.
                  </div>
                </div>
              </label>
            </div>
            <div className="mb-4 p-3 bg-[#141414] border border-[#3F3F46] rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="fileHandling"
                  checked={!moveFilesToParent}
                  onChange={() => setMoveFilesToParent(false)}
                  className="mt-1 w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#FFFFFF]">Delete all files</div>
                  <div className="text-xs text-[#808080] mt-1">
                    ⚠️ All files in this folder will be permanently deleted. This cannot be undone.
                  </div>
                </div>
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                Folder Path
              </label>
              <div className="text-sm text-[#808080] bg-[#141414] p-3 rounded-lg border border-[#3F3F46]">
                {folder.folderPath.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {folder.folderPath.map((segment, index) => (
                      <React.Fragment key={index}>
                        <span>{segment}</span>
                        {index < folder.folderPath.length - 1 && (
                          <span className="text-[#3F3F46]">/</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span>Root</span>
                )}
              </div>
            </div>
            <label htmlFor="confirmText" className="block text-sm font-medium text-[#FFFFFF] mb-2">
              Type <span className="font-mono text-[#DC143C]">{folder.folderName}</span> to confirm
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={folder.folderName}
              className="w-full px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              disabled={deleteFolder.isPending}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={deleteFolder.isPending}
              className="px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteFolder.isPending || confirmText !== folder.folderName}
              className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteFolder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Delete Folder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

