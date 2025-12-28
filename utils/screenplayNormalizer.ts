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
    
    // Strip leading/trailing spaces and collapse multiple spaces
    const trimmed = line.trim().replace(/\s{2,}/g, ' ');
    
    // Handle wrapped lines
    // A line is likely wrapped if:
    // 1. Current line doesn't end with punctuation (., !, ?, :, ;)
    // 2. Next line exists and doesn't start with uppercase (not a new element)
    // 3. Current line has content (not empty)
    const isWrapped = trimmed.length > 0 
      && nextLine 
      && !/[.!?:;]$/.test(trimmed) // Doesn't end with sentence punctuation
      && !/^[A-Z]/.test(nextLine.trim()) // Next line doesn't start with uppercase (not scene heading/character)
      && !/^(INT\.|EXT\.|INT\/EXT)/i.test(nextLine.trim()); // Next line is not a scene heading
    
    if (isWrapped) {
      // Join with current line (will be added when we process next line)
      // For now, add current line with a space at the end to indicate continuation
      normalizedLines.push(trimmed + ' ');
    } else {
      // Check if previous line ended with space (was wrapped)
      if (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1].endsWith(' ')) {
        // Join with previous line
        const previous = normalizedLines.pop()!;
        normalizedLines.push((previous + trimmed).trim());
      } else {
        // Normal line - add as-is
        normalizedLines.push(trimmed);
      }
    }
  }
  
  // Rejoin lines, preserving line break structure
  return normalizedLines.join('\n');
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
  
  console.log('[ScreenplayNormalizer] Normalization complete', {
    originalLength: content.length,
    normalizedLength: normalized.length,
    linesOriginal: content.split('\n').length,
    linesNormalized: normalized.split('\n').length
  });
  
  return normalized;
}

