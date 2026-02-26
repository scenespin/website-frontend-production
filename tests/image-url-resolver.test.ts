/**
 * URL resolver guardrail test:
 * ensure proxy/relative image URLs are treated as valid.
 *
 * Run:
 *   npx tsx tests/image-url-resolver.test.ts
 */

import assert from 'assert';
import { isValidImageUrl } from '../components/production/utils/imageUrlResolver';

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

console.log('\n--- Image URL resolver guardrail ---\n');

run('accepts proxy URL paths', () => {
  assert.strictEqual(
    isValidImageUrl('/api/media/file?key=media-files%2Fabc123.png'),
    true
  );
});

run('accepts absolute https URLs', () => {
  assert.strictEqual(
    isValidImageUrl('https://example.com/image.png'),
    true
  );
});

run('accepts data URLs', () => {
  assert.strictEqual(
    isValidImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'),
    true
  );
});

run('rejects raw S3 keys (non-URL strings)', () => {
  assert.strictEqual(
    isValidImageUrl('media-files/user-1/project-1/image.png'),
    false
  );
});

run('rejects empty values', () => {
  assert.strictEqual(isValidImageUrl(''), false);
  assert.strictEqual(isValidImageUrl(undefined), false);
});

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
