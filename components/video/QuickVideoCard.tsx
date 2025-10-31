'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Film, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Image validation constants
const MAX_IMAGE_SIZE_MB = 20;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Video Enhancement Concepts (from SceneVisualizerPanel)
const VIDEO_CONCEPTS = [
  { key: 'dolly_zoom', label: '🎬 Dolly Zoom', description: 'Hitchcock effect' },
  { key: 'camera_orbit', label: '🔄 Camera Orbit', description: 'Rotate around subject' },
  { key: 'camera_zoom', label: '🔍 Camera Zoom', description: 'Zoom in/out' },
  { key: 'camera_pan', label: '↔️ Camera Pan', description: 'Horizontal movement' },
  { key: 'camera_tilt', label: '↕️ Camera Tilt', description: 'Vertical movement' },
  { key: 'motion_blur', label: '💨 Motion Blur', description: 'Speed effect' },
  { key: 'depth_of_field', label: '🎯 Depth of Field', description: 'Focus effect' },
  { key: 'lens_flare', label: '✨ Lens Flare', description: 'Light streaks' },
];

const CAMERA_MOTIONS = [
  { value: 'none', label: 'None' },
  { value: 'camera pan left', label: '← Pan Left' },
  { value: 'camera pan right', label: 'Pan Right →' },
  { value: 'camera tilt up', label: '↑ Tilt Up' },
  { value: 'camera tilt down', label: '↓ Tilt Down' },
  { value: 'camera zoom in slowly', label: '🔍 Zoom In (Slow)' },
  { value: 'camera zoom out slowly', label: '🔍 Zoom Out (Slow)' },
  { value: 'camera orbit left', label: '🔄 Orbit Left' },
  { value: 'camera orbit right', label: '🔄 Orbit Right' },
  { value: 'handheld camera shake', label: '📹 Handheld Shake' },
  { value: 'smooth tracking shot', label: '🎥 Tracking Shot' },
  { value: 'crane shot up', label: '🏗️ Crane Up' },
  { value: 'crane shot down', label: '🏗️ Crane Down' },
];

interface QuickVideoCardProps {
  qualityTier: 'professional' | 'premium' | 'cinema';
  onQualityTierChange: (tier: 'professional' | 'premium' | 'cinema') => void;
  resolution: '540p' | '720p' | '1080p' | '4k' | '8k';
  onResolutionChange: (resolution: '540p' | '720p' | '1080p' | '4k' | '8k') => void;
  aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | '1:1';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | '1:1') => void;
  concepts: string[];
  onConceptsChange: (concepts: string[]) => void;
  cameraMotion: string;
  onCameraMotionChange: (motion: string) => void;
  
  // Image-to-video props
  videoMode: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images' | 'workflow';
  onVideoModeChange: (mode: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images' | 'workflow') => void;
  startImageFile: File | null;
  onStartImageChange: (file: File | null) => void;
  endImageFile: File | null;
  onEndImageChange: (file: File | null) => void;
  referenceImages: (File | null)[];     // NEW: Up to 3 reference images
  onReferenceImagesChange: (files: (File | null)[]) => void;  // NEW
  duration: '4s' | '5s' | '6s' | '8s';
  onDurationChange: (duration: '4s' | '5s' | '6s' | '8s') => void;
  enableSound: boolean;
  onEnableSoundChange: (enabled: boolean) => void;
  enableLoop: boolean;
  onEnableLoopChange: (enabled: boolean) => void;
  
  onClose: () => void;
  isGenerating: boolean;
}

