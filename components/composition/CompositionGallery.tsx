/**
 * Composition Gallery - Display recent compositions (dailies)
 * Shows rendered videos with metadata
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, Download, Trash2, Calendar, Clock } from 'lucide-react';

interface Composition {
  id: string;
  userId: string;
  type: 'static' | 'animated' | 'paced';
  layout_id?: string;
  animation_id?: string;
  pacing_id?: string;
  output_url: string;
  thumbnail_url?: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  duration?: number;
}

interface CompositionGalleryProps {
  userId: string;
}

export function CompositionGallery({ userId }: CompositionGalleryProps) {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompositions();
  }, [userId]);

  const fetchCompositions = async () => {
    try {
      const response = await fetch(`/api/composition/gallery?userId=${userId}`);
      const data = await response.json();
      setCompositions(data.compositions || []);
    } catch (error) {
      console.error('Failed to fetch compositions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (composition: Composition) => {
    window.open(composition.output_url, '_blank');
  };

  const handleDelete = async (compositionId: string) => {
    if (!confirm('Are you sure you want to delete this composition?')) return;

    try {
      await fetch(`/api/composition/${compositionId}`, {
        method: 'DELETE',
      });
      setCompositions(compositions.filter(c => c.id !== compositionId));
    } catch (error) {
      console.error('Failed to delete composition:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'static': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'animated': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'paced': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-400 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compositions.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-yellow-400 rounded-full">
              <Film className="w-12 h-12 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No Compositions Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your rendered compositions will appear here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {compositions.map((composition) => (
        <Card 
          key={composition.id} 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-4">
            {/* Thumbnail / Preview */}
            <div className="relative bg-slate-900 rounded-lg overflow-hidden mb-3 aspect-video">
              {composition.thumbnail_url ? (
                <img 
                  src={composition.thumbnail_url} 
                  alt={`Composition ${composition.id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-12 h-12 text-slate-600" />
                </div>
              )}
              {/* Status Indicator */}
              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(composition.status)}`}></div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`${getTypeColor(composition.type)} text-xs`}>
                  {composition.type}
                </Badge>
                {composition.duration && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {composition.duration}s
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(composition.created_at).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => handleDownload(composition)}
                  disabled={composition.status !== 'completed'}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-slate-200 dark:border-slate-700 hover:border-red-400 hover:text-red-600"
                  onClick={() => handleDelete(composition.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

