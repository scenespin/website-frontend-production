'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generatePitchDeckDraft, type PitchDeckTextMode, type PitchDeckType } from '@/utils/pitchDeckStorage';
import { EditorSubNav } from '@/components/editor/EditorSubNav';

type ScreenplayOption = {
  screenplay_id: string;
  title?: string;
  description?: string;
  status?: string;
};

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
}

function PitchDeckCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screenplayId, setScreenplayId] = useState('');
  const [screenplayQuery, setScreenplayQuery] = useState('');
  const [screenplays, setScreenplays] = useState<ScreenplayOption[]>([]);
  const [loadingScreenplays, setLoadingScreenplays] = useState(true);
  const [deckType, setDeckType] = useState<PitchDeckType>('screenplay');
  const [templateId, setTemplateId] = useState('cinematic-dark-v1');
  const [textMode, setTextMode] = useState<PitchDeckTextMode>('auto_from_screenplay');
  const [includeBusinessSlides, setIncludeBusinessSlides] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featureEnabled = isFeatureEnabled();
  const requestedScreenplayId = searchParams?.get('screenplayId') || searchParams?.get('project') || '';

  useEffect(() => {
    let cancelled = false;
    const loadScreenplays = async () => {
      setLoadingScreenplays(true);
      try {
        const response = await fetch('/api/screenplays/list?status=active&limit=100', { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Failed to load screenplays (${response.status})`);
        }
        const payload = await response.json();
        const list = (payload?.data?.screenplays || payload?.screenplays || []).filter(
          (item: ScreenplayOption) => item?.screenplay_id
        );

        if (cancelled) return;
        setScreenplays(list);
        if (requestedScreenplayId) {
          setScreenplayId(requestedScreenplayId);
        } else if (list.length > 0) {
          setScreenplayId(list[0].screenplay_id);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load screenplays');
        }
      } finally {
        if (!cancelled) setLoadingScreenplays(false);
      }
    };

    void loadScreenplays();
    return () => {
      cancelled = true;
    };
  }, [requestedScreenplayId]);

  const filteredScreenplays = useMemo(() => {
    const needle = screenplayQuery.trim().toLowerCase();
    if (!needle) return screenplays;
    return screenplays.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const id = (item.screenplay_id || '').toLowerCase();
      return title.includes(needle) || id.includes(needle);
    });
  }, [screenplays, screenplayQuery]);

  const onCreate = async () => {
    setError(null);
    if (!screenplayId.trim()) {
      setError('Please select a screenplay');
      return;
    }

    setLoading(true);
    try {
      const result = await generatePitchDeckDraft({
        screenplayId: screenplayId.trim(),
        deckType,
        templateId,
        textMode,
        includeBusinessSlides,
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
        <p className="mt-3 text-sm text-gray-400">
          Pitch Deck V1 is disabled in this environment.
        </p>
      </main>
    );
  }

  return (
    <>
      <EditorSubNav activeTab="pitch-decks" screenplayId={screenplayId || undefined} />
      <main className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Create Pitch Deck</h1>
        <p className="mt-2 text-sm text-gray-400">
          Select a screenplay, then generate a structured deck draft.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Screenplay</label>
            <input
              className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white mb-2"
              value={screenplayQuery}
              onChange={(e) => setScreenplayQuery(e.target.value)}
              placeholder="Search by title or ID..."
            />
            <select
              className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
              value={screenplayId}
              onChange={(e) => setScreenplayId(e.target.value)}
              disabled={loadingScreenplays || filteredScreenplays.length === 0}
            >
              {loadingScreenplays ? <option value="">Loading screenplays...</option> : null}
              {!loadingScreenplays && filteredScreenplays.length === 0 ? (
                <option value="">No screenplays match your search</option>
              ) : null}
              {!loadingScreenplays
                ? filteredScreenplays.map((item) => (
                    <option key={item.screenplay_id} value={item.screenplay_id}>
                      {(item.title || 'Untitled Screenplay').trim()} - {item.screenplay_id}
                    </option>
                  ))
                : null}
            </select>
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

          <div>
            <label className="block text-sm text-gray-300 mb-1">Template</label>
            <input
              className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={includeBusinessSlides}
              onChange={(e) => setIncludeBusinessSlides(e.target.checked)}
            />
            Include business slides
          </label>

          {error ? (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            onClick={onCreate}
            disabled={loading || loadingScreenplays || !screenplayId}
            className="rounded bg-[#DC143C] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? 'Generating...' : 'Generate Draft Deck'}
          </button>
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

