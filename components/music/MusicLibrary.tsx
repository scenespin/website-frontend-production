/**
 * MusicLibrary Component
 * 
 * Display and manage user's generated music tracks
 * Features: grid/list view, filtering, audio preview, download
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Music,
  Play,
  Pause,
  Download,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Trash2,
  MoreVertical,
  Cloud,
  HardDrive
} from 'lucide-react';
import { formatDuration } from '@/hooks/useMusicGeneration';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ==================== Types ====================

export interface MusicTrack {
  audioUrl: string;
  s3Key: string;
  taskId: string;
  title?: string;
  tags?: string;
  duration_seconds?: number;
  model: string;
  creditsUsed: number;
  has_vocals: boolean;
  generatedAt: string;
  storage_location?: 'google-drive' | 'dropbox' | 's3';  // NEW: Storage location
}

interface MusicLibraryProps {
  onSelectTrack?: (track: MusicTrack) => void;
  onShowGenerator?: () => void;
  initialTracks?: MusicTrack[];
}

// ==================== Component ====================

export function MusicLibrary({ 
  onSelectTrack, 
  onShowGenerator,
  initialTracks = []
}: MusicLibraryProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks);
  const [filteredTracks, setFilteredTracks] = useState<MusicTrack[]>(initialTracks);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vocal' | 'instrumental'>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'google-drive' | 'dropbox' | 's3'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [playing, setPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Filter tracks based on search and filters
  useEffect(() => {
    let filtered = tracks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track =>
        track.title?.toLowerCase().includes(query) ||
        track.tags?.toLowerCase().includes(query) ||
        track.model.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(track =>
        filterType === 'vocal' ? track.has_vocals : !track.has_vocals
      );
    }
    
    // Storage filter
    if (storageFilter !== 'all') {
      filtered = filtered.filter(track =>
        track.storage_location === storageFilter
      );
    }

    setFilteredTracks(filtered);
  }, [tracks, searchQuery, filterType, storageFilter]);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const handlePlay = (track: MusicTrack) => {
    // Stop current audio if playing
    if (audioElement) {
      audioElement.pause();
    }

    // If clicking same track, toggle play/pause
    if (playing === track.taskId) {
      setPlaying(null);
      return;
    }

    // Create and play new audio
    const audio = new Audio(track.audioUrl);
    audio.addEventListener('ended', () => setPlaying(null));
    audio.play();
    
    setAudioElement(audio);
    setPlaying(track.taskId);
  };

  const handlePause = () => {
    if (audioElement) {
      audioElement.pause();
    }
    setPlaying(null);
  };

  const handleDownload = (track: MusicTrack) => {
    window.open(track.audioUrl, '_blank');
  };

  const handleDelete = (track: MusicTrack) => {
    if (confirm(`Delete "${track.title || 'Untitled'}"?`)) {
      setTracks(prev => prev.filter(t => t.taskId !== track.taskId));
      if (playing === track.taskId) {
        handlePause();
      }
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    if (onSelectTrack) {
      onSelectTrack(track);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Music Library
            </CardTitle>
            <CardDescription>
              {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'}
            </CardDescription>
          </div>
          {onShowGenerator && (
            <Button onClick={onShowGenerator} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, tags, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="vocal">With Vocals</SelectItem>
              <SelectItem value="instrumental">Instrumental</SelectItem>
            </SelectContent>
          </Select>
          <Select value={storageFilter} onValueChange={(v: any) => setStorageFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <Cloud className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Storage</SelectItem>
              <SelectItem value="google-drive">Google Drive</SelectItem>
              <SelectItem value="dropbox">Dropbox</SelectItem>
              <SelectItem value="s3">Temporary</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Music className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No music tracks yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== 'all'
                ? 'No tracks match your filters'
                : 'Generate your first AI music track to get started'}
            </p>
            {onShowGenerator && (
              <Button onClick={onShowGenerator}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Music
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.taskId}
                track={track}
                isPlaying={playing === track.taskId}
                onPlay={() => handlePlay(track)}
                onPause={handlePause}
                onDownload={() => handleDownload(track)}
                onDelete={() => handleDelete(track)}
                onSelect={() => handleSelectTrack(track)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredTracks.map((track) => (
              <TrackListItem
                key={track.taskId}
                track={track}
                isPlaying={playing === track.taskId}
                onPlay={() => handlePlay(track)}
                onPause={handlePause}
                onDownload={() => handleDownload(track)}
                onDelete={() => handleDelete(track)}
                onSelect={() => handleSelectTrack(track)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Track Card (Grid) ====================

interface TrackCardProps {
  track: MusicTrack;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

function TrackCard({ track, isPlaying, onPlay, onPause, onDownload, onDelete, onSelect }: TrackCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {track.title || 'Untitled Track'}
            </h3>
            {track.tags && (
              <p className="text-xs text-muted-foreground truncate">{track.tags}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Audio Player Visual */}
        <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              isPlaying ? onPause() : onPlay();
            }}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{formatDuration(track.duration_seconds)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="secondary" className="text-xs">
              {track.has_vocals ? 'Vocals' : 'Instrumental'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Model</span>
            <Badge variant="outline" className="text-xs">
              {track.model}
            </Badge>
          </div>
          {track.storage_location && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Storage</span>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                {track.storage_location === 's3' ? (
                  <><HardDrive className="w-3 h-3" />Temp</>
                ) : track.storage_location === 'google-drive' ? (
                  <><Cloud className="w-3 h-3" />Drive</>
                ) : (
                  <><Cloud className="w-3 h-3" />Dropbox</>
                )}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Track List Item ====================

function TrackListItem({ track, isPlaying, onPlay, onPause, onDownload, onDelete, onSelect }: TrackCardProps) {
  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Play Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              isPlaying ? onPause() : onPlay();
            }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {track.title || 'Untitled Track'}
            </h3>
            {track.tags && (
              <p className="text-sm text-muted-foreground truncate">{track.tags}</p>
            )}
          </div>

          {/* Metadata Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {track.has_vocals ? 'Vocals' : 'Instrumental'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {track.model}
            </Badge>
            {track.storage_location && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                {track.storage_location === 's3' ? (
                  <><HardDrive className="w-3 h-3" />Temp</>
                ) : track.storage_location === 'google-drive' ? (
                  <><Cloud className="w-3 h-3" />Drive</>
                ) : (
                  <><Cloud className="w-3 h-3" />Dropbox</>
                )}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground min-w-[60px] text-right">
              {formatDuration(track.duration_seconds)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

