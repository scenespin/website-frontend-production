import assert from 'node:assert/strict';
import { parseContentForImport } from '../utils/fountainAutoImport';
import {
  noisySotlExpectedExcludedCharacters,
  noisySotlExpectedIncludedCharacters,
  noisySotlSample
} from './fixtures/import-parser/noisy-sotl-sample';

function sorted(values: Iterable<string>): string[] {
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

function run(): void {
  // Case 1: Baseline clean Fountain dialogue extraction.
  const cleanFountain = `
INT. FBI TRAINING FACILITY - DAY

CLARICE
Can I speak with Dr. Lecter?

CRAWFORD
Yes. Be careful.
`.trim();

  const cleanResult = parseContentForImport(cleanFountain);
  assert.deepEqual(sorted(cleanResult.characters), ['CLARICE', 'CRAWFORD']);

  // Case 2: Grouped names should split to individuals when valid.
  const groupedNames = `
INT. HALLWAY - NIGHT

CLARICE AND CRAWFORD
We should move.
`.trim();

  const groupedResult = parseContentForImport(groupedNames);
  assert.ok(groupedResult.characters.has('CLARICE'));
  assert.ok(groupedResult.characters.has('CRAWFORD'));
  assert.equal(groupedResult.characters.has('CLARICE AND CRAWFORD'), false);

  // Case 3: Possessive/camera labels should not become characters.
  const cameraNoise = `
INT. CELL BLOCK - NIGHT

CLARICE'S POV
The corridor stretches ahead.

LOW ANGLE ON PEMBRY
He checks the lock.

FAVORING CHILTON
He watches closely.
`.trim();

  const cameraResult = parseContentForImport(cameraNoise);
  assert.equal(cameraResult.characters.has("CLARICE'S POV"), false);
  assert.equal(cameraResult.characters.has('LOW ANGLE ON PEMBRY'), false);
  assert.equal(cameraResult.characters.has('FAVORING CHILTON'), false);

  // Case 4: Object/action labels from noisy imports should be filtered.
  const objectNoise = `
INT. BASEMENT - NIGHT

A CLOSED DOOR
The lock rattles.

THE CAR
It speeds away.
`.trim();

  const objectResult = parseContentForImport(objectNoise);
  assert.equal(objectResult.characters.has('A CLOSED DOOR'), false);
  assert.equal(objectResult.characters.has('THE CAR'), false);

  // Case 5: Title prefixes should normalize, preserving core character identity.
  const titledCharacter = `
INT. OFFICE - DAY

SPECIAL AGENT JACK CRAWFORD
Bring me the file.
`.trim();

  const titledResult = parseContentForImport(titledCharacter);
  assert.ok(titledResult.characters.has('JACK CRAWFORD'));
  assert.equal(titledResult.characters.has('SPECIAL AGENT JACK CRAWFORD'), false);

  // Case 6: Bug-driven noisy PDF-like fixture (SOTL sample).
  const noisyResult = parseContentForImport(noisySotlSample);
  for (const expectedName of noisySotlExpectedIncludedCharacters) {
    assert.ok(
      noisyResult.characters.has(expectedName),
      `Expected noisy sample to include "${expectedName}"`
    );
  }
  for (const rejectedName of noisySotlExpectedExcludedCharacters) {
    assert.equal(
      noisyResult.characters.has(rejectedName),
      false,
      `Expected noisy sample to exclude "${rejectedName}"`
    );
  }

  console.log('✅ import-parser-regression.test passed');
}

try {
  run();
} catch (error) {
  console.error('❌ import-parser-regression.test failed:', error);
  process.exit(1);
}
