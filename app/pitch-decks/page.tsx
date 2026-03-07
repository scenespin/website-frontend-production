'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generatePitchDeckDraft, type PitchDeckTextMode, type PitchDeckType } from '@/utils/pitchDeckStorage';

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
}

export default function PitchDeckCreatePage() {
  const router = useRouter();
  const [screenplayId, setScreenplayId] = useState('');
  const [deckType, setDeckType] = useState<PitchDeckType>('screenplay');
  const [templateId, setTemplateId] = useState('cinematic-dark-v1');
  const [textMode, setTextMode] = useState<PitchDeckTextMode>('auto_from_screenplay');
  const [includeBusinessSlides, setIncludeBusinessSlides] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featureEnabled = isFeatureEnabled();

  const onCreate = async () => {
    setError(null);
    if (!screenplayId.trim()) {
      setError('Screenplay ID is required');
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
    <main className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white">Create Pitch Deck</h1>
      <p className="mt-2 text-sm text-gray-400">
        Week 1 shell: generate a draft deck from screenplay context.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Screenplay ID</label>
          <input
            className="w-full rounded bg-[#141414] border border-[#3F3F46] px-3 py-2 text-sm text-white"
            value={screenplayId}
            onChange={(e) => setScreenplayId(e.target.value)}
            placeholder="screenplay_..."
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
          disabled={loading}
          className="rounded bg-[#DC143C] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate Draft Deck'}
        </button>
      </div>
    </main>
  );
}

