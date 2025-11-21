'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { getScreenplay, updateScreenplay } from '@/utils/screenplayStorage';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditableScreenplayTitleProps {
  className?: string;
}

/**
 * EditableScreenplayTitle - Click-to-edit screenplay title (like Google Drive)
 * Shows screenplay name and allows inline editing
 */
export default function EditableScreenplayTitle({ className = '' }: EditableScreenplayTitleProps) {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const screenplay = useScreenplay();
  const [title, setTitle] = useState<string>('Untitled Screenplay');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScreenplayIdRef = useRef<string | null>(null); // Track last valid screenplayId to prevent unnecessary resets

  // Fetch screenplay title when screenplayId changes or when updated
  useEffect(() => {
    const fetchTitle = async () => {
      // Priority: URL param > ScreenplayContext
      const urlProjectId = searchParams?.get('project');
      const screenplayId = urlProjectId || screenplay?.screenplayId;
      console.log('[EditableScreenplayTitle] Fetching title for screenplay:', screenplayId, '(from URL:', urlProjectId, ', from context:', screenplay?.screenplayId, ')');
      
      // If we have a valid title and the screenplayId hasn't actually changed, don't reset
      // This prevents the title from resetting when the context temporarily becomes undefined during navigation
      if (!screenplayId) {
        // Only reset to "Untitled" if we don't have a last known screenplayId
        // This means we're truly on a new page without a screenplay, not just a temporary context reset
        if (!lastScreenplayIdRef.current) {
          setTitle('Untitled Screenplay');
          setIsLoading(false);
        } else {
          // Keep the current title - the screenplayId will come back
          // This prevents the title from resetting during temporary context changes
          console.log('[EditableScreenplayTitle] ScreenplayId temporarily unavailable, keeping current title');
          setIsLoading(false);
        }
        return;
      }

      // If the screenplayId hasn't changed, don't refetch (unless we're explicitly updating)
      // This prevents unnecessary API calls and title resets
      if (screenplayId === lastScreenplayIdRef.current) {
        console.log('[EditableScreenplayTitle] ScreenplayId unchanged, skipping refetch');
        setIsLoading(false);
        return;
      }

      // Update the ref to track this screenplayId
      lastScreenplayIdRef.current = screenplayId;

      try {
        setIsLoading(true);
        const screenplayData = await getScreenplay(screenplayId, getToken);
        console.log('[EditableScreenplayTitle] Fetched screenplay data:', screenplayData?.title);
        if (screenplayData?.title) {
          setTitle(screenplayData.title);
        } else {
          // Only set to "Untitled" if we truly don't have a title from the API
          setTitle('Untitled Screenplay');
        }
      } catch (error) {
        console.error('[EditableScreenplayTitle] Failed to fetch screenplay:', error);
        // Don't reset the title on error - keep what we have if it's valid
        // Only reset if we don't have a valid title yet
        if (title === 'Untitled Screenplay' || !lastScreenplayIdRef.current) {
          // Keep as is or set to Untitled if we truly don't have one
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitle();

    // Listen for screenplay updates
    const handleUpdate = () => {
      console.log('[EditableScreenplayTitle] Screenplay updated event received, refetching title');
      // Force refetch on explicit update events
      lastScreenplayIdRef.current = null;
      fetchTitle();
    };
    window.addEventListener('screenplayUpdated', handleUpdate);
    return () => window.removeEventListener('screenplayUpdated', handleUpdate);
  }, [searchParams, screenplay?.screenplayId, getToken]); // Depend on URL params and screenplay.screenplayId to refetch when it changes

  const handleClick = () => {
    const urlProjectId = searchParams?.get('project');
    const screenplayId = urlProjectId || screenplay?.screenplayId;
    if (!screenplayId) {
      toast.error('No screenplay loaded');
      return;
    }
    setEditValue(title);
    setIsEditing(true);
    // Focus input after state update
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleSave = async () => {
    const urlProjectId = searchParams?.get('project');
    const screenplayId = urlProjectId || screenplay?.screenplayId;
    if (!screenplayId) {
      toast.error('No screenplay loaded');
      setIsEditing(false);
      return;
    }

    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      toast.error('Title cannot be empty');
      return;
    }

    if (trimmedValue === title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateScreenplay(
        {
          screenplay_id: screenplayId,
          title: trimmedValue
        },
        getToken
      );
      
      setTitle(trimmedValue);
      setIsEditing(false);
      toast.success('Screenplay title updated');
      // Notify other components of the update
      window.dispatchEvent(new CustomEvent('screenplayUpdated'));
    } catch (error) {
      console.error('[EditableScreenplayTitle] Failed to update title:', error);
      toast.error('Failed to update title. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-base-content/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="px-2 py-1 bg-base-100 border border-primary rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
            disabled={isSaving}
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 hover:bg-base-300 rounded transition-colors"
            title="Save (Enter)"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Check className="w-4 h-4 text-success" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 hover:bg-base-300 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-2 py-1 hover:bg-base-300 rounded transition-colors group"
        title="Click to edit title"
      >
        <span className="text-sm font-semibold text-base-content">{title}</span>
        <Pencil className="w-3 h-3 text-base-content/40 group-hover:text-base-content/70 transition-colors" />
      </button>
    </div>
  );
}

