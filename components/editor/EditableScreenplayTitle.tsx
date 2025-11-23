'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { updateScreenplay, getScreenplay } from '@/utils/screenplayStorage';
import { useEditor } from '@/contexts/EditorContext';
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
  const { state: editorState, setTitle: setEditorTitle } = useEditor();
  
  // Use title from EditorContext (same pattern as CharacterBoard uses ScreenplayContext)
  // EditorContext already loads and manages the title, so we don't need to fetch independently
  const [title, setTitle] = useState<string>(editorState.title || 'Untitled Screenplay');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with EditorContext title (same pattern as CharacterBoard syncs with ScreenplayContext)
  // This ensures the title stays in sync with EditorContext, which is the source of truth
  useEffect(() => {
    if (editorState.title && editorState.title !== title) {
      console.log('[EditableScreenplayTitle] Title updated from EditorContext:', editorState.title);
      setTitle(editorState.title);
    } else if (!editorState.title && title !== 'Untitled Screenplay') {
      // Only reset if EditorContext truly has no title
      setTitle('Untitled Screenplay');
    }
  }, [editorState.title]); // Only sync when EditorContext title changes
  
  // Listen for screenplay updates from dashboard/modal
  useEffect(() => {
    const handleScreenplayUpdated = async (event?: CustomEvent) => {
      const urlProjectId = searchParams?.get('project');
      if (!urlProjectId) return;
      
      console.log('[EditableScreenplayTitle] Screenplay updated event received, reloading from database');
      
      // 🔥 FIX: Reload screenplay from database to get updated title
      // EditorContext will also reload, but we reload here too to ensure we get the latest data
      try {
        const updatedScreenplay = await getScreenplay(urlProjectId, getToken);
        if (updatedScreenplay && updatedScreenplay.title) {
          console.log('[EditableScreenplayTitle] ✅ Reloaded title from database:', updatedScreenplay.title);
          setTitle(updatedScreenplay.title);
          // Also update EditorContext title to keep them in sync
          setEditorTitle(updatedScreenplay.title);
        }
      } catch (error) {
        console.error('[EditableScreenplayTitle] Failed to reload screenplay:', error);
        // Fallback: sync with EditorContext title if available
        if (editorState.title && editorState.title !== title) {
          setTitle(editorState.title);
        }
      }
    };
    
    window.addEventListener('screenplayUpdated', handleScreenplayUpdated as EventListener);
    return () => {
      window.removeEventListener('screenplayUpdated', handleScreenplayUpdated as EventListener);
    };
  }, [searchParams, getToken, setEditorTitle, editorState.title, title]);

  const handleClick = () => {
    const urlProjectId = searchParams?.get('project');
    if (!urlProjectId) {
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
    if (!urlProjectId) {
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
      // Update in backend
      await updateScreenplay(
        {
          screenplay_id: urlProjectId,
          title: trimmedValue
        },
        getToken
      );
      
      // Update local state
      setTitle(trimmedValue);
      
      // Update EditorContext (same pattern as CharacterBoard updates ScreenplayContext)
      // This ensures the title persists and is available to other components
      setEditorTitle(trimmedValue);
      
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

