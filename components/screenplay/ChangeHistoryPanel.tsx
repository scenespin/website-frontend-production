'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, History, ChevronDown, ChevronUp, Clock, User, FileText, Loader2, Maximize2 } from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getScreenplayChangeHistory, type AuditLogEntry } from '@/utils/auditLogStorage';
import { formatDistanceToNow } from 'date-fns';

interface ChangeHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ChangeHistoryPanel - UI for viewing screenplay change history
 * Visible to all collaborators (anyone with access to screenplay)
 */
export default function ChangeHistoryPanel({ isOpen, onClose }: ChangeHistoryPanelProps) {
  const { getToken } = useAuth();
  const { screenplayId } = useScreenplay();
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set()); // Track which text fields are expanded
  const [limit, setLimit] = useState(50);

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

  // Get display email/name for a user (from enriched audit log entry)
  const getUserDisplay = (entry: AuditLogEntry): string => {
    // Use enriched email/name from backend (similar to cursor positions)
    if (entry.edited_by_email) {
      return entry.edited_by_email;
    }
    if (entry.edited_by_name) {
      return entry.edited_by_name;
    }
    // Fallback to userId if no email/name available
    return entry.edited_by;
  };

  const toggleExpand = (changeId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedEntries(newExpanded);
  };

  const toggleTextExpand = (textId: string) => {
    const newExpanded = new Set(expandedTexts);
    if (newExpanded.has(textId)) {
      newExpanded.delete(textId);
    } else {
      newExpanded.add(textId);
    }
    setExpandedTexts(newExpanded);
  };

  // Filter out entries with no significant field changes
  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      // Keep entries with field changes
      if (entry.field_changes && entry.field_changes.length > 0) {
        return true;
      }
      // Keep delete operations
      if (entry.change_type === 'delete') {
        return true;
      }
      // Filter out entries with no meaningful changes
      return false;
    });
  }, [history]);

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'content': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'title': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'author': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'collaborators': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'delete': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-base-300 text-base-content';
    }
  };

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Change History</h2>
              <p className="text-sm text-base-content/70">
                View all changes made to this screenplay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-base-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-base-content/70">Loading change history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">No change history found</p>
              <p className="text-sm text-base-content/50 mt-2">
                Changes will appear here as you edit the screenplay
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">No significant changes found</p>
              <p className="text-sm text-base-content/50 mt-2">
                Only changes with field modifications are shown
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => {
                const isExpanded = expandedEntries.has(entry.change_id);
                const hasFieldChanges = entry.field_changes && entry.field_changes.length > 0;
                return (
                  <div
                    key={entry.change_id}
                    className="border border-base-300 rounded-lg p-4 hover:bg-base-200/50 transition-colors"
                  >
                    {/* Entry Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getChangeTypeColor(entry.change_type)}`}>
                            {entry.change_type}
                          </span>
                          {entry.version && (
                            <span className="text-xs text-base-content/50">
                              v{entry.version}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-base-content mb-1">
                          {entry.summary}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-base-content/60">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{getUserDisplay(entry)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(entry.edited_at)}</span>
                          </div>
                        </div>
                      </div>
                      {hasFieldChanges && (
                        <button
                          onClick={() => toggleExpand(entry.change_id)}
                          className="p-1 hover:bg-base-300 rounded transition-colors"
                          title={isExpanded ? 'Hide details' : 'Show details'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && hasFieldChanges && (
                      <div className="mt-4 pt-4 border-t border-base-300 space-y-3">
                        <h4 className="text-sm font-semibold text-base-content/70">Field Changes:</h4>
                        {entry.field_changes!.map((change, idx) => {
                          const textId = `${entry.change_id}-${idx}`;
                          const isTextExpanded = expandedTexts.has(textId);
                          const TEXT_PREVIEW_LENGTH = 200;
                          
                          const renderValue = (value: any, isOld: boolean) => {
                            if (value === undefined) return null;
                            
                            const isString = typeof value === 'string';
                            const displayValue = isString ? value : JSON.stringify(value);
                            const isLong = displayValue.length > TEXT_PREVIEW_LENGTH;
                            const preview = isLong ? displayValue.substring(0, TEXT_PREVIEW_LENGTH) : displayValue;
                            const shouldShowExpand = isLong && !isTextExpanded;
                            
                            return (
                              <div>
                                <div className="text-base-content/50 mb-1">{isOld ? 'Old Value:' : 'New Value:'}</div>
                                <div className={`${isOld ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-500/10 text-green-600 dark:text-green-400'} p-2 rounded break-words ${isTextExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
                                  {shouldShowExpand ? (
                                    <>
                                      <div className="mb-2">{preview}...</div>
                                      <button
                                        onClick={() => toggleTextExpand(textId)}
                                        className="text-xs underline hover:no-underline flex items-center gap-1"
                                      >
                                        <Maximize2 className="w-3 h-3" />
                                        View full text ({displayValue.length.toLocaleString()} characters)
                                      </button>
                                    </>
                                  ) : isTextExpanded ? (
                                    <>
                                      <div className="mb-2 whitespace-pre-wrap">{displayValue}</div>
                                      <button
                                        onClick={() => toggleTextExpand(textId)}
                                        className="text-xs underline hover:no-underline"
                                      >
                                        Show less
                                      </button>
                                    </>
                                  ) : (
                                    <div>{displayValue}</div>
                                  )}
                                </div>
                              </div>
                            );
                          };
                          
                          return (
                            <div key={idx} className="bg-base-200 rounded p-3">
                              <div className="text-sm font-medium text-base-content mb-2">
                                {change.field}
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {renderValue(change.old_value, true)}
                                {renderValue(change.new_value, false)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredHistory.length > 0 && (
          <div className="border-t border-base-300 p-4 flex items-center justify-between">
            <div className="text-sm text-base-content/70">
              Showing {filteredHistory.length} change{filteredHistory.length !== 1 ? 's' : ''}
              {history.length > filteredHistory.length && (
                <span className="text-xs text-base-content/50 ml-2">
                  ({history.length - filteredHistory.length} entries with no changes hidden)
                </span>
              )}
            </div>
            <button
              onClick={() => setLimit(limit + 50)}
              className="btn btn-sm btn-ghost"
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

