'use client';

/**
 * Scene Builder Panel - Feature 0062
 * 
 * Standalone Scene Builder for Production page (/app/production).
 * Generates complete scene packages (4-7 videos) with perfect consistency.
 * 
 * Features:
 * - Scene description input (screenplay or plain English)
 * - Character reference upload (1-3 images)
 * - Quality tier selection (Professional/Premium)
 * - Audio toggle with safety warning
 * - Real-time progress tracking
 * - Generation history
 * - Asset library for timeline integration
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Upload,
  X,
  Play,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  ArrowRight,
  Film,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { SceneBuilderProgress } from '@/components/video/SceneBuilderProgress';
import { SceneBuilderDecisionModal } from '@/components/video/SceneBuilderDecisionModal';
import { PartialDeliveryModal } from '@/components/video/PartialDeliveryModal';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { MediaUploadSlot } from '@/components/production/MediaUploadSlot';
import { extractS3Key } from '@/utils/s3';

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface SceneBuilderPanelProps {
  projectId: string;
  onVideoGenerated?: (videos: GeneratedVideo[]) => void;
  isMobile?: boolean;       // NEW: Feature 0069
  simplified?: boolean;     // NEW: Feature 0069
}

interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  clipType: string;
  creditsUsed: number;
  duration: number;
}

interface GenerationHistoryItem {
  id: string;
  sceneDescription: string;
  characterReferences: string[];
  qualityTier: 'professional' | 'premium';
  enableSound: boolean;
  createdAt: string;
  status: 'completed' | 'failed';
  workflowExecutionId: string;
  outputs: GeneratedVideo[];
  totalCredits: number;
}

interface WorkflowStatus {
  id: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  stepResults: any[];
  totalCreditsUsed: number;
  finalOutputs: any[];
  videos?: string[];  // Optional: URLs of generated videos
  metadata?: any;
}

export function SceneBuilderPanel({ projectId, onVideoGenerated, isMobile = false, simplified = false }: SceneBuilderPanelProps) {
  // Form state
  const [sceneDescription, setSceneDescription] = useState('');
  const [referenceImages, setReferenceImages] = useState<(File | null)[]>([null, null, null]);
  const [qualityTier, setQualityTier] = useState<'professional' | 'premium'>('professional');
  const [duration, setDuration] = useState('5s');
  const [enableSound, setEnableSound] = useState(false);
  
  // Media uploads state (Feature 0070)
  const [mediaUploads, setMediaUploads] = useState<(File | null)[]>([null, null, null]);
  const [uploadingMedia, setUploadingMedia] = useState<boolean[]>([false, false, false]);
  
  // Force defaults on mobile (Feature 0069)
  useEffect(() => {
    if (isMobile || simplified) {
      setQualityTier('professional');  // Force Professional on mobile
      setDuration('5s');                // Force 5s on mobile
      setEnableSound(false);            // Force audio off on mobile
    }
  }, [isMobile, simplified]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowExecutionId, setWorkflowExecutionId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showPartialDeliveryModal, setShowPartialDeliveryModal] = useState(false);
  const [partialDeliveryData, setPartialDeliveryData] = useState<any>(null);
  
  // History state
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  
  // Storage modal state (Feature 0066)
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    s3Key: string;
    name: string;
    type: 'video' | 'image' | 'composition';
  } | null>(null);
  
  // Load history from localStorage on mount
  useEffect(() => {
    loadHistory();
  }, [projectId]);
  
  // Poll workflow status every 3 seconds
  useEffect(() => {
    if (!workflowExecutionId || !isGenerating) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowExecutionId}`);
        const data = await response.json();
        
        if (data.success) {
          setWorkflowStatus(data.execution);
          
          // Check if awaiting user decision
          if (data.execution.status === 'awaiting_user_decision') {
            setShowDecisionModal(true);
            setIsGenerating(false);
          }
          
          // Check if partial delivery (Premium tier - dialog rejected)
          if (data.execution.status === 'partial_delivery') {
            await handlePartialDelivery(data.execution);
            clearInterval(interval);
          }
          
          // Check if completed
          if (data.execution.status === 'completed') {
            handleGenerationComplete(data.execution);
            clearInterval(interval);
          }
          
          // Check if failed
          if (data.execution.status === 'failed') {
            handleGenerationFailed(data.execution);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('[SceneBuilderPanel] Failed to poll workflow:', error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [workflowExecutionId, isGenerating]);
  
  /**
   * Load generation history from localStorage
   */
  function loadHistory() {
    try {
      const stored = localStorage.getItem(`scene-builder-history-${projectId}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Failed to load history:', error);
    }
  }
  
  /**
   * Save history to localStorage
   */
  function saveHistory(newItem: GenerationHistoryItem) {
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem(`scene-builder-history-${projectId}`, JSON.stringify(updated));
  }
  
  /**
   * Start Scene Builder generation
   */
  async function handleGenerate() {
    if (!sceneDescription.trim()) {
      toast.error('Please enter a scene description');
      return;
    }
    
    setIsGenerating(true);
    setWorkflowStatus(null);
    
    try {
      // Upload character reference images if any
      const referenceImageUrls: string[] = [];
      const uploadedImages = referenceImages.filter(img => img !== null) as File[];
      
      if (uploadedImages.length > 0) {
        toast.info('Uploading character references...');
        
        for (const file of uploadedImages) {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('projectId', projectId);
          
          const uploadRes = await fetch('/api/media/upload-image', {
            method: 'POST',
            body: formData
          });
          
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            referenceImageUrls.push(uploadData.url);
          }
        }
      }
      
      // Start workflow execution
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: 'complete-scene',
          inputs: {
            sceneDescription: sceneDescription.trim(),
            characterReferences: referenceImageUrls,
            qualityTier,
            aspectRatio: '16:9',
            duration,
            enableSound,
            userId: 'default-user', // TODO: Get from auth
            projectId
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.executionId) {
        setWorkflowExecutionId(data.executionId);
        toast.success('Scene Builder started!', {
          description: 'Generating your complete scene package...'
        });
      } else {
        throw new Error(data.message || 'Failed to start workflow');
      }
      
    } catch (error) {
      console.error('[SceneBuilderPanel] Generation failed:', error);
      toast.error('Failed to start generation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsGenerating(false);
    }
  }
  
  /**
   * Handle user decision (continue without audio / cancel)
   */
  async function handleDecisionContinue() {
    if (!workflowExecutionId) return;
    
    setShowDecisionModal(false);
    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/workflows/${workflowExecutionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'continue' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Continuing without audio...');
      } else {
        throw new Error(data.message || 'Failed to continue');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Decision failed:', error);
      toast.error('Failed to continue workflow');
      setIsGenerating(false);
    }
  }
  
  async function handleDecisionCancel() {
    if (!workflowExecutionId) return;
    
    setShowDecisionModal(false);
    
    try {
      const response = await fetch(`/api/workflows/${workflowExecutionId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'cancel' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.info('Generation cancelled (no charges)');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Cancel failed:', error);
    }
    
    setIsGenerating(false);
    setWorkflowExecutionId(null);
    setWorkflowStatus(null);
  }
  
  /**
   * Handle media upload with storage integration (Feature 0070)
   */
  async function handleMediaUpload(index: number, file: File) {
    try {
      // Set uploading state
      const newUploadingState = [...uploadingMedia];
      newUploadingState[index] = true;
      setUploadingMedia(newUploadingState);
      
      // Determine file type and endpoint
      const fileType = file.type.startsWith('video/') ? 'video' : 
                       file.type.startsWith('audio/') ? 'video' : 'image';
      const endpoint = fileType === 'video' ? '/api/video/upload' : '/api/media/upload-image';
      
      // Upload to S3
      const formData = new FormData();
      formData.append(fileType, file);
      formData.append('projectId', projectId);
      
      toast.info('Uploading...');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        const newUploads = [...mediaUploads];
        newUploads[index] = file;
        setMediaUploads(newUploads);
        
        // Show storage decision modal
        setSelectedAsset({
          url: data.url,
          s3Key: data.s3Key || extractS3Key(data.url),
          name: file.name,
          type: fileType as 'video' | 'image'
        });
        setShowStorageModal(true);
        
        toast.success('✅ File uploaded! Choose where to save it.');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('[SceneBuilderPanel] Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      // Clear uploading state
      const newUploadingState = [...uploadingMedia];
      newUploadingState[index] = false;
      setUploadingMedia(newUploadingState);
    }
  }
  
  /**
   * Handle media removal
   */
  function handleRemoveMedia(index: number) {
    const newUploads = [...mediaUploads];
    newUploads[index] = null;
    setMediaUploads(newUploads);
  }
  
  /**
   * Send generated videos to Timeline (Feature 0070)
   */
  function handleSendToTimeline(historyItem: GenerationHistoryItem) {
    const clipsData = historyItem.outputs.map((output, index) => ({
      url: output.url,
      type: 'video',
      name: `${historyItem.sceneDescription.substring(0, 20)}_${index + 1}.mp4`
    }));
    
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    window.location.href = `/app/timeline?preloadClips=${encoded}`;
    
    toast.success(`✅ Sent ${clipsData.length} videos to Timeline!`, {
      description: 'Your clips are ready to edit'
    });
  }
  
  /**
   * Handle generation completion
   */
  
  /**
   * Handle partial delivery (Premium tier - dialog rejected)
   * USER-FACING: Simple message, no technical details
   */
  async function handlePartialDelivery(execution: WorkflowStatus) {
    setIsGenerating(false);
    
    try {
      // Fetch partial delivery details
      const response = await fetch(`/api/workflows/${execution.id}/partial-delivery`);
      
      const data = await response.json();
      
      if (data.success && data.partialDelivery) {
        // Set partial delivery data for modal
        setPartialDeliveryData({
          deliveredVideo: {
            url: data.partialDelivery.deliveredAssets[0]?.url || (execution.videos && execution.videos[0]) || '',
            s3Key: data.partialDelivery.deliveredAssets[0]?.s3Key || ''
          },
          pricing: {
            original: data.partialDelivery.pricing.originalCharge,
            charged: data.partialDelivery.pricing.actualCharge,
            refunded: data.partialDelivery.pricing.refundAmount
          },
          rejectionReason: data.partialDelivery.rejectionReason
        });
        
        // Show the partial delivery modal
        setShowPartialDeliveryModal(true);
        
        // Show success toast (simple message)
        toast.success('Premium Quality Master Scene Delivered', {
          description: `Charged ${data.partialDelivery.pricing.actualCharge} credits. Refunded ${data.partialDelivery.pricing.refundAmount} credits.`
        });
        
      } else {
        // Fallback if API fails
        toast.info('Scene delivered with partial results');
      }
      
    } catch (error) {
      console.error('[SceneBuilderPanel] Error fetching partial delivery details:', error);
      toast.info('Your master scene has been delivered');
    }
  }
  
  function handleGenerationComplete(execution: WorkflowStatus) {
    setIsGenerating(false);
    
    // Create history item
    const historyItem: GenerationHistoryItem = {
      id: execution.id,
      sceneDescription,
      characterReferences: referenceImages.filter(img => img !== null).map((_, i) => `char-${i}`),
      qualityTier,
      enableSound,
      createdAt: new Date().toISOString(),
      status: 'completed',
      workflowExecutionId: execution.id,
      outputs: execution.finalOutputs.map((output: any) => ({
        id: output.id || `output-${Date.now()}`,
        url: output.videoUrl,
        thumbnailUrl: output.thumbnailUrl || output.videoUrl,
        clipType: output.clipType || 'unknown',
        creditsUsed: output.creditsUsed || 0,
        duration: output.duration || 5
      })),
      totalCredits: execution.totalCreditsUsed
    };
    
    saveHistory(historyItem);
    
    // Show success with multiple action options
    toast.success(`Scene Builder complete! 🎉`, {
      description: `${execution.finalOutputs.length} videos generated (${execution.totalCreditsUsed} credits)`,
      duration: 15000 // Show for 15 seconds
    });
    
    // Show follow-up options toast
    setTimeout(() => {
      handleShowNextStepOptions(historyItem.outputs);
    }, 500);
    
    // NEW (Feature 0066): Show storage modal for first video
    if (historyItem.outputs.length > 0) {
      const firstVideo = historyItem.outputs[0];
      setSelectedAsset({
        url: firstVideo.url,
        s3Key: extractS3Key(firstVideo.url),
        name: `scene_video_${Date.now()}.mp4`,
        type: 'video'
      });
      // Delay modal slightly so toast appears first
      setTimeout(() => {
        setShowStorageModal(true);
      }, 2000);
    }
    
    // Reset form
    setSceneDescription('');
    setReferenceImages([null, null, null]);
    setWorkflowExecutionId(null);
    setWorkflowStatus(null);
    
    // Callback
    if (onVideoGenerated) {
      onVideoGenerated(historyItem.outputs);
    }
  }
  
  /**
   * Show next step options after generation
   */
  function handleShowNextStepOptions(videos: GeneratedVideo[]) {
    // Encode videos for URL params
    const clipsData = videos.map((video, index) => ({
      url: video.url,
      type: 'video',
      name: `scene_${index + 1}.mp4`
    }));
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    
    toast.info('✨ What would you like to do next?', {
      description: 'Choose how to continue with your generated videos',
      duration: 20000, // 20 seconds
      action: {
        label: 'View Options',
        onClick: () => {} // Keep toast open
      }
    });
    
    // Show detailed options toast after a brief delay
    setTimeout(() => {
      toast.custom((t) => (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-border p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            <div>
              <h3 className="font-bold text-lg">Next Steps</h3>
              <p className="text-sm text-muted-foreground">Choose your workflow</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Composition First */}
            <button
              onClick={() => {
                window.location.href = `/app/composition?preloadClips=${encoded}`;
              }}
              className="w-full p-3 rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded">
                  <span className="text-white text-lg">🎨</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Composition Studio</div>
                  <div className="text-xs text-muted-foreground">Apply layouts, effects, and transitions first</div>
                </div>
              </div>
            </button>
            
            {/* Timeline Direct */}
            <button
              onClick={() => {
                window.location.href = `/app/timeline?preloadClips=${encoded}`;
              }}
              className="w-full p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded">
                  <span className="text-white text-lg">⏱️</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Timeline Editor</div>
                  <div className="text-xs text-muted-foreground">Go directly to 8-track editing</div>
                </div>
              </div>
            </button>
            
            {/* Add Audio */}
            <button
              onClick={() => {
                window.location.href = '/app/production-hub?tab=audio';
              }}
              className="w-full p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded">
                  <span className="text-white text-lg">🎵</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Add Audio</div>
                  <div className="text-xs text-muted-foreground">Music or sound effects (Suno/ElevenLabs)</div>
                </div>
              </div>
            </button>
            
            {/* Stay Here */}
            <button
              onClick={() => {
                toast.dismiss(t);
              }}
              className="w-full p-2 rounded-lg border border-border hover:bg-muted transition-colors text-center text-sm text-muted-foreground"
            >
              Stay here and generate more
            </button>
          </div>
        </div>
      ), { duration: Infinity });
    }, 1000);
  }
  
  /**
   * Handle generation failure
   */
  function handleGenerationFailed(execution: WorkflowStatus) {
    setIsGenerating(false);
    
    toast.error('Scene Builder failed', {
      description: 'Some steps could not be completed'
    });
    
    setWorkflowExecutionId(null);
    setWorkflowStatus(null);
  }
  
  /**
   * Calculate credit estimate
   */
  function calculateEstimate(): number {
    const hasCharacterRefs = referenceImages.some(img => img !== null);
    const baseCredits = hasCharacterRefs ? 125 : 100; // Master + 3 angles
    const premiumCredits = qualityTier === 'premium' ? 100 : 0; // 4K upscaling
    return baseCredits + premiumCredits;
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🎪</span>
          <div>
            <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">Scene Builder</h2>
            <p className="text-sm text-muted-foreground">
              Generate complete scene packages with perfect consistency
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Scene Builder Form */}
        {!isGenerating && !workflowStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Scene Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📝 Scene Description</CardTitle>
                <CardDescription>
                  Describe your scene in screenplay format or plain English
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={`Example:\n\nINT. COFFEE SHOP - DAY\n\nDetective SARAH interviews nervous suspect across table.\nSteam rises from coffee cups. Tense silence.\n\nOr just: "A detective interviewing someone in a coffee shop"`}
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  rows={8}
                  maxLength={500}
                  className="font-mono text-sm"
                />
                <div className="text-xs text-muted-foreground mt-2 text-right">
                  {sceneDescription.length}/500 characters
                </div>
              </CardContent>
            </Card>
            
            {/* Character References */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎭 Character References (Optional)</CardTitle>
                <CardDescription>
                  {isMobile || simplified 
                    ? 'Upload 1 character image for consistency'
                    : 'Upload 1-3 images for consistent character appearance'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${isMobile || simplified ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {/* Mobile: Show only 1 upload slot | Desktop: Show 3 slots */}
                  {(isMobile || simplified ? [0] : [0, 1, 2]).map((index) => {
                    const file = referenceImages[index];
                    const preview = file ? URL.createObjectURL(file) : null;
                    
                    return (
                      <div key={index}>
                        {preview ? (
                          <div className="relative">
                            <img
                              src={preview}
                              alt={`Character ${index + 1}`}
                              className={`w-full object-cover rounded border-2 border-purple-500 ${isMobile || simplified ? 'h-48' : 'h-32'}`}
                            />
                            <button
                              onClick={() => {
                                const newImages = [...referenceImages];
                                newImages[index] = null;
                                setReferenceImages(newImages);
                              }}
                              className="absolute top-2 right-2 p-1 bg-background/90 rounded-full hover:bg-background shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="text-xs text-center text-muted-foreground mt-2 font-medium">
                              Character {isMobile || simplified ? 'Reference' : index + 1}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = SUPPORTED_IMAGE_TYPES.join(',');
                              input.onchange = (e: any) => {
                                const selectedFile = e.target?.files?.[0];
                                if (selectedFile) {
                                  if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
                                    toast.error(`Image too large. Max ${MAX_IMAGE_SIZE_MB}MB`);
                                    return;
                                  }
                                  if (!SUPPORTED_IMAGE_TYPES.includes(selectedFile.type)) {
                                    toast.error('Unsupported format. Use JPG, PNG, GIF, or WebP.');
                                    return;
                                  }
                                  const newImages = [...referenceImages];
                                  newImages[index] = selectedFile;
                                  setReferenceImages(newImages);
                                }
                              };
                              input.click();
                            }}
                            className={`w-full border-2 border-dashed border-border rounded flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors ${isMobile || simplified ? 'h-48' : 'h-32'}`}
                          >
                            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {isMobile || simplified ? 'Upload Character' : `Character ${index + 1}`}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Show different tip for mobile vs desktop */}
                {isMobile || simplified ? (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      💻 <strong>Desktop Only:</strong> Upload up to 3 character references for more consistency
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      💡 <strong>With character refs:</strong> 4 videos (establishing + 3 character angles)<br />
                      <strong>Without character refs:</strong> 4 videos (establishing + 3 scene variations)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Media Uploads (Optional) - Feature 0070 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📁 Media Uploads (Optional)</CardTitle>
                <CardDescription>
                  {isMobile || simplified 
                    ? 'Upload 1 video, audio, or image file to include in your scene'
                    : 'Upload up to 3 media files (video, audio, images) to include in your scene'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${isMobile || simplified ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {(isMobile || simplified ? [0] : [0, 1, 2]).map((index) => (
                    <MediaUploadSlot
                      key={index}
                      index={index}
                      file={mediaUploads[index]}
                      onUpload={(file) => handleMediaUpload(index, file)}
                      onRemove={() => handleRemoveMedia(index)}
                      isMobile={isMobile || simplified}
                      uploading={uploadingMedia[index]}
                    />
                  ))}
                </div>
                
                {/* Show mobile tip */}
                {(isMobile || simplified) && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      💻 <strong>Desktop Only:</strong> Upload up to 3 media files simultaneously
                    </p>
                  </div>
                )}
                
                {/* General tip */}
                <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    💡 <strong>Tip:</strong> Uploaded media can be used as reference material or incorporated directly into your generated scene
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚙️ Generation Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quality Tier */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quality Tier</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setQualityTier('professional')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        qualityTier === 'professional'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                          : 'border-border hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">Professional 1080p</div>
                      <div className="text-xs text-muted-foreground mt-1">100-125 credits</div>
                    </button>
                    
                    <button
                      onClick={() => setQualityTier('premium')}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        qualityTier === 'premium'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                          : 'border-border hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-sm flex items-center gap-2">
                        Premium 4K
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">200-225 credits</div>
                    </button>
                  </div>
                </div>
                
                {/* Duration */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Duration</Label>
                  <div className="flex gap-2">
                    {['4s', '5s', '6s', '8s', '10s'].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setDuration(dur)}
                        className={`flex-1 py-2 px-3 rounded border text-sm font-medium transition-all ${
                          duration === dur
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-background border-border hover:border-purple-300'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Audio Toggle */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSound}
                      onChange={(e) => setEnableSound(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Generate Sound/Music</div>
                      <div className="text-xs text-muted-foreground">
                        Add audio to your scene (stricter content guidelines apply)
                      </div>
                    </div>
                  </label>
                  
                  {enableSound && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 dark:text-amber-400">
                          <div className="font-medium mb-1">Audio Pre-Check</div>
                          <div>
                            We&apos;ll validate your scene with audio first. If rejected due to content guidelines,
                            you&apos;ll choose to continue without audio or cancel at no charge.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Generate Button */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium opacity-90">Estimated Cost</div>
                    <div className="text-3xl font-bold">{calculateEstimate()} credits</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Estimated Time</div>
                    <div className="text-xl font-semibold">8-15 min</div>
                  </div>
                </div>
                
                <Button
                  onClick={handleGenerate}
                  disabled={!sceneDescription.trim() || isGenerating}
                  className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold text-lg h-12"
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Complete Scene
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Progress Tracking */}
        {(isGenerating || workflowStatus) && workflowStatus && (
          <SceneBuilderProgress 
            executionId={workflowStatus.id}
            status={workflowStatus.status as 'idle' | 'running' | 'completed' | 'failed' | 'awaiting_user_decision' | 'cancelled'}
            currentStep={workflowStatus.currentStep}
            totalSteps={workflowStatus.totalSteps}
            stepResults={workflowStatus.stepResults}
            totalCreditsUsed={workflowStatus.totalCreditsUsed || 0}
          />
        )}
        
        {/* Generation History */}
        {!isGenerating && !workflowStatus && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent Generations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showHistory && (
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail Grid */}
                        <div className="grid grid-cols-2 gap-1 w-32 h-32 flex-shrink-0">
                          {item.outputs.slice(0, 4).map((video, idx) => (
                            <img
                              key={idx}
                              src={video.thumbnailUrl}
                              alt={video.clipType}
                              className="w-full h-full object-cover rounded"
                            />
                          ))}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 mb-2">
                            {item.sceneDescription}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              {item.outputs.length} videos
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {item.totalCredits} credits
                            </span>
                            <Badge variant={item.qualityTier === 'premium' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                              {item.qualityTier}
                            </Badge>
                            {item.enableSound && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                🔊 Audio
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="text-xs h-7"
                              onClick={() => {
                                if (item.outputs.length > 0) {
                                  const firstVideo = item.outputs[0];
                                  setSelectedAsset({
                                    url: firstVideo.url,
                                    s3Key: extractS3Key(firstVideo.url),
                                    name: `scene_video_${Date.now()}.mp4`,
                                    type: 'video'
                                  });
                                  setShowStorageModal(true);
                                }
                              }}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="text-xs h-7"
                              onClick={() => handleSendToTimeline(item)}
                            >
                              <Film className="w-3 h-3 mr-1" />
                              Edit in Timeline
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Download className="w-3 h-3 mr-1" />
                              Download All
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Decision Modal */}
      <SceneBuilderDecisionModal
        isOpen={showDecisionModal}
        onContinue={handleDecisionContinue}
        onCancel={handleDecisionCancel}
        message={workflowStatus?.metadata?.message}
      />
      
      {/* Storage Decision Modal (Feature 0066) */}
      {showStorageModal && selectedAsset && (
        <StorageDecisionModal
          isOpen={showStorageModal}
          onClose={() => {
            setShowStorageModal(false);
            setSelectedAsset(null);
          }}
          assetType={selectedAsset.type}
          assetName={selectedAsset.name}
          s3TempUrl={selectedAsset.url}
          s3Key={selectedAsset.s3Key}
          fileSize={undefined}
          metadata={{}}
        />
      )}
      
      {/* Partial Delivery Modal (Feature 0077) */}
      {showPartialDeliveryModal && partialDeliveryData && (
        <PartialDeliveryModal
          isOpen={showPartialDeliveryModal}
          onClose={() => {
            setShowPartialDeliveryModal(false);
            setPartialDeliveryData(null);
          }}
          deliveredVideo={partialDeliveryData.deliveredVideo}
          pricing={partialDeliveryData.pricing}
          rejectionReason={partialDeliveryData.rejectionReason}
          onDownload={() => {
            // Download the master scene
            const link = document.createElement('a');
            link.href = partialDeliveryData.deliveredVideo.url;
            link.download = 'wryda-master-scene.mp4';
            link.click();
            toast.success('Downloading your Premium quality master scene');
          }}
          onRetry={() => {
            // Close modal and let user modify dialog
            setShowPartialDeliveryModal(false);
            setPartialDeliveryData(null);
            toast.info('Modify your scene dialog and try again');
          }}
        />
      )}
    </div>
  );
}