export function QuickVideoCard({
  qualityTier,
  onQualityTierChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  concepts,
  onConceptsChange,
  cameraMotion,
  onCameraMotionChange,
  videoMode,
  onVideoModeChange,
  startImageFile,
  onStartImageChange,
  endImageFile,
  onEndImageChange,
  referenceImages,
  onReferenceImagesChange,
  duration,
  onDurationChange,
  enableSound,
  onEnableSoundChange,
  enableLoop,
  onEnableLoopChange,
  onClose,
  isGenerating
}: QuickVideoCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startImagePreview, setStartImagePreview] = useState<string | null>(null);
  const [endImagePreview, setEndImagePreview] = useState<string | null>(null);
  const [startImageError, setStartImageError] = useState<string | null>(null);
  const [endImageError, setEndImageError] = useState<string | null>(null);
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const endImageInputRef = useRef<HTMLInputElement>(null);

  // Note: Provider-specific logic removed - backend intelligently routes to best provider
  // No provider flags needed - quality tiers and video modes determine routing
  
  // FIXED: Cleanup object URLs when they change or component unmounts
  useEffect(() => {
    return () => {
      if (startImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(startImagePreview);
      }
      if (endImagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(endImagePreview);
      }
    };
  }, [startImagePreview, endImagePreview]);
  
  // Validate image file
  const validateImageFile = (file: File): string | null => {
    // Check file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return `Please select a valid image file (JPG, PNG, GIF, or WEBP). Your file type: ${file.type || 'unknown'}`;
    }
    
    // Check file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return `Image must be under ${MAX_IMAGE_SIZE_MB}MB. Your file is ${fileSizeMB}MB`;
    }
    
    return null; // Valid
  };
  
  // FIXED: Handle image file changes with inline error messages instead of alert()
  const handleStartImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear previous errors
    setStartImageError(null);
    
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setStartImageError(validationError);
      if (startImageInputRef.current) startImageInputRef.current.value = '';
      return;
    }
    
    // Revoke old object URL to prevent memory leak
    if (startImagePreview && startImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(startImagePreview);
    }
    
    onStartImageChange(file);
    // Use createObjectURL instead of FileReader (more efficient)
    const objectUrl = URL.createObjectURL(file);
    setStartImagePreview(objectUrl);
  };
  
  // FIXED: Handle end image with inline error messages
  const handleEndImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear previous errors
    setEndImageError(null);
    
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setEndImageError(validationError);
      if (endImageInputRef.current) endImageInputRef.current.value = '';
      return;
    }
    
    // Check if same as start image (for interpolation mode)
    if (videoMode === 'image-interpolation' && startImageFile) {
      if (startImageFile.name === file.name && startImageFile.size === file.size) {
        setEndImageError('Start and end frames appear to be the same image. Please upload different images for smooth interpolation.');
        if (endImageInputRef.current) endImageInputRef.current.value = '';
        return;
      }
    }
    
    // Revoke old object URL to prevent memory leak
    if (endImagePreview && endImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(endImagePreview);
    }
    
    onEndImageChange(file);
    // Use createObjectURL instead of FileReader (more efficient)
    const objectUrl = URL.createObjectURL(file);
    setEndImagePreview(objectUrl);
  };
  
  const clearStartImage = () => {
    // Revoke object URL to free memory
    if (startImagePreview && startImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(startImagePreview);
    }
    onStartImageChange(null);
    setStartImagePreview(null);
    setStartImageError(null); // Clear error when image is cleared
    if (startImageInputRef.current) startImageInputRef.current.value = '';
  };
  
  const clearEndImage = () => {
    // Revoke object URL to free memory
    if (endImagePreview && endImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(endImagePreview);
    }
    onEndImageChange(null);
    setEndImagePreview(null);
    setEndImageError(null); // Clear error when image is cleared
    if (endImageInputRef.current) endImageInputRef.current.value = '';
  };
  
  // Calculate credit cost
  const calculateCredits = () => {
    // Quality tier-based pricing
    if (qualityTier === 'professional') {
      return 50; // Professional Grade 1080p
    }
    if (qualityTier === 'premium') {
      return 75; // Premium Grade 4K
    }
    return 50; // Default to professional
  };

  const creditCost = calculateCredits();

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Quick Video Generation</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Video Mode Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Video Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onVideoModeChange('text-only')}
              className={`p-3 rounded border text-left text-xs transition-all ${
                videoMode === 'text-only'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">Text Only</div>
              <div className="text-muted-foreground">Generate from description</div>
            </button>
            
            <button
              onClick={() => onVideoModeChange('image-start')}
              className={`p-3 rounded border text-left text-xs transition-all ${
                videoMode === 'image-start'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">📸 Image Start</div>
              <div className="text-muted-foreground">Animate from image</div>
            </button>
            
            <button
              onClick={() => onVideoModeChange('image-interpolation')}
              className={`p-3 rounded border text-left text-xs transition-all ${
                videoMode === 'image-interpolation'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">🎬 First & Last</div>
              <div className="text-muted-foreground">Transition between images</div>
            </button>
            
            <button
              onClick={() => onVideoModeChange('reference-images')}
              className={`p-3 rounded border text-left text-xs transition-all ${
                videoMode === 'reference-images'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border hover:border-primary/50'
              }`}
            >
              <div className="font-medium">🎭 Character Ref</div>
              <div className="text-muted-foreground">Up to 3 reference images</div>
            </button>
            
            {/* NEW: Scene Builder Mode */}
            <button
              onClick={() => onVideoModeChange('workflow')}
              className={`p-3 rounded border text-left text-xs transition-all col-span-2 ${
                videoMode === 'workflow'
                  ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'bg-background border-border hover:border-purple-500/50'
              }`}
            >
              <div className="font-medium">🎪 Scene Builder (Pro)</div>
              <div className="text-muted-foreground">Complete scene package with perfect consistency (4-7 videos)</div>
            </button>
          </div>
        </div>

        {/* Image Upload Section (conditional) */}
        {videoMode !== 'text-only' && videoMode !== 'reference-images' && videoMode !== 'workflow' && (
          <div className="p-3 rounded-md bg-background/50 border border-border/50">
            <label className="text-sm font-medium mb-2 block">
              {videoMode === 'image-start' ? '📸 Start Frame' : '🎬 Frame Images'}
            </label>
            
            <div className={`grid ${videoMode === 'image-interpolation' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {/* Start Image */}
              <div>
                <input
                  ref={startImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleStartImageChange}
                  className="hidden"
                />
                
                {startImagePreview ? (
                  <div className="relative">
                    <img 
                      src={startImagePreview} 
                      alt="Start frame" 
                      className="w-full h-32 object-cover rounded border border-border"
                    />
                    <button
                      onClick={clearStartImage}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {startImageFile?.name}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startImageInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border rounded flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {videoMode === 'image-interpolation' ? 'Upload first frame' : 'Upload image'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">Max 20MB</span>
                  </button>
                )}
                
                {/* FIXED: Inline error message for start image */}
                {startImageError && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500">
                    {startImageError}
                  </div>
                )}
              </div>
              
              {/* End Image (only for interpolation) */}
              {videoMode === 'image-interpolation' && (
                <div>
                  <input
                    ref={endImageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleEndImageChange}
                    className="hidden"
                  />
                  
                  {endImagePreview ? (
                    <div className="relative">
                      <img 
                        src={endImagePreview} 
                        alt="End frame" 
                        className="w-full h-32 object-cover rounded border border-border"
                      />
                      <button
                        onClick={clearEndImage}
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded hover:bg-background"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {endImageFile?.name}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => endImageInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-border rounded flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload last frame</span>
                      <span className="text-xs text-muted-foreground mt-1">Max 20MB</span>
                    </button>
                  )}
                  
                  {/* FIXED: Inline error message for end image */}
                  {endImageError && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500">
                      {endImageError}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              {videoMode === 'image-start' 
                ? '✨ Animate any image with advanced AI video generation' 
                : '🎬 Video will smoothly transition between your two images'}
            </p>
          </div>
        )}
        
        {/* Reference Images Upload Section (NEW for Character Consistency) */}
        {videoMode === 'reference-images' && (
          <div className="p-3 rounded-md bg-background/50 border border-border/50">
            <label className="text-sm font-medium mb-2 block">
              🎭 Reference Images (Up to 3)
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Upload 1-3 images of your character from different angles. Veo will maintain consistency across the video.
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => {
                const file = referenceImages[index];
                const preview = file ? URL.createObjectURL(file) : null;
                
                return (
                  <div key={index}>
                    {preview ? (
                      <div className="relative">
                        <img 
                          src={preview} 
                          alt={`Reference ${index + 1}`} 
                          className="w-full h-24 object-cover rounded border border-border"
                        />
                        <button
                          onClick={() => {
                            const newImages = [...referenceImages];
                            newImages[index] = null;
                            onReferenceImagesChange(newImages);
                          }}
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded hover:bg-background"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="text-[10px] text-center text-muted-foreground mt-1 truncate">
                          Ref {index + 1}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
                          input.onchange = (e: any) => {
                            const selectedFile = e.target?.files?.[0];
                            if (selectedFile) {
                              // Validate size
                              if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
                                alert(`Image is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB`);
                                return;
                              }
                              // Validate type
                              if (!SUPPORTED_IMAGE_TYPES.includes(selectedFile.type)) {
                                alert('Unsupported image format. Use JPG, PNG, GIF, or WebP.');
                                return;
                              }
                              const newImages = [...referenceImages];
                              newImages[index] = selectedFile;
                              onReferenceImagesChange(newImages);
                            }
                          };
                          input.click();
                        }}
                        className="w-full h-24 border-2 border-dashed border-border rounded flex flex-col items-center justify-center hover:border-primary/50 transition-colors text-xs"
                      >
                        <Upload className="w-4 h-4 mb-1 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Ref {index + 1}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              🎭 Character consistency - upload 1-3 images from different angles for best results
            </p>
          </div>
        )}
        
        {/* Scene Builder UI (NEW for Workflow Mode) */}
        {videoMode === 'workflow' && (
          <div className="space-y-3">
            {/* Scene Builder Hero Card */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎪</span>
                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400">Scene Builder</h4>
                  <p className="text-xs text-muted-foreground">
                    Generate a complete scene package with perfect consistency
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                <div className="p-2 rounded bg-background/50 border border-border/30">
                  <div className="font-medium">📦 4-7 Videos</div>
                  <div className="text-muted-foreground text-[10px]">Complete package</div>
                </div>
                <div className="p-2 rounded bg-background/50 border border-border/30">
                  <div className="font-medium">⚡ 8-15 min</div>
                  <div className="text-muted-foreground text-[10px]">Parallel execution</div>
                </div>
                <div className="p-2 rounded bg-background/50 border border-border/30">
                  <div className="font-medium">💎 100-200 cr</div>
                  <div className="text-muted-foreground text-[10px]">Based on options</div>
                </div>
              </div>
            </div>
            
            {/* Audio Pre-Check Warning (NEW!) */}
            {enableSound && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    <div className="font-medium mb-1">Audio Pre-Check</div>
                    <div>
                      We&apos;ll validate your scene with audio first. If rejected due to 
                      content guidelines, you&apos;ll choose to continue without audio or 
                      cancel at no charge.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Character References (Optional) */}
            <div className="p-3 rounded-md bg-background/50 border border-border/50">
              <label className="text-sm font-medium mb-2 block">
                🎭 Character References (Optional, 1-3 images)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload character images for consistent appearance across all shots. Leave empty for scene-only generation.
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((index) => {
                  const file = referenceImages[index];
                  const preview = file ? URL.createObjectURL(file) : null;
                  
                  return (
                    <div key={index}>
                      {preview ? (
                        <div className="relative">
                          <img 
                            src={preview} 
                            alt={`Character ${index + 1}`} 
                            className="w-full h-24 object-cover rounded border border-border"
                          />
                          <button
                            onClick={() => {
                              const newImages = [...referenceImages];
                              newImages[index] = null;
                              onReferenceImagesChange(newImages);
                            }}
                            className="absolute top-1 right-1 p-1 bg-background/80 rounded hover:bg-background"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="text-[10px] text-center text-muted-foreground mt-1 truncate">
                            Char {index + 1}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
                            input.onchange = (e: any) => {
                              const selectedFile = e.target?.files?.[0];
                              if (selectedFile) {
                                if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
                                  alert(`Image is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB`);
                                  return;
                                }
                                if (!SUPPORTED_IMAGE_TYPES.includes(selectedFile.type)) {
                                  alert('Unsupported image format. Use JPG, PNG, GIF, or WebP.');
                                  return;
                                }
                                const newImages = [...referenceImages];
                                newImages[index] = selectedFile;
                                onReferenceImagesChange(newImages);
                              }
                            };
                            input.click();
                          }}
                          className="w-full h-24 border-2 border-dashed border-border rounded flex flex-col items-center justify-center hover:border-purple-500/50 transition-colors text-xs"
                        >
                          <Upload className="w-4 h-4 mb-1 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Char {index + 1}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-2 p-2 rounded bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                <p className="text-xs text-[#00D9FF]">
                  💡 <strong>With character refs:</strong> Generates 1 establishing shot + 3 character angles (4 videos total)<br/>
                  <strong>Without character refs:</strong> Generates 1 establishing shot + 3 scene variations (4 videos total)
                </p>
              </div>
            </div>
            
            {/* What You'll Get Preview */}
            <div className="p-3 rounded-md bg-background/50 border border-border/50">
              <label className="text-sm font-medium mb-2 block">
                📦 What You&apos;ll Get
              </label>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                  <span className="text-lg">🎬</span>
                  <div>
                    <div className="font-medium">Master Establishing Shot</div>
                    <div className="text-muted-foreground">Defines the scene aesthetic (lighting, color, mood)</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                  <span className="text-lg">🎭</span>
                  <div>
                    <div className="font-medium">3× Character Coverage or Scene Variations</div>
                    <div className="text-muted-foreground">
                      {referenceImages.some(img => img !== null) 
                        ? 'Close-up, medium, and action shots with character consistency'
                        : 'Different angles and perspectives of your scene'}
                    </div>
                  </div>
                </div>
                
                {qualityTier === 'premium' && (
                  <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                    <span className="text-lg">💎</span>
                    <div>
                      <div className="font-medium">4K Upscaling (Premium)</div>
                      <div className="text-muted-foreground">All videos upscaled to 4K Ultra HD</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-2 p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✨ <strong>Perfect Consistency:</strong> All shots automatically use the master shot as reference for matching lighting, color, and atmosphere!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Controls */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quality Tier</label>
              <Select value={qualityTier} onValueChange={onQualityTierChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">🎬 Professional (1080p) - 50 credits</SelectItem>
                  <SelectItem value="premium">💎 Premium (4K) - 75 credits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Resolution</label>
              <Select value={resolution} onValueChange={onResolutionChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="540p">540p</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                    <SelectItem value="9:16">9:16 (Vertical 📱)</SelectItem>
                    <SelectItem value="4:3">4:3 (Classic TV)</SelectItem>
                    <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                    <SelectItem value="21:9">21:9 (Ultra Wide)</SelectItem>
                    <SelectItem value="9:21">9:21 (Ultra Vertical)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Duration Selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
              <Select value={duration} onValueChange={onDurationChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4s">4 seconds</SelectItem>
                <SelectItem value="5s">5 seconds</SelectItem>
                <SelectItem value="6s">6 seconds</SelectItem>
                <SelectItem value="8s">8 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Unified Sound & Camera Controls (Provider-Agnostic) */}
          <div className="space-y-2">
            {/* Sound Generation with Safety Disclaimer */}
            <div>
              <div className="flex items-center p-2 rounded bg-background/50 border border-border/50">
                <input
                  type="checkbox"
                  id="enable-sound"
                  checked={enableSound}
                  onChange={(e) => onEnableSoundChange(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enable-sound" className="text-sm cursor-pointer">
                  🎵 Generate Sound/Music
                </label>
              </div>
              
              {/* Safety disclaimer when sound is enabled */}
              {enableSound && (
                <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-900 mt-1">
                  ⚠️ Audio generation has stricter content safety guidelines and may reject certain prompts.
                </div>
              )}
            </div>
            
            {/* Camera Motion */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">🎥 Camera Movement</label>
              <Select value={cameraMotion} onValueChange={onCameraMotionChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select camera motion..." />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_MOTIONS.map((motion) => (
                    <SelectItem key={motion.value} value={motion.value}>
                      {motion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Info */}
      <div className="flex-shrink-0 p-4 border-t border-border/50 bg-background/95 backdrop-blur-sm">
        {videoMode === 'workflow' ? (
          <>
            <p className="text-xs text-muted-foreground text-center">
              <span>🎪 Scene Builder • Complete scene packages with perfect consistency</span>
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 text-center mt-2">
              💬 Enter your scene description below (screenplay format or plain English)
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground text-center">
              <span>🎬 Wryda • Professional Hollywood-Quality Video Generation</span>
            </p>
            <p className="text-xs text-primary text-center mt-2">
              💬 Enter your prompt in the chat below
            </p>
          </>
        )}
      </div>
    </div>
  );
}