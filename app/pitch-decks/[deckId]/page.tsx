'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  generatePitchDeckImageFromPrompt,
  generatePitchDeckImageFromReference,
  getPitchDeck,
  listImageGenerationModels,
  updatePitchDeck,
  updatePitchDeckSlide,
  type PitchDeckBlock,
  type PitchDeckImageModel,
  type PitchDeckSlide,
} from '@/utils/pitchDeckStorage';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import { useDirectS3Upload } from '@/hooks/useDirectS3Upload';

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
}

type ExistingMediaItem = {
  id: string;
  label: string;
  sourceType: 'character' | 'location' | 'prop';
  imageUrl: string;
};

type ImageGenerationMode = 'prompt' | 'reference';

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
  slideId: string;
  status: 'success' | 'failed';
  action: 'existing' | 'prompt' | 'reference' | 'upload';
  message: string;
  at: string;
};

export default function PitchDeckEditorPage() {
  const router = useRouter();
  const params = useParams<{ deckId: string }>();
  const deckId = params?.deckId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckVersion, setDeckVersion] = useState<number>(1);
  const [deckStatus, setDeckStatus] = useState<string>('draft');
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
  const [imageModels, setImageModels] = useState<PitchDeckImageModel[]>([]);
  const [imageModelsLoading, setImageModelsLoading] = useState(false);
  const [imageModelsError, setImageModelsError] = useState<string | null>(null);
  const [promptGenerationText, setPromptGenerationText] = useState('');
  const [promptGenerationModelId, setPromptGenerationModelId] = useState('flux2-pro-2k');
  const [referencePromptText, setReferencePromptText] = useState('');
  const [referenceMediaId, setReferenceMediaId] = useState('');
  const [imageGenerationMode, setImageGenerationMode] = useState<ImageGenerationMode>('prompt');
  const [generatingFromPrompt, setGeneratingFromPrompt] = useState(false);
  const [generatingFromReference, setGeneratingFromReference] = useState(false);
  const [imageActionError, setImageActionError] = useState<string | null>(null);
  const [imageActionNotice, setImageActionNotice] = useState<string | null>(null);
  const [confirmSpendOpen, setConfirmSpendOpen] = useState(false);
  const [pendingImageAction, setPendingImageAction] = useState<'prompt' | 'reference' | null>(null);
  const [imageAttempts, setImageAttempts] = useState<ImageAttempt[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { uploadFile: uploadImageToS3 } = useDirectS3Upload();

  const featureEnabled = isFeatureEnabled();
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
  const hasSelectedImageSlot = Boolean(selectedImageBlock);
  const selectedExistingMedia = useMemo(
    () => existingMedia.find((item) => item.id === selectedExistingMediaId) || null,
    [existingMedia, selectedExistingMediaId]
  );
  const selectedReferenceMedia = useMemo(
    () => existingMedia.find((item) => item.id === referenceMediaId) || null,
    [existingMedia, referenceMediaId]
  );
  const promptGenerationEstimate = useMemo(() => {
    const selectedModel = imageModels.find((model) => model.id === promptGenerationModelId);
    return selectedModel?.creditsPerImage ?? 0;
  }, [imageModels, promptGenerationModelId]);
  const promptGenerationModel = useMemo(
    () => imageModels.find((model) => model.id === promptGenerationModelId) || null,
    [imageModels, promptGenerationModelId]
  );
  const referenceGenerationModel = useMemo(
    () => imageModels.find((model) => model.id === 'nano-banana') || null,
    [imageModels]
  );
  const referenceGenerationEstimate = useMemo(() => {
    const referenceModel = imageModels.find((model) => model.id === 'nano-banana');
    return referenceModel?.creditsPerImage ?? 1;
  }, [imageModels]);
  const selectedImageContent = useMemo(() => {
    if (!selectedImageBlock || typeof selectedImageBlock.content !== 'object' || !selectedImageBlock.content) {
      return {};
    }
    return selectedImageBlock.content as any;
  }, [selectedImageBlock]);
  const selectedSlotImageOptions = useMemo(() => {
    const options = selectedImageContent.imageOptions;
    if (Array.isArray(options)) {
      return options.filter((option: any) => option && typeof option.imageUrl === 'string') as SlotImageOption[];
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
  }, [selectedImageContent, selectedImageBlock]);
  const activeSlotImageId = useMemo(() => {
    const activeId = selectedImageContent.activeImageId;
    if (typeof activeId === 'string' && activeId.trim()) return activeId;
    return selectedSlotImageOptions[0]?.id || '';
  }, [selectedImageContent, selectedSlotImageOptions]);
  const selectedSlideAttempts = useMemo(() => {
    if (!selectedSlide?.slideId) return [] as ImageAttempt[];
    return imageAttempts.filter((attempt) => attempt.slideId === selectedSlide.slideId);
  }, [imageAttempts, selectedSlide]);

  const normalizeImageUrl = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    return '';
  };

  const collectImageUrlsFromUnknown = (value: unknown): string[] => {
    const direct = normalizeImageUrl(value);
    if (direct) return [direct];
    if (Array.isArray(value)) {
      return value.flatMap((entry) => collectImageUrlsFromUnknown(entry));
    }
    if (!value || typeof value !== 'object') return [];
    const objectValue = value as Record<string, unknown>;
    const candidateKeys = [
      'imageUrl',
      'url',
      'thumbnailUrl',
      'previewUrl',
      'sourceImageUrl',
      'originalImageUrl',
      'portraitUrl',
      'headshotUrl',
    ];
    const urls = candidateKeys
      .map((key) => normalizeImageUrl(objectValue[key]))
      .filter(Boolean);
    return urls;
  };

  const extractEntityImageUrls = (entity: Record<string, unknown>, fields: string[]): string[] => {
    const urls = fields.flatMap((field) => collectImageUrlsFromUnknown(entity[field]));
    return Array.from(new Set(urls));
  };

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
        setDeckScreenplayId(data.deck.screenplayId);
        setSlides(data.slides);
        setSelectedSlideId(data.slides[0]?.slideId || null);
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

  useEffect(() => {
    if (!deckScreenplayId || !featureEnabled) return;

    let cancelled = false;
    const loadExistingMedia = async () => {
      setExistingMediaLoading(true);
      setExistingMediaError(null);
      try {
        const [charactersRes, locationsRes, propsRes] = await Promise.all([
          fetch(`/api/screenplays/${encodeURIComponent(deckScreenplayId)}/characters`, { cache: 'no-store' }),
          fetch(`/api/screenplays/${encodeURIComponent(deckScreenplayId)}/locations`, { cache: 'no-store' }),
          fetch(`/api/asset-bank?screenplayId=${encodeURIComponent(deckScreenplayId)}`, { cache: 'no-store' }),
        ]);

        const [charactersJson, locationsJson, propsJson] = await Promise.all([
          charactersRes.ok ? charactersRes.json() : Promise.resolve({}),
          locationsRes.ok ? locationsRes.json() : Promise.resolve({}),
          propsRes.ok ? propsRes.json() : Promise.resolve({}),
        ]);

        const collected: ExistingMediaItem[] = [];
        const seen = new Set<string>();
        const pushMedia = (item: ExistingMediaItem) => {
          const dedupeKey = `${item.sourceType}:${item.imageUrl}`;
          if (!item.imageUrl || seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          collected.push(item);
        };

        const characters = (charactersJson?.data?.characters || []) as any[];
        characters.forEach((character) => {
          const name = String(character?.name || 'Character');
          const characterId = String(character?.character_id || character?.id || name);
          const imageUrls = extractEntityImageUrls(character as Record<string, unknown>, [
            'images',
            'referenceImages',
            'poseReferences',
            'angleReferences',
            'media',
            'portrait',
            'headshot',
          ]);
          imageUrls.forEach((imageUrl, index) => {
            pushMedia({
              id: `character:${characterId}:${index}`,
              label: `Character - ${name}${index > 0 ? ` (${index + 1})` : ''}`,
              sourceType: 'character',
              imageUrl,
            });
          });
        });

        const locations = (locationsJson?.data?.locations || []) as any[];
        locations.forEach((location) => {
          const name = String(location?.name || 'Location');
          const locationId = String(location?.location_id || location?.id || name);
          const imageUrls = extractEntityImageUrls(location as Record<string, unknown>, [
            'images',
            'referenceImages',
            'baseReference',
            'angleVariations',
            'backgrounds',
            'media',
          ]);
          imageUrls.forEach((imageUrl, index) => {
            pushMedia({
              id: `location:${locationId}:${index}`,
              label: `Location - ${name}${index > 0 ? ` (${index + 1})` : ''}`,
              sourceType: 'location',
              imageUrl,
            });
          });
        });

        const props = (propsJson?.assets || []) as any[];
        props.forEach((prop) => {
          const name = String(prop?.name || 'Prop');
          const propId = String(prop?.id || name);
          const imageUrls = extractEntityImageUrls(prop as Record<string, unknown>, [
            'images',
            'referenceImages',
            'angleReferences',
            'media',
          ]);
          imageUrls.forEach((imageUrl, index) => {
            pushMedia({
              id: `prop:${propId}:${index}`,
              label: `Prop - ${name}${index > 0 ? ` (${index + 1})` : ''}`,
              sourceType: 'prop',
              imageUrl,
            });
          });
        });

        if (!cancelled) {
          setExistingMedia(collected);
          setSelectedExistingMediaId((prev) => prev || collected[0]?.id || '');
          setReferenceMediaId((prev) => prev || collected[0]?.id || '');
        }
      } catch (err: any) {
        if (!cancelled) {
          setExistingMedia([]);
          setExistingMediaError(err?.message || 'Failed to load screenplay media');
        }
      } finally {
        if (!cancelled) setExistingMediaLoading(false);
      }
    };

    const loadImageModels = async () => {
      setImageModelsLoading(true);
      setImageModelsError(null);
      try {
        const models = await listImageGenerationModels();
        if (cancelled) return;
        setImageModels(models);
        const preferred = models.find((model) => model.id === 'flux2-pro-2k') || models[0];
        if (preferred) {
          setPromptGenerationModelId((current) =>
            models.some((model) => model.id === current) ? current : preferred.id
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

    void loadExistingMedia();
    void loadImageModels();

    return () => {
      cancelled = true;
    };
  }, [deckScreenplayId, featureEnabled]);

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

  const saveSelectedSlide = async () => {
    if (!deckId || !selectedSlide) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updatePitchDeckSlide(deckId, selectedSlide.slideId, {
        expectedVersion: selectedSlide.version,
        title: selectedSlide.title,
        notes: selectedSlide.notes || '',
        blocks: selectedSlide.blocks,
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
    message: string
  ) => {
    const slideId = selectedSlide?.slideId || 'unknown';
    setImageAttempts((prev) => [
      {
        id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        slideId,
        status,
        action,
        message,
        at: new Date().toISOString(),
      },
      ...prev.slice(0, 24),
    ]);
  };

  const updateSelectedSlideImageUrl = (
    nextImageUrl: string,
    sourceType: PitchDeckBlock['sourceType'] = 'user_custom',
    extras?: { activeImageId?: string; imageOptions?: SlotImageOption[] }
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

  const appendSlotImageOption = (
    input: {
      imageUrl: string;
      sourceType: PitchDeckBlock['sourceType'];
      label: string;
      s3Key?: string;
    }
  ) => {
    const nextOption: SlotImageOption = {
      id: `imgopt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      imageUrl: input.imageUrl,
      sourceType: input.sourceType,
      label: input.label,
      createdAt: new Date().toISOString(),
      s3Key: input.s3Key,
    };
    const deduped = selectedSlotImageOptions.filter((option) => option.imageUrl !== input.imageUrl);
    const nextOptions = [nextOption, ...deduped].slice(0, 30);
    updateSelectedSlideImageUrl(input.imageUrl, input.sourceType, {
      activeImageId: nextOption.id,
      imageOptions: nextOptions,
    });
  };

  const selectSlotImageOption = (optionId: string) => {
    const option = selectedSlotImageOptions.find((item) => item.id === optionId);
    if (!option) return;
    updateSelectedSlideImageUrl(option.imageUrl, option.sourceType, {
      activeImageId: option.id,
      imageOptions: selectedSlotImageOptions,
    });
    setImageActionNotice(`Selected image option: ${option.label}`);
    setImageActionError(null);
  };

  const applyExistingMediaToSlot = () => {
    setImageActionError(null);
    setImageActionNotice(null);
    if (!selectedExistingMedia) {
      setImageActionError('Select an existing image first.');
      addImageAttempt('failed', 'existing', 'Failed: no existing media selected.');
      return;
    }
    appendSlotImageOption({
      imageUrl: selectedExistingMedia.imageUrl,
      sourceType: 'existing_media',
      label: selectedExistingMedia.label,
    });
    addImageAttempt('success', 'existing', `Applied existing media: ${selectedExistingMedia.label}.`);
    setImageActionNotice('Applied existing screenplay image to this slot (0 credits).');
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
      addImageAttempt(
        'success',
        'prompt',
        `Generated prompt image${typeof result.creditsDeducted === 'number' ? ` (${result.creditsDeducted} credits)` : ''}.`
      );
      setImageActionNotice(
        `Generated image${typeof result.creditsDeducted === 'number' ? ` (${result.creditsDeducted} credits)` : ''}.`
      );
    } catch (err: any) {
      const message = err?.message || 'Failed to generate image from prompt';
      setImageActionError(message);
      addImageAttempt('failed', 'prompt', `Failed: ${message}`);
    } finally {
      setGeneratingFromPrompt(false);
    }
  };

  const runGenerateFromReference = async () => {
    if (!selectedReferenceMedia?.imageUrl) {
      setImageActionError('Choose a reference image from screenplay media first.');
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
      const result = await generatePitchDeckImageFromReference({
        sourceImageUrl: selectedReferenceMedia.imageUrl,
        editPrompt: referencePromptText.trim(),
      });
      if (!result.imageUrl) {
        throw new Error('Reference generation returned no image URL');
      }
      appendSlotImageOption({
        imageUrl: result.imageUrl,
        sourceType: 'ai_generated',
        label: `Reference result (${selectedReferenceMedia.label})`,
        s3Key: result.s3Key,
      });
      addImageAttempt(
        'success',
        'reference',
        `Generated reference image${typeof result.creditsDeducted === 'number' ? ` (${result.creditsDeducted} credits)` : ''}.`
      );
      setImageActionNotice(
        `Generated image from reference${typeof result.creditsDeducted === 'number' ? ` (${result.creditsDeducted} credits)` : ''}.`
      );
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
    if (!selectedReferenceMedia?.imageUrl) {
      setImageActionError('Choose a reference image from screenplay media first.');
      return;
    }
    if (!referencePromptText.trim()) {
      setImageActionError('Add a reference prompt before generating.');
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
      addImageAttempt('failed', 'upload', `Failed: ${message}`);
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
      setImageActionNotice('Uploaded image added to slot gallery (0 credits).');
      addImageAttempt('success', 'upload', `Uploaded image: ${file.name}.`);
    } catch (err: any) {
      const message = err?.message || 'Failed to upload image';
      setImageActionError(message);
      addImageAttempt('failed', 'upload', `Failed: ${message}`);
    } finally {
      setUploadingImage(false);
    }
  };

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
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded border border-[#3F3F46] bg-[#111] px-2 py-0.5 text-xs text-gray-300">
                {deckStatus}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                router.push(`/pitch-decks${deckScreenplayId ? `?screenplayId=${encodeURIComponent(deckScreenplayId)}` : ''}`)
              }
              className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5"
            >
              Back to Decks
            </button>
            <button
              onClick={handleRenameDeck}
              disabled={renamingDeck}
              className="rounded border border-[#3F3F46] px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50"
            >
              {renamingDeck ? 'Renaming...' : 'Rename'}
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

                {hasSelectedImageSlot ? (
                  <div className="mt-4 rounded border border-[#3F3F46] bg-[#121212] p-3">
                    <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
                      Slide image slot (Phase 3B)
                    </label>
                    <input
                      value={
                        String(
                          (selectedImageBlock?.content && (selectedImageBlock.content as any).imageUrl) ||
                            ''
                        )
                      }
                      onChange={(e) => updateSelectedSlideImageUrl(e.target.value)}
                      placeholder="Paste image URL for this slide..."
                      className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                    />
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const currentImageUrl = String(
                            (selectedImageBlock?.content && (selectedImageBlock.content as any).imageUrl) || ''
                          ).trim();
                          if (!currentImageUrl) {
                            setImageActionError('Paste an image URL first.');
                            addImageAttempt('failed', 'upload', 'Failed: no URL to add to gallery.');
                            return;
                          }
                          appendSlotImageOption({
                            imageUrl: currentImageUrl,
                            sourceType: 'user_custom',
                            label: 'Manual URL',
                          });
                          setImageActionError(null);
                          setImageActionNotice('Manual URL added to slot gallery.');
                          addImageAttempt('success', 'upload', 'Added manual URL image to slot gallery.');
                        }}
                        className="rounded border border-[#3F3F46] px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
                      >
                        Add URL To Gallery
                      </button>
                    </div>

                    <div className="mt-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Upload image</p>
                      <div className="flex items-center gap-2">
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
                        Uploads are added to this slide slot gallery. Credit cost: 0.
                      </p>
                    </div>

                    <div className="mt-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Slot gallery ({selectedSlotImageOptions.length})
                      </p>
                      {selectedSlotImageOptions.length === 0 ? (
                        <p className="text-xs text-gray-500">No saved options yet for this slot.</p>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                          {selectedSlotImageOptions.map((option) => {
                            const isActive = option.id === activeSlotImageId;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => selectSlotImageOption(option.id)}
                                className={`relative overflow-hidden rounded border ${
                                  isActive ? 'border-[#DC143C]' : 'border-[#3F3F46]'
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
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[10px] text-left text-white truncate">
                                  {option.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="mt-2 text-[11px] text-gray-500">
                        Generate/upload as many options as you want, then click one thumbnail to make it the active slide image.
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="rounded border border-[#2f2f2f] bg-[#101010] px-2 py-1 text-gray-300">
                        Use existing: <span className="text-emerald-300">0 credits</span>
                      </div>
                      <div className="rounded border border-[#2f2f2f] bg-[#101010] px-2 py-1 text-gray-300">
                        Generate prompt: <span className="text-white">{promptGenerationEstimate} credits</span>
                      </div>
                      <div className="rounded border border-[#2f2f2f] bg-[#101010] px-2 py-1 text-gray-300">
                        Generate reference: <span className="text-white">{referenceGenerationEstimate} credits</span>
                      </div>
                    </div>

                    <div className="mt-4 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Use existing screenplay media</p>
                      <div className="flex flex-col md:flex-row gap-2">
                        <select
                          value={selectedExistingMediaId}
                          onChange={(e) => setSelectedExistingMediaId(e.target.value)}
                          className="flex-1 rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                          disabled={existingMediaLoading || existingMedia.length === 0}
                        >
                          {existingMedia.length === 0 ? (
                            <option value="">
                              {existingMediaLoading ? 'Loading screenplay images...' : 'No screenplay images found'}
                            </option>
                          ) : (
                            existingMedia.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={applyExistingMediaToSlot}
                          disabled={!selectedExistingMedia}
                          className="rounded border border-[#3F3F46] px-3 py-2 text-sm text-gray-200 hover:bg-white/5 disabled:opacity-40"
                        >
                          Use Existing (0 credits)
                        </button>
                      </div>
                      {existingMediaError ? <p className="mt-2 text-xs text-red-300">{existingMediaError}</p> : null}
                    </div>

                    <div className="mt-3 rounded border border-[#2a2a2a] bg-[#101010] p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Generate with AI</p>
                      <div className="flex flex-col md:flex-row gap-2">
                        <select
                          value={imageGenerationMode}
                          onChange={(e) => setImageGenerationMode(e.target.value as ImageGenerationMode)}
                          className="md:w-64 rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                        >
                          <option value="prompt">Text Prompt</option>
                          <option value="reference">Reference + Prompt</option>
                        </select>
                      </div>

                      {imageGenerationMode === 'prompt' ? (
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
                              disabled={imageModelsLoading || imageModels.length === 0}
                            >
                              {imageModels.length === 0 ? (
                                <option value="">
                                  {imageModelsLoading ? 'Loading models...' : 'No models found'}
                                </option>
                              ) : (
                                imageModels.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.label || model.id} ({model.creditsPerImage} credits)
                                  </option>
                                ))
                              )}
                            </select>
                            <button
                              type="button"
                              onClick={requestGenerateFromPrompt}
                              disabled={uploadingImage || generatingFromPrompt || !promptGenerationText.trim() || !promptGenerationModelId}
                              className="rounded border border-[#3F3F46] px-3 py-2 text-sm text-gray-200 hover:bg-white/5 disabled:opacity-40"
                            >
                              {generatingFromPrompt ? 'Generating...' : `Generate (${promptGenerationEstimate} credits est.)`}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-2 flex flex-col md:flex-row gap-2">
                            <select
                              value={referenceMediaId}
                              onChange={(e) => setReferenceMediaId(e.target.value)}
                              className="flex-1 rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                              disabled={existingMediaLoading || existingMedia.length === 0}
                            >
                              {existingMedia.length === 0 ? (
                                <option value="">
                                  {existingMediaLoading ? 'Loading screenplay images...' : 'No screenplay images found'}
                                </option>
                              ) : (
                                existingMedia.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.label}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                          <textarea
                            value={referencePromptText}
                            onChange={(e) => setReferencePromptText(e.target.value)}
                            rows={2}
                            placeholder="Describe how to transform the reference image..."
                            className="mt-2 w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                          />
                          <div className="mt-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={requestGenerateFromReference}
                              disabled={uploadingImage || generatingFromReference || !selectedReferenceMedia || !referencePromptText.trim()}
                              className="rounded border border-[#3F3F46] px-3 py-2 text-sm text-gray-200 hover:bg-white/5 disabled:opacity-40"
                            >
                              {generatingFromReference
                                ? 'Generating...'
                                : `Generate from Reference (${referenceGenerationEstimate} credits est.)`}
                            </button>
                          </div>
                        </>
                      )}
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
                                <span className="truncate pr-2">{attempt.message}</span>
                                <span className="shrink-0 text-[10px] opacity-80">
                                  {new Date(attempt.at).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded border border-[#3F3F46] bg-[#121212] px-3 py-2 text-xs text-gray-500">
                    No image slot on this slide for the current template.
                  </div>
                )}

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
              <div className="flex items-center justify-between text-gray-300">
                <span>Estimated credits</span>
                <span className="font-semibold text-white">
                  {pendingImageAction === 'prompt' ? promptGenerationEstimate : referenceGenerationEstimate}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-gray-400">
                <span>Model</span>
                <span>
                  {pendingImageAction === 'prompt'
                    ? promptGenerationModel?.label || promptGenerationModel?.id || 'Selected model'
                    : referenceGenerationModel?.label || referenceGenerationModel?.id || 'nano-banana'}
                </span>
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
    </>
  );
}

