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

    const token = await getBackendToken();
    if (!token) return;

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
  } catch (error) {
    // Non-blocking by design: audit-ledger append must never break editor workflows.
    console.warn('[AIDisclosure] Non-blocking GitHub AI audit append failed:', error);
  }
}

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
