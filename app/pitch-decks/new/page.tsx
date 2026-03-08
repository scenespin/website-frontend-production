'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  estimatePitchDeckCost,
  generatePitchDeckDraft,
  type PitchDeckCostEstimate,
  type PitchDeckTemplate,
  type PitchDeckTextMode,
  type PitchDeckType,
  listPitchDeckTemplates,
} from '@/utils/pitchDeckStorage';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { llmModels } from '@/lib/modelCatalog';

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
}

function PitchDeckCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { screenplayId: contextScreenplayId } = useScreenplay();
  const [deckType, setDeckType] = useState<PitchDeckType>('screenplay');
  const [templateId, setTemplateId] = useState('cinematic-dark-v1');
  const [templates, setTemplates] = useState<PitchDeckTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckTitleTouched, setDeckTitleTouched] = useState(false);
  const [textMode, setTextMode] = useState<PitchDeckTextMode>('auto_from_screenplay');
  const [draftAiModelId, setDraftAiModelId] = useState('claude-sonnet-4-6');
  const [includeBusinessSlides, setIncludeBusinessSlides] = useState(false);
  const [plannedImageGenerations, setPlannedImageGenerations] = useState(0);
  const [plannedAiRewrites, setPlannedAiRewrites] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PitchDeckCostEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [screenplayTitle, setScreenplayTitle] = useState<string>('');

  const featureEnabled = isFeatureEnabled();
  const currentScreenplayId = useMemo(
    () => searchParams?.get('project') || searchParams?.get('screenplayId') || contextScreenplayId || '',
    [searchParams, contextScreenplayId]
  );

  useEffect(() => {
    let cancelled = false;
    const loadTitle = async () => {
      if (!currentScreenplayId) {
        setScreenplayTitle('');
        return;
      }
      try {
        const response = await fetch('/api/screenplays/list?status=active&limit=100', { credentials: 'include' });
        if (!response.ok) return;
        const payload = await response.json();
        const list = payload?.data?.screenplays || payload?.screenplays || [];
        const match = list.find((item: any) => item?.screenplay_id === currentScreenplayId);
        if (!cancelled) {
          setScreenplayTitle(match?.title || '');
        }
      } catch {
        if (!cancelled) setScreenplayTitle('');
      }
    };
    void loadTitle();
    return () => {
      cancelled = true;
    };
  }, [currentScreenplayId]);

  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const payload = await listPitchDeckTemplates();
        if (cancelled) return;
        const nextTemplates = payload.templates || [];
        setTemplates(nextTemplates);
        const defaultTemplate = nextTemplates.find((template) => template.isDefault) || nextTemplates[0];
        if (defaultTemplate && !nextTemplates.some((template) => template.templateId === templateId)) {
          setTemplateId(defaultTemplate.templateId);
        }
      } catch (err: any) {
        if (!cancelled) setTemplatesError(err.message || 'Failed to load templates');
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };
    void loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  useEffect(() => {
    if (!deckTitleTouched && screenplayTitle) {
      setDeckTitle(`${screenplayTitle} - Pitch Deck`);
    }
  }, [screenplayTitle, deckTitleTouched]);

  useEffect(() => {
    let cancelled = false;
    const loadEstimate = async () => {
      if (!currentScreenplayId) {
        setEstimate(null);
        return;
      }
      setEstimating(true);
      setEstimateError(null);
      try {
        const result = await estimatePitchDeckCost({
          screenplayId: currentScreenplayId,
          deckType,
          textMode,
          templateId,
          includeBusinessSlides,
          plannedImageGenerations,
          plannedAiRewrites,
        });
        if (!cancelled) setEstimate(result);
      } catch (err: any) {
        if (!cancelled) {
          setEstimate(null);
          setEstimateError(err.message || 'Failed to estimate credits');
        }
      } finally {
        if (!cancelled) setEstimating(false);
      }
    };
    void loadEstimate();
    return () => {
      cancelled = true;
    };
  }, [
    currentScreenplayId,
    deckType,
    textMode,
    templateId,
    includeBusinessSlides,
    plannedImageGenerations,
    plannedAiRewrites,
  ]);

  const onCreate = async () => {
    setError(null);
    if (!currentScreenplayId.trim()) {
      setError('No active screenplay selected. Open Pitch Deck from a screenplay context.');
      return;
    }

    setLoading(true);
    try {
      const result = await generatePitchDeckDraft({
        screenplayId: currentScreenplayId.trim(),
        deckType,
        templateId,
        textMode,
        includeBusinessSlides,
        titleOverride: deckTitle.trim() || undefined,
        desiredModelId: textMode === 'auto_plus_ai_polish' ? draftAiModelId : undefined,
      });
      router.push(`/pitch-decks/${result.deckId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create pitch deck');
    } finally {
      setLoading(false);
    }
  };

  if (!featureEnabled) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold text-white">Pitch Decks</h1>
        <p className="mt-3 text-sm text-gray-400">Pitch Deck V1 is disabled in this environment.</p>
      </main>
    );
  }

  return (
    <>
      <EditorSubNav activeTab="pitch-decks" screenplayId={currentScreenplayId || undefined} />
      <main className="p-8 max-w-4xl">
        <h1 className="text-2xl font-semibold text-white">Create Pitch Deck</h1>
        <p className="mt-2 text-sm text-gray-400">Generate a structured deck draft for the current screenplay.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Deck Name</label>
            <input
              className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
              value={deckTitle}
              onChange={(e) => {
                setDeckTitleTouched(true);
                setDeckTitle(e.target.value);
              }}
              placeholder="My Festival Pitch Deck"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Deck Type</label>
              <select
                className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                value={deckType}
                onChange={(e) => setDeckType(e.target.value as PitchDeckType)}
              >
                <option value="screenplay">Screenplay</option>
                <option value="investor">Investor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Text Mode</label>
              <select
                className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                value={textMode}
                onChange={(e) => setTextMode(e.target.value as PitchDeckTextMode)}
              >
                <option value="manual_first">Manual first (no AI start)</option>
                <option value="auto_from_screenplay">Auto from screenplay</option>
                <option value="auto_plus_ai_polish">Auto + AI polish</option>
              </select>
            </div>
          </div>

          {textMode === 'auto_plus_ai_polish' ? (
            <div>
              <label className="block text-sm text-gray-300 mb-1">AI Model (Auto + AI polish)</label>
              <select
                className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                value={draftAiModelId}
                onChange={(e) => setDraftAiModelId(e.target.value)}
              >
                {llmModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                Used for AI polish pass on slide text seeded from screenplay context.
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm text-gray-300 mb-1">Template</label>
            {templatesLoading ? <p className="text-xs text-gray-400">Loading templates...</p> : null}
            {templatesError ? <p className="text-xs text-red-300">{templatesError}</p> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => {
                const selected = template.templateId === templateId;
                return (
                  <button
                    key={template.templateId}
                    type="button"
                    onClick={() => setTemplateId(template.templateId)}
                    className={`rounded border p-3 text-left transition-colors ${
                      selected
                        ? 'border-[#DC143C] bg-[#DC143C]/10'
                        : 'border-[#3F3F46] bg-[#111] hover:border-[#5a5a5a]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{template.name}</p>
                      {template.isDefault ? (
                        <span className="rounded border border-[#3F3F46] px-2 py-0.5 text-[10px] text-gray-300">Default</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{template.description}</p>
                    <p className="mt-2 text-[11px] text-gray-500">{template.styleSummary}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Planned Image Generations</label>
              <input
                type="number"
                min={0}
                max={50}
                className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                value={plannedImageGenerations}
                onChange={(e) => setPlannedImageGenerations(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Planned AI Rewrites</label>
              <input
                type="number"
                min={0}
                max={50}
                className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
                value={plannedAiRewrites}
                onChange={(e) => setPlannedAiRewrites(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="rounded border border-[#3F3F46] bg-[#111] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-300">Estimated credits</div>
              {estimating ? (
                <span className="text-xs text-gray-400">Calculating...</span>
              ) : (
                <span className="text-sm font-semibold text-white">
                  {estimate?.estimate?.totalCredits ?? 0} credits
                </span>
              )}
            </div>
            {estimateError ? <p className="mt-1 text-xs text-red-300">{estimateError}</p> : null}
            {estimate?.estimate?.breakdown?.length ? (
              <div className="mt-2 space-y-1">
                {estimate.estimate.breakdown.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-xs text-gray-400">
                    <span>{item.label}</span>
                    <span>{item.credits}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {estimate?.estimate?.signals ? (
              <div className="mt-2 text-[11px] text-gray-500">
                Model: screenplay-aware beta • approx tokens {estimate.estimate.signals.estimatedTokens} • projected slides{' '}
                {estimate.estimate.signals.projectedSlides}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-gray-500">Estimate model: screenplay-aware beta</div>
            )}
            {estimate?.note ? <p className="mt-1 text-[11px] text-gray-500">{estimate.note}</p> : null}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={includeBusinessSlides}
                onChange={(e) => setIncludeBusinessSlides(e.target.checked)}
              />
              Include business slides
            </label>

            <button
              onClick={onCreate}
              disabled={loading || !currentScreenplayId}
              className="rounded bg-[#DC143C] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate Draft Deck'}
            </button>
          </div>

          {error ? (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

export default function PitchDeckCreateNewPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <h1 className="text-2xl font-semibold text-white">Create Pitch Deck</h1>
          <p className="mt-2 text-sm text-gray-400">Loading...</p>
        </main>
      }
    >
      <PitchDeckCreatePageContent />
    </Suspense>
  );
}

