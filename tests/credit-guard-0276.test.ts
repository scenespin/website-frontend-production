/**
 * Feature 0276 (Day 3): shared frontend credit guard contract test.
 * Run:
 *   npx tsx tests/credit-guard-0276.test.ts
 */

import assert from 'assert';
import {
  extractCreditError,
  getCreditErrorDisplayMessage,
  isInsufficientCreditsError
} from '../utils/creditGuard';

let passed = 0;
let failed = 0;

function run(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ❌ ${name}`);
    console.error('     ', (error as Error).message);
  }
}

console.log('\n--- Feature 0276: credit guard contract ---\n');

run('detects canonical 402 payload with required/current', () => {
  const error = {
    response: {
      status: 402,
      data: {
        error: 'INSUFFICIENT_CREDITS',
        message: 'Insufficient credits for this operation.',
        userMessage: 'You need 150 credits but currently have 62. Add credits to continue.',
        required: 150,
        current: 62
      }
    }
  };

  const info = extractCreditError(error);
  assert.strictEqual(info.isInsufficientCredits, true);
  assert.strictEqual(info.required, 150);
  assert.strictEqual(info.current, 62);
  assert.strictEqual(
    getCreditErrorDisplayMessage(info),
    'You need 150 credits but currently have 62. Add credits to continue.'
  );
});

run('falls back to generic message when only 402 is available', () => {
  const error = {
    response: { status: 402, data: { message: 'Payment required' } }
  };

  const info = extractCreditError(error);
  assert.strictEqual(info.isInsufficientCredits, true);
  assert.strictEqual(
    getCreditErrorDisplayMessage(info),
    'Payment required'
  );
});

run('detects insufficient credits from legacy text payloads', () => {
  const error = new Error('INSUFFICIENT_CREDITS');
  assert.strictEqual(isInsufficientCreditsError(error), true);
});

run('does not misclassify unrelated errors', () => {
  const error = new Error('Network timeout');
  assert.strictEqual(isInsufficientCreditsError(error), false);
});

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
