type UnknownRecord = Record<string, unknown>;

export interface CreditErrorInfo {
  isInsufficientCredits: boolean;
  status?: number;
  errorCode?: string;
  message?: string;
  userMessage?: string;
  required?: number;
  current?: number;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function extractCreditError(error: unknown): CreditErrorInfo {
  const errorObj = asRecord(error);
  const response = asRecord(errorObj?.response);
  const data = asRecord(response?.data);
  const status = asNumber(response?.status) ?? asNumber(errorObj?.status);

  const message =
    (typeof data?.message === 'string' ? data.message : undefined) ||
    (typeof errorObj?.message === 'string' ? (errorObj.message as string) : undefined);
  const userMessage = typeof data?.userMessage === 'string' ? data.userMessage : undefined;
  const errorCode =
    (typeof data?.error === 'string' ? data.error : undefined) ||
    (typeof errorObj?.code === 'string' ? (errorObj.code as string) : undefined);
  const required = asNumber(data?.required);
  const current = asNumber(data?.current);

  const text = `${message || ''} ${errorCode || ''}`.toLowerCase();
  const isInsufficientCredits =
    status === 402 ||
    errorCode === 'INSUFFICIENT_CREDITS' ||
    text.includes('insufficient_credits') ||
    text.includes('insufficient credits') ||
    text.includes('payment required') ||
    text.includes('http 402');

  return {
    isInsufficientCredits,
    status,
    errorCode,
    message,
    userMessage,
    required,
    current
  };
}

export function isInsufficientCreditsError(error: unknown): boolean {
  return extractCreditError(error).isInsufficientCredits;
}

export function getCreditErrorDisplayMessage(info: CreditErrorInfo): string {
  if (info.userMessage) return info.userMessage;
  if (typeof info.required === 'number' && typeof info.current === 'number') {
    return `You need ${info.required} credits but currently have ${info.current}. Add credits to continue.`;
  }
  if (info.message) return info.message;
  return 'You do not have enough credits to continue. Add credits and try again.';
}

export function syncCreditsFromError(info: CreditErrorInfo): void {
  if (typeof window === 'undefined') return;

  if (typeof info.current === 'number') {
    window.dispatchEvent(new CustomEvent('credits:override', {
      detail: { credits: info.current }
    }));
  }

  if (typeof window.refreshCredits === 'function') {
    window.refreshCredits();
  }
}

export async function preflightCreditCheck(estimateRequired?: number): Promise<{
  allowed: boolean;
  current?: number;
}> {
  if (typeof estimateRequired !== 'number' || !Number.isFinite(estimateRequired) || estimateRequired <= 0) {
    return { allowed: true };
  }

  try {
    const response = await fetch('/api/credits/balance?refresh=true', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      return { allowed: true };
    }

    const payload = (await response.json()) as { credits?: number };
    const current = asNumber(payload?.credits);
    if (typeof current !== 'number') {
      return { allowed: true };
    }

    return { allowed: current >= estimateRequired, current };
  } catch {
    // Fail open: backend remains source of truth.
    return { allowed: true };
  }
}
