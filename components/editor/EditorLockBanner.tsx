/**
 * EditorLockBanner Component
 * Feature 0187: Editor Lock (per-tab / per-device)
 *
 * Displays a warning banner when the editor is locked by another tab (same browser),
 * or an info banner when a collaborator is editing.
 */

'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface EditorLockBannerProps {
  isLocked: boolean; // True if locked by same user in another tab
  isCollaboratorEditing: boolean; // True if different user has lock
  lockedBy: string | null; // Display name of user who has lock
}

export default function EditorLockBanner({
  isLocked,
  isCollaboratorEditing,
  lockedBy
}: EditorLockBannerProps) {
  // Don't render if feature is disabled or no lock state
  if (!isLocked && !isCollaboratorEditing) {
    return null;
  }

  // Warning banner for locked editor (same user, another tab)
  if (isLocked) {
    return (
      <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 flex items-center gap-2 text-yellow-200">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          Another tab is editing. Read-only. Unlocks here in ~5 min when that tab closes.
        </span>
      </div>
    );
  }

  // Info banner for collaborator editing (different user)
  if (isCollaboratorEditing) {
    return (
      <div className="bg-blue-500/20 border-b border-blue-500/30 px-4 py-2 flex items-center gap-2 text-blue-200">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          {lockedBy ? `${lockedBy} is also editing this screenplay` : 'A collaborator is also editing this screenplay'}
        </span>
      </div>
    );
  }

  return null;
}
