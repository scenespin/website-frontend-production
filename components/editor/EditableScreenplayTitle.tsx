'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
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
  const screenplay = useScreenplay();
  const [title, setTitle] = useState<string>('Untitled Screenplay');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch screenplay title when screenplayId changes or when updated
  useEffect(() => {
    const fetchTitle = async () => {
      const screenplayId = screenplay?.screenplayId;
      console.log('[EditableScreenplayTitle] Fetching title for screenplay:', screenplayId);
      
      if (!screenplayId) {
        setTitle('Untitled Screenplay');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const screenplayData = await getScreenplay(screenplayId, getToken);
        console.log('[EditableScreenplayTitle] Fetched screenplay data:', screenplayData?.title);
        if (screenplayData?.title) {
          setTitle(screenplayData.title);
        } else {
          setTitle('Untitled Screenplay');
        }
      } catch (error) {
        console.error('[EditableScreenplayTitle] Failed to fetch screenplay:', error);
        setTitle('Untitled Screenplay');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitle();

    // Listen for screenplay updates
    const handleUpdate = () => {
      console.log('[EditableScreenplayTitle] Screenplay updated event received, refetching title');
      fetchTitle();
    };
    window.addEventListener('screenplayUpdated', handleUpdate);
    return () => window.removeEventListener('screenplayUpdated', handleUpdate);
  }, [screenplay?.screenplayId, getToken]); // Depend on screenplay.screenplayId to refetch when it changes

  const handleClick = () => {
    if (!screenplay?.screenplayId) {
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
    if (!screenplay?.screenplayId) {
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
          screenplay_id: screenplay.screenplayId,
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

