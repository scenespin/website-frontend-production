'use client';

/**
 * Create Folder Modal Component
 * 
 * Modal for creating new folders in the Media Library.
 * Feature 0128: S3 Folder Support
 */

import React, { useState, useEffect } from 'react';
import { X, Folder, Loader2 } from 'lucide-react';
import { useCreateFolder, useMediaFolders } from '@/hooks/useMediaLibrary';
import { MediaFolder } from '@/types/media';
import { toast } from 'sonner';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenplayId: string;
  parentFolderId?: string;
  parentFolderPath?: string[];
  onSuccess?: (folder: MediaFolder) => void;
}

export function CreateFolderModal({
  isOpen,
  onClose,
  screenplayId,
  parentFolderId,
  parentFolderPath = [],
  onSuccess,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(parentFolderId);
  const [availableFolders, setAvailableFolders] = useState<MediaFolder[]>([]);

  const createFolder = useCreateFolder(screenplayId);
  const { data: rootFolders = [] } = useMediaFolders(screenplayId, undefined, isOpen);

  // Load available parent folders when modal opens
  useEffect(() => {
    if (isOpen) {
      // Get all folders for parent selection
      const loadFolders = async () => {
        try {
          // For now, we'll use root folders - can be enhanced to show full tree
          setAvailableFolders(rootFolders);
        } catch (error) {
          console.error('[CreateFolderModal] Failed to load folders:', error);
        }
      };
      loadFolders();
    }
  }, [isOpen, rootFolders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const folder = await createFolder.mutateAsync({
        screenplayId,
        folderName: folderName.trim(),
        parentFolderId: selectedParentId,
      });

      toast.success(`Folder "${folder.folderName}" created successfully`);
      setFolderName('');
      onSuccess?.(folder);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      toast.error(errorMessage);
      console.error('[CreateFolderModal] Create folder error:', error);
    }
  };

  const handleClose = () => {
    if (!createFolder.isPending) {
      setFolderName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
            <h3 className="text-lg font-bold text-[#FFFFFF]">Create New Folder</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={createFolder.isPending}
            className="p-1 hover:bg-[#1F1F1F] rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5">
          {/* Parent Folder Selection */}
          {parentFolderId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                Parent Folder
              </label>
              <div className="text-sm text-[#808080] bg-[#141414] p-3 rounded-lg border border-[#3F3F46]">
                {parentFolderPath.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {parentFolderPath.map((segment, index) => (
                      <React.Fragment key={index}>
                        <span>{segment}</span>
                        {index < parentFolderPath.length - 1 && (
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
          )}

          {/* Folder Name Input */}
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-[#FFFFFF] mb-2">
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              disabled={createFolder.isPending}
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
              disabled={createFolder.isPending}
              className="px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#141414] text-[#FFFFFF] hover:bg-[#1F1F1F] hover:border-[#DC143C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createFolder.isPending || !folderName.trim()}
              className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createFolder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

