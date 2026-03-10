'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getScreenplay, updateScreenplay } from '@/utils/screenplayStorage';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { X, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GENRE_OPTIONS } from '@/utils/genreOptions';

interface ScreenplaySettingsModalProps {
  isOpen: boolean;
  onClose: (updatedData?: { title: string; description?: string; genre?: string }) => void;
  screenplayId?: string; // Optional: allows use without ScreenplayContext (e.g., from dashboard)
}

/**
 * ScreenplaySettingsModal - Edit screenplay metadata (title, description, genre, etc.)
 */
export default function ScreenplaySettingsModal({ isOpen, onClose, screenplayId: propScreenplayId }: ScreenplaySettingsModalProps) {
  const { getToken } = useAuth();
  const screenplay = useScreenplay();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use prop screenplayId if provided, otherwise fall back to context
  const screenplayId = propScreenplayId || screenplay?.screenplayId;
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  useEffect(() => {
    if (isOpen && screenplayId) {
      fetchScreenplayData();
    }
  }, [isOpen, screenplayId]);

  const fetchScreenplayData = async () => {
    if (!screenplayId) return;

    try {
      setIsLoading(true);
      const screenplayData = await getScreenplay(screenplayId, getToken);
      
      if (screenplayData) {
        setTitle(screenplayData.title || '');
        setAuthor(screenplayData.author || '');
        setDescription(screenplayData.description || '');
        setGenre(screenplayData.metadata?.genre || '');
      }
    } catch (error) {
      console.error('[ScreenplaySettingsModal] Failed to fetch screenplay:', error);
      toast.error('Failed to load screenplay data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!screenplayId) {
      toast.error('No screenplay loaded');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      // Fetch current screenplay to preserve existing metadata
      const currentScreenplay = await getScreenplay(screenplayId, getToken);
      
      await updateScreenplay(
        {
          screenplay_id: screenplayId,
          title: title.trim(),
          author: author.trim() || undefined,
          description: description.trim() || undefined,
          metadata: {
            ...(currentScreenplay?.metadata || {}),
            ...(genre.trim() ? { genre: genre.trim() } : {})
          }
        },
        getToken
      );
      
      // 🔥 FIX 3: Add delay for DynamoDB consistency (like Media Library pattern)
      // This ensures the update is fully processed before we dispatch the event
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Screenplay settings updated');
      // Pass updated data to onClose for optimistic UI update
      onClose({
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre.trim() || undefined
      });
      // Trigger a custom event to refresh the title component
      // Dispatch event AFTER backend confirms and delay completes
      window.dispatchEvent(new CustomEvent('screenplayUpdated', {
        detail: { screenplayId, title: title.trim(), author: author.trim() }
      }));
    } catch (error) {
      console.error('[ScreenplaySettingsModal] Failed to update screenplay:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
      <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#3F3F46] bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1F1F1F] border border-[#3F3F46]">
              <Settings className="w-6 h-6 text-[#DC143C]" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#FFFFFF]">Screenplay Settings</h2>
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#DC143C]" />
            </div>
          ) : (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
                  Title <span className="text-[#DC143C]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Amazing Screenplay"
                  className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                  disabled={isSaving}
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
                  Author (Optional)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                  disabled={isSaving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your screenplay..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
                  Genre (Optional)
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#141414] border border-[#3F3F46] rounded-lg text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="">Select a genre...</option>
                  {GENRE_OPTIONS.map((genreOption) => (
                    <option key={genreOption.value} value={genreOption.value}>
                      {genreOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 md:p-5 border-t border-[#3F3F46] bg-[#141414]">
          <button
            onClick={() => onClose()}
            className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors"
            disabled={isSaving || isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !title.trim()}
            className="px-4 py-2.5 bg-[#DC143C] hover:bg-[#B91238] text-[#FFFFFF] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

