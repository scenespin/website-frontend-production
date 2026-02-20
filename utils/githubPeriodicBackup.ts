import { getScreenplayFilePath, saveToGitHub, type GitHubConfig } from '@/utils/github';

const FEATURE_FLAG = 'NEXT_PUBLIC_ENABLE_GITHUB_PERIODIC_BACKUP';
const GITHUB_CONFIG_KEY = 'screenplay_github_config';

export const PERIODIC_EVALUATION_INTERVAL_MS = 60 * 1000; // 60s tick
export const PERIODIC_BACKUP_COOLDOWN_MS = 15 * 60 * 1000; // 15m minimum between periodic commits

const hashKey = (screenplayId: string) => `github_periodic_last_hash_${screenplayId}`;
const committedAtKey = (screenplayId: string) => `github_periodic_last_commit_at_${screenplayId}`;
const pendingKey = (screenplayId: string) => `github_periodic_pending_${screenplayId}`;

export interface PeriodicBackupInput {
  screenplayId: string;
  title: string;
  content: string;
  isDirty: boolean;
  now?: number;
}

interface PendingPeriodicBackup {
  screenplayId: string;
  title: string;
  content: string;
  hash: string;
  queuedAt: number;
}

export type PeriodicBackupResult =
  | {
      status:
        | 'disabled'
        | 'invalid_screenplay'
        | 'not_connected'
        | 'not_dirty'
        | 'empty_content'
        | 'cooldown'
        | 'unchanged'
        | 'no_pending';
      reason: string;
    }
  | { status: 'committed'; hash: string; committedAt: number }
  | { status: 'queued'; reason: string };

export function isGitHubPeriodicBackupEnabled(): boolean {
  return process.env[FEATURE_FLAG] === 'true';
}

export function normalizeGitHubConfig(rawConfig: unknown): GitHubConfig | null {
  if (!rawConfig || typeof rawConfig !== 'object') return null;

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

function nowMs(inputNow?: number): number {
  return inputNow ?? Date.now();
}

function getLastCommittedHash(screenplayId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(hashKey(screenplayId));
}

function setLastCommittedHash(screenplayId: string, hash: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(hashKey(screenplayId), hash);
}

function getLastCommittedAt(screenplayId: string): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(committedAtKey(screenplayId));
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function setLastCommittedAt(screenplayId: string, atMs: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(committedAtKey(screenplayId), String(atMs));
}

function getPending(screenplayId: string): PendingPeriodicBackup | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(pendingKey(screenplayId));
    if (!raw) return null;
    return JSON.parse(raw) as PendingPeriodicBackup;
  } catch {
    return null;
  }
}

function setPending(payload: PendingPeriodicBackup): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(pendingKey(payload.screenplayId), JSON.stringify(payload));
}

function clearPending(screenplayId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(pendingKey(screenplayId));
}

function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function formatTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function periodicCommitMessage(title: string, atMs: number): string {
  const safeTitle = title.trim() || 'Untitled Screenplay';
  return `Periodic backup: ${safeTitle} · ${formatTime(atMs)}`;
}

async function commit(
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

export async function maybeRunPeriodicGitHubBackup(
  input: PeriodicBackupInput
): Promise<PeriodicBackupResult> {
  const now = nowMs(input.now);
  return runPeriodicBackup(input, { now, requireDirty: true, enforceCooldown: true });
}

export async function retryPendingPeriodicGitHubBackup(
  screenplayId: string,
  isDirty: boolean
): Promise<PeriodicBackupResult> {
  if (!isGitHubPeriodicBackupEnabled()) {
    return { status: 'disabled', reason: 'Feature flag disabled' };
  }
  if (!isValidScreenplayId(screenplayId)) {
    return { status: 'invalid_screenplay', reason: 'Invalid screenplay id' };
  }

  const pending = getPending(screenplayId);
  if (!pending) {
    return { status: 'no_pending', reason: 'No pending periodic backup' };
  }

  return runPeriodicBackup({
    screenplayId: pending.screenplayId,
    title: pending.title,
    content: pending.content,
    isDirty
  }, { now: Date.now(), requireDirty: false, enforceCooldown: false });
}

interface RunOptions {
  now: number;
  requireDirty: boolean;
  enforceCooldown: boolean;
}

async function runPeriodicBackup(
  input: PeriodicBackupInput,
  options: RunOptions
): Promise<PeriodicBackupResult> {
  if (!isGitHubPeriodicBackupEnabled()) {
    return { status: 'disabled', reason: 'Feature flag disabled' };
  }
  if (!isValidScreenplayId(input.screenplayId)) {
    return { status: 'invalid_screenplay', reason: 'Invalid screenplay id' };
  }
  if (options.requireDirty && !input.isDirty) {
    return { status: 'not_dirty', reason: 'No unsaved edits' };
  }
  if (!input.content.trim()) {
    return { status: 'empty_content', reason: 'Content is empty' };
  }

  const config = getStoredGitHubConfig();
  if (!config) {
    return { status: 'not_connected', reason: 'GitHub config missing/invalid' };
  }

  if (options.enforceCooldown) {
    const lastCommittedAt = getLastCommittedAt(input.screenplayId);
    if (lastCommittedAt && options.now - lastCommittedAt < PERIODIC_BACKUP_COOLDOWN_MS) {
      return { status: 'cooldown', reason: 'Periodic cooldown active' };
    }
  }

  const nextHash = fnv1aHash(input.content);
  const previousHash = getLastCommittedHash(input.screenplayId);
  if (previousHash === nextHash) {
    clearPending(input.screenplayId);
    return { status: 'unchanged', reason: 'Content hash unchanged' };
  }

  const message = periodicCommitMessage(input.title, options.now);

  try {
    await commit(config, input.screenplayId, input.content, message);
    setLastCommittedHash(input.screenplayId, nextHash);
    setLastCommittedAt(input.screenplayId, options.now);
    clearPending(input.screenplayId);
    return { status: 'committed', hash: nextHash, committedAt: options.now };
  } catch (error: any) {
    setPending({
      screenplayId: input.screenplayId,
      title: input.title,
      content: input.content,
      hash: nextHash,
      queuedAt: options.now
    });
    return {
      status: 'queued',
      reason: error?.message || 'GitHub periodic backup failed'
    };
  }
}

export function markPeriodicGitHubBackupCheckpoint(
  screenplayId: string,
  content: string,
  committedAt: number = Date.now()
): void {
  if (!isValidScreenplayId(screenplayId)) {
    return;
  }

  const nextHash = fnv1aHash(content);
  setLastCommittedHash(screenplayId, nextHash);
  setLastCommittedAt(screenplayId, committedAt);
  clearPending(screenplayId);
}
