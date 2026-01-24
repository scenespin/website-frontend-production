/**
 * Screenplay Text Normalizer
 * Feature 0177: Normalize badly formatted screenplay imports
 * 
 * Handles:
 * - Character encoding issues ( characters)
 * - Whitespace normalization (wrapped lines, inconsistent spacing)
 * - Preserves Fountain format structure (line breaks)
 */

/**
 * Detect if text has character encoding issues
 */
export function detectEncodingIssues(text: string): boolean {
  // Check for common encoding corruption patterns
  const encodingPatterns = [
    /\uFFFD/g, // Replacement character
    /â€™/g,    // UTF-8 sequence for apostrophe
    /â€œ/g,    // UTF-8 sequence for opening quote
    /â€\u009D/g, // UTF-8 sequence for closing quote
    /â€"/g,    // UTF-8 sequence for em dash
  ];
  
  return encodingPatterns.some(pattern => pattern.test(text));
}

/**
 * Fix character encoding issues in text
 * Replaces common UTF-8 corruption patterns with correct characters
 */
export function fixCharacterEncoding(text: string): string {
  let fixed = text;
  
  // Fix known UTF-8 sequences first (most reliable)
  const knownSequences: Array<[RegExp, string]> = [
    [/â€™/g, "'"],      // Apostrophe
    [/â€œ/g, '"'],     // Opening quote
    [/â€\u009D/g, '"'], // Closing quote (with replacement char)
    [/â€"/g, '—'],     // Em dash
    [/â€"/g, '–'],     // En dash
    [/â€¦/g, '…'],     // Ellipsis
  ];
  
  for (const [pattern, replacement] of knownSequences) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  // Handle replacement character (U+FFFD) - most common issue
  // Use heuristics to determine if it's an apostrophe or quote
  fixed = fixed.replace(/\uFFFD/g, (match, offset, string) => {
    const before = string[offset - 1] || '';
    const after = string[offset + 1] || '';
    
    // If between letters/numbers, likely apostrophe
    if (/[a-zA-Z0-9]/.test(before) && /[a-zA-Z0-9]/.test(after)) {
      return "'";
    }
    
    // If at word boundary (space before/after), likely quote
    if (/\s/.test(before) || /\s/.test(after)) {
      return '"';
    }
    
    // Default to apostrophe (more common in screenplays)
    return "'";
  });
  
  return fixed;
}

/**
 * Add basic Fountain spacing for PDF imports
 * This is a LIGHTWEIGHT version that only adds necessary blank lines
 * Does NOT merge, join, or modify content - just adds spacing
 * 
 * Rules:
 * 1. One blank line after scene headings
 * 2. One blank line before character names (dialogue blocks)  
 * 3. One blank line after dialogue blocks (before action/scenes)
 */
export function addBasicFountainSpacing(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let inDialogueBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prevLine = output.length > 0 ? output[output.length - 1].trim() : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // Skip if already blank
    if (trimmed === '') {
      output.push(line);
      inDialogueBlock = false; // Blank line ends dialogue block
      continue;
    }
    
    // Detect element types
    const isSceneHeading = /^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(trimmed);
    const isTransition = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|FADE TO BLACK):?$/i.test(trimmed);
    const isParenthetical = trimmed.startsWith('(') && trimmed.endsWith(')');
    const isCharacterName = !isSceneHeading 
      && !isTransition
      && trimmed === trimmed.toUpperCase() 
      && trimmed.length >= 2 
      && trimmed.length <= 50;
    
    // Dialogue detection: character name starts a block, continues until blank line or new block
    if (isCharacterName) {
      // Starting a dialogue block
      if (prevLine !== '' && !inDialogueBlock) {
        // Need blank line before character name
        output.push('');
      }
      inDialogueBlock = true;
      output.push(line);
      continue;
    }
    
    if (isParenthetical && inDialogueBlock) {
      // Parenthetical within dialogue block
      output.push(line);
      continue;
    }
    
    // If we're in dialogue block and this isn't a special element, it's dialogue
    if (inDialogueBlock && !isSceneHeading && !isTransition && !isCharacterName) {
      output.push(line);
      
      // Check if dialogue block ends by looking at the actual next line
      const actualNextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      const nextIsSceneHeading = actualNextLine && /^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(actualNextLine);
      const nextIsCharacterName = actualNextLine 
        && actualNextLine === actualNextLine.toUpperCase() 
        && actualNextLine.length >= 2 
        && actualNextLine.length <= 50
        && !/^(INT\.\/EXT\.|I\.\/E\.|INT\.?\/EXT|I\/E|EST|INT|EXT)[\.\s]/i.test(actualNextLine);
      const nextIsAction = actualNextLine !== '' 
        && !actualNextLine.startsWith('(') 
        && actualNextLine !== actualNextLine.toUpperCase()
        && /^[A-Z]/.test(actualNextLine) // Starts with capital
        && /[a-z]/.test(actualNextLine); // Has lowercase (mixed case = action)
      
      // Dialogue ends when next line is blank, scene heading, character name, or action
      if (actualNextLine === '' || nextIsSceneHeading || nextIsCharacterName || nextIsAction) {
        // End dialogue block with blank line (unless next is already blank)
        if (actualNextLine !== '') {
          output.push('');
        }
        inDialogueBlock = false;
      }
      continue;
    }
    
    // Scene heading
    if (isSceneHeading) {
      inDialogueBlock = false;
      output.push(line);
      // Add blank line after scene heading if next isn't blank
      if (nextLine !== '') {
        output.push('');
      }
      continue;
    }
    
    // Regular action line
    inDialogueBlock = false;
    output.push(line);
  }
  
  return output.join('\n');
}

