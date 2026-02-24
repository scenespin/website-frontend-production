export type AIDisclosureSource =
  | 'story_advisor_ai'
  | 'rewrite_ai'
  | 'dialogue_ai'
  | 'screenwriter_ai'
  | 'director_ai'
  | 'manual_tag';

export type AIDisclosureFeature = 'copy_paste' | 'replace_selection' | 'insert_text';
export type AIDisclosureConfidence = 'high' | 'confirmed' | 'low';
export type AIDisclosureConsentStatus = 'unknown' | 'declared_yes' | 'declared_no';

export type AIDisclosurePolicyContext = {
  org_name?: string | null;
  policy_reference?: string | null;
  policy_version?: string | null;
};

export type AIDisclosureEvent = {
  event_id: string;
  screenplay_id: string;
  user_id: string;
  timestamp: string;
  source: AIDisclosureSource;
  feature: AIDisclosureFeature;
  range_start: number;
  range_end: number;
  scene_heading?: string | null;
  preview: string;
  confidence: AIDisclosureConfidence;
  consent_status?: AIDisclosureConsentStatus;
  consent_note?: string | null;
  policy_context?: AIDisclosurePolicyContext | null;
  meta?: Record<string, unknown>;
};

export type AIDisclosureConsentPayload = {
  consent_status: AIDisclosureConsentStatus;
  consent_note?: string;
  policy_context?: AIDisclosurePolicyContext;
};

export type AIDisclosureEventPayload = Omit<
  AIDisclosureEvent,
  'event_id' | 'screenplay_id' | 'user_id' | 'timestamp'
>;

type GitHubLedgerConfig = {
  owner: string;
  repo: string;
  branch?: string;
};

type PendingGitHubLedgerItem = {
  screenplayId: string;
  config: GitHubLedgerConfig;
  event: AIDisclosureEvent;
  attempts: number;
  nextRetryAt: number;
  enqueuedAt: number;
  lastError?: string;
};

type GitHubLedgerMetrics = {
  enqueued: number;
  retried: number;
  succeeded: number;
  failed: number;
  dropped: number;
  lastUpdatedAt: number;
};

const LEDGER_QUEUE_KEY = 'ai_disclosure_github_ledger_pending_v1';
const LEDGER_METRICS_KEY = 'ai_disclosure_github_ledger_metrics_v1';
const LEDGER_MAX_QUEUE = 200;
const LEDGER_FLUSH_BATCH_SIZE = 20;
const LEDGER_FLUSH_INTERVAL_MS = 30000;
const LEDGER_RETRY_BASE_MS = 5000;
const LEDGER_RETRY_MAX_MS = 5 * 60 * 1000;
const LEDGER_RETRY_INIT_KEY = '__wrydaAIAuditLedgerRetryInitialized';

let flushInFlight = false;

export function isAIDisclosureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_AI_DISCLOSURE_MVP === 'true';
}

export function isGitHubAIAuditLedgerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_GITHUB_AI_AUDIT_LEDGER === 'true';
}

