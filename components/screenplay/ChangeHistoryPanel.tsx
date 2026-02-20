'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, History, Clock, User, FileText, Loader2 } from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getScreenplayChangeHistory, type AuditLogEntry } from '@/utils/auditLogStorage';
import { formatDistanceToNow } from 'date-fns';

interface ChangeHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOrder = 'newest' | 'oldest';

interface ActivitySession {
  id: string;
  editedBy: string;
  editedByName?: string;
  editedByEmail?: string;
  startAt: Date;
  endAt: Date;
  editCount: number;
  summaries: string[];
  changedFields: string[];
  wordDelta: number;
}

const SESSION_GAP_MINUTES = 15;

/**
 * ChangeHistoryPanel - UI for viewing screenplay change history
 * Visible to all collaborators (anyone with access to screenplay)
 */
export default function ChangeHistoryPanel({ isOpen, onClose }: ChangeHistoryPanelProps) {
  const { getToken } = useAuth();
  const { screenplayId } = useScreenplay();
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Load change history when panel opens
  useEffect(() => {
    if (isOpen && screenplayId && getToken) {
      setIsLoading(true);
      getScreenplayChangeHistory(screenplayId, getToken, limit)
        .then((data) => {
          setHistory(data);
        })
        .catch(err => {
          console.error('[ChangeHistoryPanel] Error loading change history:', err);
          toast.error('Failed to load change history');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, screenplayId, getToken, limit]);

  // Get display name/email for a user (from enriched audit log entry)
  // Matches cursor position behavior: prefer name over email
  const getUserDisplay = (entry: AuditLogEntry): string => {
    // Use enriched name/email from backend (same priority as cursor positions)
    // Priority: name > email > userId
    return entry.edited_by_name || entry.edited_by_email || entry.edited_by;
  };

  const parseWordDelta = (summary: string): number => {
    const added = summary.match(/(\d+)\s+words?\s+added/i);
    if (added) return parseInt(added[1], 10);
    const removed = summary.match(/(\d+)\s+words?\s+removed/i);
    if (removed) return -parseInt(removed[1], 10);
    return 0;
  };

  const formatFieldLabel = (field: string): string => {
    const map: Record<string, string> = {
      content: 'Content edited',
      title: 'Title changed',
      author: 'Author changed',
      collaborators: 'Collaborators updated',
      metadata: 'Metadata updated',
      status: 'Status changed',
      relationships: 'Relationships updated',
      github_config: 'GitHub config updated',
      delete: 'Deleted'
    };
    return map[field] || field;
  };

  const sessions = useMemo(() => {
    const relevant = history.filter(entry =>
      (entry.field_changes && entry.field_changes.length > 0) || entry.change_type === 'delete'
    );

    const sorted = [...relevant].sort((a, b) =>
      new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime()
    );

    const grouped: ActivitySession[] = [];
    let activeSession: ActivitySession | null = null;
    let previousEntryTime: Date | null = null;

    for (const entry of sorted) {
      const entryTime = new Date(entry.edited_at);
      const fields = new Set<string>([
        ...(entry.field_changes?.map(change => change.field) || []),
        entry.change_type
      ]);
      const summary = entry.summary?.trim() ? entry.summary : 'Updated screenplay';

      const sameEditor = activeSession && activeSession.editedBy === entry.edited_by;
      const gapMinutes = previousEntryTime
        ? (previousEntryTime.getTime() - entryTime.getTime()) / (1000 * 60)
        : 0;
      const withinSessionGap = gapMinutes <= SESSION_GAP_MINUTES;

      if (!activeSession || !sameEditor || !withinSessionGap) {
        activeSession = {
          id: `session-${entry.change_id}`,
          editedBy: entry.edited_by,
          editedByName: entry.edited_by_name,
          editedByEmail: entry.edited_by_email,
          startAt: entryTime,
          endAt: entryTime,
          editCount: 1,
          summaries: [summary],
          changedFields: Array.from(fields),
          wordDelta: parseWordDelta(summary)
        };
        grouped.push(activeSession);
      } else {
        activeSession.startAt = entryTime;
        activeSession.editCount += 1;
        if (!activeSession.summaries.includes(summary)) {
          activeSession.summaries.push(summary);
        }
        const mergedFields = new Set<string>([...activeSession.changedFields, ...fields]);
        activeSession.changedFields = Array.from(mergedFields);
        activeSession.wordDelta += parseWordDelta(summary);
      }

      previousEntryTime = entryTime;
    }

    if (sortOrder === 'oldest') {
      return [...grouped].reverse();
    }

    return grouped;
  }, [history, sortOrder]);

  const hiddenEntriesCount = history.length - sessions.reduce((sum, session) => sum + session.editCount, 0);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3F3F46] bg-[#141414]">
          <div className="flex items-center gap-3">
            <History className="w-7 h-7 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-white">Editing Activity</h2>
              <p className="text-base text-gray-400">
                See who edited this screenplay and when
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-gray-300">Loading change history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300">No activity found</p>
              <p className="text-sm text-gray-500 mt-2">
                Activity sessions will appear as collaborators edit the screenplay
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300">No trackable activity found</p>
              <p className="text-sm text-gray-500 mt-2">
                Edit activity will appear here after updates are saved
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Sessions are grouped by editor with a {SESSION_GAP_MINUTES}-minute inactivity window.
                </p>
                <div className="inline-flex rounded-lg border border-[#3F3F46] overflow-hidden">
                  <button
                    onClick={() => setSortOrder('newest')}
                    className={`px-3 py-2 text-xs font-medium ${sortOrder === 'newest' ? 'bg-primary text-primary-content' : 'bg-[#141414] text-gray-300 hover:bg-[#1F1F1F]'}`}
                  >
                    Newest first
                  </button>
                  <button
                    onClick={() => setSortOrder('oldest')}
                    className={`px-3 py-2 text-xs font-medium ${sortOrder === 'oldest' ? 'bg-primary text-primary-content' : 'bg-[#141414] text-gray-300 hover:bg-[#1F1F1F]'}`}
                  >
                    Oldest first
                  </button>
                </div>
              </div>

              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-[#3F3F46] rounded-xl p-4 bg-[#141414] hover:bg-[#1F1F1F] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-[#1F1F1F] text-gray-200 border border-[#3F3F46]">
                          {session.editCount} edit{session.editCount !== 1 ? 's' : ''}
                        </span>
                        {session.wordDelta !== 0 && (
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${session.wordDelta > 0 ? 'border border-cinema-blue/20 text-cinema-blue' : 'border border-cinema-red/30 text-cinema-red'}`}>
                            {session.wordDelta > 0 ? `+${session.wordDelta}` : session.wordDelta} words
                          </span>
                        )}
                      </div>

                      <p className="text-base font-semibold text-white mb-2">
                        {session.summaries[0]}
                        {session.summaries.length > 1 && (
                          <span className="text-gray-400"> + {session.summaries.length - 1} more update{session.summaries.length - 1 !== 1 ? 's' : ''}</span>
                        )}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {session.changedFields.slice(0, 5).map((field) => (
                          <span key={field} className="text-xs px-2 py-1 rounded-md border border-[#3F3F46] text-gray-300 bg-[#0A0A0A]">
                            {formatFieldLabel(field)}
                          </span>
                        ))}
                        {session.changedFields.length > 5 && (
                          <span className="text-xs px-2 py-1 rounded-md border border-[#3F3F46] text-gray-400">
                            +{session.changedFields.length - 5} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{session.editedByName || session.editedByEmail || session.editedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDate(session.endAt.toISOString())}
                            {session.startAt.getTime() !== session.endAt.getTime() && (
                              <> · {session.startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {session.endAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="border-t border-[#3F3F46] p-4 flex items-center justify-between bg-[#141414]">
            <div className="text-sm text-gray-300">
              Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              {hiddenEntriesCount > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({hiddenEntriesCount} entries with no changes hidden)
                </span>
              )}
            </div>
            <button
              onClick={() => setLimit(limit + 50)}
              className="btn btn-sm bg-[#1F1F1F] text-gray-200 border border-[#3F3F46] hover:bg-[#2A2A2A]"
              disabled={isLoading}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

