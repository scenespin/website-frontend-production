'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Zap,
  Clock,
  Video,
  Layers,
  AlertCircle,
  Sparkles,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { TimelineProject } from '@/hooks/useTimeline';

// ===== INLINE UI COMPONENTS =====

function RadioGroup({ value, onValueChange, children }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div role="radiogroup">
      {children}
    </div>
  );
}

function RadioGroupItem({ value, disabled }: { value: string; disabled?: boolean }) {
  return (
    <input
      type="radio"
      value={value}
      disabled={disabled}
      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
    />
  );
}

function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

// ===== INTERFACES =====

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4K';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
  frameRate: 24 | 30 | 60;
  speedTier: 'standard' | 'express';
}

interface ComplexityAnalysis {
  videoTracks: number;
  audioTracks: number;
  hasKeyframes: boolean;
  complexityScore: number;
  estimatedTime: string;
  recommendedTier: 'standard' | 'express';
  warnings: string[];
}

interface ExportModalProps {
  project: TimelineProject;
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  userCredits?: number;
  userTier?: 'free' | 'pro' | 'enterprise';
}

// ===== HELPER FUNCTIONS =====

function analyzeProjectComplexity(project: TimelineProject): ComplexityAnalysis {
  const videoTracks = new Set(
    project.assets.filter(a => a.trackType === 'video').map(a => a.track)
  ).size;
  
  const audioTracks = new Set(
    project.assets.filter(a => a.trackType === 'audio').map(a => a.track)
  ).size;
  
  const hasKeyframes = project.assets.some(a => 
    a.keyframes && a.keyframes.length > 0
  );
  
  // Complexity score: 0-100
  const complexityScore = Math.min(100,
    (videoTracks * 10) + 
    (audioTracks * 2) + 
    (hasKeyframes ? 20 : 0) +
    (project.duration > 300 ? 20 : 0) +
    (project.assets.length * 2)
  );
  
  const recommendedTier = complexityScore > 50 ? 'express' : 'standard';
  
  // Estimate render time (standard CPU)
  let estimatedSeconds = project.duration * 1.5; // Base: 1.5x realtime
  estimatedSeconds *= (1 + (videoTracks - 1) * 0.3); // +30% per extra video track
  estimatedSeconds *= hasKeyframes ? 1.3 : 1; // +30% for keyframes
  
  const estimatedTime = formatDuration(estimatedSeconds);
  
  // Generate warnings
  const warnings: string[] = [];
  if (videoTracks > 4) {
    warnings.push(`${videoTracks} video tracks detected - rendering may take longer`);
  }
  if (complexityScore > 70) {
    warnings.push('Complex project - consider using Express rendering for faster results');
  }
  if (project.duration > 600) {
    warnings.push('Long video - rendering may take 10+ minutes');
  }
  
  return {
    videoTracks,
    audioTracks,
    hasKeyframes,
    complexityScore,
    estimatedTime,
    recommendedTier,
    warnings
  };
}

