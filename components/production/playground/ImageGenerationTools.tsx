'use client';

/**
 * Image Generation Tools
 * 
 * Pre-Production image generation with model selection.
 * Categories: Character, Location, Asset, First Frame
 */

import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { GenerationPreview } from './GenerationPreview';
import { uploadToObjectStorage } from '@/lib/objectStorageUpload';
import { MediaLibraryBrowser } from '@/components/production/CharacterStudio/MediaLibraryBrowser';
import type { MediaFile } from '@/types/media';
import { useInFlightWorkflowJobsStore } from '@/lib/inFlightWorkflowJobsStore';
import { downloadImageAsBlob } from '@/utils/imageDownload';

interface ImageGenerationToolsProps {
  className?: string;
}

interface ImageModel {
  id: string;
  provider: string;
  costPerImage: number;
  creditsPerImage: number;
  label?: string;
  description?: string;
}

interface ReferenceImage {
  id: string;
  preview: string;
  s3Key?: string;
  file?: File;
  source: 'upload' | 'library';
  label?: string;
}

interface CameraAngle {
  id: string;
  label: string;
  description: string;
  promptText: string; // Model-agnostic text
}

interface PersistedReferenceImage {
  id: string;
  s3Key?: string;
  preview?: string;
  source: 'upload' | 'library';
  label?: string;
}

type DirectImageAttemptStatus = 'queued' | 'running' | 'success' | 'failed';

interface DirectImageAttempt {
  id: string;
  jobId?: string;
  status: DirectImageAttemptStatus;
  message: string;
  at: string;
  imageUrl?: string;
  s3Key?: string;
  modelId?: string;
  aspectRatio?: string;
}

const resolveReferenceInputForRequest = (img: ReferenceImage): string | null => {
  if (img.s3Key && img.s3Key.trim().length > 0) {
    return img.s3Key.trim();
  }
  const preview = String(img.preview || '').trim();
  if (!preview || preview.startsWith('blob:') || preview.startsWith('data:')) {
    return null;
  }
  // Preferred stable proxy format: /api/media/file?key=<s3Key>
  if (preview.startsWith('/api/media/file?')) {
    try {
      const query = preview.includes('?') ? preview.split('?')[1] : '';
      const params = new URLSearchParams(query);
      const key = params.get('key');
      if (key && key.trim().length > 0) {
        return key.trim();
      }
    } catch {
      return null;
    }
  }
  // Fallback: provider/public URL can still be forwarded to backend resolvers.
  if (preview.startsWith('http://') || preview.startsWith('https://')) {
    return preview;
  }
  return null;
};

const DIRECT_HUB_ALLOWED_PROMPT_MODELS = new Set([
  'flux2-pro-2k',
  'flux2-pro-4k',
  'flux2-max-2k',
  'flux2-max-4k-16:9',
  'nano-banana-pro',
  'nano-banana-pro-2k',
]);