/**
 * Normalize whitespace while preserving line break structure
 * - Strips leading/trailing spaces from each line
 * - Collapses multiple spaces to single space
 * - Preserves single vs double line breaks (Fountain structure)
 * - Handles wrapped lines (joins lines that are clearly wrapped)
 */
export function normalizeWhitespace(text: string): string {
  // Normalize line endings first (Windows/Mac/Unix compatibility)
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const lines = normalized.split('\n');
  const normalizedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Preserve blank lines (critical for Fountain format spacing)
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      normalizedLines.push(''); // Preserve blank line
      continue;
    }
    
    // Strip leading/trailing spaces and collapse multiple spaces
    const normalizedTrimmed = trimmed.replace(/\s{2,}/g, ' ');
    
    // Handle wrapped lines
    // A line is likely wrapped if:
    // 1. Current line doesn't end with punctuation (., !, ?, :, ;)
    // 2. Next line exists and doesn't start with uppercase (not a new element)
    // 3. Current line has content (not empty)
    // 4. Current line is NOT a character name (all caps, short) followed by parenthetical
    // 5. Next line is NOT a parenthetical (starts with "(" and ends with ")")
    const nextLineTrimmed = nextLine ? nextLine.trim() : '';
    const isCharacterName = /^[A-Z][A-Z\s\.']+$/.test(normalizedTrimmed) && normalizedTrimmed.split(/\s+/).length <= 4;
    const isParenthetical = nextLineTrimmed.startsWith('(') && nextLineTrimmed.endsWith(')');
    
    const isWrapped = normalizedTrimmed.length > 0 
      && nextLine 
      && nextLineTrimmed.length > 0 // Next line has content
      && !/[.!?:;]$/.test(normalizedTrimmed) // Doesn't end with sentence punctuation
      && !/^[A-Z]/.test(nextLineTrimmed) // Next line doesn't start with uppercase (not scene heading/character)
      && !/^(INT\.|EXT\.|INT\/EXT)/i.test(nextLineTrimmed) // Next line is not a scene heading
      && !(isCharacterName && isParenthetical); // Don't join character names with parentheticals
    
    if (isWrapped) {
      // Join with current line (will be added when we process next line)
      // For now, add current line with a space at the end to indicate continuation
      normalizedLines.push(normalizedTrimmed + ' ');
    } else {
      // Check if previous line ended with space (was wrapped)
      if (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1].endsWith(' ')) {
        // Join with previous line
        const previous = normalizedLines.pop()!;
        normalizedLines.push((previous + normalizedTrimmed).trim());
      } else {
        // Normal line - add as-is
        normalizedLines.push(normalizedTrimmed);
      }
    }
  }
  
  // Rejoin lines, preserving line break structure
  return normalizedLines.join('\n');
}

/**
 * Enforce proper Fountain format spacing
 * Adds blank lines between different element types according to Fountain spec
 * 
 * Fountain spacing rules:
 * - Scene heading: blank line AFTER (before action)
 * - Character name: blank line BEFORE (if previous was action), NO blank line AFTER
 * - Dialogue: NO blank line before (follows character/parenthetical), blank line AFTER (before action/character/scene)
 * - Parenthetical: NO blank line before/after (flows directly)
 * - Action: blank line BEFORE character (if next is character)
 */
