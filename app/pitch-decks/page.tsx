'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { deletePitchDeck, listPitchDecksByScreenplay, updatePitchDeck, type PitchDeck } from '@/utils/pitchDeckStorage';
import { EditorSubNav } from '@/components/editor/EditorSubNav';
import { useScreenplay } from '@/contexts/ScreenplayContext';

function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PITCH_DECK_V1 === 'true';
}

function PitchDeckHubPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { screenplayId: contextScreenplayId } = useScreenplay();

  const [decks, setDecks] = useState<PitchDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const [renamingDeckId, setRenamingDeckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featureEnabled = isFeatureEnabled();
  const currentScreenplayId = useMemo(
    () => searchParams?.get('project') || searchParams?.get('screenplayId') || contextScreenplayId || '',
    [searchParams, contextScreenplayId]
  );

  useEffect(() => {
    let cancelled = false;
    const loadDecks = async () => {
      if (!currentScreenplayId) {
        setDecks([]);
        return;
      }
      setLoadingDecks(true);
      setError(null);
      try {
        const payload = await listPitchDecksByScreenplay(currentScreenplayId);
        if (cancelled) return;
        setDecks(payload.decks || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load pitch decks');
      } finally {
        if (!cancelled) setLoadingDecks(false);
      }
    };

    void loadDecks();
    return () => {
      cancelled = true;
    };
  }, [currentScreenplayId]);

  const goToCreate = () => {
    const query = currentScreenplayId ? `?screenplayId=${encodeURIComponent(currentScreenplayId)}` : '';
    router.push(`/pitch-decks/new${query}`);
  };

  const onDeleteDeck = async (deckId: string) => {
    const ok = window.confirm('Delete this pitch deck? This cannot be undone.');
    if (!ok) return;

    setDeletingDeckId(deckId);
    setError(null);
    try {
      await deletePitchDeck(deckId);
      setDecks((prev) => prev.filter((deck) => deck.deckId !== deckId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete pitch deck');
    } finally {
      setDeletingDeckId(null);
    }
  };

  const onRenameDeck = async (deck: PitchDeck) => {
    const nextTitle = window.prompt('Rename pitch deck', deck.title || '');
    if (!nextTitle) return;
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === deck.title) return;

    setRenamingDeckId(deck.deckId);
    setError(null);
    try {
      const updated = await updatePitchDeck(deck.deckId, {
        expectedVersion: deck.version,
        title: trimmed,
      });
      setDecks((prev) =>
        prev.map((item) => (item.deckId === deck.deckId ? { ...item, ...updated } : item))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to rename pitch deck');
    } finally {
      setRenamingDeckId(null);
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
      <main className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Pitch Decks</h1>
            <p className="mt-2 text-sm text-gray-400">Manage pitch decks for the current screenplay.</p>
          </div>
          <button
            onClick={goToCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shrink-0"
            style={{ backgroundColor: '#DC143C', color: 'white' }}
          >
            Create Pitch Deck
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {error ? (
            <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
          ) : null}

          {!currentScreenplayId ? (
            <section className="rounded border border-[#3F3F46] bg-[#111] p-6">
              <p className="text-sm text-gray-300">Open Pitch Deck from a screenplay context to manage decks.</p>
            </section>
          ) : (
            <section className="rounded border border-[#3F3F46] bg-[#111] p-4">
              {loadingDecks ? (
                <p className="text-sm text-gray-400">Loading pitch decks...</p>
              ) : decks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-300">No pitch decks found for this screenplay yet.</p>
                  <button
                    onClick={goToCreate}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 mx-auto"
                    style={{ backgroundColor: '#DC143C', color: 'white' }}
                  >
                    Create Your First Pitch Deck
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {decks.map((deck) => (
                    <div key={deck.deckId} className="rounded border border-[#2a2a2a] bg-[#161616] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() => router.push(`/pitch-decks/${deck.deckId}`)}
                          className="text-left hover:opacity-90"
                        >
                          <h3 className="text-sm font-semibold text-white">{deck.title}</h3>
                          <p className="mt-1 text-xs text-gray-400">
                            {deck.deckType === 'investor' ? 'Investor' : 'Screenplay'} • {deck.status}
                          </p>
                        </button>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            Updated {deck.updatedAt ? new Date(deck.updatedAt).toLocaleDateString() : '-'}
                          </span>
                          <button
                            onClick={() => onRenameDeck(deck)}
                            disabled={renamingDeckId === deck.deckId || deletingDeckId === deck.deckId}
                            className="rounded border border-[#3F3F46] px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50"
                          >
                            {renamingDeckId === deck.deckId ? 'Renaming...' : 'Rename'}
                          </button>
                          <button
                            onClick={() => onDeleteDeck(deck.deckId)}
                            disabled={deletingDeckId === deck.deckId || renamingDeckId === deck.deckId}
                            className="rounded border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingDeckId === deck.deckId ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

export default function PitchDeckHubPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <h1 className="text-2xl font-semibold text-white">Pitch Decks</h1>
          <p className="mt-2 text-sm text-gray-400">Loading...</p>
        </main>
      }
    >
      <PitchDeckHubPageContent />
    </Suspense>
  );
}

