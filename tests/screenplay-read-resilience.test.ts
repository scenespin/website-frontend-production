import assert from 'node:assert/strict';
import { getScreenplay, __screenplayReadInternals } from '../utils/screenplayStorage';

type MockFetch = typeof globalThis.fetch;

function createJsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

async function run(): Promise<void> {
  const originalFetch = globalThis.fetch;

  try {
    const screenplayId = 'screenplay_resilience_test';
    const noopGetToken = async () => null as any;

    // Test 1: In-flight dedupe prevents duplicate concurrent reads.
    __screenplayReadInternals.resetAll();
    let inFlightCalls = 0;
    globalThis.fetch = (async () => {
      inFlightCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return createJsonResponse({ success: true, data: { screenplay_id: screenplayId, content: 'ok' } }, 200);
    }) as MockFetch;

    const [a, b] = await Promise.all([
      getScreenplay(screenplayId, noopGetToken as any),
      getScreenplay(screenplayId, noopGetToken as any)
    ]);
    assert.equal(inFlightCalls, 1, 'expected only one network call while request is in-flight');
    assert.equal(a?.screenplay_id, screenplayId);
    assert.equal(b?.screenplay_id, screenplayId);

    // Test 2: Repeated 5xx opens the local circuit and suppresses subsequent calls.
    __screenplayReadInternals.resetAll();
    let failingCalls = 0;
    globalThis.fetch = (async () => {
      failingCalls += 1;
      return createJsonResponse({ error: 'boom' }, 500);
    }) as MockFetch;

    for (let i = 0; i < 3; i += 1) {
      let failed = false;
      try {
        await getScreenplay(screenplayId, noopGetToken as any);
      } catch {
        failed = true;
      }
      assert.equal(failed, true, 'expected failing screenplay read');
    }

    const stateAfterFailures = __screenplayReadInternals.getState(screenplayId);
    assert.ok(stateAfterFailures, 'expected circuit state to exist after repeated failures');
    assert.ok(
      (stateAfterFailures?.openedUntil || 0) > Date.now(),
      'expected circuit to be open after repeated failures'
    );

    const callsBeforeSuppression = failingCalls;
    let suppressed = false;
    try {
      await getScreenplay(screenplayId, noopGetToken as any);
    } catch (error: any) {
      suppressed = !!error?.message?.includes('temporarily unavailable');
    }
    assert.equal(suppressed, true, 'expected request to be suppressed by open circuit');
    assert.equal(
      failingCalls,
      callsBeforeSuppression,
      'expected no additional network call while circuit is open'
    );

    console.log('✅ screenplay-read-resilience.test passed');
  } finally {
    globalThis.fetch = originalFetch;
    __screenplayReadInternals.resetAll();
  }
}

run().catch((error) => {
  console.error('❌ screenplay-read-resilience.test failed:', error);
  process.exit(1);
});