export function enforceFountainSpacing(text: string): string {
  const lines = text.split('\n');
  const outputLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Preserve existing blank lines
    if (!trimmed) {
      outputLines.push('');
      continue;
    }
    
    // Get previous non-blank line from output (already processed)
    let prevNonBlank = '';
    for (let j = outputLines.length - 1; j >= 0; j--) {
      if (outputLines[j].trim()) {
        prevNonBlank = outputLines[j].trim();
        break;
      }
    }
    
    // Get next non-blank line from input (not yet processed)
    let nextNonBlank = '';
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim()) {
        nextNonBlank = lines[j].trim();
        break;
      }
    }
    
    // Detect current element type
    const isSceneHeading = /^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(trimmed);
    const isTransition = trimmed.endsWith('TO:') && trimmed === trimmed.toUpperCase();
    const isParenthetical = trimmed.startsWith('(') && trimmed.endsWith(')');
    
    // Character name: all caps, 1-4 words, not scene heading, has dialogue following
    const isCharacterName = trimmed === trimmed.toUpperCase() 
      && /^[A-Z][A-Z\s\.']+(\s*\([^\)]*\))?$/.test(trimmed)
      && trimmed.split(/\s+/).length <= 4
      && !isSceneHeading
      && !isTransition
      && nextNonBlank && nextNonBlank.length > 0; // Has content following (dialogue)
    
    // Action: anything that's not scene heading, character, transition, or parenthetical
    const isAction = !isSceneHeading && !isCharacterName && !isTransition && !isParenthetical;
    
    // Detect previous element type
    const prevIsSceneHeading = prevNonBlank && /^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(prevNonBlank);
    const prevIsTransition = prevNonBlank && prevNonBlank.endsWith('TO:') && prevNonBlank === prevNonBlank.toUpperCase();
    const prevIsParenthetical = prevNonBlank && prevNonBlank.startsWith('(') && prevNonBlank.endsWith(')');
    const prevIsCharacterName = prevNonBlank && prevNonBlank === prevNonBlank.toUpperCase() 
      && /^[A-Z][A-Z\s\.']+(\s*\([^\)]*\))?$/.test(prevNonBlank)
      && prevNonBlank.split(/\s+/).length <= 4
      && !prevIsSceneHeading
      && !prevIsTransition;
    const prevIsDialogue = prevNonBlank && !prevIsSceneHeading && !prevIsCharacterName && !prevIsTransition && !prevIsParenthetical;
    const prevIsAction = prevNonBlank && !prevIsSceneHeading && !prevIsCharacterName && !prevIsTransition && !prevIsParenthetical;
    
    // Check if we need to add blank lines BEFORE current line
    let needsBlankBefore = false;
    let needsDoubleBlank = false; // For scene separation
    
    // Rule 1: DOUBLE blank line BEFORE scene headings (except first one, and not if previous was also scene heading)
    // Scenes should be separated by two blank lines in Fountain format
    // Check how many blank lines we currently have before this scene heading
    if (isSceneHeading && prevNonBlank && !prevIsSceneHeading) {
      // Count existing blank lines before this scene heading
      let blankLineCount = 0;
      for (let j = outputLines.length - 1; j >= 0; j--) {
        if (outputLines[j].trim() === '') {
          blankLineCount++;
        } else {
          break;
        }
      }
      
      // We need 2 blank lines total before scene headings
      // If we have 0, add 2. If we have 1, add 1 more. If we have 2+, we're good.
      if (blankLineCount === 0) {
        needsDoubleBlank = true; // Add two blank lines
      } else if (blankLineCount === 1) {
        needsBlankBefore = true; // Add one more to make it two
      }
      // If blankLineCount >= 2, we're already good
    }
    
    // Rule 2: Blank line BEFORE character names (if previous was action or scene heading)
    if (isCharacterName && (prevIsAction || prevIsSceneHeading)) {
      needsBlankBefore = true;
    }
    
    // Rule 3: Blank line AFTER dialogue (before action/character)
    // If previous was dialogue and current is action/character, add blank
    // NOTE: If current is scene heading, we handle it in Rule 1 (double blank), so skip here
    if (prevIsDialogue && (isAction || isCharacterName) && !isSceneHeading) {
      needsBlankBefore = true;
    }
    
    // Rule 4: Blank line AFTER scene heading (before action)
    // If previous was scene heading and current is action, add blank
    if (prevIsSceneHeading && isAction) {
      needsBlankBefore = true;
    }
    
    // Rule 5: Blank line AFTER transitions (before scene heading)
    if (prevIsTransition && isSceneHeading) {
      needsBlankBefore = true;
    }
    
    // Add blank line(s) if needed
    if (needsDoubleBlank) {
      // Add two blank lines for scene separation
      outputLines.push('');
      outputLines.push('');
    } else if (needsBlankBefore) {
      // Check if we already have a blank line (don't duplicate)
      const lastLine = outputLines.length > 0 ? outputLines[outputLines.length - 1] : '';
      if (lastLine.trim() !== '') {
        // Add single blank line for other spacing
        outputLines.push('');
      }
    }
    
    // Add the current line
    outputLines.push(line);
    
    // Rule 6: REMOVED - Do not add blank line AFTER scene heading
    // Fountain format should preserve exact spacing as written
    // Blank lines after scene headings should only be added by the writer, not automatically
  }
  
  // Normalize excessive blank lines (preserve double blank lines for scene separation)
  // In Fountain format: \n\n\n = 2 blank lines (newline, blank, newline, blank, newline)
  // We want to preserve exactly 2 blank lines between scenes, but remove excessive spacing
  let result = outputLines.join('\n');
  
  // Replace 4+ consecutive newlines with exactly 3 newlines (2 blank lines)
  // This preserves scene separation (2 blank lines) while removing excessive spacing
  result = result.replace(/\n{4,}/g, '\n\n\n');
  
  // Don't collapse 3 newlines (which is 2 blank lines) - this is correct for scene separation
  // The pattern \n\n\n means: content\n blank\n blank\n content = 2 blank lines between scenes
  
  return result.trim();
}