function calculateExportCost(
  settings: ExportSettings,
  complexity: ComplexityAnalysis,
  duration: number
): number {
  // Base cost per minute
  const baseCosts = {
    '720p': { standard: 20, express: 35 },
    '1080p': { standard: 30, express: 45 },
    '4K': { standard: 50, express: 75 }
  };
  
  const baseCost = baseCosts[settings.resolution][settings.speedTier];
  
  // Track multiplier (+15% per extra video track)
  const trackMultiplier = 1 + Math.max(0, (complexity.videoTracks - 1) * 0.15);
  
  // Keyframe multiplier (+20%)
  const keyframeMultiplier = complexity.hasKeyframes ? 1.2 : 1;
  
  // High frame rate multiplier (+10% for 60fps)
  const frameRateMultiplier = settings.frameRate === 60 ? 1.1 : 1;
  
  // Duration in minutes (minimum 1)
  const minutes = Math.max(1, Math.ceil(duration / 60));
  
  return Math.ceil(
    baseCost * trackMultiplier * keyframeMultiplier * frameRateMultiplier * minutes
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  if (remainingSeconds === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  return `${minutes}m ${remainingSeconds}s`;
}

function getAspectRatioDimensions(aspectRatio: string, baseHeight: number): { width: number; height: number } {
  const ratios: Record<string, [number, number]> = {
    '16:9': [16, 9],
    '9:16': [9, 16],
    '1:1': [1, 1],
    '4:3': [4, 3],
    '21:9': [21, 9]
  };
  
  const [w, h] = ratios[aspectRatio] || [16, 9];
  const width = Math.round((baseHeight * w) / h);
  
  return { width, height: baseHeight };
}

// ===== MAIN COMPONENT =====

export function ExportModal({
  project,
  isOpen,
  onClose,
  onExport,
  userCredits = 1000,
  userTier = 'free'
}: ExportModalProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: project.resolution as '720p' | '1080p' | '4K' || '1080p',
    aspectRatio: project.aspectRatio as '16:9' || '16:9',
    frameRate: project.frameRate as 24 | 30 | 60 || 30,
    speedTier: 'standard'
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [complexity, setComplexity] = useState<ComplexityAnalysis | null>(null);
  const [cost, setCost] = useState(0);

  // Analyze complexity on mount
  useEffect(() => {
    if (isOpen) {
      const analysis = analyzeProjectComplexity(project);
      setComplexity(analysis);
      
      // Set recommended tier
      setSettings(prev => ({
        ...prev,
        speedTier: analysis.recommendedTier
      }));
    }
  }, [isOpen, project]);

  // Recalculate cost when settings change
  useEffect(() => {
    if (complexity) {
      const newCost = calculateExportCost(settings, complexity, project.duration);
      setCost(newCost);
    }
  }, [settings, complexity, project.duration]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(settings);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const canAfford = userCredits >= cost;
  
  // Check tier restrictions
  const is4KBlocked = userTier === 'free' && settings.resolution === '4K';
  const isExpressBlocked = userTier === 'free' && settings.speedTier === 'express';
  const isBlocked = is4KBlocked || isExpressBlocked;

  if (!complexity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Download className="w-6 h-6 text-blue-500" />
            Export Timeline
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Render your edited timeline (videos + transitions + effects) to a final video file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Info Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Duration</p>
                  <p className="font-semibold">{formatDuration(project.duration)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Assets</p>
                  <p className="font-semibold">{project.assets.length} clips</p>
                </div>
                <div>
                  <p className="text-slate-400">Video Tracks</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    {complexity.videoTracks}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Complexity</p>
                  <Badge variant={complexity.complexityScore > 70 ? 'destructive' : complexity.complexityScore > 40 ? 'default' : 'secondary'}>
                    {complexity.complexityScore}/100
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {complexity.warnings.length > 0 && (
            <Alert className="bg-yellow-950/30 border-yellow-800">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <ul className="list-disc list-inside space-y-1">
                  {complexity.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Resolution */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-500" />
              Resolution
            </Label>
            <RadioGroup
              value={settings.resolution}
              onValueChange={(value: string) => setSettings({ ...settings, resolution: value as '720p' | '1080p' | '4K' })}
            >
              <div className="grid grid-cols-3 gap-3">
                {(['720p', '1080p', '4K'] as const).map((res) => {
                  const dims = getAspectRatioDimensions(settings.aspectRatio, res === '720p' ? 720 : res === '1080p' ? 1080 : 2160);
                  const isLocked = res === '4K' && userTier === 'free';
                  
                  return (
                    <label
                      key={res}
                      className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                        settings.resolution === res
                          ? 'border-blue-500 bg-blue-950/30'
                          : 'border-slate-700 hover:border-slate-600'
                      } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <RadioGroupItem value={res} disabled={isLocked} />
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {res}
                          {isLocked && <Badge variant="outline" className="text-xs">Pro</Badge>}
                        </div>
                        <div className="text-xs text-slate-400">
                          {dims.width}×{dims.height}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Aspect Ratio</Label>
            <RadioGroup
              value={settings.aspectRatio}
              onValueChange={(value: string) => setSettings({ ...settings, aspectRatio: value as any })}
            >
              <div className="grid grid-cols-5 gap-2">
                {(['16:9', '9:16', '1:1', '4:3', '21:9'] as const).map((ratio) => (
                  <label
                    key={ratio}
                    className={`flex flex-col items-center space-y-2 border rounded-lg p-3 cursor-pointer transition-all ${
                      settings.aspectRatio === ratio
                        ? 'border-blue-500 bg-blue-950/30'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <RadioGroupItem value={ratio} />
                    <div className="text-sm font-medium">{ratio}</div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Frame Rate */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Frame Rate</Label>
            <RadioGroup
              value={String(settings.frameRate)}
              onValueChange={(value: string) => setSettings({ ...settings, frameRate: Number(value) as 24 | 30 | 60 })}
            >
              <div className="grid grid-cols-3 gap-3">
                {([24, 30, 60] as const).map((fps) => (
                  <label
                    key={fps}
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                      settings.frameRate === fps
                        ? 'border-blue-500 bg-blue-950/30'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <RadioGroupItem value={String(fps)} />
                    <div className="flex-1">
                      <div className="font-semibold">{fps} fps</div>
                      <div className="text-xs text-slate-400">
                        {fps === 24 ? 'Cinematic' : fps === 30 ? 'Standard' : 'Smooth'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Speed Tier */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Rendering Speed
            </Label>
            <RadioGroup
              value={settings.speedTier}
              onValueChange={(value: string) => setSettings({ ...settings, speedTier: value as 'standard' | 'express' })}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Standard */}
                <label
                  className={`flex flex-col space-y-3 border rounded-lg p-4 cursor-pointer transition-all ${
                    settings.speedTier === 'standard'
                      ? 'border-blue-500 bg-blue-950/30'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="standard" />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Standard
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          CPU Rendering
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">Most affordable</Badge>
                  </div>
                  <div className="text-sm text-slate-300 pl-7">
                    Estimated: {complexity.estimatedTime}
                  </div>
                </label>

                {/* Express */}
                <label
                  className={`flex flex-col space-y-3 border rounded-lg p-4 cursor-pointer transition-all ${
                    settings.speedTier === 'express'
                      ? 'border-purple-500 bg-purple-950/30'
                      : 'border-slate-700 hover:border-slate-600'
                  } ${isExpressBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="express" disabled={isExpressBlocked} />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Express
                          {isExpressBlocked && <Badge variant="outline" className="text-xs">Pro</Badge>}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          GPU-Accelerated
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                      <Sparkles className="w-3 h-3 mr-1" />
                      2-5x faster
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-300 pl-7">
                    Estimated: {formatDuration(parseInt(complexity.estimatedTime) / 3)} (3x faster)
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Cost Display */}
          <Card className={`border-2 ${canAfford ? 'border-green-600 bg-green-950/20' : 'border-red-600 bg-red-950/20'}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Export Cost</p>
                  <p className="text-3xl font-bold flex items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    {cost} credits
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    ≈ ${(cost * 0.10).toFixed(2)} USD
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">Your Balance</p>
                  <p className={`text-2xl font-bold ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                    {userCredits} credits
                  </p>
                  {!canAfford && (
                    <p className="text-xs text-red-400 mt-2">
                      Need {cost - userCredits} more
                    </p>
                  )}
                </div>
              </div>
              
              {!canAfford && (
                <Alert className="mt-4 bg-red-950/30 border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-200">
                    Insufficient credits.
                    <Button variant="link" className="ml-2 p-0 h-auto text-red-300 underline">
                      Purchase more credits
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {isBlocked && (
                <Alert className="mt-4 bg-purple-950/30 border-purple-800">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <AlertDescription className="text-purple-200">
                    {is4KBlocked 
                      ? '4K timeline exports are available on Ultra+ plans. Free users can export timelines up to 720p. (Note: AI video generation quality is separate - free users CAN generate Premium 4K videos!)' 
                      : 'Express (GPU) rendering is available on Ultra and Studio plans for 2-5x faster exports.'}
                    <Button variant="link" className="ml-2 p-0 h-auto text-purple-300 underline">
                      View Plans
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !canAfford || isBlocked}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Video ({cost} credits)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

