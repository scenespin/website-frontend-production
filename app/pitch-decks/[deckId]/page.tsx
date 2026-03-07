'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPitchDeck, updatePitchDeck, updatePitchDeckSlide, type PitchDeckSlide, type PitchDeckBlock } from '@/utils/pitchDeckStorage';
import { EditorSubNav } from '@/components/editor/EditorSubNav';

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
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
  const [deckScreenplayId, setDeckScreenplayId] = useState<string | undefined>(undefined);
  const [slides, setSlides] = useState<PitchDeckSlide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [renamingDeck, setRenamingDeck] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saved'>('idle');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const featureEnabled = isFeatureEnabled();
  const selectedSlide = useMemo(
    () => slides.find((slide) => slide.slideId === selectedSlideId) || null,
    [slides, selectedSlideId]
  );
  const selectedSlideIndex = useMemo(
    () => slides.findIndex((slide) => slide.slideId === selectedSlideId),
    [slides, selectedSlideId]
  );

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

  const goToPreviousSlide = () => {
    if (selectedSlideIndex <= 0) return;
    const prevSlide = slides[selectedSlideIndex - 1];
    if (!prevSlide) return;
    setSelectedSlideId(prevSlide.slideId);
    setSaveStatus('idle');
    setSavedAt(null);
  };

  const goToNextSlide = () => {
    if (selectedSlideIndex < 0 || selectedSlideIndex >= slides.length - 1) return;
    const nextSlide = slides[selectedSlideIndex + 1];
    if (!nextSlide) return;
    setSelectedSlideId(nextSlide.slideId);
    setSaveStatus('idle');
    setSavedAt(null);
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
                Deck already created
              </span>
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
    </>
  );
}

