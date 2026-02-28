'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getScreenplay, updateScreenplay } from '@/utils/screenplayStorage';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useStorageConnections } from '@/hooks/useStorageConnections';
import { useMediaCloudSyncStatuses } from '@/hooks/useMediaLibrary';
import { X, Settings, Loader2, Cloud, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
  const [cloudStorageProvider, setCloudStorageProvider] = useState<'google-drive' | 'dropbox' | null>(null);
  const [deleteFromCloudWhenDeletingInApp, setDeleteFromCloudWhenDeletingInApp] = useState(true);
  const [isSyncingBacklog, setIsSyncingBacklog] = useState(false);
  
  // Check storage connections
  const { googleDrive, dropbox, isLoading: connectionsLoading } = useStorageConnections();
  const { data: cloudSyncStatuses = [], refetch: refetchCloudSyncStatuses } = useMediaCloudSyncStatuses(screenplayId || '', isOpen && !!screenplayId);
  const cloudSyncSummary = cloudSyncStatuses.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.cloudSyncStatus === 'synced') acc.synced += 1;
      if (item.cloudSyncStatus === 'failed') acc.failed += 1;
      if (item.cloudSyncStatus === 'syncing') acc.syncing += 1;
      if (item.cloudSyncStatus === 'pending' || item.cloudSyncStatus === 'skipped') {
        acc.pending += 1;
        const syncEligible = item.cloudSyncEligible ?? (
          typeof item.s3Key === 'string' &&
          (item.s3Key.startsWith('temp/') || item.s3Key.startsWith('permanent/'))
        );
        if (syncEligible) {
          acc.pendingSyncable += 1;
        } else {
          acc.pendingNonSyncable += 1;
        }
      }
      return acc;
    },
    { total: 0, synced: 0, failed: 0, syncing: 0, pending: 0, pendingSyncable: 0, pendingNonSyncable: 0 }
  );

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
        setCloudStorageProvider(screenplayData.cloudStorageProvider || null);
      }

      const token = await getToken({ template: 'wryda-backend' });
      if (token) {
        const accountResponse = await fetch('/api/account/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (accountResponse.ok) {
          const accountPayload = await accountResponse.json();
          const profile = accountPayload?.data ?? accountPayload;
          const pref = profile?.delete_from_cloud_when_deleting_in_app;
          if (typeof pref === 'boolean') {
            setDeleteFromCloudWhenDeletingInApp(pref);
          }
        }
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
          },
          cloudStorageProvider: cloudStorageProvider || undefined
        },
        getToken
      );

      const token = await getToken({ template: 'wryda-backend' });
      if (token) {
        const settingsResponse = await fetch('/api/account/settings', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delete_from_cloud_when_deleting_in_app: deleteFromCloudWhenDeletingInApp,
          }),
        });
        if (!settingsResponse.ok) {
          throw new Error(`Failed to update cloud delete preference (${settingsResponse.status})`);
        }
      }
      
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

  const handleSyncAllPendingNow = async () => {
    if (!screenplayId) {
      toast.error('No screenplay loaded');
      return;
    }

    setIsSyncingBacklog(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      let totalProcessed = 0;
      let totalSynced = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      let hasMore = true;
      let rounds = 0;

      while (hasMore && rounds < 10) {
        rounds += 1;
        const response = await fetch('/api/media/retry-cloud-sync-all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            screenplayId,
            limit: 100,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || `Cloud sync backlog run failed (${response.status})`);
        }

        const payload = await response.json();
        totalProcessed += Number(payload.processed || 0);
        totalSynced += Number(payload.synced || 0);
        totalFailed += Number(payload.failed || 0);
        totalSkipped += Number(payload.skipped || 0);
        hasMore = Boolean(payload.hasMore) && Number(payload.processed || 0) > 0;
      }

      await Promise.all([
        refetchCloudSyncStatuses(),
      ]);

      toast.success('Cloud sync backlog run completed', {
        description: `Processed ${totalProcessed} files • Synced ${totalSynced} • Failed ${totalFailed} • Skipped ${totalSkipped}`,
      });
    } catch (error: any) {
      console.error('[ScreenplaySettingsModal] Sync all pending failed:', error);
      toast.error(`Failed to sync pending files: ${error.message}`);
    } finally {
      setIsSyncingBacklog(false);
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

              {/* Cloud Storage Provider */}
              <div>
                <label className="block text-sm font-medium text-[#E4E4E7] mb-2">
                  <Cloud className="w-4 h-4 inline mr-2" />
                  Cloud Storage Auto-Sync (Optional)
                </label>
                <p className="text-xs text-[#A1A1AA] mb-3">
                  Choose one provider per screenplay. Each screenplay can use a different provider, but all files in this screenplay will use the same provider.
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-[#3F3F46] bg-[#141414] hover:bg-[#1F1F1F] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="cloudProvider"
                      value=""
                      checked={cloudStorageProvider === null}
                      onChange={() => setCloudStorageProvider(null)}
                      className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C]"
                      disabled={isSaving}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#FFFFFF]">None (Manual Sync)</div>
                      <div className="text-xs text-[#808080]">You&apos;ll choose storage location each time</div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-lg border ${
                    cloudStorageProvider === 'google-drive' 
                      ? 'border-[#DC143C] bg-[#DC143C]/10' 
                      : 'border-[#3F3F46] bg-[#141414] hover:bg-[#1F1F1F]'
                  } cursor-pointer transition-colors ${!googleDrive ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="cloudProvider"
                      value="google-drive"
                      checked={cloudStorageProvider === 'google-drive'}
                      onChange={() => setCloudStorageProvider('google-drive')}
                      className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C]"
                      disabled={isSaving || !googleDrive}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#FFFFFF] flex items-center gap-2">
                        Google Drive
                        {!googleDrive && (
                          <span className="text-xs text-amber-400 font-normal">(Not connected)</span>
                        )}
                      </div>
                      <div className="text-xs text-[#808080]">
                        Files automatically sync to Google Drive
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-lg border ${
                    cloudStorageProvider === 'dropbox' 
                      ? 'border-[#DC143C] bg-[#DC143C]/10' 
                      : 'border-[#3F3F46] bg-[#141414] hover:bg-[#1F1F1F]'
                  } cursor-pointer transition-colors ${!dropbox ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="cloudProvider"
                      value="dropbox"
                      checked={cloudStorageProvider === 'dropbox'}
                      onChange={() => setCloudStorageProvider('dropbox')}
                      className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C]"
                      disabled={isSaving || !dropbox}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#FFFFFF] flex items-center gap-2">
                        Dropbox
                        {!dropbox && (
                          <span className="text-xs text-amber-400 font-normal">(Not connected)</span>
                        )}
                      </div>
                      <div className="text-xs text-[#808080]">
                        Files automatically sync to Dropbox
                      </div>
                    </div>
                  </label>
                </div>
                {(!googleDrive || !dropbox) && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-300 mb-2">
                      {!googleDrive && !dropbox 
                        ? 'No cloud storage providers connected. Connect a provider in the Media Library to enable auto-sync.'
                        : !googleDrive 
                        ? 'Google Drive is not connected. Connect it in the Media Library to enable auto-sync.'
                        : 'Dropbox is not connected. Connect it in the Media Library to enable auto-sync.'}
                    </p>
                    <Link
                      href={`/storage?project=${screenplayId}`}
                      onClick={() => onClose()}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-medium transition-colors"
                    >
                      Go to Media Library
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                <p className="text-xs text-[#808080] mt-2">
                  When enabled, files will automatically upload to your cloud storage using the screenplay folder structure
                </p>
                <div className="mt-3 p-3 rounded-lg border border-[#3F3F46] bg-[#141414] space-y-2">
                  <label className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[#E4E4E7]">Delete from cloud when deleting in app</div>
                      <div className="text-xs text-[#A1A1AA]">If disabled, app deletes keep cloud copies.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={deleteFromCloudWhenDeletingInApp}
                      onChange={(e) => setDeleteFromCloudWhenDeletingInApp(e.target.checked)}
                      disabled={isSaving}
                      className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] bg-[#141414] border-[#3F3F46] rounded"
                    />
                  </label>
                </div>
                <div className="mt-3 p-3 rounded-lg border border-[#3F3F46] bg-[#141414]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-xs font-semibold text-[#E4E4E7]">Cloud Sync Summary</div>
                    <button
                      type="button"
                      onClick={handleSyncAllPendingNow}
                      disabled={isSaving || isLoading || isSyncingBacklog || cloudSyncSummary.pendingSyncable === 0}
                      className="text-xs px-2 py-1 rounded bg-[#1F1F1F] border border-[#3F3F46] text-[#E4E4E7] hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncingBacklog ? 'Syncing...' : 'Sync all pending now'}
                    </button>
                  </div>
                  <div className="text-xs text-[#B3B3B3]">
                    Synced: {cloudSyncSummary.synced} / {cloudSyncSummary.total}
                    {' • '}Syncing: {cloudSyncSummary.syncing}
                    {' • '}Pending: {cloudSyncSummary.pending}
                    {' • '}Pending (syncable): {cloudSyncSummary.pendingSyncable}
                    {' • '}Pending (non-syncable): {cloudSyncSummary.pendingNonSyncable}
                    {' • '}Failed: {cloudSyncSummary.failed}
                  </div>
                </div>
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