/**
 * Main normalization function
 * Applies all normalization steps in correct order
 */
export function normalizeScreenplayText(content: string): string {
  if (!content || content.trim().length === 0) {
    return content;
  }
  
  console.log('[ScreenplayNormalizer] Normalizing screenplay text...', {
    originalLength: content.length,
    hasEncodingIssues: detectEncodingIssues(content)
  });
  
  // Step 1: Fix character encoding
  let normalized = fixCharacterEncoding(content);
  
  // Step 2: Normalize whitespace (preserves line breaks)
  normalized = normalizeWhitespace(normalized);
  
  // Step 3: Enforce proper Fountain spacing (add blank lines between elements)
  normalized = enforceFountainSpacing(normalized);
  
  console.log('[ScreenplayNormalizer] Normalization complete', {
    originalLength: content.length,
    normalizedLength: normalized.length,
    linesOriginal: content.split('\n').length,
    linesNormalized: normalized.split('\n').length
  });
  
  return normalized;
}

/**
 * Clean web-pasted text for Fountain format
 * Feature 0197: Aggressive cleaning for content pasted from websites or imperfect sources
 * 
 * Handles:
 * - HTML tags and encoding issues
 * - Smart quotes and invisible characters
 * - Incorrect blank line spacing (Fountain spec: 2 before scene heading, 1 after)
 * - Title pages, page numbers, formatting artifacts
 * 
 * This is an OPT-IN feature - only use when user explicitly enables web cleaning mode
 */
