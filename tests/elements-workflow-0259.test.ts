/**
 * Feature 0259: Elements to Video — unit tests for validation and payload building.
 * Run: npx tsx tests/elements-workflow-0259.test.ts
 * Or: npm run test:elements-0259
 */

import assert from 'assert';
import {
  validateElementsForShots,
  buildSelectedElementsForVideoPayload,
  type ElementsValidationContext,
  type ShotForValidation
} from '../lib/elementsWorkflowUtils';

let passed = 0;
let failed = 0;

function run(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ❌ ${name}`);
    console.error('     ', (e as Error).message);
  }
}

console.log('\n--- Feature 0259: Elements workflow validation ---\n');

// --- validateElementsForShots ---
console.log('validateElementsForShots:');

run('returns no errors when no action/establishing shots', () => {
  const shots: ShotForValidation[] = [{ slot: 1, type: 'dialogue' }];
  const errors = validateElementsForShots(shots, {});
  assert.deepStrictEqual(errors, []);
});

run('returns no errors when Elements is off for action shot', () => {
  const shots: ShotForValidation[] = [{ slot: 1, type: 'action' }];
  const ctx: ElementsValidationContext = {
    useElementsForVideo: { 1: false },
    selectedElementsForVideo: { 1: [] },
    videoPromptOverrides: {}
  };
  const errors = validateElementsForShots(shots, ctx);
  assert.deepStrictEqual(errors, []);
});

run('returns error when Elements is on but no refs selected', () => {
  const shots: ShotForValidation[] = [{ slot: 2, type: 'action' }];
  const ctx: ElementsValidationContext = {
    useElementsForVideo: { 2: true },
    selectedElementsForVideo: { 2: [] },
    videoPromptOverrides: {}
  };
  const errors = validateElementsForShots(shots, ctx);
  assert.strictEqual(errors.length, 1);
  assert.ok(errors[0].includes('Shot 2'));
  assert.ok(errors[0].includes('Select at least one reference'));
});

run('returns error when Elements is on but prompt empty', () => {
  const shots: ShotForValidation[] = [{ slot: 3, type: 'establishing' }];
  const ctx: ElementsValidationContext = {
    useElementsForVideo: { 3: true },
    selectedElementsForVideo: { 3: ['character:abc', 'location'] },
    videoPromptOverrides: { 3: '' }
  };
  const errors = validateElementsForShots(shots, ctx);
  assert.strictEqual(errors.length, 1);
  assert.ok(errors[0].includes('Shot 3'));
  assert.ok(errors[0].includes('video prompt'));
});

run('returns no errors when Elements on, refs and prompt set', () => {
  const shots: ShotForValidation[] = [{ slot: 4, type: 'action' }];
  const ctx: ElementsValidationContext = {
    useElementsForVideo: { 4: true },
    selectedElementsForVideo: { 4: ['character:xyz'] },
    videoPromptOverrides: { 4: 'Using the provided images for Jane, create a medium shot.' }
  };
  const errors = validateElementsForShots(shots, ctx);
  assert.deepStrictEqual(errors, []);
});

run('returns two errors when two shots have Elements on but invalid', () => {
  const shots: ShotForValidation[] = [
    { slot: 1, type: 'action' },
    { slot: 2, type: 'action' }
  ];
  const ctx: ElementsValidationContext = {
    useElementsForVideo: { 1: true, 2: true },
    selectedElementsForVideo: { 1: [], 2: ['location'] },
    videoPromptOverrides: { 1: '', 2: '' }
  };
  const errors = validateElementsForShots(shots, ctx);
  assert.strictEqual(errors.length, 2);
  assert.ok(errors.some((e) => e.includes('Shot 1') && e.includes('reference')));
  assert.ok(errors.some((e) => e.includes('Shot 2') && e.includes('video prompt')));
});

// --- buildSelectedElementsForVideoPayload ---
console.log('\nbuildSelectedElementsForVideoPayload:');

run('returns undefined when selectedElementsForVideo is undefined', () => {
  const out = buildSelectedElementsForVideoPayload(undefined, { 1: true });
  assert.strictEqual(out, undefined);
});

run('returns undefined when selectedElementsForVideo is empty object', () => {
  const out = buildSelectedElementsForVideoPayload({}, { 1: true });
  assert.strictEqual(out, undefined);
});

run('excludes shot when useElementsForVideo is false', () => {
  const out = buildSelectedElementsForVideoPayload(
    { 1: ['character:a'] },
    { 1: false }
  );
  assert.strictEqual(out, undefined);
});

run('excludes shot when refs array is empty', () => {
  const out = buildSelectedElementsForVideoPayload(
    { 1: [] },
    { 1: true }
  );
  assert.strictEqual(out, undefined);
});

run('includes only shots where Elements on and refs non-empty', () => {
  const out = buildSelectedElementsForVideoPayload(
    { 1: ['character:a'], 2: [], 3: ['location'] },
    { 1: true, 2: true, 3: false }
  );
  assert.deepStrictEqual(out, { 1: ['character:a'] });
});

run('returns numeric keys and preserves ref arrays', () => {
  const out = buildSelectedElementsForVideoPayload(
    { 5: ['character:x', 'prop:p1'] },
    { 5: true }
  );
  assert.deepStrictEqual(out, { 5: ['character:x', 'prop:p1'] });
  assert.strictEqual(typeof Object.keys(out!)[0], 'string');
  assert.strictEqual(Object.keys(out!)[0], '5');
});

console.log('\n--- Done ---');
console.log(`Passed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
