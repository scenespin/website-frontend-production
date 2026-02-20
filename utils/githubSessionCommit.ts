import { getScreenplayFilePath, saveToGitHub, type GitHubConfig } from '@/utils/github';

const FEATURE_FLAG = 'NEXT_PUBLIC_ENABLE_GITHUB_SESSION_COMMITS';
const GITHUB_CONFIG_KEY = 'screenplay_github_config';

const markerKey = (screenplayId: string) => `github_session_last_hash_${screenplayId}`;
const pendingKey = (screenplayId: string) => `github_session_pending_${screenplayId}`;

export interface SessionCommitInput {
  screenplayId: string;
  title: string;
  content: string;
  sessionStartedAt: number;
  sessionStartWordCount: number;
  sessionEndedAt?: number;
}

interface PendingSessionCommit {
  screenplayId: string;
  title: string;
  content: string;
  sessionStartedAt: number;
  sessionStartWordCount: number;
  sessionEndedAt: number;
  hash: string;
  attemptedAt: number;
}

type SessionCommitResult =
  | { status: 'disabled' | 'invalid_screenplay' | 'not_connected' | 'empty_content' | 'skipped_unchanged' }
  | { status: 'committed'; hash: string }
  | { status: 'queued'; reason: string };

export function isGitHubSessionCommitEnabled(): boolean {
  return process.env[FEATURE_FLAG] === 'true';
}

export function normalizeGitHubConfig(rawConfig: unknown): GitHubConfig | null {
  if (!rawConfig || typeof rawConfig !== 'object') {
    return null;
  }

  const candidate = rawConfig as Record<string, unknown>;
  const tokenValue = candidate.accessToken || candidate.token;
  const owner = candidate.owner;
  const repo = candidate.repo;

  if (typeof tokenValue !== 'string' || !tokenValue.trim()) return null;
  if (typeof owner !== 'string' || !owner.trim()) return null;
  if (typeof repo !== 'string' || !repo.trim()) return null;

  return {
    token: tokenValue.trim(),
    owner: owner.trim(),
    repo: repo.trim()
  };
}

function getStoredGitHubConfig(): GitHubConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!raw) return null;
    return normalizeGitHubConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

function isValidScreenplayId(screenplayId: string): boolean {
  return screenplayId.startsWith('screenplay_');
}

function toWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function readLastCommittedHash(screenplayId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(markerKey(screenplayId));
}

function writeLastCommittedHash(screenplayId: string, hash: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(markerKey(screenplayId), hash);
}

function writePendingCommit(payload: PendingSessionCommit): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(pendingKey(payload.screenplayId), JSON.stringify(payload));
}

function readPendingCommit(screenplayId: string): PendingSessionCommit | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(pendingKey(screenplayId));
    if (!raw) return null;
    return JSON.parse(raw) as PendingSessionCommit;
  } catch {
    return null;
  }
}

function clearPendingCommit(screenplayId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(pendingKey(screenplayId));
}

function buildTimeWindow(startedAt: number, endedAt: number): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const startText = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endText = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startText}-${endText}`;
}

function buildSessionCommitMessage(
  title: string,
  sessionStartedAt: number,
  sessionEndedAt: number,
  wordDelta: number
): string {
  const safeTitle = title.trim() || 'Untitled Screenplay';
  const sign = wordDelta > 0 ? '+' : '';
  return `Session end: ${safeTitle} · ${buildTimeWindow(sessionStartedAt, sessionEndedAt)} · ${sign}${wordDelta} words`;
}

async function commitNow(
  config: GitHubConfig,
  screenplayId: string,
  content: string,
  message: string
): Promise<void> {
  await saveToGitHub(config, {
    path: getScreenplayFilePath(screenplayId),
    content,
    message,
    branch: 'main'
  });
}

export async function commitScreenplaySessionToGitHub(
  input: SessionCommitInput
): Promise<SessionCommitResult> {
  if (!isGitHubSessionCommitEnabled()) return { status: 'disabled' };
  if (!isValidScreenplayId(input.screenplayId)) return { status: 'invalid_screenplay' };

  const config = getStoredGitHubConfig();
  if (!config) return { status: 'not_connected' };

  const trimmedContent = input.content.trim();
  if (!trimmedContent) return { status: 'empty_content' };

  const sessionEndedAt = input.sessionEndedAt ?? Date.now();
  const nextHash = fnv1aHash(input.content);
  const previousHash = readLastCommittedHash(input.screenplayId);

  if (previousHash === nextHash) {
    clearPendingCommit(input.screenplayId);
    return { status: 'skipped_unchanged' };
  }

  const wordDelta = toWordCount(input.content) - input.sessionStartWordCount;
  const message = buildSessionCommitMessage(input.title, input.sessionStartedAt, sessionEndedAt, wordDelta);

  try {
    await commitNow(config, input.screenplayId, input.content, message);
    writeLastCommittedHash(input.screenplayId, nextHash);
    clearPendingCommit(input.screenplayId);
    return { status: 'committed', hash: nextHash };
  } catch (error: any) {
    writePendingCommit({
      screenplayId: input.screenplayId,
      title: input.title,
      content: input.content,
      sessionStartedAt: input.sessionStartedAt,
      sessionStartWordCount: input.sessionStartWordCount,
      sessionEndedAt,
      hash: nextHash,
      attemptedAt: Date.now()
    });

    return {
      status: 'queued',
      reason: error?.message || 'GitHub commit failed'
    };
  }
}

export async function retryPendingScreenplaySessionCommit(
  screenplayId: string
): Promise<SessionCommitResult> {
  if (!isGitHubSessionCommitEnabled()) return { status: 'disabled' };
  if (!isValidScreenplayId(screenplayId)) return { status: 'invalid_screenplay' };

  const pending = readPendingCommit(screenplayId);
  if (!pending) return { status: 'skipped_unchanged' };

  return commitScreenplaySessionToGitHub({
    screenplayId: pending.screenplayId,
    title: pending.title,
    content: pending.content,
    sessionStartedAt: pending.sessionStartedAt,
    sessionStartWordCount: pending.sessionStartWordCount,
    sessionEndedAt: pending.sessionEndedAt
  });
}