export function buildAIDisclosurePreview(text: string, maxLength: number = 220): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export async function createAIDisclosureEvent(
  screenplayId: string,
  payload: AIDisclosureEventPayload
): Promise<AIDisclosureEvent> {
  const response = await fetch(`/api/screenplays/${screenplayId}/ai-disclosure-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to create AI disclosure event');
  }

  const data = await response.json();
  return data.data;
}

export async function createAIDisclosureEventSafe(
  screenplayId: string,
  payload: AIDisclosureEventPayload,
  getBackendToken?: () => Promise<string | null>
): Promise<void> {
  try {
    const createdEvent = await createAIDisclosureEvent(screenplayId, payload);
    await appendEventToGitHubAuditLedgerSafe(screenplayId, createdEvent, getBackendToken);
  } catch (error) {
    console.warn('[AIDisclosure] Non-blocking event logging failed:', error);
  }
}

async function appendEventToGitHubAuditLedgerSafe(
  screenplayId: string,
  event: AIDisclosureEvent,
  getBackendToken?: () => Promise<string | null>
): Promise<void> {
  if (!isGitHubAIAuditLedgerEnabled()) return;
  if (!getBackendToken) return;

  try {
    const config = readGitHubLedgerConfigFromStorage();
    if (!config) return;

    await flushPendingGitHubLedgerQueueSafe(getBackendToken, 'next-event');

    const token = await getBackendToken();
    if (!token) throw new Error('Missing backend auth token for GitHub AI audit append');

    await appendEventToGitHubAuditLedger({
      screenplayId,
      config,
      event,
      token,
    });
  } catch (error) {
    enqueuePendingLedgerItem({
      screenplayId,
      config: readGitHubLedgerConfigFromStorage() || { owner: '', repo: '' },
      event,
      lastError: error instanceof Error ? error.message : String(error),
    });
    console.warn('[AIDisclosure] Non-blocking GitHub AI audit append failed; queued for retry:', error);
  }
}

export function initializeGitHubAIAuditLedgerRetries(
  getBackendToken?: () => Promise<string | null>
): void {
  if (typeof window === 'undefined') return;
  if (!isGitHubAIAuditLedgerEnabled()) return;
  if (!getBackendToken) return;

  const globalWindow = window as Window & Record<string, unknown>;
  if (globalWindow[LEDGER_RETRY_INIT_KEY]) return;
  globalWindow[LEDGER_RETRY_INIT_KEY] = true;

  const flush = () => {
    void flushPendingGitHubLedgerQueueSafe(getBackendToken, 'interval');
  };

  window.addEventListener('online', () => {
    void flushPendingGitHubLedgerQueueSafe(getBackendToken, 'online');
  });

  setInterval(flush, LEDGER_FLUSH_INTERVAL_MS);
  void flushPendingGitHubLedgerQueueSafe(getBackendToken, 'init');
}

async function appendEventToGitHubAuditLedger(params: {
  screenplayId: string;
  config: GitHubLedgerConfig;
  event: AIDisclosureEvent;
  token: string;
}): Promise<void> {
  const { screenplayId, config, event, token } = params;
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://backend.wryda.ai';

  const response = await fetch(`${backendUrl}/api/github/ai-audit/append`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      screenplayId,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      event,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to append GitHub AI audit event');
  }
}

async function flushPendingGitHubLedgerQueueSafe(
  getBackendToken: () => Promise<string | null>,
  reason: string
): Promise<void> {
  if (!isGitHubAIAuditLedgerEnabled()) return;
  if (flushInFlight) return;
  if (typeof window === 'undefined') return;

  let queue = readPendingLedgerQueue();
  if (queue.length === 0) return;

  flushInFlight = true;
  try {
    const now = Date.now();
    const token = await getBackendToken();
    if (!token) return;

    let succeeded = 0;
    let failed = 0;
    let retried = 0;
    const nextQueue: PendingGitHubLedgerItem[] = [];
    let processed = 0;

    for (const item of queue) {
      if (item.nextRetryAt > now || processed >= LEDGER_FLUSH_BATCH_SIZE) {
        nextQueue.push(item);
        continue;
      }
      processed += 1;

      try {
        await appendEventToGitHubAuditLedger({
          screenplayId: item.screenplayId,
          config: item.config,
          event: item.event,
          token,
        });
        succeeded += 1;
      } catch (error) {
        failed += 1;
        retried += 1;
        const attempts = item.attempts + 1;
        nextQueue.push({
          ...item,
          attempts,
          nextRetryAt: Date.now() + computeRetryDelayMs(attempts),
          lastError: error instanceof Error ? error.message : String(error),
        });
      }
    }

    writePendingLedgerQueue(nextQueue);
    incrementLedgerMetrics('succeeded', succeeded);
    incrementLedgerMetrics('failed', failed);
    incrementLedgerMetrics('retried', retried);

    if (succeeded > 0 || failed > 0) {
      console.info('[AIDisclosure] GitHub audit ledger queue flush:', {
        reason,
        succeeded,
        failed,
        remaining: nextQueue.length,
      });
    }
  } finally {
    flushInFlight = false;
  }
}

function computeRetryDelayMs(attempts: number): number {
  const exp = Math.max(0, attempts - 1);
  const delay = LEDGER_RETRY_BASE_MS * (2 ** exp);
  return Math.min(delay, LEDGER_RETRY_MAX_MS);
}

function enqueuePendingLedgerItem(input: {
  screenplayId: string;
  config: GitHubLedgerConfig;
  event: AIDisclosureEvent;
  lastError?: string;
}) {
  if (!input.config.owner || !input.config.repo) return;
  const eventId = input.event.event_id;
  if (!eventId) return;

  const queue = readPendingLedgerQueue();
  if (queue.some((item) => item.event.event_id === eventId)) {
    return;
  }

  if (queue.length >= LEDGER_MAX_QUEUE) {
    queue.shift();
    incrementLedgerMetrics('dropped', 1);
  }

  queue.push({
    screenplayId: input.screenplayId,
    config: input.config,
    event: input.event,
    attempts: 0,
    nextRetryAt: Date.now(),
    enqueuedAt: Date.now(),
    lastError: input.lastError,
  });

  writePendingLedgerQueue(queue);
  incrementLedgerMetrics('enqueued', 1);
}

function readPendingLedgerQueue(): PendingGitHubLedgerItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEDGER_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.event?.event_id && item?.config?.owner && item?.config?.repo);
  } catch {
    return [];
  }
}

function writePendingLedgerQueue(queue: PendingGitHubLedgerItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEDGER_QUEUE_KEY, JSON.stringify(queue));
}

function readLedgerMetrics(): GitHubLedgerMetrics {
  if (typeof window === 'undefined') {
    return {
      enqueued: 0,
      retried: 0,
      succeeded: 0,
      failed: 0,
      dropped: 0,
      lastUpdatedAt: Date.now(),
    };
  }
  try {
    const raw = localStorage.getItem(LEDGER_METRICS_KEY);
    if (!raw) throw new Error('missing');
    const parsed = JSON.parse(raw) as GitHubLedgerMetrics;
    return {
      enqueued: parsed.enqueued || 0,
      retried: parsed.retried || 0,
      succeeded: parsed.succeeded || 0,
      failed: parsed.failed || 0,
      dropped: parsed.dropped || 0,
      lastUpdatedAt: parsed.lastUpdatedAt || Date.now(),
    };
  } catch {
    return {
      enqueued: 0,
      retried: 0,
      succeeded: 0,
      failed: 0,
      dropped: 0,
      lastUpdatedAt: Date.now(),
    };
  }
}

function incrementLedgerMetrics(field: keyof Omit<GitHubLedgerMetrics, 'lastUpdatedAt'>, by: number) {
  if (by <= 0 || typeof window === 'undefined') return;
  const metrics = readLedgerMetrics();
  metrics[field] += by;
  metrics.lastUpdatedAt = Date.now();
  localStorage.setItem(LEDGER_METRICS_KEY, JSON.stringify(metrics));
}

export const __aiDisclosureLedgerTestUtils = {
  LEDGER_MAX_QUEUE,
  LEDGER_RETRY_BASE_MS,
  LEDGER_RETRY_MAX_MS,
  computeRetryDelayMs,
  enqueuePendingLedgerItem,
  readPendingLedgerQueue,
  writePendingLedgerQueue,
  readLedgerMetrics,
  flushPendingGitHubLedgerQueueSafe,
  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LEDGER_QUEUE_KEY);
    localStorage.removeItem(LEDGER_METRICS_KEY);
  },
};

function readGitHubLedgerConfigFromStorage(): GitHubLedgerConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('screenplay_github_config');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      owner?: string;
      repo?: string;
      branch?: string;
    };

    if (!parsed?.owner || !parsed?.repo) return null;
    return {
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch,
    };
  } catch {
    return null;
  }
}

export async function listAIDisclosureEvents(
  screenplayId: string,
  params?: {
    limit?: number;
    nextToken?: string;
    source?: AIDisclosureSource;
    from_date?: string;
    to_date?: string;
  }
): Promise<{ data: AIDisclosureEvent[]; nextToken?: string }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.nextToken) searchParams.set('nextToken', params.nextToken);
  if (params?.source) searchParams.set('source', params.source);
  if (params?.from_date) searchParams.set('from_date', params.from_date);
  if (params?.to_date) searchParams.set('to_date', params.to_date);

  const query = searchParams.toString();
  const response = await fetch(
    `/api/screenplays/${screenplayId}/ai-disclosure-events${query ? `?${query}` : ''}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to list AI disclosure events');
  }

  const result = await response.json();
  return { data: result.data || [], nextToken: result.nextToken };
}

export async function getAIDisclosureReport(screenplayId: string): Promise<any> {
  const response = await fetch(`/api/screenplays/${screenplayId}/ai-disclosure-report`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to load AI disclosure report');
  }

  const result = await response.json();
  return result.data;
}

export async function updateAIDisclosureConsent(
  screenplayId: string,
  payload: AIDisclosureConsentPayload
): Promise<AIDisclosureConsentPayload> {
  const response = await fetch(`/api/screenplays/${screenplayId}/ai-disclosure-consent`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to update consent details');
  }

  const result = await response.json();
  return result.data;
}

export function downloadAIDisclosureReportJson(report: any, screenplayTitle?: string): void {
  const fileTitle = toSlugFileTitle(screenplayTitle);

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileTitle || 'screenplay'}-ai-disclosure-report.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toSlugFileTitle(screenplayTitle?: string): string {
  return (screenplayTitle || 'screenplay')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
