'use client';

/**
 * Rename Folder Modal Component
 * 
 * Modal for renaming folders in the Media Library.
 * Feature 0128: S3 Folder Support
 */

import React, { useState, useEffect } from 'react';
import { X, Folder, Loader2 } from 'lucide-react';
import { useRenameFolder } from '@/hooks/useMediaLibrary';
import { MediaFolder } from '@/types/media';
import { toast } from 'sonner';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: MediaFolder;
  screenplayId: string;
  onSuccess?: (folder: MediaFolder) => void;
}

export function RenameFolderModal({
  isOpen,
  onClose,
  folder,
  screenplayId,
  onSuccess,
}: RenameFolderModalProps) {
  const [folderName, setFolderName] = useState(folder.folderName);

  const renameFolder = useRenameFolder(screenplayId);

  // Reset folder name when modal opens or folder changes
  useEffect(() => {
    if (isOpen) {
      setFolderName(folder.folderName);
    }
  }, [isOpen, folder.folderName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    if (folderName.trim() === folder.folderName) {
      // No change
      onClose();
      return;
    }

    try {
      const updatedFolder = await renameFolder.mutateAsync({
        folderId: folder.folderId,
        folderName: folderName.trim(),
      });

      toast.success(`Folder renamed to "${updatedFolder.folderName}"`);
      onSuccess?.(updatedFolder);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename folder';
      toast.error(errorMessage);
      console.error('[RenameFolderModal] Rename folder error:', error);
    }
  };

  const handleClose = () => {
    if (!renameFolder.isPending) {
      setFolderName(folder.folderName);
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
            <Folder className="w-5 h-5 text-[#DC143C]" />
            <h3 className="text-lg font-bold text-[#FFFFFF]">Rename Folder</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={renameFolder.isPending}
            className="p-1 hover:bg-[#1F1F1F] rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5">
          {/* Current Path */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
              Current Path
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

          {/* Folder Name Input */}
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-[#FFFFFF] mb-2">
              New Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              disabled={renameFolder.isPending}
              autoFocus
              maxLength={100}
            />
            <p className="mt-1 text-xs text-[#808080]">
              Special characters will be removed, spaces will be replaced with underscores
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={renameFolder.isPending}
              className="px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={renameFolder.isPending || !folderName.trim() || folderName.trim() === folder.folderName}
              className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {renameFolder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                'Rename Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

