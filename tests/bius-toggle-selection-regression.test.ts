import assert from 'node:assert/strict';
import { mapDisplayPositionToFullContent, stripTagsForDisplay } from '../utils/fountain';

type StyleFlags = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
};

function expandSelectionToStyleWrappers(content: string, start: number, end: number): { start: number; end: number } {
  let expandedStart = start;
  let expandedEnd = end;
  let changed = true;

  const tryExpand = (token: string): boolean => {
    if (expandedStart < token.length || expandedEnd + token.length > content.length) {
      return false;
    }
    const before = content.slice(expandedStart - token.length, expandedStart);
    const after = content.slice(expandedEnd, expandedEnd + token.length);
    if (before === token && after === token) {
      expandedStart -= token.length;
      expandedEnd += token.length;
      return true;
    }
    return false;
  };

  while (changed) {
    changed = false;
    if (tryExpand('***')) { changed = true; continue; }
    if (tryExpand('~~')) { changed = true; continue; }
    if (tryExpand('**')) { changed = true; continue; }
    if (tryExpand('_')) { changed = true; continue; }
    if (tryExpand('*')) { changed = true; continue; }
  }

  return { start: expandedStart, end: expandedEnd };
}

function parseWrappedStyles(input: string): { content: string; flags: StyleFlags } {
  const flags: StyleFlags = { bold: false, italic: false, underline: false, strike: false };
  let content = input;
  let changed = true;

  while (changed) {
    changed = false;

    while (content.startsWith('~~') && content.endsWith('~~') && content.length > 4) {
      content = content.slice(2, -2);
      flags.strike = true;
      changed = true;
    }

    while (content.startsWith('_') && content.endsWith('_') && content.length > 2) {
      content = content.slice(1, -1);
      flags.underline = true;
      changed = true;
    }

    let starChanged = true;
    while (starChanged) {
      starChanged = false;

      if (content.startsWith('***') && content.endsWith('***') && content.length > 6) {
        content = content.slice(3, -3);
        flags.bold = true;
        flags.italic = true;
        changed = true;
        starChanged = true;
        continue;
      }

      if (content.startsWith('**') && content.endsWith('**') && content.length > 4) {
        content = content.slice(2, -2);
        flags.bold = true;
        changed = true;
        starChanged = true;
        continue;
      }

      if (content.startsWith('*') && content.endsWith('*') && content.length > 2) {
        content = content.slice(1, -1);
        flags.italic = true;
        changed = true;
        starChanged = true;
      }
    }
  }

  return { content, flags };
}

function rebuildWithStyles(content: string, flags: StyleFlags): string {
  let wrapped = content;

  if (flags.bold && flags.italic) {
    wrapped = `***${wrapped}***`;
  } else if (flags.bold) {
    wrapped = `**${wrapped}**`;
  } else if (flags.italic) {
    wrapped = `*${wrapped}*`;
  }

  if (flags.underline) {
    wrapped = `_${wrapped}_`;
  }

  if (flags.strike) {
    wrapped = `~~${wrapped}~~`;
  }

  return wrapped;
}

function applyToggle(content: string, displayStart: number, displayEnd: number, marker: '*' | '**' | '_' | '~~'): string {
  const displayContent = stripTagsForDisplay(content);
  const originalStart = mapDisplayPositionToFullContent(displayContent, content, displayStart);
  const originalEnd = mapDisplayPositionToFullContent(displayContent, content, displayEnd);
  const expanded = expandSelectionToStyleWrappers(content, originalStart, originalEnd);

  let selectedText = content.slice(expanded.start, expanded.end);
  const leadingWhitespace = selectedText.match(/^\s*/)?.[0] || '';
  const trailingWhitespace = selectedText.match(/\s*$/)?.[0] || '';
  const core = selectedText.slice(leadingWhitespace.length, selectedText.length - trailingWhitespace.length);

  const targetStyle: keyof StyleFlags =
    marker === '**' ? 'bold' :
    marker === '*' ? 'italic' :
    marker === '_' ? 'underline' :
    'strike';

  const parsed = parseWrappedStyles(core);
  const nextFlags: StyleFlags = { ...parsed.flags, [targetStyle]: !parsed.flags[targetStyle] };
  const rebuilt = leadingWhitespace + rebuildWithStyles(parsed.content, nextFlags) + trailingWhitespace;

  return content.slice(0, expanded.start) + rebuilt + content.slice(expanded.end);
}

function run(): void {
  const base = "Let's start again. From the beginning.";
  const fromStart = base.indexOf('From');
  const fromEnd = fromStart + 'From'.length;

  const bold = applyToggle(base, fromStart, fromEnd, '**');
  assert.equal(bold, "Let's start again. **From** the beginning.");

  const boldItalic = applyToggle(bold, bold.indexOf('From'), bold.indexOf('From') + 4, '*');
  assert.equal(boldItalic, "Let's start again. ***From*** the beginning.");

  const wrapped = 'Not **_*~~everything~~*_**.';
  const innerStart = wrapped.indexOf('everything');
  const innerEnd = innerStart + 'everything'.length;
  const strikeOff = applyToggle(wrapped, innerStart, innerEnd, '~~');
  assert.equal(strikeOff, 'Not _***everything***_.');
  const strikeOn = applyToggle(strikeOff, strikeOff.indexOf('everything'), strikeOff.indexOf('everything') + 'everything'.length, '~~');
  assert.equal(strikeOn, 'Not ~~_***everything***_~~.');

  const boldOnly = 'From **the** beginning';
  const theStart = boldOnly.indexOf('the');
  const theEnd = theStart + 'the'.length;
  const boldRemoved = applyToggle(boldOnly, theStart, theEnd, '**');
  assert.equal(boldRemoved, 'From the beginning');

  console.log('✅ bius-toggle-selection-regression.test passed');
}

try {
  run();
} catch (error) {
  console.error('❌ bius-toggle-selection-regression.test failed:', error);
  process.exit(1);
}
