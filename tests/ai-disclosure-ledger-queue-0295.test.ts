/* eslint-env node */
import assert from 'node:assert/strict';
import { __aiDisclosureLedgerTestUtils } from '../utils/aiDisclosureStorage';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

function installBrowserMocks() {
  const storage = new MemoryStorage();
  (global as any).localStorage = storage;
  (global as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

function buildEvent(eventId: string) {
  return {
    event_id: eventId,
    screenplay_id: 'screenplay_test',
    user_id: 'user_test',
    timestamp: new Date().toISOString(),
    source: 'rewrite_ai' as const,
    feature: 'insert_text' as const,
    range_start: 0,
    range_end: 10,
    preview: 'Test preview',
    confidence: 'high' as const,
  };
}

async function run() {
  process.env.NEXT_PUBLIC_ENABLE_GITHUB_AI_AUDIT_LEDGER = 'true';
  installBrowserMocks();
  __aiDisclosureLedgerTestUtils.clearAll();

  // Test 1: exponential retry delay clamps at max.
  const retryDelayAttempt1 = __aiDisclosureLedgerTestUtils.computeRetryDelayMs(1);
  const minExpected = Math.floor(__aiDisclosureLedgerTestUtils.LEDGER_RETRY_BASE_MS * 0.8);
  const maxExpected = Math.ceil(__aiDisclosureLedgerTestUtils.LEDGER_RETRY_BASE_MS * 1.2);
  assert.ok(retryDelayAttempt1 >= minExpected && retryDelayAttempt1 <= maxExpected);
  assert.equal(
    __aiDisclosureLedgerTestUtils.computeRetryDelayMs(20),
    __aiDisclosureLedgerTestUtils.LEDGER_RETRY_MAX_MS
  );

  // Test 2: queue dedupes by event_id.
  __aiDisclosureLedgerTestUtils.enqueuePendingLedgerItem({
    screenplayId: 'screenplay_test',
    config: { owner: 'owner', repo: 'repo' },
    event: buildEvent('event_dup'),
  });
  __aiDisclosureLedgerTestUtils.enqueuePendingLedgerItem({
    screenplayId: 'screenplay_test',
    config: { owner: 'owner', repo: 'repo' },
    event: buildEvent('event_dup'),
  });
  let queue = __aiDisclosureLedgerTestUtils.readPendingLedgerQueue();
  assert.equal(queue.length, 1);

  // Test 3: queue cap drops oldest entries.
  __aiDisclosureLedgerTestUtils.clearAll();
  for (let i = 0; i < __aiDisclosureLedgerTestUtils.LEDGER_MAX_QUEUE + 5; i += 1) {
    __aiDisclosureLedgerTestUtils.enqueuePendingLedgerItem({
      screenplayId: 'screenplay_test',
      config: { owner: 'owner', repo: 'repo' },
      event: buildEvent(`event_${i}`),
    });
  }
  queue = __aiDisclosureLedgerTestUtils.readPendingLedgerQueue();
  assert.equal(queue.length, __aiDisclosureLedgerTestUtils.LEDGER_MAX_QUEUE);
  assert.equal(queue.some((item) => item.event.event_id === 'event_0'), false);

  // Test 4: flush retries failed entries, then succeeds.
  __aiDisclosureLedgerTestUtils.clearAll();
  __aiDisclosureLedgerTestUtils.enqueuePendingLedgerItem({
    screenplayId: 'screenplay_test',
    config: { owner: 'owner', repo: 'repo' },
    event: buildEvent('event_retry'),
  });

  (global as any).fetch = async () => ({
    ok: false,
    json: async () => ({ message: 'simulated failure' }),
  });
  await __aiDisclosureLedgerTestUtils.flushPendingGitHubLedgerQueueSafe(
    async () => 'token',
    'test-failure'
  );
  queue = __aiDisclosureLedgerTestUtils.readPendingLedgerQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].attempts, 1);

  // Force immediate retry timing for deterministic test.
  queue[0].nextRetryAt = Date.now() - 1;
  __aiDisclosureLedgerTestUtils.writePendingLedgerQueue(queue);

  (global as any).fetch = async () => ({
    ok: true,
    json: async () => ({ success: true }),
  });
  await __aiDisclosureLedgerTestUtils.flushPendingGitHubLedgerQueueSafe(
    async () => 'token',
    'test-success'
  );
  queue = __aiDisclosureLedgerTestUtils.readPendingLedgerQueue();
  assert.equal(queue.length, 0);
}

run()
  .then(() => {
    console.log('PASS: ai-disclosure-ledger-queue-0295');
  })
  .catch((error) => {
    console.error('FAIL: ai-disclosure-ledger-queue-0295');
    console.error(error);
    process.exit(1);
  });
