'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getScreenplay, updateScreenplay } from '@/utils/screenplayStorage';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { X, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
      
      toast.success('Screenplay settings updated');
      // Pass updated data to onClose for optimistic UI update
      onClose({
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre.trim() || undefined
      });
      // Trigger a custom event to refresh the title component
      window.dispatchEvent(new CustomEvent('screenplayUpdated'));
    } catch (error) {
      console.error('[ScreenplaySettingsModal] Failed to update screenplay:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DC143C]/10 rounded-lg">
              <Settings className="w-6 h-6 text-[#DC143C]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Screenplay Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#DC143C]" />
            </div>
          ) : (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title <span className="text-[#DC143C]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Amazing Screenplay"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                  disabled={isSaving}
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Author (Optional)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                  disabled={isSaving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your screenplay..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Genre (Optional)
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="">Select a genre...</option>
                  <option value="action">Action</option>
                  <option value="comedy">Comedy</option>
                  <option value="drama">Drama</option>
                  <option value="horror">Horror</option>
                  <option value="sci-fi">Sci-Fi</option>
                  <option value="thriller">Thriller</option>
                  <option value="romance">Romance</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="mystery">Mystery</option>
                  <option value="documentary">Documentary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            disabled={isSaving || isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !title.trim()}
            className="px-5 py-2.5 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

