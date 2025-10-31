/**
 * PostProductionPanel Component
 * 
 * UI for applying post-production enhancements to videos:
 * - Color grading presets
 * - Weather effects
 * - Style transfer
 * - Multi-platform social media optimization
 * 
 * Uses useVideoEnhancement and useSocialOptimization hooks
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  useVideoEnhancement, 
  PresetOption 
} from '@/hooks/useVideoEnhancement';
import { 
  useSocialOptimization,
  PlatformConfig
} from '@/hooks/useSocialOptimization';
import { PlayCircle, Sparkles, Globe, Download, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { CreditConfirmDialog } from '@/components/ui/CreditConfirmDialog';

interface PostProductionPanelProps {
  videoUrl: string;
  videoName?: string;
  onComplete?: (result: any) => void;
  onClose?: () => void;
}

export function PostProductionPanel({
  videoUrl,
  videoName = 'Video',
  onComplete,
  onClose
}: PostProductionPanelProps) {
  const [activeTab, setActiveTab] = useState<'enhance' | 'social'>('enhance');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // Credit confirmation dialog state
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);

  const enhancement = useVideoEnhancement();
  const social = useSocialOptimization();
  
  // Use current video from enhancement hook (could be original or enhanced)
  const previewVideo = enhancement.currentVideo || videoUrl;

  /**
   * Handle preset selection and application
   */
  const handleApplyPreset = async (presetId: string) => {
    const preset = enhancement.getPreset(presetId);
    if (!preset) return;
    
    // Check if already enhanced or has cached enhancement
    if (enhancement.appliedPreset || enhancement.hasCachedEnhancement) {
      // Show credit confirmation dialog
      setPendingPreset(presetId);
      setShowCreditDialog(true);
      return;
    }
    
    // First enhancement - proceed directly
    await applyPresetDirect(presetId);
  };
  
  /**
   * Apply preset after user confirms credit charge
   */
  const applyPresetDirect = async (presetId: string) => {
    setSelectedPreset(presetId);
    
    try {
      const result = await enhancement.applyPreset(videoUrl, presetId);
      
      if (onComplete) {
        onComplete({ type: 'enhancement', result });
      }
    } catch (error) {
      console.error('[PostProduction] Enhancement failed:', error);
    }
  };
  
  /**
   * Handle credit confirmation
   */
  const handleCreditConfirm = async () => {
    setShowCreditDialog(false);
    if (pendingPreset) {
      await applyPresetDirect(pendingPreset);
      setPendingPreset(null);
    }
  };

  /**
   * Handle platform toggle
   */
  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  /**
   * Handle social optimization
   */
  const handleOptimizeForSocial = async () => {
    if (selectedPlatforms.length === 0) {
      return;
    }

    try {
      const result = await social.optimizeForPlatforms(
        previewVideo || videoUrl,
        selectedPlatforms,
        { enhanceFirst: false }
      );

      if (onComplete) {
        onComplete({ type: 'social', result });
      }
    } catch (error) {
      console.error('[PostProduction] Social optimization failed:', error);
    }
  };

  /**
   * Handle bundle selection
   */
  const handleSelectBundle = (bundleId: string) => {
    const bundle = social.platformBundles[bundleId as keyof typeof social.platformBundles];
    if (bundle) {
      setSelectedPlatforms(bundle.platforms);
    }
  };

  const estimatedCost = social.estimateCost(selectedPlatforms, {});
  const savings = social.calculateSavings(selectedPlatforms);
  const popularPlatforms = social.getPopularPlatforms();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Post-Production Studio</h2>
          <p className="text-sm text-muted-foreground">
            Enhance your video and optimize for social media platforms
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      
      {/* Enhancement Status Banners */}
      {enhancement.appliedPreset && !enhancement.hasCachedEnhancement && (
        <Card className="bg-[#00D9FF]/10 border-[#00D9FF]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#00D9FF]" />
                <div>
                  <p className="font-medium text-sm">Enhanced with {enhancement.appliedPreset}</p>
                  <p className="text-xs text-muted-foreground">
                    {enhancement.result?.creditsUsed} credits used • Applying different enhancement will charge additional credits
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={enhancement.revertToOriginal}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Revert to Original (Free)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {enhancement.hasCachedEnhancement && !enhancement.appliedPreset && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Viewing original video</p>
                  <p className="text-xs text-muted-foreground">
                    Your {enhancement.cachedPreset} enhancement is cached • Restore it anytime for free
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="default"
                onClick={enhancement.restoreEnhancedVersion}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="w-4 h-4" />
                Restore {enhancement.cachedPreset} (Free)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video 
              src={previewVideo}
              controls
              className="w-full h-full object-contain"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">{videoName}</span>
            {enhancement.result && (
              <Badge variant="default" className="gap-1 bg-green-500 text-white">
                <Check className="w-3 h-3" />
                Enhanced
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enhance" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Enhancement
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Globe className="w-4 h-4" />
            Social Media
          </TabsTrigger>
        </TabsList>

        {/* Enhancement Tab */}
        <TabsContent value="enhance" className="space-y-6">
          {/* Progress */}
          {enhancement.isProcessing && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing enhancement...</span>
                    <span>{enhancement.progress}%</span>
                  </div>
                  <Progress value={enhancement.progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Color Grading Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Color Grading</CardTitle>
              <CardDescription>Professional color grading presets (25 credits each)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enhancement.colorGradePresets.map((preset: PresetOption) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={selectedPreset === preset.id}
                    onSelect={() => handleApplyPreset(preset.id)}
                    disabled={enhancement.isProcessing}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weather Effects */}
          <Card>
            <CardHeader>
              <CardTitle>Weather Effects</CardTitle>
              <CardDescription>Add atmospheric weather effects (25 credits each)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enhancement.weatherPresets.map((preset: PresetOption) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={selectedPreset === preset.id}
                    onSelect={() => handleApplyPreset(preset.id)}
                    disabled={enhancement.isProcessing}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style Transfer */}
          <Card>
            <CardHeader>
              <CardTitle>Style Transfer</CardTitle>
              <CardDescription>Dramatic artistic transformations (100 credits each)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enhancement.styleTransferPresets.map((preset: PresetOption) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={selectedPreset === preset.id}
                    onSelect={() => handleApplyPreset(preset.id)}
                    disabled={enhancement.isProcessing}
                    premium
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          {/* Progress */}
          {social.isOptimizing && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Creating platform versions...</span>
                    <span>{Math.round(social.progress)}%</span>
                  </div>
                  <Progress value={social.progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Bundles */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Bundles</CardTitle>
              <CardDescription>Pre-configured platform combinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(social.platformBundles).map((bundle) => (
                  <Button
                    key={bundle.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => handleSelectBundle(bundle.id)}
                  >
                    <span className="font-semibold">{bundle.name}</span>
                    <span className="text-xs text-muted-foreground">{bundle.description}</span>
                    <Badge variant="secondary">{bundle.totalCredits} credits</Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Platforms</CardTitle>
              <CardDescription>Choose which platforms to optimize for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popularPlatforms.map((platform: PlatformConfig) => (
                  <PlatformCard
                    key={platform.id}
                    platform={platform}
                    selected={selectedPlatforms.includes(platform.id)}
                    onToggle={() => handlePlatformToggle(platform.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          {selectedPlatforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Credits:</span>
                  <Badge variant="default">{estimatedCost} credits</Badge>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generating separately:</span>
                    <span className="line-through">{savings.traditional} credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">With reframe:</span>
                    <span className="font-semibold">{savings.reframe} credits</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">You save:</span>
                    <span className="font-bold">{savings.percentage}% ({savings.saved} credits)</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleOptimizeForSocial}
                  disabled={social.isOptimizing}
                >
                  {social.isOptimizing ? 'Optimizing...' : `Create ${selectedPlatforms.length} Platform Versions`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {social.platforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Videos</CardTitle>
                <CardDescription>Your optimized videos are ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {social.platforms.map((pv) => (
                    <div key={pv.platform} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{social.getPlatform(pv.platform)?.icon}</span>
                        <div>
                          <div className="font-medium">{pv.platformName}</div>
                          <div className="text-sm text-muted-foreground">{pv.aspectRatio}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{pv.creditsUsed} credits</Badge>
                        <Button size="sm" variant="outline" asChild>
                          <a href={pv.url} download>
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Credit Confirmation Dialog */}
      {showCreditDialog && pendingPreset && (
        <CreditConfirmDialog
          isOpen={showCreditDialog}
          onClose={() => {
            setShowCreditDialog(false);
            setPendingPreset(null);
          }}
          onConfirm={handleCreditConfirm}
          currentAction={
            enhancement.appliedPreset
              ? {
                  name: enhancement.appliedPreset,
                  credits: enhancement.result?.creditsUsed || 0
                }
              : undefined
          }
          newAction={{
            name: enhancement.getPreset(pendingPreset)?.name || pendingPreset,
            credits: enhancement.getPreset(pendingPreset)?.credits || 0
          }}
          showCacheWarning={enhancement.hasCachedEnhancement}
          cachedPreset={enhancement.cachedPreset || undefined}
          message={
            enhancement.hasCachedEnhancement
              ? `Applying a new enhancement will replace your cached ${enhancement.cachedPreset} version.`
              : 'Reverting is FREE. You can always go back to the original without charge.'
          }
        />
      )}
    </div>
  );
}

/**
 * Preset Card Component
 */
function PresetCard({
  preset,
  selected,
  onSelect,
  disabled,
  premium
}: {
  preset: PresetOption;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  premium?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative p-4 rounded-lg border-2 text-left transition-all
        ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold">{preset.name}</h4>
          {premium && <Badge variant="default" className="text-xs">Premium</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{preset.preview}</p>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="secondary" className="text-xs">
            {preset.credits} credits
          </Badge>
          {selected && <Check className="w-4 h-4 text-primary" />}
        </div>
      </div>
    </button>
  );
}

/**
 * Platform Card Component
 */
function PlatformCard({
  platform,
  selected,
  onToggle
}: {
  platform: PlatformConfig;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative p-4 rounded-lg border-2 text-left transition-all
        ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
      `}
    >
      <div className="space-y-2">
        <div className="text-2xl">{platform.icon}</div>
        <div>
          <h4 className="font-semibold text-sm">{platform.name}</h4>
          <p className="text-xs text-muted-foreground">{platform.aspectRatio}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {platform.creditCost === 0 ? 'Free' : `${platform.creditCost} credits`}
        </Badge>
        {selected && (
          <div className="absolute top-2 right-2">
            <Check className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    </button>
  );
}

