/**
 * VideoPreviewModal Component
 * 
 * Enhanced video preview modal that now includes:
 * - Video playback
 * - Post-production enhancement options
 * - Multi-platform social media optimization
 * - Download and sharing features
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Share2, 
  Sparkles, 
  Globe, 
  X,
  CheckCircle2 
} from 'lucide-react';
import { PostProductionPanel } from '@/components/video/PostProductionPanel';

export interface ExportMetadata {
  resolution: string;
  aspectRatio: string;
  frameRate: number;
  duration: number;
  creditsUsed: number;
  s3Key?: string;
  renderTime?: number;
}

interface VideoPreviewModalProps {
  videoUrl: string;
  metadata: ExportMetadata;
  projectName: string;
  onClose: () => void;
}

export function VideoPreviewModal({
  videoUrl,
  metadata,
  projectName,
  onClose
}: VideoPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'enhance'>('preview');
  const [enhancedVideo, setEnhancedVideo] = useState<string | null>(null);
  const [socialVersions, setSocialVersions] = useState<any[]>([]);

  /**
   * Handle post-production completion
   */
  const handlePostProductionComplete = (result: any) => {
    if (result.type === 'enhancement') {
      setEnhancedVideo(result.result.videoUrl);
    } else if (result.type === 'social') {
      setSocialVersions(result.result.platforms);
    }
  };

  /**
   * Download video
   */
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayVideo = enhancedVideo || videoUrl;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Video Export Complete
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview & Download</TabsTrigger>
            <TabsTrigger value="enhance" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Enhance & Optimize
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                src={displayVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Resolution</p>
                <Badge variant="secondary">{metadata.resolution}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                <Badge variant="secondary">{metadata.aspectRatio}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Frame Rate</p>
                <Badge variant="secondary">{metadata.frameRate} fps</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Credits Used</p>
                <Badge variant="default">{metadata.creditsUsed} credits</Badge>
              </div>
            </div>

            {/* Enhanced Badge */}
            {enhancedVideo && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">
                  This video has been enhanced with post-production effects
                </span>
              </div>
            )}

            {/* Social Versions */}
            {socialVersions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Platform Versions Ready
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {socialVersions.map((pv) => (
                    <div 
                      key={pv.platform}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">
                          {pv.platformName === 'YouTube' && '📺'}
                          {pv.platformName === 'TikTok' && '🎵'}
                          {pv.platformName === 'Instagram Feed' && '📷'}
                          {pv.platformName === 'Instagram Reels' && '📸'}
                          {pv.platformName === 'Facebook' && '👥'}
                          {pv.platformName === 'Twitter/X' && '🐦'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{pv.platformName}</p>
                          <p className="text-xs text-muted-foreground">{pv.aspectRatio}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(pv.url, `${projectName}_${pv.platform}.mp4`)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => handleDownload(displayVideo, `${projectName}.mp4`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
              <Button 
                variant="outline"
                onClick={() => setActiveTab('enhance')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance Video
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Implement sharing
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </TabsContent>

          {/* Enhancement Tab */}
          <TabsContent value="enhance" className="overflow-y-auto max-h-[70vh]">
            <PostProductionPanel
              videoUrl={displayVideo}
              videoName={projectName}
              onComplete={handlePostProductionComplete}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
