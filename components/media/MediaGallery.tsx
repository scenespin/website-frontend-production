'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Video, Download, Trash2, Search, Filter, Grid3x3, List, Play, Film, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
  createdAt: string;
  tags?: string[];
  entityId?: string; // Linked to character, location, or scene
  entityType?: 'character' | 'location' | 'scene';
}

interface MediaGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (item: MediaItem) => void;
  onAddToTimeline?: (item: MediaItem) => void;
  onAddToComposition?: (item: MediaItem) => void;
}

interface ContextMenu {
  x: number;
  y: number;
  item: MediaItem;
}

export function MediaGallery({ isOpen, onClose, onSelect, onAddToTimeline, onAddToComposition }: MediaGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMediaItems();
    }
  }, [isOpen]);

  useEffect(() => {
    filterMedia();
  }, [searchQuery, filterType, mediaItems]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const loadMediaItems = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage for now (could be from S3, Google Drive, etc.)
      const stored = localStorage.getItem('mediaGallery');
      if (stored) {
        const items = JSON.parse(stored);
        setMediaItems(items);
      }
    } catch (error) {
      console.error('[MediaGallery] Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = [...mediaItems];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredItems(filtered);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this media item?')) return;

    try {
      const updated = mediaItems.filter(item => item.id !== itemId);
      setMediaItems(updated);
      localStorage.setItem('mediaGallery', JSON.stringify(updated));
      
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('[MediaGallery] Failed to delete:', error);
    }
  };

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, item: MediaItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  // Handle long-press for mobile
  const handleTouchStart = (item: MediaItem) => {
    longPressTimer.current = setTimeout(() => {
      // Get center of screen for menu position
      setContextMenu({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        item
      });
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Media Gallery</h2>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('image')}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Images
            </Button>
            <Button
              variant={filterType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('video')}
            >
              <Video className="w-4 h-4 mr-1" />
              Videos
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex gap-1 border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading media...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <h3 className="font-semibold">No media found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'Upload images and videos to get started'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      onTouchStart={() => handleTouchStart(item)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full bg-black">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-end p-3 opacity-0 group-hover:opacity-100">
                        <div className="w-full">
                          <p className="text-white text-sm font-medium truncate">
                            {item.name}
                          </p>
                          <p className="text-white/70 text-xs">
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="absolute top-2 right-2">
                        {item.type === 'video' && (
                          <div className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                            <Video className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary transition-all cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-black flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">{item.type}</span>
                          <span>{formatFileSize(item.size)}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl py-2 min-w-[200px] z-[110]"
            style={{
              left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 300)}px`
            }}
          >
            {/* Add to Timeline */}
            {onAddToTimeline && (
              <button
                onClick={() => {
                  onAddToTimeline(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
              >
                <Film className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">Add to Timeline</span>
              </button>
            )}

            {/* Add to Composition */}
            {onAddToComposition && (
              <button
                onClick={() => {
                  onAddToComposition(contextMenu.item);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
              >
                <Plus className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Add to Composition</span>
              </button>
            )}

            {/* Select */}
            {onSelect && (
              <button
                onClick={() => {
                  onSelect(contextMenu.item);
                  setContextMenu(null);
                  onClose();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
              >
                <Plus className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Select</span>
              </button>
            )}

            <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

            {/* Download */}
            <button
              onClick={() => {
                handleDownload(contextMenu.item);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Download</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => {
                handleDelete(contextMenu.item.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3 transition-colors text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        )}

        {/* Detail View Modal */}
        {selectedItem && (
          <div
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-10"
            onClick={() => setSelectedItem(null)}
          >
            <div className="max-w-4xl max-h-[80vh] p-8" onClick={(e) => e.stopPropagation()}>
              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              )}
              
              <div className="mt-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="font-semibold">{selectedItem.name}</h3>
                  <p className="text-sm text-white/70">
                    {formatFileSize(selectedItem.size)} • {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onSelect && (
                    <Button
                      onClick={() => {
                        onSelect(selectedItem);
                        onClose();
                      }}
                    >
                      Select
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedItem)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedItem.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

