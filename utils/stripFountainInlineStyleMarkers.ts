type InlineStyleRun = {
  text: string;
  italic: boolean;
  bold: boolean;
  underline: boolean;
  strike: boolean;
};

function parseFountainInlineRuns(text: string): InlineStyleRun[] {
  const runs: InlineStyleRun[] = [];
  let buffer = '';
  let italic = false;
  let bold = false;
  let underline = false;
  let strike = false;

  const hasClosingToken = (token: string, fromIndex: number): boolean =>
    text.indexOf(token, fromIndex) !== -1;

  const pushBuffer = () => {
    if (!buffer) return;
    runs.push({ text: buffer, italic, bold, underline, strike });
    buffer = '';
  };

  for (let i = 0; i < text.length; i++) {
    if (text.startsWith('***', i) && (bold && italic ? true : hasClosingToken('***', i + 3))) {
      pushBuffer();
      bold = !bold;
      italic = !italic;
      i += 2;
      continue;
    }

    if (text.startsWith('**', i) && !text.startsWith('***', i) && (bold ? true : hasClosingToken('**', i + 2))) {
      pushBuffer();
      bold = !bold;
      i += 1;
      continue;
    }

    if (text.startsWith('~~', i) && (strike ? true : hasClosingToken('~~', i + 2))) {
      pushBuffer();
      strike = !strike;
      i += 1;
      continue;
    }

    const ch = text[i];
    if (ch === '*' && (italic ? true : hasClosingToken('*', i + 1))) {
      pushBuffer();
      italic = !italic;
      continue;
    }

    if (ch === '_' && (underline ? true : hasClosingToken('_', i + 1))) {
      pushBuffer();
      underline = !underline;
      continue;
    }

    buffer += ch;
  }

  pushBuffer();

  return runs.length > 0
    ? runs
    : [{ text, italic: false, bold: false, underline: false, strike: false }];
}

export function stripFountainInlineStyleMarkers(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const runs = parseFountainInlineRuns(text);
  return runs.map((run) => run.text).join('');
}

