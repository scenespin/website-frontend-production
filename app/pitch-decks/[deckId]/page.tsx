'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import { Briefcase, ChevronLeft, ChevronRight, Eye, Film, Layers, Loader2, Megaphone, MoreVertical, Trash2 } from 'lucide-react';
import {
  archivePitchDeckImage,
  getPitchDeckImageJobStatus,
  generatePitchDeckImageFromPrompt,
  generatePitchDeckImageFromReference,
  getPitchDeck,
  listPitchDeckImageJobs,
  listImageGenerationModels,
  type PitchDeckImageJobStatusResponse,
  updatePitchDeck,
  updatePitchDeckSlide,
  type PitchDeckBlock,
  type PitchDeckImageModel,
  type PitchDeckSlide,
} from '@/utils/pitchDeckStorage';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import { useDirectS3Upload } from '@/hooks/useDirectS3Upload';
import RewriteModal from '@/components/modals/RewriteModal';
import { MediaLibraryBrowser } from '@/components/production/CharacterStudio/MediaLibraryBrowser';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOptionalPitchDeckAdvisorContext, type PitchDeckStoryAdvisorContextPacket } from '@/contexts/PitchDeckAdvisorContext';
import type { FolderTreeNode, MediaFile } from '@/types/media';
import { downloadImageAsBlob } from '@/utils/imageDownload';
import { formatImageModelLabel } from '@/utils/providerLabels';

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
}

type ExistingMediaItem = {
  id: string;
  label: string;
  sourceType: 'character' | 'location' | 'prop' | 'pitch_deck';
  entityId: string;
  entityName: string;
  groupKey: string;
  groupLabel: string;
  outfitName?: string;
  angle?: string;
  backgroundType?: string;
  imageUrl: string;
  s3Key?: string;
  mediaFileId?: string;
  archiveFolderId?: string;
  archiveDeckId?: string;
  archiveSlideId?: string;
  createdAt?: string;
};

type ExistingMediaSourceFilter = 'character' | 'location' | 'prop' | 'pitch_deck';

type ImageActionTab = 'library' | 'prompt' | 'reference' | 'upload';
type RewriteQuickAction = {
  id: string;
  label: string;
  prompt: string;
  icon?: any;
  styleClass?: string;
};

type SlotImageOption = {
  id: string;
  imageUrl: string;
  sourceType: PitchDeckBlock['sourceType'];
  label: string;
  createdAt: string;
  s3Key?: string;
};

type ImageAttempt = {
  id: string;
  jobId?: string;
  slideId: string;
  status: 'success' | 'failed';
  action: 'existing' | 'prompt' | 'reference' | 'upload';
  message: string;
  at: string;
  imageUrl?: string;
  s3Key?: string;
  archiveFileId?: string;
  archiveFolderId?: string;
};

type ImageActionDraft = {
  promptGenerationText?: string;
  promptGenerationModelId?: string;
  promptAspectRatio?: PitchDeckAspectRatio;
  referencePromptText?: string;
  referenceMediaId?: string;
  referenceMediaIds?: string[];
  referenceMediaIdentityKeys?: string[];
  referenceGenerationModelId?: string;
  referenceAspectRatio?: PitchDeckAspectRatio;
};

type PitchDeckPdfExportInput = {
  deckTitle: string;
  slides: PitchDeckSlide[];
  templateId?: string;
  includeImages: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
  heroPanelStyle: 'rounded' | 'square';
  heroPanelOpacity: 'none' | 'soft' | 'medium' | 'strong';
  heroPanelPosition: 'top' | 'bottom' | 'lower_middle';
};

const PITCH_DECK_REWRITE_ACTIONS: RewriteQuickAction[] = [
  {
    id: 'investor',
    label: 'Investor polish',
    prompt: 'Rewrite this slide for investor audiences: concise, credible, business-oriented, and outcome-focused.',
    icon: Briefcase,
    styleClass: 'bg-[rgba(220,20,60,0.14)] border-[rgba(220,20,60,0.45)] hover:bg-[rgba(220,20,60,0.22)] text-white',
  },
  {
    id: 'festival',
    label: 'Festival polish',
    prompt: 'Rewrite this slide for festival submissions: cinematic, emotionally resonant, and artistically distinctive.',
    icon: Film,
    styleClass: 'bg-[rgba(99,102,241,0.14)] border-[rgba(99,102,241,0.45)] hover:bg-[rgba(99,102,241,0.22)] text-white',
  },
  {
    id: 'sales',
    label: 'Sales polish',
    prompt: 'Rewrite this slide for sales/distribution audiences: hook-driven, clear market positioning, and audience-forward.',
    icon: Megaphone,
    styleClass: 'bg-[rgba(0,217,255,0.12)] border-[rgba(0,217,255,0.40)] hover:bg-[rgba(0,217,255,0.20)] text-white',
  },
];

const IMAGE_ACTION_TAB_STORAGE_KEY_PREFIX = 'pitchDeck:imageActionTab:deck:';
const IMAGE_ATTEMPTS_STORAGE_KEY_PREFIX = 'pitchDeck:imageAttempts:deck:';
const IMAGE_ACTION_DRAFT_STORAGE_KEY_PREFIX = 'pitchDeck:imageActionDraft:deck:';
const SELECTED_SLIDE_STORAGE_KEY_PREFIX = 'pitchDeck:selectedSlide:deck:';
const IMAGE_ATTEMPTS_RETENTION_MS = 12 * 60 * 60 * 1000;
const UNKNOWN_ATTEMPT_SLIDE_ID = 'unknown';
const IMAGE_ACTION_TABS: ImageActionTab[] = ['library', 'prompt', 'reference', 'upload'];

const getMediaProxyS3KeyFromUrl = (imageUrl: string): string | undefined => {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return undefined;
  if (typeof window === 'undefined') return undefined;
  try {
    const parsed = new URL(imageUrl, window.location.origin);
    if (parsed.pathname !== '/api/media/file') return undefined;
    const key = parsed.searchParams.get('key');
    return key && key.trim() ? key.trim() : undefined;
  } catch {
    return undefined;
  }
};

const isLegacyTempVideoImageKey = (s3Key?: string): boolean =>
  typeof s3Key === 'string' && s3Key.trim().startsWith('temp/video-images/');

const getExistingMediaIdentityKey = (item: Partial<ExistingMediaItem> | null | undefined): string => {
  if (!item) return '';
  if (typeof item.mediaFileId === 'string' && item.mediaFileId.trim()) return `file:${item.mediaFileId.trim()}`;
  if (typeof item.s3Key === 'string' && item.s3Key.trim()) return `s3:${item.s3Key.trim()}`;
  if (typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
    const proxyKey = getMediaProxyS3KeyFromUrl(item.imageUrl);
    if (proxyKey) return `s3:${proxyKey}`;
    return `url:${item.imageUrl.trim()}`;
  }
  return '';
};

const ALLOWED_PITCH_DECK_IMAGE_MODELS = new Set([
  'flux2-pro-2k',
  'flux2-pro-4k',
  'flux2-max-2k',
  'flux2-max-4k-16:9',
  'nano-banana-pro',
  'nano-banana-pro-2k',
  'gemini-3.1-flash-image-4k',
  'gemini-3.1-flash-image-2k',
]);
const ALLOWED_PITCH_DECK_REFERENCE_MODELS = new Set([
  'flux2-pro-2k',
  'flux2-pro-4k',
  'flux2-max-2k',
  'flux2-max-4k-16:9',
  'nano-banana-pro',
  'nano-banana-pro-2k',
  'gemini-3.1-flash-image-4k',
  'gemini-3.1-flash-image-2k',
]);

function getPitchDeckModelTierRank(modelId: string): number {
  if (modelId.endsWith('-2k')) return 0;
  if (modelId.endsWith('-4k') || modelId === 'nano-banana-pro' || modelId === 'flux2-max-4k-16:9') return 1;
  return 2;
}

function getPitchDeckModelLabelById(modelId: string, fallbackLabel?: string): string {
  return formatImageModelLabel(modelId) || fallbackLabel || modelId;
}

function getPitchDeckModelDisplayName(model: PitchDeckImageModel): string {
  return getPitchDeckModelLabelById(model.id, model.label);
}

function sortPitchDeckModelsForPicker(models: PitchDeckImageModel[]): PitchDeckImageModel[] {
  return [...models].sort((a, b) => {
    const tierDelta = getPitchDeckModelTierRank(a.id) - getPitchDeckModelTierRank(b.id);
    if (tierDelta !== 0) return tierDelta;
    return getPitchDeckModelDisplayName(a).localeCompare(getPitchDeckModelDisplayName(b), undefined, { sensitivity: 'base' });
  });
}

function getReferenceLimitByModel(modelId: string): number {
  return (
    modelId.includes('nano-banana-pro') ||
    modelId === 'gemini-3.1-flash-image-4k' ||
    modelId === 'gemini-3.1-flash-image-2k'
  ) ? 14 : 8;
}

type PdfImageLayout =
  | 'text_only'
  | 'split_right'
  | 'split_left'
  | 'full_bleed'
  | 'full_bleed_split2'
  | 'full_bleed_vcols3'
  | 'split_right_vstack2'
  | 'split_left_vstack2'
  | 'split_right_grid4'
  | 'split_left_grid4'
  | 'split_right_vcols2'
  | 'split_left_vcols2'
  | 'split_right_vcols3'
  | 'split_left_vcols3'
  | 'full_bleed_vcols4';
type PitchDeckAspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | '9:21';
const PITCH_DECK_ASPECT_RATIOS: PitchDeckAspectRatio[] = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
  '9:21',
];
const MODEL_ASPECT_RATIO_SUPPORT: Partial<Record<string, PitchDeckAspectRatio[]>> = {
  // Keep model-aware mapping explicit for safe future divergence.
  'flux2-pro-2k': PITCH_DECK_ASPECT_RATIOS,
  'flux2-pro-4k': PITCH_DECK_ASPECT_RATIOS,
  'flux2-max-2k': PITCH_DECK_ASPECT_RATIOS,
  'flux2-max-4k-16:9': PITCH_DECK_ASPECT_RATIOS,
  'nano-banana-pro': PITCH_DECK_ASPECT_RATIOS,
  'nano-banana-pro-2k': PITCH_DECK_ASPECT_RATIOS,
  'gemini-3.1-flash-image-4k': PITCH_DECK_ASPECT_RATIOS,
  'gemini-3.1-flash-image-2k': PITCH_DECK_ASPECT_RATIOS,
};

const PDF_LAYOUT_REGISTRY: Record<string, Partial<Record<string, PdfImageLayout>>> = {
  'cinematic-dark-v1': {
    cover: 'full_bleed',
    characters_grid: 'split_left',
    tone_style: 'split_right',
    world_locations: 'split_right',
  },
  'festival-minimal-v1': {
    cover: 'full_bleed',
    world_locations: 'split_left',
  },
  'investor-clean-v1': {
    cover: 'split_right',
    market_positioning: 'split_right',
    distribution_strategy: 'split_left',
    audience: 'split_right',
  },
  'streaming-premium-v1': {
    cover: 'full_bleed',
    characters_grid: 'split_left',
    tone_style: 'split_right',
    world_locations: 'split_right',
    market_positioning: 'split_left',
  },
};

const PDF_LAYOUT_VALUES: PdfImageLayout[] = [
  'text_only',
  'split_right',
  'split_left',
  'full_bleed',
  'full_bleed_split2',
  'full_bleed_vcols3',
  'split_right_vstack2',
  'split_left_vstack2',
  'split_right_grid4',
  'split_left_grid4',
  'split_right_vcols2',
  'split_left_vcols2',
  'split_right_vcols3',
  'split_left_vcols3',
  'full_bleed_vcols4',
];

const PDF_LAYOUT_SELECTOR_OPTIONS: Array<{ value: PdfImageLayout; label: string }> = [
  { value: 'full_bleed', label: 'Hero Full Bleed' },
  { value: 'full_bleed_split2', label: 'Hero Full Bleed (50/50 Split)' },
  { value: 'full_bleed_vcols3', label: 'Hero Full Bleed (3 Columns)' },
  { value: 'full_bleed_vcols4', label: 'Hero Full Bleed (4 Columns)' },
  { value: 'split_right', label: 'Split Right (Single)' },
  { value: 'split_left', label: 'Split Left (Single)' },
  { value: 'split_right_vcols2', label: 'Split Right (2 Columns)' },
  { value: 'split_left_vcols2', label: 'Split Left (2 Columns)' },
  { value: 'split_right_vcols3', label: 'Split Right (3 Columns)' },
  { value: 'split_left_vcols3', label: 'Split Left (3 Columns)' },
  { value: 'text_only', label: 'Text Only' },
];

function getPdfLayout(templateId: string | undefined, slideType: string, hasImage: boolean): PdfImageLayout {
  if (!hasImage) return 'text_only';
  const templateLayouts = (templateId && PDF_LAYOUT_REGISTRY[templateId]) || {};
  return templateLayouts[slideType] || 'split_right';
}

function getLayoutPreviewLabelFor(layout: PdfImageLayout): string {
  if (layout === 'full_bleed') return 'Full Bleed Hero';
  if (layout === 'full_bleed_split2') return 'Full Bleed Hero: 50/50 Split';
  if (layout === 'full_bleed_vcols3') return 'Hero: 3 Columns';
  if (layout === 'split_left') return 'Split: Image Left';
  if (layout === 'split_right') return 'Split: Image Right';
  if (layout === 'split_left_vstack2') return 'Split Left: 2 Vertical';
  if (layout === 'split_right_vstack2') return 'Split Right: 2 Vertical';
  if (layout === 'split_left_grid4') return 'Split Left: Collage (4)';
  if (layout === 'split_right_grid4') return 'Split Right: Collage (4)';
  if (layout === 'split_left_vcols2') return 'Split Left: 2 Columns';
  if (layout === 'split_right_vcols2') return 'Split Right: 2 Columns';
  if (layout === 'split_left_vcols3') return 'Split Left: 3 Columns';
  if (layout === 'split_right_vcols3') return 'Split Right: 3 Columns';
  if (layout === 'full_bleed_vcols4') return 'Hero: 4 Columns';
  return 'Text Only';
}

function getLayoutPreviewLabel(templateId: string | undefined, slideType: string, override?: PdfImageLayout): string {
  if (override) return getLayoutPreviewLabelFor(override);
  const templateLayouts = (templateId && PDF_LAYOUT_REGISTRY[templateId]) || {};
  const layout = templateLayouts[slideType] || 'split_right';
  return getLayoutPreviewLabelFor(layout);
}

function getSuggestedAspectRatiosForLayout(layout: PdfImageLayout): PitchDeckAspectRatio[] {
  if (
    layout === 'full_bleed' ||
    layout === 'full_bleed_vcols4' ||
    layout === 'full_bleed_vcols3' ||
    layout === 'full_bleed_split2'
  ) {
    return ['16:9', '21:9', '1:1'];
  }
  if (
    layout === 'split_left' ||
    layout === 'split_right' ||
    layout === 'split_left_vstack2' ||
    layout === 'split_right_vstack2' ||
    layout === 'split_left_grid4' ||
    layout === 'split_right_grid4' ||
    layout === 'split_left_vcols2' ||
    layout === 'split_right_vcols2' ||
    layout === 'split_left_vcols3' ||
    layout === 'split_right_vcols3'
  ) {
    return ['9:16', '9:21', '1:1'];
  }
  return ['16:9', '1:1', '9:16'];
}

function getExportImageLimitForLayout(layout: PdfImageLayout): number {
  if (layout === 'text_only') return 0;
  if (layout === 'full_bleed_vcols3') return 3;
  if (layout === 'full_bleed_split2') return 2;
  if (layout === 'split_left_vcols3' || layout === 'split_right_vcols3') return 3;
  if (layout === 'full_bleed_vcols4' || layout === 'split_left_grid4' || layout === 'split_right_grid4') return 4;
  if (
    layout === 'split_left_vcols2' ||
    layout === 'split_right_vcols2' ||
    layout === 'split_left_vstack2' ||
    layout === 'split_right_vstack2'
  ) {
    return 2;
  }
  return 1;
}

function getLayoutImageTip(layout: PdfImageLayout): string {
  if (layout === 'full_bleed') {
    return 'Tip: Hero Full Bleed looks best with high-res images. For print-first exports, prefer near-page portrait ratios (2:3 or 4:5) and keep full-page images above ~2550x3300 when possible.';
  }
  if (layout === 'full_bleed_split2' || layout === 'full_bleed_vcols3' || layout === 'full_bleed_vcols4') {
    return 'Tip: Full-bleed multi-image heroes crop best with portrait-ish assets (9:16, 9:21, 2:3) and similar framing across images.';
  }
  return 'Tip: Portrait-ish images (9:16, 9:21, 2:3) crop best in multi-column layouts.';
}

function getAspectRatiosForModel(modelId: string): PitchDeckAspectRatio[] {
  return MODEL_ASPECT_RATIO_SUPPORT[modelId] || PITCH_DECK_ASPECT_RATIOS;
}

