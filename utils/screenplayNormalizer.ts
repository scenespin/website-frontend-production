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
    
    // Get previous non-blank line
    let prevNonBlank = '';
    let prevNonBlankIndex = -1;
    for (let j = outputLines.length - 1; j >= 0; j--) {
      if (outputLines[j].trim()) {
        prevNonBlank = outputLines[j].trim();
        prevNonBlankIndex = j;
        break;
      }
    }
    
    // Get next non-blank line
    let nextNonBlank = '';
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim()) {
        nextNonBlank = lines[j].trim();
        break;
      }
    }
    
    // Detect element types
    const isSceneHeading = /^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(trimmed);
    const isCharacterName = trimmed === trimmed.toUpperCase() 
      && /^[A-Z][A-Z\s\.']+(\s*\([^\)]*\))?$/.test(trimmed)
      && trimmed.split(/\s+/).length <= 4
      && !isSceneHeading
      && nextNonBlank && nextNonBlank.length > 0; // Has content following (dialogue)
    const isTransition = trimmed.endsWith('TO:') && trimmed === trimmed.toUpperCase();
    const isParenthetical = trimmed.startsWith('(') && trimmed.endsWith(')');
    
    // Detect previous element type
    const prevIsSceneHeading = prevNonBlank && /^(INT|EXT|INT\/EXT|INT\.\/EXT|EST|I\/E)[\.\s]/i.test(prevNonBlank);
    const prevIsCharacterName = prevNonBlank && prevNonBlank === prevNonBlank.toUpperCase() 
      && /^[A-Z][A-Z\s\.']+(\s*\([^\)]*\))?$/.test(prevNonBlank)
      && prevNonBlank.split(/\s+/).length <= 4
      && !prevIsSceneHeading;
    const prevIsTransition = prevNonBlank && prevNonBlank.endsWith('TO:') && prevNonBlank === prevNonBlank.toUpperCase();
    const prevIsParenthetical = prevNonBlank && prevNonBlank.startsWith('(') && prevNonBlank.endsWith(')');
    const prevIsDialogue = prevNonBlank && !prevIsSceneHeading && !prevIsCharacterName && !prevIsTransition && !prevIsParenthetical;
    
    // Check if we need to add a blank line before current line
    let needsBlankBefore = false;
    
    // Blank line before scene headings (except first one, and not if previous was also scene heading)
    if (isSceneHeading && prevNonBlank && !prevIsSceneHeading) {
      needsBlankBefore = true;
    }
    
    // Blank line before character names (if previous was not character name, dialogue, or parenthetical)
    if (isCharacterName && prevNonBlank && !prevIsCharacterName && !prevIsDialogue && !prevIsParenthetical) {
      needsBlankBefore = true;
    }
    
    // Blank line after dialogue (before action/scene/character)
    if (prevIsDialogue && !isDialogue && !isParenthetical && !isCharacterName && !isSceneHeading) {
      needsBlankBefore = true;
    }
    
    // Blank line after transitions (before scene heading)
    if (prevIsTransition && isSceneHeading) {
      needsBlankBefore = true;
    }
    
    // Add blank line if needed and not already blank
    if (needsBlankBefore && outputLines.length > 0 && outputLines[outputLines.length - 1].trim()) {
      outputLines.push('');
    }
    
    // Add the current line
    outputLines.push(line);
  }
  
  // Normalize multiple blank lines to max 2
  return outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

