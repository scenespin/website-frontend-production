'use client';

import React, { useState, useRef } from 'react';
import { 
  Wand2, 
  Maximize2, 
  ArrowUpCircle, 
  User, 
  Upload, 
  X, 
  Play,
  Download,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// File validation constants
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_SIZE_MB = 20;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

type EnhancementTab = 'modify' | 'reframe' | 'upscale' | 'animate';

interface EnhancementResult {
  url: string;
  taskId?: string;
  provider: string;
  type: string;
}

interface EnhancementStudioProps {
  onClose?: () => void;
}

export function EnhancementStudio({ onClose }: EnhancementStudioProps) {
  const [activeTab, setActiveTab] = useState<EnhancementTab>('modify');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'modify':
        return <VideoModifyTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'reframe':
        return <VideoReframeTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'upscale':
        return <VideoUpscaleTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      case 'animate':
        return <CharacterAnimateTab isProcessing={isProcessing} setIsProcessing={setIsProcessing} setResult={setResult} setError={setError} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#DC143C]/10 rounded-lg">
            <Wand2 className="w-5 h-5 text-[#DC143C]" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Enhancement Studio</h3>
            <p className="text-xs text-muted-foreground">
              Transform and enhance your videos
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border/50 bg-accent/5">
        <TabButton
          active={activeTab === 'modify'}
          onClick={() => setActiveTab('modify')}
          icon={<Wand2 className="w-4 h-4" />}
          label="Modify"
          description="Transform video"
          tier="Standard"
        />
        <TabButton
          active={activeTab === 'reframe'}
          onClick={() => setActiveTab('reframe')}
          icon={<Maximize2 className="w-4 h-4" />}
          label="Reframe"
          description="Change aspect"
          tier="Standard"
        />
        <TabButton
          active={activeTab === 'upscale'}
          onClick={() => setActiveTab('upscale')}
          icon={<ArrowUpCircle className="w-4 h-4" />}
          label="Upscale"
          description="Boost quality"
          tier="Premium"
        />
        <TabButton
          active={activeTab === 'animate'}
          onClick={() => setActiveTab('animate')}
          icon={<User className="w-4 h-4" />}
          label="Animate"
          description="Bring to life"
          tier="Premium"
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {renderTabContent()}
      </div>

      {/* Result Display */}
      {result && (
        <div className="p-4 border-t border-border/50 bg-accent/5">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">✅ Enhancement Complete!</p>
              <p className="text-xs text-muted-foreground">
                Powered by Wryda AI · Type: {result.type}
              </p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => window.open(result.url, '_blank')}>
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
          <video
            src={result.url}
            controls
            className="w-full mt-3 rounded-lg border border-border"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 border-t border-border/50 bg-red-500/5">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Error</p>
              <p className="text-xs text-red-500/80 mt-1">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  tier?: string; // Optional tier badge (e.g., "Standard", "Premium")
}

function TabButton({ active, onClick, icon, label, description, tier }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center p-3 border-b-2 transition-all
        ${active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-transparent hover:bg-accent/5 text-muted-foreground hover:text-foreground'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs opacity-75">{description}</span>
      {tier && (
        <span className="text-xs mt-1 px-2 py-0.5 rounded-full bg-accent/50">
          {tier}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// TAB 1: VIDEO MODIFY (AI Enhancement)
// =============================================================================

interface TabProps {
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  setResult: (result: EnhancementResult) => void;
  setError: (error: string | null) => void;
}

function VideoModifyTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [strength, setStrength] = useState(0.7);
  const [keepFrames, setKeepFrames] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Validate file type
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      setFileError(`Please select a valid video file (MP4, MOV, or WEBM). Your file type: ${file.type}`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setFileError(`Video must be under ${MAX_VIDEO_SIZE_MB}MB. Your file is ${fileSizeMB}MB`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    // Revoke old object URL
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
  };

  const handleSubmit = async () => {
    if (!videoFile || !prompt.trim()) {
      setError('Please upload a video and enter a modification prompt');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://l9zm95wyxb.execute-api.us-east-1.amazonaws.com/v1';

      // Upload video to get URL (simplified - in production use S3 presigned URLs)
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('prompt', prompt);
      formData.append('strength', strength.toString());
      formData.append('keepFrames', keepFrames.toString());

      const response = await fetch(`${apiUrl}/api/video/enhance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to modify video: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.video_url,
        taskId: data.task_id,
        provider: 'Wryda AI',
        type: 'Video Modify'
      });

    } catch (err: any) {
      console.error('[VideoModify] Error:', err);
      setError(err.message || 'Failed to modify video');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Video Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">📹 Upload Video</label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleVideoChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => videoInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {videoFile ? videoFile.name : 'Choose Video File'}
        </Button>
        {fileError && (
          <p className="text-xs text-red-500 mt-1">{fileError}</p>
        )}
        {videoPreview && (
          <video
            src={videoPreview}
            controls
            className="w-full mt-3 rounded-lg border border-border"
            style={{ maxHeight: '200px' }}
          />
        )}
      </div>

      {/* Modification Prompt */}
      <div>
        <label className="text-sm font-medium mb-2 block">✨ Modification Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Change the scene to nighttime with neon lights..."
          className="min-h-[100px]"
          disabled={isProcessing}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Describe how you want to transform the video
        </p>
      </div>

      {/* Strength Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">🎚️ Modification Strength</label>
          <span className="text-sm text-muted-foreground">{strength.toFixed(2)}</span>
        </div>
        <Slider
          value={[strength]}
          onValueChange={(values) => setStrength(values[0])}
          min={0}
          max={1}
          step={0.05}
          disabled={isProcessing}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Subtle (0.0)</span>
          <span>Moderate (0.5)</span>
          <span>Strong (1.0)</span>
        </div>
      </div>

      {/* Keep Frames Toggle */}
      <div className="flex items-center gap-2 p-3 rounded-md bg-accent/10 border border-border/50">
        <input
          type="checkbox"
          id="keep-frames"
          checked={keepFrames}
          onChange={(e) => setKeepFrames(e.target.checked)}
          disabled={isProcessing}
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        />
        <label htmlFor="keep-frames" className="text-sm cursor-pointer select-none flex-1">
          🎞️ Keep Original Frames
          <span className="block text-xs text-muted-foreground mt-0.5">
            Maintains structure while applying modifications
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !videoFile || !prompt.trim()}
        className="w-full gap-2 bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#8B0000] hover:to-[#DC143C]"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Modifying Video...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Modify Video - AI Enhancement
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~25-50 credits · ⏱️ Processing time: 2-3 min
      </p>
    </div>
  );
}

// =============================================================================
// TAB 2: VIDEO REFRAME (AI Reframing)
// =============================================================================

function VideoReframeTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [cropMode, setCropMode] = useState('center');
  const [fileError, setFileError] = useState<string | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      setFileError(`Please select a valid video file (MP4, MOV, or WEBM)`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setFileError(`Video must be under ${MAX_VIDEO_SIZE_MB}MB. Your file is ${fileSizeMB}MB`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      setError('Please upload a video');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://l9zm95wyxb.execute-api.us-east-1.amazonaws.com/v1';

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('aspectRatio', aspectRatio);
      formData.append('cropMode', cropMode);

      const response = await fetch(`${apiUrl}/api/video/reframe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to reframe video: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.video_url,
        taskId: data.task_id,
        provider: 'Wryda AI',
        type: 'Video Reframe'
      });

    } catch (err: any) {
      console.error('[VideoReframe] Error:', err);
      setError(err.message || 'Failed to reframe video');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Video Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">📹 Upload Video</label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleVideoChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => videoInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {videoFile ? videoFile.name : 'Choose Video File'}
        </Button>
        {fileError && (
          <p className="text-xs text-red-500 mt-1">{fileError}</p>
        )}
        {videoPreview && (
          <video
            src={videoPreview}
            controls
            className="w-full mt-3 rounded-lg border border-border"
            style={{ maxHeight: '200px' }}
          />
        )}
      </div>

      {/* Target Aspect Ratio */}
      <div>
        <label className="text-sm font-medium mb-2 block">📐 Target Aspect Ratio</label>
        <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isProcessing}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Horizontal/YouTube)</SelectItem>
            <SelectItem value="9:16">9:16 (Vertical/TikTok) 📱</SelectItem>
            <SelectItem value="4:3">4:3 (Classic TV)</SelectItem>
            <SelectItem value="3:4">3:4 (Vertical Portrait)</SelectItem>
            <SelectItem value="21:9">21:9 (Ultra Wide)</SelectItem>
            <SelectItem value="1:1">1:1 (Square/Instagram)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Crop Mode */}
      <div>
        <label className="text-sm font-medium mb-2 block">✂️ Crop Mode</label>
        <Select value={cropMode} onValueChange={setCropMode} disabled={isProcessing}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="center">Center Crop (Default)</SelectItem>
            <SelectItem value="smart">Smart Crop (AI Detects Focus)</SelectItem>
            <SelectItem value="top">Top Crop</SelectItem>
            <SelectItem value="bottom">Bottom Crop</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {cropMode === 'smart' && '🤖 AI will focus on the most important subjects'}
          {cropMode === 'center' && '🎯 Crops from the center of the frame'}
          {cropMode === 'top' && '⬆️ Keeps the top portion of the frame'}
          {cropMode === 'bottom' && '⬇️ Keeps the bottom portion of the frame'}
        </p>
      </div>

      {/* Preview */}
      {videoPreview && (
        <div className="p-3 rounded-md bg-accent/10 border border-border/50">
          <p className="text-xs font-medium mb-2">Preview Reframe:</p>
          <div className="text-xs text-muted-foreground">
            Original video will be reframed to <strong>{aspectRatio}</strong> using <strong>{cropMode}</strong> crop mode
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !videoFile}
        className="w-full gap-2 bg-gradient-to-r from-[#DC143C] to-[#8B0000] hover:from-[#8B0000] hover:to-[#DC143C]"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Reframing Video...
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4" />
            Reframe Video - Smart Crop
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~10-15 credits · ⏱️ Processing time: 1-2 min
      </p>
    </div>
  );
}

// =============================================================================
// TAB 3: VIDEO UPSCALE (AI Upscaling)
// =============================================================================

function VideoUpscaleTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<2 | 4 | 8>(2);
  const [outputFormat, setOutputFormat] = useState('mp4');
  const [fileError, setFileError] = useState<string | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      setFileError(`Please select a valid video file (MP4, MOV, or WEBM)`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setFileError(`Video must be under ${MAX_VIDEO_SIZE_MB}MB. Your file is ${fileSizeMB}MB`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      setError('Please upload a video');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://l9zm95wyxb.execute-api.us-east-1.amazonaws.com/v1';

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('scaleFactor', scaleFactor.toString());
      formData.append('outputFormat', outputFormat);

      const response = await fetch(`${apiUrl}/api/video/upscale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upscale video: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.video_url,
        taskId: data.task_id,
        provider: 'Wryda AI Premium',
        type: 'Video Upscale'
      });

    } catch (err: any) {
      console.error('[VideoUpscale] Error:', err);
      setError(err.message || 'Failed to upscale video');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Video Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">📹 Upload Video</label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleVideoChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => videoInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {videoFile ? videoFile.name : 'Choose Video File'}
        </Button>
        {fileError && (
          <p className="text-xs text-red-500 mt-1">{fileError}</p>
        )}
        {videoPreview && (
          <video
            src={videoPreview}
            controls
            className="w-full mt-3 rounded-lg border border-border"
            style={{ maxHeight: '200px' }}
          />
        )}
      </div>

      {/* Scale Factor */}
      <div>
        <label className="text-sm font-medium mb-2 block">⬆️ Upscale Factor</label>
        <div className="grid grid-cols-3 gap-2">
          {[2, 4, 8].map((factor) => (
            <button
              key={factor}
              onClick={() => setScaleFactor(factor as 2 | 4 | 8)}
              disabled={isProcessing}
              className={`
                p-3 rounded-lg border-2 transition-all text-center
                ${scaleFactor === factor
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-2xl font-bold">{factor}×</div>
              <div className="text-xs text-muted-foreground mt-1">
                {factor === 2 && '720p → 1440p'}
                {factor === 4 && '720p → 2880p'}
                {factor === 8 && '720p → 5760p'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label className="text-sm font-medium mb-2 block">📦 Output Format</label>
        <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isProcessing}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4 (H.264) - Universal</SelectItem>
            <SelectItem value="mov">MOV (ProRes) - Professional</SelectItem>
            <SelectItem value="webm">WEBM (VP9) - Web Optimized</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-md bg-orange-500/10 border border-orange-500/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-orange-500 mt-0.5" />
          <div className="text-xs text-orange-600 dark:text-orange-400">
            <p className="font-medium mb-1">⚡ Upscaling Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Higher scale factors take longer (8× can take 10+ min)</li>
              <li>Best results with clean source video</li>
              <li>File size increases significantly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !videoFile}
        className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Upscaling Video...
          </>
        ) : (
          <>
            <ArrowUpCircle className="w-4 h-4" />
            Upscale Video {scaleFactor}× - Premium
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~{scaleFactor === 2 ? '50' : scaleFactor === 4 ? '100' : '150'} credits · 
        ⏱️ Processing time: {scaleFactor === 2 ? '3-5' : scaleFactor === 4 ? '5-8' : '10-15'} min
      </p>
    </div>
  );
}

// =============================================================================
// TAB 4: CHARACTER ANIMATION (AI Animation)
// =============================================================================

function CharacterAnimateTab({ isProcessing, setIsProcessing, setResult, setError }: TabProps) {
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [drivingVideo, setDrivingVideo] = useState<File | null>(null);
  const [drivingPreview, setDrivingPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setImageError(`Please select a valid image file (JPG, PNG, or WEBP)`);
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setImageError(`Image must be under ${MAX_IMAGE_SIZE_MB}MB. Your file is ${fileSizeMB}MB`);
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    if (characterPreview && characterPreview.startsWith('blob:')) {
      URL.revokeObjectURL(characterPreview);
    }

    setCharacterImage(file);
    const objectUrl = URL.createObjectURL(file);
    setCharacterPreview(objectUrl);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError(null);

    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      setVideoError(`Please select a valid video file (MP4, MOV, or WEBM)`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setVideoError(`Video must be under ${MAX_VIDEO_SIZE_MB}MB. Your file is ${fileSizeMB}MB`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (drivingPreview && drivingPreview.startsWith('blob:')) {
      URL.revokeObjectURL(drivingPreview);
    }

    setDrivingVideo(file);
    const objectUrl = URL.createObjectURL(file);
    setDrivingPreview(objectUrl);
  };

  const handleSubmit = async () => {
    if (!characterImage || !drivingVideo) {
      setError('Please upload both a character image and driving video');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://l9zm95wyxb.execute-api.us-east-1.amazonaws.com/v1';

      const formData = new FormData();
      formData.append('characterImage', characterImage);
      formData.append('drivingVideo', drivingVideo);

      const response = await fetch(`${apiUrl}/api/video/animate-character`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to animate character: ${response.statusText}`);
      }

      const data = await response.json();
      
      setResult({
        url: data.video_url,
        taskId: data.task_id,
        provider: 'Wryda AI Premium',
        type: 'Character Animation'
      });

    } catch (err: any) {
      console.error('[CharacterAnimate] Error:', err);
      setError(err.message || 'Failed to animate character');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Character Image Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">🖼️ Character Image</label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => imageInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {characterImage ? characterImage.name : 'Upload Character Image'}
        </Button>
        {imageError && (
          <p className="text-xs text-red-500 mt-1">{imageError}</p>
        )}
        {characterPreview && (
          <img
            src={characterPreview}
            alt="Character"
            className="w-full mt-3 rounded-lg border border-border"
            style={{ maxHeight: '200px', objectFit: 'contain' }}
          />
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Portrait or full-body shot works best
        </p>
      </div>

      {/* Driving Video Upload */}
      <div>
        <label className="text-sm font-medium mb-2 block">🎬 Driving Video</label>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleVideoChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => videoInputRef.current?.click()}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="w-4 h-4" />
          {drivingVideo ? drivingVideo.name : 'Upload Driving Video'}
        </Button>
        {videoError && (
          <p className="text-xs text-red-500 mt-1">{videoError}</p>
        )}
        {drivingPreview && (
          <video
            src={drivingPreview}
            controls
            className="w-full mt-3 rounded-lg border border-border"
            style={{ maxHeight: '200px' }}
          />
        )}
        <p className="text-xs text-muted-foreground mt-1">
          The character will mimic the motion in this video
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-500 mt-0.5" />
          <div className="text-xs text-purple-600 dark:text-purple-400">
            <p className="font-medium mb-1">🎭 Animation Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Best results with clear facial features</li>
              <li>Driving video should have similar pose/angle</li>
              <li>Output matches driving video duration</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !characterImage || !drivingVideo}
        className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Animating Character...
          </>
        ) : (
          <>
            <User className="w-4 h-4" />
            Animate Character - Premium
          </>
        )}
      </Button>

      {/* Cost Info */}
      <p className="text-xs text-center text-muted-foreground">
        💳 Est. cost: ~75-100 credits · ⏱️ Processing time: 3-5 min
      </p>
    </div>
  );
}

export default EnhancementStudio;

