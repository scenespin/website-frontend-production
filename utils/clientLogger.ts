type LoggerOptions = {
  debugEnabled?: boolean;
  warnEnabled?: boolean;
};

type LogState = {
  lastByKey: Map<string, number>;
  onceByKey: Set<string>;
};

const GLOBAL_LOG_STATE_KEY = '__WRYDA_CLIENT_LOG_STATE__';

function getGlobalLogState(): LogState {
  const g = globalThis as typeof globalThis & { [GLOBAL_LOG_STATE_KEY]?: LogState };
  if (!g[GLOBAL_LOG_STATE_KEY]) {
    g[GLOBAL_LOG_STATE_KEY] = {
      lastByKey: new Map<string, number>(),
      onceByKey: new Set<string>(),
    };
  }
  return g[GLOBAL_LOG_STATE_KEY] as LogState;
}

export function createClientLogger(scope: string, options: LoggerOptions = {}) {
  const debugEnabled = options.debugEnabled ?? false;
  const warnEnabled = options.warnEnabled ?? true;
  const state = getGlobalLogState();

  const prefix = `[${scope}]`;

  return {
    debug: (...args: unknown[]) => {
      if (!debugEnabled) return;
      console.log(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      if (!warnEnabled) return;
      console.warn(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(prefix, ...args);
    },
    warnOnce: (key: string, ...args: unknown[]) => {
      const fullKey = `${scope}:${key}`;
      if (state.onceByKey.has(fullKey)) return;
      state.onceByKey.add(fullKey);
      if (!warnEnabled) return;
      console.warn(prefix, ...args);
    },
    warnEvery: (key: string, intervalMs: number, ...args: unknown[]) => {
      const fullKey = `${scope}:${key}`;
      const now = Date.now();
      const last = state.lastByKey.get(fullKey) || 0;
      if (now - last < intervalMs) return;
      state.lastByKey.set(fullKey, now);
      if (!warnEnabled) return;
      console.warn(prefix, ...args);
    },
  };
}