function sanitizeFileName(name: string): string {
  const safe = (name || 'pitch-deck')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${safe || 'pitch-deck'}.pdf`;
}

function getSlidePrimaryTextForExport(slide: PitchDeckSlide): string {
  const textBlock = slide.blocks?.find((block) => block.type === 'text');
  if (!textBlock) return '';
  if (typeof textBlock.content === 'string') return textBlock.content;
  if (textBlock.content && typeof (textBlock.content as any).text === 'string') {
    return String((textBlock.content as any).text);
  }
  return '';
}

function getSlideImageExportLayoutOverride(slide: PitchDeckSlide): PdfImageLayout | undefined {
  const imageBlock = slide.blocks?.find((block) => block.type === 'image');
  if (!imageBlock || typeof imageBlock.content !== 'object' || !imageBlock.content) return undefined;
  const content = imageBlock.content as any;
  const candidate = typeof content.exportLayout === 'string' ? content.exportLayout : '';
  if (!candidate) return undefined;
  return PDF_LAYOUT_VALUES.includes(candidate as PdfImageLayout) ? (candidate as PdfImageLayout) : undefined;
}

function getSlideImageEnabled(slide: PitchDeckSlide): boolean {
  const imageBlock = slide.blocks?.find((block) => block.type === 'image');
  if (!imageBlock || typeof imageBlock.content !== 'object' || !imageBlock.content) return true;
  const content = imageBlock.content as any;
  if (typeof content.imageEnabled !== 'boolean') return true;
  return content.imageEnabled;
}

function getSlidePrimaryImageUrlForExport(slide: PitchDeckSlide): string {
  const imageBlock = slide.blocks?.find((block) => block.type === 'image');
  if (!imageBlock || typeof imageBlock.content !== 'object' || !imageBlock.content) return '';
  const content = imageBlock.content as any;
  const options = Array.isArray(content.imageOptions) ? content.imageOptions : [];
  const activeId = typeof content.activeImageId === 'string' ? content.activeImageId : '';
  if (!activeId || options.length === 0) return '';
  const active = options.find((option: any) => option?.id === activeId);
  return typeof active?.imageUrl === 'string' ? active.imageUrl : '';
}

function getSlideOrderedImageUrlsForExport(slide: PitchDeckSlide): string[] {
  const imageBlock = slide.blocks?.find((block) => block.type === 'image');
  if (!imageBlock || typeof imageBlock.content !== 'object' || !imageBlock.content) return [];
  const content = imageBlock.content as any;
  const options = Array.isArray(content.imageOptions) ? content.imageOptions : [];
  const exportImageIds = Array.isArray(content.exportImageIds)
    ? content.exportImageIds.filter((id: any) => typeof id === 'string')
    : [];
  const exportSelectedOptions =
    exportImageIds.length > 0
      ? exportImageIds
          .map((id: string) => options.find((option: any) => option?.id === id))
          .filter((option: any) => Boolean(option))
      : [];
  if (exportSelectedOptions.length > 0) {
    const urls = exportSelectedOptions
      .map((option: any) => (typeof option?.imageUrl === 'string' ? option.imageUrl : ''))
      .filter((url: string) => url.trim().length > 0);
    return Array.from(new Set(urls));
  }
  const activeId = typeof content.activeImageId === 'string' ? content.activeImageId : '';
  const active = activeId ? options.find((option: any) => option?.id === activeId) : null;
  const urls = [
    typeof active?.imageUrl === 'string' ? active.imageUrl : '',
    ...options.map((option: any) => (typeof option?.imageUrl === 'string' ? option.imageUrl : '')),
  ].filter((url) => typeof url === 'string' && url.trim().length > 0);
  return Array.from(new Set(urls));
}

function getSlideImageLabelsForContext(slide: PitchDeckSlide): string[] {
  const imageBlock = slide.blocks?.find((block) => block.type === 'image');
  if (!imageBlock || typeof imageBlock.content !== 'object' || !imageBlock.content) return [];
  const content = imageBlock.content as any;
  const options = Array.isArray(content.imageOptions) ? content.imageOptions : [];
  const labels: string[] = [];
  options.forEach((option: any) => {
    const label = typeof option?.label === 'string' ? option.label.trim() : '';
    if (label) labels.push(label);
  });
  return Array.from(new Set(labels)).slice(0, 8);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image data'));
    reader.readAsDataURL(blob);
  });
}

async function loadImageForPdf(
  imageUrl: string
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' | 'WEBP' } | null> {
  if (!imageUrl) return null;
  try {
    const response = await fetch(imageUrl, { cache: 'no-store' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const mime = (blob.type || '').toLowerCase();
    const format: 'PNG' | 'JPEG' | 'WEBP' = mime.includes('png')
      ? 'PNG'
      : mime.includes('webp')
        ? 'WEBP'
        : 'JPEG';
    return { dataUrl, format };
  } catch {
    return null;
  }
}

async function renderCoverImageDataUrl(
  sourceDataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  if (typeof window === 'undefined') return sourceDataUrl;
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const width = Math.max(1, Math.round(targetWidth));
      const height = Math.max(1, Math.round(targetHeight));
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }
      const sourceRatio = image.width / image.height;
      const targetRatio = width / height;
      let sx = 0;
      let sy = 0;
      let sw = image.width;
      let sh = image.height;
      if (sourceRatio > targetRatio) {
        sw = image.height * targetRatio;
        sx = (image.width - sw) / 2;
      } else if (sourceRatio < targetRatio) {
        sh = image.width / targetRatio;
        sy = (image.height - sh) / 2;
      }
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    image.onerror = () => resolve(sourceDataUrl);
    image.src = sourceDataUrl;
  });
}

async function generatePitchDeckPdfClient(input: PitchDeckPdfExportInput): Promise<{ blob: Blob; fileName: string }> {
  const pageWidth = 1152;
  const pageHeight = 648;
  const margin = 44;
  const headerHeight = 84;
  const splitImageWidth = 430;
  const splitImageHeight = pageHeight - headerHeight;
  const tileGap = 10;
  const textWidthNoImage = pageWidth - margin * 2;
  const textWidthWithSplitImage = pageWidth - splitImageWidth - margin * 2 - 14;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [pageWidth, pageHeight],
    compress: true,
  });

  const orderedSlides = [...input.slides].sort((a, b) => a.orderIndex - b.orderIndex);

  for (let index = 0; index < orderedSlides.length; index += 1) {
    if (index > 0) doc.addPage([pageWidth, pageHeight], 'landscape');
    const slide = orderedSlides[index];

    doc.setFillColor(15, 15, 16);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    if (input.watermarkEnabled && input.watermarkText.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(72);
      doc.setTextColor(70, 70, 75);
      doc.text(input.watermarkText.trim().slice(0, 42), pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: -28,
      });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(240, 240, 245);
    doc.text(slide.title || `Slide ${slide.orderIndex}`, margin, margin + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(170, 170, 180);
    doc.text(input.deckTitle || 'Pitch Deck', pageWidth - margin, margin + 28, { align: 'right' });

    const bodyText = getSlidePrimaryTextForExport(slide) || 'No text provided for this slide.';
    const imageEnabled = getSlideImageEnabled(slide);
    const imageUrls = input.includeImages && imageEnabled ? getSlideOrderedImageUrlsForExport(slide) : [];
    const hasImage = imageUrls.length > 0;
    const layoutOverride = getSlideImageExportLayoutOverride(slide);
    const layout = !imageEnabled ? 'text_only' : layoutOverride || getPdfLayout(input.templateId, slide.slideType, hasImage);
    const isSplitLayout =
      layout === 'split_right' ||
      layout === 'split_left' ||
      layout === 'split_right_vstack2' ||
      layout === 'split_left_vstack2' ||
      layout === 'split_right_grid4' ||
      layout === 'split_left_grid4' ||
      layout === 'split_right_vcols2' ||
      layout === 'split_left_vcols2' ||
      layout === 'split_right_vcols3' ||
      layout === 'split_left_vcols3';
    const isHeroOverlayLayout =
      layout === 'full_bleed' ||
      layout === 'full_bleed_vcols4' ||
      layout === 'full_bleed_vcols3' ||
      layout === 'full_bleed_split2';
    const textStartY = margin + 74;
    const textMaxY = pageHeight - margin - 8;
    const textWidth = isSplitLayout ? textWidthWithSplitImage : textWidthNoImage;
    const textStartX = layout.includes('split_left') ? splitImageWidth + margin * 0.6 : margin;
    doc.setDrawColor(95, 95, 105);
    if (isSplitLayout) {
      const lineStartX = textStartX;
      const lineEndX = Math.min(pageWidth - margin, textStartX + textWidth);
      if (lineEndX > lineStartX) {
        doc.line(lineStartX, margin + 44, lineEndX, margin + 44);
      }
    } else if (layout === 'text_only') {
      doc.line(margin, margin + 44, pageWidth - margin, margin + 44);
    }
    if (!isHeroOverlayLayout) {
      const bodyFontSize = 17;
      const bodyLineHeight = Math.round(bodyFontSize * 1.4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(232, 232, 238);
      const wrapped = doc.splitTextToSize(bodyText, textWidth);
      let cursorY = textStartY;
      for (const line of wrapped) {
        if (cursorY > textMaxY) break;
        doc.text(line, textStartX, cursorY);
        cursorY += bodyLineHeight;
      }
    }

    if (hasImage) {
      const resolvedImages = (
        await Promise.all(imageUrls.slice(0, 4).map((url) => loadImageForPdf(String(url))))
      ).filter((image): image is { dataUrl: string; format: 'PNG' | 'JPEG' | 'WEBP' } => Boolean(image));
      if (resolvedImages.length > 0) {
        try {
          const drawCover = async (
            source: { dataUrl: string; format: 'PNG' | 'JPEG' | 'WEBP' },
            x: number,
            y: number,
            w: number,
            h: number
          ) => {
            const covered = await renderCoverImageDataUrl(source.dataUrl, w, h);
            doc.addImage(covered, 'JPEG', x, y, w, h);
          };

          const drawHeroHeaderAndTextPanel = () => {
            // Re-draw top bar content for legibility over hero image
            doc.setFillColor(8, 8, 10);
            doc.rect(0, 0, pageWidth, 84, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.setTextColor(240, 240, 245);
            doc.text(slide.title || `Slide ${slide.orderIndex}`, margin, margin + 28);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(170, 170, 180);
            doc.text(input.deckTitle || 'Pitch Deck', pageWidth - margin, margin + 28, { align: 'right' });

            // Draw text panel over image for readable body copy
            const panelX = margin;
            const panelY =
              input.heroPanelPosition === 'top'
                ? 110
                : input.heroPanelPosition === 'lower_middle'
                  ? pageHeight - 280
                  : pageHeight - 200;
            const panelW = pageWidth - margin * 2;
            const panelH = 150;
            const panelTone = input.heroPanelOpacity === 'soft' ? 28 : input.heroPanelOpacity === 'strong' ? 6 : 14;
            if (input.heroPanelOpacity !== 'none') {
              doc.setFillColor(panelTone, panelTone, panelTone + 2);
              if (input.heroPanelStyle === 'square') {
                doc.rect(panelX, panelY, panelW, panelH, 'F');
              } else {
                doc.roundedRect(panelX, panelY, panelW, panelH, 10, 10, 'F');
              }
            }
            doc.setFont('helvetica', 'normal');
            const heroFontSize = 15;
            const heroLineHeight = Math.round(heroFontSize * 1.35);
            doc.setFontSize(heroFontSize);
            doc.setTextColor(232, 232, 238);
            const heroTextLines = doc.splitTextToSize(bodyText, panelW - 30);
            let heroY = panelY + 30;
            for (const line of heroTextLines) {
              if (heroY > panelY + panelH - 16) break;
              doc.text(line, panelX + 15, heroY);
              heroY += heroLineHeight;
            }
          };

          if (layout === 'full_bleed') {
            const fullBleed = await renderCoverImageDataUrl(resolvedImages[0].dataUrl, pageWidth, pageHeight);
            doc.addImage(fullBleed, 'JPEG', 0, 0, pageWidth, pageHeight);
            drawHeroHeaderAndTextPanel();
          } else if (layout === 'full_bleed_split2') {
            if (resolvedImages.length < 2) {
              const fullBleed = await renderCoverImageDataUrl(resolvedImages[0].dataUrl, pageWidth, pageHeight);
              doc.addImage(fullBleed, 'JPEG', 0, 0, pageWidth, pageHeight);
            } else {
              const heroTileW = pageWidth / 2;
              await drawCover(resolvedImages[0], 0, 0, heroTileW, pageHeight);
              await drawCover(resolvedImages[1], heroTileW, 0, heroTileW, pageHeight);
            }
            drawHeroHeaderAndTextPanel();
          } else if (layout === 'full_bleed_vcols3') {
            const heroCount = Math.max(1, Math.min(3, resolvedImages.length));
            const heroTileW = pageWidth / heroCount;
            for (let i = 0; i < heroCount; i += 1) {
              const x = i * heroTileW;
              await drawCover(resolvedImages[i], x, 0, heroTileW, pageHeight);
            }
            drawHeroHeaderAndTextPanel();
          } else if (layout === 'full_bleed_vcols4') {
            const heroCount = Math.max(1, Math.min(4, resolvedImages.length));
            const heroTileW = pageWidth / heroCount;
            for (let i = 0; i < heroCount; i += 1) {
              const x = i * heroTileW;
              await drawCover(resolvedImages[i], x, 0, heroTileW, pageHeight);
            }
            drawHeroHeaderAndTextPanel();
          } else {
            const paneX = layout.includes('split_left') ? 0 : pageWidth - splitImageWidth;
            const paneY = headerHeight;
            const paneW = splitImageWidth;
            const paneH = splitImageHeight;

            if (layout === 'split_left' || layout === 'split_right') {
              await drawCover(resolvedImages[0], paneX, paneY, paneW, paneH);
            } else if (layout === 'split_left_vcols2' || layout === 'split_right_vcols2') {
              if (resolvedImages.length < 2) {
                await drawCover(resolvedImages[0], paneX, paneY, paneW, paneH);
              } else {
                const tileW = (paneW - tileGap) / 2;
                await drawCover(resolvedImages[0], paneX, paneY, tileW, paneH);
                await drawCover(resolvedImages[1], paneX + tileW + tileGap, paneY, tileW, paneH);
              }
            } else if (layout === 'split_left_vcols3' || layout === 'split_right_vcols3') {
              if (resolvedImages.length < 2) {
                await drawCover(resolvedImages[0], paneX, paneY, paneW, paneH);
              } else if (resolvedImages.length < 3) {
                const tileW = (paneW - tileGap) / 2;
                await drawCover(resolvedImages[0], paneX, paneY, tileW, paneH);
                await drawCover(resolvedImages[1], paneX + tileW + tileGap, paneY, tileW, paneH);
              } else {
                const tileW = (paneW - tileGap * 2) / 3;
                await drawCover(resolvedImages[0], paneX, paneY, tileW, paneH);
                await drawCover(resolvedImages[1], paneX + tileW + tileGap, paneY, tileW, paneH);
                await drawCover(resolvedImages[2], paneX + (tileW + tileGap) * 2, paneY, tileW, paneH);
              }
            } else if (layout === 'split_left_vstack2' || layout === 'split_right_vstack2') {
              if (resolvedImages.length < 2) {
                await drawCover(resolvedImages[0], paneX, paneY, paneW, paneH);
              } else {
                const tileH = (paneH - tileGap) / 2;
                await drawCover(resolvedImages[0], paneX, paneY, paneW, tileH);
                await drawCover(resolvedImages[1], paneX, paneY + tileH + tileGap, paneW, tileH);
              }
            } else if (layout === 'split_left_grid4' || layout === 'split_right_grid4') {
              if (resolvedImages.length < 2) {
                // Graceful fallback to a single split image when gallery has 1 image.
                await drawCover(resolvedImages[0], paneX, paneY, paneW, paneH);
              } else if (resolvedImages.length < 4) {
                // Graceful fallback to two vertical tiles when gallery has 2-3 images.
                const tileH = (paneH - tileGap) / 2;
                await drawCover(resolvedImages[0], paneX, paneY, paneW, tileH);
                await drawCover(resolvedImages[1], paneX, paneY + tileH + tileGap, paneW, tileH);
              } else {
                const tileW = (paneW - tileGap) / 2;
                const tileH = (paneH - tileGap) / 2;
                const tiles = [
                  [paneX, paneY],
                  [paneX + tileW + tileGap, paneY],
                  [paneX, paneY + tileH + tileGap],
                  [paneX + tileW + tileGap, paneY + tileH + tileGap],
                ] as Array<[number, number]>;
                for (let tileIndex = 0; tileIndex < tiles.length; tileIndex += 1) {
                  const source = resolvedImages[tileIndex];
                  const [tileX, tileY] = tiles[tileIndex];
                  await drawCover(source, tileX, tileY, tileW, tileH);
                }
              }
            }
          }
        } catch {
          // If a specific image fails to encode, keep PDF generation resilient.
        }
      }
    }
  }

  return {
    blob: doc.output('blob'),
    fileName: sanitizeFileName(input.deckTitle || 'pitch-deck'),
  };
}

export default function PitchDeckEditorPage() {
  const router = useRouter();
  const params = useParams<{ deckId: string }>();
  const deckId = params?.deckId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckVersion, setDeckVersion] = useState<number>(1);
  const [deckStatus, setDeckStatus] = useState<string>('draft');
  const [deckTemplateId, setDeckTemplateId] = useState<string | undefined>(undefined);
  const [deckScreenplayId, setDeckScreenplayId] = useState<string | undefined>(undefined);
  const [slides, setSlides] = useState<PitchDeckSlide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [renamingDeck, setRenamingDeck] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saved'>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>([]);
  const [existingMediaLoading, setExistingMediaLoading] = useState(false);
  const [existingMediaError, setExistingMediaError] = useState<string | null>(null);
  const [selectedExistingMediaId, setSelectedExistingMediaId] = useState('');
  const [existingSourceFilter, setExistingSourceFilter] = useState<ExistingMediaSourceFilter>('character');
  const [existingEntityFilter, setExistingEntityFilter] = useState('all');
  const [existingVariantFilter, setExistingVariantFilter] = useState('all');
  const [showArchiveBrowser, setShowArchiveBrowser] = useState(false);
  const [archiveBrowserResolving, setArchiveBrowserResolving] = useState(false);
  const [archiveBrowserInitialFolderId, setArchiveBrowserInitialFolderId] = useState<string | null>(null);
  const [archiveBrowserRestrictFolderId, setArchiveBrowserRestrictFolderId] = useState<string | null>(null);
  const [imageModels, setImageModels] = useState<PitchDeckImageModel[]>([]);
  const [imageModelsLoading, setImageModelsLoading] = useState(false);
  const [imageModelsError, setImageModelsError] = useState<string | null>(null);
  const [promptGenerationText, setPromptGenerationText] = useState('');
  const [promptGenerationModelId, setPromptGenerationModelId] = useState('gemini-3.1-flash-image-2k');
  const [referencePromptText, setReferencePromptText] = useState('');
  const [referenceMediaId, setReferenceMediaId] = useState('');
  const [referenceMediaIds, setReferenceMediaIds] = useState<string[]>([]);
  const [referenceMediaIdentityKeys, setReferenceMediaIdentityKeys] = useState<string[]>([]);
  const [referenceGenerationModelId, setReferenceGenerationModelId] = useState('gemini-3.1-flash-image-2k');
  const [promptAspectRatio, setPromptAspectRatio] = useState<PitchDeckAspectRatio>('16:9');
  const [referenceAspectRatio, setReferenceAspectRatio] = useState<PitchDeckAspectRatio>('16:9');
  const [imageActionDraftHydratedKey, setImageActionDraftHydratedKey] = useState<string | null>(null);
  const [imageActionTab, setImageActionTab] = useState<ImageActionTab>('prompt');
  const [generatingFromPrompt, setGeneratingFromPrompt] = useState(false);
  const [generatingFromReference, setGeneratingFromReference] = useState(false);
  const [imageActionError, setImageActionError] = useState<string | null>(null);
  const [imageActionNotice, setImageActionNotice] = useState<string | null>(null);
  const [confirmSpendOpen, setConfirmSpendOpen] = useState(false);
  const [pendingImageAction, setPendingImageAction] = useState<'prompt' | 'reference' | null>(null);
  const [imageAttempts, setImageAttempts] = useState<ImageAttempt[]>([]);
  const [openImageMenuId, setOpenImageMenuId] = useState<string | null>(null);
  const [confirmRemoveImageId, setConfirmRemoveImageId] = useState<string | null>(null);
  const [imageViewerOption, setImageViewerOption] = useState<SlotImageOption | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [rewriteNotice, setRewriteNotice] = useState<string | null>(null);
  const [rewritePreviewText, setRewritePreviewText] = useState<string | null>(null);
  const [rewriteOriginalText, setRewriteOriginalText] = useState<string | null>(null);
  const [rewriteUndoText, setRewriteUndoText] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportIncludeImages, setExportIncludeImages] = useState(true);
  const [exportWatermarkEnabled, setExportWatermarkEnabled] = useState(true);
  const [exportWatermarkText, setExportWatermarkText] = useState('DRAFT');
  const [exportHeroPanelStyle, setExportHeroPanelStyle] = useState<'rounded' | 'square'>('rounded');
  const [exportHeroPanelOpacity, setExportHeroPanelOpacity] = useState<'none' | 'soft' | 'medium' | 'strong'>('medium');
  const [exportHeroPanelPosition, setExportHeroPanelPosition] = useState<'top' | 'bottom' | 'lower_middle'>('bottom');
  const [imageAttemptsHydrated, setImageAttemptsHydrated] = useState(false);

  const { uploadFile: uploadImageToS3 } = useDirectS3Upload();
  const pitchDeckAdvisorContext = useOptionalPitchDeckAdvisorContext();
  const existingMediaLoadedScopeRef = useRef<string | null>(null);
  const imageAutoSaveTimerRef = useRef<number | null>(null);
  const saveStatusRef = useRef<'idle' | 'unsaved' | 'saved'>('idle');
  const savingRef = useRef(false);
  const slidesRef = useRef<PitchDeckSlide[]>([]);
  const selectedSlideIdRef = useRef<string | null>(null);
  const activeImageJobPollsRef = useRef<Set<string>>(new Set());

  const featureEnabled = isFeatureEnabled();
  const mediaScopeKey = `${deckId || ''}:${deckScreenplayId || ''}`;
  const selectedSlide = useMemo(
    () => slides.find((slide) => slide.slideId === selectedSlideId) || null,
    [slides, selectedSlideId]
  );
  const selectedSlideIndex = useMemo(
    () => slides.findIndex((slide) => slide.slideId === selectedSlideId),
    [slides, selectedSlideId]
  );
  const selectedImageBlock = useMemo(
    () => selectedSlide?.blocks?.find((block) => block.type === 'image') || null,
    [selectedSlide]
  );
  const selectedExistingMedia = useMemo(
    () => existingMedia.find((item) => item.id === selectedExistingMediaId) || null,
    [existingMedia, selectedExistingMediaId]
  );
  const selectedReferenceMedia = useMemo(() => {
    const primaryReferenceId = referenceMediaIds[0];
    return existingMedia.find((item) => item.id === primaryReferenceId) || null;
  }, [existingMedia, referenceMediaIds]);
  const selectedReferenceMediaList = useMemo(
    () => referenceMediaIds.map((id) => existingMedia.find((item) => item.id === id)).filter(Boolean) as ExistingMediaItem[],
    [existingMedia, referenceMediaIds]
  );
  const filteredPromptPitchDeckImageModels = useMemo(
    () => sortPitchDeckModelsForPicker(imageModels.filter((model) => ALLOWED_PITCH_DECK_IMAGE_MODELS.has(model.id))),
    [imageModels]
  );
  const filteredReferencePitchDeckImageModels = useMemo(
    () => sortPitchDeckModelsForPicker(imageModels.filter((model) => ALLOWED_PITCH_DECK_REFERENCE_MODELS.has(model.id))),
    [imageModels]
  );
  const promptGenerationModel = useMemo(
    () => imageModels.find((model) => model.id === promptGenerationModelId) || null,
    [imageModels, promptGenerationModelId]
  );
  const referenceGenerationModel = useMemo(
    () => imageModels.find((model) => model.id === referenceGenerationModelId) || null,
    [imageModels, referenceGenerationModelId]
  );
  const maxReferenceCount = useMemo(
    () => getReferenceLimitByModel(referenceGenerationModelId),
    [referenceGenerationModelId]
  );
  const selectedSlidePrimaryText = useMemo(
    () => String(selectedSlide?.blocks.find((block) => block.type === 'text')?.content || ''),
    [selectedSlide]
  );
  const selectedSlideLayoutOverride = useMemo(
    () => (selectedSlide ? getSlideImageExportLayoutOverride(selectedSlide) : undefined),
    [selectedSlide]
  );
  const selectableImageLayouts = useMemo(
    () => PDF_LAYOUT_SELECTOR_OPTIONS.filter((option) => option.value !== 'text_only'),
    []
  );
  const selectedSlideLayoutControlValue = useMemo(() => {
    if (!selectedSlideLayoutOverride) return 'auto';
    if (selectedSlideLayoutOverride === 'text_only') return 'auto';
    return selectedSlideLayoutOverride;
  }, [selectedSlideLayoutOverride]);
  const selectedSlideImageEnabled = useMemo(
    () => (selectedSlide ? getSlideImageEnabled(selectedSlide) : true),
    [selectedSlide]
  );
  const selectedSlideLayout = useMemo<PdfImageLayout>(() => {
    if (!selectedSlide) return 'split_right';
    if (!selectedSlideImageEnabled) return 'text_only';
    const hasImage = getSlideOrderedImageUrlsForExport(selectedSlide).length > 0;
    return selectedSlideLayoutOverride || getPdfLayout(deckTemplateId, selectedSlide.slideType, hasImage);
  }, [deckTemplateId, selectedSlide, selectedSlideImageEnabled, selectedSlideLayoutOverride]);
  const suggestedAspectRatios = useMemo(
    () => getSuggestedAspectRatiosForLayout(selectedSlideLayout),
    [selectedSlideLayout]
  );
  const promptSupportedAspectRatios = useMemo(
    () => getAspectRatiosForModel(promptGenerationModelId),
    [promptGenerationModelId]
  );
  const referenceSupportedAspectRatios = useMemo(
    () => getAspectRatiosForModel(referenceGenerationModelId),
    [referenceGenerationModelId]
  );
  const suggestedPromptAspectRatios = useMemo(
    () => suggestedAspectRatios.filter((ratio) => promptSupportedAspectRatios.includes(ratio)).slice(0, 3),
    [suggestedAspectRatios, promptSupportedAspectRatios]
  );
  const suggestedReferenceAspectRatios = useMemo(
    () => suggestedAspectRatios.filter((ratio) => referenceSupportedAspectRatios.includes(ratio)).slice(0, 3),
    [suggestedAspectRatios, referenceSupportedAspectRatios]
  );
  const pitchDeckStoryAdvisorPacket = useMemo<PitchDeckStoryAdvisorContextPacket | null>(() => {
    if (!deckId) return null;

    const slideSummaries = [...slides]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .slice(0, 20)
      .map((slide) => ({
        slideId: slide.slideId,
        orderIndex: slide.orderIndex,
        slideType: slide.slideType,
        title: String(slide.title || '').slice(0, 140),
        text: getSlidePrimaryTextForExport(slide).slice(0, 420),
        imageLabels: getSlideImageLabelsForContext(slide),
      }));

    const selectedSummary = selectedSlide
      ? {
          slideId: selectedSlide.slideId,
          orderIndex: selectedSlide.orderIndex,
          slideType: selectedSlide.slideType,
          title: String(selectedSlide.title || '').slice(0, 140),
          text: selectedSlidePrimaryText.slice(0, 420),
          imageLabels: getSlideImageLabelsForContext(selectedSlide),
        }
      : undefined;

    return {
      contextType: 'pitch_deck_plus_screenplay',
      deckId,
      screenplayId: deckScreenplayId,
      deckTitle: deckTitle.slice(0, 160),
      deckTemplateId,
      deckStatus,
      slideCount: slides.length,
      selectedSlide: selectedSummary,
      slides: slideSummaries,
      generatedAt: new Date().toISOString(),
    };
  }, [
    deckId,
    slides,
    selectedSlide,
    selectedSlidePrimaryText,
    deckScreenplayId,
    deckTitle,
    deckTemplateId,
    deckStatus,
  ]);
  const selectedImageContent = useMemo(() => {
    if (!selectedImageBlock || typeof selectedImageBlock.content !== 'object' || !selectedImageBlock.content) {
      return {};
    }
    return selectedImageBlock.content as any;
  }, [selectedImageBlock]);
  const buildMediaProxyUrl = useCallback((s3Key?: string): string => {
    if (!s3Key) return '';
    return `/api/media/file?key=${encodeURIComponent(s3Key)}`;
  }, []);
  const selectedSlotImageOptions = useMemo(() => {
    const options = selectedImageContent.imageOptions;
    if (Array.isArray(options)) {
      return options
        .filter((option: any) => option && typeof option.imageUrl === 'string')
        .map((option: any) => {
          const directS3Key = typeof option?.s3Key === 'string' ? option.s3Key.trim() : '';
          const proxyS3Key = !directS3Key ? getMediaProxyS3KeyFromUrl(option.imageUrl) || '' : '';
          const optionLabel = typeof option?.label === 'string' ? option.label.trim() : '';
          const optionLabelBase = optionLabel.toLowerCase().replace(/\s*\(\d+\)\s*$/g, '').trim();
          const fallbackMatch =
            !directS3Key && !proxyS3Key && optionLabel
              ? existingMedia.find(
                  (item) =>
                    typeof item?.s3Key === 'string' &&
                    item.s3Key.length > 0 &&
                    typeof item?.label === 'string' &&
                    (item.label === optionLabel ||
                      item.label.toLowerCase().replace(/\s*\(\d+\)\s*$/g, '').trim() === optionLabelBase)
                )
              : null;
          const s3Key = directS3Key || proxyS3Key || fallbackMatch?.s3Key || undefined;
          const imageUrl = s3Key ? buildMediaProxyUrl(s3Key) : option.imageUrl;
          return {
            ...option,
            imageUrl,
            s3Key,
          } as SlotImageOption;
        });
    }
    const legacyImageUrl = typeof selectedImageContent.imageUrl === 'string' ? selectedImageContent.imageUrl : '';
    if (!legacyImageUrl) return [] as SlotImageOption[];
    return [
      {
        id: 'legacy_active',
        imageUrl: legacyImageUrl,
        sourceType: (selectedImageBlock?.sourceType || 'user_custom') as PitchDeckBlock['sourceType'],
        label: 'Current image',
        createdAt: new Date().toISOString(),
      },
    ];
  }, [buildMediaProxyUrl, existingMedia, selectedImageContent, selectedImageBlock]);
  const activeSlotImageId = useMemo(() => {
    const activeId = selectedImageContent.activeImageId;
    if (typeof activeId === 'string' && activeId.trim()) return activeId;
    return selectedSlotImageOptions[0]?.id || '';
  }, [selectedImageContent, selectedSlotImageOptions]);
  const imageViewerIndex = useMemo(() => {
    if (!imageViewerOption) return -1;
    return selectedSlotImageOptions.findIndex(
      (option) => option.id === imageViewerOption.id || option.imageUrl === imageViewerOption.imageUrl
    );
  }, [imageViewerOption, selectedSlotImageOptions]);
  const canViewPreviousImage = imageViewerIndex > 0;
  const canViewNextImage =
    imageViewerIndex >= 0 && imageViewerIndex < Math.max(0, selectedSlotImageOptions.length - 1);
  const openViewerAtIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= selectedSlotImageOptions.length) return;
      const nextOption = selectedSlotImageOptions[nextIndex];
      if (!nextOption) return;
      setImageViewerOption(nextOption);
    },
    [selectedSlotImageOptions]
  );
  const viewPreviousImageInViewer = useCallback(() => {
    if (!canViewPreviousImage) return;
    openViewerAtIndex(imageViewerIndex - 1);
  }, [canViewPreviousImage, imageViewerIndex, openViewerAtIndex]);
  const viewNextImageInViewer = useCallback(() => {
    if (!canViewNextImage) return;
    openViewerAtIndex(imageViewerIndex + 1);
  }, [canViewNextImage, imageViewerIndex, openViewerAtIndex]);
  const selectedExportImageIds = useMemo(() => {
    const rawIds = Array.isArray((selectedImageContent as any)?.exportImageIds)
      ? ((selectedImageContent as any).exportImageIds as any[])
      : [];
    const validIds = new Set(selectedSlotImageOptions.map((option) => option.id));
    return rawIds.filter((id) => typeof id === 'string' && validIds.has(id));
  }, [selectedImageContent, selectedSlotImageOptions]);
  const autoOrderedSlotOptionIds = useMemo(() => {
    const active = activeSlotImageId
      ? selectedSlotImageOptions.find((option) => option.id === activeSlotImageId) || null
      : null;
    const ordered = [...(active ? [active.id] : []), ...selectedSlotImageOptions.map((option) => option.id)];
    const deduped: string[] = [];
    const seen = new Set<string>();
    ordered.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      deduped.push(id);
    });
    return deduped;
  }, [activeSlotImageId, selectedSlotImageOptions]);
  const exportImageLimitForSelectedLayout = useMemo(
    () => getExportImageLimitForLayout(selectedSlideLayout),
    [selectedSlideLayout]
  );
  const effectiveExportOptionIds = useMemo(() => {
    const base = selectedExportImageIds.length > 0 ? selectedExportImageIds : autoOrderedSlotOptionIds;
    return base.slice(0, exportImageLimitForSelectedLayout);
  }, [selectedExportImageIds, autoOrderedSlotOptionIds, exportImageLimitForSelectedLayout]);
  const orderedSlotImageOptionsForExport = useMemo(
    () =>
      effectiveExportOptionIds
        .map((id) => selectedSlotImageOptions.find((option) => option.id === id))
        .filter(Boolean) as SlotImageOption[],
    [effectiveExportOptionIds, selectedSlotImageOptions]
  );
  const exportImagesUsedCount = useMemo(
    () => orderedSlotImageOptionsForExport.length,
    [orderedSlotImageOptionsForExport]
  );
  const exportHasIgnoredImages =
    selectedExportImageIds.length === 0 && autoOrderedSlotOptionIds.length > exportImageLimitForSelectedLayout;
  const exportSelectedOptionIds = useMemo(
    () => new Set(effectiveExportOptionIds),
    [effectiveExportOptionIds]
  );
  const exportSelectionOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    effectiveExportOptionIds.forEach((id, index) => {
      map.set(id, index + 1);
    });
    return map;
  }, [effectiveExportOptionIds]);
  const sessionSelectedSlideAttempts = useMemo(() => {
    if (!selectedSlide?.slideId) {
      return imageAttempts.filter((attempt) => attempt.slideId === UNKNOWN_ATTEMPT_SLIDE_ID);
    }
    return imageAttempts.filter(
      (attempt) => attempt.slideId === selectedSlide.slideId || attempt.slideId === UNKNOWN_ATTEMPT_SLIDE_ID
    );
  }, [imageAttempts, selectedSlide]);

  const recoveredSelectedSlideAttempts = useMemo(() => {
    if (!selectedSlide?.slideId) return [] as ImageAttempt[];
    const now = Date.now();
    return existingMedia
      .filter(
        (item) =>
          item.sourceType === 'pitch_deck' &&
          item.archiveSlideId === selectedSlide.slideId &&
          typeof item.imageUrl === 'string' &&
          item.imageUrl.length > 0
      )
      .map((item) => {
        const createdAt = typeof item.createdAt === 'string' ? item.createdAt : '';
        const createdMs = createdAt ? new Date(createdAt).getTime() : NaN;
        return {
          id: `recovered_${item.id}`,
          slideId: selectedSlide.slideId,
          status: 'success' as const,
          action: 'existing' as const,
          message: 'Recovered archived image.',
          at: Number.isFinite(createdMs) ? createdAt : new Date().toISOString(),
          imageUrl: item.imageUrl,
          s3Key: typeof item.s3Key === 'string' && item.s3Key.trim().length > 0 ? item.s3Key.trim() : undefined,
          archiveFileId: item.mediaFileId,
          archiveFolderId: item.archiveFolderId,
          _createdMs: Number.isFinite(createdMs) ? createdMs : Date.now(),
        };
      })
      .filter((attempt) => now - attempt._createdMs <= IMAGE_ATTEMPTS_RETENTION_MS)
      .map(({ _createdMs, ...attempt }) => attempt);
  }, [existingMedia, selectedSlide?.slideId]);

  const selectedSlideAttempts = useMemo(() => {
    const sorted = [...sessionSelectedSlideAttempts, ...recoveredSelectedSlideAttempts].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
    const deduped: ImageAttempt[] = [];
    const seen = new Set<string>();
    for (const attempt of sorted) {
      const key = attempt.imageUrl ? `img:${attempt.imageUrl}` : `attempt:${attempt.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(attempt);
    }
    return deduped.slice(0, 12);
  }, [recoveredSelectedSlideAttempts, sessionSelectedSlideAttempts]);

  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    selectedSlideIdRef.current = selectedSlideId;
  }, [selectedSlideId]);

  const queueImageActionAutoSave = () => {
    if (typeof window === 'undefined') return;
    if (imageAutoSaveTimerRef.current) {
      window.clearTimeout(imageAutoSaveTimerRef.current);
    }
    imageAutoSaveTimerRef.current = window.setTimeout(() => {
      imageAutoSaveTimerRef.current = null;
      if (savingRef.current) return;
      if (saveStatusRef.current !== 'unsaved') return;
      void saveSelectedSlide();
    }, 500);
  };
  const sourceScopedExistingMedia = useMemo(
    () => existingMedia.filter((item) => item.sourceType === existingSourceFilter),
    [existingMedia, existingSourceFilter]
  );
  const existingEntityOptions = useMemo(() => {
    const map = new Map<string, string>();
    sourceScopedExistingMedia.forEach((item) => {
      const entityFilterKey = `${item.sourceType}:${item.entityId}`;
      if (map.has(entityFilterKey)) return;
      map.set(entityFilterKey, item.entityName);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sourceScopedExistingMedia, existingSourceFilter]);
  const entityScopedExistingMedia = useMemo(
    () =>
      existingEntityFilter === 'all'
        ? sourceScopedExistingMedia
        : sourceScopedExistingMedia.filter((item) => `${item.sourceType}:${item.entityId}` === existingEntityFilter),
    [sourceScopedExistingMedia, existingEntityFilter]
  );
  const existingVariantOptions = useMemo(() => {
    const map = new Map<string, string>();
    entityScopedExistingMedia.forEach((item) => {
      if (!map.has(item.groupKey)) map.set(item.groupKey, item.groupLabel);
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entityScopedExistingMedia]);
  const filteredExistingMedia = useMemo(() => {
    if (existingVariantFilter === 'all') return entityScopedExistingMedia;
    return entityScopedExistingMedia.filter((item) => item.groupKey === existingVariantFilter);
  }, [entityScopedExistingMedia, existingVariantFilter]);

  useEffect(() => {
    if (deckStatus !== 'draft' && exportWatermarkText.trim().toUpperCase() === 'DRAFT') {
      setExportWatermarkEnabled(false);
    }
  }, [deckStatus, exportWatermarkText]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId) return;
    const storageKey = `${IMAGE_ACTION_TAB_STORAGE_KEY_PREFIX}${deckId}`;
    const savedTab = window.sessionStorage.getItem(storageKey);
    if (savedTab && IMAGE_ACTION_TABS.includes(savedTab as ImageActionTab)) {
      setImageActionTab(savedTab as ImageActionTab);
      return;
    }
    // For new decks (or first visit), default to prompt.
    setImageActionTab('prompt');
  }, [deckId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId) return;
    const storageKey = `${IMAGE_ACTION_TAB_STORAGE_KEY_PREFIX}${deckId}`;
    window.sessionStorage.setItem(storageKey, imageActionTab);
  }, [deckId, imageActionTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId || !selectedSlideId) return;
    const storageKey = `${SELECTED_SLIDE_STORAGE_KEY_PREFIX}${deckId}`;
    window.sessionStorage.setItem(storageKey, selectedSlideId);
  }, [deckId, selectedSlideId]);

  useEffect(() => {
    if (referenceMediaIds.length === 0) {
      return;
    }
    const nextKeys = Array.from(
      new Set(
        referenceMediaIds
          .map((id) => existingMedia.find((item) => item.id === id))
          .filter(Boolean)
          .map((item) => getExistingMediaIdentityKey(item))
          .filter(Boolean)
      )
    );
    if (nextKeys.length === 0) return;
    if (
      nextKeys.length !== referenceMediaIdentityKeys.length ||
      nextKeys.some((key, index) => key !== referenceMediaIdentityKeys[index])
    ) {
      setReferenceMediaIdentityKeys(nextKeys);
    }
  }, [existingMedia, referenceMediaIds, referenceMediaIdentityKeys]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId) return;
    const storageKey = `${IMAGE_ATTEMPTS_STORAGE_KEY_PREFIX}${deckId}`;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      setImageAttempts([]);
      setImageAttemptsHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const now = Date.now();
      const next = (Array.isArray(parsed) ? parsed : [])
        .filter((attempt): attempt is ImageAttempt => !!attempt && typeof attempt === 'object')
        .filter((attempt) => {
          const atMs = new Date(attempt.at || 0).getTime();
          return Number.isFinite(atMs) && now - atMs <= IMAGE_ATTEMPTS_RETENTION_MS;
        })
        .slice(0, 24);
      setImageAttempts(next);
    } catch {
      setImageAttempts([]);
    } finally {
      setImageAttemptsHydrated(true);
    }
  }, [deckId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId || !imageAttemptsHydrated) return;
    const storageKey = `${IMAGE_ATTEMPTS_STORAGE_KEY_PREFIX}${deckId}`;
    const now = Date.now();
    const retained = imageAttempts
      .filter((attempt) => {
        const atMs = new Date(attempt.at || 0).getTime();
        return Number.isFinite(atMs) && now - atMs <= IMAGE_ATTEMPTS_RETENTION_MS;
      })
      .slice(0, 24);
    window.sessionStorage.setItem(storageKey, JSON.stringify(retained));
  }, [deckId, imageAttempts, imageAttemptsHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId || !selectedSlide?.slideId) {
      setImageActionDraftHydratedKey(null);
      return;
    }
    const storageKey = `${IMAGE_ACTION_DRAFT_STORAGE_KEY_PREFIX}${deckId}:${selectedSlide.slideId}`;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      setImageActionDraftHydratedKey(storageKey);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ImageActionDraft;
      if (typeof parsed.promptGenerationText === 'string') setPromptGenerationText(parsed.promptGenerationText);
      if (typeof parsed.promptGenerationModelId === 'string') setPromptGenerationModelId(parsed.promptGenerationModelId);
      if (parsed.promptAspectRatio && PITCH_DECK_ASPECT_RATIOS.includes(parsed.promptAspectRatio)) {
        setPromptAspectRatio(parsed.promptAspectRatio);
      }
      if (typeof parsed.referencePromptText === 'string') setReferencePromptText(parsed.referencePromptText);
      if (typeof parsed.referenceMediaId === 'string') setReferenceMediaId(parsed.referenceMediaId);
      if (Array.isArray(parsed.referenceMediaIds)) {
        const nextIds = parsed.referenceMediaIds.filter((id): id is string => typeof id === 'string');
        setReferenceMediaIds(nextIds);
      }
      if (Array.isArray(parsed.referenceMediaIdentityKeys)) {
        const nextIdentityKeys = parsed.referenceMediaIdentityKeys
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean);
        setReferenceMediaIdentityKeys(Array.from(new Set(nextIdentityKeys)));
      } else {
        setReferenceMediaIdentityKeys([]);
      }
      if (typeof parsed.referenceGenerationModelId === 'string') {
        setReferenceGenerationModelId(parsed.referenceGenerationModelId);
      }
      if (parsed.referenceAspectRatio && PITCH_DECK_ASPECT_RATIOS.includes(parsed.referenceAspectRatio)) {
        setReferenceAspectRatio(parsed.referenceAspectRatio);
      }
    } catch {
      // Ignore malformed draft state and continue with in-memory values.
    } finally {
      setImageActionDraftHydratedKey(storageKey);
    }
  }, [deckId, selectedSlide?.slideId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!deckId || !selectedSlide?.slideId) return;
    const storageKey = `${IMAGE_ACTION_DRAFT_STORAGE_KEY_PREFIX}${deckId}:${selectedSlide.slideId}`;
    if (imageActionDraftHydratedKey !== storageKey) return;
    const draft: ImageActionDraft = {
      promptGenerationText,
      promptGenerationModelId,
      promptAspectRatio,
      referencePromptText,
      referenceMediaId,
      referenceMediaIds,
      referenceMediaIdentityKeys,
      referenceGenerationModelId,
      referenceAspectRatio,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [
    deckId,
    selectedSlide?.slideId,
    imageActionDraftHydratedKey,
    promptGenerationText,
    promptGenerationModelId,
    promptAspectRatio,
    referencePromptText,
    referenceMediaId,
    referenceMediaIds,
    referenceMediaIdentityKeys,
    referenceGenerationModelId,
    referenceAspectRatio,
  ]);

  useEffect(() => {
    if (!deckId || !imageAttemptsHydrated) return;
    let cancelled = false;

    const pollPendingJob = (jobId: string) => {
      if (!jobId || activeImageJobPollsRef.current.has(jobId)) return;
      activeImageJobPollsRef.current.add(jobId);
      void (async () => {
        const startedAt = Date.now();
        let delayMs = 2000;
        try {
          while (!cancelled && Date.now() - startedAt < 180000) {
            await new Promise((resolve) => setTimeout(resolve, Math.max(1000, Math.min(5000, delayMs))));
            if (cancelled) return;
            const job = await getPitchDeckImageJobStatus({ deckId, jobId });
            if (cancelled) return;
            if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'timed_out') {
              upsertImageAttemptFromJob(job);
              return;
            }
            delayMs = typeof job.pollAfterMs === 'number' ? job.pollAfterMs : delayMs;
          }
        } catch {
          // Keep recents resilient; polling errors are non-fatal here.
        } finally {
          activeImageJobPollsRef.current.delete(jobId);
        }
      })();
    };

    const hydrateRecentJobs = async () => {
      try {
        const jobs = await listPitchDeckImageJobs({ deckId, slideId: selectedSlide?.slideId, limit: 30 });
        if (cancelled) return;
        jobs.forEach((job) => {
          if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'timed_out') {
            upsertImageAttemptFromJob(job);
            return;
          }
          if (job.status === 'queued' || job.status === 'running') {
            pollPendingJob(job.jobId);
          }
        });
      } catch {
        // Silent fail to avoid interrupting main editor flow.
      }
    };

    void hydrateRecentJobs();
    const interval = window.setInterval(() => {
      void hydrateRecentJobs();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [deckId, imageAttemptsHydrated, selectedSlide?.slideId]);

  useEffect(() => {
    if (!imageViewerOption) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImageViewerOption(null);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        viewPreviousImageInViewer();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        viewNextImageInViewer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [imageViewerOption, viewNextImageInViewer, viewPreviousImageInViewer]);

  const normalizeImageUrl = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    return '';
  };

  const normalizeS3Key = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('x-amz-signature=') ||
      trimmed.includes('?')
    ) {
      return '';
    }
    return trimmed;
  };

  const isLikelySignedExpiringUrl = (value: string): boolean => {
    const lower = value.toLowerCase();
    return (
      lower.includes('x-amz-signature=') ||
      lower.includes('x-amz-algorithm=') ||
      lower.includes('x-amz-credential=') ||
      lower.includes('x-goog-signature=') ||
      lower.includes('googleaccessid=')
    );
  };

  type ImageCandidate = {
    imageUrl: string;
    s3Key?: string;
    outfitName?: string;
    angle?: string;
    backgroundType?: string;
    useCase?: string;
    sourceHint?: string;
  };

  const collectImageCandidatesFromUnknown = useCallback((value: unknown): ImageCandidate[] => {
    const direct = normalizeImageUrl(value);
    if (direct) return [{ imageUrl: direct }];
    if (Array.isArray(value)) {
      return value.flatMap((entry) => collectImageCandidatesFromUnknown(entry));
    }
    if (!value || typeof value !== 'object') return [];
    const objectValue = value as Record<string, unknown>;
    const metadata =
      objectValue.metadata && typeof objectValue.metadata === 'object'
        ? (objectValue.metadata as Record<string, unknown>)
        : {};
    const s3Key =
      normalizeS3Key(objectValue.s3Key) ||
      normalizeS3Key((objectValue as any).storageKey) ||
      normalizeS3Key(metadata.s3Key) ||
      normalizeS3Key((metadata as any).storageKey) ||
      '';
    const candidateKeys = [
      'imageUrl',
      'url',
      'sourceImageUrl',
      'originalImageUrl',
      'portraitUrl',
      'headshotUrl',
    ];
    const directCandidates = candidateKeys
      .map((key) => normalizeImageUrl(objectValue[key]))
      .filter(Boolean)
      .map((imageUrl) => ({
        imageUrl,
        s3Key: s3Key || undefined,
        outfitName:
          String(
            objectValue.outfitName ||
              metadata.outfitName ||
              metadata.outfit ||
              objectValue.outfit ||
              ''
          ).trim() || undefined,
        angle: String(objectValue.angle || metadata.angle || '').trim() || undefined,
        backgroundType:
          String(objectValue.backgroundType || metadata.backgroundType || '').trim() || undefined,
        useCase: String(objectValue.useCase || metadata.useCase || '').trim() || undefined,
        sourceHint: String(objectValue.sourceType || metadata.sourceType || objectValue.source || metadata.source || '').trim() || undefined,
      }));

    const nestedKeys = [
      'images',
      'referenceImages',
      'poseReferences',
      'angleReferences',
      'angleVariations',
      'backgrounds',
      'media',
      'baseReference',
      'portrait',
      'headshot',
    ];
    const nestedCandidates = nestedKeys.flatMap((key) => collectImageCandidatesFromUnknown(objectValue[key]));

    const deduped = new Map<string, ImageCandidate>();
    [...directCandidates, ...nestedCandidates].forEach((candidate) => {
      if (!candidate.imageUrl) return;
      const dedupeKey = [
        candidate.s3Key || '',
        candidate.imageUrl,
        candidate.outfitName || '',
        candidate.angle || '',
        candidate.backgroundType || '',
        candidate.sourceHint || '',
      ].join('|');
      if (!deduped.has(dedupeKey)) deduped.set(dedupeKey, candidate);
    });
    return Array.from(deduped.values());
  }, []);

  const extractEntityImageCandidates = useCallback((entity: Record<string, unknown>, fields: string[]): ImageCandidate[] => {
    const deduped = new Map<string, ImageCandidate>();
    fields
      .flatMap((field) => collectImageCandidatesFromUnknown(entity[field]))
      .forEach((candidate) => {
        const dedupeKey = [
          candidate.s3Key || '',
          candidate.imageUrl,
          candidate.outfitName || '',
          candidate.angle || '',
          candidate.backgroundType || '',
          candidate.sourceHint || '',
          candidate.useCase || '',
        ].join('|');
        if (!deduped.has(dedupeKey)) deduped.set(dedupeKey, candidate);
      });
    return Array.from(deduped.values());
  }, [collectImageCandidatesFromUnknown]);

  useEffect(() => {
    if (!deckId || !featureEnabled) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPitchDeck(deckId);
        if (cancelled) return;
        setDeckTitle(data.deck.title);
        setDeckVersion(data.deck.version);
        setDeckStatus(data.deck.status || 'draft');
        setDeckTemplateId(data.deck.templateId);
        setDeckScreenplayId(data.deck.screenplayId);
        setSlides(data.slides);
        const defaultSlideId = data.slides[0]?.slideId || null;
        let restoredSlideId: string | null = null;
        if (typeof window !== 'undefined') {
          const storageKey = `${SELECTED_SLIDE_STORAGE_KEY_PREFIX}${deckId}`;
          const savedSlideId = window.sessionStorage.getItem(storageKey);
          if (savedSlideId && data.slides.some((slide) => slide.slideId === savedSlideId)) {
            restoredSlideId = savedSlideId;
          }
        }
        setSelectedSlideId(restoredSlideId || defaultSlideId);
        setSaveStatus('idle');
        setSavedAt(null);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load deck');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [deckId, featureEnabled]);

  const refreshExistingMedia = useCallback(async (): Promise<boolean> => {
    if (!deckScreenplayId || !featureEnabled) return false;
    setExistingMediaLoading(true);
    setExistingMediaError(null);
    try {
      const [charactersRes, locationsRes, propsRes, pitchDeckMediaRes] = await Promise.all([
        fetch(`/api/screenplays/${encodeURIComponent(deckScreenplayId)}/characters?context=production-hub`, {
          cache: 'no-store',
        }),
        fetch(`/api/screenplays/${encodeURIComponent(deckScreenplayId)}/locations?context=production-hub`, {
          cache: 'no-store',
        }),
        fetch(`/api/asset-bank?screenplayId=${encodeURIComponent(deckScreenplayId)}`, { cache: 'no-store' }),
        fetch(
          `/api/media/list?screenplayId=${encodeURIComponent(deckScreenplayId)}&entityType=pitch-deck&limit=200`,
          { cache: 'no-store' }
        ),
      ]);

      const [charactersJson, locationsJson, propsJson, pitchDeckMediaJson] = await Promise.all([
        charactersRes.ok ? charactersRes.json() : Promise.resolve({}),
        locationsRes.ok ? locationsRes.json() : Promise.resolve({}),
        propsRes.ok ? propsRes.json() : Promise.resolve({}),
        pitchDeckMediaRes.ok ? pitchDeckMediaRes.json() : Promise.resolve({}),
      ]);

      const collected: ExistingMediaItem[] = [];
      const seen = new Set<string>();
      const pushMedia = (item: ExistingMediaItem) => {
        const dedupeKey = `${item.sourceType}:${item.entityId}:${item.groupKey}:${item.imageUrl}`;
        if (!item.imageUrl || seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        collected.push(item);
      };

      const characters = (charactersJson?.data?.characters || []) as any[];
      characters.forEach((character) => {
        const name = String(character?.name || 'Character');
        const characterId = String(character?.character_id || character?.id || name);
        const imageCandidates = extractEntityImageCandidates(character as Record<string, unknown>, [
          'images',
          'referenceImages',
          'poseReferences',
          'angleReferences',
          'media',
          'portrait',
          'headshot',
        ]);
        imageCandidates.forEach((candidate, index) => {
          const outfitLabel = candidate.outfitName || 'Creation';
          const rawImageUrl = normalizeImageUrl(candidate.imageUrl || '');
          const s3Key = typeof candidate.s3Key === 'string' ? candidate.s3Key.trim() : '';
          if (!s3Key && (!rawImageUrl || isLikelySignedExpiringUrl(rawImageUrl))) {
            return;
          }
          const imageUrl = s3Key ? `/api/media/file?key=${encodeURIComponent(s3Key)}` : rawImageUrl;
          pushMedia({
            id: `character:${characterId}:${index}`,
            label: `Character - ${name}${candidate.outfitName ? ` • ${candidate.outfitName}` : ''}${index > 0 ? ` (${index + 1})` : ''}`,
            sourceType: 'character',
            entityId: characterId,
            entityName: name,
            groupKey: `outfit:${outfitLabel.toLowerCase()}`,
            groupLabel: `Outfit: ${outfitLabel}`,
            outfitName: candidate.outfitName,
            imageUrl,
            s3Key: s3Key || undefined,
          });
        });
      });

      const locations = (locationsJson?.data?.locations || []) as any[];
      locations.forEach((location) => {
        const name = String(location?.name || 'Location');
        const locationId = String(location?.location_id || location?.id || name);
        const canonicalImages = Array.isArray(location?.images) ? location.images : [];
        canonicalImages.forEach((image: any, index: number) => {
          const metadata = (typeof image?.metadata === 'object' && image.metadata) ? image.metadata : {};
          const s3Key =
            typeof image?.s3Key === 'string' && image.s3Key.trim().length > 0
              ? image.s3Key.trim()
              : typeof metadata?.s3Key === 'string' && metadata.s3Key.trim().length > 0
                ? metadata.s3Key.trim()
                : '';
          const rawImageUrl = normalizeImageUrl(image?.imageUrl || image?.url || '');
          if (!s3Key && (!rawImageUrl || isLikelySignedExpiringUrl(rawImageUrl))) {
            return;
          }
          const imageUrl = s3Key ? `/api/media/file?key=${encodeURIComponent(s3Key)}` : rawImageUrl;
          const angle = typeof metadata?.angle === 'string' ? metadata.angle : (typeof image?.angle === 'string' ? image.angle : undefined);
          const backgroundType =
            typeof metadata?.backgroundType === 'string'
              ? metadata.backgroundType
              : (typeof image?.backgroundType === 'string' ? image.backgroundType : undefined);
          const sourceHint = typeof metadata?.source === 'string' ? metadata.source : '';
          const variantLabel =
            backgroundType
              ? `Background: ${backgroundType}`
              : angle
                ? `Angle: ${angle}`
                : sourceHint.toLowerCase().includes('angle')
                  ? 'Angle'
                  : 'Creation';
          pushMedia({
            id: `location:${locationId}:${typeof image?.s3Key === 'string' ? image.s3Key : index}`,
            label: `Location - ${name} • ${variantLabel}`,
            sourceType: 'location',
            entityId: locationId,
            entityName: name,
            groupKey: `variant:${variantLabel.toLowerCase()}`,
            groupLabel: variantLabel,
            angle: angle || undefined,
            backgroundType: backgroundType || undefined,
            imageUrl,
            s3Key: s3Key || undefined,
          });
        });
      });

      const props = (propsJson?.assets || []) as any[];
      props.forEach((prop) => {
        const name = String(prop?.name || 'Prop');
        const propId = String(prop?.id || name);
        const imageCandidates = extractEntityImageCandidates(prop as Record<string, unknown>, [
          'images',
          'referenceImages',
          'angleReferences',
          'media',
        ]);
        imageCandidates.forEach((candidate, index) => {
          const rawImageUrl = normalizeImageUrl(candidate.imageUrl || '');
          const s3Key = typeof candidate.s3Key === 'string' ? candidate.s3Key.trim() : '';
          if (!s3Key && (!rawImageUrl || isLikelySignedExpiringUrl(rawImageUrl))) {
            return;
          }
          const imageUrl = s3Key ? `/api/media/file?key=${encodeURIComponent(s3Key)}` : rawImageUrl;
          pushMedia({
            id: `prop:${propId}:${index}`,
            label: `Prop - ${name}${index > 0 ? ` (${index + 1})` : ''}`,
            sourceType: 'prop',
            entityId: propId,
            entityName: name,
            groupKey: 'variant:all',
            groupLabel: 'All',
            imageUrl,
            s3Key: s3Key || undefined,
          });
        });
      });

      const pitchDeckFiles = Array.isArray(pitchDeckMediaJson?.files) ? pitchDeckMediaJson.files : [];
      pitchDeckFiles
        .filter((file) => {
          const metadata = file?.metadata || {};
          const isDeckMatch = String(metadata?.deckId || '') === String(deckId);
          const isImage = String(file?.mediaFileType || '').toLowerCase() === 'image';
          const hasS3Key = typeof file?.s3Key === 'string' && file.s3Key.length > 0;
          return isDeckMatch && isImage && hasS3Key;
        })
        .forEach((file, index) => {
          const metadata = file?.metadata || {};
          const s3Key = String(file.s3Key);
          const slideLabel = String(metadata?.slideTitle || metadata?.slideType || 'Slide');
          pushMedia({
            id: `pitchdeck:${String(file.fileId || index)}`,
            label: `Pitch Deck - ${slideLabel}`,
            sourceType: 'pitch_deck',
            entityId: String(metadata?.deckId || deckId),
            entityName: 'Pitch Deck Archive',
            groupKey: `slide:${String(metadata?.slideId || slideLabel).toLowerCase()}`,
            groupLabel: `Slide: ${slideLabel}`,
            imageUrl: `/api/media/file?key=${encodeURIComponent(s3Key)}`,
            s3Key,
            mediaFileId: typeof file.fileId === 'string' ? file.fileId : undefined,
              archiveFolderId: typeof file.folderId === 'string' ? file.folderId : undefined,
            archiveDeckId: typeof metadata?.deckId === 'string' ? metadata.deckId : undefined,
            archiveSlideId: typeof metadata?.slideId === 'string' ? metadata.slideId : undefined,
            createdAt: typeof file.createdAt === 'string' ? file.createdAt : undefined,
          });
        });

      setExistingMedia(collected);
      setSelectedExistingMediaId((prev) => prev || collected[0]?.id || '');
      setReferenceMediaId((prev) => prev || collected[0]?.id || '');
      return true;
    } catch (err: any) {
      setExistingMedia([]);
      setExistingMediaError(err?.message || 'Failed to load screenplay media');
      return false;
    } finally {
      setExistingMediaLoading(false);
    }
  }, [deckId, deckScreenplayId, extractEntityImageCandidates, featureEnabled]);

  useEffect(() => {
    if (!deckScreenplayId || !featureEnabled) return;

    let cancelled = false;

    const loadImageModels = async () => {
      setImageModelsLoading(true);
      setImageModelsError(null);
      try {
        const models = await listImageGenerationModels();
        if (cancelled) return;
        setImageModels(models);
        const allowedPromptModels = sortPitchDeckModelsForPicker(models.filter((model) => ALLOWED_PITCH_DECK_IMAGE_MODELS.has(model.id)));
        const allowedReferenceModels = sortPitchDeckModelsForPicker(models.filter((model) => ALLOWED_PITCH_DECK_REFERENCE_MODELS.has(model.id)));
        const preferred =
          allowedPromptModels.find((model) => model.id === 'gemini-3.1-flash-image-2k') ||
          allowedPromptModels.find((model) => model.id === 'flux2-pro-2k') ||
          allowedPromptModels[0];
        if (preferred) {
          setPromptGenerationModelId((current) =>
            allowedPromptModels.some((model) => model.id === current) ? current : preferred.id
          );
        }
        const preferredReference =
          allowedReferenceModels.find((model) => model.id === 'gemini-3.1-flash-image-2k') ||
          allowedReferenceModels.find((model) => model.id === 'nano-banana-pro-2k') ||
          allowedReferenceModels.find((model) => model.id === 'nano-banana-pro');
        if (preferredReference) {
          setReferenceGenerationModelId((current) =>
            allowedReferenceModels.some((model) => model.id === current) ? current : preferredReference.id
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setImageModels([]);
          setImageModelsError(err?.message || 'Failed to load image model pricing');
        }
      } finally {
        if (!cancelled) setImageModelsLoading(false);
      }
    };

    const needsMediaForActiveTab = imageActionTab === 'library' || imageActionTab === 'reference';
    if (needsMediaForActiveTab && existingMediaLoadedScopeRef.current !== mediaScopeKey) {
      void (async () => {
        const loaded = await refreshExistingMedia();
        if (!cancelled && loaded) {
          existingMediaLoadedScopeRef.current = mediaScopeKey;
        }
      })();
    }
    void loadImageModels();

    return () => {
      cancelled = true;
    };
  }, [deckScreenplayId, featureEnabled, imageActionTab, mediaScopeKey, refreshExistingMedia]);

  useEffect(() => {
    if (!deckScreenplayId || !featureEnabled) return;
    if (existingMediaLoadedScopeRef.current === mediaScopeKey) return;
    const hasLikelyExpiringSlotUrl = selectedSlotImageOptions.some((option) => {
      if (option?.s3Key) return false;
      const value = String(option?.imageUrl || '').toLowerCase();
      if (!value) return false;
      return (
        value.includes('x-amz-signature=') ||
        value.includes('x-amz-algorithm=') ||
        value.includes('x-amz-credential=') ||
        value.includes('x-goog-signature=') ||
        value.includes('googleaccessid=')
      );
    });
    if (!hasLikelyExpiringSlotUrl) return;
    void (async () => {
      const loaded = await refreshExistingMedia();
      if (loaded) {
        existingMediaLoadedScopeRef.current = mediaScopeKey;
      }
    })();
  }, [deckScreenplayId, featureEnabled, mediaScopeKey, refreshExistingMedia, selectedSlotImageOptions]);

  useEffect(() => {
    if (imageActionTab !== 'library' || !deckScreenplayId || !featureEnabled) return;
    let cancelled = false;
    const pollIntervalMs = 8000;

    const pollOnce = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const loaded = await refreshExistingMedia();
      if (!cancelled && loaded) {
        existingMediaLoadedScopeRef.current = mediaScopeKey;
      }
    };

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void pollOnce();
      }
    };

    const intervalId = window.setInterval(() => {
      void pollOnce();
    }, pollIntervalMs);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [deckScreenplayId, featureEnabled, imageActionTab, mediaScopeKey, refreshExistingMedia]);

  useEffect(() => {
    if (existingEntityFilter === 'all') return;
    const exists = existingEntityOptions.some((option) => option.value === existingEntityFilter);
    if (!exists) setExistingEntityFilter('all');
  }, [existingEntityFilter, existingEntityOptions]);

  useEffect(() => {
    if (existingVariantFilter === 'all') return;
    const exists = existingVariantOptions.some((option) => option.value === existingVariantFilter);
    if (!exists) setExistingVariantFilter('all');
  }, [existingVariantFilter, existingVariantOptions]);

  useEffect(() => {
    if (existingMediaLoading) return;
    if (existingMediaLoadedScopeRef.current !== mediaScopeKey) return;
    if (filteredExistingMedia.length === 0) {
      setSelectedExistingMediaId('');
      setReferenceMediaId('');
      return;
    }
    if (!filteredExistingMedia.some((item) => item.id === selectedExistingMediaId)) {
      setSelectedExistingMediaId(filteredExistingMedia[0].id);
    }
    if (!filteredExistingMedia.some((item) => item.id === referenceMediaId)) {
      setReferenceMediaId(filteredExistingMedia[0].id);
    }
  }, [existingMediaLoading, filteredExistingMedia, mediaScopeKey, selectedExistingMediaId, referenceMediaId]);

  useEffect(() => {
    if (existingMediaLoading) return;
    if (existingMediaLoadedScopeRef.current !== mediaScopeKey) return;
    const validIds = new Set(existingMedia.map((item) => item.id));
    setReferenceMediaIds((current) => current.filter((id) => validIds.has(id)));
    if (referenceMediaId && !validIds.has(referenceMediaId)) {
      setReferenceMediaId('');
    }
  }, [existingMedia, existingMediaLoading, mediaScopeKey, referenceMediaId]);

  useEffect(() => {
    if (existingMediaLoading) return;
    if (existingMediaLoadedScopeRef.current !== mediaScopeKey) return;
    if (referenceMediaIdentityKeys.length === 0) return;
    const existingIds = new Set(existingMedia.map((item) => item.id));
    const hasValidCurrentSelection = referenceMediaIds.some((id) => existingIds.has(id));
    // Preserve active user toggles/order when IDs are still valid; identity->ID remap is only for rehydration
    // after media refreshes or storage-key changes where old IDs no longer resolve.
    if (hasValidCurrentSelection) return;
    const identityToId = new Map<string, string>();
    existingMedia.forEach((item) => {
      const key = getExistingMediaIdentityKey(item);
      if (!key) return;
      if (!identityToId.has(key)) identityToId.set(key, item.id);
    });
    const resolvedIds = referenceMediaIdentityKeys
      .map((key) => identityToId.get(key))
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (resolvedIds.length === 0) return;
    const cappedIds = resolvedIds.slice(0, maxReferenceCount);
    const idsChanged =
      cappedIds.length !== referenceMediaIds.length || cappedIds.some((id, index) => id !== referenceMediaIds[index]);
    if (idsChanged) {
      setReferenceMediaIds(cappedIds);
    }
    if (!referenceMediaId || !cappedIds.includes(referenceMediaId)) {
      setReferenceMediaId(cappedIds[0] || '');
    }
  }, [
    existingMedia,
    existingMediaLoading,
    mediaScopeKey,
    maxReferenceCount,
    referenceMediaId,
    referenceMediaIdentityKeys,
    referenceMediaIds,
  ]);

  useEffect(() => {
    setReferenceMediaIds((current) => current.slice(0, maxReferenceCount));
  }, [maxReferenceCount]);

  useEffect(() => {
    const suggestedPrimary = suggestedAspectRatios[0] || '16:9';
    setPromptAspectRatio(suggestedPrimary);
    setReferenceAspectRatio(suggestedPrimary);
  }, [selectedSlideId, suggestedAspectRatios]);

  useEffect(() => {
    if (!promptSupportedAspectRatios.includes(promptAspectRatio)) {
      setPromptAspectRatio(promptSupportedAspectRatios[0] || '16:9');
    }
  }, [promptAspectRatio, promptSupportedAspectRatios]);

  useEffect(() => {
    if (!referenceSupportedAspectRatios.includes(referenceAspectRatio)) {
      setReferenceAspectRatio(referenceSupportedAspectRatios[0] || '16:9');
    }
  }, [referenceAspectRatio, referenceSupportedAspectRatios]);

  useEffect(() => {
    setRewriteError(null);
    setRewriteNotice(null);
    setRewritePreviewText(null);
    setRewriteOriginalText(null);
    setRewriteUndoText(null);
    setOpenImageMenuId(null);
    setConfirmRemoveImageId(null);
  }, [selectedSlideId]);

  useEffect(() => {
    pitchDeckAdvisorContext?.setPacket(pitchDeckStoryAdvisorPacket);
  }, [pitchDeckStoryAdvisorPacket, pitchDeckAdvisorContext]);

  useEffect(() => {
    return () => {
      pitchDeckAdvisorContext?.setPacket(null);
    };
  }, [pitchDeckAdvisorContext]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && imageAutoSaveTimerRef.current) {
        window.clearTimeout(imageAutoSaveTimerRef.current);
        imageAutoSaveTimerRef.current = null;
      }
    };
  }, []);

  const updateSelectedSlideText = (nextText: string) => {
    if (!selectedSlide) return;
    const currentBlocks = Array.isArray(selectedSlide.blocks) ? [...selectedSlide.blocks] : [];
    const textIndex = currentBlocks.findIndex((block) => block.type === 'text');
    const baseBlock: PitchDeckBlock =
      textIndex >= 0
        ? currentBlocks[textIndex]
        : {
            blockId: `block_text_${Date.now()}`,
            type: 'text',
            content: '',
            sourceType: 'user_custom',
            lockedByUser: true,
          };

    const updatedTextBlock: PitchDeckBlock = {
      ...baseBlock,
      content: nextText,
      sourceType: 'user_custom',
      lockedByUser: true,
    };

    if (textIndex >= 0) {
      currentBlocks[textIndex] = updatedTextBlock;
    } else {
      currentBlocks.unshift(updatedTextBlock);
    }

    setSlides((prev) =>
      prev.map((slide) =>
        slide.slideId === selectedSlide.slideId
          ? {
              ...slide,
              blocks: currentBlocks,
            }
          : slide
      )
    );
    setSaveStatus('unsaved');
  };

  const openRewriteForSlide = () => {
    if (!selectedSlidePrimaryText.trim()) {
      setRewriteError('Add slide text before running rewrite.');
      setRewriteNotice(null);
      return;
    }
    setRewriteError(null);
    setRewriteNotice(null);
    setRewriteModalOpen(true);
  };

  const captureRewritePreview = (rewrittenText: string) => {
    const nextText = String(rewrittenText || '').trim();
    if (!nextText) {
      setRewriteError('Rewrite returned empty text.');
      return;
    }
    setRewriteOriginalText(selectedSlidePrimaryText);
    setRewritePreviewText(nextText);
    setRewriteNotice('Rewrite preview ready. Review and apply when ready.');
    setRewriteError(null);
    setRewriteModalOpen(false);
  };

  const applyRewritePreview = () => {
    if (!rewritePreviewText) return;
    const currentText = String(selectedSlide?.blocks.find((block) => block.type === 'text')?.content || '');
    setRewriteUndoText(rewriteOriginalText ?? currentText);
    updateSelectedSlideText(rewritePreviewText);
    setRewriteNotice('Rewrite applied. You can undo and re-apply this draft if needed.');
    setRewriteError(null);
    queueImageActionAutoSave();
  };

  const undoLastRewrite = () => {
    if (!rewriteUndoText) return;
    updateSelectedSlideText(rewriteUndoText);
    setRewriteUndoText(null);
    setRewriteNotice('Undo complete. Previous slide text restored; preview is still available to re-apply.');
    setRewriteError(null);
    queueImageActionAutoSave();
  };

  const saveSelectedSlide = async () => {
    if (!deckId) return;
    if (savingRef.current) return;
    const currentSlideId = selectedSlideIdRef.current;
    const currentSlide = currentSlideId ? slidesRef.current.find((slide) => slide.slideId === currentSlideId) : null;
    if (!currentSlide) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updatePitchDeckSlide(deckId, currentSlide.slideId, {
        expectedVersion: currentSlide.version,
        title: currentSlide.title,
        notes: currentSlide.notes || '',
        blocks: currentSlide.blocks,
      });
      setSlides((prev) => prev.map((slide) => (slide.slideId === updated.slideId ? updated : slide)));
      setSaveStatus('saved');
      setSavedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  const addImageAttempt = (
    status: ImageAttempt['status'],
    action: ImageAttempt['action'],
    message: string,
    extras?: Pick<ImageAttempt, 'imageUrl' | 's3Key' | 'archiveFileId' | 'archiveFolderId'>
  ) => {
    const slideId = selectedSlide?.slideId || UNKNOWN_ATTEMPT_SLIDE_ID;
    setImageAttempts((prev) => [
      {
        id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        slideId,
        status,
        action,
        message,
        at: new Date().toISOString(),
        imageUrl: extras?.imageUrl,
        s3Key: extras?.s3Key,
        archiveFileId: extras?.archiveFileId,
        archiveFolderId: extras?.archiveFolderId,
      },
      ...prev.slice(0, 24),
    ]);
  };

  const upsertImageAttemptFromJob = (job: PitchDeckImageJobStatusResponse) => {
    if (!job || typeof job !== 'object') return;
    if (!job.jobId || (job.status !== 'succeeded' && job.status !== 'failed' && job.status !== 'timed_out')) return;
    const attempt: ImageAttempt = {
      id: `job_${job.jobId}`,
      jobId: job.jobId,
      slideId:
        typeof job.slideId === 'string' && job.slideId
          ? job.slideId
          : selectedSlideIdRef.current || UNKNOWN_ATTEMPT_SLIDE_ID,
      status: job.status === 'succeeded' ? 'success' : 'failed',
      action: job.operation === 'prompt' ? 'prompt' : 'reference',
      message:
        job.status === 'succeeded'
          ? job.operation === 'prompt'
            ? 'Generated image from prompt.'
            : 'Generated image from reference.'
          : job.error?.message || (job.status === 'timed_out' ? 'Failed: generation timed out.' : 'Failed: generation error.'),
      at: job.completedAt || job.updatedAt || job.createdAt || new Date().toISOString(),
      imageUrl: typeof job.imageUrl === 'string' ? job.imageUrl : undefined,
      s3Key:
        (typeof job.s3Key === 'string' && job.s3Key.trim().length > 0
          ? job.s3Key.trim()
          : getMediaProxyS3KeyFromUrl(typeof job.imageUrl === 'string' ? job.imageUrl : '')) || undefined,
      archiveFileId: job.archive?.fileId,
      archiveFolderId: job.archive?.folderId,
    };
    setImageAttempts((prev) => {
      const withoutExisting = prev.filter((item) => item.id !== attempt.id && item.jobId !== attempt.jobId);
      const next = [attempt, ...withoutExisting]
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 24);
      return next;
    });
  };

  const updateSelectedSlideImageUrl = (
    nextImageUrl: string,
    sourceType: PitchDeckBlock['sourceType'] = 'user_custom',
    extras?: { activeImageId?: string; imageOptions?: SlotImageOption[]; exportImageIds?: string[] }
  ) => {
    if (!selectedSlide) return;
    const currentBlocks = Array.isArray(selectedSlide.blocks) ? [...selectedSlide.blocks] : [];
    const imageIndex = currentBlocks.findIndex((block) => block.type === 'image');

    const baseImageBlock: PitchDeckBlock =
      imageIndex >= 0
        ? currentBlocks[imageIndex]
        : {
            blockId: `block_image_${Date.now()}`,
            type: 'image',
            content: {
              slotId: 'hero',
              imageUrl: '',
              alt: '',
              fit: 'cover',
              imageOptions: [],
              activeImageId: '',
            },
            sourceType: 'user_custom',
            lockedByUser: false,
          };

    const baseContent =
      typeof baseImageBlock.content === 'object' && baseImageBlock.content ? (baseImageBlock.content as any) : {};
    const nextContent = {
      ...baseContent,
      imageUrl: nextImageUrl,
      ...(extras?.activeImageId !== undefined ? { activeImageId: extras.activeImageId } : {}),
      ...(extras?.imageOptions !== undefined ? { imageOptions: extras.imageOptions } : {}),
      ...(extras?.exportImageIds !== undefined ? { exportImageIds: extras.exportImageIds } : {}),
    };

    const updatedImageBlock: PitchDeckBlock = {
      ...baseImageBlock,
      content: nextContent,
      sourceType: nextImageUrl ? sourceType : baseImageBlock.sourceType,
    };

    if (imageIndex >= 0) {
      currentBlocks[imageIndex] = updatedImageBlock;
    } else {
      currentBlocks.push(updatedImageBlock);
    }

    setSlides((prev) =>
      prev.map((slide) =>
        slide.slideId === selectedSlide.slideId
          ? {
              ...slide,
              blocks: currentBlocks,
            }
          : slide
      )
    );
    setSaveStatus('unsaved');
  };

  const updateSelectedSlideExportLayout = (nextLayout: 'auto' | PdfImageLayout) => {
    if (!selectedSlide) return;
    const currentBlocks = Array.isArray(selectedSlide.blocks) ? [...selectedSlide.blocks] : [];
    const imageIndex = currentBlocks.findIndex((block) => block.type === 'image');
    const baseImageBlock: PitchDeckBlock =
      imageIndex >= 0
        ? currentBlocks[imageIndex]
        : {
            blockId: `block_image_${Date.now()}`,
            type: 'image',
            content: {
              imageUrl: '',
              imageOptions: [],
              activeImageId: '',
            },
            sourceType: 'user_custom',
            lockedByUser: true,
          };
    const baseContent =
      typeof baseImageBlock.content === 'object' && baseImageBlock.content
        ? { ...(baseImageBlock.content as Record<string, unknown>) }
        : {};

    if (nextLayout === 'auto') {
      delete (baseContent as any).exportLayout;
    } else {
      (baseContent as any).exportLayout = nextLayout;
    }

    const updatedImageBlock: PitchDeckBlock = {
      ...baseImageBlock,
      content: baseContent,
    };

    if (imageIndex >= 0) {
      currentBlocks[imageIndex] = updatedImageBlock;
    } else {
      currentBlocks.push(updatedImageBlock);
    }

    setSlides((prev) =>
      prev.map((slide) =>
        slide.slideId === selectedSlide.slideId
          ? {
              ...slide,
              blocks: currentBlocks,
            }
          : slide
      )
    );
    setSaveStatus('unsaved');
    queueImageActionAutoSave();
  };

  const updateSelectedSlideImageEnabled = (enabled: boolean) => {
    if (!selectedSlide) return;
    const currentBlocks = Array.isArray(selectedSlide.blocks) ? [...selectedSlide.blocks] : [];
    const imageIndex = currentBlocks.findIndex((block) => block.type === 'image');
    const baseImageBlock: PitchDeckBlock =
      imageIndex >= 0
        ? currentBlocks[imageIndex]
        : {
            blockId: `block_image_${Date.now()}`,
            type: 'image',
            content: {
              imageUrl: '',
              imageOptions: [],
              activeImageId: '',
            },
            sourceType: 'user_custom',
            lockedByUser: true,
          };
    const baseContent =
      typeof baseImageBlock.content === 'object' && baseImageBlock.content
        ? { ...(baseImageBlock.content as Record<string, unknown>) }
        : {};
    (baseContent as any).imageEnabled = enabled;

    const updatedImageBlock: PitchDeckBlock = {
      ...baseImageBlock,
      content: baseContent,
    };

    if (imageIndex >= 0) {
      currentBlocks[imageIndex] = updatedImageBlock;
    } else {
      currentBlocks.push(updatedImageBlock);
    }

    setSlides((prev) =>
      prev.map((slide) =>
        slide.slideId === selectedSlide.slideId
          ? {
              ...slide,
              blocks: currentBlocks,
            }
          : slide
      )
    );
    setSaveStatus('unsaved');
    queueImageActionAutoSave();
  };

  const appendSlotImageOption = (
    input: {
      imageUrl: string;
      sourceType: PitchDeckBlock['sourceType'];
      label: string;
      s3Key?: string;
    }
  ) => {
    const persistentImageUrl = input.s3Key ? buildMediaProxyUrl(input.s3Key) : input.imageUrl;
    const nextOption: SlotImageOption = {
      id: `imgopt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      imageUrl: persistentImageUrl,
      sourceType: input.sourceType,
      label: input.label,
      createdAt: new Date().toISOString(),
      s3Key: input.s3Key,
    };
    const deduped = selectedSlotImageOptions.filter((option) => option.imageUrl !== persistentImageUrl);
    const nextOptions = [nextOption, ...deduped].slice(0, 30);
    const candidateExportIds = [nextOption.id, ...selectedExportImageIds.filter((id) => id !== nextOption.id)];
    const nextExportIds =
      exportImageLimitForSelectedLayout > 0
        ? candidateExportIds.slice(0, exportImageLimitForSelectedLayout)
        : [];
    updateSelectedSlideImageUrl(persistentImageUrl, input.sourceType, {
      activeImageId: nextOption.id,
      imageOptions: nextOptions,
      exportImageIds: nextExportIds,
    });
    queueImageActionAutoSave();
  };

  const appendSlotImageOptions = (
    inputs: Array<{
      imageUrl: string;
      sourceType: PitchDeckBlock['sourceType'];
      label: string;
      s3Key?: string;
    }>
  ): number => {
    if (!inputs || inputs.length === 0) return 0;
    const seenIncoming = new Set<string>();
    const nextBatch: SlotImageOption[] = [];
    inputs.forEach((input) => {
      const persistentImageUrl = input.s3Key ? buildMediaProxyUrl(input.s3Key) : input.imageUrl;
      if (!persistentImageUrl || seenIncoming.has(persistentImageUrl)) return;
      seenIncoming.add(persistentImageUrl);
      nextBatch.push({
        id: `imgopt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        imageUrl: persistentImageUrl,
        sourceType: input.sourceType,
        label: input.label,
        createdAt: new Date().toISOString(),
        s3Key: input.s3Key,
      });
    });
    if (nextBatch.length === 0) return 0;

    const incomingUrls = new Set(nextBatch.map((option) => option.imageUrl));
    const dedupedExisting = selectedSlotImageOptions.filter((option) => !incomingUrls.has(option.imageUrl));
    const nextOptions = [...nextBatch, ...dedupedExisting].slice(0, 30);
    const activeOption = nextOptions[0];
    if (!activeOption) return 0;

    const nextBatchIds = new Set(nextBatch.map((option) => option.id));
    const candidateExportIds = [
      ...nextBatch.map((option) => option.id),
      ...selectedExportImageIds.filter((id) => !nextBatchIds.has(id)),
    ];
    const nextExportIds =
      exportImageLimitForSelectedLayout > 0
        ? candidateExportIds.slice(0, exportImageLimitForSelectedLayout)
        : [];

    updateSelectedSlideImageUrl(activeOption.imageUrl, activeOption.sourceType, {
      activeImageId: activeOption.id,
      imageOptions: nextOptions,
      exportImageIds: nextExportIds,
    });
    queueImageActionAutoSave();
    return nextBatch.length;
  };

  const archiveSlotImageToPitchDeckLibrary = async (input: {
    s3Key?: string;
    source: 'prompt' | 'reference' | 'upload' | 'manual';
    label?: string;
  }): Promise<{ fileId?: string; folderId?: string; alreadyExisted?: boolean } | null> => {
    if (!deckId || !selectedSlide?.slideId || !input.s3Key) return null;
    try {
      const archived = await archivePitchDeckImage({
        deckId,
        slideId: selectedSlide.slideId,
        slideType: selectedSlide.slideType,
        slideTitle: selectedSlide.title,
        s3Key: input.s3Key,
        label: input.label,
        source: input.source,
      });
      const fallbackId = `pitchdeck_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const slideLabel = String(selectedSlide.title || selectedSlide.slideType || 'Slide');
      const nextArchiveItem: ExistingMediaItem = {
        id: `pitchdeck:${archived.fileId || fallbackId}`,
        label: `Pitch Deck - ${slideLabel}`,
        sourceType: 'pitch_deck',
        entityId: String(deckId),
        entityName: 'Pitch Deck Archive',
        groupKey: `slide:${String(selectedSlide.slideId || slideLabel).toLowerCase()}`,
        groupLabel: `Slide: ${slideLabel}`,
        imageUrl: `/api/media/file?key=${encodeURIComponent(input.s3Key)}`,
        s3Key: input.s3Key,
        mediaFileId: archived.fileId,
        archiveFolderId: archived.folderId,
        archiveDeckId: String(deckId),
        archiveSlideId: String(selectedSlide.slideId),
      };
      setExistingMedia((prev) => {
        if (prev.some((item) => item.imageUrl === nextArchiveItem.imageUrl)) return prev;
        return [nextArchiveItem, ...prev].slice(0, 400);
      });
      existingMediaLoadedScopeRef.current = null;
      void refreshExistingMedia();
      return archived;
    } catch {
      // Non-blocking: gallery flow should continue even if archive registration fails.
      existingMediaLoadedScopeRef.current = null;
      void refreshExistingMedia();
      return null;
    }
  };

  const selectSlotImageOption = (optionId: string) => {
    if (exportImageLimitForSelectedLayout <= 0) {
      setImageActionNotice('This layout does not use slide images in export.');
      setImageActionError(null);
      return;
    }
    if (!selectedSlide) return;
    let blockedByLimit = false;
    let changed = false;
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.slideId !== selectedSlide.slideId) return slide;
        const currentBlocks = Array.isArray(slide.blocks) ? [...slide.blocks] : [];
        const imageIndex = currentBlocks.findIndex((block) => block.type === 'image');
        if (imageIndex < 0) return slide;
        const imageBlock = currentBlocks[imageIndex];
        const baseContent =
          typeof imageBlock.content === 'object' && imageBlock.content
            ? { ...(imageBlock.content as Record<string, unknown>) }
            : {};
        const options = Array.isArray((baseContent as any).imageOptions) ? ((baseContent as any).imageOptions as any[]) : [];
        const validIds = new Set(options.map((option) => (typeof option?.id === 'string' ? option.id : '')).filter(Boolean));
        const rawExportIds = Array.isArray((baseContent as any).exportImageIds)
          ? ((baseContent as any).exportImageIds as any[])
          : [];
        const existingExportIds = rawExportIds.filter((id) => typeof id === 'string' && validIds.has(id));
        const fallbackId = typeof (baseContent as any).activeImageId === 'string' ? String((baseContent as any).activeImageId) : '';
        const current = existingExportIds.length > 0 ? existingExportIds : fallbackId && validIds.has(fallbackId) ? [fallbackId] : [];
        const exists = current.includes(optionId);
        let nextIds = current;
        if (exists) {
          // Keep one selected at all times to avoid confusing auto-reassignment.
          if (current.length === 1) {
            return slide;
          }
          nextIds = current.filter((id) => id !== optionId);
        } else if (current.length >= exportImageLimitForSelectedLayout) {
          if (exportImageLimitForSelectedLayout === 1) {
            // For single-image layouts, clicking another tile should switch selection.
            nextIds = [optionId];
          } else {
            blockedByLimit = true;
            return slide;
          }
        } else {
          // Re-select behavior appends to the end so ordering stays user-controlled.
          nextIds = [...current, optionId];
        }
        changed = true;
        const clicked = options.find((option) => option?.id === optionId);
        (baseContent as any).activeImageId = optionId;
        if (typeof clicked?.imageUrl === 'string') {
          (baseContent as any).imageUrl = clicked.imageUrl;
        }
        (baseContent as any).exportImageIds = nextIds;
        currentBlocks[imageIndex] = {
          ...imageBlock,
          content: baseContent,
        };
        return {
          ...slide,
          blocks: currentBlocks,
        };
      })
    );
    if (blockedByLimit) {
      setImageActionNotice(
        `This layout supports up to ${exportImageLimitForSelectedLayout} export image${
          exportImageLimitForSelectedLayout === 1 ? '' : 's'
        }.`
      );
      setImageActionError(null);
      return;
    }
    if (!changed) return;
    setSaveStatus('unsaved');
    setImageActionError(null);
    queueImageActionAutoSave();
  };

  const removeSlotImageOption = (optionId: string) => {
    const option = selectedSlotImageOptions.find((item) => item.id === optionId);
    if (!option) return;
    const nextOptions = selectedSlotImageOptions.filter((item) => item.id !== optionId);
    const nextActive = nextOptions[0];
    const nextValidIds = new Set(nextOptions.map((option) => option.id));
    let nextExportIds = selectedExportImageIds.filter((id) => nextValidIds.has(id) && id !== optionId);
    if (nextExportIds.length === 0 && nextActive && exportImageLimitForSelectedLayout > 0) {
      nextExportIds = [nextActive.id];
    }
    updateSelectedSlideImageUrl(nextActive?.imageUrl || '', nextActive?.sourceType || 'user_custom', {
      activeImageId: nextActive?.id || '',
      imageOptions: nextOptions,
      exportImageIds: nextExportIds,
    });
    setImageActionNotice(`Removed image option: ${option.label}`);
    setImageActionError(null);
    queueImageActionAutoSave();
  };

  const requestRemoveSlotImageOption = (optionId: string) => {
    setOpenImageMenuId(null);
    setConfirmRemoveImageId(optionId);
  };

  const confirmRemoveSlotImageOption = () => {
    if (!confirmRemoveImageId) return;
    removeSlotImageOption(confirmRemoveImageId);
    setConfirmRemoveImageId(null);
  };

  const applyExistingMediaToSlot = () => {
    setImageActionError(null);
    setImageActionNotice(null);
    if (!selectedExistingMedia) {
      setImageActionError('Select an existing image first.');
      return;
    }
    appendSlotImageOption({
      imageUrl: selectedExistingMedia.imageUrl,
      sourceType: 'existing_media',
      label: selectedExistingMedia.label,
      s3Key: selectedExistingMedia.s3Key,
    });
    setImageActionNotice('Added existing screenplay image to this slot gallery.');
  };

  const initialArchiveFolderId = useMemo(() => {
    if (selectedExistingMedia?.sourceType === 'pitch_deck' && selectedExistingMedia.archiveFolderId) {
      return selectedExistingMedia.archiveFolderId;
    }
    const currentSlideArchive = existingMedia.find(
      (item) => item.sourceType === 'pitch_deck' && item.archiveSlideId === selectedSlide?.slideId && !!item.archiveFolderId
    );
    if (currentSlideArchive?.archiveFolderId) return currentSlideArchive.archiveFolderId;
    const firstArchive = existingMedia.find((item) => item.sourceType === 'pitch_deck' && !!item.archiveFolderId);
    return firstArchive?.archiveFolderId || null;
  }, [existingMedia, selectedExistingMedia, selectedSlide?.slideId]);

  const deckArchiveRootFolderId = useMemo(() => {
    const archiveItems = existingMedia.filter((item) => item.sourceType === 'pitch_deck' && !!item.archiveFolderId);
    if (archiveItems.length === 0) return null;
    const byFolder = new Map<string, number>();
    archiveItems.forEach((item) => {
      const folderId = item.archiveFolderId as string;
      byFolder.set(folderId, (byFolder.get(folderId) || 0) + 1);
    });
    return Array.from(byFolder.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [existingMedia]);

  const findFolderById = useCallback((tree: FolderTreeNode[], folderId: string): FolderTreeNode | null => {
    for (const node of tree) {
      if (node.folderId === folderId) return node;
      const child = findFolderById(node.children || [], folderId);
      if (child) return child;
    }
    return null;
  }, []);

  const findFolderByName = useCallback((tree: FolderTreeNode[], normalizedName: string): FolderTreeNode | null => {
    for (const node of tree) {
      if (node.folderName.trim().toLowerCase() === normalizedName) return node;
      const child = findFolderByName(node.children || [], normalizedName);
      if (child) return child;
    }
    return null;
  }, []);

  const isFolderInsideSubtree = useCallback((subtreeRoot: FolderTreeNode, folderId: string): boolean => {
    if (subtreeRoot.folderId === folderId) return true;
    const children = subtreeRoot.children || [];
    for (const child of children) {
      if (isFolderInsideSubtree(child, folderId)) return true;
    }
    return false;
  }, []);

  const openArchiveBrowser = useCallback(async () => {
    if (!deckScreenplayId) return;
    setArchiveBrowserResolving(true);
    setImageActionError(null);

    try {
      const response = await fetch(`/api/media/folders/tree?screenplayId=${encodeURIComponent(deckScreenplayId)}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load archive folders');
      }
      const payload = await response.json();
      const tree: FolderTreeNode[] = Array.isArray(payload?.tree) ? payload.tree : [];

      const pitchDeckRoot =
        findFolderByName(tree, 'pitchdecks') ||
        findFolderByName(tree, 'pitch decks');
      const deckFolderName = `deck_${String(deckId || '').slice(-8).toLowerCase()}`;
      const deckFolder =
        pitchDeckRoot && Array.isArray(pitchDeckRoot.children)
          ? findFolderByName(pitchDeckRoot.children, deckFolderName)
          : null;

      const resolvedRestrictFolderId =
        pitchDeckRoot?.folderId ||
        deckArchiveRootFolderId ||
        null;

      // Open at PitchDecks root so users can see all pitch deck archive descendants.
      // Keep deck folder as fallback only when no root exists.
      let resolvedInitialFolderId =
        pitchDeckRoot?.folderId ||
        deckFolder?.folderId ||
        initialArchiveFolderId ||
        resolvedRestrictFolderId;
      if (resolvedRestrictFolderId && resolvedInitialFolderId) {
        const restrictNode = findFolderById(tree, resolvedRestrictFolderId);
        if (restrictNode && !isFolderInsideSubtree(restrictNode, resolvedInitialFolderId)) {
          resolvedInitialFolderId = resolvedRestrictFolderId;
        }
      }

      setArchiveBrowserRestrictFolderId(resolvedRestrictFolderId);
      setArchiveBrowserInitialFolderId(resolvedInitialFolderId || null);
    } catch (err: any) {
      setArchiveBrowserRestrictFolderId(deckArchiveRootFolderId || null);
      setArchiveBrowserInitialFolderId(initialArchiveFolderId || deckArchiveRootFolderId || null);
      setImageActionError(err?.message || 'Could not resolve archive folder. Showing fallback view.');
    } finally {
      setArchiveBrowserResolving(false);
      setShowArchiveBrowser(true);
    }
  }, [
    deckId,
    deckScreenplayId,
    deckArchiveRootFolderId,
    findFolderById,
    findFolderByName,
    initialArchiveFolderId,
    isFolderInsideSubtree,
  ]);

  useEffect(() => {
    if (imageActionTab !== 'library') return;
    if (existingSourceFilter === 'pitch_deck') {
      setExistingSourceFilter('character');
      setExistingEntityFilter('all');
      setExistingVariantFilter('all');
    }
  }, [existingSourceFilter, imageActionTab]);

  const addFromArchiveBrowser = (files: MediaFile[]) => {
    if (!files || files.length === 0) {
      setImageActionError('Select at least one image from archive.');
      return;
    }
    const addedCount = appendSlotImageOptions(
      files.map((file) => {
        const s3Key = typeof file.s3Key === 'string' ? file.s3Key : '';
        const imageUrl = s3Key ? `/api/media/file?key=${encodeURIComponent(s3Key)}` : file.fileUrl || '';
        return {
          imageUrl,
          sourceType: 'existing_media' as PitchDeckBlock['sourceType'],
          label: file.fileName || 'Archive image',
          s3Key: s3Key || undefined,
        };
      })
    );
    setShowArchiveBrowser(false);
    if (addedCount > 0) {
      setImageActionNotice(`Added ${addedCount} archive image${addedCount === 1 ? '' : 's'} to this slot gallery.`);
      setImageActionError(null);
    } else {
      setImageActionError('Selected files did not include valid image URLs.');
    }
  };

  useEffect(() => {
    setShowArchiveBrowser(false);
    setArchiveBrowserResolving(false);
    setArchiveBrowserInitialFolderId(null);
    setArchiveBrowserRestrictFolderId(null);
  }, [deckId]);

  const toggleReferenceMediaSelection = (mediaId: string) => {
    setImageActionError(null);
    setReferenceMediaIds((current) => {
      if (current.includes(mediaId)) {
        const next = current.filter((id) => id !== mediaId);
        if (referenceMediaId === mediaId) {
          setReferenceMediaId(next[0] || '');
        }
        if (next.length === 0) {
          setReferenceMediaIdentityKeys([]);
        }
        return next;
      }
      if (current.length >= maxReferenceCount) {
        setImageActionError(`This model supports up to ${maxReferenceCount} references.`);
        return current;
      }
      const next = [...current, mediaId];
      if (!referenceMediaId) {
        setReferenceMediaId(mediaId);
      }
      return next;
    });
  };

  const runGenerateFromPrompt = async () => {
    if (!promptGenerationText.trim()) {
      setImageActionError('Add a prompt before generating an image.');
      addImageAttempt('failed', 'prompt', 'Failed: prompt is required.');
      return;
    }
    setImageActionError(null);
    setImageActionNotice(null);
    setGeneratingFromPrompt(true);
    try {
      const result = await generatePitchDeckImageFromPrompt({
        prompt: promptGenerationText.trim(),
        providerId: promptGenerationModelId || undefined,
        screenplayId: deckScreenplayId,
        aspectRatio: promptAspectRatio,
        deckId,
        slideId: selectedSlide?.slideId,
        slideType: selectedSlide?.slideType,
        slideTitle: selectedSlide?.title,
      });
      if (!result.imageUrl) {
        throw new Error('Image generation returned no image URL');
      }
      appendSlotImageOption({
        imageUrl: result.imageUrl,
        sourceType: 'ai_generated',
        label: `Prompt result (${promptGenerationModel?.label || promptGenerationModelId})`,
        s3Key: result.s3Key,
      });
      let archiveInfo = result.archive || null;
      if (!result.archive && result.s3Key) {
        archiveInfo = await archiveSlotImageToPitchDeckLibrary({
          s3Key: result.s3Key,
          source: 'prompt',
          label: `Prompt result (${promptGenerationModel?.label || promptGenerationModelId})`,
        });
      } else {
        setExistingSourceFilter('pitch_deck');
        existingMediaLoadedScopeRef.current = null;
        void refreshExistingMedia();
      }
      addImageAttempt(
        'success',
        'prompt',
        'Generated image from prompt.',
        {
          imageUrl: result.s3Key ? `/api/media/file?key=${encodeURIComponent(result.s3Key)}` : result.imageUrl,
          s3Key: result.s3Key,
          archiveFileId: archiveInfo?.fileId,
          archiveFolderId: archiveInfo?.folderId,
        }
      );
      setImageActionNotice('Generated image from prompt.');
    } catch (err: any) {
      const message = err?.message || 'Failed to generate image from prompt';
      setImageActionError(message);
      addImageAttempt('failed', 'prompt', `Failed: ${message}`);
    } finally {
      setGeneratingFromPrompt(false);
    }
  };

  const runGenerateFromReference = async () => {
    if (!deckId) {
      setImageActionError('Pitch deck context is missing.');
      addImageAttempt('failed', 'reference', 'Failed: deckId is missing.');
      return;
    }
    const primaryReference = selectedReferenceMediaList[0];
    if (!primaryReference?.imageUrl) {
      setImageActionError('Choose at least one reference image first.');
      addImageAttempt('failed', 'reference', 'Failed: no reference media selected.');
      return;
    }
    if (!referencePromptText.trim()) {
      setImageActionError('Add a reference prompt before generating.');
      addImageAttempt('failed', 'reference', 'Failed: reference prompt is required.');
      return;
    }
    setImageActionError(null);
    setImageActionNotice(null);
    setGeneratingFromReference(true);
    try {
      const sourceImageUrls = selectedReferenceMediaList
        .map((item) => item.imageUrl)
        .map((url) => {
          if (typeof window === 'undefined') return url;
          if (!url) return url;
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) return url;
          if (url.startsWith('/')) return `${window.location.origin}${url}`;
          return url;
        })
        .filter((url) => typeof url === 'string' && url.trim().length > 0);
      const normalizedSourceImageUrls =
        sourceImageUrls.length > 0 ? sourceImageUrls : [primaryReference.imageUrl].filter(Boolean);
      const result = await generatePitchDeckImageFromReference({
        deckId,
        sourceImageUrls: normalizedSourceImageUrls,
        editPrompt: referencePromptText.trim(),
        desiredModelId: referenceGenerationModelId || undefined,
        aspectRatio: referenceAspectRatio,
        slideId: selectedSlide?.slideId,
        slideType: selectedSlide?.slideType,
        slideTitle: selectedSlide?.title,
      });
      if (!result.imageUrl) {
        throw new Error('Reference generation returned no image URL');
      }
      appendSlotImageOption({
        imageUrl: result.imageUrl,
        sourceType: 'ai_generated',
        label: `Reference result (${primaryReference.label})`,
        s3Key: result.s3Key,
      });
      let archiveInfo = result.archive || null;
      if (!result.archive && result.s3Key) {
        archiveInfo = await archiveSlotImageToPitchDeckLibrary({
          s3Key: result.s3Key,
          source: 'reference',
          label: `Reference result (${primaryReference.label})`,
        });
      } else {
        setExistingSourceFilter('pitch_deck');
        existingMediaLoadedScopeRef.current = null;
        void refreshExistingMedia();
      }
      addImageAttempt(
        'success',
        'reference',
        'Generated image from reference.',
        {
          imageUrl: result.s3Key ? `/api/media/file?key=${encodeURIComponent(result.s3Key)}` : result.imageUrl,
          s3Key: result.s3Key,
          archiveFileId: archiveInfo?.fileId,
          archiveFolderId: archiveInfo?.folderId,
        }
      );
      setImageActionNotice('Generated image from reference.');
    } catch (err: any) {
      const message = err?.message || 'Failed to generate image from reference';
      setImageActionError(message);
      addImageAttempt('failed', 'reference', `Failed: ${message}`);
    } finally {
      setGeneratingFromReference(false);
    }
  };

  const requestGenerateFromPrompt = () => {
    if (!promptGenerationText.trim()) {
      setImageActionError('Add a prompt before generating an image.');
      return;
    }
    if (!promptGenerationModelId) {
      setImageActionError('Select an image model first.');
      return;
    }
    setImageActionError(null);
    setPendingImageAction('prompt');
    setConfirmSpendOpen(true);
  };

  const requestGenerateFromReference = () => {
    if (!selectedReferenceMediaList[0]) {
      setImageActionError('Choose at least one reference image first.');
      return;
    }
    if (!referencePromptText.trim()) {
      setImageActionError('Add a reference prompt before generating.');
      return;
    }
    if (!referenceGenerationModelId) {
      setImageActionError('Select a remix model first.');
      return;
    }
    setImageActionError(null);
    setPendingImageAction('reference');
    setConfirmSpendOpen(true);
  };

  const handleUploadImageToSlot = async (file?: File | null) => {
    if (!file) return;
    if (!deckScreenplayId) {
      const message = 'Cannot upload image: screenplay context is missing.';
      setImageActionError(message);
      return;
    }
    setImageActionError(null);
    setImageActionNotice(null);
    setUploadingImage(true);
    try {
      const uploaded = await uploadImageToS3({
        file,
        projectId: deckScreenplayId,
      });
      if (!uploaded?.s3Url) {
        throw new Error('Upload did not return an image URL');
      }
      appendSlotImageOption({
        imageUrl: uploaded.s3Url,
        sourceType: 'user_custom',
        label: `Upload - ${file.name}`,
        s3Key: uploaded.s3Key || undefined,
      });
      await archiveSlotImageToPitchDeckLibrary({
        s3Key: uploaded.s3Key || undefined,
        source: 'upload',
        label: `Upload - ${file.name}`,
      });
      setImageActionNotice('Uploaded image added to slot gallery.');
    } catch (err: any) {
      const message = err?.message || 'Failed to upload image';
      setImageActionError(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const downloadRecentAttemptImage = useCallback(
    async (attempt: ImageAttempt) => {
      if (!attempt.imageUrl) return;
      setImageActionError(null);
      try {
        const safeTimestamp = new Date(attempt.at || Date.now()).toISOString().replace(/[:.]/g, '-');
        const s3Key = getMediaProxyS3KeyFromUrl(attempt.imageUrl);
        await downloadImageAsBlob(attempt.imageUrl, `pitch-deck-recent-${safeTimestamp}`, s3Key);
        setImageActionNotice('Image downloaded.');
      } catch (err: any) {
        setImageActionError(err?.message || 'Failed to download image.');
      }
    },
    [setImageActionError, setImageActionNotice]
  );

  const confirmAndRunPendingImageAction = async () => {
    const action = pendingImageAction;
    setConfirmSpendOpen(false);
    setPendingImageAction(null);
    if (action === 'prompt') {
      await runGenerateFromPrompt();
      return;
    }
    if (action === 'reference') {
      await runGenerateFromReference();
    }
  };

  const handleExportPdf = async () => {
    if (!deckId) return;
    setExportingPdf(true);
    setError(null);
    try {
      const { blob, fileName } = await generatePitchDeckPdfClient({
        deckTitle,
        slides,
        templateId: deckTemplateId,
        includeImages: exportIncludeImages,
        watermarkEnabled: exportWatermarkEnabled,
        watermarkText: exportWatermarkText.trim() || 'DRAFT',
        heroPanelStyle: exportHeroPanelStyle,
        heroPanelOpacity: exportHeroPanelOpacity,
        heroPanelPosition: exportHeroPanelPosition,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || 'pitch-deck.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const goToPreviousSlide = () => {
    if (selectedSlideIndex <= 0) return;
    const prevSlide = slides[selectedSlideIndex - 1];
    if (!prevSlide) return;
    setSelectedSlideId(prevSlide.slideId);
    setSaveStatus('idle');
    setSavedAt(null);
    setImageActionError(null);
    setImageActionNotice(null);
  };

  const goToNextSlide = () => {
    if (selectedSlideIndex < 0 || selectedSlideIndex >= slides.length - 1) return;
    const nextSlide = slides[selectedSlideIndex + 1];
    if (!nextSlide) return;
    setSelectedSlideId(nextSlide.slideId);
    setSaveStatus('idle');
    setSavedAt(null);
    setImageActionError(null);
    setImageActionNotice(null);
  };

  const handleRenameDeck = async () => {
    if (!deckId) return;
    const nextTitle = window.prompt('Rename pitch deck', deckTitle || '');
    if (!nextTitle) return;
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === deckTitle) return;

    setRenamingDeck(true);
    setError(null);
    try {
      const updated = await updatePitchDeck(deckId, {
        expectedVersion: deckVersion,
        title: trimmed,
      });
      setDeckTitle(updated.title);
      setDeckVersion(updated.version);
      setDeckStatus(updated.status);
      setDeckTemplateId(updated.templateId);
    } catch (err: any) {
      setError(err.message || 'Failed to rename deck');
    } finally {
      setRenamingDeck(false);
    }
  };

  if (!featureEnabled) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold text-white">Pitch Deck Editor</h1>
        <p className="mt-3 text-sm text-gray-400">Pitch Deck V1 is disabled in this environment.</p>
      </main>
    );
  }

  if (loading) {
    return <main className="p-8 text-sm text-gray-400">Loading deck...</main>;
  }

  return (
    <>
      <EditorSubNav activeTab="pitch-decks" screenplayId={deckScreenplayId} />
      <main className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">{deckTitle || 'Pitch Deck'}</h1>
            {deckStatus && deckStatus !== 'draft' ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded border border-[#3F3F46] bg-[#111] px-2 py-0.5 text-xs text-gray-300">
                  {deckStatus}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportModalOpen(true)}
              disabled={exportingPdf}
              className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50"
            >
              {exportingPdf ? 'Exporting PDF...' : 'Export to PDF'}
            </button>
            <button
              onClick={handleRenameDeck}
              disabled={renamingDeck}
              className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50"
            >
              {renamingDeck ? 'Renaming...' : 'Rename'}
            </button>
            <button
              onClick={() =>
                router.push(`/pitch-decks${deckScreenplayId ? `?screenplayId=${encodeURIComponent(deckScreenplayId)}` : ''}`)
              }
              className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5"
            >
              Back to Decks
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="lg:col-span-3 rounded border border-[#3F3F46] bg-[#111] p-3">
            <h2 className="text-sm font-semibold text-white mb-3">Slides</h2>
            <div className="space-y-2">
              {slides.map((slide) => (
                <button
                  key={slide.slideId}
                  onClick={() => {
                    setSelectedSlideId(slide.slideId);
                    setSaveStatus('idle');
                    setSavedAt(null);
                    setImageActionError(null);
                    setImageActionNotice(null);
                    setRewriteError(null);
                    setRewriteNotice(null);
                    setRewritePreviewText(null);
                    setRewriteOriginalText(null);
                  }}
                  className={`w-full rounded px-3 py-2 text-left text-sm border ${
                    selectedSlideId === slide.slideId
                      ? 'border-[#DC143C] bg-[#DC143C]/10 text-white'
                      : 'border-[#2a2a2a] bg-[#161616] text-gray-300'
                  }`}
                >
                  {slide.orderIndex}. {slide.title}
                </button>
              ))}
            </div>
          </aside>

          <section className="lg:col-span-9 rounded border border-[#3F3F46] bg-[#111] p-4">
            {!selectedSlide ? (
              <p className="text-sm text-gray-400">Select a slide to edit.</p>
            ) : (
              <>
                <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Slide title</label>
                <input
                  value={selectedSlide.title}
                  onChange={(e) =>
                    setSlides((prev) =>
                      prev.map((slide) =>
                        slide.slideId === selectedSlide.slideId ? { ...slide, title: e.target.value } : slide
                      )
                    )
                  }
                  onInput={() => setSaveStatus('unsaved')}
                  className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                />

                <label className="block text-xs uppercase tracking-wide text-gray-400 mt-4 mb-1">Primary text</label>
                <textarea
                  value={
                    String(
                      selectedSlide.blocks.find((block) => block.type === 'text')?.content ??
                        'No text block yet. Start typing to create one.'
                    )
                  }
                  onChange={(e) => updateSelectedSlideText(e.target.value)}
                  rows={12}
                  className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                />

                <div className="mt-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Rewrite slide</p>
                    <button
                      type="button"
                      onClick={openRewriteForSlide}
                      className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border-2 border-white/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-lg shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.85) 0%, rgba(139, 0, 0, 0.85) 100%)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                      <div className="absolute top-0 left-1/4 h-1/3 w-1/2 rounded-full bg-white/20 blur-xl pointer-events-none" />
                      <span className="relative z-10 text-base leading-none">💫</span>
                      <span className="relative z-10">Rewrite</span>
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">
                    Uses the same rewrite modal as the editor. Choose model + preset inside modal, then review below.
                  </p>

                  {rewritePreviewText ? (
                    <div className="mt-3 rounded border border-[#3F3F46] bg-[#121212] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Rewrite preview</p>
                      <div className="max-h-60 overflow-auto whitespace-pre-wrap rounded border border-[#2f2f2f] bg-[#0e0e0e] p-2 text-sm text-gray-100">
                        {rewritePreviewText}
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRewritePreviewText(null)}
                          className="rounded border border-[#3F3F46] px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={applyRewritePreview}
                          className="rounded bg-[#DC143C] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Apply Rewrite
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {rewriteUndoText ? (
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={undoLastRewrite}
                        className="rounded border border-[#3F3F46] px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
                      >
                        Undo Last Rewrite
                      </button>
                    </div>
                  ) : null}

                  {rewriteError ? <p className="mt-2 text-xs text-red-300">{rewriteError}</p> : null}
                  {rewriteNotice ? <p className="mt-2 text-xs text-emerald-300">{rewriteNotice}</p> : null}
                </div>

                {selectedSlide ? (
                  <div className="mt-4 rounded border border-[#3F3F46] bg-[#121212] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Slide Layout</p>
                        <div className="inline-flex items-center rounded border border-[#2f2f2f] bg-[#0f0f0f] p-1">
                          <button
                            type="button"
                            onClick={() => updateSelectedSlideImageEnabled(true)}
                            className={`rounded px-2 py-1 text-[11px] ${
                              selectedSlideImageEnabled
                                ? 'bg-emerald-600/30 text-emerald-200'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            Slide Image: On
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSelectedSlideImageEnabled(false)}
                            className={`rounded px-2 py-1 text-[11px] ${
                              !selectedSlideImageEnabled
                                ? 'bg-[#DC143C]/25 text-[#ffb3c0]'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            Off
                          </button>
                        </div>
                      </div>
                      {selectedSlideImageEnabled ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedSlideLayoutControlValue}
                            onChange={(event) =>
                              updateSelectedSlideExportLayout(
                                event.target.value === 'auto'
                                  ? 'auto'
                                  : (event.target.value as PdfImageLayout)
                              )
                            }
                            className="h-10 min-w-[260px] rounded border border-[#2f2f2f] bg-[#0f0f0f] px-3 text-sm text-gray-200"
                          >
                            <option value="auto">Auto (Template)</option>
                            {selectableImageLayouts.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <span className="inline-flex h-10 items-center rounded border border-[#2f2f2f] bg-[#0f0f0f] px-3 text-sm text-gray-300">
                            Export layout: {getLayoutPreviewLabel(deckTemplateId, selectedSlide.slideType, selectedSlideLayoutOverride)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">{getLayoutImageTip(selectedSlideLayout)}</p>
                    {!selectedSlideImageEnabled ? (
                      <p className="mt-2 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                        Slide image is off for this slide. Export renders this slide as text-only while preserving all canvas history.
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded border border-[#2f2f2f] bg-[#0f0f0f] px-2 py-0.5 text-gray-300">
                        Used in export: {exportImagesUsedCount}
                        {exportImageLimitForSelectedLayout > 0 ? ` / ${exportImageLimitForSelectedLayout}` : ''}
                      </span>
                      {exportHasIgnoredImages ? (
                        <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                          This layout uses up to {exportImageLimitForSelectedLayout} image
                          {exportImageLimitForSelectedLayout === 1 ? '' : 's'}; extras are ignored.
                        </span>
                      ) : null}
                    </div>

                    {selectedSlideImageEnabled ? (
                      <>
                    <div className="mt-3 rounded border border-[#5a4f66] bg-[#16121d] p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-300">
                        <Layers className="h-3.5 w-3.5 text-[#c4b5fd]" />
                        Working Canvas ({selectedSlotImageOptions.length})
                      </p>
                      <p className="mb-2 text-[11px] text-gray-500">
                        Select and order images for this slide export.
                      </p>
                      <p className="mb-2 text-[11px] text-gray-500">
                        Click thumbnails to select images for PDF export. Re-selecting a removed tile appends it to the end of export order.
                      </p>
                      {selectedSlotImageOptions.length === 0 ? (
                        <p className="text-xs text-gray-500">No images in Working Canvas yet.</p>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {selectedSlotImageOptions.map((option) => {
                            const isSelectedForExport = exportSelectedOptionIds.has(option.id);
                            const selectionOrder = exportSelectionOrderMap.get(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => selectSlotImageOption(option.id)}
                                className={`relative overflow-hidden rounded border ${
                                  isSelectedForExport ? 'border-[#DC143C]' : 'border-[#3F3F46]'
                                } bg-[#151515]`}
                                title={`${option.label} • ${new Date(option.createdAt).toLocaleString()}`}
                              >
                                <img
                                  src={option.imageUrl}
                                  alt={option.label}
                                  className="h-20 w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '0.2';
                                  }}
                                />
                                <div className="absolute top-1 left-1 z-10">
                                  {selectionOrder ? (
                                    <span className="inline-flex min-w-[24px] h-6 items-center justify-center rounded-md border border-[#DC143C] bg-[#DC143C]/90 px-1.5 text-[11px] font-semibold text-white shadow">
                                      {selectionOrder}
                                    </span>
                                  ) : (
                                    <span className="inline-flex min-w-[24px] h-6 items-center justify-center rounded-md border border-white/30 bg-black/55 px-1.5 text-[11px] font-medium text-gray-200 shadow">
                                      +
                                    </span>
                                  )}
                                </div>
                                <div className="absolute top-1 right-1 z-10">
                                  <DropdownMenu
                                    open={openImageMenuId === option.id}
                                    onOpenChange={(open) => {
                                      setOpenImageMenuId(open ? option.id : null);
                                    }}
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="min-w-[28px] min-h-[28px] rounded-lg bg-[#DC143C]/90 p-1.5 transition-colors hover:bg-[#DC143C] flex items-center justify-center shadow-lg"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (openImageMenuId !== option.id) setOpenImageMenuId(option.id);
                                        }}
                                        title="Image actions"
                                      >
                                        <MoreVertical className="w-3.5 h-3.5 text-white" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg"
                                      style={{ backgroundColor: '#0A0A0A' }}
                                    >
                                      <DropdownMenuItem
                                        className="text-white hover:bg-white/10 hover:text-white cursor-pointer focus:bg-white/10 focus:text-white"
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenImageMenuId(null);
                                          setImageViewerOption(option);
                                        }}
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View image
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenImageMenuId(null);
                                          requestRemoveSlotImageOption(option.id);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove from slide
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[10px] text-left text-white truncate">
                                  {option.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="mt-2 text-[11px] text-gray-500">Working Canvas is your slide design destination.</p>
                    </div>

                    <div className="mt-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Image actions</p>
                      <p className="mb-2 text-[11px] text-gray-500">
                        Add or generate images, then move them into the Working Canvas.
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setImageActionTab('library')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            imageActionTab === 'library'
                              ? 'bg-[#DC143C] text-white'
                              : 'bg-[#141414] text-[#B3B3B3] hover:bg-[#1F1F1F] border border-[#3F3F46]'
                          }`}
                        >
                          Library
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageActionTab('prompt')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            imageActionTab === 'prompt'
                              ? 'bg-[#DC143C] text-white'
                              : 'bg-[#141414] text-[#B3B3B3] hover:bg-[#1F1F1F] border border-[#3F3F46]'
                          }`}
                        >
                          Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageActionTab('reference')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            imageActionTab === 'reference'
                              ? 'bg-[#DC143C] text-white'
                              : 'bg-[#141414] text-[#B3B3B3] hover:bg-[#1F1F1F] border border-[#3F3F46]'
                          }`}
                        >
                          Remix
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageActionTab('upload')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            imageActionTab === 'upload'
                              ? 'bg-[#DC143C] text-white'
                              : 'bg-[#141414] text-[#B3B3B3] hover:bg-[#1F1F1F] border border-[#3F3F46]'
                          }`}
                        >
                          Upload
                        </button>
                      </div>

                      {imageActionTab === 'library' ? (
                        <>
                          {showArchiveBrowser && deckScreenplayId ? (
                            <div className="mt-2 rounded border border-[#2f2f2f] bg-[#0f0f0f] p-2">
                              {archiveBrowserResolving ? (
                                <div className="flex h-[240px] items-center justify-center gap-2 text-sm text-gray-300">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Resolving pitch deck archive folder...
                                </div>
                              ) : (
                                <MediaLibraryBrowser
                                  screenplayId={deckScreenplayId}
                                  onSelectImages={addFromArchiveBrowser}
                                  filterTypes={['image']}
                                  allowMultiSelect={true}
                                  maxSelections={20}
                                  initialFolderId={archiveBrowserInitialFolderId ?? initialArchiveFolderId}
                                  restrictToFolderSubtreeId={archiveBrowserRestrictFolderId ?? deckArchiveRootFolderId}
                                  onCancel={() => setShowArchiveBrowser(false)}
                                />
                              )}
                            </div>
                          ) : null}
                          {!showArchiveBrowser ? (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <select
                              value={existingSourceFilter}
                              onChange={(e) => {
                                setExistingSourceFilter(e.target.value as ExistingMediaSourceFilter);
                                setExistingEntityFilter('all');
                                setExistingVariantFilter('all');
                              }}
                              className="rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                            >
                              <option value="character">Characters</option>
                              <option value="location">Locations</option>
                              <option value="prop">Props</option>
                            </select>
                            <select
                              value={existingEntityFilter}
                              onChange={(e) => {
                                setExistingEntityFilter(e.target.value);
                                setExistingVariantFilter('all');
                              }}
                              className="rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                              disabled={existingEntityOptions.length === 0}
                            >
                              <option value="all">
                                {existingSourceFilter === 'character'
                                  ? 'All characters'
                                  : existingSourceFilter === 'location'
                                    ? 'All locations'
                                    : 'All props'}
                              </option>
                              {existingEntityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            </div>
                          ) : null}
                          <p className="mt-2 text-[11px] text-gray-500">
                            AI-generated images and uploads are saved in the pitch deck archive folder. Open Generated Images/Uploads to browse and add them.
                          </p>
                          <div className="mt-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (showArchiveBrowser) {
                                  setShowArchiveBrowser(false);
                                  return;
                                }
                                void openArchiveBrowser();
                              }}
                              disabled={!deckScreenplayId}
                              className="mr-2 rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 hover:border-[#DC143C] hover:text-white disabled:opacity-50"
                            >
                              {showArchiveBrowser ? 'Close Generated Images/Uploads' : 'Generated Images/Uploads'}
                            </button>
                            {!showArchiveBrowser ? (
                              <button
                                type="button"
                                onClick={applyExistingMediaToSlot}
                                disabled={!selectedExistingMedia}
                                className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b01030] disabled:opacity-50"
                              >
                                + Add to gallery
                              </button>
                            ) : null}
                          </div>
                          {!showArchiveBrowser ? (
                            <div className="mt-2 rounded border border-[#2f2f2f] bg-[#0f0f0f] p-2">
                              {filteredExistingMedia.length === 0 ? (
                                <p className="text-xs text-gray-500">
                                  {existingMediaLoading ? 'Loading screenplay images...' : 'No images found for selected filters'}
                                </p>
                              ) : (
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                  {filteredExistingMedia.map((item) => {
                                    const isActive = selectedExistingMediaId === item.id;
                                    const isReferenceSelected = referenceMediaIds.includes(item.id);
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => {
                                          setSelectedExistingMediaId(item.id);
                                          setReferenceMediaId(item.id);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedExistingMediaId(item.id);
                                            setReferenceMediaId(item.id);
                                          }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className={`relative overflow-hidden rounded border ${
                                          isActive ? 'border-[#DC143C]' : 'border-[#3F3F46]'
                                        } bg-[#151515] cursor-pointer`}
                                        title={item.label}
                                      >
                                        <img
                                          src={item.imageUrl}
                                          alt={item.label}
                                          className="h-20 w-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.opacity = '0.2';
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleReferenceMediaSelection(item.id);
                                          }}
                                          className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] ${
                                            isReferenceSelected
                                              ? 'bg-[#DC143C] text-white'
                                              : 'bg-black/70 text-gray-200 hover:bg-black/85'
                                          }`}
                                          title={isReferenceSelected ? 'Remove from remix references' : 'Add to remix references'}
                                        >
                                          {isReferenceSelected ? 'Remix' : 'Add remix'}
                                        </button>
                                        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[10px] text-left text-white truncate">
                                          {item.label}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : null}
                          {selectedExistingMedia && !showArchiveBrowser ? (
                            <div className="mt-2 rounded border border-[#2f2f2f] bg-[#0f0f0f] p-2">
                              <div className="grid grid-cols-[96px_1fr] gap-2 items-center">
                                <img
                                  src={selectedExistingMedia.imageUrl}
                                  alt={selectedExistingMedia.label}
                                  className="h-14 w-24 rounded border border-[#3F3F46] object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs text-white">{selectedExistingMedia.label}</p>
                                  <p className="truncate text-[11px] text-gray-500">
                                    {selectedExistingMedia.sourceType} • {selectedExistingMedia.entityName} • {selectedExistingMedia.groupLabel}
                                  </p>
                                  {selectedExistingMedia.sourceType === 'pitch_deck' ? (
                                    <>
                                      <p className="truncate text-[10px] text-gray-400 font-mono mt-0.5">
                                        ID: {selectedExistingMedia.mediaFileId || selectedExistingMedia.id}
                                      </p>
                                      <p className="truncate text-[10px] text-gray-500 font-mono">
                                        Deck: {selectedExistingMedia.archiveDeckId || deckId} • Slide: {selectedExistingMedia.archiveSlideId || 'n/a'}
                                      </p>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {existingMediaError ? <p className="mt-2 text-xs text-red-300">{existingMediaError}</p> : null}
                        </>
                      ) : null}

                      {imageActionTab === 'prompt' ? (
                        <>
                          <textarea
                            value={promptGenerationText}
                            onChange={(e) => setPromptGenerationText(e.target.value)}
                            rows={3}
                            placeholder="Describe the image you want for this slide..."
                            className="mt-2 w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                          />
                          <div className="mt-2 flex flex-col md:flex-row gap-2">
                            <select
                              value={promptGenerationModelId}
                              onChange={(e) => setPromptGenerationModelId(e.target.value)}
                              className="flex-1 rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                              disabled={imageModelsLoading || filteredPromptPitchDeckImageModels.length === 0}
                            >
                              {filteredPromptPitchDeckImageModels.length === 0 ? (
                                <option value="">
                                  {imageModelsLoading ? 'Loading models...' : 'No models found'}
                                </option>
                              ) : (
                                filteredPromptPitchDeckImageModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {getPitchDeckModelLabelById(model.id, model.label)} ({model.creditsPerImage} credits)
                                  </option>
                                ))
                              )}
                            </select>
                            <select
                              value={promptAspectRatio}
                              onChange={(e) => setPromptAspectRatio(e.target.value as PitchDeckAspectRatio)}
                              className="rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white md:w-36"
                            >
                              {promptSupportedAspectRatios.map((ratio) => (
                                <option key={ratio} value={ratio}>
                                  {ratio}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={requestGenerateFromPrompt}
                              disabled={uploadingImage || generatingFromPrompt || !promptGenerationText.trim() || !promptGenerationModelId}
                              className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b01030] disabled:opacity-50"
                            >
                              {generatingFromPrompt ? 'Generating...' : 'Generate'}
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-gray-500">Suggested for this slide:</span>
                            {suggestedPromptAspectRatios.map((ratio) => (
                              <button
                                key={`prompt-suggested-${ratio}`}
                                type="button"
                                onClick={() => setPromptAspectRatio(ratio)}
                                className={`rounded border px-2 py-0.5 ${
                                  promptAspectRatio === ratio
                                    ? 'border-[#DC143C] text-[#DC143C]'
                                    : 'border-[#3F3F46] text-gray-300 hover:border-[#DC143C]/60'
                                }`}
                              >
                                {ratio}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : null}

                      {imageActionTab === 'reference' ? (
                        <>
                          <div className="mt-2 rounded border border-[#2f2f2f] bg-[#0f0f0f] p-2">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-[11px] text-gray-300">
                                Source references ({selectedReferenceMediaList.length}/{maxReferenceCount})
                              </p>
                              <span className="text-[10px] text-gray-500">Primary = first thumbnail</span>
                            </div>
                            {selectedReferenceMediaList.length === 0 ? (
                              <div className="flex flex-col gap-1">
                                <p className="text-[11px] text-gray-500">
                                  Add references from the Library tab. This model supports up to {maxReferenceCount}.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setImageActionTab('library')}
                                  className="w-fit text-[11px] text-[#DC143C] underline underline-offset-2 hover:text-[#ff4d6d]"
                                >
                                  Open Library tab
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedReferenceMediaList.map((item, index) => (
                                  <div
                                    key={item.id}
                                    onClick={() => setReferenceMediaIds((current) => [item.id, ...current.filter((id) => id !== item.id)])}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setReferenceMediaIds((current) => [item.id, ...current.filter((id) => id !== item.id)]);
                                      }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className={`relative overflow-hidden rounded border ${
                                      index === 0 ? 'border-[#DC143C]' : 'border-[#3F3F46]'
                                    } cursor-pointer`}
                                    title={`${item.label}${index === 0 ? ' (primary)' : ''}`}
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt={item.label}
                                      className="h-7 w-12 object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.opacity = '0.2';
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleReferenceMediaSelection(item.id);
                                      }}
                                      className="absolute right-0 top-0 rounded-bl bg-black/75 px-1 text-[9px] text-white hover:bg-[#DC143C]"
                                      title="Remove reference"
                                    >
                                      x
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <textarea
                            value={referencePromptText}
                            onChange={(e) => setReferencePromptText(e.target.value)}
                            rows={2}
                            placeholder="Describe how to transform the reference image(s)..."
                            className="mt-2 w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                          />
                          <div className="mt-2 flex flex-col md:flex-row gap-2">
                            <select
                              value={referenceGenerationModelId}
                              onChange={(e) => setReferenceGenerationModelId(e.target.value)}
                              className="flex-1 rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                              disabled={imageModelsLoading || filteredReferencePitchDeckImageModels.length === 0}
                            >
                              {filteredReferencePitchDeckImageModels.length === 0 ? (
                                <option value="">
                                  {imageModelsLoading ? 'Loading models...' : 'No models found'}
                                </option>
                              ) : (
                                filteredReferencePitchDeckImageModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {getPitchDeckModelLabelById(model.id, model.label)} ({model.creditsPerImage} credits)
                                  </option>
                                ))
                              )}
                            </select>
                            <select
                              value={referenceAspectRatio}
                              onChange={(e) => setReferenceAspectRatio(e.target.value as PitchDeckAspectRatio)}
                              className="rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white md:w-36"
                            >
                              {referenceSupportedAspectRatios.map((ratio) => (
                                <option key={ratio} value={ratio}>
                                  {ratio}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={requestGenerateFromReference}
                              disabled={
                                uploadingImage ||
                                generatingFromReference ||
                                selectedReferenceMediaList.length === 0 ||
                                !referencePromptText.trim() ||
                                !referenceGenerationModelId
                              }
                              className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b01030] disabled:opacity-50"
                            >
                              {generatingFromReference ? 'Generating...' : 'Generate from Reference'}
                            </button>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-gray-500">Suggested for this slide:</span>
                            {suggestedReferenceAspectRatios.map((ratio) => (
                              <button
                                key={`reference-suggested-${ratio}`}
                                type="button"
                                onClick={() => setReferenceAspectRatio(ratio)}
                                className={`rounded border px-2 py-0.5 ${
                                  referenceAspectRatio === ratio
                                    ? 'border-[#DC143C] text-[#DC143C]'
                                    : 'border-[#3F3F46] text-gray-300 hover:border-[#DC143C]/60'
                                }`}
                              >
                                {ratio}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : null}

                      {imageActionTab === 'upload' ? (
                        <>
                          <div className="mt-2">
                            <label className="block text-[11px] text-gray-400 mb-1">Paste image URL</label>
                            <div className="flex items-center gap-2">
                              <input
                                value={
                                  String(
                                    (selectedImageBlock?.content && (selectedImageBlock.content as any).imageUrl) ||
                                      ''
                                  )
                                }
                                onChange={(e) => updateSelectedSlideImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentImageUrl = String(
                                    (selectedImageBlock?.content && (selectedImageBlock.content as any).imageUrl) || ''
                                  ).trim();
                                  if (!currentImageUrl) {
                                    setImageActionError('Paste an image URL first.');
                                    return;
                                  }
                                  appendSlotImageOption({
                                    imageUrl: currentImageUrl,
                                    sourceType: 'user_custom',
                                    label: 'Manual URL',
                                  });
                                  setImageActionError(null);
                                  setImageActionNotice('Manual URL added to slot gallery.');
                                }}
                                className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b01030] disabled:opacity-50"
                              >
                                Add URL
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingImage}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                void handleUploadImageToSlot(file);
                                e.currentTarget.value = '';
                              }}
                              className="block w-full text-xs text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-[#232323] file:px-3 file:py-1.5 file:text-xs file:text-gray-200"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-500">
                            Uploads are added to this slide slot gallery.
                          </p>
                        </>
                      ) : null}

                      {imageModelsError ? <p className="mt-2 text-xs text-red-300">{imageModelsError}</p> : null}
                    </div>

                    {uploadingImage ? <p className="mt-2 text-xs text-gray-300">Uploading image...</p> : null}
                    {imageActionError ? <p className="mt-2 text-xs text-red-300">{imageActionError}</p> : null}
                    {imageActionNotice ? <p className="mt-2 text-xs text-emerald-300">{imageActionNotice}</p> : null}
                    <div className="mt-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Recent image attempts</p>
                      {selectedSlideAttempts.length === 0 ? (
                        <p className="text-xs text-gray-500">No image actions yet for this session.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedSlideAttempts
                            .slice(0, 5)
                            .map((attempt) => (
                              <div
                                key={attempt.id}
                                className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${
                                  attempt.status === 'failed'
                                    ? 'border-red-500/40 bg-red-500/10 text-red-200'
                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="truncate block">{attempt.message}</span>
                                  {attempt.imageUrl ? (
                                    <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          void downloadRecentAttemptImage(attempt);
                                        }}
                                        className="underline text-emerald-200 hover:text-white"
                                      >
                                        Download image
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const attemptS3Key =
                                            (typeof attempt.s3Key === 'string' && attempt.s3Key.trim().length > 0
                                              ? attempt.s3Key.trim()
                                              : getMediaProxyS3KeyFromUrl(attempt.imageUrl as string)) || undefined;
                                          if (isLegacyTempVideoImageKey(attemptS3Key)) {
                                            setImageActionError('This recovered item uses a legacy temp/video-images key and may be expired. Regenerate or use archived media.');
                                            return;
                                          }
                                          appendSlotImageOption({
                                            imageUrl: attempt.imageUrl as string,
                                            sourceType: 'existing_media',
                                            label: 'Recovered from recent attempt',
                                            s3Key: attemptS3Key,
                                          });
                                        }}
                                        className="underline text-emerald-200 hover:text-white"
                                      >
                                        Add to gallery
                                      </button>
                                    </div>
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
                      </>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPreviousSlide}
                      disabled={saving || selectedSlideIndex <= 0}
                      className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      onClick={goToNextSlide}
                      disabled={saving || selectedSlideIndex >= slides.length - 1}
                      className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                  <div className="text-xs text-right">
                    {saving ? <span className="text-gray-400">Saving changes...</span> : null}
                    {!saving && saveStatus === 'unsaved' ? <span className="text-amber-300">Unsaved changes</span> : null}
                    {!saving && saveStatus === 'saved' ? (
                      <span className="text-emerald-300">Saved{savedAt ? ` at ${new Date(savedAt).toLocaleTimeString()}` : ''}</span>
                    ) : null}
                  </div>
                  <button
                    onClick={saveSelectedSlide}
                    disabled={saving}
                    className="rounded bg-[#DC143C] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Slide Changes'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {rewriteModalOpen ? (
        <RewriteModal
          isOpen={rewriteModalOpen}
          onClose={() => setRewriteModalOpen(false)}
          selectedText={selectedSlidePrimaryText}
          selectionRange={{ start: 0, end: selectedSlidePrimaryText.length }}
          editorContent={selectedSlidePrimaryText}
          onReplace={captureRewritePreview}
          title="Rewrite Slide"
          quickActions={PITCH_DECK_REWRITE_ACTIONS}
        />
      ) : null}

      {confirmSpendOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded border border-[#3F3F46] bg-[#101010] p-4">
            <h3 className="text-base font-semibold text-white">Confirm credit spend</h3>
            <p className="mt-2 text-sm text-gray-300">
              {pendingImageAction === 'prompt'
                ? 'Generate image from prompt'
                : 'Generate image from reference'}
            </p>
            <div className="mt-3 rounded border border-[#2a2a2a] bg-[#0b0b0b] p-3 text-sm">
              <div className="mt-1 flex items-center justify-between text-gray-400">
                <span>Model</span>
                <span>
                  {pendingImageAction === 'prompt'
                    ? getPitchDeckModelLabelById(
                      promptGenerationModel?.id || '',
                      promptGenerationModel?.label || promptGenerationModel?.id || 'Selected model'
                    )
                    : getPitchDeckModelLabelById(
                      referenceGenerationModel?.id || '',
                      referenceGenerationModel?.label || referenceGenerationModel?.id || 'Selected model'
                    )}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-gray-400">
                <span>Aspect ratio</span>
                <span>{pendingImageAction === 'prompt' ? promptAspectRatio : referenceAspectRatio}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Credits are deducted when generation starts.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmSpendOpen(false);
                  setPendingImageAction(null);
                }}
                className="rounded border border-[#3F3F46] px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAndRunPendingImageAction}
                disabled={uploadingImage || generatingFromPrompt || generatingFromReference}
                className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Confirm and Generate
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmRemoveImageId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded border border-[#3F3F46] bg-[#101010] p-4">
            <h3 className="text-base font-semibold text-white">Remove image from slide?</h3>
            <p className="mt-2 text-sm text-gray-300">
              This only removes the image from this slide gallery. The original source media is not deleted.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveImageId(null)}
                className="rounded border border-[#3F3F46] px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveSlotImageOption}
                className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b01030]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {imageViewerOption ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
          <div className="w-full max-w-5xl rounded border border-[#3F3F46] bg-[#0f0f0f] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{imageViewerOption.label}</p>
                {imageViewerIndex >= 0 && selectedSlotImageOptions.length > 1 ? (
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {imageViewerIndex + 1} / {selectedSlotImageOptions.length}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setImageViewerOption(null)}
                className="rounded border border-[#3F3F46] px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
              >
                Close
              </button>
            </div>
            <div className="relative mt-3 rounded border border-[#2a2a2a] bg-black/60 p-2">
              <button
                type="button"
                onClick={viewPreviousImageInViewer}
                disabled={!canViewPreviousImage}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#3F3F46] bg-black/65 p-2 text-gray-100 hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <img
                src={imageViewerOption.imageUrl}
                alt={imageViewerOption.label}
                className="max-h-[75vh] w-full rounded object-contain"
              />
              <button
                type="button"
                onClick={viewNextImageInViewer}
                disabled={!canViewNextImage}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[#3F3F46] bg-black/65 p-2 text-gray-100 hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {exportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded border border-[#3F3F46] bg-[#101010] p-4">
            <h3 className="text-base font-semibold text-white">Export pitch deck PDF</h3>
            <p className="mt-2 text-sm text-gray-300">
              Choose what to include in your final PDF export.
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={exportIncludeImages}
                  onChange={(e) => setExportIncludeImages(e.target.checked)}
                  className="h-4 w-4"
                />
                Include slide images
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={exportWatermarkEnabled}
                  onChange={(e) => setExportWatermarkEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                Add watermark
              </label>
              <input
                value={exportWatermarkText}
                onChange={(e) => setExportWatermarkText(e.target.value)}
                disabled={!exportWatermarkEnabled}
                placeholder="Watermark text (e.g., DRAFT, CONFIDENTIAL)"
                className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white disabled:opacity-50"
              />
              <div className="rounded border border-[#2a2a2a] bg-[#0d0d0d] p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">Hero Text Panel</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Applies to full-bleed hero layouts only.
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Hero panel body copy shows about 5 lines (depends on word lengths); extra text is clipped in export.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <label className="text-[11px] text-gray-400">
                    Style
                    <select
                      value={exportHeroPanelStyle}
                      onChange={(e) => setExportHeroPanelStyle(e.target.value as 'rounded' | 'square')}
                      className="mt-1 h-9 w-full rounded border border-[#3F3F46] bg-[#141414] px-2 text-sm text-white"
                    >
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-gray-400">
                    Opacity
                    <select
                      value={exportHeroPanelOpacity}
                      onChange={(e) => setExportHeroPanelOpacity(e.target.value as 'none' | 'soft' | 'medium' | 'strong')}
                      className="mt-1 h-9 w-full rounded border border-[#3F3F46] bg-[#141414] px-2 text-sm text-white"
                    >
                      <option value="none">None (image only)</option>
                      <option value="soft">Soft</option>
                      <option value="medium">Medium</option>
                      <option value="strong">Strong</option>
                    </select>
                    {exportHeroPanelOpacity === 'none' ? (
                      <span className="mt-1 block text-[10px] text-amber-300">
                        No panel background. Text may be harder to read on bright or detailed images.
                      </span>
                    ) : null}
                  </label>
                  <label className="text-[11px] text-gray-400">
                    Position
                    <select
                      value={exportHeroPanelPosition}
                      onChange={(e) => setExportHeroPanelPosition(e.target.value as 'top' | 'bottom' | 'lower_middle')}
                      className="mt-1 h-9 w-full rounded border border-[#3F3F46] bg-[#141414] px-2 text-sm text-white"
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="lower_middle">Lower-middle</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded border border-[#3F3F46] px-3 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="rounded bg-[#DC143C] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {exportingPdf ? 'Exporting...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

