'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getScreenplay, updateScreenplay } from '@/utils/screenplayStorage';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { X, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScreenplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ScreenplaySettingsModal - Edit screenplay metadata (title, description, genre, etc.)
 */
export default function ScreenplaySettingsModal({ isOpen, onClose }: ScreenplaySettingsModalProps) {
  const { getToken } = useAuth();
  const screenplay = useScreenplay();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    if (isOpen && screenplay?.screenplayId) {
      fetchScreenplayData();
    }
  }, [isOpen, screenplay?.screenplayId]);

  const fetchScreenplayData = async () => {
    if (!screenplay?.screenplayId) return;

    try {
      setIsLoading(true);
      const screenplayData = await getScreenplay(screenplay.screenplayId, getToken);
      
      if (screenplayData) {
        setTitle(screenplayData.title || '');
        setAuthor(screenplayData.author || '');
      }
    } catch (error) {
      console.error('[ScreenplaySettingsModal] Failed to fetch screenplay:', error);
      toast.error('Failed to load screenplay data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!screenplay?.screenplayId) {
      toast.error('No screenplay loaded');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateScreenplay(
        {
          screenplay_id: screenplay.screenplayId,
          title: title.trim(),
          author: author.trim() || undefined
        },
        getToken
      );
      
      toast.success('Screenplay settings updated');
      onClose();
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