export function cleanWebPastedText(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }
  
  console.log('[WebPasteCleaner] Cleaning web-pasted text...', {
    originalLength: text.length
  });
  
  let cleaned = text;
  
  // Phase 1: Strip HTML and Encoding Issues
  // Remove HTML tags (conservative - only remove obvious tags)
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Fix smart quotes and special characters
  const quoteReplacements: Array<[RegExp, string]> = [
    [/[""]/g, '"'],      // Smart double quotes
    [/['']/g, "'"],      // Smart single quotes
    [/—/g, '--'],        // Em dash to double dash
    [/–/g, '-'],        // En dash to single dash
    [/…/g, '...'],      // Ellipsis to three dots
  ];
  
  for (const [pattern, replacement] of quoteReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // Remove invisible characters (zero-width spaces, non-breaking spaces, etc.)
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  cleaned = cleaned.replace(/\u00A0/g, ' '); // Non-breaking space to regular space
  
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Phase 2: Fix Blank Line Spacing (Primary Issue)
  // Fountain spec: 2 blank lines BEFORE scene heading, 1 blank line AFTER
  const lines = cleaned.split('\n');
  const fixedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect scene heading
    const isSceneHeading = /^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(trimmed);
    
    if (isSceneHeading) {
      // Count blank lines BEFORE this scene heading
      let blankLinesBefore = 0;
      for (let j = fixedLines.length - 1; j >= 0; j--) {
        if (fixedLines[j].trim() === '') {
          blankLinesBefore++;
        } else {
          break;
        }
      }
      
      // Fix spacing BEFORE scene heading: need exactly 2 blank lines
      // (unless it's the first scene heading, then 0 is fine)
      if (blankLinesBefore > 2) {
        // Remove excess blank lines, keep exactly 2
        while (blankLinesBefore > 2) {
          fixedLines.pop();
          blankLinesBefore--;
        }
      } else if (blankLinesBefore === 0 && fixedLines.length > 0) {
        // Need to add 2 blank lines (scene separation)
        fixedLines.push('');
        fixedLines.push('');
      } else if (blankLinesBefore === 1) {
        // Need one more to make it 2
        fixedLines.push('');
      }
      // If blankLinesBefore === 2, we're good
      
      // Add the scene heading
      fixedLines.push(line);
      
      // Fix spacing AFTER scene heading: need exactly 1 blank line
      // Check next non-blank line
      let nextNonBlank = '';
      let nextIndex = i + 1;
      while (nextIndex < lines.length && !nextNonBlank) {
        if (lines[nextIndex].trim()) {
          nextNonBlank = lines[nextIndex].trim();
          break;
        }
        nextIndex++;
      }
      
      // Count blank lines between scene heading and next content
      let blankLinesAfter = 0;
      for (let j = i + 1; j < nextIndex && j < lines.length; j++) {
        if (lines[j].trim() === '') {
          blankLinesAfter++;
        }
      }
      
      // If we have 2+ blank lines after, we'll fix it when we process those lines
      // For now, if next line is blank, we'll add exactly 1 blank line
      if (nextNonBlank && blankLinesAfter === 0) {
        // Need to add 1 blank line after scene heading
        fixedLines.push('');
      } else if (blankLinesAfter > 1) {
        // We have too many - we'll skip the excess when we process them
        // Add exactly 1 blank line
        fixedLines.push('');
        // Skip the excess blank lines
        i += blankLinesAfter - 1; // -1 because we'll increment in the loop
      } else if (blankLinesAfter === 1) {
        // Perfect - we'll add it when we process it
      }
    } else {
      // Not a scene heading - preserve the line
      // But skip if it's an excess blank line after a scene heading
      // (We already handled that case above)
      fixedLines.push(line);
    }
  }
  
  cleaned = fixedLines.join('\n');
  
  // Phase 3: Remove Common Artifacts
  const artifactLines = cleaned.split('\n');
  const cleanedLines: string[] = [];
  
  for (let i = 0; i < artifactLines.length; i++) {
    const line = artifactLines[i];
    const trimmed = line.trim();
    
    // Remove standalone page numbers: lines with only a number (possibly with period)
    if (/^\s*\d+\.?\s*$/.test(trimmed)) {
      // Replace with blank line to preserve spacing
      cleanedLines.push('');
      continue;
    }
    
    // Remove standalone underscores (page break markers)
    if (/^\s*_\s*$/.test(trimmed)) {
      cleanedLines.push('');
      continue;
    }
    
    // Remove lines with only dashes/separators
    if (/^\s*[-=]{3,}\s*$/.test(trimmed)) {
      cleanedLines.push('');
      continue;
    }
    
    // Keep the line
    cleanedLines.push(line);
  }
  
  cleaned = cleanedLines.join('\n');
  
  // Phase 4: Remove Title Page (if script start is detected)
  // Find first "FADE IN:" or scene heading
  const fadeInIndex = cleaned.toUpperCase().indexOf('FADE IN:');
  const firstSceneHeadingMatch = cleaned.match(/^(.*?)((?:^|\n)(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s])/im);
  
  let scriptStartIndex = 0;
  if (fadeInIndex !== -1) {
    scriptStartIndex = fadeInIndex;
  } else if (firstSceneHeadingMatch && firstSceneHeadingMatch.index !== undefined) {
    scriptStartIndex = firstSceneHeadingMatch.index;
  }
  
  // Only remove title page if script start is found and it's not too early (within first 50 lines)
  if (scriptStartIndex > 0) {
    const linesBeforeStart = cleaned.substring(0, scriptStartIndex).split('\n').length;
    if (linesBeforeStart > 10) {
      // Remove everything before script start
      cleaned = cleaned.substring(scriptStartIndex);
    }
  }
  
  // Phase 5: Normalize Whitespace
  // Collapse excessive blank lines (3+ to 2, preserving scene separation)
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n'); // 4+ newlines = 3+ blank lines, reduce to 2 blank lines
  
  // Trim trailing whitespace from lines
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Remove leading/trailing blank lines
  cleaned = cleaned.trim();
  
  console.log('[WebPasteCleaner] Cleaning complete', {
    originalLength: text.length,
    cleanedLength: cleaned.length,
    linesOriginal: text.split('\n').length,
    linesCleaned: cleaned.split('\n').length
  });
  
  return cleaned;
}
