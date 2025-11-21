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
  const deleteFolder = useDeleteFolder(screenplayId);
  
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
      await deleteFolder.mutateAsync(folder.folderId);
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
            <div className="mb-4 p-3 bg-[#DC143C]/20 border border-[#DC143C]/50 rounded-lg">
              <p className="text-sm text-[#DC143C] font-medium">
                ⚠️ This folder contains {childFolders.length} subfolder{childFolders.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#808080] mt-1">
                You must delete or move all subfolders before deleting this folder.
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-[#B3B3B3] mb-4">
              This action cannot be undone. All files in this folder will remain, but the folder structure will be removed.
            </p>
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
              disabled={deleteFolder.isPending || hasChildren}
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
              disabled={deleteFolder.isPending || hasChildren || confirmText !== folder.folderName}
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