const DIRECT_HUB_ALLOWED_REFERENCE_MODELS = new Set([
  'flux2-pro-2k',
  'flux2-pro-4k',
  'flux2-max-2k',
  'flux2-max-4k-16:9',
  'nano-banana-pro',
  'nano-banana-pro-2k',
]);
const DIRECT_IMAGE_ATTEMPTS_RETENTION_MS = 12 * 60 * 60 * 1000;
const isWorkflowExecutionId = (value: unknown): boolean => {
  const jobId = String(value || '').trim();
  if (!jobId) return false;
  // Legacy client-side placeholder IDs used `job_<uuid>` and are not valid for /api/workflows/:id.
  if (jobId.startsWith('job_')) return false;
  return true;
};
const resolveImageS3Key = (image: any): string | undefined => {
  const raw =
    image?.s3Key ||
    image?.key ||
    image?.fileKey ||
    image?.media?.s3Key ||
    image?.media?.key;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
const resolveImageUrl = (image: any): string | undefined => {
  const imageS3Key = resolveImageS3Key(image);
  if (imageS3Key) {
    return `/api/media/file?key=${encodeURIComponent(imageS3Key)}`;
  }
  const raw = image?.imageUrl || image?.url || image?.s3Url;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function ImageGenerationTools({ className = '' }: ImageGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken } = useAuth();
  const addInFlightJob = useInFlightWorkflowJobsStore((state) => state.addJob);
  
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [models, setModels] = useState<ImageModel[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibraryBrowser, setShowMediaLibraryBrowser] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);
  const [pendingGenerationJobId, setPendingGenerationJobId] = useState<string | null>(null);
  const [isAwaitingGenerationJobId, setIsAwaitingGenerationJobId] = useState(false);
  const [generationStartedAtMs, setGenerationStartedAtMs] = useState<number | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<DirectImageAttempt[]>([]);
  const [attemptsHydrated, setAttemptsHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAttemptPollsRef = useRef<Set<string>>(new Set());
  const lastHydrateAtMsRef = useRef(0);
  const getImageGenDraftStorageKey = () => {
    if (!screenplayId) return null;
    return `direct-image-gen:draft:${screenplayId}`;
  };
  const getAttemptsStorageKey = () => {
    if (!screenplayId) return null;
    return `direct-image-gen:attempts:${screenplayId}`;
  };
  const getActiveGenerationStorageKey = () => {
    if (!screenplayId) return null;
    return `direct-image-gen:active-generation:${screenplayId}`;
  };

  const normalizeAttemptStatus = (status: unknown): DirectImageAttemptStatus => {
    const value = String(status || '').toLowerCase();
    if (value === 'queued') return 'queued';
    if (
      value === 'running' ||
      value === 'processing' ||
      value === 'pending' ||
      value === 'in_progress' ||
      value === 'submitted' ||
      value === 'starting' ||
      value === 'rendering' ||
      value === 'finalizing' ||
      value === 'generating' ||
      value === 'enhancing' ||
      value === 'accepted'
    ) {
      return 'running';
    }
    if (value === 'completed' || value === 'succeeded' || value === 'success') return 'success';
    return 'failed';
  };

  const upsertAttempt = (attempt: DirectImageAttempt) => {
    setRecentAttempts((prev) => {
      const existing = prev.find(
        (item) => item.id === attempt.id || (!!attempt.jobId && !!item.jobId && item.jobId === attempt.jobId)
      );
      const withoutExisting = prev.filter(
        (item) => item.id !== attempt.id && !(attempt.jobId && item.jobId && item.jobId === attempt.jobId)
      );
      const mergedAttempt: DirectImageAttempt = {
        ...existing,
        ...attempt,
        modelId: attempt.modelId ?? existing?.modelId,
        aspectRatio: attempt.aspectRatio ?? existing?.aspectRatio,
      };
      const now = Date.now();
      const next = [mergedAttempt, ...withoutExisting]
        .filter((item) => {
          const atMs = new Date(item.at || 0).getTime();
          return Number.isFinite(atMs) && now - atMs <= DIRECT_IMAGE_ATTEMPTS_RETENTION_MS;
        })
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 20);
      return next;
    });
  };

  const upsertAttemptFromWorkflowExecution = (execution: any) => {
    if (!execution) return;
    const jobId = String(execution.executionId || execution.jobId || '');
    if (!jobId) return;
    const status = normalizeAttemptStatus(execution.status);
    const outputs = execution.finalOutputs || {};
    const image = Array.isArray(outputs.images) && outputs.images.length > 0 ? outputs.images[0] : null;
    const imageS3Key = resolveImageS3Key(image);
    const imageUrl = resolveImageUrl(image);
    const errorMessage = execution.error?.userMessage || execution.error?.message || execution.error;
    const executionInput = execution.input || execution.inputs || execution.request || {};
    const modelId = String(
      executionInput.desiredModelId ||
      executionInput.modelId ||
      execution.modelId ||
      ''
    ).trim() || undefined;
    const executionAspectRatio = String(
      executionInput.aspectRatio ||
      execution.aspectRatio ||
      ''
    ).trim() || undefined;
    upsertAttempt({
      id: `job_${jobId}`,
      jobId,
      status,
      message:
        status === 'success'
          ? 'Image generated successfully.'
          : status === 'running' || status === 'queued'
            ? 'Image generation in progress...'
            : `Failed: ${String(errorMessage || 'generation error')}`,
      at: execution.completedAt || execution.updatedAt || execution.startedAt || new Date().toISOString(),
      imageUrl,
      s3Key: imageS3Key,
      modelId,
      aspectRatio: executionAspectRatio,
    });
  };

  const fetchWorkflowExecution = async (jobId: string) => {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) return null;
    const response = await fetch(`/api/workflows/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (response.status === 404) return { __notFound: true } as any;
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data?.execution || null;
  };

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        // Use API proxy route
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        
        const response = await apiModule.image.getModels();
        let modelsData = response.data?.models || response.data?.data?.models || [];
        
        // Keep Direct Hub image gen to the curated production-tested model set.
        modelsData = modelsData.filter((model: ImageModel) =>
          DIRECT_HUB_ALLOWED_PROMPT_MODELS.has(model.id)
        );
        
        // Sort by newest first (model release date), then most expensive second
        // Model release order (newest to oldest): gpt-image-1.5 > imagen-4-ultra > nano-banana-pro > flux2-max > flux2-pro > imagen-4 > gpt-image-1 > imagen-3 > runway-gen4-image
        const modelOrder: Record<string, number> = {
          'gpt-image-1.5': 1,
          'gpt-image-1-high': 1, // maps to 1.5
          'imagen-4-ultra': 2,
          'nano-banana-pro': 3,
          'nano-banana-pro-2k': 3,
          'flux2-max-4k-16:9': 4,
          'flux2-flex': 4,
          'flux2-pro-4k': 5,
          'flux2-pro-2k': 5,
          'imagen-4': 6,
          'imagen-4-fast': 6,
          'gpt-image-1': 7,
          'gpt-image-1-medium': 7,
          'gpt-image-1-mini': 8,
          'gpt-image-1-low': 8,
          'imagen-3': 9,
          'imagen-3-fast': 9,
          'runway-gen4-image': 10,
          'nano-banana': 11, // editing tool, oldest
        };
        
        modelsData.sort((a: ImageModel, b: ImageModel) => {
          const orderA = modelOrder[a.id] || 999;
          const orderB = modelOrder[b.id] || 999;
          if (orderA !== orderB) {
            return orderA - orderB; // Lower number = newer
          }
          // If same order, sort by credits (most expensive first)
          return (b.creditsPerImage || 0) - (a.creditsPerImage || 0);
        });
        
        setModels(modelsData);
        
        // Keep current model if still valid, otherwise select default prompt model.
        setSelectedModel((current) => {
          const currentValid = current && modelsData.some((model: ImageModel) => model.id === current);
          if (currentValid) return current;
          const preferred =
            modelsData.find((model: ImageModel) => model.id === 'flux2-pro-2k') ||
            modelsData.find((model: ImageModel) => model.id === 'nano-banana-pro-2k') ||
            modelsData[0];
          return preferred?.id || '';
        });
      } catch (error: any) {
        console.error('Failed to load image models:', error);
        toast.error('Failed to load image models');
      } finally {
        setIsLoadingModels(false);
      }
    };

    if (getToken) {
      fetchModels();
    }
  }, [getToken]);

  // Model-specific prompt hints and reference image instructions
  const getModelHints = (modelId: string): { promptHint: string; referenceHint: string } => {
    if (modelId.includes('nano-banana-pro')) {
      return {
        promptHint: 'Nano Banana Pro: Use detailed descriptions with specific details. Best for photorealistic characters and locations. Supports up to 14 reference images for maximum consistency.',
        referenceHint: 'Best practices: Upload 1-3 character reference images showing face and body. For locations, upload 1-2 reference images of similar settings. All images should be clear, well-lit, and show the subject prominently.'
      };
    }
    if (modelId.includes('runway-gen4')) {
      return {
        promptHint: 'Runway Gen-4: Use simple, direct prompts. Focus on subject + action + style. Best for cinematic first frames. Supports up to 3 reference images.',
        referenceHint: 'Best practices: Upload 1-3 reference images. First image gets highest priority. Use clear, front-facing images for best results. Combine character + clothing in one image when possible to maximize reference slots.'
      };
    }
    if (modelId.includes('flux2')) {
      return {
        promptHint: 'FLUX.2: Use structured prompts: Subject + Action + Style + Context. Supports color hex codes (e.g., "color #FF0000"). Supports up to 8 reference images. Best for high-quality, detailed images.',
        referenceHint: 'Best practices: Upload 1-8 reference images. First image is most important. Use high-quality, well-composed images. FLUX.2 excels at maintaining fine details and textures from references.'
      };
    }
    if (modelId.includes('gpt-image-1')) {
      return {
        promptHint: 'GPT Image: Use natural language descriptions. Best for creative and artistic images. Supports up to 5 reference images. Excellent text understanding.',
        referenceHint: 'Best practices: Upload 1-5 reference images. Use clear, well-lit images. GPT Image models excel at understanding context and maintaining style consistency.'
      };
    }
    if (modelId.includes('imagen')) {
      return {
        promptHint: 'Imagen: Use detailed, specific prompts. Best for photorealistic images. Focus on subject, setting, lighting, and style.',
        referenceHint: 'Imagen models do not support reference images. Use detailed text descriptions instead.'
      };
    }
    return {
      promptHint: 'Use clear, descriptive prompts with specific details about subject, style, lighting, and composition.',
      referenceHint: 'This model may not support reference images. Check model documentation for details.'
    };
  };

  // Check if selected model supports reference images
  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const supportsReferenceImages = !!selectedModelInfo && DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(selectedModelInfo.id);
  
  // Get reference limit based on model
  const getReferenceLimit = (): number => {
    if (!selectedModelInfo) return 0;
    if (selectedModelInfo.id.includes('nano-banana-pro')) return 14;
    if (selectedModelInfo.id.includes('flux2')) return 8;
    return 0;
  };

  useEffect(() => {
    const limit = getReferenceLimit();
    if (limit <= 0 || referenceImages.length <= limit) return;
    setReferenceImages((prev) => {
      const toRemove = prev.slice(limit);
      toRemove.forEach((img) => {
        if (img.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      return prev.slice(0, limit);
    });
    toast.warning(`Reference list trimmed to ${limit} for selected model`);
  }, [selectedModelInfo?.id, referenceImages.length]);

  useEffect(() => {
    if (!selectedModel || models.length === 0 || referenceImages.length === 0) return;
    if (DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(selectedModel)) return;
    const fallbackModel =
      models.find((model) => model.id === 'nano-banana-pro-2k' && DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(model.id)) ||
      models.find((model) => DIRECT_HUB_ALLOWED_REFERENCE_MODELS.has(model.id));
    if (fallbackModel?.id) {
      setSelectedModel(fallbackModel.id);
      toast.info(`Switched model to ${fallbackModel.id} for reference-based generation`);
    }
  }, [selectedModel, models, referenceImages.length]);

  // Camera angles for image generation
  const cameraAngles: CameraAngle[] = [
    { id: '', label: 'None', description: 'No specific camera angle', promptText: '' },
    { id: 'wide-shot', label: 'Wide Shot', description: 'Establishing shot, shows full scene', promptText: 'wide shot, establishing shot, full scene visible' },
    { id: 'medium-shot', label: 'Medium Shot', description: 'Medium framing, shows subject and surroundings', promptText: 'medium shot, shows subject and surroundings' },
    { id: 'close-up', label: 'Close-Up', description: 'Tight framing on subject', promptText: 'close-up shot, tight framing on subject' },
    { id: 'extreme-close-up', label: 'Extreme Close-Up', description: 'Very tight framing, detail focus', promptText: 'extreme close-up, very tight framing, detail focus' },
    { id: 'low-angle', label: 'Low Angle', description: 'Camera looking up at subject', promptText: 'low angle shot, camera looking up at subject' },
    { id: 'high-angle', label: 'High Angle', description: 'Camera looking down at subject', promptText: 'high angle shot, camera looking down at subject' },
    { id: 'bird-eye', label: 'Bird\'s Eye View', description: 'Aerial view from above', promptText: 'bird\'s eye view, aerial shot from above' },
    { id: 'dutch-angle', label: 'Dutch Angle', description: 'Tilted camera, dynamic composition', promptText: 'dutch angle, tilted camera, dynamic composition' },
    { id: 'over-the-shoulder', label: 'Over-the-Shoulder', description: 'Shot from behind subject', promptText: 'over-the-shoulder shot, camera positioned behind subject' },
    { id: 'two-shot', label: 'Two-Shot', description: 'Frames two subjects together', promptText: 'two-shot, frames two subjects together' },
    { id: 'point-of-view', label: 'Point of View', description: 'First-person perspective', promptText: 'point of view shot, first-person perspective' },
  ];

  // Format camera angle for model-specific prompts
  const formatCameraAngleForModel = (angleId: string, modelId: string): string => {
    if (!angleId) return '';
    const angle = cameraAngles.find(a => a.id === angleId);
    if (!angle) return '';

    // Model-specific formatting
    if (modelId.includes('flux2')) {
      // FLUX.2: Use structured format
      return `, ${angle.promptText}, cinematic composition`;
    }
    if (modelId.includes('runway-gen4')) {
      // Runway: Simple, direct
      return `, ${angle.promptText}`;
    }
    if (modelId.includes('gpt-image-1')) {
      // GPT Image: Natural language
      return `, ${angle.promptText}`;
    }
    // Default: Just add the prompt text
    return `, ${angle.promptText}`;
  };

  const aspectRatios = [
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '4:3', label: '4:3 (Classic)' },
    { value: '21:9', label: '21:9 (Cinema)' },
  ];

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const limit = getReferenceLimit();
    if (limit <= 0) {
      toast.error('Selected model does not support reference images');
      return;
    }
    if (referenceImages.length + files.length > limit) {
      toast.error(`Maximum ${limit} reference images allowed for this model`);
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const newImages: ReferenceImage[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please upload image files only');
          continue;
        }

        // Create preview
        const preview = URL.createObjectURL(file);

        // Upload to S3
        const presignedResponse = await fetch(
          `/api/video/upload/get-presigned-url?` +
          `fileName=${encodeURIComponent(file.name)}` +
          `&fileType=${encodeURIComponent(file.type)}` +
          `&fileSize=${file.size}` +
          `&projectId=${encodeURIComponent(screenplayId || 'default')}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { url, fields, s3Key } = await presignedResponse.json();

        // Upload to object storage (S3 POST or R2 PUT)
        const s3Response = await uploadToObjectStorage(url, fields, file, {
          fileName: file.name,
          contentType: file.type,
        });

        if (!s3Response.ok) {
          throw new Error('S3 upload failed');
        }

        // Register uploaded reference in Media Library under System/Images/Uploads.
        try {
          await fetch('/api/media/register', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              screenplayId: screenplayId || 'default',
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              s3Key,
              metadata: {
                source: 'direct-image-reference-upload',
                uploadedFrom: 'direct-image-gen',
              },
            }),
          });
        } catch (registerError) {
          // Non-fatal: generation can still proceed with S3 key.
          console.warn('[ImageGenerationTools] Failed to register uploaded reference', registerError);
        }

        newImages.push({
          id: `upload-${s3Key || file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          file,
          preview,
          s3Key,
          source: 'upload',
          label: file.name,
        });
      }

      setReferenceImages(prev => [...prev, ...newImages]);
      toast.success(`${newImages.length} reference image(s) uploaded`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload reference images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => {
      const removed = prev[index];
      if (removed?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const setPrimaryReferenceImage = (index: number) => {
    if (index <= 0) return;
    setReferenceImages((prev) => {
      if (index >= prev.length) return prev;
      const reordered = [...prev];
      const [selected] = reordered.splice(index, 1);
      reordered.unshift(selected);
      return reordered;
    });
  };

  const clearReferenceImages = () => {
    setReferenceImages((prev) => {
      prev.forEach((img) => {
        if (img.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      return [];
    });
  };

  useEffect(() => {
    const storageKey = getAttemptsStorageKey();
    if (!storageKey || typeof window === 'undefined') {
      setRecentAttempts([]);
      setAttemptsHydrated(true);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const retained = (Array.isArray(parsed) ? parsed : [])
        .filter((item): item is DirectImageAttempt => !!item && typeof item === 'object')
        .filter((item) => {
          const atMs = new Date(item.at || 0).getTime();
          return Number.isFinite(atMs) && now - atMs <= DIRECT_IMAGE_ATTEMPTS_RETENTION_MS;
        })
        .slice(0, 20);
      setRecentAttempts(retained);
    } catch {
      setRecentAttempts([]);
    } finally {
      setAttemptsHydrated(true);
    }
  }, [screenplayId]);

  useEffect(() => {
    const storageKey = getAttemptsStorageKey();
    if (!storageKey || typeof window === 'undefined' || !attemptsHydrated) return;
    const now = Date.now();
    const retained = recentAttempts
      .filter((item) => {
        const atMs = new Date(item.at || 0).getTime();
        return Number.isFinite(atMs) && now - atMs <= DIRECT_IMAGE_ATTEMPTS_RETENTION_MS;
      })
      .slice(0, 20);
    window.sessionStorage.setItem(storageKey, JSON.stringify(retained));
  }, [attemptsHydrated, recentAttempts, screenplayId]);

  useEffect(() => {
    const storageKey = getActiveGenerationStorageKey();
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { jobId?: string; startedAtMs?: number; awaitingJobId?: boolean };
      const restoredJobId = parsed?.jobId ? String(parsed.jobId).trim() : '';
      const startedAtMs = Number(parsed?.startedAtMs || 0);
      const awaitingJobId = parsed?.awaitingJobId === true;
      if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      // Guard stale timers from old sessions.
      if (Date.now() - startedAtMs > 24 * 60 * 60 * 1000) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      if (restoredJobId && isWorkflowExecutionId(restoredJobId)) {
        setGenerationStartedAtMs(startedAtMs);
        setGenerationTime((Date.now() - startedAtMs) / 1000);
        setPendingGenerationJobId(restoredJobId);
        setIsAwaitingGenerationJobId(false);
        setIsGenerating(true);
        return;
      }
      if (awaitingJobId && Date.now() - startedAtMs <= 2 * 60 * 1000) {
        setGenerationStartedAtMs(startedAtMs);
        setGenerationTime((Date.now() - startedAtMs) / 1000);
        setPendingGenerationJobId(null);
        setIsAwaitingGenerationJobId(true);
        setIsGenerating(true);
        return;
      }
      window.sessionStorage.removeItem(storageKey);
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [screenplayId]);

  useEffect(() => {
    const storageKey = getActiveGenerationStorageKey();
    if (!storageKey || typeof window === 'undefined') return;
    const hasValidPendingJobId = !!pendingGenerationJobId && isWorkflowExecutionId(pendingGenerationJobId);
    if (!isGenerating || !generationStartedAtMs || (!hasValidPendingJobId && !isAwaitingGenerationJobId)) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        jobId: hasValidPendingJobId ? pendingGenerationJobId : null,
        startedAtMs: generationStartedAtMs,
        awaitingJobId: isAwaitingGenerationJobId,
      })
    );
  }, [screenplayId, isGenerating, pendingGenerationJobId, generationStartedAtMs, isAwaitingGenerationJobId]);

  useEffect(() => {
    if (!isGenerating || !generationStartedAtMs) return;
    setGenerationTime((Date.now() - generationStartedAtMs) / 1000);
    const interval = window.setInterval(() => {
      setGenerationTime((Date.now() - generationStartedAtMs) / 1000);
    }, 250);
    return () => window.clearInterval(interval);
  }, [isGenerating, generationStartedAtMs]);

  useEffect(() => {
    if (!screenplayId || !attemptsHydrated) return;
    let cancelled = false;

    const pollJobUntilTerminal = (jobId: string) => {
      if (!isWorkflowExecutionId(jobId)) return;
      if (activeAttemptPollsRef.current.has(jobId)) {
        window.setTimeout(() => {
          if (!cancelled) {
            pollJobUntilTerminal(jobId);
          }
        }, 3000);
        return;
      }
      activeAttemptPollsRef.current.add(jobId);
      void (async () => {
        try {
          const startedAt = Date.now();
          while (!cancelled && Date.now() - startedAt < 20 * 60 * 1000) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            if (cancelled) return;
            const execution = await fetchWorkflowExecution(jobId);
            if (execution?.__notFound) return;
            if (!execution || cancelled) continue;
            upsertAttemptFromWorkflowExecution(execution);
            const status = normalizeAttemptStatus(execution.status);
            if (status === 'success' || status === 'failed') {
              if (status === 'success') {
                const outputs = execution.finalOutputs || {};
                const image = Array.isArray(outputs.images) && outputs.images.length > 0 ? outputs.images[0] : null;
                const imageUrl = resolveImageUrl(image);
                if (imageUrl) setGeneratedImageUrl(imageUrl);
              }
              return;
            }
          }
        } catch {
          // Non-fatal: attempts panel should remain resilient.
        } finally {
          activeAttemptPollsRef.current.delete(jobId);
        }
      })();
    };

    const hydrateRecentWorkflowJobs = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        const response = await fetch(
          `/api/workflows/executions?screenplayId=${encodeURIComponent(screenplayId)}&limit=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        if (!response.ok) return;
        const payload = await response.json();
        const jobs = Array.isArray(payload?.data?.jobs) ? payload.data.jobs : [];
        const imageJobs = jobs
          .filter((job: any) => job?.jobType === 'image-generation')
          .slice(0, 12);
        imageJobs.forEach((job: any) => {
            const mappedExecution = {
              executionId: job.jobId,
              status: job.status,
              startedAt: job.createdAt,
              completedAt: job.completedAt,
              error: job.error,
              input: job.input || job.inputs || job.request || {},
              modelId: job.modelId,
              aspectRatio: job.aspectRatio,
              finalOutputs: {
                images: Array.isArray(job?.results?.images) ? job.results.images : [],
              },
            };
            upsertAttemptFromWorkflowExecution(mappedExecution);
            const status = normalizeAttemptStatus(job.status);
            if (status === 'running' || status === 'queued') {
              pollJobUntilTerminal(String(job.jobId || ''));
            }
          });

        if (isGenerating && isAwaitingGenerationJobId && !pendingGenerationJobId && generationStartedAtMs) {
          const thresholdMs = generationStartedAtMs - 30_000;
          const candidate = imageJobs
            .filter((job: any) => isWorkflowExecutionId(job?.jobId))
            .filter((job: any) => {
              const jobCreatedAtMs = new Date(job?.createdAt || job?.startedAt || 0).getTime();
              return Number.isFinite(jobCreatedAtMs) && jobCreatedAtMs >= thresholdMs;
            })
            .sort((a: any, b: any) => {
              const bMs = new Date(b?.createdAt || b?.startedAt || 0).getTime();
              const aMs = new Date(a?.createdAt || a?.startedAt || 0).getTime();
              return bMs - aMs;
            })[0];

          if (candidate?.jobId) {
            setPendingGenerationJobId(String(candidate.jobId));
            setIsAwaitingGenerationJobId(false);
          } else if (Date.now() - generationStartedAtMs > 120_000) {
            upsertAttempt({
              id: `attempt_${Date.now()}`,
              status: 'failed',
              message: 'Failed: generation state could not be reconciled after refresh.',
              at: new Date().toISOString(),
              modelId: selectedModel || undefined,
              aspectRatio,
            });
            setIsGenerating(false);
            setPendingGenerationJobId(null);
            setIsAwaitingGenerationJobId(false);
            setGenerationStartedAtMs(null);
          }
        }

      } catch {
        // Silent fallback; recents media still works.
      }
    };

    const runHydrate = () => {
      const now = Date.now();
      if (now - lastHydrateAtMsRef.current < 10000) return;
      lastHydrateAtMsRef.current = now;
      void hydrateRecentWorkflowJobs();
    };

    runHydrate();
    const hydrateInterval = window.setInterval(runHydrate, 10000);
    const runningJobs = recentAttempts
      .filter((attempt) => attempt.jobId && (attempt.status === 'running' || attempt.status === 'queued'))
      .map((attempt) => String(attempt.jobId))
      .filter((jobId) => isWorkflowExecutionId(jobId));
    runningJobs.forEach((jobId) => pollJobUntilTerminal(jobId));

    return () => {
      cancelled = true;
      window.clearInterval(hydrateInterval);
    };
  }, [
    attemptsHydrated,
    recentAttempts,
    screenplayId,
    getToken,
    isGenerating,
    isAwaitingGenerationJobId,
    pendingGenerationJobId,
    generationStartedAtMs,
    selectedModel,
    aspectRatio,
  ]);

  useEffect(() => {
    if (!pendingGenerationJobId) return;
    const matchingAttempt = recentAttempts.find((attempt) => attempt.jobId === pendingGenerationJobId);
    if (!matchingAttempt) return;
    if (matchingAttempt.status !== 'success' && matchingAttempt.status !== 'failed') return;

    if (generationStartedAtMs) {
      setGenerationTime((Date.now() - generationStartedAtMs) / 1000);
    }
    if (matchingAttempt.status === 'success' && matchingAttempt.imageUrl) {
      setGeneratedImageUrl(matchingAttempt.imageUrl);
    }
    setIsGenerating(false);
    setPendingGenerationJobId(null);
    setIsAwaitingGenerationJobId(false);
    setGenerationStartedAtMs(null);
  }, [pendingGenerationJobId, recentAttempts, generationStartedAtMs]);

  useEffect(() => {
    const storageKey = getImageGenDraftStorageKey();
    if (!storageKey || typeof window === 'undefined') return;

    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        prompt?: string;
        referenceImages?: PersistedReferenceImage[];
      };

      if (typeof parsed.prompt === 'string') {
        setPrompt(parsed.prompt);
      }

      if (Array.isArray(parsed.referenceImages)) {
        const hydratedReferences: ReferenceImage[] = parsed.referenceImages
          .map((img) => {
            if (!img?.id) return null;
            const resolvedPreview = img.s3Key
              ? `/api/media/file?key=${encodeURIComponent(img.s3Key)}`
              : (img.preview || '');
            if (!resolvedPreview) return null;
            return {
              id: img.id,
              preview: resolvedPreview,
              s3Key: img.s3Key,
              source: img.source,
              label: img.label,
            } as ReferenceImage;
          })
          .filter((img): img is ReferenceImage => !!img);

        setReferenceImages(hydratedReferences);
      }
    } catch (error) {
      console.warn('[ImageGenerationTools] Failed to restore image gen draft state', error);
    }
  }, [screenplayId]);

  useEffect(() => {
    const storageKey = getImageGenDraftStorageKey();
    if (!storageKey || typeof window === 'undefined') return;

    const persistedReferences: PersistedReferenceImage[] = referenceImages.reduce<PersistedReferenceImage[]>(
      (acc, img) => {
        const safePreview = img.preview?.startsWith('blob:')
          ? (img.s3Key ? `/api/media/file?key=${encodeURIComponent(img.s3Key)}` : '')
          : (img.preview || '');
        if (!img.s3Key && !safePreview) return acc;
        acc.push({
          id: img.id,
          s3Key: img.s3Key,
          preview: safePreview,
          source: img.source,
          label: img.label,
        });
        return acc;
      },
      []
    );

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        prompt,
        referenceImages: persistedReferences,
      })
    );
  }, [screenplayId, prompt, referenceImages]);

  const handleSelectReferenceImagesFromLibrary = (images: MediaFile[]) => {
    const limit = getReferenceLimit();
    if (limit <= 0) {
      toast.error('Selected model does not support reference images');
      return;
    }

    setReferenceImages((prev) => {
      const existingKeys = new Set(prev.map((img) => img.s3Key).filter(Boolean));
      const dedupedIncoming = images.filter((img) => img.s3Key && !existingKeys.has(img.s3Key));
      const remainingSlots = Math.max(0, limit - prev.length);
      const accepted = dedupedIncoming.slice(0, remainingSlots);

      if (dedupedIncoming.length === 0) {
        toast.error('All selected images are already in references');
        return prev;
      }
      if (accepted.length < dedupedIncoming.length) {
        toast.warning(`Added ${accepted.length} image(s). Reached model limit of ${limit}.`);
      } else {
        toast.success(`Added ${accepted.length} reference image(s) from library`);
      }

      const mapped: ReferenceImage[] = accepted.map((img) => ({
        id: `library-${img.id}`,
        preview: img.s3Key ? `/api/media/file?key=${encodeURIComponent(img.s3Key)}` : (img.fileUrl || ''),
        s3Key: img.s3Key,
        source: 'library' as const,
        label: img.fileName,
      })).filter((img) => !!img.s3Key && !!img.preview);

      return [...prev, ...mapped];
    });

    setShowMediaLibraryBrowser(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating || !selectedModel) return;

    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setGenerationTime(undefined);
    setPendingGenerationJobId(null);
    setIsAwaitingGenerationJobId(true);
    const startTime = Date.now();
    setGenerationStartedAtMs(startTime);
    let keepGeneratingUntilAsyncTerminal = false;

    try {
      const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));

      // Prepare reference image identifiers without constructing provider-specific bucket URLs.
      const referenceImageInputs = referenceImages
        .map((img) => resolveReferenceInputForRequest(img))
        .filter((value): value is string => !!value);

      if (referenceImages.length > 0 && referenceImageInputs.length === 0) {
        toast.error('Reference images are visible but not valid for generation. Please re-add them.');
        setIsGenerating(false);
        setPendingGenerationJobId(null);
        setIsAwaitingGenerationJobId(false);
        setGenerationStartedAtMs(null);
        return;
      }
      if (referenceImageInputs.length < referenceImages.length) {
        toast.warning(
          `Using ${referenceImageInputs.length}/${referenceImages.length} references. Some stale references were skipped.`
        );
      }

      // Build final prompt with camera angle
      let finalPrompt = prompt.trim();
      if (selectedCameraAngle) {
        const angleText = formatCameraAngleForModel(selectedCameraAngle, selectedModel);
        finalPrompt = finalPrompt + angleText;
      }

      const requestBody: any = {
        prompt: finalPrompt,
        desiredModelId: selectedModel,
        aspectRatio,
        projectId: screenplayId,
        entityType: 'playground',
        entityId: screenplayId, // Jobs Panel: backend requires entityId to create job
      };

      // Add reference images if available
      if (referenceImageInputs.length > 0) {
        requestBody.characterReference = referenceImageInputs.length === 1
          ? referenceImageInputs[0]
          : referenceImageInputs;
      }

      const response = await apiModule.image.generate(requestBody);
      const returnedJobId = response.data?.jobId || response.data?.data?.jobId;
      const effectiveJobId = returnedJobId || null;
      if (effectiveJobId) {
        setPendingGenerationJobId(effectiveJobId);
        setIsAwaitingGenerationJobId(false);
        keepGeneratingUntilAsyncTerminal = true;
        upsertAttempt({
          id: `job_${effectiveJobId}`,
          jobId: effectiveJobId,
          status: 'running',
          message: 'Image generation in progress...',
          at: new Date().toISOString(),
          modelId: selectedModel,
          aspectRatio,
        });
      }
      if (effectiveJobId && screenplayId) {
        addInFlightJob(effectiveJobId);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('wryda:optimistic-job', {
              detail: {
                jobId: effectiveJobId,
                screenplayId,
                jobType: 'image-generation',
                assetName: 'Direct Image Gen',
              },
            })
          );
        }
      }
      
      // Extract image URL from response
      const responseS3Key = resolveImageS3Key(response?.data);
      const imageUrl = response.data?.imageUrl || response.data?.url || response.data?.s3Url;
      const resolvedImageUrl = responseS3Key
        ? `/api/media/file?key=${encodeURIComponent(responseS3Key)}`
        : (typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : undefined);
      if (resolvedImageUrl) {
        const elapsed = (Date.now() - startTime) / 1000;
        setGenerationTime(elapsed);
        setGeneratedImageUrl(resolvedImageUrl);
        upsertAttempt({
          id: effectiveJobId ? `job_${effectiveJobId}` : `attempt_${Date.now()}`,
          jobId: effectiveJobId || undefined,
          status: 'success',
          message: 'Image generated successfully.',
          at: new Date().toISOString(),
          imageUrl: resolvedImageUrl,
          s3Key: typeof responseS3Key === 'string' ? responseS3Key : undefined,
          modelId: selectedModel,
          aspectRatio,
        });
        keepGeneratingUntilAsyncTerminal = false;
        setPendingGenerationJobId(null);
        setIsAwaitingGenerationJobId(false);
      } else {
        // Build proxy URL from key if backend returned only key.
        if (responseS3Key) {
          const elapsed = (Date.now() - startTime) / 1000;
          setGenerationTime(elapsed);
          const proxyUrl = `/api/media/file?key=${encodeURIComponent(responseS3Key)}`;
          setGeneratedImageUrl(proxyUrl);
          upsertAttempt({
            id: effectiveJobId ? `job_${effectiveJobId}` : `attempt_${Date.now()}`,
            jobId: effectiveJobId || undefined,
            status: 'success',
            message: 'Image generated successfully.',
            at: new Date().toISOString(),
            imageUrl: proxyUrl,
            s3Key: responseS3Key,
            modelId: selectedModel,
            aspectRatio,
          });
          keepGeneratingUntilAsyncTerminal = false;
          setPendingGenerationJobId(null);
          setIsAwaitingGenerationJobId(false);
        }
      }

      if (!keepGeneratingUntilAsyncTerminal) {
        toast.success('Image generated!');
      }
      
      // Keep draft inputs after generate (matches remix workflow behavior).
      setShowMediaLibraryBrowser(false);
      
    } catch (error: any) {
      console.error('Image generation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate image';
      const statusCode = Number(error?.response?.status || 0);
      const isGatewayTimeout = statusCode === 502 || statusCode === 503 || statusCode === 504;
      if (isGatewayTimeout) {
        toast.warning('Request timed out, but generation may still complete. Watch Recent attempts.');
        keepGeneratingUntilAsyncTerminal = true;
      } else {
        toast.error(errorMessage);
        upsertAttempt({
          id: `attempt_${Date.now()}`,
          status: 'failed',
          message: `Failed: ${errorMessage}`,
          at: new Date().toISOString(),
          modelId: selectedModel || undefined,
          aspectRatio,
        });
        keepGeneratingUntilAsyncTerminal = false;
        setIsAwaitingGenerationJobId(false);
      }
      setGeneratedImageUrl(null);
    } finally {
      if (!keepGeneratingUntilAsyncTerminal) {
        setIsGenerating(false);
        setPendingGenerationJobId(null);
        setIsAwaitingGenerationJobId(false);
        setGenerationStartedAtMs(null);
      }
    }
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const s3Key = generatedImageUrl.startsWith('/api/media/file?key=')
        ? decodeURIComponent(generatedImageUrl.split('key=')[1] || '')
        : undefined;
      await downloadImageAsBlob(generatedImageUrl, `generated-image-${Date.now()}.png`, s3Key);
    } catch {
      toast.error('Failed to download image');
    }
  };

  return (
    <div className={cn("min-h-full flex flex-col md:flex-row bg-[#0A0A0A]", className)}>
      {/* Left Panel - Form Controls */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          {/* Prompt Input */}
          <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Prompt
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedModel ? getModelHints(selectedModel).promptHint : 'Describe what you want to generate...'}
              className={cn(
                "w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white",
                "focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent resize-none",
                "placeholder:text-[#4A4A4A]"
              )}
              rows={4}
              disabled={isGenerating}
            />
          </div>
          {selectedModel && (
            <p className="mt-1.5 text-xs text-[#808080]">
              💡 Model-specific hint: {getModelHints(selectedModel).promptHint}
            </p>
          )}
          </div>

          {/* Reference Image Upload */}
          {supportsReferenceImages && (
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-white mb-2">
                Reference Images (Optional)
                <span className="ml-2 text-xs text-[#808080]">
                  {referenceImages.length}/{getReferenceLimit()} images
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleReferenceImageUpload}
                className="hidden"
                disabled={isUploading || isGenerating || referenceImages.length >= getReferenceLimit()}
              />
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isGenerating || referenceImages.length >= getReferenceLimit()}
                    className={cn(
                      "px-4 py-3 border-2 border-dashed rounded-lg",
                      "flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                      isUploading || isGenerating || referenceImages.length >= getReferenceLimit()
                        ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                        : "border-[#3F3F46] text-[#808080] hover:border-cinema-red hover:text-cinema-red"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMediaLibraryBrowser(true)}
                    disabled={!screenplayId || isGenerating}
                    className={cn(
                      "px-4 py-3 border rounded-lg",
                      "flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                      !screenplayId || isGenerating
                        ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                        : "border-[#3F3F46] text-[#B3B3B3] hover:border-cinema-red hover:text-cinema-red"
                    )}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Add from Library</span>
                  </button>
                </div>

                {/* Reference Image Previews */}
                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {referenceImages.map((img, index) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.preview}
                          alt={img.label || `Reference ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-[#3F3F46]"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 rounded bg-[#DC143C]/90 px-1.5 py-0.5 text-[10px] text-white">
                            Primary
                          </span>
                        )}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimaryReferenceImage(index)}
                            className="absolute bottom-1 left-1 rounded bg-black/70 border border-white/20 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity hover:border-cinema-red hover:text-cinema-red"
                            title="Set as primary reference"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeReferenceImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-1.5 space-y-1">
                <p className="text-xs text-[#808080]">
                  Add references from upload or library. Supported by: {selectedModelInfo?.label || selectedModelInfo?.id}
                </p>
                {selectedModel && (
                  <div className="text-xs text-[#4A4A4A] bg-[#1A1A1A] p-2 rounded border border-[#2A2A2A]">
                    <p className="font-medium text-[#808080] mb-1">📋 Best Practices:</p>
                    <p className="text-[#4A4A4A]">{getModelHints(selectedModel).referenceHint}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Image Model
          </label>
          {isLoadingModels ? (
            <div className="flex items-center gap-2 text-[#808080]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
              disabled={isGenerating}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} ({model.creditsPerImage} credits)
                </option>
              ))}
            </select>
          )}
          {selectedModelInfo && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Cost: {selectedModelInfo.creditsPerImage} credits
            </p>
            )}
          </div>

          {/* Camera Angle Selection */}
          <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Camera Angle (Optional)
          </label>
          <select
            value={selectedCameraAngle}
            onChange={(e) => setSelectedCameraAngle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {cameraAngles.map((angle) => (
              <option key={angle.id} value={angle.id}>
                {angle.label} {angle.description ? `- ${angle.description}` : ''}
              </option>
            ))}
          </select>
          {selectedCameraAngle && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Will add: &quot;{cameraAngles.find(a => a.id === selectedCameraAngle)?.promptText}&quot;
            </p>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-white mb-2">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
              disabled={isGenerating}
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

        </div>
        
        {/* Generate Button */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-[#0A0A0A]">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !selectedModel}
            className={cn(
              "w-full px-6 py-3 rounded-lg font-medium text-white transition-colors",
              "bg-cinema-red hover:bg-red-700 disabled:bg-[#3F3F46] disabled:text-[#808080] disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate Image</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px bg-white/10 flex-shrink-0"></div>

      {/* Right Panel - Preview */}
      <div className="w-full md:w-1/2 flex flex-col">
        <GenerationPreview
          isGenerating={isGenerating}
          generatedImageUrl={generatedImageUrl}
          generationTime={generationTime}
          onDownload={handleDownload}
        />
        <div className="border-t border-white/10 p-4 md:p-5 bg-[#141414]">
          <div className="mb-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-400">Recent attempts</p>
              <span className="text-[10px] text-gray-500">retained ~12h</span>
            </div>
          <p className="mb-2 text-[10px] text-[#808080]">
            Generated images save to Archive under <span className="text-[#B3B3B3]">Images/Generated</span>.
          </p>
            {recentAttempts.length === 0 ? (
              <p className="text-xs text-[#808080]">No recent attempts yet.</p>
            ) : (
              <div className="space-y-1.5">
                {recentAttempts.slice(0, 6).map((attempt) => (
                  <div
                    key={attempt.id}
                    className={cn(
                      'flex items-center justify-between rounded border px-2 py-1 text-[11px]',
                      attempt.status === 'failed'
                        ? 'border-red-500/40 bg-red-500/10 text-red-200'
                        : attempt.status === 'running' || attempt.status === 'queued'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate">{attempt.message}</p>
                      {(attempt.modelId || attempt.aspectRatio) && (
                        <p className="mt-0.5 text-[10px] opacity-80">
                          {attempt.modelId ? `Model: ${attempt.modelId}` : ''}
                          {attempt.modelId && attempt.aspectRatio ? ' - ' : ''}
                          {attempt.aspectRatio ? `Aspect: ${attempt.aspectRatio}` : ''}
                        </p>
                      )}
                      {attempt.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setGeneratedImageUrl(attempt.imageUrl || null)}
                          className="mt-0.5 text-[10px] underline hover:text-white"
                        >
                          Open result
                        </button>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[10px] opacity-80">
                      {new Date(attempt.at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showMediaLibraryBrowser && screenplayId && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-[1px] p-3 md:p-6">
          <div className="h-full w-full md:mx-auto md:max-w-6xl rounded-xl border border-[#3F3F46] bg-[#0A0A0A] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div>
                <p className="text-sm font-semibold text-white">Select references from Library</p>
                <p className="text-xs text-[#808080]">
                  Choose up to {Math.max(1, getReferenceLimit() - referenceImages.length)} image(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaLibraryBrowser(false)}
                className="px-3 py-1.5 rounded border border-[#3F3F46] text-sm text-[#B3B3B3] hover:text-white hover:border-cinema-red"
              >
                Close
              </button>
            </div>
            <div className="flex-1 p-3 md:p-4 overflow-hidden">
              <MediaLibraryBrowser
                screenplayId={screenplayId}
                onSelectImages={handleSelectReferenceImagesFromLibrary}
                filterTypes={['image']}
                allowMultiSelect={true}
                maxSelections={Math.max(1, getReferenceLimit() - referenceImages.length)}
                onCancel={() => setShowMediaLibraryBrowser(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

