#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIRS = ['app', 'components', 'config', 'lib'];
const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.md', '.mdx']);

// Legacy launch-ladder literals that should not appear in first-party pricing copy.
const FORBIDDEN_PATTERNS = [/\$29\b/g, /\$99\b/g, /\$149\b/g, /\$399\b/g];

// Explicit exceptions. Keep this list short and documented.
const ALLOWLIST = {
  'app/compare/page.js': 'Competitor benchmark copy (non-Wryda pricing).',
};

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.agents',
  'public',
  'tests',
]);

function walk(dirPath, fileList) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
      continue;
    }
    const ext = path.extname(entry.name);
    if (ALLOWED_EXTENSIONS.has(ext)) {
      fileList.push(fullPath);
    }
  }
}

function checkFile(filePath) {
  const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const findings = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('$')) continue;
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({
          file: relPath,
          line: i + 1,
          text: line.trim(),
        });
        break;
      }
    }
  }
  return findings;
}

function main() {
  const files = [];
  for (const dir of TARGET_DIRS) {
    walk(path.join(ROOT, dir), files);
  }

  const allFindings = files.flatMap(checkFile);
  const blocked = allFindings.filter((f) => !ALLOWLIST[f.file]);
  const allowed = allFindings.filter((f) => ALLOWLIST[f.file]);

  if (allowed.length > 0) {
    console.log('Allowed legacy price literals:');
    for (const f of allowed) {
      console.log(`  - ${f.file}:${f.line} (${ALLOWLIST[f.file]})`);
    }
    console.log('');
  }

  if (blocked.length > 0) {
    console.error('Legacy plan price literals detected outside allowlist:');
    for (const f of blocked) {
      console.error(`  - ${f.file}:${f.line} -> ${f.text}`);
    }
    console.error('\nUpdate pricing copy to current launch ladder ($20/$60/$200) or add a justified allowlist entry.');
    process.exit(1);
  }

  console.log('Pricing literal guard passed: no forbidden legacy plan literals found.');
}

main();
